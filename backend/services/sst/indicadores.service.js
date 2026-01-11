/**
 * Servicio de Indicadores SST
 * Calcula y gestiona indicadores de estructura, proceso y resultado
 * Normativa: Decreto 1072/2015, Resolucion 0312/2019
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class IndicadoresService {
  /**
   * Obtener catalogo de indicadores
   */
  async getCatalogo() {
    return prisma.sSTIndicador.findMany({
      where: { activo: true },
      orderBy: [{ tipoIndicador: 'asc' }, { nombre: 'asc' }],
    });
  }

  /**
   * Obtener mediciones de un indicador
   */
  async getMediciones(indicadorId, { anio }) {
    const where = { indicadorId };

    if (anio) {
      where.anio = anio;
    }

    return prisma.sSTMedicionIndicador.findMany({
      where,
      orderBy: [{ anio: 'desc' }, { periodo: 'desc' }],
      include: {
        indicador: {
          select: { nombre: true, meta: true, unidad: true },
        },
      },
    });
  }

  /**
   * Registrar medicion de indicador
   */
  async registrarMedicion(data) {
    const indicador = await prisma.sSTIndicador.findUnique({
      where: { id: data.indicadorId },
    });

    if (!indicador) {
      throw new NotFoundError('Indicador no encontrado');
    }

    // Verificar si ya existe medicion para el periodo
    const existe = await prisma.sSTMedicionIndicador.findFirst({
      where: {
        indicadorId: data.indicadorId,
        anio: data.anio,
        periodo: data.periodo,
      },
    });

    if (existe) {
      throw new ValidationError('Ya existe una medicion para este periodo');
    }

    // Calcular cumplimiento de meta
    let cumpleMeta = false;
    if (indicador.meta) {
      if (indicador.tipoMeta === 'MAXIMIZAR') {
        cumpleMeta = data.valor >= indicador.meta;
      } else if (indicador.tipoMeta === 'MINIMIZAR') {
        cumpleMeta = data.valor <= indicador.meta;
      }
    }

    const medicion = await prisma.sSTMedicionIndicador.create({
      data: {
        indicadorId: data.indicadorId,
        anio: data.anio,
        periodo: data.periodo, // 1-12 para mensual, 1-4 para trimestral
        numerador: data.numerador,
        denominador: data.denominador,
        valor: data.valor,
        cumpleMeta,
        analisis: data.analisis,
        accionMejora: data.accionMejora,
        registradoPorId: data.registradoPorId,
      },
      include: {
        indicador: true,
      },
    });

    return medicion;
  }

  /**
   * Calcular indicadores de accidentalidad
   */
  async calcularAccidentalidad({ anio, mes }) {
    const fechaInicio = mes
      ? new Date(anio, mes - 1, 1)
      : new Date(anio, 0, 1);
    const fechaFin = mes
      ? new Date(anio, mes, 0)
      : new Date(anio, 11, 31);

    // Obtener datos base
    const [accidentes, empleadosActivos, horasTrabajadas] = await Promise.all([
      prisma.sSTAccidenteTrabajo.findMany({
        where: {
          fechaAccidente: { gte: fechaInicio, lte: fechaFin },
        },
      }),
      prisma.tHEmpleado.count({ where: { estado: 'ACTIVO' } }),
      // Asumimos 240,000 HHT como constante para calculo
      Promise.resolve(empleadosActivos * 2000), // HHT aproximadas
    ]);

    const totalAccidentes = accidentes.length;
    const accidentesIncapacitantes = accidentes.filter(a => a.diasIncapacidad > 0).length;
    const diasPerdidos = accidentes.reduce((sum, a) => sum + (a.diasIncapacidad || 0), 0);
    const accidentesMortales = accidentes.filter(a => a.tipoIncapacidad === 'MORTAL').length;

    const HHT = horasTrabajadas || 1; // Evitar division por cero
    const K = 240000; // Constante para calculo

    // Calcular indicadores
    const indicadores = {
      periodo: { anio, mes },
      totalAccidentes,
      accidentesIncapacitantes,
      diasPerdidos,
      accidentesMortales,
      trabajadoresExpuestos: empleadosActivos,
      HHT,

      // Indice de Frecuencia (IF)
      indiceFrecuencia: (accidentesIncapacitantes * K) / HHT,

      // Indice de Severidad (IS)
      indiceSeveridad: (diasPerdidos * K) / HHT,

      // Indice de Lesiones Incapacitantes (ILI)
      indiceILI: ((accidentesIncapacitantes * K) / HHT) * ((diasPerdidos * K) / HHT) / 1000,

      // Tasa de Accidentalidad
      tasaAccidentalidad: (totalAccidentes / empleadosActivos) * 100,

      // Tasa de Mortalidad
      tasaMortalidad: (accidentesMortales * 100000) / empleadosActivos,
    };

    return indicadores;
  }

  /**
   * Calcular indicadores de enfermedad laboral
   */
  async calcularEnfermedadLaboral({ anio }) {
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const [enfermedades, empleadosActivos] = await Promise.all([
      prisma.sSTEnfermedadLaboral.findMany({
        where: {
          fechaDiagnostico: { gte: fechaInicio, lte: fechaFin },
        },
      }),
      prisma.tHEmpleado.count({ where: { estado: 'ACTIVO' } }),
    ]);

    const casosNuevos = enfermedades.filter(e => e.estado === 'CONFIRMADA').length;
    const casosTotales = await prisma.sSTEnfermedadLaboral.count({
      where: { estado: 'CONFIRMADA' },
    });

    return {
      anio,
      casosNuevos,
      casosTotales,
      trabajadoresExpuestos: empleadosActivos,

      // Tasa de Prevalencia
      prevalencia: (casosTotales * 100000) / empleadosActivos,

      // Tasa de Incidencia
      incidencia: (casosNuevos * 100000) / empleadosActivos,
    };
  }

  /**
   * Calcular indicadores de ausentismo
   */
  async calcularAusentismo({ anio, mes }) {
    const fechaInicio = mes
      ? new Date(anio, mes - 1, 1)
      : new Date(anio, 0, 1);
    const fechaFin = mes
      ? new Date(anio, mes, 0)
      : new Date(anio, 11, 31);

    // Dias perdidos por accidentes
    const diasAccidentes = await prisma.sSTAccidenteTrabajo.aggregate({
      where: {
        fechaAccidente: { gte: fechaInicio, lte: fechaFin },
      },
      _sum: { diasIncapacidad: true },
    });

    // Dias perdidos por enfermedades laborales
    const diasEnfermedades = await prisma.sSTEnfermedadLaboral.aggregate({
      where: {
        fechaDiagnostico: { gte: fechaInicio, lte: fechaFin },
      },
      _sum: { diasIncapacidad: true },
    });

    const empleadosActivos = await prisma.tHEmpleado.count({
      where: { estado: 'ACTIVO' },
    });

    // Dias programados (aproximado)
    const diasMes = mes ? new Date(anio, mes, 0).getDate() : 365;
    const diasProgramados = empleadosActivos * diasMes;

    const diasPerdidosTotal =
      (diasAccidentes._sum.diasIncapacidad || 0) +
      (diasEnfermedades._sum.diasIncapacidad || 0);

    return {
      periodo: { anio, mes },
      diasPerdidosAccidentes: diasAccidentes._sum.diasIncapacidad || 0,
      diasPerdidosEnfermedades: diasEnfermedades._sum.diasIncapacidad || 0,
      diasPerdidosTotal,
      diasProgramados,

      // Tasa de Ausentismo
      tasaAusentismo: (diasPerdidosTotal / diasProgramados) * 100,
    };
  }

  /**
   * Calcular indicadores de proceso (cobertura)
   */
  async calcularCoberturas({ anio }) {
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const empleadosActivos = await prisma.tHEmpleado.count({
      where: { estado: 'ACTIVO' },
    });

    // Cobertura induccion SST
    const empleadosConInduccion = await prisma.sSTAsistenteCapacitacion.groupBy({
      by: ['empleadoId'],
      where: {
        asistio: true,
        capacitacion: {
          tipoCapacitacion: 'INDUCCION',
          estado: 'REALIZADA',
        },
      },
    });

    // Cobertura examenes medicos
    const empleadosConExamen = await prisma.sSTExamenMedico.groupBy({
      by: ['empleadoId'],
      where: {
        estado: 'REALIZADO',
        fechaVencimiento: { gte: new Date() },
      },
    });

    // Cumplimiento plan anual
    const plan = await prisma.sSTPlanAnualTrabajo.findFirst({
      where: { anio },
      include: { actividades: true },
    });

    let cumplimientoPlan = 0;
    if (plan) {
      const actividadesCumplidas = plan.actividades.filter(a => a.estado === 'COMPLETADA').length;
      cumplimientoPlan = plan.actividades.length > 0
        ? (actividadesCumplidas / plan.actividades.length) * 100
        : 0;
    }

    // Cobertura capacitaciones
    const empleadosCapacitados = await prisma.sSTAsistenteCapacitacion.groupBy({
      by: ['empleadoId'],
      where: {
        asistio: true,
        capacitacion: {
          fechaEjecucion: { gte: fechaInicio, lte: fechaFin },
          estado: 'REALIZADA',
        },
      },
    });

    return {
      anio,
      empleadosActivos,
      coberturaInduccion: (empleadosConInduccion.length / empleadosActivos) * 100,
      coberturaExamenesMedicos: (empleadosConExamen.length / empleadosActivos) * 100,
      coberturaCapacitacion: (empleadosCapacitados.length / empleadosActivos) * 100,
      cumplimientoPlanAnual: cumplimientoPlan,
    };
  }

  /**
   * Obtener dashboard de indicadores
   */
  async getDashboard({ anio }) {
    const [
      accidentalidad,
      enfermedadLaboral,
      ausentismo,
      coberturas,
    ] = await Promise.all([
      this.calcularAccidentalidad({ anio }),
      this.calcularEnfermedadLaboral({ anio }),
      this.calcularAusentismo({ anio }),
      this.calcularCoberturas({ anio }),
    ]);

    return {
      anio,
      accidentalidad,
      enfermedadLaboral,
      ausentismo,
      coberturas,
    };
  }

  /**
   * Obtener tendencia de un indicador
   */
  async getTendencia(indicadorId, { anioInicio, anioFin }) {
    return prisma.sSTMedicionIndicador.findMany({
      where: {
        indicadorId,
        anio: { gte: anioInicio, lte: anioFin },
      },
      orderBy: [{ anio: 'asc' }, { periodo: 'asc' }],
    });
  }
}

module.exports = new IndicadoresService();
