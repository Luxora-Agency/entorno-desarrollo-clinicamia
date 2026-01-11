const prisma = require('../../../db/prisma');
const { NotFoundError } = require('../../../utils/errors');

/**
 * Dashboard Service for Medicamentos Module
 * Provides consolidated statistics and reports across all medicamentos sub-modules
 */
class DashboardMedicamentosService {
  /**
   * Get comprehensive overview of the entire Medicamentos module
   */
  async getResumenGeneral() {
    const [
      inventarioStats,
      farmacovigilanciaStats,
      tecnovigilanciaStats,
      alertasStats,
      temperaturaStats,
      formatosStats,
      protocolosStats,
    ] = await Promise.all([
      this.getEstadisticasInventario(),
      this.getEstadisticasFarmacovigilancia(),
      this.getEstadisticasTecnovigilancia(),
      this.getEstadisticasAlertas(),
      this.getEstadisticasTemperatura(),
      this.getEstadisticasFormatos(),
      this.getEstadisticasProtocolos(),
    ]);

    return {
      inventario: inventarioStats,
      farmacovigilancia: farmacovigilanciaStats,
      tecnovigilancia: tecnovigilanciaStats,
      alertas: alertasStats,
      temperatura: temperaturaStats,
      formatos: formatosStats,
      protocolos: protocolosStats,
      generatedAt: new Date(),
    };
  }

  /**
   * Get detailed inventory statistics
   */
  async getEstadisticasInventario() {
    const ahora = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(ahora.getDate() + 30);
    const en60Dias = new Date();
    en60Dias.setDate(ahora.getDate() + 60);

    const [
      totalItems,
      totalMedicamentos,
      totalDispositivos,
      totalInsumos,
      proximosVencer30,
      proximosVencer60,
      vencidos,
      stockBajo,
      porTipo,
      valorTotal,
    ] = await Promise.all([
      // Total items
      prisma.inventarioMedicamento.count({ where: { activo: true } }),

      // By type
      prisma.inventarioMedicamento.count({
        where: { activo: true, tipo: 'MEDICAMENTO' },
      }),
      prisma.inventarioMedicamento.count({
        where: { activo: true, tipo: 'DISPOSITIVO_MEDICO' },
      }),
      prisma.inventarioMedicamento.count({
        where: { activo: true, tipo: 'INSUMO_MEDICO_QUIRURGICO' },
      }),

      // Expiration alerts
      prisma.inventarioMedicamento.count({
        where: {
          activo: true,
          fechaVencimiento: { lte: en30Dias, gte: ahora },
        },
      }),
      prisma.inventarioMedicamento.count({
        where: {
          activo: true,
          fechaVencimiento: { lte: en60Dias, gte: en30Dias },
        },
      }),
      prisma.inventarioMedicamento.count({
        where: {
          activo: true,
          fechaVencimiento: { lt: ahora },
        },
      }),

      // Stock alerts
      prisma.inventarioMedicamento.count({
        where: {
          activo: true,
          tieneAlertaStock: true,
        },
      }),

      // Distribution by type
      prisma.inventarioMedicamento.groupBy({
        by: ['tipo'],
        where: { activo: true },
        _count: { id: true },
      }),

      // Total value (sum of all quantities)
      prisma.inventarioMedicamento.aggregate({
        where: { activo: true },
        _sum: { cantidadActual: true },
      }),
    ]);

    // Get top expiring items
    const proximosVencer = await prisma.inventarioMedicamento.findMany({
      where: {
        activo: true,
        fechaVencimiento: { lte: en60Dias, gte: ahora },
      },
      orderBy: { fechaVencimiento: 'asc' },
      take: 10,
      select: {
        id: true,
        codigo: true,
        nombre: true,
        tipo: true,
        lote: true,
        fechaVencimiento: true,
        cantidadActual: true,
        unidadMedida: true,
      },
    });

    // Get items with low stock
    const itemsStockBajo = await prisma.inventarioMedicamento.findMany({
      where: {
        activo: true,
        tieneAlertaStock: true,
      },
      orderBy: { cantidadActual: 'asc' },
      take: 10,
      select: {
        id: true,
        codigo: true,
        nombre: true,
        tipo: true,
        cantidadActual: true,
        stockMinimo: true,
        unidadMedida: true,
      },
    });

    return {
      totales: {
        total: totalItems,
        medicamentos: totalMedicamentos,
        dispositivos: totalDispositivos,
        insumos: totalInsumos,
        valorTotal: valorTotal._sum.cantidadActual || 0,
      },
      alertas: {
        proximosVencer30,
        proximosVencer60,
        vencidos,
        stockBajo,
      },
      distribucion: {
        porTipo: porTipo.reduce((acc, item) => {
          acc[item.tipo] = item._count.id;
          return acc;
        }, {}),
      },
      top: {
        proximosVencer,
        itemsStockBajo,
      },
    };
  }

