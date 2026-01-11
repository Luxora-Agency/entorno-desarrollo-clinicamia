/**
 * Servicio de Dashboard SST
 * Proporciona metricas y KPIs consolidados del SG-SST
 * Normativa: Decreto 1072/2015
 */

const prisma = require('../../db/prisma');

class DashboardSSTService {
  /**
   * Obtener dashboard ejecutivo SST
   */
  async getDashboard({ anio }) {
    anio = anio || new Date().getFullYear();
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const [
      accidentalidad,
      enfermedadLaboral,
      indicadores,
      copasst,
      capacitacion,
      inspecciones,
      planAnual,
      estandares,
      alertas,
    ] = await Promise.all([
      this.getResumenAccidentalidad(fechaInicio, fechaFin),
      this.getResumenEnfermedadLaboral(fechaInicio, fechaFin),
      this.getIndicadoresClaves(anio),
      this.getResumenCopasst(),
      this.getResumenCapacitacion(fechaInicio, fechaFin),
      this.getResumenInspecciones(fechaInicio, fechaFin),
      this.getResumenPlanAnual(anio),
      this.getResumenEstandares(anio),
      this.getAlertas(),
    ]);

    return {
      anio,
      fechaActualizacion: new Date(),
      accidentalidad,
      enfermedadLaboral,
      indicadores,
      copasst,
      capacitacion,
      inspecciones,
      planAnual,
      estandares,
      alertas,
    };
  }

  /**
   * Resumen de accidentalidad
   */
  async getResumenAccidentalidad(fechaInicio, fechaFin) {
    const where = {
      fechaAccidente: { gte: fechaInicio, lte: fechaFin },
    };

    const [total, porMes, porTipo, diasPerdidos] = await Promise.all([
      prisma.sSTAccidenteTrabajo.count({ where }),
      prisma.$queryRaw`
        SELECT EXTRACT(MONTH FROM fecha_accidente) as mes, COUNT(*) as cantidad
        FROM sst_accidentes_trabajo
        WHERE fecha_accidente >= ${fechaInicio} AND fecha_accidente <= ${fechaFin}
        GROUP BY EXTRACT(MONTH FROM fecha_accidente)
        ORDER BY mes
      `,
      prisma.sSTAccidenteTrabajo.groupBy({
        by: ['tipoAccidente'],
        where,
        _count: true,
      }),
      prisma.sSTAccidenteTrabajo.aggregate({
        where,
        _sum: { diasIncapacidad: true },
      }),
    ]);

    const pendientesInvestigacion = await prisma.sSTAccidenteTrabajo.count({
      where: { ...where, estado: 'REPORTADO', investigacion: null },
    });

    return {
      total,
      diasPerdidos: diasPerdidos._sum.diasIncapacidad || 0,
      pendientesInvestigacion,
      porMes: this.completarMeses(porMes),
      porTipo: porTipo.map(t => ({ tipo: t.tipoAccidente, cantidad: t._count })),
    };
  }

