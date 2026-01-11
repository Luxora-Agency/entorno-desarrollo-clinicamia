const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class FormatoInfraestructuraService {
  /**
   * Crear formato
   */
  async create(data, userId) {
    // Verificar que no exista código duplicado
    const existente = await prisma.formatoInfraestructura.findUnique({
      where: { codigo: data.codigo },
    });

    if (existente) {
      throw new ValidationError(`Ya existe un formato con el código ${data.codigo}`);
    }

    return prisma.formatoInfraestructura.create({
      data: {
        ...data,
        creadoPor: userId,
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Obtener todos los formatos
   */
  async findAll(filters = {}) {
    const { categoria, search, page = 1, limit = 50 } = filters;

    const where = {
      activo: true,
    };

    if (categoria) {
      where.categoria = categoria;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [formatos, total] = await Promise.all([
      prisma.formatoInfraestructura.findMany({
        where,
        include: {
          creador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
        orderBy: [
          { categoria: 'asc' },
          { codigo: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.formatoInfraestructura.count({ where }),
    ]);

    return {
      formatos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener formatos por categoría
   */
  async findByCategoria(categoria) {
    return prisma.formatoInfraestructura.findMany({
      where: {
        categoria,
        activo: true,
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        codigo: 'asc',
      },
    });
  }

  /**
   * Obtener formato por ID
   */
  async findById(id) {
    const formato = await prisma.formatoInfraestructura.findUnique({
      where: { id },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    if (!formato) {
      throw new NotFoundError('Formato no encontrado');
    }

    return formato;
  }

  /**
   * Obtener formato por código
   */
  async findByCodigo(codigo) {
    const formato = await prisma.formatoInfraestructura.findUnique({
      where: { codigo },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    if (!formato) {
      throw new NotFoundError('Formato no encontrado');
    }

    return formato;
  }

  /**
   * Actualizar formato
   */
  async update(id, data) {
    // Verificar que existe
    await this.findById(id);

    // Si se cambia el código, verificar que no esté duplicado
    if (data.codigo) {
      const existente = await prisma.formatoInfraestructura.findFirst({
        where: {
          codigo: data.codigo,
          id: { not: id },
        },
      });

      if (existente) {
        throw new ValidationError(`Ya existe otro formato con el código ${data.codigo}`);
      }
    }

    return prisma.formatoInfraestructura.update({
      where: { id },
      data,
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar formato (soft delete)
   */
  async delete(id) {
    await this.findById(id);

    return prisma.formatoInfraestructura.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Obtener estadísticas
   */
  async getEstadisticas() {
    const [total, porCategoria] = await Promise.all([
      prisma.formatoInfraestructura.count({
        where: { activo: true },
      }),
      prisma.formatoInfraestructura.groupBy({
        by: ['categoria'],
        where: { activo: true },
        _count: true,
      }),
    ]);

    const categorias = {};
    porCategoria.forEach((item) => {
      categorias[item.categoria] = item._count;
    });

    return {
      total,
      porCategoria: categorias,
    };
  }

  /**
   * Obtener últimos formatos creados
   */
  async getRecientes(limit = 10) {
    return prisma.formatoInfraestructura.findMany({
      where: { activo: true },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Obtener categorías disponibles
   */
  getCategorias() {
    return [
      { value: 'GESTION_RESIDUOS', label: 'Gestión de Residuos' },
      { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
      { value: 'DOCUMENTACION_LEGAL', label: 'Documentación Legal' },
      { value: 'INSPECCIONES', label: 'Inspecciones' },
      { value: 'AUDITORIAS', label: 'Auditorías' },
      { value: 'INDICADORES', label: 'Indicadores' },
      { value: 'OTRO', label: 'Otro' },
    ];
  }
}

module.exports = new FormatoInfraestructuraService();
