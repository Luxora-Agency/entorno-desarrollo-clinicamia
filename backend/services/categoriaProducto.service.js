/**
 * Service de categorías de productos
 */

const prisma = require('../db/prisma');
const { ValidationError } = require('../utils/errors');
const { validateRequired } = require('../utils/validators');

const CategoriaProductoService = {
  /**
   * Obtener todas las categorías
   */
  async getAll(filters = {}) {
    const where = {};
    
    if (filters.activo !== undefined) {
      where.activo = filters.activo === 'true';
    }

    const categorias = await prisma.categoriaProducto.findMany({
      where,
      include: {
        _count: {
          select: { productos: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return categorias.map(cat => ({
      ...cat,
      totalProductos: cat._count.productos
    }));
  },

  /**
   * Obtener una categoría por ID
   */
  async getById(id) {
    const categoria = await prisma.categoriaProducto.findUnique({
      where: { id },
      include: {
        _count: {
          select: { productos: true }
        }
      }
    });

    if (!categoria) {
      throw new ValidationError('Categoría no encontrada');
    }

    return {
      ...categoria,
      totalProductos: categoria._count.productos
    };
  },

  /**
   * Crear una categoría
   */
  async create(data) {
    const missing = validateRequired(['nombre'], data);
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    const categoria = await prisma.categoriaProducto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        color: data.color || '#10b981',
        activo: data.activo !== undefined ? data.activo : true,
      },
    });

    return categoria;
  },

  /**
   * Actualizar una categoría
   */
  async update(id, data) {
    await this.getById(id);

    const updateData = {};
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.color) updateData.color = data.color;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const categoria = await prisma.categoriaProducto.update({
      where: { id },
      data: updateData,
    });

    return categoria;
  },

  /**
   * Eliminar una categoría
   */
  async delete(id) {
    await this.getById(id);

    // Verificar si tiene productos
    const count = await prisma.producto.count({
      where: { categoriaId: id }
    });

    if (count > 0) {
      throw new ValidationError('No se puede eliminar una categoría con productos asociados');
    }

    await prisma.categoriaProducto.delete({
      where: { id },
    });

    return { message: 'Categoría eliminada correctamente' };
  },
};

module.exports = CategoriaProductoService;
