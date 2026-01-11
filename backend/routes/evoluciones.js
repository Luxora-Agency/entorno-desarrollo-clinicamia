/**
 * Rutas de Evoluciones Clínicas (SOAP)
 */
const { Hono } = require('hono');
const evolucionService = require('../services/evolucionClinica.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const evoluciones = new Hono();

// Todas las rutas requieren autenticación
evoluciones.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Evolucion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         medico_id:
 *           type: string
 *           format: uuid
 *         subjetivo:
 *           type: string
 *           description: Componente S del SOAP
 *         objetivo:
 *           type: string
 *           description: Componente O del SOAP
 *         analisis:
 *           type: string
 *           description: Componente A del SOAP
 *         plan:
 *           type: string
 *           description: Componente P del SOAP
 *         firmado:
 *           type: boolean
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *     EvolucionInput:
 *       type: object
 *       required:
 *         - paciente_id
 *         - subjetivo
 *         - objetivo
 *         - analisis
 *         - plan
 *       properties:
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         subjetivo:
 *           type: string
 *         objetivo:
 *           type: string
 *         analisis:
 *           type: string
 *         plan:
 *           type: string
 * tags:
 *   name: Evoluciones
 *   description: Gestión de evoluciones clínicas (SOAP)
 */

/**
 * @swagger
 * /evoluciones:
 *   get:
 *     summary: Obtener todas las evoluciones
 *     tags: [Evoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paciente_id
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *       - in: query
 *         name: medico_id
 *         schema:
 *           type: string
 *         description: Filtrar por médico
 *     responses:
 *       200:
 *         description: Lista de evoluciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evolucion'
 *       500:
 *         description: Error del servidor
 */
evoluciones.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await evolucionService.getAll(query);
    return c.json(paginated(result.evoluciones, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /evoluciones/{id}:
 *   get:
 *     summary: Obtener una evolución por ID
 *     tags: [Evoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la evolución
 *     responses:
 *       200:
 *         description: Datos de la evolución
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
 *                     evolucion:
 *                       $ref: '#/components/schemas/Evolucion'
 *       404:
 *         description: Evolución no encontrada
 *       500:
 *         description: Error del servidor
 */
evoluciones.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const evolucion = await evolucionService.getById(id);
    return c.json(success({ evolucion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /evoluciones:
 *   post:
 *     summary: Crear nueva evolución clínica
 *     tags: [Evoluciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EvolucionInput'
 *     responses:
 *       201:
 *         description: Evolución clínica creada correctamente
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
 *                     evolucion:
 *                       $ref: '#/components/schemas/Evolucion'
 *       500:
 *         description: Error del servidor
 */
evoluciones.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const evolucion = await evolucionService.create(body, user.id, user, ipOrigen);
    return c.json(success({ evolucion }, 'Evolución clínica creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /evoluciones/{id}/firmar:
 *   post:
 *     summary: Firmar evolución clínica
 *     tags: [Evoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la evolución
 *     responses:
 *       200:
 *         description: Evolución firmada correctamente
 *       404:
 *         description: Evolución no encontrada
 *       500:
 *         description: Error del servidor
 */
evoluciones.post('/:id/administrar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const evolucion = await evolucionService.firmar(id, user.id, user, ipOrigen);
    return c.json(success({ evolucion }, 'Evolución firmada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /evoluciones/{id}:
 *   delete:
 *     summary: Eliminar evolución (solo si no está firmada)
 *     tags: [Evoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la evolución
 *     responses:
 *       200:
 *         description: Evolución eliminada correctamente
 *       400:
 *         description: No se puede eliminar una evolución firmada
 *       404:
 *         description: Evolución no encontrada
 *       500:
 *         description: Error del servidor
 */
evoluciones.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    
    await evolucionService.delete(id, user.id, user);
    return c.json(success(null, 'Evolución eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = evoluciones;
