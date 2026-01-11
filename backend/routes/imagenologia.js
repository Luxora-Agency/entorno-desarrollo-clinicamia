/**
 * @swagger
 * tags:
 *   name: Imagenología
 *   description: Gestión de estudios de imagenología (Rayos X, Ecografías, TAC, Resonancia)
 * components:
 *   schemas:
 *     EstudioImagenologia:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         codigo:
 *           type: string
 *         pacienteId:
 *           type: string
 *           format: uuid
 *         tipoEstudio:
 *           type: string
 *           enum: [RayosX, Ecografia, TAC, Resonancia, Mamografia, Densitometria]
 *         estado:
 *           type: string
 *           enum: [Solicitado, Programado, EnProceso, Completado, Cancelado]
 *         prioridad:
 *           type: string
 *           enum: [Normal, Urgente, Emergencia]
 *     EstudioInput:
 *       type: object
 *       required:
 *         - pacienteId
 *         - tipoEstudio
 *         - regionAnatomica
 *       properties:
 *         pacienteId:
 *           type: string
 *           format: uuid
 *         tipoEstudio:
 *           type: string
 *         regionAnatomica:
 *           type: string
 *         indicacionClinica:
 *           type: string
 *         prioridad:
 *           type: string
 */

const { Hono } = require('hono');
const imagenologiaService = require('../services/imagenologia.service');
const { authMiddleware } = require('../middleware/auth');
const { generateInformePDF } = require('../services/imagenologia.pdf.service');

const router = new Hono();

// Middleware de autenticación global para el router
router.use('/*', authMiddleware);

/**
 * @swagger
 * /imagenologia:
 *   post:
 *     summary: Crear solicitud de estudio de imagenología
 *     tags: [Imagenología]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EstudioInput'
 *     responses:
 *       201:
 *         description: Estudio creado exitosamente
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const user = c.get('user') || c.get('jwtPayload'); // Ajustar según lo que devuelva el middleware
        
        const data = {
            ...body,
            medicoSolicitanteId: user.id
        };
        const result = await imagenologiaService.create(data);
        return c.json({ status: 'success', data: result }, 201);
    } catch (error) {
        return c.json({ status: 'error', message: error.message }, error.statusCode || 500);
    }
});

/**
 * @swagger
 * /imagenologia:
 *   get:
 *     summary: Listar todos los estudios de imagenología
 *     tags: [Imagenología]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pacienteId
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: tipoEstudio
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de estudio
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de estudios
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', async (c) => {
    try {
        const query = c.req.query();
        const result = await imagenologiaService.getAll(query);
        return c.json({ status: 'success', ...result });
    } catch (error) {
        return c.json({ status: 'error', message: error.message }, 500);
    }
});

/**
 * @swagger
 * /imagenologia/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de imagenología
 *     tags: [Imagenología]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del módulo
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/estadisticas', async (c) => {
    try {
        const result = await imagenologiaService.getEstadisticas();
        return c.json({ status: 'success', data: result });
    } catch (error) {
        return c.json({ status: 'error', message: error.message }, 500);
    }
});

/**
 * @swagger
 * /imagenologia/{id}/pdf:
 *   get:
 *     summary: Descargar PDF del informe radiológico
 *     tags: [Imagenología]
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
 *         description: PDF del informe
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Estudio no tiene informe completado
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/pdf', async (c) => {
    try {
        const id = c.req.param('id');
        const estudio = await imagenologiaService.getById(id);

        if (estudio.estado !== 'Completado') {
            return c.json({ status: 'error', message: 'El estudio aún no tiene informe completado' }, 400);
        }

        const pdfBuffer = await generateInformePDF(estudio);

        const filename = `informe_radiologico_${estudio.codigo || id}.pdf`;

        return new Response(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        return c.json({ status: 'error', message: error.message }, error.statusCode || 500);
    }
});

/**
 * @swagger
 * /imagenologia/{id}:
 *   get:
 *     summary: Obtener estudio por ID
 *     tags: [Imagenología]
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
 *         description: Datos del estudio
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const result = await imagenologiaService.getById(id);
        return c.json({ status: 'success', data: result });
    } catch (error) {
        return c.json({ status: 'error', message: error.message }, error.statusCode || 500);
    }
});

/**
 * @swagger
 * /imagenologia/{id}/informe:
 *   put:
 *     summary: Actualizar informe radiológico
 *     description: Solo radiólogos pueden actualizar el informe
 *     tags: [Imagenología]
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
 *             properties:
 *               hallazgos:
 *                 type: string
 *               impresionDiagnostica:
 *                 type: string
 *               recomendaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Informe actualizado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id/informe', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const user = c.get('user') || c.get('jwtPayload');
        
        const result = await imagenologiaService.updateInforme(id, body, user.id);
        return c.json({ status: 'success', data: result });
    } catch (error) {
        return c.json({ status: 'error', message: error.message }, error.statusCode || 500);
    }
});

/**
 * @swagger
 * /imagenologia/{id}/estado:
 *   patch:
 *     summary: Actualizar estado del estudio
 *     tags: [Imagenología]
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
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [Solicitado, Programado, EnProceso, Completado, Cancelado]
 *               fechaProgramada:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id/estado', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const result = await imagenologiaService.updateEstado(id, body.estado, body.fechaProgramada);
        return c.json({ status: 'success', data: result });
    } catch (error) {
        return c.json({ status: 'error', message: error.message }, error.statusCode || 500);
    }
});

module.exports = router;
