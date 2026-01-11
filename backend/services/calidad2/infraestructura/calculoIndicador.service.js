const prisma = require('../../../db/prisma');
const { ValidationError } = require('../../../utils/errors');
const indicadorService = require('./indicadorPGIRASA.service');
const medicionService = require('./medicionIndicador.service');

class CalculoIndicadorService {
  /**
   * Calcular indicadores automáticos desde RH1
   */
  async calcularDesdeRH1(mes, anio, userId = 'SISTEMA') {
    // Obtener todos los registros RH1 del mes
    const registros = await prisma.residuoRH1.findMany({
      where: {
        mes: parseInt(mes),
        anio: parseInt(anio),
        activo: true,
      },
    });

    if (registros.length === 0) {
      throw new ValidationError('No hay registros RH1 para el mes/año especificado');
    }

    // Calcular totales del mes
    const totales = registros.reduce((acc, r) => ({
      totalGenerado: acc.totalGenerado + (r.totalGenerado || 0),
      totalPeligrosos: acc.totalPeligrosos + (r.totalPeligrosos || 0),
      totalNoPeligrosos: acc.totalNoPeligrosos + (r.totalNoPeligrosos || 0),
      totalAprovechables: acc.totalAprovechables + (r.residuosAprovechables || 0),
      totalInfecciosos: acc.totalInfecciosos + (r.residuosInfecciosos || 0),
      totalBiosanitarios: acc.totalBiosanitarios + (r.residuosBiosanitarios || 0),
      totalNoAprovechables: acc.totalNoAprovechables + (r.residuosNoAprovechables || 0),
    }), {
      totalGenerado: 0,
      totalPeligrosos: 0,
      totalNoPeligrosos: 0,
      totalAprovechables: 0,
      totalInfecciosos: 0,
      totalBiosanitarios: 0,
      totalNoAprovechables: 0,
    });

    // Obtener indicadores automáticos
    const indicadores = await indicadorService.getIndicadoresAutomaticos();

    // Periodo en formato "YYYY-MM"
    const periodo = `${anio}-${String(mes).padStart(2, '0')}`;

    const mediciones = [];

    // Calcular cada indicador
    for (const indicador of indicadores) {
      let numerador = 0;
      const denominador = totales.totalGenerado;

      // Determinar numerador según código de indicador
      switch (indicador.codigo) {
        case 'DEST_INCINERACION':
          // Residuos infecciosos van a incineración
          numerador = totales.totalInfecciosos;
          break;

        case 'DEST_RECICLAJE':
          // Residuos aprovechables van a reciclaje
          numerador = totales.totalAprovechables;
          break;

        case 'DEST_OTRO_SISTEMA':
          // Biosanitarios van a esterilización (otro sistema)
          numerador = totales.totalBiosanitarios;
          break;

        default:
          // Saltar indicadores manuales
          continue;
      }

      // Calcular resultado (porcentaje)
      const resultado = denominador > 0 ? (numerador / denominador) * 100 : 0;

      // Crear o actualizar medición
      try {
        const medicion = await this.upsertMedicionAutomatica(
          indicador.id,
          periodo,
          mes,
          anio,
          numerador,
          denominador,
          resultado,
          userId
        );

        mediciones.push(medicion);
      } catch (error) {
        console.error(`Error al calcular indicador ${indicador.codigo}:`, error);
        // Continuar con los demás indicadores
      }
    }

    return {
      periodo,
      totalesRH1: totales,
      mediciones,
      indicadoresCalculados: mediciones.length,
    };
  }

  /**
   * Upsert medición automática
   */
  async upsertMedicionAutomatica(indicadorId, periodo, mes, anio, numerador, denominador, resultado, userId) {
    const existing = await prisma.medicionIndicadorPGIRASA.findUnique({
      where: {
        indicadorId_periodo: {
          indicadorId,
          periodo,
        },
      },
    });

    if (existing) {
      // Actualizar solo si es medición automática
      if (!existing.calculoAutomatico) {
        console.log(`Medición ${periodo} del indicador ${indicadorId} es manual, no se actualiza`);
        return existing;
      }

      return prisma.medicionIndicadorPGIRASA.update({
        where: { id: existing.id },
        data: {
          numerador,
          denominador,
          resultado,
          mes,
          anio,
        },
        include: {
          indicador: {
            select: {
              codigo: true,
              nombre: true,
            },
          },
        },
      });
    } else {
      // Crear nueva medición automática
      return prisma.medicionIndicadorPGIRASA.create({
        data: {
          indicador: { connect: { id: indicadorId } },
          periodo,
          mes,
          anio,
          numerador,
          denominador,
          resultado,
          calculoAutomatico: true,
          registrador: { connect: { id: userId } },
          estado: 'REGISTRADO',
        },
        include: {
          indicador: {
            select: {
              codigo: true,
              nombre: true,
            },
          },
        },
      });
    }
  }

  /**
   * Recalcular todos los indicadores automáticos de un año
   */
  async recalcularAnio(anio, userId = 'SISTEMA') {
    const resultados = [];

    // Recalcular cada mes
    for (let mes = 1; mes <= 12; mes++) {
      try {
        const resultado = await this.calcularDesdeRH1(mes, anio, userId);
        resultados.push(resultado);
      } catch (error) {
        console.log(`Mes ${mes}/${anio}: ${error.message}`);
        // Continuar con el siguiente mes
      }
    }

    return {
      anio,
      mesesCalculados: resultados.length,
      resultados,
    };
  }

