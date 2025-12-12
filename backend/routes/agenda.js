/**
 * Rutas de Agenda - Para gestión de bloques horarios
 */
const { Hono } = require('hono');
const agendaService = require('../services/agenda.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const agenda = new Hono();

// Autenticación para todas las rutas
agenda.use('*', authMiddleware);

// Verificación de permisos (solo recepcionistas, admins y superadmins)
agenda.use('*', permissionMiddleware('citas'));

/**
 * GET /agenda/bloques/:doctorId - Obtener bloques horarios de un doctor
 * Query params: fecha (YYYY-MM-DD)
 */
agenda.get('/bloques/:doctorId', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const { fecha } = c.req.query();

    if (!fecha) {
      return c.json(error('Fecha es requerida'), 400);
    }

    const bloques = await agendaService.generarBloques(doctorId, fecha);
    return c.json(success({ bloques }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /agenda/citas - Obtener citas filtradas
 * Query params: fecha (YYYY-MM-DD), doctorId (opcional)
 */
agenda.get('/citas', async (c) => {
  try {
    const { fecha, doctorId } = c.req.query();

    if (!fecha) {
      return c.json(error('Fecha es requerida'), 400);
    }

    const citas = await agendaService.obtenerCitasPorFiltros(fecha, doctorId);
    return c.json(success({ citas, total: citas.length }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /agenda/doctores - Obtener lista de doctores activos
 */
agenda.get('/doctores', async (c) => {
  try {
    const doctores = await agendaService.obtenerDoctoresActivos();
    return c.json(success({ doctores }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = agenda;