  /**
   * Get farmacovigilancia statistics
   */
  async getEstadisticasFarmacovigilancia() {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioAnio = new Date(ahora.getFullYear(), 0, 1);

    const [
      totalReportes,
      reportesMes,
      reportesAnio,
      porGravedad,
      porCausalidad,
      porEstado,
      pendientesINVIMA,
      reportadosINVIMA,
    ] = await Promise.all([
      prisma.reporteFarmacovigilancia.count({ where: { activo: true } }),
      prisma.reporteFarmacovigilancia.count({
        where: {
          activo: true,
          createdAt: { gte: inicioMes },
        },
      }),
      prisma.reporteFarmacovigilancia.count({
        where: {
          activo: true,
          createdAt: { gte: inicioAnio },
        },
      }),

      // Group by severity
      prisma.reporteFarmacovigilancia.groupBy({
        by: ['gravedadReaccion'],
        where: { activo: true },
        _count: { id: true },
      }),

      // Group by causality (causalidad is optional, can be null)
      prisma.reporteFarmacovigilancia.groupBy({
        by: ['causalidad'],
        where: { activo: true, causalidad: { not: null } },
        _count: { id: true },
      }),

      // Group by status (estado has default value, never null)
      prisma.reporteFarmacovigilancia.groupBy({
        by: ['estado'],
        where: { activo: true },
        _count: { id: true },
      }),

      prisma.reporteFarmacovigilancia.count({
        where: {
          activo: true,
          reportadoINVIMA: false,
        },
      }),
      prisma.reporteFarmacovigilancia.count({
        where: {
          activo: true,
          reportadoINVIMA: true,
        },
      }),
    ]);

    // Get recent reports
    const reportesRecientes = await prisma.reporteFarmacovigilancia.findMany({
      where: { activo: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        medicamento: true,
        gravedadReaccion: true,
        fechaEvento: true,
        reportadoINVIMA: true,
        estado: true,
      },
    });

    return {
      totales: {
        total: totalReportes,
        mes: reportesMes,
        anio: reportesAnio,
        pendientesINVIMA,
        reportadosINVIMA,
      },
      distribucion: {
        porGravedad: porGravedad.reduce((acc, item) => {
          acc[item.gravedadReaccion] = item._count.id;
          return acc;
        }, {}),
        porCausalidad: porCausalidad.reduce((acc, item) => {
          acc[item.causalidad] = item._count.id;
          return acc;
        }, {}),
        porEstado: porEstado.reduce((acc, item) => {
          acc[item.estado] = item._count.id;
          return acc;
        }, {}),
      },
      recientes: reportesRecientes,
    };
  }

  /**
   * Get tecnovigilancia statistics
   */
  async getEstadisticasTecnovigilancia() {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioAnio = new Date(ahora.getFullYear(), 0, 1);

    const [
      totalReportes,
      reportesMes,
      reportesAnio,
      porTipo,
      porGravedad,
      porClasificacion,
      pendientesINVIMA,
      reportadosINVIMA,
    ] = await Promise.all([
      prisma.reporteTecnovigilancia.count({ where: { activo: true } }),
      prisma.reporteTecnovigilancia.count({
        where: {
          activo: true,
          createdAt: { gte: inicioMes },
        },
      }),
      prisma.reporteTecnovigilancia.count({
        where: {
          activo: true,
          createdAt: { gte: inicioAnio },
        },
      }),

      // Group by event type
      prisma.reporteTecnovigilancia.groupBy({
        by: ['tipoEvento'],
        where: { activo: true, tipoEvento: { not: null } },
        _count: { id: true },
      }),

      // Group by severity
      prisma.reporteTecnovigilancia.groupBy({
        by: ['gravedadEvento'],
        where: { activo: true, gravedadEvento: { not: null } },
        _count: { id: true },
      }),

      // Group by classification
      prisma.reporteTecnovigilancia.groupBy({
        by: ['clasificacion'],
        where: { activo: true },
        _count: { id: true },
      }),

      prisma.reporteTecnovigilancia.count({
        where: {
          activo: true,
          reportadoINVIMA: false,
        },
      }),
      prisma.reporteTecnovigilancia.count({
        where: {
          activo: true,
          reportadoINVIMA: true,
        },
      }),
    ]);

    // Get recent reports
    const reportesRecientes = await prisma.reporteTecnovigilancia.findMany({
      where: { activo: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        dispositivoMedico: true,
        tipoEvento: true,
        gravedadEvento: true,
        fechaEvento: true,
        reportadoINVIMA: true,
        estado: true,
      },
    });

    return {
      totales: {
        total: totalReportes,
        mes: reportesMes,
        anio: reportesAnio,
        pendientesINVIMA,
        reportadosINVIMA,
      },
      distribucion: {
        porTipo: porTipo.reduce((acc, item) => {
          acc[item.tipoEvento] = item._count.id;
          return acc;
        }, {}),
        porGravedad: porGravedad.reduce((acc, item) => {
          acc[item.gravedadEvento] = item._count.id;
          return acc;
        }, {}),
        porClasificacion: porClasificacion.reduce((acc, item) => {
          acc[item.clasificacion] = item._count.id;
          return acc;
        }, {}),
      },
      recientes: reportesRecientes,
    };
  }

