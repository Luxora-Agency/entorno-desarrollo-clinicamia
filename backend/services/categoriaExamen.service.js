/**
 * Service de categorías de exámenes
 */
const prisma = require('../db/prisma');
const { validateRequired } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

class CategoriaExamenService {
  /**
   * Obtener todas las categorías
   */
  async getAll({ page = 1, limit = 100, search = '' }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [categorias, total] = await Promise.all([
      prisma.categoriaExamen.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.categoriaExamen.count({ where }),
    ]);

    // Calcular conteo de exámenes y procedimientos para cada categoría
    const categoriasConConteo = await Promise.all(
      categorias.map(async (cat) => {
        const totalExamenes = await prisma.examenProcedimiento.count({
          where: { categoriaId: cat.id, tipo: 'Examen' }
        });
        
        const totalProcedimientos = await prisma.examenProcedimiento.count({
          where: { categoriaId: cat.id, tipo: 'Procedimiento' }
        });

        return {
          id: cat.id,
          nombre: cat.nombre,
          descripcion: cat.descripcion,
          colorHex: cat.colorHex,
          estado: cat.estado,
          totalExamenes,
          totalProcedimientos,
          total: totalExamenes + totalProcedimientos,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        };
      })
    );

    return {
      categorias: categoriasConConteo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener categoría por ID
   */
  async getById(id) {
    const categoria = await prisma.categoriaExamen.findUnique({
      where: { id },
      include: {
        _count: {
          select: { examenes: true }
        }
      }
    });

    if (!categoria) {
      throw new NotFoundError('Categoría no encontrada');
    }

    return categoria;
  }

  /**
   * Crear categoría
   */
  async create(data) {
    const { nombre, descripcion, colorHex, estado = 'Activo' } = data;

    // Validar campos requeridos
    const missing = validateRequired(['nombre', 'descripcion', 'colorHex'], { nombre, descripcion, colorHex });
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    const categoria = await prisma.categoriaExamen.create({
      data: {
        nombre,
        descripcion,
        colorHex,
        estado,
      },
    });

    return categoria;
  }

  /**
   * Actualizar categoría
   */
  async update(id, data) {
    const { nombre, descripcion, colorHex, estado } = data;

    const categoriaExistente = await prisma.categoriaExamen.findUnique({
      where: { id },
    });

    if (!categoriaExistente) {
      throw new NotFoundError('Categoría no encontrada');
    }

    const categoria = await prisma.categoriaExamen.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion && { descripcion }),
        ...(colorHex && { colorHex }),
        ...(estado && { estado }),
      },
    });

    return categoria;
  }

  /**
   * Eliminar categoría
   */
  async delete(id) {
    const categoriaExistente = await prisma.categoriaExamen.findUnique({
      where: { id },
    });

    if (!categoriaExistente) {
      throw new NotFoundError('Categoría no encontrada');
    }

    // Reasignar exámenes/procedimientos a null (Sin categoría)
    await prisma.examenProcedimiento.updateMany({
      where: { categoriaId: id },
      data: { categoriaId: null },
    });

    // Eliminar categoría
    await prisma.categoriaExamen.delete({
      where: { id },
    });
  }

  /**
   * Obtener estadísticas
   */
  async getEstadisticas() {
    const [total, activas, inactivas] = await Promise.all([
      prisma.categoriaExamen.count(),
      prisma.categoriaExamen.count({ where: { estado: 'Activo' } }),
      prisma.categoriaExamen.count({ where: { estado: 'Inactivo' } }),
    ]);

    return {
      total,
      activas,
      inactivas,
    };
  }
}

module.exports = new CategoriaExamenService();
