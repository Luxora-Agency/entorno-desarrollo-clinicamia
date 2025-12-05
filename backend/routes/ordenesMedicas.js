/**
 * Rutas de órdenes médicas
 */
const { Hono } = require('hono');
const ordenMedicaService = require('../services/ordenMedica.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const ordenesMedicas = new Hono();

// Todas las rutas requieren autenticación
ordenesMedicas.use('*', authMiddleware);

/**
 * GET /ordenes-medicas - Obtener todas las órdenes médicas
 */
ordenesMedicas.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await ordenMedicaService.getAll(query);
    return c.json(paginated(result.ordenes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /ordenes-medicas/:id - Obtener una orden médica por ID
 */
ordenesMedicas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const orden = await ordenMedicaService.getById(id);
    return c.json(success({ orden }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /ordenes-medicas - Crear una nueva orden médica
 */
ordenesMedicas.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR']), async (c) => {
  try {
    const body = await c.req.json();
    const orden = await ordenMedicaService.create(body);
    return c.json(success({ orden }, 'Orden médica creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /ordenes-medicas/:id - Actualizar una orden médica
 */
ordenesMedicas.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN']), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const orden = await ordenMedicaService.update(id, body);
    return c.json(success({ orden }, 'Orden médica actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /ordenes-medicas/:id/completar - Completar una orden médica
 */
ordenesMedicas.post('/:id/completar', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN']), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const user = c.get('user');
    const orden = await ordenMedicaService.completar(id, body, user.id);
    return c.json(success({ orden }, 'Orden médica completada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /ordenes-medicas/:id/cancelar - Cancelar una orden médica
 */
ordenesMedicas.post('/:id/cancelar', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR']), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const orden = await ordenMedicaService.cancelar(id, body.observaciones);
    return c.json(success({ orden }, 'Orden médica cancelada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /ordenes-medicas/:id - Eliminar una orden médica
 */
ordenesMedicas.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    await ordenMedicaService.delete(id);
    return c.json(success(null, 'Orden médica eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = ordenesMedicas;
