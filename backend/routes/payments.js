/**
 * Payment routes for ePayco integration
 *
 * Handles payment session creation and webhook confirmations
 */

const { Hono } = require('hono');
const prisma = require('../db/prisma');
const { validate } = require('../middleware/validate');
const { success, error } = require('../utils/response');
const { createPaymentSessionSchema } = require('../validators/payment.schema');
const epaycoService = require('../services/epayco.service');
const epaycoConfig = require('../config/epayco');

const payments = new Hono();

/**
 * GET /payments/config-status
 * Check ePayco configuration status (for debugging)
 * Does NOT expose sensitive keys, only shows if they are configured
 */
payments.get('/config-status', async c => {
  const isProduction = !epaycoConfig.testMode;

  // Validate URLs
  const responseUrl = epaycoConfig.responseUrl;
  const confirmationUrl = epaycoConfig.confirmationUrl;

  const responseValidation = epaycoService.validateUrl(responseUrl, isProduction);
  const confirmationValidation = epaycoService.validateUrl(confirmationUrl, isProduction);

  const status = {
    environment: isProduction ? 'production' : 'test',
    testMode: epaycoConfig.testMode,
    credentials: {
      publicKeyConfigured: !!epaycoConfig.publicKey,
      privateKeyConfigured: !!epaycoConfig.privateKey,
      customerIdConfigured: !!epaycoConfig.customerId,
      pKeyConfigured: !!epaycoConfig.pKey,
    },
    urls: {
      frontendUrl: epaycoConfig.urls.frontendUrl,
      backendUrl: epaycoConfig.urls.backendUrl,
      responseUrl: responseUrl,
      confirmationUrl: confirmationUrl,
      responseUrlValid: responseValidation.valid,
      responseUrlError: responseValidation.reason || null,
      confirmationUrlValid: confirmationValidation.valid,
      confirmationUrlError: confirmationValidation.reason || null,
    },
    configurationValid: epaycoConfig.validate() && responseValidation.valid && confirmationValidation.valid,
    recommendations: [],
  };

  // Add recommendations if there are issues
  if (!epaycoConfig.validate()) {
    status.recommendations.push('Configure todas las credenciales de ePayco (EPAYCO_PUBLIC_KEY, EPAYCO_PRIVATE_KEY, EPAYCO_CUSTOMER_ID, EPAYCO_P_KEY)');
  }

  if (!responseValidation.valid) {
    status.recommendations.push(
      `URL de respuesta inválida: ${responseValidation.reason}. ` +
      `Configure FRONTEND_URL con una URL HTTPS pública (ejemplo: FRONTEND_URL=https://clinicamia.co)`
    );
  }

  if (!confirmationValidation.valid) {
    status.recommendations.push(
      `URL de confirmación inválida: ${confirmationValidation.reason}. ` +
      `Configure BACKEND_URL con una URL HTTPS pública`
    );
  }

  if (isProduction && epaycoConfig.urls.frontendUrl.includes('localhost')) {
    status.recommendations.push(
      'FRONTEND_URL está configurado como localhost pero estamos en modo producción. ' +
      'Configure FRONTEND_URL=https://clinicamia.co'
    );
  }

  return c.json(success(status, status.configurationValid ? 'Configuración válida' : 'Configuración incompleta'));
});

/**
 * POST /payments/sessions
 * Create ePayco payment session for an appointment
 *
 * Body:
 * - cita_id: UUID of the appointment
 *
 * Returns:
 * - sessionId: ePayco session ID for frontend checkout
 * - publicKey: ePayco public key
 * - amount: Payment amount
 * - currency: Currency code (COP)
 */
