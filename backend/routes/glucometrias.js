/**
 * @swagger
 * tags:
 *   name: Glucometrias
 *   description: Control de glucometría de pacientes
 * components:
 *   schemas:
 *     Glucometria:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         pacienteId:
 *           type: string
 *           format: uuid
 *         admisionId:
 *           type: string
 *           format: uuid
 *         valor:
 *           type: number
 *           description: Valor de glucosa en mg/dL
 *         momento:
 *           type: string
 *           enum: [Ayunas, Preprandial, Postprandial, Random]
 *         fechaRegistro:
 *           type: string
 *           format: date-time
 *     GlucometriaInput:
 *       type: object
 *       required:
 *         - pacienteId
 *         - valor
 *         - momento
 *       properties:
 *         pacienteId:
 *           type: string
 *           format: uuid
 *         admisionId:
 *           type: string
 *           format: uuid
 *         valor:
 *           type: number
 *         momento:
 *           type: string
 *           enum: [Ayunas, Preprandial, Postprandial, Random]
 *         observaciones:
 *           type: string
 */

const { Hono } = require('hono');
const controller = require('../controllers/glucometria.controller');
const { authMiddleware: protect, roleMiddleware: authorize } = require('../middleware/auth');

const app = new Hono();

app.use('*', protect);

/**
 * @swagger
 * /glucometrias:
 *   post:
 *     summary: Registrar nueva glucometría
 *     tags: [Glucometrias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GlucometriaInput'
 *     responses:
 *       201:
 *         description: Glucometría registrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.post('/', authorize('NURSE', 'DOCTOR', 'ADMIN'), controller.create);

/**
 * @swagger
 * /glucometrias:
 *   get:
 *     summary: Listar glucometrías
 *     tags: [Glucometrias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pacienteId
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *       - in: query
 *         name: admisionId
 *         schema:
 *           type: string
 *         description: Filtrar por admisión
 *     responses:
 *       200:
 *         description: Lista de glucometrías
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/', authorize('NURSE', 'DOCTOR', 'ADMIN'), controller.getAll);

/**
 * @swagger
 * /glucometrias/stats/{pacienteId}:
 *   get:
 *     summary: Estadísticas de glucometría de un paciente
 *     tags: [Glucometrias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Estadísticas de glucometría
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 promedio:
 *                   type: number
 *                 minimo:
 *                   type: number
 *                 maximo:
 *                   type: number
 *                 totalMediciones:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/stats/:pacienteId', authorize('NURSE', 'DOCTOR', 'ADMIN'), controller.getStats);

module.exports = app;
