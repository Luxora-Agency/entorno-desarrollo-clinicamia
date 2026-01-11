/**
 * Service de Reservas Temporales de Horarios
 *
 * Este servicio maneja reservas temporales de slots de tiempo para prevenir
 * que múltiples usuarios intenten reservar el mismo horario simultáneamente.
 *
 * Flujo:
 * 1. Usuario selecciona un slot -> se crea una reserva temporal (5 min)
 * 2. Usuario confirma la cita -> la reserva se convierte en cita
 * 3. Si no confirma en 5 min -> la reserva expira automáticamente
 *
 * Un cron job limpia las reservas expiradas cada minuto.
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { addMinutes, isBefore, isAfter } = require('date-fns');

// Tiempo de expiración de reservas en minutos
const RESERVA_EXPIRACION_MINUTOS = 5;

// Código de error de Prisma para violación de constraint único
const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

/**
 * Convierte una fecha string a Date sin conversión de timezone
 */
function parseSimpleDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date;
}

class ReservaService {
  /**
   * Crear una reserva temporal de un slot de tiempo
   *
   * @param {string} doctorId - ID del doctor (Usuario.id)
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {string} hora - Hora de inicio en formato HH:MM
   * @param {number} duracionMinutos - Duración del slot en minutos
   * @param {string} sessionId - ID de sesión del usuario que reserva
   * @returns {Promise<Object>} Reserva creada
   */
  async reservarSlot(doctorId, fecha, hora, duracionMinutos = 30, sessionId) {
    if (!doctorId || !fecha || !hora || !sessionId) {
      throw new ValidationError('Todos los campos son requeridos: doctorId, fecha, hora, sessionId');
    }

    const fechaDate = parseSimpleDate(fecha);
    const horaInicio = hora;
    const horaFinDate = addMinutes(new Date(`1970-01-01T${hora}:00Z`), duracionMinutos);
    const horaFin = `${String(horaFinDate.getUTCHours()).padStart(2, '0')}:${String(horaFinDate.getUTCMinutes()).padStart(2, '0')}`;

    // Tiempo de expiración
    const expiresAt = addMinutes(new Date(), RESERVA_EXPIRACION_MINUTOS);

    try {
      // Crear reserva en transacción para verificar disponibilidad
      const reserva = await prisma.$transaction(async (tx) => {
        // Verificar que no hay citas existentes en ese horario
        const citasConflicto = await tx.cita.findMany({
          where: {
            doctorId,
            fecha: fechaDate,
            estado: { notIn: ['Cancelada', 'NoAsistio'] },
          },
          select: {
            hora: true,
            duracionMinutos: true,
          }
        });

        const horaInicioDate = new Date(`1970-01-01T${hora}:00Z`);
        const horaFinDateCheck = addMinutes(horaInicioDate, duracionMinutos);

        for (const cita of citasConflicto) {
          if (!cita.hora) continue;
          const citaInicio = new Date(`1970-01-01T${cita.hora.toISOString().split('T')[1]}`);
          const citaFin = addMinutes(citaInicio, cita.duracionMinutos || 30);

          if (isBefore(horaInicioDate, citaFin) && isAfter(horaFinDateCheck, citaInicio)) {
            throw new ValidationError('Este horario ya tiene una cita programada');
          }
        }

        // Verificar que no hay otras reservas activas en ese horario
        const reservasConflicto = await tx.reservaHorario.findMany({
          where: {
            doctorId,
            fecha: fechaDate,
            estado: 'RESERVADO',
            expiresAt: { gt: new Date() }, // Solo reservas no expiradas
          },
          select: {
            horaInicio: true,
            horaFin: true,
          }
        });

        for (const res of reservasConflicto) {
          const resInicio = new Date(`1970-01-01T${res.horaInicio}:00Z`);
          const resFin = new Date(`1970-01-01T${res.horaFin}:00Z`);

          if (isBefore(horaInicioDate, resFin) && isAfter(horaFinDateCheck, resInicio)) {
            throw new ValidationError('Este horario está siendo reservado por otro usuario. Intente de nuevo en unos minutos.');
          }
        }

        // Verificar bloqueos de agenda
        const bloqueos = await tx.bloqueoAgenda.findMany({
          where: {
            doctorId,
            activo: true,
            fechaInicio: { lte: fechaDate },
            fechaFin: { gte: fechaDate },
          }
        });

        for (const bloqueo of bloqueos) {
          if (!bloqueo.horaInicio || !bloqueo.horaFin) {
            throw new ValidationError(`El doctor no está disponible el ${fecha}. Motivo: ${bloqueo.motivo}`);
          }

          const bloqueoInicio = new Date(`1970-01-01T${bloqueo.horaInicio}:00Z`);
          const bloqueoFin = new Date(`1970-01-01T${bloqueo.horaFin}:00Z`);

          if (isBefore(horaInicioDate, bloqueoFin) && isAfter(horaFinDateCheck, bloqueoInicio)) {
            throw new ValidationError(`El horario está bloqueado. Motivo: ${bloqueo.motivo}`);
          }
        }

        // Crear la reserva
        return tx.reservaHorario.create({
          data: {
            doctorId,
            fecha: fechaDate,
            horaInicio,
            horaFin,
            estado: 'RESERVADO',
            sessionId,
            expiresAt,
          },
          include: {
            doctor: {
              select: { id: true, nombre: true, apellido: true }
            }
          }
        });
      });

      return {
        ...reserva,
        expiresIn: RESERVA_EXPIRACION_MINUTOS * 60, // segundos restantes
        expiresAt: reserva.expiresAt,
      };
    } catch (error) {
      if (error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR) {
        throw new ValidationError('Este horario está siendo reservado por otro usuario. Intente de nuevo.');
      }
      throw error;
    }
  }

