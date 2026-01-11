/**
 * Rutas de Seguridad del Paciente - Rondas y Prácticas Seguras
 */
const { Hono } = require('hono');
const seguridadPacienteService = require('../services/seguridadPaciente.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const seguridadPaciente = new Hono();

// Todas las rutas requieren autenticación
seguridadPaciente.use('*', authMiddleware);

// ==========================================
// RONDAS DE SEGURIDAD
// ==========================================

/**
 * GET /seguridad-paciente/rondas - Obtener rondas de seguridad
 */
seguridadPaciente.get('/rondas', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const query = c.req.query();
    const result = await seguridadPacienteService.getRondas(query);
    return c.json(paginated(result.rondas, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /seguridad-paciente/rondas/:id - Obtener ronda por ID
 */
seguridadPaciente.get('/rondas/:id', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const ronda = await seguridadPacienteService.getRondaById(id);
    return c.json(success({ ronda }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /seguridad-paciente/rondas - Programar ronda de seguridad
 */
seguridadPaciente.post('/rondas', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const data = await c.req.json();
    const ronda = await seguridadPacienteService.programarRonda(data);
    return c.json(success({ ronda }, 'Ronda programada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /seguridad-paciente/rondas/:id - Actualizar ronda
 */
seguridadPaciente.put('/rondas/:id', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const ronda = await seguridadPacienteService.updateRonda(id, data);
    return c.json(success({ ronda }, 'Ronda actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /seguridad-paciente/rondas/:id/ejecutar - Ejecutar ronda
 */
seguridadPaciente.post('/rondas/:id/ejecutar', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const ronda = await seguridadPacienteService.ejecutarRonda(id, {
      ejecutorId: user.id,
      ...data,
    });
    return c.json(success({ ronda }, 'Ronda ejecutada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /seguridad-paciente/rondas/:id/hallazgos - Registrar hallazgos de ronda
 */
seguridadPaciente.post('/rondas/:id/hallazgos', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const { hallazgos } = await c.req.json();
    const ronda = await seguridadPacienteService.registrarHallazgosRonda(id, hallazgos);
    return c.json(success({ ronda }, 'Hallazgos registrados exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// PRÁCTICAS SEGURAS
// ==========================================

/**
 * GET /seguridad-paciente/practicas - Obtener prácticas seguras
 */
seguridadPaciente.get('/practicas', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const query = c.req.query();
    const practicas = await seguridadPacienteService.getPracticasSeguras(query);
    return c.json(success({ practicas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /seguridad-paciente/practicas/:id - Obtener práctica por ID
 */
seguridadPaciente.get('/practicas/:id', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const practica = await seguridadPacienteService.getPracticaById(id);
    return c.json(success({ practica }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /seguridad-paciente/practicas - Crear práctica segura
 */
seguridadPaciente.post('/practicas', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const data = await c.req.json();
    const practica = await seguridadPacienteService.createPracticaSegura(data);
    return c.json(success({ practica }, 'Práctica segura creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /seguridad-paciente/practicas/:id - Actualizar práctica
 */
seguridadPaciente.put('/practicas/:id', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const practica = await seguridadPacienteService.updatePracticaSegura(id, data);
    return c.json(success({ practica }, 'Práctica actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ADHERENCIA A PRÁCTICAS SEGURAS
// ==========================================

/**
 * GET /seguridad-paciente/practicas/:id/adherencia - Obtener adherencia por práctica
 */
seguridadPaciente.get('/practicas/:id/adherencia', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const query = c.req.query();
    const adherencias = await seguridadPacienteService.getAdherenciaByPractica(id, query);
    return c.json(success({ adherencias }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /seguridad-paciente/practicas/:id/adherencia - Registrar evaluación de adherencia
 */
seguridadPaciente.post('/practicas/:id/adherencia', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const adherencia = await seguridadPacienteService.registrarAdherencia({
      practicaId: id,
      evaluadorId: user.id,
      ...data,
    });
    return c.json(success({ adherencia }, 'Evaluación de adherencia registrada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /seguridad-paciente/adherencia/consolidado - Consolidado de adherencia
 */
seguridadPaciente.get('/adherencia/consolidado', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { periodo } = c.req.query();
    const consolidado = await seguridadPacienteService.getConsolidadoAdherencia(periodo);
    return c.json(success({ consolidado }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /seguridad-paciente/adherencia/tendencia/:practicaId - Tendencia de adherencia
 */
seguridadPaciente.get('/adherencia/tendencia/:practicaId', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { practicaId } = c.req.param();
    const { meses = 12 } = c.req.query();
    const tendencia = await seguridadPacienteService.getTendenciaAdherencia(practicaId, parseInt(meses));
    return c.json(success({ tendencia }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CHECKLISTS Y HERRAMIENTAS
// ==========================================

/**
 * GET /seguridad-paciente/checklists - Obtener checklists disponibles
 */
seguridadPaciente.get('/checklists', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const checklists = await seguridadPacienteService.getChecklists();
    return c.json(success({ checklists }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /seguridad-paciente/checklists/:tipo - Obtener checklist específico
 */
seguridadPaciente.get('/checklists/:tipo', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { tipo } = c.req.param();
    const checklist = await seguridadPacienteService.getChecklistByTipo(tipo);
    return c.json(success({ checklist }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD Y REPORTES
// ==========================================

/**
 * GET /seguridad-paciente/dashboard - Dashboard de seguridad del paciente
 */
seguridadPaciente.get('/dashboard', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const dashboard = await seguridadPacienteService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /seguridad-paciente/indicadores - Indicadores de seguridad del paciente
 */
seguridadPaciente.get('/indicadores', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const { periodo } = c.req.query();
    const indicadores = await seguridadPacienteService.getIndicadoresSeguridad(periodo);
    return c.json(success({ indicadores }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /seguridad-paciente/cultura - Evaluación de cultura de seguridad
 */
seguridadPaciente.get('/cultura', permissionMiddleware('calidad_seguridad_paciente'), async (c) => {
  try {
    const cultura = await seguridadPacienteService.getEvaluacionCultura();
    return c.json(success({ cultura }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = seguridadPaciente;
