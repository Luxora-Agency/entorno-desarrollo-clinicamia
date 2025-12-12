/**
 * Rutas de citas
 */
const { Hono } = require('hono');
const citaService = require('../services/cita.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const citas = new Hono();

// Todas las rutas requieren autenticación
citas.use('*', authMiddleware);

// Todas las rutas requieren permiso al módulo 'citas'
citas.use('*', permissionMiddleware('citas'));

/**
 * GET /citas - Obtener todas las citas
 */
citas.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await citaService.getAll(query);
    return c.json(paginated(result.citas, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /citas/:id - Obtener una cita por ID
 */
citas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const cita = await citaService.getById(id);
    return c.json(success({ cita }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /citas - Crear una cita
 */
citas.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const cita = await citaService.create(data);
    return c.json(success({ cita }, 'Cita creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /citas/:id - Actualizar una cita
 */
citas.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const cita = await citaService.update(id, data);
    return c.json(success({ cita }, 'Cita actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PATCH /citas/:id - Actualizar parcialmente una cita (cambiar estado, asignar doctor, etc.)
 */
citas.patch('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const cita = await citaService.update(id, data);
    return c.json(success({ cita }, 'Cita actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /citas/:id - Cancelar una cita
 */
citas.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await citaService.cancel(id);
    return c.json(success(null, 'Cita cancelada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = citas;
