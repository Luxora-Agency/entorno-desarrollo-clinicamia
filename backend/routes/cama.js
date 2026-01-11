/**
 * Rutas de camas
 */
const { Hono } = require('hono');
const camaService = require('../services/cama.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const cama = new Hono();

// Todas las rutas requieren autenticación
cama.use('/*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Cama:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         numero:
 *           type: string
 *         habitacion_id:
 *           type: string
 *           format: uuid
 *         estado:
 *           type: string
 *           enum: [Disponible, Ocupada, Mantenimiento, Reservada]
 *         observaciones:
 *           type: string
 *     CamaInput:
 *       type: object
 *       required:
 *         - numero
 *         - habitacion_id
 *       properties:
 *         numero:
 *           type: string
 *         habitacion_id:
 *           type: string
 *           format: uuid
 *         estado:
 *           type: string
 *           enum: [Disponible, Ocupada, Mantenimiento, Reservada]
 *         observaciones:
 *           type: string
 * tags:
 *   name: Camas
 *   description: Gestión de camas hospitalarias
 */

/**
 * @swagger
 * /camas/mapa:
 *   get:
 *     summary: Obtener mapa completo de ocupación
 *     tags: [Camas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unidadId
 *         schema:
 *           type: string
 *         description: ID de la unidad para filtrar
 *     responses:
 *       200:
 *         description: Mapa de ocupación
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
 *                   description: Estructura jerárquica de unidades, habitaciones y camas
 *       500:
 *         description: Error del servidor
 */
cama.get('/mapa', async (c) => {
  try {
    const { unidadId } = c.req.query();
    const mapa = await camaService.getMapaOcupacion(unidadId);
    return c.json(success(mapa));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /camas/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de ocupación
 *     tags: [Camas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unidadId
 *         schema:
 *           type: string
 *         description: ID de la unidad para filtrar
 *     responses:
 *       200:
 *         description: Estadísticas de ocupación
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
 *                     total:
 *                       type: integer
 *                     disponibles:
 *                       type: integer
 *                     ocupadas:
 *                       type: integer
 *                     mantenimiento:
 *                       type: integer
 *       500:
 *         description: Error del servidor
 */
cama.get('/estadisticas', async (c) => {
  try {
    const { unidadId } = c.req.query();
    const estadisticas = await camaService.getEstadisticas(unidadId);
    return c.json(success(estadisticas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /camas/disponibles:
 *   get:
 *     summary: Obtener camas disponibles
 *     tags: [Camas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unidadId
 *         schema:
 *           type: string
 *         description: ID de la unidad para filtrar
 *     responses:
 *       200:
 *         description: Lista de camas disponibles
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
 *                     camas:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Cama'
 *       500:
 *         description: Error del servidor
 */
cama.get('/disponibles', async (c) => {
  try {
    const { unidadId } = c.req.query();
    const camas = await camaService.getDisponibles(unidadId);
    return c.json(success({ camas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /camas:
 *   get:
 *     summary: Obtener todas las camas
 *     tags: [Camas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: habitacion_id
 *         schema:
 *           type: string
 *         description: Filtrar por habitación
 *     responses:
 *       200:
 *         description: Lista de camas
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
 *                     camas:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Cama'
 *       500:
 *         description: Error del servidor
 */
cama.get('/', async (c) => {
  try {
    const query = c.req.query();
    const camas = await camaService.getAll(query);
    return c.json(success({ camas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /camas/{id}:
 *   get:
 *     summary: Obtener una cama por ID
 *     tags: [Camas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cama
 *     responses:
 *       200:
 *         description: Datos de la cama
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
 *                     cama:
 *                       $ref: '#/components/schemas/Cama'
 *       404:
 *         description: Cama no encontrada
 *       500:
 *         description: Error del servidor
 */
cama.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const cama = await camaService.getById(id);
    return c.json(success({ cama }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /camas:
 *   post:
 *     summary: Crear una cama
 *     tags: [Camas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CamaInput'
 *     responses:
 *       201:
 *         description: Cama creada exitosamente
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
 *                     cama:
 *                       $ref: '#/components/schemas/Cama'
 *       500:
 *         description: Error del servidor
 */
cama.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const cama = await camaService.create(data);
    return c.json(success({ cama }, 'Cama creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /camas/{id}/estado:
 *   post:
 *     summary: Cambiar estado de una cama
 *     tags: [Camas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cama
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [Disponible, Ocupada, Mantenimiento, Reservada]
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado de cama actualizado
 *       404:
 *         description: Cama no encontrada
 *       500:
 *         description: Error del servidor
 */
cama.post('/:id/estado', async (c) => {
  try {
    const { id } = c.req.param();
    const { estado, motivo } = await c.req.json();
    const cama = await camaService.cambiarEstado(id, estado, motivo);
    return c.json(success({ cama }, 'Estado de cama actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /camas/{id}:
 *   put:
 *     summary: Actualizar una cama
 *     tags: [Camas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cama
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CamaInput'
 *     responses:
 *       200:
 *         description: Cama actualizada exitosamente
 *       404:
 *         description: Cama no encontrada
 *       500:
 *         description: Error del servidor
 */
cama.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const cama = await camaService.update(id, data);
    return c.json(success({ cama }, 'Cama actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /camas/{id}:
 *   delete:
 *     summary: Eliminar una cama
 *     tags: [Camas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cama
 *     responses:
 *       200:
 *         description: Cama eliminada correctamente
 *       404:
 *         description: Cama no encontrada
 *       500:
 *         description: Error del servidor
 */
cama.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await camaService.delete(id);
    return c.json(success(null, 'Cama eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = cama;
