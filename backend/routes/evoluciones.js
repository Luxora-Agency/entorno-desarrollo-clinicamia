/**
 * Rutas de Evoluciones Clínicas (SOAP)
 */
const { Hono } = require('hono');
const evolucionService = require('../services/evolucionClinica.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const evoluciones = new Hono();

// Todas las rutas requieren autenticación
evoluciones.use('*', authMiddleware);

/**
 * GET /evoluciones - Obtener todas las evoluciones
 */
evoluciones.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await evolucionService.getAll(query);
    return c.json(paginated(result.evoluciones, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /evoluciones/:id - Obtener una evolución por ID
 */
evoluciones.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const evolucion = await evolucionService.getById(id);
    return c.json(success({ evolucion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /evoluciones - Crear nueva evolución clínica
 */
evoluciones.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const evolucion = await evolucionService.create(body, user.id, user, ipOrigen);
    return c.json(success({ evolucion }, 'Evolución clínica creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /evoluciones/:id/firmar - Firmar evolución clínica
 */
evoluciones.post('/:id/administrar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const evolucion = await evolucionService.firmar(id, user.id, user, ipOrigen);
    return c.json(success({ evolucion }, 'Evolución firmada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /evoluciones/:id - Eliminar evolución (solo si no está firmada)
 */
evoluciones.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    
    await evolucionService.delete(id, user.id, user);
    return c.json(success(null, 'Evolución eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = evoluciones;
