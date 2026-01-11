/**
 * @swagger
 * tags:
 *   name: PAMEC
 *   description: Programa de Auditoría para el Mejoramiento de la Calidad
 * components:
 *   schemas:
 *     ProcesoPAMEC:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         prioridad:
 *           type: integer
 *         estado:
 *           type: string
 *     IndicadorPAMEC:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         meta:
 *           type: number
 *         valorActual:
 *           type: number
 */

/**
 * Rutas de PAMEC - Programa de Auditoría para el Mejoramiento de la Calidad
 */
const { Hono } = require('hono');
const pamecService = require('../services/pamec.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const pamec = new Hono();

// Todas las rutas requieren autenticación
pamec.use('*', authMiddleware);

// ==========================================
// EQUIPO PAMEC
// ==========================================

/**
 * GET /pamec/equipo - Obtener miembros del equipo PAMEC
 */
pamec.get('/equipo', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const query = c.req.query();
    const equipo = await pamecService.getEquipoPAMEC(query);
    return c.json(success({ equipo }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pamec/equipo - Agregar miembro al equipo
 */
pamec.post('/equipo', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const data = await c.req.json();
    const miembro = await pamecService.addMiembroEquipo(data);
    return c.json(success({ miembro }, 'Miembro agregado al equipo PAMEC'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /pamec/equipo/:id - Actualizar miembro del equipo
 */
pamec.put('/equipo/:id', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const miembro = await pamecService.updateMiembroEquipo(id, data);
    return c.json(success({ miembro }, 'Miembro actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /pamec/equipo/:id - Retirar miembro del equipo
 */
pamec.delete('/equipo/:id', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    await pamecService.retirarMiembroEquipo(id);
    return c.json(success(null, 'Miembro retirado del equipo PAMEC'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// PROCESOS PAMEC
// ==========================================

/**
 * GET /pamec/procesos - Obtener procesos PAMEC
 */
pamec.get('/procesos', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const query = c.req.query();
    const result = await pamecService.getProcesos(query);
    return c.json(paginated(result.procesos, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pamec/procesos/:id - Obtener proceso por ID
 */
pamec.get('/procesos/:id', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const proceso = await pamecService.getProcesoById(id);
    return c.json(success({ proceso }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pamec/procesos - Crear proceso
 */
pamec.post('/procesos', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const data = await c.req.json();
    const proceso = await pamecService.createProceso(data);
    return c.json(success({ proceso }, 'Proceso creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /pamec/procesos/:id - Actualizar proceso
 */
pamec.put('/procesos/:id', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const proceso = await pamecService.updateProceso(id, data);
    return c.json(success({ proceso }, 'Proceso actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pamec/procesos/priorizar - Priorizar procesos
 */
pamec.post('/procesos/priorizar', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { procesoIds, criterios } = await c.req.json();
    const procesos = await pamecService.priorizarProcesos(procesoIds, criterios);
    return c.json(success({ procesos }, 'Procesos priorizados exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// INDICADORES PAMEC
// ==========================================

/**
 * GET /pamec/indicadores - Obtener indicadores
 */
pamec.get('/indicadores', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const query = c.req.query();
    const indicadores = await pamecService.getIndicadores(query);
    return c.json(success({ indicadores }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pamec/indicadores/:id - Obtener indicador por ID
 */
pamec.get('/indicadores/:id', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const indicador = await pamecService.getIndicadorById(id);
    return c.json(success({ indicador }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pamec/indicadores - Crear indicador
 */
pamec.post('/indicadores', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const data = await c.req.json();
    const indicador = await pamecService.createIndicador(data);
    return c.json(success({ indicador }, 'Indicador creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /pamec/indicadores/:id - Actualizar indicador
 */
pamec.put('/indicadores/:id', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const indicador = await pamecService.updateIndicador(id, data);
    return c.json(success({ indicador }, 'Indicador actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pamec/indicadores/:id/medicion - Registrar medición
 */
pamec.post('/indicadores/:id/medicion', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const medicion = await pamecService.registrarMedicion({
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
 * GET /pamec/indicadores/:id/tendencia - Obtener tendencia del indicador
 */
pamec.get('/indicadores/:id/tendencia', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const { periodos = 12 } = c.req.query();
    const tendencia = await pamecService.getTendenciaIndicador(id, parseInt(periodos));
    return c.json(success({ tendencia }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// AUDITORÍAS
// ==========================================

/**
 * GET /pamec/auditorias - Obtener auditorías
 */
pamec.get('/auditorias', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const query = c.req.query();
    const result = await pamecService.getAuditorias(query);
    return c.json(paginated(result.auditorias, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pamec/auditorias/:id - Obtener auditoría por ID
 */
pamec.get('/auditorias/:id', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const auditoria = await pamecService.getAuditoriaById(id);
    return c.json(success({ auditoria }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pamec/auditorias - Programar auditoría
 */
pamec.post('/auditorias', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const data = await c.req.json();
    const auditoria = await pamecService.programarAuditoria(data);
    return c.json(success({ auditoria }, 'Auditoría programada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /pamec/auditorias/:id - Actualizar auditoría
 */
pamec.put('/auditorias/:id', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const auditoria = await pamecService.updateAuditoria(id, data);
    return c.json(success({ auditoria }, 'Auditoría actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pamec/auditorias/:id/ejecutar - Registrar ejecución de auditoría
 */
pamec.post('/auditorias/:id/ejecutar', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const auditoria = await pamecService.ejecutarAuditoria(id, data);
    return c.json(success({ auditoria }, 'Auditoría ejecutada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// HALLAZGOS
// ==========================================

/**
 * GET /pamec/hallazgos - Obtener hallazgos
 */
pamec.get('/hallazgos', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const query = c.req.query();
    const result = await pamecService.getHallazgos(query);
    return c.json(paginated(result.hallazgos, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pamec/hallazgos - Registrar hallazgo
 */
pamec.post('/hallazgos', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const data = await c.req.json();
    const hallazgo = await pamecService.registrarHallazgo(data);
    return c.json(success({ hallazgo }, 'Hallazgo registrado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /pamec/hallazgos/:id - Actualizar hallazgo
 */
pamec.put('/hallazgos/:id', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const hallazgo = await pamecService.updateHallazgo(id, data);
    return c.json(success({ hallazgo }, 'Hallazgo actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pamec/hallazgos/:id/analisis-causa - Registrar análisis de causa
 */
pamec.post('/hallazgos/:id/analisis-causa', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const hallazgo = await pamecService.registrarAnalisisCausa(id, data);
    return c.json(success({ hallazgo }, 'Análisis de causa registrado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD Y REPORTES
// ==========================================

/**
 * GET /pamec/dashboard - Dashboard PAMEC
 */
pamec.get('/dashboard', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const dashboard = await pamecService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pamec/ruta-critica - Obtener estado de la Ruta Crítica
 */
pamec.get('/ruta-critica', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const rutaCritica = await pamecService.getRutaCritica();
    return c.json(success({ rutaCritica }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pamec/matriz-priorizacion - Obtener matriz de priorización
 */
pamec.get('/matriz-priorizacion', permissionMiddleware('calidad_pamec'), async (c) => {
  try {
    const matriz = await pamecService.getMatrizPriorizacion();
    return c.json(success({ matriz }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = pamec;
