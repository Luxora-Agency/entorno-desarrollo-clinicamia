const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class FormatoInfraestructuraService {
  /**
   * Crear formato
   */
  async create(data) {
    // Validar que no exista formato con el mismo código
    const existing = await prisma.formatoInfraestructura.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      throw new ValidationError(`Ya existe un formato con el código ${data.codigo}`);
    }

    return prisma.formatoInfraestructura.create({
      data,
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Obtener todos los formatos con filtros
   */
  async findAll(filters = {}) {
    const where = { activo: true };

    if (filters.categoria) {
      where.categoria = filters.categoria;
    }

    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { codigo: { contains: filters.search, mode: 'insensitive' } },
        { descripcion: { contains: filters.search, mode: 'insensitive' } },
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
              email: true,
            },
          },
        },
        orderBy: [
          { categoria: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.formatoInfraestructura.count({ where }),
    ]);

    return { formatos, total };
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
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
   * Actualizar formato
   */
  async update(id, data) {
    // Verificar que existe
    await this.findById(id);

    // Si se cambia el código, validar que no exista otro con ese código
    if (data.codigo) {
      const existing = await prisma.formatoInfraestructura.findFirst({
        where: {
          codigo: data.codigo,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ValidationError(`Ya existe un formato con el código ${data.codigo}`);
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
            email: true,
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
   * Obtener estadísticas de formatos
   */
  async getEstadisticas() {
    const [total, porCategoria] = await Promise.all([
      prisma.formatoInfraestructura.count({ where: { activo: true } }),
      prisma.formatoInfraestructura.groupBy({
        by: ['categoria'],
        where: { activo: true },
        _count: true,
      }),
    ]);

    return {
      total,
      porCategoria: porCategoria.reduce((acc, item) => {
        acc[item.categoria] = item._count;
        return acc;
      }, {}),
    };
  }

  /**
   * Obtener categorías disponibles
   */
  getCategorias() {
    return [
      { value: 'RH1', label: 'Residuos Hospitalarios (RH1)' },
      { value: 'CONCEPTO_SANITARIO', label: 'Concepto Sanitario' },
      { value: 'AUDITORIA', label: 'Auditoría' },
      { value: 'INDICADOR', label: 'Indicador' },
      { value: 'REPORTE', label: 'Reporte' },
      { value: 'OTRO', label: 'Otro' },
    ];
  }

  /**
   * Duplicar formato (crear nueva versión)
   */
  async duplicar(id, nuevoCodigo, userId) {
    const original = await this.findById(id);

    const duplicado = {
      codigo: nuevoCodigo,
      nombre: `${original.nombre} (Copia)`,
      descripcion: original.descripcion,
      categoria: original.categoria,
      version: '1.0',
      plantillaUrl: original.plantillaUrl,
      plantillaNombre: original.plantillaNombre,
      creador: { connect: { id: userId } },
    };

    return this.create(duplicado);
  }
}

module.exports = new FormatoInfraestructuraService();