  /**
   * Resumen de enfermedad laboral
   */
  async getResumenEnfermedadLaboral(fechaInicio, fechaFin) {
    const where = {
      fechaDiagnostico: { gte: fechaInicio, lte: fechaFin },
    };

    const [total, porEstado, conReubicacion] = await Promise.all([
      prisma.sSTEnfermedadLaboral.count({ where }),
      prisma.sSTEnfermedadLaboral.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.sSTEnfermedadLaboral.count({
        where: { ...where, reubicacionLaboral: true },
      }),
    ]);

    return {
      total,
      conReubicacion,
      porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count })),
    };
  }

  /**
   * Indicadores clave
   */
  async getIndicadoresClaves(anio) {
    const empleadosActivos = await prisma.tHEmpleado.count({
      where: { estado: 'ACTIVO' },
    });

    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const [accidentes, diasPerdidos] = await Promise.all([
      prisma.sSTAccidenteTrabajo.count({
        where: { fechaAccidente: { gte: fechaInicio, lte: fechaFin } },
      }),
      prisma.sSTAccidenteTrabajo.aggregate({
        where: { fechaAccidente: { gte: fechaInicio, lte: fechaFin } },
        _sum: { diasIncapacidad: true },
      }),
    ]);

    const HHT = empleadosActivos * 2000; // Aproximado
    const K = 240000;

    return {
      trabajadores: empleadosActivos,
      indiceFrecuencia: HHT > 0 ? ((accidentes * K) / HHT).toFixed(2) : 0,
      indiceSeveridad: HHT > 0 ? (((diasPerdidos._sum.diasIncapacidad || 0) * K) / HHT).toFixed(2) : 0,
      tasaAccidentalidad: empleadosActivos > 0 ? ((accidentes / empleadosActivos) * 100).toFixed(2) : 0,
    };
  }

  /**
   * Resumen COPASST
   */
  async getResumenCopasst() {
    const copasst = await prisma.sSTCopasst.findFirst({
      where: { estado: 'VIGENTE' },
      include: {
        _count: { select: { integrantes: true, reuniones: true } },
        reuniones: {
          where: { estado: 'REALIZADA' },
          orderBy: { fechaReunion: 'desc' },
          take: 1,
        },
      },
    });

    if (!copasst) {
      return { vigente: false };
    }

    const compromisosPendientes = await prisma.sSTCompromisoReunion.count({
      where: {
        reunion: { copasstId: copasst.id },
        estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
      },
    });

    return {
      vigente: true,
      integrantes: copasst._count.integrantes,
      reunionesRealizadas: copasst._count.reuniones,
      ultimaReunion: copasst.reuniones[0]?.fechaReunion,
      compromisosPendientes,
      vencimiento: copasst.fechaVencimiento,
    };
  }

  /**
   * Resumen de capacitacion
   */
  async getResumenCapacitacion(fechaInicio, fechaFin) {
    const [total, realizadas, porTipo] = await Promise.all([
      prisma.sSTCapacitacionSST.count({
        where: { fechaProgramada: { gte: fechaInicio, lte: fechaFin } },
      }),
      prisma.sSTCapacitacionSST.count({
        where: {
          estado: 'REALIZADA',
          fechaEjecucion: { gte: fechaInicio, lte: fechaFin },
        },
      }),
      prisma.sSTCapacitacionSST.groupBy({
        by: ['tipoCapacitacion'],
        where: {
          estado: 'REALIZADA',
          fechaEjecucion: { gte: fechaInicio, lte: fechaFin },
        },
        _count: true,
      }),
    ]);

    const totalEmpleados = await prisma.tHEmpleado.count({ where: { estado: 'ACTIVO' } });
    const empleadosCapacitados = await prisma.sSTAsistenteCapacitacion.groupBy({
      by: ['empleadoId'],
      where: {
        asistio: true,
        capacitacion: { fechaEjecucion: { gte: fechaInicio, lte: fechaFin } },
      },
    });

    return {
      programadas: total,
      realizadas,
      cumplimiento: total > 0 ? ((realizadas / total) * 100).toFixed(1) : 0,
      cobertura: totalEmpleados > 0 ? ((empleadosCapacitados.length / totalEmpleados) * 100).toFixed(1) : 0,
      porTipo: porTipo.map(t => ({ tipo: t.tipoCapacitacion, cantidad: t._count })),
    };
  }

  /**
   * Resumen de inspecciones
   */
  async getResumenInspecciones(fechaInicio, fechaFin) {
    const [total, hallazgosAbiertos] = await Promise.all([
      prisma.sSTInspeccion.count({
        where: { fechaInspeccion: { gte: fechaInicio, lte: fechaFin } },
      }),
      prisma.sSTHallazgoInspeccion.count({
        where: {
          estado: 'ABIERTO',
          inspeccion: { fechaInspeccion: { gte: fechaInicio, lte: fechaFin } },
        },
      }),
    ]);

    const hallazgosPorNivel = await prisma.sSTHallazgoInspeccion.groupBy({
      by: ['nivelRiesgo'],
      where: {
        estado: 'ABIERTO',
      },
      _count: true,
    });

    return {
      total,
      hallazgosAbiertos,
      hallazgosPorNivel: hallazgosPorNivel.map(h => ({ nivel: h.nivelRiesgo, cantidad: h._count })),
    };
  }

  /**
   * Resumen del plan anual
   */
  async getResumenPlanAnual(anio) {
    const plan = await prisma.sSTPlanAnualTrabajo.findFirst({
      where: { anio },
      include: { actividades: true },
    });

    if (!plan) {
      return { existe: false };
    }

    const actividadesTotal = plan.actividades.length;
    const actividadesCumplidas = plan.actividades.filter(a => a.estado === 'COMPLETADA').length;
    const actividadesVencidas = plan.actividades.filter(
      a => a.estado !== 'COMPLETADA' && a.fechaProgramada && new Date(a.fechaProgramada) < new Date()
    ).length;

    return {
      existe: true,
      estado: plan.estado,
      actividades: {
        total: actividadesTotal,
        cumplidas: actividadesCumplidas,
        vencidas: actividadesVencidas,
        cumplimiento: actividadesTotal > 0 ? ((actividadesCumplidas / actividadesTotal) * 100).toFixed(1) : 0,
      },
    };
  }

  /**
   * Resumen de evaluacion de estandares
   */
  async getResumenEstandares(anio) {
    const evaluacion = await prisma.sSTEvaluacionEstandares.findFirst({
      where: { anio, estado: 'COMPLETADA' },
    });

    if (!evaluacion) {
      return { evaluado: false };
    }

    const pendientesPlan = await prisma.SSTPlanMejoramientoEstandar.count({
      where: { evaluacionId: evaluacion.id, estado: 'PENDIENTE' },
    });

    return {
      evaluado: true,
      puntaje: evaluacion.puntajeTotal,
      valoracion: evaluacion.valoracion,
      pendientesPlanMejora: pendientesPlan,
    };
  }

  /**
   * Obtener alertas activas
   */
  async getAlertas() {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    const [
      examenesVencidos,
      examenesProximos,
      eppVencidos,
      documentosVencidos,
      accionesVencidas,
      simulacrosRequeridos,
    ] = await Promise.all([
      // Examenes medicos vencidos
      prisma.sSTExamenMedico.count({
        where: {
          estado: 'REALIZADO',
          fechaVencimiento: { lt: hoy },
          empleado: { estado: 'ACTIVO' },
        },
      }),
      // Examenes proximos a vencer
      prisma.sSTExamenMedico.count({
        where: {
          estado: 'REALIZADO',
          fechaVencimiento: { gte: hoy, lte: en30Dias },
          empleado: { estado: 'ACTIVO' },
        },
      }),
      // EPP vencidos
      prisma.sSTEntregaEPP.count({
        where: {
          estado: 'ENTREGADO',
          fechaVencimiento: { lt: hoy },
          empleado: { estado: 'ACTIVO' },
        },
      }),
      // Documentos SST vencidos
      prisma.sSTDocumentoSST.count({
        where: {
          estado: 'VIGENTE',
          fechaVigencia: { lt: hoy },
        },
      }),
      // Acciones correctivas vencidas
      prisma.sSTAccionCorrectiva.count({
        where: {
          estado: { in: ['ABIERTA', 'IMPLEMENTADA'] },
          fechaImplementacion: { lt: hoy },
        },
      }),
      // Verificar si hay simulacro en el año
      prisma.sSTSimulacro.count({
        where: {
          estado: 'REALIZADO',
          fechaEjecucion: {
            gte: new Date(hoy.getFullYear(), 0, 1),
            lte: new Date(hoy.getFullYear(), 11, 31),
          },
        },
      }),
    ]);

    const alertas = [];

    if (examenesVencidos > 0) {
      alertas.push({
        tipo: 'CRITICA',
        modulo: 'EXAMENES_MEDICOS',
        mensaje: `${examenesVencidos} examen(es) medico(s) vencido(s)`,
        cantidad: examenesVencidos,
      });
    }

    if (examenesProximos > 0) {
      alertas.push({
        tipo: 'ADVERTENCIA',
        modulo: 'EXAMENES_MEDICOS',
        mensaje: `${examenesProximos} examen(es) proximo(s) a vencer`,
        cantidad: examenesProximos,
      });
    }

    if (eppVencidos > 0) {
      alertas.push({
        tipo: 'ADVERTENCIA',
        modulo: 'EPP',
        mensaje: `${eppVencidos} EPP vencido(s)`,
        cantidad: eppVencidos,
      });
    }

    if (documentosVencidos > 0) {
      alertas.push({
        tipo: 'ADVERTENCIA',
        modulo: 'DOCUMENTOS',
        mensaje: `${documentosVencidos} documento(s) vencido(s)`,
        cantidad: documentosVencidos,
      });
    }

    if (accionesVencidas > 0) {
      alertas.push({
        tipo: 'CRITICA',
        modulo: 'ACCIONES_CORRECTIVAS',
        mensaje: `${accionesVencidas} accion(es) correctiva(s) vencida(s)`,
        cantidad: accionesVencidas,
      });
    }

    if (simulacrosRequeridos === 0) {
      alertas.push({
        tipo: 'ADVERTENCIA',
        modulo: 'SIMULACROS',
        mensaje: 'No se ha realizado simulacro en el año actual',
        cantidad: 0,
      });
    }

    return alertas;
  }

  /**
   * Completar array de meses (1-12)
   */
  completarMeses(data) {
    const resultado = [];
    for (let i = 1; i <= 12; i++) {
      const encontrado = data.find(d => Number(d.mes) === i);
      resultado.push({
        mes: i,
        cantidad: encontrado ? Number(encontrado.cantidad) : 0,
      });
    }
    return resultado;
  }
}

module.exports = new DashboardSSTService();
