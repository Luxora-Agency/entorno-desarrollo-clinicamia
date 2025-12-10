/**
 * Service de disponibilidad de doctores
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class DisponibilidadService {
  /**
   * Obtener disponibilidad de un doctor para una fecha específica
   */
  async getDisponibilidad(doctorId, fecha) {
    // Obtener información del doctor con sus horarios
    const usuario = await prisma.usuario.findUnique({
      where: { id: doctorId },
      include: {
        doctor: true,
      },
    });

    if (!usuario || usuario.rol !== 'Doctor') {
      throw new NotFoundError('Doctor no encontrado');
    }

    const horarios = usuario.doctor?.horarios;

    if (!horarios) {
      return {
        fecha,
        horarios_configurados: false,
        slots_disponibles: [],
      };
    }

    // Parsear la fecha
    const fechaObj = new Date(fecha + 'T00:00:00');
    const fechaKey = fecha; // YYYY-MM-DD

    // Obtener bloques de horario configurados para esa fecha
    const bloquesDelDia = horarios[fechaKey] || [];

    if (bloquesDelDia.length === 0) {
      return {
        fecha,
        horarios_configurados: true,
        bloques_del_dia: false,
        slots_disponibles: [],
      };
    }

    // Obtener citas ya agendadas para ese doctor en esa fecha
    const citasOcupadas = await prisma.cita.findMany({
      where: {
        doctorId,
        fecha: fechaObj,
        estado: {
          not: 'Cancelada',
        },
      },
      select: {
        hora: true,
      },
    });

    // Generar slots disponibles
    const slotsDisponibles = this.generarSlotsDisponibles(
      bloquesDelDia,
      citasOcupadas,
      fecha
    );

    return {
      fecha,
      horarios_configurados: true,
      bloques_del_dia: true,
      bloques: bloquesDelDia,
      citas_ocupadas: citasOcupadas.length,
      slots_disponibles: slotsDisponibles,
    };
  }

  /**
   * Generar slots disponibles basados en bloques y citas ocupadas
   */
  generarSlotsDisponibles(bloques, citasOcupadas, fecha) {
    const slots = [];
    const duracionSlot = 30; // minutos por slot

    bloques.forEach((bloque) => {
      const { inicio, fin } = bloque;
      
      // Convertir inicio y fin a minutos desde medianoche
      const inicioMinutos = this.timeToMinutes(inicio);
      const finMinutos = this.timeToMinutes(fin);

      // Generar slots cada 30 minutos
      for (let minutos = inicioMinutos; minutos < finMinutos; minutos += duracionSlot) {
        const horaSlot = this.minutesToTime(minutos);
        const horaFinSlot = this.minutesToTime(minutos + duracionSlot);
        
        // Verificar si este slot está ocupado por alguna cita
        const estaOcupado = citasOcupadas.some((cita) => {
          const citaHora = cita.hora;
          const citaDuracion = 30; // Default duration since duracionMinutos field doesn't exist
          
          const citaInicio = this.timeToMinutes(citaHora);
          const citaFin = citaInicio + citaDuracion;

          // El slot está ocupado si hay overlap
          return minutos >= citaInicio && minutos < citaFin;
        });

        if (!estaOcupado) {
          slots.push({
            hora_inicio: horaSlot,
            hora_fin: horaFinSlot,
            disponible: true,
          });
        }
      }
    });

    return slots;
  }

  /**
   * Convertir hora "HH:MM" o DateTime a minutos desde medianoche
   */
  timeToMinutes(time) {
    if (time instanceof Date) {
      // If it's a Date object, extract hours and minutes
      return time.getHours() * 60 + time.getMinutes();
    }
    // If it's a string in "HH:MM" format
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convertir minutos desde medianoche a "HH:MM"
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Validar si un doctor está disponible en una fecha/hora específica
   */
  async validarDisponibilidad(doctorId, fecha, hora, duracionMinutos = 30) {
    const disponibilidad = await this.getDisponibilidad(doctorId, fecha);

    if (!disponibilidad.horarios_configurados || !disponibilidad.bloques_del_dia) {
      throw new ValidationError('El doctor no tiene horarios configurados para esta fecha');
    }

    // Verificar si la hora solicitada está en los slots disponibles
    const horaInicio = this.timeToMinutes(hora);
    const horaFin = horaInicio + duracionMinutos;

    // Verificar si todos los slots necesarios están disponibles
    const slotsNecesarios = [];
    for (let minutos = horaInicio; minutos < horaFin; minutos += 30) {
      slotsNecesarios.push(this.minutesToTime(minutos));
    }

    const todosDisponibles = slotsNecesarios.every((slot) =>
      disponibilidad.slots_disponibles.some((s) => s.hora_inicio === slot && s.disponible)
    );

    if (!todosDisponibles) {
      throw new ValidationError('El horario seleccionado no está disponible');
    }

    return true;
  }

  /**
   * Obtener semana de disponibilidad (7 días desde una fecha)
   */
  async getDisponibilidadSemana(doctorId, fechaInicio) {
    const disponibilidadSemana = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];

      const disponibilidad = await this.getDisponibilidad(doctorId, fechaStr);
      disponibilidadSemana.push(disponibilidad);
    }

    return disponibilidadSemana;
  }
}

module.exports = new DisponibilidadService();
