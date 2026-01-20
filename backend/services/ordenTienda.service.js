/**
 * Servicio de Órdenes de Tienda
 * Maneja la lógica de negocio para órdenes del e-commerce
 */

const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class OrdenTiendaService {
  /**
   * Obtener todas las órdenes con filtros y paginación
   */
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      estado,
      search,
      fechaDesde,
      fechaHasta,
    } = filters;

    const where = {};

    // Filtro por estado
    if (estado) {
      where.estado = estado;
    }

    // Filtro por búsqueda
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { nombreCliente: { contains: search, mode: 'insensitive' } },
        { apellidoCliente: { contains: search, mode: 'insensitive' } },
        { emailCliente: { contains: search, mode: 'insensitive' } },
        { documento: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por fechas
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
      if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
    }

    const [ordenes, total] = await Promise.all([
      prisma.ordenTienda.findMany({
        where,
        include: {
          items: {
            include: {
              producto: {
                select: { id: true, nombre: true, imagenUrl: true },
              },
            },
          },
          paciente: {
            select: { id: true, nombre: true, apellido: true },
          },
          paymentSession: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ordenTienda.count({ where }),
    ]);

    return {
      data: ordenes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener estadísticas de órdenes
   */
  async getStats() {
    const [
      total,
      pendientes,
      pagadas,
      procesando,
      enviadas,
      entregadas,
      canceladas,
      ventasHoy,
      ventasMes,
    ] = await Promise.all([
      prisma.ordenTienda.count(),
      prisma.ordenTienda.count({ where: { estado: 'PendientePago' } }),
      prisma.ordenTienda.count({ where: { estado: 'Pagada' } }),
      prisma.ordenTienda.count({ where: { estado: 'Procesando' } }),
      prisma.ordenTienda.count({ where: { estado: 'Enviada' } }),
      prisma.ordenTienda.count({ where: { estado: 'Entregada' } }),
      prisma.ordenTienda.count({ where: { estado: 'Cancelada' } }),
      prisma.ordenTienda.aggregate({
        where: {
          estado: { in: ['Pagada', 'Procesando', 'Enviada', 'Entregada'] },
          fechaPago: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        _sum: { total: true },
      }),
      prisma.ordenTienda.aggregate({
        where: {
          estado: { in: ['Pagada', 'Procesando', 'Enviada', 'Entregada'] },
          fechaPago: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      total,
      porEstado: {
        pendientes,
        pagadas,
        procesando,
        enviadas,
        entregadas,
        canceladas,
      },
      ventas: {
        hoy: parseFloat(ventasHoy._sum.total || 0),
        mes: parseFloat(ventasMes._sum.total || 0),
      },
    };
  }

  /**
   * Obtener una orden por ID
   */
  async getById(id) {
    const orden = await prisma.ordenTienda.findFirst({
      where: {
        OR: [{ id }, { numero: id }],
      },
      include: {
        items: {
          include: {
            producto: {
              select: { id: true, nombre: true, imagenUrl: true, sku: true },
            },
          },
        },
        paciente: true,
        paymentSession: true,
      },
    });

    if (!orden) {
      throw new NotFoundError('Orden no encontrada');
    }

    return orden;
  }

  /**
   * Actualizar estado de una orden
   */
  async updateEstado(id, nuevoEstado, datos = {}) {
    const orden = await this.getById(id);

    // Validar transiciones de estado
    const transicionesValidas = {
      'PendientePago': ['Pagada', 'Cancelada'],
      'Pagada': ['Procesando', 'Cancelada', 'Reembolsada'],
      'Procesando': ['Enviada', 'Cancelada', 'Reembolsada'],
      'Enviada': ['Entregada', 'Reembolsada'],
      'Entregada': ['Reembolsada'],
      'Cancelada': [],
      'Reembolsada': [],
    };

    const transicionesPermitidas = transicionesValidas[orden.estado] || [];
    if (!transicionesPermitidas.includes(nuevoEstado)) {
      throw new ValidationError(
        `No se puede cambiar de "${orden.estado}" a "${nuevoEstado}"`
      );
    }

    const updateData = {
      estado: nuevoEstado,
      ...datos,
    };

    // Agregar fecha según el estado
    if (nuevoEstado === 'Pagada' && !orden.fechaPago) {
      updateData.fechaPago = new Date();
    }
    if (nuevoEstado === 'Enviada') {
      updateData.fechaEnvio = new Date();
    }
    if (nuevoEstado === 'Entregada') {
      updateData.fechaEntrega = new Date();
    }

    const ordenActualizada = await prisma.ordenTienda.update({
      where: { id: orden.id },
      data: updateData,
      include: {
        items: true,
        paymentSession: true,
      },
    });

    return ordenActualizada;
  }

  /**
   * Agregar información de envío
   */
  async updateEnvio(id, datosEnvio) {
    const orden = await this.getById(id);

    const { numeroGuia, transportadora, notasEnvio } = datosEnvio;

    const ordenActualizada = await prisma.ordenTienda.update({
      where: { id: orden.id },
      data: {
        numeroGuia,
        transportadora,
        notasEnvio,
      },
    });

    return ordenActualizada;
  }

  /**
   * Agregar notas internas
   */
  async addNotaInterna(id, nota) {
    const orden = await this.getById(id);

    const notasActuales = orden.notasInternas || '';
    const timestamp = new Date().toLocaleString('es-CO');
    const nuevaNota = `[${timestamp}] ${nota}`;
    const notasActualizadas = notasActuales
      ? `${notasActuales}\n${nuevaNota}`
      : nuevaNota;

    const ordenActualizada = await prisma.ordenTienda.update({
      where: { id: orden.id },
      data: { notasInternas: notasActualizadas },
    });

    return ordenActualizada;
  }

  /**
   * Cancelar orden y revertir inventario si es necesario
   */
  async cancelar(id, motivo) {
    const orden = await this.getById(id);

    if (['Entregada', 'Cancelada', 'Reembolsada'].includes(orden.estado)) {
      throw new ValidationError(`No se puede cancelar una orden ${orden.estado}`);
    }

    // Si la orden estaba pagada, revertir inventario
    const revertirInventario = ['Pagada', 'Procesando', 'Enviada'].includes(orden.estado);

    await prisma.$transaction(async (tx) => {
      // Actualizar orden
      await tx.ordenTienda.update({
        where: { id: orden.id },
        data: {
          estado: 'Cancelada',
          notasInternas: orden.notasInternas
            ? `${orden.notasInternas}\n[${new Date().toLocaleString('es-CO')}] CANCELADA: ${motivo}`
            : `[${new Date().toLocaleString('es-CO')}] CANCELADA: ${motivo}`,
        },
      });

      // Revertir inventario si corresponde
      if (revertirInventario) {
        for (const item of orden.items) {
          await tx.producto.update({
            where: { id: item.productoId },
            data: {
              cantidadConsumida: { decrement: item.cantidad },
            },
          });
        }
      }
    });

    return this.getById(id);
  }
}

module.exports = new OrdenTiendaService();
