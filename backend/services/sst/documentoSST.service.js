/**
 * Servicio de Documentos SG-SST
 * Gestiona documentacion controlada del sistema
 * Normativa: Decreto 1072/2015, ISO 45001
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class DocumentoSSTService {
  /**
   * Listar documentos con filtros
   */
  async findAll({ page = 1, limit = 20, tipo, estado, proceso }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipoDocumento = tipo;
    if (estado) where.estado = estado;
    if (proceso) where.proceso = proceso;

    const [documentos, total] = await Promise.all([
      prisma.sSTDocumentoSST.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ proceso: 'asc' }, { codigo: 'asc' }],
        include: {
          responsable: {
            select: { id: true, nombre: true, apellido: true },
          },
        },
      }),
      prisma.sSTDocumentoSST.count({ where }),
    ]);

    return {
      data: documentos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener documento por ID con historial
   */
  async findById(id) {
    const documento = await prisma.sSTDocumentoSST.findUnique({
      where: { id },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
        historial: {
          orderBy: { version: 'desc' },
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
  async create(data) {
    // Validar codigo unico
    const existe = await prisma.sSTDocumentoSST.findFirst({
      where: { codigo: data.codigo },
    });

    if (existe) {
      throw new ValidationError('Ya existe un documento con ese codigo');
    }

    const documento = await prisma.$transaction(async (tx) => {
      const doc = await tx.sSTDocumentoSST.create({
        data: {
          codigo: data.codigo,
          nombre: data.nombre,
          tipoDocumento: data.tipoDocumento, // POLITICA, PROGRAMA, PROCEDIMIENTO, FORMATO, INSTRUCTIVO, MANUAL, GUIA
          proceso: data.proceso, // PLANEAR, HACER, VERIFICAR, ACTUAR
          version: 1,
          fechaElaboracion: new Date(data.fechaElaboracion),
          fechaAprobacion: data.fechaAprobacion ? new Date(data.fechaAprobacion) : null,
          fechaVigencia: data.fechaVigencia ? new Date(data.fechaVigencia) : null,
          elaboradoPor: data.elaboradoPor,
          revisadoPor: data.revisadoPor,
          aprobadoPor: data.aprobadoPor,
          responsableId: data.responsableId,
          resumen: data.resumen,
          urlDocumento: data.urlDocumento,
          estado: 'BORRADOR',
        },
      });

      // Registrar en historial
      await tx.sSTHistorialDocumento.create({
        data: {
          documentoId: doc.id,
          version: 1,
          fechaCambio: new Date(),
          descripcionCambio: 'Creacion inicial del documento',
          cambiadoPor: data.elaboradoPor,
          urlVersion: data.urlDocumento,
        },
      });

      return doc;
    });

    return documento;
  }

  /**
   * Actualizar documento (nueva version)
   */
  async update(id, data) {
    const documento = await prisma.sSTDocumentoSST.findUnique({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    const nuevaVersion = documento.version + 1;

    const updated = await prisma.$transaction(async (tx) => {
      const doc = await tx.sSTDocumentoSST.update({
        where: { id },
        data: {
          nombre: data.nombre,
          resumen: data.resumen,
          version: nuevaVersion,
          fechaActualizacion: new Date(),
          elaboradoPor: data.elaboradoPor,
          revisadoPor: data.revisadoPor,
          aprobadoPor: data.aprobadoPor,
          urlDocumento: data.urlDocumento,
          estado: data.estado || 'EN_REVISION',
        },
      });

      // Registrar en historial
      await tx.sSTHistorialDocumento.create({
        data: {
          documentoId: id,
          version: nuevaVersion,
          fechaCambio: new Date(),
          descripcionCambio: data.descripcionCambio || 'Actualizacion del documento',
          cambiadoPor: data.elaboradoPor,
          urlVersion: data.urlDocumento,
        },
      });

      return doc;
    });

    return updated;
  }

  /**
   * Aprobar documento
   */
  async aprobar(id, data) {
    const documento = await prisma.sSTDocumentoSST.findUnique({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    // Calcular fecha de vencimiento (por defecto 1 año)
    const fechaVigencia = new Date();
    fechaVigencia.setFullYear(fechaVigencia.getFullYear() + 1);

    return prisma.sSTDocumentoSST.update({
      where: { id },
      data: {
        estado: 'VIGENTE',
        fechaAprobacion: new Date(),
        fechaVigencia,
        aprobadoPor: data.aprobadoPor,
      },
    });
  }

  /**
   * Obsoletear documento
   */
  async obsoletear(id, motivo) {
    const documento = await prisma.sSTDocumentoSST.findUnique({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return prisma.$transaction(async (tx) => {
      const doc = await tx.sSTDocumentoSST.update({
        where: { id },
        data: {
          estado: 'OBSOLETO',
          fechaObsoleto: new Date(),
        },
      });

      await tx.sSTHistorialDocumento.create({
        data: {
          documentoId: id,
          version: documento.version,
          fechaCambio: new Date(),
          descripcionCambio: `Documento obsoleto: ${motivo}`,
          cambiadoPor: 'Sistema',
        },
      });

      return doc;
    });
  }

  /**
   * Obtener documentos proximos a vencer
   */
  async getProximosVencer(diasAnticipacion = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    return prisma.sSTDocumentoSST.findMany({
      where: {
        estado: 'VIGENTE',
        fechaVigencia: {
          lte: fechaLimite,
          gte: new Date(),
        },
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
      orderBy: { fechaVigencia: 'asc' },
    });
  }

  /**
   * Obtener documentos vencidos
   */
  async getVencidos() {
    return prisma.sSTDocumentoSST.findMany({
      where: {
        estado: 'VIGENTE',
        fechaVigencia: { lt: new Date() },
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { fechaVigencia: 'asc' },
    });
  }

  /**
   * Buscar documentos
   */
  async buscar(query) {
    return prisma.sSTDocumentoSST.findMany({
      where: {
        OR: [
          { codigo: { contains: query, mode: 'insensitive' } },
          { nombre: { contains: query, mode: 'insensitive' } },
          { resumen: { contains: query, mode: 'insensitive' } },
        ],
        estado: { not: 'OBSOLETO' },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Obtener listado maestro de documentos
   */
  async getListadoMaestro() {
    const documentos = await prisma.sSTDocumentoSST.findMany({
      where: { estado: { not: 'OBSOLETO' } },
      orderBy: [{ proceso: 'asc' }, { tipoDocumento: 'asc' }, { codigo: 'asc' }],
      include: {
        responsable: {
          select: { nombre: true, apellido: true },
        },
      },
    });

    // Agrupar por proceso
    const porProceso = {};
    documentos.forEach(d => {
      if (!porProceso[d.proceso]) {
        porProceso[d.proceso] = [];
      }
      porProceso[d.proceso].push(d);
    });

    return porProceso;
  }

  /**
   * Obtener estadisticas de documentos
   */
  async getEstadisticas() {
    const [
      total,
      porEstado,
      porTipo,
      porProceso,
    ] = await Promise.all([
      prisma.sSTDocumentoSST.count(),
      prisma.sSTDocumentoSST.groupBy({
        by: ['estado'],
        _count: true,
      }),
      prisma.sSTDocumentoSST.groupBy({
        by: ['tipoDocumento'],
        _count: true,
      }),
      prisma.sSTDocumentoSST.groupBy({
        by: ['proceso'],
        _count: true,
      }),
    ]);

    const vencidos = await prisma.sSTDocumentoSST.count({
      where: {
        estado: 'VIGENTE',
        fechaVigencia: { lt: new Date() },
      },
    });

    return {
      total,
      vencidos,
      porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count })),
      porTipo: porTipo.map(t => ({ tipo: t.tipoDocumento, cantidad: t._count })),
      porProceso: porProceso.map(p => ({ proceso: p.proceso, cantidad: p._count })),
    };
  }
}

module.exports = new DocumentoSSTService();
