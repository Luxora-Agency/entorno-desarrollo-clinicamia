/**
 * Rutas para incapacidades médicas
 */
const { Hono } = require('hono');
const incapacidadService = require('../services/incapacidad.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const incapacidades = new Hono();

incapacidades.use('*', authMiddleware);

/**
 * POST /incapacidades - Crear nueva incapacidad
 */
incapacidades.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const result = await incapacidadService.create(data);
    return c.json(success(result, 'Incapacidad creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * GET /incapacidades/paciente/:pacienteId - Obtener incapacidades de un paciente
 */
incapacidades.get('/paciente/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await incapacidadService.getByPaciente(pacienteId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /incapacidades/doctor/:doctorId - Obtener incapacidades emitidas por un doctor
 */
incapacidades.get('/doctor/:doctorId', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const filtros = c.req.query();
    const data = await incapacidadService.getByDoctor(doctorId, filtros);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /incapacidades/:id - Obtener incapacidad por ID
 */
incapacidades.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await incapacidadService.getById(id);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * PUT /incapacidades/:id/pdf - Actualizar URL del PDF
 */
incapacidades.put('/:id/pdf', async (c) => {
  try {
    const { id } = c.req.param();
    const { pdfUrl } = await c.req.json();
    const data = await incapacidadService.updatePdfUrl(id, pdfUrl);
    return c.json(success(data, 'PDF actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /incapacidades/:id/cancelar - Cancelar incapacidad
 */
incapacidades.post('/:id/cancelar', async (c) => {
  try {
    const { id } = c.req.param();
    const { motivo } = await c.req.json();
    const data = await incapacidadService.cancel(id, motivo);
    return c.json(success(data, 'Incapacidad cancelada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

module.exports = incapacidades;
