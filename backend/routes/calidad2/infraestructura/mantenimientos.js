const { Hono } = require('hono');
const { success, error } = require('../../../utils/response');
const { authMiddleware, permissionMiddleware } = require('../../../middleware/auth');
const {
  equipoInfraestructuraService,
  mantenimientoInfraestructuraService,
  documentoMantenimientoService,
  cronogramaMantenimientoService,
} = require('../../../services/calidad2/infraestructura/mantenimientos');

const router = new Hono();

// Nota: authMiddleware y permissionMiddleware ya están aplicados en el router padre

// ==========================================
// EQUIPOS DE INFRAESTRUCTURA
// ==========================================

// Estadísticas de equipos (must be before /:id)
router.get('/equipos/stats', async (c) => {
  try {
    const stats = await equipoInfraestructuraService.getEstadisticas();
    return c.json(success(stats, 'Estadísticas obtenidas exitosamente'));
  } catch (err) {
    console.error('Error getting equipos stats:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Obtener equipos por tipo (must be before /:id)
router.get('/equipos/tipo/:tipo', async (c) => {
  try {
    const tipo = c.req.param('tipo');
    const equipos = await equipoInfraestructuraService.findByTipo(tipo);
    return c.json(success(equipos, 'Equipos obtenidos exitosamente'));
  } catch (err) {
    console.error('Error getting equipos by tipo:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Listar todos los equipos
router.get('/equipos', async (c) => {
  try {
    const filters = c.req.query();
    const data = await equipoInfraestructuraService.findAll(filters);
    return c.json(success(data, 'Equipos obtenidos exitosamente'));
  } catch (err) {
    console.error('Error listing equipos:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Obtener equipo por ID
router.get('/equipos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const equipo = await equipoInfraestructuraService.findById(id);
    return c.json(success(equipo, 'Equipo obtenido exitosamente'));
  } catch (err) {
    console.error('Error getting equipo:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Crear equipo
router.post('/equipos', async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('user')?.id;
    const equipo = await equipoInfraestructuraService.create(body, userId);
    return c.json(success(equipo, 'Equipo creado exitosamente'), 201);
  } catch (err) {
    console.error('Error creating equipo:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Actualizar equipo
router.put('/equipos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const equipo = await equipoInfraestructuraService.update(id, body);
    return c.json(success(equipo, 'Equipo actualizado exitosamente'));
  } catch (err) {
    console.error('Error updating equipo:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Cambiar estado de equipo
router.patch('/equipos/:id/estado', async (c) => {
  try {
    const id = c.req.param('id');
    const { estado, observaciones } = await c.req.json();
    const equipo = await equipoInfraestructuraService.cambiarEstado(id, estado, observaciones);
    return c.json(success(equipo, 'Estado actualizado exitosamente'));
  } catch (err) {
    console.error('Error changing equipo estado:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Eliminar equipo
router.delete('/equipos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await equipoInfraestructuraService.delete(id);
    return c.json(success(null, 'Equipo eliminado exitosamente'));
  } catch (err) {
    console.error('Error deleting equipo:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// ==========================================
// MANTENIMIENTOS
// ==========================================

// Estadísticas de mantenimientos (must be before /:id)
router.get('/mantenimientos/stats', async (c) => {
  try {
    const filters = c.req.query();
    const stats = await mantenimientoInfraestructuraService.getEstadisticas(filters);
    return c.json(success(stats, 'Estadísticas obtenidas exitosamente'));
  } catch (err) {
    console.error('Error getting mantenimientos stats:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Próximos mantenimientos (must be before /:id)
router.get('/mantenimientos/proximos', async (c) => {
  try {
    const limit = c.req.query('limit');
    const mantenimientos = await mantenimientoInfraestructuraService.getProximos(
      parseInt(limit) || 10
    );
    return c.json(success(mantenimientos, 'Próximos mantenimientos obtenidos exitosamente'));
  } catch (err) {
    console.error('Error getting proximos mantenimientos:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Timeline de mantenimientos de un equipo (must be before /:id)
router.get('/mantenimientos/timeline/:equipoId', async (c) => {
  try {
    const equipoId = c.req.param('equipoId');
    const timeline = await mantenimientoInfraestructuraService.getTimelineEquipo(equipoId);
    return c.json(success(timeline, 'Timeline obtenido exitosamente'));
  } catch (err) {
    console.error('Error getting timeline:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Listar mantenimientos
router.get('/mantenimientos', async (c) => {
  try {
    const filters = c.req.query();
    const data = await mantenimientoInfraestructuraService.findAll(filters);
    return c.json(success(data, 'Mantenimientos obtenidos exitosamente'));
  } catch (err) {
    console.error('Error listing mantenimientos:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Obtener mantenimiento por ID
router.get('/mantenimientos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const mantenimiento = await mantenimientoInfraestructuraService.findById(id);
    return c.json(success(mantenimiento, 'Mantenimiento obtenido exitosamente'));
  } catch (err) {
    console.error('Error getting mantenimiento:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Crear mantenimiento
router.post('/mantenimientos', async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('user')?.id;
    const mantenimiento = await mantenimientoInfraestructuraService.create(body, userId);
    return c.json(success(mantenimiento, 'Mantenimiento creado exitosamente'), 201);
  } catch (err) {
    console.error('Error creating mantenimiento:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Actualizar mantenimiento
router.put('/mantenimientos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const mantenimiento = await mantenimientoInfraestructuraService.update(id, body);
    return c.json(success(mantenimiento, 'Mantenimiento actualizado exitosamente'));
  } catch (err) {
    console.error('Error updating mantenimiento:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Completar mantenimiento
router.post('/mantenimientos/:id/completar', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const mantenimiento = await mantenimientoInfraestructuraService.completar(id, body);
    return c.json(success(mantenimiento, 'Mantenimiento completado exitosamente'));
  } catch (err) {
    console.error('Error completing mantenimiento:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Cancelar mantenimiento
router.post('/mantenimientos/:id/cancelar', async (c) => {
  try {
    const id = c.req.param('id');
    const { motivo } = await c.req.json();
    const mantenimiento = await mantenimientoInfraestructuraService.cancelar(id, motivo);
    return c.json(success(mantenimiento, 'Mantenimiento cancelado exitosamente'));
  } catch (err) {
    console.error('Error canceling mantenimiento:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Eliminar mantenimiento
router.delete('/mantenimientos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await mantenimientoInfraestructuraService.delete(id);
    return c.json(success(null, 'Mantenimiento eliminado exitosamente'));
  } catch (err) {
    console.error('Error deleting mantenimiento:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// ==========================================
// DOCUMENTOS DE MANTENIMIENTO
// ==========================================

// Estadísticas de documentos (must be before dynamic routes)
router.get('/documentos/stats', async (c) => {
  try {
    const stats = await documentoMantenimientoService.getEstadisticas();
    return c.json(success(stats, 'Estadísticas obtenidas exitosamente'));
  } catch (err) {
    console.error('Error getting documentos stats:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Listar documentos
router.get('/documentos', async (c) => {
  try {
    const filters = c.req.query();
    const data = await documentoMantenimientoService.findAll(filters);
    return c.json(success(data, 'Documentos obtenidos exitosamente'));
  } catch (err) {
    console.error('Error listing documentos:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Documentos de un mantenimiento
router.get('/mantenimientos/:mantenimientoId/documentos', async (c) => {
  try {
    const mantenimientoId = c.req.param('mantenimientoId');
    const documentos = await documentoMantenimientoService.findByMantenimiento(mantenimientoId);
    return c.json(success(documentos, 'Documentos obtenidos exitosamente'));
  } catch (err) {
    console.error('Error getting documentos by mantenimiento:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Crear documento
router.post('/mantenimientos/:mantenimientoId/documentos', async (c) => {
  try {
    const mantenimientoId = c.req.param('mantenimientoId');
    const body = await c.req.json();
    const userId = c.get('user')?.id;
    const documento = await documentoMantenimientoService.create(mantenimientoId, body, userId);
    return c.json(success(documento, 'Documento creado exitosamente'), 201);
  } catch (err) {
    console.error('Error creating documento:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Actualizar documento
router.put('/documentos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const documento = await documentoMantenimientoService.update(id, body);
    return c.json(success(documento, 'Documento actualizado exitosamente'));
  } catch (err) {
    console.error('Error updating documento:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Eliminar documento
router.delete('/documentos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await documentoMantenimientoService.delete(id);
    return c.json(success(null, 'Documento eliminado exitosamente'));
  } catch (err) {
    console.error('Error deleting documento:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// ==========================================
// CRONOGRAMA DE MANTENIMIENTOS
// ==========================================

// Estadísticas del cronograma (must be before dynamic routes)
router.get('/cronograma/stats/:anio', async (c) => {
  try {
    const anio = c.req.param('anio');
    const stats = await cronogramaMantenimientoService.getEstadisticas(anio);
    return c.json(success(stats, 'Estadísticas obtenidas exitosamente'));
  } catch (err) {
    console.error('Error getting cronograma stats:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Cronograma anual de un equipo
router.get('/cronograma/equipo/:equipoId/anio/:anio', async (c) => {
  try {
    const equipoId = c.req.param('equipoId');
    const anio = c.req.param('anio');
    const cronograma = await cronogramaMantenimientoService.getCronogramaAnual(equipoId, anio);
    return c.json(success(cronograma, 'Cronograma obtenido exitosamente'));
  } catch (err) {
    console.error('Error getting cronograma anual:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Cronograma mensual (todos los equipos)
router.get('/cronograma/mes/:mes/anio/:anio', async (c) => {
  try {
    const mes = c.req.param('mes');
    const anio = c.req.param('anio');
    const cronograma = await cronogramaMantenimientoService.getCronogramaMensual(mes, anio);
    return c.json(success(cronograma, 'Cronograma mensual obtenido exitosamente'));
  } catch (err) {
    console.error('Error getting cronograma mensual:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Listar cronogramas
router.get('/cronograma', async (c) => {
  try {
    const filters = c.req.query();
    const data = await cronogramaMantenimientoService.findAll(filters);
    return c.json(success(data, 'Cronogramas obtenidos exitosamente'));
  } catch (err) {
    console.error('Error listing cronogramas:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Obtener cronograma por ID
router.get('/cronograma/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const cronograma = await cronogramaMantenimientoService.findById(id);
    return c.json(success(cronograma, 'Cronograma obtenido exitosamente'));
  } catch (err) {
    console.error('Error getting cronograma:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Crear entrada en cronograma
router.post('/cronograma', async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('user')?.id;
    const cronograma = await cronogramaMantenimientoService.create(body, userId);
    return c.json(success(cronograma, 'Cronograma creado exitosamente'), 201);
  } catch (err) {
    console.error('Error creating cronograma:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Generar cronograma anual automático
router.post('/cronograma/generar', async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('user')?.id;
    const { equipoId, anio, config } = body;
    const resultado = await cronogramaMantenimientoService.generarCronogramaAnual(
      equipoId,
      anio,
      config,
      userId
    );
    return c.json(success(resultado, 'Cronograma anual generado exitosamente'), 201);
  } catch (err) {
    console.error('Error generating cronograma:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Actualizar cronograma
router.put('/cronograma/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const cronograma = await cronogramaMantenimientoService.update(id, body);
    return c.json(success(cronograma, 'Cronograma actualizado exitosamente'));
  } catch (err) {
    console.error('Error updating cronograma:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Marcar cronograma como completado
router.post('/cronograma/:id/completar', async (c) => {
  try {
    const id = c.req.param('id');
    const { mantenimientoId } = await c.req.json();
    const userId = c.get('user')?.id;
    const cronograma = await cronogramaMantenimientoService.marcarCompletado(
      id,
      mantenimientoId,
      userId
    );
    return c.json(success(cronograma, 'Cronograma marcado como completado'));
  } catch (err) {
    console.error('Error completing cronograma:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Reprogramar mantenimiento
router.post('/cronograma/:id/reprogramar', async (c) => {
  try {
    const id = c.req.param('id');
    const { nuevaFecha } = await c.req.json();
    const cronograma = await cronogramaMantenimientoService.reprogramar(id, nuevaFecha);
    return c.json(success(cronograma, 'Mantenimiento reprogramado exitosamente'));
  } catch (err) {
    console.error('Error reprogramming cronograma:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Cancelar mantenimiento programado
router.post('/cronograma/:id/cancelar', async (c) => {
  try {
    const id = c.req.param('id');
    const { motivo } = await c.req.json();
    const cronograma = await cronogramaMantenimientoService.cancelar(id, motivo);
    return c.json(success(cronograma, 'Mantenimiento cancelado exitosamente'));
  } catch (err) {
    console.error('Error canceling cronograma:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

// Eliminar cronograma
router.delete('/cronograma/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await cronogramaMantenimientoService.delete(id);
    return c.json(success(null, 'Cronograma eliminado exitosamente'));
  } catch (err) {
    console.error('Error deleting cronograma:', err);
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});

module.exports = router;
