/**
 * Rutas de facturas
 */
const { Hono } = require('hono');
const facturaService = require('../services/factura.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const exportadorRIPS = require('../services/exportadores/exportadorRIPS.service');
const { validate } = require('../middleware/validate');
const {
  createFacturaSchema,
  updateFacturaSchema,
  createPagoSchema,
  generateRIPSSchema,
  cancelFacturaSchema,
} = require('../validators/factura.schema');
const facturaPDFService = require('../services/factura-pdf.service');
const emailService = require('../services/email.service');
const prisma = require('../db/prisma');

const facturas = new Hono();

// Todas las rutas requieren autenticación y permisos de facturación
facturas.use('*', authMiddleware);
facturas.use('*', permissionMiddleware('facturas'));

/**
 * @swagger
 * /facturas/rips/generar:
 *   post:
 *     summary: Generar RIPS JSON (Res. 2275/2023)
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - factura_ids
 *             properties:
 *               factura_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: RIPS generado correctamente
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
 *                   description: Objeto JSON con la estructura RIPS
 *       500:
 *         description: Error del servidor
 */
facturas.post('/rips/generar', validate(generateRIPSSchema), async (c) => {
  try {
    const { factura_ids } = c.req.validData;
    const ripsData = await exportadorRIPS.generarRIPS(factura_ids);

    // Configurar headers para descarga de archivo JSON
    c.header('Content-Type', 'application/json');
    c.header('Content-Disposition', `attachment; filename="RIPS-${new Date().getTime()}.json"`);

    return c.json(success(ripsData, 'RIPS generado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/batch:
 *   get:
 *     summary: Obtener facturas por múltiples IDs de citas (batch)
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: citaIds
 *         schema:
 *           type: string
 *         description: IDs de citas separados por coma
 *         example: "uuid1,uuid2,uuid3"
 *     responses:
 *       200:
 *         description: Mapa de citaId -> factura
 */
facturas.get('/batch', async (c) => {
  try {
    const citaIdsParam = c.req.query('citaIds');

    if (!citaIdsParam) {
      return c.json(success({}, 'No citaIds provided'));
    }

    const citaIds = citaIdsParam.split(',').filter(id => id.trim());

    if (citaIds.length === 0) {
      return c.json(success({}, 'No valid citaIds'));
    }

    // Limit to prevent abuse
    if (citaIds.length > 100) {
      return c.json(error('Maximum 100 citaIds allowed'), 400);
    }

    const result = await facturaService.getFacturasByCitaIds(citaIds);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Factura:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         numero:
 *           type: string
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         admision_id:
 *           type: string
 *           format: uuid
 *         estado:
 *           type: string
 *           enum: [Pendiente, Pagada, Anulada]
 *         total:
 *           type: number
 *         fecha_emision:
 *           type: string
 *           format: date-time
 *     FacturaInput:
 *       type: object
 *       required:
 *         - paciente_id
 *         - items
 *       properties:
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         admision_id:
 *           type: string
 *           format: uuid
 *         observaciones:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               descripcion:
 *                 type: string
 *               cantidad:
 *                 type: integer
 *               precio_unitario:
 *                 type: number
 *               impuesto:
 *                 type: number
 * tags:
 *   name: Facturas
 *   description: Gestión de facturación y pagos
 */

/**
 * @swagger
 * /facturas:
 *   get:
 *     summary: Obtener todas las facturas
 *     tags: [Facturas]
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
 *         description: Lista de facturas
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
 *                     $ref: '#/components/schemas/Factura'
 *       500:
 *         description: Error del servidor
 */
facturas.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await facturaService.getAll(query);
    return c.json(paginated(result.facturas, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}:
 *   get:
 *     summary: Obtener una factura por ID
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Datos de la factura
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
 *                     factura:
 *                       $ref: '#/components/schemas/Factura'
 *       404:
 *         description: Factura no encontrada
 *       500:
 *         description: Error del servidor
 */
facturas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const factura = await facturaService.getById(id);
    return c.json(success({ factura }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas:
 *   post:
 *     summary: Crear una nueva factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FacturaInput'
 *     responses:
 *       201:
 *         description: Factura creada correctamente
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
 *                     factura:
 *                       $ref: '#/components/schemas/Factura'
 *       500:
 *         description: Error del servidor
 */
facturas.post('/', validate(createFacturaSchema), async (c) => {
  try {
    const data = c.req.validData;
    const user = c.get('user');
    const factura = await facturaService.create(data, user.id);
    return c.json(success({ factura }, 'Factura creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}:
 *   put:
 *     summary: Actualizar una factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la factura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FacturaInput'
 *     responses:
 *       200:
 *         description: Factura actualizada correctamente
 *       404:
 *         description: Factura no encontrada
 *       500:
 *         description: Error del servidor
 */
facturas.put('/:id', validate(updateFacturaSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const factura = await facturaService.update(id, data);
    return c.json(success({ factura }, 'Factura actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}/pagos:
 *   post:
 *     summary: Registrar un pago a una factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la factura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monto
 *               - metodo_pago
 *             properties:
 *               monto:
 *                 type: number
 *               metodo_pago:
 *                 type: string
 *                 enum: [Efectivo, Tarjeta, Transferencia]
 *               referencia:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pago registrado correctamente
 *       404:
 *         description: Factura no encontrada
 *       500:
 *         description: Error del servidor
 */
facturas.post('/:id/pagos', validate(createPagoSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const user = c.get('user');
    const pago = await facturaService.registrarPago(id, data, user.id);
    return c.json(success({ pago }, 'Pago registrado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}/cancelar:
 *   post:
 *     summary: Cancelar una factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la factura
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
 *         description: Factura cancelada correctamente
 *       404:
 *         description: Factura no encontrada
 *       500:
 *         description: Error del servidor
 */
facturas.post('/:id/cancelar', validate(cancelFacturaSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const { observaciones } = c.req.validData;
    await facturaService.cancelar(id, observaciones);
    return c.json(success(null, 'Factura cancelada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}:
 *   delete:
 *     summary: Eliminar una factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Factura eliminada correctamente
 *       404:
 *         description: Factura no encontrada
 *       500:
 *         description: Error del servidor
 */
facturas.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await facturaService.delete(id);
    return c.json(success(null, 'Factura eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}/pdf:
 *   get:
 *     summary: Generar PDF de una factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: PDF generado correctamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Factura no encontrada
 *       500:
 *         description: Error del servidor
 */
facturas.get('/:id/pdf', async (c) => {
  try {
    const { id } = c.req.param();
    const factura = await facturaService.getById(id);
    const pdfBuffer = await facturaPDFService.generarPDF(factura);

    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="Factura-${factura.numero}.pdf"`);

    return c.body(pdfBuffer);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ============ FACTURACIÓN ELECTRÓNICA SIIGO ============

/**
 * @swagger
 * /facturas/pendientes-emision:
 *   get:
 *     summary: Obtener facturas pendientes de emisión electrónica
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de facturas pendientes
 */
facturas.get('/pendientes-emision', async (c) => {
  try {
    const facturas = await facturaService.getFacturasPendientesEmision();
    return c.json(success(facturas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/errores-emision:
 *   get:
 *     summary: Obtener facturas con errores de emisión electrónica
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de facturas con errores
 */
facturas.get('/errores-emision', async (c) => {
  try {
    const facturas = await facturaService.getFacturasConErrores();
    return c.json(success(facturas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}/emitir-electronica:
 *   post:
 *     summary: Emitir factura electrónica a través de Siigo (DIAN)
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Factura emitida electrónicamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Factura no encontrada
 */
facturas.post('/:id/emitir-electronica', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await facturaService.emitirFacturaElectronica(id);
    return c.json(success(result, 'Factura emitida electrónicamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}/estado-dian:
 *   get:
 *     summary: Verificar estado DIAN de una factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: Estado DIAN obtenido
 */
facturas.get('/:id/estado-dian', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await facturaService.verificarEstadoDian(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}/pdf-electronico:
 *   get:
 *     summary: Obtener PDF de factura electrónica desde Siigo
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: PDF electrónico generado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
facturas.get('/:id/pdf-electronico', async (c) => {
  try {
    const { id } = c.req.param();
    const pdfData = await facturaService.obtenerPdfElectronico(id);

    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="FE-${id}.pdf"`);

    return c.body(pdfData);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}/errores-dian:
 *   get:
 *     summary: Obtener errores DIAN de una factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: Errores DIAN obtenidos
 */
facturas.get('/:id/errores-dian', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await facturaService.obtenerErroresDian(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}/enviar-email:
 *   post:
 *     summary: Reenviar factura electrónica por email
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Factura enviada por email
 */
facturas.post('/:id/enviar-email', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const result = await facturaService.reenviarFacturaEmail(id, body.email);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /facturas/{id}/notificar-pago:
 *   post:
 *     summary: Enviar notificación de pago al paciente
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metodoPago:
 *                 type: string
 *               numeroReferencia:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notificación de pago enviada
 *       404:
 *         description: Factura no encontrada
 */
facturas.post('/:id/notificar-pago', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    // Obtener factura con datos del paciente y cita
    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        items: {
          include: {
            cita: {
              select: {
                id: true,
                fecha: true,
                hora: true,
                especialidad: {
                  select: { titulo: true }
                }
              }
            }
          }
        }
      }
    });

    if (!factura) {
      return c.json(error('Factura no encontrada'), 404);
    }

    if (!factura.paciente?.email) {
      return c.json(success({
        emailSent: false,
        reason: 'Paciente sin email registrado'
      }, 'No se pudo enviar email: paciente sin correo'));
    }

    // Obtener la cita asociada (primera cita de los items)
    const citaAsociada = factura.items?.find(item => item.cita)?.cita;
    const especialidad = citaAsociada?.especialidad?.titulo || 'Consulta General';

    // Enviar email de confirmación de pago
    const emailResult = await emailService.sendPaymentConfirmation({
      to: factura.paciente.email,
      paciente: {
        nombre: factura.paciente.nombre,
        apellido: factura.paciente.apellido
      },
      factura: {
        id: factura.id,
        total: factura.total,
        metodoPago: body.metodoPago || factura.metodoPago || 'No especificado',
        numeroReferencia: body.numeroReferencia || null,
        bancoDestino: body.bancoDestino || null
      },
      cita: citaAsociada ? {
        fecha: citaAsociada.fecha,
        hora: citaAsociada.hora
      } : {
        fecha: new Date(),
        hora: null
      },
      especialidad
    });

    console.log('[Facturas] Email de confirmación de pago enviado:', emailResult);

    return c.json(success({
      emailSent: emailResult.success,
      emailId: emailResult.id
    }, emailResult.success ? 'Notificación de pago enviada' : 'Error al enviar notificación'));
  } catch (err) {
    console.error('[Facturas] Error enviando notificación de pago:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = facturas;
