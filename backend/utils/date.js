/**
 * Utilidades para manejo seguro de fechas
 * Evita errores de "Invalid Date" en Prisma
 *
 * IMPORTANTE: El sistema almacena fechas en UTC.
 * La zona horaria de Colombia es UTC-5 (America/Bogota).
 */

// Zona horaria de Colombia
const TIMEZONE_COLOMBIA = 'America/Bogota';
const TIMEZONE_OFFSET_HOURS = -5;

/**
 * Convierte un valor a Date de forma segura
 * @param {string|Date|null|undefined} value - Valor a convertir
 * @returns {Date|null} - Fecha válida o null
 */
function safeDate(value) {
  // Retornar null para valores vacíos o inválidos
  if (!value || value === '' || value === null || value === undefined) {
    return null;
  }

  // Si ya es una fecha, validar que sea válida
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Intentar convertir string a fecha
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Convierte una fecha string (YYYY-MM-DD) a Date sin conversión de timezone
 * Útil para fechas que deben mantenerse exactas (sin ajuste de zona horaria)
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {Date|null} - Fecha en UTC a medianoche
 */
function parseSimpleDate(dateString) {
  if (!dateString) return null;
  // Crear fecha a medianoche UTC
  const date = new Date(dateString + 'T00:00:00.000Z');
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Convierte una hora string (HH:MM o HH:MM:SS) a objeto Date
 * Usa fecha epoch (1970-01-01) para consistencia
 * @param {string} timeString - Hora en formato HH:MM o HH:MM:SS
 * @returns {Date|null} - Date con la hora especificada
 */
function parseTimeString(timeString) {
  if (!timeString) return null;
  // Asegurar formato HH:MM:SS
  const normalized = timeString.length === 5 ? `${timeString}:00` : timeString;
  const date = new Date(`1970-01-01T${normalized}Z`);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Extrae la hora de una fecha ISO como string HH:MM
 * @param {Date|string} dateOrIsoString - Fecha o string ISO
 * @returns {string} - Hora en formato HH:MM
 */
function extractTimeString(dateOrIsoString) {
  if (!dateOrIsoString) return '00:00';

  let isoString;
  if (dateOrIsoString instanceof Date) {
    isoString = dateOrIsoString.toISOString();
  } else {
    isoString = dateOrIsoString;
  }

  // Formato ISO: 1970-01-01T08:30:00.000Z
  const timePart = isoString.split('T')[1];
  return timePart ? timePart.substring(0, 5) : '00:00';
}

/**
 * Obtiene la fecha actual en hora de Colombia
 * @returns {Date} - Fecha actual en Colombia
 */
function nowColombia() {
  const now = new Date();
  // Ajustar offset de UTC a Colombia
  return new Date(now.getTime() + (TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000));
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (hora Colombia)
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
function todayString() {
  // Usar toLocaleDateString con locale en-CA que retorna YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', {
    timeZone: TIMEZONE_COLOMBIA
  });
}

/**
 * Formatea una fecha a formato ISO (YYYY-MM-DD) en zona horaria de Colombia
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
function formatDateISOColombia(date) {
  if (!date) return '';
  const d = safeDate(date);
  if (!d) return '';

  return d.toLocaleDateString('en-CA', {
    timeZone: TIMEZONE_COLOMBIA
  });
}

/**
 * Compara si dos horas se superponen dado un rango de duración
 * @param {string} hora1Inicio - Hora de inicio del primer rango (HH:MM)
 * @param {number} duracion1 - Duración en minutos del primer rango
 * @param {string} hora2Inicio - Hora de inicio del segundo rango (HH:MM)
 * @param {number} duracion2 - Duración en minutos del segundo rango
 * @returns {boolean} - true si hay superposición
 */
function horasSeSuperponen(hora1Inicio, duracion1, hora2Inicio, duracion2) {
  const t1Start = parseTimeString(hora1Inicio);
  const t1End = new Date(t1Start.getTime() + duracion1 * 60 * 1000);

  const t2Start = parseTimeString(hora2Inicio);
  const t2End = new Date(t2Start.getTime() + duracion2 * 60 * 1000);

  // Superposición: (StartA < EndB) AND (EndA > StartB)
  return t1Start < t2End && t1End > t2Start;
}

/**
 * Calcula el fin de una hora dada la duración en minutos
 * @param {string} horaInicio - Hora de inicio (HH:MM)
 * @param {number} duracionMinutos - Duración en minutos
 * @returns {string} - Hora de fin (HH:MM)
 */
function calcularHoraFin(horaInicio, duracionMinutos) {
  const inicio = parseTimeString(horaInicio);
  const fin = new Date(inicio.getTime() + duracionMinutos * 60 * 1000);
  return extractTimeString(fin);
}

/**
 * Valida que una duración sea razonable para una cita
 * @param {number} duracionMinutos - Duración en minutos
 * @param {number} minimo - Duración mínima (default 5)
 * @param {number} maximo - Duración máxima (default 480 = 8 horas)
 * @returns {boolean} - true si es válida
 */
function duracionValida(duracionMinutos, minimo = 5, maximo = 480) {
  const dur = parseInt(duracionMinutos);
  return !isNaN(dur) && dur >= minimo && dur <= maximo;
}

/**
 * Formatea una fecha en zona horaria de Colombia
 * @param {Date|string} date - Fecha a formatear
 * @param {object} options - Opciones de formateo adicionales
 * @returns {string} - Fecha formateada
 */
function formatDateColombia(date, options = {}) {
  if (!date) return '';
  const d = safeDate(date);
  if (!d) return '';

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIMEZONE_COLOMBIA,
    ...options
  };

  return d.toLocaleDateString('es-CO', defaultOptions);
}

/**
 * Formatea fecha y hora en zona horaria de Colombia
 * @param {Date|string} date - Fecha a formatear
 * @param {object} options - Opciones de formateo adicionales
 * @returns {string} - Fecha y hora formateada
 */
function formatDateTimeColombia(date, options = {}) {
  if (!date) return '';
  const d = safeDate(date);
  if (!d) return '';

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIMEZONE_COLOMBIA,
    ...options
  };

  return d.toLocaleString('es-CO', defaultOptions);
}

/**
 * Formatea fecha en formato largo en zona horaria de Colombia
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada (ej: "Lunes, 15 de enero de 2025")
 */
function formatDateLongColombia(date) {
  if (!date) return '';
  const d = safeDate(date);
  if (!d) return '';

  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: TIMEZONE_COLOMBIA
  });
}

/**
 * Formatea hora en zona horaria de Colombia
 * @param {Date|string} date - Fecha/hora a formatear
 * @returns {string} - Hora formateada (HH:MM)
 */
function formatTimeColombia(date) {
  if (!date) return '';
  const d = safeDate(date);
  if (!d) return '';

  return d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIMEZONE_COLOMBIA
  });
}

module.exports = {
  safeDate,
  parseSimpleDate,
  parseTimeString,
  extractTimeString,
  nowColombia,
  todayString,
  horasSeSuperponen,
  calcularHoraFin,
  duracionValida,
  formatDateColombia,
  formatDateTimeColombia,
  formatDateLongColombia,
  formatTimeColombia,
  formatDateISOColombia,
  TIMEZONE_COLOMBIA,
  TIMEZONE_OFFSET_HOURS
};
