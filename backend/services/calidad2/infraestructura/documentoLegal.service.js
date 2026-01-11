const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');
const { format } = require('date-fns');

class DocumentoLegalService {
  /**
   * Listar todos los documentos legales con filtros
   */
  async findAll(filters = {}) {
    const {
      carpetaId,
      tipoDocumento,
      tieneVencimiento,
      page = 1,
      limit = 50,
      orderBy = 'createdAt',
      orderDir = 'desc',
    } = filters;

    const where = {
      activo: true,
    };

    if (carpetaId) {
      where.carpetaId = carpetaId;
    }

    if (tipoDocumento) {
      where.tipoDocumento = tipoDocumento;
    }

    if (tieneVencimiento !== undefined) {
      where.tieneVencimiento = tieneVencimiento === 'true' || tieneVencimiento === true;
    }

    const skip = (page - 1) * limit;

    const [documentos, total] = await Promise.all([
      prisma.documentoLegalInfraestructura.findMany({
        where,
        include: {
          carpeta: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
            },
          },
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
          alertas: {
            where: {
              estado: {
                not: 'RESUELTO',
              },
            },
            orderBy: {
              diasRestantes: 'asc',
            },
          },
        },
        orderBy: {
          [orderBy]: orderDir,
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.documentoLegalInfraestructura.count({ where }),
    ]);

    // Calcular días restantes para cada documento
    const now = new Date();
    const documentosConEstado = documentos.map(doc => {
      let diasRestantes = null;
      let estadoVencimiento = null;

      if (doc.tieneVencimiento && doc.fechaVencimiento) {
        const diffTime = doc.fechaVencimiento - now;
        diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) {
          estadoVencimiento = 'VENCIDO';
        } else if (diasRestantes <= 7) {
          estadoVencimiento = 'URGENTE';
        } else if (diasRestantes <= 15) {
          estadoVencimiento = 'PROXIMO';
        } else if (diasRestantes <= 30) {
          estadoVencimiento = 'ADVERTENCIA';
        } else {
          estadoVencimiento = 'VIGENTE';
        }
      }

      return {
        ...doc,
        diasRestantes,
        estadoVencimiento,
      };
    });

    return {
      documentos: documentosConEstado,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un documento por ID
   */
  async findById(id) {
    const documento = await prisma.documentoLegalInfraestructura.findUnique({
      where: { id },
      include: {
        carpeta: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        alertas: {
          orderBy: {
            fechaAlerta: 'desc',
          },
        },
      },
    });

    if (!documento) {
      throw new NotFoundError('Documento legal no encontrado');
    }

    // Calcular días restantes
    let diasRestantes = null;
    let estadoVencimiento = null;

    if (documento.tieneVencimiento && documento.fechaVencimiento) {
      const now = new Date();
      const diffTime = documento.fechaVencimiento - now;
      diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diasRestantes < 0) {
        estadoVencimiento = 'VENCIDO';
      } else if (diasRestantes <= 7) {
        estadoVencimiento = 'URGENTE';
      } else if (diasRestantes <= 15) {
        estadoVencimiento = 'PROXIMO';
      } else if (diasRestantes <= 30) {
        estadoVencimiento = 'ADVERTENCIA';
      } else {
        estadoVencimiento = 'VIGENTE';
      }
    }

    return {
      ...documento,
      diasRestantes,
      estadoVencimiento,
    };
  }

  /**
   * Crear un nuevo documento legal
   */
  async create(data, archivo, usuarioId) {
    // Validaciones
    if (!archivo) {
      throw new ValidationError('El archivo es requerido');
    }

    if (!data.nombre) {
      throw new ValidationError('El nombre del documento es requerido');
    }

    if (!data.tipoDocumento) {
      throw new ValidationError('El tipo de documento es requerido');
    }

    // Validar fechas si tiene vencimiento
    if (data.tieneVencimiento) {
      if (!data.fechaVencimiento) {
        throw new ValidationError('La fecha de vencimiento es requerida cuando el documento tiene vencimiento');
      }

      const fechaVencimiento = new Date(data.fechaVencimiento);
      const now = new Date();

      if (fechaVencimiento < now) {
        throw new ValidationError('La fecha de vencimiento no puede ser anterior a la fecha actual');
      }
    }

    // Verificar que la carpeta existe (si se proporciona)
    if (data.carpetaId) {
      const carpeta = await prisma.carpetaCalidad2.findUnique({
        where: { id: data.carpetaId },
      });

      if (!carpeta) {
        throw new NotFoundError('Carpeta no encontrada');
      }
    }

    // Preparar datos para crear
    const createData = {
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento || null,
      entidadEmisora: data.entidadEmisora || null,
      archivoUrl: archivo.archivoUrl,
      archivoNombre: archivo.archivoNombre,
      archivoTipo: archivo.archivoTipo,
      archivoTamano: archivo.archivoTamano,
      fechaEmision: data.fechaEmision ? new Date(data.fechaEmision) : null,
      fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
      tieneVencimiento: data.tieneVencimiento || false,
      diasAlerta: data.diasAlerta || [30, 15, 7],
      carpetaId: data.carpetaId || null,
      subidoPor: usuarioId,
    };

    const documento = await prisma.documentoLegalInfraestructura.create({
      data: createData,
      include: {
        carpeta: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    return documento;
  }

  /**
   * Actualizar un documento legal
   */
  async update(id, data, archivo = null) {
    const documentoExistente = await this.findById(id);

    const updateData = {
      nombre: data.nombre !== undefined ? data.nombre : documentoExistente.nombre,
      descripcion: data.descripcion !== undefined ? data.descripcion : documentoExistente.descripcion,
      tipoDocumento: data.tipoDocumento !== undefined ? data.tipoDocumento : documentoExistente.tipoDocumento,
      numeroDocumento: data.numeroDocumento !== undefined ? data.numeroDocumento : documentoExistente.numeroDocumento,
      entidadEmisora: data.entidadEmisora !== undefined ? data.entidadEmisora : documentoExistente.entidadEmisora,
      fechaEmision: data.fechaEmision !== undefined ? (data.fechaEmision ? new Date(data.fechaEmision) : null) : documentoExistente.fechaEmision,
      fechaVencimiento: data.fechaVencimiento !== undefined ? (data.fechaVencimiento ? new Date(data.fechaVencimiento) : null) : documentoExistente.fechaVencimiento,
      tieneVencimiento: data.tieneVencimiento !== undefined ? data.tieneVencimiento : documentoExistente.tieneVencimiento,
      diasAlerta: data.diasAlerta !== undefined ? data.diasAlerta : documentoExistente.diasAlerta,
      carpetaId: data.carpetaId !== undefined ? data.carpetaId : documentoExistente.carpetaId,
    };

    // Si se proporciona un nuevo archivo, actualizarlo
    if (archivo) {
      updateData.archivoUrl = archivo.archivoUrl;
      updateData.archivoNombre = archivo.archivoNombre;
      updateData.archivoTipo = archivo.archivoTipo;
      updateData.archivoTamano = archivo.archivoTamano;
    }

    // Validar fechas si tiene vencimiento
    if (updateData.tieneVencimiento && updateData.fechaVencimiento) {
      const fechaVencimiento = new Date(updateData.fechaVencimiento);
      const now = new Date();

      if (fechaVencimiento < now) {
        throw new ValidationError('La fecha de vencimiento no puede ser anterior a la fecha actual');
      }
    }

    const documentoActualizado = await prisma.documentoLegalInfraestructura.update({
      where: { id },
      data: updateData,
      include: {
        carpeta: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    return documentoActualizado;
  }

  /**
   * Eliminar (soft delete) un documento legal
   */
  async delete(id) {
    await this.findById(id); // Verifica que existe

    const documentoEliminado = await prisma.documentoLegalInfraestructura.update({
      where: { id },
      data: { activo: false },
    });

    return documentoEliminado;
  }

  /**
   * Obtener documentos por carpeta
   */
  async findByCarpeta(carpetaId, filters = {}) {
    return this.findAll({ ...filters, carpetaId });
  }

  /**
   * Obtener documentos próximos a vencer
   */
  async getProximosAVencer(diasAnticipacion = 30) {
    const now = new Date();
    const fechaLimite = new Date(now);
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    const documentos = await prisma.documentoLegalInfraestructura.findMany({
      where: {
        activo: true,
        tieneVencimiento: true,
        fechaVencimiento: {
          gte: now,
          lte: fechaLimite,
        },
      },
      include: {
        carpeta: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        alertas: {
          where: {
            estado: {
              not: 'RESUELTO',
            },
          },
        },
      },
      orderBy: {
        fechaVencimiento: 'asc',
      },
    });

    // Calcular días restantes
    const documentosConDias = documentos.map(doc => {
      const diffTime = doc.fechaVencimiento - now;
      const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let estadoVencimiento = 'VIGENTE';
      if (diasRestantes <= 7) {
        estadoVencimiento = 'URGENTE';
      } else if (diasRestantes <= 15) {
        estadoVencimiento = 'PROXIMO';
      } else if (diasRestantes <= 30) {
        estadoVencimiento = 'ADVERTENCIA';
      }

      return {
        ...doc,
        diasRestantes,
        estadoVencimiento,
      };
    });

    return documentosConDias;
  }

  /**
   * Obtener documentos vencidos
   */
  async getVencidos() {
    const now = new Date();

    const documentos = await prisma.documentoLegalInfraestructura.findMany({
      where: {
        activo: true,
        tieneVencimiento: true,
        fechaVencimiento: {
          lt: now,
        },
      },
      include: {
        carpeta: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        alertas: {
          where: {
            estado: {
              not: 'RESUELTO',
            },
          },
        },
      },
      orderBy: {
        fechaVencimiento: 'desc',
      },
    });

    // Calcular días vencidos
    const documentosConDias = documentos.map(doc => {
      const diffTime = now - doc.fechaVencimiento;
      const diasVencidos = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...doc,
        diasVencidos,
        diasRestantes: -diasVencidos,
        estadoVencimiento: 'VENCIDO',
      };
    });

    return documentosConDias;
  }

  /**
   * Obtener estadísticas de documentos
   */
  async getEstadisticas() {
    const now = new Date();
    const fecha7Dias = new Date(now);
    fecha7Dias.setDate(fecha7Dias.getDate() + 7);
    const fecha15Dias = new Date(now);
    fecha15Dias.setDate(fecha15Dias.getDate() + 15);
    const fecha30Dias = new Date(now);
    fecha30Dias.setDate(fecha30Dias.getDate() + 30);

    const [
      totalDocumentos,
      documentosConVencimiento,
      vencidos,
      proximosVencer7,
      proximosVencer15,
      proximosVencer30,
      porTipo,
    ] = await Promise.all([
      prisma.documentoLegalInfraestructura.count({ where: { activo: true } }),
      prisma.documentoLegalInfraestructura.count({
        where: { activo: true, tieneVencimiento: true },
      }),
      prisma.documentoLegalInfraestructura.count({
        where: {
          activo: true,
          tieneVencimiento: true,
          fechaVencimiento: { lt: now },
        },
      }),
      prisma.documentoLegalInfraestructura.count({
        where: {
          activo: true,
          tieneVencimiento: true,
          fechaVencimiento: { gte: now, lte: fecha7Dias },
        },
      }),
      prisma.documentoLegalInfraestructura.count({
        where: {
          activo: true,
          tieneVencimiento: true,
          fechaVencimiento: { gte: now, lte: fecha15Dias },
        },
      }),
      prisma.documentoLegalInfraestructura.count({
        where: {
          activo: true,
          tieneVencimiento: true,
          fechaVencimiento: { gte: now, lte: fecha30Dias },
        },
      }),
      prisma.documentoLegalInfraestructura.groupBy({
        by: ['tipoDocumento'],
        where: { activo: true },
        _count: true,
      }),
    ]);

    return {
      totalDocumentos,
      documentosConVencimiento,
      documentosSinVencimiento: totalDocumentos - documentosConVencimiento,
      vencidos,
      proximosVencer: {
        proximos7Dias: proximosVencer7,
        proximos15Dias: proximosVencer15,
        proximos30Dias: proximosVencer30,
      },
      porTipo: porTipo.map(t => ({
        tipo: t.tipoDocumento,
        cantidad: t._count,
      })),
    };
  }
}

module.exports = new DocumentoLegalService();
