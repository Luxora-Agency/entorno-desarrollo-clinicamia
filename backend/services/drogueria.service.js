/**
 * Servicio de Droguería (Retail) - Clínica Mía
 * Maneja ventas al público, POS, inventario independiente y caja.
 * Cumple con normatividad colombiana de impuestos y trazabilidad.
 * Integración con Siigo para facturación electrónica DIAN.
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

// Umbral mínimo para emitir factura electrónica (en COP)
const UMBRAL_FACTURA_ELECTRONICA = 5000;

class DrogueriaService {
  // ============ GESTIÓN DE CAJA ============

  /**
   * Abrir una nueva caja
   * Permite múltiples cajas abiertas simultáneamente
   */
  async abrirCaja(usuarioId, montoInicial, nombreCaja = 'Caja Principal') {
    // Verificar si este usuario ya tiene una caja abierta
    const cajaAbiertaUsuario = await prisma.drogueriaCaja.findFirst({
      where: { usuarioId, estado: 'Abierta' }
    });

    if (cajaAbiertaUsuario) {
      throw new ValidationError(`Ya tienes la caja "${cajaAbiertaUsuario.nombre}" abierta. Ciérrala antes de abrir otra.`);
    }

    return await prisma.drogueriaCaja.create({
      data: {
        nombre: nombreCaja,
        usuarioId,
        montoInicial: parseFloat(montoInicial),
        estado: 'Abierta'
      },
      include: { usuario: { select: { nombre: true, apellido: true } } }
    });
  }

  /**
   * Cerrar caja con desglose detallado de ventas
   */
  async cerrarCaja(id, montoFinal, observaciones = '') {
    const caja = await prisma.drogueriaCaja.findUnique({
      where: { id },
      include: {
        ventas: {
          where: { estado: 'Completada' },
          include: { items: { include: { producto: true } } }
        },
        usuario: { select: { nombre: true, apellido: true } }
      }
    });

    if (!caja) throw new NotFoundError('Caja no encontrada');
    if (caja.estado === 'Cerrada') throw new ValidationError('La caja ya está cerrada');

    // Calcular totales por método de pago (usando desglose de pagos combinados)
    const totalEfectivo = caja.ventas.reduce((sum, v) => sum + (v.montoEfectivo || 0), 0);
    const totalTarjeta = caja.ventas.reduce((sum, v) => sum + (v.montoTarjeta || 0), 0);
    const totalTransferencia = caja.ventas.reduce((sum, v) => sum + (v.montoTransferencia || 0), 0);

    const totalVentas = totalEfectivo + totalTarjeta + totalTransferencia;
    const montoEsperado = caja.montoInicial + totalEfectivo; // Solo efectivo cuenta para el arqueo físico
    const diferencia = parseFloat(montoFinal) - montoEsperado;

    const cajaCerrada = await prisma.drogueriaCaja.update({
      where: { id },
      data: {
        montoFinal: parseFloat(montoFinal),
        montoEsperado,
        diferencia,
        fechaCierre: new Date(),
        estado: 'Cerrada',
        observaciones,
        totalEfectivo,
        totalTarjeta,
        totalTransferencia
      },
      include: {
        ventas: {
          where: { estado: 'Completada' },
          include: { items: { include: { producto: true } } }
        },
        usuario: { select: { nombre: true, apellido: true } }
      }
    });

    return {
      ...cajaCerrada,
      resumen: {
        totalVentas,
        cantidadVentas: caja.ventas.length,
        totalEfectivo,
        totalTarjeta,
        totalTransferencia,
        montoInicial: caja.montoInicial,
        montoEsperadoEfectivo: montoEsperado,
        montoContado: parseFloat(montoFinal),
        diferencia
      }
    };
  }

  /**
   * Obtener caja activa del usuario actual
   */
  async getCajaActiva(usuarioId) {
    return await prisma.drogueriaCaja.findFirst({
      where: { usuarioId, estado: 'Abierta' },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
        ventas: {
          where: { estado: 'Completada' },
          select: { id: true, total: true, metodoPago: true, montoEfectivo: true, montoTarjeta: true, montoTransferencia: true }
        }
      }
    });
  }

  /**
   * Obtener todas las cajas abiertas (para supervisores)
   */
  async getCajasAbiertas() {
    return await prisma.drogueriaCaja.findMany({
      where: { estado: 'Abierta' },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
        _count: { select: { ventas: true } }
      },
      orderBy: { fechaApertura: 'desc' }
    });
  }

  /**
   * Obtener detalle de una caja específica con sus ventas
   */
  async getCajaDetalle(cajaId) {
    const caja = await prisma.drogueriaCaja.findUnique({
      where: { id: cajaId },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
        ventas: {
          orderBy: { fechaVenta: 'desc' },
          include: {
            items: { include: { producto: true } }
          }
        }
      }
    });

    if (!caja) throw new NotFoundError('Caja no encontrada');

    // Calcular estadísticas (usando desglose de pagos combinados)
    const ventasCompletadas = caja.ventas.filter(v => v.estado === 'Completada');
    const totalEfectivo = ventasCompletadas.reduce((s, v) => s + (v.montoEfectivo || 0), 0);
    const totalTarjeta = ventasCompletadas.reduce((s, v) => s + (v.montoTarjeta || 0), 0);
    const totalTransferencia = ventasCompletadas.reduce((s, v) => s + (v.montoTransferencia || 0), 0);

    return {
      ...caja,
      estadisticas: {
        cantidadVentas: ventasCompletadas.length,
        ventasAnuladas: caja.ventas.filter(v => v.estado === 'Anulada').length,
        totalEfectivo,
        totalTarjeta,
        totalTransferencia,
        totalGeneral: totalEfectivo + totalTarjeta + totalTransferencia,
        efectivoEnCaja: caja.montoInicial + totalEfectivo
      }
    };
  }

  /**
   * Historial de cajas cerradas
   */
  async getHistorialCajas({ desde, hasta, usuarioId, limit = 20, page = 1 }) {
    const where = { estado: 'Cerrada' };
    if (usuarioId) where.usuarioId = usuarioId;
    if (desde || hasta) {
      where.fechaCierre = {};
      if (desde) where.fechaCierre.gte = new Date(desde);
      if (hasta) where.fechaCierre.lte = new Date(hasta);
    }

    const [data, total] = await Promise.all([
      prisma.drogueriaCaja.findMany({
        where,
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        orderBy: { fechaCierre: 'desc' },
        include: {
          usuario: { select: { nombre: true, apellido: true } },
          _count: { select: { ventas: true } }
        }
      }),
      prisma.drogueriaCaja.count({ where })
    ]);

    return { data, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } };
  }

  // ============ INVENTARIO DROGUERÍA ============

  async getProductos({ search, activo, categoriaId, bajoStock, limit = 50, page = 1 }) {
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true' || activo === true;
    if (categoriaId && categoriaId !== 'all') {
      where.producto = { categoriaId };
    }
    if (bajoStock === 'true' || bajoStock === true) {
      // Filtrar productos con stock bajo (umbral: 10 unidades o menos)
      where.stockActual = { lte: 10 };
    }
    if (search) {
      const searchConditions = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { producto: { principioActivo: { contains: search, mode: 'insensitive' } } },
        { producto: { laboratorio: { contains: search, mode: 'insensitive' } } },
        { producto: { codigoAtc: { contains: search, mode: 'insensitive' } } }
      ];
      where.OR = searchConditions;
    }

    const [data, total] = await Promise.all([
      prisma.drogueriaProducto.findMany({
        where,
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        orderBy: { nombre: 'asc' },
        include: {
          producto: {
            include: {
              categoria: true,
              presentaciones: true
            }
          }
        }
      }),
      prisma.drogueriaProducto.count({ where })
    ]);

    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Obtener todas las categorías de productos disponibles
   */
  async getCategorias() {
    return await prisma.categoriaProducto.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
  }

  async upsertProducto(data) {
    const { sku, ...rest } = data;
    return await prisma.drogueriaProducto.upsert({
      where: { sku },
      update: { ...rest, updatedAt: new Date() },
      create: { ...rest, sku }
    });
  }

  async importarDesdeFarmacia(productoIds) {
    const farmaciaProds = await prisma.producto.findMany({
      where: { id: { in: productoIds } }
    });

    const results = [];
    for (const p of farmaciaProds) {
      const dp = await prisma.drogueriaProducto.upsert({
        where: { sku: p.sku },
        update: {
          nombre: p.nombre,
          descripcion: p.descripcion,
          precioVenta: p.precioVenta,
          productoId: p.id,
          // Colombia: 0% o 19% usualmente en medicamentos
          porcentajeIva: p.requiereReceta ? 0 : 19
        },
        create: {
          sku: p.sku,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precioVenta: p.precioVenta,
          stockActual: 0,
          productoId: p.id,
          porcentajeIva: p.requiereReceta ? 0 : 19
        }
      });
      results.push(dp);
    }
    return results;
  }

  /**
   * Importar TODOS los productos PBS a la droguería
   * Incluye productos simples y presentaciones (variantes)
   */
  async importarTodosPBS() {
    // Obtener todos los productos activos de farmacia
    const farmaciaProds = await prisma.producto.findMany({
      where: { activo: true },
      include: { presentaciones: true }
    });

    const results = { productos: 0, presentaciones: 0, errores: [] };

    for (const p of farmaciaProds) {
      try {
        // Importar producto principal
        await prisma.drogueriaProducto.upsert({
          where: { sku: p.sku },
          update: {
            nombre: p.nombre,
            descripcion: p.descripcion || p.indicaciones,
            precioVenta: p.precioVenta || 0,
            productoId: p.id,
            porcentajeIva: p.requiereReceta ? 0 : 19
          },
          create: {
            sku: p.sku,
            nombre: p.nombre,
            descripcion: p.descripcion || p.indicaciones,
            precioVenta: p.precioVenta || 0,
            stockActual: p.cantidadTotal || 0,
            productoId: p.id,
            porcentajeIva: p.requiereReceta ? 0 : 19
          }
        });
        results.productos++;

        // Importar presentaciones (variantes) del producto
        for (const pres of p.presentaciones) {
          await prisma.drogueriaProducto.upsert({
            where: { sku: pres.sku },
            update: {
              nombre: `${p.nombre} - ${pres.nombre} ${pres.concentracion}`,
              descripcion: pres.descripcion || `${pres.formaFarmaceutica} - ${pres.concentracion}`,
              precioVenta: pres.precioVenta || 0,
              productoId: p.id,
              porcentajeIva: p.requiereReceta ? 0 : 19
            },
            create: {
              sku: pres.sku,
              nombre: `${p.nombre} - ${pres.nombre} ${pres.concentracion}`,
              descripcion: pres.descripcion || `${pres.formaFarmaceutica} - ${pres.concentracion}`,
              precioVenta: pres.precioVenta || 0,
              stockActual: pres.cantidadTotal || 0,
              productoId: p.id,
              porcentajeIva: p.requiereReceta ? 0 : 19
            }
          });
          results.presentaciones++;
        }
      } catch (err) {
        results.errores.push({ sku: p.sku, error: err.message });
      }
    }

    return results;
  }

  /**
   * Obtener productos de farmacia disponibles para importar
   */
  async getProductosFarmaciaDisponibles({ search, categoriaId, limit = 100, page = 1 }) {
    const where = { activo: true };

    if (categoriaId) where.categoriaId = categoriaId;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { principioActivo: { contains: search, mode: 'insensitive' } },
        { laboratorio: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        orderBy: { nombre: 'asc' },
        include: {
          categoria: true,
          presentaciones: true
        }
      }),
      prisma.producto.count({ where })
    ]);

    return { data, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } };
  }

  // ============ CLIENTES / PACIENTES ============

  /**
   * Buscar cliente por cédula
   * Busca en la tabla de pacientes
   */
  async buscarClientePorCedula(cedula) {
    if (!cedula || cedula.trim().length < 5) {
      return null;
    }

    const paciente = await prisma.paciente.findUnique({
      where: { cedula: cedula.trim() },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cedula: true,
        telefono: true,
        email: true,
        direccion: true,
        tipoDocumento: true
      }
    });

    return paciente;
  }

  /**
   * Crear cliente (se crea como paciente en el sistema)
   * Datos mínimos para venta retail
   */
  async crearCliente(data) {
    const { cedula, nombres, apellidos, telefono, email } = data;

    if (!cedula || cedula.trim().length < 5) {
      throw new ValidationError('La cédula es requerida');
    }

    if (!nombres || nombres.trim().length < 2) {
      throw new ValidationError('Los nombres son requeridos');
    }

    if (!apellidos || apellidos.trim().length < 2) {
      throw new ValidationError('Los apellidos son requeridos');
    }

    // Verificar si ya existe
    const existente = await prisma.paciente.findUnique({
      where: { cedula: cedula.trim() }
    });

    if (existente) {
      throw new ValidationError('Ya existe un cliente con esta cédula');
    }

    const nuevoCliente = await prisma.paciente.create({
      data: {
        cedula: cedula.trim(),
        nombre: nombres.trim(),
        apellido: apellidos.trim(),
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        tipoDocumento: 'CC',
        tipoPaciente: 'RETAIL', // Marcar como cliente retail
        estado: 'Activo'
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cedula: true,
        telefono: true,
        email: true
      }
    });

    return nuevoCliente;
  }

  // ============ VENTAS (POS) ============

  async registrarVenta(ventaData, vendedorId) {
    const {
      clienteNombre, clienteDocumento, clienteEmail, metodoPago, items, cajaId,
      descuentoManual = 0, pacienteId,
      // Campos de transferencia
      referenciaTransferencia, bancoTransferencia, comprobanteUrl,
      // Pagos combinados
      montoEfectivo = 0, montoTarjeta = 0, montoTransferencia = 0
    } = ventaData;

    if (!items || items.length === 0) throw new ValidationError('La venta debe tener al menos un producto');

    const itemsProcesados = [];
    let subtotalVenta = 0;
    let totalIvaVenta = 0;

    for (const item of items) {
      const prod = await prisma.drogueriaProducto.findUnique({
        where: { id: item.drogueriaProductoId }
      });

      if (!prod) throw new NotFoundError(`Producto no encontrado: ${item.drogueriaProductoId}`);
      if (prod.stockActual < item.cantidad) {
        throw new ValidationError(`Stock insuficiente para ${prod.nombre}. Disponible: ${prod.stockActual}`);
      }

      // Cálculo de IVA (Precio venta ya incluye IVA en retail usualmente, pero aquí lo desglosamos)
      // Base = Precio / (1 + IVA%)
      const baseIndividual = prod.precioVenta / (1 + (prod.porcentajeIva / 100));
      const ivaIndividual = prod.precioVenta - baseIndividual;
      
      const subtotalItem = baseIndividual * item.cantidad;
      const ivaItem = ivaIndividual * item.cantidad;

      subtotalVenta += subtotalItem;
      totalIvaVenta += ivaItem;

      itemsProcesados.push({
        drogueriaProductoId: prod.id,
        cantidad: item.cantidad,
        precioUnitario: prod.precioVenta,
        porcentajeIva: prod.porcentajeIva,
        valorIva: ivaItem,
        subtotal: subtotalItem + ivaItem
      });
    }

    const totalVenta = (subtotalVenta + totalIvaVenta) - parseFloat(descuentoManual);

    const venta = await prisma.$transaction(async (tx) => {
      const lastVenta = await tx.drogueriaVenta.findFirst({
        orderBy: { fechaVenta: 'desc' },
        select: { numeroFactura: true }
      });

      let nextNum = 1;
      if (lastVenta && lastVenta.numeroFactura.startsWith('DR-')) {
        nextNum = parseInt(lastVenta.numeroFactura.split('-')[1]) + 1;
      }
      const numeroFactura = `DR-${nextNum.toString().padStart(6, '0')}`;

      const nuevaVenta = await tx.drogueriaVenta.create({
        data: {
          numeroFactura,
          clienteNombre,
          clienteDocumento,
          clienteEmail,
          metodoPago,
          subtotal: subtotalVenta,
          impuestos: totalIvaVenta,
          descuento: parseFloat(descuentoManual),
          total: totalVenta,
          vendedorId,
          cajaId,
          pacienteId,
          // Desglose de pagos combinados
          montoEfectivo: parseFloat(montoEfectivo) || 0,
          montoTarjeta: parseFloat(montoTarjeta) || 0,
          montoTransferencia: parseFloat(montoTransferencia) || 0,
          // Campos de transferencia
          referenciaTransferencia,
          bancoTransferencia,
          comprobanteUrl,
          items: {
            create: itemsProcesados
          }
        },
        include: { items: { include: { producto: true } }, paciente: true }
      });

      for (const item of itemsProcesados) {
        await tx.drogueriaProducto.update({
          where: { id: item.drogueriaProductoId },
          data: { stockActual: { decrement: item.cantidad } }
        });
      }

      return nuevaVenta;
    });

    // Emitir factura electrónica si cumple condiciones (asíncrono, no bloquea)
    // Solo si tiene documento del cliente y supera el umbral mínimo
    if (clienteDocumento && totalVenta >= UMBRAL_FACTURA_ELECTRONICA) {
      this.emitirFacturaElectronica(venta.id).catch(err => {
        console.error(`[Drogueria] Error emitiendo FE para venta ${venta.id}:`, err.message);
      });
    }

    // Enviar factura por email si tiene correo del cliente (asíncrono, no bloquea)
    const emailCliente = clienteEmail || (pacienteId ? await this.getEmailPaciente(pacienteId) : null);
    if (emailCliente) {
      this.enviarFacturaEmail(venta.id, emailCliente).catch(err => {
        console.error(`[Drogueria] Error enviando email factura ${venta.id}:`, err.message);
      });
    }

    return venta;
  }

  /**
   * Obtener email del paciente si existe
   */
  async getEmailPaciente(pacienteId) {
    if (!pacienteId) return null;
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: { email: true }
    });
    return paciente?.email || null;
  }

  /**
   * Enviar factura de venta por email
   */
  async enviarFacturaEmail(ventaId, email) {
    const emailService = require('./email.service');

    const venta = await prisma.drogueriaVenta.findUnique({
      where: { id: ventaId },
      include: {
        items: {
          include: {
            producto: {
              include: { producto: true }
            }
          }
        },
        vendedor: { select: { nombre: true, apellido: true } }
      }
    });

    if (!venta) {
      console.error(`[Drogueria] Venta ${ventaId} no encontrada para email`);
      return;
    }

    return emailService.sendDrogueriaInvoice({
      to: email,
      venta,
      items: venta.items,
      vendedor: venta.vendedor
    });
  }

  /**
   * Emitir factura electrónica para venta de droguería
   */
  async emitirFacturaElectronica(ventaId) {
    try {
      const invoiceSiigoService = require('./siigo/invoice.siigo.service');
      const customerSiigoService = require('./siigo/customer.siigo.service');

      const venta = await prisma.drogueriaVenta.findUnique({
        where: { id: ventaId },
        include: { items: { include: { producto: true } }, vendedor: true }
      });

      if (!venta) throw new NotFoundError('Venta no encontrada');
      if (venta.siigoId) return { message: 'Ya tiene factura electrónica', siigoId: venta.siigoId };

      // Asegurar cliente existe en Siigo
      const customerId = await customerSiigoService.ensureCustomerExists({
        documento: venta.clienteDocumento || '222222222222',
        nombre: venta.clienteNombre || 'CONSUMIDOR FINAL',
        email: venta.clienteEmail
      });

      // Crear factura electrónica
      const result = await invoiceSiigoService.createElectronicInvoiceDrogueria(venta);

      // Actualizar venta con datos electrónicos
      await prisma.drogueriaVenta.update({
        where: { id: ventaId },
        data: {
          siigoId: result.id,
          cufe: result.cufe,
          estadoDian: 'accepted',
          pdfUrl: result.pdfUrl
        }
      });

      return result;
    } catch (error) {
      console.error('Error en factura electrónica droguería:', error);

      // Registrar error en SiigoSync para reintento
      await prisma.siigoSync.upsert({
        where: { entidad_entidadId: { entidad: 'drogueria_venta', entidadId: ventaId } },
        update: { estado: 'error', errorMessage: error.message },
        create: {
          entidad: 'drogueria_venta',
          entidadId: ventaId,
          estado: 'error',
          errorMessage: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Obtener PDF de factura electrónica
   */
  async obtenerPdfElectronico(ventaId) {
    const venta = await prisma.drogueriaVenta.findUnique({ where: { id: ventaId } });
    if (!venta) throw new NotFoundError('Venta no encontrada');
    if (!venta.siigoId) throw new ValidationError('La venta no tiene factura electrónica');

    const invoiceSiigoService = require('./siigo/invoice.siigo.service');
    return invoiceSiigoService.getInvoicePdf(venta.siigoId);
  }

  /**
   * Reenviar factura electrónica por email
   */
  async reenviarFacturaEmail(ventaId, email) {
    const venta = await prisma.drogueriaVenta.findUnique({ where: { id: ventaId } });
    if (!venta) throw new NotFoundError('Venta no encontrada');
    if (!venta.siigoId) throw new ValidationError('La venta no tiene factura electrónica');

    const invoiceSiigoService = require('./siigo/invoice.siigo.service');
    return invoiceSiigoService.resendInvoiceEmail(venta.siigoId, email);
  }

  async anularVenta(id, motivo, usuarioId) {
    const venta = await prisma.drogueriaVenta.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!venta) throw new NotFoundError('Venta no encontrada');
    if (venta.estado === 'Anulada') throw new ValidationError('La venta ya está anulada');

    return await prisma.$transaction(async (tx) => {
      const anulada = await tx.drogueriaVenta.update({
        where: { id },
        data: {
          estado: 'Anulada',
          motivoAnulacion: motivo,
          fechaAnulacion: new Date()
        }
      });

      // Reversar stock
      for (const item of venta.items) {
        await tx.drogueriaProducto.update({
          where: { id: item.drogueriaProductoId },
          data: { stockActual: { increment: item.cantidad } }
        });
      }

      return anulada;
    });
  }

  async getVentas({ desde, hasta, vendedorId, limit = 50, page = 1 }) {
    const where = {};
    if (vendedorId) where.vendedorId = vendedorId;
    if (desde || hasta) {
      where.fechaVenta = {};
      if (desde) where.fechaVenta.gte = new Date(desde);
      if (hasta) where.fechaVenta.lte = new Date(hasta);
    }

    const [data, total] = await Promise.all([
      prisma.drogueriaVenta.findMany({
        where,
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        orderBy: { fechaVenta: 'desc' },
        include: { 
          vendedor: { select: { nombre: true, apellido: true } }, 
          items: { include: { producto: true } } 
        }
      }),
      prisma.drogueriaVenta.count({ where })
    ]);

    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async deleteProducto(id) {
    const prod = await prisma.drogueriaProducto.findUnique({ where: { id } });
    if (!prod) throw new NotFoundError('Producto no encontrado');

    return await prisma.drogueriaProducto.update({
      where: { id },
      data: { activo: false }
    });
  }

  async getStatsDashboard() {
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const [ventasHoy, totalProductos, bajoStock, ventasRecientes, topItems] = await Promise.all([
      prisma.drogueriaVenta.findMany({
        where: { fechaVenta: { gte: hoy }, estado: 'Completada' },
        select: { total: true }
      }),
      prisma.drogueriaProducto.count({ where: { activo: true } }),
      prisma.drogueriaProducto.count({
        where: { 
          activo: true,
          stockActual: { lte: 5 } 
        }
      }),
      prisma.drogueriaVenta.findMany({
        take: 5,
        orderBy: { fechaVenta: 'desc' },
        include: { vendedor: { select: { nombre: true } } }
      }),
      prisma.drogueriaVentaItem.groupBy({
        by: ['drogueriaProductoId'],
        _sum: { cantidad: true },
        orderBy: { _sum: { cantidad: 'desc' } },
        take: 3
      })
    ]);

    // Obtener nombres de top productos
    const topProducts = await Promise.all(topItems.map(async (item) => {
      const p = await prisma.drogueriaProducto.findUnique({
        where: { id: item.drogueriaProductoId },
        select: { nombre: true }
      });
      return { 
        nombre: p?.nombre || 'Desconocido', 
        cantidad: item._sum.cantidad 
      };
    }));

    const ingresosHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);

    return {
      ingresosHoy,
      numeroVentasHoy: ventasHoy.length,
      totalProductos,
      productosBajoStock: bajoStock,
      ventasRecientes,
      topProducts
    };
  }
}

module.exports = new DrogueriaService();