/**
 * Rutas de especialidades
 */
const { Hono } = require('hono');
const especialidadService = require('../services/especialidad.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const especialidades = new Hono();

// Todas las rutas requieren autenticación
especialidades.use('*', authMiddleware);

/**
 * GET /especialidades - Obtener todas las especialidades
 */
especialidades.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await especialidadService.getAll(query);
    return c.json(paginated(result.especialidades, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /especialidades/:id - Obtener una especialidad por ID
 */
especialidades.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const especialidad = await especialidadService.getById(id);
    return c.json(success({ especialidad }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /especialidades - Crear una especialidad
 */
especialidades.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const especialidad = await especialidadService.create(data);
    return c.json(success({ especialidad }, 'Especialidad creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /especialidades/:id - Actualizar una especialidad
 */
especialidades.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const especialidad = await especialidadService.update(id, data);
    return c.json(success({ especialidad }, 'Especialidad actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /especialidades/:id - Eliminar una especialidad
 */
especialidades.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await especialidadService.delete(id);
    return c.json(success(null, 'Especialidad eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = especialidades;
