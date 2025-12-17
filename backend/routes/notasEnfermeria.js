/**
 * Rutas de Notas de Enfermería
 */
const { Hono } = require('hono');
const notaService = require('../services/notaEnfermeria.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const notasEnfermeria = new Hono();

notasEnfermeria.use('/*', authMiddleware);

/**
 * POST / - Crear nota
 */
notasEnfermeria.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const nota = await notaService.crear(data);
    return c.json(success({ nota }, 'Nota registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /admision/:admisionId - Notas de una admisión
 */
notasEnfermeria.get('/admision/:admisionId', async (c) => {
  try {
    const { admisionId } = c.req.param();
    const { limit } = c.req.query();
    const notas = await notaService.obtenerPorAdmision(admisionId, limit);
    return c.json(success({ notas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /paciente/:pacienteId - Notas de un paciente
 */
notasEnfermeria.get('/paciente/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const { limit } = c.req.query();
    const notas = await notaService.obtenerPorPaciente(pacienteId, limit);
    return c.json(success({ notas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /enfermera/:enfermeraId - Notas de una enfermera (turno actual)
 */
notasEnfermeria.get('/enfermera/:enfermeraId', async (c) => {
  try {
    const { enfermeraId } = c.req.param();
    const { fecha, turno } = c.req.query();
    const notas = await notaService.obtenerPorEnfermera(enfermeraId, fecha, turno);
    return c.json(success({ notas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = notasEnfermeria;
