/**
 * Servicio de Alertas
 * Gestiona la configuración, programación y envío de alertas
 */

const prisma = require('../db/prisma');
const emailService = require('./email.service');
const { ValidationError, NotFoundError } = require('../utils/errors');

// Templates por defecto para cada tipo de alerta
const TEMPLATES_DEFAULT = {
  DOCUMENTO_VENCIMIENTO: {
    asunto: 'Documento {{nombre}} próximo a vencer',
    cuerpo: '<p>El documento <strong>{{nombre}}</strong> (código: {{codigo}}) vencerá en <strong>{{diasRestantes}} días</strong>.</p><p>Por favor, gestione la renovación o actualización del documento.</p>'
  },
  EXAMEN_MEDICO_VENCIMIENTO: {
    asunto: 'Examen médico de {{empleado}} próximo a vencer',
    cuerpo: '<p>El examen <strong>{{nombreExamen}}</strong> del empleado <strong>{{empleado}}</strong> vencerá en <strong>{{diasRestantes}} días</strong>.</p><p>Por favor, programe la renovación del examen.</p>'
  },
  EXAMEN_MEDICO_PENDIENTE: {
    asunto: 'Examen médico pendiente para {{empleado}}',
    cuerpo: '<p>El empleado <strong>{{empleado}}</strong> tiene un examen <strong>{{nombreExamen}}</strong> pendiente de realizar.</p><p>Fecha programada: {{fechaProgramada}}</p>'
  },
  CAPACITACION_PROGRAMADA: {
    asunto: 'Recordatorio: Capacitación {{nombre}}',
    cuerpo: '<p>Recordatorio de la capacitación <strong>{{nombre}}</strong> programada para el <strong>{{fechaProgramada}}</strong>.</p><p>Lugar: {{lugar}}</p><p>Duración: {{duracion}} horas</p>'
  },
  EPP_VENCIMIENTO: {
    asunto: 'EPP de {{empleado}} próximo a vencer',
    cuerpo: '<p>El EPP <strong>{{nombreEPP}}</strong> entregado a <strong>{{empleado}}</strong> alcanzará su vida útil en <strong>{{diasRestantes}} días</strong>.</p><p>Por favor, gestione la renovación.</p>'
  },
  ACCIDENTE_REPORTADO: {
    asunto: 'Nuevo accidente de trabajo reportado',
    cuerpo: '<p>Se ha reportado un nuevo accidente de trabajo:</p><ul><li>Empleado: <strong>{{empleado}}</strong></li><li>Fecha: {{fecha}}</li><li>Lugar: {{lugar}}</li><li>Tipo: {{tipo}}</li></ul><p>Por favor, inicie el proceso de investigación.</p>'
  },
  INCIDENTE_REPORTADO: {
    asunto: 'Nuevo incidente reportado',
    cuerpo: '<p>Se ha reportado un nuevo incidente:</p><ul><li>Reportado por: <strong>{{empleado}}</strong></li><li>Fecha: {{fecha}}</li><li>Tipo: {{tipo}}</li></ul><p>Por favor, revise y tome las acciones necesarias.</p>'
  },
  CONTRATO_VENCIMIENTO: {
    asunto: 'Contrato de {{empleado}} próximo a vencer',
    cuerpo: '<p>El contrato del empleado <strong>{{empleado}}</strong> vencerá en <strong>{{diasRestantes}} días</strong>.</p><p>Fecha de vencimiento: {{fechaFin}}</p><p>Por favor, gestione la renovación o finalización.</p>'
  }
};

class AlertaService {

  // ============ CONFIGURACIÓN ============

