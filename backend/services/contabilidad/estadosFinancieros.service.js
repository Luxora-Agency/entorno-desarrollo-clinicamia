/**
 * Estados Financieros Service
 * Generación de Balance General, Estado de Resultados y otros reportes
 * Con sincronización Siigo para Balance de Prueba
 */

const prisma = require('../../db/prisma');
const libroMayorService = require('./libroMayor.service');

class EstadosFinancierosService {
  /**
   * Obtener Balance General
   */
  async getBalanceGeneral(fechaCorte, comparativo = false) {
    const fecha = new Date(fechaCorte);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;

    // Obtener saldos del libro mayor
    const saldos = await prisma.libroMayor.findMany({
      where: {
        anio,
        mes,
        cuentaTipo: { in: ['Activo', 'Pasivo', 'Patrimonio'] }
      },
      orderBy: { cuentaCodigo: 'asc' }
    });

    // Estructurar balance
    const balance = {
      fechaCorte,
      activos: {
        corrientes: { cuentas: [], total: 0 },
        noCorrientes: { cuentas: [], total: 0 },
        total: 0
      },
      pasivos: {
        corrientes: { cuentas: [], total: 0 },
        noCorrientes: { cuentas: [], total: 0 },
        total: 0
      },
      patrimonio: {
        cuentas: [],
        resultadoEjercicio: 0,
        total: 0
      }
    };

    // Clasificar cuentas
    for (const saldo of saldos) {
      const valor = parseFloat(saldo.saldoFinal) || 0;
      const item = {
        codigo: saldo.cuentaCodigo,
        nombre: saldo.cuentaNombre,
        saldo: valor
      };

      switch (saldo.cuentaTipo) {
        case 'Activo':
          if (saldo.cuentaCodigo.startsWith('11') || saldo.cuentaCodigo.startsWith('12') ||
              saldo.cuentaCodigo.startsWith('13') || saldo.cuentaCodigo.startsWith('14')) {
            balance.activos.corrientes.cuentas.push(item);
            balance.activos.corrientes.total += valor;
          } else {
            balance.activos.noCorrientes.cuentas.push(item);
            balance.activos.noCorrientes.total += valor;
          }
          balance.activos.total += valor;
          break;

        case 'Pasivo':
          if (saldo.cuentaCodigo.startsWith('21') || saldo.cuentaCodigo.startsWith('22') ||
              saldo.cuentaCodigo.startsWith('23') || saldo.cuentaCodigo.startsWith('24') ||
              saldo.cuentaCodigo.startsWith('25')) {
            balance.pasivos.corrientes.cuentas.push(item);
            balance.pasivos.corrientes.total += valor;
          } else {
            balance.pasivos.noCorrientes.cuentas.push(item);
            balance.pasivos.noCorrientes.total += valor;
          }
          balance.pasivos.total += valor;
          break;

        case 'Patrimonio':
          balance.patrimonio.cuentas.push(item);
          balance.patrimonio.total += valor;
          break;
      }
    }

    // Calcular resultado del ejercicio
    const resultado = await this.calcularResultadoEjercicio(anio, mes);
    balance.patrimonio.resultadoEjercicio = resultado.utilidadNeta;
    balance.patrimonio.total += resultado.utilidadNeta;

    // Verificar ecuación contable
    balance.verificacion = {
      activos: balance.activos.total,
      pasivoMasPatrimonio: balance.pasivos.total + balance.patrimonio.total,
      diferencia: balance.activos.total - (balance.pasivos.total + balance.patrimonio.total)
    };

    // Comparativo con período anterior si se solicita
    if (comparativo) {
      const mesAnterior = mes === 1 ? 12 : mes - 1;
      const anioAnterior = mes === 1 ? anio - 1 : anio;
      balance.comparativo = await this.getBalanceGeneral(
        new Date(anioAnterior, mesAnterior - 1, 28).toISOString(),
        false
      );
    }

    return balance;
  }

  /**
   * Obtener Estado de Resultados (P&L)
   */
  async getEstadoResultados(fechaInicio, fechaFin, comparativo = false) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const anio = fin.getFullYear();
    const mes = fin.getMonth() + 1;

