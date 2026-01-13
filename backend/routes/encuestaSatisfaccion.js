/**
 * Rutas de Encuestas de Satisfacción
 * Incluye endpoints públicos (para responder) y privados (para gestión)
 */
const { Hono } = require('hono');
const encuestaSatisfaccionService = require('../services/encuestaSatisfaccion.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const encuestaSatisfaccion = new Hono();

// ============================================
// ENDPOINTS PÚBLICOS (Sin autenticación)
// ============================================

/**
 * Obtener encuesta por token (para página de respuesta)
 * GET /encuestas-satisfaccion/publica/:token
 */
encuestaSatisfaccion.get('/publica/:token', async (c) => {
  try {
    const { token } = c.req.param();
    const encuesta = await encuestaSatisfaccionService.getByToken(token);

    // Solo retornar datos necesarios para el formulario
    return c.json(success({
      id: encuesta.id,
      nombreDoctor: encuesta.nombreDoctor,
      especialidad: encuesta.especialidad,
      fechaEncuesta: encuesta.fechaEncuesta,
      respondido: encuesta.respondido
    }, 'Encuesta encontrada'));
  } catch (err) {
    const status = err.statusCode || 500;
    return c.json(error(err.message), status);
  }
});

/**
 * Responder encuesta (endpoint público)
 * POST /encuestas-satisfaccion/publica/:token/responder
 */
encuestaSatisfaccion.post('/publica/:token/responder', async (c) => {
  try {
    const { token } = c.req.param();
    const body = await c.req.json();

    // Obtener IP del cliente
    const ipOrigen = c.req.header('x-forwarded-for') ||
                     c.req.header('x-real-ip') ||
                     'unknown';

    const encuesta = await encuestaSatisfaccionService.responderEncuesta(token, body, ipOrigen);

    return c.json(success({
      id: encuesta.id,
      respondido: encuesta.respondido,
      fechaRespuesta: encuesta.fechaRespuesta
    }, '¡Gracias por tu opinión! Tu respuesta ha sido registrada.'));
  } catch (err) {
    const status = err.statusCode || 500;
    return c.json(error(err.message), status);
  }
});

// ============================================
// ENDPOINTS PRIVADOS (Requieren autenticación)
// ============================================

// Aplicar autenticación a todas las rutas siguientes
encuestaSatisfaccion.use('/*', authMiddleware);

/**
 * Listar todas las encuestas (admin/calidad)
 * GET /encuestas-satisfaccion
 */
encuestaSatisfaccion.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await encuestaSatisfaccionService.getAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * Estadísticas de satisfacción por doctor
 * GET /encuestas-satisfaccion/estadisticas/doctor/:doctorId
 */
encuestaSatisfaccion.get('/estadisticas/doctor/:doctorId', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const { fechaDesde, fechaHasta } = c.req.query();

    const estadisticas = await encuestaSatisfaccionService.getEstadisticasDoctor(
      doctorId,
      fechaDesde,
      fechaHasta
    );

    return c.json(success(estadisticas, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * Mis estadísticas de satisfacción (para doctores)
 * GET /encuestas-satisfaccion/mis-estadisticas
 */
encuestaSatisfaccion.get('/mis-estadisticas', async (c) => {
  try {
    const user = c.get('user');
    const { fechaDesde, fechaHasta } = c.req.query();

    const estadisticas = await encuestaSatisfaccionService.getEstadisticasDoctor(
      user.id,
      fechaDesde,
      fechaHasta
    );

    return c.json(success(estadisticas, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * Ranking de doctores por satisfacción
 * GET /encuestas-satisfaccion/ranking
 */
encuestaSatisfaccion.get('/ranking', async (c) => {
  try {
    const { limit } = c.req.query();
    const ranking = await encuestaSatisfaccionService.getRankingDoctores(
      limit ? parseInt(limit) : 10
    );
    return c.json(success(ranking, 'Ranking obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * Crear encuesta manualmente (para testing o casos especiales)
 * POST /encuestas-satisfaccion
 */
encuestaSatisfaccion.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const encuesta = await encuestaSatisfaccionService.crearEncuestaPostConsulta(body);
    return c.json(success(encuesta, 'Encuesta creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = encuestaSatisfaccion;
