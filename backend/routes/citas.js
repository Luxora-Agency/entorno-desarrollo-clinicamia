/**
 * Rutas de citas
 */
const { Hono } = require('hono');
const citaService = require('../services/cita.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { ZodError } = require('zod');


const citas = new Hono();

// Helper para manejar errores
const handleError = (c, err) => {
  if (err instanceof ZodError) {
    const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return c.json(error(`Error de validación: ${messages}`), 400);
  }
  return c.json(error(err.message), err.statusCode || 500);
};

// Todas las rutas requieren autenticación
citas.use('*', authMiddleware);

// Todas las rutas requieren permiso al módulo 'citas'
citas.use('*', permissionMiddleware('citas'));

/**
 * @swagger
 * components:
 *   schemas:
 *     Cita:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         fecha:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: string
 *           enum: [PENDIENTE, CONFIRMADA, CANCELADA, REALIZADA]
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         doctor_id:
 *           type: string
 *           format: uuid
 *         especialidad_id:
 *           type: string
 *         observaciones:
 *           type: string
 *     CitaInput:
 *       type: object
 *       required:
 *         - fecha
 *         - paciente_id
 *         - doctor_id
 *       properties:
 *         fecha:
 *           type: string
 *           format: date-time
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         doctor_id:
 *           type: string
 *           format: uuid
 *         especialidad_id:
 *           type: string
 *         observaciones:
 *           type: string
 * tags:
 *   name: Citas
 *   description: Gestión de citas médicas
 */

/**
 * @swagger
 * /citas:
 *   get:
 *     summary: Obtener todas las citas paginadas
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *         description: Filtrar por doctor
 *       - in: query
 *         name: paciente_id
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *     responses:
 *       200:
 *         description: Lista de citas
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
 *                     $ref: '#/components/schemas/Cita'
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Error del servidor
 */
citas.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await citaService.getAll(query);
    return c.json(paginated(result.citas, result.pagination));
  } catch (err) {
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas/{id}:
 *   get:
 *     summary: Obtener una cita por ID
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cita
 *     responses:
 *       200:
 *         description: Datos de la cita
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
 *                     cita:
 *                       $ref: '#/components/schemas/Cita'
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
citas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const cita = await citaService.getById(id);
    return c.json(success({ cita }));
  } catch (err) {
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas:
 *   post:
 *     summary: Crear una nueva cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CitaInput'
 *     responses:
 *       201:
 *         description: Cita creada exitosamente
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
 *                     cita:
 *                       $ref: '#/components/schemas/Cita'
 *       500:
 *         description: Error del servidor
 */
citas.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const cita = await citaService.create(data);
    return c.json(success({ cita }, 'Cita creada exitosamente'), 201);
  } catch (err) {
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas/{id}:
 *   put:
 *     summary: Actualizar una cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cita
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CitaInput'
 *     responses:
 *       200:
 *         description: Cita actualizada exitosamente
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
citas.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const cita = await citaService.update(id, data);
    return c.json(success({ cita }, 'Cita actualizada exitosamente'));
  } catch (err) {
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas/estado/{id}:
 *   post:
 *     summary: Actualizar estado de una cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cita
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [PENDIENTE, CONFIRMADA, CANCELADA, REALIZADA]
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
citas.post('/estado/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const cita = await citaService.update(id, data);
    return c.json(success({ cita }, 'Cita actualizada exitosamente'));
  } catch (err) {
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas/{id}:
 *   delete:
 *     summary: Cancelar (eliminar) una cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cita
 *     responses:
 *       200:
 *         description: Cita cancelada correctamente
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
citas.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await citaService.cancel(id);
    return c.json(success(null, 'Cita cancelada correctamente'));
  } catch (err) {
    return handleError(c, err);
  }
});

module.exports = citas;
