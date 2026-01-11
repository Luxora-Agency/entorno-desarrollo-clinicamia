const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class IndicadorPGIRASAService {
  /**
   * Crear indicador
   */
  async create(data) {
    // Validar que el código no exista
    const existing = await prisma.indicadorPGIRASA.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      throw new ValidationError(`Ya existe un indicador con el código ${data.codigo}`);
    }

    // Crear indicador
    return prisma.indicadorPGIRASA.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        objetivo: data.objetivo,
        alcance: data.alcance,
        dominio: data.dominio,
        numeradorDescripcion: data.numeradorDescripcion,
        denominadorDescripcion: data.denominadorDescripcion,
        formulaCalculo: data.formulaCalculo || null,
        tipoCalculo: data.tipoCalculo,
        fuenteDatos: data.fuenteDatos || [],
        responsableKPI: data.responsableKPI,
        responsableMedicion: data.responsableMedicion,
        frecuencia: data.frecuencia,
        metaValor: data.metaValor || null,
        metaTipo: data.metaTipo || null,
      },
    });
  }

  /**
   * Obtener todos los indicadores (con filtros opcionales)
   */
  async findAll(filters = {}) {
    const where = { activo: true };

    if (filters.dominio) {
      where.dominio = filters.dominio;
    }

    if (filters.tipoCalculo) {
      where.tipoCalculo = filters.tipoCalculo;
    }

    if (filters.frecuencia) {
      where.frecuencia = filters.frecuencia;
    }

    const indicadores = await prisma.indicadorPGIRASA.findMany({
      where,
      orderBy: { codigo: 'asc' },
      include: {
        mediciones: {
          where: { activo: true },
          orderBy: { periodo: 'desc' },
          take: 12, // Últimas 12 mediciones
        },
      },
    });

    return indicadores;
  }

  /**
   * Obtener indicador por ID
   */
  async findById(id) {
    const indicador = await prisma.indicadorPGIRASA.findUnique({
      where: { id },
      include: {
        mediciones: {
          where: { activo: true },
          orderBy: { periodo: 'desc' },
          include: {
            registrador: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
              },
            },
            verificador: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
    });

    if (!indicador) {
      throw new NotFoundError('Indicador no encontrado');
    }

    return indicador;
  }

  /**
   * Obtener indicador por código
   */
  async findByCodigo(codigo) {
    const indicador = await prisma.indicadorPGIRASA.findUnique({
      where: { codigo },
      include: {
        mediciones: {
          where: { activo: true },
          orderBy: { periodo: 'desc' },
          take: 12,
        },
      },
    });

    if (!indicador) {
      throw new NotFoundError(`Indicador con código ${codigo} no encontrado`);
    }

    return indicador;
  }

  /**
   * Actualizar indicador
   */
  async update(id, data) {
    // Verificar que existe
    await this.findById(id);

    // Si cambia el código, verificar que no exista otro con ese código
    if (data.codigo) {
      const existing = await prisma.indicadorPGIRASA.findFirst({
        where: {
          codigo: data.codigo,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ValidationError(`Ya existe un indicador con el código ${data.codigo}`);
      }
    }

    // Actualizar
    return prisma.indicadorPGIRASA.update({
      where: { id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        objetivo: data.objetivo,
        alcance: data.alcance,
        dominio: data.dominio,
        numeradorDescripcion: data.numeradorDescripcion,
        denominadorDescripcion: data.denominadorDescripcion,
        formulaCalculo: data.formulaCalculo,
        tipoCalculo: data.tipoCalculo,
        fuenteDatos: data.fuenteDatos,
        responsableKPI: data.responsableKPI,
        responsableMedicion: data.responsableMedicion,
        frecuencia: data.frecuencia,
        metaValor: data.metaValor,
        metaTipo: data.metaTipo,
      },
      include: {
        mediciones: {
          where: { activo: true },
          orderBy: { periodo: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Eliminar indicador (soft delete)
   */
  async delete(id) {
    // Verificar que existe
    await this.findById(id);

    // Soft delete
    return prisma.indicadorPGIRASA.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Obtener resumen de todos los indicadores
   */
  async getResumen(anio = null) {
    const indicadores = await this.findAll();

    const resumen = await Promise.all(
      indicadores.map(async (indicador) => {
        // Obtener última medición
        const ultimaMedicion = indicador.mediciones[0] || null;

        // Calcular tendencia (comparar con medición anterior)
        let tendencia = 'ESTABLE';
        if (indicador.mediciones.length >= 2) {
          const actual = indicador.mediciones[0].resultado;
          const anterior = indicador.mediciones[1].resultado;

          if (actual > anterior) {
            tendencia = 'CRECIENTE';
          } else if (actual < anterior) {
            tendencia = 'DECRECIENTE';
          }
        }

        // Evaluar cumplimiento de meta
        let cumpleMeta = null;
        if (indicador.metaValor && ultimaMedicion) {
          const resultado = ultimaMedicion.resultado;
          const meta = indicador.metaValor;

          switch (indicador.metaTipo) {
            case 'MAYOR_IGUAL':
              cumpleMeta = resultado >= meta;
              break;
            case 'MENOR_IGUAL':
              cumpleMeta = resultado <= meta;
              break;
            case 'IGUAL':
              cumpleMeta = Math.abs(resultado - meta) < 0.01; // Tolerancia
              break;
          }
        }

        return {
          id: indicador.id,
          codigo: indicador.codigo,
          nombre: indicador.nombre,
          dominio: indicador.dominio,
          tipoCalculo: indicador.tipoCalculo,
          frecuencia: indicador.frecuencia,
          ultimaMedicion: ultimaMedicion ? {
            periodo: ultimaMedicion.periodo,
            resultado: ultimaMedicion.resultado,
            fechaRegistro: ultimaMedicion.fechaRegistro,
          } : null,
          tendencia,
          metaValor: indicador.metaValor,
          metaTipo: indicador.metaTipo,
          cumpleMeta,
          totalMediciones: indicador.mediciones.length,
        };
      })
    );

    return resumen;
  }

  /**
   * Obtener indicadores automáticos (para cálculo desde RH1)
   */
  async getIndicadoresAutomaticos() {
    return prisma.indicadorPGIRASA.findMany({
      where: {
        tipoCalculo: {
          in: ['AUTOMATICO', 'MIXTO'],
        },
        activo: true,
      },
    });
  }

  /**
   * Estadísticas generales de indicadores
   */
  async getEstadisticas() {
    const [
      total,
      automaticos,
      manuales,
      porDominio,
      porFrecuencia,
    ] = await Promise.all([
      prisma.indicadorPGIRASA.count({ where: { activo: true } }),
      prisma.indicadorPGIRASA.count({
        where: { activo: true, tipoCalculo: 'AUTOMATICO' },
      }),
      prisma.indicadorPGIRASA.count({
        where: { activo: true, tipoCalculo: 'MANUAL' },
      }),
      prisma.indicadorPGIRASA.groupBy({
        by: ['dominio'],
        where: { activo: true },
        _count: true,
      }),
      prisma.indicadorPGIRASA.groupBy({
        by: ['frecuencia'],
        where: { activo: true },
        _count: true,
      }),
    ]);

    return {
      total,
      automaticos,
      manuales,
      porDominio: porDominio.reduce((acc, item) => {
        acc[item.dominio] = item._count;
        return acc;
      }, {}),
      porFrecuencia: porFrecuencia.reduce((acc, item) => {
        acc[item.frecuencia] = item._count;
        return acc;
      }, {}),
    };
  }

  /**
   * Obtener ficha técnica completa de un indicador
   */
  async getFichaTecnica(id) {
    const indicador = await this.findById(id);

    // Calcular estadísticas de mediciones
    const mediciones = indicador.mediciones;
    const valores = mediciones.map(m => m.resultado);

    const estadisticas = {
      cantidadMediciones: mediciones.length,
      valorMinimo: valores.length > 0 ? Math.min(...valores) : null,
      valorMaximo: valores.length > 0 ? Math.max(...valores) : null,
      valorPromedio: valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : null,
      ultimaMedicion: mediciones[0] || null,
    };

    return {
      ...indicador,
      estadisticas,
    };
  }
}

module.exports = new IndicadorPGIRASAService();
