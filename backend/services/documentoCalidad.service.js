/**
 * Service de Gestión Documental de Calidad
 * Gestión de documentos, versiones y socialización
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class DocumentoCalidadService {
  // ==========================================
  // DOCUMENTOS DE CALIDAD
  // ==========================================

  /**
   * Obtener documentos con filtros
   */
  async getDocumentos(query = {}) {
    const {
      page = 1,
      limit = 10,
      tipo,
      estado,
      procesoRelacionado,
      search,
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(tipo && { tipo }),
      ...(estado && { estado }),
      ...(procesoRelacionado && { procesoRelacionado }),
      ...(search && {
        OR: [
          { codigo: { contains: search, mode: 'insensitive' } },
          { nombre: { contains: search, mode: 'insensitive' } },
          { palabrasClave: { hasSome: [search.toLowerCase()] } },
        ],
      }),
    };

    const [documentos, total] = await Promise.all([
      prisma.documentoCalidad.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          elaborador: {
            select: { nombre: true, apellido: true },
          },
          revisor: {
            select: { nombre: true, apellido: true },
          },
          aprobador: {
            select: { nombre: true, apellido: true },
          },
          _count: {
            select: {
              historialVersiones: true,
              socializaciones: true,
            },
          },
        },
        orderBy: [{ estado: 'asc' }, { codigo: 'asc' }],
      }),
      prisma.documentoCalidad.count({ where }),
    ]);

    return {
      documentos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener documento por ID
   */
  async getDocumentoById(id) {
    const documento = await prisma.documentoCalidad.findUnique({
      where: { id },
      include: {
        elaborador: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        revisor: {
          select: { id: true, nombre: true, apellido: true },
        },
        aprobador: {
          select: { id: true, nombre: true, apellido: true },
        },
        historialVersiones: {
          include: {
            modificador: { select: { nombre: true, apellido: true } },
          },
          orderBy: { fechaCambio: 'desc' },
        },
        socializaciones: {
          include: {
            realizador: { select: { nombre: true, apellido: true } },
          },
          orderBy: { fechaSocializacion: 'desc' },
        },
      },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return documento;
  }

  /**
   * Obtener documento por código
   */
  async getDocumentoByCodigo(codigo) {
    const documento = await prisma.documentoCalidad.findUnique({
      where: { codigo },
      include: {
        historialVersiones: {
          orderBy: { fechaCambio: 'desc' },
        },
      },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return documento;
  }

  /**
   * Crear documento
   */
  async createDocumento(data) {
    const {
      codigo,
      nombre,
      tipo,
      version,
      procesoRelacionado,
      resumen,
      archivoUrl,
      elaboradoPor,
      palabrasClave,
    } = data;

    // Validar código único
    const existing = await prisma.documentoCalidad.findUnique({ where: { codigo } });
    if (existing) {
      throw new ValidationError('Ya existe un documento con este código');
    }

    return prisma.documentoCalidad.create({
      data: {
        codigo,
        nombre,
        tipo,
        version: version || '1.0',
        fechaElaboracion: new Date(),
        procesoRelacionado,
        resumen,
        archivoUrl,
        elaboradoPor,
        palabrasClave: palabrasClave || [],
        estado: 'BORRADOR',
      },
      include: {
        elaborador: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Actualizar documento
   */
  async updateDocumento(id, data) {
    const documento = await prisma.documentoCalidad.findUnique({ where: { id } });
    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return prisma.documentoCalidad.update({
      where: { id },
      data,
    });
  }

  /**
   * Enviar documento a revisión
   */
  async enviarARevision(id, revisadoPor) {
    const documento = await prisma.documentoCalidad.findUnique({ where: { id } });
    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    if (documento.estado !== 'BORRADOR') {
      throw new ValidationError('Solo se pueden enviar a revisión documentos en estado borrador');
    }

    return prisma.documentoCalidad.update({
      where: { id },
      data: {
        revisadoPor,
        estado: 'EN_REVISION',
      },
    });
  }

  /**
   * Aprobar documento
   */
  async aprobarDocumento(id, aprobadoPor, vigenciaMeses = 24) {
    const documento = await prisma.documentoCalidad.findUnique({ where: { id } });
    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    if (documento.estado !== 'EN_REVISION') {
      throw new ValidationError('Solo se pueden aprobar documentos en revisión');
    }

    const fechaAprobacion = new Date();
    const fechaVigencia = new Date();
    fechaVigencia.setMonth(fechaVigencia.getMonth() + vigenciaMeses);

    const fechaProximaRevision = new Date(fechaVigencia);
    fechaProximaRevision.setMonth(fechaProximaRevision.getMonth() - 3); // 3 meses antes de vencimiento

    return prisma.documentoCalidad.update({
      where: { id },
      data: {
        aprobadoPor,
        fechaRevision: fechaAprobacion,
        fechaAprobacion,
        fechaVigencia,
        fechaProximaRevision,
        estado: 'VIGENTE',
      },
    });
  }

  /**
   * Rechazar documento (devolver a borrador)
   */
  async rechazarDocumento(id, observaciones) {
    const documento = await prisma.documentoCalidad.findUnique({ where: { id } });
    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return prisma.documentoCalidad.update({
      where: { id },
      data: {
        estado: 'BORRADOR',
        resumen: documento.resumen
          ? `${documento.resumen}\n\n[OBSERVACIONES RECHAZO]: ${observaciones}`
          : `[OBSERVACIONES RECHAZO]: ${observaciones}`,
      },
    });
  }

  /**
   * Marcar documento como obsoleto
   */
  async marcarObsoleto(id) {
    const documento = await prisma.documentoCalidad.findUnique({ where: { id } });
    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return prisma.documentoCalidad.update({
      where: { id },
      data: { estado: 'OBSOLETO' },
    });
  }

  // ==========================================
  // CONTROL DE VERSIONES
  // ==========================================

  /**
   * Crear nueva versión del documento
   */
  async crearNuevaVersion(documentoId, data) {
    const { nuevaVersion, cambiosRealizados, archivoUrl, modificadoPor } = data;

    const documento = await prisma.documentoCalidad.findUnique({ where: { id: documentoId } });
    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    // Guardar versión anterior en historial
    await prisma.historialVersionDocumento.create({
      data: {
        documentoId,
        versionAnterior: documento.version,
        versionNueva: nuevaVersion,
        cambiosRealizados,
        archivoAnteriorUrl: documento.archivoUrl,
        fechaCambio: new Date(),
        modificadoPor,
      },
    });

    // Actualizar documento con nueva versión
    return prisma.documentoCalidad.update({
      where: { id: documentoId },
      data: {
        version: nuevaVersion,
        archivoUrl,
        estado: 'BORRADOR', // Nueva versión vuelve a borrador
        fechaAprobacion: null,
        revisadoPor: null,
        aprobadoPor: null,
      },
    });
  }

  /**
   * Obtener historial de versiones
   */
  async getHistorialVersiones(documentoId) {
    const documento = await prisma.documentoCalidad.findUnique({ where: { id: documentoId } });
    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return prisma.historialVersionDocumento.findMany({
      where: { documentoId },
      include: {
        modificador: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaCambio: 'desc' },
    });
  }

  // ==========================================
  // SOCIALIZACIÓN
  // ==========================================

  /**
   * Registrar socialización del documento
   */
  async registrarSocializacion(data) {
    const {
      documentoId,
      metodologia,
      participantes,
      evidenciaUrl,
      observaciones,
      realizadoPor,
    } = data;

    const documento = await prisma.documentoCalidad.findUnique({ where: { id: documentoId } });
    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    if (documento.estado !== 'VIGENTE') {
      throw new ValidationError('Solo se pueden socializar documentos vigentes');
    }

    return prisma.socializacionDocumento.create({
      data: {
        documentoId,
        fechaSocializacion: new Date(),
        metodologia,
        participantes,
        evidenciaUrl,
        observaciones,
        realizadoPor,
      },
      include: {
        realizador: { select: { nombre: true, apellido: true } },
        documento: { select: { codigo: true, nombre: true } },
      },
    });
  }

  /**
   * Obtener socializaciones de un documento
   */
  async getSocializaciones(documentoId) {
    return prisma.socializacionDocumento.findMany({
      where: { documentoId },
      include: {
        realizador: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaSocializacion: 'desc' },
    });
  }

  // ==========================================
  // LISTADO MAESTRO Y REPORTES
  // ==========================================

  /**
   * Obtener listado maestro de documentos
   */
  async getListadoMaestro() {
    const documentos = await prisma.documentoCalidad.findMany({
      where: { estado: { not: 'OBSOLETO' } },
      select: {
        codigo: true,
        nombre: true,
        tipo: true,
        version: true,
        estado: true,
        fechaAprobacion: true,
        fechaVigencia: true,
        procesoRelacionado: true,
        elaborador: { select: { nombre: true, apellido: true } },
        aprobador: { select: { nombre: true, apellido: true } },
      },
      orderBy: [{ tipo: 'asc' }, { codigo: 'asc' }],
    });

    // Agrupar por tipo
    const porTipo = {};
    documentos.forEach((doc) => {
      if (!porTipo[doc.tipo]) {
        porTipo[doc.tipo] = [];
      }
      porTipo[doc.tipo].push(doc);
    });

    return {
      total: documentos.length,
      documentos,
      porTipo,
    };
  }

  /**
   * Obtener documentos próximos a vencer
   */
  async getDocumentosProximosVencer(diasAnticipacion = 90) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    return prisma.documentoCalidad.findMany({
      where: {
        estado: 'VIGENTE',
        fechaVigencia: {
          lte: fechaLimite,
        },
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        tipo: true,
        version: true,
        fechaVigencia: true,
        fechaProximaRevision: true,
        elaborador: { select: { nombre: true, apellido: true, email: true } },
      },
      orderBy: { fechaVigencia: 'asc' },
    });
  }

  /**
   * Dashboard de gestión documental
   */
  async getDashboard() {
    const [
      totalDocumentos,
      documentosPorEstado,
      documentosPorTipo,
      documentosProximosVencer,
      documentosSinSocializar,
      ultimosDocumentos,
    ] = await Promise.all([
      prisma.documentoCalidad.count(),
      prisma.documentoCalidad.groupBy({
        by: ['estado'],
        _count: true,
      }),
      prisma.documentoCalidad.groupBy({
        by: ['tipo'],
        _count: true,
        where: { estado: { not: 'OBSOLETO' } },
      }),
      this.getDocumentosProximosVencer(90),
      prisma.documentoCalidad.findMany({
        where: {
          estado: 'VIGENTE',
          socializaciones: { none: {} },
        },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          fechaAprobacion: true,
        },
      }),
      prisma.documentoCalidad.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          elaborador: { select: { nombre: true, apellido: true } },
        },
      }),
    ]);

    return {
      resumen: {
        totalDocumentos,
        vigentes: documentosPorEstado.find((e) => e.estado === 'VIGENTE')?._count || 0,
        borradores: documentosPorEstado.find((e) => e.estado === 'BORRADOR')?._count || 0,
        enRevision: documentosPorEstado.find((e) => e.estado === 'EN_REVISION')?._count || 0,
        obsoletos: documentosPorEstado.find((e) => e.estado === 'OBSOLETO')?._count || 0,
        proximosVencer: documentosProximosVencer.length,
        sinSocializar: documentosSinSocializar.length,
      },
      documentosPorEstado,
      documentosPorTipo,
      documentosProximosVencer: documentosProximosVencer.slice(0, 5),
      documentosSinSocializar: documentosSinSocializar.slice(0, 5),
      ultimosDocumentos,
    };
  }

  /**
   * Buscar documentos por palabra clave
   */
  async buscarPorPalabraClave(palabraClave) {
    return prisma.documentoCalidad.findMany({
      where: {
        estado: 'VIGENTE',
        OR: [
          { palabrasClave: { hasSome: [palabraClave.toLowerCase()] } },
          { nombre: { contains: palabraClave, mode: 'insensitive' } },
          { resumen: { contains: palabraClave, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        tipo: true,
        version: true,
        archivoUrl: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }
}

module.exports = new DocumentoCalidadService();
