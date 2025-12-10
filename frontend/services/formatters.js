/**
 * Utilidades de formateo
 * Centraliza el formateo de moneda, fechas, textos, etc.
 */

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
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
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
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}`;
};

/**
 * Formatear hora (HH:MM)
 */
export const formatTime = (time) => {
  if (!time) return '';
  
  // Si ya es un string en formato HH:MM, retornarlo
  if (typeof time === 'string' && time.includes(':')) {
    return time;
  }
  
  const d = new Date(time);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
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
