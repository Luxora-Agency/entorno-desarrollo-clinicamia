/**
 * Rutas de Formularios de Contacto MiaPass
 */
const { Hono } = require('hono');
const formularioMiaPassService = require('../services/formularioMiaPass.service');
const { authMiddleware, requirePermission } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const formularioMiaPass = new Hono();

/**
 * @swagger
 * components:
 *   schemas:
 *     FormularioMiaPass:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombreCompleto:
 *           type: string
 *         numeroDocumento:
 *           type: string
 *         correoElectronico:
 *           type: string
 *           format: email
 *         celular:
 *           type: string
 *         cantidadPersonas:
 *           type: integer
 *         valorTotal:
 *           type: number
 *         estado:
 *           type: string
 *           enum: [Pendiente, Contactado, EnProceso, Completado, Cancelado]
 *         notas:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateFormularioMiaPass:
 *       type: object
 *       required:
 *         - nombreCompleto
 *         - numeroDocumento
 *         - correoElectronico
 *         - celular
 *         - cantidadPersonas
 *         - valorTotal
 *       properties:
 *         nombreCompleto:
 *           type: string
 *           description: Nombre completo del solicitante
 *           example: "Juan Pérez García"
 *         numeroDocumento:
 *           type: string
 *           description: Número de documento de identidad
 *           example: "1234567890"
 *         correoElectronico:
 *           type: string
 *           format: email
 *           description: Correo electrónico de contacto
 *           example: "juan.perez@email.com"
 *         celular:
 *           type: string
 *           description: Número de celular
 *           example: "3001234567"
 *         cantidadPersonas:
 *           type: integer
 *           description: Cantidad de personas del plan
 *           example: 4
 *         valorTotal:
 *           type: number
 *           description: Valor total del plan
 *           example: 150000
 */

/**
 * @swagger
 * /formulario-mia-pass:
 *   post:
 *     summary: Crear nuevo formulario de contacto MiaPass
 *     description: Endpoint público para recibir solicitudes de contacto de MiaPass
 *     tags: [Formulario MiaPass]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFormularioMiaPass'
 *     responses:
 *       201:
 *         description: Formulario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FormularioMiaPass'
 *       400:
 *         description: Error de validación
 */
formularioMiaPass.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const formulario = await formularioMiaPassService.create(data);
    return c.json(success(formulario, 'Formulario recibido exitosamente. Nos pondremos en contacto pronto.'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Rutas protegidas (requieren autenticación)

/**
 * @swagger
 * /formulario-mia-pass:
 *   get:
 *     summary: Listar todos los formularios de contacto
 *     description: Obtiene lista paginada de formularios (requiere autenticación)
 *     tags: [Formulario MiaPass]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Pendiente, Contactado, EnProceso, Completado, Cancelado]
 *         description: Filtrar por estado
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
 *           default: 20
 *         description: Registros por página
 *     responses:
 *       200:
 *         description: Lista de formularios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FormularioMiaPass'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
formularioMiaPass.get('/', authMiddleware, requirePermission('miapass.formularios.read'), async (c) => {
  try {
    const filters = c.req.query();
    const result = await formularioMiaPassService.getAll(filters);
    return c.json(paginated(result.formularios, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /formulario-mia-pass/stats:
 *   get:
 *     summary: Obtener estadísticas de formularios
 *     tags: [Formulario MiaPass]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de formularios
 */
formularioMiaPass.get('/stats', authMiddleware, requirePermission('miapass.formularios.read'), async (c) => {
  try {
    const stats = await formularioMiaPassService.getStats();
    return c.json(success(stats));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /formulario-mia-pass/{id}:
 *   get:
 *     summary: Obtener un formulario por ID
 *     tags: [Formulario MiaPass]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del formulario
 *     responses:
 *       200:
 *         description: Formulario encontrado
 *       404:
 *         description: Formulario no encontrado
 */
formularioMiaPass.get('/:id', authMiddleware, requirePermission('miapass.formularios.read'), async (c) => {
  try {
    const { id } = c.req.param();
    const formulario = await formularioMiaPassService.getById(id);
    return c.json(success(formulario));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /formulario-mia-pass/{id}:
 *   put:
 *     summary: Actualizar un formulario
 *     tags: [Formulario MiaPass]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombreCompleto:
 *                 type: string
 *               numeroDocumento:
 *                 type: string
 *               correoElectronico:
 *                 type: string
 *               celular:
 *                 type: string
 *               cantidadPersonas:
 *                 type: integer
 *               valorTotal:
 *                 type: number
 *               estado:
 *                 type: string
 *                 enum: [Pendiente, Contactado, EnProceso, Completado, Cancelado]
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Formulario actualizado
 */
formularioMiaPass.put('/:id', authMiddleware, requirePermission('miapass.formularios.update'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const formulario = await formularioMiaPassService.update(id, data);
    return c.json(success(formulario, 'Formulario actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /formulario-mia-pass/{id}/status:
 *   patch:
 *     summary: Actualizar estado de un formulario
 *     tags: [Formulario MiaPass]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [Pendiente, Contactado, EnProceso, Completado, Cancelado]
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
formularioMiaPass.patch('/:id/status', authMiddleware, requirePermission('miapass.formularios.update'), async (c) => {
  try {
    const { id } = c.req.param();
    const { estado, notas } = await c.req.json();
    const formulario = await formularioMiaPassService.updateStatus(id, estado, notas);
    return c.json(success(formulario, 'Estado actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /formulario-mia-pass/{id}:
 *   delete:
 *     summary: Eliminar un formulario
 *     tags: [Formulario MiaPass]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Formulario eliminado
 */
formularioMiaPass.delete('/:id', authMiddleware, requirePermission('miapass.formularios.delete'), async (c) => {
  try {
    const { id } = c.req.param();
    await formularioMiaPassService.delete(id);
    return c.json(success(null, 'Formulario eliminado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /formulario-mia-pass/{id}/convertir:
 *   post:
 *     summary: Convertir formulario a suscripción MiaPass
 *     description: Convierte un formulario de contacto en una suscripción activa
 *     tags: [Formulario MiaPass]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: integer
 *                 description: ID del plan MiaPass
 *               metodoPago:
 *                 type: string
 *                 description: Método de pago
 *               vendedorCodigo:
 *                 type: string
 *                 description: Código del vendedor (cédula)
 *     responses:
 *       201:
 *         description: Suscripción creada exitosamente
 *       400:
 *         description: Error - formulario ya convertido o datos inválidos
 */
formularioMiaPass.post('/:id/convertir', authMiddleware, requirePermission('miapass.formularios.convertir'), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const data = await c.req.json();

    const miaPassService = require('../services/miaPass.service');
    const suscripcion = await miaPassService.convertirFormularioASuscripcion(id, {
      ...data,
      usuarioId: user.id
    });

    return c.json(success({ suscripcion }, 'Formulario convertido a suscripción exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = formularioMiaPass;
