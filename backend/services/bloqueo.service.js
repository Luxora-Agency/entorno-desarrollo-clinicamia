/**
 * Service de Bloqueos de Agenda
 *
 * Este servicio maneja los bloqueos de horarios de doctores para:
 * - Vacaciones
 * - Congresos
 * - Permisos personales
 * - Bloqueos parciales (horas específicas)
 * - Modo solo emergencias
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { z } = require('zod');

// Tipos de bloqueo disponibles
const TIPOS_BLOQUEO = {
  BLOQUEO: 'BLOQUEO',
  VACACIONES: 'VACACIONES',
  CONGRESO: 'CONGRESO',
  PERSONAL: 'PERSONAL',
  EMERGENCIA_SOLO: 'EMERGENCIA_SOLO', // Solo permite citas de emergencia
};

// Schema de validación para crear bloqueo
const createBloqueoSchema = z.object({
  doctor_id: z.string().uuid({ message: 'ID de doctor inválido' }),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inicio debe ser YYYY-MM-DD' }),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha fin debe ser YYYY-MM-DD' }),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Hora inicio debe ser HH:MM' }).optional().nullable(),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Hora fin debe ser HH:MM' }).optional().nullable(),
  motivo: z.string().min(1, { message: 'Motivo es requerido' }).max(255),
  tipo: z.enum(Object.values(TIPOS_BLOQUEO)).default('BLOQUEO'),
});

/**
 * Convierte una fecha string a Date sin conversión de timezone
 */
function parseSimpleDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString + 'T00:00:00.000Z');
}

class BloqueoService {
  /**
   * Crear un nuevo bloqueo de agenda
   *
   * @param {Object} data - Datos del bloqueo
   * @param {string} createdBy - ID del usuario que crea el bloqueo
   * @returns {Promise<Object>} Bloqueo creado
   */
  async crearBloqueo(data, createdBy) {
    const validatedData = createBloqueoSchema.parse(data);

    // Validar que fecha_fin >= fecha_inicio
    const fechaInicio = parseSimpleDate(validatedData.fecha_inicio);
    const fechaFin = parseSimpleDate(validatedData.fecha_fin);

    if (fechaFin < fechaInicio) {
      throw new ValidationError('La fecha de fin debe ser igual o posterior a la fecha de inicio');
    }

    // Si hay hora_inicio, debe haber hora_fin y viceversa
    if ((validatedData.hora_inicio && !validatedData.hora_fin) ||
        (!validatedData.hora_inicio && validatedData.hora_fin)) {
      throw new ValidationError('Debe especificar tanto hora de inicio como hora de fin, o ninguna para bloqueo de día completo');
    }

    // Verificar que no hay citas programadas en el rango (excepto emergencias)
    const citasAfectadas = await prisma.cita.findMany({
      where: {
        doctorId: validatedData.doctor_id,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        estado: { notIn: ['Cancelada', 'NoAsistio', 'Completada'] },
        esEmergencia: false,
      },
      select: {
        id: true,
        fecha: true,
        hora: true,
        paciente: { select: { nombre: true, apellido: true } },
      }
    });

    // Si hay citas y el bloqueo es de día completo, advertir
    if (citasAfectadas.length > 0 && !validatedData.hora_inicio) {
      const citasStr = citasAfectadas.map(c =>
        `${c.fecha.toISOString().split('T')[0]} ${c.hora ? c.hora.toISOString().split('T')[1].substring(0, 5) : ''} - ${c.paciente.nombre} ${c.paciente.apellido}`
      ).join(', ');

      throw new ValidationError(
        `Existen ${citasAfectadas.length} cita(s) programada(s) en este rango. ` +
        `Cancele o reprograme las citas antes de crear el bloqueo: ${citasStr}`
      );
    }

    // Verificar superposición con bloqueos existentes
    const bloqueosExistentes = await prisma.bloqueoAgenda.findMany({
      where: {
        doctorId: validatedData.doctor_id,
        activo: true,
        OR: [
          {
            fechaInicio: { lte: fechaFin },
            fechaFin: { gte: fechaInicio },
          }
        ]
      }
    });

    if (bloqueosExistentes.length > 0) {
      // Verificar si hay superposición real (considerando horas si aplica)
      for (const bloqueo of bloqueosExistentes) {
        // Si alguno es de día completo, hay superposición
        if (!bloqueo.horaInicio || !validatedData.hora_inicio) {
          throw new ValidationError(
            `Ya existe un bloqueo en este rango de fechas: ${bloqueo.motivo}`
          );
        }

        // Si ambos tienen horas, verificar superposición de horas
        // (Simplificado: solo verificar si las fechas coinciden exactamente)
      }
    }

    // Crear el bloqueo
    const bloqueo = await prisma.bloqueoAgenda.create({
      data: {
        doctorId: validatedData.doctor_id,
        fechaInicio,
        fechaFin,
        horaInicio: validatedData.hora_inicio || null,
        horaFin: validatedData.hora_fin || null,
        motivo: validatedData.motivo,
        tipo: validatedData.tipo,
        activo: true,
        createdBy,
      },
      include: {
        doctor: {
          select: { id: true, nombre: true, apellido: true }
        }
      }
    });

    return bloqueo;
  }

