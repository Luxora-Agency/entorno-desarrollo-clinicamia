/**
 * Rutas de órdenes de medicamentos
 */
const { Hono } = require('hono');
const ordenMedicamentoService = require('../services/ordenMedicamento.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const ordenesMedicamentos = new Hono();

// Todas las rutas requieren autenticación
ordenesMedicamentos.use('*', authMiddleware);

/**
 * GET /ordenes-medicamentos - Obtener todas las órdenes de medicamentos
 */
ordenesMedicamentos.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await ordenMedicamentoService.getAll(query);
    return c.json(paginated(result.ordenes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /ordenes-medicamentos/:id - Obtener una orden de medicamento por ID
 */
ordenesMedicamentos.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const orden = await ordenMedicamentoService.getById(id);
    return c.json(success({ orden }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /ordenes-medicamentos - Crear una nueva orden de medicamento
 */
ordenesMedicamentos.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const orden = await ordenMedicamentoService.create(body);
    return c.json(success({ orden }, 'Orden de medicamento creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /ordenes-medicamentos/:id - Actualizar una orden de medicamento
 */
ordenesMedicamentos.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const orden = await ordenMedicamentoService.update(id, body);
    return c.json(success({ orden }, 'Orden de medicamento actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /ordenes-medicamentos/:id/despachar - Despachar una orden de medicamento
 */
ordenesMedicamentos.post('/:id/despachar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const orden = await ordenMedicamentoService.despachar(id, user.id);
    return c.json(success({ orden }, 'Orden de medicamento despachada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /ordenes-medicamentos/:id/cancelar - Cancelar una orden de medicamento
 */
ordenesMedicamentos.post('/:id/cancelar', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const orden = await ordenMedicamentoService.cancelar(id, body.observaciones);
    return c.json(success({ orden }, 'Orden de medicamento cancelada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /ordenes-medicamentos/:id - Eliminar una orden de medicamento
 */
ordenesMedicamentos.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await ordenMedicamentoService.delete(id);
    return c.json(success(null, 'Orden de medicamento eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = ordenesMedicamentos;
