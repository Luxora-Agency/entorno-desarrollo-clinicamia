/**
 * Rutas de Administración de Medicamentos (Enfermería)
 */
const { Hono } = require('hono');
const administracionService = require('../services/administracion.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const administraciones = new Hono();

// Middleware de autenticación
administraciones.use('/*', authMiddleware);

/**
 * GET / - Obtener administraciones programadas
 */
administraciones.get('/', async (c) => {
  try {
    const { fecha, pacienteId, enfermera, estado, unidadId, page, limit } = c.req.query();

    const result = await administracionService.getAdministracionesProgramadas({
      fecha,
      pacienteId,
      enfermera,
      estado,
      unidadId,
      page,
      limit,
    });

    return c.json({
      success: true,
      ...result,
    }, 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /resumen-dia - Resumen de administraciones del día
 */
administraciones.get('/resumen-dia', async (c) => {
  try {
    const { fecha, unidadId } = c.req.query();
    const fechaUsar = fecha || new Date().toISOString().split('T')[0];
    
    const result = await administracionService.getResumenDia(fechaUsar, unidadId);
    return c.json(success(result), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /historial/:pacienteId - Historial de administración de un paciente
 */
administraciones.get('/historial/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const { limit } = c.req.query();
    
    const result = await administracionService.getHistorialPaciente(pacienteId, limit);
    return c.json(success(result), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pendientes/:pacienteId - Administraciones pendientes de un paciente
 */
administraciones.get('/pendientes/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const result = await administracionService.getAdministracionesPendientesPaciente(pacienteId);
    return c.json(success(result), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /:id/administrar - Registrar administración (Enfermería)
 */
administraciones.post('/:id/administrar', roleMiddleware(['NURSE', 'DOCTOR']), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const data = await c.req.json();
    
    const result = await administracionService.registrarAdministracion(id, data, user.id);
    return c.json(success(result, 'Administración registrada exitosamente'), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /:id/omitir - Registrar omisión (Enfermería)
 */
administraciones.post('/:id/omitir', roleMiddleware(['NURSE', 'DOCTOR']), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { motivo } = await c.req.json();
    
    const result = await administracionService.registrarOmision(id, motivo, user.id);
    return c.json(success(result, 'Omisión registrada'), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /:id/rechazar - Registrar rechazo del paciente (Enfermería)
 */
administraciones.post('/:id/rechazar', roleMiddleware(['NURSE', 'DOCTOR']), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { motivo } = await c.req.json();
    
    const result = await administracionService.registrarRechazo(id, motivo, user.id);
    return c.json(success(result, 'Rechazo registrado'), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = administraciones;