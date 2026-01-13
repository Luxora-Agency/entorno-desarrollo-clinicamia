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

  /**
   * Envía email de bienvenida cuando un paciente crea su cuenta
   */
  async sendWelcomeEmail({ to, nombre, apellido }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de bienvenida no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombreCompleto = `${nombre} ${apellido}`.trim();
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Clínica Mía</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <tr>
      <td style="background: linear-gradient(135deg, #144F79 0%, #53B896 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Clínica Mía</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Tu Aliado en Salud y Bienestar</p>
      </td>
    </tr>

    <!-- Welcome Message -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #144F79; margin: 0 0 20px; font-size: 24px;">¡Bienvenido/a, ${nombreCompleto}!</h2>

        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Gracias por crear tu cuenta en <strong>Clínica Mía</strong>. Estamos muy contentos de tenerte como parte de nuestra familia de pacientes.
        </p>

        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Ahora puedes disfrutar de los siguientes beneficios:
        </p>

        <!-- Benefits List -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <div style="width: 30px; height: 30px; background-color: #53B896; border-radius: 50%; text-align: center; line-height: 30px; color: white; font-size: 14px;">✓</div>
                  </td>
                  <td style="color: #333; font-size: 15px;">Agendar citas médicas en línea las 24 horas</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <div style="width: 30px; height: 30px; background-color: #53B896; border-radius: 50%; text-align: center; line-height: 30px; color: white; font-size: 14px;">✓</div>
                  </td>
                  <td style="color: #333; font-size: 15px;">Acceder a tu historial médico digital</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <div style="width: 30px; height: 30px; background-color: #53B896; border-radius: 50%; text-align: center; line-height: 30px; color: white; font-size: 14px;">✓</div>
                  </td>
                  <td style="color: #333; font-size: 15px;">Recibir recordatorios de tus citas</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <div style="width: 30px; height: 30px; background-color: #53B896; border-radius: 50%; text-align: center; line-height: 30px; color: white; font-size: 14px;">✓</div>
                  </td>
                  <td style="color: #333; font-size: 15px;">Acceso exclusivo a promociones y servicios de MiaPass</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 35px 0;">
          <a href="${frontendUrl}/appointments" style="background: linear-gradient(135deg, #144F79 0%, #1a6a9e 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
            Agendar mi primera cita
          </a>
        </div>

        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
          Si tienes alguna pregunta, no dudes en contactarnos:
        </p>

        <p style="color: #144F79; font-size: 15px; margin: 0;">
          📞 <strong>324 333 8555</strong><br>
          📧 <strong>info@clinicamiacolombia.com</strong><br>
          📍 <strong>Cra. 5 #28-85, Ibagué, Tolima</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 13px; margin: 0 0 10px;">
          Síguenos en redes sociales para más información de salud
        </p>
        <p style="color: #999; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.<br>
          Ibagué, Tolima - Colombia
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
¡Bienvenido/a a Clínica Mía, ${nombreCompleto}!

Gracias por crear tu cuenta. Ahora puedes:
- Agendar citas médicas en línea las 24 horas
- Acceder a tu historial médico digital
- Recibir recordatorios de tus citas
- Acceso exclusivo a promociones MiaPass

Agenda tu primera cita: ${frontendUrl}/appointments

Contáctanos:
📞 324 333 8555
📧 info@clinicamiacolombia.com
📍 Cra. 5 #28-85, Ibagué, Tolima

© ${new Date().getFullYear()} Clínica Mía
    `;

    return this.send({
      to,
      subject: '¡Bienvenido/a a Clínica Mía! Tu cuenta ha sido creada',
      html,
      text
    });
  }

  /**
   * Envía email de confirmación de cita (pago aprobado)
   */
  async sendAppointmentConfirmation({ to, paciente, cita, doctor, especialidad, factura }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de confirmación no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombrePaciente = `${paciente.nombre} ${paciente.apellido}`.trim();
    const nombreDoctor = doctor ? `Dr. ${doctor.nombre} ${doctor.apellido}`.trim() : 'Por asignar';
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

    // Formatear fecha
    const fechaCita = new Date(cita.fecha);
    const fechaFormateada = fechaCita.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Formatear hora
    let horaFormateada = 'Por confirmar';
    if (cita.hora) {
      const hora = cita.hora instanceof Date ? cita.hora : new Date(`1970-01-01T${cita.hora}`);
      horaFormateada = hora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Cita</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #53B896 0%, #3d9a7a 100%); padding: 30px 20px; text-align: center;">
        <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; line-height: 60px;">
          <span style="font-size: 30px;">✓</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">¡Cita Confirmada!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Tu pago ha sido procesado exitosamente</p>
      </td>
    </tr>

    <!-- Logo -->
    <tr>
      <td style="padding: 25px; text-align: center; border-bottom: 1px solid #e5e5e5;">
        <h2 style="color: #144F79; margin: 0; font-size: 28px; font-weight: 700;">Clínica Mía</h2>
      </td>
    </tr>

    <!-- Saludo -->
    <tr>
      <td style="padding: 30px 25px 10px;">
        <p style="color: #333; font-size: 16px; margin: 0;">
          Hola <strong>${nombrePaciente}</strong>,
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 15px 0 0;">
          Tu cita médica ha sido confirmada. A continuación encontrarás los detalles:
        </p>
      </td>
    </tr>

    <!-- Detalles de la cita -->
    <tr>
      <td style="padding: 20px 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px;">📅 FECHA</span><br>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${fechaFormateada}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px;">🕐 HORA</span><br>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${horaFormateada}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px;">👨‍⚕️ MÉDICO</span><br>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${nombreDoctor}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px;">🏥 ESPECIALIDAD</span><br>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${especialidad?.titulo || 'Consulta General'}</span>
                  </td>
                </tr>
                ${factura ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #6b7280; font-size: 13px;">💳 FACTURA</span><br>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${factura.numero}</span>
                    <span style="color: #53B896; font-size: 14px; margin-left: 10px;">$${Number(factura.total).toLocaleString('es-CO')} COP</span>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Recordatorios -->
    <tr>
      <td style="padding: 0 25px 20px;">
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
          <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">📋 Recordatorios importantes:</p>
          <ul style="color: #78350f; font-size: 13px; margin: 10px 0 0; padding-left: 20px; line-height: 1.6;">
            <li>Llega 15 minutos antes de tu cita</li>
            <li>Trae tu documento de identidad</li>
            <li>Si tienes exámenes previos, tráelos contigo</li>
            <li>Si necesitas cancelar, hazlo con 24 horas de anticipación</li>
          </ul>
        </div>
      </td>
    </tr>

    <!-- Ubicación -->
    <tr>
      <td style="padding: 0 25px 30px;">
        <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px;">
          <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: 600;">📍 Ubicación</p>
          <p style="color: #1e3a8a; font-size: 14px; margin: 8px 0 0;">Cra. 5 #28-85, Ibagué, Tolima</p>
          <p style="color: #1e3a8a; font-size: 14px; margin: 5px 0 0;">📞 324 333 8555</p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 13px; margin: 0 0 10px;">
          ¿Tienes alguna pregunta? Contáctanos
        </p>
        <p style="color: #144F79; font-size: 14px; margin: 0;">
          📧 info@clinicamiacolombia.com | 📞 324 333 8555
        </p>
        <p style="color: #999; font-size: 11px; margin: 15px 0 0;">
          © ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
¡Cita Confirmada! - Clínica Mía

Hola ${nombrePaciente},

Tu cita médica ha sido confirmada.

📅 Fecha: ${fechaFormateada}
🕐 Hora: ${horaFormateada}
👨‍⚕️ Médico: ${nombreDoctor}
🏥 Especialidad: ${especialidad?.titulo || 'Consulta General'}
${factura ? `💳 Factura: ${factura.numero} - $${Number(factura.total).toLocaleString('es-CO')} COP` : ''}

Recordatorios:
- Llega 15 minutos antes de tu cita
- Trae tu documento de identidad
- Si tienes exámenes previos, tráelos contigo

📍 Cra. 5 #28-85, Ibagué, Tolima
📞 324 333 8555

© ${new Date().getFullYear()} Clínica Mía
    `;

    return this.send({
      to,
      subject: `✅ Cita Confirmada - ${fechaFormateada} - Clínica Mía`,
      html,
      text
    });
  }

  /**
   * Envía email de pago pendiente
   */
  async sendAppointmentPendingPayment({ to, paciente, cita, doctor, especialidad, paymentUrl }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de pago pendiente no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombrePaciente = `${paciente.nombre} ${paciente.apellido}`.trim();
    const nombreDoctor = doctor ? `Dr. ${doctor.nombre} ${doctor.apellido}`.trim() : 'Por asignar';
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

    // Formatear fecha
    const fechaCita = new Date(cita.fecha);
    const fechaFormateada = fechaCita.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const monto = cita.costo || especialidad?.costoCOP || 0;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pago Pendiente - Cita Médica</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 20px; text-align: center;">
        <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; line-height: 60px;">
          <span style="font-size: 30px;">⏳</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Pago Pendiente</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Tu cita está reservada, completa el pago para confirmarla</p>
      </td>
    </tr>

    <!-- Logo -->
    <tr>
      <td style="padding: 25px; text-align: center; border-bottom: 1px solid #e5e5e5;">
        <h2 style="color: #144F79; margin: 0; font-size: 28px; font-weight: 700;">Clínica Mía</h2>
      </td>
    </tr>

    <!-- Mensaje -->
    <tr>
      <td style="padding: 30px 25px 10px;">
        <p style="color: #333; font-size: 16px; margin: 0;">
          Hola <strong>${nombrePaciente}</strong>,
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 15px 0 0;">
          Hemos reservado tu cita médica. Para confirmarla, por favor completa el pago:
        </p>
      </td>
    </tr>

    <!-- Monto a pagar -->
    <tr>
      <td style="padding: 20px 25px;">
        <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; border-radius: 12px; padding: 25px; text-align: center;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">Monto a pagar:</p>
          <p style="color: #78350f; font-size: 32px; font-weight: 700; margin: 10px 0;">$${Number(monto).toLocaleString('es-CO')} COP</p>
          <p style="color: #92400e; font-size: 13px; margin: 0;">${especialidad?.titulo || 'Consulta Médica'}</p>
        </div>
      </td>
    </tr>

    <!-- Detalles de la cita -->
    <tr>
      <td style="padding: 0 25px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px;">
          <tr>
            <td style="padding: 15px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px; text-transform: uppercase;">Detalles de tu cita</p>
              <p style="color: #1f2937; font-size: 14px; margin: 5px 0;">📅 ${fechaFormateada}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 5px 0;">👨‍⚕️ ${nombreDoctor}</p>
              <p style="color: #1f2937; font-size: 14px; margin: 5px 0;">🏥 ${especialidad?.titulo || 'Consulta General'}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    ${paymentUrl ? `
    <tr>
      <td style="padding: 0 25px 30px; text-align: center;">
        <a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #144F79 0%, #1a6a9e 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Completar Pago
        </a>
        <p style="color: #6b7280; font-size: 12px; margin: 15px 0 0;">
          O copia este enlace: ${paymentUrl}
        </p>
      </td>
    </tr>
    ` : ''}

    <!-- Aviso -->
    <tr>
      <td style="padding: 0 25px 30px;">
        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px;">
          <p style="color: #991b1b; font-size: 13px; margin: 0;">
            ⚠️ <strong>Importante:</strong> La reserva de tu cita se mantendrá por tiempo limitado.
            Si no completas el pago, el horario podría ser asignado a otro paciente.
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 13px; margin: 0 0 10px;">
          ¿Necesitas ayuda? Contáctanos
        </p>
        <p style="color: #144F79; font-size: 14px; margin: 0;">
          📧 info@clinicamiacolombia.com | 📞 324 333 8555
        </p>
        <p style="color: #999; font-size: 11px; margin: 15px 0 0;">
          © ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Pago Pendiente - Clínica Mía

Hola ${nombrePaciente},

Hemos reservado tu cita médica. Para confirmarla, completa el pago:

💰 Monto: $${Number(monto).toLocaleString('es-CO')} COP

📅 Fecha: ${fechaFormateada}
👨‍⚕️ Médico: ${nombreDoctor}
🏥 Especialidad: ${especialidad?.titulo || 'Consulta General'}

${paymentUrl ? `Completa tu pago aquí: ${paymentUrl}` : ''}

⚠️ Importante: La reserva se mantendrá por tiempo limitado.

📍 Cra. 5 #28-85, Ibagué, Tolima
📞 324 333 8555

© ${new Date().getFullYear()} Clínica Mía
    `;

    return this.send({
      to,
      subject: `⏳ Pago Pendiente - Cita ${fechaFormateada} - Clínica Mía`,
      html,
      text
    });
  }

  /**
   * Envía email de error de pago
   */
  async sendAppointmentPaymentFailed({ to, paciente, cita, doctor, especialidad, errorMessage, retryUrl }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de error de pago no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombrePaciente = `${paciente.nombre} ${paciente.apellido}`.trim();
    const nombreDoctor = doctor ? `Dr. ${doctor.nombre} ${doctor.apellido}`.trim() : 'Por asignar';

    // Formatear fecha
    const fechaCita = new Date(cita.fecha);
    const fechaFormateada = fechaCita.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error en el Pago - Cita Médica</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 20px; text-align: center;">
        <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; line-height: 60px;">
          <span style="font-size: 30px;">✗</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Error en el Pago</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">No pudimos procesar tu pago</p>
      </td>
    </tr>

    <!-- Logo -->
    <tr>
      <td style="padding: 25px; text-align: center; border-bottom: 1px solid #e5e5e5;">
        <h2 style="color: #144F79; margin: 0; font-size: 28px; font-weight: 700;">Clínica Mía</h2>
      </td>
    </tr>

    <!-- Mensaje -->
    <tr>
      <td style="padding: 30px 25px 10px;">
        <p style="color: #333; font-size: 16px; margin: 0;">
          Hola <strong>${nombrePaciente}</strong>,
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 15px 0 0;">
          Lamentamos informarte que no pudimos procesar el pago para tu cita médica.
        </p>
      </td>
    </tr>

    <!-- Error details -->
    <tr>
      <td style="padding: 20px 25px;">
        <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px;">
          <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">Motivo del error:</p>
          <p style="color: #7f1d1d; font-size: 14px; margin: 10px 0 0;">${errorMessage || 'Transacción rechazada por la entidad financiera'}</p>
        </div>
      </td>
    </tr>

    <!-- Cita details -->
    <tr>
      <td style="padding: 0 25px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px;">
          <tr>
            <td style="padding: 15px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px; text-transform: uppercase;">Detalles de la cita (cancelada)</p>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0; text-decoration: line-through;">📅 ${fechaFormateada}</p>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0; text-decoration: line-through;">👨‍⚕️ ${nombreDoctor}</p>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0; text-decoration: line-through;">🏥 ${especialidad?.titulo || 'Consulta General'}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Sugerencias -->
    <tr>
      <td style="padding: 0 25px 20px;">
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px;">
          <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: 600;">💡 Posibles soluciones:</p>
          <ul style="color: #1e3a8a; font-size: 13px; margin: 10px 0 0; padding-left: 20px; line-height: 1.6;">
            <li>Verifica que tengas fondos suficientes</li>
            <li>Intenta con otra tarjeta o método de pago</li>
            <li>Contacta a tu banco si el problema persiste</li>
            <li>Agenda nuevamente tu cita</li>
          </ul>
        </div>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding: 0 25px 30px; text-align: center;">
        <a href="${retryUrl || process.env.NEXT_PUBLIC_BASE_URL + '/appointments'}" style="display: inline-block; background: linear-gradient(135deg, #144F79 0%, #1a6a9e 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Agendar Nueva Cita
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 13px; margin: 0 0 10px;">
          ¿Necesitas ayuda? Estamos para asistirte
        </p>
        <p style="color: #144F79; font-size: 14px; margin: 0;">
          📧 info@clinicamiacolombia.com | 📞 324 333 8555
        </p>
        <p style="color: #999; font-size: 11px; margin: 15px 0 0;">
          © ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Error en el Pago - Clínica Mía

Hola ${nombrePaciente},

Lamentamos informarte que no pudimos procesar el pago para tu cita médica.

❌ Motivo: ${errorMessage || 'Transacción rechazada por la entidad financiera'}

Detalles de la cita (cancelada):
📅 ${fechaFormateada}
👨‍⚕️ ${nombreDoctor}
🏥 ${especialidad?.titulo || 'Consulta General'}

Posibles soluciones:
- Verifica que tengas fondos suficientes
- Intenta con otra tarjeta o método de pago
- Contacta a tu banco si el problema persiste

Agenda una nueva cita: ${retryUrl || process.env.NEXT_PUBLIC_BASE_URL + '/appointments'}

📞 324 333 8555

© ${new Date().getFullYear()} Clínica Mía
    `;

    return this.send({
      to,
      subject: `❌ Error en el Pago - Tu cita no pudo ser confirmada - Clínica Mía`,
      html,
      text
    });
  }

  /**
   * Enviar email de confirmación de solicitud de historia clínica
   */
  async sendMedicalRecordRequestConfirmation({ to, paciente, solicitud }) {
    console.log('[Email] Enviando confirmación de solicitud HC a:', to);

    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de solicitud HC no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const tipoLabel = solicitud.tipo === 'completa' ? 'Completa' : 'Parcial';

    const text = `
Hola ${paciente.nombre},

Tu solicitud de Historia Clínica ${tipoLabel} ha sido recibida exitosamente.

Detalles de la solicitud:
- Tipo: Historia Clínica ${tipoLabel}
${solicitud.periodo ? `- Período: ${solicitud.periodo}` : ''}
${solicitud.motivo ? `- Motivo: ${solicitud.motivo}` : ''}
- Fecha de solicitud: ${new Date().toLocaleDateString('es-CO')}

Tiempo de procesamiento: 3 a 5 días hábiles

Te notificaremos por correo electrónico cuando tu historia clínica esté lista para descargar.

Atentamente,
Clínica Mía
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #144F79 0%, #1a6091 100%); padding: 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
        Solicitud Recibida
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">
        Historia Clínica ${tipoLabel}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
        Hola <strong>${paciente.nombre}</strong>,
      </p>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Hemos recibido tu solicitud de copia de historia clínica. Nuestro equipo la procesará en los próximos días.
      </p>

      <!-- Request Details -->
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #144F79;">
        <h3 style="color: #144F79; margin: 0 0 15px; font-size: 16px;">
          📄 Detalles de la Solicitud
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Tipo:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">Historia Clínica ${tipoLabel}</td>
          </tr>
          ${solicitud.periodo ? `
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Período:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px;">${solicitud.periodo}</td>
          </tr>
          ` : ''}
          ${solicitud.motivo ? `
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Motivo:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px;">${solicitud.motivo}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Fecha de solicitud:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px;">${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
        </table>
      </div>

      <!-- Processing Time -->
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>⏱️ Tiempo de procesamiento:</strong> 3 a 5 días hábiles
        </p>
      </div>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Te enviaremos un correo electrónico cuando tu historia clínica esté lista para descargar desde tu perfil.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/perfil/historia-medica"
           style="display: inline-block; background-color: #144F79; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Ver Mis Solicitudes
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
        <strong>Clínica Mía</strong>
      </p>
      <p style="color: #888; font-size: 12px; margin: 0;">
        Cra. 5 #28-85, Ibagué, Tolima<br>
        Tel: 324 333 8555 | info@clinicamiacolombia.com
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.send({
      to,
      subject: `📋 Solicitud de Historia Clínica Recibida - Clínica Mía`,
      html,
      text
    });
  }

  /**
   * Enviar email cuando la historia clínica está lista
   */
  async sendMedicalRecordReady({ to, paciente, solicitud }) {
    console.log('[Email] Enviando notificación HC lista a:', to);

    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de HC lista no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const tipoLabel = solicitud.tipo === 'COMPLETA' ? 'Completa' : 'Parcial';

    const text = `
Hola ${paciente.nombre},

Tu Historia Clínica ${tipoLabel} está lista para descargar.

Puedes acceder a ella desde tu perfil en la sección "Historia Médica".

${solicitud.archivoUrl ? `También puedes descargarla directamente desde: ${solicitud.archivoUrl}` : ''}

Atentamente,
Clínica Mía
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
        ✅ Historia Clínica Lista
      </h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Hola <strong>${paciente.nombre}</strong>,
      </p>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Nos complace informarte que tu <strong>Historia Clínica ${tipoLabel}</strong> ha sido procesada y está lista para descargar.
      </p>

      <!-- Success Box -->
      <div style="background-color: #d1fae5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #065f46; margin: 0; font-size: 18px; font-weight: 600;">
          🎉 Tu documento está listo
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/perfil/historia-medica"
           style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Descargar Historia Clínica
        </a>
      </div>

      ${solicitud.archivoUrl ? `
      <p style="color: #555; font-size: 14px; line-height: 1.6; text-align: center;">
        O accede directamente: <a href="${solicitud.archivoUrl}" style="color: #10b981;">Descargar archivo</a>
      </p>
      ` : ''}

      <p style="color: #888; font-size: 13px; line-height: 1.6; margin-top: 30px;">
        Si tienes alguna pregunta sobre tu historia clínica, no dudes en contactarnos.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
        <strong>Clínica Mía</strong>
      </p>
      <p style="color: #888; font-size: 12px; margin: 0;">
        Cra. 5 #28-85, Ibagué, Tolima<br>
        Tel: 324 333 8555 | info@clinicamiacolombia.com
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.send({
      to,
      subject: `✅ Tu Historia Clínica está Lista - Clínica Mía`,
      html,
      text
    });
  }

  /**
   * Envía email de recordatorio de cita
   * @param {Object} params - Parámetros del recordatorio
   * @param {string} params.to - Email del paciente
   * @param {Object} params.paciente - Datos del paciente
   * @param {Object} params.cita - Datos de la cita
   * @param {Object} params.doctor - Datos del doctor
   * @param {Object} params.especialidad - Datos de la especialidad
   * @param {string} params.tipoRecordatorio - '7dias', '4dias', '3horas'
   */
  async sendAppointmentReminder({ to, paciente, cita, doctor, especialidad, tipoRecordatorio }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Recordatorio no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombrePaciente = `${paciente.nombre} ${paciente.apellido || ''}`.trim();
    const nombreDoctor = doctor ? `Dr. ${doctor.nombre} ${doctor.apellido}`.trim() : 'Por confirmar';
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

    // Formatear fecha
    const fechaCita = new Date(cita.fecha);
    const fechaFormateada = fechaCita.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Formatear hora
    let horaFormateada = 'Por confirmar';
    if (cita.hora) {
      const hora = cita.hora instanceof Date ? cita.hora : new Date(`1970-01-01T${cita.hora}`);
      horaFormateada = hora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }

    // Configurar mensaje según tipo de recordatorio
    let headerColor, headerIcon, headerTitle, headerSubtitle, urgencyMessage;

    switch (tipoRecordatorio) {
      case '7dias':
        headerColor = '#144F79';
        headerIcon = '📅';
        headerTitle = 'Recordatorio de Cita';
        headerSubtitle = 'Tu cita es en 7 días';
        urgencyMessage = 'Tienes una semana para prepararte para tu cita médica.';
        break;
      case '4dias':
        headerColor = '#f59e0b';
        headerIcon = '⏰';
        headerTitle = 'Tu Cita se Acerca';
        headerSubtitle = 'Faltan 4 días para tu cita';
        urgencyMessage = 'Recuerda preparar tus documentos y llegar con tiempo.';
        break;
      case '3horas':
        headerColor = '#10b981';
        headerIcon = '🔔';
        headerTitle = '¡Tu Cita es Hoy!';
        headerSubtitle = 'Faltan 3 horas para tu cita';
        urgencyMessage = '¡Te esperamos! Recuerda llevar tu documento de identidad.';
        break;
      default:
        headerColor = '#144F79';
        headerIcon = '📅';
        headerTitle = 'Recordatorio de Cita';
        headerSubtitle = 'Tienes una cita programada';
        urgencyMessage = '';
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%); padding: 35px 20px; text-align: center;">
        <div style="font-size: 50px; margin-bottom: 15px;">${headerIcon}</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">${headerTitle}</h1>
        <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0; font-size: 16px; font-weight: 500;">${headerSubtitle}</p>
      </td>
    </tr>

    <!-- Logo -->
    <tr>
      <td style="padding: 25px; text-align: center; border-bottom: 1px solid #e5e5e5;">
        <h2 style="color: #144F79; margin: 0; font-size: 28px; font-weight: 700;">Clínica Mía</h2>
        <p style="color: #53B896; margin: 5px 0 0; font-size: 13px;">Tu Aliado en Salud y Bienestar</p>
      </td>
    </tr>

    <!-- Saludo -->
    <tr>
      <td style="padding: 30px 25px 15px;">
        <p style="color: #333; font-size: 17px; margin: 0;">
          Hola <strong>${nombrePaciente}</strong>,
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 15px 0 0;">
          ${urgencyMessage}
        </p>
      </td>
    </tr>

    <!-- Detalles de la cita -->
    <tr>
      <td style="padding: 15px 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 25px;">
              <h3 style="color: #144F79; margin: 0 0 20px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
                📋 Detalles de tu Cita
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px; display: block;">📅 FECHA</span>
                    <span style="color: #1f2937; font-size: 17px; font-weight: 600;">${fechaFormateada}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px; display: block;">🕐 HORA</span>
                    <span style="color: #1f2937; font-size: 17px; font-weight: 600;">${horaFormateada}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px; display: block;">👨‍⚕️ MÉDICO</span>
                    <span style="color: #1f2937; font-size: 17px; font-weight: 600;">${nombreDoctor}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #6b7280; font-size: 13px; display: block;">🏥 ESPECIALIDAD</span>
                    <span style="color: #1f2937; font-size: 17px; font-weight: 600;">${especialidad?.titulo || 'Consulta General'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Recordatorios importantes -->
    <tr>
      <td style="padding: 15px 25px;">
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 8px;">
          <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">📋 No olvides:</p>
          <ul style="color: #78350f; font-size: 14px; margin: 12px 0 0; padding-left: 20px; line-height: 1.8;">
            <li>Llegar <strong>15 minutos antes</strong> de tu cita</li>
            <li>Traer tu <strong>documento de identidad</strong></li>
            <li>Si tienes <strong>exámenes previos</strong>, tráelos contigo</li>
            ${tipoRecordatorio === '7dias' || tipoRecordatorio === '4dias' ? '<li>Si necesitas <strong>cancelar o reprogramar</strong>, hazlo con anticipación</li>' : ''}
          </ul>
        </div>
      </td>
    </tr>

    <!-- Ubicación -->
    <tr>
      <td style="padding: 15px 25px;">
        <div style="background-color: #eff6ff; border-radius: 12px; padding: 18px;">
          <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: 600;">📍 Ubicación</p>
          <p style="color: #1e3a8a; font-size: 15px; margin: 10px 0 0; font-weight: 500;">Cra. 5 #28-85, Ibagué, Tolima</p>
          <p style="color: #1e3a8a; font-size: 14px; margin: 8px 0 0;">📞 324 333 8555</p>
        </div>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding: 25px; text-align: center;">
        <a href="${frontendUrl}/perfil/citas" style="display: inline-block; background: linear-gradient(135deg, #144F79 0%, #1a6a9e 100%); color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
          Ver Mis Citas
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 13px; margin: 0 0 10px;">
          ¿Necesitas ayuda? Contáctanos
        </p>
        <p style="color: #144F79; font-size: 14px; margin: 0;">
          📧 info@clinicamiacolombia.com | 📞 324 333 8555
        </p>
        <p style="color: #999; font-size: 11px; margin: 15px 0 0;">
          © ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.<br>
          <span style="color: #bbb;">Este es un mensaje automático, por favor no responda a este correo.</span>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
${headerTitle} - ${headerSubtitle}

Hola ${nombrePaciente},

${urgencyMessage}

📅 Fecha: ${fechaFormateada}
🕐 Hora: ${horaFormateada}
👨‍⚕️ Médico: ${nombreDoctor}
🏥 Especialidad: ${especialidad?.titulo || 'Consulta General'}

Recordatorios:
- Llega 15 minutos antes de tu cita
- Trae tu documento de identidad
- Si tienes exámenes previos, tráelos contigo

📍 Cra. 5 #28-85, Ibagué, Tolima
📞 324 333 8555

Ver tus citas: ${frontendUrl}/perfil/citas

© ${new Date().getFullYear()} Clínica Mía
    `;

    const subjectMap = {
      '7dias': `📅 Recordatorio: Tu cita es en 7 días - ${fechaFormateada}`,
      '4dias': `⏰ ¡Faltan 4 días! Tu cita del ${fechaFormateada}`,
      '3horas': `🔔 ¡Tu cita es HOY a las ${horaFormateada}! - Clínica Mía`
    };

    return this.send({
      to,
      subject: subjectMap[tipoRecordatorio] || `Recordatorio de Cita - Clínica Mía`,
      html,
      text
    });
  }

  /**
   * Envía email de confirmación de cita reprogramada
   * @param {Object} params - Parámetros del correo
   * @param {string} params.to - Email del paciente
   * @param {Object} params.paciente - Datos del paciente
   * @param {Object} params.cita - Datos de la cita nueva
   * @param {Object} params.doctor - Datos del doctor
   * @param {Object} params.especialidad - Datos de la especialidad
   * @param {Object} params.citaAnterior - Datos de la cita anterior (opcional)
   */
  async sendAppointmentRescheduled({ to, paciente, cita, doctor, especialidad, citaAnterior }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de reprogramación no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombrePaciente = `${paciente.nombre} ${paciente.apellido || ''}`.trim();
    const nombreDoctor = doctor ? `Dr. ${doctor.nombre} ${doctor.apellido}`.trim() : 'Por confirmar';
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

    // Formatear fecha nueva
    const fechaCita = new Date(cita.fecha);
    const fechaFormateada = fechaCita.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Formatear hora nueva
    let horaFormateada = 'Por confirmar';
    if (cita.hora) {
      const hora = cita.hora instanceof Date ? cita.hora : new Date(`1970-01-01T${cita.hora}`);
      horaFormateada = hora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }

    // Formatear fecha y hora anterior si existen
    let fechaAnteriorFormateada = '';
    let horaAnteriorFormateada = '';
    if (citaAnterior) {
      const fechaAnt = new Date(citaAnterior.fecha);
      fechaAnteriorFormateada = fechaAnt.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (citaAnterior.hora) {
        const horaAnt = citaAnterior.hora instanceof Date ? citaAnterior.hora : new Date(`1970-01-01T${citaAnterior.hora}`);
        horaAnteriorFormateada = horaAnt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      }
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Reprogramada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 35px 20px; text-align: center;">
        <div style="font-size: 50px; margin-bottom: 15px;">🔄</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">Cita Reprogramada</h1>
        <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0; font-size: 16px; font-weight: 500;">Tu cita ha sido actualizada exitosamente</p>
      </td>
    </tr>

    <!-- Logo -->
    <tr>
      <td style="padding: 25px; text-align: center; border-bottom: 1px solid #e5e5e5;">
        <h2 style="color: #144F79; margin: 0; font-size: 28px; font-weight: 700;">Clínica Mía</h2>
        <p style="color: #53B896; margin: 5px 0 0; font-size: 13px;">Tu Aliado en Salud y Bienestar</p>
      </td>
    </tr>

    <!-- Saludo -->
    <tr>
      <td style="padding: 30px 25px 15px;">
        <p style="color: #333; font-size: 17px; margin: 0;">
          Hola <strong>${nombrePaciente}</strong>,
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 15px 0 0;">
          Tu cita médica ha sido reprogramada exitosamente. A continuación encontrarás los nuevos detalles:
        </p>
      </td>
    </tr>

    <!-- Nueva fecha/hora -->
    <tr>
      <td style="padding: 15px 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; overflow: hidden; border: 2px solid #10b981;">
          <tr>
            <td style="padding: 25px;">
              <h3 style="color: #059669; margin: 0 0 20px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
                ✅ Nueva Cita Programada
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #a7f3d0;">
                    <span style="color: #047857; font-size: 13px; display: block;">📅 NUEVA FECHA</span>
                    <span style="color: #065f46; font-size: 18px; font-weight: 700;">${fechaFormateada}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #a7f3d0;">
                    <span style="color: #047857; font-size: 13px; display: block;">🕐 NUEVA HORA</span>
                    <span style="color: #065f46; font-size: 18px; font-weight: 700;">${horaFormateada}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #a7f3d0;">
                    <span style="color: #047857; font-size: 13px; display: block;">👨‍⚕️ MÉDICO</span>
                    <span style="color: #065f46; font-size: 17px; font-weight: 600;">${nombreDoctor}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #047857; font-size: 13px; display: block;">🏥 ESPECIALIDAD</span>
                    <span style="color: #065f46; font-size: 17px; font-weight: 600;">${especialidad?.titulo || 'Consulta General'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${citaAnterior ? `
    <!-- Cita anterior (tachada) -->
    <tr>
      <td style="padding: 10px 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 12px; overflow: hidden; border: 1px solid #fecaca;">
          <tr>
            <td style="padding: 20px;">
              <h3 style="color: #991b1b; margin: 0 0 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                ❌ Cita Anterior (Cancelada)
              </h3>
              <p style="color: #7f1d1d; font-size: 15px; text-decoration: line-through; margin: 0;">
                ${fechaAnteriorFormateada} a las ${horaAnteriorFormateada}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ` : ''}

    <!-- Recordatorios importantes -->
    <tr>
      <td style="padding: 20px 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 12px; border: 1px solid #fcd34d;">
          <tr>
            <td style="padding: 20px;">
              <h4 style="color: #92400e; margin: 0 0 12px; font-size: 15px;">⚠️ Recordatorios Importantes</h4>
              <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
                <li>Llega 15 minutos antes de tu cita</li>
                <li>Trae tu documento de identidad</li>
                <li>Si tienes exámenes previos, tráelos contigo</li>
              </ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Botón Ver Citas -->
    <tr>
      <td style="padding: 20px 25px; text-align: center;">
        <a href="${frontendUrl}/perfil/citas" style="display: inline-block; background: linear-gradient(135deg, #144F79 0%, #1a5a8a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-weight: 600; font-size: 15px;">
          Ver Mis Citas
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          📍 Cra. 5 #28-85, Ibagué, Tolima<br>
          📞 324 333 8555 | 📧 info@clinicamiacolombia.com
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0;">
          © ${new Date().getFullYear()} Clínica Mía - Tu Aliado en Salud y Bienestar
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
CITA REPROGRAMADA - Clínica Mía

Hola ${nombrePaciente},

Tu cita médica ha sido reprogramada exitosamente.

NUEVA CITA:
- Fecha: ${fechaFormateada}
- Hora: ${horaFormateada}
- Médico: ${nombreDoctor}
- Especialidad: ${especialidad?.titulo || 'Consulta General'}
${citaAnterior ? `
CITA ANTERIOR (Cancelada):
- ${fechaAnteriorFormateada} a las ${horaAnteriorFormateada}
` : ''}
Recordatorios:
- Llega 15 minutos antes de tu cita
- Trae tu documento de identidad
- Si tienes exámenes previos, tráelos contigo

📍 Cra. 5 #28-85, Ibagué, Tolima
📞 324 333 8555

Ver tus citas: ${frontendUrl}/perfil/citas

© ${new Date().getFullYear()} Clínica Mía
    `;

    return this.send({
      to,
      subject: `🔄 Cita Reprogramada - ${fechaFormateada} a las ${horaFormateada}`,
      html,
      text
    });
  }
  /**
   * Envía email de bienvenida a un nuevo doctor
   * @param {Object} params - Parámetros del correo
   * @param {string} params.to - Email del doctor
   * @param {string} params.nombre - Nombre del doctor
   * @param {string} params.apellido - Apellido del doctor
   * @param {string} params.email - Email/usuario para acceder
   * @param {string} params.password - Contraseña temporal
   */
  async sendDoctorWelcomeEmail({ to, nombre, apellido, email, password }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de bienvenida doctor no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombreCompleto = `${nombre} ${apellido}`.trim();
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const loginUrl = `${frontendUrl}/login`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido al Equipo - Clínica Mía</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #144F79 0%, #1a6a9e 100%); padding: 40px 20px; text-align: center;">
        <div style="font-size: 60px; margin-bottom: 15px;">🩺</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">¡Bienvenido al Equipo!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 16px;">Tu cuenta ha sido creada exitosamente</p>
      </td>
    </tr>

    <!-- Logo -->
    <tr>
      <td style="padding: 25px; text-align: center; border-bottom: 1px solid #e5e5e5;">
        <h2 style="color: #144F79; margin: 0; font-size: 32px; font-weight: 700;">Clínica Mía</h2>
        <p style="color: #53B896; margin: 5px 0 0; font-size: 14px;">Sistema de Gestión Integral</p>
      </td>
    </tr>

    <!-- Mensaje de bienvenida -->
    <tr>
      <td style="padding: 35px 30px 20px;">
        <p style="color: #333; font-size: 18px; margin: 0;">
          Dr(a). <strong>${nombreCompleto}</strong>,
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.7; margin: 20px 0 0;">
          Es un placer darte la bienvenida a nuestro equipo médico. Tu cuenta de acceso al sistema ha sido creada y está lista para usar.
        </p>
      </td>
    </tr>

    <!-- Credenciales -->
    <tr>
      <td style="padding: 0 30px 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; border: 2px solid #0ea5e9;">
          <tr>
            <td style="padding: 30px;">
              <h3 style="color: #0369a1; margin: 0 0 20px; font-size: 18px; text-align: center;">
                🔐 Tus Credenciales de Acceso
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 15px; background-color: #ffffff; border-radius: 10px; margin-bottom: 10px;">
                    <span style="color: #0369a1; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: block;">Usuario (Email)</span>
                    <span style="color: #1e3a8a; font-size: 18px; font-weight: 600; font-family: monospace;">${email}</span>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: #ffffff; border-radius: 10px;">
                    <span style="color: #0369a1; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: block;">Contraseña Temporal</span>
                    <span style="color: #1e3a8a; font-size: 18px; font-weight: 600; font-family: monospace; letter-spacing: 2px;">${password}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Aviso de seguridad -->
    <tr>
      <td style="padding: 0 30px 25px;">
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 8px;">
          <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">⚠️ Importante:</p>
          <p style="color: #78350f; font-size: 14px; margin: 10px 0 0; line-height: 1.6;">
            Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.
          </p>
        </div>
      </td>
    </tr>

    <!-- Botón de acceso -->
    <tr>
      <td style="padding: 0 30px 35px; text-align: center;">
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 45px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
          Ingresar al Sistema
        </a>
        <p style="color: #6b7280; font-size: 13px; margin: 15px 0 0;">
          O accede directamente en: <a href="${loginUrl}" style="color: #0ea5e9;">${loginUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Funcionalidades -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px;">
          <h4 style="color: #144F79; margin: 0 0 15px; font-size: 16px;">🚀 ¿Qué puedes hacer en el sistema?</h4>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #10b981; font-size: 16px;">✓</span>
                <span style="color: #374151; font-size: 14px; margin-left: 10px;">Gestionar tu agenda y citas médicas</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #10b981; font-size: 16px;">✓</span>
                <span style="color: #374151; font-size: 14px; margin-left: 10px;">Atender pacientes con historial clínico digital</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #10b981; font-size: 16px;">✓</span>
                <span style="color: #374151; font-size: 14px; margin-left: 10px;">Generar fórmulas y órdenes médicas electrónicas</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #10b981; font-size: 16px;">✓</span>
                <span style="color: #374151; font-size: 14px; margin-left: 10px;">Acceder al asistente médico con IA</span>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <!-- Contacto de soporte -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: 600;">¿Necesitas ayuda?</p>
          <p style="color: #1e3a8a; font-size: 14px; margin: 10px 0 0;">
            Contacta al equipo de soporte técnico<br>
            📧 soporte@clinicamiacolombia.com | 📞 324 333 8555
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 14px; margin: 0 0 5px;">
          <strong>Clínica Mía</strong> - Sistema de Gestión Integral
        </p>
        <p style="color: #888; font-size: 12px; margin: 0;">
          Cra. 5 #28-85, Ibagué, Tolima | Tel: 324 333 8555
        </p>
        <p style="color: #999; font-size: 11px; margin: 15px 0 0;">
          © ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.<br>
          <span style="color: #bbb;">Este es un mensaje confidencial. Por favor no comparta sus credenciales.</span>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
¡Bienvenido al Equipo de Clínica Mía!

Dr(a). ${nombreCompleto},

Es un placer darte la bienvenida a nuestro equipo médico. Tu cuenta de acceso al sistema ha sido creada y está lista para usar.

🔐 TUS CREDENCIALES DE ACCESO
================================
Usuario (Email): ${email}
Contraseña: ${password}
================================

⚠️ IMPORTANTE: Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.

🔗 LINK DE ACCESO: ${loginUrl}

¿Qué puedes hacer en el sistema?
- Gestionar tu agenda y citas médicas
- Atender pacientes con historial clínico digital
- Generar fórmulas y órdenes médicas electrónicas
- Acceder al asistente médico con IA

¿Necesitas ayuda? Contacta al equipo de soporte:
📧 soporte@clinicamiacolombia.com
📞 324 333 8555

---
Clínica Mía - Sistema de Gestión Integral
Cra. 5 #28-85, Ibagué, Tolima
© ${new Date().getFullYear()} Todos los derechos reservados.

Este es un mensaje confidencial. Por favor no comparta sus credenciales.
    `;

    return this.send({
      to,
      subject: `🩺 ¡Bienvenido al Equipo Médico de Clínica Mía! - Tus credenciales de acceso`,
      html,
      text
    });
  }
}

// Singleton
const emailService = new EmailService();
emailService.init();

module.exports = emailService;
