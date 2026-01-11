/**
 * Rutas de Notas de Enfermería
 */
const { Hono } = require('hono');
const notaService = require('../services/notaEnfermeria.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const notasEnfermeria = new Hono();

notasEnfermeria.use('/*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     NotaEnfermeria:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         admision_id:
 *           type: string
 *           format: uuid
 *         nota:
 *           type: string
 *         fecha_registro:
 *           type: string
 *           format: date-time
 *     NotaEnfermeriaInput:
 *       type: object
 *       required:
 *         - paciente_id
 *         - admision_id
 *         - nota
 *       properties:
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         admision_id:
 *           type: string
 *           format: uuid
 *         nota:
 *           type: string
 * tags:
 *   name: NotasEnfermeria
 *   description: Gestión de notas de enfermería
 */

/**
 * @swagger
 * /notas-enfermeria:
 *   post:
 *     summary: Crear nota de enfermería
 *     tags: [NotasEnfermeria]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotaEnfermeriaInput'
 *     responses:
 *       201:
 *         description: Nota registrada
 *       500:
 *         description: Error del servidor
 */
notasEnfermeria.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const nota = await notaService.crear(data);
    return c.json(success({ nota }, 'Nota registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /notas-enfermeria/admision/{admisionId}:
 *   get:
 *     summary: Notas de una admisión
 *     tags: [NotasEnfermeria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admisionId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la admisión
 *     responses:
 *       200:
 *         description: Lista de notas
 *       500:
 *         description: Error del servidor
 */
notasEnfermeria.get('/admision/:admisionId', async (c) => {
  try {
    const { admisionId } = c.req.param();
    const { limit } = c.req.query();
    const notas = await notaService.obtenerPorAdmision(admisionId, limit);
    return c.json(success({ notas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /notas-enfermeria/paciente/{pacienteId}:
 *   get:
 *     summary: Notas de un paciente
 *     tags: [NotasEnfermeria]
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
 *         description: Lista de notas
 *       500:
 *         description: Error del servidor
 */
notasEnfermeria.get('/paciente/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const { limit } = c.req.query();
    const notas = await notaService.obtenerPorPaciente(pacienteId, limit);
    return c.json(success({ notas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /notas-enfermeria/enfermera/{enfermeraId}:
 *   get:
 *     summary: Notas de una enfermera (turno actual)
 *     tags: [NotasEnfermeria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enfermeraId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la enfermera
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de las notas
 *       - in: query
 *         name: turno
 *         schema:
 *           type: string
 *         description: Turno
 *     responses:
 *       200:
 *         description: Lista de notas
 *       500:
 *         description: Error del servidor
 */
notasEnfermeria.get('/enfermera/:enfermeraId', async (c) => {
  try {
    const { enfermeraId } = c.req.param();
    const { fecha, turno } = c.req.query();
    const notas = await notaService.obtenerPorEnfermera(enfermeraId, fecha, turno);
    return c.json(success({ notas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = notasEnfermeria;
