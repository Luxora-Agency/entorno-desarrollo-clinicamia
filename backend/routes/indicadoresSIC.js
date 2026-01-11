/**
 * Rutas de Indicadores SIC - Resolución 256/2016
 */
const { Hono } = require('hono');
const indicadorSICService = require('../services/indicadorSIC.service');
const { exportadorSISPRO } = require('../services/exportadores');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const indicadoresSIC = new Hono();

// Todas las rutas requieren autenticación
indicadoresSIC.use('*', authMiddleware);

// ==========================================
// INDICADORES SIC
// ==========================================

/**
 * GET /indicadores-sic - Obtener indicadores SIC
 */
indicadoresSIC.get('/', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const query = c.req.query();
    const indicadores = await indicadorSICService.getIndicadores(query);
    return c.json(success({ indicadores }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /indicadores-sic/:id - Obtener indicador por ID
 */
indicadoresSIC.get('/:id', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { id } = c.req.param();
    const indicador = await indicadorSICService.getIndicadorById(id);
    return c.json(success({ indicador }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /indicadores-sic - Crear indicador
 */
indicadoresSIC.post('/', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const data = await c.req.json();
    const indicador = await indicadorSICService.createIndicador(data);
    return c.json(success({ indicador }, 'Indicador creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /indicadores-sic/:id - Actualizar indicador
 */
indicadoresSIC.put('/:id', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const indicador = await indicadorSICService.updateIndicador(id, data);
    return c.json(success({ indicador }, 'Indicador actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /indicadores-sic/por-dominio/:dominio - Obtener indicadores por dominio
 */
indicadoresSIC.get('/por-dominio/:dominio', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { dominio } = c.req.param();
    const indicadores = await indicadorSICService.getIndicadoresPorDominio(dominio);
    return c.json(success({ indicadores }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MEDICIONES
// ==========================================

/**
 * GET /indicadores-sic/:id/mediciones - Obtener mediciones de un indicador
 */
indicadoresSIC.get('/:id/mediciones', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { id } = c.req.param();
    const query = c.req.query();
    const result = await indicadorSICService.getMediciones(id, query);
    return c.json(paginated(result.mediciones, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /indicadores-sic/:id/mediciones - Registrar medición
 */
indicadoresSIC.post('/:id/mediciones', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const medicion = await indicadorSICService.registrarMedicion({
      indicadorId: id,
      registradoPor: user.id,
      ...data,
    });
    return c.json(success({ medicion }, 'Medición registrada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /indicadores-sic/mediciones/:medicionId - Actualizar medición
 */
indicadoresSIC.put('/mediciones/:medicionId', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { medicionId } = c.req.param();
    const data = await c.req.json();
    const medicion = await indicadorSICService.updateMedicion(medicionId, data);
    return c.json(success({ medicion }, 'Medición actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /indicadores-sic/:id/tendencia - Obtener tendencia del indicador
 */
indicadoresSIC.get('/:id/tendencia', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { id } = c.req.param();
    const { periodos = 6 } = c.req.query();
    const tendencia = await indicadorSICService.getTendencia(id, parseInt(periodos));
    return c.json(success({ tendencia }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD Y REPORTES
// ==========================================

/**
 * GET /indicadores-sic/dashboard - Dashboard de indicadores SIC
 */
indicadoresSIC.get('/dashboard/resumen', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { periodo } = c.req.query();
    const dashboard = await indicadorSICService.getDashboard(periodo);
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /indicadores-sic/semaforos/:periodo - Obtener semáforos de indicadores
 */
indicadoresSIC.get('/semaforos/:periodo', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { periodo } = c.req.param();
    const semaforos = await indicadorSICService.getSemaforos(periodo);
    return c.json(success({ semaforos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /indicadores-sic/consolidado/:periodo - Obtener consolidado semestral
 */
indicadoresSIC.get('/consolidado/:periodo', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { periodo } = c.req.param();
    const consolidado = await indicadorSICService.getConsolidadoSemestral(periodo);
    return c.json(success({ consolidado }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /indicadores-sic/marcar-reportado/:medicionId - Marcar como reportado a SISPRO
 */
indicadoresSIC.post('/marcar-reportado/:medicionId', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { medicionId } = c.req.param();
    const medicion = await indicadorSICService.marcarReportadoSISPRO(medicionId);
    return c.json(success({ medicion }, 'Medición marcada como reportada a SISPRO'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// EXPORTACIONES SISPRO
// ==========================================

/**
 * GET /indicadores-sic/exportar/sispro-xml/:periodo - Exportar XML para SISPRO
 */
indicadoresSIC.get('/exportar/sispro-xml/:periodo', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { periodo } = c.req.param();
    const xml = await exportadorSISPRO.generarReporteSemestralXML(periodo);
    c.header('Content-Type', 'application/xml');
    c.header('Content-Disposition', `attachment; filename="reporte_sispro_${periodo}.xml"`);
    return c.body(xml);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /indicadores-sic/exportar/pisis/:periodo - Exportar plantilla PISIS Excel
 */
indicadoresSIC.get('/exportar/pisis/:periodo', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { periodo } = c.req.param();
    const workbook = await exportadorSISPRO.generarPlantillaPISIS(periodo);
    const buffer = await workbook.xlsx.writeBuffer();
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="plantilla_pisis_${periodo}.xlsx"`);
    return c.body(buffer);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /indicadores-sic/exportar/csv/:periodo - Exportar CSV para carga masiva
 */
indicadoresSIC.get('/exportar/csv/:periodo', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { periodo } = c.req.param();
    const csv = await exportadorSISPRO.generarCSV(periodo);
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="indicadores_sic_${periodo}.csv"`);
    return c.body(csv);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// FICHAS TÉCNICAS
// ==========================================

/**
 * GET /indicadores-sic/:id/ficha-tecnica - Obtener ficha técnica del indicador
 */
indicadoresSIC.get('/:id/ficha-tecnica', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { id } = c.req.param();
    const fichaTecnica = await indicadorSICService.getFichaTecnica(id);
    return c.json(success({ fichaTecnica }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /indicadores-sic/:id/meta-institucional - Actualizar meta institucional
 */
indicadoresSIC.put('/:id/meta-institucional', permissionMiddleware('calidad_indicadores'), async (c) => {
  try {
    const { id } = c.req.param();
    const { metaInstitucional } = await c.req.json();
    const indicador = await indicadorSICService.actualizarMetaInstitucional(id, metaInstitucional);
    return c.json(success({ indicador }, 'Meta institucional actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = indicadoresSIC;