  /**
   * Get alerts statistics
   */
  async getEstadisticasAlertas() {
    // Note: AlertaCalidad2 doesn't have moduloOrigen, prioridad, atendida, or activo fields
    // We filter medicamentos alerts by checking if they're linked to medicamentos entities
    const whereAlertasMedicamentos = {
      OR: [
        { inventarioMedicamentoId: { not: null } },
        { registroTemperaturaHumedadId: { not: null } },
      ],
    };

    const [totalActivas, totalAtendidas, porTipo, porEstado] =
      await Promise.all([
        prisma.alertaCalidad2.count({
          where: {
            ...whereAlertasMedicamentos,
            atendidoPor: null, // Not attended
          },
        }),
        prisma.alertaCalidad2.count({
          where: {
            ...whereAlertasMedicamentos,
            atendidoPor: { not: null }, // Attended
          },
        }),

        // Group by type
        prisma.alertaCalidad2.groupBy({
          by: ['tipo'],
          where: {
            ...whereAlertasMedicamentos,
            atendidoPor: null,
          },
          _count: { id: true },
        }),

        // Group by estado (mapping to "priority")
        prisma.alertaCalidad2.groupBy({
          by: ['estado'],
          where: {
            ...whereAlertasMedicamentos,
            atendidoPor: null,
          },
          _count: { id: true },
        }),
      ]);

    const criticas = porEstado.find(e => e.estado === 'PENDIENTE')?._count?.id || 0;

    return {
      totales: {
        activas: totalActivas,
        atendidas: totalAtendidas,
        criticas,
      },
      distribucion: {
        porTipo: porTipo.reduce((acc, item) => {
          acc[item.tipo] = item._count.id;
          return acc;
        }, {}),
        porPrioridad: porEstado.reduce((acc, item) => {
          // Map estado to "priority-like" grouping for frontend compatibility
          const priority = item.estado === 'PENDIENTE' ? 'CRITICA' :
                          item.estado === 'EN_PROCESO' ? 'ALTA' : 'MEDIA';
          acc[priority] = (acc[priority] || 0) + item._count.id;
          return acc;
        }, {}),
      },
    };
  }

  /**
   * Get temperature/humidity statistics
   */
  async getEstadisticasTemperatura() {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const [
      totalRegistros,
      registrosMes,
      fueraDeRango,
      porArea,
      registrosRecientes,
    ] = await Promise.all([
      prisma.registroTemperaturaHumedad.count({ where: { activo: true } }),
      prisma.registroTemperaturaHumedad.count({
        where: {
          activo: true,
          createdAt: { gte: inicioMes },
        },
      }),
      prisma.registroTemperaturaHumedad.count({
        where: {
          activo: true,
          requiereAlerta: true,
        },
      }),

      // Group by area
      prisma.registroTemperaturaHumedad.groupBy({
        by: ['area'],
        where: { activo: true },
        _count: { id: true },
      }),

      // Recent out-of-range records
      prisma.registroTemperaturaHumedad.findMany({
        where: {
          activo: true,
          requiereAlerta: true,
        },
        orderBy: { fecha: 'desc' },
        take: 10,
        select: {
          id: true,
          fecha: true,
          area: true,
          temperatura: true,
          humedad: true,
          temperaturaEnRango: true,
          humedadEnRango: true,
        },
      }),
    ]);

    return {
      totales: {
        total: totalRegistros,
        mes: registrosMes,
        fueraDeRango,
      },
      distribucion: {
        porArea: porArea.reduce((acc, item) => {
          acc[item.area] = item._count.id;
          return acc;
        }, {}),
      },
      recientes: registrosRecientes,
    };
  }

