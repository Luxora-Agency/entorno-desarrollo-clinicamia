const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

/**
 * Servicio para gestión de documentos normativos de Historia Clínica
 * Maneja manuales, procedimientos, formatos, políticas y certificaciones
 */
class DocumentoHCService {
  /**
   * Obtener todos los documentos con filtros opcionales
   */
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      tipo,
      categoria,
      estado,
      search,
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      activo: true,
      ...(tipo && { tipo }),
      ...(categoria && { categoria }),
      ...(estado && { estado }),
      ...(search && {
        OR: [
          { codigo: { contains: search, mode: 'insensitive' } },
          { nombre: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.documentoHC.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [
          { estado: 'asc' },
          { fechaEmision: 'desc' },
        ],
        include: {
          elaborador: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
          revisor: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
          aprobador: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
          _count: {
            select: {
              versiones: true,
              distribucion: true,
            },
          },
        },
      }),
      prisma.documentoHC.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener documento por ID con versiones y distribución
   */
  async getById(id) {
    const documento = await prisma.documentoHC.findUnique({
      where: { id },
      include: {
        elaborador: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        revisor: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        aprobador: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        versiones: {
          where: { activo: true },
          orderBy: { fechaVersion: 'desc' },
          include: {
            creador: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
        distribucion: {
          where: { activo: true },
          orderBy: { fechaEntrega: 'desc' },
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true, email: true },
            },
          },
        },
      },
    });

    if (!documento || !documento.activo) {
      throw new NotFoundError('Documento no encontrado');
    }

    return documento;
  }

  /**
   * Crear nuevo documento
   */
  async create(data) {
    const { codigo, elaboradoPor } = data;

    // Verificar que el código no exista
    const existente = await prisma.documentoHC.findUnique({
      where: { codigo },
    });

    if (existente && existente.activo) {
      throw new ValidationError('Ya existe un documento con este código');
    }

    // Crear documento
    const documento = await prisma.documentoHC.create({
      data: {
        ...data,
        estado: 'BORRADOR',
      },
      include: {
        elaborador: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    return documento;
  }

  /**
   * Actualizar documento
   */
  async update(id, data) {
    const documento = await prisma.documentoHC.findUnique({
      where: { id },
    });

    if (!documento || !documento.activo) {
      throw new NotFoundError('Documento no encontrado');
    }

    // Si cambia el código, verificar que no exista
    if (data.codigo && data.codigo !== documento.codigo) {
      const existente = await prisma.documentoHC.findUnique({
        where: { codigo: data.codigo },
      });

      if (existente && existente.activo && existente.id !== id) {
        throw new ValidationError('Ya existe un documento con este código');
      }
    }

    const actualizado = await prisma.documentoHC.update({
      where: { id },
      data,
      include: {
        elaborador: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        revisor: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        aprobador: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    return actualizado;
  }

  /**
   * Eliminar documento (soft delete)
   */
  async delete(id) {
    const documento = await prisma.documentoHC.findUnique({
      where: { id },
    });

    if (!documento || !documento.activo) {
      throw new NotFoundError('Documento no encontrado');
    }

    await prisma.documentoHC.update({
      where: { id },
      data: { activo: false },
    });

    return { success: true, message: 'Documento eliminado correctamente' };
  }

  /**
   * Aprobar documento (workflow: BORRADOR → EN_REVISION → VIGENTE)
   */
  async aprobar(id, aprobadoPor, tipo = 'revisar') {
    const documento = await prisma.documentoHC.findUnique({
      where: { id },
    });

    if (!documento || !documento.activo) {
      throw new NotFoundError('Documento no encontrado');
    }

    let updateData = {};

    switch (tipo) {
      case 'revisar':
        if (documento.estado !== 'BORRADOR') {
          throw new ValidationError('Solo se pueden revisar documentos en BORRADOR');
        }
        updateData = {
          revisadoPor: aprobadoPor,
          fechaRevision: new Date(),
          estado: 'EN_REVISION',
        };
        break;

      case 'aprobar':
        if (documento.estado !== 'EN_REVISION') {
          throw new ValidationError('Solo se pueden aprobar documentos EN_REVISION');
        }
        updateData = {
          aprobadoPor: aprobadoPor,
          estado: 'VIGENTE',
        };
        break;

      default:
        throw new ValidationError('Tipo de aprobación inválido');
    }

    const actualizado = await prisma.documentoHC.update({
      where: { id },
      data: updateData,
      include: {
        elaborador: {
          select: { id: true, nombre: true, apellido: true },
        },
        revisor: {
          select: { id: true, nombre: true, apellido: true },
        },
        aprobador: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return actualizado;
  }

  /**
   * Distribuir documento a usuarios
   */
  async distribuir(id, usuariosIds) {
    const documento = await prisma.documentoHC.findUnique({
      where: { id },
    });

    if (!documento || !documento.activo) {
      throw new NotFoundError('Documento no encontrado');
    }

    if (documento.estado !== 'VIGENTE') {
      throw new ValidationError('Solo se pueden distribuir documentos VIGENTES');
    }

    // Crear distribución para cada usuario (evitar duplicados)
    const distribuciones = await Promise.all(
      usuariosIds.map(async (usuarioId) => {
        // Verificar si ya existe una distribución activa
        const existente = await prisma.distribucionDocHC.findUnique({
          where: {
            documentoId_usuarioId: {
              documentoId: id,
              usuarioId,
            },
          },
        });

        if (existente && existente.activo) {
          return existente;
        }

        return prisma.distribucionDocHC.create({
          data: {
            documentoId: id,
            usuarioId,
          },
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true, email: true },
            },
          },
        });
      })
    );

    return {
      success: true,
      message: `Documento distribuido a ${usuariosIds.length} usuarios`,
      distribuciones,
    };
  }

  /**
   * Crear nueva versión de documento
   */
  async crearVersion(documentoId, versionData) {
    const documento = await prisma.documentoHC.findUnique({
      where: { id: documentoId },
    });

    if (!documento || !documento.activo) {
      throw new NotFoundError('Documento no encontrado');
    }

    const version = await prisma.versionDocHC.create({
      data: {
        documentoId,
        ...versionData,
      },
      include: {
        creador: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return version;
  }

  /**
   * Obtener versiones de un documento
   */
  async getVersiones(documentoId) {
    const documento = await prisma.documentoHC.findUnique({
      where: { id: documentoId },
    });

    if (!documento || !documento.activo) {
      throw new NotFoundError('Documento no encontrado');
    }

    const versiones = await prisma.versionDocHC.findMany({
      where: {
        documentoId,
        activo: true,
      },
      orderBy: { fechaVersion: 'desc' },
      include: {
        creador: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    return versiones;
  }

  /**
   * Confirmar lectura de documento
   */
  async confirmarLectura(documentoId, usuarioId) {
    const distribucion = await prisma.distribucionDocHC.findUnique({
      where: {
        documentoId_usuarioId: {
          documentoId,
          usuarioId,
        },
      },
    });

    if (!distribucion || !distribucion.activo) {
      throw new NotFoundError('Distribución no encontrada');
    }

    const actualizada = await prisma.distribucionDocHC.update({
      where: {
        documentoId_usuarioId: {
          documentoId,
          usuarioId,
        },
      },
      data: {
        fechaLectura: new Date(),
        confirmado: true,
      },
      include: {
        documento: {
          select: { codigo: true, nombre: true },
        },
      },
    });

    return actualizada;
  }

  /**
   * Obtener estadísticas de documentos
   */
  async getStats() {
    const [
      total,
      porTipo,
      porCategoria,
      porEstado,
      documentosPorRevisar,
    ] = await Promise.all([
      prisma.documentoHC.count({ where: { activo: true } }),

      prisma.documentoHC.groupBy({
        by: ['tipo'],
        where: { activo: true },
        _count: true,
      }),

      prisma.documentoHC.groupBy({
        by: ['categoria'],
        where: { activo: true },
        _count: true,
      }),

      prisma.documentoHC.groupBy({
        by: ['estado'],
        where: { activo: true },
        _count: true,
      }),

      prisma.documentoHC.count({
        where: {
          activo: true,
          estado: 'EN_REVISION',
        },
      }),
    ]);

    return {
      total,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      porCategoria: porCategoria.reduce((acc, item) => {
        acc[item.categoria] = item._count;
        return acc;
      }, {}),
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {}),
      documentosPorRevisar,
    };
  }
}

module.exports = new DocumentoHCService();
