/**
 * Utilidades para respuestas HTTP estandarizadas
 */

const success = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

const error = (message = 'Error', details = null) => {
  return {
    success: false,
    message,
    ...(details && { details }),
  };
};

const paginated = (data, pagination) => {
  return {
    success: true,
    data,
    pagination,
  };
};

module.exports = {
  success,
  error,
  paginated,
};