  /**
   * Get formatos statistics
   */
  async getEstadisticasFormatos() {
    const [
      totalFormatos,
      formatosVigentes,
      totalInstancias,
      instanciasPendientes,
      porCategoria,
    ] = await Promise.all([
      prisma.formatoMedicamento.count({ where: { activo: true } }),
      prisma.formatoMedicamento.count({
        where: {
          activo: true,
          estado: 'VIGENTE',
        },
      }),
      prisma.instanciaFormatoMedicamento.count({ where: { activo: true } }),
      prisma.instanciaFormatoMedicamento.count({
        where: {
          activo: true,
          estado: 'COMPLETO',
          revisadoPor: null,
        },
      }),

      // Group by category
      prisma.formatoMedicamento.groupBy({
        by: ['categoria'],
        where: { activo: true },
        _count: { id: true },
      }),
    ]);

    return {
      totales: {
        formatos: totalFormatos,
        vigentes: formatosVigentes,
        instancias: totalInstancias,
        pendientesRevision: instanciasPendientes,
      },
      distribucion: {
        porCategoria: porCategoria.reduce((acc, item) => {
          acc[item.categoria] = item._count.id;
          return acc;
        }, {}),
      },
    };
  }

  /**
   * Get protocolos statistics
   */
  async getEstadisticasProtocolos() {
    const [totalProtocolos, vigentes, porTipo, proximasRevisiones] =
      await Promise.all([
        prisma.protocoloMedicamento.count({ where: { activo: true } }),
        prisma.protocoloMedicamento.count({
          where: {
            activo: true,
            estado: 'VIGENTE',
          },
        }),

        // Group by type
        prisma.protocoloMedicamento.groupBy({
          by: ['tipo'],
          where: { activo: true },
          _count: { id: true },
        }),

        // Upcoming reviews (next 90 days)
        prisma.protocoloMedicamento.count({
          where: {
            activo: true,
            estado: 'VIGENTE',
            proximaRevision: {
              lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    return {
      totales: {
        total: totalProtocolos,
        vigentes,
        proximasRevisiones,
      },
      distribucion: {
        porTipo: porTipo.reduce((acc, item) => {
          acc[item.tipo] = item._count.id;
          return acc;
        }, {}),
      },
    };
  }

  /**
   * Get monthly trends for charts
   */
  async getReportesMensuales(anio = new Date().getFullYear()) {
    const meses = Array.from({ length: 12 }, (_, i) => i + 1);

    const farmacoData = await Promise.all(
      meses.map(async (mes) => {
        const inicio = new Date(anio, mes - 1, 1);
        const fin = new Date(anio, mes, 0, 23, 59, 59);
        const count = await prisma.reporteFarmacovigilancia.count({
          where: {
            activo: true,
            createdAt: { gte: inicio, lte: fin },
          },
        });
        return { mes, count };
      })
    );

    const tecnoData = await Promise.all(
      meses.map(async (mes) => {
        const inicio = new Date(anio, mes - 1, 1);
        const fin = new Date(anio, mes, 0, 23, 59, 59);
        const count = await prisma.reporteTecnovigilancia.count({
          where: {
            activo: true,
            createdAt: { gte: inicio, lte: fin },
          },
        });
        return { mes, count };
      })
    );

    return {
      anio,
      farmacovigilancia: farmacoData,
      tecnovigilancia: tecnoData,
    };
  }

  /**
   * Get temperature/humidity trends for specific area
   */
  async getGraficasTemperatura(area, periodo = 'mes') {
    let fechaInicio;
    const fechaFin = new Date();

    switch (periodo) {
      case 'semana':
        fechaInicio = new Date();
        fechaInicio.setDate(fechaFin.getDate() - 7);
        break;
      case 'mes':
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaFin.getMonth() - 1);
        break;
      case 'trimestre':
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaFin.getMonth() - 3);
        break;
      default:
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaFin.getMonth() - 1);
    }

    const registros = await prisma.registroTemperaturaHumedad.findMany({
      where: {
        activo: true,
        area,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      orderBy: { fecha: 'asc' },
      select: {
        fecha: true,
        temperatura: true,
        humedad: true,
        temperaturaMin: true,
        temperaturaMax: true,
        humedadMin: true,
        humedadMax: true,
        temperaturaEnRango: true,
        humedadEnRango: true,
      },
    });

    return {
      area,
      periodo,
      fechaInicio,
      fechaFin,
      registros,
    };
  }
}

module.exports = new DashboardMedicamentosService();
