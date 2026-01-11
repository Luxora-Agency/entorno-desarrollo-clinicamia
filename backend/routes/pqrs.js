/**
 * @swagger
 * tags:
 *   name: PQRS
 *   description: Peticiones, Quejas, Reclamos y Sugerencias
 * components:
 *   schemas:
 *     PQRS:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tipo:
 *           type: string
 *           enum: [Peticion, Queja, Reclamo, Sugerencia, Felicitacion]
 *         estado:
 *           type: string
 *           enum: [Recibida, EnGestion, Respondida, Cerrada]
 *         prioridad:
 *           type: string
 *           enum: [Baja, Media, Alta, Urgente]
 *         fechaRecepcion:
 *           type: string
 *           format: date-time
 *         fechaVencimiento:
 *           type: string
 *           format: date-time
 *         descripcion:
 *           type: string
 */

/**
 * Rutas de PQRS - Peticiones, Quejas, Reclamos y Sugerencias
 */
const { Hono } = require('hono');
const pqrsService = require('../services/pqrs.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const pqrs = new Hono();

// Todas las rutas requieren autenticación
pqrs.use('*', authMiddleware);

// ==========================================
// GESTIÓN DE PQRS
// ==========================================

/**
 * GET /pqrs - Obtener PQRS
 */
pqrs.get('/', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const query = c.req.query();
    const result = await pqrsService.getPQRS(query);
    return c.json(paginated(result.pqrs, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pqrs/:id - Obtener PQRS por ID
 */
pqrs.get('/:id', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { id } = c.req.param();
    const pqrsItem = await pqrsService.getPQRSById(id);
    return c.json(success({ pqrs: pqrsItem }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pqrs - Registrar nueva PQRS
 */
pqrs.post('/', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const data = await c.req.json();
    const pqrsItem = await pqrsService.createPQRS(data);
    return c.json(success({ pqrs: pqrsItem }, 'PQRS registrada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /pqrs/:id - Actualizar PQRS
 */
pqrs.put('/:id', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const pqrsItem = await pqrsService.updatePQRS(id, data);
    return c.json(success({ pqrs: pqrsItem }, 'PQRS actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ASIGNACIÓN Y GESTIÓN
// ==========================================

/**
 * POST /pqrs/:id/asignar - Asignar PQRS a responsable
 */
pqrs.post('/:id/asignar', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { id } = c.req.param();
    const { responsableId, areaAsignada, prioridad } = await c.req.json();
    const pqrsItem = await pqrsService.asignarPQRS(id, responsableId, areaAsignada, prioridad);
    return c.json(success({ pqrs: pqrsItem }, 'PQRS asignada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pqrs/:id/cambiar-estado - Cambiar estado de PQRS
 */
pqrs.post('/:id/cambiar-estado', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { id } = c.req.param();
    const { estado, observaciones } = await c.req.json();
    const user = c.get('user');
    const pqrsItem = await pqrsService.cambiarEstado(id, estado, observaciones, user.id);
    return c.json(success({ pqrs: pqrsItem }, 'Estado actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pqrs/:id/responder - Registrar respuesta a PQRS
 */
pqrs.post('/:id/responder', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const pqrsItem = await pqrsService.responderPQRS(id, {
      respondidoPor: user.id,
      ...data,
    });
    return c.json(success({ pqrs: pqrsItem }, 'Respuesta registrada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// SEGUIMIENTOS
// ==========================================

/**
 * GET /pqrs/:id/seguimientos - Obtener seguimientos de PQRS
 */
pqrs.get('/:id/seguimientos', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { id } = c.req.param();
    const seguimientos = await pqrsService.getSeguimientos(id);
    return c.json(success({ seguimientos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pqrs/:id/seguimientos - Agregar seguimiento
 */
pqrs.post('/:id/seguimientos', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const seguimiento = await pqrsService.agregarSeguimiento({
      pqrsId: id,
      usuarioId: user.id,
      ...data,
    });
    return c.json(success({ seguimiento }, 'Seguimiento agregado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// SATISFACCIÓN
// ==========================================

/**
 * POST /pqrs/:id/encuesta-satisfaccion - Enviar encuesta de satisfacción
 */
pqrs.post('/:id/encuesta-satisfaccion', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { id } = c.req.param();
    const pqrsItem = await pqrsService.enviarEncuestaSatisfaccion(id);
    return c.json(success({ pqrs: pqrsItem }, 'Encuesta de satisfacción enviada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pqrs/:id/calificar - Registrar calificación de satisfacción
 */
pqrs.post('/:id/calificar', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { id } = c.req.param();
    const { calificacion, comentario } = await c.req.json();
    const pqrsItem = await pqrsService.registrarCalificacion(id, calificacion, comentario);
    return c.json(success({ pqrs: pqrsItem }, 'Calificación registrada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// VENCIMIENTOS Y ALERTAS
// ==========================================

/**
 * GET /pqrs/alertas/vencidas - Obtener PQRS vencidas
 */
pqrs.get('/alertas/vencidas', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const vencidas = await pqrsService.getPQRSVencidas();
    return c.json(success({ vencidas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pqrs/alertas/por-vencer - Obtener PQRS por vencer
 */
pqrs.get('/alertas/por-vencer', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { dias = 3 } = c.req.query();
    const porVencer = await pqrsService.getPQRSPorVencer(parseInt(dias));
    return c.json(success({ porVencer }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pqrs/tiempos-respuesta - Obtener análisis de tiempos de respuesta
 */
pqrs.get('/tiempos-respuesta/analisis', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const query = c.req.query();
    const tiempos = await pqrsService.getAnalisisTiemposRespuesta(query);
    return c.json(success({ tiempos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD Y REPORTES
// ==========================================

/**
 * GET /pqrs/dashboard - Dashboard de PQRS
 */
pqrs.get('/dashboard/resumen', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const dashboard = await pqrsService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pqrs/estadisticas/por-tipo - Estadísticas por tipo
 */
pqrs.get('/estadisticas/por-tipo', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { fechaDesde, fechaHasta } = c.req.query();
    const estadisticas = await pqrsService.getEstadisticasPorTipo(fechaDesde, fechaHasta);
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pqrs/estadisticas/por-canal - Estadísticas por canal
 */
pqrs.get('/estadisticas/por-canal', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { fechaDesde, fechaHasta } = c.req.query();
    const estadisticas = await pqrsService.getEstadisticasPorCanal(fechaDesde, fechaHasta);
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pqrs/estadisticas/por-area - Estadísticas por área
 */
pqrs.get('/estadisticas/por-area', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { fechaDesde, fechaHasta } = c.req.query();
    const estadisticas = await pqrsService.getEstadisticasPorArea(fechaDesde, fechaHasta);
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pqrs/estadisticas/tendencia - Tendencia mensual de PQRS
 */
pqrs.get('/estadisticas/tendencia', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const { meses = 12 } = c.req.query();
    const tendencia = await pqrsService.getTendenciaMensual(parseInt(meses));
    return c.json(success({ tendencia }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pqrs/satisfaccion/analisis - Análisis de satisfacción
 */
pqrs.get('/satisfaccion/analisis', permissionMiddleware('calidad_pqrs'), async (c) => {
  try {
    const query = c.req.query();
    const satisfaccion = await pqrsService.getAnalisisSatisfaccion(query);
    return c.json(success({ satisfaccion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = pqrs;
