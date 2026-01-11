const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');
const emailService = require('../../email.service');
const { differenceInDays, format } = require('date-fns');
const { es } = require('date-fns/locale');

class AlertaDocumentoLegalService {
  /**
   * Generar alertas pendientes para todos los documentos
   * Este método se ejecuta diariamente via cron job
   */
  async generarAlertasPendientes() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    console.log(`[ALERTAS] Iniciando generación de alertas para ${format(hoy, 'dd/MM/yyyy')}`);

    // Buscar documentos con vencimiento activos
    const documentos = await prisma.documentoLegalInfraestructura.findMany({
      where: {
        activo: true,
        tieneVencimiento: true,
        fechaVencimiento: {
          not: null,
        },
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        carpeta: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    console.log(`[ALERTAS] Encontrados ${documentos.length} documentos con vencimiento`);

    const alertasCreadas = [];
    const errores = [];

    for (const doc of documentos) {
      try {
        const diasRestantes = differenceInDays(doc.fechaVencimiento, hoy);

        console.log(`[ALERTAS] Documento "${doc.nombre}": ${diasRestantes} días restantes`);

        // Verificar si el documento está vencido
        if (diasRestantes < 0) {
          const alertaVencida = await this._verificarYCrearAlerta(
            doc,
            'VENCIDO',
            `El documento "${doc.nombre}" está VENCIDO desde el ${format(doc.fechaVencimiento, 'dd/MM/yyyy', { locale: es })}`,
            Math.abs(diasRestantes)
          );

          if (alertaVencida) {
            alertasCreadas.push(alertaVencida);
            // Enviar email para documentos vencidos
            await this.enviarEmailAlerta(alertaVencida.id);
          }
          continue;
        }

        // Verificar alertas según días configurados
        for (const diasAlerta of doc.diasAlerta) {
          if (diasRestantes === diasAlerta) {
            const tipo = `POR_VENCER_${diasAlerta}`;
            const mensaje = `El documento "${doc.nombre}" vencerá en ${diasAlerta} días (${format(doc.fechaVencimiento, 'dd/MM/yyyy', { locale: es })})`;

            const alerta = await this._verificarYCrearAlerta(doc, tipo, mensaje, diasRestantes);

            if (alerta) {
              alertasCreadas.push(alerta);
              // Enviar email
              await this.enviarEmailAlerta(alerta.id);
            }
          }
        }
      } catch (error) {
        console.error(`[ALERTAS] Error procesando documento ${doc.id}:`, error);
        errores.push({
          documentoId: doc.id,
          documentoNombre: doc.nombre,
          error: error.message,
        });
      }
    }

    console.log(`[ALERTAS] Proceso finalizado. Alertas creadas: ${alertasCreadas.length}, Errores: ${errores.length}`);

    return {
      alertasCreadas: alertasCreadas.length,
      errores,
      detalles: alertasCreadas,
    };
  }

  /**
   * Verificar si una alerta ya existe y crearla si es necesaria
   */
  async _verificarYCrearAlerta(documento, tipo, mensaje, diasRestantes) {
    // Verificar si ya existe una alerta del mismo tipo pendiente o notificada
    const alertaExistente = await prisma.alertaDocumentoLegal.findFirst({
      where: {
        documentoId: documento.id,
        tipo,
        estado: {
          in: ['PENDIENTE', 'NOTIFICADO'],
        },
      },
    });

    if (alertaExistente) {
      console.log(`[ALERTAS] Ya existe alerta ${tipo} para documento ${documento.id}`);
      return null;
    }

    // Crear nueva alerta
    const alerta = await prisma.alertaDocumentoLegal.create({
      data: {
        documentoId: documento.id,
        tipo,
        mensaje,
        fechaAlerta: new Date(),
        diasRestantes,
        estado: 'PENDIENTE',
      },
      include: {
        documento: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
              },
            },
            carpeta: true,
          },
        },
      },
    });

    console.log(`[ALERTAS] Alerta creada: ${tipo} para documento ${documento.nombre}`);

    return alerta;
  }

  /**
   * Enviar email de alerta usando Resend
   */
  async enviarEmailAlerta(alertaId) {
    const alerta = await prisma.alertaDocumentoLegal.findUnique({
      where: { id: alertaId },
      include: {
        documento: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
              },
            },
            carpeta: true,
          },
        },
      },
    });

    if (!alerta) {
      throw new NotFoundError('Alerta no encontrada');
    }

    if (alerta.emailEnviado) {
      console.log(`[ALERTAS] Email ya enviado para alerta ${alertaId}`);
      return alerta;
    }

    // Obtener emails de administradores de calidad (SUPER_ADMIN y ADMIN)
    const admins = await prisma.usuario.findMany({
      where: {
        rol: { in: ['SUPER_ADMIN', 'ADMIN'] },
        activo: true,
      },
      select: { email: true, nombre: true, apellido: true },
    });

    const destinatarios = [
      {
        email: alerta.documento.usuario.email,
        nombre: `${alerta.documento.usuario.nombre} ${alerta.documento.usuario.apellido}`,
      },
      ...admins.map(admin => ({
        email: admin.email,
        nombre: `${admin.nombre} ${admin.apellido}`,
      })),
    ];

    // Filtrar emails válidos y únicos
    const emailsUnicos = [...new Set(destinatarios
      .filter(d => d.email)
      .map(d => d.email))];

    if (emailsUnicos.length === 0) {
      console.log(`[ALERTAS] No hay destinatarios válidos para alerta ${alertaId}`);
      return alerta;
    }

    // Determinar asunto y color según tipo
    const esVencido = alerta.tipo === 'VENCIDO';
    const subject = esVencido
      ? `⚠️ Documento VENCIDO - ${alerta.documento.nombre}`
      : `⏰ Alerta: Documento próximo a vencer - ${alerta.documento.nombre}`;

    const color = esVencido ? '#dc2626' : '#f59e0b';
    const icono = esVencido ? '⚠️' : '⏰';
    const titulo = esVencido ? 'Documento VENCIDO' : 'Alerta de Vencimiento';

    // Construir HTML del email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .card {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            color: ${color};
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: bold;
          }
          .info-box {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .info-row {
            margin: 8px 0;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #999;
          }
          .button {
            display: inline-block;
            background-color: ${color};
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h2 class="header">${icono} ${titulo}</h2>

            <p style="font-size: 16px; color: #333;">
              ${alerta.mensaje}
            </p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Documento:</span> ${alerta.documento.nombre}
              </div>
              <div class="info-row">
                <span class="label">Tipo:</span> ${alerta.documento.tipoDocumento}
              </div>
              <div class="info-row">
                <span class="label">Fecha de Vencimiento:</span> ${format(alerta.documento.fechaVencimiento, 'dd/MM/yyyy', { locale: es })}
              </div>
              ${alerta.documento.numeroDocumento ? `
                <div class="info-row">
                  <span class="label">Número:</span> ${alerta.documento.numeroDocumento}
                </div>
              ` : ''}
              ${alerta.documento.entidadEmisora ? `
                <div class="info-row">
                  <span class="label">Entidad Emisora:</span> ${alerta.documento.entidadEmisora}
                </div>
              ` : ''}
              ${alerta.documento.carpeta ? `
                <div class="info-row">
                  <span class="label">Carpeta:</span> ${alerta.documento.carpeta.nombre}
                </div>
              ` : ''}
            </div>

            <p style="font-size: 14px; color: #666;">
              Por favor, tome las acciones necesarias para renovar o actualizar este documento a la brevedad posible.
            </p>

            <div class="footer">
              <p>
                Este es un mensaje automático del Sistema de Gestión de Calidad - Clínica Mía.<br>
                No responda a este correo.
              </p>
              <p style="margin-top: 10px;">
                <strong>Infraestructura - PGIRASA</strong><br>
                Sistema de Alertas de Documentos Legales
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Enviar email usando el servicio de email (Resend)
      await emailService.sendEmail({
        to: emailsUnicos,
        subject,
        html: htmlContent,
      });

      // Marcar como enviado
      const alertaActualizada = await prisma.alertaDocumentoLegal.update({
        where: { id: alertaId },
        data: {
          emailEnviado: true,
          fechaNotificacion: new Date(),
          estado: 'NOTIFICADO',
        },
      });

      console.log(`[ALERTAS] Email enviado exitosamente para alerta ${alertaId}`);

      return alertaActualizada;
    } catch (error) {
      console.error(`[ALERTAS] Error al enviar email para alerta ${alertaId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener dashboard de alertas
   */
  async getDashboard() {
    const [
      pendientes,
      notificadas,
      resueltas,
      porVencer7,
      porVencer15,
      porVencer30,
      vencidos,
    ] = await Promise.all([
      prisma.alertaDocumentoLegal.count({ where: { estado: 'PENDIENTE' } }),
      prisma.alertaDocumentoLegal.count({ where: { estado: 'NOTIFICADO' } }),
      prisma.alertaDocumentoLegal.count({ where: { estado: 'RESUELTO' } }),
      prisma.alertaDocumentoLegal.count({
        where: { tipo: 'POR_VENCER_7', estado: { not: 'RESUELTO' } },
      }),
      prisma.alertaDocumentoLegal.count({
        where: { tipo: 'POR_VENCER_15', estado: { not: 'RESUELTO' } },
      }),
      prisma.alertaDocumentoLegal.count({
        where: { tipo: 'POR_VENCER_30', estado: { not: 'RESUELTO' } },
      }),
      prisma.alertaDocumentoLegal.count({
        where: { tipo: 'VENCIDO', estado: { not: 'RESUELTO' } },
      }),
    ]);

    // Obtener alertas recientes (no resueltas)
    const alertasRecientes = await prisma.alertaDocumentoLegal.findMany({
      where: { estado: { not: 'RESUELTO' } },
      include: {
        documento: {
          select: {
            id: true,
            nombre: true,
            tipoDocumento: true,
            fechaVencimiento: true,
            numeroDocumento: true,
          },
        },
      },
      orderBy: [
        { tipo: 'asc' }, // VENCIDO primero
        { diasRestantes: 'asc' },
      ],
      take: 10,
    });

    return {
      contadores: {
        total: pendientes + notificadas,
        pendientes,
        notificadas,
        resueltas,
        porVencer7,
        porVencer15,
        porVencer30,
        vencidos,
      },
      alertasRecientes,
    };
  }

  /**
   * Obtener alertas por documento
   */
  async getAlertasPorDocumento(documentoId) {
    const alertas = await prisma.alertaDocumentoLegal.findMany({
      where: { documentoId },
      orderBy: {
        fechaAlerta: 'desc',
      },
    });

    return alertas;
  }

  /**
   * Marcar alerta como resuelta
   */
  async marcarComoResuelto(alertaId, observaciones = null) {
    const alerta = await prisma.alertaDocumentoLegal.findUnique({
      where: { id: alertaId },
    });

    if (!alerta) {
      throw new NotFoundError('Alerta no encontrada');
    }

    const alertaActualizada = await prisma.alertaDocumentoLegal.update({
      where: { id: alertaId },
      data: {
        estado: 'RESUELTO',
      },
    });

    return alertaActualizada;
  }

  /**
   * Reenviar email de alerta
   */
  async reenviarEmail(alertaId) {
    // Resetear estado de email enviado
    await prisma.alertaDocumentoLegal.update({
      where: { id: alertaId },
      data: {
        emailEnviado: false,
        estado: 'PENDIENTE',
      },
    });

    // Enviar email nuevamente
    return this.enviarEmailAlerta(alertaId);
  }

  /**
   * Obtener todas las alertas con filtros
   */
  async findAll(filters = {}) {
    const {
      estado,
      tipo,
      documentoId,
      page = 1,
      limit = 50,
    } = filters;

    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (documentoId) {
      where.documentoId = documentoId;
    }

    const skip = (page - 1) * limit;

    const [alertas, total] = await Promise.all([
      prisma.alertaDocumentoLegal.findMany({
        where,
        include: {
          documento: {
            select: {
              id: true,
              nombre: true,
              tipoDocumento: true,
              fechaVencimiento: true,
              numeroDocumento: true,
            },
          },
        },
        orderBy: [
          { estado: 'asc' },
          { diasRestantes: 'asc' },
        ],
        skip,
        take: parseInt(limit),
      }),
      prisma.alertaDocumentoLegal.count({ where }),
    ]);

    return {
      alertas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new AlertaDocumentoLegalService();
