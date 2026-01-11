const prisma = require('../../db/prisma');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class CategoriaCapacitacionService {
  async findAll(query = {}) {
    const { activo = true, search } = query;

    const where = {};
    if (activo !== undefined) {
      where.activo = activo === 'true' || activo === true;
    }
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.categoriaCapacitacion.findMany({
      where,
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      include: {
        _count: {
          select: { capacitaciones: true }
        }
      }
    });
  }

  async findById(id) {
    const categoria = await prisma.categoriaCapacitacion.findUnique({
      where: { id },
      include: {
        capacitaciones: {
          where: { activo: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { capacitaciones: true }
        }
      }
    });

    if (!categoria) {
      throw new NotFoundError('Categoría de capacitación no encontrada');
    }

    return categoria;
  }

  async create(data) {
    const existing = await prisma.categoriaCapacitacion.findUnique({
      where: { nombre: data.nombre }
    });

    if (existing) {
      throw new ValidationError('Ya existe una categoría con ese nombre');
    }

    // Get max orden
    const maxOrden = await prisma.categoriaCapacitacion.aggregate({
      _max: { orden: true }
    });

    return prisma.categoriaCapacitacion.create({
      data: {
        ...data,
        orden: data.orden ?? (maxOrden._max.orden || 0) + 1
      }
    });
  }

  async update(id, data) {
    const existing = await prisma.categoriaCapacitacion.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Categoría de capacitación no encontrada');
    }

    // Check for duplicate name
    if (data.nombre && data.nombre !== existing.nombre) {
      const duplicate = await prisma.categoriaCapacitacion.findUnique({
        where: { nombre: data.nombre }
      });
      if (duplicate) {
        throw new ValidationError('Ya existe una categoría con ese nombre');
      }
    }

    return prisma.categoriaCapacitacion.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    const existing = await prisma.categoriaCapacitacion.findUnique({
      where: { id },
      include: {
        _count: { select: { capacitaciones: true } }
      }
    });

    if (!existing) {
      throw new NotFoundError('Categoría de capacitación no encontrada');
    }

    if (existing._count.capacitaciones > 0) {
      // Soft delete
      return prisma.categoriaCapacitacion.update({
        where: { id },
        data: { activo: false }
      });
    }

    // Hard delete if no capacitaciones
    return prisma.categoriaCapacitacion.delete({
      where: { id }
    });
  }

  async reorder(orderedIds) {
    const updates = orderedIds.map((id, index) =>
      prisma.categoriaCapacitacion.update({
        where: { id },
        data: { orden: index + 1 }
      })
    );

    return prisma.$transaction(updates);
  }
}

module.exports = new CategoriaCapacitacionService();