    // Obtener saldos de ingresos y gastos
    const saldos = await prisma.libroMayor.findMany({
      where: {
        anio,
        mes,
        cuentaTipo: { in: ['Ingreso', 'Gasto'] }
      },
      orderBy: { cuentaCodigo: 'asc' }
    });

    const estado = {
      periodo: { fechaInicio, fechaFin },
      ingresos: {
        operacionales: { cuentas: [], total: 0 },
        noOperacionales: { cuentas: [], total: 0 },
        total: 0
      },
      costos: {
        cuentas: [],
        total: 0
      },
      gastos: {
        operacionales: { cuentas: [], total: 0 },
        noOperacionales: { cuentas: [], total: 0 },
        total: 0
      },
      utilidadBruta: 0,
      utilidadOperacional: 0,
      utilidadAntesImpuestos: 0,
      impuestoRenta: 0,
      utilidadNeta: 0
    };

    // Clasificar cuentas
    for (const saldo of saldos) {
      const valor = Math.abs(parseFloat(saldo.saldoFinal) || 0);
      const item = {
        codigo: saldo.cuentaCodigo,
        nombre: saldo.cuentaNombre,
        valor
      };

      if (saldo.cuentaTipo === 'Ingreso') {
        if (saldo.cuentaCodigo.startsWith('41')) {
          estado.ingresos.operacionales.cuentas.push(item);
          estado.ingresos.operacionales.total += valor;
        } else {
          estado.ingresos.noOperacionales.cuentas.push(item);
          estado.ingresos.noOperacionales.total += valor;
        }
        estado.ingresos.total += valor;
      } else if (saldo.cuentaTipo === 'Gasto') {
        if (saldo.cuentaCodigo.startsWith('6')) {
          estado.costos.cuentas.push(item);
          estado.costos.total += valor;
        } else if (saldo.cuentaCodigo.startsWith('51') || saldo.cuentaCodigo.startsWith('52')) {
          estado.gastos.operacionales.cuentas.push(item);
          estado.gastos.operacionales.total += valor;
        } else {
          estado.gastos.noOperacionales.cuentas.push(item);
          estado.gastos.noOperacionales.total += valor;
        }
        estado.gastos.total += valor;
      }
    }

    // Calcular utilidades
    estado.utilidadBruta = estado.ingresos.operacionales.total - estado.costos.total;
    estado.utilidadOperacional = estado.utilidadBruta - estado.gastos.operacionales.total;
    estado.utilidadAntesImpuestos = estado.utilidadOperacional +
      estado.ingresos.noOperacionales.total - estado.gastos.noOperacionales.total;

    // Estimar impuesto de renta (35% para Colombia)
    if (estado.utilidadAntesImpuestos > 0) {
      estado.impuestoRenta = estado.utilidadAntesImpuestos * 0.35;
    }

    estado.utilidadNeta = estado.utilidadAntesImpuestos - estado.impuestoRenta;

    // Márgenes
    if (estado.ingresos.total > 0) {
      estado.margenes = {
        bruto: (estado.utilidadBruta / estado.ingresos.operacionales.total * 100).toFixed(2),
        operacional: (estado.utilidadOperacional / estado.ingresos.operacionales.total * 100).toFixed(2),
        neto: (estado.utilidadNeta / estado.ingresos.total * 100).toFixed(2)
      };
    }

