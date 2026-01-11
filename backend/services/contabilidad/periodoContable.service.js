/**
 * Período Contable Service
 * Gestión de períodos y cierre contable
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const libroMayorService = require('./libroMayor.service');

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

class PeriodoContableService {
  /**
   * Obtener todos los períodos
   */
  async getAll(anio = null) {
    const where = anio ? { anio: parseInt(anio) } : {};

    return prisma.periodoContable.findMany({
      where,
      include: {
        _count: {
          select: {
            asientos: true,
            cierres: true
          }
        }
      },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }]
    });
  }

  /**
   * Obtener período por ID
   */
  async getById(id) {
    const periodo = await prisma.periodoContable.findUnique({
      where: { id },
      include: {
        asientos: {
          select: { id: true, numero: true, estado: true, fecha: true }
        },
        cierres: true
      }
    });

    if (!periodo) {
      throw new NotFoundError('Período contable no encontrado');
    }

    return periodo;
  }

  /**
   * Obtener período por año y mes
   */
  async getByAnioMes(anio, mes) {
    return prisma.periodoContable.findUnique({
      where: { anio_mes: { anio: parseInt(anio), mes: parseInt(mes) } },
      include: {
        _count: {
          select: { asientos: true, cierres: true }
        }
      }
    });
  }

  /**
   * Crear período contable
   */
  async create(data) {
    const anio = parseInt(data.anio);
    const mes = parseInt(data.mes);

    // Verificar que no exista
    const existe = await prisma.periodoContable.findUnique({
      where: { anio_mes: { anio, mes } }
    });

    if (existe) {
      throw new ValidationError(`El período ${MESES[mes - 1]} ${anio} ya existe`);
    }

    // Verificar que el período anterior exista y esté cerrado (excepto el primero)
    if (mes > 1 || anio > 2020) {
      const mesAnterior = mes === 1 ? 12 : mes - 1;
      const anioAnterior = mes === 1 ? anio - 1 : anio;

      const anterior = await prisma.periodoContable.findUnique({
        where: { anio_mes: { anio: anioAnterior, mes: mesAnterior } }
      });

      // Solo advertir, no bloquear
      if (anterior && anterior.estado === 'ABIERTO') {
        console.warn(`El período anterior ${MESES[mesAnterior - 1]} ${anioAnterior} aún está abierto`);
      }
    }

    const periodo = await prisma.periodoContable.create({
      data: {
        anio,
        mes,
        nombre: `${MESES[mes - 1]} ${anio}`,
        fechaInicio: new Date(anio, mes - 1, 1),
        fechaFin: new Date(anio, mes, 0),
        estado: 'ABIERTO'
      }
    });

    return periodo;
  }

  /**
   * Crear períodos del año
   */
  async crearPeriodosAnio(anio) {
    const creados = [];

    for (let mes = 1; mes <= 12; mes++) {
      try {
        const periodo = await this.create({ anio, mes });
        creados.push(periodo);
      } catch (error) {
        // Si ya existe, continuar
        if (!error.message.includes('ya existe')) {
          throw error;
        }
      }
    }

    return { creados: creados.length };
  }

  /**
   * Cerrar período contable
   */
  async cerrarPeriodo(id, usuarioId) {
    const periodo = await this.getById(id);

    if (periodo.estado !== 'ABIERTO') {
      throw new ValidationError(`El período ${periodo.nombre} no está abierto`);
    }

    // Verificar que no haya asientos en borrador
    const asientosBorrador = await prisma.asientoContable.count({
      where: {
        periodoId: id,
        estado: 'BORRADOR'
      }
    });

    if (asientosBorrador > 0) {
      throw new ValidationError(`Hay ${asientosBorrador} asientos en borrador. Debe aprobarlos o anularlos antes de cerrar.`);
    }

    // Recalcular libro mayor
    await libroMayorService.recalcularPeriodo(periodo.anio, periodo.mes);

    // Obtener saldos para el cierre
    const saldos = await this.obtenerSaldosCierre(periodo.anio, periodo.mes);

    // Crear registro de cierre
    const cierre = await prisma.$transaction(async (tx) => {
      // Actualizar período
      await tx.periodoContable.update({
        where: { id },
        data: {
          estado: 'CERRADO',
          fechaCierre: new Date(),
          cerradoPor: usuarioId
        }
      });

      // Crear cierre contable
      const cierreContable = await tx.cierreContable.create({
        data: {
          periodoId: id,
          tipo: 'MENSUAL',
          fechaCierre: new Date(),
          totalActivos: saldos.activos,
          totalPasivos: saldos.pasivos,
          totalPatrimonio: saldos.patrimonio,
          totalIngresos: saldos.ingresos,
          totalGastos: saldos.gastos,
          utilidadPerdida: saldos.ingresos - saldos.gastos,
          ejecutadoPor: usuarioId
        }
      });

      return cierreContable;
    });

    return { periodo, cierre };
  }

  /**
   * Reabrir período contable
   */
  async reabrirPeriodo(id, usuarioId, motivo) {
    const periodo = await this.getById(id);

    if (periodo.estado !== 'CERRADO') {
      throw new ValidationError(`El período ${periodo.nombre} no está cerrado`);
    }

    // Verificar que no haya períodos posteriores cerrados
    const posterioresCerrados = await prisma.periodoContable.count({
      where: {
        estado: 'CERRADO',
        OR: [
          { anio: { gt: periodo.anio } },
          { anio: periodo.anio, mes: { gt: periodo.mes } }
        ]
      }
    });

    if (posterioresCerrados > 0) {
      throw new ValidationError('No se puede reabrir un período cuando hay períodos posteriores cerrados');
    }

    await prisma.$transaction(async (tx) => {
      // Reabrir período
      await tx.periodoContable.update({
        where: { id },
        data: {
          estado: 'ABIERTO',
          fechaCierre: null,
          cerradoPor: null
        }
      });

      // Marcar cierre como reversado
      await tx.cierreContable.updateMany({
        where: { periodoId: id },
        data: {
          estado: 'REVERSADO',
          reversadoPor: usuarioId,
          fechaReversion: new Date(),
          observaciones: motivo
        }
      });
    });

    return this.getById(id);
  }

  /**
   * Realizar cierre anual
   */
  async cierreAnual(anio, usuarioId) {
    // Verificar que todos los períodos del año estén cerrados
    const periodosAbiertos = await prisma.periodoContable.findMany({
      where: {
        anio: parseInt(anio),
        estado: { not: 'CERRADO' }
      }
    });

    if (periodosAbiertos.length > 0) {
      throw new ValidationError(
        `Hay ${periodosAbiertos.length} períodos abiertos. Debe cerrarlos antes del cierre anual.`
      );
    }

    const periodoDiciembre = await prisma.periodoContable.findUnique({
      where: { anio_mes: { anio: parseInt(anio), mes: 12 } }
    });

    if (!periodoDiciembre) {
      throw new ValidationError(`No existe el período Diciembre ${anio}`);
    }

    // Obtener saldos finales del año
    const saldos = await this.obtenerSaldosCierre(parseInt(anio), 12);

    // Crear asiento de cierre de cuentas de resultados
    const asientoCierre = await this.crearAsientoCierreAnual(anio, saldos, usuarioId);

    // Crear registro de cierre anual
    const cierre = await prisma.cierreContable.create({
      data: {
        periodoId: periodoDiciembre.id,
        tipo: 'ANUAL',
        fechaCierre: new Date(),
        totalActivos: saldos.activos,
        totalPasivos: saldos.pasivos,
        totalPatrimonio: saldos.patrimonio,
        totalIngresos: saldos.ingresos,
        totalGastos: saldos.gastos,
        utilidadPerdida: saldos.ingresos - saldos.gastos,
        asientoCierreId: asientoCierre.id,
        ejecutadoPor: usuarioId,
        observaciones: `Cierre anual ${anio}`
      }
    });

    return { cierre, asientoCierre };
  }

  /**
   * Crear asiento de cierre anual
   */
  async crearAsientoCierreAnual(anio, saldos, usuarioId) {
    const asientoService = require('./asientoContable.service');

    const utilidadPerdida = saldos.ingresos - saldos.gastos;
    const esUtilidad = utilidadPerdida >= 0;

    // Obtener cuentas de ingresos y gastos con saldo
    const cuentasIngresosGastos = await prisma.libroMayor.findMany({
      where: {
        anio: parseInt(anio),
        mes: 12,
        cuentaTipo: { in: ['Ingreso', 'Gasto'] },
        saldoFinal: { not: 0 }
      }
    });

    const lineas = [];

    // Cerrar cuentas de ingresos (debitar)
    for (const cuenta of cuentasIngresosGastos.filter(c => c.cuentaTipo === 'Ingreso')) {
      const saldo = Math.abs(parseFloat(cuenta.saldoFinal));
      if (saldo > 0) {
        lineas.push({
          cuentaCodigo: cuenta.cuentaCodigo,
          cuentaNombre: cuenta.cuentaNombre,
          debito: saldo,
          credito: 0,
          descripcion: `Cierre cuenta ${cuenta.cuentaCodigo}`
        });
      }
    }

    // Cerrar cuentas de gastos (acreditar)
    for (const cuenta of cuentasIngresosGastos.filter(c => c.cuentaTipo === 'Gasto')) {
      const saldo = Math.abs(parseFloat(cuenta.saldoFinal));
      if (saldo > 0) {
        lineas.push({
          cuentaCodigo: cuenta.cuentaCodigo,
          cuentaNombre: cuenta.cuentaNombre,
          debito: 0,
          credito: saldo,
          descripcion: `Cierre cuenta ${cuenta.cuentaCodigo}`
        });
      }
    }

    // Cuenta de utilidad o pérdida del ejercicio
    if (esUtilidad) {
      lineas.push({
        cuentaCodigo: '3605',
        cuentaNombre: 'Utilidad del ejercicio',
        debito: 0,
        credito: Math.abs(utilidadPerdida),
        descripcion: `Utilidad ejercicio ${anio}`
      });
    } else {
      lineas.push({
        cuentaCodigo: '3610',
        cuentaNombre: 'Pérdida del ejercicio',
        debito: Math.abs(utilidadPerdida),
        credito: 0,
        descripcion: `Pérdida ejercicio ${anio}`
      });
    }

    const asiento = await asientoService.create({
      fecha: new Date(anio, 11, 31),
      tipo: 'CIERRE',
      descripcion: `Cierre de cuentas de resultados año ${anio}`,
      lineas
    }, usuarioId);

    // Aprobar automáticamente
    await asientoService.aprobar(asiento.id, usuarioId);

    return asiento;
  }

  /**
   * Obtener saldos para cierre
   */
  async obtenerSaldosCierre(anio, mes) {
    const saldos = await prisma.libroMayor.groupBy({
      by: ['cuentaTipo'],
      where: { anio, mes },
      _sum: { saldoFinal: true }
    });

    const resultado = {
      activos: 0,
      pasivos: 0,
      patrimonio: 0,
      ingresos: 0,
      gastos: 0
    };

    for (const s of saldos) {
      const valor = Math.abs(parseFloat(s._sum.saldoFinal) || 0);
      switch (s.cuentaTipo) {
        case 'Activo': resultado.activos = valor; break;
        case 'Pasivo': resultado.pasivos = valor; break;
        case 'Patrimonio': resultado.patrimonio = valor; break;
        case 'Ingreso': resultado.ingresos = valor; break;
        case 'Gasto': resultado.gastos = valor; break;
      }
    }

    return resultado;
  }

  /**
   * Obtener período actual
   */
  async getPeriodoActual() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth() + 1;

    let periodo = await this.getByAnioMes(anio, mes);

    if (!periodo) {
      periodo = await this.create({ anio, mes });
    }

    return periodo;
  }

  /**
   * Obtener estadísticas de períodos
   */
  async getStats() {
    const periodosAbiertos = await prisma.periodoContable.count({
      where: { estado: 'ABIERTO' }
    });

    const periodosCerrados = await prisma.periodoContable.count({
      where: { estado: 'CERRADO' }
    });

    const ultimoCierre = await prisma.periodoContable.findFirst({
      where: { estado: 'CERRADO' },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }]
    });

    return {
      periodosAbiertos,
      periodosCerrados,
      ultimoCierre: ultimoCierre ? ultimoCierre.nombre : null
    };
  }
}

module.exports = new PeriodoContableService();
