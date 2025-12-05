/**
 * Rutas de facturas
 */
const { Hono } = require('hono');
const facturaService = require('../services/factura.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const facturas = new Hono();

// Todas las rutas requieren autenticación
facturas.use('*', authMiddleware);

/**
 * GET /facturas - Obtener todas las facturas
 */
facturas.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await facturaService.getAll(query);
    return c.json(paginated(result.facturas, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /facturas/:id - Obtener una factura por ID
 */
facturas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const factura = await facturaService.getById(id);
    return c.json(success({ factura }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /facturas - Crear una nueva factura
 */
facturas.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    const factura = await facturaService.create(body, user.id);
    return c.json(success({ factura }, 'Factura creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /facturas/:id - Actualizar una factura
 */
facturas.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const factura = await facturaService.update(id, body);
    return c.json(success({ factura }, 'Factura actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /facturas/:id/pagos - Registrar un pago
 */
facturas.post('/:id/pagos', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const user = c.get('user');
    const pago = await facturaService.registrarPago(id, body, user.id);
    return c.json(success({ pago }, 'Pago registrado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /facturas/:id/cancelar - Cancelar una factura
 */
facturas.post('/:id/cancelar', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    await facturaService.cancelar(id, body.observaciones);
    return c.json(success(null, 'Factura cancelada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /facturas/:id - Eliminar una factura
 */
facturas.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    await facturaService.delete(id);
    return c.json(success(null, 'Factura eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = facturas;
