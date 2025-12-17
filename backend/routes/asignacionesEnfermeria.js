/**
 * Rutas de Asignaciones de Enfermería
 */
const { Hono } = require('hono');
const asignacionService = require('../services/asignacionEnfermeria.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const asignaciones = new Hono();

asignaciones.use('/*', authMiddleware);

/**
 * POST / - Crear asignación
 */
asignaciones.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const asignacion = await asignacionService.crear(data);
    return c.json(success({ asignacion }, 'Asignación creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /enfermera/:enfermeraId - Obtener asignaciones de una enfermera
 */
asignaciones.get('/enfermera/:enfermeraId', async (c) => {
  try {
    const { enfermeraId } = c.req.param();
    const asignaciones = await asignacionService.obtenerPorEnfermera(enfermeraId);
    return c.json(success({ asignaciones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pacientes/:enfermeraId - Obtener pacientes asignados
 */
asignaciones.get('/pacientes/:enfermeraId', async (c) => {
  try {
    const { enfermeraId } = c.req.param();
    const pacientes = await asignacionService.obtenerPacientesAsignados(enfermeraId);
    return c.json(success({ pacientes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /:id/desactivar - Desactivar asignación
 */
asignaciones.put('/:id/desactivar', async (c) => {
  try {
    const { id } = c.req.param();
    const asignacion = await asignacionService.desactivar(id);
    return c.json(success({ asignacion }, 'Asignación desactivada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = asignaciones;
