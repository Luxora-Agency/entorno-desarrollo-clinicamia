const { z } = require('zod');
const { error } = require('../utils/response');

const validate = (schema) => async (c, next) => {
  try {
    const body = await c.req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      // Zod v3 usa .errors, algunos adaptadores usan .issues
      const errors = result.error.errors || result.error.issues || [];
      const formattedErrors = errors.map((err) => ({
        path: err.path,
        message: err.message,
      }));
      return c.json(error('Error de validación', formattedErrors), 400);
    }
    c.req.validData = result.data;
    await next();
  } catch (err) {
    console.error('Validation Middleware Error:', err);
    return c.json(error('JSON inválido'), 400);
  }
};

module.exports = { validate };
