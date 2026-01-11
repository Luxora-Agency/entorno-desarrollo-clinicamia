const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class GPCService {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      patologia = '',
      estado = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { activo: true };

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { fuenteGuia: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (patologia) where.patologia = patologia;
    if (estado) where.estado = estado;

    const [guias, total] = await Promise.all([
      prisma.guiaPracticaClinica.findMany({
        where,
        include: {
          creador: { select: { id: true, nombre: true, apellido: true, email: true } },
          responsable: { select: { id: true, nombre: true, apellido: true } },
          documentos: {
            where: { activo: true },
            orderBy: { createdAt: 'desc' },
          },
          bibliografia: {
            where: { activo: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.guiaPracticaClinica.count({ where }),
    ]);

    return {
      data: guias,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async findById(id) {
    const guia = await prisma.guiaPracticaClinica.findUnique({
      where: { id },
      include: {
        creador: { select: { id: true, nombre: true, apellido: true, email: true } },
        responsable: { select: { id: true, nombre: true, apellido: true, email: true } },
        documentos: {
          where: { activo: true },
          include: {
            cargador: { select: { id: true, nombre: true, apellido: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        bibliografia: {
          where: { activo: true },
          orderBy: { createdAt: 'desc' },
        },
        evaluacionesAdherencia: {
          include: {
            evaluador: { select: { id: true, nombre: true, apellido: true } },
          },
          orderBy: { fechaEvaluacion: 'desc' },
        },
      },
    });

    if (!guia || !guia.activo) {
      throw new NotFoundError('Guía de práctica clínica no encontrada');
    }

    return guia;
  }

  async findByPatologia(patologia, query = {}) {
    const { page = 1, limit = 50 } = query;
    return this.findAll({ ...query, patologia, page, limit });
  }

  async create(data, userId) {
    // Check if code already exists
    const existing = await prisma.guiaPracticaClinica.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      throw new ValidationError('Ya existe una GPC con este código');
    }

    const guia = await prisma.guiaPracticaClinica.create({
      data: {
        ...data,
        creadoPor: userId,
        responsableAdopcion: data.responsableAdopcion || userId,
        estado: data.estado || 'VIGENTE',
      },
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        responsable: { select: { id: true, nombre: true, apellido: true } },
        documentos: true,
      },
    });

    return guia;
  }

  async update(id, data) {
    const existing = await this.findById(id);

    // Cannot edit if obsolete
    if (existing.estado === 'OBSOLETA' && data.estado !== 'VIGENTE') {
      throw new ValidationError(
        'No se puede editar una GPC obsoleta. Debe marcarla como vigente primero.'
      );
    }

    const updated = await prisma.guiaPracticaClinica.update({
      where: { id },
      data,
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        responsable: { select: { id: true, nombre: true, apellido: true } },
        documentos: { where: { activo: true } },
        bibliografia: { where: { activo: true } },
      },
    });

    return updated;
  }

  async delete(id) {
    const existing = await this.findById(id);

    if (existing.estado === 'VIGENTE') {
      throw new ValidationError(
        'No se puede eliminar una GPC vigente. Debe marcarla como obsoleta primero.'
      );
    }

    await prisma.guiaPracticaClinica.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'GPC eliminada exitosamente' };
  }

  async marcarObsoleta(id, userId) {
    const existing = await this.findById(id);

    const obsoleta = await prisma.guiaPracticaClinica.update({
      where: { id },
      data: {
        estado: 'OBSOLETA',
      },
    });

    return obsoleta;
  }

  async uploadDocumento(gpcId, file, metadata, userId) {
    await this.findById(gpcId);

    const documento = await prisma.documentoGPC.create({
      data: {
        gpcId,
        nombre: metadata.nombre || file.name,
        archivoUrl: metadata.archivoUrl,
        archivoNombre: file.name,
        archivoTipo: file.type,
        archivoTamano: file.size,
        tipoDocumento: metadata.tipoDocumento || 'PDF_GUIA',
        cargadoPor: userId,
      },
    });

    return documento;
  }

  async deleteDocumento(documentoId) {
    await prisma.documentoGPC.update({
      where: { id: documentoId },
      data: { activo: false },
    });

    return { message: 'Documento eliminado exitosamente' };
  }

  // AGREE II Evaluation
  async evaluarAGREE(id, evaluacion, userId) {
    const existing = await this.findById(id);

    if (existing.evaluacionAGREE) {
      throw new ValidationError('Esta GPC ya tiene evaluación AGREE II. Use actualizar si desea modificarla.');
    }

    const updated = await prisma.guiaPracticaClinica.update({
      where: { id },
      data: {
        evaluacionAGREE: true,
        puntajeAGREE: evaluacion.puntajeAGREE,
        dominiosAGREE: JSON.stringify(evaluacion.dominiosAGREE),
        recomendacion: evaluacion.recomendacion,
      },
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        responsable: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return updated;
  }

  async actualizarEvaluacionAGREE(id, evaluacion, userId) {
    await this.findById(id);

    const updated = await prisma.guiaPracticaClinica.update({
      where: { id },
      data: {
        evaluacionAGREE: true,
        puntajeAGREE: evaluacion.puntajeAGREE,
        dominiosAGREE: JSON.stringify(evaluacion.dominiosAGREE),
        recomendacion: evaluacion.recomendacion,
      },
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        responsable: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return updated;
  }

  async registrarTamizaje(id, tamizaje, userId) {
    await this.findById(id);

    const updated = await prisma.guiaPracticaClinica.update({
      where: { id },
      data: {
        tamizajeRealizado: true,
        resultadoTamizaje: tamizaje.resultadoTamizaje,
      },
    });

    return updated;
  }

  // Bibliografia management
  async addBibliografia(gpcId, data) {
    await this.findById(gpcId);

    const bibliografia = await prisma.bibliografiaGPC.create({
      data: {
        gpcId,
        ...data,
      },
    });

    return bibliografia;
  }

  async updateBibliografia(id, data) {
    const bibliografia = await prisma.bibliografiaGPC.update({
      where: { id },
      data,
    });

    return bibliografia;
  }

  async deleteBibliografia(id) {
    await prisma.bibliografiaGPC.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Bibliografía eliminada exitosamente' };
  }

  async getBibliografia(gpcId) {
    await this.findById(gpcId);

    const bibliografia = await prisma.bibliografiaGPC.findMany({
      where: {
        gpcId,
        activo: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bibliografia;
  }

  // Adherence evaluations
  async createEvaluacionAdherencia(gpcId, data, userId) {
    await this.findById(gpcId);

    // Calculate percentage
    const porcentajeAdherencia = (data.casosAdherentes / data.casosEvaluados) * 100;

    const evaluacion = await prisma.evaluacionAdherenciaGPC.create({
      data: {
        gpcId,
        ...data,
        porcentajeAdherencia,
        evaluadoPor: userId,
      },
      include: {
        gpc: { select: { id: true, nombre: true, codigo: true } },
        evaluador: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return evaluacion;
  }

  async getEvaluacionesAdherencia(gpcId) {
    await this.findById(gpcId);

    const evaluaciones = await prisma.evaluacionAdherenciaGPC.findMany({
      where: {
        gpcId,
        activo: true,
      },
      include: {
        evaluador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fechaEvaluacion: 'desc' },
    });

    return evaluaciones;
  }

  async getEstadisticas(filters = {}) {
    const { patologia } = filters;
    const whereBase = { activo: true };
    if (patologia) whereBase.patologia = patologia;

    const [
      total,
      porPatologia,
      porEstado,
      porFuente,
      conEvaluacionAGREE,
      sinEvaluacionAGREE,
      recomendadas,
      proximasRevision,
      obsoletas,
      promedioAdherencia,
    ] = await Promise.all([
      prisma.guiaPracticaClinica.count({ where: whereBase }),

      prisma.guiaPracticaClinica.groupBy({
        by: ['patologia'],
        where: whereBase,
        _count: true,
      }),

      prisma.guiaPracticaClinica.groupBy({
        by: ['estado'],
        where: whereBase,
        _count: true,
      }),

      prisma.guiaPracticaClinica.groupBy({
        by: ['fuenteGuia'],
        where: whereBase,
        _count: true,
      }),

      prisma.guiaPracticaClinica.count({
        where: { ...whereBase, evaluacionAGREE: true },
      }),

      prisma.guiaPracticaClinica.count({
        where: { ...whereBase, evaluacionAGREE: false },
      }),

      prisma.guiaPracticaClinica.count({
        where: { ...whereBase, recomendacion: 'RECOMENDADA' },
      }),

      prisma.guiaPracticaClinica.count({
        where: {
          ...whereBase,
          proximaRevision: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.guiaPracticaClinica.count({
        where: { ...whereBase, estado: 'OBSOLETA' },
      }),

      // Average adherence from evaluations
      prisma.evaluacionAdherenciaGPC.aggregate({
        where: {
          activo: true,
          gpc: whereBase,
        },
        _avg: {
          porcentajeAdherencia: true,
        },
      }),
    ]);

    return {
      total,
      porPatologia: porPatologia.reduce((acc, item) => {
        acc[item.patologia] = item._count;
        return acc;
      }, {}),
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {}),
      porFuente: porFuente.reduce((acc, item) => {
        acc[item.fuenteGuia] = item._count;
        return acc;
      }, {}),
      conEvaluacionAGREE,
      sinEvaluacionAGREE,
      recomendadas,
      proximasRevision,
      obsoletas,
      promedioAdherenciaGeneral: promedioAdherencia._avg.porcentajeAdherencia || 0,
    };
  }
}

module.exports = new GPCService();
