/**
 * Service de unidades
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class UnidadService {
  /**
   * Obtener todas las unidades
   */
  async getAll(query = {}) {
    const { activo } = query;
    
    const where = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const unidades = await prisma.unidad.findMany({
      where,
      include: {
        habitaciones: {
          include: {
            camas: true,
          },
        },
        _count: {
          select: {
            habitaciones: true,
            admisiones: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return unidades;
  }

  /**
   * Obtener una unidad por ID
   */
  async getById(id) {
    const unidad = await prisma.unidad.findUnique({
      where: { id },
      include: {
        habitaciones: {
          include: {
            camas: true,
          },
        },
      },
    });

    if (!unidad) {
      throw new NotFoundError('Unidad no encontrada');
    }

    return unidad;
  }

  /**
   * Crear una unidad
   */
  async create(data) {
    const unidad = await prisma.unidad.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        capacidad: data.capacidad || 0,
        activo: data.activo !== undefined ? data.activo : true,
      },
    });

    return unidad;
  }

  /**
   * Actualizar una unidad
   */
  async update(id, data) {
    await this.getById(id);

    const unidad = await prisma.unidad.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        capacidad: data.capacidad,
        activo: data.activo,
      },
    });

    return unidad;
  }

  /**
   * Eliminar una unidad
   */
  async delete(id) {
    await this.getById(id);
    await prisma.unidad.delete({ where: { id } });
    return true;
  }
}

module.exports = new UnidadService();
