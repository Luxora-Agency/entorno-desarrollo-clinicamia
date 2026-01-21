/**
 * Servicio de Email con Resend
 * Maneja el envío de correos electrónicos para alertas y notificaciones
 */

const { Resend } = require('resend');

// Zona horaria de Colombia para formateo de fechas
const TIMEZONE_BOGOTA = 'America/Bogota';

/**
 * Formatear fecha de campos @db.Date de Prisma sin conversión de timezone.
 * Prisma retorna fechas DATE como medianoche UTC ("2026-01-21T00:00:00.000Z"),
 * lo cual al convertir a Colombia (UTC-5) muestra el día anterior.
 * Esta función extrae la fecha directamente del string ISO.
 * @param {string|Date} fecha - Fecha en formato ISO o Date object
 * @param {boolean} includeWeekday - Incluir día de la semana
 * @returns {string} Fecha formateada
 */
function formatDateFromPrisma(fecha, includeWeekday = true) {
  if (!fecha) return 'Por confirmar';

  let datePart;
  if (typeof fecha === 'string') {
    datePart = fecha.split('T')[0];
  } else if (fecha instanceof Date) {
    datePart = fecha.toISOString().split('T')[0];
  }

  if (!datePart) return 'Por confirmar';

  const [year, month, day] = datePart.split('-');
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  // Crear fecha para obtener día de la semana (usar mediodía para evitar issues de timezone)
  const tempDate = new Date(`${datePart}T12:00:00`);
  const diaSemana = dias[tempDate.getDay()];

  if (includeWeekday) {
    return `${diaSemana}, ${parseInt(day)} de ${meses[parseInt(month) - 1]} de ${year}`;
  }
  return `${parseInt(day)} de ${meses[parseInt(month) - 1]} de ${year}`;
}

/**
 * Formatear hora de campos @db.Time de Prisma sin conversión de timezone.
 * @param {string|Date} hora - Hora en formato ISO o Date object
 * @returns {string} Hora formateada (HH:MM)
 */
function formatTimeFromPrisma(hora) {
  if (!hora) return 'Por confirmar';

  let timePart;
  if (typeof hora === 'string' && hora.includes('T')) {
    // Formato ISO: "1970-01-01T08:00:00.000Z"
    timePart = hora.split('T')[1]?.substring(0, 5);
  } else if (typeof hora === 'string') {
    // Formato HH:MM o HH:MM:SS
    timePart = hora.substring(0, 5);
  } else if (hora instanceof Date) {
    timePart = hora.toISOString().split('T')[1]?.substring(0, 5);
  }

  return timePart || 'Por confirmar';
}

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
          <span style="color: #856404;">${new Date(datos.fechaVencimiento).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: TIMEZONE_BOGOTA })}</span>
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

