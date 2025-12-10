/**
 * Servicio para gestión de Interconsultas
 * Permite solicitar y responder interconsultas entre especialidades
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class InterconsultaService {
  /**
   * Obtener todas las interconsultas con filtros
   */
  async getInterconsultas(filters = {}) {
    const {
      admisionId,
      pacienteId,
      estado,
      prioridad,
      medicoSolicitanteId,
      medicoEspecialistaId,
      limit = 100,
      offset = 0,
    } = filters;

    const where = {};

    if (admisionId) where.admisionId = admisionId;
    if (pacienteId) where.pacienteId = pacienteId;
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (medicoSolicitanteId) where.medicoSolicitanteId = medicoSolicitanteId;
    if (medicoEspecialistaId) where.medicoEspecialistaId = medicoEspecialistaId;

    const [interconsultas, total] = await Promise.all([
      prisma.interconsulta.findMany({
        where,
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
            },
          },
          medicoSolicitante: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          medicoEspecialista: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          admision: {
            select: {
              id: true,
              fechaIngreso: true,
              motivoIngreso: true,
            },
          },
        },
        orderBy: [
          { prioridad: 'desc' },
          { fechaSolicitud: 'desc' },
        ],
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.interconsulta.count({ where }),
    ]);

    return {
      interconsultas,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
  }

  /**
   * Obtener una interconsulta por ID
   */
  async getInterconsultaById(id) {
    const interconsulta = await prisma.interconsulta.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true,
            fechaNacimiento: true,
            genero: true,
          },
        },
        medicoSolicitante: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        medicoEspecialista: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        admision: {
          select: {
            id: true,
            fechaIngreso: true,
            motivoIngreso: true,
            diagnosticoIngreso: true,
          },
        },
      },
    });

    if (!interconsulta) {
      throw new Error('Interconsulta no encontrada');
    }

    return interconsulta;
  }

  /**
   * Crear una nueva solicitud de interconsulta
   */
  async crearInterconsulta(data, usuarioId) {
    const {
      admisionId,
      pacienteId,
      especialidadSolicitada,
      motivoConsulta,
      antecedentesRelevantes,
      examenesSolicitados,
      diagnosticoPresuntivo,
      prioridad = 'Media',
    } = data;

    // Validar que la admisión existe y está activa
    const admision = await prisma.admision.findUnique({
      where: { id: admisionId },
    });

    if (!admision) {
      throw new Error('Admisión no encontrada');
    }

    if (admision.estado !== 'Activa') {
      throw new Error('No se puede crear interconsulta para una admisión no activa');
    }

    // Crear la interconsulta
    const interconsulta = await prisma.interconsulta.create({
      data: {
        admisionId,
        pacienteId,
        especialidadSolicitada,
        medicoSolicitanteId: usuarioId,
        motivoConsulta,
        antecedentesRelevantes,
        examenesSolicitados,
        diagnosticoPresuntivo,
        prioridad,
        estado: 'Solicitada',
      },
      include: {
        paciente: {
          select: {
            nombre: true,
            apellido: true,
            cedula: true,
          },
        },
        medicoSolicitante: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return interconsulta;
  }

  /**
   * Asignar especialista a una interconsulta
   */
  async asignarEspecialista(interconsultaId, medicoEspecialistaId) {
    const interconsulta = await prisma.interconsulta.findUnique({
      where: { id: interconsultaId },
    });

    if (!interconsulta) {
      throw new Error('Interconsulta no encontrada');
    }

    if (interconsulta.estado !== 'Solicitada') {
      throw new Error('Solo se pueden asignar especialistas a interconsultas solicitadas');
    }

    const updated = await prisma.interconsulta.update({
      where: { id: interconsultaId },
      data: {
        medicoEspecialistaId,
        estado: 'EnProceso',
      },
      include: {
        medicoEspecialista: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Responder una interconsulta (por el especialista)
   */
  async responderInterconsulta(interconsultaId, data, usuarioId) {
    const {
      evaluacionEspecialista,
      diagnosticoEspecialista,
      recomendaciones,
      requiereSeguimiento = false,
      fechaSeguimiento,
      observaciones,
    } = data;

    const interconsulta = await prisma.interconsulta.findUnique({
      where: { id: interconsultaId },
    });

    if (!interconsulta) {
      throw new Error('Interconsulta no encontrada');
    }

    // Verificar que el usuario es el especialista asignado
    if (interconsulta.medicoEspecialistaId !== usuarioId) {
      throw new Error('Solo el especialista asignado puede responder la interconsulta');
    }

    if (interconsulta.estado === 'Respondida') {
      throw new Error('Esta interconsulta ya ha sido respondida');
    }

    if (interconsulta.estado === 'Cancelada') {
      throw new Error('No se puede responder una interconsulta cancelada');
    }

    const updated = await prisma.interconsulta.update({
      where: { id: interconsultaId },
      data: {
        evaluacionEspecialista,
        diagnosticoEspecialista,
        recomendaciones,
        requiereSeguimiento,
        fechaSeguimiento: fechaSeguimiento ? new Date(fechaSeguimiento) : null,
        observaciones,
        fechaRespuesta: new Date(),
        estado: 'Respondida',
      },
      include: {
        paciente: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        medicoSolicitante: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        medicoEspecialista: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Actualizar una interconsulta
   */
  async actualizarInterconsulta(interconsultaId, data, usuarioId) {
    const interconsulta = await prisma.interconsulta.findUnique({
      where: { id: interconsultaId },
    });

    if (!interconsulta) {
      throw new Error('Interconsulta no encontrada');
    }

    // Solo el médico solicitante puede actualizar antes de que sea respondida
    if (interconsulta.medicoSolicitanteId !== usuarioId && interconsulta.estado !== 'Respondida') {
      throw new Error('No tiene permisos para actualizar esta interconsulta');
    }

    const updated = await prisma.interconsulta.update({
      where: { id: interconsultaId },
      data,
    });

    return updated;
  }

  /**
   * Cancelar una interconsulta
   */
  async cancelarInterconsulta(interconsultaId, usuarioId) {
    const interconsulta = await prisma.interconsulta.findUnique({
      where: { id: interconsultaId },
    });

    if (!interconsulta) {
      throw new Error('Interconsulta no encontrada');
    }

    // Solo el médico solicitante puede cancelar
    if (interconsulta.medicoSolicitanteId !== usuarioId) {
      throw new Error('Solo el médico solicitante puede cancelar la interconsulta');
    }

    if (interconsulta.estado === 'Respondida') {
      throw new Error('No se puede cancelar una interconsulta ya respondida');
    }

    const updated = await prisma.interconsulta.update({
      where: { id: interconsultaId },
      data: {
        estado: 'Cancelada',
      },
    });

    return updated;
  }

  /**
   * Obtener estadísticas de interconsultas
   */
  async getEstadisticas(filters = {}) {
    const { medicoId, especialidad, fechaInicio, fechaFin } = filters;

    const where = {};
    if (medicoId) {
      where.OR = [
        { medicoSolicitanteId: medicoId },
        { medicoEspecialistaId: medicoId },
      ];
    }
    if (especialidad) where.especialidadSolicitada = especialidad;
    if (fechaInicio || fechaFin) {
      where.fechaSolicitud = {};
      if (fechaInicio) where.fechaSolicitud.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaSolicitud.lte = new Date(fechaFin);
    }

    const [total, porEstado, porPrioridad, porEspecialidad] = await Promise.all([
      prisma.interconsulta.count({ where }),
      prisma.interconsulta.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.interconsulta.groupBy({
        by: ['prioridad'],
        where,
        _count: true,
      }),
      prisma.interconsulta.groupBy({
        by: ['especialidadSolicitada'],
        where,
        _count: true,
        orderBy: {
          _count: {
            especialidadSolicitada: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      total,
      porEstado,
      porPrioridad,
      porEspecialidad,
    };
  }
}

module.exports = new InterconsultaService();
