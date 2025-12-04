/**
 * Rutas de autenticación
 */
const { Hono } = require('hono');
const authService = require('../services/auth.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const auth = new Hono();

/**
 * POST /auth/register - Registrar usuario
 */
auth.post('/register', async (c) => {
  try {
    const data = await c.req.json();
    const result = await authService.register(data);
    return c.json(success(result, 'Usuario registrado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /auth/login - Iniciar sesión
 */
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    const result = await authService.login(email, password);
    return c.json(success(result, 'Login exitoso'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /auth/me - Obtener perfil del usuario autenticado
 */
auth.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('user').id;
    const user = await authService.getProfile(userId);
    return c.json(success({ user }, 'Perfil obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = auth;
