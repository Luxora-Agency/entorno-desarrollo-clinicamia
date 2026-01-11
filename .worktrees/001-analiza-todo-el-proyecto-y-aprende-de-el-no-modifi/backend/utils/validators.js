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

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUUID,
  validateRequired,
};
