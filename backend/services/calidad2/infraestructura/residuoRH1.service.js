const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class ResiduoRH1Service {
  /**
   * Calcular totales automáticamente
   */
  calcularTotales(data) {
    const aprovechables = parseFloat(data.residuosAprovechables) || 0;
    const noAprovechables = parseFloat(data.residuosNoAprovechables) || 0;
    const infecciosos = parseFloat(data.residuosInfecciosos) || 0;
    const biosanitarios = parseFloat(data.residuosBiosanitarios) || 0;

    const totalNoPeligrosos = aprovechables + noAprovechables;
    const totalPeligrosos = infecciosos + biosanitarios;
    const totalGenerado = totalNoPeligrosos + totalPeligrosos;

    return {
      totalNoPeligrosos,
      totalPeligrosos,
      totalGenerado,
    };
  }

  /**
   * Crear o actualizar registro diario
   */
  async upsert(data, usuarioId) {
    if (!usuarioId) {
      throw new ValidationError('Usuario no autenticado');
    }

    const { fecha, residuosAprovechables, residuosNoAprovechables, residuosInfecciosos, residuosBiosanitarios } = data;

    if (!fecha) {
      throw new ValidationError('La fecha es requerida');
    }

    const fechaObj = new Date(fecha);
    const mes = fechaObj.getMonth() + 1;
    const anio = fechaObj.getFullYear();
    const dia = fechaObj.getDate();

    // Validar que los valores sean >= 0
    if (residuosAprovechables < 0 || residuosNoAprovechables < 0 || residuosInfecciosos < 0 || residuosBiosanitarios < 0) {
      throw new ValidationError('Los valores de residuos no pueden ser negativos');
    }

    // Calcular totales
    const totales = this.calcularTotales(data);

    // Buscar si ya existe un registro para esta fecha
    const existente = await prisma.residuoRH1.findUnique({
      where: { fecha: fechaObj },
    });

    if (existente) {
      // Actualizar
      const updated = await prisma.residuoRH1.update({
        where: { fecha: fechaObj },
        data: {
          residuosAprovechables: parseFloat(residuosAprovechables) || 0,
          residuosNoAprovechables: parseFloat(residuosNoAprovechables) || 0,
          residuosInfecciosos: parseFloat(residuosInfecciosos) || 0,
          residuosBiosanitarios: parseFloat(residuosBiosanitarios) || 0,
          totalNoPeligrosos: totales.totalNoPeligrosos,
          totalPeligrosos: totales.totalPeligrosos,
          totalGenerado: totales.totalGenerado,
          modificadoPor: usuarioId,
        },
        include: {
          registrador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      });
      return updated;
    } else {
      // Crear
      const created = await prisma.residuoRH1.create({
        data: {
          fecha: fechaObj,
          mes,
          anio,
          dia,
          residuosAprovechables: parseFloat(residuosAprovechables) || 0,
          residuosNoAprovechables: parseFloat(residuosNoAprovechables) || 0,
          residuosInfecciosos: parseFloat(residuosInfecciosos) || 0,
          residuosBiosanitarios: parseFloat(residuosBiosanitarios) || 0,
          totalNoPeligrosos: totales.totalNoPeligrosos,
          totalPeligrosos: totales.totalPeligrosos,
          totalGenerado: totales.totalGenerado,
          registradoPor: usuarioId,
        },
        include: {
          registrador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      });
      return created;
    }
  }

  /**
   * Guardar múltiples registros (batch)
   */
  async upsertBatch(registros, usuarioId) {
    const results = [];

    for (const registro of registros) {
      const result = await this.upsert(registro, usuarioId);
      results.push(result);
    }

    return results;
  }

  /**
   * Obtener registros de un mes completo (31 días)
   */
  async findByMesAnio(mes, anio) {
    if (!mes || !anio) {
      throw new ValidationError('El mes y año son requeridos');
    }

    if (mes < 1 || mes > 12) {
      throw new ValidationError('El mes debe estar entre 1 y 12');
    }

    const registros = await prisma.residuoRH1.findMany({
      where: {
        mes: parseInt(mes),
        anio: parseInt(anio),
        activo: true,
      },
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        modificador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        dia: 'asc',
      },
    });

    // Crear array de 31 días (rellenar con 0 los días sin datos)
    const diasMes = [];
    for (let dia = 1; dia <= 31; dia++) {
      const registro = registros.find(r => r.dia === dia);
      if (registro) {
        diasMes.push(registro);
      } else {
        // Día sin registro, crear objeto vacío
        const fecha = new Date(anio, mes - 1, dia);
        diasMes.push({
          fecha: fecha.toISOString(),
          mes: parseInt(mes),
          anio: parseInt(anio),
          dia,
          residuosAprovechables: 0,
          residuosNoAprovechables: 0,
          residuosInfecciosos: 0,
          residuosBiosanitarios: 0,
          totalNoPeligrosos: 0,
          totalPeligrosos: 0,
          totalGenerado: 0,
          nuevo: true, // Marca para el frontend
        });
      }
    }

    return diasMes;
  }

  /**
   * Obtener totales del mes
   */
  async getTotalesMes(mes, anio) {
    if (!mes || !anio) {
      throw new ValidationError('El mes y año son requeridos');
    }

    const registros = await prisma.residuoRH1.findMany({
      where: {
        mes: parseInt(mes),
        anio: parseInt(anio),
        activo: true,
      },
    });

    const totales = registros.reduce((acc, r) => ({
      residuosAprovechables: acc.residuosAprovechables + r.residuosAprovechables,
      residuosNoAprovechables: acc.residuosNoAprovechables + r.residuosNoAprovechables,
      residuosInfecciosos: acc.residuosInfecciosos + r.residuosInfecciosos,
      residuosBiosanitarios: acc.residuosBiosanitarios + r.residuosBiosanitarios,
      totalNoPeligrosos: acc.totalNoPeligrosos + r.totalNoPeligrosos,
      totalPeligrosos: acc.totalPeligrosos + r.totalPeligrosos,
      totalGenerado: acc.totalGenerado + r.totalGenerado,
    }), {
      residuosAprovechables: 0,
      residuosNoAprovechables: 0,
      residuosInfecciosos: 0,
      residuosBiosanitarios: 0,
      totalNoPeligrosos: 0,
      totalPeligrosos: 0,
      totalGenerado: 0,
    });

    return {
      mes: parseInt(mes),
      anio: parseInt(anio),
      diasRegistrados: registros.length,
      totales,
    };
  }

  /**
   * Eliminar registro (soft delete)
   */
  async delete(id) {
    const registro = await prisma.residuoRH1.findUnique({
      where: { id },
    });

    if (!registro) {
      throw new NotFoundError('Registro no encontrado');
    }

    await prisma.residuoRH1.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Registro eliminado correctamente' };
  }

  /**
   * Obtener registro por fecha
   */
  async findByFecha(fecha) {
    const fechaObj = new Date(fecha);

    const registro = await prisma.residuoRH1.findUnique({
      where: { fecha: fechaObj },
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        modificador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return registro;
  }

  /**
   * Validar consistencia de totales
   */
  async validateConsistencia(mes, anio) {
    const registros = await prisma.residuoRH1.findMany({
      where: {
        mes: parseInt(mes),
        anio: parseInt(anio),
        activo: true,
      },
    });

    const errores = [];

    for (const registro of registros) {
      const totalesCalculados = this.calcularTotales(registro);

      if (Math.abs(registro.totalNoPeligrosos - totalesCalculados.totalNoPeligrosos) > 0.01) {
        errores.push({
          dia: registro.dia,
          campo: 'totalNoPeligrosos',
          esperado: totalesCalculados.totalNoPeligrosos,
          actual: registro.totalNoPeligrosos,
        });
      }

      if (Math.abs(registro.totalPeligrosos - totalesCalculados.totalPeligrosos) > 0.01) {
        errores.push({
          dia: registro.dia,
          campo: 'totalPeligrosos',
          esperado: totalesCalculados.totalPeligrosos,
          actual: registro.totalPeligrosos,
        });
      }

      if (Math.abs(registro.totalGenerado - totalesCalculados.totalGenerado) > 0.01) {
        errores.push({
          dia: registro.dia,
          campo: 'totalGenerado',
          esperado: totalesCalculados.totalGenerado,
          actual: registro.totalGenerado,
        });
      }
    }

    return {
      consistente: errores.length === 0,
      errores,
    };
  }

  /**
   * Obtener años con registros
   */
  async getAniosDisponibles() {
    const registros = await prisma.residuoRH1.findMany({
      where: { activo: true },
      select: { anio: true },
      distinct: ['anio'],
      orderBy: { anio: 'desc' },
    });

    return registros.map(r => r.anio);
  }

  /**
   * Obtener estadísticas generales
   */
  async getEstadisticas(anio) {
    const where = {
      activo: true,
    };

    if (anio) {
      where.anio = parseInt(anio);
    }

    const [
      totalRegistros,
      sumatorias,
    ] = await Promise.all([
      prisma.residuoRH1.count({ where }),
      prisma.residuoRH1.aggregate({
        where,
        _sum: {
          residuosAprovechables: true,
          residuosNoAprovechables: true,
          residuosInfecciosos: true,
          residuosBiosanitarios: true,
          totalNoPeligrosos: true,
          totalPeligrosos: true,
          totalGenerado: true,
        },
      }),
    ]);

    return {
      totalRegistros,
      sumatorias: sumatorias._sum,
    };
  }
}

module.exports = new ResiduoRH1Service();
