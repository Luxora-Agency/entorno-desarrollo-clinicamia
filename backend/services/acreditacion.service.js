/**
 * Service de Acreditación (SUA) - Resolución 5095/2018
 * Gestión de estándares de acreditación y evaluaciones
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class AcreditacionService {
  // ==========================================
  // ESTÁNDARES DE ACREDITACIÓN
  // ==========================================

  /**
   * Obtener estándares de acreditación
   */
  async getEstandares(query = {}) {
    const { grupo, activo = true } = query;

    const where = {
      ...(grupo && { grupo }),
      ...(activo !== undefined && { activo: activo === 'true' || activo === true }),
    };

    const estandares = await prisma.estandarAcreditacion.findMany({
      where,
      include: {
        _count: {
          select: { evaluaciones: true },
        },
      },
      orderBy: [{ grupo: 'asc' }, { codigo: 'asc' }],
    });

    return estandares;
  }

  /**
   * Obtener estándar por ID
   */
  async getEstandarById(id) {
    const estandar = await prisma.estandarAcreditacion.findUnique({
      where: { id },
      include: {
        evaluaciones: {
          orderBy: { fechaEvaluacion: 'desc' },
          take: 10,
          include: {
            evaluador: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!estandar) {
      throw new NotFoundError('Estándar de acreditación no encontrado');
    }

    return estandar;
  }

  /**
   * Crear estándar de acreditación
   */
  async createEstandar(data) {
    const { grupo, codigo, nombre, descripcion, criterios } = data;

    // Validar código único
    const existing = await prisma.estandarAcreditacion.findUnique({ where: { codigo } });
    if (existing) {
      throw new ValidationError('Ya existe un estándar con este código');
    }

    return prisma.estandarAcreditacion.create({
      data: {
        grupo,
        codigo,
        nombre,
        descripcion,
        criterios,
      },
    });
  }

  /**
   * Actualizar estándar
   */
  async updateEstandar(id, data) {
    const estandar = await prisma.estandarAcreditacion.findUnique({ where: { id } });
    if (!estandar) {
      throw new NotFoundError('Estándar no encontrado');
    }

    return prisma.estandarAcreditacion.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // EVALUACIONES
  // ==========================================

  /**
   * Obtener evaluaciones
   */
  async getEvaluaciones(query = {}) {
    const { page = 1, limit = 10, estandarId, grupo, fechaDesde, fechaHasta } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(estandarId && { estandarId }),
      ...(grupo && { estandar: { grupo } }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaEvaluacion: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [evaluaciones, total] = await Promise.all([
      prisma.evaluacionAcreditacion.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          estandar: {
            select: { codigo: true, nombre: true, grupo: true },
          },
          evaluador: {
            select: { nombre: true, apellido: true },
          },
        },
        orderBy: { fechaEvaluacion: 'desc' },
      }),
      prisma.evaluacionAcreditacion.count({ where }),
    ]);

    return {
      evaluaciones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Registrar evaluación de estándar
   */
  async registrarEvaluacion(data) {
    const {
      estandarId,
      calificacion,
      fortalezas,
      oportunidadesMejora,
      evidenciasUrl,
      evaluadorId,
    } = data;

    const estandar = await prisma.estandarAcreditacion.findUnique({ where: { id: estandarId } });
    if (!estandar) {
      throw new NotFoundError('Estándar no encontrado');
    }

    if (calificacion < 1 || calificacion > 5) {
      throw new ValidationError('La calificación debe estar entre 1 y 5');
    }

    return prisma.evaluacionAcreditacion.create({
      data: {
        estandarId,
        fechaEvaluacion: new Date(),
        calificacion,
        fortalezas,
        oportunidadesMejora,
        evidenciasUrl: evidenciasUrl || [],
        evaluadorId,
      },
      include: {
        estandar: { select: { codigo: true, nombre: true } },
        evaluador: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Actualizar evaluación
   */
  async updateEvaluacion(id, data) {
    const evaluacion = await prisma.evaluacionAcreditacion.findUnique({ where: { id } });
    if (!evaluacion) {
      throw new NotFoundError('Evaluación no encontrada');
    }

    return prisma.evaluacionAcreditacion.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  /**
   * Dashboard de acreditación
   */
  async getDashboard() {
    const [
      totalEstandares,
      estandaresPorGrupo,
      promedioCalificacionGlobal,
      promedioCalificacionPorGrupo,
      ultimasEvaluaciones,
    ] = await Promise.all([
      prisma.estandarAcreditacion.count({ where: { activo: true } }),
      prisma.estandarAcreditacion.groupBy({
        by: ['grupo'],
        _count: true,
        where: { activo: true },
      }),
      // Promedio global de calificaciones (última evaluación por estándar)
      prisma.$queryRaw`
        SELECT AVG(e.calificacion) as promedio
        FROM evaluaciones_acreditacion e
        INNER JOIN (
          SELECT estandar_id, MAX(fecha_evaluacion) as max_fecha
          FROM evaluaciones_acreditacion
          GROUP BY estandar_id
        ) latest ON e.estandar_id = latest.estandar_id AND e.fecha_evaluacion = latest.max_fecha
      `,
      // Promedio por grupo
      prisma.$queryRaw`
        SELECT ea.grupo, AVG(e.calificacion) as promedio
        FROM evaluaciones_acreditacion e
        INNER JOIN estandares_acreditacion ea ON e.estandar_id = ea.id
        INNER JOIN (
          SELECT estandar_id, MAX(fecha_evaluacion) as max_fecha
          FROM evaluaciones_acreditacion
          GROUP BY estandar_id
        ) latest ON e.estandar_id = latest.estandar_id AND e.fecha_evaluacion = latest.max_fecha
        GROUP BY ea.grupo
      `,
      prisma.evaluacionAcreditacion.findMany({
        take: 10,
        orderBy: { fechaEvaluacion: 'desc' },
        include: {
          estandar: { select: { codigo: true, nombre: true, grupo: true } },
          evaluador: { select: { nombre: true, apellido: true } },
        },
      }),
    ]);

    // Estándares con calificación baja (< 3)
    const estandaresBajaCalificacion = await prisma.$queryRaw`
      SELECT ea.id, ea.codigo, ea.nombre, ea.grupo, e.calificacion
      FROM evaluaciones_acreditacion e
      INNER JOIN estandares_acreditacion ea ON e.estandar_id = ea.id
      INNER JOIN (
        SELECT estandar_id, MAX(fecha_evaluacion) as max_fecha
        FROM evaluaciones_acreditacion
        GROUP BY estandar_id
      ) latest ON e.estandar_id = latest.estandar_id AND e.fecha_evaluacion = latest.max_fecha
      WHERE e.calificacion < 3
      ORDER BY e.calificacion ASC
    `;

    // Estándares sin evaluar
    const estandaresSinEvaluar = await prisma.estandarAcreditacion.findMany({
      where: {
        activo: true,
        evaluaciones: { none: {} },
      },
      select: { codigo: true, nombre: true, grupo: true },
    });

    return {
      resumen: {
        totalEstandares,
        promedioCalificacionGlobal: promedioCalificacionGlobal[0]?.promedio || 0,
        estandaresBajaCalificacion: estandaresBajaCalificacion.length,
        estandaresSinEvaluar: estandaresSinEvaluar.length,
      },
      estandaresPorGrupo,
      promedioCalificacionPorGrupo,
      estandaresBajaCalificacion,
      estandaresSinEvaluar,
      ultimasEvaluaciones,
    };
  }

  /**
   * Generar autoevaluación completa por grupo
   */
  async getAutoevaluacionPorGrupo(grupo) {
    const estandares = await prisma.estandarAcreditacion.findMany({
      where: { grupo, activo: true },
      include: {
        evaluaciones: {
          orderBy: { fechaEvaluacion: 'desc' },
          take: 1,
        },
      },
      orderBy: { codigo: 'asc' },
    });

    const evaluados = estandares.filter((e) => e.evaluaciones.length > 0);
    const sinEvaluar = estandares.filter((e) => e.evaluaciones.length === 0);

    const calificacionPromedio = evaluados.length > 0
      ? evaluados.reduce((sum, e) => sum + e.evaluaciones[0].calificacion, 0) / evaluados.length
      : 0;

    return {
      grupo,
      totalEstandares: estandares.length,
      evaluados: evaluados.length,
      sinEvaluar: sinEvaluar.length,
      porcentajeEvaluado: estandares.length > 0
        ? (evaluados.length / estandares.length) * 100
        : 0,
      calificacionPromedio,
      estandares: estandares.map((e) => ({
        codigo: e.codigo,
        nombre: e.nombre,
        criterios: e.criterios,
        ultimaEvaluacion: e.evaluaciones.length > 0
          ? {
              calificacion: e.evaluaciones[0].calificacion,
              fecha: e.evaluaciones[0].fechaEvaluacion,
              fortalezas: e.evaluaciones[0].fortalezas,
              oportunidades: e.evaluaciones[0].oportunidadesMejora,
            }
          : null,
      })),
    };
  }

  /**
   * Generar reporte consolidado de acreditación
   */
  async getReporteConsolidado() {
    const grupos = [
      'ATENCION_CLIENTE',
      'APOYO_ADMINISTRATIVO',
      'DIRECCIONAMIENTO',
      'GERENCIA',
      'RECURSO_HUMANO',
      'AMBIENTE_FISICO',
      'INFORMACION',
      'MEJORAMIENTO_CALIDAD',
    ];

    const reportePorGrupo = await Promise.all(
      grupos.map((grupo) => this.getAutoevaluacionPorGrupo(grupo))
    );

    const totales = reportePorGrupo.reduce(
      (acc, grupo) => ({
        totalEstandares: acc.totalEstandares + grupo.totalEstandares,
        evaluados: acc.evaluados + grupo.evaluados,
        sinEvaluar: acc.sinEvaluar + grupo.sinEvaluar,
        sumaCalificaciones: acc.sumaCalificaciones + grupo.calificacionPromedio * grupo.evaluados,
      }),
      { totalEstandares: 0, evaluados: 0, sinEvaluar: 0, sumaCalificaciones: 0 }
    );

    return {
      fechaGeneracion: new Date().toISOString(),
      resumenGeneral: {
        totalEstandares: totales.totalEstandares,
        evaluados: totales.evaluados,
        sinEvaluar: totales.sinEvaluar,
        porcentajeEvaluado: totales.totalEstandares > 0
          ? (totales.evaluados / totales.totalEstandares) * 100
          : 0,
        calificacionPromedio: totales.evaluados > 0
          ? totales.sumaCalificaciones / totales.evaluados
          : 0,
      },
      grupos: reportePorGrupo,
      nivelesCalificacion: {
        excelente: { rango: '4.5 - 5.0', descripcion: 'Cumplimiento superior' },
        bueno: { rango: '3.5 - 4.4', descripcion: 'Cumplimiento satisfactorio' },
        aceptable: { rango: '2.5 - 3.4', descripcion: 'Cumplimiento básico' },
        deficiente: { rango: '1.5 - 2.4', descripcion: 'Cumplimiento insuficiente' },
        critico: { rango: '1.0 - 1.4', descripcion: 'No cumple' },
      },
    };
  }

  /**
   * Obtener brechas y oportunidades de mejora
   */
  async getBrechasYOportunidades() {
    // Obtener última evaluación de cada estándar con calificación < 4
    const brechas = await prisma.$queryRaw`
      SELECT
        ea.id,
        ea.codigo,
        ea.nombre,
        ea.grupo,
        e.calificacion,
        e.oportunidades_mejora as oportunidades,
        e.fecha_evaluacion
      FROM evaluaciones_acreditacion e
      INNER JOIN estandares_acreditacion ea ON e.estandar_id = ea.id
      INNER JOIN (
        SELECT estandar_id, MAX(fecha_evaluacion) as max_fecha
        FROM evaluaciones_acreditacion
        GROUP BY estandar_id
      ) latest ON e.estandar_id = latest.estandar_id AND e.fecha_evaluacion = latest.max_fecha
      WHERE e.calificacion < 4
      ORDER BY e.calificacion ASC, ea.grupo, ea.codigo
    `;

    // Agrupar por nivel de brecha
    const porNivel = {
      critico: brechas.filter((b) => b.calificacion < 2),
      deficiente: brechas.filter((b) => b.calificacion >= 2 && b.calificacion < 3),
      aceptable: brechas.filter((b) => b.calificacion >= 3 && b.calificacion < 4),
    };

    return {
      totalBrechas: brechas.length,
      porNivel,
      brechas,
    };
  }
}

module.exports = new AcreditacionService();
