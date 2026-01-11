/**
 * Libro Mayor Service
 * Consulta de saldos y movimientos por cuenta contable
 */

const prisma = require('../../db/prisma');
const { NotFoundError } = require('../../utils/errors');

class LibroMayorService {
  /**
   * Obtener libro mayor por período
   */
  async getByPeriodo(anio, mes, filters = {}) {
    const where = { anio, mes };

    if (filters.cuentaTipo) where.cuentaTipo = filters.cuentaTipo;
    if (filters.centroCostoId) where.centroCostoId = filters.centroCostoId;

    if (filters.cuentaCodigo) {
      where.cuentaCodigo = { startsWith: filters.cuentaCodigo };
    }

    const registros = await prisma.libroMayor.findMany({
      where,
      orderBy: { cuentaCodigo: 'asc' }
    });

    // Calcular totales
    const totales = registros.reduce((acc, reg) => {
      acc.saldoInicial += parseFloat(reg.saldoInicial) || 0;
      acc.debitos += parseFloat(reg.debitos) || 0;
      acc.creditos += parseFloat(reg.creditos) || 0;
      acc.saldoFinal += parseFloat(reg.saldoFinal) || 0;
      return acc;
    }, { saldoInicial: 0, debitos: 0, creditos: 0, saldoFinal: 0 });

    return {
      periodo: { anio, mes },
      registros,
      totales
    };
  }

  /**
   * Obtener movimientos detallados de una cuenta
   */
  async getMovimientosCuenta(cuentaCodigo, anio, mes) {
    const cuenta = await prisma.cuentaContable.findUnique({
      where: { codigo: cuentaCodigo }
    });

    if (!cuenta) {
      throw new NotFoundError(`Cuenta ${cuentaCodigo} no encontrada`);
    }

    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);

    // Obtener saldo inicial (mes anterior)
    const saldoAnterior = await this.calcularSaldoHasta(cuentaCodigo, fechaInicio);

    // Obtener movimientos del período
    const movimientos = await prisma.asientoContableLinea.findMany({
      where: {
        cuentaCodigo,
        asiento: {
          fecha: { gte: fechaInicio, lte: fechaFin },
          estado: 'APROBADO'
        }
      },
      include: {
        asiento: {
          select: {
            numero: true,
            fecha: true,
            descripcion: true,
            tipo: true
          }
        },
        centroCosto: {
          select: { codigo: true, nombre: true }
        }
      },
      orderBy: [
        { asiento: { fecha: 'asc' } },
        { asiento: { numero: 'asc' } }
      ]
    });

    // Calcular saldo corrido
    let saldoCorrido = saldoAnterior;
    const movimientosConSaldo = movimientos.map(mov => {
      const debito = parseFloat(mov.debito) || 0;
      const credito = parseFloat(mov.credito) || 0;

      if (cuenta.naturaleza === 'Débito') {
        saldoCorrido += debito - credito;
      } else {
        saldoCorrido += credito - debito;
      }

      return {
        ...mov,
        saldoCorrido
      };
    });

    // Totales
    const totalDebitos = movimientos.reduce((sum, m) => sum + (parseFloat(m.debito) || 0), 0);
    const totalCreditos = movimientos.reduce((sum, m) => sum + (parseFloat(m.credito) || 0), 0);

