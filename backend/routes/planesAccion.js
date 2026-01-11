/**
 * Rutas de Planes de Acción de Calidad
 * Módulo transversal para gestión de planes de mejora
 */
const { Hono } = require('hono');
const planAccionService = require('../services/planAccion.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const planesAccion = new Hono();

// Todas las rutas requieren autenticación
planesAccion.use('*', authMiddleware);

// ==========================================
// PLANES DE ACCIÓN
// ==========================================

/**
 * GET /planes-accion - Obtener planes de acción
 */
planesAccion.get('/', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const query = c.req.query();
    const result = await planAccionService.getPlanesAccion(query);
    return c.json(paginated(result.planes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /planes-accion/:id - Obtener plan por ID
 */
planesAccion.get('/:id', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { id } = c.req.param();
    const plan = await planAccionService.getPlanById(id);
    return c.json(success({ plan }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /planes-accion - Crear plan de acción
 */
planesAccion.post('/', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const data = await c.req.json();
    const plan = await planAccionService.createPlanAccion(data);
    return c.json(success({ plan }, 'Plan de acción creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /planes-accion/:id - Actualizar plan de acción
 */
planesAccion.put('/:id', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const plan = await planAccionService.updatePlanAccion(id, data);
    return c.json(success({ plan }, 'Plan de acción actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /planes-accion/:id - Eliminar plan de acción
 */
planesAccion.delete('/:id', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { id } = c.req.param();
    await planAccionService.deletePlanAccion(id);
    return c.json(success(null, 'Plan de acción eliminado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// SEGUIMIENTOS
// ==========================================

/**
 * GET /planes-accion/:id/seguimientos - Obtener seguimientos del plan
 */
planesAccion.get('/:id/seguimientos', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { id } = c.req.param();
    const seguimientos = await planAccionService.getSeguimientos(id);
    return c.json(success({ seguimientos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /planes-accion/:id/seguimientos - Registrar seguimiento
 */
planesAccion.post('/:id/seguimientos', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const seguimiento = await planAccionService.registrarSeguimiento({
      planId: id,
      registradoPor: user.id,
      ...data,
    });
    return c.json(success({ seguimiento }, 'Seguimiento registrado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// EVIDENCIAS
// ==========================================

/**
 * GET /planes-accion/:id/evidencias - Obtener evidencias del plan
 */
planesAccion.get('/:id/evidencias', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { id } = c.req.param();
    const evidencias = await planAccionService.getEvidencias(id);
    return c.json(success({ evidencias }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /planes-accion/:id/evidencias - Cargar evidencia
 */
planesAccion.post('/:id/evidencias', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const evidencia = await planAccionService.cargarEvidencia({
      planAccionId: id,
      cargadoPor: user.id,
      ...data,
    });
    return c.json(success({ evidencia }, 'Evidencia cargada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /planes-accion/:planId/evidencias/:evidenciaId - Eliminar evidencia
 */
planesAccion.delete('/:planId/evidencias/:evidenciaId', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { evidenciaId } = c.req.param();
    await planAccionService.eliminarEvidencia(evidenciaId);
    return c.json(success(null, 'Evidencia eliminada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// GESTIÓN DE ESTADOS
// ==========================================

/**
 * POST /planes-accion/:id/cerrar - Cerrar plan de acción
 */
planesAccion.post('/:id/cerrar', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { id } = c.req.param();
    const { resultadoObtenido, eficaciaVerificada } = await c.req.json();
    const plan = await planAccionService.cerrarPlan(id, resultadoObtenido, eficaciaVerificada);
    return c.json(success({ plan }, 'Plan de acción cerrado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /planes-accion/:id/reabrir - Reabrir plan de acción
 */
planesAccion.post('/:id/reabrir', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { id } = c.req.param();
    const { motivo } = await c.req.json();
    const plan = await planAccionService.reabrirPlan(id, motivo);
    return c.json(success({ plan }, 'Plan de acción reabierto'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /planes-accion/:id/verificar-eficacia - Verificar eficacia de acción
 */
planesAccion.post('/:id/verificar-eficacia', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { id } = c.req.param();
    const { eficaz, observaciones } = await c.req.json();
    const plan = await planAccionService.verificarEficacia(id, eficaz, observaciones);
    return c.json(success({ plan }, 'Verificación de eficacia registrada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// FILTROS POR ORIGEN
// ==========================================

/**
 * GET /planes-accion/por-origen/:origen - Obtener planes por origen
 */
planesAccion.get('/por-origen/:origen', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { origen } = c.req.param();
    const query = c.req.query();
    const result = await planAccionService.getPlanesPorOrigen(origen, query);
    return c.json(paginated(result.planes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /planes-accion/por-responsable/:responsableId - Obtener planes por responsable
 */
planesAccion.get('/por-responsable/:responsableId', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { responsableId } = c.req.param();
    const query = c.req.query();
    const result = await planAccionService.getPlanesPorResponsable(responsableId, query);
    return c.json(paginated(result.planes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ALERTAS Y VENCIMIENTOS
// ==========================================

/**
 * GET /planes-accion/alertas/vencidos - Obtener planes vencidos
 */
planesAccion.get('/alertas/vencidos', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const planes = await planAccionService.getPlanesVencidos();
    return c.json(success({ planes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /planes-accion/alertas/por-vencer - Obtener planes próximos a vencer
 */
planesAccion.get('/alertas/por-vencer', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { dias = 7 } = c.req.query();
    const planes = await planAccionService.getPlanesPorVencer(parseInt(dias));
    return c.json(success({ planes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /planes-accion/alertas/sin-seguimiento - Planes sin seguimiento reciente
 */
planesAccion.get('/alertas/sin-seguimiento', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { dias = 15 } = c.req.query();
    const planes = await planAccionService.getPlanesSinSeguimiento(parseInt(dias));
    return c.json(success({ planes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD Y REPORTES
// ==========================================

/**
 * GET /planes-accion/dashboard - Dashboard de planes de acción
 */
planesAccion.get('/dashboard/resumen', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const dashboard = await planAccionService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /planes-accion/estadisticas/por-origen - Estadísticas por origen
 */
planesAccion.get('/estadisticas/por-origen', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const estadisticas = await planAccionService.getEstadisticasPorOrigen();
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /planes-accion/estadisticas/por-estado - Estadísticas por estado
 */
planesAccion.get('/estadisticas/por-estado', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const estadisticas = await planAccionService.getEstadisticasPorEstado();
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /planes-accion/estadisticas/efectividad - Estadísticas de efectividad
 */
planesAccion.get('/estadisticas/efectividad', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const { fechaDesde, fechaHasta } = c.req.query();
    const estadisticas = await planAccionService.getEstadisticasEfectividad(fechaDesde, fechaHasta);
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /planes-accion/estadisticas/cumplimiento - Estadísticas de cumplimiento de tiempos
 */
planesAccion.get('/estadisticas/cumplimiento', permissionMiddleware('calidad_planes_accion'), async (c) => {
  try {
    const query = c.req.query();
    const estadisticas = await planAccionService.getEstadisticasCumplimiento(query);
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = planesAccion;
