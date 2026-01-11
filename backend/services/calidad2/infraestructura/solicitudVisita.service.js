const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

/**
 * Servicio para gestión de Solicitudes de Visita de Inspección
 *
 * Permite gestionar solicitudes de visitas de entidades de inspección
 * (Secretaría de Salud, etc.) con documentación adjunta.
 */
class SolicitudVisitaService {
  /**
   * Crear solicitud de visita
   */
  async create(data, usuarioId) {
    return prisma.solicitudVisitaInspeccion.create({
      data: {
        conceptoId: data.conceptoId || null,
        anio: data.anio,
        fechaSolicitud: new Date(data.fechaSolicitud),
        fechaProgramada: data.fechaProgramada ? new Date(data.fechaProgramada) : null,
        entidadSolicitante: data.entidadSolicitante,
        motivo: data.motivo,
        estado: data.estado || 'PROGRAMADA',
        observaciones: data.observaciones || null,
        solicitadoPor: usuarioId,
      },
      include: {
        concepto: {
          select: {
            id: true,
            anio: true,
            numeroConcepto: true,
          },
        },
        solicitante: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        documentos: true,
      },
    });
  }

  /**
   * Obtener todas las solicitudes con filtros
   */
  async findAll(filters = {}) {
    const { anio, estado, page = 1, limit = 50 } = filters;

    const where = {
      activo: true,
    };

    if (anio) where.anio = parseInt(anio);
    if (estado) where.estado = estado;

    const [solicitudes, total] = await Promise.all([
      prisma.solicitudVisitaInspeccion.findMany({
        where,
        include: {
          concepto: {
            select: {
              id: true,
              anio: true,
              numeroConcepto: true,
              estadoGeneral: true,
            },
          },
          solicitante: {
            select: { nombre: true, apellido: true },
          },
          documentos: {
            select: { id: true, nombre: true, tipoDocumento: true },
          },
        },
        orderBy: [
          { fechaSolicitud: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.solicitudVisitaInspeccion.count({ where }),
    ]);

    return {
      data: solicitudes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener solicitudes por año
   */
  async findByAnio(anio) {
    return prisma.solicitudVisitaInspeccion.findMany({
      where: {
        anio: parseInt(anio),
        activo: true,
      },
      include: {
        concepto: {
          select: {
            id: true,
            anio: true,
            numeroConcepto: true,
          },
        },
        solicitante: {
          select: { nombre: true, apellido: true },
        },
        documentos: true,
      },
      orderBy: { fechaSolicitud: 'desc' },
    });
  }

  /**
   * Obtener solicitud por ID
   */
  async findById(id) {
    const solicitud = await prisma.solicitudVisitaInspeccion.findUnique({
      where: { id },
      include: {
        concepto: {
          include: {
            items: {
              select: { numero: true, cumple: true },
            },
          },
        },
        solicitante: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        documentos: {
          include: {
            usuario: {
              select: { nombre: true, apellido: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!solicitud) {
      throw new NotFoundError('Solicitud de visita no encontrada');
    }

    return solicitud;
  }

  /**
   * Actualizar solicitud
   */
  async update(id, data) {
    await this.findById(id);

    return prisma.solicitudVisitaInspeccion.update({
      where: { id },
      data: {
        fechaSolicitud: data.fechaSolicitud ? new Date(data.fechaSolicitud) : undefined,
        fechaProgramada: data.fechaProgramada ? new Date(data.fechaProgramada) : undefined,
        entidadSolicitante: data.entidadSolicitante,
        motivo: data.motivo,
        estado: data.estado,
        observaciones: data.observaciones,
      },
      include: {
        concepto: true,
        solicitante: {
          select: { nombre: true, apellido: true },
        },
        documentos: true,
      },
    });
  }

  /**
   * Cambiar estado de la solicitud
   */
  async cambiarEstado(id, nuevoEstado) {
    await this.findById(id);

    const estadosValidos = ['PROGRAMADA', 'REALIZADA', 'CANCELADA'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new ValidationError(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
    }

    return prisma.solicitudVisitaInspeccion.update({
      where: { id },
      data: { estado: nuevoEstado },
      include: {
        concepto: true,
        solicitante: { select: { nombre: true, apellido: true } },
        documentos: true,
      },
    });
  }

  /**
   * Soft delete
   */
  async delete(id) {
    await this.findById(id);

    return prisma.solicitudVisitaInspeccion.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Subir documento a la solicitud
   */
  async uploadDocumento(solicitudId, archivo, metadata, usuarioId) {
    await this.findById(solicitudId);

    return prisma.documentoSolicitudVisita.create({
      data: {
        solicitudId,
        nombre: metadata.nombre,
        descripcion: metadata.descripcion || null,
        archivoUrl: archivo.archivoUrl,
        archivoNombre: archivo.archivoNombre,
        archivoTipo: archivo.archivoTipo,
        archivoTamano: archivo.archivoTamano,
        tipoDocumento: metadata.tipoDocumento || 'REQUISITO',
        subidoPor: usuarioId,
      },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Eliminar documento
   */
  async deleteDocumento(documentoId) {
    return prisma.documentoSolicitudVisita.delete({
      where: { id: documentoId },
    });
  }

  /**
   * Obtener estadísticas por año
   */
  async getEstadisticasPorAnio(anio) {
    const solicitudes = await prisma.solicitudVisitaInspeccion.findMany({
      where: { anio: parseInt(anio), activo: true },
    });

    const total = solicitudes.length;
    const programadas = solicitudes.filter(s => s.estado === 'PROGRAMADA').length;
    const realizadas = solicitudes.filter(s => s.estado === 'REALIZADA').length;
    const canceladas = solicitudes.filter(s => s.estado === 'CANCELADA').length;

    return {
      anio: parseInt(anio),
      total,
      programadas,
      realizadas,
      canceladas,
    };
  }

  /**
   * Obtener solicitudes próximas (próximos 30 días)
   */
  async getProximas(dias = 30) {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);

    return prisma.solicitudVisitaInspeccion.findMany({
      where: {
        fechaProgramada: {
          gte: hoy,
          lte: limite,
        },
        estado: 'PROGRAMADA',
        activo: true,
      },
      include: {
        concepto: {
          select: { anio: true, numeroConcepto: true },
        },
        solicitante: {
          select: { nombre: true, apellido: true },
        },
      },
      orderBy: { fechaProgramada: 'asc' },
    });
  }
}

module.exports = new SolicitudVisitaService();