    return {
      cuenta,
      periodo: { anio, mes },
      saldoInicial: saldoAnterior,
      movimientos: movimientosConSaldo,
      totales: {
        debitos: totalDebitos,
        creditos: totalCreditos
      },
      saldoFinal: saldoCorrido
    };
  }

  /**
   * Calcular saldo acumulado hasta una fecha
   */
  async calcularSaldoHasta(cuentaCodigo, fecha) {
    const cuenta = await prisma.cuentaContable.findUnique({
      where: { codigo: cuentaCodigo }
    });

    if (!cuenta) return 0;

    const movimientos = await prisma.asientoContableLinea.aggregate({
      where: {
        cuentaCodigo,
        asiento: {
          fecha: { lt: fecha },
          estado: 'APROBADO'
        }
      },
      _sum: {
        debito: true,
        credito: true
      }
    });

    const debitos = parseFloat(movimientos._sum.debito) || 0;
    const creditos = parseFloat(movimientos._sum.credito) || 0;

    if (cuenta.naturaleza === 'Débito') {
      return debitos - creditos;
    } else {
      return creditos - debitos;
    }
  }

  /**
   * Obtener balance de comprobación (auxiliar por cuenta)
   */
  async getAuxiliarTercero(cuentaCodigo, terceroTipo, terceroId, fechaInicio, fechaFin) {
    const movimientos = await prisma.asientoContableLinea.findMany({
      where: {
        cuentaCodigo,
        terceroTipo,
        terceroId,
        asiento: {
          fecha: { gte: new Date(fechaInicio), lte: new Date(fechaFin) },
          estado: 'APROBADO'
        }
      },
      include: {
        asiento: {
          select: {
            numero: true,
            fecha: true,
            descripcion: true
          }
        }
      },
      orderBy: { asiento: { fecha: 'asc' } }
    });

    const totales = movimientos.reduce((acc, mov) => {
      acc.debitos += parseFloat(mov.debito) || 0;
      acc.creditos += parseFloat(mov.credito) || 0;
      return acc;
    }, { debitos: 0, creditos: 0 });

    return {
      cuentaCodigo,
      terceroTipo,
      terceroId,
      periodo: { fechaInicio, fechaFin },
      movimientos,
      totales,
      saldo: totales.debitos - totales.creditos
    };
  }

  /**
   * Recalcular libro mayor para un período
   */
  async recalcularPeriodo(anio, mes) {
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);

    // Eliminar registros existentes
    await prisma.libroMayor.deleteMany({
      where: { anio, mes }
    });

    // Obtener todas las cuentas con movimientos
    const cuentasConMovimientos = await prisma.asientoContableLinea.findMany({
      where: {
        asiento: {
          fecha: { gte: fechaInicio, lte: fechaFin },
          estado: 'APROBADO'
        }
      },
      distinct: ['cuentaCodigo', 'centroCostoId'],
      select: {
        cuentaCodigo: true,
        centroCostoId: true
      }
    });

    let registrosCreados = 0;

    for (const item of cuentasConMovimientos) {
      const cuenta = await prisma.cuentaContable.findUnique({
        where: { codigo: item.cuentaCodigo }
      });

      if (!cuenta) continue;

      // Calcular saldo inicial
      const saldoInicial = await this.calcularSaldoHasta(item.cuentaCodigo, fechaInicio);

      // Calcular movimientos del período
      const movimientos = await prisma.asientoContableLinea.aggregate({
        where: {
          cuentaCodigo: item.cuentaCodigo,
          centroCostoId: item.centroCostoId,
          asiento: {
            fecha: { gte: fechaInicio, lte: fechaFin },
            estado: 'APROBADO'
          }
        },
        _sum: {
          debito: true,
          credito: true
        },
        _count: true
      });

      const debitos = parseFloat(movimientos._sum.debito) || 0;
      const creditos = parseFloat(movimientos._sum.credito) || 0;

      let saldoFinal;
      if (cuenta.naturaleza === 'Débito') {
        saldoFinal = saldoInicial + debitos - creditos;
      } else {
        saldoFinal = saldoInicial + creditos - debitos;
      }

      await prisma.libroMayor.create({
        data: {
          anio,
          mes,
          cuentaCodigo: item.cuentaCodigo,
          cuentaNombre: cuenta.nombre,
          cuentaTipo: cuenta.tipo,
          cuentaNaturaleza: cuenta.naturaleza,
          centroCostoId: item.centroCostoId,
          saldoInicial,
          debitos,
          creditos,
          saldoFinal,
          numMovimientos: movimientos._count
        }
      });

      registrosCreados++;
    }

    return { registrosCreados };
  }

  /**
   * Obtener balance general resumido
   */
  async getBalanceResumido(anio, mes) {
    const registros = await prisma.libroMayor.findMany({
      where: { anio, mes },
      select: {
        cuentaTipo: true,
        saldoFinal: true
      }
    });

    const balance = {
      activos: 0,
      pasivos: 0,
      patrimonio: 0,
      ingresos: 0,
      gastos: 0
    };

    for (const reg of registros) {
      const saldo = parseFloat(reg.saldoFinal) || 0;
      switch (reg.cuentaTipo) {
        case 'Activo':
          balance.activos += saldo;
          break;
        case 'Pasivo':
          balance.pasivos += saldo;
          break;
        case 'Patrimonio':
          balance.patrimonio += saldo;
          break;
        case 'Ingreso':
          balance.ingresos += saldo;
          break;
        case 'Gasto':
          balance.gastos += saldo;
          break;
      }
    }

    balance.utilidadPerdida = balance.ingresos - balance.gastos;
    balance.totalPasivoPatrimonio = balance.pasivos + balance.patrimonio + balance.utilidadPerdida;

    return {
      periodo: { anio, mes },
      balance
    };
  }

  /**
   * Comparativo mensual
   */
  async getComparativoMensual(cuentaCodigo, anio) {
    const meses = [];

    for (let mes = 1; mes <= 12; mes++) {
      const registro = await prisma.libroMayor.findFirst({
        where: {
          cuentaCodigo,
          anio,
          mes
        }
      });

      meses.push({
        mes,
        saldoInicial: parseFloat(registro?.saldoInicial) || 0,
        debitos: parseFloat(registro?.debitos) || 0,
        creditos: parseFloat(registro?.creditos) || 0,
        saldoFinal: parseFloat(registro?.saldoFinal) || 0
      });
    }

    return {
      cuentaCodigo,
      anio,
      meses
    };
  }
}

module.exports = new LibroMayorService();
