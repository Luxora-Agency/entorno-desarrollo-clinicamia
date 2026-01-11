/**
 * Rutas de especialidades
 */
const { Hono } = require('hono');
const especialidadService = require('../services/especialidad.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const especialidades = new Hono();

// Todas las rutas requieren autenticación
especialidades.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Especialidad:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *     EspecialidadInput:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 * tags:
 *   name: Especialidades
 *   description: Gestión de especialidades médicas
 */

/**
 * @swagger
 * /especialidades:
 *   get:
 *     summary: Obtener todas las especialidades
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Filtrar por nombre
 *     responses:
 *       200:
 *         description: Lista de especialidades
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
 *                     $ref: '#/components/schemas/Especialidad'
 *       500:
 *         description: Error del servidor
 */
especialidades.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await especialidadService.getAll(query);
    return c.json(paginated(result.especialidades, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /especialidades/{id}:
 *   get:
 *     summary: Obtener una especialidad por ID
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la especialidad
 *     responses:
 *       200:
 *         description: Datos de la especialidad
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
 *                     especialidad:
 *                       $ref: '#/components/schemas/Especialidad'
 *       404:
 *         description: Especialidad no encontrada
 *       500:
 *         description: Error del servidor
 */
especialidades.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const especialidad = await especialidadService.getById(id);
    return c.json(success({ especialidad }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /especialidades:
 *   post:
 *     summary: Crear una especialidad
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EspecialidadInput'
 *     responses:
 *       201:
 *         description: Especialidad creada exitosamente
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
 *                     especialidad:
 *                       $ref: '#/components/schemas/Especialidad'
 *       500:
 *         description: Error del servidor
 */
especialidades.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const especialidad = await especialidadService.create(data);
    return c.json(success({ especialidad }, 'Especialidad creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /especialidades/{id}:
 *   put:
 *     summary: Actualizar una especialidad
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la especialidad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EspecialidadInput'
 *     responses:
 *       200:
 *         description: Especialidad actualizada exitosamente
 *       404:
 *         description: Especialidad no encontrada
 *       500:
 *         description: Error del servidor
 */
especialidades.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const especialidad = await especialidadService.update(id, data);
    return c.json(success({ especialidad }, 'Especialidad actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /especialidades/{id}:
 *   delete:
 *     summary: Eliminar una especialidad
 *     tags: [Especialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la especialidad
 *     responses:
 *       200:
 *         description: Especialidad eliminada correctamente
 *       404:
 *         description: Especialidad no encontrada
 *       500:
 *         description: Error del servidor
 */
especialidades.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await especialidadService.delete(id);
    return c.json(success(null, 'Especialidad eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = especialidades;
