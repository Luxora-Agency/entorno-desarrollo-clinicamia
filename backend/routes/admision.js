/**
 * Rutas de admisiones/hospitalizaciones
 */
const { Hono } = require('hono');
const admisionService = require('../services/admision.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const admision = new Hono();

// Todas las rutas requieren autenticación
admision.use('*', authMiddleware);

/**
 * GET /admisiones - Obtener todas las admisiones
 */
admision.get('/', async (c) => {
  try {
    const query = c.req.query();
    const admisiones = await admisionService.getAll(query);
    return c.json(success({ admisiones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /admisiones/:id - Obtener una admisión por ID
 */
admision.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const admision = await admisionService.getById(id);
    return c.json(success({ admision }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /admisiones - Crear una admisión (iniciar hospitalización)
 */
admision.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR']), async (c) => {
  try {
    const data = await c.req.json();
    const admision = await admisionService.create(data);
    return c.json(success({ admision }, 'Admisión registrada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /admisiones/:id/egreso - Registrar egreso
 */
admision.post('/:id/egreso', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const admision = await admisionService.egreso(id, data);
    return c.json(success({ admision }, 'Egreso registrado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /admisiones/:id - Eliminar una admisión
 */
admision.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    await admisionService.delete(id);
    return c.json(success(null, 'Admisión eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = admision;