  /**
   * Obtener bloqueos de un doctor en un rango de fechas
   *
   * @param {string} doctorId - ID del doctor
   * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
   * @returns {Promise<Array>} Lista de bloqueos
   */
  async obtenerBloqueos(doctorId, fechaInicio = null, fechaFin = null) {
    const where = {
      doctorId,
      activo: true,
    };

    if (fechaInicio && fechaFin) {
      where.OR = [
        {
          fechaInicio: { lte: parseSimpleDate(fechaFin) },
          fechaFin: { gte: parseSimpleDate(fechaInicio) },
        }
      ];
    }

    const bloqueos = await prisma.bloqueoAgenda.findMany({
      where,
      orderBy: { fechaInicio: 'asc' },
      include: {
        doctor: {
          select: { id: true, nombre: true, apellido: true }
        },
        creador: {
          select: { id: true, nombre: true, apellido: true }
        }
      }
    });

    return bloqueos;
  }

  /**
   * Obtener un bloqueo por ID
   *
   * @param {string} bloqueoId - ID del bloqueo
   * @returns {Promise<Object>} Bloqueo encontrado
   */
  async obtenerPorId(bloqueoId) {
    const bloqueo = await prisma.bloqueoAgenda.findUnique({
      where: { id: bloqueoId },
      include: {
        doctor: {
          select: { id: true, nombre: true, apellido: true }
        },
        creador: {
          select: { id: true, nombre: true, apellido: true }
        }
      }
    });

    if (!bloqueo) {
      throw new NotFoundError('Bloqueo no encontrado');
    }

    return bloqueo;
  }

  /**
   * Actualizar un bloqueo
   *
   * @param {string} bloqueoId - ID del bloqueo
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Bloqueo actualizado
   */
  async actualizarBloqueo(bloqueoId, data) {
    const bloqueoExistente = await this.obtenerPorId(bloqueoId);

    const updateData = {};

    if (data.fecha_inicio) updateData.fechaInicio = parseSimpleDate(data.fecha_inicio);
    if (data.fecha_fin) updateData.fechaFin = parseSimpleDate(data.fecha_fin);
    if (data.hora_inicio !== undefined) updateData.horaInicio = data.hora_inicio || null;
    if (data.hora_fin !== undefined) updateData.horaFin = data.hora_fin || null;
    if (data.motivo) updateData.motivo = data.motivo;
    if (data.tipo) updateData.tipo = data.tipo;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const bloqueo = await prisma.bloqueoAgenda.update({
      where: { id: bloqueoId },
      data: updateData,
      include: {
        doctor: {
          select: { id: true, nombre: true, apellido: true }
        }
      }
    });

    return bloqueo;
  }

  /**
   * Desactivar un bloqueo (soft delete)
   *
   * @param {string} bloqueoId - ID del bloqueo
   * @returns {Promise<Object>} Bloqueo desactivado
   */
  async desactivarBloqueo(bloqueoId) {
    await this.obtenerPorId(bloqueoId);

    const bloqueo = await prisma.bloqueoAgenda.update({
      where: { id: bloqueoId },
      data: { activo: false }
    });

    return bloqueo;
  }

