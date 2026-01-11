/**
 * Rutas de Diagnósticos HCE
 */
const { Hono } = require('hono');
const diagnosticoService = require('../services/diagnosticoHCE.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const diagnosticos = new Hono();

// Todas las rutas requieren autenticación
diagnosticos.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Diagnostico:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         codigo_cie10:
 *           type: string
 *         descripcion:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [Principal, Relacionado]
 *         observaciones:
 *           type: string
 *         activo:
 *           type: boolean
 *     DiagnosticoInput:
 *       type: object
 *       required:
 *         - paciente_id
 *         - codigo_cie10
 *         - descripcion
 *       properties:
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         codigo_cie10:
 *           type: string
 *         descripcion:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [Principal, Relacionado]
 *         observaciones:
 *           type: string
 * tags:
 *   name: Diagnosticos
 *   description: Gestión de diagnósticos médicos
 */

/**
 * @swagger
 * /diagnosticos:
 *   get:
 *     summary: Obtener todos los diagnósticos
 *     tags: [Diagnosticos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paciente_id
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *     responses:
 *       200:
 *         description: Lista de diagnósticos
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
 *                     $ref: '#/components/schemas/Diagnostico'
 *       500:
 *         description: Error del servidor
 */
diagnosticos.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await diagnosticoService.getAll(query);
    return c.json(paginated(result.diagnosticos, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /diagnosticos/{id}:
 *   get:
 *     summary: Obtener un diagnóstico por ID
 *     tags: [Diagnosticos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del diagnóstico
 *     responses:
 *       200:
 *         description: Datos del diagnóstico
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
 *                     diagnostico:
 *                       $ref: '#/components/schemas/Diagnostico'
 *       404:
 *         description: Diagnóstico no encontrado
 *       500:
 *         description: Error del servidor
 */
diagnosticos.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const diagnostico = await diagnosticoService.getById(id);
    return c.json(success({ diagnostico }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /diagnosticos/principal/{paciente_id}:
 *   get:
 *     summary: Obtener diagnóstico principal activo
 *     tags: [Diagnosticos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paciente_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Diagnóstico principal
 *       500:
 *         description: Error del servidor
 */
diagnosticos.get('/principal/:paciente_id', async (c) => {
  try {
    const { paciente_id } = c.req.param();
    const diagnostico = await diagnosticoService.getDiagnosticoPrincipal(paciente_id);
    return c.json(success({ diagnostico }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /diagnosticos:
 *   post:
 *     summary: Crear nuevo diagnóstico
 *     tags: [Diagnosticos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiagnosticoInput'
 *     responses:
 *       201:
 *         description: Diagnóstico registrado correctamente
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
 *                     diagnostico:
 *                       $ref: '#/components/schemas/Diagnostico'
 *       500:
 *         description: Error del servidor
 */
diagnosticos.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const diagnostico = await diagnosticoService.create(body, user.id, user, ipOrigen);
    return c.json(success({ diagnostico }, 'Diagnóstico registrado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /diagnosticos/{id}:
 *   put:
 *     summary: Actualizar diagnóstico
 *     tags: [Diagnosticos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del diagnóstico
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiagnosticoInput'
 *     responses:
 *       200:
 *         description: Diagnóstico actualizado correctamente
 *       404:
 *         description: Diagnóstico no encontrado
 *       500:
 *         description: Error del servidor
 */
diagnosticos.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const diagnostico = await diagnosticoService.update(id, body, user.id, user, ipOrigen);
    return c.json(success({ diagnostico }, 'Diagnóstico actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = diagnosticos;
