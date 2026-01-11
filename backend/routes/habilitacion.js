/**
 * @swagger
 * tags:
 *   name: Habilitación
 *   description: Sistema Único de Habilitación (SUH) - Resolución 3100/2019
 * components:
 *   schemas:
 *     EstandarHabilitacion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         codigo:
 *           type: string
 *         nombre:
 *           type: string
 *         grupo:
 *           type: string
 *           enum: [TalentoHumano, Infraestructura, Dotacion, Medicamentos, Procesos, HistoriaClinica, Interdependencia]
 *         descripcion:
 *           type: string
 *     Autoevaluacion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         fecha:
 *           type: string
 *           format: date
 *         estado:
 *           type: string
 *           enum: [EnProceso, Completada, Aprobada]
 *         porcentajeCumplimiento:
 *           type: number
 */

/**
 * Rutas de Habilitación (SUH) - Resolución 3100/2019
 */
const { Hono } = require('hono');
const habilitacionService = require('../services/habilitacion.service');
const { exportadorREPS } = require('../services/exportadores');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const habilitacion = new Hono();

// Todas las rutas requieren autenticación
habilitacion.use('*', authMiddleware);

// ==========================================
// ESTÁNDARES DE HABILITACIÓN
// ==========================================

/**
 * @swagger
 * /habilitacion/estandares:
 *   get:
 *     summary: Obtener todos los estándares de habilitación
 *     tags: [Habilitación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estándares
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
habilitacion.get('/estandares', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const query = c.req.query();
    const estandares = await habilitacionService.getEstandares(query);
    return c.json(success({ estandares }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /habilitacion/estandares/:id - Obtener estándar por ID
 */
