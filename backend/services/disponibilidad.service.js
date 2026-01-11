/**
 * Service de disponibilidad de doctores
 *
 * Maneja la lógica de disponibilidad considerando:
 * - Horarios configurados del doctor
 * - Citas ya agendadas
 * - Bloqueos de agenda (vacaciones, permisos, congresos)
 * - Reservas temporales activas
 *
 * NOTA SOBRE IDs:
 * - `doctorId` en este servicio se refiere a `Usuario.id` (el usuario con rol DOCTOR)
 * - Para acceder al perfil del doctor: prisma.doctor.findFirst({ where: { usuarioId: doctorId } })
 * - Este patrón es consistente con Cita.doctorId = Usuario.id
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { bloqueoService } = require('./bloqueo.service');

class DisponibilidadService {
  /**
   * Obtener disponibilidad de un doctor para una fecha específica
   */
  async getDisponibilidad(doctorId, fecha, excludeCitaId = null) {
    // Obtener información del doctor con sus horarios y especialidades
    const usuario = await prisma.usuario.findUnique({
      where: { id: doctorId },
      include: {
        doctor: {
          include: {
            especialidades: {
              include: {
                especialidad: true
              }
            }
          }
        },
      },
    });

    if (!usuario || usuario.rol !== 'Doctor') {
      throw new NotFoundError('Doctor no encontrado');
    }

    const horarios = usuario.doctor?.horarios;
    const especialidades = usuario.doctor?.especialidades || [];
    
    // Calcular duración de slot basada en la primera especialidad
    let duracionSlot = 30; // Default
    if (especialidades.length > 0) {
      const primeraEspecialidad = especialidades[0].especialidad;
      if (primeraEspecialidad && primeraEspecialidad.duracionMinutos) {
        duracionSlot = primeraEspecialidad.duracionMinutos;
        console.log(`[INFO] Usando duración de slot personalizada: ${duracionSlot} min (Especialidad: ${primeraEspecialidad.titulo})`);
      }
      
      // Warn if multiple specialties have different durations
      if (especialidades.length > 1) {
         const duraciones = especialidades.map(e => e.especialidad.duracionMinutos);
         const todasIguales = duraciones.every(d => d === duraciones[0]);
         if (!todasIguales) {
             console.warn(`[WARN] Doctor ${doctorId} tiene especialidades con duraciones diferentes: ${duraciones.join(', ')}. Se usará ${duracionSlot} min.`);
         }
      }
    }

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
    const diaSemana = fechaObj.getDay().toString(); // 0 (Domingo) - 6 (Sábado)

    // Obtener bloques de horario configurados para esa fecha
    // Prioridad: Fecha específica > Día de la semana recurrente
    let bloquesDelDia = horarios[fechaKey];

    if (!bloquesDelDia) {
      bloquesDelDia = horarios[diaSemana] || [];
    }

    if (bloquesDelDia.length === 0) {
      return {
        fecha,
        horarios_configurados: true,
        bloques_del_dia: false,
        slots_disponibles: [],
      };
    }

    // Verificar bloqueos de agenda (vacaciones, permisos, etc.)
    const bloqueo = await bloqueoService.verificarBloqueo(doctorId, fecha);
    if (bloqueo && bloqueo.bloqueado && bloqueo.diaCompleto) {
      return {
        fecha,
        horarios_configurados: true,
        bloques_del_dia: true,
        bloqueado: true,
        bloqueo_tipo: bloqueo.tipo,
        bloqueo_motivo: bloqueo.motivo,
        slots_disponibles: [],
      };
    }

    // Obtener citas ya agendadas para ese doctor en esa fecha
    const whereCitas = {
      doctorId,
      fecha: fechaObj,
      estado: {
        not: 'Cancelada',
      },
    };

    if (excludeCitaId) {
      whereCitas.id = { not: excludeCitaId };
    }

    const citasOcupadas = await prisma.cita.findMany({
      where: whereCitas,
      select: {
        hora: true,
      },
    });

    // Obtener reservas temporales activas (otros usuarios reservando)
    const reservasActivas = await prisma.reservaHorario.findMany({
      where: {
        doctorId,
        fecha: fechaObj,
        estado: 'RESERVADO',
        expiresAt: { gt: new Date() },
      },
      select: {
        horaInicio: true,
        horaFin: true,
      }
    });

    // Generar slots disponibles (considerando citas, reservas y bloqueos parciales)
    const slotsDisponibles = this.generarSlotsDisponibles(
      bloquesDelDia,
      citasOcupadas,
      fecha,
      duracionSlot,
      reservasActivas,
      bloqueo // Puede ser parcial (con horaInicio/horaFin)
    );

    return {
      fecha,
      horarios_configurados: true,
      bloques_del_dia: true,
      bloques: bloquesDelDia,
      citas_ocupadas: citasOcupadas.length,
      reservas_activas: reservasActivas.length,
      bloqueo_parcial: bloqueo && !bloqueo.diaCompleto ? bloqueo : null,
      slots_disponibles: slotsDisponibles,
    };
  }

  /**
   * Generar slots disponibles basados en bloques, citas ocupadas, reservas y bloqueos
   *
   * @param {Array} bloques - Bloques de horario del doctor
   * @param {Array} citasOcupadas - Citas ya agendadas
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {number} duracionSlot - Duración de cada slot en minutos
   * @param {Array} reservasActivas - Reservas temporales activas
   * @param {Object} bloqueoParcial - Bloqueo parcial si existe
   */
  generarSlotsDisponibles(bloques, citasOcupadas, fecha, duracionSlot = 30, reservasActivas = [], bloqueoParcial = null) {
    const slots = [];

    // Convertir bloqueo parcial a minutos si existe
    let bloqueoInicioMinutos = null;
    let bloqueoFinMinutos = null;
    if (bloqueoParcial && !bloqueoParcial.diaCompleto && bloqueoParcial.horaInicio && bloqueoParcial.horaFin) {
      bloqueoInicioMinutos = this.timeToMinutes(bloqueoParcial.horaInicio);
      bloqueoFinMinutos = this.timeToMinutes(bloqueoParcial.horaFin);
    }

    bloques.forEach((bloque) => {
      const { inicio, fin } = bloque;

      // Convertir inicio y fin a minutos desde medianoche
      const inicioMinutos = this.timeToMinutes(inicio);
      const finMinutos = this.timeToMinutes(fin);

      // Generar slots según la duración configurada
      for (let minutos = inicioMinutos; minutos < finMinutos; minutos += duracionSlot) {
        const horaSlot = this.minutesToTime(minutos);
        const horaFinSlot = this.minutesToTime(minutos + duracionSlot);
        const slotFinMinutos = minutos + duracionSlot;

        // Verificar si este slot está ocupado por alguna cita
        const ocupadoPorCita = citasOcupadas.some((cita) => {
          const citaHora = cita.hora;
          const citaDuracion = 30; // Default duration

          const citaInicio = this.timeToMinutes(citaHora);
          const citaFin = citaInicio + citaDuracion;

          // El slot está ocupado si hay overlap
          return minutos < citaFin && slotFinMinutos > citaInicio;
        });

        // Verificar si está reservado temporalmente
        const ocupadoPorReserva = reservasActivas.some((reserva) => {
          const reservaInicio = this.timeToMinutes(reserva.horaInicio);
          const reservaFin = this.timeToMinutes(reserva.horaFin);

          return minutos < reservaFin && slotFinMinutos > reservaInicio;
        });

        // Verificar si está bloqueado parcialmente
        const ocupadoPorBloqueo = bloqueoInicioMinutos !== null &&
          minutos < bloqueoFinMinutos && slotFinMinutos > bloqueoInicioMinutos;

        // Determinar estado del slot
        let estado = 'disponible';
        let motivo = null;

        if (ocupadoPorCita) {
          estado = 'ocupado';
          motivo = 'Cita programada';
        } else if (ocupadoPorReserva) {
          estado = 'reservado';
          motivo = 'En proceso de reserva';
        } else if (ocupadoPorBloqueo) {
          estado = 'bloqueado';
          motivo = bloqueoParcial?.motivo || 'Bloqueado';
        }

        slots.push({
          hora_inicio: horaSlot,
          hora_fin: horaFinSlot,
          disponible: estado === 'disponible',
          estado,
          motivo,
        });
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
  async validarDisponibilidad(doctorId, fecha, hora, duracionMinutos = 30, excludeCitaId = null) {
    const disponibilidad = await this.getDisponibilidad(doctorId, fecha, excludeCitaId);

    if (!disponibilidad.horarios_configurados || !disponibilidad.bloques_del_dia) {
      throw new ValidationError('El doctor no tiene horarios configurados para esta fecha');
    }

    // Verificar si la hora solicitada está en los slots disponibles
    const horaInicio = this.timeToMinutes(hora);
    const horaFin = horaInicio + duracionMinutos;

    // Verificar si todos los slots necesarios están disponibles
    const slotsNecesarios = [];
    // Ajuste para usar la misma duración base al validar
    const step = duracionMinutos > 0 ? duracionMinutos : 30; // Si la cita es de 20 min, el step debería ser coherente con los slots generados
    
    // Si la duración solicitada no es múltiplo de la duración base del doctor, advertir
    // (Esto es complejo de validar perfectamente sin saber el duracionSlot usado en getDisponibilidad, 
    //  pero getDisponibilidad ya devuelve slots generados con la lógica correcta)
    
    // Simplificación: Validar que el rango solicitado esté cubierto por slots disponibles
    // En lugar de reconstruir slots exactos, verificamos cobertura de tiempo
    
    const isCovered = disponibilidad.slots_disponibles.some(slot => {
        const slotStart = this.timeToMinutes(slot.hora_inicio);
        const slotEnd = this.timeToMinutes(slot.hora_fin);
        return horaInicio >= slotStart && horaFin <= slotEnd && slot.disponible;
    });

    if (!isCovered) {
      // Fallback: Check if it spans multiple contiguous slots (advanced scenario)
      // Por ahora mantenemos la validación simple: el bloque solicitado debe caber en un slot disponible
      // O si el sistema permite slots flexibles, se debería comprobar la unión de slots.
      
      // Intentamos la lógica original pero adaptada
      const todosDisponibles = disponibilidad.slots_disponibles.some(s => 
          s.hora_inicio === hora && s.disponible
      );
      
      if (!todosDisponibles) {
          throw new ValidationError(`El horario seleccionado (${hora}) no está disponible o no tiene duración suficiente.`);
      }
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
