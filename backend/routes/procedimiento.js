/**
 * Rutas para Procedimientos Clínicos
 */

const { Hono } = require('hono');
const procedimientoService = require('../services/procedimiento.service');
const procedimientoPdfService = require('../services/procedimiento.pdf.service');
const { authMiddleware } = require('../middleware/auth');

const procedimiento = new Hono();

// Middleware de autenticación
procedimiento.use('/*', authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Procedimientos
 *   description: Gestión de procedimientos clínicos y quirúrgicos
 * components:
 *   schemas:
 *     Procedimiento:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         pacienteId:
 *           type: string
 *           format: uuid
 *         admisionId:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *           description: Nombre del procedimiento
 *         descripcion:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [Menor, Mayor, Ambulatorio, Urgente]
 *         estado:
 *           type: string
 *           enum: [Programado, EnProceso, Completado, Cancelado, Diferido]
 *         medicoResponsableId:
 *           type: string
 *           format: uuid
 *         fechaProgramada:
 *           type: string
 *           format: date-time
 *     ProcedimientoInput:
 *       type: object
 *       required:
 *         - pacienteId
 *         - nombre
 *         - descripcion
 *         - indicacion
 *       properties:
 *         pacienteId:
 *           type: string
 *           format: uuid
 *         admisionId:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         indicacion:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [Menor, Mayor, Ambulatorio, Urgente]
 *         fechaProgramada:
 *           type: string
 *           format: date-time
 *         codigoCups:
 *           type: string
 *           description: Código CUPS del procedimiento
 */

/**
 * @swagger
 * /procedimientos:
 *   get:
 *     summary: Listar procedimientos
 *     description: Obtiene lista de procedimientos con filtros opcionales
 *     tags: [Procedimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pacienteId
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *       - in: query
 *         name: admisionId
 *         schema:
 *           type: string
 *         description: Filtrar por admisión
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Desplazamiento para paginación
 *     responses:
 *       200:
 *         description: Lista de procedimientos
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
 *                     $ref: '#/components/schemas/Procedimiento'
 *                 total:
 *                   type: integer
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.get('/', async (c) => {
  try {
    const {
      admisionId,
      pacienteId,
      paciente_id,
      estado,
      tipo,
      medicoResponsableId,
      fechaDesde,
      fechaHasta,
      limit,
      offset,
    } = c.req.query();

    const result = await procedimientoService.getProcedimientos({
      admisionId,
      pacienteId: pacienteId || paciente_id,
      estado,
      tipo,
      medicoResponsableId,
      fechaDesde,
      fechaHasta,
      limit,
      offset,
    });

    return c.json({
      success: true,
      data: result.procedimientos,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    console.error('Error al obtener procedimientos:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al obtener procedimientos',
      },
      500
    );
  }
});

/**
 * @swagger
 * /procedimientos/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de procedimientos
 *     tags: [Procedimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: medicoId
 *         schema:
 *           type: string
 *         description: Filtrar por médico
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicio del periodo
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha fin del periodo
 *     responses:
 *       200:
 *         description: Estadísticas de procedimientos
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.get('/estadisticas', async (c) => {
  try {
    const { medicoId, tipo, fechaInicio, fechaFin } = c.req.query();

    const estadisticas = await procedimientoService.getEstadisticas({
      medicoId,
      tipo,
      fechaInicio,
      fechaFin,
    });

    return c.json({
      success: true,
      data: estadisticas,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al obtener estadísticas',
      },
      500
    );
  }
});

/**
 * @swagger
 * /procedimientos/{id}:
 *   get:
 *     summary: Obtener procedimiento por ID
 *     tags: [Procedimientos]
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
 *         description: Datos del procedimiento
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const procedimientoData = await procedimientoService.getProcedimientoById(id);

    return c.json({
      success: true,
      data: procedimientoData,
    });
  } catch (error) {
    console.error('Error al obtener procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al obtener procedimiento',
      },
      error.message === 'Procedimiento no encontrado' ? 404 : 500
    );
  }
});

/**
 * @swagger
 * /procedimientos:
 *   post:
 *     summary: Crear nuevo procedimiento
 *     tags: [Procedimientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcedimientoInput'
 *     responses:
 *       201:
 *         description: Procedimiento creado exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.post('/', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    // Validaciones
    // if (!data.admisionId) {
    //   return c.json({ success: false, error: 'admisionId es requerido' }, 400);
    // }
    if (!data.pacienteId) {
      return c.json({ success: false, error: 'pacienteId es requerido' }, 400);
    }
    if (!data.nombre) {
      return c.json({ success: false, error: 'nombre es requerido' }, 400);
    }
    if (!data.descripcion) {
      return c.json({ success: false, error: 'descripcion es requerida' }, 400);
    }
    if (!data.indicacion) {
      return c.json({ success: false, error: 'indicacion es requerida' }, 400);
    }

    const procedimientoCreado = await procedimientoService.crearProcedimiento(data, user.id);

    return c.json(
      {
        success: true,
        message: 'Procedimiento creado exitosamente',
        data: procedimientoCreado,
      },
      201
    );
  } catch (error) {
    console.error('Error al crear procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al crear procedimiento',
      },
      400
    );
  }
});

/**
 * @swagger
 * /procedimientos/{id}/iniciar:
 *   post:
 *     summary: Iniciar ejecución de procedimiento
 *     tags: [Procedimientos]
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
 *         description: Procedimiento iniciado
 *       400:
 *         description: No se puede iniciar el procedimiento
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.post('/:id/iniciar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const procedimientoIniciado = await procedimientoService.iniciarProcedimiento(id, user.id);

    return c.json({
      success: true,
      message: 'Procedimiento iniciado',
      data: procedimientoIniciado,
    });
  } catch (error) {
    console.error('Error al iniciar procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al iniciar procedimiento',
      },
      400
    );
  }
});

/**
 * @swagger
 * /procedimientos/{id}/completar:
 *   post:
 *     summary: Completar procedimiento
 *     tags: [Procedimientos]
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
 *               resultados:
 *                 type: string
 *               complicaciones:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Procedimiento completado exitosamente
 *       400:
 *         description: No se puede completar el procedimiento
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.post('/:id/completar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const data = await c.req.json();

    const procedimientoCompletado = await procedimientoService.completarProcedimiento(
      id,
      data,
      user.id
    );

    return c.json({
      success: true,
      message: 'Procedimiento completado exitosamente',
      data: procedimientoCompletado,
    });
  } catch (error) {
    console.error('Error al completar procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al completar procedimiento',
      },
      400
    );
  }
});

/**
 * @swagger
 * /procedimientos/{id}/cancelar:
 *   post:
 *     summary: Cancelar procedimiento
 *     tags: [Procedimientos]
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
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Procedimiento cancelado
 *       400:
 *         description: No se puede cancelar el procedimiento
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.post('/:id/cancelar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const { motivo } = await c.req.json();

    const procedimientoCancelado = await procedimientoService.cancelarProcedimiento(
      id,
      motivo,
      user.id
    );

    return c.json({
      success: true,
      message: 'Procedimiento cancelado',
      data: procedimientoCancelado,
    });
  } catch (error) {
    console.error('Error al cancelar procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al cancelar procedimiento',
      },
      400
    );
  }
});

/**
 * @swagger
 * /procedimientos/{id}/diferir:
 *   post:
 *     summary: Diferir (posponer) procedimiento
 *     tags: [Procedimientos]
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
 *               - nuevaFecha
 *               - motivo
 *             properties:
 *               nuevaFecha:
 *                 type: string
 *                 format: date-time
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Procedimiento diferido
 *       400:
 *         description: No se puede diferir el procedimiento
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.post('/:id/diferir', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const { nuevaFecha, motivo } = await c.req.json();

    const procedimientoDiferido = await procedimientoService.diferirProcedimiento(
      id,
      nuevaFecha,
      motivo,
      user.id
    );

    return c.json({
      success: true,
      message: 'Procedimiento diferido',
      data: procedimientoDiferido,
    });
  } catch (error) {
    console.error('Error al diferir procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al diferir procedimiento',
      },
      400
    );
  }
});

/**
 * @swagger
 * /procedimientos/{id}/reprogramar:
 *   post:
 *     summary: Reprogramar procedimiento diferido
 *     tags: [Procedimientos]
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
 *               - nuevaFecha
 *             properties:
 *               nuevaFecha:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Procedimiento reprogramado
 *       400:
 *         description: No se puede reprogramar el procedimiento
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.post('/:id/reprogramar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const { nuevaFecha } = await c.req.json();

    if (!nuevaFecha) {
      return c.json({ success: false, error: 'nuevaFecha es requerida' }, 400);
    }

    const procedimientoReprogramado = await procedimientoService.reprogramarProcedimiento(
      id,
      nuevaFecha,
      user.id
    );

    return c.json({
      success: true,
      message: 'Procedimiento reprogramado',
      data: procedimientoReprogramado,
    });
  } catch (error) {
    console.error('Error al reprogramar procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al reprogramar procedimiento',
      },
      400
    );
  }
});

/**
 * @swagger
 * /procedimientos/{id}:
 *   put:
 *     summary: Actualizar procedimiento
 *     tags: [Procedimientos]
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
 *             $ref: '#/components/schemas/ProcedimientoInput'
 *     responses:
 *       200:
 *         description: Procedimiento actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const data = await c.req.json();

    const procedimientoActualizado = await procedimientoService.actualizarProcedimiento(
      id,
      data,
      user.id
    );

    return c.json({
      success: true,
      message: 'Procedimiento actualizado exitosamente',
      data: procedimientoActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al actualizar procedimiento',
      },
      400
    );
  }
});

/**
 * @swagger
 * /procedimientos/{id}/pdf:
 *   get:
 *     summary: Generar PDF de bitácora quirúrgica
 *     tags: [Procedimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *         description: Descargar (true) o visualizar inline (false)
 *     responses:
 *       200:
 *         description: PDF generado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.get('/:id/pdf', async (c) => {
  try {
    const { id } = c.req.param();
    const { download } = c.req.query();

    const pdfBuffer = await procedimientoPdfService.generarBitacoraPdf(id);

    const disposition = download === 'true' ? 'attachment' : 'inline';

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="bitacora-quirurgica-${id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error al generar PDF de bitácora:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al generar PDF',
      },
      error.message === 'Procedimiento no encontrado' ? 404 : 500
    );
  }
});

/**
 * @swagger
 * /procedimientos/{id}/protocolo-pdf:
 *   get:
 *     summary: Generar PDF del protocolo quirúrgico
 *     description: Solo disponible para procedimientos completados
 *     tags: [Procedimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *         description: Descargar (true) o visualizar inline (false)
 *     responses:
 *       200:
 *         description: PDF del protocolo quirúrgico
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Procedimiento no completado
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
procedimiento.get('/:id/protocolo-pdf', async (c) => {
  try {
    const { id } = c.req.param();
    const { download } = c.req.query();

    const pdfBuffer = await procedimientoPdfService.generarProtocoloPdf(id);

    const disposition = download === 'true' ? 'attachment' : 'inline';

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="protocolo-quirurgico-${id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error al generar protocolo quirúrgico:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al generar protocolo',
      },
      error.message === 'Procedimiento no encontrado' ? 404 : 400
    );
  }
});

module.exports = procedimiento;
