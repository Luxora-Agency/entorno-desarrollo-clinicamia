const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class ComiteService {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      tipo = '',
      estado = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { activo: true };

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { resolucionNumero: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const [comites, total] = await Promise.all([
      prisma.comite.findMany({
        where,
        include: {
          creador: { select: { id: true, nombre: true, apellido: true } },
          presidenteUsuario: { select: { id: true, nombre: true, apellido: true } },
          secretarioUsuario: { select: { id: true, nombre: true, apellido: true } },
          miembros: {
            where: { activo: true, fechaRetiro: null },
            include: {
              usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
            },
          },
          _count: {
            select: {
              actas: true,
            },
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.comite.count({ where }),
    ]);

    return {
      data: comites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async findById(id) {
    const comite = await prisma.comite.findUnique({
      where: { id },
      include: {
        creador: { select: { id: true, nombre: true, apellido: true, email: true } },
        presidenteUsuario: { select: { id: true, nombre: true, apellido: true, email: true } },
        secretarioUsuario: { select: { id: true, nombre: true, apellido: true, email: true } },
        miembros: {
          where: { activo: true },
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true, email: true },
            },
          },
          orderBy: { fechaIngreso: 'desc' },
        },
        actas: {
          include: {
            elaborador: { select: { id: true, nombre: true, apellido: true } },
            _count: {
              select: { asistentes: true, anexos: true },
            },
          },
          orderBy: { fechaReunion: 'desc' },
          take: 10,
        },
      },
    });

    if (!comite || !comite.activo) {
      throw new NotFoundError('Comité no encontrado');
    }

    return comite;
  }

  async create(data, userId) {
    // Check if code already exists
    const existing = await prisma.comite.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      throw new ValidationError('Ya existe un comité con este código');
    }

    const comite = await prisma.comite.create({
      data: {
        ...data,
        creadoPor: userId,
        estado: data.estado || 'ACTIVO',
      },
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        presidenteUsuario: { select: { id: true, nombre: true, apellido: true } },
        secretarioUsuario: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return comite;
  }

  async update(id, data) {
    await this.findById(id);

    const updated = await prisma.comite.update({
      where: { id },
      data,
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        presidenteUsuario: { select: { id: true, nombre: true, apellido: true } },
        secretarioUsuario: { select: { id: true, nombre: true, apellido: true } },
        miembros: {
          where: { activo: true, fechaRetiro: null },
          include: {
            usuario: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
    });

    return updated;
  }

  async delete(id) {
    const existing = await this.findById(id);

    // Check if has active actas
    const actasCount = await prisma.actaComite.count({
      where: { comiteId: id, activo: true },
    });

    if (actasCount > 0) {
      throw new ValidationError(
        `No se puede eliminar un comité con ${actasCount} actas registradas`
      );
    }

    await prisma.comite.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Comité eliminado exitosamente' };
  }

  // Member management
  async addMiembro(comiteId, data) {
    await this.findById(comiteId);

    // Check if member already exists
    const existing = await prisma.miembroComite.findFirst({
      where: {
        comiteId,
        usuarioId: data.usuarioId,
        activo: true,
        fechaRetiro: null,
      },
    });

    if (existing) {
      throw new ValidationError('Este usuario ya es miembro del comité');
    }

    const miembro = await prisma.miembroComite.create({
      data: {
        comiteId,
        ...data,
      },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
      },
    });

    return miembro;
  }

  async removeMiembro(comiteId, miembroId) {
    const miembro = await prisma.miembroComite.findFirst({
      where: {
        id: miembroId,
        comiteId,
        activo: true,
      },
    });

    if (!miembro) {
      throw new NotFoundError('Miembro no encontrado');
    }

    const updated = await prisma.miembroComite.update({
      where: { id: miembroId },
      data: {
        fechaRetiro: new Date(),
        activo: false,
      },
    });

    return updated;
  }

  async getMiembros(comiteId) {
    await this.findById(comiteId);

    const miembros = await prisma.miembroComite.findMany({
      where: {
        comiteId,
        activo: true,
        fechaRetiro: null,
      },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
      },
      orderBy: { fechaIngreso: 'desc' },
    });

    return miembros;
  }

  // Cronograma management
  async getCronograma(comiteId, anio) {
    await this.findById(comiteId);

    const cronograma = await prisma.cronogramaComite.findMany({
      where: {
        comiteId,
        anio: parseInt(anio),
        activo: true,
      },
      include: {
        acta: {
          select: {
            id: true,
            numeroActa: true,
            aprobada: true,
          },
        },
      },
      orderBy: { mes: 'asc' },
    });

    return cronograma;
  }

  async createCronograma(comiteId, data) {
    await this.findById(comiteId);

    // Check if already exists for that month
    const existing = await prisma.cronogramaComite.findUnique({
      where: {
        comiteId_anio_mes: {
          comiteId,
          anio: data.anio,
          mes: data.mes,
        },
      },
    });

    if (existing) {
      throw new ValidationError('Ya existe un cronograma para ese mes');
    }

    const cronograma = await prisma.cronogramaComite.create({
      data: {
        comiteId,
        ...data,
      },
    });

    return cronograma;
  }

  async updateCronograma(id, data) {
    const cronograma = await prisma.cronogramaComite.update({
      where: { id },
      data,
    });

    return cronograma;
  }

  async getEstadisticas(filters = {}) {
    const { tipo } = filters;
    const whereBase = { activo: true };
    if (tipo) whereBase.tipo = tipo;

    const [
      total,
      porTipo,
      porEstado,
      activos,
      inactivos,
      totalMiembros,
      totalActas,
      actasPendientes,
    ] = await Promise.all([
      prisma.comite.count({ where: whereBase }),

      prisma.comite.groupBy({
        by: ['tipo'],
        where: whereBase,
        _count: true,
      }),

      prisma.comite.groupBy({
        by: ['estado'],
        where: whereBase,
        _count: true,
      }),

      prisma.comite.count({
        where: { ...whereBase, estado: 'ACTIVO' },
      }),

      prisma.comite.count({
        where: { ...whereBase, estado: 'INACTIVO' },
      }),

      prisma.miembroComite.count({
        where: { activo: true, fechaRetiro: null },
      }),

      prisma.actaComite.count({
        where: { activo: true },
      }),

      prisma.cronogramaComite.count({
        where: {
          activo: true,
          estado: 'PROGRAMADA',
          fechaProgramada: { lte: new Date() },
        },
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
      activos,
      inactivos,
      totalMiembros,
      totalActas,
      actasPendientes,
    };
  }
}

module.exports = new ComiteService();
