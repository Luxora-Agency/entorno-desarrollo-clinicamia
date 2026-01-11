/**
 * Rutas de admisiones/hospitalizaciones
 */
const { Hono } = require('hono');
const admisionService = require('../services/admision.service');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAdmisionSchema } = require('../validators/admision.schema');
const { success, error } = require('../utils/response');

const admision = new Hono();

// Todas las rutas requieren autenticación
admision.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Admision:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         fecha_ingreso:
 *           type: string
 *           format: date-time
 *         cama_id:
 *           type: string
 *           format: uuid
 *         diagnostico:
 *           type: string
 *         estado:
 *           type: string
 *           enum: [ACTIVO, ALTA, REMITIDO, FALLECIDO]
 *     AdmisionInput:
 *       type: object
 *       required:
 *         - paciente_id
 *         - fecha_ingreso
 *       properties:
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         fecha_ingreso:
 *           type: string
 *           format: date-time
 *         cama_id:
 *           type: string
 *           format: uuid
 *         diagnostico:
 *           type: string
 *         observaciones:
 *           type: string
 * tags:
 *   name: Admisiones
 *   description: Gestión de hospitalizaciones
 */

/**
 * @swagger
 * /admisiones:
 *   get:
 *     summary: Obtener todas las admisiones
 *     tags: [Admisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: paciente_id
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *     responses:
 *       200:
 *         description: Lista de admisiones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     admisiones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Admision'
 *       500:
 *         description: Error del servidor
 */
admision.get('/', async (c) => {
  try {
    const query = c.req.query();
    const admisiones = await admisionService.getAll(query);
    return c.json(success({ admisiones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /admisiones/doctor/{doctorId}:
 *   get:
 *     summary: Obtener admisiones a cargo de un doctor
 *     tags: [Admisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del doctor
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite por página
 *     responses:
 *       200:
 *         description: Lista de admisiones del doctor
 */
admision.get('/doctor/:doctorId', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const query = c.req.query();
    const result = await admisionService.getByDoctor(doctorId, query);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /admisiones/doctor/{doctorId}/stats:
 *   get:
 *     summary: Obtener estadísticas del doctor para selector de atención
 *     tags: [Admisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del doctor
 *     responses:
 *       200:
 *         description: Estadísticas del doctor
 */
admision.get('/doctor/:doctorId/stats', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const stats = await admisionService.getDoctorStats(doctorId);
    return c.json(success({ stats }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /admisiones/{id}:
 *   get:
 *     summary: Obtener una admisión por ID
 *     tags: [Admisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la admisión
 *     responses:
 *       200:
 *         description: Datos de la admisión
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     admision:
 *                       $ref: '#/components/schemas/Admision'
 *       404:
 *         description: Admisión no encontrada
 *       500:
 *         description: Error del servidor
 */
admision.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const admision = await admisionService.getById(id);
    return c.json(success({ admision }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /admisiones:
 *   post:
 *     summary: Crear una admisión (iniciar hospitalización)
 *     tags: [Admisiones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdmisionInput'
 *     responses:
 *       201:
 *         description: Admisión registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     admision:
 *                       $ref: '#/components/schemas/Admision'
 *       500:
 *         description: Error del servidor
 */
admision.post('/', validate(createAdmisionSchema), async (c) => {
  try {
    const data = c.req.validData;
    const admision = await admisionService.create(data);
    return c.json(success({ admision }, 'Admisión registrada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /admisiones/{id}/egreso:
 *   post:
 *     summary: Registrar egreso
 *     tags: [Admisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la admisión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha_egreso:
 *                 type: string
 *                 format: date-time
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Egreso registrado exitosamente
 *       404:
 *         description: Admisión no encontrada
 *       500:
 *         description: Error del servidor
 */
admision.post('/:id/administrar', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const admision = await admisionService.egreso(id, data);
    return c.json(success({ admision }, 'Egreso registrado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /admisiones/{id}:
 *   delete:
 *     summary: Eliminar una admisión
 *     tags: [Admisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la admisión
 *     responses:
 *       200:
 *         description: Admisión eliminada correctamente
 *       404:
 *         description: Admisión no encontrada
 *       500:
 *         description: Error del servidor
 */
admision.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const admision = await admisionService.delete(id);
    return c.json(success(null, 'Admisión eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = admision;
