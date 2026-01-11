/**
 * Servicio de Órdenes de Compra
 *
 * Gestión completa del ciclo de compras: creación de OC,
 * aprobación, recepción de mercancía, y actualización de inventario.
 */

const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class OrdenCompraService {
  /**
   * Obtener todas las órdenes de compra con filtros
   */
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      estado,
      proveedorId,
      fechaDesde,
      fechaHasta,
      orderBy = 'createdAt',
      order = 'desc'
    } = filters;

    const where = {};

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { proveedor: { razonSocial: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (estado) {
      where.estado = estado;
    }

    if (proveedorId) {
      where.proveedorId = proveedorId;
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }

    const [ordenes, total] = await Promise.all([
      prisma.ordenCompra.findMany({
        where,
        include: {
          proveedor: {
            select: { id: true, razonSocial: true, documento: true }
          },
          items: {
            select: { id: true, descripcion: true, cantidad: true, cantidadRecibida: true }
          },
          _count: {
            select: { items: true, recepciones: true }
          }
        },
        orderBy: { [orderBy]: order },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.ordenCompra.count({ where })
    ]);

    return {
      data: ordenes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener orden de compra por ID
   */
  async getById(id) {
    const orden = await prisma.ordenCompra.findUnique({
      where: { id },
      include: {
        proveedor: true,
        items: {
          include: {
            producto: {
              select: { id: true, nombre: true, sku: true }
            }
          }
        },
        recepciones: {
          include: {
            items: true
          },
          orderBy: { createdAt: 'desc' }
        },
        facturas: {
          select: { id: true, numero: true, total: true, estado: true }
        }
      }
    });

    if (!orden) {
      throw new NotFoundError(`Orden de compra ${id} no encontrada`);
    }

    return orden;
  }

  /**
   * Crear nueva orden de compra
   */
  async create(data) {
    const numero = await this.getNextNumber();

    // Validar proveedor
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: data.proveedorId }
    });

    if (!proveedor) {
      throw new ValidationError('Proveedor no encontrado');
    }

    if (!proveedor.activo) {
      throw new ValidationError('El proveedor no está activo');
    }

    // Calcular totales
    const totales = this.calculateTotals(data.items);

    const orden = await prisma.ordenCompra.create({
      data: {
        numero,
        proveedorId: data.proveedorId,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        fechaEntregaEsperada: data.fechaEntregaEsperada ? new Date(data.fechaEntregaEsperada) : null,
        subtotal: totales.subtotal,
        descuento: totales.descuento,
        iva: totales.iva,
        retencionFuente: totales.retencionFuente,
        retencionICA: totales.retencionICA,
        total: totales.total,
        estado: 'Borrador',
        departamentoId: data.departamentoId,
        centroCostoId: data.centroCostoId,
        solicitadoPor: data.solicitadoPor,
        observaciones: data.observaciones,
        items: {
          create: data.items.map(item => ({
            productoId: item.productoId || null,
            descripcion: item.descripcion,
            cantidad: parseInt(item.cantidad),
            cantidadRecibida: 0,
            precioUnitario: parseFloat(item.precioUnitario),
            descuento: parseFloat(item.descuento || 0),
            porcentajeIva: parseFloat(item.porcentajeIva || 0),
            subtotal: parseFloat(item.cantidad) * parseFloat(item.precioUnitario) - parseFloat(item.descuento || 0),
            lote: item.lote,
            fechaVencimiento: item.fechaVencimiento ? new Date(item.fechaVencimiento) : null
          }))
        }
      },
      include: {
        proveedor: true,
        items: true
      }
    });

    return orden;
  }

  /**
   * Actualizar orden de compra
   */
  async update(id, data) {
    const orden = await this.getById(id);

    // Solo se puede editar si está en borrador
    if (orden.estado !== 'Borrador') {
      throw new ValidationError('Solo se pueden editar órdenes en estado Borrador');
    }

    // Recalcular totales si hay items
    let totales = {};
    if (data.items) {
      totales = this.calculateTotals(data.items);
    }

    // Eliminar items existentes si se proporcionan nuevos
    if (data.items) {
      await prisma.ordenCompraItem.deleteMany({
        where: { ordenCompraId: id }
      });
    }

    const updated = await prisma.ordenCompra.update({
      where: { id },
      data: {
        proveedorId: data.proveedorId,
        fechaEntregaEsperada: data.fechaEntregaEsperada ? new Date(data.fechaEntregaEsperada) : undefined,
        departamentoId: data.departamentoId,
        centroCostoId: data.centroCostoId,
        observaciones: data.observaciones,
        ...(data.items && {
          subtotal: totales.subtotal,
          descuento: totales.descuento,
          iva: totales.iva,
          retencionFuente: totales.retencionFuente,
          retencionICA: totales.retencionICA,
          total: totales.total,
          items: {
            create: data.items.map(item => ({
              productoId: item.productoId || null,
              descripcion: item.descripcion,
              cantidad: parseInt(item.cantidad),
              cantidadRecibida: 0,
              precioUnitario: parseFloat(item.precioUnitario),
              descuento: parseFloat(item.descuento || 0),
              porcentajeIva: parseFloat(item.porcentajeIva || 0),
              subtotal: parseFloat(item.cantidad) * parseFloat(item.precioUnitario) - parseFloat(item.descuento || 0),
              lote: item.lote,
              fechaVencimiento: item.fechaVencimiento ? new Date(item.fechaVencimiento) : null
            }))
          }
        })
      },
      include: {
        proveedor: true,
        items: true
      }
    });

    return updated;
  }

  /**
   * Aprobar orden de compra
   */
  async aprobar(id, aprobadorId) {
    const orden = await this.getById(id);

    if (orden.estado !== 'Borrador') {
      throw new ValidationError(`No se puede aprobar una orden en estado ${orden.estado}`);
    }

    if (orden.items.length === 0) {
      throw new ValidationError('No se puede aprobar una orden sin items');
    }

    return prisma.ordenCompra.update({
      where: { id },
      data: {
        estado: 'Enviada',
        aprobadoPor: aprobadorId,
        fechaAprobacion: new Date()
      },
      include: {
        proveedor: true,
        items: true
      }
    });
  }

  /**
   * Cancelar orden de compra
   */
  async cancelar(id, motivo) {
    const orden = await this.getById(id);

    if (['Recibida', 'Cancelada'].includes(orden.estado)) {
      throw new ValidationError(`No se puede cancelar una orden en estado ${orden.estado}`);
    }

    // Verificar si tiene recepciones
    if (orden.recepciones && orden.recepciones.length > 0) {
      throw new ValidationError('No se puede cancelar una orden con recepciones de mercancía');
    }

    return prisma.ordenCompra.update({
      where: { id },
      data: {
        estado: 'Cancelada',
        observaciones: orden.observaciones
          ? `${orden.observaciones}\n\nCancelada: ${motivo}`
          : `Cancelada: ${motivo}`
      }
    });
  }

  /**
   * Registrar recepción de mercancía
   */
  async registrarRecepcion(ordenId, data, usuarioId) {
    const orden = await this.getById(ordenId);

    if (!['Enviada', 'Parcial'].includes(orden.estado)) {
      throw new ValidationError(`No se puede registrar recepción para orden en estado ${orden.estado}`);
    }

    // Validar que los items correspondan a la orden
    for (const item of data.items) {
      const ordenItem = orden.items.find(i => i.id === item.ordenCompraItemId);
      if (!ordenItem) {
        throw new ValidationError(`Item ${item.ordenCompraItemId} no pertenece a esta orden`);
      }

      const pendiente = ordenItem.cantidad - ordenItem.cantidadRecibida;
      if (item.cantidadRecibida > pendiente) {
        throw new ValidationError(
          `La cantidad a recibir (${item.cantidadRecibida}) excede la pendiente (${pendiente}) para ${ordenItem.descripcion}`
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Generar número de recepción
      const numeroRecepcion = await this.getNextRecepcionNumber();

      // Crear recepción
      const recepcion = await tx.recepcionMercancia.create({
        data: {
          numero: numeroRecepcion,
          ordenCompraId: ordenId,
          fecha: data.fecha ? new Date(data.fecha) : new Date(),
          recibidoPor: usuarioId,
          observaciones: data.observaciones,
          estado: 'Pendiente',
          items: {
            create: data.items.map(item => ({
              ordenCompraItemId: item.ordenCompraItemId,
              cantidadRecibida: parseInt(item.cantidadRecibida),
              cantidadRechazada: parseInt(item.cantidadRechazada || 0),
              motivoRechazo: item.motivoRechazo,
              lote: item.lote,
              fechaVencimiento: item.fechaVencimiento ? new Date(item.fechaVencimiento) : null,
              ubicacionBodega: item.ubicacionBodega
            }))
          }
        },
        include: { items: true }
      });

      // Actualizar cantidades recibidas en cada item de la OC
      for (const item of data.items) {
        await tx.ordenCompraItem.update({
          where: { id: item.ordenCompraItemId },
          data: {
            cantidadRecibida: { increment: parseInt(item.cantidadRecibida) },
            lote: item.lote || undefined,
            fechaVencimiento: item.fechaVencimiento ? new Date(item.fechaVencimiento) : undefined
          }
        });

        // Actualizar inventario si es un producto
        const ordenItem = orden.items.find(i => i.id === item.ordenCompraItemId);
        if (ordenItem?.productoId && item.cantidadRecibida > 0) {
          await tx.producto.update({
            where: { id: ordenItem.productoId },
            data: {
              cantidadTotal: { increment: parseInt(item.cantidadRecibida) },
              lote: item.lote || undefined,
              fechaVencimiento: item.fechaVencimiento ? new Date(item.fechaVencimiento) : undefined
            }
          });
        }
      }

      // Actualizar estado de la orden
      const ordenActualizada = await tx.ordenCompra.findUnique({
        where: { id: ordenId },
        include: { items: true }
      });

      const todosRecibidos = ordenActualizada.items.every(
        item => item.cantidadRecibida >= item.cantidad
      );

      const algunoRecibido = ordenActualizada.items.some(
        item => item.cantidadRecibida > 0
      );

      let nuevoEstado = orden.estado;
      if (todosRecibidos) {
        nuevoEstado = 'Recibida';
      } else if (algunoRecibido) {
        nuevoEstado = 'Parcial';
      }

      if (nuevoEstado !== orden.estado) {
        await tx.ordenCompra.update({
          where: { id: ordenId },
          data: {
            estado: nuevoEstado,
            fechaRecepcion: todosRecibidos ? new Date() : null
          }
        });
      }

      return recepcion;
    });

    return result;
  }

  /**
   * Aprobar recepción de mercancía
   */
  async aprobarRecepcion(recepcionId, aprobadorId) {
    const recepcion = await prisma.recepcionMercancia.findUnique({
      where: { id: recepcionId }
    });

    if (!recepcion) {
      throw new NotFoundError('Recepción no encontrada');
    }

    if (recepcion.estado !== 'Pendiente') {
      throw new ValidationError('La recepción ya fue procesada');
    }

    return prisma.recepcionMercancia.update({
      where: { id: recepcionId },
      data: {
        estado: 'Aprobada'
      }
    });
  }

  /**
   * Calcular totales de la orden
   */
  calculateTotals(items) {
    let subtotal = 0;
    let descuento = 0;
    let iva = 0;

    for (const item of items) {
      const itemSubtotal = parseFloat(item.cantidad) * parseFloat(item.precioUnitario);
      const itemDescuento = parseFloat(item.descuento || 0);
      const itemBase = itemSubtotal - itemDescuento;
      const itemIva = itemBase * (parseFloat(item.porcentajeIva || 0) / 100);

      subtotal += itemSubtotal;
      descuento += itemDescuento;
      iva += itemIva;
    }

    // Calcular retenciones (si aplica)
    const baseGravable = subtotal - descuento;
    const retencionFuente = baseGravable > 1344000 ? baseGravable * 0.025 : 0; // 2.5% compras > 27 UVT
    const retencionICA = baseGravable > 1344000 ? baseGravable * 0.00966 : 0; // Bogotá 9.66 x mil

    const total = subtotal - descuento + iva - retencionFuente - retencionICA;

    return {
      subtotal,
      descuento,
      iva,
      retencionFuente,
      retencionICA,
      total
    };
  }

  /**
   * Generar siguiente número de orden de compra
   */
  async getNextNumber() {
    const year = new Date().getFullYear();
    const lastOrder = await prisma.ordenCompra.findFirst({
      where: {
        numero: { startsWith: `OC-${year}` }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastOrder) {
      return `OC-${year}-00001`;
    }

    const parts = lastOrder.numero.split('-');
    const lastNumber = parseInt(parts[2]) || 0;
    return `OC-${year}-${String(lastNumber + 1).padStart(5, '0')}`;
  }

  /**
   * Generar siguiente número de recepción
   */
  async getNextRecepcionNumber() {
    const year = new Date().getFullYear();
    const lastRecepcion = await prisma.recepcionMercancia.findFirst({
      where: {
        numero: { startsWith: `RM-${year}` }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastRecepcion) {
      return `RM-${year}-00001`;
    }

    const parts = lastRecepcion.numero.split('-');
    const lastNumber = parseInt(parts[2]) || 0;
    return `RM-${year}-${String(lastNumber + 1).padStart(5, '0')}`;
  }

  /**
   * Estadísticas de órdenes de compra
   */
  async getStats(fechaDesde, fechaHasta) {
    const where = {};
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }

    const [
      total,
      porEstado,
      totalMonto,
      topProveedores
    ] = await Promise.all([
      prisma.ordenCompra.count({ where }),
      prisma.ordenCompra.groupBy({
        by: ['estado'],
        where,
        _count: { id: true }
      }),
      prisma.ordenCompra.aggregate({
        where: { ...where, estado: { not: 'Cancelada' } },
        _sum: { total: true }
      }),
      prisma.ordenCompra.groupBy({
        by: ['proveedorId'],
        where: { ...where, estado: { not: 'Cancelada' } },
        _sum: { total: true },
        _count: { id: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5
      })
    ]);

    // Enriquecer top proveedores con nombres
    const proveedorIds = topProveedores.map(p => p.proveedorId);
    const proveedores = await prisma.proveedor.findMany({
      where: { id: { in: proveedorIds } },
      select: { id: true, razonSocial: true }
    });

    const proveedoresMap = new Map(proveedores.map(p => [p.id, p.razonSocial]));

    return {
      total,
      porEstado: porEstado.map(e => ({
        estado: e.estado,
        cantidad: e._count.id
      })),
      totalMonto: totalMonto._sum.total || 0,
      topProveedores: topProveedores.map(p => ({
        proveedorId: p.proveedorId,
        proveedor: proveedoresMap.get(p.proveedorId),
        totalOrdenes: p._count.id,
        montoTotal: p._sum.total
      }))
    };
  }

  /**
   * Obtener órdenes pendientes de recepción
   */
  async getPendientesRecepcion() {
    return prisma.ordenCompra.findMany({
      where: {
        estado: { in: ['Enviada', 'Parcial'] }
      },
      include: {
        proveedor: {
          select: { razonSocial: true }
        },
        items: {
          select: {
            descripcion: true,
            cantidad: true,
            cantidadRecibida: true
          }
        }
      },
      orderBy: { fechaEntregaEsperada: 'asc' }
    });
  }

  /**
   * Obtener órdenes vencidas (fecha de entrega pasada)
   */
  async getOrdenesVencidas() {
    return prisma.ordenCompra.findMany({
      where: {
        estado: { in: ['Enviada', 'Parcial'] },
        fechaEntregaEsperada: { lt: new Date() }
      },
      include: {
        proveedor: {
          select: { razonSocial: true, telefono: true, email: true }
        }
      },
      orderBy: { fechaEntregaEsperada: 'asc' }
    });
  }

  /**
   * Eliminar orden de compra (solo borradores)
   */
  async delete(id) {
    const orden = await this.getById(id);

    if (orden.estado !== 'Borrador') {
      throw new ValidationError('Solo se pueden eliminar órdenes en estado Borrador');
    }

    // Eliminar items primero
    await prisma.ordenCompraItem.deleteMany({
      where: { ordenCompraId: id }
    });

    // Eliminar orden
    return prisma.ordenCompra.delete({
      where: { id }
    });
  }

  /**
   * Duplicar orden de compra
   */
  async duplicar(id, usuarioId) {
    const ordenOriginal = await this.getById(id);

    const nuevaOrden = await this.create({
      proveedorId: ordenOriginal.proveedorId,
      departamentoId: ordenOriginal.departamentoId,
      centroCostoId: ordenOriginal.centroCostoId,
      observaciones: `Duplicada de ${ordenOriginal.numero}`,
      solicitadoPor: usuarioId,
      items: ordenOriginal.items.map(item => ({
        productoId: item.productoId,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: parseFloat(item.precioUnitario),
        descuento: parseFloat(item.descuento),
        porcentajeIva: parseFloat(item.porcentajeIva)
      }))
    });

    return nuevaOrden;
  }
}

module.exports = new OrdenCompraService();
