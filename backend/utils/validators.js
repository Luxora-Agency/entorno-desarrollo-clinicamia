/**
 * Validadores simples
 */

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  return password && password.length >= 6;
};

const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const validateRequired = (fields, data) => {
  const missing = [];
  fields.forEach(field => {
    if (!data[field]) {
      missing.push(field);
    }
  });
  return missing.length > 0 ? missing : null;
};

/**
 * Normaliza un texto removiendo acentos/tildes
 * Útil para búsquedas que deben ignorar acentos
 * @param {string} str - Texto a normalizar
 * @returns {string} Texto sin acentos
 */
const removeAccents = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUUID,
  validateRequired,
  removeAccents,
};
