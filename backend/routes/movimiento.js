/**
 * Rutas de movimientos de pacientes
 */
const { Hono } = require('hono');
const movimientoService = require('../services/movimiento.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const movimiento = new Hono();

// Todas las rutas requieren autenticación
movimiento.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Movimiento:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         admision_id:
 *           type: string
 *           format: uuid
 *         tipo:
 *           type: string
 *           enum: [Ingreso, Traslado, CambioCama, CambioUnidad, Egreso]
 *         unidad_origen_id:
 *           type: string
 *           format: uuid
 *         unidad_destino_id:
 *           type: string
 *           format: uuid
 *         cama_origen_id:
 *           type: string
 *           format: uuid
 *         cama_destino_id:
 *           type: string
 *           format: uuid
 *         motivo:
 *           type: string
 *         observaciones:
 *           type: string
 *         fecha_movimiento:
 *           type: string
 *           format: date-time
 *     MovimientoInput:
 *       type: object
 *       required:
 *         - admision_id
 *         - tipo
 *       properties:
 *         admision_id:
 *           type: string
 *           format: uuid
 *         tipo:
 *           type: string
 *           enum: [Ingreso, Traslado, CambioCama, CambioUnidad, Egreso]
 *         unidad_destino_id:
 *           type: string
 *           format: uuid
 *         cama_destino_id:
 *           type: string
 *           format: uuid
 *         motivo:
 *           type: string
 *         observaciones:
 *           type: string
 * tags:
 *   name: Movimientos
 *   description: Historial de movimientos de pacientes
 */

/**
 * @swagger
 * /movimientos:
 *   get:
 *     summary: Obtener todos los movimientos
 *     tags: [Movimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: admision_id
 *         schema:
 *           type: string
 *         description: Filtrar por admisión
 *     responses:
 *       200:
 *         description: Lista de movimientos
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
 *                     movimientos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Movimiento'
 *       500:
 *         description: Error del servidor
 */
movimiento.get('/', async (c) => {
  try {
    const query = c.req.query();
    const movimientos = await movimientoService.getAll(query);
    return c.json(success({ movimientos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /movimientos/{id}:
 *   get:
 *     summary: Obtener un movimiento por ID
 *     tags: [Movimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del movimiento
 *     responses:
 *       200:
 *         description: Datos del movimiento
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
 *                     movimiento:
 *                       $ref: '#/components/schemas/Movimiento'
 *       404:
 *         description: Movimiento no encontrado
 *       500:
 *         description: Error del servidor
 */
movimiento.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const movimiento = await movimientoService.getById(id);
    return c.json(success({ movimiento }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /movimientos:
 *   post:
 *     summary: Crear un movimiento (traslado)
 *     tags: [Movimientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MovimientoInput'
 *     responses:
 *       201:
 *         description: Movimiento registrado exitosamente
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
 *                     movimiento:
 *                       $ref: '#/components/schemas/Movimiento'
 *       500:
 *         description: Error del servidor
 */
movimiento.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const movimiento = await movimientoService.create(data);
    return c.json(success({ movimiento }, 'Movimiento registrado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /movimientos/{id}:
 *   delete:
 *     summary: Eliminar un movimiento
 *     tags: [Movimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del movimiento
 *     responses:
 *       200:
 *         description: Movimiento eliminado correctamente
 *       404:
 *         description: Movimiento no encontrado
 *       500:
 *         description: Error del servidor
 */
movimiento.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await movimientoService.delete(id);
    return c.json(success(null, 'Movimiento eliminado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = movimiento;
