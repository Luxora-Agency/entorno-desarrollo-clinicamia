/**
 * Service de etiquetas de productos
 */

const prisma = require('../db/prisma');
const { ValidationError } = require('../utils/errors');
const { validateRequired } = require('../utils/validators');

const EtiquetaProductoService = {
  async getAll() {
    const etiquetas = await prisma.etiquetaProducto.findMany({
      include: {
        _count: {
          select: { productos: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return etiquetas.map(etq => ({
      ...etq,
      totalProductos: etq._count.productos
    }));
  },

  async getById(id) {
    const etiqueta = await prisma.etiquetaProducto.findUnique({
      where: { id },
    });

    if (!etiqueta) {
      throw new ValidationError('Etiqueta no encontrada');
    }

    return etiqueta;
  },

  async create(data) {
    const missing = validateRequired(['nombre'], data);
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    const etiqueta = await prisma.etiquetaProducto.create({
      data: {
        nombre: data.nombre,
        color: data.color || '#3b82f6',
      },
    });

    return etiqueta;
  },

  async update(id, data) {
    await this.getById(id);

    const updateData = {};
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.color) updateData.color = data.color;

    const etiqueta = await prisma.etiquetaProducto.update({
      where: { id },
      data: updateData,
    });

    return etiqueta;
  },

  async delete(id) {
    await this.getById(id);

    await prisma.etiquetaProducto.delete({
      where: { id },
    });

    return { message: 'Etiqueta eliminada correctamente' };
  },
};

module.exports = EtiquetaProductoService;
