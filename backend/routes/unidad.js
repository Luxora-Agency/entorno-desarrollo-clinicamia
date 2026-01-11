/**
 * Rutas de unidades hospitalarias
 */
const { Hono } = require('hono');
const unidadService = require('../services/unidad.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const unidad = new Hono();

// Todas las rutas requieren autenticación
unidad.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Unidad:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         tipo:
 *           type: string
 *           description: Tipo de unidad (UCI, Hospitalización, etc.)
 *         capacidad:
 *           type: integer
 *         activo:
 *           type: boolean
 *     UnidadInput:
 *       type: object
 *       required:
 *         - nombre
 *         - tipo
 *       properties:
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         tipo:
 *           type: string
 *         capacidad:
 *           type: integer
 * tags:
 *   name: Unidades
 *   description: Gestión de unidades hospitalarias
 */

/**
 * @swagger
 * /unidades:
 *   get:
 *     summary: Obtener todas las unidades
 *     tags: [Unidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de unidad
 *     responses:
 *       200:
 *         description: Lista de unidades
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
 *                     unidades:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Unidad'
 *       500:
 *         description: Error del servidor
 */
unidad.get('/', async (c) => {
  try {
    const query = c.req.query();
    const unidades = await unidadService.getAll(query);
    return c.json(success({ unidades }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /unidades/{id}:
 *   get:
 *     summary: Obtener una unidad por ID
 *     tags: [Unidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la unidad
 *     responses:
 *       200:
 *         description: Datos de la unidad
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
 *                     unidad:
 *                       $ref: '#/components/schemas/Unidad'
 *       404:
 *         description: Unidad no encontrada
 *       500:
 *         description: Error del servidor
 */
unidad.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const unidad = await unidadService.getById(id);
    return c.json(success({ unidad }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /unidades:
 *   post:
 *     summary: Crear una unidad
 *     tags: [Unidades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnidadInput'
 *     responses:
 *       201:
 *         description: Unidad creada exitosamente
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
 *                     unidad:
 *                       $ref: '#/components/schemas/Unidad'
 *       500:
 *         description: Error del servidor
 */
unidad.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const unidad = await unidadService.create(data);
    return c.json(success({ unidad }, 'Unidad creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /unidades/{id}:
 *   put:
 *     summary: Actualizar una unidad
 *     tags: [Unidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la unidad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnidadInput'
 *     responses:
 *       200:
 *         description: Unidad actualizada exitosamente
 *       404:
 *         description: Unidad no encontrada
 *       500:
 *         description: Error del servidor
 */
unidad.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const unidad = await unidadService.update(id, data);
    return c.json(success({ unidad }, 'Unidad actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /unidades/{id}:
 *   delete:
 *     summary: Eliminar una unidad
 *     tags: [Unidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la unidad
 *     responses:
 *       200:
 *         description: Unidad eliminada correctamente
 *       404:
 *         description: Unidad no encontrada
 *       500:
 *         description: Error del servidor
 */
unidad.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await unidadService.delete(id);
    return c.json(success(null, 'Unidad eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = unidad;