${datos.fechaVencimiento ? `Fecha de vencimiento: ${new Date(datos.fechaVencimiento).toLocaleDateString('es-CO', { timeZone: TIMEZONE_BOGOTA })}` : ''}
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
   * @param {Object} options - Opciones del email
   * @param {string} options.to - Email del destinatario
   * @param {string} options.nombre - Nombre del paciente
   * @param {string} options.apellido - Apellido del paciente
   * @param {string} [options.password] - Contraseña (solo se incluye si se proporciona)
   * @param {string} [options.loginUrl] - URL de login personalizada
   */
  async sendWelcomeEmail({ to, nombre, apellido, password, loginUrl }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de bienvenida no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombreCompleto = `${nombre} ${apellido}`.trim();
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const enlaceLogin = loginUrl || `${frontendUrl}/login`;

    // Sección de credenciales (solo si se proporciona contraseña)
    const credentialsSection = password ? `
        <!-- Credentials Box -->
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #0369a1; margin: 0 0 15px; font-size: 18px; display: flex; align-items: center;">
            🔐 Tus Credenciales de Acceso
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #666; font-size: 14px;">Usuario (Email):</span><br>
                <strong style="color: #0369a1; font-size: 16px;">${to}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #666; font-size: 14px;">Contraseña:</span><br>
                <strong style="color: #0369a1; font-size: 16px; font-family: monospace; background: #fff; padding: 5px 10px; border-radius: 4px; display: inline-block;">${password}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0 0;">
                <a href="${enlaceLogin}" style="background: #0369a1; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                  Iniciar Sesión
                </a>
              </td>
            </tr>
          </table>
          <p style="color: #64748b; font-size: 12px; margin: 15px 0 0; padding-top: 15px; border-top: 1px solid #bae6fd;">
            ⚠️ Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.
          </p>
        </div>
    ` : '';

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

        ${credentialsSection}

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

    // Sección de credenciales en texto plano
    const credentialsText = password ? `
TUS CREDENCIALES DE ACCESO:
---------------------------
Usuario (Email): ${to}
Contraseña: ${password}

Inicia sesión aquí: ${enlaceLogin}

⚠️ Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.
` : '';

    const text = `
¡Bienvenido/a a Clínica Mía, ${nombreCompleto}!

Gracias por crear tu cuenta.
${credentialsText}
Ahora puedes:
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

    // Formatear fecha y hora usando helpers para evitar issues de timezone
    const fechaFormateada = formatDateFromPrisma(cita.fecha);
    const horaFormateada = formatTimeFromPrisma(cita.hora);

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

    // Formatear fecha usando helper para evitar issues de timezone
    const fechaFormateada = formatDateFromPrisma(cita.fecha);

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

    // Formatear fecha usando helper para evitar issues de timezone
    const fechaFormateada = formatDateFromPrisma(cita.fecha);

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
- Fecha de solicitud: ${new Date().toLocaleDateString('es-CO', { timeZone: TIMEZONE_BOGOTA })}

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
            <td style="padding: 8px 0; color: #333; font-size: 14px;">${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: TIMEZONE_BOGOTA })}</td>
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

    // Formatear fecha y hora usando helpers para evitar issues de timezone
    const fechaFormateada = formatDateFromPrisma(cita.fecha);
    const horaFormateada = formatTimeFromPrisma(cita.hora);

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

    // Formatear fecha y hora usando helpers para evitar issues de timezone
    const fechaFormateada = formatDateFromPrisma(cita.fecha);
    const horaFormateada = formatTimeFromPrisma(cita.hora);

    // Formatear fecha y hora anterior si existen
    let fechaAnteriorFormateada = '';
    let horaAnteriorFormateada = '';
    if (citaAnterior) {
      fechaAnteriorFormateada = formatDateFromPrisma(citaAnterior.fecha);
      horaAnteriorFormateada = formatTimeFromPrisma(citaAnterior.hora);
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

  /**
   * Envía email de encuesta de satisfacción después de una consulta
   * @param {Object} options - Opciones del email
   * @param {string} options.to - Email del paciente
   * @param {Object} options.paciente - Datos del paciente
   * @param {Object} options.doctor - Datos del doctor
   * @param {Object} options.cita - Datos de la cita
   * @param {string} options.especialidad - Especialidad de la consulta
   * @param {string} options.surveyToken - Token único para acceder a la encuesta
   * @param {string} options.surveyUrl - URL de la encuesta
   */
  async sendSatisfactionSurvey({ to, paciente, doctor, cita, especialidad, surveyToken, surveyUrl }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de encuesta de satisfacción no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombrePaciente = `${paciente.nombre} ${paciente.apellido}`.trim();
    const nombreDoctor = doctor ? `Dr(a). ${doctor.nombre} ${doctor.apellido}`.trim() : 'el equipo médico';

    // Formatear fecha usando helper para evitar issues de timezone
    const fechaFormateada = formatDateFromPrisma(cita.fecha);

    // URL de la encuesta con el token
    const fullSurveyUrl = surveyUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/encuesta/${surveyToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Califica tu Experiencia - Clínica Mía</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header con gradiente -->
    <tr>
      <td style="background: linear-gradient(135deg, #144F79 0%, #1a6a9e 100%); padding: 30px 25px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
          Clínica Mía
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">
          Tu opinión nos ayuda a mejorar
        </p>
      </td>
    </tr>

    <!-- Icono de encuesta -->
    <tr>
      <td style="padding: 30px 25px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: inline-block; line-height: 80px;">
          <span style="font-size: 40px;">⭐</span>
        </div>
      </td>
    </tr>

    <!-- Saludo y mensaje principal -->
    <tr>
      <td style="padding: 0 25px 20px; text-align: center;">
        <h2 style="color: #1e3a5f; margin: 0 0 15px; font-size: 22px;">
          ¡Hola ${nombrePaciente}!
        </h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0;">
          Esperamos que tu cita médica haya sido una experiencia positiva. Nos encantaría conocer tu opinión sobre la atención recibida.
        </p>
      </td>
    </tr>

    <!-- Detalles de la consulta -->
    <tr>
      <td style="padding: 0 25px 25px;">
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border-left: 4px solid #10b981;">
          <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 0.5px;">
            Detalles de tu consulta
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 5px 0;">
                <span style="color: #6b7280; font-size: 14px;">📅 Fecha:</span>
                <span style="color: #1f2937; font-size: 14px; font-weight: 500; float: right;">${fechaFormateada}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">
                <span style="color: #6b7280; font-size: 14px;">👨‍⚕️ Atendido por:</span>
                <span style="color: #1f2937; font-size: 14px; font-weight: 500; float: right;">${nombreDoctor}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">
                <span style="color: #6b7280; font-size: 14px;">🏥 Especialidad:</span>
                <span style="color: #1f2937; font-size: 14px; font-weight: 500; float: right;">${especialidad || 'Consulta General'}</span>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <!-- Preguntas que evaluará -->
    <tr>
      <td style="padding: 0 25px 25px;">
        <p style="color: #4b5563; font-size: 14px; margin: 0 0 15px; text-align: center;">
          En la encuesta podrás calificar:
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33%" style="text-align: center; padding: 10px;">
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px 10px;">
                <span style="font-size: 28px;">👨‍⚕️</span>
                <p style="color: #1e40af; font-size: 12px; margin: 8px 0 0; font-weight: 500;">Atención del Doctor</p>
              </div>
            </td>
            <td width="33%" style="text-align: center; padding: 10px;">
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px 10px;">
                <span style="font-size: 28px;">👩‍⚕️</span>
                <p style="color: #92400e; font-size: 12px; margin: 8px 0 0; font-weight: 500;">Personal de Salud</p>
              </div>
            </td>
            <td width="33%" style="text-align: center; padding: 10px;">
              <div style="background-color: #ecfdf5; border-radius: 8px; padding: 15px 10px;">
                <span style="font-size: 28px;">🏥</span>
                <p style="color: #065f46; font-size: 12px; margin: 8px 0 0; font-weight: 500;">Instalaciones</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Botón de encuesta -->
    <tr>
      <td style="padding: 0 25px 30px; text-align: center;">
        <a href="${fullSurveyUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 45px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
          Calificar mi Experiencia
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0;">
          Solo toma 2 minutos completar la encuesta
        </p>
      </td>
    </tr>

    <!-- Mensaje de agradecimiento -->
    <tr>
      <td style="padding: 0 25px 25px;">
        <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; text-align: center;">
          <p style="color: #166534; font-size: 14px; margin: 0;">
            💚 Tu retroalimentación nos ayuda a brindarte un mejor servicio
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 12px; margin: 0 0 5px;">
          Si el botón no funciona, copia este enlace en tu navegador:
        </p>
        <p style="color: #144F79; font-size: 11px; margin: 0 0 15px; word-break: break-all;">
          ${fullSurveyUrl}
        </p>
        <p style="color: #666; font-size: 13px; margin: 0 0 10px;">
          ¿Necesitas ayuda? Contáctanos
        </p>
        <p style="color: #144F79; font-size: 14px; margin: 0;">
          📧 info@clinicamiacolombia.com | 📞 324 333 8555
        </p>
        <p style="color: #999; font-size: 11px; margin: 15px 0 0;">
          © ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.
        </p>
        <p style="color: #999; font-size: 10px; margin: 5px 0 0;">
          📍 Cra. 5 #28-85, Ibagué, Tolima
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
¡Califica tu Experiencia! - Clínica Mía

Hola ${nombrePaciente},

Esperamos que tu cita médica haya sido una experiencia positiva. Nos encantaría conocer tu opinión sobre la atención recibida.

📋 DETALLES DE TU CONSULTA
==========================
📅 Fecha: ${fechaFormateada}
👨‍⚕️ Atendido por: ${nombreDoctor}
🏥 Especialidad: ${especialidad || 'Consulta General'}

En la encuesta podrás calificar:
- 👨‍⚕️ Atención del Doctor
- 👩‍⚕️ Personal de Salud
- 🏥 Instalaciones y servicios

🔗 CALIFICA TU EXPERIENCIA AQUÍ:
${fullSurveyUrl}

Solo toma 2 minutos completar la encuesta.

💚 Tu retroalimentación nos ayuda a brindarte un mejor servicio.

---
¿Necesitas ayuda?
📧 info@clinicamiacolombia.com
📞 324 333 8555
📍 Cra. 5 #28-85, Ibagué, Tolima

© ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.
    `;

    return this.send({
      to,
      subject: `⭐ ${nombrePaciente}, ¿Cómo fue tu experiencia con ${nombreDoctor}? - Clínica Mía`,
      html,
      text
    });
  }

  /**
   * Envía email de confirmación de cita agendada
   * @param {Object} options - Opciones del email
   * @param {string} options.to - Email del paciente
   * @param {Object} options.paciente - Datos del paciente
   * @param {Object} options.doctor - Datos del doctor
   * @param {Object} options.cita - Datos de la cita
   * @param {string} options.especialidad - Especialidad
   * @param {string} options.proximaCita - Información de la próxima cita programada
   */
  async sendAppointmentScheduled({ to, paciente, doctor, cita, especialidad, proximaCita }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de agendamiento no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombrePaciente = `${paciente.nombre} ${paciente.apellido}`.trim();
    const nombreDoctor = doctor ? `Dr(a). ${doctor.nombre} ${doctor.apellido}`.trim() : 'Por asignar';

    // Formatear fecha y hora usando helpers para evitar issues de timezone
    const fechaFormateada = formatDateFromPrisma(cita.fecha);
    const horaFormateada = formatTimeFromPrisma(cita.hora);

    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Agendada - Clínica Mía</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header con gradiente -->
    <tr>
      <td style="background: linear-gradient(135deg, #144F79 0%, #1a6a9e 100%); padding: 30px 25px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
          Clínica Mía
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">
          Tu salud, nuestra prioridad
        </p>
      </td>
    </tr>

    <!-- Icono de confirmación -->
    <tr>
      <td style="padding: 30px 25px 20px; text-align: center;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: inline-block; line-height: 80px;">
          <span style="font-size: 40px;">✅</span>
        </div>
      </td>
    </tr>

    <!-- Mensaje principal -->
    <tr>
      <td style="padding: 0 25px 20px; text-align: center;">
        <h2 style="color: #1e3a5f; margin: 0 0 15px; font-size: 22px;">
          ¡Cita Agendada Exitosamente!
        </h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0;">
          Hola <strong>${nombrePaciente}</strong>, tu cita médica ha sido programada. Aquí están los detalles:
        </p>
      </td>
    </tr>

    <!-- Detalles de la cita -->
    <tr>
      <td style="padding: 0 25px 25px;">
        <div style="background-color: #eff6ff; border-radius: 12px; padding: 25px; border: 2px solid #3b82f6;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dbeafe;">
                <span style="color: #6b7280; font-size: 14px;">📅 Fecha</span>
                <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 5px 0 0;">${fechaFormateada}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dbeafe;">
                <span style="color: #6b7280; font-size: 14px;">🕐 Hora</span>
                <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 5px 0 0;">${horaFormateada}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #dbeafe;">
                <span style="color: #6b7280; font-size: 14px;">👨‍⚕️ Médico</span>
                <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 5px 0 0;">${nombreDoctor}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <span style="color: #6b7280; font-size: 14px;">🏥 Especialidad</span>
                <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 5px 0 0;">${especialidad || 'Consulta General'}</p>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <!-- Recordatorio importante -->
    <tr>
      <td style="padding: 0 25px 25px;">
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
          <p style="color: #92400e; font-size: 13px; margin: 0;">
            ⏰ <strong>Recordatorio:</strong> Por favor llega 15 minutos antes de tu cita. Recibirás recordatorios automáticos 7 días, 4 días y 3 horas antes de tu cita.
          </p>
        </div>
      </td>
    </tr>

    <!-- Ubicación -->
    <tr>
      <td style="padding: 0 25px 25px;">
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 0.5px;">
            📍 Ubicación
          </p>
          <p style="color: #1f2937; font-size: 14px; margin: 0;">
            <strong>Clínica Mía</strong><br>
            Cra. 5 #28-85, Ibagué, Tolima
          </p>
        </div>
      </td>
    </tr>

    <!-- Botón de acceso al portal -->
    <tr>
      <td style="padding: 0 25px 30px; text-align: center;">
        <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #144F79 0%, #1a6a9e 100%); color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Ver Mis Citas
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 13px; margin: 0 0 10px;">
          ¿Necesitas reprogramar? Contáctanos
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
¡Cita Agendada Exitosamente! - Clínica Mía

Hola ${nombrePaciente},

Tu cita médica ha sido programada. Aquí están los detalles:

📅 DETALLES DE TU CITA
======================
📅 Fecha: ${fechaFormateada}
🕐 Hora: ${horaFormateada}
👨‍⚕️ Médico: ${nombreDoctor}
🏥 Especialidad: ${especialidad || 'Consulta General'}

📍 UBICACIÓN
============
Clínica Mía
Cra. 5 #28-85, Ibagué, Tolima

⏰ RECORDATORIO: Por favor llega 15 minutos antes de tu cita.
Recibirás recordatorios automáticos 7 días, 4 días y 3 horas antes de tu cita.

---
¿Necesitas reprogramar? Contáctanos:
📧 info@clinicamiacolombia.com
📞 324 333 8555

© ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.
    `;

    return this.send({
      to,
      subject: `✅ Cita Confirmada: ${fechaFormateada} a las ${horaFormateada} - Clínica Mía`,
      html,
      text
    });
  }

  /**
   * Envía email de agradecimiento cuando un candidato aplica a una vacante
   * @param {Object} options - Opciones del email
   * @param {string} options.to - Email del candidato
   * @param {string} options.nombre - Nombre del candidato
   * @param {string} options.apellido - Apellido del candidato
   * @param {string} options.vacanteTitulo - Título de la vacante
   */
  async sendApplicationThankYou({ to, nombre, apellido, vacanteTitulo }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de agradecimiento no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombreCompleto = `${nombre} ${apellido}`.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gracias por tu postulacion</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <tr>
      <td style="background: linear-gradient(135deg, #144F79 0%, #53B896 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Clinica Mia</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Tu Aliado en Salud y Bienestar</p>
      </td>
    </tr>

    <!-- Thank You Message -->
    <tr>
      <td style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #53B896 0%, #144F79 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px; color: white;">&#10003;</span>
          </div>
          <h2 style="color: #144F79; margin: 0; font-size: 24px;">Gracias por postularte, ${nombreCompleto}!</h2>
        </div>

        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px; text-align: center;">
          Hemos recibido exitosamente tu aplicacion para la vacante de:
        </p>

        <!-- Vacancy Box -->
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
          <h3 style="color: #0369a1; margin: 0; font-size: 20px;">
            ${vacanteTitulo}
          </h3>
        </div>

        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Nuestro equipo de Talento Humano revisara tu perfil y nos estaremos comunicando contigo si tu perfil se ajusta a los requisitos de la vacante.
        </p>

        <!-- What's Next Section -->
        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #144F79; margin: 0 0 15px; font-size: 18px;">Que sigue?</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 10px 0; vertical-align: top; width: 30px;">
                <span style="color: #53B896; font-size: 18px; font-weight: bold;">1.</span>
              </td>
              <td style="padding: 10px 0; color: #555; font-size: 14px;">
                Revisaremos tu aplicacion en los proximos dias habiles.
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; vertical-align: top; width: 30px;">
                <span style="color: #53B896; font-size: 18px; font-weight: bold;">2.</span>
              </td>
              <td style="padding: 10px 0; color: #555; font-size: 14px;">
                Si cumples con el perfil, te contactaremos para agendar una entrevista.
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #888; font-size: 14px; line-height: 1.6; text-align: center; margin: 20px 0 0;">
          Si tienes alguna pregunta, no dudes en contactarnos a<br>
          <a href="mailto:talentohumano@clinicamiacolombia.com" style="color: #144F79; text-decoration: none;">talentohumano@clinicamiacolombia.com</a>
        </p>
      </td>
    </tr>

    <!-- Contact Info -->
    <tr>
      <td style="padding: 20px 30px; background-color: #f0f9ff; border-top: 1px solid #e0f2fe;">
        <p style="color: #0369a1; font-size: 14px; margin: 0; text-align: center;">
          <strong>Clinica Mia</strong><br>
          Cra. 5 #28-85, Ibague, Tolima<br>
          Tel: 324 333 8555
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} Clinica Mia. Todos los derechos reservados.<br>
          Ibague, Tolima - Colombia
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Gracias por postularte, ${nombreCompleto}!

Hemos recibido exitosamente tu aplicacion para la vacante de:
${vacanteTitulo}

Nuestro equipo de Talento Humano revisara tu perfil y nos estaremos comunicando contigo si tu perfil se ajusta a los requisitos de la vacante.

QUE SIGUE?
----------
1. Revisaremos tu aplicacion en los proximos dias habiles.
2. Si cumples con el perfil, te contactaremos para agendar una entrevista.

Si tienes alguna pregunta, contactanos a: talentohumano@clinicamiacolombia.com

---
Clinica Mia
Cra. 5 #28-85, Ibague, Tolima
Tel: 324 333 8555

(c) ${new Date().getFullYear()} Clinica Mia. Todos los derechos reservados.
    `;

    return this.send({
      to,
      subject: `Gracias por tu postulacion - ${vacanteTitulo} | Clinica Mia`,
      html,
      text
    });
  }

  /**
   * Envía email de notificación de cita re-agendada
   * @param {Object} options - Opciones del email
   * @param {string} options.to - Email del paciente
   * @param {Object} options.paciente - Datos del paciente
   * @param {Object} options.citaAnterior - Datos de la cita anterior
   * @param {Object} options.citaNueva - Datos de la nueva cita
   * @param {Object} options.doctor - Datos del doctor
   * @param {string} options.especialidad - Nombre de la especialidad
   */
  async sendRescheduleEmail({ to, paciente, citaAnterior, citaNueva, doctor, especialidad }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de re-agendamiento no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombrePaciente = `${paciente.nombre} ${paciente.apellido}`.trim();
    const nombreDoctor = doctor ? `Dr. ${doctor.nombre} ${doctor.apellido}`.trim() : 'Por asignar';
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

    // Formatear fechas y horas usando helpers para evitar issues de timezone
    const fechaAnteriorFormateada = formatDateFromPrisma(citaAnterior.fecha);
    const fechaNuevaFormateada = formatDateFromPrisma(citaNueva.fecha);
    const horaAnteriorFormateada = formatTimeFromPrisma(citaAnterior.hora);
    const horaNuevaFormateada = formatTimeFromPrisma(citaNueva.hora);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Re-agendada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header con gradiente -->
    <tr>
      <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 20px; text-align: center;">
        <div style="background: rgba(255,255,255,0.2); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 35px;">📅</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Tu Cita ha sido Re-agendada</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Confirmación de cambio de cita médica</p>
      </td>
    </tr>

    <!-- Saludo -->
    <tr>
      <td style="padding: 30px 25px 20px;">
        <p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.6;">
          Hola <strong>${nombrePaciente}</strong>,
        </p>
        <p style="color: #6b7280; font-size: 15px; margin: 15px 0 0; line-height: 1.6;">
          Te confirmamos que tu cita médica ha sido re-agendada exitosamente. A continuación encontrarás los detalles de tu nueva cita.
        </p>
      </td>
    </tr>

    <!-- Cita Anterior (Cancelada) -->
    <tr>
      <td style="padding: 0 25px 20px;">
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 20px; border-left: 4px solid #ef4444;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 20px; margin-right: 10px;">❌</span>
            <h3 style="color: #991b1b; margin: 0; font-size: 16px; font-weight: 600;">Cita Anterior (Cancelada)</h3>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 5px 0; color: #7f1d1d; font-size: 14px;">
                <span style="color: #9ca3af;">📆 Fecha:</span> <strong style="text-decoration: line-through;">${fechaAnteriorFormateada}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #7f1d1d; font-size: 14px;">
                <span style="color: #9ca3af;">🕐 Hora:</span> <strong style="text-decoration: line-through;">${horaAnteriorFormateada}</strong>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <!-- Flecha de transición -->
    <tr>
      <td style="text-align: center; padding: 0 25px 20px;">
        <div style="font-size: 30px;">⬇️</div>
      </td>
    </tr>

    <!-- Nueva Cita -->
    <tr>
      <td style="padding: 0 25px 25px;">
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 25px; border-left: 4px solid #10b981;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 24px; margin-right: 10px;">✅</span>
            <h3 style="color: #065f46; margin: 0; font-size: 18px; font-weight: 700;">Nueva Cita Confirmada</h3>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(16,185,129,0.2);">
                <span style="color: #6b7280; font-size: 13px; display: block;">📆 Fecha</span>
                <strong style="color: #047857; font-size: 16px;">${fechaNuevaFormateada}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(16,185,129,0.2);">
                <span style="color: #6b7280; font-size: 13px; display: block;">🕐 Hora</span>
                <strong style="color: #047857; font-size: 16px;">${horaNuevaFormateada}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(16,185,129,0.2);">
                <span style="color: #6b7280; font-size: 13px; display: block;">👨‍⚕️ Doctor</span>
                <strong style="color: #047857; font-size: 16px;">${nombreDoctor}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <span style="color: #6b7280; font-size: 13px; display: block;">🩺 Especialidad</span>
                <strong style="color: #047857; font-size: 16px;">${especialidad || 'Consulta General'}</strong>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <!-- Recordatorios -->
    <tr>
      <td style="padding: 0 25px 25px;">
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px;">
          <h4 style="color: #1e3a8a; margin: 0 0 15px; font-size: 15px;">📋 Recordatorios Importantes</h4>
          <ul style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Llega 15 minutos antes de tu cita</li>
            <li>Trae tu documento de identidad</li>
            <li>Si tienes exámenes previos, tráelos contigo</li>
            <li>Recuerda traer tu carnet de EPS si aplica</li>
          </ul>
        </div>
      </td>
    </tr>

    <!-- Botón de acción -->
    <tr>
      <td style="padding: 0 25px 30px; text-align: center;">
        <a href="${frontendUrl}/mis-citas" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(59,130,246,0.4);">
          Ver Mis Citas
        </a>
      </td>
    </tr>

    <!-- Contacto -->
    <tr>
      <td style="padding: 0 25px 25px;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #92400e; font-size: 14px; margin: 0 0 10px;">
            <strong>¿Necesitas cancelar o modificar tu cita?</strong>
          </p>
          <p style="color: #78350f; font-size: 13px; margin: 0;">
            📞 Llámanos al <strong>324 333 8555</strong><br>
            📧 info@clinicamiacolombia.com
          </p>
        </div>
      </td>
    </tr>

    <!-- Ubicación -->
    <tr>
      <td style="padding: 0 25px 25px; text-align: center;">
        <p style="color: #6b7280; font-size: 13px; margin: 0;">
          📍 <strong>Clínica Mía</strong> - Cra. 5 #28-85, Ibagué, Tolima
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 25px; text-align: center;">
        <p style="color: rgba(255,255,255,0.9); font-size: 13px; margin: 0 0 10px;">
          ¡Gracias por confiar en nosotros para tu salud!
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
CITA RE-AGENDADA - CLÍNICA MÍA

Hola ${nombrePaciente},

Te confirmamos que tu cita médica ha sido re-agendada exitosamente.

❌ CITA ANTERIOR (CANCELADA)
---------------------------
Fecha: ${fechaAnteriorFormateada}
Hora: ${horaAnteriorFormateada}

✅ NUEVA CITA CONFIRMADA
------------------------
Fecha: ${fechaNuevaFormateada}
Hora: ${horaNuevaFormateada}
Doctor: ${nombreDoctor}
Especialidad: ${especialidad || 'Consulta General'}

📋 RECORDATORIOS:
- Llega 15 minutos antes de tu cita
- Trae tu documento de identidad
- Si tienes exámenes previos, tráelos contigo
- Recuerda traer tu carnet de EPS si aplica

📍 UBICACIÓN: Cra. 5 #28-85, Ibagué, Tolima
📞 CONTACTO: 324 333 8555

Ver mis citas: ${frontendUrl}/mis-citas

---
¡Gracias por confiar en nosotros para tu salud!
© ${new Date().getFullYear()} Clínica Mía
    `;

    return this.send({
      to,
      subject: `✅ Tu Cita ha sido Re-agendada | ${fechaNuevaFormateada} - Clínica Mía`,
      html,
      text
    });
  }

  /**
   * Enviar email de notificación de No Asistió
   * @param {string} options.to - Email del paciente
   * @param {Object} options.paciente - Datos del paciente
   * @param {Object} options.cita - Datos de la cita
   * @param {Object} options.doctor - Datos del doctor
   * @param {string} options.especialidad - Nombre de la especialidad
   */
  async sendNoShowEmail({ to, paciente, cita, doctor, especialidad }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de No Asistió no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombrePaciente = `${paciente.nombre} ${paciente.apellido}`.trim();
    const nombreDoctor = doctor ? `Dr. ${doctor.nombre} ${doctor.apellido}`.trim() : 'No asignado';
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

    // Formatear fecha y hora usando helpers para evitar issues de timezone
    const fechaFormateada = formatDateFromPrisma(cita.fecha);
    const horaFormateada = formatTimeFromPrisma(cita.hora) || 'No especificada';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">

          <!-- Header con icono de alerta -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 35px 25px; text-align: center;">
              <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 35px;">⚠️</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">Cita No Atendida</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 15px;">No pudimos atenderte en tu cita programada</p>
            </td>
          </tr>

          <!-- Saludo -->
          <tr>
            <td style="padding: 30px 25px 20px;">
              <p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.6;">
                Hola <strong>${nombrePaciente}</strong>,
              </p>
              <p style="color: #6b7280; font-size: 15px; margin: 15px 0 0; line-height: 1.6;">
                Lamentamos informarte que tu cita programada fue marcada como <strong style="color: #ea580c;">No Asistió</strong>.
                Entendemos que pueden surgir imprevistos, por eso queremos recordarte que puedes reagendar tu cita cuando lo necesites.
              </p>
            </td>
          </tr>

          <!-- Detalles de la cita perdida -->
          <tr>
            <td style="padding: 0 25px 25px;">
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; border-left: 4px solid #f97316;">
                <h3 style="color: #92400e; margin: 0 0 20px; font-size: 16px; display: flex; align-items: center;">
                  <span style="margin-right: 10px;">📋</span> Detalles de la Cita
                </h3>
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #92400e; font-size: 13px; display: block;">📅 Fecha</span>
                      <strong style="color: #78350f; font-size: 16px;">${fechaFormateada}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #92400e; font-size: 13px; display: block;">🕐 Hora</span>
                      <strong style="color: #78350f; font-size: 16px;">${horaFormateada}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #92400e; font-size: 13px; display: block;">👨‍⚕️ Doctor</span>
                      <strong style="color: #78350f; font-size: 16px;">${nombreDoctor}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #92400e; font-size: 13px; display: block;">🩺 Especialidad</span>
                      <strong style="color: #78350f; font-size: 16px;">${especialidad || 'Consulta General'}</strong>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Mensaje de reagendamiento -->
          <tr>
            <td style="padding: 0 25px 25px;">
              <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; border: 1px solid #a7f3d0;">
                <h4 style="color: #065f46; margin: 0 0 10px; font-size: 15px;">💡 ¿Necesitas reagendar?</h4>
                <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;">
                  Tu salud es importante para nosotros. Puedes comunicarte con nosotros para programar una nueva cita
                  en el horario que mejor te convenga.
                </p>
              </div>
            </td>
          </tr>

          <!-- Botón de acción -->
          <tr>
            <td style="padding: 0 25px 30px; text-align: center;">
              <a href="${frontendUrl}/mis-citas" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(249,115,22,0.4);">
                Agendar Nueva Cita
              </a>
            </td>
          </tr>

          <!-- Contacto -->
          <tr>
            <td style="padding: 0 25px 25px;">
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px;">
                  <strong>¿Tienes alguna pregunta?</strong>
                </p>
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                  📍 Cra. 5 #28-85, Ibagué, Tolima<br>
                  📞 324 333 8555<br>
                  📧 contacto@clinicamia.com
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 20px 25px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 10px 0 0;">
                Este correo fue enviado automáticamente. Por favor no responder a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
CITA NO ATENDIDA - Clínica Mía

Hola ${nombrePaciente},

Lamentamos informarte que tu cita programada fue marcada como "No Asistió".

DETALLES DE LA CITA:
- Fecha: ${fechaFormateada}
- Hora: ${horaFormateada}
- Doctor: ${nombreDoctor}
- Especialidad: ${especialidad || 'Consulta General'}

¿NECESITAS REAGENDAR?
Tu salud es importante para nosotros. Puedes comunicarte con nosotros para programar una nueva cita.

📍 UBICACIÓN: Cra. 5 #28-85, Ibagué, Tolima
📞 CONTACTO: 324 333 8555

Agendar nueva cita: ${frontendUrl}/mis-citas

---
© ${new Date().getFullYear()} Clínica Mía
    `;

    return this.send({
      to,
      subject: `⚠️ Cita No Atendida | ${fechaFormateada} - Clínica Mía`,
      html,
      text
    });
  }

  /**
   * Envía confirmación de pago al paciente
   * @param {Object} params
   * @param {string} params.to - Email del paciente
   * @param {Object} params.paciente - { nombre, apellido }
   * @param {Object} params.factura - { id, total, metodoPago, numeroReferencia }
   * @param {Object} params.cita - { fecha, hora }
   * @param {string} params.especialidad
   */
  async sendPaymentConfirmation({ to, paciente, factura, cita, especialidad }) {
    if (!this.isEnabled()) {
      console.warn('[Email] Servicio deshabilitado. Email de pago no enviado a:', to);
      return { success: false, error: 'Servicio de email no configurado' };
    }

    const nombrePaciente = `${paciente.nombre} ${paciente.apellido}`.trim();

    // Formatear fecha y hora usando helpers para evitar issues de timezone
    const fechaFormateada = formatDateFromPrisma(cita.fecha);
    const horaFormateada = formatTimeFromPrisma(cita.hora);

    // Formatear total
    const totalFormateado = parseFloat(factura.total).toLocaleString('es-CO');

    // Icono según método de pago
    const metodoPagoIconos = {
      'Efectivo': '💵',
      'Tarjeta': '💳',
      'Transferencia': '🏦',
      'EPS': '🏥'
    };
    const iconoMetodo = metodoPagoIconos[factura.metodoPago] || '💰';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pago</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
        <div style="width: 70px; height: 70px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; line-height: 70px;">
          <span style="font-size: 35px;">✓</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">¡Pago Confirmado!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Hemos recibido tu pago exitosamente</p>
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
          Te confirmamos que hemos recibido tu pago. A continuación encontrarás los detalles:
        </p>
      </td>
    </tr>

    <!-- Resumen del pago -->
    <tr>
      <td style="padding: 20px 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; overflow: hidden; border: 2px solid #10B981;">
          <tr>
            <td style="padding: 25px; text-align: center;">
              <p style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin: 0 0 5px;">Total Pagado</p>
              <p style="color: #059669; font-size: 36px; font-weight: 800; margin: 0;">$${totalFormateado}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Detalles del pago -->
    <tr>
      <td style="padding: 0 25px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 15px; text-transform: uppercase;">Detalles del Pago</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px;">${iconoMetodo} MÉTODO DE PAGO</span><br>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${factura.metodoPago}</span>
                  </td>
                </tr>
                ${factura.bancoDestino ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px;">🏦 BANCO / CUENTA DESTINO</span><br>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${factura.bancoDestino}</span>
                  </td>
                </tr>
                ` : ''}
                ${factura.numeroReferencia ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #6b7280; font-size: 13px;">📝 NÚMERO DE REFERENCIA</span><br>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 600; font-family: monospace;">${factura.numeroReferencia}</span>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Detalles de la consulta -->
    <tr>
      <td style="padding: 0 25px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 15px; text-transform: uppercase;">Consulta Asociada</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6b7280; font-size: 13px;">📅 FECHA</span><br>
                    <span style="color: #1f2937; font-size: 15px; font-weight: 500;">${fechaFormateada}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6b7280; font-size: 13px;">🕐 HORA</span><br>
                    <span style="color: #1f2937; font-size: 15px; font-weight: 500;">${horaFormateada}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6b7280; font-size: 13px;">🏥 ESPECIALIDAD</span><br>
                    <span style="color: #1f2937; font-size: 15px; font-weight: 500;">${especialidad || 'Consulta General'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Mensaje -->
    <tr>
      <td style="padding: 0 25px 25px;">
        <div style="background-color: #eff6ff; border-left: 4px solid #3B82F6; padding: 15px; border-radius: 0 8px 8px 0;">
          <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.5;">
            <strong>💡 Importante:</strong> Recuerda llegar 15 minutos antes de tu cita para realizar el proceso de admisión. Conserva este correo como comprobante de pago.
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #144F79; padding: 25px; text-align: center;">
        <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 10px;">
          ¿Tienes preguntas? Contáctanos
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0;">
          📞 (1) 234-5678 | ✉️ info@clinicamia.com
        </p>
        <p style="color: rgba(255,255,255,0.5); font-size: 11px; margin: 15px 0 0;">
          © ${new Date().getFullYear()} Clínica Mía - Todos los derechos reservados
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
CONFIRMACIÓN DE PAGO - CLÍNICA MÍA

Hola ${nombrePaciente},

Te confirmamos que hemos recibido tu pago exitosamente.

DETALLES DEL PAGO:
- Total Pagado: $${totalFormateado}
- Método: ${factura.metodoPago}
${factura.bancoDestino ? `- Banco/Cuenta: ${factura.bancoDestino}` : ''}
${factura.numeroReferencia ? `- Referencia: ${factura.numeroReferencia}` : ''}
- No. Factura: ${factura.id.substring(0, 8).toUpperCase()}

CONSULTA ASOCIADA:
- Fecha: ${fechaFormateada}
- Hora: ${horaFormateada}
- Especialidad: ${especialidad || 'Consulta General'}

Recuerda llegar 15 minutos antes de tu cita para el proceso de admisión.

¿Preguntas? Contáctanos al (1) 234-5678 o info@clinicamia.com

© ${new Date().getFullYear()} Clínica Mía
    `;

    return this.send({
      to,
      subject: `✅ Pago Confirmado | $${totalFormateado} - Clínica Mía`,
      html,
      text
    });
  }
}

// Singleton
const emailService = new EmailService();
emailService.init();

module.exports = emailService;
