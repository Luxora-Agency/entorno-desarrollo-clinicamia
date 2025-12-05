/**
 * Rutas de camas
 */
const { Hono } = require('hono');
const camaService = require('../services/cama.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const cama = new Hono();

// Todas las rutas requieren autenticación
cama.use('*', authMiddleware);

/**
 * GET /camas/disponibles - Obtener camas disponibles
 */
cama.get('/disponibles', async (c) => {
  try {
    const { unidadId } = c.req.query();
    const camas = await camaService.getDisponibles(unidadId);
    return c.json(success({ camas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /camas - Obtener todas las camas
 */
cama.get('/', async (c) => {
  try {
    const query = c.req.query();
    const camas = await camaService.getAll(query);
    return c.json(success({ camas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /camas/:id - Obtener una cama por ID
 */
cama.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const cama = await camaService.getById(id);
    return c.json(success({ cama }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /camas - Crear una cama
 */
cama.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const data = await c.req.json();
    const cama = await camaService.create(data);
    return c.json(success({ cama }, 'Cama creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /camas/:id - Actualizar una cama
 */
cama.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const cama = await camaService.update(id, data);
    return c.json(success({ cama }, 'Cama actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /camas/:id - Eliminar una cama
 */
cama.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    await camaService.delete(id);
    return c.json(success(null, 'Cama eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = cama;
