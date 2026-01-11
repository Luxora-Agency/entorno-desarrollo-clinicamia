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
 * @swagger
 * components:
 *   schemas:
 *     AtencionUrgencia:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         motivo_consulta:
 *           type: string
 *         triaje:
 *           type: string
 *           enum: [Reanimacion, Emergencia, Urgencia, UrgenciaMenor, SinUrgencia]
 *         estado:
 *           type: string
 *           enum: [EsperaTriaje, EsperaAtencion, EnAtencion, Observacion, Alta, Hospitalizado]
 *         fecha_ingreso:
 *           type: string
 *           format: date-time
 *     TriajeInput:
 *       type: object
 *       required:
 *         - paciente_id
 *         - motivo_consulta
 *         - triaje
 *       properties:
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         motivo_consulta:
 *           type: string
 *         triaje:
 *           type: string
 *           enum: [Reanimacion, Emergencia, Urgencia, UrgenciaMenor, SinUrgencia]
 *         signos_vitales:
 *           type: object
 * tags:
 *   name: Urgencias
 *   description: Gestión de urgencias y triaje
 */

/**
 * @swagger
 * /urgencias/triaje:
 *   post:
 *     summary: Crear triaje (ingreso a urgencias)
 *     tags: [Urgencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TriajeInput'
 *     responses:
 *       201:
 *         description: Triaje registrado exitosamente
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /urgencias:
 *   get:
 *     summary: Listar atenciones de urgencia
 *     tags: [Urgencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha
 *     responses:
 *       200:
 *         description: Lista de atenciones
 *       500:
 *         description: Error del servidor
 */
urgencias.get('/', async (c) => {
  try {
    const { estado, fecha, pacienteId, paciente_id, limit } = c.req.query();
    const atenciones = await urgenciaService.listar({ estado, fecha, pacienteId, paciente_id, limit });
    return c.json(success({ atenciones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /urgencias/estadisticas:
 *   get:
 *     summary: Estadísticas de urgencias del día
 *     tags: [Urgencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para estadísticas
 *     responses:
 *       200:
 *         description: Estadísticas de urgencias
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /urgencias/{id}:
 *   get:
 *     summary: Obtener atención de urgencia específica
 *     tags: [Urgencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la atención
 *     responses:
 *       200:
 *         description: Datos de la atención
 *       404:
 *         description: Atención no encontrada
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /urgencias/{id}/atender:
 *   put:
 *     summary: Iniciar atención médica
 *     tags: [Urgencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la atención
 *     responses:
 *       200:
 *         description: Atención iniciada
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /urgencias/{id}/alta:
 *   put:
 *     summary: Dar de alta de urgencias
 *     tags: [Urgencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la atención
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diagnostico_egreso
 *               - tipo_alta
 *             properties:
 *               diagnostico_egreso:
 *                 type: string
 *               tipo_alta:
 *                 type: string
 *               indicaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alta registrada
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /urgencias/{id}/hospitalizar:
 *   put:
 *     summary: Hospitalizar paciente desde urgencias
 *     tags: [Urgencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la atención
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cama_id
 *             properties:
 *               cama_id:
 *                 type: string
 *                 format: uuid
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Paciente hospitalizado
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /urgencias/{id}/programar-cita:
 *   put:
 *     summary: Programar cita de seguimiento desde urgencias
 *     tags: [Urgencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la atención
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *               - especialidad_id
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               especialidad_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Cita programada
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /urgencias/{id}:
 *   put:
 *     summary: Actualizar atención de urgencia
 *     tags: [Urgencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la atención
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo_consulta:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Atención actualizada
 *       500:
 *         description: Error del servidor
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
