/**
 * Rutas de autenticación
 */
const { Hono } = require('hono');
const authService = require('../services/auth.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const auth = new Hono();

// Simple in-memory rate limiter
const rateLimit = new Map();

const rateLimiter = (limit, windowMs) => async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  const record = rateLimit.get(ip) || { count: 0, resetTime: now + windowMs };
  
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }
  
  record.count++;
  rateLimit.set(ip, record);
  
  if (record.count > limit) {
    return c.json(error('Demasiadas peticiones, intente más tarde'), 429);
  }
  
  await next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario
 *           example: admin@clinicamia.com
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario
 *           example: admin123
 *     RegisterInput:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *       properties:
 *         nombre:
 *           type: string
 *           description: Nombre completo del usuario
 *           example: Juan Pérez
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico único
 *           example: juan.perez@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           description: Contraseña (mínimo 6 caracteres)
 *         rol:
 *           type: string
 *           format: uuid
 *           description: ID del rol a asignar (opcional, por defecto usuario básico)
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos inválidos o usuario ya existente
 *       500:
 *         description: Error del servidor
 */
auth.post('/register', rateLimiter(5, 60 * 60 * 1000), async (c) => { // 5 requests per hour per IP for register
  try {
    const data = await c.req.json();
    const result = await authService.register(data);
    return c.json(success(result, 'Usuario registrado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: |
 *       Autentica un usuario con email y contraseña.
 *       - Rate limit: 10 intentos por minuto
 *       - Bloqueo automático: 5 intentos fallidos = 15 minutos de bloqueo
 *       - Devuelve access token (15 min) y refresh token (7 días)
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *           example:
 *             email: "doctor@clinicamia.com"
 *             password: "doctor123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login exitoso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT de acceso (15 min expiry)
 *                     refreshToken:
 *                       type: string
 *                       description: Token de refresco (7 días expiry)
 *                     user:
 *                       $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Credenciales inválidas
 *       401:
 *         description: Cuenta bloqueada por intentos fallidos
 *       429:
 *         description: Demasiadas peticiones
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
auth.post('/login', rateLimiter(10, 60 * 1000), async (c) => { // 10 requests per minute
  try {
    const { email, password } = await c.req.json();
    const result = await authService.login(email, password);
    return c.json(success(result, 'Login exitoso'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renovar access token
 *     description: |
 *       Usa un refresh token válido para obtener un nuevo par de tokens.
 *       El refresh token anterior se invalida (rotación de tokens).
 *       Rate limit: 20 peticiones por minuto.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token obtenido en el login
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token renovado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: Nuevo JWT de acceso
 *                     refreshToken:
 *                       type: string
 *                       description: Nuevo refresh token (el anterior ya no es válido)
 *       401:
 *         description: Refresh token inválido, expirado o ya usado
 *       429:
 *         description: Demasiadas peticiones
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
auth.post('/refresh', rateLimiter(20, 60 * 1000), async (c) => {
  try {
    const { refreshToken } = await c.req.json();
    const result = await authService.refreshToken(refreshToken);
    return c.json(success(result, 'Token renovado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: |
 *       Invalida el refresh token del usuario, cerrando la sesión de forma segura.
 *       El cliente debe eliminar los tokens almacenados localmente.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token a invalidar
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sesión cerrada exitosamente"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
auth.post('/logout', async (c) => {
  try {
    const { refreshToken } = await c.req.json();
    await authService.logout(refreshToken);
    return c.json(success(null, 'Sesión cerrada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: Datos del usuario
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
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
