const prisma = require('../db/prisma');

class QuirofanoService {
  /**
   * Crear un nuevo quirófano
   */
  async createQuirofano(data) {
    const { nombre, tipo, ubicacion, capacidad, equipamiento } = data;

    const existing = await prisma.quirofano.findUnique({
      where: { nombre },
    });

    if (existing) {
      throw new Error('Ya existe un quirófano con este nombre');
    }

    return prisma.quirofano.create({
      data: {
        nombre,
        tipo,
        ubicacion,
        capacidad: capacidad || 1,
        equipamiento: equipamiento || {},
        estado: 'Activo',
      },
    });
  }

  /**
   * Obtener todos los quirófanos con filtros
   */
  async getQuirofanos(filters = {}) {
    const { estado, tipo, limit = 100, offset = 0 } = filters;

    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;

    const [quirofanos, total] = await Promise.all([
      prisma.quirofano.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { nombre: 'asc' },
      }),
      prisma.quirofano.count({ where }),
    ]);

    return {
      quirofanos,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
  }

  /**
   * Obtener quirófano por ID
   */
  async getQuirofanoById(id) {
    const quirofano = await prisma.quirofano.findUnique({
      where: { id },
      include: {
        procedimientos: {
          where: {
            fechaProgramada: {
              gte: new Date(), // Solo futuros o actuales
            },
            estado: {
              not: 'Cancelado',
            },
          },
          take: 5,
          orderBy: { fechaProgramada: 'asc' },
          include: {
            medicoResponsable: {
              select: { nombre: true, apellido: true },
            },
            paciente: {
              select: { nombre: true, apellido: true },
            },
          },
        },
      },
    });

    if (!quirofano) {
      throw new Error('Quirófano no encontrado');
    }

    return quirofano;
  }

  /**
   * Actualizar quirófano
   */
  async updateQuirofano(id, data) {
    const existing = await prisma.quirofano.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Quirófano no encontrado');
    }

    return prisma.quirofano.update({
      where: { id },
      data,
    });
  }

  /**
   * Eliminar (desactivar) quirófano
   */
  async deleteQuirofano(id) {
    // Verificar si tiene procedimientos programados futuros
    const pendingProcedures = await prisma.procedimiento.count({
      where: {
        quirofanoId: id,
        estado: 'Programado',
        fechaProgramada: {
          gte: new Date(),
        },
      },
    });

    if (pendingProcedures > 0) {
      throw new Error('No se puede desactivar el quirófano porque tiene procedimientos programados pendientes');
    }

    return prisma.quirofano.update({
      where: { id },
      data: { estado: 'Inactivo' },
    });
  }

  /**
   * Verificar disponibilidad de un quirófano
   * @param {string} quirofanoId
   * @param {Date} fechaInicio
   * @param {number} duracionMinutos
   * @param {string} excludeProcedimientoId (opcional, para actualizaciones)
   */
  async checkAvailability(quirofanoId, fechaInicio, duracionMinutos, excludeProcedimientoId = null) {
    const start = new Date(fechaInicio);
    const end = new Date(start.getTime() + duracionMinutos * 60000);

    const where = {
      quirofanoId,
      estado: {
        in: ['Programado', 'EnProceso'],
      },
      // Conflict logic: (StartA < EndB) and (EndA > StartB)
      AND: [
        {
          fechaProgramada: {
            lt: end,
          },
        },
        // We can't easily do calculated end time in Prisma query without raw query or separate check
        // So we filter by start time being before our end time, and then we filter in memory or assume standard duration
        // Better approach: Since we store duration, we need to fetch candidates and check.
      ],
    };

    if (excludeProcedimientoId) {
      where.id = { not: excludeProcedimientoId };
    }

    // Fetch potential conflicts (starts within same day to optimize)
    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(start);
    dayEnd.setHours(23, 59, 59, 999);

    const candidates = await prisma.procedimiento.findMany({
      where: {
        ...where,
        fechaProgramada: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: {
        id: true,
        fechaProgramada: true,
        duracionEstimada: true,
      },
    });

    for (const p of candidates) {
      const pStart = new Date(p.fechaProgramada);
      const pEnd = new Date(pStart.getTime() + (p.duracionEstimada || 60) * 60000);

      if (start < pEnd && end > pStart) {
        return {
          available: false,
          conflict: p,
        };
      }
    }

    return { available: true };
  }
}

module.exports = new QuirofanoService();
