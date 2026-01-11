/**
 * Servicio de Simulacros
 * Gestiona programacion, ejecucion y evaluacion de simulacros
 * Normativa: Decreto 1072/2015
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class SimulacroService {
  /**
   * Listar simulacros
   */
  async findAll({ page = 1, limit = 20, tipo, estado, anio }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipoSimulacro = tipo;
    if (estado) where.estado = estado;

    if (anio) {
      where.fechaProgramada = {
        gte: new Date(anio, 0, 1),
        lte: new Date(anio, 11, 31),
      };
    }

    const [simulacros, total] = await Promise.all([
      prisma.sSTSimulacro.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaProgramada: 'desc' },
        include: {
          coordinador: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { participantes: true, accionesMejora: true },
          },
        },
      }),
      prisma.sSTSimulacro.count({ where }),
    ]);

    return {
      data: simulacros,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener simulacro por ID
   */
  async findById(id) {
    const simulacro = await prisma.sSTSimulacro.findUnique({
      where: { id },
      include: {
        coordinador: {
          select: { id: true, nombre: true, apellido: true },
        },
        participantes: {
          include: {
            empleado: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
        accionesMejora: {
          include: {
            responsable: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
    });

    if (!simulacro) {
      throw new NotFoundError('Simulacro no encontrado');
    }

    return simulacro;
  }

  /**
   * Crear simulacro
   */
  async create(data) {
    // Validar coordinador
    if (data.coordinadorId) {
      const coordinador = await prisma.tHEmpleado.findUnique({
        where: { id: data.coordinadorId },
      });
      if (!coordinador) {
        throw new ValidationError('Coordinador no encontrado');
      }
    }

    const simulacro = await prisma.sSTSimulacro.create({
      data: {
        tipoSimulacro: data.tipoSimulacro, // EVACUACION, INCENDIO, SISMO, DERRAME, EMERGENCIA_MEDICA
        titulo: data.titulo,
        objetivos: data.objetivos,
        alcance: data.alcance,
        escenario: data.escenario,
        hipotesis: data.hipotesis,
        fechaProgramada: new Date(data.fechaProgramada),
        horaProgramada: data.horaProgramada,
        duracionEstimada: data.duracionEstimada,
        areas: data.areas,
        coordinadorId: data.coordinadorId,
        recursosNecesarios: data.recursosNecesarios,
        puntosReunion: data.puntosReunion,
        estado: 'PROGRAMADO',
      },
      include: {
        coordinador: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return simulacro;
  }

  /**
   * Actualizar simulacro
   */
  async update(id, data) {
    const simulacro = await prisma.sSTSimulacro.findUnique({
      where: { id },
    });

    if (!simulacro) {
      throw new NotFoundError('Simulacro no encontrado');
    }

    return prisma.sSTSimulacro.update({
      where: { id },
      data: {
        ...data,
        fechaProgramada: data.fechaProgramada ? new Date(data.fechaProgramada) : undefined,
      },
    });
  }

  /**
   * Registrar participante
   */
  async registrarParticipante(simulacroId, data) {
    const simulacro = await prisma.sSTSimulacro.findUnique({
      where: { id: simulacroId },
    });

    if (!simulacro) {
      throw new NotFoundError('Simulacro no encontrado');
    }

    // Verificar si ya esta registrado
    const existe = await prisma.sSTParticipanteSimulacro.findUnique({
      where: {
        simulacroId_empleadoId: {
          simulacroId,
          empleadoId: data.empleadoId,
        },
      },
    });

    if (existe) {
      throw new ValidationError('El empleado ya esta registrado');
    }

    const participante = await prisma.sSTParticipanteSimulacro.create({
      data: {
        simulacroId,
        empleadoId: data.empleadoId,
        rol: data.rol, // EVALUADOR, BRIGADISTA, PARTICIPANTE
        asignadoA: data.asignadoA,
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return participante;
  }

  /**
   * Registrar asistencia de participante
   */
  async registrarAsistencia(simulacroId, empleadoId, data) {
    const participante = await prisma.sSTParticipanteSimulacro.findUnique({
      where: {
        simulacroId_empleadoId: { simulacroId, empleadoId },
      },
    });

    if (!participante) {
      throw new NotFoundError('Participante no encontrado');
    }

    return prisma.sSTParticipanteSimulacro.update({
      where: {
        simulacroId_empleadoId: { simulacroId, empleadoId },
      },
      data: {
        asistio: data.asistio,
        tiempoEvacuacion: data.tiempoEvacuacion,
        ubicacionFinal: data.ubicacionFinal,
        observaciones: data.observaciones,
      },
    });
  }

  /**
   * Registrar resultados del simulacro
   */
  async registrarResultados(id, data) {
    const simulacro = await prisma.sSTSimulacro.findUnique({
      where: { id },
      include: { participantes: true },
    });

    if (!simulacro) {
      throw new NotFoundError('Simulacro no encontrado');
    }

    const participaron = simulacro.participantes.filter(p => p.asistio).length;

    const updated = await prisma.sSTSimulacro.update({
      where: { id },
      data: {
        estado: 'REALIZADO',
        fechaEjecucion: new Date(),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        duracionReal: data.duracionReal,
        tiempoEvacuacionTotal: data.tiempoEvacuacionTotal,
        totalParticipantes: participaron,
        aspectosPositivos: data.aspectosPositivos,
        aspectosMejorar: data.aspectosMejorar,
        observacionesGenerales: data.observacionesGenerales,
        calificacionGeneral: data.calificacionGeneral, // EXCELENTE, BUENO, REGULAR, DEFICIENTE
        urlFotos: data.urlFotos,
        urlVideos: data.urlVideos,
        urlInforme: data.urlInforme,
      },
    });

    return updated;
  }

  /**
   * Agregar accion de mejora
   */
  async agregarAccionMejora(simulacroId, data) {
    const simulacro = await prisma.sSTSimulacro.findUnique({
      where: { id: simulacroId },
    });

    if (!simulacro) {
      throw new NotFoundError('Simulacro no encontrado');
    }

    const accion = await prisma.sSTAccionMejoraSimulacro.create({
      data: {
        simulacroId,
        descripcion: data.descripcion,
        tipo: data.tipo, // CORRECTIVA, PREVENTIVA, MEJORA
        responsableId: data.responsableId,
        fechaCompromiso: new Date(data.fechaCompromiso),
        estado: 'PENDIENTE',
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return accion;
  }

  /**
   * Actualizar estado de accion de mejora
   */
  async actualizarAccionMejora(accionId, data) {
    const accion = await prisma.sSTAccionMejoraSimulacro.findUnique({
      where: { id: accionId },
    });

    if (!accion) {
      throw new NotFoundError('Accion de mejora no encontrada');
    }

    return prisma.sSTAccionMejoraSimulacro.update({
      where: { id: accionId },
      data: {
        estado: data.estado,
        fechaCumplimiento: data.estado === 'CUMPLIDA' ? new Date() : undefined,
        evidencia: data.evidencia,
        observaciones: data.observaciones,
      },
    });
  }

  /**
   * Cancelar simulacro
   */
  async cancelar(id, motivo) {
    const simulacro = await prisma.sSTSimulacro.findUnique({
      where: { id },
    });

    if (!simulacro) {
      throw new NotFoundError('Simulacro no encontrado');
    }

    return prisma.sSTSimulacro.update({
      where: { id },
      data: {
        estado: 'CANCELADO',
        observacionesGenerales: motivo,
      },
    });
  }

  /**
   * Obtener simulacros proximos
   */
  async getProximos(dias = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    return prisma.sSTSimulacro.findMany({
      where: {
        estado: 'PROGRAMADO',
        fechaProgramada: {
          gte: new Date(),
          lte: fechaLimite,
        },
      },
      include: {
        coordinador: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { fechaProgramada: 'asc' },
    });
  }

  /**
   * Obtener estadisticas de simulacros
   */
  async getEstadisticas({ anio }) {
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const where = {
      fechaProgramada: { gte: fechaInicio, lte: fechaFin },
    };

    const [
      total,
      porTipo,
      porCalificacion,
      accionesPendientes,
    ] = await Promise.all([
      prisma.sSTSimulacro.count({ where }),
      prisma.sSTSimulacro.groupBy({
        by: ['tipoSimulacro'],
        where: { ...where, estado: 'REALIZADO' },
        _count: true,
      }),
      prisma.sSTSimulacro.groupBy({
        by: ['calificacionGeneral'],
        where: { ...where, estado: 'REALIZADO', calificacionGeneral: { not: null } },
        _count: true,
      }),
      prisma.sSTAccionMejoraSimulacro.count({
        where: {
          estado: 'PENDIENTE',
          simulacro: { fechaProgramada: { gte: fechaInicio, lte: fechaFin } },
        },
      }),
    ]);

    // Promedio tiempo evacuacion
    const simulacrosRealizados = await prisma.sSTSimulacro.findMany({
      where: { ...where, estado: 'REALIZADO', tiempoEvacuacionTotal: { not: null } },
      select: { tiempoEvacuacionTotal: true },
    });

    const promedioEvacuacion = simulacrosRealizados.length > 0
      ? simulacrosRealizados.reduce((sum, s) => sum + s.tiempoEvacuacionTotal, 0) / simulacrosRealizados.length
      : 0;

    return {
      anio,
      total,
      realizados: porTipo.reduce((sum, t) => sum + t._count, 0),
      promedioTiempoEvacuacion: Math.round(promedioEvacuacion),
      accionesPendientes,
      porTipo: porTipo.map(t => ({ tipo: t.tipoSimulacro, cantidad: t._count })),
      porCalificacion: porCalificacion.map(c => ({ calificacion: c.calificacionGeneral, cantidad: c._count })),
    };
  }
}

module.exports = new SimulacroService();
