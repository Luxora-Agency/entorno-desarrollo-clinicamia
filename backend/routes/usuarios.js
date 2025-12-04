/**
 * Rutas de usuarios
 */
const { Hono } = require('hono');
const usuarioService = require('../services/usuario.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const usuarios = new Hono();

// Todas las rutas requieren autenticación
usuarios.use('*', authMiddleware);

/**
 * GET /usuarios/no-pacientes - Obtener usuarios sin pacientes
 */
usuarios.get('/no-pacientes', async (c) => {
  try {
    const usuarios = await usuarioService.getAllNonPatients();
    return c.json(success({ usuarios }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = usuarios;
