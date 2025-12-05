/**
 * Service de camas
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class CamaService {
  /**
   * Obtener todas las camas
   */
  async getAll(query = {}) {
    const { habitacionId, estado } = query;
    
    const where = {};
    if (habitacionId) {
      where.habitacionId = habitacionId;
    }
    if (estado) {
      where.estado = estado;
    }

    const camas = await prisma.cama.findMany({
      where,
      include: {
        habitacion: {
          include: {
            unidad: true,
          },
        },
      },
      orderBy: { numero: 'asc' },
    });

    return camas;
  }

  /**
   * Obtener una cama por ID
   */
  async getById(id) {
    const cama = await prisma.cama.findUnique({
      where: { id },
      include: {
        habitacion: {
          include: {
            unidad: true,
          },
        },
      },
    });

    if (!cama) {
      throw new NotFoundError('Cama no encontrada');
    }

    return cama;
  }

  /**
   * Crear una cama
   */
  async create(data) {
    const cama = await prisma.cama.create({
      data: {
        numero: data.numero,
        habitacionId: data.habitacionId,
        estado: data.estado || 'Disponible',
        observaciones: data.observaciones,
      },
    });

    return cama;
  }

  /**
   * Actualizar una cama
   */
  async update(id, data) {
    await this.getById(id);

    const cama = await prisma.cama.update({
      where: { id },
      data: {
        numero: data.numero,
        estado: data.estado,
        observaciones: data.observaciones,
      },
    });

    return cama;
  }

  /**
   * Eliminar una cama
   */
  async delete(id) {
    await this.getById(id);
    await prisma.cama.delete({ where: { id } });
    return true;
  }

  /**
   * Obtener camas disponibles
   */
  async getDisponibles(unidadId) {
    const where = { estado: 'Disponible' };
    
    if (unidadId) {
      where.habitacion = {
        unidadId,
      };
    }

    const camas = await prisma.cama.findMany({
      where,
      include: {
        habitacion: {
          include: {
            unidad: true,
          },
        },
      },
    });

    return camas;
  }
}

module.exports = new CamaService();
