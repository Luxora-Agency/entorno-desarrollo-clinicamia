const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class MedicionIndicadorService {
  /**
   * Crear medición manual
   */
  async create(indicadorId, data, userId) {
    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    // Verificar que el indicador existe
    const indicador = await prisma.indicadorPGIRASA.findUnique({
      where: { id: indicadorId },
    });

    if (!indicador) {
      throw new NotFoundError('Indicador no encontrado');
    }

    // Validar que no exista medición para ese periodo
    const existing = await prisma.medicionIndicadorPGIRASA.findUnique({
      where: {
        indicadorId_periodo: {
          indicadorId,
          periodo: data.periodo,
        },
      },
    });

    if (existing) {
      throw new ValidationError(`Ya existe una medición para el periodo ${data.periodo}`);
    }

    // Calcular resultado
    const numerador = parseFloat(data.numerador);
    const denominador = parseFloat(data.denominador);

    if (denominador === 0) {
      throw new ValidationError('El denominador no puede ser cero');
    }

    const resultado = (numerador / denominador) * 100;

    // Extraer mes y año del periodo
    const [anio, mes] = data.periodo.split('-').map(Number);

    // Crear medición
    return prisma.medicionIndicadorPGIRASA.create({
      data: {
        indicador: { connect: { id: indicadorId } },
        periodo: data.periodo,
        mes: mes || null,
        anio,
        numerador,
        denominador,
        resultado,
        notas: data.notas || null,
        calculoAutomatico: false,
        adjuntos: data.adjuntos || [],
        registradoPor: userId,
        estado: 'REGISTRADO',
      },
      include: {
        indicador: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });
  }

  /**
   * Actualizar medición
   */
  async update(id, data, userId) {
    // Verificar que existe
    const medicion = await prisma.medicionIndicadorPGIRASA.findUnique({
      where: { id },
    });

    if (!medicion) {
      throw new NotFoundError('Medición no encontrada');
    }

    // No permitir editar mediciones automáticas
    if (medicion.calculoAutomatico) {
      throw new ValidationError('No se pueden editar mediciones automáticas');
    }

    // Recalcular resultado si cambiaron numerador o denominador
    let resultado = medicion.resultado;
    if (data.numerador !== undefined || data.denominador !== undefined) {
      const numerador = parseFloat(data.numerador ?? medicion.numerador);
      const denominador = parseFloat(data.denominador ?? medicion.denominador);

      if (denominador === 0) {
        throw new ValidationError('El denominador no puede ser cero');
      }

      resultado = (numerador / denominador) * 100;
    }

    // Actualizar
    return prisma.medicionIndicadorPGIRASA.update({
      where: { id },
      data: {
        numerador: data.numerador,
        denominador: data.denominador,
        resultado,
        notas: data.notas,
        adjuntos: data.adjuntos,
      },
      include: {
        indicador: true,
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar medición (soft delete)
   */
  async delete(id) {
    const medicion = await prisma.medicionIndicadorPGIRASA.findUnique({
      where: { id },
    });

    if (!medicion) {
      throw new NotFoundError('Medición no encontrada');
    }

    // No permitir eliminar mediciones automáticas
    if (medicion.calculoAutomatico) {
      throw new ValidationError('No se pueden eliminar mediciones automáticas');
    }

    return prisma.medicionIndicadorPGIRASA.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Obtener mediciones por indicador
   */
  async findByIndicador(indicadorId, filters = {}) {
    const where = {
      indicadorId,
      activo: true,
    };

    if (filters.anio) {
      where.anio = parseInt(filters.anio);
    }

    if (filters.mes) {
      where.mes = parseInt(filters.mes);
    }

    if (filters.periodo) {
      where.periodo = filters.periodo;
    }

    return prisma.medicionIndicadorPGIRASA.findMany({
      where,
      orderBy: { periodo: 'desc' },
      include: {
        indicador: {
          select: {
            codigo: true,
            nombre: true,
            metaValor: true,
            metaTipo: true,
          },
        },
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
    });
  }

  /**
   * Obtener mediciones de un periodo específico (todos los indicadores)
   */
  async findByPeriodo(periodo) {
    return prisma.medicionIndicadorPGIRASA.findMany({
      where: {
        periodo,
        activo: true,
      },
      include: {
        indicador: true,
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        indicador: {
          codigo: 'asc',
        },
      },
    });
  }

  /**
   * Verificar medición
   */
  async verificar(id, userId) {
    const medicion = await prisma.medicionIndicadorPGIRASA.findUnique({
      where: { id },
    });

    if (!medicion) {
      throw new NotFoundError('Medición no encontrada');
    }

    if (medicion.estado === 'VERIFICADO') {
      throw new ValidationError('La medición ya está verificada');
    }

    return prisma.medicionIndicadorPGIRASA.update({
      where: { id },
      data: {
        estado: 'VERIFICADO',
        verificador: { connect: { id: userId } },
        fechaVerificacion: new Date(),
      },
      include: {
        indicador: true,
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
    });
  }

  /**
   * Upsert medición (crear o actualizar)
   */
  async upsert(indicadorId, periodo, data, userId) {
    const existing = await prisma.medicionIndicadorPGIRASA.findUnique({
      where: {
        indicadorId_periodo: {
          indicadorId,
          periodo,
        },
      },
    });

    if (existing) {
      return this.update(existing.id, data, userId);
    } else {
      return this.create(indicadorId, { ...data, periodo }, userId);
    }
  }

  /**
   * Obtener serie histórica de un indicador (para gráficas)
   */
  async getSerieHistorica(indicadorId, limite = 12) {
    const mediciones = await prisma.medicionIndicadorPGIRASA.findMany({
      where: {
        indicadorId,
        activo: true,
      },
      orderBy: { periodo: 'asc' },
      take: limite,
      select: {
        periodo: true,
        resultado: true,
        numerador: true,
        denominador: true,
        estado: true,
      },
    });

    // Obtener meta del indicador
    const indicador = await prisma.indicadorPGIRASA.findUnique({
      where: { id: indicadorId },
      select: {
        metaValor: true,
        metaTipo: true,
      },
    });

    return {
      mediciones,
      meta: indicador.metaValor,
      metaTipo: indicador.metaTipo,
    };
  }

  /**
   * Comparar indicadores en un periodo
   */
  async compararIndicadores(indicadorIds, periodo) {
    const mediciones = await prisma.medicionIndicadorPGIRASA.findMany({
      where: {
        indicadorId: {
          in: indicadorIds,
        },
        periodo,
        activo: true,
      },
      include: {
        indicador: {
          select: {
            codigo: true,
            nombre: true,
            metaValor: true,
            metaTipo: true,
          },
        },
      },
    });

    return mediciones.map(m => ({
      indicador: m.indicador,
      resultado: m.resultado,
      numerador: m.numerador,
      denominador: m.denominador,
      cumpleMeta: this.evaluarCumplimientoMeta(
        m.resultado,
        m.indicador.metaValor,
        m.indicador.metaTipo
      ),
    }));
  }

  /**
   * Evaluar cumplimiento de meta
   */
  evaluarCumplimientoMeta(resultado, metaValor, metaTipo) {
    if (!metaValor) return null;

    switch (metaTipo) {
      case 'MAYOR_IGUAL':
        return resultado >= metaValor;
      case 'MENOR_IGUAL':
        return resultado <= metaValor;
      case 'IGUAL':
        return Math.abs(resultado - metaValor) < 0.01;
      default:
        return null;
    }
  }

  /**
   * Obtener estadísticas de mediciones
   */
  async getEstadisticas(anio = null) {
    const where = { activo: true };
    if (anio) {
      where.anio = parseInt(anio);
    }

    const [
      total,
      automaticas,
      manuales,
      verificadas,
      pendientes,
    ] = await Promise.all([
      prisma.medicionIndicadorPGIRASA.count({ where }),
      prisma.medicionIndicadorPGIRASA.count({
        where: { ...where, calculoAutomatico: true },
      }),
      prisma.medicionIndicadorPGIRASA.count({
        where: { ...where, calculoAutomatico: false },
      }),
      prisma.medicionIndicadorPGIRASA.count({
        where: { ...where, estado: 'VERIFICADO' },
      }),
      prisma.medicionIndicadorPGIRASA.count({
        where: { ...where, estado: { not: 'VERIFICADO' } },
      }),
    ]);

    return {
      total,
      automaticas,
      manuales,
      verificadas,
      pendientes,
    };
  }
}

module.exports = new MedicionIndicadorService();
