/**
 * Rutas de Comités Institucionales
 */
const { Hono } = require('hono');
const comiteService = require('../services/comite.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const comites = new Hono();

// Todas las rutas requieren autenticación
comites.use('*', authMiddleware);

// ==========================================
// COMITÉS
// ==========================================

/**
 * GET /comites - Obtener comités institucionales
 */
comites.get('/', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const query = c.req.query();
    const comitesList = await comiteService.getComites(query);
    return c.json(success({ comites: comitesList }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /comites/:id - Obtener comité por ID
 */
comites.get('/:id', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { id } = c.req.param();
    const comite = await comiteService.getComiteById(id);
    return c.json(success({ comite }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /comites - Crear comité
 */
comites.post('/', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const data = await c.req.json();
    const comite = await comiteService.createComite(data);
    return c.json(success({ comite }, 'Comité creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /comites/:id - Actualizar comité
 */
comites.put('/:id', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const comite = await comiteService.updateComite(id, data);
    return c.json(success({ comite }, 'Comité actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// INTEGRANTES
// ==========================================

/**
 * GET /comites/:id/integrantes - Obtener integrantes del comité
 */
comites.get('/:id/integrantes', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { id } = c.req.param();
    const integrantes = await comiteService.getIntegrantes(id);
    return c.json(success({ integrantes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /comites/:id/integrantes - Agregar integrante al comité
 */
comites.post('/:id/integrantes', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const integrante = await comiteService.agregarIntegrante({
      comiteId: id,
      ...data,
    });
    return c.json(success({ integrante }, 'Integrante agregado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /comites/:comiteId/integrantes/:integranteId - Actualizar integrante
 */
comites.put('/:comiteId/integrantes/:integranteId', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { integranteId } = c.req.param();
    const data = await c.req.json();
    const integrante = await comiteService.updateIntegrante(integranteId, data);
    return c.json(success({ integrante }, 'Integrante actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /comites/:comiteId/integrantes/:integranteId - Retirar integrante
 */
comites.delete('/:comiteId/integrantes/:integranteId', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { integranteId } = c.req.param();
    await comiteService.retirarIntegrante(integranteId);
    return c.json(success(null, 'Integrante retirado del comité'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// REUNIONES
// ==========================================

/**
 * GET /comites/:id/reuniones - Obtener reuniones del comité
 */
comites.get('/:id/reuniones', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { id } = c.req.param();
    const query = c.req.query();
    const result = await comiteService.getReuniones(id, query);
    return c.json(paginated(result.reuniones, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /comites/reuniones/:reunionId - Obtener reunión por ID
 */
comites.get('/reuniones/:reunionId', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { reunionId } = c.req.param();
    const reunion = await comiteService.getReunionById(reunionId);
    return c.json(success({ reunion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /comites/:id/reuniones - Programar reunión
 */
comites.post('/:id/reuniones', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const reunion = await comiteService.programarReunion({
      comiteId: id,
      ...data,
    });
    return c.json(success({ reunion }, 'Reunión programada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /comites/reuniones/:reunionId - Actualizar reunión
 */
comites.put('/reuniones/:reunionId', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { reunionId } = c.req.param();
    const data = await c.req.json();
    const reunion = await comiteService.updateReunion(reunionId, data);
    return c.json(success({ reunion }, 'Reunión actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /comites/reuniones/:reunionId/realizar - Registrar realización de reunión
 */
comites.post('/reuniones/:reunionId/realizar', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { reunionId } = c.req.param();
    const data = await c.req.json();
    const reunion = await comiteService.realizarReunion(reunionId, data);
    return c.json(success({ reunion }, 'Reunión registrada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /comites/reuniones/:reunionId/cancelar - Cancelar reunión
 */
comites.post('/reuniones/:reunionId/cancelar', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { reunionId } = c.req.param();
    const { motivo } = await c.req.json();
    const reunion = await comiteService.cancelarReunion(reunionId, motivo);
    return c.json(success({ reunion }, 'Reunión cancelada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// COMPROMISOS
// ==========================================

/**
 * GET /comites/reuniones/:reunionId/compromisos - Obtener compromisos de reunión
 */
comites.get('/reuniones/:reunionId/compromisos', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { reunionId } = c.req.param();
    const compromisos = await comiteService.getCompromisosByReunion(reunionId);
    return c.json(success({ compromisos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /comites/reuniones/:reunionId/compromisos - Agregar compromiso
 */
comites.post('/reuniones/:reunionId/compromisos', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { reunionId } = c.req.param();
    const data = await c.req.json();
    const compromiso = await comiteService.agregarCompromiso({
      reunionId,
      ...data,
    });
    return c.json(success({ compromiso }, 'Compromiso agregado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /comites/compromisos/:compromisoId - Actualizar compromiso
 */
comites.put('/compromisos/:compromisoId', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { compromisoId } = c.req.param();
    const data = await c.req.json();
    const compromiso = await comiteService.updateCompromiso(compromisoId, data);
    return c.json(success({ compromiso }, 'Compromiso actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /comites/compromisos/:compromisoId/cerrar - Cerrar compromiso
 */
comites.post('/compromisos/:compromisoId/cerrar', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { compromisoId } = c.req.param();
    const { observacionCierre } = await c.req.json();
    const compromiso = await comiteService.cerrarCompromiso(compromisoId, observacionCierre);
    return c.json(success({ compromiso }, 'Compromiso cerrado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /comites/compromisos/pendientes - Obtener todos los compromisos pendientes
 */
comites.get('/compromisos/pendientes', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const compromisos = await comiteService.getCompromisosPendientes();
    return c.json(success({ compromisos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /comites/compromisos/vencidos - Obtener compromisos vencidos
 */
comites.get('/compromisos/vencidos', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const compromisos = await comiteService.getCompromisosVencidos();
    return c.json(success({ compromisos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ACTAS
// ==========================================

/**
 * GET /comites/reuniones/:reunionId/acta - Generar acta de reunión
 */
comites.get('/reuniones/:reunionId/acta', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { reunionId } = c.req.param();
    const acta = await comiteService.generarActa(reunionId);
    return c.json(success({ acta }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /comites/reuniones/:reunionId/subir-acta - Subir archivo de acta
 */
comites.post('/reuniones/:reunionId/subir-acta', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { reunionId } = c.req.param();
    const { actaUrl } = await c.req.json();
    const reunion = await comiteService.subirActa(reunionId, actaUrl);
    return c.json(success({ reunion }, 'Acta subida exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD Y REPORTES
// ==========================================

/**
 * GET /comites/dashboard - Dashboard de comités
 */
comites.get('/dashboard/resumen', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const dashboard = await comiteService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /comites/calendario - Calendario de reuniones
 */
comites.get('/calendario/mensual', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { mes, anio } = c.req.query();
    const calendario = await comiteService.getCalendarioReuniones(parseInt(mes), parseInt(anio));
    return c.json(success({ calendario }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /comites/estadisticas/cumplimiento - Estadísticas de cumplimiento
 */
comites.get('/estadisticas/cumplimiento', permissionMiddleware('calidad_comites'), async (c) => {
  try {
    const { anio } = c.req.query();
    const estadisticas = await comiteService.getEstadisticasCumplimiento(parseInt(anio));
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = comites;