  /**
   * Eliminar un bloqueo permanentemente
   *
   * @param {string} bloqueoId - ID del bloqueo
   */
  async eliminarBloqueo(bloqueoId) {
    await this.obtenerPorId(bloqueoId);

    await prisma.bloqueoAgenda.delete({
      where: { id: bloqueoId }
    });

    return { message: 'Bloqueo eliminado exitosamente' };
  }

  /**
   * Verificar si una fecha/hora está bloqueada para un doctor
   *
   * @param {string} doctorId - ID del doctor
   * @param {string} fecha - Fecha (YYYY-MM-DD)
   * @param {string} hora - Hora (HH:MM) - opcional
   * @returns {Promise<Object|null>} Bloqueo activo si existe, null si no
   */
  async verificarBloqueo(doctorId, fecha, hora = null) {
    const fechaDate = parseSimpleDate(fecha);

    const bloqueos = await prisma.bloqueoAgenda.findMany({
      where: {
        doctorId,
        activo: true,
        fechaInicio: { lte: fechaDate },
        fechaFin: { gte: fechaDate },
      }
    });

    if (bloqueos.length === 0) {
      return null;
    }

    for (const bloqueo of bloqueos) {
      // Si es bloqueo de día completo
      if (!bloqueo.horaInicio || !bloqueo.horaFin) {
        return {
          bloqueado: true,
          tipo: bloqueo.tipo,
          motivo: bloqueo.motivo,
          diaCompleto: true,
        };
      }

      // Si es bloqueo parcial y se especificó hora
      if (hora) {
        const horaNum = parseInt(hora.split(':')[0]) * 60 + parseInt(hora.split(':')[1]);
        const bloqueoInicioNum = parseInt(bloqueo.horaInicio.split(':')[0]) * 60 + parseInt(bloqueo.horaInicio.split(':')[1]);
        const bloqueoFinNum = parseInt(bloqueo.horaFin.split(':')[0]) * 60 + parseInt(bloqueo.horaFin.split(':')[1]);

        if (horaNum >= bloqueoInicioNum && horaNum < bloqueoFinNum) {
          return {
            bloqueado: true,
            tipo: bloqueo.tipo,
            motivo: bloqueo.motivo,
            diaCompleto: false,
            horaInicio: bloqueo.horaInicio,
            horaFin: bloqueo.horaFin,
          };
        }
      }
    }

    return null;
  }

  /**
   * Obtener resumen de bloqueos para un mes
   *
   * @param {string} doctorId - ID del doctor
   * @param {number} anio - Año
   * @param {number} mes - Mes (1-12)
   * @returns {Promise<Array>} Lista de días con bloqueos
   */
  async obtenerResumenMes(doctorId, anio, mes) {
    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);

    const bloqueos = await prisma.bloqueoAgenda.findMany({
      where: {
        doctorId,
        activo: true,
        fechaInicio: { lte: ultimoDia },
        fechaFin: { gte: primerDia },
      },
      select: {
        id: true,
        fechaInicio: true,
        fechaFin: true,
        horaInicio: true,
        horaFin: true,
        tipo: true,
        motivo: true,
      }
    });

    // Generar lista de días bloqueados
    const diasBloqueados = [];

    for (const bloqueo of bloqueos) {
      const inicio = new Date(Math.max(bloqueo.fechaInicio.getTime(), primerDia.getTime()));
      const fin = new Date(Math.min(bloqueo.fechaFin.getTime(), ultimoDia.getTime()));

      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        const fechaStr = d.toISOString().split('T')[0];
        const existente = diasBloqueados.find(db => db.fecha === fechaStr);

        if (existente) {
          existente.bloqueos.push({
            id: bloqueo.id,
            tipo: bloqueo.tipo,
            motivo: bloqueo.motivo,
            horaInicio: bloqueo.horaInicio,
            horaFin: bloqueo.horaFin,
            diaCompleto: !bloqueo.horaInicio,
          });
        } else {
          diasBloqueados.push({
            fecha: fechaStr,
            bloqueos: [{
              id: bloqueo.id,
              tipo: bloqueo.tipo,
              motivo: bloqueo.motivo,
              horaInicio: bloqueo.horaInicio,
              horaFin: bloqueo.horaFin,
              diaCompleto: !bloqueo.horaInicio,
            }]
          });
        }
      }
    }

    return diasBloqueados;
  }
}

module.exports = {
  bloqueoService: new BloqueoService(),
  TIPOS_BLOQUEO,
};
