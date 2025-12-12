/**
 * Rutas de movimientos de pacientes
 */
const { Hono } = require('hono');
const movimientoService = require('../services/movimiento.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const movimiento = new Hono();

// Todas las rutas requieren autenticación
movimiento.use('*', authMiddleware);

/**
 * GET /movimientos - Obtener todos los movimientos
 */
movimiento.get('/', async (c) => {
  try {
    const query = c.req.query();
    const movimientos = await movimientoService.getAll(query);
    return c.json(success({ movimientos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /movimientos/:id - Obtener un movimiento por ID
 */
movimiento.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const movimiento = await movimientoService.getById(id);
    return c.json(success({ movimiento }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /movimientos - Crear un movimiento (traslado)
 */
movimiento.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const movimiento = await movimientoService.create(data);
    return c.json(success({ movimiento }, 'Movimiento registrado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /movimientos/:id - Eliminar un movimiento
 */
movimiento.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await movimientoService.delete(id);
    return c.json(success(null, 'Movimiento eliminado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = movimiento;
