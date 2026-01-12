/**
 * ePayco Smart Checkout Service
 *
 * Handles authentication, session creation, and webhook validation
 * for ePayco payment gateway integration.
 *
 * Documentation: https://docs.epayco.com/docs/checkout-implementacion
 */

const prisma = require('../db/prisma');
const { ValidationError, AppError } = require('../utils/errors');
const crypto = require('crypto');
const epaycoConfig = require('../config/epayco');
const emailService = require('./email.service');

class EpaycoService {
  constructor() {
    // Token cache to avoid excessive authentication calls
    this.tokenCache = {
      token: null,
      expiresAt: null,
    };
  }

  /**
   * Get authentication token from ePayco Apify
   * Implements caching to minimize API calls (token valid for 10 min, cache for 9)
   */
  async getAuthToken() {
    // Check cache first
    if (this.tokenCache.token && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    // Validate config
    if (!epaycoConfig.validate()) {
      throw new AppError('ePayco configuration is incomplete', 500);
    }

    // Create Basic auth header: base64(PUBLIC_KEY:PRIVATE_KEY)
    const credentials = `${epaycoConfig.publicKey}:${epaycoConfig.privateKey}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');

    try {
      const response = await fetch(epaycoConfig.endpoints.auth, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${base64Credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ePayco auth error:', errorText);
        throw new AppError('Error authenticating with ePayco', 500);
      }

      const data = await response.json();

      if (!data.token) {
        throw new AppError('Invalid ePayco authentication response', 500);
      }

      // Cache token for 9 minutes (expires in 10)
      this.tokenCache = {
        token: data.token,
        expiresAt: Date.now() + 9 * 60 * 1000,
      };

      return data.token;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('ePayco auth fetch error:', error);
      throw new AppError('Failed to authenticate with ePayco', 500);
    }
  }

  /**
   * Validate if a string is a valid URL
   * @param {string} urlString - URL to validate
   * @param {boolean} requireProduction - If true, reject localhost and require HTTPS
   * @returns {{ valid: boolean, reason?: string }}
   */
  validateUrl(urlString, requireProduction = false) {
    if (!urlString || typeof urlString !== 'string') {
      return { valid: false, reason: 'URL is empty or not a string' };
    }

    try {
      const url = new URL(urlString);

      // Must be http or https
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { valid: false, reason: `Invalid protocol: ${url.protocol}` };
      }

      // In production mode, apply stricter validation
      if (requireProduction) {
        // Must be HTTPS in production
        if (url.protocol !== 'https:') {
          return { valid: false, reason: 'Production URLs must use HTTPS' };
        }

        // Reject localhost, 127.0.0.1, or local IP addresses
        const hostname = url.hostname.toLowerCase();
        if (hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.endsWith('.local')) {
          return { valid: false, reason: `Production URLs cannot use local addresses: ${hostname}` };
        }
      }

      return { valid: true };
    } catch (err) {
      return { valid: false, reason: `Invalid URL format: ${err.message}` };
    }
  }

  /**
   * Simple URL validity check (backwards compatible)
   * @param {string} urlString - URL to validate
   * @returns {boolean}
   */
  isValidUrl(urlString) {
    return this.validateUrl(urlString, false).valid;
  }

  /**
   * Create payment session for an appointment
   *
   * @param {Object} cita - Appointment with patient and specialty data
   * @param {Object} paciente - Patient data
   * @returns {Object} { sessionId, publicKey }
   */
  async createPaymentSession(cita, paciente) {
    const token = await this.getAuthToken();

    // Ensure we have required billing data
    const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`.trim();
    const email = paciente.email || `paciente_${paciente.cedula}@clinicamia.temp`;
    const telefono = paciente.telefono || '3000000000';

    // Map document types to ePayco valid values: NIT, CC, CE, TI, PPN, SSN, LIC, DNI, RFC, PEP, PPT
    const tipoDocMap = {
      'CC': 'CC',           // Cédula de Ciudadanía
      'CE': 'CE',           // Cédula de Extranjería
      'TI': 'TI',           // Tarjeta de Identidad
      'PA': 'PPN',          // Pasaporte -> PPN
      'RC': 'CC',           // Registro Civil -> CC (fallback)
      'NIT': 'NIT',         // NIT
      'PEP': 'PEP',         // Permiso Especial de Permanencia
      'PPT': 'PPT',         // Permiso por Protección Temporal
    };
    const tipoDoc = tipoDocMap[paciente.tipoDocumento] || 'CC';

    // URLs must be valid public URLs
    // Validate and construct response URL
    const baseResponseUrl = epaycoConfig.responseUrl;
    const baseConfirmationUrl = epaycoConfig.confirmationUrl;

    // Check if we're in production (not test mode)
    const isProduction = !epaycoConfig.testMode;

    console.log('[ePayco] Configuration:', {
      testMode: epaycoConfig.testMode,
      isProduction,
      frontendUrl: epaycoConfig.urls.frontendUrl,
      backendUrl: epaycoConfig.urls.backendUrl,
      responseUrl: baseResponseUrl,
      confirmationUrl: baseConfirmationUrl,
    });

    // Validate URLs before sending to ePayco
    // Use stricter validation in production mode
    const responseValidation = this.validateUrl(baseResponseUrl, isProduction);
    if (!responseValidation.valid) {
      console.error('[ePayco] Invalid response URL:', baseResponseUrl, 'Reason:', responseValidation.reason);
      throw new AppError(
        `URL de respuesta inválida: ${responseValidation.reason}. ` +
        `Configure FRONTEND_URL correctamente (ejemplo: https://clinicamia.co). ` +
        `URL actual: ${baseResponseUrl}`,
        500
      );
    }

    const confirmationValidation = this.validateUrl(baseConfirmationUrl, isProduction);
    if (!confirmationValidation.valid) {
      console.error('[ePayco] Invalid confirmation URL:', baseConfirmationUrl, 'Reason:', confirmationValidation.reason);
      throw new AppError(
        `URL de confirmación inválida: ${confirmationValidation.reason}. ` +
        `Configure BACKEND_URL correctamente. ` +
        `URL actual: ${baseConfirmationUrl}`,
        500
      );
    }

    const responseUrl = `${baseResponseUrl}?citaId=${cita.id}`;
    const confirmationUrl = baseConfirmationUrl;

    const sessionData = {
      // Required fields
      checkout_version: epaycoConfig.checkout.version,
      name: `Clínica Mía - Cita Médica`,
      currency: epaycoConfig.checkout.currency,
      amount: parseFloat(cita.costo),

      // Optional fields
      description: `Cita ${cita.especialidad?.titulo || 'Consulta'} - ${nombreCompleto}`,
      lang: epaycoConfig.checkout.lang,
      country: epaycoConfig.checkout.country,

      // URLs for response and confirmation
      response: responseUrl,
      confirmation: confirmationUrl,

      // Test mode
      test: epaycoConfig.testMode,

      // Billing info (optional - to prefill forms)
      billing: {
        email: email,
        name: nombreCompleto,
        typeDoc: tipoDoc,
        numberDoc: paciente.cedula || '1234567890',
        callingCode: '+57',
        mobilePhone: telefono,
      },

      // Extra fields for tracking
      extras: {
        extra1: cita.id,
        extra2: paciente.id,
        extra3: 'appointment',
      },
    };

    console.log('[ePayco] Session data being sent:', JSON.stringify(sessionData, null, 2));

    try {
      const response = await fetch(epaycoConfig.endpoints.session, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ePayco session creation error:', errorText);
        throw new AppError('Error creating payment session with ePayco', 500);
      }

      const result = await response.json();

      console.log('[ePayco] Session response:', JSON.stringify(result, null, 2));

      if (!result.success || !result.data?.sessionId) {
        console.error('[ePayco] Session creation failed.');
        console.error('[ePayco] Response:', JSON.stringify(result, null, 2));
        console.error('[ePayco] Session data sent:', JSON.stringify(sessionData, null, 2));

        // Extract error message from various possible formats
        let errorMsg = 'Unknown error';
        if (result.data?.errors && Array.isArray(result.data.errors)) {
          errorMsg = result.data.errors.map(e => e.errorMessage || e.message || e.property || JSON.stringify(e)).join(', ');
        } else if (result.message) {
          errorMsg = result.message;
        } else if (result.data?.message) {
          errorMsg = result.data.message;
        } else if (typeof result.data === 'string') {
          errorMsg = result.data;
        }

        throw new AppError(`ePayco error: ${errorMsg}`, 500);
      }

      // Store session for tracking (use upsert to handle existing sessions)
      await prisma.paymentSession.upsert({
        where: { citaId: cita.id },
        update: {
          sessionId: result.data.sessionId,
          amount: cita.costo,
          status: 'pending',
        },
        create: {
          citaId: cita.id,
          sessionId: result.data.sessionId,
          amount: cita.costo,
          currency: epaycoConfig.checkout.currency,
          status: 'pending',
        },
      });

      return {
        sessionId: result.data.sessionId,
        token: result.data.token,
        publicKey: epaycoConfig.publicKey,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('ePayco session fetch error:', error);
      throw new AppError('Failed to create payment session', 500);
    }
  }

  /**
   * Validate webhook signature from ePayco
   *
   * Formula: SHA256(p_cust_id^p_key^x_ref_payco^x_transaction_id^x_amount^x_currency_code)
   *
   * @param {Object} data - Webhook data
   * @returns {boolean}
   */
  validateSignature(data) {
    const { x_ref_payco, x_transaction_id, x_amount, x_currency_code, x_signature } = data;

    if (!x_signature) {
      console.warn('Webhook missing x_signature');
      return false;
    }

    // Build signature string
    const signatureString = `${epaycoConfig.customerId}^${epaycoConfig.pKey}^${x_ref_payco}^${x_transaction_id}^${x_amount}^${x_currency_code}`;

    const expectedSignature = crypto.createHash('sha256').update(signatureString).digest('hex');

    const isValid = expectedSignature === x_signature;

    if (!isValid) {
      console.warn('Webhook signature mismatch', {
        expected: expectedSignature,
        received: x_signature,
      });
    }

    return isValid;
  }

  /**
   * Process webhook confirmation from ePayco
   *
   * @param {Object} webhookData - Data from ePayco webhook
   * @returns {Object} Processed transaction result
   */
  async processWebhook(webhookData) {
    const {
      x_ref_payco,
      x_transaction_id,
      x_response,
      x_cod_response, // Código numérico de respuesta
      x_response_reason_text,
      x_amount,
      x_currency_code,
      x_extra1, // citaId
      x_extra2, // pacienteId
    } = webhookData;

    // Validate signature
    if (!this.validateSignature(webhookData)) {
      throw new ValidationError('Invalid webhook signature');
    }

    // Find payment session by citaId
    const paymentSession = await prisma.paymentSession.findFirst({
      where: { citaId: x_extra1 },
    });

    if (!paymentSession) {
      console.warn('Payment session not found for citaId:', x_extra1);
      throw new ValidationError('Payment session not found');
    }

    // Map ePayco response code to status
    // x_cod_response: 1=Aceptada, 2=Rechazada, 3=Pendiente, 4=Fallida
    const statusMap = {
      '1': 'approved',
      '2': 'rejected',
      '3': 'pending',
      '4': 'failed',
    };

    // Use x_cod_response (numeric code) for status mapping
    const responseCode = String(x_cod_response || x_response);
    const status = statusMap[responseCode] || 'unknown';

    console.log('[ePayco] Webhook processing - responseCode:', responseCode, 'status:', status);

    // Update payment session
    await prisma.paymentSession.update({
      where: { id: paymentSession.id },
      data: {
        epaycoRef: x_ref_payco,
        epaycoTxId: x_transaction_id,
        responseCode,
        responseMessage: x_response_reason_text,
        status,
      },
    });

    return {
      citaId: x_extra1,
      pacienteId: x_extra2,
      status,
      refPayco: x_ref_payco,
      transactionId: x_transaction_id,
      amount: x_amount,
      responseReason: x_response_reason_text,
    };
  }

  /**
   * Complete payment - update appointment and create invoice
   *
   * @param {string} citaId - Appointment ID
   * @param {Object} webhookResult - Result from processWebhook
   */
  async completePayment(citaId, webhookResult) {
    const { status, refPayco, transactionId, amount, responseReason } = webhookResult;

    if (status !== 'approved') {
      // For rejected/failed, update cita status and send email
      if (status === 'rejected' || status === 'failed') {
        const cita = await prisma.cita.update({
          where: { id: citaId },
          data: { estado: 'Cancelada' },
          include: {
            paciente: true,
            doctor: true,
            especialidad: true,
          },
        });

        // Send payment failed email
        if (cita.paciente?.email) {
          try {
            await emailService.sendAppointmentPaymentFailed({
              to: cita.paciente.email,
              paciente: cita.paciente,
              cita,
              doctor: cita.doctor,
              especialidad: cita.especialidad,
              errorMessage: responseReason || 'Transacción rechazada',
              retryUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/appointments`,
            });
            console.log('[ePayco] Email de pago fallido enviado a:', cita.paciente.email);
          } catch (emailError) {
            console.error('[ePayco] Error enviando email de pago fallido:', emailError.message);
          }
        }
      }
      return { success: false, status };
    }

    // Use transaction for atomicity
    const result = await prisma.$transaction(async tx => {
      // 1. Update appointment status to Programada
      const cita = await tx.cita.update({
        where: { id: citaId },
        data: { estado: 'Programada' },
        include: {
          paciente: true,
          doctor: true,
          especialidad: true,
        },
      });

      // 2. Generate unique invoice number (F-YYYY-00001)
      const year = new Date().getFullYear();
      const lastInvoice = await tx.factura.findFirst({
        where: {
          numero: { startsWith: `F-${year}-` },
        },
        orderBy: { createdAt: 'desc' },
      });

      let invoiceNumber = `F-${year}-00001`;
      if (lastInvoice) {
        const lastNum = parseInt(lastInvoice.numero.split('-')[2]) || 0;
        invoiceNumber = `F-${year}-${String(lastNum + 1).padStart(5, '0')}`;
      }

      // 3. Create invoice with item
      const factura = await tx.factura.create({
        data: {
          numero: invoiceNumber,
          pacienteId: cita.pacienteId,
          estado: 'Pagada',
          subtotal: parseFloat(amount),
          total: parseFloat(amount),
          saldoPendiente: 0,
          items: {
            create: {
              tipo: 'Consulta',
              descripcion: `Cita Médica - ${cita.especialidad?.titulo || cita.motivo || 'Consulta'}`,
              cantidad: 1,
              precioUnitario: parseFloat(amount),
              subtotal: parseFloat(amount),
              citaId: cita.id,
            },
          },
        },
      });

      // 4. Create payment record
      await tx.pago.create({
        data: {
          facturaId: factura.id,
          monto: parseFloat(amount),
          metodoPago: 'ePayco',
          referencia: `REF:${refPayco} TX:${transactionId}`,
          observaciones: 'Pago procesado via ePayco Smart Checkout',
        },
      });

      return { cita, factura };
    });

    // Send confirmation email (outside transaction)
    if (result.cita.paciente?.email) {
      try {
        await emailService.sendAppointmentConfirmation({
          to: result.cita.paciente.email,
          paciente: result.cita.paciente,
          cita: result.cita,
          doctor: result.cita.doctor,
          especialidad: result.cita.especialidad,
          factura: result.factura,
        });
        console.log('[ePayco] Email de confirmación enviado a:', result.cita.paciente.email);
      } catch (emailError) {
        console.error('[ePayco] Error enviando email de confirmación:', emailError.message);
      }
    }

    return { success: true, status: 'approved', ...result };
  }

  /**
   * Get payment status for an appointment
   */
  async getPaymentStatus(citaId) {
    const [cita, paymentSession] = await Promise.all([
      prisma.cita.findUnique({
        where: { id: citaId },
        select: { id: true, estado: true },
      }),
      prisma.paymentSession.findFirst({
        where: { citaId },
        select: {
          status: true,
          epaycoRef: true,
          responseMessage: true,
        },
      }),
    ]);

    return {
      citaId,
      citaEstado: cita?.estado || 'NotFound',
      paymentStatus: paymentSession?.status || 'unknown',
      epaycoRef: paymentSession?.epaycoRef,
      message: paymentSession?.responseMessage,
    };
  }
}

module.exports = new EpaycoService();
