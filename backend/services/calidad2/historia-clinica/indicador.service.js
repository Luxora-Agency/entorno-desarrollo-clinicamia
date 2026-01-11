const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

/**
 * Servicio para gestión de Indicadores de Calidad de Historia Clínica
 *
 * Funcionalidades:
 * - CRUD de indicadores de calidad HC
 * - Registro de mediciones periódicas
 * - Cálculo de cumplimiento de metas
 * - Dashboard con tendencias y análisis
 * - Alertas de indicadores fuera de meta
 */
class IndicadorHCService {
  /**
   * Obtener todos los indicadores con filtros y paginación
   */
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      frecuencia,
      responsable,
      activo = true,
      search
    } = filters;

    const skip = (page - 1) * limit;
    const where = { activo };

    if (frecuencia) where.frecuencia = frecuencia;
    if (responsable) where.responsable = responsable;

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [indicadores, total] = await Promise.all([
      prisma.indicadorCalidadHC.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { codigo: 'asc' },
        include: {
          responsableUsuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          },
          mediciones: {
            take: 6,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              periodo: true,
              resultado: true,
              cumpleMeta: true
            }
          },
          _count: {
            select: { mediciones: true }
          }
        }
      }),
      prisma.indicadorCalidadHC.count({ where })
    ]);

    return {
      indicadores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener un indicador por ID con todas sus mediciones
   */
  async getById(id) {
    const indicador = await prisma.indicadorCalidadHC.findUnique({
      where: { id, activo: true },
      include: {
        responsableUsuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            rol: true
          }
        },
        mediciones: {
          orderBy: { createdAt: 'desc' },
          include: {
            registrador: {
              select: {
                id: true,
                nombre: true,
                apellido: true
              }
            }
          }
        }
      }
    });

    if (!indicador) {
      throw new NotFoundError('Indicador no encontrado');
    }

    return indicador;
  }

  /**
   * Crear nuevo indicador
   */
  async create(data) {
    const {
      codigo,
      nombre,
      descripcion,
      formula,
      meta,
      unidadMedida,
      sentido,
      frecuencia,
      responsable
    } = data;

    // Validaciones
    if (!codigo || !nombre || !descripcion || !formula) {
      throw new ValidationError('Código, nombre, descripción y fórmula son requeridos');
    }

    if (meta === undefined || meta === null) {
      throw new ValidationError('La meta es requerida');
    }

    if (!unidadMedida || !sentido || !frecuencia || !responsable) {
      throw new ValidationError('Todos los campos de configuración son requeridos');
    }

    // Verificar código único
    const codigoExiste = await prisma.indicadorCalidadHC.findUnique({
      where: { codigo }
    });

    if (codigoExiste) {
      throw new ValidationError(`El código ${codigo} ya existe`);
    }

    // Verificar responsable
    const responsableExiste = await prisma.usuario.findUnique({
      where: { id: responsable }
    });

    if (!responsableExiste) {
      throw new NotFoundError('El responsable no existe');
    }

    const indicador = await prisma.indicadorCalidadHC.create({
      data: {
        codigo,
        nombre,
        descripcion,
        formula,
        meta: parseFloat(meta),
        unidadMedida,
        sentido,
        frecuencia,
        responsable
      },
      include: {
        responsableUsuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    return indicador;
  }

  /**
   * Actualizar indicador existente
   */
  async update(id, data) {
    const indicador = await prisma.indicadorCalidadHC.findUnique({
      where: { id, activo: true }
    });

    if (!indicador) {
      throw new NotFoundError('Indicador no encontrado');
    }

    const {
      codigo,
      nombre,
      descripcion,
      formula,
      meta,
      unidadMedida,
      sentido,
      frecuencia,
      responsable
    } = data;

    // Si se actualiza el código, verificar que no exista
    if (codigo && codigo !== indicador.codigo) {
      const codigoExiste = await prisma.indicadorCalidadHC.findUnique({
        where: { codigo }
      });

      if (codigoExiste) {
        throw new ValidationError(`El código ${codigo} ya existe`);
      }
    }

    const indicadorActualizado = await prisma.indicadorCalidadHC.update({
      where: { id },
      data: {
        ...(codigo && { codigo }),
        ...(nombre && { nombre }),
        ...(descripcion && { descripcion }),
        ...(formula && { formula }),
        ...(meta !== undefined && { meta: parseFloat(meta) }),
        ...(unidadMedida && { unidadMedida }),
        ...(sentido && { sentido }),
        ...(frecuencia && { frecuencia }),
        ...(responsable && { responsable })
      },
      include: {
        responsableUsuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        _count: {
          select: { mediciones: true }
        }
      }
    });

    return indicadorActualizado;
  }

  /**
   * Eliminar indicador (soft delete)
   */
  async delete(id) {
    const indicador = await prisma.indicadorCalidadHC.findUnique({
      where: { id, activo: true }
    });

    if (!indicador) {
      throw new NotFoundError('Indicador no encontrado');
    }

    await prisma.indicadorCalidadHC.update({
      where: { id },
      data: { activo: false }
    });

    return { message: 'Indicador eliminado exitosamente' };
  }

  // ==========================================
  // GESTIÓN DE MEDICIONES
  // ==========================================

  /**
   * Crear medición de indicador
   */
  async createMedicion(indicadorId, data) {
    const {
      periodo,
      numerador,
      denominador,
      resultado,
      analisis,
      accionesMejora,
      registradoPor
    } = data;

    // Validar que el indicador existe
    const indicador = await prisma.indicadorCalidadHC.findUnique({
      where: { id: indicadorId, activo: true }
    });

    if (!indicador) {
      throw new NotFoundError('Indicador no encontrado');
    }

    // Validaciones
    if (!periodo || !registradoPor) {
      throw new ValidationError('Periodo y registrador son requeridos');
    }

    if (resultado === undefined || resultado === null) {
      throw new ValidationError('El resultado es requerido');
    }

    // Parsear periodo para extraer año, mes, trimestre
    const { anio, mes, trimestre } = this._parsearPeriodo(periodo);

    // Verificar que no exista medición para este periodo
    const medicionExiste = await prisma.medicionIndicadorHC.findUnique({
      where: {
        indicadorId_periodo: {
          indicadorId,
          periodo
        }
      }
    });

    if (medicionExiste) {
      throw new ValidationError(`Ya existe una medición para el periodo ${periodo}`);
    }

    // Determinar si cumple la meta
    const resultadoFloat = parseFloat(resultado);
    const cumpleMeta = this._evaluarCumplimientoMeta(
      resultadoFloat,
      indicador.meta,
      indicador.sentido
    );

    const medicion = await prisma.medicionIndicadorHC.create({
      data: {
        indicadorId,
        periodo,
        mes,
        trimestre,
        anio,
        numerador: numerador !== undefined ? parseFloat(numerador) : null,
        denominador: denominador !== undefined ? parseFloat(denominador) : null,
        resultado: resultadoFloat,
        cumpleMeta,
        analisis,
        accionesMejora,
        registradoPor
      },
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    return medicion;
  }

  /**
   * Obtener mediciones de un indicador
   */
  async getMedicionesByIndicador(indicadorId, filters = {}) {
    const { anio, page = 1, limit = 12 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      indicadorId,
      activo: true
    };

    if (anio) {
      where.anio = parseInt(anio);
    }

    const [mediciones, total] = await Promise.all([
      prisma.medicionIndicadorHC.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          registrador: {
            select: {
              id: true,
              nombre: true,
              apellido: true
            }
          }
        }
      }),
      prisma.medicionIndicadorHC.count({ where })
    ]);

    return {
      mediciones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener dashboard de indicadores
   */
  async getDashboard(filters = {}) {
    const { anio = new Date().getFullYear() } = filters;

    const where = {
      activo: true
    };

    // Obtener todos los indicadores
    const indicadores = await prisma.indicadorCalidadHC.findMany({
      where,
      include: {
        mediciones: {
          where: { anio: parseInt(anio), activo: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Calcular estadísticas
    const totalIndicadores = indicadores.length;
    let cumpliendo = 0;
    let noCumpliendo = 0;
    let sinMediciones = 0;

    const indicadoresConUltimaMedicion = indicadores.map(ind => {
      if (ind.mediciones.length === 0) {
        sinMediciones++;
        return {
          ...ind,
          ultimaMedicion: null,
          estadoCumplimiento: 'SIN_MEDICIONES'
        };
      }

      const ultimaMedicion = ind.mediciones[0];
      if (ultimaMedicion.cumpleMeta) {
        cumpliendo++;
      } else {
        noCumpliendo++;
      }

      return {
        ...ind,
        ultimaMedicion,
        estadoCumplimiento: ultimaMedicion.cumpleMeta ? 'CUMPLE' : 'NO_CUMPLE'
      };
    });

    // Calcular tendencias
    const tendencias = this._calcularTendencias(indicadores, anio);

    return {
      resumen: {
        total: totalIndicadores,
        cumpliendo,
        noCumpliendo,
        sinMediciones,
        porcentajeCumplimiento: totalIndicadores > 0
          ? Math.round((cumpliendo / totalIndicadores) * 100)
          : 0
      },
      indicadores: indicadoresConUltimaMedicion,
      tendencias,
      anio: parseInt(anio)
    };
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Parsear periodo para extraer año, mes, trimestre
   * Formatos soportados: "2025-01", "2025-Q1", "2025"
   * @private
   */
  _parsearPeriodo(periodo) {
    let anio, mes = null, trimestre = null;

    if (periodo.includes('-Q')) {
      // Formato trimestral: "2025-Q1"
      const partes = periodo.split('-Q');
      anio = parseInt(partes[0]);
      trimestre = parseInt(partes[1]);
    } else if (periodo.includes('-')) {
      // Formato mensual: "2025-01"
      const partes = periodo.split('-');
      anio = parseInt(partes[0]);
      mes = parseInt(partes[1]);
    } else {
      // Formato anual: "2025"
      anio = parseInt(periodo);
    }

    return { anio, mes, trimestre };
  }

  /**
   * Evaluar si una medición cumple la meta
   * @private
   */
  _evaluarCumplimientoMeta(resultado, meta, sentido) {
    if (sentido === 'ASCENDENTE') {
      return resultado >= meta;
    } else {
      return resultado <= meta;
    }
  }

  /**
   * Calcular tendencias de indicadores
   * @private
   */
  _calcularTendencias(indicadores, anio) {
    return indicadores.map(ind => {
      const mediciones = ind.mediciones
        .filter(m => m.anio === parseInt(anio))
        .sort((a, b) => a.createdAt - b.createdAt);

      if (mediciones.length < 2) {
        return {
          indicadorId: ind.id,
          codigo: ind.codigo,
          nombre: ind.nombre,
          tendencia: 'INSUFICIENTE',
          cambio: 0
        };
      }

      const primera = mediciones[0].resultado;
      const ultima = mediciones[mediciones.length - 1].resultado;
      const cambio = ((ultima - primera) / primera) * 100;

      let tendencia;
      if (ind.sentido === 'ASCENDENTE') {
        tendencia = cambio > 0 ? 'MEJORA' : cambio < 0 ? 'DETERIORO' : 'ESTABLE';
      } else {
        tendencia = cambio < 0 ? 'MEJORA' : cambio > 0 ? 'DETERIORO' : 'ESTABLE';
      }

      return {
        indicadorId: ind.id,
        codigo: ind.codigo,
        nombre: ind.nombre,
        tendencia,
        cambio: Math.round(cambio * 100) / 100,
        mediciones: mediciones.map(m => ({
          periodo: m.periodo,
          resultado: m.resultado,
          cumpleMeta: m.cumpleMeta
        }))
      };
    });
  }
}

module.exports = new IndicadorHCService();
