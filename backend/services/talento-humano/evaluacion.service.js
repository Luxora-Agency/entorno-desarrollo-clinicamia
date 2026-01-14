/**
 * Servicio de Evaluación de Desempeño - Módulo Talento Humano
 */
const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class EvaluacionService {
  // ============ PERIODOS ============

  /**
   * Listar periodos de evaluación
   */
  async listPeriodos({ anio, estado, page = 1, limit = 10 }) {
    const where = {};
    if (anio) where.anio = anio;
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      prisma.tHPeriodoEvaluacion.findMany({
        where,
        include: {
          _count: { select: { evaluaciones: true } }
        },
        orderBy: [{ anio: 'desc' }, { fechaInicio: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHPeriodoEvaluacion.count({ where })
    ]);

    // Map properties to match frontend expectation (camelCase)
    const mappedData = data.map(p => ({
      id: p.id,
      nombre: p.nombre,
      anio: p.anio,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
      estado: p.estado,
      pesosEvaluadores: p.pesosEvaluadores,
      evaluacionesCount: p._count.evaluaciones
    }));

    return {
      data: mappedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Crear periodo de evaluación
   */
  async createPeriodo(data) {
    return prisma.tHPeriodoEvaluacion.create({
      data: {
        nombre: data.nombre,
        anio: data.anio,
        tipo: data.tipo || 'SEMESTRAL',
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        fechaLimiteEval: new Date(data.fechaLimiteEval || data.fechaFin),
        estado: data.estado || 'CONFIGURACION',
        pesosEvaluadores: data.pesosEvaluadores
      }
    });
  }

  /**
   * Obtener periodo con evaluaciones
   */
  async getPeriodo(id) {
    const periodo = await prisma.tHPeriodoEvaluacion.findUnique({
      where: { id },
      include: {
        evaluaciones: {
          include: {
            empleado: { select: { id: true, nombre: true, apellido: true } },
            evaluador: { select: { id: true, nombre: true, apellido: true } }
          }
        }
      }
    });

    if (!periodo) throw new NotFoundError('Periodo no encontrado');

    // Map to camelCase
    return {
      id: periodo.id,
      nombre: periodo.nombre,
      anio: periodo.anio,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      estado: periodo.estado,
      pesosEvaluadores: periodo.pesosEvaluadores,
      evaluaciones: periodo.evaluaciones.map(e => ({
        id: e.id,
        empleadoId: e.empleadoId,
        evaluadorId: e.evaluadorId,
        tipoEvaluador: e.tipoEvaluador,
        estado: e.estado,
        scoreTotal: e.scoreTotal,
        empleado: e.empleado,
        evaluador: e.evaluador
      }))
    };
  }

  /**
   * Iniciar periodo de evaluación (generar evaluaciones)
   */
  async iniciarPeriodo(periodoId) {
    const periodo = await prisma.tHPeriodoEvaluacion.findUnique({ where: { id: periodoId } });
    if (!periodo) throw new NotFoundError('Periodo no encontrado');

    if (periodo.estado !== 'CONFIGURACION') {
      throw new ValidationError('Solo se pueden iniciar periodos en configuración');
    }

    // Obtener empleados activos
    const empleados = await prisma.tHEmpleado.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        jefeDirecto: true,
        subordinados: { select: { id: true } }
      }
    });

    const evaluaciones = [];

    for (const empleado of empleados) {
      // Autoevaluación
      evaluaciones.push({
        id: require('uuid').v4(),
        periodoId: periodoId,
        empleadoId: empleado.id,
        evaluadorId: empleado.id,
        tipoEvaluador: 'AUTO',
        estado: 'PENDIENTE',
        fechaAsignacion: new Date()
      });

      // Evaluación del jefe
      if (empleado.jefeDirecto) {
        evaluaciones.push({
          id: require('uuid').v4(),
          periodoId: periodoId,
          empleadoId: empleado.id,
          evaluadorId: empleado.jefeDirecto.id,
          tipoEvaluador: 'JEFE',
          estado: 'PENDIENTE',
          fechaAsignacion: new Date()
        });
      }

      // Si es 360, agregar pares y subordinados según configuración
      if (periodo.pesosEvaluadores?.pares) {
        // Se pueden agregar evaluaciones de pares
      }
    }

    // Crear evaluaciones
    await prisma.tHEvaluacionDesempeno.createMany({
      data: evaluaciones
    });

    // Actualizar estado del periodo
    await prisma.tHPeriodoEvaluacion.update({
      where: { id: periodoId },
      data: { estado: 'EN_EVALUACION' }
    });

    return this.getPeriodo(periodoId);
  }

  // ============ EVALUACIONES ============

  /**
   * Obtener evaluaciones pendientes de un evaluador
   */
  async getEvaluacionesPendientes(evaluadorId) {
    const evaluaciones = await prisma.tHEvaluacionDesempeno.findMany({
      where: {
        evaluadorId: evaluadorId,
        estado: { in: ['PENDIENTE', 'EN_PROGRESO'] }
      },
      include: {
        empleado: { select: { id: true, nombre: true, apellido: true, fotoUrl: true } },
        periodo: true
      },
      orderBy: { fechaAsignacion: 'asc' }
    });

    return evaluaciones.map(e => ({
      id: e.id,
      estado: e.estado,
      fechaAsignacion: e.fechaAsignacion,
      tipoEvaluador: e.tipoEvaluador,
      empleado: {
        id: e.empleado.id,
        nombre: e.empleado.nombre,
        apellido: e.empleado.apellido,
        fotoUrl: e.empleado.fotoUrl
      },
      periodo: {
        id: e.periodo.id,
        nombre: e.periodo.nombre
      }
    }));
  }

  /**
   * Responder evaluación
   */
  async responderEvaluacion(evaluacionId, evaluadorId, data) {
    const evaluacion = await prisma.tHEvaluacionDesempeno.findUnique({
      where: { id: evaluacionId },
      include: { periodo: true }
    });

    if (!evaluacion) throw new NotFoundError('Evaluación no encontrada');
    if (evaluacion.evaluadorId !== evaluadorId) {
      throw new ValidationError('No tienes permiso para responder esta evaluación');
    }

    if (evaluacion.estado === 'COMPLETADA') {
      throw new ValidationError('La evaluación ya fue completada');
    }

    // Calcular score total
    let scoreTotal = 0;
    let totalPeso = 0;

    if (data.respuestas) {
      Object.values(data.respuestas).forEach(r => {
        if (r.score && r.peso) {
          scoreTotal += r.score * r.peso;
          totalPeso += r.peso;
        }
      });
    }

    if (totalPeso > 0) {
      scoreTotal = scoreTotal / totalPeso;
    }

    const updated = await prisma.tHEvaluacionDesempeno.update({
      where: { id: evaluacionId },
      data: {
        respuestas: data.respuestas,
        scoreTotal: scoreTotal,
        fortalezas: data.fortalezas,
        areasMejora: data.areasMejora,
        comentarioGeneral: data.comentarioGeneral,
        estado: 'COMPLETADA',
        fechaCompletado: new Date()
      }
    });

    return {
      id: updated.id,
      scoreTotal: updated.scoreTotal,
      estado: updated.estado,
      fechaCompletado: updated.fechaCompletado
    };
  }

  /**
   * Obtener resultados de un empleado
   */
  async getResultadosEmpleado(empleadoId, anio = null) {
    const where = { empleadoId: empleadoId, estado: 'COMPLETADA' };
    if (anio) {
      where.periodo = { anio };
    }

    const evaluaciones = await prisma.tHEvaluacionDesempeno.findMany({
      where,
      include: {
        evaluador: { select: { id: true, nombre: true, apellido: true } },
        periodo: true
      },
      orderBy: { fechaCompletado: 'desc' }
    });

    // Calcular promedios por tipo de evaluador
    const porTipo = evaluaciones.reduce((acc, e) => {
      if (!acc[e.tipoEvaluador]) {
        acc[e.tipoEvaluador] = { total: 0, count: 0 };
      }
      acc[e.tipoEvaluador].total += Number(e.scoreTotal || 0);
      acc[e.tipoEvaluador].count++;
      return acc;
    }, {});

    const promedios = {};
    Object.entries(porTipo).forEach(([tipo, data]) => {
      promedios[tipo] = Math.round((data.total / data.count) * 100) / 100;
    });

    // Score consolidado (ponderado si hay pesos)
    let scoreConsolidado = 0;
    let totalPeso = 0;
    evaluaciones.forEach(e => {
      const peso = 1; // Se puede obtener del periodo
      scoreConsolidado += Number(e.scoreTotal || 0) * peso;
      totalPeso += peso;
    });
    if (totalPeso > 0) {
      scoreConsolidado = Math.round((scoreConsolidado / totalPeso) * 100) / 100;
    }

    return {
      evaluaciones: evaluaciones.map(e => ({
        id: e.id,
        periodo: e.periodo.nombre,
        tipoEvaluador: e.tipoEvaluador,
        score: e.scoreTotal,
        fecha: e.fechaCompletado,
        evaluador: e.evaluador
      })),
      promedios,
      scoreConsolidado,
      totalEvaluaciones: evaluaciones.length
    };
  }

  // ============ OBJETIVOS ============

  /**
   * Crear objetivo
   */
  async createObjetivo(empleadoId, data) {
    const empleado = await prisma.tHEmpleado.findUnique({ where: { id: empleadoId } });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    return prisma.tHObjetivo.create({
      data: {
        empleadoId: empleadoId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        metrica: data.metrica || 'PORCENTAJE',
        fechaLimite: data.fechaFin ? new Date(data.fechaFin) : null,
        peso: data.peso || 100,
        valorMeta: data.meta,
        valorActual: 0,
        progreso: 0,
        estado: 'EN_PROGRESO',
        anio: data.anio || new Date().getFullYear()
      }
    });
  }

  /**
   * Listar objetivos de un empleado
   */
  async listObjetivos(empleadoId, anio = null) {
    const where = { empleadoId: empleadoId };
    if (anio) where.anio = anio;

    const objetivos = await prisma.tHObjetivo.findMany({
      where,
      orderBy: [{ anio: 'desc' }, { createdAt: 'asc' }]
    });

    return objetivos.map(o => ({
      id: o.id,
      titulo: o.titulo,
      descripcion: o.descripcion,
      progreso: o.progreso,
      estado: o.estado,
      fechaFin: o.fechaLimite,
      meta: o.valorMeta,
      valorActual: o.valorActual
    }));
  }

  /**
   * Actualizar progreso de objetivo
   */
  async updateProgresoObjetivo(id, progreso, valorActual = null) {
    const objetivo = await prisma.tHObjetivo.findUnique({ where: { id } });
    if (!objetivo) throw new NotFoundError('Objetivo no encontrado');

    const updateData = { progreso };
    if (valorActual !== null) updateData.valorActual = valorActual;
    if (progreso >= 100) updateData.estado = 'COMPLETADO';

    return prisma.tHObjetivo.update({
      where: { id },
      data: updateData
    });
  }

  // ============ FEEDBACK ============

  /**
   * Crear feedback
   */
  async createFeedback(empleadoId, deParteId, data) {
    return prisma.tHFeedback.create({
      data: {
        empleadoId: empleadoId,
        deParte: deParteId,
        tipo: data.tipo, // RECONOCIMIENTO, MEJORA, GENERAL
        contenido: data.mensaje,
        esPublico: data.visibilidad === 'PUBLICO',
        competenciaRelacionada: data.competencias ? data.competencias[0] : null
      }
    });
  }

  /**
   * Listar feedback de un empleado
   */
  async listFeedback(empleadoId, { tipo, page = 1, limit = 20 }) {
    const where = { empleadoId: empleadoId };
    if (tipo) where.tipo = tipo;

    const [data, total] = await Promise.all([
      prisma.tHFeedback.findMany({
        where,
        include: {
          autor: { select: { id: true, nombre: true, apellido: true, fotoUrl: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHFeedback.count({ where })
    ]);

    const mappedData = data.map(f => ({
      id: f.id,
      tipo: f.tipo,
      mensaje: f.contenido,
      fecha: f.createdAt,
      autor: {
        id: f.autor.id,
        nombre: f.autor.nombre,
        apellido: f.autor.apellido,
        fotoUrl: f.autor.fotoUrl
      },
      competencias: f.competenciaRelacionada ? [f.competenciaRelacionada] : []
    }));

    return {
      data: mappedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  // ============ ESTADÍSTICAS ============

  /**
   * Obtener estadísticas de evaluaciones
   */
  async getStats(periodoId = null) {
    const where = periodoId ? { periodoId: periodoId } : {};

    const [total, pendientes, completadas, promedioGeneral] = await Promise.all([
      prisma.tHEvaluacionDesempeno.count({ where }),
      prisma.tHEvaluacionDesempeno.count({ where: { ...where, estado: 'PENDIENTE' } }),
      prisma.tHEvaluacionDesempeno.count({ where: { ...where, estado: 'COMPLETADA' } }),
      prisma.tHEvaluacionDesempeno.aggregate({
        where: { ...where, estado: 'COMPLETADA' },
        _avg: { scoreTotal: true }
      })
    ]);

    return {
      total,
      pendientes,
      completadas,
      porcentajeCompletado: total > 0 ? Math.round((completadas / total) * 100) : 0,
      promedioGeneral: promedioGeneral._avg.scoreTotal
        ? Math.round(promedioGeneral._avg.scoreTotal * 100) / 100
        : null
    };
  }
}

module.exports = new EvaluacionService();