    return estado;
  }

  /**
   * Calcular resultado del ejercicio
   */
  async calcularResultadoEjercicio(anio, mes) {
    const saldos = await prisma.libroMayor.findMany({
      where: {
        anio,
        mes,
        cuentaTipo: { in: ['Ingreso', 'Gasto'] }
      }
    });

    let totalIngresos = 0;
    let totalGastos = 0;

    for (const saldo of saldos) {
      const valor = Math.abs(parseFloat(saldo.saldoFinal) || 0);
      if (saldo.cuentaTipo === 'Ingreso') {
        totalIngresos += valor;
      } else {
        totalGastos += valor;
      }
    }

    return {
      ingresos: totalIngresos,
      gastos: totalGastos,
      utilidadNeta: totalIngresos - totalGastos
    };
  }

  /**
   * Obtener Balance de Comprobación
   */
  async getBalanceComprobacion(anio, mes, nivelDetalle = 4) {
    const saldos = await prisma.libroMayor.findMany({
      where: { anio, mes },
      orderBy: { cuentaCodigo: 'asc' }
    });

    // Filtrar por nivel de detalle
    const filtrados = saldos.filter(s => {
      return s.cuentaCodigo.length <= nivelDetalle * 2;
    });

    // Agrupar si hay múltiples registros de la misma cuenta (por centro de costo)
    const agrupados = {};
    for (const saldo of filtrados) {
      if (!agrupados[saldo.cuentaCodigo]) {
        agrupados[saldo.cuentaCodigo] = {
          codigo: saldo.cuentaCodigo,
          nombre: saldo.cuentaNombre,
          tipo: saldo.cuentaTipo,
          naturaleza: saldo.cuentaNaturaleza,
          saldoInicial: 0,
          debitos: 0,
          creditos: 0,
          saldoFinal: 0
        };
      }
      agrupados[saldo.cuentaCodigo].saldoInicial += parseFloat(saldo.saldoInicial) || 0;
      agrupados[saldo.cuentaCodigo].debitos += parseFloat(saldo.debitos) || 0;
      agrupados[saldo.cuentaCodigo].creditos += parseFloat(saldo.creditos) || 0;
      agrupados[saldo.cuentaCodigo].saldoFinal += parseFloat(saldo.saldoFinal) || 0;
    }

    const cuentas = Object.values(agrupados);

    // Totales
    const totales = cuentas.reduce((acc, c) => {
      acc.saldoInicialDebito += c.naturaleza === 'Débito' ? Math.max(c.saldoInicial, 0) : 0;
      acc.saldoInicialCredito += c.naturaleza === 'Crédito' ? Math.max(c.saldoInicial, 0) : 0;
      acc.debitos += c.debitos;
      acc.creditos += c.creditos;
      acc.saldoFinalDebito += c.naturaleza === 'Débito' ? Math.max(c.saldoFinal, 0) : 0;
      acc.saldoFinalCredito += c.naturaleza === 'Crédito' ? Math.max(c.saldoFinal, 0) : 0;
      return acc;
    }, {
      saldoInicialDebito: 0,
      saldoInicialCredito: 0,
      debitos: 0,
      creditos: 0,
      saldoFinalDebito: 0,
      saldoFinalCredito: 0
    });

    return {
      periodo: { anio, mes },
      nivelDetalle,
      cuentas,
      totales
    };
  }

  /**
   * Obtener Balance de Prueba desde Siigo
   */
  async getBalancePruebaSiigo(siigoService, fechaInicio, fechaFin) {
    try {
      const testBalanceApi = siigoService.getTestBalanceApi();

      const result = await testBalanceApi.createTestBalance({
        createTestBalanceCommand: {
          startDate: fechaInicio,
          endDate: fechaFin
        }
      });

      return {
        fuente: 'Siigo',
        periodo: { fechaInicio, fechaFin },
        data: result
      };
    } catch (error) {
      console.error('Error obteniendo balance de prueba de Siigo:', error);
      throw error;
    }
  }

  /**
   * Obtener Flujo de Efectivo (método indirecto)
   */
  async getFlujoEfectivo(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // Obtener movimientos de cuentas de efectivo
    const cuentasEfectivo = ['1105', '1110']; // Caja y bancos

    const movimientosEfectivo = await prisma.asientoContableLinea.aggregate({
      where: {
        cuentaCodigo: { in: cuentasEfectivo.map(c => ({ startsWith: c })) },
        asiento: {
          fecha: { gte: inicio, lte: fin },
          estado: 'APROBADO'
        }
      },
      _sum: {
        debito: true,
        credito: true
      }
    });

    // Obtener estado de resultados para método indirecto
    const estado = await this.getEstadoResultados(fechaInicio, fechaFin);

    // Simplificación del flujo de efectivo
    const flujo = {
      periodo: { fechaInicio, fechaFin },
      actividadesOperacion: {
        utilidadNeta: estado.utilidadNeta,
        ajustes: {
          depreciacion: await this.obtenerDepreciacionPeriodo(inicio, fin),
          // Agregar más ajustes según necesidad
        },
        cambiosCapitalTrabajo: {
          // Simplificado
        },
        totalOperacion: 0
      },
      actividadesInversion: {
        adquisicionActivos: 0,
        ventaActivos: 0,
        totalInversion: 0
      },
      actividadesFinanciamiento: {
        prestamos: 0,
        pagoPrestamos: 0,
        aportes: 0,
        dividendos: 0,
        totalFinanciamiento: 0
      },
      efectivoInicio: 0,
      efectivoFinal: 0,
      variacionEfectivo: 0
    };

    return flujo;
  }

  /**
   * Obtener depreciación del período
   */
  async obtenerDepreciacionPeriodo(fechaInicio, fechaFin) {
    const depreciacion = await prisma.asientoContableLinea.aggregate({
      where: {
        cuentaCodigo: { startsWith: '5160' }, // Gastos de depreciación
        asiento: {
          fecha: { gte: fechaInicio, lte: fechaFin },
          estado: 'APROBADO'
        }
      },
      _sum: { debito: true }
    });

    return parseFloat(depreciacion._sum.debito) || 0;
  }

  /**
   * Indicadores financieros
   */
  async getIndicadoresFinancieros(fechaCorte) {
    const balance = await this.getBalanceGeneral(fechaCorte);
    const anio = new Date(fechaCorte).getFullYear();
    const mes = new Date(fechaCorte).getMonth() + 1;
    const fechaInicio = new Date(anio, 0, 1).toISOString();
    const estado = await this.getEstadoResultados(fechaInicio, fechaCorte);

    const indicadores = {
      liquidez: {
        razonCorriente: balance.activos.corrientes.total / (balance.pasivos.corrientes.total || 1),
        pruebaCida: (balance.activos.corrientes.total - this.obtenerInventarios(balance)) /
                    (balance.pasivos.corrientes.total || 1),
        capitalTrabajo: balance.activos.corrientes.total - balance.pasivos.corrientes.total
      },
      endeudamiento: {
        nivelEndeudamiento: (balance.pasivos.total / balance.activos.total * 100).toFixed(2),
        concentracionCortoPlazo: (balance.pasivos.corrientes.total / (balance.pasivos.total || 1) * 100).toFixed(2),
        coberturadeIntereses: 0 // Requiere datos adicionales
      },
      rentabilidad: {
        margenBruto: parseFloat(estado.margenes?.bruto) || 0,
        margenOperacional: parseFloat(estado.margenes?.operacional) || 0,
        margenNeto: parseFloat(estado.margenes?.neto) || 0,
        roa: (estado.utilidadNeta / balance.activos.total * 100).toFixed(2),
        roe: (estado.utilidadNeta / (balance.patrimonio.total || 1) * 100).toFixed(2)
      },
      actividad: {
        rotacionActivos: (estado.ingresos.total / balance.activos.total).toFixed(2),
        // Más indicadores de actividad
      }
    };

    return {
      fechaCorte,
      indicadores
    };
  }

  obtenerInventarios(balance) {
    const inventarios = balance.activos.corrientes.cuentas
      .filter(c => c.codigo.startsWith('14'))
      .reduce((sum, c) => sum + c.saldo, 0);
    return inventarios;
  }

  /**
   * Exportar estados financieros
   */
  async exportarEstados(tipo, fechaCorte, formato = 'json') {
    let data;

    switch (tipo) {
      case 'balance':
        data = await this.getBalanceGeneral(fechaCorte, true);
        break;
      case 'resultados':
        const anio = new Date(fechaCorte).getFullYear();
        const fechaInicio = new Date(anio, 0, 1).toISOString();
        data = await this.getEstadoResultados(fechaInicio, fechaCorte);
        break;
      case 'comprobacion':
        const fecha = new Date(fechaCorte);
        data = await this.getBalanceComprobacion(fecha.getFullYear(), fecha.getMonth() + 1);
        break;
      default:
        throw new Error(`Tipo de estado no válido: ${tipo}`);
    }

    return data;
  }
}

module.exports = new EstadosFinancierosService();
