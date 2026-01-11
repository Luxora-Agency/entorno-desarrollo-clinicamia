/**
 * Servicio de Conciliación Bancaria
 *
 * Gestiona las cuentas bancarias, movimientos y
 * el proceso de conciliación mensual.
 */

const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class ConciliacionService {
  // =====================================================
  // CUENTAS BANCARIAS
  // =====================================================

  /**
   * Obtiene todas las cuentas bancarias
   */
  async getCuentasBancarias(options = {}) {
    const { activa } = options;

    const where = {};
    if (activa !== undefined) {
      where.activa = activa === 'true' || activa === true;
    }

    return prisma.cuentaBancaria.findMany({
      where,
      include: {
        _count: {
          select: {
            movimientos: true,
            conciliaciones: true
          }
        }
      },
      orderBy: { banco: 'asc' }
    });
  }

  /**
   * Obtiene una cuenta bancaria por ID
   */
  async getCuentaBancariaById(id) {
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id },
      include: {
        movimientos: {
          take: 20,
          orderBy: { fecha: 'desc' }
        },
        conciliaciones: {
          take: 6,
          orderBy: { fechaCorte: 'desc' }
        }
      }
    });

    if (!cuenta) {
      throw new NotFoundError('Cuenta bancaria no encontrada');
    }

    return cuenta;
  }

  /**
   * Crea una nueva cuenta bancaria
   */
  async createCuentaBancaria(data) {
    // Verificar que no exista cuenta con el mismo número
    const existente = await prisma.cuentaBancaria.findUnique({
      where: { numeroCuenta: data.numeroCuenta }
    });

    if (existente) {
      throw new ValidationError('Ya existe una cuenta con ese número');
    }

    return prisma.cuentaBancaria.create({
      data: {
        banco: data.banco,
        tipoCuenta: data.tipoCuenta,
        numeroCuenta: data.numeroCuenta,
        nombreCuenta: data.nombreCuenta,
        cuentaContable: data.cuentaContable,
        saldoActual: data.saldoInicial || 0,
        saldoConciliado: data.saldoInicial || 0,
        activa: true
      }
    });
  }

  /**
   * Actualiza una cuenta bancaria
   */
  async updateCuentaBancaria(id, data) {
    const cuenta = await prisma.cuentaBancaria.findUnique({ where: { id } });

    if (!cuenta) {
      throw new NotFoundError('Cuenta bancaria no encontrada');
    }

    return prisma.cuentaBancaria.update({
      where: { id },
      data: {
        banco: data.banco,
        nombreCuenta: data.nombreCuenta,
        cuentaContable: data.cuentaContable,
        activa: data.activa
      }
    });
  }

  // =====================================================
  // MOVIMIENTOS BANCARIOS
  // =====================================================

  /**
   * Obtiene movimientos de una cuenta
   */
  async getMovimientos(cuentaId, options = {}) {
    const { fechaInicio, fechaFin, conciliado, limit = 100, offset = 0 } = options;

    const where = { cuentaBancariaId: cuentaId };

    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      };
    }

    if (conciliado !== undefined) {
      where.conciliado = conciliado === 'true' || conciliado === true;
    }

    const [movimientos, total] = await Promise.all([
      prisma.movimientoBancario.findMany({
        where,
        orderBy: { fecha: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.movimientoBancario.count({ where })
    ]);

    return { movimientos, total };
  }

  /**
   * Registra un movimiento bancario
   */
  async createMovimiento(data) {
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: data.cuentaBancariaId }
    });

    if (!cuenta) {
      throw new NotFoundError('Cuenta bancaria no encontrada');
    }

    return prisma.$transaction(async (tx) => {
      // Crear movimiento
      const movimiento = await tx.movimientoBancario.create({
        data: {
          cuentaBancariaId: data.cuentaBancariaId,
          fecha: new Date(data.fecha),
          tipo: data.tipo, // Débito | Crédito
          descripcion: data.descripcion,
          referencia: data.referencia,
          monto: data.monto,
          pagoId: data.pagoId,
          pagoProveedorId: data.pagoProveedorId,
          otroConcepto: data.otroConcepto,
          creadoPor: data.creadoPor
        }
      });

      // Actualizar saldo de la cuenta
      const ajuste = data.tipo === 'Crédito'
        ? parseFloat(data.monto)
        : -parseFloat(data.monto);

      await tx.cuentaBancaria.update({
        where: { id: data.cuentaBancariaId },
        data: {
          saldoActual: {
            increment: ajuste
          }
        }
      });

      return movimiento;
    });
  }

  /**
   * Importa movimientos desde extracto bancario
   */
  async importarExtracto(cuentaId, movimientos, usuarioId) {
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaId }
    });

    if (!cuenta) {
      throw new NotFoundError('Cuenta bancaria no encontrada');
    }

    const resultados = {
      importados: 0,
      duplicados: 0,
      errores: []
    };

    for (const mov of movimientos) {
      try {
        // Verificar si ya existe (por referencia y fecha)
        if (mov.referencia) {
          const existente = await prisma.movimientoBancario.findFirst({
            where: {
              cuentaBancariaId: cuentaId,
              referencia: mov.referencia,
              fecha: new Date(mov.fecha)
            }
          });

          if (existente) {
            resultados.duplicados++;
            continue;
          }
        }

        await this.createMovimiento({
          cuentaBancariaId: cuentaId,
          fecha: mov.fecha,
          tipo: mov.tipo,
          descripcion: mov.descripcion,
          referencia: mov.referencia,
          monto: mov.monto,
          otroConcepto: 'Importado de extracto',
          creadoPor: usuarioId
        });

        resultados.importados++;
      } catch (error) {
        resultados.errores.push({
          referencia: mov.referencia,
          error: error.message
        });
      }
    }

    return resultados;
  }

  // =====================================================
  // CONCILIACIÓN BANCARIA
  // =====================================================

  /**
   * Inicia una nueva conciliación
   */
  async iniciarConciliacion(cuentaId, periodo, saldoBanco, usuarioId) {
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaId }
    });

    if (!cuenta) {
      throw new NotFoundError('Cuenta bancaria no encontrada');
    }

    // Verificar que no exista conciliación para el período
    const existente = await prisma.conciliacion.findFirst({
      where: { cuentaBancariaId: cuentaId, periodo }
    });

    if (existente) {
      throw new ValidationError(`Ya existe conciliación para ${periodo}`);
    }

    // Calcular fecha de corte (último día del mes)
    const [year, month] = periodo.split('-').map(Number);
    const fechaCorte = new Date(year, month, 0); // Último día del mes

    // Obtener movimientos pendientes
    const movimientosPendientes = await prisma.movimientoBancario.findMany({
      where: {
        cuentaBancariaId: cuentaId,
        conciliado: false,
        fecha: { lte: fechaCorte }
      }
    });

    return prisma.conciliacion.create({
      data: {
        cuentaBancariaId: cuentaId,
        periodo,
        fechaCorte,
        saldoLibros: cuenta.saldoActual,
        saldoBanco,
        diferencia: parseFloat(cuenta.saldoActual) - parseFloat(saldoBanco),
        estado: 'Borrador',
        creadoPor: usuarioId
      },
      include: {
        cuentaBancaria: true
      }
    });
  }

  /**
   * Obtiene una conciliación con sus partidas
   */
  async getConciliacion(id) {
    const conciliacion = await prisma.conciliacion.findUnique({
      where: { id },
      include: {
        cuentaBancaria: true
      }
    });

    if (!conciliacion) {
      throw new NotFoundError('Conciliación no encontrada');
    }

    // Obtener movimientos pendientes hasta la fecha de corte
    const movimientosPendientes = await prisma.movimientoBancario.findMany({
      where: {
        cuentaBancariaId: conciliacion.cuentaBancariaId,
        conciliado: false,
        fecha: { lte: conciliacion.fechaCorte }
      },
      orderBy: { fecha: 'asc' }
    });

    return {
      ...conciliacion,
      movimientosPendientes
    };
  }

  /**
   * Marca un movimiento como conciliado
   */
  async marcarConciliado(movimientoId, conciliacionId) {
    const movimiento = await prisma.movimientoBancario.findUnique({
      where: { id: movimientoId }
    });

    if (!movimiento) {
      throw new NotFoundError('Movimiento no encontrado');
    }

    return prisma.movimientoBancario.update({
      where: { id: movimientoId },
      data: {
        conciliado: true,
        conciliacionId
      }
    });
  }

  /**
   * Desmarca un movimiento como conciliado
   */
  async desmarcarConciliado(movimientoId) {
    return prisma.movimientoBancario.update({
      where: { id: movimientoId },
      data: {
        conciliado: false,
        conciliacionId: null
      }
    });
  }

  /**
   * Actualiza partidas conciliatorias
   */
  async actualizarPartidas(conciliacionId, partidas) {
    const conciliacion = await prisma.conciliacion.findUnique({
      where: { id: conciliacionId }
    });

    if (!conciliacion) {
      throw new NotFoundError('Conciliación no encontrada');
    }

    if (conciliacion.estado === 'Conciliada') {
      throw new ValidationError('No se puede modificar una conciliación cerrada');
    }

    // Calcular nueva diferencia
    const saldoAjustado = parseFloat(conciliacion.saldoBanco)
      + parseFloat(partidas.chequesEnTransito || 0)
      - parseFloat(partidas.depositosEnTransito || 0)
      + parseFloat(partidas.notasDebito || 0)
      - parseFloat(partidas.notasCredito || 0);

    return prisma.conciliacion.update({
      where: { id: conciliacionId },
      data: {
        chequesEnTransito: partidas.chequesEnTransito || 0,
        depositosEnTransito: partidas.depositosEnTransito || 0,
        notasDebito: partidas.notasDebito || 0,
        notasCredito: partidas.notasCredito || 0,
        diferencia: parseFloat(conciliacion.saldoLibros) - saldoAjustado
      }
    });
  }

  /**
   * Finaliza y cierra una conciliación
   */
  async finalizarConciliacion(conciliacionId, aprobadorId) {
    const conciliacion = await prisma.conciliacion.findUnique({
      where: { id: conciliacionId }
    });

    if (!conciliacion) {
      throw new NotFoundError('Conciliación no encontrada');
    }

    if (conciliacion.estado === 'Conciliada') {
      throw new ValidationError('La conciliación ya está cerrada');
    }

    // Verificar que la diferencia sea aceptable (< $1,000)
    if (Math.abs(parseFloat(conciliacion.diferencia)) > 1000) {
      throw new ValidationError(
        `La diferencia de $${conciliacion.diferencia} es mayor a $1,000. Revise las partidas conciliatorias.`
      );
    }

    return prisma.$transaction(async (tx) => {
      // Cerrar conciliación
      const conciliacionActualizada = await tx.conciliacion.update({
        where: { id: conciliacionId },
        data: {
          estado: 'Conciliada',
          aprobadoPor: aprobadorId,
          fechaAprobacion: new Date()
        }
      });

      // Actualizar saldo conciliado de la cuenta
      await tx.cuentaBancaria.update({
        where: { id: conciliacion.cuentaBancariaId },
        data: {
          saldoConciliado: conciliacion.saldoBanco
        }
      });

      return conciliacionActualizada;
    });
  }

  /**
   * Obtiene historial de conciliaciones de una cuenta
   */
  async getHistorialConciliaciones(cuentaId) {
    return prisma.conciliacion.findMany({
      where: { cuentaBancariaId: cuentaId },
      orderBy: { periodo: 'desc' },
      take: 12
    });
  }

  // =====================================================
  // REPORTES Y ESTADÍSTICAS
  // =====================================================

  /**
   * Obtiene resumen de todas las cuentas bancarias
   */
  async getResumenCuentas() {
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { activa: true },
      select: {
        id: true,
        banco: true,
        numeroCuenta: true,
        nombreCuenta: true,
        saldoActual: true,
        saldoConciliado: true
      }
    });

    const totalSaldo = cuentas.reduce(
      (sum, c) => sum + parseFloat(c.saldoActual),
      0
    );

    const totalConciliado = cuentas.reduce(
      (sum, c) => sum + parseFloat(c.saldoConciliado),
      0
    );

    return {
      cuentas,
      totales: {
        saldoActual: totalSaldo,
        saldoConciliado: totalConciliado,
        diferencia: totalSaldo - totalConciliado
      }
    };
  }

  /**
   * Obtiene flujo de efectivo por período
   */
  async getFlujoEfectivo(fechaInicio, fechaFin) {
    const movimientos = await prisma.movimientoBancario.findMany({
      where: {
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        }
      },
      include: {
        cuentaBancaria: {
          select: { banco: true, nombreCuenta: true }
        }
      }
    });

    // Agrupar por tipo
    const ingresos = movimientos
      .filter(m => m.tipo === 'Crédito')
      .reduce((sum, m) => sum + parseFloat(m.monto), 0);

    const egresos = movimientos
      .filter(m => m.tipo === 'Débito')
      .reduce((sum, m) => sum + parseFloat(m.monto), 0);

    // Agrupar por día para gráfico
    const porDia = {};
    for (const mov of movimientos) {
      const dia = mov.fecha.toISOString().split('T')[0];
      if (!porDia[dia]) {
        porDia[dia] = { ingresos: 0, egresos: 0 };
      }
      if (mov.tipo === 'Crédito') {
        porDia[dia].ingresos += parseFloat(mov.monto);
      } else {
        porDia[dia].egresos += parseFloat(mov.monto);
      }
    }

    return {
      periodo: { inicio: fechaInicio, fin: fechaFin },
      resumen: {
        ingresos,
        egresos,
        flujoNeto: ingresos - egresos
      },
      detallePorDia: Object.entries(porDia)
        .map(([fecha, valores]) => ({ fecha, ...valores }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
    };
  }

  /**
   * Dashboard de bancos
   */
  async getDashboard() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      resumenCuentas,
      movimientosMes,
      conciliacionesPendientes
    ] = await Promise.all([
      this.getResumenCuentas(),
      prisma.movimientoBancario.aggregate({
        where: { fecha: { gte: inicioMes } },
        _count: true,
        _sum: { monto: true }
      }),
      prisma.conciliacion.count({
        where: { estado: 'Borrador' }
      })
    ]);

    // Calcular ingresos y egresos del mes
    const movimientosTipo = await prisma.movimientoBancario.groupBy({
      by: ['tipo'],
      where: { fecha: { gte: inicioMes } },
      _sum: { monto: true }
    });

    const ingresosMes = movimientosTipo.find(m => m.tipo === 'Crédito')?._sum?.monto || 0;
    const egresosMes = movimientosTipo.find(m => m.tipo === 'Débito')?._sum?.monto || 0;

    return {
      cuentas: resumenCuentas,
      mesActual: {
        movimientos: movimientosMes._count,
        ingresos: parseFloat(ingresosMes),
        egresos: parseFloat(egresosMes),
        flujoNeto: parseFloat(ingresosMes) - parseFloat(egresosMes)
      },
      conciliacionesPendientes
    };
  }
}

module.exports = new ConciliacionService();
