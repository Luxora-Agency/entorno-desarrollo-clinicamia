const prisma = require('../../../db/prisma');
const { NotFoundError } = require('../../../utils/errors');

/**
 * Servicio para Dashboard de Historia Clínica
 * Consolida datos de todos los submódulos para vistas agregadas
 */
class DashboardHCService {
  /**
   * Obtener resumen general del dashboard
   * Incluye estadísticas de todos los submódulos
   */
  async getResumen(filters = {}) {
    const { fechaInicio, fechaFin } = filters;

    // Rango de fechas (por defecto últimos 30 días)
    const endDate = fechaFin ? new Date(fechaFin) : new Date();
    const startDate = fechaInicio
      ? new Date(fechaInicio)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Obtener datos en paralelo
    const [
      documentos,
      certificaciones,
      consentimientos,
      auditorias,
      indicadores,
      alertas,
    ] = await Promise.all([
      this._getDocumentosStats(startDate, endDate),
      this._getCertificacionesStats(startDate, endDate),
      this._getConsentimientosStats(startDate, endDate),
      this._getAuditoriasStats(startDate, endDate),
      this._getIndicadoresStats(startDate, endDate),
      this._getAlertasStats(startDate, endDate),
    ]);

    return {
      documentos,
      certificaciones,
      consentimientos,
      auditorias,
      indicadores,
      alertas,
      periodo: {
        inicio: startDate,
        fin: endDate,
      },
    };
  }

