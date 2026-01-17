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
 * Formatear fecha en formato ISO (YYYY-MM-DD)
 */
export const formatDateISO = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toISOString().split('T')[0];
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
 * Formatear hora (HH:MM) en zona horaria de Bogotá
 */
export const formatTime = (time) => {
  if (!time) return '';

  // Si ya es un string en formato HH:MM simple, retornarlo
  if (typeof time === 'string' && /^\d{2}:\d{2}/.test(time)) {
    return time.substring(0, 5);
  }

  // Si es un timestamp ISO o cualquier otro formato, convertir a hora Bogotá
  const d = new Date(time);
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