  /**
   * Confirmar una reserva y crear la cita
   *
   * @param {string} reservaId - ID de la reserva
   * @param {Object} citaData - Datos para crear la cita
   * @param {string} sessionId - ID de sesión del usuario (debe coincidir con el de la reserva)
   * @returns {Promise<Object>} Cita creada
   */
  async confirmarReserva(reservaId, citaData, sessionId) {
    const reserva = await prisma.reservaHorario.findUnique({
      where: { id: reservaId }
    });

    if (!reserva) {
      throw new NotFoundError('Reserva no encontrada');
    }

    if (reserva.sessionId !== sessionId) {
      throw new ValidationError('No tienes permiso para confirmar esta reserva');
    }

    if (reserva.estado !== 'RESERVADO') {
      throw new ValidationError('Esta reserva ya no está activa');
    }

    if (new Date() > reserva.expiresAt) {
      // Marcar como expirada
      await prisma.reservaHorario.update({
        where: { id: reservaId },
        data: { estado: 'EXPIRADO' }
      });
      throw new ValidationError('La reserva ha expirado. Por favor seleccione otro horario.');
    }

    // Usar el CitaService para crear la cita (importar dinámicamente para evitar circular dependency)
    const citaService = require('./cita.service');

    // Preparar datos de la cita usando la información de la reserva
    const citaCompleta = {
      ...citaData,
      doctor_id: reserva.doctorId,
      fecha: reserva.fecha.toISOString().split('T')[0],
      hora: reserva.horaInicio,
    };

    try {
      // Crear cita en transacción junto con actualización de reserva
      const resultado = await prisma.$transaction(async (tx) => {
        // Crear la cita usando el service (que ya tiene validación)
        const cita = await citaService.create(citaCompleta);

        // Actualizar la reserva para vincularla a la cita
        await tx.reservaHorario.update({
          where: { id: reservaId },
          data: {
            estado: 'CONFIRMADO',
            citaId: cita.id,
          }
        });

        return cita;
      });

      return resultado;
    } catch (error) {
      // Si falla la creación de la cita, la reserva sigue activa
      throw error;
    }
  }