  /**
   * Obtener estadísticas de documentos
   */
  async _getDocumentosStats(startDate, endDate) {
    const [total, porTipo, porEstado, recientes] = await Promise.all([
      // Total de documentos activos
      prisma.documentoHC.count({
        where: { activo: true },
      }),

      // Documentos por tipo
      prisma.documentoHC.groupBy({
        by: ['tipo'],
        where: { activo: true },
        _count: { id: true },
      }),

      // Documentos por estado
      prisma.documentoHC.groupBy({
        by: ['estado'],
        where: { activo: true },
        _count: { id: true },
      }),

      // Documentos recientes
      prisma.documentoHC.count({
        where: {
          activo: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    // Calcular documentos próximos a revisión (6 meses desde fecha de emisión)
    const proximosRevision = await prisma.documentoHC.count({
      where: {
        activo: true,
        estado: 'VIGENTE',
        fechaRevision: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Próximos 30 días
        },
      },
    });

    return {
      total,
      porTipo: porTipo.map((item) => ({
        tipo: item.tipo,
        cantidad: item._count.id,
      })),
      porEstado: porEstado.map((item) => ({
        estado: item.estado,
        cantidad: item._count.id,
      })),
      recientes,
      proximosRevision,
    };
  }

  /**
   * Obtener estadísticas de certificaciones
   */
  async _getCertificacionesStats(startDate, endDate) {
    const [total, porTipo, vigentes, proximasVencer, vencidas] = await Promise.all([
      // Total de certificaciones
      prisma.certificacionHC.count({
        where: { activo: true },
      }),

      // Por tipo
      prisma.certificacionHC.groupBy({
        by: ['tipo'],
        where: { activo: true },
        _count: { id: true },
      }),

      // Vigentes
      prisma.certificacionHC.count({
        where: {
          activo: true,
          estado: 'VIGENTE',
          fechaVencimiento: {
            gt: new Date(),
          },
        },
      }),

      // Próximas a vencer (60 días)
      prisma.certificacionHC.count({
        where: {
          activo: true,
          estado: 'VIGENTE',
          fechaVencimiento: {
            gt: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Vencidas
      prisma.certificacionHC.count({
        where: {
          activo: true,
          fechaVencimiento: {
            lt: new Date(),
          },
        },
      }),
    ]);

    return {
      total,
      porTipo: porTipo.map((item) => ({
        tipo: item.tipo,
        cantidad: item._count.id,
      })),
      vigentes,
      proximasVencer,
      vencidas,
      porcentajeVigentes: total > 0 ? ((vigentes / total) * 100).toFixed(1) : 0,
    };
  }

  /**
   * Obtener estadísticas de consentimientos
   */
  async _getConsentimientosStats(startDate, endDate) {
    const [totalTipos, totalAplicados, aplicadosPeriodo, porServicio] = await Promise.all([
      // Total de tipos de consentimiento
      prisma.consentimientoTipo.count({
        where: { activo: true, estado: 'VIGENTE' },
      }),

      // Total de consentimientos aplicados
      prisma.consentimientoAplicado.count({
        where: { activo: true },
      }),

      // Aplicados en el período
      prisma.consentimientoAplicado.count({
        where: {
          activo: true,
          fechaAplicacion: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      // Por servicio
      prisma.consentimientoTipo.groupBy({
        by: ['servicio'],
        where: { activo: true, estado: 'VIGENTE' },
        _count: { id: true },
      }),
    ]);

    // Consentimientos con todas las firmas
    const conFirmasCompletas = await prisma.consentimientoAplicado.count({
      where: {
        activo: true,
        firmaPaciente: { not: null },
        firmaMedico: { not: null },
      },
    });

    return {
      totalTipos,
      totalAplicados,
      aplicadosPeriodo,
      porServicio: porServicio.map((item) => ({
        servicio: item.servicio,
        cantidad: item._count.id,
      })),
      conFirmasCompletas,
      porcentajeFirmasCompletas:
        totalAplicados > 0 ? ((conFirmasCompletas / totalAplicados) * 100).toFixed(1) : 0,
    };
  }

  /**
   * Obtener estadísticas de auditorías
   */
  async _getAuditoriasStats(startDate, endDate) {
    const [total, porTipo, abiertas, cerradas, auditoriasRecientes] = await Promise.all([
      // Total de auditorías
      prisma.auditoriaHC.count({
        where: { activo: true },
      }),

      // Por tipo
      prisma.auditoriaHC.groupBy({
        by: ['tipo'],
        where: { activo: true },
        _count: { id: true },
      }),

      // Abiertas
      prisma.auditoriaHC.count({
        where: {
          activo: true,
          estado: 'ABIERTA',
        },
      }),

      // Cerradas
      prisma.auditoriaHC.count({
        where: {
          activo: true,
          estado: 'CERRADA',
        },
      }),

      // Auditorías en el período
      prisma.auditoriaHC.findMany({
        where: {
          activo: true,
          fechaAuditoria: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          hallazgosPositivos: true,
          hallazgosNegativos: true,
          hallazgosCriticos: true,
          historiasRevisadas: true,
        },
      }),
    ]);

    // Calcular totales de hallazgos
    const totalesHallazgos = auditoriasRecientes.reduce(
      (acc, aud) => ({
        positivos: acc.positivos + aud.hallazgosPositivos,
        negativos: acc.negativos + aud.hallazgosNegativos,
        criticos: acc.criticos + aud.hallazgosCriticos,
        historiasRevisadas: acc.historiasRevisadas + aud.historiasRevisadas,
      }),
      { positivos: 0, negativos: 0, criticos: 0, historiasRevisadas: 0 }
    );

    // Hallazgos críticos abiertos
    const hallazgosCriticosAbiertos = await prisma.hallazgoHC.count({
      where: {
        activo: true,
        severidad: 'CRITICA',
        estado: { in: ['ABIERTO', 'EN_PROCESO'] },
      },
    });

    return {
      total,
      porTipo: porTipo.map((item) => ({
        tipo: item.tipo,
        cantidad: item._count.id,
      })),
      abiertas,
      cerradas,
      hallazgos: totalesHallazgos,
      hallazgosCriticosAbiertos,
      auditoriasEnPeriodo: auditoriasRecientes.length,
    };
  }

  /**
   * Obtener estadísticas de indicadores
   */
  async _getIndicadoresStats(startDate, endDate) {
    const anioActual = new Date().getFullYear();

    const [totalIndicadores, indicadoresActivos, medicionesAnio] = await Promise.all([
      // Total de indicadores
      prisma.indicadorCalidadHC.count({
        where: { activo: true },
      }),

      // Indicadores activos con última medición
      prisma.indicadorCalidadHC.findMany({
        where: { activo: true },
        include: {
          mediciones: {
            where: {
              activo: true,
              anio: anioActual,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      }),

      // Mediciones del año
      prisma.medicionIndicadorHC.findMany({
        where: {
          activo: true,
          anio: anioActual,
        },
        select: {
          cumpleMeta: true,
          resultado: true,
        },
      }),
    ]);

    // Calcular cumplimiento
    const cumpleMeta = medicionesAnio.filter((m) => m.cumpleMeta).length;
    const porcentajeCumplimiento =
      medicionesAnio.length > 0 ? ((cumpleMeta / medicionesAnio.length) * 100).toFixed(1) : 0;

    // Promedio de resultados
    const promedioResultados =
      medicionesAnio.length > 0
        ? (
            medicionesAnio.reduce((sum, m) => sum + m.resultado, 0) / medicionesAnio.length
          ).toFixed(2)
        : 0;

    return {
      total: totalIndicadores,
      activos: indicadoresActivos.length,
      medicionesAnio: medicionesAnio.length,
      cumpleMeta,
      noCumpleMeta: medicionesAnio.length - cumpleMeta,
      porcentajeCumplimiento,
      promedioResultados,
    };
  }

  /**
   * Obtener alertas activas
   */
  async _getAlertasStats(startDate, endDate) {
    const now = new Date();

    // Certificaciones próximas a vencer
    const certificacionesProximasVencer = await prisma.certificacionHC.count({
      where: {
        activo: true,
        estado: 'VIGENTE',
        fechaVencimiento: {
          gt: now,
          lte: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 días
        },
      },
    });

    // Certificaciones vencidas
    const certificacionesVencidas = await prisma.certificacionHC.count({
      where: {
        activo: true,
        fechaVencimiento: {
          lt: now,
        },
      },
    });

    // Documentos próximos a revisión
    const documentosProximosRevision = await prisma.documentoHC.count({
      where: {
        activo: true,
        estado: 'VIGENTE',
        fechaRevision: {
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 días
        },
      },
    });

    // Hallazgos críticos abiertos
    const hallazgosCriticosAbiertos = await prisma.hallazgoHC.count({
      where: {
        activo: true,
        severidad: 'CRITICA',
        estado: { in: ['ABIERTO', 'EN_PROCESO'] },
      },
    });

    // Auditorías abiertas
    const auditoriasAbiertas = await prisma.auditoriaHC.count({
      where: {
        activo: true,
        estado: 'ABIERTA',
      },
    });

    const totalAlertas =
      certificacionesProximasVencer +
      certificacionesVencidas +
      documentosProximosRevision +
      hallazgosCriticosAbiertos +
      auditoriasAbiertas;

    return {
      total: totalAlertas,
      certificacionesProximasVencer,
      certificacionesVencidas,
      documentosProximosRevision,
      hallazgosCriticosAbiertos,
      auditoriasAbiertas,
    };
  }

  /**
   * Obtener datos para gráfica de tendencias de indicadores
   */
  async getTendenciasIndicadores(filters = {}) {
    const { anio, indicadorId } = filters;
    const anioConsulta = anio ? parseInt(anio, 10) : new Date().getFullYear();

    const whereClause = {
      activo: true,
      anio: anioConsulta,
    };

    if (indicadorId) {
      whereClause.indicadorId = indicadorId;
    }

    const mediciones = await prisma.medicionIndicadorHC.findMany({
      where: whereClause,
      include: {
        indicador: {
          select: {
            codigo: true,
            nombre: true,
            meta: true,
            unidadMedida: true,
          },
        },
      },
      orderBy: [{ anio: 'asc' }, { mes: 'asc' }, { trimestre: 'asc' }],
    });

    // Agrupar por indicador
    const porIndicador = {};

    mediciones.forEach((medicion) => {
      const key = medicion.indicadorId;
      if (!porIndicador[key]) {
        porIndicador[key] = {
          indicador: medicion.indicador,
          mediciones: [],
        };
      }

      porIndicador[key].mediciones.push({
        periodo: medicion.periodo,
        mes: medicion.mes,
        trimestre: medicion.trimestre,
        resultado: medicion.resultado,
        cumpleMeta: medicion.cumpleMeta,
        createdAt: medicion.createdAt,
      });
    });

    return Object.values(porIndicador);
  }

  /**
   * Obtener timeline de auditorías y hallazgos
   */
  async getTimelineAuditorias(filters = {}) {
    const { anio } = filters;
    const anioConsulta = anio ? parseInt(anio, 10) : new Date().getFullYear();

    const startDate = new Date(anioConsulta, 0, 1);
    const endDate = new Date(anioConsulta, 11, 31, 23, 59, 59);

    const auditorias = await prisma.auditoriaHC.findMany({
      where: {
        activo: true,
        fechaAuditoria: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        tipo: true,
        fechaAuditoria: true,
        areaAuditada: true,
        hallazgosPositivos: true,
        hallazgosNegativos: true,
        hallazgosCriticos: true,
        estado: true,
      },
      orderBy: {
        fechaAuditoria: 'asc',
      },
    });

    // Agrupar por mes
    const porMes = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      auditorias: 0,
      hallazgosPositivos: 0,
      hallazgosNegativos: 0,
      hallazgosCriticos: 0,
    }));

    auditorias.forEach((auditoria) => {
      const mes = new Date(auditoria.fechaAuditoria).getMonth();
      porMes[mes].auditorias++;
      porMes[mes].hallazgosPositivos += auditoria.hallazgosPositivos;
      porMes[mes].hallazgosNegativos += auditoria.hallazgosNegativos;
      porMes[mes].hallazgosCriticos += auditoria.hallazgosCriticos;
    });

    return {
      anio: anioConsulta,
      porMes,
      totalAuditorias: auditorias.length,
    };
  }

  /**
   * Obtener distribución de consentimientos aplicados
   */
  async getDistribucionConsentimientos(filters = {}) {
    const { anio } = filters;
    const anioConsulta = anio ? parseInt(anio, 10) : new Date().getFullYear();

    const startDate = new Date(anioConsulta, 0, 1);
    const endDate = new Date(anioConsulta, 11, 31, 23, 59, 59);

    const consentimientos = await prisma.consentimientoAplicado.findMany({
      where: {
        activo: true,
        fechaAplicacion: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        tipo: {
          select: {
            nombre: true,
            servicio: true,
          },
        },
      },
    });

    // Agrupar por servicio
    const porServicio = {};
    consentimientos.forEach((cons) => {
      const servicio = cons.tipo.servicio;
      if (!porServicio[servicio]) {
        porServicio[servicio] = 0;
      }
      porServicio[servicio]++;
    });

    return {
      anio: anioConsulta,
      total: consentimientos.length,
      porServicio: Object.entries(porServicio).map(([servicio, cantidad]) => ({
        servicio,
        cantidad,
      })),
    };
  }

  /**
   * Obtener top hallazgos recurrentes
   */
  async getTopHallazgos(filters = {}) {
    const { limit = 10 } = filters;

    // Obtener todos los hallazgos
    const hallazgos = await prisma.hallazgoHC.findMany({
      where: {
        activo: true,
      },
      select: {
        tipo: true,
        severidad: true,
        criterio: true,
      },
    });

    // Agrupar por criterio
    const agrupados = {};
    hallazgos.forEach((hallazgo) => {
      const key = hallazgo.criterio;
      if (!agrupados[key]) {
        agrupados[key] = {
          criterio: hallazgo.criterio,
          cantidad: 0,
          porTipo: {},
          porSeveridad: {},
        };
      }

      agrupados[key].cantidad++;

      // Contar por tipo
      if (!agrupados[key].porTipo[hallazgo.tipo]) {
        agrupados[key].porTipo[hallazgo.tipo] = 0;
      }
      agrupados[key].porTipo[hallazgo.tipo]++;

      // Contar por severidad
      if (!agrupados[key].porSeveridad[hallazgo.severidad]) {
        agrupados[key].porSeveridad[hallazgo.severidad] = 0;
      }
      agrupados[key].porSeveridad[hallazgo.severidad]++;
    });

    // Convertir a array y ordenar
    const resultado = Object.values(agrupados)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limit);

    return resultado;
  }
}

module.exports = new DashboardHCService();