payments.post('/sessions', validate(createPaymentSessionSchema), async c => {
  try {
    const { cita_id } = c.req.validData;

    // Get appointment with patient and specialty data
    const cita = await prisma.cita.findUnique({
      where: { id: cita_id },
      include: {
        paciente: true,
        especialidad: true,
      },
    });

    if (!cita) {
      return c.json(error('Cita no encontrada'), 404);
    }

    if (cita.estado !== 'PendientePago') {
      return c.json(error('La cita no está pendiente de pago'), 400);
    }

    // Create ePayco session
    const session = await epaycoService.createPaymentSession(cita, cita.paciente);

    return c.json(
      success({
        sessionId: session.sessionId,
        publicKey: session.publicKey,
        amount: parseFloat(cita.costo),
        currency: 'COP',
      })
    );
  } catch (err) {
    console.error('Payment session error:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /payments/webhook
 * ePayco confirmation webhook
 *
 * This endpoint receives payment confirmations from ePayco.
 * Must respond 200 OK within 30 seconds to acknowledge receipt.
 *
 * ePayco may send data as form-urlencoded or JSON.
 */
payments.post('/webhook', async c => {
  try {
    // Parse body - ePayco can send as form-urlencoded or JSON
    let webhookData;
    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('application/json')) {
      webhookData = await c.req.json();
    } else {
      // form-urlencoded
      const text = await c.req.text();
      webhookData = Object.fromEntries(new URLSearchParams(text));
    }

    console.log('ePayco webhook received:', JSON.stringify(webhookData, null, 2));

    // Process webhook (validates signature internally)
    const result = await epaycoService.processWebhook(webhookData);

    // Complete payment - handles approved, rejected, and failed statuses
    // Also sends email notifications based on status
    if (result.status === 'approved' || result.status === 'rejected' || result.status === 'failed') {
      const paymentResult = await epaycoService.completePayment(result.citaId, result);
      console.log('Payment processed for cita:', result.citaId, '- Status:', result.status, '- Success:', paymentResult.success);
    } else {
      console.log('Payment status pending for cita:', result.citaId, '- Status:', result.status);
    }

    // Always respond 200 to acknowledge receipt
    return c.json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Still return 200 to prevent retries for validation errors
    // ePayco will retry if we return non-200
    return c.json({ status: 'error', message: err.message });
  }
});

/**
 * GET /payments/webhook
 * ePayco can also send confirmations via GET
 */
payments.get('/webhook', async c => {
  try {
    const webhookData = c.req.query();

    console.log('ePayco webhook (GET) received:', JSON.stringify(webhookData, null, 2));

    // Process webhook
    const result = await epaycoService.processWebhook(webhookData);

    // Complete payment - handles approved, rejected, and failed statuses
    if (result.status === 'approved' || result.status === 'rejected' || result.status === 'failed') {
      const paymentResult = await epaycoService.completePayment(result.citaId, result);
      console.log('Payment processed (GET) for cita:', result.citaId, '- Status:', result.status, '- Success:', paymentResult.success);
    }

    return c.json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Webhook processing error (GET):', err);
    return c.json({ status: 'error', message: err.message });
  }
});

/**
 * GET /payments/status/:citaId
 * Check payment status for an appointment (for polling from frontend)
 */
payments.get('/status/:citaId', async c => {
  try {
    const citaId = c.req.param('citaId');

    const status = await epaycoService.getPaymentStatus(citaId);

    return c.json(success(status));
  } catch (err) {
    console.error('Error fetching payment status:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /payments/verify/:refPayco
 * Verify transaction status directly with ePayco
 * (Optional - for manual verification)
 */
payments.get('/verify/:refPayco', async c => {
  try {
    const refPayco = c.req.param('refPayco');

    // Call ePayco validation API
    const response = await fetch(
      `https://secure.epayco.co/validation/v1/reference/${refPayco}`,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      return c.json(error('Error verificando transacción'), 500);
    }

    const data = await response.json();

    return c.json(success(data));
  } catch (err) {
    console.error('Error verifying transaction:', err);
    return c.json(error(err.message), 500);
  }
});

module.exports = payments;
