/**
 * Rutas de unidades hospitalarias
 */
const { Hono } = require('hono');
const unidadService = require('../services/unidad.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const unidad = new Hono();

// Todas las rutas requieren autenticación
unidad.use('*', authMiddleware);

/**
 * GET /unidades - Obtener todas las unidades
 */
unidad.get('/', async (c) => {
  try {
    const query = c.req.query();
    const unidades = await unidadService.getAll(query);
    return c.json(success({ unidades }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /unidades/:id - Obtener una unidad por ID
 */
unidad.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const unidad = await unidadService.getById(id);
    return c.json(success({ unidad }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /unidades - Crear una unidad
 */
unidad.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const data = await c.req.json();
    const unidad = await unidadService.create(data);
    return c.json(success({ unidad }, 'Unidad creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /unidades/:id - Actualizar una unidad
 */
unidad.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const unidad = await unidadService.update(id, data);
    return c.json(success({ unidad }, 'Unidad actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /unidades/:id - Eliminar una unidad
 */
unidad.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    await unidadService.delete(id);
    return c.json(success(null, 'Unidad eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = unidad;
