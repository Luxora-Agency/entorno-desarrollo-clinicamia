const prisma = require('../db/prisma');
const { NotFoundError, BadRequestError, ValidationError } = require('../utils/errors');
const comisionService = require('./miaPassComision.service');
const miaPassNotificationService = require('./miaPassNotification.service');

class MiaPassService {
  // Constantes de política MIA PASS v1.1
  ESTADOS_ACTIVOS = ['ACTIVA', 'PENDIENTE_PAGO', 'PAGADA'];
  /**
   * Planes
   */
  async createPlan(data) {
    return await prisma.miaPassPlan.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        costo: data.costo,
        duracionMeses: data.duracion_meses,
        color: data.color,
        icono: data.icono,
        beneficios: data.beneficios,
        descuentos: data.descuentos,
        itemsConsumibles: data.items_consumibles,
        destacado: data.destacado || false,
        activo: true
      }
    });
  }

  async getPlans(filters = {}) {
    const where = {};
    if (filters.activo !== undefined) {
      where.activo = filters.activo === 'true';
    }

    return await prisma.miaPassPlan.findMany({
      where,
      orderBy: { costo: 'asc' }
    });
  }

  async getPlanById(id) {
    const plan = await prisma.miaPassPlan.findUnique({
      where: { id: parseInt(id) },
      include: {
        cupones: true
      }
    });
    if (!plan) throw new NotFoundError('Plan no encontrado');
    return plan;
  }

  async updatePlan(id, data) {
    const plan = await this.getPlanById(id);
    return await prisma.miaPassPlan.update({
      where: { id: plan.id },
      data
    });
  }

  async togglePlanStatus(id) {
    const plan = await this.getPlanById(id);
    return await prisma.miaPassPlan.update({
      where: { id: plan.id },
      data: { activo: !plan.activo }
    });
  }

  /**
   * Suscripciones
   */
  async createSubscription(data) {
    const { plan_id, paciente_id, metodo_pago, codigo_cupon, vendedor_codigo, canal } = data;

    const plan = await this.getPlanById(plan_id);
    if (!plan.activo) throw new BadRequestError('El plan seleccionado no está activo');

    // Prevenir duplicados: verificar si ya tiene suscripción activa al mismo plan
    const existente = await prisma.miaPassSuscripcion.findFirst({
      where: {
        pacienteId: paciente_id,
        planId: parseInt(plan_id),
        estado: { in: this.ESTADOS_ACTIVOS }
      }
    });
    if (existente) {
      throw new ValidationError('El paciente ya tiene una suscripción activa a este plan');
    }

    // Buscar vendedor por código (cédula)
    let vendedorId = null;
    if (vendedor_codigo) {
      const vendedor = await prisma.usuario.findUnique({
        where: { vendedorCodigo: vendedor_codigo }
      });
      if (vendedor) vendedorId = vendedor.id;
    }

    // Calcular precio final con cupón si existe
    let precioFinal = Number(plan.costo);
    let cuponUsado = null;

    if (codigo_cupon) {
      const cupon = await this.validateCoupon(codigo_cupon, plan_id);
      cuponUsado = cupon;
      
      if (cupon.tipoDescuento === 'porcentaje') {
        const descuento = precioFinal * (Number(cupon.valorDescuento) / 100);
        precioFinal -= descuento;
      } else {
        precioFinal -= Number(cupon.valorDescuento);
      }
      
      precioFinal = Math.max(0, precioFinal);
    }

    // Calcular fechas
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + plan.duracionMeses);

    // Transacción para crear suscripción, actualizar cupón y liquidar comisiones
    const result = await prisma.$transaction(async (tx) => {
      if (cuponUsado) {
        await tx.miaPassCupon.update({
          where: { id: cuponUsado.id },
          data: { usos: { increment: 1 } }
        });
      }

      const suscripcion = await tx.miaPassSuscripcion.create({
        data: {
          planId: plan.id,
          pacienteId: paciente_id,
          vendedorId,
          vendedorCodigo: vendedor_codigo,
          canal: canal || 'Presencial',
          fechaInicio,
          fechaFin,
          estado: 'ACTIVA', // Enum EstadoSuscripcionMiaPass
          metodoPago: metodo_pago,
          precioPagado: precioFinal,
          baseComisional: 199900, // Política fija v1.1
          valorIva: 37981
        }
      });

      return suscripcion;
    });

    // Liquidar comisiones (Fuera de la transacción principal o dentro? Mejor dentro para consistencia,
    // pero createMany no es soportado fácilmente en tx anidada.
    // Lo haré después de la tx exitosa.)
    let comisionVendedor = null;
    try {
      const comisiones = await comisionService.liquidarSuscripcion(result.id);
      comisionVendedor = comisiones?.find(c => c.rolBeneficiario === 'VENDEDOR');
    } catch (err) {
      console.error('Error liquidando comisiones:', err);
      // No revertimos la suscripción por fallo en comisiones, se puede reliquidar manual
    }

    // Obtener suscripción completa con relaciones para notificaciones
    const suscripcionCompleta = await prisma.miaPassSuscripcion.findUnique({
      where: { id: result.id },
      include: {
        paciente: { select: { nombre: true, apellido: true, email: true } },
        plan: { select: { nombre: true } },
        vendedor: { select: { nombre: true, apellido: true, email: true } }
      }
    });

    // Enviar notificaciones (no bloqueantes)
    this.enviarNotificacionesSuscripcion(suscripcionCompleta, comisionVendedor);

    return result;
  }

  /**
   * Envía notificaciones de nueva suscripción (no bloqueante)
   */
  async enviarNotificacionesSuscripcion(suscripcion, comisionVendedor) {
    // Notificar al paciente
    miaPassNotificationService.notificarNuevaSuscripcionPaciente(suscripcion)
      .then(r => r.success && console.log('[MiaPass] Notificación enviada al paciente'))
      .catch(err => console.error('[MiaPass] Error notificando paciente:', err.message));

    // Notificar al vendedor
    if (suscripcion.vendedor) {
      miaPassNotificationService.notificarVentaVendedor(suscripcion, comisionVendedor)
        .then(r => r.success && console.log('[MiaPass] Notificación enviada al vendedor'))
        .catch(err => console.error('[MiaPass] Error notificando vendedor:', err.message));
    }
  }

  async getSubscriptionsByPaciente(pacienteId) {
    return await prisma.miaPassSuscripcion.findMany({
      where: { pacienteId },
      include: {
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllSubscriptions() {
    return await prisma.miaPassSuscripcion.findMany({
      include: {
        plan: true,
        paciente: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        },
        vendedor: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSubscriptionById(id) {
    const sub = await prisma.miaPassSuscripcion.findUnique({
      where: { id: parseInt(id) },
      include: {
        plan: true,
        paciente: true,
        vendedor: true,
        comisiones: { include: { beneficiario: true } }
      }
    });
    if (!sub) throw new NotFoundError('Suscripción no encontrada');
    return sub;
  }

  async cancelSubscription(id, motivo) {
    const sub = await this.getSubscriptionById(id);

    // Revertir comisiones asociadas
    await comisionService.revertirComisiones(sub.id, motivo || 'Cancelación de suscripción');

    return await prisma.miaPassSuscripcion.update({
      where: { id: sub.id },
      data: {
        estado: 'CANCELADA', // Enum EstadoSuscripcionMiaPass
        motivoAnulacion: motivo,
        fechaAnulacion: new Date()
      }
    });
  }

  async anularSubscription(id, motivo) {
    const sub = await this.getSubscriptionById(id);

    // Revertir comisiones asociadas
    await comisionService.revertirComisiones(sub.id, motivo || 'Anulación de suscripción');

    return await prisma.miaPassSuscripcion.update({
      where: { id: sub.id },
      data: {
        estado: 'ANULADA', // Enum EstadoSuscripcionMiaPass
        motivoAnulacion: motivo,
        fechaAnulacion: new Date()
      }
    });
  }

  async devolverSubscription(id, motivo) {
    const sub = await this.getSubscriptionById(id);

    // Revertir comisiones asociadas
    await comisionService.revertirComisiones(sub.id, motivo || 'Devolución de pago');

    return await prisma.miaPassSuscripcion.update({
      where: { id: sub.id },
      data: {
        estado: 'DEVUELTA', // Enum EstadoSuscripcionMiaPass
        motivoAnulacion: motivo,
        fechaAnulacion: new Date()
      }
    });
  }

  /**
   * Cupones
   */
  async createCoupon(data) {
    const existing = await prisma.miaPassCupon.findUnique({
      where: { codigo: data.codigo }
    });
    if (existing) throw new BadRequestError('El código de cupón ya existe');

    return await prisma.miaPassCupon.create({
      data: {
        codigo: data.codigo,
        descripcion: data.descripcion,
        tipoDescuento: data.tipo_descuento,
        valorDescuento: data.valor_descuento,
        fechaInicio: new Date(data.fecha_inicio),
        fechaFin: new Date(data.fecha_fin),
        usosMaximos: data.usos_maximos,
        activo: true,
        miaPlanes: {
          connect: data.planes_ids?.map(id => ({ id })) || []
        }
      }
    });
  }

  async getCoupons() {
    return await prisma.miaPassCupon.findMany({
      include: {
        miaPlanes: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async validateCoupon(codigo, planId) {
    const cupon = await prisma.miaPassCupon.findUnique({
      where: { codigo },
      include: { miaPlanes: true }
    });

    if (!cupon) throw new NotFoundError('Cupón inválido');
    if (!cupon.activo) throw new BadRequestError('El cupón no está activo');
    
    const now = new Date();
    if (now < cupon.fechaInicio || now > cupon.fechaFin) {
      throw new BadRequestError('El cupón ha expirado o aún no es válido');
    }

    if (cupon.usos >= cupon.usosMaximos) {
      throw new BadRequestError('El cupón ha agotado su límite de usos');
    }

    const aplicaPlan = cupon.miaPlanes.some(p => p.id === parseInt(planId));
    if (cupon.miaPlanes.length > 0 && !aplicaPlan) {
      throw new BadRequestError('El cupón no es aplicable a este plan');
    }

    return cupon;
  }

  async getCouponById(id) {
    const cupon = await prisma.miaPassCupon.findUnique({
      where: { id: parseInt(id) },
      include: { miaPlanes: true }
    });
    if (!cupon) throw new NotFoundError('Cupón no encontrado');
    return cupon;
  }

  async updateCoupon(id, data) {
    const cupon = await this.getCouponById(id);

    // Si se está cambiando el código, verificar unicidad
    if (data.codigo && data.codigo !== cupon.codigo) {
      const existente = await prisma.miaPassCupon.findUnique({
        where: { codigo: data.codigo }
      });
      if (existente) throw new BadRequestError('El código de cupón ya existe');
    }

    const updateData = {};
    if (data.codigo) updateData.codigo = data.codigo;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.tipo_descuento) updateData.tipoDescuento = data.tipo_descuento;
    if (data.valor_descuento !== undefined) updateData.valorDescuento = data.valor_descuento;
    if (data.fecha_inicio) updateData.fechaInicio = new Date(data.fecha_inicio);
    if (data.fecha_fin) updateData.fechaFin = new Date(data.fecha_fin);
    if (data.usos_maximos !== undefined) updateData.usosMaximos = data.usos_maximos;
    if (data.activo !== undefined) updateData.activo = data.activo;

    return await prisma.miaPassCupon.update({
      where: { id: cupon.id },
      data: {
        ...updateData,
        ...(data.planes_ids ? {
          miaPlanes: {
            set: data.planes_ids.map(planId => ({ id: planId }))
          }
        } : {})
      },
      include: { miaPlanes: true }
    });
  }

  async toggleCoupon(id) {
    const cupon = await this.getCouponById(id);
    return await prisma.miaPassCupon.update({
      where: { id: cupon.id },
      data: { activo: !cupon.activo },
      include: { miaPlanes: true }
    });
  }

  async deleteCoupon(id) {
    const cupon = await this.getCouponById(id);

    // Verificar si tiene usos
    if (cupon.usos > 0) {
      throw new ValidationError('No se puede eliminar un cupón que ya ha sido utilizado');
    }

    // Eliminar relaciones con planes primero
    await prisma.miaPassCupon.update({
      where: { id: cupon.id },
      data: { miaPlanes: { set: [] } }
    });

    return prisma.miaPassCupon.delete({ where: { id: cupon.id } });
  }

  /**
   * Historial de Pagos (Cortes por vendedor)
   */
  async getHistorialPagos(vendedorId) {
    const cortes = await prisma.miaPassCorte.findMany({
      where: {
        comisiones: {
          some: { vendedorId }
        }
      },
      include: {
        comisiones: {
          where: { vendedorId }
        }
      },
      orderBy: { fechaCorte: 'desc' }
    });

    return cortes.map(corte => ({
      id: corte.id,
      periodo: corte.periodo,
      fechaCorte: corte.fechaCorte,
      totalComisiones: corte.comisiones.reduce((sum, c) => sum + Number(c.valor), 0),
      estado: corte.estado === 'CERRADO' ? 'PAGADO' : 'PENDIENTE',
      fechaPago: corte.estado === 'CERRADO' ? corte.fechaCorte : null,
      metodoPago: 'Transferencia' // TODO: agregar campo real si se necesita
    }));
  }

  /**
   * Conversión de Formulario a Suscripción
   */
  async convertirFormularioASuscripcion(formularioId, data) {
    const formulario = await prisma.formularioMiaPass.findUnique({
      where: { id: formularioId }
    });
    if (!formulario) throw new NotFoundError('Formulario no encontrado');
    if (formulario.suscripcionId) throw new BadRequestError('Este formulario ya fue convertido a suscripción');

    // Buscar o crear paciente
    let paciente = await prisma.paciente.findFirst({
      where: { cedula: formulario.numeroDocumento }
    });

    if (!paciente) {
      const nombrePartes = formulario.nombreCompleto.trim().split(' ');
      const nombre = nombrePartes[0] || '';
      const apellido = nombrePartes.slice(1).join(' ') || '';

      paciente = await prisma.paciente.create({
        data: {
          cedula: formulario.numeroDocumento,
          nombre,
          apellido,
          email: formulario.correoElectronico,
          telefono: formulario.celular
        }
      });
    }

    // Crear suscripción
    const suscripcion = await this.createSubscription({
      plan_id: data.planId,
      paciente_id: paciente.id,
      metodo_pago: data.metodoPago,
      vendedor_codigo: data.vendedorCodigo,
      canal: 'Formulario Web'
    });

    // Actualizar formulario
    await prisma.formularioMiaPass.update({
      where: { id: formularioId },
      data: {
        estado: 'Completado',
        suscripcionId: suscripcion.id,
        convertidoEn: new Date(),
        convertidoPor: data.usuarioId
      }
    });

    return suscripcion;
  }

  /**
   * Estadísticas para Dashboard
   */
  async getDashboardStats() {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [
      totalSuscripciones,
      suscripcionesActivas,
      suscripcionesMes,
      totalComisiones,
      comisionesPendientes
    ] = await Promise.all([
      prisma.miaPassSuscripcion.count(),
      prisma.miaPassSuscripcion.count({ where: { estado: 'ACTIVA' } }),
      prisma.miaPassSuscripcion.count({
        where: {
          estado: 'ACTIVA',
          createdAt: { gte: inicioMes }
        }
      }),
      prisma.miaPassComision.aggregate({
        _sum: { valor: true }
      }),
      prisma.miaPassComision.aggregate({
        where: { estado: 'PENDIENTE' },
        _sum: { valor: true }
      })
    ]);

    return {
      totalSuscripciones,
      suscripcionesActivas,
      suscripcionesMes,
      totalComisiones: Number(totalComisiones._sum.valor || 0),
      comisionesPendientes: Number(comisionesPendientes._sum.valor || 0)
    };
  }
}

module.exports = new MiaPassService();
