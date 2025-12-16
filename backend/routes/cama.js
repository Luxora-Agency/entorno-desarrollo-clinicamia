/**
 * Rutas de camas
 */
const { Hono } = require('hono');
const camaService = require('../services/cama.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const cama = new Hono();

// Todas las rutas requieren autenticación
cama.use('/*', authMiddleware);

/**
 * GET /camas/mapa - Obtener mapa completo de ocupación (para vista de hospitalización)
 */
cama.get('/mapa', async (c) => {
  try {
    const { unidadId } = c.req.query();
    const mapa = await camaService.getMapaOcupacion(unidadId);
    return c.json(success(mapa));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /camas/estadisticas - Obtener estadísticas de ocupación
 */
cama.get('/estadisticas', async (c) => {
  try {
    const { unidadId } = c.req.query();
    const estadisticas = await camaService.getEstadisticas(unidadId);
    return c.json(success(estadisticas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

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
cama.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const cama = await camaService.create(data);
    return c.json(success({ cama }, 'Cama creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PATCH /camas/:id/estado - Cambiar estado de una cama
 */
cama.post('/:id/estado', async (c) => {
  try {
    const { id } = c.req.param();
    const { estado, motivo } = await c.req.json();
    const cama = await camaService.cambiarEstado(id, estado, motivo);
    return c.json(success({ cama }, 'Estado de cama actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /camas/:id - Actualizar una cama
 */
cama.put('/:id', async (c) => {
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
cama.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await camaService.delete(id);
    return c.json(success(null, 'Cama eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = cama;