  /**
   * Liberar una reserva manualmente (cancelar antes de confirmar)
   *
   * @param {string} reservaId - ID de la reserva
   * @param {string} sessionId - ID de sesión del usuario
   */
  async liberarReserva(reservaId, sessionId) {
    const reserva = await prisma.reservaHorario.findUnique({
      where: { id: reservaId }
    });

    if (!reserva) {
      throw new NotFoundError('Reserva no encontrada');
    }

    if (reserva.sessionId !== sessionId) {
      throw new ValidationError('No tienes permiso para liberar esta reserva');
    }

    if (reserva.estado !== 'RESERVADO') {
      return; // Ya no está activa, no hacer nada
    }

    await prisma.reservaHorario.delete({
      where: { id: reservaId }
    });

    return { message: 'Reserva liberada exitosamente' };
  }

  /**
   * Obtener reservas activas de un doctor en una fecha
   *
   * @param {string} doctorId - ID del doctor
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Array>} Lista de reservas activas
   */
  async getReservasActivas(doctorId, fecha) {
    const fechaDate = parseSimpleDate(fecha);

    const reservas = await prisma.reservaHorario.findMany({
      where: {
        doctorId,
        fecha: fechaDate,
        estado: 'RESERVADO',
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        horaInicio: true,
        horaFin: true,
        expiresAt: true,
      },
      orderBy: { horaInicio: 'asc' }
    });

    return reservas;
  }

  /**
   * Obtener una reserva por ID
   *
   * @param {string} reservaId - ID de la reserva
   * @returns {Promise<Object>} Reserva encontrada
   */
  async getById(reservaId) {
    const reserva = await prisma.reservaHorario.findUnique({
      where: { id: reservaId },
      include: {
        doctor: {
          select: { id: true, nombre: true, apellido: true }
        },
        cita: {
          select: { id: true, estado: true }
        }
      }
    });

    if (!reserva) {
      throw new NotFoundError('Reserva no encontrada');
    }

    return reserva;
  }

  /**
   * Limpiar reservas expiradas (llamado por cron job)
   *
   * @returns {Promise<number>} Número de reservas eliminadas
   */
  async limpiarExpiradas() {
    const resultado = await prisma.reservaHorario.deleteMany({
      where: {
        estado: 'RESERVADO',
        expiresAt: { lt: new Date() },
      }
    });

    if (resultado.count > 0) {
      console.log(`[ReservaService] Limpiadas ${resultado.count} reservas expiradas`);
    }

    return resultado.count;
  }

  /**
   * Extender el tiempo de una reserva (si aún no ha expirado)
   *
   * @param {string} reservaId - ID de la reserva
   * @param {string} sessionId - ID de sesión del usuario
   * @param {number} minutosExtension - Minutos adicionales (default: 5)
   * @returns {Promise<Object>} Reserva actualizada
   */
  async extenderReserva(reservaId, sessionId, minutosExtension = RESERVA_EXPIRACION_MINUTOS) {
    const reserva = await prisma.reservaHorario.findUnique({
      where: { id: reservaId }
    });

    if (!reserva) {
      throw new NotFoundError('Reserva no encontrada');
    }

    if (reserva.sessionId !== sessionId) {
      throw new ValidationError('No tienes permiso para extender esta reserva');
    }

    if (reserva.estado !== 'RESERVADO') {
      throw new ValidationError('Esta reserva ya no está activa');
    }

    if (new Date() > reserva.expiresAt) {
      throw new ValidationError('La reserva ya ha expirado');
    }

    const nuevoExpiresAt = addMinutes(new Date(), minutosExtension);

    const reservaActualizada = await prisma.reservaHorario.update({
      where: { id: reservaId },
      data: { expiresAt: nuevoExpiresAt }
    });

    return {
      ...reservaActualizada,
      expiresIn: minutosExtension * 60,
      expiresAt: nuevoExpiresAt,
    };
  }
}

module.exports = new ReservaService();