  /**
   * Listar todas las configuraciones de alertas
   */
  async getConfiguraciones({ modulo, activo } = {}) {
    const where = {};
    if (modulo) where.modulo = modulo;
    if (activo !== undefined) where.activo = activo;

    return prisma.alertaConfiguracion.findMany({
      where,
      include: {
        destinatarios: {
          include: {
            empleado: { select: { id: true, nombre: true, apellido: true, email: true } },
            cargo: { select: { id: true, nombre: true } }
          }
        },
        _count: { select: { historial: true } }
      },
      orderBy: [{ modulo: 'asc' }, { nombre: 'asc' }]
    });
  }

  /**
   * Obtener configuración por ID
   */
  async getConfiguracion(id) {
    const config = await prisma.alertaConfiguracion.findUnique({
      where: { id },
      include: {
        destinatarios: {
          include: {
            empleado: { select: { id: true, nombre: true, apellido: true, email: true } },
            cargo: { select: { id: true, nombre: true } }
          }
        },
        historial: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!config) throw new NotFoundError('Configuración de alerta no encontrada');
    return config;
  }

  /**
   * Crear o actualizar configuración de alerta
   */
  async upsertConfiguracion(data) {
    const { modulo, tipoAlerta, nombre, descripcion, activo, diasAnticipacion, horaEnvio,
            frecuenciaRecordatorio, prioridad, asuntoTemplate, cuerpoTemplate, destinatarios } = data;

    // Usar templates por defecto si no se proporcionan
    const template = TEMPLATES_DEFAULT[tipoAlerta] || {};
    const asunto = asuntoTemplate || template.asunto || 'Alerta: {{tipoAlerta}}';
    const cuerpo = cuerpoTemplate || template.cuerpo || '<p>Tiene una nueva alerta pendiente.</p>';

    // Buscar si ya existe
    const existing = await prisma.alertaConfiguracion.findUnique({
      where: { modulo_tipoAlerta: { modulo, tipoAlerta } }
    });

    let config;
    if (existing) {
      // Actualizar
      config = await prisma.alertaConfiguracion.update({
        where: { id: existing.id },
        data: {
          nombre,
          descripcion,
          activo,
          diasAnticipacion: diasAnticipacion || [30, 15, 7, 1],
          horaEnvio: horaEnvio || '08:00',
          frecuenciaRecordatorio,
          prioridad,
          asuntoTemplate: asunto,
          cuerpoTemplate: cuerpo
        }
      });

      // Actualizar destinatarios
      if (destinatarios) {
        await prisma.alertaDestinatario.deleteMany({ where: { configuracionId: config.id } });
        await this._crearDestinatarios(config.id, destinatarios);
      }
    } else {
      // Crear
      config = await prisma.alertaConfiguracion.create({
        data: {
          modulo,
          tipoAlerta,
          nombre,
          descripcion,
          activo: activo !== false,
          diasAnticipacion: diasAnticipacion || [30, 15, 7, 1],
          horaEnvio: horaEnvio || '08:00',
          frecuenciaRecordatorio: frecuenciaRecordatorio || 'UNICA',
          prioridad: prioridad || 'MEDIA',
          asuntoTemplate: asunto,
          cuerpoTemplate: cuerpo
        }
      });

      if (destinatarios && destinatarios.length > 0) {
        await this._crearDestinatarios(config.id, destinatarios);
      }
    }

    return this.getConfiguracion(config.id);
  }

  /**
   * Agregar destinatario a configuración
   */
  async agregarDestinatario(configuracionId, data) {
    const config = await prisma.alertaConfiguracion.findUnique({ where: { id: configuracionId } });
    if (!config) throw new NotFoundError('Configuración no encontrada');

    return prisma.alertaDestinatario.create({
      data: {
        configuracionId,
        tipoDestinatario: data.tipoDestinatario,
        email: data.email,
        rolId: data.rolId,
        cargoId: data.cargoId,
        empleadoId: data.empleadoId,
        departamentoId: data.departamentoId,
        activo: data.activo !== false
      },
      include: {
        empleado: { select: { id: true, nombre: true, apellido: true, email: true } },
        cargo: { select: { id: true, nombre: true } }
      }
    });
  }

  /**
   * Eliminar destinatario
   */
  async eliminarDestinatario(id) {
    await prisma.alertaDestinatario.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Activar/desactivar configuración
   */
  async toggleActivo(id) {
    const config = await prisma.alertaConfiguracion.findUnique({ where: { id } });
    if (!config) throw new NotFoundError('Configuración no encontrada');

    return prisma.alertaConfiguracion.update({
      where: { id },
      data: { activo: !config.activo }
    });
  }

  // ============ ENVÍO DE ALERTAS ============

  /**
   * Enviar alerta inmediata
   */
  async enviarAlerta({ tipoAlerta, referenciaId, referenciaTipo, datos = {} }) {
    // Buscar configuración
    const config = await prisma.alertaConfiguracion.findFirst({
      where: { tipoAlerta, activo: true },
      include: {
        destinatarios: {
          where: { activo: true },
          include: {
            empleado: { select: { email: true } },
            cargo: {
              include: {
                empleados: {
                  where: { estado: 'ACTIVO' },
                  select: { email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!config) {
      console.log(`[Alerta] No hay configuración activa para ${tipoAlerta}`);
      return { success: false, error: 'Sin configuración activa' };
    }

    // Resolver emails de destinatarios
    const emails = await this._resolverEmails(config.destinatarios, datos);
    if (emails.length === 0) {
      console.log(`[Alerta] No hay destinatarios para ${tipoAlerta}`);
      return { success: false, error: 'Sin destinatarios' };
    }

    // Procesar templates
    const asunto = this._procesarTemplate(config.asuntoTemplate, datos);
    const cuerpo = this._procesarTemplate(config.cuerpoTemplate, datos);

    // Registrar en historial
    const historial = await prisma.alertaHistorial.create({
      data: {
        configuracionId: config.id,
        tipoAlerta,
        referenciaId,
        referenciaTipo,
        asunto,
        cuerpo,
        destinatariosEmail: emails,
        estado: 'PENDIENTE'
      }
    });

    // Enviar email
    const result = await emailService.sendAlert({
      to: emails,
      tipoAlerta,
      prioridad: config.prioridad,
      asunto,
      cuerpo,
      datos
    });

    // Actualizar historial
    await prisma.alertaHistorial.update({
      where: { id: historial.id },
      data: {
        estado: result.success ? 'ENVIADO' : 'FALLIDO',
        fechaEnvio: result.success ? new Date() : null,
        resendId: result.id,
        errorMensaje: result.error,
        intentos: 1,
        ultimoIntento: new Date()
      }
    });

    return { success: result.success, historialId: historial.id, emails };
  }

  /**
   * Programar alertas basadas en fechas de vencimiento
   */
  async programarAlertas({ tipoAlerta, referenciaTipo, items }) {
    const config = await prisma.alertaConfiguracion.findFirst({
      where: { tipoAlerta, activo: true }
    });

    if (!config) return { programadas: 0 };

    let programadas = 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (const item of items) {
      if (!item.fechaVencimiento) continue;

      const fechaVencimiento = new Date(item.fechaVencimiento);
      fechaVencimiento.setHours(0, 0, 0, 0);

      for (const dias of config.diasAnticipacion) {
        const fechaAlerta = new Date(fechaVencimiento);
        fechaAlerta.setDate(fechaAlerta.getDate() - dias);

        // Solo programar si la fecha es futura
        if (fechaAlerta <= hoy) continue;

        // Verificar si ya existe
        const existe = await prisma.alertaProgramada.findFirst({
          where: {
            tipoAlerta,
            referenciaId: item.id,
            diasRestantes: dias,
            procesada: false
          }
        });

        if (!existe) {
          await prisma.alertaProgramada.create({
            data: {
              tipoAlerta,
              referenciaId: item.id,
              referenciaTipo,
              fechaProgramada: fechaAlerta,
              diasRestantes: dias
            }
          });
          programadas++;
        }
      }
    }

    return { programadas };
  }

  /**
   * Procesar alertas programadas pendientes
   * Ejecutar como tarea programada (cron)
   */
  async procesarAlertasPendientes() {
    const ahora = new Date();

    // Obtener alertas que deben procesarse
    const alertas = await prisma.alertaProgramada.findMany({
      where: {
        procesada: false,
        fechaProgramada: { lte: ahora }
      },
      take: 100,
      orderBy: { fechaProgramada: 'asc' }
    });

    const resultados = { procesadas: 0, exitosas: 0, fallidas: 0 };

    for (const alerta of alertas) {
      try {
        // Obtener datos del item referenciado
        const datos = await this._obtenerDatosReferencia(alerta.referenciaTipo, alerta.referenciaId);

        if (datos) {
          datos.diasRestantes = alerta.diasRestantes;

          const result = await this.enviarAlerta({
            tipoAlerta: alerta.tipoAlerta,
            referenciaId: alerta.referenciaId,
            referenciaTipo: alerta.referenciaTipo,
            datos
          });

          if (result.success) resultados.exitosas++;
          else resultados.fallidas++;
        }

        // Marcar como procesada
        await prisma.alertaProgramada.update({
          where: { id: alerta.id },
          data: { procesada: true, fechaProcesada: new Date() }
        });

        resultados.procesadas++;
      } catch (error) {
        console.error(`[Alerta] Error procesando alerta ${alerta.id}:`, error.message);
        resultados.fallidas++;
      }
    }

    return resultados;
  }

  // ============ HISTORIAL ============

  /**
   * Obtener historial de alertas enviadas
   */
  async getHistorial({ tipoAlerta, estado, desde, hasta, page = 1, limit = 20 }) {
    const where = {};
    if (tipoAlerta) where.tipoAlerta = tipoAlerta;
    if (estado) where.estado = estado;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    const [data, total] = await Promise.all([
      prisma.alertaHistorial.findMany({
        where,
        include: {
          configuracion: { select: { nombre: true, modulo: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.alertaHistorial.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Reintentar envío de alerta fallida
   */
  async reintentarAlerta(historialId) {
    const historial = await prisma.alertaHistorial.findUnique({
      where: { id: historialId },
      include: { configuracion: true }
    });

    if (!historial) throw new NotFoundError('Registro de alerta no encontrado');
    if (historial.estado === 'ENVIADO') throw new ValidationError('La alerta ya fue enviada');

    const result = await emailService.sendAlert({
      to: historial.destinatariosEmail,
      tipoAlerta: historial.tipoAlerta,
      prioridad: historial.configuracion?.prioridad || 'MEDIA',
      asunto: historial.asunto,
      cuerpo: historial.cuerpo
    });

    await prisma.alertaHistorial.update({
      where: { id: historialId },
      data: {
        estado: result.success ? 'ENVIADO' : 'FALLIDO',
        fechaEnvio: result.success ? new Date() : null,
        resendId: result.id,
        errorMensaje: result.error,
        intentos: historial.intentos + 1,
        ultimoIntento: new Date()
      }
    });

    return { success: result.success };
  }

  // ============ PRUEBAS ============

  /**
   * Enviar email de prueba
   */
  async enviarPrueba(email) {
    return emailService.sendTest(email);
  }

  /**
   * Verificar estado del servicio de email
   */
  getEstadoServicio() {
    return {
      habilitado: emailService.isEnabled(),
      fromEmail: process.env.RESEND_FROM_EMAIL || 'No configurado',
      fromName: process.env.RESEND_FROM_NAME || 'No configurado'
    };
  }

  // ============ HELPERS PRIVADOS ============

  async _crearDestinatarios(configuracionId, destinatarios) {
    for (const dest of destinatarios) {
      await prisma.alertaDestinatario.create({
        data: {
          configuracionId,
          tipoDestinatario: dest.tipoDestinatario,
          email: dest.email,
          rolId: dest.rolId,
          cargoId: dest.cargoId,
          empleadoId: dest.empleadoId,
          departamentoId: dest.departamentoId,
          activo: true
        }
      });
    }
  }

  async _resolverEmails(destinatarios, datos = {}) {
    const emails = new Set();

    for (const dest of destinatarios) {
      switch (dest.tipoDestinatario) {
        case 'EMAIL_FIJO':
          if (dest.email) emails.add(dest.email);
          break;

        case 'EMPLEADO_ESPECIFICO':
          if (dest.empleado?.email) emails.add(dest.empleado.email);
          break;

        case 'CARGO':
          if (dest.cargo?.empleados) {
            dest.cargo.empleados.forEach(emp => {
              if (emp.email) emails.add(emp.email);
            });
          }
          break;

        case 'RESPONSABLE_SST':
          // Buscar responsable SST (cargo con código RESP_SST o similar)
          const respSST = await prisma.tHEmpleado.findFirst({
            where: {
              estado: 'ACTIVO',
              cargo: { codigo: { contains: 'SST', mode: 'insensitive' } }
            },
            select: { email: true }
          });
          if (respSST?.email) emails.add(respSST.email);
          break;

        case 'RESPONSABLE_RRHH':
          const respRRHH = await prisma.tHEmpleado.findFirst({
            where: {
              estado: 'ACTIVO',
              cargo: { codigo: { contains: 'RRHH', mode: 'insensitive' } }
            },
            select: { email: true }
          });
          if (respRRHH?.email) emails.add(respRRHH.email);
          break;

        case 'JEFE_DIRECTO':
          if (datos.empleadoId) {
            const empleado = await prisma.tHEmpleado.findUnique({
              where: { id: datos.empleadoId },
              include: { jefeDirecto: { select: { email: true } } }
            });
            if (empleado?.jefeDirecto?.email) emails.add(empleado.jefeDirecto.email);
          }
          break;
      }
    }

    return Array.from(emails).filter(e => e && e.includes('@'));
  }

  _procesarTemplate(template, datos) {
    let result = template;
    for (const [key, value] of Object.entries(datos)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }

  async _obtenerDatosReferencia(referenciaTipo, referenciaId) {
    switch (referenciaTipo) {
      case 'DOCUMENTO_SST':
        const doc = await prisma.sSTDocumentoSST.findUnique({
          where: { id: referenciaId },
          select: { id: true, nombre: true, codigo: true, fechaVencimiento: true }
        });
        return doc ? { ...doc, fechaVencimiento: doc.fechaVencimiento } : null;

      case 'EXAMEN_MEDICO':
        const examen = await prisma.sSTExamenMedico.findUnique({
          where: { id: referenciaId },
          include: {
            empleado: { select: { id: true, nombre: true, apellido: true } }
          }
        });
        return examen ? {
          nombreExamen: examen.nombreExamen,
          empleado: `${examen.empleado.nombre} ${examen.empleado.apellido}`,
          empleadoId: examen.empleadoId,
          fechaVencimiento: examen.fechaVencimiento,
          fechaProgramada: examen.fechaProgramada?.toLocaleDateString('es-CO')
        } : null;

      case 'CONTRATO':
        const contrato = await prisma.tHContrato.findUnique({
          where: { id: referenciaId },
          include: {
            empleado: { select: { id: true, nombre: true, apellido: true } }
          }
        });
        return contrato ? {
          empleado: `${contrato.empleado.nombre} ${contrato.empleado.apellido}`,
          empleadoId: contrato.empleadoId,
          fechaFin: contrato.fechaFin?.toLocaleDateString('es-CO'),
          fechaVencimiento: contrato.fechaFin
        } : null;

      default:
        return null;
    }
  }
}

module.exports = new AlertaService();
