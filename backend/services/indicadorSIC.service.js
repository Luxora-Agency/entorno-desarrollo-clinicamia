/**
 * Service de Indicadores SIC - Resolución 256/2016
 * Gestión de indicadores de calidad, mediciones y reportes SISPRO
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class IndicadorSICService {
  // ==========================================
  // INDICADORES SIC
  // ==========================================

  /**
   * Obtener todos los indicadores SIC
   */
  async getIndicadores(query = {}) {
    const { dominio, activo = true, search } = query;

    const where = {
      ...(dominio && { dominio }),
      ...(activo !== undefined && { activo: activo === 'true' || activo === true }),
      ...(search && {
        OR: [
          { codigo: { contains: search, mode: 'insensitive' } },
          { nombre: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const indicadores = await prisma.indicadorSIC.findMany({
      where,
      include: {
        _count: {
          select: { mediciones: true },
        },
      },
      orderBy: { codigo: 'asc' },
    });

    return indicadores;
  }

  /**
   * Obtener indicador por ID
   */
  async getIndicadorById(id) {
    const indicador = await prisma.indicadorSIC.findUnique({
      where: { id },
      include: {
        mediciones: {
          orderBy: { periodo: 'desc' },
          take: 24,
          include: {
            registrador: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!indicador) {
      throw new NotFoundError('Indicador SIC no encontrado');
    }

    return indicador;
  }

  /**
   * Obtener indicador por código
   */
  async getIndicadorByCodigo(codigo) {
    const indicador = await prisma.indicadorSIC.findUnique({
      where: { codigo },
      include: {
        mediciones: {
          orderBy: { periodo: 'desc' },
          take: 12,
        },
      },
    });

    if (!indicador) {
      throw new NotFoundError('Indicador SIC no encontrado');
    }

    return indicador;
  }

  /**
   * Crear indicador SIC
   */
  async createIndicador(data) {
    const {
      codigo,
      nombre,
      dominio,
      definicionOperacional,
      formulaNumerador,
      formulaDenominador,
      unidadMedida,
      metaNacional,
      metaInstitucional,
      fuenteDatos,
      periodicidadReporte,
      serviciosAplica,
    } = data;

    // Validar código único
    const existing = await prisma.indicadorSIC.findUnique({ where: { codigo } });
    if (existing) {
      throw new ValidationError('Ya existe un indicador con este código');
    }

    return prisma.indicadorSIC.create({
      data: {
        codigo,
        nombre,
        dominio,
        definicionOperacional,
        formulaNumerador,
        formulaDenominador,
        unidadMedida,
        metaNacional,
        metaInstitucional,
        fuenteDatos,
        periodicidadReporte,
        serviciosAplica: serviciosAplica || [],
      },
    });
  }

  /**
   * Actualizar indicador
   */
  async updateIndicador(id, data) {
    const indicador = await prisma.indicadorSIC.findUnique({ where: { id } });
    if (!indicador) {
      throw new NotFoundError('Indicador SIC no encontrado');
    }

    return prisma.indicadorSIC.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // MEDICIONES SIC
  // ==========================================

  /**
   * Obtener mediciones
   */
  async getMediciones(query = {}) {
    const { page = 1, limit = 20, indicadorId, periodo, reportadoSISPRO } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(indicadorId && { indicadorId }),
      ...(periodo && { periodo }),
      ...(reportadoSISPRO !== undefined && { reportadoSISPRO: reportadoSISPRO === 'true' }),
    };

    const [mediciones, total] = await Promise.all([
      prisma.medicionSIC.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          indicador: {
            select: { codigo: true, nombre: true, dominio: true },
          },
          registrador: { select: { nombre: true, apellido: true } },
        },
        orderBy: [{ periodo: 'desc' }, { indicadorId: 'asc' }],
      }),
      prisma.medicionSIC.count({ where }),
    ]);

    return {
      mediciones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Registrar medición de indicador SIC
   */
  async registrarMedicion(data) {
    const {
      indicadorId,
      periodo,
      numerador,
      denominador,
      analisis,
      fuenteVerificacion,
      registradoPor,
    } = data;

    const indicador = await prisma.indicadorSIC.findUnique({ where: { id: indicadorId } });
    if (!indicador) {
      throw new NotFoundError('Indicador SIC no encontrado');
    }

    // Calcular resultado
    const resultado = denominador > 0 ? (numerador / denominador) : 0;

    // Determinar semáforo basado en meta
    let semaforoEstado = 'Verde';
    const meta = indicador.metaInstitucional || indicador.metaNacional;
    if (meta) {
      const porcentajeCumplimiento = (resultado / parseFloat(meta)) * 100;
      if (porcentajeCumplimiento < 70) {
        semaforoEstado = 'Rojo';
      } else if (porcentajeCumplimiento < 90) {
        semaforoEstado = 'Amarillo';
      }
    }

    const cumpleMeta = meta ? resultado >= parseFloat(meta) : null;

    // Verificar si ya existe medición para este periodo
    const existingMedicion = await prisma.medicionSIC.findFirst({
      where: { indicadorId, periodo },
    });

    if (existingMedicion) {
      return prisma.medicionSIC.update({
        where: { id: existingMedicion.id },
        data: {
          numerador,
          denominador,
          resultado,
          metaVigente: meta,
          cumpleMeta,
          semaforoEstado,
          analisis,
          fuenteVerificacion,
          fechaRegistro: new Date(),
        },
      });
    }

    return prisma.medicionSIC.create({
      data: {
        indicadorId,
        periodo,
        numerador,
        denominador,
        resultado,
        metaVigente: meta,
        cumpleMeta,
        semaforoEstado,
        analisis,
        fuenteVerificacion,
        registradoPor,
        fechaRegistro: new Date(),
        reportadoSISPRO: false,
      },
    });
  }

  /**
   * Marcar mediciones como reportadas a SISPRO
   */
  async marcarReportadoSISPRO(periodo) {
    const result = await prisma.medicionSIC.updateMany({
      where: { periodo, reportadoSISPRO: false },
      data: {
        reportadoSISPRO: true,
        fechaReporteSISPRO: new Date(),
      },
    });

    return { actualizados: result.count };
  }

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  /**
   * Dashboard de indicadores SIC
   */
  async getDashboard(periodo) {
    const periodoActual = periodo || this.getPeriodoActual();

    const [
      totalIndicadores,
      indicadoresPorDominio,
      medicionesDelPeriodo,
      indicadoresEnMeta,
      indicadoresBajoMeta,
      pendientesReporte,
    ] = await Promise.all([
      prisma.indicadorSIC.count({ where: { activo: true } }),
      prisma.indicadorSIC.groupBy({
        by: ['dominio'],
        _count: true,
        where: { activo: true },
      }),
      prisma.medicionSIC.count({ where: { periodo: periodoActual } }),
      prisma.medicionSIC.count({
        where: { periodo: periodoActual, cumpleMeta: true },
      }),
      prisma.medicionSIC.count({
        where: { periodo: periodoActual, cumpleMeta: false },
      }),
      prisma.medicionSIC.count({
        where: { periodo: periodoActual, reportadoSISPRO: false },
      }),
    ]);

    // Semáforo de indicadores
    const semaforoStats = await prisma.medicionSIC.groupBy({
      by: ['semaforoEstado'],
      _count: true,
      where: { periodo: periodoActual },
    });

    // Indicadores sin medición
    const indicadoresSinMedicion = await prisma.indicadorSIC.findMany({
      where: {
        activo: true,
        mediciones: {
          none: { periodo: periodoActual },
        },
      },
      select: { codigo: true, nombre: true, dominio: true },
    });

    // Indicadores en rojo (requieren atención)
    const indicadoresEnRojo = await prisma.medicionSIC.findMany({
      where: { periodo: periodoActual, semaforoEstado: 'Rojo' },
      include: {
        indicador: { select: { codigo: true, nombre: true } },
      },
    });

    return {
      periodo: periodoActual,
      resumen: {
        totalIndicadores,
        medicionesDelPeriodo,
        indicadoresEnMeta,
        indicadoresBajoMeta,
        pendientesReporte,
        indicadoresSinMedicion: indicadoresSinMedicion.length,
      },
      indicadoresPorDominio,
      semaforoStats,
      indicadoresSinMedicion,
      indicadoresEnRojo,
    };
  }

  /**
   * Tendencia de indicadores
   */
  async getTendencia(indicadorId, numPeriodos = 12) {
    const indicador = await prisma.indicadorSIC.findUnique({
      where: { id: indicadorId },
    });
    if (!indicador) {
      throw new NotFoundError('Indicador SIC no encontrado');
    }

    const mediciones = await prisma.medicionSIC.findMany({
      where: { indicadorId },
      orderBy: { periodo: 'desc' },
      take: numPeriodos,
    });

    return {
      indicador: {
        codigo: indicador.codigo,
        nombre: indicador.nombre,
        meta: indicador.metaInstitucional || indicador.metaNacional,
      },
      tendencia: mediciones.reverse().map((m) => ({
        periodo: m.periodo,
        resultado: m.resultado,
        cumpleMeta: m.cumpleMeta,
        semaforo: m.semaforoEstado,
      })),
    };
  }

  /**
   * Generar reporte semestral para SISPRO
   */
  async generarReporteSemestral(semestre) {
    // Formato esperado: 2025-S1 o 2025-S2
    const [anio, sem] = semestre.split('-');
    const mesesSemestre = sem === 'S1'
      ? ['01', '02', '03', '04', '05', '06']
      : ['07', '08', '09', '10', '11', '12'];

    const periodos = mesesSemestre.map((mes) => `${anio}-${mes}`);

    // Obtener mediciones del semestre
    const mediciones = await prisma.medicionSIC.findMany({
      where: {
        periodo: { in: periodos },
      },
      include: {
        indicador: true,
      },
      orderBy: [{ indicadorId: 'asc' }, { periodo: 'asc' }],
    });

    // Agrupar por indicador y calcular consolidado
    const indicadoresMap = new Map();

    mediciones.forEach((m) => {
      if (!indicadoresMap.has(m.indicadorId)) {
        indicadoresMap.set(m.indicadorId, {
          codigo: m.indicador.codigo,
          nombre: m.indicador.nombre,
          dominio: m.indicador.dominio,
          mediciones: [],
          numeradorTotal: 0,
          denominadorTotal: 0,
        });
      }
      const data = indicadoresMap.get(m.indicadorId);
      data.mediciones.push({
        periodo: m.periodo,
        numerador: m.numerador,
        denominador: m.denominador,
        resultado: m.resultado,
      });
      data.numeradorTotal += parseFloat(m.numerador);
      data.denominadorTotal += parseFloat(m.denominador);
    });

    // Calcular resultado consolidado
    const reporte = Array.from(indicadoresMap.values()).map((data) => ({
      ...data,
      resultadoConsolidado: data.denominadorTotal > 0
        ? data.numeradorTotal / data.denominadorTotal
        : 0,
    }));

    return {
      semestre,
      fechaGeneracion: new Date().toISOString(),
      codigoHabilitacion: process.env.CODIGO_HABILITACION || '',
      indicadores: reporte,
    };
  }

  /**
   * Ficha técnica de indicador
   */
  async getFichaTecnica(indicadorId) {
    const indicador = await this.getIndicadorById(indicadorId);

    return {
      codigo: indicador.codigo,
      nombre: indicador.nombre,
      dominio: indicador.dominio,
      definicionOperacional: indicador.definicionOperacional,
      formula: {
        numerador: indicador.formulaNumerador,
        denominador: indicador.formulaDenominador,
      },
      unidadMedida: indicador.unidadMedida,
      metas: {
        nacional: indicador.metaNacional,
        institucional: indicador.metaInstitucional,
      },
      fuenteDatos: indicador.fuenteDatos,
      periodicidadReporte: indicador.periodicidadReporte,
      serviciosAplica: indicador.serviciosAplica,
      ultimasMediciones: indicador.mediciones.slice(0, 6),
    };
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Obtener periodo actual (YYYY-MM)
   */
  getPeriodoActual() {
    return new Date().toISOString().substring(0, 7);
  }

  /**
   * Obtener semestre actual
   */
  getSemestreActual() {
    const now = new Date();
    const semestre = now.getMonth() < 6 ? 'S1' : 'S2';
    return `${now.getFullYear()}-${semestre}`;
  }
}

module.exports = new IndicadorSICService();
