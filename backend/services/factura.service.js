/**
 * Service de facturas
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class FacturaService {
  /**
   * Generar número de factura secuencial
   */
  async generarNumeroFactura() {
    const año = new Date().getFullYear();
    const ultimaFactura = await prisma.factura.findFirst({
      where: {
        numero: {
          startsWith: `F-${año}-`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let secuencia = 1;
    if (ultimaFactura) {
      const partes = ultimaFactura.numero.split('-');
      secuencia = parseInt(partes[2]) + 1;
    }

    return `F-${año}-${String(secuencia).padStart(5, '0')}`;
  }

  /**
   * Obtener todas las facturas con filtros
   */
  async getAll({ 
    page = 1, 
    limit = 20, 
    paciente_id, 
    estado 
  }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(paciente_id && { pacienteId: paciente_id }),
      ...(estado && { estado }),
    };

    const [facturas, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaEmision: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
              eps: true,
            },
          },
          items: {
            include: {
              cita: {
                select: {
                  id: true,
                  fecha: true,
                  especialidad: {
                    select: {
                      titulo: true,
                    },
                  },
                },
              },
            },
          },
          pagos: true,
        },
      }),
      prisma.factura.count({ where }),
    ]);

    return {
      facturas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener una factura por ID
   */
  async getById(id) {
    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        paciente: true,
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        items: {
          include: {
            cita: {
              include: {
                especialidad: true,
                doctor: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
            ordenMedica: {
              include: {
                examenProcedimiento: true,
              },
            },
            ordenMedicamento: {
              include: {
                items: {
                  include: {
                    producto: true,
                  },
                },
              },
            },
            admision: {
              include: {
                unidad: true,
                cama: true,
              },
            },
          },
        },
        pagos: {
          include: {
            registrador: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
          orderBy: {
            fechaPago: 'desc',
          },
        },
      },
    });

    if (!factura) {
      throw new NotFoundError('Factura no encontrada');
    }

    return factura;
  }

  /**
   * Crear una nueva factura
   */
  async create(data, creadaPorId) {
    // Validar campos requeridos
    if (!data.paciente_id) throw new ValidationError('paciente_id es requerido');
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new ValidationError('items es requerido y debe contener al menos un elemento');
    }

    // Calcular totales
    let subtotal = 0;
    const itemsData = [];

    for (const item of data.items) {
      if (!item.tipo || !item.descripcion || !item.precio_unitario) {
        throw new ValidationError('Cada item debe tener tipo, descripcion y precio_unitario');
      }

      const cantidad = parseInt(item.cantidad) || 1;
      const precioUnitario = parseFloat(item.precio_unitario);
      const descuento = parseFloat(item.descuento) || 0;
      const itemSubtotal = (precioUnitario * cantidad) - descuento;
      subtotal += itemSubtotal;

      itemsData.push({
        tipo: item.tipo,
        descripcion: item.descripcion,
        cantidad,
        precioUnitario,
        descuento,
        subtotal: itemSubtotal,
        citaId: item.cita_id || null,
        ordenMedicaId: item.orden_medica_id || null,
        ordenMedicamentoId: item.orden_medicamento_id || null,
        admisionId: item.admision_id || null,
      });
    }

    const descuentos = parseFloat(data.descuentos) || 0;
    const impuestos = parseFloat(data.impuestos) || 0;
    const total = subtotal - descuentos + impuestos;

    // Generar número de factura
    const numero = await this.generarNumeroFactura();

    // Crear factura
    const factura = await prisma.factura.create({
      data: {
        numero,
        pacienteId: data.paciente_id,
        estado: 'Pendiente',
        subtotal,
        descuentos,
        impuestos,
        total,
        saldoPendiente: total,
        observaciones: data.observaciones || null,
        cubiertoPorEPS: data.cubierto_por_eps || false,
        epsAutorizacion: data.eps_autorizacion || null,
        montoEPS: data.monto_eps ? parseFloat(data.monto_eps) : null,
        montoPaciente: data.monto_paciente ? parseFloat(data.monto_paciente) : null,
        fechaEmision: new Date(),
        fechaVencimiento: data.fecha_vencimiento ? new Date(data.fecha_vencimiento) : null,
        creadaPor: creadaPorId || null,
        items: {
          create: itemsData,
        },
      },
      include: {
        paciente: true,
        items: true,
      },
    });

    return factura;
  }

  /**
   * Actualizar una factura
   */
  async update(id, data) {
    await this.getById(id);

    const updateData = {};
    
    if (data.estado) updateData.estado = data.estado;
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;
    if (data.fecha_vencimiento) updateData.fechaVencimiento = new Date(data.fecha_vencimiento);
    if (data.cubierto_por_eps !== undefined) updateData.cubiertoPorEPS = data.cubierto_por_eps;
    if (data.eps_autorizacion !== undefined) updateData.epsAutorizacion = data.eps_autorizacion;
    if (data.monto_eps !== undefined) updateData.montoEPS = data.monto_eps ? parseFloat(data.monto_eps) : null;
    if (data.monto_paciente !== undefined) updateData.montoPaciente = data.monto_paciente ? parseFloat(data.monto_paciente) : null;

    const factura = await prisma.factura.update({
      where: { id },
      data: updateData,
      include: {
        paciente: true,
        items: true,
        pagos: true,
      },
    });

    return factura;
  }

  /**
   * Registrar un pago y actualizar estado de factura
   */
  async registrarPago(facturaId, pagoData, registradoPorId) {
    const factura = await this.getById(facturaId);

    if (factura.estado === 'Pagada') {
      throw new ValidationError('La factura ya está completamente pagada');
    }

    if (factura.estado === 'Cancelada') {
      throw new ValidationError('No se puede registrar pagos en una factura cancelada');
    }

    const montoPago = parseFloat(pagoData.monto);
    if (montoPago <= 0) {
      throw new ValidationError('El monto del pago debe ser mayor a 0');
    }

    if (montoPago > factura.saldoPendiente) {
      throw new ValidationError(`El monto del pago (${montoPago}) excede el saldo pendiente (${factura.saldoPendiente})`);
    }

    // Registrar pago
    const pago = await prisma.pago.create({
      data: {
        facturaId,
        monto: montoPago,
        metodoPago: pagoData.metodo_pago,
        referencia: pagoData.referencia || null,
        observaciones: pagoData.observaciones || null,
        fechaPago: pagoData.fecha_pago ? new Date(pagoData.fecha_pago) : new Date(),
        registradoPor: registradoPorId || null,
      },
    });

    // Actualizar saldo pendiente y estado de factura
    const nuevoSaldoPendiente = factura.saldoPendiente - montoPago;
    let nuevoEstado = factura.estado;

    if (nuevoSaldoPendiente === 0) {
      nuevoEstado = 'Pagada';
    } else if (nuevoSaldoPendiente < factura.total) {
      nuevoEstado = 'Parcial';
    }

    await prisma.factura.update({
      where: { id: facturaId },
      data: {
        saldoPendiente: nuevoSaldoPendiente,
        estado: nuevoEstado,
      },
    });

    return pago;
  }

  /**
   * Cancelar una factura
   */
  async cancelar(id, observaciones) {
    const factura = await this.getById(id);

    if (factura.pagos.length > 0) {
      throw new ValidationError('No se puede cancelar una factura que tiene pagos registrados');
    }

    await prisma.factura.update({
      where: { id },
      data: {
        estado: 'Cancelada',
        observaciones,
      },
    });

    return true;
  }

  /**
   * Eliminar una factura
   */
  async delete(id) {
    const factura = await this.getById(id);

    if (factura.pagos.length > 0) {
      throw new ValidationError('No se puede eliminar una factura que tiene pagos registrados');
    }

    await prisma.factura.delete({ where: { id } });
    return true;
  }
}

module.exports = new FacturaService();
