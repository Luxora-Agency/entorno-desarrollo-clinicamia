/**
 * Rutas de Vigilancia en Salud Pública
 * SIVIGILA, Farmacovigilancia, Tecnovigilancia
 */
const { Hono } = require('hono');
const vigilanciaSaludService = require('../services/vigilanciaSalud.service');
const { exportadorSIVIGILA, exportadorINVIMA } = require('../services/exportadores');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const vigilanciaSalud = new Hono();

// Todas las rutas requieren autenticación
vigilanciaSalud.use('*', authMiddleware);

// ==========================================
// SIVIGILA - NOTIFICACIONES
// ==========================================

/**
 * GET /vigilancia-salud/sivigila - Obtener notificaciones SIVIGILA
 */
vigilanciaSalud.get('/sivigila', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const query = c.req.query();
    const result = await vigilanciaSaludService.getNotificacionesSIVIGILA(query);
    return c.json(paginated(result.notificaciones, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/sivigila/:id - Obtener notificación por ID
 */
vigilanciaSalud.get('/sivigila/:id', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const notificacion = await vigilanciaSaludService.getNotificacionById(id);
    return c.json(success({ notificacion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /vigilancia-salud/sivigila - Crear notificación SIVIGILA
 */
vigilanciaSalud.post('/sivigila', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');
    const notificacion = await vigilanciaSaludService.createNotificacionSIVIGILA({
      notificadoPor: user.id,
      ...data,
    });
    return c.json(success({ notificacion }, 'Notificación SIVIGILA creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /vigilancia-salud/sivigila/:id - Actualizar notificación
 */
vigilanciaSalud.put('/sivigila/:id', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const notificacion = await vigilanciaSaludService.updateNotificacionSIVIGILA(id, data);
    return c.json(success({ notificacion }, 'Notificación actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /vigilancia-salud/sivigila/:id/marcar-enviado - Marcar como enviado al INS
 */
vigilanciaSalud.post('/sivigila/:id/marcar-enviado', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const notificacion = await vigilanciaSaludService.marcarEnviadoINS(id);
    return c.json(success({ notificacion }, 'Notificación marcada como enviada al INS'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/sivigila/eventos/catalogo - Obtener catálogo de eventos
 */
vigilanciaSalud.get('/sivigila/eventos/catalogo', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const eventos = await vigilanciaSaludService.getCatalogoEventos();
    return c.json(success({ eventos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/sivigila/semana-epidemiologica - Calcular semana epidemiológica
 */
vigilanciaSalud.get('/sivigila/semana-epidemiologica', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { fecha } = c.req.query();
    const semana = vigilanciaSaludService.calcularSemanaEpidemiologica(fecha ? new Date(fecha) : new Date());
    return c.json(success({ semana }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// SIVIGILA - EXPORTACIONES
// ==========================================

/**
 * GET /vigilancia-salud/sivigila/:id/ficha-xml - Exportar ficha epidemiológica XML
 */
vigilanciaSalud.get('/sivigila/:id/ficha-xml', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const xml = await exportadorSIVIGILA.generarFichaEpidemiologica(id);
    c.header('Content-Type', 'application/xml');
    c.header('Content-Disposition', `attachment; filename="ficha_sivigila_${id}.xml"`);
    return c.body(xml);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/sivigila/exportar/archivo-plano - Exportar archivo plano semanal
 */
vigilanciaSalud.get('/sivigila/exportar/archivo-plano', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { semana, anio } = c.req.query();
    const contenido = await exportadorSIVIGILA.generarArchivoPlano(semana, anio);
    c.header('Content-Type', 'text/plain');
    c.header('Content-Disposition', `attachment; filename="sivigila_sem${semana}_${anio}.txt"`);
    return c.body(contenido);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/sivigila/exportar/reporte-excel - Exportar reporte semanal Excel
 */
vigilanciaSalud.get('/sivigila/exportar/reporte-excel', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { semana, anio } = c.req.query();
    const workbook = await exportadorSIVIGILA.generarReporteSemanalExcel(semana, anio);
    const buffer = await workbook.xlsx.writeBuffer();
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="sivigila_sem${semana}_${anio}.xlsx"`);
    return c.body(buffer);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// FARMACOVIGILANCIA
// ==========================================

/**
 * GET /vigilancia-salud/farmacovigilancia - Obtener reportes de farmacovigilancia
 */
vigilanciaSalud.get('/farmacovigilancia', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const query = c.req.query();
    const result = await vigilanciaSaludService.getReportesFarmacovigilancia(query);
    return c.json(paginated(result.reportes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/farmacovigilancia/:id - Obtener reporte por ID
 */
vigilanciaSalud.get('/farmacovigilancia/:id', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const reporte = await vigilanciaSaludService.getReporteFarmacovigilanciaById(id);
    return c.json(success({ reporte }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /vigilancia-salud/farmacovigilancia - Crear reporte de farmacovigilancia
 */
vigilanciaSalud.post('/farmacovigilancia', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');
    const reporte = await vigilanciaSaludService.createReporteFarmacovigilancia({
      reportadoPor: user.id,
      ...data,
    });
    return c.json(success({ reporte }, 'Reporte de farmacovigilancia creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /vigilancia-salud/farmacovigilancia/:id - Actualizar reporte
 */
vigilanciaSalud.put('/farmacovigilancia/:id', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const reporte = await vigilanciaSaludService.updateReporteFarmacovigilancia(id, data);
    return c.json(success({ reporte }, 'Reporte actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /vigilancia-salud/farmacovigilancia/:id/marcar-reportado - Marcar como reportado a INVIMA
 */
vigilanciaSalud.post('/farmacovigilancia/:id/marcar-reportado', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const reporte = await vigilanciaSaludService.marcarReportadoINVIMAFarmaco(id);
    return c.json(success({ reporte }, 'Reporte marcado como reportado a INVIMA'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/farmacovigilancia/:id/foram-xml - Exportar formato FORAM XML
 */
vigilanciaSalud.get('/farmacovigilancia/:id/foram-xml', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const xml = await exportadorINVIMA.generarReporteFarmacovigilancia(id);
    c.header('Content-Type', 'application/xml');
    c.header('Content-Disposition', `attachment; filename="foram_${id}.xml"`);
    return c.body(xml);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// TECNOVIGILANCIA
// ==========================================

/**
 * GET /vigilancia-salud/tecnovigilancia - Obtener reportes de tecnovigilancia
 */
vigilanciaSalud.get('/tecnovigilancia', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const query = c.req.query();
    const result = await vigilanciaSaludService.getReportesTecnovigilancia(query);
    return c.json(paginated(result.reportes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/tecnovigilancia/:id - Obtener reporte por ID
 */
vigilanciaSalud.get('/tecnovigilancia/:id', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const reporte = await vigilanciaSaludService.getReporteTecnovigilanciaById(id);
    return c.json(success({ reporte }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /vigilancia-salud/tecnovigilancia - Crear reporte de tecnovigilancia
 */
vigilanciaSalud.post('/tecnovigilancia', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');
    const reporte = await vigilanciaSaludService.createReporteTecnovigilancia({
      reportadoPor: user.id,
      ...data,
    });
    return c.json(success({ reporte }, 'Reporte de tecnovigilancia creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /vigilancia-salud/tecnovigilancia/:id - Actualizar reporte
 */
vigilanciaSalud.put('/tecnovigilancia/:id', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const reporte = await vigilanciaSaludService.updateReporteTecnovigilancia(id, data);
    return c.json(success({ reporte }, 'Reporte actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /vigilancia-salud/tecnovigilancia/:id/marcar-reportado - Marcar como reportado a INVIMA
 */
vigilanciaSalud.post('/tecnovigilancia/:id/marcar-reportado', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const reporte = await vigilanciaSaludService.marcarReportadoINVIMATecno(id);
    return c.json(success({ reporte }, 'Reporte marcado como reportado a INVIMA'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/tecnovigilancia/:id/reporte-xml - Exportar reporte XML
 */
vigilanciaSalud.get('/tecnovigilancia/:id/reporte-xml', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { id } = c.req.param();
    const xml = await exportadorINVIMA.generarReporteTecnovigilancia(id);
    c.header('Content-Type', 'application/xml');
    c.header('Content-Disposition', `attachment; filename="tecnovigilancia_${id}.xml"`);
    return c.body(xml);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CONSOLIDADOS Y EXPORTACIONES INVIMA
// ==========================================

/**
 * GET /vigilancia-salud/invima/consolidado-farmacovigilancia - Consolidado mensual farmacovigilancia
 */
vigilanciaSalud.get('/invima/consolidado-farmacovigilancia', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { mes, anio } = c.req.query();
    const workbook = await exportadorINVIMA.generarConsolidadoFarmacovigilanciaExcel(parseInt(mes), parseInt(anio));
    const buffer = await workbook.xlsx.writeBuffer();
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="farmacovigilancia_${mes}_${anio}.xlsx"`);
    return c.body(buffer);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/invima/consolidado-tecnovigilancia - Consolidado mensual tecnovigilancia
 */
vigilanciaSalud.get('/invima/consolidado-tecnovigilancia', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { mes, anio } = c.req.query();
    const workbook = await exportadorINVIMA.generarConsolidadoTecnovigilanciaExcel(parseInt(mes), parseInt(anio));
    const buffer = await workbook.xlsx.writeBuffer();
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="tecnovigilancia_${mes}_${anio}.xlsx"`);
    return c.body(buffer);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD Y REPORTES
// ==========================================

/**
 * GET /vigilancia-salud/dashboard - Dashboard de vigilancia en salud
 */
vigilanciaSalud.get('/dashboard', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const dashboard = await vigilanciaSaludService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/estadisticas/sivigila - Estadísticas SIVIGILA
 */
vigilanciaSalud.get('/estadisticas/sivigila', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const { anio } = c.req.query();
    const estadisticas = await vigilanciaSaludService.getEstadisticasSIVIGILA(parseInt(anio));
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /vigilancia-salud/estadisticas/farmacovigilancia - Estadísticas farmacovigilancia
 */
vigilanciaSalud.get('/estadisticas/farmacovigilancia', permissionMiddleware('calidad_vigilancia'), async (c) => {
  try {
    const query = c.req.query();
    const estadisticas = await vigilanciaSaludService.getEstadisticasFarmacovigilancia(query);
    return c.json(success({ estadisticas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = vigilanciaSalud;
