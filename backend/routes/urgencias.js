/**
 * Rutas de Urgencias
 */
const { Hono } = require('hono');
const urgenciaService = require('../services/urgencia.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const urgencias = new Hono();

// Todas las rutas requieren autenticación
urgencias.use('*', authMiddleware);

/**
 * POST /urgencias/triaje - Crear triaje (ingreso a urgencias)
 */
urgencias.post('/triaje', async (c) => {
  try {
    const data = await c.req.json();
    const atencion = await urgenciaService.crearTriaje(data);
    return c.json(success({ atencion }, 'Triaje registrado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /urgencias - Listar atenciones
 */
urgencias.get('/', async (c) => {
  try {
    const { estado, fecha, limit } = c.req.query();
    const atenciones = await urgenciaService.listar({ estado, fecha, limit });
    return c.json(success({ atenciones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /urgencias/estadisticas - Estadísticas del día
 */
urgencias.get('/estadisticas', async (c) => {
  try {
    const { fecha } = c.req.query();
    const stats = await urgenciaService.estadisticas(fecha);
    return c.json(success({ estadisticas: stats }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /urgencias/:id - Obtener atención específica
 */
urgencias.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const atencion = await urgenciaService.obtenerPorId(id);
    return c.json(success({ atencion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /urgencias/:id/atender - Iniciar atención médica
 */
urgencias.put('/:id/atender', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const atencion = await urgenciaService.iniciarAtencion(id, data);
    return c.json(success({ atencion }, 'Atención iniciada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /urgencias/:id/alta - Dar de alta
 */
urgencias.put('/:id/alta', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const atencion = await urgenciaService.darAlta(id, data);
    return c.json(success({ atencion }, 'Alta registrada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /urgencias/:id/hospitalizar - Hospitalizar paciente
 */
urgencias.put('/:id/hospitalizar', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const atencion = await urgenciaService.hospitalizar(id, data);
    return c.json(success({ atencion, admision: atencion.admision }, 'Paciente hospitalizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /urgencias/:id/programar-cita - Programar cita de seguimiento
 */
urgencias.put('/:id/programar-cita', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const atencion = await urgenciaService.programarCita(id, data);
    return c.json(success({ atencion, cita: atencion.cita }, 'Cita programada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /urgencias/:id - Actualizar atención
 */
urgencias.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const atencion = await urgenciaService.actualizar(id, data);
    return c.json(success({ atencion }, 'Atención actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = urgencias;
