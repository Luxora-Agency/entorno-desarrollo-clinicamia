/**
 * Servicio de Turnos de Caja (POS)
 * Maneja la apertura y cierre de turnos/caja para el módulo de admisiones
 */

const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class TurnoCajaService {
  /**
   * Genera el siguiente número de turno
   */
  async generarNumeroTurno() {
    const year = new Date().getFullYear();
    const prefix = `TURNO-${year}-`;

    const lastTurno = await prisma.turnoCaja.findFirst({
      where: {
        numero: { startsWith: prefix }
      },
      orderBy: { numero: 'desc' }
    });

    let nextNumber = 1;
    if (lastTurno) {
      const lastNumber = parseInt(lastTurno.numero.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Obtiene el turno abierto del usuario actual
   */
  async getTurnoAbierto(usuarioId) {
    const turno = await prisma.turnoCaja.findFirst({
      where: {
        usuarioId,
        estado: 'ABIERTO'
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true }
        },
        pagos: {
          orderBy: { fechaRegistro: 'desc' }
        }
      }
    });

    return turno;
  }

  /**
   * Verifica si el usuario tiene un turno abierto
   */
  async tieneTurnoAbierto(usuarioId) {
    const turno = await prisma.turnoCaja.findFirst({
      where: {
        usuarioId,
        estado: 'ABIERTO'
      }
    });

    return !!turno;
  }

  /**
   * Abre un nuevo turno de caja
   */
  async abrirTurno(data) {
    const { usuarioId, montoInicial, observaciones } = data;

    // Verificar que el usuario no tenga un turno abierto
    const turnoExistente = await this.getTurnoAbierto(usuarioId);
    if (turnoExistente) {
      throw new ValidationError('Ya tienes un turno abierto. Debes cerrarlo antes de abrir uno nuevo.');
    }

    const numero = await this.generarNumeroTurno();

    const turno = await prisma.turnoCaja.create({
      data: {
        numero,
        usuarioId,
        montoInicial: parseFloat(montoInicial) || 0,
        observacionesApertura: observaciones || null,
        estado: 'ABIERTO',
        fechaApertura: new Date()
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true }
        }
      }
    });

    console.log(`[TurnoCaja] Turno ${numero} abierto por usuario ${usuarioId}`);
    return turno;
  }

  /**
   * Registra un pago en el turno actual
   */
  async registrarPago(turnoId, pagoData) {
    const { monto, metodoPago, facturaId, pagoId, referencia, bancoDestino, descripcion } = pagoData;

    // Verificar que el turno esté abierto
    const turno = await prisma.turnoCaja.findUnique({
      where: { id: turnoId }
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    if (turno.estado !== 'ABIERTO') {
      throw new ValidationError('El turno no está abierto');
    }

    const pagoTurno = await prisma.pagoTurno.create({
      data: {
        turnoId,
        monto: parseFloat(monto),
        metodoPago,
        facturaId,
        pagoId,
        referencia,
        bancoDestino,
        descripcion
      }
    });

    return pagoTurno;
  }

  /**
   * Calcula los totales del turno por método de pago
   */
  async calcularTotales(turnoId) {
    const pagos = await prisma.pagoTurno.findMany({
      where: { turnoId }
    });

    const totales = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      eps: 0,
      otros: 0,
      total: 0,
      cantidad: pagos.length
    };

    for (const pago of pagos) {
      const monto = parseFloat(pago.monto);
      totales.total += monto;

      switch (pago.metodoPago?.toLowerCase()) {
        case 'efectivo':
          totales.efectivo += monto;
          break;
        case 'tarjeta':
          totales.tarjeta += monto;
          break;
        case 'transferencia':
          totales.transferencia += monto;
          break;
        case 'eps':
          totales.eps += monto;
          break;
        default:
          totales.otros += monto;
      }
    }

    return totales;
  }

  /**
   * Obtiene el resumen del turno para cierre
   */
  async getResumenTurno(turnoId) {
    const turno = await prisma.turnoCaja.findUnique({
      where: { id: turnoId },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true }
        },
        pagos: {
          orderBy: { fechaRegistro: 'desc' }
        }
      }
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    const totales = await this.calcularTotales(turnoId);

    // Calcular el efectivo esperado (monto inicial + efectivo recibido)
    const efectivoEsperado = parseFloat(turno.montoInicial) + totales.efectivo;

    return {
      turno,
      totales,
      efectivoEsperado,
      desglosePorMetodo: [
        { metodo: 'Efectivo', total: totales.efectivo, icono: '💵' },
        { metodo: 'Tarjeta', total: totales.tarjeta, icono: '💳' },
        { metodo: 'Transferencia', total: totales.transferencia, icono: '🏦' },
        { metodo: 'EPS', total: totales.eps, icono: '🏥' },
        { metodo: 'Otros', total: totales.otros, icono: '📋' }
      ].filter(d => d.total > 0)
    };
  }

  /**
   * Cierra el turno de caja
   */
  async cerrarTurno(turnoId, dataCierre) {
    const {
      montoEfectivoCierre,
      responsableCierreId,
      nombreResponsable,
      observaciones
    } = dataCierre;

    const turno = await prisma.turnoCaja.findUnique({
      where: { id: turnoId },
      include: {
        usuario: true,
        pagos: true
      }
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    if (turno.estado !== 'ABIERTO') {
      throw new ValidationError('El turno ya está cerrado');
    }

    // Calcular totales
    const totales = await this.calcularTotales(turnoId);

    // Calcular efectivo esperado y diferencia
    const efectivoEsperado = parseFloat(turno.montoInicial) + totales.efectivo;
    const efectivoReal = parseFloat(montoEfectivoCierre) || 0;
    const diferencia = efectivoReal - efectivoEsperado;

    // Actualizar el turno con los datos de cierre
    const turnoCerrado = await prisma.turnoCaja.update({
      where: { id: turnoId },
      data: {
        estado: 'CERRADO',
        fechaCierre: new Date(),
        totalEfectivo: totales.efectivo,
        totalTarjeta: totales.tarjeta,
        totalTransferencia: totales.transferencia,
        totalEPS: totales.eps,
        totalOtros: totales.otros,
        totalVentas: totales.total,
        cantidadTransacciones: totales.cantidad,
        montoEfectivoCierre: efectivoReal,
        diferencia,
        responsableCierreId: responsableCierreId || null,
        nombreResponsable: nombreResponsable || null,
        observacionesCierre: observaciones || null
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true }
        },
        responsableCierre: {
          select: { id: true, nombre: true, apellido: true }
        },
        pagos: {
          orderBy: { fechaRegistro: 'desc' }
        }
      }
    });

    console.log(`[TurnoCaja] Turno ${turno.numero} cerrado. Total ventas: ${totales.total}`);

    return {
      turno: turnoCerrado,
      resumen: {
        montoInicial: parseFloat(turno.montoInicial),
        totalVentas: totales.total,
        efectivoEsperado,
        efectivoReal,
        diferencia,
        desglose: {
          efectivo: totales.efectivo,
          tarjeta: totales.tarjeta,
          transferencia: totales.transferencia,
          eps: totales.eps,
          otros: totales.otros
        },
        cantidadTransacciones: totales.cantidad
      }
    };
  }

  /**
   * Obtiene el historial de turnos
   */
  async getHistorial(query = {}) {
    const { usuarioId, estado, fechaInicio, fechaFin, page = 1, limit = 20 } = query;

    const where = {};

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (fechaInicio || fechaFin) {
      where.fechaApertura = {};
      if (fechaInicio) {
        where.fechaApertura.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.fechaApertura.lte = new Date(fechaFin);
      }
    }

    const skip = (page - 1) * limit;

    const [turnos, total] = await Promise.all([
      prisma.turnoCaja.findMany({
        where,
        include: {
          usuario: {
            select: { id: true, nombre: true, apellido: true }
          },
          responsableCierre: {
            select: { id: true, nombre: true, apellido: true }
          }
        },
        orderBy: { fechaApertura: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.turnoCaja.count({ where })
    ]);

    return {
      turnos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtiene un turno por ID
   */
  async getById(id) {
    const turno = await prisma.turnoCaja.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true }
        },
        responsableCierre: {
          select: { id: true, nombre: true, apellido: true }
        },
        pagos: {
          orderBy: { fechaRegistro: 'desc' }
        }
      }
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    return turno;
  }

  /**
   * Anula un turno (solo si está abierto y no tiene pagos)
   */
  async anularTurno(turnoId, motivo) {
    const turno = await prisma.turnoCaja.findUnique({
      where: { id: turnoId },
      include: { pagos: true }
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    if (turno.estado !== 'ABIERTO') {
      throw new ValidationError('Solo se pueden anular turnos abiertos');
    }

    if (turno.pagos.length > 0) {
      throw new ValidationError('No se puede anular un turno que ya tiene pagos registrados');
    }

    const turnoAnulado = await prisma.turnoCaja.update({
      where: { id: turnoId },
      data: {
        estado: 'ANULADO',
        fechaCierre: new Date(),
        observacionesCierre: motivo || 'Turno anulado'
      }
    });

    console.log(`[TurnoCaja] Turno ${turno.numero} anulado`);
    return turnoAnulado;
  }
}

module.exports = new TurnoCajaService();
