const prisma = require('../../../db/prisma');
const { startOfMonth, endOfMonth, subMonths } = require('date-fns');

class DashboardService {
  /**
   * Resumen general de todos los módulos de Procesos Prioritarios
   */
  async getResumenGeneral() {
    const [
      protocolos,
      eventosAdversos,
      gpc,
      comites,
      pqrsf,
      encuestas,
      indicadores,
      alertas,
      eventosGraves,
      pqrsfVencidas,
      actasPendientes,
      gpcPorRevisar,
    ] = await Promise.all([
      // Total protocolos vigentes
      prisma.protocoloProcesosPrioritarios.count({
        where: { activo: true, estado: 'VIGENTE' },
      }),

      // Total eventos adversos
      prisma.eventoAdversoPP.count({
        where: { activo: true },
      }),

      // Total GPCs
      prisma.guiaPracticaClinica.count({
        where: { activo: true, estado: 'VIGENTE' },
      }),

      // Total comités activos
      prisma.comite.count({
        where: { activo: true, estado: 'ACTIVO' },
      }),

      // Total PQRSF
      prisma.pQRSF.count({
        where: { activo: true },
      }),

      // Total encuestas
      prisma.encuestaSatisfaccion.count({
        where: { activo: true },
      }),

      // Total indicadores
      prisma.indicadorProcesosPrioritarios.count({
        where: { activo: true, estado: 'ACTIVO' },
      }),

      // Alertas pendientes
      prisma.alertaProcesosPrioritarios.count({
        where: { activo: true, atendida: false },
      }),

      // Eventos adversos graves sin cerrar
      prisma.eventoAdversoPP.count({
        where: {
          activo: true,
          severidad: { in: ['GRAVE', 'MORTAL'] },
          estado: { not: 'CERRADO' },
        },
      }),

      // PQRSF vencidas
      prisma.pQRSF.count({
        where: {
          activo: true,
          estado: { in: ['RADICADA', 'EN_GESTION'] },
          fechaRespuestaEsperada: { lt: new Date() },
        },
      }),

      // Actas pendientes (reuniones >7 días sin acta)
      prisma.cronogramaComite.count({
        where: {
          activo: true,
          estado: 'PROGRAMADA',
          fechaProgramada: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // GPCs próximas a revisión (30 días)
      prisma.guiaPracticaClinica.count({
        where: {
          activo: true,
          estado: 'VIGENTE',
          proximaRevision: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalProtocolos: protocolos,
      totalEventosAdversos: eventosAdversos,
      totalGPC: gpc,
      totalComites: comites,
      totalPQRSF: pqrsf,
      totalEncuestas: encuestas,
      totalIndicadores: indicadores,
      alertasPendientes: alertas,

      // Indicadores de alerta
      eventosGravesPendientes: eventosGraves,
      pqrsfVencidas: pqrsfVencidas,
      actasPendientes: actasPendientes,
      gpcPorRevisar: gpcPorRevisar,
    };
  }

  /**
   * Estadísticas detalladas con filtros opcionales
   */
  async getEstadisticas(filters = {}) {
    const { fechaInicio, fechaFin } = filters;

    // Construir filtros de fecha
    const dateFilter = {};
    if (fechaInicio || fechaFin) {
      if (fechaInicio) dateFilter.gte = new Date(fechaInicio);
      if (fechaFin) dateFilter.lte = new Date(fechaFin);
    }

    const [
      // Eventos Adversos
      eventosPorTipo,
      eventosPorSeveridad,
      eventosAnalizados,

      // GPC
      gpcPorPatologia,
      gpcConAGREE,

      // Comités
      comitesPorTipo,
      cumplimientoReuniones,

      // PQRSF
      pqrsfPorTipo,
      pqrsfPorEstado,

      // Encuestas
      promedioSatisfaccion,

      // Indicadores
      indicadoresPorCategoria,

      // Alertas
      alertasPorPrioridad,
    ] = await Promise.all([
      // Eventos adversos por tipo
      prisma.eventoAdversoPP.groupBy({
        by: ['tipoEvento'],
        where: {
          activo: true,
          ...(dateFilter.gte || dateFilter.lte
            ? { fechaEvento: dateFilter }
            : {}),
        },
        _count: true,
      }),

      // Eventos adversos por severidad
      prisma.eventoAdversoPP.groupBy({
        by: ['severidad'],
        where: {
          activo: true,
          ...(dateFilter.gte || dateFilter.lte
            ? { fechaEvento: dateFilter }
            : {}),
        },
        _count: true,
      }),

      // % eventos analizados
      prisma.eventoAdversoPP.aggregate({
        where: {
          activo: true,
          ...(dateFilter.gte || dateFilter.lte
            ? { fechaEvento: dateFilter }
            : {}),
        },
        _count: {
          analisisRealizado: true,
        },
      }),

      // GPCs por patología
      prisma.guiaPracticaClinica.groupBy({
        by: ['patologia'],
        where: { activo: true },
        _count: true,
      }),

      // GPCs con evaluación AGREE II
      prisma.guiaPracticaClinica.count({
        where: { activo: true, evaluacionAGREE: true },
      }),

      // Comités por tipo
      prisma.comite.groupBy({
        by: ['tipo'],
        where: { activo: true },
        _count: true,
      }),

      // Cumplimiento de reuniones
      prisma.cronogramaComite.groupBy({
        by: ['estado'],
        where: {
          activo: true,
          ...(dateFilter.gte || dateFilter.lte
            ? { fechaProgramada: dateFilter }
            : {}),
        },
        _count: true,
      }),

      // PQRSF por tipo
      prisma.pQRSF.groupBy({
        by: ['tipo'],
        where: {
          activo: true,
          ...(dateFilter.gte || dateFilter.lte
            ? { fechaRadicacion: dateFilter }
            : {}),
        },
        _count: true,
      }),

      // PQRSF por estado
      prisma.pQRSF.groupBy({
        by: ['estado'],
        where: {
          activo: true,
          ...(dateFilter.gte || dateFilter.lte
            ? { fechaRadicacion: dateFilter }
            : {}),
        },
        _count: true,
      }),

      // Promedio satisfacción general
      prisma.encuestaSatisfaccion.aggregate({
        where: {
          activo: true,
          ...(dateFilter.gte || dateFilter.lte
            ? { fechaEncuesta: dateFilter }
            : {}),
        },
        _avg: {
          satisfaccionGeneral: true,
        },
      }),

      // Indicadores por categoría
      prisma.indicadorProcesosPrioritarios.groupBy({
        by: ['categoria'],
        where: { activo: true },
        _count: true,
      }),

      // Alertas por prioridad
      prisma.alertaProcesosPrioritarios.groupBy({
        by: ['prioridad'],
        where: { activo: true, atendida: false },
        _count: true,
      }),
    ]);

    return {
      eventosAdversos: {
        porTipo: eventosPorTipo.reduce((acc, item) => {
          acc[item.tipoEvento] = item._count;
          return acc;
        }, {}),
        porSeveridad: eventosPorSeveridad.reduce((acc, item) => {
          acc[item.severidad] = item._count;
          return acc;
        }, {}),
        totalAnalizados: eventosAnalizados._count.analisisRealizado,
      },

      gpc: {
        porPatologia: gpcPorPatologia.reduce((acc, item) => {
          acc[item.patologia] = item._count;
          return acc;
        }, {}),
        conEvaluacionAGREE: gpcConAGREE,
      },

      comites: {
        porTipo: comitesPorTipo.reduce((acc, item) => {
          acc[item.tipo] = item._count;
          return acc;
        }, {}),
        cumplimientoReuniones: cumplimientoReuniones.reduce((acc, item) => {
          acc[item.estado] = item._count;
          return acc;
        }, {}),
      },

      pqrsf: {
        porTipo: pqrsfPorTipo.reduce((acc, item) => {
          acc[item.tipo] = item._count;
          return acc;
        }, {}),
        porEstado: pqrsfPorEstado.reduce((acc, item) => {
          acc[item.estado] = item._count;
          return acc;
        }, {}),
      },

      encuestas: {
        promedioSatisfaccion:
          promedioSatisfaccion._avg.satisfaccionGeneral || 0,
      },

      indicadores: {
        porCategoria: indicadoresPorCategoria.reduce((acc, item) => {
          acc[item.categoria] = item._count;
          return acc;
        }, {}),
      },

      alertas: {
        porPrioridad: alertasPorPrioridad.reduce((acc, item) => {
          acc[item.prioridad] = item._count;
          return acc;
        }, {}),
      },
    };
  }

  /**
   * Datos para gráficas (time-series) - Echarts
   */
  async getGraficas(filters = {}) {
    const { mesesAtras = 6 } = filters;
    const fechaInicio = startOfMonth(subMonths(new Date(), mesesAtras));

    const [
      eventosPorMes,
      pqrsfPorMes,
      encuestasPorMes,
      satisfaccionPorMes,
      alertasPorMes,
    ] = await Promise.all([
      // Eventos adversos por mes
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "fecha_evento") as mes,
          COUNT(*)::int as total,
          SUM(CASE WHEN "severidad" IN ('GRAVE', 'MORTAL') THEN 1 ELSE 0 END)::int as graves
        FROM "eventos_adversos_pp"
        WHERE "activo" = true
          AND "fecha_evento" >= ${fechaInicio}
        GROUP BY DATE_TRUNC('month', "fecha_evento")
        ORDER BY mes ASC
      `,

      // PQRSF por mes
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "fecha_radicacion") as mes,
          COUNT(*)::int as total,
          SUM(CASE WHEN "estado" = 'RESPONDIDA' THEN 1 ELSE 0 END)::int as respondidas
        FROM "pqrsf"
        WHERE "activo" = true
          AND "fecha_radicacion" >= ${fechaInicio}
        GROUP BY DATE_TRUNC('month', "fecha_radicacion")
        ORDER BY mes ASC
      `,

      // Encuestas por mes
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "fecha_encuesta") as mes,
          COUNT(*)::int as total
        FROM "encuestas_satisfaccion"
        WHERE "activo" = true
          AND "fecha_encuesta" >= ${fechaInicio}
        GROUP BY DATE_TRUNC('month', "fecha_encuesta")
        ORDER BY mes ASC
      `,

      // Promedio satisfacción por mes
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "fecha_encuesta") as mes,
          ROUND(AVG("satisfaccion_general")::numeric, 2)::float as promedio
        FROM "encuestas_satisfaccion"
        WHERE "activo" = true
          AND "fecha_encuesta" >= ${fechaInicio}
          AND "satisfaccion_general" IS NOT NULL
        GROUP BY DATE_TRUNC('month', "fecha_encuesta")
        ORDER BY mes ASC
      `,

      // Alertas generadas por mes
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "fecha_alerta") as mes,
          COUNT(*)::int as total,
          SUM(CASE WHEN "atendida" = true THEN 1 ELSE 0 END)::int as atendidas
        FROM "alertas_procesos_prioritarios"
        WHERE "activo" = true
          AND "fecha_alerta" >= ${fechaInicio}
        GROUP BY DATE_TRUNC('month', "fecha_alerta")
        ORDER BY mes ASC
      `,
    ]);

    // Top 5 tipos de eventos adversos
    const topEventos = await prisma.eventoAdversoPP.groupBy({
      by: ['tipoEvento'],
      where: {
        activo: true,
        fechaEvento: { gte: fechaInicio },
      },
      _count: true,
      orderBy: { _count: { tipoEvento: 'desc' } },
      take: 5,
    });

    // Top 5 tipos de PQRSF
    const topPQRSF = await prisma.pQRSF.groupBy({
      by: ['tipo'],
      where: {
        activo: true,
        fechaRadicacion: { gte: fechaInicio },
      },
      _count: true,
      orderBy: { _count: { tipo: 'desc' } },
      take: 5,
    });

    return {
      eventosPorMes: eventosPorMes.map((row) => ({
        mes: row.mes,
        total: row.total,
        graves: row.graves,
      })),

      pqrsfPorMes: pqrsfPorMes.map((row) => ({
        mes: row.mes,
        total: row.total,
        respondidas: row.respondidas,
      })),

      encuestasPorMes: encuestasPorMes.map((row) => ({
        mes: row.mes,
        total: row.total,
      })),

      satisfaccionPorMes: satisfaccionPorMes.map((row) => ({
        mes: row.mes,
        promedio: row.promedio,
      })),

      alertasPorMes: alertasPorMes.map((row) => ({
        mes: row.mes,
        total: row.total,
        atendidas: row.atendidas,
      })),

      topEventosAdversos: topEventos.map((item) => ({
        tipo: item.tipoEvento,
        count: item._count,
      })),

      topPQRSF: topPQRSF.map((item) => ({
        tipo: item.tipo,
        count: item._count,
      })),
    };
  }
}

module.exports = new DashboardService();
