/**
 * Utilidades de formateo
 * Centraliza el formateo de moneda, fechas, textos, etc.
 */

// Zona horaria de Colombia (Bogotá)
const TIMEZONE_BOGOTA = 'America/Bogota';

/**
 * Formatear moneda colombiana (COP)
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '$0';
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formatear fecha en formato corto (DD/MM/YYYY)
 * NOTA: Esta función convierte a zona horaria de Colombia.
 * Para fechas de tipo DATE (sin hora) usar formatDateOnly() en su lugar.
 */
export const formatDate = (date) => {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIMEZONE_BOGOTA
  });
};

/**
 * Formatear fecha de tipo DATE (sin componente de hora)
 * IMPORTANTE: Usar esta función para fechas que vienen de campos @db.Date de Prisma.
 * Estas fechas se almacenan como medianoche UTC y esta función extrae solo
 * la parte de fecha sin conversión de timezone.
 * @param {string|Date} date - Fecha en formato ISO o Date object
 * @param {string} format - Formato: 'short' (DD/MM/YYYY), 'medium' (DD mes YYYY), 'iso' (YYYY-MM-DD)
 * @returns {string} Fecha formateada
 */
export const formatDateOnly = (date, format = 'short') => {
  if (!date) return '';

  // Extraer la parte de fecha del string ISO (YYYY-MM-DD)
  let dateStr;
  if (typeof date === 'string') {
    // Si es ISO string, tomar solo la parte de fecha
    dateStr = date.split('T')[0];
  } else if (date instanceof Date) {
    // Si es Date object, convertir a ISO y tomar la parte de fecha
    dateStr = date.toISOString().split('T')[0];
  } else {
    return '';
  }

  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return '';

  switch (format) {
    case 'iso':
      return dateStr; // YYYY-MM-DD
    case 'medium':
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${parseInt(day)} ${meses[parseInt(month) - 1]} ${year}`; // 21 ene 2026
    case 'short':
    default:
      return `${day}/${month}/${year}`; // DD/MM/YYYY
  }
};

/**
 * Formatear fecha en formato largo (Lunes, 15 de enero de 2025)
 */
export const formatDateLong = (date) => {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: TIMEZONE_BOGOTA
  });
};

/**
 * Formatear fecha en formato ISO (YYYY-MM-DD) en zona horaria de Colombia
 * IMPORTANTE: No usar toISOString() ya que convierte a UTC y causa desfase de fechas
 */
export const formatDateISO = (date) => {
  if (!date) return '';

  const d = new Date(date);
  // Usar 'en-CA' locale que retorna formato YYYY-MM-DD
  return d.toLocaleDateString('en-CA', {
    timeZone: TIMEZONE_BOGOTA
  });
};

/**
 * Obtener la fecha de hoy en formato ISO (YYYY-MM-DD) en zona horaria de Colombia
 * Usar esta función en lugar de new Date().toISOString().split('T')[0]
 */
export const getTodayColombia = () => {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: TIMEZONE_BOGOTA
  });
};

/**
 * Obtener fecha y hora actual en Colombia
 * @returns {Date} Fecha ajustada a Colombia
 */
export const getNowColombia = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE_BOGOTA }));
};

/**
 * Formatear fecha y hora completa
 */
export const formatDateTime = (date) => {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIMEZONE_BOGOTA
  });
};

/**
 * Formatear hora (HH:MM)
 * IMPORTANTE: Para campos @db.Time de Prisma, extraer la hora del string ISO
 * sin conversión de timezone (similar a formatDateOnly para fechas).
 */
export const formatTime = (time) => {
  if (!time) return '';

  // Si ya es un string en formato HH:MM simple, retornarlo
  if (typeof time === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
    return time.substring(0, 5);
  }

  // Si es un string ISO (ej: "1970-01-01T08:00:00.000Z" de campo @db.Time)
  // Extraer la parte de hora sin conversión de timezone
  if (typeof time === 'string' && time.includes('T')) {
    const timePart = time.split('T')[1];
    if (timePart) {
      // Tomar solo HH:MM
      return timePart.substring(0, 5);
    }
  }

  // Fallback: usar conversión con timezone
  const d = new Date(time);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIMEZONE_BOGOTA
  });
};

/**
 * Capitalizar primera letra
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formatear nombre completo
 */
export const formatFullName = (nombre, apellido) => {
  const n = nombre ? capitalize(nombre) : '';
  const a = apellido ? capitalize(apellido) : '';
  return `${n} ${a}`.trim();
};

/**
 * Formatear documento (cédula)
 */
export const formatDocument = (cedula) => {
  if (!cedula) return '';
  
  // Formatear con separadores de miles
  return cedula.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Formatear número de teléfono
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.toString().replace(/\D/g, '');
  
  // Formato colombiano: (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * Truncar texto con ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Obtener iniciales de un nombre
 */
export const getInitials = (nombre, apellido) => {
  const n = nombre ? nombre.charAt(0).toUpperCase() : '';
  const a = apellido ? apellido.charAt(0).toUpperCase() : '';
  return `${n}${a}`;
};
