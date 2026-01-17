/**
 * Service de exámenes y procedimientos
 */
const prisma = require('../db/prisma');
const { validateRequired } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

class ExamenProcedimientoService {
  /**
   * Obtener todos los exámenes y procedimientos
   */
  async getAll({ page = 1, limit = 100, search = '', tipo = '' }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
          { codigoCUPS: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(tipo && tipo !== 'todos' && { tipo }),
    };

    const [items, total] = await Promise.all([
      prisma.examenProcedimiento.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          categoria: {
            select: {
              id: true,
              nombre: true,
              colorHex: true,
            },
          },
        },
      }),
      prisma.examenProcedimiento.count({ where }),
    ]);

    // Formatear datos
    const itemsFormateados = items.map(item => ({
      id: item.id,
      tipo: item.tipo,
      nombre: item.nombre,
      codigoCUPS: item.codigoCUPS,
      descripcion: item.descripcion,
      categoriaId: item.categoriaId,
      categoriaNombre: item.categoria?.nombre || 'Sin categoría',
      categoriaColor: item.categoria?.colorHex || '#6B7280',
      duracionMinutos: item.duracionMinutos,
      costoBase: parseFloat(item.costoBase),
      preparacionEspecial: item.preparacionEspecial,
      requiereAyuno: item.requiereAyuno,
      estado: item.estado,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      items: itemsFormateados,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener por ID
   */
  async getById(id) {
    const item = await prisma.examenProcedimiento.findUnique({
      where: { id },
      include: {
        categoria: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Examen/Procedimiento no encontrado');
    }

    return {
      ...item,
      costoBase: parseFloat(item.costoBase),
    };
  }

  /**
   * Crear
   */
  async create(data) {
    const {
      tipo,
      nombre,
      codigoCUPS,
      codigoCIE11,
      descripcion,
      categoriaId,
      duracionMinutos,
      costoBase,
      preparacionEspecial,
      requiereAyuno = false,
      estado = 'Activo',
    } = data;

    // Validar campos requeridos
    const missing = validateRequired(['tipo', 'nombre', 'duracionMinutos', 'costoBase'], { tipo, nombre, duracionMinutos, costoBase });
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    if (tipo !== 'Examen' && tipo !== 'Procedimiento') {
      throw new ValidationError('El tipo debe ser "Examen" o "Procedimiento"');
    }

    // Validar unicidad de CUPS si se proporciona
    if (codigoCUPS) {
      const existingCUPS = await prisma.examenProcedimiento.findUnique({
        where: { codigoCUPS },
      });
      if (existingCUPS) {
        throw new ValidationError(`El código CUPS ${codigoCUPS} ya está registrado`);
      }
    }

    const item = await prisma.examenProcedimiento.create({
      data: {
        tipo,
        nombre,
        codigoCUPS,
        codigoCIE11,
        descripcion,
        categoriaId: categoriaId || null,
        duracionMinutos: parseInt(duracionMinutos),
        costoBase: parseFloat(costoBase),
        preparacionEspecial,
        requiereAyuno,
        estado,
      },
      include: {
        categoria: true,
      },
    });

    return {
      ...item,
      costoBase: parseFloat(item.costoBase),
    };
  }

  /**
   * Actualizar
   */
  async update(id, data) {
    const {
      tipo,
      nombre,
      codigoCUPS,
      codigoCIE11,
      descripcion,
      categoriaId,
      duracionMinutos,
      costoBase,
      preparacionEspecial,
      requiereAyuno,
      estado,
    } = data;

    const itemExistente = await prisma.examenProcedimiento.findUnique({
      where: { id },
    });

    if (!itemExistente) {
      throw new NotFoundError('Examen/Procedimiento no encontrado');
    }

    // Validar unicidad de CUPS si cambia
    if (codigoCUPS && codigoCUPS !== itemExistente.codigoCUPS) {
      const existingCUPS = await prisma.examenProcedimiento.findUnique({
        where: { codigoCUPS },
      });
      if (existingCUPS) {
        throw new ValidationError(`El código CUPS ${codigoCUPS} ya está registrado`);
      }
    }

    const item = await prisma.examenProcedimiento.update({
      where: { id },
      data: {
        ...(tipo && { tipo }),
        ...(nombre && { nombre }),
        ...(codigoCUPS !== undefined && { codigoCUPS }),
        ...(codigoCIE11 !== undefined && { codigoCIE11 }),
        ...(descripcion !== undefined && { descripcion }),
        ...(categoriaId !== undefined && { categoriaId: categoriaId || null }),
        ...(duracionMinutos && { duracionMinutos: parseInt(duracionMinutos) }),
        ...(costoBase && { costoBase: parseFloat(costoBase) }),
        ...(preparacionEspecial !== undefined && { preparacionEspecial }),
        ...(requiereAyuno !== undefined && { requiereAyuno }),
        ...(estado && { estado }),
      },
      include: {
        categoria: true,
      },
    });

    return {
      ...item,
      costoBase: parseFloat(item.costoBase),
    };
  }

  /**
   * Eliminar
   */
  async delete(id) {
    const itemExistente = await prisma.examenProcedimiento.findUnique({
      where: { id },
    });

    if (!itemExistente) {
      throw new NotFoundError('Examen/Procedimiento no encontrado');
    }

    await prisma.examenProcedimiento.delete({
      where: { id },
    });
  }

  /**
   * Obtener estadísticas
   */
  async getEstadisticas() {
    const [totalExamenes, totalProcedimientos, activos] = await Promise.all([
      prisma.examenProcedimiento.count({ where: { tipo: 'Examen' } }),
      prisma.examenProcedimiento.count({ where: { tipo: 'Procedimiento' } }),
      prisma.examenProcedimiento.count({ where: { estado: 'Activo' } }),
    ]);

    return {
      totalExamenes,
      totalProcedimientos,
      total: totalExamenes + totalProcedimientos,
      activos,
    };
  }
}

module.exports = new ExamenProcedimientoService();