habilitacion.get('/estandares/:id', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const { id } = c.req.param();
    const estandar = await habilitacionService.getEstandarById(id);
    return c.json(success({ estandar }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /habilitacion/estandares - Crear estándar
 */
habilitacion.post('/estandares', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const data = await c.req.json();
    const estandar = await habilitacionService.createEstandar(data);
    return c.json(success({ estandar }, 'Estándar creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /habilitacion/estandares/:id - Actualizar estándar
 */
habilitacion.put('/estandares/:id', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const estandar = await habilitacionService.updateEstandar(id, data);
    return c.json(success({ estandar }, 'Estándar actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CRITERIOS
// ==========================================

/**
 * GET /habilitacion/estandares/:estandarId/criterios - Obtener criterios por estándar
 */
habilitacion.get('/estandares/:estandarId/criterios', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const { estandarId } = c.req.param();
    const criterios = await habilitacionService.getCriteriosByEstandar(estandarId);
    return c.json(success({ criterios }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /habilitacion/criterios - Crear criterio
 */
habilitacion.post('/criterios', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const data = await c.req.json();
    const criterio = await habilitacionService.createCriterio(data);
    return c.json(success({ criterio }, 'Criterio creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// AUTOEVALUACIONES
// ==========================================

/**
 * @swagger
 * /habilitacion/autoevaluaciones:
 *   get:
 *     summary: Obtener autoevaluaciones de habilitación
 *     tags: [Habilitación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista paginada de autoevaluaciones
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
habilitacion.get('/autoevaluaciones', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const query = c.req.query();
    const result = await habilitacionService.getAutoevaluaciones(query);
    return c.json(paginated(result.autoevaluaciones, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /habilitacion/autoevaluaciones/:id - Obtener autoevaluación por ID
 */
habilitacion.get('/autoevaluaciones/:id', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const { id } = c.req.param();
    const autoevaluacion = await habilitacionService.getAutoevaluacionById(id);
    return c.json(success({ autoevaluacion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /habilitacion/autoevaluaciones - Crear autoevaluación
 */
habilitacion.post('/autoevaluaciones', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');
    const autoevaluacion = await habilitacionService.createAutoevaluacion({
      ...data,
      evaluadorId: user.id,
    });
    return c.json(success({ autoevaluacion }, 'Autoevaluación creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /habilitacion/autoevaluaciones/:id - Actualizar autoevaluación
 */
habilitacion.put('/autoevaluaciones/:id', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const autoevaluacion = await habilitacionService.updateAutoevaluacion(id, data);
    return c.json(success({ autoevaluacion }, 'Autoevaluación actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /habilitacion/autoevaluaciones/:id/evaluar-criterio - Evaluar criterio
 */
habilitacion.post('/autoevaluaciones/:id/evaluar-criterio', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const evaluacion = await habilitacionService.evaluarCriterio({
      autoevaluacionId: id,
      ...data,
    });
    return c.json(success({ evaluacion }, 'Criterio evaluado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// VISITAS DE VERIFICACIÓN
// ==========================================

/**
 * GET /habilitacion/visitas - Obtener visitas de verificación
 */
habilitacion.get('/visitas', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const query = c.req.query();
    const result = await habilitacionService.getVisitas(query);
    return c.json(paginated(result.visitas, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /habilitacion/visitas - Crear visita
 */
habilitacion.post('/visitas', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const data = await c.req.json();
    const visita = await habilitacionService.createVisita(data);
    return c.json(success({ visita }, 'Visita registrada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /habilitacion/visitas/:id - Actualizar visita
 */
habilitacion.put('/visitas/:id', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const visita = await habilitacionService.updateVisita(id, data);
    return c.json(success({ visita }, 'Visita actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /habilitacion/visitas/:id/hallazgos - Registrar hallazgos de visita
 */
habilitacion.post('/visitas/:id/hallazgos', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const { id } = c.req.param();
    const { hallazgos } = await c.req.json();
    const visita = await habilitacionService.registrarHallazgosVisita(id, hallazgos);
    return c.json(success({ visita }, 'Hallazgos registrados exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD Y REPORTES
// ==========================================

/**
 * @swagger
 * /habilitacion/dashboard:
 *   get:
 *     summary: Dashboard de habilitación
 *     description: Estadísticas y KPIs del proceso de habilitación
 *     tags: [Habilitación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard de habilitación
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
habilitacion.get('/dashboard', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const dashboard = await habilitacionService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /habilitacion/reporte-autoevaluacion/:autoevaluacionId - Generar reporte
 */
habilitacion.get('/reporte-autoevaluacion/:autoevaluacionId', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const { autoevaluacionId } = c.req.param();
    const reporte = await habilitacionService.generarReporteAutoevaluacion(autoevaluacionId);
    return c.json(success({ reporte }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// EXPORTACIONES REPS
// ==========================================

/**
 * GET /habilitacion/exportar/declaracion - Exportar declaración de autoevaluación
 */
habilitacion.get('/exportar/declaracion', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const declaracion = await exportadorREPS.generarDeclaracionAutoevaluacion();
    return c.json(success({ declaracion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /habilitacion/exportar/declaracion-xml - Exportar XML declaración REPS
 */
habilitacion.get('/exportar/declaracion-xml', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const xml = await exportadorREPS.generarDeclaracionXML();
    c.header('Content-Type', 'application/xml');
    c.header('Content-Disposition', `attachment; filename="declaracion_habilitacion_${new Date().toISOString().split('T')[0]}.xml"`);
    return c.body(xml);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /habilitacion/exportar/autoevaluacion-excel - Exportar autoevaluación Excel
 */
habilitacion.get('/exportar/autoevaluacion-excel', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const workbook = await exportadorREPS.generarAutoevaluacionExcel();
    const buffer = await workbook.xlsx.writeBuffer();
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="autoevaluacion_habilitacion_${new Date().toISOString().split('T')[0]}.xlsx"`);
    return c.body(buffer);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /habilitacion/exportar/declaracion-pdf - Exportar declaración PDF
 */
habilitacion.get('/exportar/declaracion-pdf', permissionMiddleware('calidad_habilitacion'), async (c) => {
  try {
    const buffer = await exportadorREPS.generarDeclaracionPDF();
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="declaracion_habilitacion_${new Date().toISOString().split('T')[0]}.pdf"`);
    return c.body(buffer);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = habilitacion;
