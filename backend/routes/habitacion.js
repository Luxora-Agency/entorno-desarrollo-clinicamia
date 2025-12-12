/**
 * Rutas de habitaciones
 */
const { Hono } = require('hono');
const habitacionService = require('../services/habitacion.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const habitacion = new Hono();

// Todas las rutas requieren autenticación
habitacion.use('*', authMiddleware);

/**
 * GET /habitaciones - Obtener todas las habitaciones
 */
habitacion.get('/', async (c) => {
  try {
    const query = c.req.query();
    const habitaciones = await habitacionService.getAll(query);
    return c.json(success({ habitaciones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /habitaciones/:id - Obtener una habitación por ID
 */
habitacion.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const habitacion = await habitacionService.getById(id);
    return c.json(success({ habitacion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /habitaciones - Crear una habitación
 */
habitacion.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const habitacion = await habitacionService.create(data);
    return c.json(success({ habitacion }, 'Habitación creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /habitaciones/:id - Actualizar una habitación
 */
habitacion.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const habitacion = await habitacionService.update(id, data);
    return c.json(success({ habitacion }, 'Habitación actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /habitaciones/:id - Eliminar una habitación
 */
habitacion.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await habitacionService.delete(id);
    return c.json(success(null, 'Habitación eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = habitacion;