  /**
   * Hook: Calcular automáticamente al guardar RH1
   */
  async onRH1Saved(mes, anio) {
    try {
      await this.calcularDesdeRH1(mes, anio);
      console.log(`Indicadores automáticos calculados para ${mes}/${anio}`);
    } catch (error) {
      console.error('Error al calcular indicadores automáticos:', error);
      // No lanzar error para no bloquear el guardado de RH1
    }
  }

  /**
   * Obtener dashboard de indicadores con datos del último periodo
   */
  async getDashboard(anio = null) {
    const anioActual = anio || new Date().getFullYear();

    // Obtener todos los indicadores
    const indicadores = await prisma.indicadorPGIRASA.findMany({
      where: { activo: true },
      include: {
        mediciones: {
          where: {
            activo: true,
            anio: anioActual,
          },
          orderBy: { periodo: 'desc' },
        },
      },
    });

    // Procesar cada indicador
    const dashboard = indicadores.map(indicador => {
      const mediciones = indicador.mediciones;
      const ultimaMedicion = mediciones[0] || null;

      // Calcular tendencia (comparar últimas 2 mediciones)
      let tendencia = 'ESTABLE';
      if (mediciones.length >= 2) {
        const actual = mediciones[0].resultado;
        const anterior = mediciones[1].resultado;

        if (actual > anterior) {
          tendencia = 'CRECIENTE';
        } else if (actual < anterior) {
          tendencia = 'DECRECIENTE';
        }
      }

      // Evaluar cumplimiento de meta
      let cumpleMeta = null;
      let porcentajeCumplimiento = null;
      if (indicador.metaValor && ultimaMedicion) {
        cumpleMeta = medicionService.evaluarCumplimientoMeta(
          ultimaMedicion.resultado,
          indicador.metaValor,
          indicador.metaTipo
        );

        // Calcular % de cumplimiento
        if (indicador.metaTipo === 'MAYOR_IGUAL') {
          porcentajeCumplimiento = (ultimaMedicion.resultado / indicador.metaValor) * 100;
        } else if (indicador.metaTipo === 'MENOR_IGUAL') {
          porcentajeCumplimiento = (indicador.metaValor / ultimaMedicion.resultado) * 100;
        }
      }

      // Serie histórica (últimas 12 mediciones)
      const serieHistorica = mediciones.slice(0, 12).reverse().map(m => ({
        periodo: m.periodo,
        valor: m.resultado,
      }));

      return {
        indicador: {
          id: indicador.id,
          codigo: indicador.codigo,
          nombre: indicador.nombre,
          dominio: indicador.dominio,
          tipoCalculo: indicador.tipoCalculo,
          frecuencia: indicador.frecuencia,
        },
        ultimaMedicion: ultimaMedicion ? {
          periodo: ultimaMedicion.periodo,
          resultado: ultimaMedicion.resultado,
          numerador: ultimaMedicion.numerador,
          denominador: ultimaMedicion.denominador,
          estado: ultimaMedicion.estado,
        } : null,
        meta: {
          valor: indicador.metaValor,
          tipo: indicador.metaTipo,
          cumple: cumpleMeta,
          porcentajeCumplimiento,
        },
        tendencia,
        serieHistorica,
        totalMedicionesAnio: mediciones.length,
      };
    });

    // Estadísticas generales
    const medicionesAnio = dashboard.filter(d => d.ultimaMedicion).length;
    const cumpleMetas = dashboard.filter(d => d.meta.cumple === true).length;
    const noCumpleMetas = dashboard.filter(d => d.meta.cumple === false).length;

    return {
      anio: anioActual,
      totalIndicadores: indicadores.length,
      medicionesAnio,
      cumpleMetas,
      noCumpleMetas,
      porcentajeCumplimiento: medicionesAnio > 0 ? (cumpleMetas / medicionesAnio) * 100 : 0,
      indicadores: dashboard,
    };
  }

  /**
   * Comparar rendimiento de indicadores entre periodos
   */
  async compararPeriodos(periodo1, periodo2) {
    const mediciones1 = await medicionService.findByPeriodo(periodo1);
    const mediciones2 = await medicionService.findByPeriodo(periodo2);

    const comparacion = mediciones1.map(m1 => {
      const m2 = mediciones2.find(m => m.indicadorId === m1.indicadorId);

      let variacion = null;
      let variacionPorcentual = null;
      if (m2) {
        variacion = m1.resultado - m2.resultado;
        variacionPorcentual = m2.resultado !== 0 ? (variacion / m2.resultado) * 100 : 0;
      }

      return {
        indicador: m1.indicador,
        periodo1: {
          periodo: periodo1,
          resultado: m1.resultado,
        },
        periodo2: m2 ? {
          periodo: periodo2,
          resultado: m2.resultado,
        } : null,
        variacion,
        variacionPorcentual,
      };
    });

    return comparacion;
  }
}

module.exports = new CalculoIndicadorService();
