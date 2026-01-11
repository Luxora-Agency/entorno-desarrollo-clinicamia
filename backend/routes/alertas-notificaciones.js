/**
 * Rutas de Configuración de Alertas y Notificaciones por Email
 * Sistema de alertas con Resend para SST, RRHH, etc.
 */

const { Hono } = require('hono');
const { authMiddleware, requirePermission } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const alertaService = require('../services/alerta.service');

const router = new Hono();

// Middleware de autenticación
router.use('*', authMiddleware);

// ============ ESTADO DEL SERVICIO ============

/**
 * GET /alertas-notificaciones/estado
 * Obtener estado del servicio de email
 */
router.get('/estado', async (c) => {
  try {
    const estado = alertaService.getEstadoServicio();
    return c.json(success(estado, 'Estado del servicio'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /alertas-notificaciones/test
 * Enviar email de prueba
 */
router.post('/test', requirePermission('sst.admin'), async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json(error('Email requerido'), 400);
    }
    const result = await alertaService.enviarPrueba(email);
    return c.json(success(result, 'Email de prueba enviado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ============ CONFIGURACIONES ============

/**
 * GET /alertas-notificaciones/configuraciones
 * Listar configuraciones de alertas
 */
router.get('/configuraciones', async (c) => {
  try {
    const { modulo, activo } = c.req.query();
    const configs = await alertaService.getConfiguraciones({
      modulo,
      activo: activo === 'true' ? true : activo === 'false' ? false : undefined
    });
    return c.json(success(configs, 'Configuraciones de alertas'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * GET /alertas-notificaciones/configuraciones/:id
 * Obtener configuración específica
 */
router.get('/configuraciones/:id', async (c) => {
  try {
    const config = await alertaService.getConfiguracion(c.req.param('id'));
    return c.json(success(config, 'Configuración de alerta'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /alertas-notificaciones/configuraciones
 * Crear o actualizar configuración de alerta
 */
router.post('/configuraciones', requirePermission('sst.admin'), async (c) => {
  try {
    const data = await c.req.json();
    const config = await alertaService.upsertConfiguracion(data);
    return c.json(success(config, 'Configuración guardada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * PATCH /alertas-notificaciones/configuraciones/:id/toggle
 * Activar/desactivar configuración
 */
router.patch('/configuraciones/:id/toggle', requirePermission('sst.admin'), async (c) => {
  try {
    const config = await alertaService.toggleActivo(c.req.param('id'));
    return c.json(success(config, `Alerta ${config.activo ? 'activada' : 'desactivada'}`));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ============ DESTINATARIOS ============

/**
 * POST /alertas-notificaciones/configuraciones/:id/destinatarios
 * Agregar destinatario a configuración
 */
router.post('/configuraciones/:id/destinatarios', requirePermission('sst.admin'), async (c) => {
  try {
    const data = await c.req.json();
    const destinatario = await alertaService.agregarDestinatario(c.req.param('id'), data);
    return c.json(success(destinatario, 'Destinatario agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * DELETE /alertas-notificaciones/destinatarios/:id
 * Eliminar destinatario
 */
router.delete('/destinatarios/:id', requirePermission('sst.admin'), async (c) => {
  try {
    await alertaService.eliminarDestinatario(c.req.param('id'));
    return c.json(success(null, 'Destinatario eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ============ HISTORIAL ============

/**
 * GET /alertas-notificaciones/historial
 * Obtener historial de alertas enviadas
 */
router.get('/historial', async (c) => {
  try {
    const query = c.req.query();
    const result = await alertaService.getHistorial({
      tipoAlerta: query.tipoAlerta,
      estado: query.estado,
      desde: query.desde,
      hasta: query.hasta,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /alertas-notificaciones/historial/:id/reintentar
 * Reintentar envío de alerta fallida
 */
router.post('/historial/:id/reintentar', requirePermission('sst.admin'), async (c) => {
  try {
    const result = await alertaService.reintentarAlerta(c.req.param('id'));
    return c.json(success(result, 'Alerta reenviada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ============ ENVÍO MANUAL ============

/**
 * POST /alertas-notificaciones/enviar
 * Enviar alerta manualmente
 */
router.post('/enviar', requirePermission('sst.admin'), async (c) => {
  try {
    const data = await c.req.json();
    const result = await alertaService.enviarAlerta(data);
    return c.json(success(result, 'Alerta enviada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /alertas-notificaciones/procesar-pendientes
 * Procesar alertas programadas pendientes (para cron)
 */
router.post('/procesar-pendientes', requirePermission('sst.admin'), async (c) => {
  try {
    const result = await alertaService.procesarAlertasPendientes();
    return c.json(success(result, 'Alertas procesadas'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ============ TIPOS DE ALERTA ============

/**
 * GET /alertas-notificaciones/tipos
 * Obtener tipos de alerta disponibles
 */
router.get('/tipos', async (c) => {
  const tipos = [
    { value: 'DOCUMENTO_VENCIMIENTO', label: 'Vencimiento de Documentos SST', modulo: 'SST' },
    { value: 'EXAMEN_MEDICO_VENCIMIENTO', label: 'Vencimiento de Exámenes Médicos', modulo: 'SST' },
    { value: 'EXAMEN_MEDICO_PENDIENTE', label: 'Exámenes Médicos Pendientes', modulo: 'SST' },
    { value: 'CAPACITACION_PROGRAMADA', label: 'Capacitaciones Programadas', modulo: 'SST' },
    { value: 'EPP_VENCIMIENTO', label: 'Vencimiento de EPP', modulo: 'SST' },
    { value: 'LICENCIA_PROVEEDOR_VENCIMIENTO', label: 'Vencimiento de Licencias', modulo: 'SST' },
    { value: 'EVALUACION_ESTANDARES_PENDIENTE', label: 'Evaluación Estándares Pendiente', modulo: 'SST' },
    { value: 'PLAN_ANUAL_ACTIVIDAD', label: 'Actividades del Plan Anual', modulo: 'SST' },
    { value: 'ACCIDENTE_REPORTADO', label: 'Accidente Reportado', modulo: 'SST' },
    { value: 'INCIDENTE_REPORTADO', label: 'Incidente Reportado', modulo: 'SST' },
    { value: 'CONTRATO_VENCIMIENTO', label: 'Vencimiento de Contratos', modulo: 'RRHH' },
    { value: 'EVALUACION_PENDIENTE', label: 'Evaluaciones Pendientes', modulo: 'RRHH' },
    { value: 'VACACIONES_PENDIENTES', label: 'Vacaciones Pendientes', modulo: 'RRHH' },
    { value: 'CUMPLEANOS_EMPLEADO', label: 'Cumpleaños de Empleados', modulo: 'RRHH' }
  ];
  return c.json(success(tipos, 'Tipos de alerta'));
});

/**
 * GET /alertas-notificaciones/frecuencias
 * Obtener frecuencias disponibles
 */
router.get('/frecuencias', async (c) => {
  const frecuencias = [
    { value: 'UNICA', label: 'Única (una vez por cada día de anticipación)' },
    { value: 'DIARIA', label: 'Diaria (todos los días hasta la fecha)' },
    { value: 'SEMANAL', label: 'Semanal (una vez por semana)' }
  ];
  return c.json(success(frecuencias, 'Frecuencias'));
});

/**
 * GET /alertas-notificaciones/prioridades
 * Obtener prioridades disponibles
 */
router.get('/prioridades', async (c) => {
  const prioridades = [
    { value: 'BAJA', label: 'Baja', color: '#3B82F6' },
    { value: 'MEDIA', label: 'Media', color: '#F59E0B' },
    { value: 'ALTA', label: 'Alta', color: '#EF4444' },
    { value: 'URGENTE', label: 'Urgente', color: '#DC2626' }
  ];
  return c.json(success(prioridades, 'Prioridades'));
});

/**
 * GET /alertas-notificaciones/tipos-destinatario
 * Obtener tipos de destinatario
 */
router.get('/tipos-destinatario', async (c) => {
  const tipos = [
    { value: 'EMAIL_FIJO', label: 'Email Fijo' },
    { value: 'ROL', label: 'Por Rol' },
    { value: 'CARGO', label: 'Por Cargo' },
    { value: 'EMPLEADO_ESPECIFICO', label: 'Empleado Específico' },
    { value: 'RESPONSABLE_SST', label: 'Responsable SST' },
    { value: 'RESPONSABLE_RRHH', label: 'Responsable RRHH' },
    { value: 'JEFE_DIRECTO', label: 'Jefe Directo del Afectado' }
  ];
  return c.json(success(tipos, 'Tipos de destinatario'));
});

module.exports = router;
