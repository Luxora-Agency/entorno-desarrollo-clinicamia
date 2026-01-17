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
          responsable: {
            select: { id: true, nombre: true, apellido: true },
          },
          historial: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Solo el último cambio para el listado
          },
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
   * Obtener una orden por ID con todo su historial
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
              select: { id: true, nombre: true, imagenUrl: true, sku: true, precioVenta: true },
            },
          },
        },
        paciente: true,
        paymentSession: true,
        responsable: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        historial: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            estadoAnterior: true,
            estadoNuevo: true,
            nombreUsuario: true,
            comentario: true,
            detalleEnvio: true,
            numeroGuia: true,
            transportadora: true,
            createdAt: true,
          },
        },
      },
    });

    if (!orden) {
      throw new NotFoundError('Orden no encontrada');
    }

    return orden;
  }

  /**
   * Obtener historial de una orden (para cliente - sin nombres de usuarios)
   */
  async getHistorialPublico(id) {
    const orden = await prisma.ordenTienda.findFirst({
      where: {
        OR: [{ id }, { numero: id }],
      },
      select: {
        id: true,
        numero: true,
        estado: true,
        historial: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            estadoAnterior: true,
            estadoNuevo: true,
            detalleEnvio: true,
            numeroGuia: true,
            transportadora: true,
            createdAt: true,
            // NO incluye nombreUsuario ni comentario para el público
          },
        },
      },
    });

    if (!orden) {
      throw new NotFoundError('Orden no encontrada');
    }

    return orden;
  }

  /**
   * Actualizar estado de una orden con tracking de usuario
   */
  async updateEstado(id, nuevoEstado, usuario, datos = {}) {
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

    const { comentario, numeroGuia, transportadora, detalleEnvio, ipAddress, ...restoDatos } = datos;

    const updateData = {
      estado: nuevoEstado,
      responsableId: usuario.id,
      ...restoDatos,
    };

    // Agregar fecha según el estado
    if (nuevoEstado === 'Pagada' && !orden.fechaPago) {
      updateData.fechaPago = new Date();
    }
    if (nuevoEstado === 'Enviada') {
      updateData.fechaEnvio = new Date();
      if (numeroGuia) updateData.numeroGuia = numeroGuia;
      if (transportadora) updateData.transportadora = transportadora;
    }
    if (nuevoEstado === 'Entregada') {
      updateData.fechaEntrega = new Date();
    }

    // Crear historial y actualizar orden en una transacción
    const [ordenActualizada] = await prisma.$transaction([
      prisma.ordenTienda.update({
        where: { id: orden.id },
        data: updateData,
        include: {
          items: true,
          paymentSession: true,
          historial: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.ordenTiendaHistorial.create({
        data: {
          ordenId: orden.id,
          estadoAnterior: orden.estado,
          estadoNuevo: nuevoEstado,
          usuarioId: usuario.id,
          nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
          comentario: comentario || null,
          detalleEnvio: detalleEnvio || null,
          numeroGuia: nuevoEstado === 'Enviada' ? numeroGuia : null,
          transportadora: nuevoEstado === 'Enviada' ? transportadora : null,
          ipAddress: ipAddress || null,
        },
      }),
    ]);

    return ordenActualizada;
  }

  /**
   * Agregar información de envío con tracking
   */
  async updateEnvio(id, datosEnvio, usuario) {
    const orden = await this.getById(id);

    const { numeroGuia, transportadora, notasEnvio, comentario, ipAddress } = datosEnvio;

    // Actualizar orden y crear registro en historial
    const [ordenActualizada] = await prisma.$transaction([
      prisma.ordenTienda.update({
        where: { id: orden.id },
        data: {
          numeroGuia,
          transportadora,
          notasEnvio,
          responsableId: usuario.id,
        },
      }),
      prisma.ordenTiendaHistorial.create({
        data: {
          ordenId: orden.id,
          estadoAnterior: orden.estado,
          estadoNuevo: orden.estado, // Mismo estado
          usuarioId: usuario.id,
          nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
          comentario: comentario || 'Actualización de información de envío',
          detalleEnvio: notasEnvio || null,
          numeroGuia: numeroGuia || null,
          transportadora: transportadora || null,
          ipAddress: ipAddress || null,
        },
      }),
    ]);

    return ordenActualizada;
  }

  /**
   * Agregar notas internas con tracking
   */
  async addNotaInterna(id, nota, usuario) {
    const orden = await this.getById(id);

    const notasActuales = orden.notasInternas || '';
    const timestamp = new Date().toLocaleString('es-CO');
    const nuevaNota = `[${timestamp} - ${usuario.nombre} ${usuario.apellido}] ${nota}`;
    const notasActualizadas = notasActuales
      ? `${notasActuales}\n${nuevaNota}`
      : nuevaNota;

    const ordenActualizada = await prisma.ordenTienda.update({
      where: { id: orden.id },
      data: {
        notasInternas: notasActualizadas,
        responsableId: usuario.id,
      },
    });

    return ordenActualizada;
  }

  /**
   * Cancelar orden y revertir inventario si es necesario
   */
  async cancelar(id, motivo, usuario) {
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
          responsableId: usuario.id,
          notasInternas: orden.notasInternas
            ? `${orden.notasInternas}\n[${new Date().toLocaleString('es-CO')} - ${usuario.nombre} ${usuario.apellido}] CANCELADA: ${motivo}`
            : `[${new Date().toLocaleString('es-CO')} - ${usuario.nombre} ${usuario.apellido}] CANCELADA: ${motivo}`,
        },
      });

      // Crear historial de cancelación
      await tx.ordenTiendaHistorial.create({
        data: {
          ordenId: orden.id,
          estadoAnterior: orden.estado,
          estadoNuevo: 'Cancelada',
          usuarioId: usuario.id,
          nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
          comentario: `Orden cancelada: ${motivo}`,
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

  /**
   * Marcar como procesando y descontar stock
   */
  async marcarProcesando(id, usuario, comentario) {
    const orden = await this.getById(id);

    if (orden.estado !== 'Pagada') {
      throw new ValidationError('Solo se pueden procesar órdenes pagadas');
    }

    await prisma.$transaction(async (tx) => {
      // Actualizar orden
      await tx.ordenTienda.update({
        where: { id: orden.id },
        data: {
          estado: 'Procesando',
          responsableId: usuario.id,
        },
      });

      // Crear historial
      await tx.ordenTiendaHistorial.create({
        data: {
          ordenId: orden.id,
          estadoAnterior: 'Pagada',
          estadoNuevo: 'Procesando',
          usuarioId: usuario.id,
          nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
          comentario: comentario || 'Orden en proceso de preparación',
        },
      });

      // Descontar stock
      for (const item of orden.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            cantidadConsumida: { increment: item.cantidad },
          },
        });
      }
    });

    return this.getById(id);
  }

  /**
   * Marcar como enviado
   */
  async marcarEnviado(id, usuario, datosEnvio) {
    const { numeroGuia, transportadora, detalleEnvio, comentario } = datosEnvio;

    return this.updateEstado(id, 'Enviada', usuario, {
      numeroGuia,
      transportadora,
      detalleEnvio,
      comentario: comentario || `Enviado por ${transportadora || 'mensajería'} - Guía: ${numeroGuia || 'N/A'}`,
    });
  }

  /**
   * Marcar como entregado
   */
  async marcarEntregado(id, usuario, comentario) {
    return this.updateEstado(id, 'Entregada', usuario, {
      comentario: comentario || 'Pedido entregado al cliente',
    });
  }
}

module.exports = new OrdenTiendaService();
