/**
 * Servicio de Email con Resend
 * Maneja el envío de correos electrónicos para alertas y notificaciones
 */

const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resend = null;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'alertas@clinicamia.com';
    this.fromName = process.env.RESEND_FROM_NAME || 'Clinica Mia - Alertas';
    this.enabled = false;
  }

  /**
   * Inicializa el cliente de Resend
   */
  init() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.enabled = true;
      console.log('[Email] Servicio de email inicializado con Resend');
    } else {
      console.warn('[Email] RESEND_API_KEY no configurada. Emails deshabilitados.');
    }
  }

  /**
   * Verifica si el servicio está habilitado
   */
  isEnabled() {
    return this.enabled && this.resend !== null;
  }

  /**
   * Envía un email simple
   */
  async send({ to, subject, html, text, replyTo }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email no enviado:', subject);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    try {
      const recipients = Array.isArray(to) ? to : [to];

      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: recipients,
        subject,
        html,
        text,
        reply_to: replyTo
      });

      console.log('[Email] Enviado:', subject, 'a', recipients.length, 'destinatarios');
      return { success: true, id: result.data?.id, error: null };
    } catch (error) {
      console.error('[Email] Error enviando:', error.message);
      return { success: false, id: null, error: error.message };
    }
  }

  /**
   * Envía un email de alerta formateado
   */
  async sendAlert({ to, tipoAlerta, prioridad, asunto, cuerpo, datos = {} }) {
    const priorityColors = {
      BAJA: '#3B82F6',     // blue
      MEDIA: '#F59E0B',    // amber
      ALTA: '#EF4444',     // red
      URGENTE: '#DC2626'   // dark red
    };

    const priorityLabels = {
      BAJA: 'Informativo',
      MEDIA: 'Atención',
      ALTA: 'Importante',
      URGENTE: 'URGENTE'
    };

    const color = priorityColors[prioridad] || priorityColors.MEDIA;
    const label = priorityLabels[prioridad] || 'Notificación';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${asunto}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: ${color}; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">
          ${label}: ${tipoAlerta.replace(/_/g, ' ')}
        </h1>
      </td>
    </tr>

    <!-- Logo -->
    <tr>
      <td style="padding: 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
        <h2 style="color: #1e3a5f; margin: 0; font-size: 24px;">Clinica Mia</h2>
        <p style="color: #666; margin: 5px 0 0; font-size: 12px;">Sistema de Gestión Integral</p>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="color: #333; margin: 0 0 15px; font-size: 20px;">${asunto}</h2>
        <div style="color: #555; font-size: 14px; line-height: 1.6;">
          ${cuerpo}
        </div>

        ${datos.fechaVencimiento ? `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <strong style="color: #856404;">Fecha de vencimiento:</strong>
          <span style="color: #856404;">${new Date(datos.fechaVencimiento).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ` : ''}

        ${datos.diasRestantes !== undefined ? `
        <div style="background-color: ${datos.diasRestantes <= 7 ? '#f8d7da' : '#d1e7dd'}; border-left: 4px solid ${datos.diasRestantes <= 7 ? '#dc3545' : '#198754'}; padding: 15px; margin: 20px 0;">
          <strong style="color: ${datos.diasRestantes <= 7 ? '#721c24' : '#155724'};">Días restantes:</strong>
          <span style="color: ${datos.diasRestantes <= 7 ? '#721c24' : '#155724'}; font-size: 18px; font-weight: bold;">${datos.diasRestantes}</span>
        </div>
        ` : ''}

        ${datos.accion ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${datos.accionUrl || '#'}" style="background-color: ${color}; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">${datos.accion}</a>
        </div>
        ` : ''}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          Este es un mensaje automático del sistema de alertas.<br>
          Por favor no responda a este correo.
        </p>
        <p style="color: #999; font-size: 11px; margin: 10px 0 0;">
          © ${new Date().getFullYear()} Clinica Mia. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
${label}: ${tipoAlerta.replace(/_/g, ' ')}

${asunto}

${cuerpo.replace(/<[^>]*>/g, '')}

${datos.fechaVencimiento ? `Fecha de vencimiento: ${new Date(datos.fechaVencimiento).toLocaleDateString('es-CO')}` : ''}
${datos.diasRestantes !== undefined ? `Días restantes: ${datos.diasRestantes}` : ''}

---
Este es un mensaje automático del sistema de alertas de Clinica Mia.
    `;

    return this.send({ to, subject: `[${label}] ${asunto}`, html, text });
  }

  /**
   * Envía email de prueba
   */
  async sendTest(to) {
    return this.sendAlert({
      to,
      tipoAlerta: 'PRUEBA',
      prioridad: 'MEDIA',
      asunto: 'Correo de prueba del sistema de alertas',
      cuerpo: `
        <p>Este es un correo de prueba para verificar la configuración del sistema de alertas.</p>
        <p>Si recibió este mensaje, la configuración es correcta.</p>
      `,
      datos: {
        accion: 'Ir al Sistema',
        accionUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      }
    });
  }
}

// Singleton
const emailService = new EmailService();
emailService.init();

module.exports = emailService;
