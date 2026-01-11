const prisma = require('../../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../../utils/errors');

class MantenimientoInfraestructuraService {
  /**
   * Crear mantenimiento
   */
  async create(data, userId) {
    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    // Verificar que el equipo existe
    const equipo = await prisma.equipoInfraestructura.findUnique({
      where: { id: data.equipoId },
    });

    if (!equipo) {
      throw new NotFoundError('Equipo no encontrado');
    }

    // Calcular costo total si no viene
    const costoTotal = data.costoTotal ||
      (parseFloat(data.costoMateriales || 0) + parseFloat(data.costoManoObra || 0));

    return prisma.mantenimientoInfraestructura.create({
      data: {
        ...data,
        costoTotal,
        registradoPor: userId,
        equipo: { connect: { id: data.equipoId } },
      },
      include: {
        equipo: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            codigo: true,
          },
        },
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        documentos: true,
      },
    });
  }

  /**
   * Obtener todos los mantenimientos con filtros
   */
  async findAll(filters = {}) {
    const where = { activo: true };

    if (filters.equipoId) {
      where.equipoId = filters.equipoId;
    }

    if (filters.tipoMantenimiento) {
      where.tipoMantenimiento = filters.tipoMantenimiento;
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.empresaMantenimiento) {
      where.empresaMantenimiento = {
        contains: filters.empresaMantenimiento,
        mode: 'insensitive',
      };
    }

    if (filters.fechaDesde) {
      where.fechaProgramada = {
        ...where.fechaProgramada,
        gte: new Date(filters.fechaDesde),
      };
    }

    if (filters.fechaHasta) {
      where.fechaProgramada = {
        ...where.fechaProgramada,
        lte: new Date(filters.fechaHasta),
      };
    }

    const [mantenimientos, total] = await Promise.all([
      prisma.mantenimientoInfraestructura.findMany({
        where,
        include: {
          equipo: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              codigo: true,
              ubicacion: true,
            },
          },
          registrador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          documentos: {
            select: {
              id: true,
              nombre: true,
              tipoDocumento: true,
              archivoUrl: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              documentos: true,
            },
          },
        },
        orderBy: { fechaProgramada: 'desc' },
        take: parseInt(filters.limit) || 50,
      }),
      prisma.mantenimientoInfraestructura.count({ where }),
    ]);

    return { mantenimientos, total };
  }

  /**
   * Obtener mantenimiento por ID
   */
  async findById(id) {
    const mantenimiento = await prisma.mantenimientoInfraestructura.findUnique({
      where: { id },
      include: {
        equipo: true,
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        documentos: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!mantenimiento) {
      throw new NotFoundError('Mantenimiento no encontrado');
    }

    return mantenimiento;
  }

  /**
   * Actualizar mantenimiento
   */
  async update(id, data) {
    await this.findById(id);

    // Recalcular costo total si cambiaron los valores
    if (data.costoMateriales !== undefined || data.costoManoObra !== undefined) {
      const mantenimiento = await prisma.mantenimientoInfraestructura.findUnique({
        where: { id },
      });

      const nuevoMateriales = data.costoMateriales ?? mantenimiento.costoMateriales;
      const nuevoManoObra = data.costoManoObra ?? mantenimiento.costoManoObra;
      data.costoTotal = parseFloat(nuevoMateriales) + parseFloat(nuevoManoObra);
    }

    return prisma.mantenimientoInfraestructura.update({
      where: { id },
      data,
      include: {
        equipo: true,
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        documentos: true,
      },
    });
  }

  /**
   * Eliminar mantenimiento (soft delete)
   */
  async delete(id) {
    await this.findById(id);

    return prisma.mantenimientoInfraestructura.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Completar mantenimiento
   */
  async completar(id, data) {
    const mantenimiento = await this.findById(id);

    if (mantenimiento.estado === 'COMPLETADO') {
      throw new ValidationError('El mantenimiento ya está completado');
    }

    const updateData = {
      estado: 'COMPLETADO',
      fechaRealizada: data.fechaRealizada || new Date(),
      actividadesRealizadas: data.actividadesRealizadas,
      estadoPosterior: data.estadoPosterior,
      hallazgos: data.hallazgos,
      recomendaciones: data.recomendaciones,
      proximoMantenimiento: data.proximoMantenimiento,
    };

    // Actualizar fecha de última inspección del equipo
    await prisma.equipoInfraestructura.update({
      where: { id: mantenimiento.equipoId },
      data: {
        fechaUltimaInspeccion: updateData.fechaRealizada,
      },
    });

    return this.update(id, updateData);
  }

  /**
   * Cancelar mantenimiento
   */
  async cancelar(id, motivo) {
    const mantenimiento = await this.findById(id);

    if (mantenimiento.estado === 'COMPLETADO') {
      throw new ValidationError('No se puede cancelar un mantenimiento completado');
    }

    return this.update(id, {
      estado: 'CANCELADO',
      observaciones: motivo,
    });
  }

  /**
   * Obtener timeline de mantenimientos de un equipo
   */
  async getTimelineEquipo(equipoId) {
    const equipo = await prisma.equipoInfraestructura.findUnique({
      where: { id: equipoId },
    });

    if (!equipo) {
      throw new NotFoundError('Equipo no encontrado');
    }

    const mantenimientos = await prisma.mantenimientoInfraestructura.findMany({
      where: {
        equipoId,
        activo: true,
      },
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        documentos: {
          select: {
            id: true,
            nombre: true,
            tipoDocumento: true,
            archivoUrl: true,
          },
        },
      },
      orderBy: { fechaProgramada: 'desc' },
    });

    return {
      equipo,
      mantenimientos,
      total: mantenimientos.length,
    };
  }

  /**
   * Obtener estadísticas de mantenimientos
   */
  async getEstadisticas(filters = {}) {
    const where = { activo: true };

    if (filters.anio) {
      const anio = parseInt(filters.anio);
      where.fechaProgramada = {
        gte: new Date(`${anio}-01-01`),
        lte: new Date(`${anio}-12-31`),
      };
    }

    const [
      total,
      porTipo,
      porEstado,
      completados,
      pendientes,
      costoTotal,
    ] = await Promise.all([
      prisma.mantenimientoInfraestructura.count({ where }),
      prisma.mantenimientoInfraestructura.groupBy({
        by: ['tipoMantenimiento'],
        where,
        _count: true,
      }),
      prisma.mantenimientoInfraestructura.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.mantenimientoInfraestructura.count({
        where: { ...where, estado: 'COMPLETADO' },
      }),
      prisma.mantenimientoInfraestructura.count({
        where: { ...where, estado: 'PROGRAMADO' },
      }),
      prisma.mantenimientoInfraestructura.aggregate({
        where: { ...where, estado: 'COMPLETADO' },
        _sum: {
          costoTotal: true,
        },
      }),
    ]);

    return {
      total,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipoMantenimiento] = item._count;
        return acc;
      }, {}),
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {}),
      completados,
      pendientes,
      costoTotal: costoTotal._sum.costoTotal || 0,
    };
  }

  /**
   * Obtener próximos mantenimientos (30 días)
   */
  async getProximos(limit = 10) {
    const hoy = new Date();
    const enTreintaDias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return prisma.mantenimientoInfraestructura.findMany({
      where: {
        activo: true,
        estado: 'PROGRAMADO',
        fechaProgramada: {
          gte: hoy,
          lte: enTreintaDias,
        },
      },
      include: {
        equipo: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            codigo: true,
            ubicacion: true,
          },
        },
      },
      orderBy: { fechaProgramada: 'asc' },
      take: limit,
    });
  }
}

module.exports = new MantenimientoInfraestructuraService();
