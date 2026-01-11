/**
 * Rutas para seguimientos y controles
 */
const { Hono } = require('hono');
const seguimientoService = require('../services/seguimiento.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const seguimientos = new Hono();

seguimientos.use('*', authMiddleware);

/**
 * POST /seguimientos - Crear nuevo seguimiento
 */
seguimientos.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const result = await seguimientoService.create(data);
    return c.json(success(result, 'Seguimiento creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * GET /seguimientos/paciente/:pacienteId - Obtener seguimientos de un paciente
 */
seguimientos.get('/paciente/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await seguimientoService.getByPaciente(pacienteId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /seguimientos/doctor/:doctorId/pendientes - Obtener seguimientos pendientes de un doctor
 */
seguimientos.get('/doctor/:doctorId/pendientes', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const data = await seguimientoService.getPendientesByDoctor(doctorId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /seguimientos/:id - Obtener seguimiento por ID
 */
seguimientos.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await seguimientoService.getById(id);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /seguimientos/:id/completar - Marcar como completado
 */
seguimientos.post('/:id/completar', async (c) => {
  try {
    const { id } = c.req.param();
    const { notas } = await c.req.json();
    const data = await seguimientoService.complete(id, notas);
    return c.json(success(data, 'Seguimiento completado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * PUT /seguimientos/:id/cita - Asociar cita generada
 */
seguimientos.put('/:id/cita', async (c) => {
  try {
    const { id } = c.req.param();
    const { citaGeneradaId } = await c.req.json();
    const data = await seguimientoService.asociarCita(id, citaGeneradaId);
    return c.json(success(data, 'Cita asociada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /seguimientos/:id/cancelar - Cancelar seguimiento
 */
seguimientos.post('/:id/cancelar', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await seguimientoService.cancel(id);
    return c.json(success(data, 'Seguimiento cancelado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

module.exports = seguimientos;
