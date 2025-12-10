/**
 * Validadores de datos
 */

/**
 * Validar email
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validar cédula colombiana
 */
export const isValidCedula = (cedula) => {
  if (!cedula) return false;
  const cleaned = cedula.toString().replace(/\D/g, '');
  return cleaned.length >= 6 && cleaned.length <= 10;
};

/**
 * Validar teléfono colombiano
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.toString().replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 7;
};

/**
 * Validar fecha
 */
export const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

/**
 * Validar que fecha no sea futura
 */
export const isNotFutureDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  return d <= today;
};

/**
 * Validar que fecha no sea pasada
 */
export const isNotPastDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
};

/**
 * Validar rango de edad
 */
export const isValidAge = (birthDate, minAge = 0, maxAge = 120) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= minAge && age <= maxAge;
};

/**
 * Validar campo requerido
 */
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

/**
 * Validar longitud mínima
 */
export const minLength = (value, min) => {
  if (!value) return false;
  return value.toString().length >= min;
};

/**
 * Validar longitud máxima
 */
export const maxLength = (value, max) => {
  if (!value) return true;
  return value.toString().length <= max;
};

/**
 * Validar número positivo
 */
export const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

/**
 * Validar rango numérico
 */
export const isInRange = (value, min, max) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
};
