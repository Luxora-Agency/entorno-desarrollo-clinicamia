/**
 * Rutas de Alertas Clínicas
 */
const { Hono } = require('hono');
const alertaService = require('../services/alertaClinica.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const alertas = new Hono();

// Todas las rutas requieren autenticación
alertas.use('*', authMiddleware);

/**
 * GET /alertas - Obtener todas las alertas
 */
alertas.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await alertaService.getAll(query);
    return c.json(paginated(result.alertas, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /alertas/:id - Obtener una alerta por ID
 */
alertas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const alerta = await alertaService.getById(id);
    return c.json(success({ alerta }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /alertas/activas/:paciente_id - Obtener alertas activas de un paciente
 */
alertas.get('/activas/:paciente_id', async (c) => {
  try {
    const { paciente_id } = c.req.param();
    const alertasActivas = await alertaService.getAlertasActivas(paciente_id);
    return c.json(success({ alertas: alertasActivas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /alertas - Crear nueva alerta
 */
alertas.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']), async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const alerta = await alertaService.create(body, user.id, user, ipOrigen);
    return c.json(success({ alerta }, 'Alerta clínica creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /alertas/:id/reconocer - Reconocer una alerta
 */
alertas.post('/:id/reconocer', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const alerta = await alertaService.reconocer(id, user.id, user, ipOrigen);
    return c.json(success({ alerta }, 'Alerta reconocida correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /alertas/:id - Eliminar alerta
 */
alertas.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR']), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    
    await alertaService.delete(id, user.id, user);
    return c.json(success(null, 'Alerta eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = alertas;
