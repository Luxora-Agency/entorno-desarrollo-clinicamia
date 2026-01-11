/**
 * Servicio de Notificaciones MiaPass
 *
 * Maneja las notificaciones por email para el módulo MiaPass:
 * - Nueva suscripción (paciente y vendedor)
 * - Comisión liquidada
 * - Próximo vencimiento (30, 15, 7 días)
 * - Nuevo formulario de contacto
 */

const emailService = require('./email.service');
const prisma = require('../db/prisma');

class MiaPassNotificationService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Formatea moneda COP
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formatea fecha
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Notifica al paciente sobre su nueva suscripción MiaPass
   */
  async notificarNuevaSuscripcionPaciente(suscripcion) {
    if (!suscripcion.paciente?.email) {
      console.warn('[MiaPass Notification] Paciente sin email, notificación omitida');
      return { success: false, error: 'Paciente sin email' };
    }

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Bienvenido a MIA PASS</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Tu membresía está activa</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Hola <strong>${suscripcion.paciente.nombre} ${suscripcion.paciente.apellido || ''}</strong>,</p>

          <p style="color: #6b7280; line-height: 1.6;">
            Tu membresía <strong>MIA PASS - ${suscripcion.plan?.nombre || 'Plan'}</strong> ha sido activada exitosamente.
            Ahora puedes disfrutar de todos los beneficios exclusivos.
          </p>

          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px;">Detalles de tu membresía</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Plan:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${suscripcion.plan?.nombre || 'MIA PASS'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Valor pagado:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${this.formatCurrency(suscripcion.precioPagado)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Fecha de inicio:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${this.formatDate(suscripcion.fechaInicio)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Fecha de vencimiento:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${this.formatDate(suscripcion.fechaFin)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Código de membresía:</td>
                <td style="padding: 8px 0; color: #667eea; font-weight: 600; text-align: right;">${suscripcion.codigo || suscripcion.id}</td>
              </tr>
            </table>
          </div>

          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46; font-size: 14px;">
              <strong>Beneficios activos:</strong> Descuentos exclusivos, atención prioritaria, y más.
              Presenta tu código de membresía en cada visita.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Si tienes alguna pregunta, no dudes en contactarnos.
          </p>
        </div>

        <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Clínica Mía. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `;

    return emailService.send({
      to: suscripcion.paciente.email,
      subject: `Bienvenido a MIA PASS - Tu membresía está activa`,
      html
    });
  }

  /**
   * Notifica al vendedor sobre una venta exitosa
   */
  async notificarVentaVendedor(suscripcion, comisionVendedor) {
    if (!suscripcion.vendedor?.email) {
      console.warn('[MiaPass Notification] Vendedor sin email, notificación omitida');
      return { success: false, error: 'Vendedor sin email' };
    }

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Nueva Venta MIA PASS</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Felicitaciones por tu venta</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Hola <strong>${suscripcion.vendedor.nombre}</strong>,</p>

          <p style="color: #6b7280; line-height: 1.6;">
            Has realizado una nueva venta de membresía MIA PASS. ¡Excelente trabajo!
          </p>

          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px;">Detalles de la venta</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Cliente:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${suscripcion.paciente?.nombre || 'N/A'} ${suscripcion.paciente?.apellido || ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Plan:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${suscripcion.plan?.nombre || 'MIA PASS'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Valor de venta:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${this.formatCurrency(suscripcion.precioPagado)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Canal:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${suscripcion.canal || 'Presencial'}</td>
              </tr>
            </table>
          </div>

          ${comisionVendedor ? `
          <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 5px; color: #065f46; font-size: 14px;">Tu comisión por esta venta</p>
            <p style="margin: 0; color: #059669; font-size: 32px; font-weight: 700;">${this.formatCurrency(comisionVendedor.valor)}</p>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 12px;">${comisionVendedor.porcentaje * 100}% sobre base comisional</p>
          </div>
          ` : ''}

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Sigue vendiendo para alcanzar tu meta mensual de 30 membresías.
          </p>
        </div>

        <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Clínica Mía - Sistema MIA PASS
          </p>
        </div>
      </div>
    `;

    return emailService.send({
      to: suscripcion.vendedor.email,
      subject: `Nueva venta MIA PASS - ${this.formatCurrency(suscripcion.precioPagado)}`,
      html
    });
  }

  /**
   * Notifica al vendedor cuando sus comisiones son liquidadas
   */
  async notificarComisionLiquidada(vendedor, comisiones, totalPagado) {
    if (!vendedor.email) {
      console.warn('[MiaPass Notification] Vendedor sin email');
      return { success: false, error: 'Vendedor sin email' };
    }

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Comisiones Liquidadas</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Tu pago está en camino</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Hola <strong>${vendedor.nombre}</strong>,</p>

          <p style="color: #6b7280; line-height: 1.6;">
            Tus comisiones MIA PASS han sido liquidadas y procesadas para pago.
          </p>

          <div style="background: #dbeafe; border-radius: 8px; padding: 25px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 5px; color: #1e40af; font-size: 14px;">Total a recibir</p>
            <p style="margin: 0; color: #1d4ed8; font-size: 36px; font-weight: 700;">${this.formatCurrency(totalPagado)}</p>
          </div>

          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px;">Resumen</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Comisiones liquidadas:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${comisiones.length}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Período:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${this.formatDate(new Date())}</td>
              </tr>
            </table>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            El pago será procesado según los términos acordados.
          </p>
        </div>

        <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Clínica Mía - Sistema MIA PASS
          </p>
        </div>
      </div>
    `;

    return emailService.send({
      to: vendedor.email,
      subject: `Comisiones MIA PASS liquidadas - ${this.formatCurrency(totalPagado)}`,
      html
    });
  }

  /**
   * Notifica al paciente sobre próximo vencimiento de membresía
   */
  async notificarProximoVencimiento(suscripcion, diasRestantes) {
    if (!suscripcion.paciente?.email) {
      console.warn('[MiaPass Notification] Paciente sin email');
      return { success: false, error: 'Paciente sin email' };
    }

    const urgencia = diasRestantes <= 7 ? 'urgente' : diasRestantes <= 15 ? 'media' : 'baja';
    const bgColor = diasRestantes <= 7 ? '#ef4444' : diasRestantes <= 15 ? '#f59e0b' : '#3b82f6';

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${bgColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">
            ${diasRestantes <= 7 ? 'Tu membresía vence pronto' : 'Recordatorio MIA PASS'}
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
            ${diasRestantes} días restantes
          </p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Hola <strong>${suscripcion.paciente.nombre}</strong>,</p>

          <p style="color: #6b7280; line-height: 1.6;">
            Queremos recordarte que tu membresía <strong>MIA PASS</strong> vencerá en
            <strong style="color: ${bgColor};">${diasRestantes} días</strong> (${this.formatDate(suscripcion.fechaFin)}).
          </p>

          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Días restantes</p>
            <p style="margin: 0; color: ${bgColor}; font-size: 48px; font-weight: 700;">${diasRestantes}</p>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Renueva ahora</strong> para no perder tus beneficios exclusivos y continuar
              disfrutando de descuentos especiales en todos nuestros servicios.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.baseUrl}/mia-pass/renovar" style="background-color: ${bgColor}; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Renovar mi membresía
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Si tienes alguna pregunta, contáctanos y con gusto te ayudaremos.
          </p>
        </div>

        <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Clínica Mía - Sistema MIA PASS
          </p>
        </div>
      </div>
    `;

    return emailService.send({
      to: suscripcion.paciente.email,
      subject: `${diasRestantes <= 7 ? '⚠️ ' : ''}Tu membresía MIA PASS vence en ${diasRestantes} días`,
      html
    });
  }

  /**
   * Notifica al equipo comercial sobre un nuevo formulario de contacto
   */
  async notificarNuevoFormulario(formulario) {
    // Obtener emails del equipo comercial (Director Comercial y Vendedores con permiso)
    const equipoComercial = await prisma.usuario.findMany({
      where: {
        activo: true,
        OR: [
          { rol: 'DIRECTOR_COMERCIAL' },
          { rol: 'ADMIN' }
        ]
      },
      select: { email: true, nombre: true }
    });

    if (equipoComercial.length === 0) {
      console.warn('[MiaPass Notification] No hay equipo comercial para notificar');
      return { success: false, error: 'Sin destinatarios' };
    }

    const emails = equipoComercial.map(u => u.email).filter(Boolean);

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Nuevo Lead MIA PASS</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Formulario de contacto recibido</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">
            Se ha recibido un nuevo formulario de contacto interesado en MIA PASS.
          </p>

          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px;">Datos del interesado</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Nombre:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${formulario.nombreCompleto}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Documento:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${formulario.numeroDocumento}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${formulario.correoElectronico}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Celular:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${formulario.celular}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Personas:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${formulario.cantidadPersonas || 1}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Valor estimado:</td>
                <td style="padding: 8px 0; color: #8b5cf6; font-weight: 600; text-align: right;">${this.formatCurrency(formulario.valorTotal || 237981)}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Acción requerida:</strong> Contactar al interesado lo antes posible para convertir este lead.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.baseUrl}/mia-pass/formularios" style="background-color: #8b5cf6; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Ver en el sistema
            </a>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Clínica Mía - Sistema MIA PASS
          </p>
        </div>
      </div>
    `;

    return emailService.send({
      to: emails,
      subject: `🎯 Nuevo lead MIA PASS - ${formulario.nombreCompleto}`,
      html
    });
  }

  /**
   * Procesa notificaciones de vencimiento próximo (para cron job)
   * Envía recordatorios a 30, 15 y 7 días del vencimiento
   */
  async procesarNotificacionesVencimiento() {
    const hoy = new Date();
    const intervalos = [30, 15, 7];
    let notificacionesEnviadas = 0;

    for (const dias of intervalos) {
      const fechaObjetivo = new Date(hoy);
      fechaObjetivo.setDate(fechaObjetivo.getDate() + dias);

      // Buscar suscripciones que vencen en exactamente X días
      const inicioDelDia = new Date(fechaObjetivo);
      inicioDelDia.setHours(0, 0, 0, 0);
      const finDelDia = new Date(fechaObjetivo);
      finDelDia.setHours(23, 59, 59, 999);

      const suscripciones = await prisma.miaPassSuscripcion.findMany({
        where: {
          estado: 'ACTIVA',
          fechaFin: {
            gte: inicioDelDia,
            lte: finDelDia
          }
        },
        include: {
          paciente: { select: { nombre: true, apellido: true, email: true } },
          plan: { select: { nombre: true } }
        }
      });

      for (const suscripcion of suscripciones) {
        try {
          await this.notificarProximoVencimiento(suscripcion, dias);
          notificacionesEnviadas++;
          console.log(`[MiaPass Notification] Recordatorio ${dias} días enviado a ${suscripcion.paciente?.email}`);
        } catch (error) {
          console.error(`[MiaPass Notification] Error enviando recordatorio:`, error.message);
        }
      }
    }

    console.log(`[MiaPass Notification] ${notificacionesEnviadas} notificaciones de vencimiento enviadas`);
    return { notificacionesEnviadas };
  }
}

// Singleton
const miaPassNotificationService = new MiaPassNotificationService();

module.exports = miaPassNotificationService;
