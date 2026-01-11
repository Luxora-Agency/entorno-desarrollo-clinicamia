const prisma = require('../../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../../utils/errors');

class DocumentoMantenimientoService {
  /**
   * Crear documento de mantenimiento
   */
  async create(mantenimientoId, data, userId) {
    // Verificar que el mantenimiento existe
    const mantenimiento = await prisma.mantenimientoInfraestructura.findUnique({
      where: { id: mantenimientoId },
    });

    if (!mantenimiento) {
      throw new NotFoundError('Mantenimiento no encontrado');
    }

    return prisma.documentoMantenimiento.create({
      data: {
        ...data,
        mantenimiento: { connect: { id: mantenimientoId } },
        usuario: { connect: { id: userId } },
      },
      include: {
        mantenimiento: {
          select: {
            id: true,
            tipoMantenimiento: true,
            fechaProgramada: true,
            equipo: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
                codigo: true,
              },
            },
          },
        },
        usuario: {
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
   * Obtener documentos por mantenimiento
   */
  async findByMantenimiento(mantenimientoId) {
    return prisma.documentoMantenimiento.findMany({
      where: { mantenimientoId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener documento por ID
   */
  async findById(id) {
    const documento = await prisma.documentoMantenimiento.findUnique({
      where: { id },
      include: {
        mantenimiento: {
          include: {
            equipo: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
                codigo: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return documento;
  }

  /**
   * Actualizar documento
   */
  async update(id, data) {
    await this.findById(id);

    return prisma.documentoMantenimiento.update({
      where: { id },
      data,
      include: {
        mantenimiento: true,
        usuario: {
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
   * Eliminar documento
   */
  async delete(id) {
    await this.findById(id);

    return prisma.documentoMantenimiento.delete({
      where: { id },
    });
  }

  /**
   * Obtener todos los documentos con filtros
   */
  async findAll(filters = {}) {
    const where = {};

    if (filters.tipoDocumento) {
      where.tipoDocumento = filters.tipoDocumento;
    }

    if (filters.equipoId) {
      where.mantenimiento = {
        equipoId: filters.equipoId,
      };
    }

    if (filters.search) {
      where.nombre = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const [documentos, total] = await Promise.all([
      prisma.documentoMantenimiento.findMany({
        where,
        include: {
          mantenimiento: {
            include: {
              equipo: {
                select: {
                  id: true,
                  nombre: true,
                  tipo: true,
                  codigo: true,
                },
              },
            },
          },
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(filters.limit) || 50,
      }),
      prisma.documentoMantenimiento.count({ where }),
    ]);

    return { documentos, total };
  }

  /**
   * Obtener estadísticas de documentos
   */
  async getEstadisticas() {
    const [total, porTipo] = await Promise.all([
      prisma.documentoMantenimiento.count(),
      prisma.documentoMantenimiento.groupBy({
        by: ['tipoDocumento'],
        _count: true,
      }),
    ]);

    return {
      total,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipoDocumento] = item._count;
        return acc;
      }, {}),
    };
  }
}

module.exports = new DocumentoMantenimientoService();
