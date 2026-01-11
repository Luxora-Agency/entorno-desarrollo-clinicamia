const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class EventoAdversoService {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      tipoEvento = '',
      clasificacion = '',
      severidad = '',
      estado = '',
      fechaInicio = '',
      fechaFin = '',
      sortBy = 'fechaEvento',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { activo: true };

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { lugarEvento: { contains: search, mode: 'insensitive' } },
        { nombrePaciente: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tipoEvento) where.tipoEvento = tipoEvento;
    if (clasificacion) where.clasificacion = clasificacion;
    if (severidad) where.severidad = severidad;
    if (estado) where.estado = estado;

    if (fechaInicio || fechaFin) {
      where.fechaEvento = {};
      if (fechaInicio) where.fechaEvento.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaEvento.lte = new Date(fechaFin);
    }

    const [eventos, total] = await Promise.all([
      prisma.eventoAdversoPP.findMany({
        where,
        include: {
          paciente: {
            select: { id: true, nombre: true, apellido: true, cedula: true, tipoDocumento: true },
          },
          reportador: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
          documentos: {
            where: { activo: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.eventoAdversoPP.count({ where }),
    ]);

    return {
      data: eventos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async findById(id) {
    const evento = await prisma.eventoAdversoPP.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true,
            tipoDocumento: true,
            fechaNacimiento: true,
          },
        },
        reportador: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        documentos: {
          where: { activo: true },
          include: {
            cargador: { select: { id: true, nombre: true, apellido: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!evento || !evento.activo) {
      throw new NotFoundError('Evento adverso no encontrado');
    }

    return evento;
  }

  async create(data, userId) {
    // Generate unique code
    const year = new Date().getFullYear();
    const count = await prisma.eventoAdversoPP.count({
      where: {
        codigo: { startsWith: `EA-${year}-` },
      },
    });
    const codigo = `EA-${year}-${String(count + 1).padStart(3, '0')}`;

    const evento = await prisma.eventoAdversoPP.create({
      data: {
        ...data,
        codigo,
        reportadoPor: userId,
        estado: 'ABIERTO',
      },
      include: {
        paciente: {
          select: { id: true, nombre: true, apellido: true, cedula: true },
        },
        reportador: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return evento;
  }

  async update(id, data) {
    const existing = await this.findById(id);

    if (existing.estado === 'CERRADO') {
      throw new ValidationError('No se puede editar un evento adverso cerrado');
    }

    const updated = await prisma.eventoAdversoPP.update({
      where: { id },
      data,
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        reportador: { select: { id: true, nombre: true, apellido: true } },
        documentos: { where: { activo: true } },
      },
    });

    return updated;
  }

  async delete(id) {
    const existing = await this.findById(id);

    if (existing.estado === 'CERRADO' && existing.analisisRealizado) {
      throw new ValidationError(
        'No se puede eliminar un evento adverso cerrado con análisis completo'
      );
    }

    await prisma.eventoAdversoPP.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Evento adverso eliminado exitosamente' };
  }

  async analizarEvento(id, analisis, userId) {
    const existing = await this.findById(id);

    if (existing.analisisRealizado) {
      throw new ValidationError('Este evento ya ha sido analizado');
    }

    const updated = await prisma.eventoAdversoPP.update({
      where: { id },
      data: {
        analisisRealizado: true,
        fechaAnalisis: new Date(),
        metodoAnalisis: analisis.metodoAnalisis || 'PROTOCOLO_LONDRES',
        resultadoAnalisis: analisis.resultadoAnalisis,
        accionesPreventivas: analisis.accionesPreventivas,
        responsableAcciones: analisis.responsableAcciones,
        estado: 'EN_ANALISIS',
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        reportador: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return updated;
  }

  async cerrarEvento(id, data, userId) {
    const existing = await this.findById(id);

    if (!existing.analisisRealizado) {
      throw new ValidationError(
        'Debe realizar el análisis del evento antes de cerrarlo'
      );
    }

    const updated = await prisma.eventoAdversoPP.update({
      where: { id },
      data: {
        estado: 'CERRADO',
        fechaCierreAcciones: new Date(),
        accionesPreventivas: data.accionesPreventivas || existing.accionesPreventivas,
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        reportador: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return updated;
  }

  async getEstadisticas(filters = {}) {
    const { fechaInicio, fechaFin, tipoEvento } = filters;
    const whereBase = { activo: true };

    if (fechaInicio || fechaFin) {
      whereBase.fechaEvento = {};
      if (fechaInicio) whereBase.fechaEvento.gte = new Date(fechaInicio);
      if (fechaFin) whereBase.fechaEvento.lte = new Date(fechaFin);
    }
    if (tipoEvento) whereBase.tipoEvento = tipoEvento;

    const [
      totalEventos,
      porTipo,
      porSeveridad,
      porClasificacion,
      porEstado,
      evitables,
      noEvitables,
      conAnalisis,
      sinAnalisis,
      ultimoMes,
      graves,
    ] = await Promise.all([
      prisma.eventoAdversoPP.count({ where: whereBase }),

      prisma.eventoAdversoPP.groupBy({
        by: ['tipoEvento'],
        where: whereBase,
        _count: true,
      }),

      prisma.eventoAdversoPP.groupBy({
        by: ['severidad'],
        where: whereBase,
        _count: true,
      }),

      prisma.eventoAdversoPP.groupBy({
        by: ['clasificacion'],
        where: whereBase,
        _count: true,
      }),

      prisma.eventoAdversoPP.groupBy({
        by: ['estado'],
        where: whereBase,
        _count: true,
      }),

      prisma.eventoAdversoPP.count({
        where: { ...whereBase, evitable: true },
      }),

      prisma.eventoAdversoPP.count({
        where: { ...whereBase, evitable: false },
      }),

      prisma.eventoAdversoPP.count({
        where: { ...whereBase, analisisRealizado: true },
      }),

      prisma.eventoAdversoPP.count({
        where: { ...whereBase, analisisRealizado: false, estado: { not: 'CERRADO' } },
      }),

      prisma.eventoAdversoPP.count({
        where: {
          activo: true,
          fechaEvento: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.eventoAdversoPP.count({
        where: { ...whereBase, severidad: 'GRAVE' },
      }),
    ]);

    return {
      total: totalEventos,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipoEvento] = item._count;
        return acc;
      }, {}),
      porSeveridad: porSeveridad.reduce((acc, item) => {
        acc[item.severidad] = item._count;
        return acc;
      }, {}),
      porClasificacion: porClasificacion.reduce((acc, item) => {
        acc[item.clasificacion] = item._count;
        return acc;
      }, {}),
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {}),
      evitables,
      noEvitables,
      conAnalisis,
      sinAnalisis,
      ultimoMes,
      graves,
    };
  }

  async getPendientesAnalisis() {
    const eventos = await prisma.eventoAdversoPP.findMany({
      where: {
        activo: true,
        analisisRealizado: false,
        estado: { not: 'CERRADO' },
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        reportador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fechaEvento: 'desc' },
    });

    return eventos;
  }

  async uploadDocumento(eventoId, file, metadata, userId) {
    await this.findById(eventoId);

    const documento = await prisma.documentoEventoAdversoPP.create({
      data: {
        eventoId,
        nombre: metadata.nombre || file.name,
        archivoUrl: metadata.archivoUrl,
        archivoNombre: file.name,
        archivoTipo: file.type,
        archivoTamano: file.size,
        tipoDocumento: metadata.tipoDocumento || 'EVIDENCIA',
        cargadoPor: userId,
      },
    });

    return documento;
  }

  async deleteDocumento(documentoId) {
    await prisma.documentoEventoAdversoPP.update({
      where: { id: documentoId },
      data: { activo: false },
    });

    return { message: 'Documento eliminado exitosamente' };
  }
}

module.exports = new EventoAdversoService();
