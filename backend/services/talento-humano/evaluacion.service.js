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
      prisma.th_periodos_evaluacion.findMany({
        where,
        include: {
          _count: { select: { th_evaluaciones_desempeno: true } }
        },
        orderBy: [{ anio: 'desc' }, { fecha_inicio: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.th_periodos_evaluacion.count({ where })
    ]);

    // Map properties to match frontend expectation (camelCase)
    const mappedData = data.map(p => ({
      id: p.id,
      nombre: p.nombre,
      anio: p.anio,
      fechaInicio: p.fecha_inicio,
      fechaFin: p.fecha_fin,
      estado: p.estado,
      pesosEvaluadores: p.pesos_evaluadores,
      evaluacionesCount: p._count.th_evaluaciones_desempeno
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
    return prisma.th_periodos_evaluacion.create({
      data: {
        nombre: data.nombre,
        anio: data.anio,
        fecha_inicio: new Date(data.fechaInicio),
        fecha_fin: new Date(data.fechaFin),
        estado: data.estado || 'CONFIGURACION',
        pesos_evaluadores: data.pesosEvaluadores
      }
    });
  }

  /**
   * Obtener periodo con evaluaciones
   */
  async getPeriodo(id) {
    const periodo = await prisma.th_periodos_evaluacion.findUnique({
      where: { id },
      include: {
        th_evaluaciones_desempeno: {
          include: {
            th_empleados_th_evaluaciones_desempeno_empleado_idToth_empleados: { select: { id: true, nombre: true, apellido: true } },
            th_empleados_th_evaluaciones_desempeno_evaluador_idToth_empleados: { select: { id: true, nombre: true, apellido: true } }
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
      fechaInicio: periodo.fecha_inicio,
      fechaFin: periodo.fecha_fin,
      estado: periodo.estado,
      pesosEvaluadores: periodo.pesos_evaluadores,
      evaluaciones: periodo.th_evaluaciones_desempeno.map(e => ({
        id: e.id,
        empleadoId: e.empleado_id,
        evaluadorId: e.evaluador_id,
        tipoEvaluador: e.tipo_evaluador,
        estado: e.estado,
        scoreTotal: e.score_total,
        empleado: e.th_empleados_th_evaluaciones_desempeno_empleado_idToth_empleados,
        evaluador: e.th_empleados_th_evaluaciones_desempeno_evaluador_idToth_empleados
      }))
    };
  }

  /**
   * Iniciar periodo de evaluación (generar evaluaciones)
   */
  async iniciarPeriodo(periodoId) {
    const periodo = await prisma.th_periodos_evaluacion.findUnique({ where: { id: periodoId } });
    if (!periodo) throw new NotFoundError('Periodo no encontrado');

    if (periodo.estado !== 'CONFIGURACION') {
      throw new ValidationError('Solo se pueden iniciar periodos en configuración');
    }

    // Obtener empleados activos
    const empleados = await prisma.th_empleados.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        th_empleados_th_empleados_jefe_inmediato_idToth_empleados: true, // jefeDirecto
        other_th_empleados: { select: { id: true } } // subordinados
      }
    });

    const evaluaciones = [];

    for (const empleado of empleados) {
      // Autoevaluación
      evaluaciones.push({
        id: require('uuid').v4(),
        periodo_id: periodoId,
        empleado_id: empleado.id,
        evaluador_id: empleado.id,
        tipo_evaluador: 'AUTO',
        estado: 'PENDIENTE',
        fecha_asignacion: new Date()
      });

      // Evaluación del jefe
      if (empleado.th_empleados_th_empleados_jefe_inmediato_idToth_empleados) {
        evaluaciones.push({
          id: require('uuid').v4(),
          periodo_id: periodoId,
          empleado_id: empleado.id,
          evaluador_id: empleado.th_empleados_th_empleados_jefe_inmediato_idToth_empleados.id,
          tipo_evaluador: 'JEFE',
          estado: 'PENDIENTE',
          fecha_asignacion: new Date()
        });
      }

      // Si es 360, agregar pares y subordinados según configuración
      if (periodo.pesos_evaluadores?.pares) {
        // Se pueden agregar evaluaciones de pares
      }
    }

    // Crear evaluaciones
    await prisma.th_evaluaciones_desempeno.createMany({
      data: evaluaciones
    });

    // Actualizar estado del periodo
    await prisma.th_periodos_evaluacion.update({
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
    const evaluaciones = await prisma.th_evaluaciones_desempeno.findMany({
      where: {
        evaluador_id: evaluadorId,
        estado: { in: ['PENDIENTE', 'EN_PROGRESO'] }
      },
      include: {
        th_empleados_th_evaluaciones_desempeno_empleado_idToth_empleados: { select: { id: true, nombre: true, apellido: true, foto_url: true } },
        th_periodos_evaluacion: true
      },
      orderBy: { fecha_asignacion: 'asc' }
    });

    return evaluaciones.map(e => ({
      id: e.id,
      estado: e.estado,
      fechaAsignacion: e.fecha_asignacion,
      tipoEvaluador: e.tipo_evaluador,
      empleado: {
        id: e.th_empleados_th_evaluaciones_desempeno_empleado_idToth_empleados.id,
        nombre: e.th_empleados_th_evaluaciones_desempeno_empleado_idToth_empleados.nombre,
        apellido: e.th_empleados_th_evaluaciones_desempeno_empleado_idToth_empleados.apellido,
        fotoUrl: e.th_empleados_th_evaluaciones_desempeno_empleado_idToth_empleados.foto_url
      },
      periodo: {
        id: e.th_periodos_evaluacion.id,
        nombre: e.th_periodos_evaluacion.nombre
      }
    }));
  }

  /**
   * Responder evaluación
   */
  async responderEvaluacion(evaluacionId, evaluadorId, data) {
    const evaluacion = await prisma.th_evaluaciones_desempeno.findUnique({
      where: { id: evaluacionId },
      include: { th_periodos_evaluacion: true }
    });

    if (!evaluacion) throw new NotFoundError('Evaluación no encontrada');
    if (evaluacion.evaluador_id !== evaluadorId) {
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

    const updated = await prisma.th_evaluaciones_desempeno.update({
      where: { id: evaluacionId },
      data: {
        respuestas: data.respuestas,
        score_total: scoreTotal,
        fortalezas: data.fortalezas,
        areas_mejora: data.areasMejora,
        comentario_general: data.comentarioGeneral,
        estado: 'COMPLETADA',
        fecha_completado: new Date()
      }
    });

    return {
      id: updated.id,
      scoreTotal: updated.score_total,
      estado: updated.estado,
      fechaCompletado: updated.fecha_completado
    };
  }

  /**
   * Obtener resultados de un empleado
   */
  async getResultadosEmpleado(empleadoId, anio = null) {
    const where = { empleado_id: empleadoId, estado: 'COMPLETADA' };
    if (anio) {
      where.th_periodos_evaluacion = { anio };
    }

    const evaluaciones = await prisma.th_evaluaciones_desempeno.findMany({
      where,
      include: {
        th_empleados_th_evaluaciones_desempeno_evaluador_idToth_empleados: { select: { id: true, nombre: true, apellido: true } },
        th_periodos_evaluacion: true
      },
      orderBy: { fecha_completado: 'desc' }
    });

    // Calcular promedios por tipo de evaluador
    const porTipo = evaluaciones.reduce((acc, e) => {
      if (!acc[e.tipo_evaluador]) {
        acc[e.tipo_evaluador] = { total: 0, count: 0 };
      }
      acc[e.tipo_evaluador].total += Number(e.score_total || 0);
      acc[e.tipo_evaluador].count++;
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
      scoreConsolidado += Number(e.score_total || 0) * peso;
      totalPeso += peso;
    });
    if (totalPeso > 0) {
      scoreConsolidado = Math.round((scoreConsolidado / totalPeso) * 100) / 100;
    }

    return {
      evaluaciones: evaluaciones.map(e => ({
        id: e.id,
        periodo: e.th_periodos_evaluacion.nombre,
        tipoEvaluador: e.tipo_evaluador,
        score: e.score_total,
        fecha: e.fecha_completado,
        evaluador: e.th_empleados_th_evaluaciones_desempeno_evaluador_idToth_empleados
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
    const empleado = await prisma.th_empleados.findUnique({ where: { id: empleadoId } });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    return prisma.th_objetivos.create({
      data: {
        empleado_id: empleadoId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipo: data.tipo,
        fecha_inicio: new Date(data.fechaInicio),
        fecha_fin: new Date(data.fechaFin),
        peso: data.peso,
        metrica: data.metrica,
        meta: data.meta,
        valor_actual: 0,
        progreso: 0,
        estado: 'PENDIENTE',
        anio: data.anio || new Date().getFullYear()
      }
    });
  }

  /**
   * Listar objetivos de un empleado
   */
  async listObjetivos(empleadoId, anio = null) {
    const where = { empleado_id: empleadoId };
    if (anio) where.anio = anio;

    const objetivos = await prisma.th_objetivos.findMany({
      where,
      orderBy: [{ anio: 'desc' }, { created_at: 'asc' }]
    });

    return objetivos.map(o => ({
      id: o.id,
      titulo: o.titulo,
      descripcion: o.descripcion,
      progreso: o.progreso,
      estado: o.estado,
      fechaFin: o.fecha_fin,
      meta: o.meta,
      valorActual: o.valor_actual
    }));
  }

  /**
   * Actualizar progreso de objetivo
   */
  async updateProgresoObjetivo(id, progreso, valorActual = null) {
    const objetivo = await prisma.th_objetivos.findUnique({ where: { id } });
    if (!objetivo) throw new NotFoundError('Objetivo no encontrado');

    const updateData = { progreso };
    if (valorActual !== null) updateData.valor_actual = valorActual;
    if (progreso >= 100) updateData.estado = 'COMPLETADO';

    return prisma.th_objetivos.update({
      where: { id },
      data: updateData
    });
  }

  // ============ FEEDBACK ============

  /**
   * Crear feedback
   */
  async createFeedback(empleadoId, deParteId, data) {
    return prisma.th_feedback.create({
      data: {
        empleado_id: empleadoId,
        autor_id: deParteId,
        tipo: data.tipo, // RECONOCIMIENTO, MEJORA, GENERAL
        mensaje: data.mensaje,
        visibilidad: data.visibilidad || 'PRIVADO',
        competencias: data.competencias // Array
      }
    });
  }

  /**
   * Listar feedback de un empleado
   */
  async listFeedback(empleadoId, { tipo, page = 1, limit = 20 }) {
    const where = { empleado_id: empleadoId };
    if (tipo) where.tipo = tipo;

    const [data, total] = await Promise.all([
      prisma.th_feedback.findMany({
        where,
        include: {
          th_empleados_th_feedback_autor_idToth_empleados: { select: { id: true, nombre: true, apellido: true, foto_url: true } }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.th_feedback.count({ where })
    ]);

    const mappedData = data.map(f => ({
      id: f.id,
      tipo: f.tipo,
      mensaje: f.mensaje,
      fecha: f.created_at,
      autor: {
        id: f.th_empleados_th_feedback_autor_idToth_empleados.id,
        nombre: f.th_empleados_th_feedback_autor_idToth_empleados.nombre,
        apellido: f.th_empleados_th_feedback_autor_idToth_empleados.apellido,
        fotoUrl: f.th_empleados_th_feedback_autor_idToth_empleados.foto_url
      },
      competencias: f.competencias
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
    const where = periodoId ? { periodo_id: periodoId } : {};

    const [total, pendientes, completadas, promedioGeneral] = await Promise.all([
      prisma.th_evaluaciones_desempeno.count({ where }),
      prisma.th_evaluaciones_desempeno.count({ where: { ...where, estado: 'PENDIENTE' } }),
      prisma.th_evaluaciones_desempeno.count({ where: { ...where, estado: 'COMPLETADA' } }),
      prisma.th_evaluaciones_desempeno.aggregate({
        where: { ...where, estado: 'COMPLETADA' },
        _avg: { score_total: true }
      })
    ]);

    return {
      total,
      pendientes,
      completadas,
      porcentajeCompletado: total > 0 ? Math.round((completadas / total) * 100) : 0,
      promedioGeneral: promedioGeneral._avg.score_total
        ? Math.round(promedioGeneral._avg.score_total * 100) / 100
        : null
    };
  }
}

module.exports = new EvaluacionService();
