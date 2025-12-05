/**
 * Service de habitaciones
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class HabitacionService {
  /**
   * Obtener todas las habitaciones
   */
  async getAll(query = {}) {
    const { unidadId } = query;
    
    const where = {};
    if (unidadId) {
      where.unidadId = unidadId;
    }

    const habitaciones = await prisma.habitacion.findMany({
      where,
      include: {
        unidad: true,
        camas: true,
        _count: {
          select: { camas: true },
        },
      },
      orderBy: { numero: 'asc' },
    });

    return habitaciones;
  }

  /**
   * Obtener una habitación por ID
   */
  async getById(id) {
    const habitacion = await prisma.habitacion.findUnique({
      where: { id },
      include: {
        unidad: true,
        camas: true,
      },
    });

    if (!habitacion) {
      throw new NotFoundError('Habitación no encontrada');
    }

    return habitacion;
  }

  /**
   * Crear una habitación
   */
  async create(data) {
    const habitacion = await prisma.habitacion.create({
      data: {
        numero: data.numero,
        unidadId: data.unidadId,
        piso: data.piso,
        capacidadCamas: data.capacidadCamas || 1,
        activo: data.activo !== undefined ? data.activo : true,
      },
    });

    return habitacion;
  }

  /**
   * Actualizar una habitación
   */
  async update(id, data) {
    await this.getById(id);

    const habitacion = await prisma.habitacion.update({
      where: { id },
      data: {
        numero: data.numero,
        piso: data.piso,
        capacidadCamas: data.capacidadCamas,
        activo: data.activo,
      },
    });

    return habitacion;
  }

  /**
   * Eliminar una habitación
   */
  async delete(id) {
    await this.getById(id);
    await prisma.habitacion.delete({ where: { id } });
    return true;
  }
}

module.exports = new HabitacionService();
