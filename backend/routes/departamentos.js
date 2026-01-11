/**
 * Rutas de departamentos
 */
const { Hono } = require('hono');
const departamentoService = require('../services/departamento.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const departamentos = new Hono();

// Todas las rutas requieren autenticación
departamentos.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Departamento:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *     DepartamentoInput:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 * tags:
 *   name: Departamentos
 *   description: Gestión de departamentos
 */

/**
 * @swagger
 * /departamentos:
 *   get:
 *     summary: Obtener todos los departamentos
 *     tags: [Departamentos]
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
 *         description: Lista de departamentos
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
 *                     $ref: '#/components/schemas/Departamento'
 *       500:
 *         description: Error del servidor
 */
departamentos.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await departamentoService.getAll(query);
    return c.json(paginated(result.departamentos, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /departamentos/{id}:
 *   get:
 *     summary: Obtener un departamento por ID
 *     tags: [Departamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del departamento
 *     responses:
 *       200:
 *         description: Datos del departamento
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
 *                     departamento:
 *                       $ref: '#/components/schemas/Departamento'
 *       404:
 *         description: Departamento no encontrado
 *       500:
 *         description: Error del servidor
 */
departamentos.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const departamento = await departamentoService.getById(id);
    return c.json(success({ departamento }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /departamentos:
 *   post:
 *     summary: Crear un departamento
 *     tags: [Departamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepartamentoInput'
 *     responses:
 *       201:
 *         description: Departamento creado exitosamente
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
 *                     departamento:
 *                       $ref: '#/components/schemas/Departamento'
 *       500:
 *         description: Error del servidor
 */
departamentos.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const departamento = await departamentoService.create(data);
    return c.json(success({ departamento }, 'Departamento creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /departamentos/{id}:
 *   put:
 *     summary: Actualizar un departamento
 *     tags: [Departamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del departamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepartamentoInput'
 *     responses:
 *       200:
 *         description: Departamento actualizado exitosamente
 *       404:
 *         description: Departamento no encontrado
 *       500:
 *         description: Error del servidor
 */
departamentos.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const departamento = await departamentoService.update(id, data);
    return c.json(success({ departamento }, 'Departamento actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /departamentos/{id}:
 *   delete:
 *     summary: Eliminar un departamento
 *     tags: [Departamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del departamento
 *     responses:
 *       200:
 *         description: Departamento eliminado correctamente
 *       404:
 *         description: Departamento no encontrado
 *       500:
 *         description: Error del servidor
 */
departamentos.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await departamentoService.delete(id);
    return c.json(success(null, 'Departamento eliminado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = departamentos;
