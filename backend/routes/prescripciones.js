/**
 * Rutas de Prescripciones Médicas
 */
const { Hono } = require('hono');
const prescripcionService = require('../services/prescripcion.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const prescripciones = new Hono();

// Middleware de autenticación
prescripciones.use('/*', authMiddleware);

/**
 * GET / - Listar prescripciones
 */
prescripciones.get('/', async (c) => {
  try {
    const { page, limit, pacienteId, admisionId, medicoId, estado } = c.req.query();

    const result = await prescripcionService.getAll({
      page,
      limit,
      pacienteId,
      admisionId,
      medicoId,
      estado,
    });

    return c.json({
      success: true,
      ...result,
    }, 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /activas/:pacienteId - Obtener prescripciones activas de un paciente
 */
prescripciones.get('/activas/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const result = await prescripcionService.getPrescripcionesActivas(pacienteId);
    return c.json(success(result), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /:id - Obtener prescripción por ID
 */
prescripciones.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const prescripcion = await prescripcionService.getById(id);
    return c.json(success(prescripcion), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST / - Crear prescripción (solo Doctor)
 */
prescripciones.post('/', roleMiddleware(['DOCTOR']), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const result = await prescripcionService.create(data, user.id);
    
    return c.json({
      success: true,
      message: 'Prescripción creada exitosamente',
      data: result.prescripcion,
      alertas: result.alertas,
    }, 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /:id/suspender-producto - Suspender producto de una prescripción
 */
prescripciones.post('/:prescripcionProductoId/suspender', roleMiddleware(['DOCTOR']), async (c) => {
  try {
    const user = c.get('user');
    const { prescripcionProductoId } = c.req.param();
    const { motivo } = await c.req.json();
    
    const result = await prescripcionService.suspenderProducto(
      prescripcionProductoId,
      motivo,
      user.id
    );
    
    return c.json(success(result, 'Producto suspendido'), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /:id/completar - Completar prescripción
 */
prescripciones.post('/:id/completar', roleMiddleware(['DOCTOR']), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const result = await prescripcionService.completar(id, user.id);
    return c.json(success(result, 'Prescripción completada'), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /:id/cancelar - Cancelar prescripción
 */
prescripciones.post('/:id/cancelar', roleMiddleware(['DOCTOR']), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { motivo } = await c.req.json();
    const result = await prescripcionService.cancelar(id, motivo, user.id);
    return c.json(success(result, 'Prescripción cancelada'), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = prescripciones;