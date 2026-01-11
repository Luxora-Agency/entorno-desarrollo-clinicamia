/**
 * @swagger
 * tags:
 *   name: Eventos Adversos
 *   description: Gestión de eventos adversos y seguridad del paciente
 * components:
 *   schemas:
 *     EventoAdverso:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tipoEvento:
 *           type: string
 *           enum: [Incidente, EventoAdverso, Centinela]
 *         severidad:
 *           type: string
 *           enum: [Leve, Moderado, Grave, Catastrofico]
 *         estado:
 *           type: string
 *           enum: [Reportado, EnAnalisis, EnPlanAccion, Cerrado]
 *         fechaEvento:
 *           type: string
 *           format: date-time
 *         descripcion:
 *           type: string
 */

/**
 * Rutas de Eventos Adversos - Seguridad del Paciente
 */
const { Hono } = require('hono');
const eventoAdversoService = require('../services/eventoAdverso.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const eventosAdversos = new Hono();

// Todas las rutas requieren autenticación
eventosAdversos.use('*', authMiddleware);

// ==========================================
// EVENTOS ADVERSOS
// ==========================================

/**
 * GET /eventos-adversos - Obtener eventos adversos
 */
eventosAdversos.get('/', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const query = c.req.query();
    const result = await eventoAdversoService.getEventos(query);
    return c.json(paginated(result.eventos, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /eventos-adversos/:id - Obtener evento por ID
 */
eventosAdversos.get('/:id', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const evento = await eventoAdversoService.getEventoById(id);
    return c.json(success({ evento }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /eventos-adversos - Reportar evento adverso
 */
eventosAdversos.post('/', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');
    const evento = await eventoAdversoService.reportarEvento({
      ...data,
      reportadoPor: user.id,
    });
    return c.json(success({ evento }, 'Evento adverso reportado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /eventos-adversos/:id - Actualizar evento
 */
eventosAdversos.put('/:id', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const evento = await eventoAdversoService.updateEvento(id, data);
    return c.json(success({ evento }, 'Evento actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /eventos-adversos/:id/cambiar-estado - Cambiar estado del evento
 */
eventosAdversos.post('/:id/cambiar-estado', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const { estado, observaciones } = await c.req.json();
    const evento = await eventoAdversoService.cambiarEstado(id, estado, observaciones);
    return c.json(success({ evento }, 'Estado actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ANÁLISIS DE CAUSA RAÍZ
// ==========================================

/**
 * GET /eventos-adversos/:id/analisis - Obtener análisis de causa raíz
 */
eventosAdversos.get('/:id/analisis', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const analisis = await eventoAdversoService.getAnalisisCausaRaiz(id);
    return c.json(success({ analisis }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /eventos-adversos/:id/analisis/protocolo-londres - Crear análisis Protocolo de Londres
 */
eventosAdversos.post('/:id/analisis/protocolo-londres', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const analisis = await eventoAdversoService.crearAnalisisProtocoloLondres({
      eventoId: id,
      analistaId: user.id,
      ...data,
    });
    return c.json(success({ analisis }, 'Análisis Protocolo de Londres creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /eventos-adversos/:id/analisis/espina-pescado - Crear análisis Espina de Pescado
 */
eventosAdversos.post('/:id/analisis/espina-pescado', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const analisis = await eventoAdversoService.crearAnalisisEspinaPescado({
      eventoId: id,
      analistaId: user.id,
      ...data,
    });
    return c.json(success({ analisis }, 'Análisis Espina de Pescado creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /eventos-adversos/:id/analisis/cinco-porques - Crear análisis 5 Porqués
 */
eventosAdversos.post('/:id/analisis/cinco-porques', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const analisis = await eventoAdversoService.crearAnalisisCincoPorques({
      eventoId: id,
      analistaId: user.id,
      ...data,
    });
    return c.json(success({ analisis }, 'Análisis 5 Porqués creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /eventos-adversos/:id/analisis - Actualizar análisis de causa raíz
 */
eventosAdversos.put('/:id/analisis', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const analisis = await eventoAdversoService.updateAnalisisCausaRaiz(id, data);
    return c.json(success({ analisis }, 'Análisis actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// FACTORES CONTRIBUTIVOS
// ==========================================

/**
 * GET /eventos-adversos/:id/factores - Obtener factores contributivos
 */
eventosAdversos.get('/:id/factores', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const factores = await eventoAdversoService.getFactoresContributivos(id);
    return c.json(success({ factores }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /eventos-adversos/:id/factores - Agregar factor contributivo
 */
eventosAdversos.post('/:id/factores', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const factor = await eventoAdversoService.agregarFactorContributivo({
      eventoId: id,
      ...data,
    });
    return c.json(success({ factor }, 'Factor contributivo agregado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /eventos-adversos/:eventoId/factores/:factorId - Eliminar factor
 */
eventosAdversos.delete('/:eventoId/factores/:factorId', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { factorId } = c.req.param();
    await eventoAdversoService.eliminarFactorContributivo(factorId);
    return c.json(success(null, 'Factor contributivo eliminado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CLASIFICACIÓN Y ESTADÍSTICAS
// ==========================================

/**
 * POST /eventos-adversos/:id/clasificar - Clasificar evento
 */
eventosAdversos.post('/:id/clasificar', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const { tipoEvento, severidad } = await c.req.json();
    const evento = await eventoAdversoService.clasificarEvento(id, tipoEvento, severidad);
    return c.json(success({ evento }, 'Evento clasificado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /eventos-adversos/estadisticas - Obtener estadísticas
 */
eventosAdversos.get('/estadisticas/general', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const query = c.req.query();
    const estadisticas = await eventoAdversoService.getEstadisticas(query);
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /eventos-adversos/estadisticas/por-servicio - Estadísticas por servicio
 */
eventosAdversos.get('/estadisticas/por-servicio', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { fechaDesde, fechaHasta } = c.req.query();
    const estadisticas = await eventoAdversoService.getEstadisticasPorServicio(fechaDesde, fechaHasta);
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /eventos-adversos/estadisticas/tendencia - Tendencia de eventos
 */
eventosAdversos.get('/estadisticas/tendencia', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { meses = 12 } = c.req.query();
    const tendencia = await eventoAdversoService.getTendenciaEventos(parseInt(meses));
    return c.json(success({ tendencia }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD
// ==========================================

/**
 * GET /eventos-adversos/dashboard - Dashboard de eventos adversos
 */
eventosAdversos.get('/dashboard/resumen', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const dashboard = await eventoAdversoService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /eventos-adversos/centinela - Obtener eventos centinela
 */
eventosAdversos.get('/centinela/lista', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const query = c.req.query();
    const eventos = await eventoAdversoService.getEventosCentinela(query);
    return c.json(success({ eventos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = eventosAdversos;
