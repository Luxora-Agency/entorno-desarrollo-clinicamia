const prisma = require('../../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../../utils/errors');

class EquipoInfraestructuraService {
  /**
   * Crear equipo de infraestructura
   */
  async create(data, userId) {
    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    // Verificar código único
    const existing = await prisma.equipoInfraestructura.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      throw new ValidationError(`Ya existe un equipo con el código ${data.codigo}`);
    }

    return prisma.equipoInfraestructura.create({
      data: {
        ...data,
        registradoPor: userId,
      },
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });
  }

  /**
   * Obtener todos los equipos con filtros
   */
  async findAll(filters = {}) {
    const where = { activo: true };

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.ubicacion) {
      where.ubicacion = {
        contains: filters.ubicacion,
        mode: 'insensitive',
      };
    }

    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { codigo: { contains: filters.search, mode: 'insensitive' } },
        { marca: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [equipos, total] = await Promise.all([
      prisma.equipoInfraestructura.findMany({
        where,
        include: {
          registrador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          mantenimientos: {
            where: { activo: true },
            orderBy: { fechaProgramada: 'desc' },
            take: 5,
            select: {
              id: true,
              tipoMantenimiento: true,
              fechaProgramada: true,
              fechaRealizada: true,
              estado: true,
            },
          },
          _count: {
            select: {
              mantenimientos: true,
              cronogramas: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(filters.limit) || 50,
      }),
      prisma.equipoInfraestructura.count({ where }),
    ]);

    return { equipos, total };
  }

  /**
   * Obtener equipo por ID
   */
  async findById(id) {
    const equipo = await prisma.equipoInfraestructura.findUnique({
      where: { id },
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        mantenimientos: {
          where: { activo: true },
          orderBy: { fechaProgramada: 'desc' },
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
        },
        cronogramas: {
          where: { activo: true },
          orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
        },
        _count: {
          select: {
            mantenimientos: true,
            cronogramas: true,
          },
        },
      },
    });

    if (!equipo) {
      throw new NotFoundError('Equipo no encontrado');
    }

    return equipo;
  }

  /**
   * Actualizar equipo
   */
  async update(id, data) {
    await this.findById(id);

    // Si cambia el código, verificar que no exista
    if (data.codigo) {
      const existing = await prisma.equipoInfraestructura.findFirst({
        where: {
          codigo: data.codigo,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ValidationError(`Ya existe un equipo con el código ${data.codigo}`);
      }
    }

    return prisma.equipoInfraestructura.update({
      where: { id },
      data,
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        _count: {
          select: {
            mantenimientos: true,
            cronogramas: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar equipo (soft delete)
   */
  async delete(id) {
    await this.findById(id);

    return prisma.equipoInfraestructura.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Obtener equipos por tipo
   */
  async findByTipo(tipo) {
    return prisma.equipoInfraestructura.findMany({
      where: {
        tipo,
        activo: true,
      },
      include: {
        _count: {
          select: {
            mantenimientos: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Obtener estadísticas de equipos
   */
  async getEstadisticas() {
    const [total, porTipo, porEstado, proximosMantenimientos] = await Promise.all([
      prisma.equipoInfraestructura.count({ where: { activo: true } }),
      prisma.equipoInfraestructura.groupBy({
        by: ['tipo'],
        where: { activo: true },
        _count: true,
      }),
      prisma.equipoInfraestructura.groupBy({
        by: ['estado'],
        where: { activo: true },
        _count: true,
      }),
      prisma.mantenimientoInfraestructura.findMany({
        where: {
          activo: true,
          estado: 'PROGRAMADO',
          fechaProgramada: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Próximos 30 días
          },
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
        },
        orderBy: { fechaProgramada: 'asc' },
        take: 10,
      }),
    ]);

    return {
      total,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {}),
      proximosMantenimientos,
    };
  }

  /**
   * Cambiar estado de equipo
   */
  async cambiarEstado(id, nuevoEstado, observaciones = null) {
    await this.findById(id);

    const validEstados = ['ACTIVO', 'INACTIVO', 'MANTENIMIENTO', 'FUERA_SERVICIO'];
    if (!validEstados.includes(nuevoEstado)) {
      throw new ValidationError(`Estado inválido: ${nuevoEstado}`);
    }

    return prisma.equipoInfraestructura.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        observaciones,
      },
    });
  }

  /**
   * Actualizar fecha de última inspección
   */
  async actualizarUltimaInspeccion(id, fecha = new Date()) {
    return prisma.equipoInfraestructura.update({
      where: { id },
      data: {
        fechaUltimaInspeccion: fecha,
      },
    });
  }
}

module.exports = new EquipoInfraestructuraService();
