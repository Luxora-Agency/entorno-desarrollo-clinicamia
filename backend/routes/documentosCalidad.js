/**
 * Rutas de Gestión Documental de Calidad
 */
const { Hono } = require('hono');
const documentoCalidadService = require('../services/documentoCalidad.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const documentosCalidad = new Hono();

// Todas las rutas requieren autenticación
documentosCalidad.use('*', authMiddleware);

// ==========================================
// DOCUMENTOS
// ==========================================

/**
 * GET /documentos-calidad - Obtener documentos de calidad
 */
documentosCalidad.get('/', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const query = c.req.query();
    const result = await documentoCalidadService.getDocumentos(query);
    return c.json(paginated(result.documentos, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-calidad/:id - Obtener documento por ID
 */
documentosCalidad.get('/:id', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    const documento = await documentoCalidadService.getDocumentoById(id);
    return c.json(success({ documento }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /documentos-calidad - Crear documento
 */
documentosCalidad.post('/', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');
    const documento = await documentoCalidadService.createDocumento({
      elaboradoPor: user.id,
      ...data,
    });
    return c.json(success({ documento }, 'Documento creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /documentos-calidad/:id - Actualizar documento
 */
documentosCalidad.put('/:id', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const documento = await documentoCalidadService.updateDocumento(id, data, user.id);
    return c.json(success({ documento }, 'Documento actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /documentos-calidad/:id - Obsoletizar documento
 */
documentosCalidad.delete('/:id', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    await documentoCalidadService.obsoletizarDocumento(id);
    return c.json(success(null, 'Documento marcado como obsoleto'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// FLUJO DE APROBACIÓN
// ==========================================

/**
 * POST /documentos-calidad/:id/enviar-revision - Enviar a revisión
 */
documentosCalidad.post('/:id/enviar-revision', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    const { revisadoPor } = await c.req.json();
    const documento = await documentoCalidadService.enviarARevision(id, revisadoPor);
    return c.json(success({ documento }, 'Documento enviado a revisión'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /documentos-calidad/:id/revisar - Marcar como revisado
 */
documentosCalidad.post('/:id/revisar', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    const { observaciones, aprobado } = await c.req.json();
    const user = c.get('user');
    const documento = await documentoCalidadService.revisarDocumento(id, user.id, observaciones, aprobado);
    return c.json(success({ documento }, 'Documento revisado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /documentos-calidad/:id/aprobar - Aprobar documento
 */
documentosCalidad.post('/:id/aprobar', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const documento = await documentoCalidadService.aprobarDocumento(id, user.id);
    return c.json(success({ documento }, 'Documento aprobado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /documentos-calidad/:id/activar - Poner en vigencia
 */
documentosCalidad.post('/:id/activar', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    const { fechaProximaRevision } = await c.req.json();
    const documento = await documentoCalidadService.activarDocumento(id, fechaProximaRevision);
    return c.json(success({ documento }, 'Documento puesto en vigencia'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// VERSIONAMIENTO
// ==========================================

/**
 * GET /documentos-calidad/:id/versiones - Obtener historial de versiones
 */
documentosCalidad.get('/:id/versiones', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    const versiones = await documentoCalidadService.getHistorialVersiones(id);
    return c.json(success({ versiones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /documentos-calidad/:id/nueva-version - Crear nueva versión
 */
documentosCalidad.post('/:id/nueva-version', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const documento = await documentoCalidadService.crearNuevaVersion(id, data, user.id);
    return c.json(success({ documento }, 'Nueva versión creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// SOCIALIZACIÓN
// ==========================================

/**
 * GET /documentos-calidad/:id/socializaciones - Obtener socializaciones
 */
documentosCalidad.get('/:id/socializaciones', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    const socializaciones = await documentoCalidadService.getSocializaciones(id);
    return c.json(success({ socializaciones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /documentos-calidad/:id/socializaciones - Registrar socialización
 */
documentosCalidad.post('/:id/socializaciones', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const socializacion = await documentoCalidadService.registrarSocializacion({
      documentoId: id,
      realizadoPor: user.id,
      ...data,
    });
    return c.json(success({ socializacion }, 'Socialización registrada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// BÚSQUEDA Y FILTROS
// ==========================================

/**
 * GET /documentos-calidad/buscar - Buscar documentos
 */
documentosCalidad.get('/buscar/avanzado', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const query = c.req.query();
    const documentos = await documentoCalidadService.buscarDocumentos(query);
    return c.json(success({ documentos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-calidad/por-tipo/:tipo - Obtener documentos por tipo
 */
documentosCalidad.get('/por-tipo/:tipo', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { tipo } = c.req.param();
    const documentos = await documentoCalidadService.getDocumentosPorTipo(tipo);
    return c.json(success({ documentos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-calidad/por-proceso/:proceso - Obtener documentos por proceso
 */
documentosCalidad.get('/por-proceso/:proceso', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { proceso } = c.req.param();
    const documentos = await documentoCalidadService.getDocumentosPorProceso(proceso);
    return c.json(success({ documentos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ALERTAS Y VENCIMIENTOS
// ==========================================

/**
 * GET /documentos-calidad/alertas/proximos-vencer - Documentos próximos a vencer
 */
documentosCalidad.get('/alertas/proximos-vencer', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const { dias = 30 } = c.req.query();
    const documentos = await documentoCalidadService.getDocumentosProximosVencer(parseInt(dias));
    return c.json(success({ documentos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-calidad/alertas/pendientes-revision - Documentos pendientes de revisión
 */
documentosCalidad.get('/alertas/pendientes-revision', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const documentos = await documentoCalidadService.getDocumentosPendientesRevision();
    return c.json(success({ documentos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-calidad/alertas/pendientes-aprobacion - Documentos pendientes de aprobación
 */
documentosCalidad.get('/alertas/pendientes-aprobacion', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const documentos = await documentoCalidadService.getDocumentosPendientesAprobacion();
    return c.json(success({ documentos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// LISTA MAESTRA Y REPORTES
// ==========================================

/**
 * GET /documentos-calidad/lista-maestra - Generar lista maestra de documentos
 */
documentosCalidad.get('/lista-maestra/vigentes', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const listaMaestra = await documentoCalidadService.getListaMaestra();
    return c.json(success({ listaMaestra }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-calidad/dashboard - Dashboard de documentos
 */
documentosCalidad.get('/dashboard/resumen', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const dashboard = await documentoCalidadService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-calidad/estadisticas - Estadísticas de documentos
 */
documentosCalidad.get('/estadisticas/general', permissionMiddleware('calidad_documentos'), async (c) => {
  try {
    const estadisticas = await documentoCalidadService.getEstadisticas();
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = documentosCalidad;
