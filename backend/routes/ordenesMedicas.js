/**
 * Rutas de órdenes médicas
 */
const { Hono } = require('hono');
const ordenMedicaService = require('../services/ordenMedica.service');
const ordenMedicaPdfService = require('../services/ordenMedica.pdf.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const ordenesMedicas = new Hono();

// Todas las rutas requieren autenticación
ordenesMedicas.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     OrdenMedica:
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
 *         tipo:
 *           type: string
 *           enum: [Laboratorio, Imagenologia, Procedimiento, Interconsulta, Dieta, Otro]
 *         descripcion:
 *           type: string
 *         prioridad:
 *           type: string
 *           enum: [Baja, Media, Alta, Urgente]
 *         estado:
 *           type: string
 *           enum: [Pendiente, EnProceso, Completada, Cancelada]
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *     OrdenMedicaInput:
 *       type: object
 *       required:
 *         - paciente_id
 *         - tipo
 *         - descripcion
 *       properties:
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         tipo:
 *           type: string
 *           enum: [Laboratorio, Imagenologia, Procedimiento, Interconsulta, Dieta, Otro]
 *         descripcion:
 *           type: string
 *         prioridad:
 *           type: string
 *           enum: [Baja, Media, Alta, Urgente]
 * tags:
 *   name: OrdenesMedicas
 *   description: Gestión de órdenes médicas
 */

/**
 * @swagger
 * /ordenes-medicas:
 *   get:
 *     summary: Obtener todas las órdenes médicas
 *     tags: [OrdenesMedicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paciente_id
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de órdenes médicas
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
 *                     $ref: '#/components/schemas/OrdenMedica'
 *       500:
 *         description: Error del servidor
 */
ordenesMedicas.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await ordenMedicaService.getAll(query);
    return c.json(paginated(result.ordenes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /ordenes-medicas/{id}/pdf:
 *   get:
 *     summary: Descargar PDF de una orden médica
 *     tags: [OrdenesMedicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la orden médica
 *     responses:
 *       200:
 *         description: PDF de la orden médica
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Orden médica no encontrada
 *       500:
 *         description: Error del servidor
 */
ordenesMedicas.get('/:id/pdf', async (c) => {
  try {
    const { id } = c.req.param();
    console.log('[PDF] Generando PDF para orden:', id);

    const pdfBuffer = await ordenMedicaPdfService.generarOrdenPdf(id);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('[PDF] Buffer vacío para orden:', id);
      return c.json(error('No se pudo generar el PDF'), 500);
    }

    console.log('[PDF] PDF generado exitosamente, tamaño:', pdfBuffer.length);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="orden-medica-${id.substring(0, 8)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('[PDF] Error generando PDF:', err.message, err.stack);
    return c.json(error(err.message || 'Error al generar el PDF'), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /ordenes-medicas/{id}:
 *   get:
 *     summary: Obtener una orden médica por ID
 *     tags: [OrdenesMedicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la orden médica
 *     responses:
 *       200:
 *         description: Datos de la orden médica
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
 *                     orden:
 *                       $ref: '#/components/schemas/OrdenMedica'
 *       404:
 *         description: Orden médica no encontrada
 *       500:
 *         description: Error del servidor
 */
ordenesMedicas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const orden = await ordenMedicaService.getById(id);
    return c.json(success({ orden }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /ordenes-medicas:
 *   post:
 *     summary: Crear una nueva orden médica
 *     tags: [OrdenesMedicas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrdenMedicaInput'
 *     responses:
 *       201:
 *         description: Orden médica creada correctamente
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
 *                     orden:
 *                       $ref: '#/components/schemas/OrdenMedica'
 *       500:
 *         description: Error del servidor
 */
ordenesMedicas.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const orden = await ordenMedicaService.create(body);
    return c.json(success({ orden }, 'Orden médica creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /ordenes-medicas/{id}:
 *   put:
 *     summary: Actualizar una orden médica
 *     tags: [OrdenesMedicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la orden médica
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrdenMedicaInput'
 *     responses:
 *       200:
 *         description: Orden médica actualizada correctamente
 *       404:
 *         description: Orden médica no encontrada
 *       500:
 *         description: Error del servidor
 */
ordenesMedicas.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const orden = await ordenMedicaService.update(id, body);
    return c.json(success({ orden }, 'Orden médica actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /ordenes-medicas/{id}/completar:
 *   post:
 *     summary: Completar una orden médica
 *     tags: [OrdenesMedicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la orden médica
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resultados:
 *                 type: object
 *                 description: Resultados estructurados (JSON)
 *               archivo_resultado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orden médica completada correctamente
 *       404:
 *         description: Orden médica no encontrada
 *       500:
 *         description: Error del servidor
 */
ordenesMedicas.post('/:id/completar', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const user = c.get('user');
    const orden = await ordenMedicaService.completar(id, body, user.id);
    return c.json(success({ orden }, 'Orden médica completada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /ordenes-medicas/{id}/cancelar:
 *   post:
 *     summary: Cancelar una orden médica
 *     tags: [OrdenesMedicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la orden médica
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - observaciones
 *             properties:
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orden médica cancelada correctamente
 *       404:
 *         description: Orden médica no encontrada
 *       500:
 *         description: Error del servidor
 */
ordenesMedicas.post('/:id/cancelar', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const orden = await ordenMedicaService.cancelar(id, body.observaciones);
    return c.json(success({ orden }, 'Orden médica cancelada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /ordenes-medicas/{id}:
 *   delete:
 *     summary: Eliminar una orden médica
 *     tags: [OrdenesMedicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la orden médica
 *     responses:
 *       200:
 *         description: Orden médica eliminada correctamente
 *       404:
 *         description: Orden médica no encontrada
 *       500:
 *         description: Error del servidor
 */
ordenesMedicas.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await ordenMedicaService.delete(id);
    return c.json(success(null, 'Orden médica eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = ordenesMedicas;
