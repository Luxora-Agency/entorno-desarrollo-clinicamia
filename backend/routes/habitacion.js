/**
 * Rutas de habitaciones
 */
const { Hono } = require('hono');
const habitacionService = require('../services/habitacion.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const habitacion = new Hono();

// Todas las rutas requieren autenticación
habitacion.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Habitacion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         numero:
 *           type: string
 *         unidad_id:
 *           type: string
 *           format: uuid
 *         piso:
 *           type: integer
 *         capacidad_camas:
 *           type: integer
 *         activo:
 *           type: boolean
 *     HabitacionInput:
 *       type: object
 *       required:
 *         - numero
 *         - unidad_id
 *       properties:
 *         numero:
 *           type: string
 *         unidad_id:
 *           type: string
 *           format: uuid
 *         piso:
 *           type: integer
 *         capacidad_camas:
 *           type: integer
 * tags:
 *   name: Habitaciones
 *   description: Gestión de habitaciones hospitalarias
 */

/**
 * @swagger
 * /habitaciones:
 *   get:
 *     summary: Obtener todas las habitaciones
 *     tags: [Habitaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unidad_id
 *         schema:
 *           type: string
 *         description: Filtrar por unidad
 *     responses:
 *       200:
 *         description: Lista de habitaciones
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
 *                     habitaciones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Habitacion'
 *       500:
 *         description: Error del servidor
 */
habitacion.get('/', async (c) => {
  try {
    const query = c.req.query();
    const habitaciones = await habitacionService.getAll(query);
    return c.json(success({ habitaciones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /habitaciones/{id}:
 *   get:
 *     summary: Obtener una habitación por ID
 *     tags: [Habitaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la habitación
 *     responses:
 *       200:
 *         description: Datos de la habitación
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
 *                     habitacion:
 *                       $ref: '#/components/schemas/Habitacion'
 *       404:
 *         description: Habitación no encontrada
 *       500:
 *         description: Error del servidor
 */
habitacion.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const habitacion = await habitacionService.getById(id);
    return c.json(success({ habitacion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /habitaciones:
 *   post:
 *     summary: Crear una habitación
 *     tags: [Habitaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HabitacionInput'
 *     responses:
 *       201:
 *         description: Habitación creada exitosamente
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
 *                     habitacion:
 *                       $ref: '#/components/schemas/Habitacion'
 *       500:
 *         description: Error del servidor
 */
habitacion.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const habitacion = await habitacionService.create(data);
    return c.json(success({ habitacion }, 'Habitación creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /habitaciones/{id}:
 *   put:
 *     summary: Actualizar una habitación
 *     tags: [Habitaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la habitación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HabitacionInput'
 *     responses:
 *       200:
 *         description: Habitación actualizada exitosamente
 *       404:
 *         description: Habitación no encontrada
 *       500:
 *         description: Error del servidor
 */
habitacion.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const habitacion = await habitacionService.update(id, data);
    return c.json(success({ habitacion }, 'Habitación actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /habitaciones/{id}:
 *   delete:
 *     summary: Eliminar una habitación
 *     tags: [Habitaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la habitación
 *     responses:
 *       200:
 *         description: Habitación eliminada correctamente
 *       404:
 *         description: Habitación no encontrada
 *       500:
 *         description: Error del servidor
 */
habitacion.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await habitacionService.delete(id);
    return c.json(success(null, 'Habitación eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = habitacion;
