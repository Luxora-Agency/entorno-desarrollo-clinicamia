/**
 * Rutas de Administración de Medicamentos (Enfermería)
 */
const { Hono } = require('hono');
const administracionService = require('../services/administracion.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const administraciones = new Hono();

// Middleware de autenticación
administraciones.use('/*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     AdministracionMedicamento:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         prescripcion_id:
 *           type: string
 *           format: uuid
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         enfermera_id:
 *           type: string
 *           format: uuid
 *         medicamento:
 *           type: string
 *         dosis:
 *           type: string
 *         via:
 *           type: string
 *         estado:
 *           type: string
 *           enum: [Pendiente, Administrado, Omitido, Rechazado]
 *         fecha_programada:
 *           type: string
 *           format: date-time
 *         fecha_administracion:
 *           type: string
 *           format: date-time
 *     AdministracionInput:
 *       type: object
 *       required:
 *         - fecha_administracion
 *       properties:
 *         fecha_administracion:
 *           type: string
 *           format: date-time
 *         observaciones:
 *           type: string
 *         signos_vitales:
 *           type: object
 * tags:
 *   name: Administraciones
 *   description: Administración de medicamentos (Enfermería)
 */

/**
 * @swagger
 * /administraciones:
 *   get:
 *     summary: Obtener administraciones programadas
 *     tags: [Administraciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de programación
 *       - in: query
 *         name: pacienteId
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de administraciones
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /administraciones/resumen-dia:
 *   get:
 *     summary: Resumen de administraciones del día
 *     tags: [Administraciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha del resumen
 *       - in: query
 *         name: unidadId
 *         schema:
 *           type: string
 *         description: Filtrar por unidad
 *     responses:
 *       200:
 *         description: Resumen de administraciones
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /administraciones/historial/{pacienteId}:
 *   get:
 *     summary: Historial de administración de un paciente
 *     tags: [Administraciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Historial de administraciones
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /administraciones/pendientes/{pacienteId}:
 *   get:
 *     summary: Administraciones pendientes de un paciente
 *     tags: [Administraciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Administraciones pendientes
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /administraciones/{id}/administrar:
 *   post:
 *     summary: Registrar administración (Enfermería)
 *     tags: [Administraciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la administración
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdministracionInput'
 *     responses:
 *       200:
 *         description: Administración registrada exitosamente
 *       500:
 *         description: Error del servidor
 */
administraciones.post('/:id/administrar', async (c) => {
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
 * @swagger
 * /administraciones/{id}/omitir:
 *   post:
 *     summary: Registrar omisión (Enfermería)
 *     tags: [Administraciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la administración
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Omisión registrada
 *       500:
 *         description: Error del servidor
 */
administraciones.post('/:id/omitir', async (c) => {
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
 * @swagger
 * /administraciones/{id}/rechazar:
 *   post:
 *     summary: Registrar rechazo del paciente (Enfermería)
 *     tags: [Administraciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la administración
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rechazo registrado
 *       500:
 *         description: Error del servidor
 */
administraciones.post('/:id/rechazar', async (c) => {
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