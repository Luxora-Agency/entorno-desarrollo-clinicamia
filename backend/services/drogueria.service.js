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

  async abrirCaja(usuarioId, montoInicial) {
    const cajaAbierta = await prisma.drogueriaCaja.findFirst({
      where: { usuarioId, estado: 'Abierta' }
    });

    if (cajaAbierta) {
      throw new ValidationError('Ya tienes una caja abierta. Debes cerrarla antes de abrir una nueva.');
    }

    return await prisma.drogueriaCaja.create({
      data: {
        usuarioId,
        montoInicial: parseFloat(montoInicial),
        estado: 'Abierta'
      }
    });
  }

  async cerrarCaja(id, montoFinal) {
    const caja = await prisma.drogueriaCaja.findUnique({
      where: { id },
      include: { ventas: true }
    });

    if (!caja) throw new NotFoundError('Caja no encontrada');
    if (caja.estado === 'Cerrada') throw new ValidationError('La caja ya está cerrada');

    const totalVentas = caja.ventas
      .filter(v => v.estado === 'Completada')
      .reduce((sum, v) => sum + v.total, 0);
    
    const montoEsperado = caja.montoInicial + totalVentas;
    const diferencia = parseFloat(montoFinal) - montoEsperado;

    return await prisma.drogueriaCaja.update({
      where: { id },
      data: {
        montoFinal: parseFloat(montoFinal),
        montoEsperado,
        diferencia,
        fechaCierre: new Date(),
        estado: 'Cerrada'
      }
    });
  }

  async getCajaActiva(usuarioId) {
    return await prisma.drogueriaCaja.findFirst({
      where: { usuarioId, estado: 'Abierta' }
    });
  }

  // ============ INVENTARIO DROGUERÍA ============

  async getProductos({ search, activo, limit = 50, page = 1 }) {
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true' || activo === true;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { principioActivo: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.drogueriaProducto.findMany({
        where,
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        orderBy: { nombre: 'asc' },
        include: { producto: true }
      }),
      prisma.drogueriaProducto.count({ where })
    ]);

    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
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

  // ============ VENTAS (POS) ============

  async registrarVenta(ventaData, vendedorId) {
    const { clienteNombre, clienteDocumento, metodoPago, items, cajaId, descuentoManual = 0 } = ventaData;

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
          metodoPago,
          subtotal: subtotalVenta,
          impuestos: totalIvaVenta,
          descuento: parseFloat(descuentoManual),
          total: totalVenta,
          vendedorId,
          cajaId,
          items: {
            create: itemsProcesados
          }
        },
        include: { items: { include: { producto: true } } }
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

    return venta;
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