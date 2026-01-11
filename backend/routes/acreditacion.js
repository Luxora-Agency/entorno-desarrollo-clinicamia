/**
 * Rutas de Acreditación (SUA) - Resolución 5095/2018
 * Sistema Único de Acreditación
 */
const { Hono } = require('hono');
const acreditacionService = require('../services/acreditacion.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const acreditacion = new Hono();

// Todas las rutas requieren autenticación
acreditacion.use('*', authMiddleware);

// ==========================================
// ESTÁNDARES DE ACREDITACIÓN
// ==========================================

/**
 * GET /acreditacion/estandares - Obtener estándares de acreditación
 */
acreditacion.get('/estandares', permissionMiddleware('calidad'), async (c) => {
  try {
    const query = c.req.query();
    const estandares = await acreditacionService.getEstandares(query);
    return c.json(success({ estandares }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /acreditacion/estandares/:id - Obtener estándar por ID
 */
acreditacion.get('/estandares/:id', permissionMiddleware('calidad'), async (c) => {
  try {
    const { id } = c.req.param();
    const estandar = await acreditacionService.getEstandarById(id);
    return c.json(success({ estandar }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /acreditacion/estandares - Crear estándar de acreditación
 */
acreditacion.post('/estandares', permissionMiddleware('calidad'), async (c) => {
  try {
    const data = await c.req.json();
    const estandar = await acreditacionService.createEstandar(data);
    return c.json(success({ estandar }, 'Estándar creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /acreditacion/estandares/:id - Actualizar estándar
 */
acreditacion.put('/estandares/:id', permissionMiddleware('calidad'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const estandar = await acreditacionService.updateEstandar(id, data);
    return c.json(success({ estandar }, 'Estándar actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// EVALUACIONES
// ==========================================

/**
 * GET /acreditacion/evaluaciones - Obtener evaluaciones
 */
acreditacion.get('/evaluaciones', permissionMiddleware('calidad'), async (c) => {
  try {
    const query = c.req.query();
    const result = await acreditacionService.getEvaluaciones(query);
    return c.json(paginated(result.evaluaciones, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /acreditacion/evaluaciones - Registrar evaluación
 */
acreditacion.post('/evaluaciones', permissionMiddleware('calidad'), async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');
    const evaluacion = await acreditacionService.registrarEvaluacion({
      evaluadorId: user.id,
      ...data,
    });
    return c.json(success({ evaluacion }, 'Evaluación registrada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /acreditacion/evaluaciones/:id - Actualizar evaluación
 */
acreditacion.put('/evaluaciones/:id', permissionMiddleware('calidad'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const evaluacion = await acreditacionService.updateEvaluacion(id, data);
    return c.json(success({ evaluacion }, 'Evaluación actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// AUTOEVALUACIÓN POR GRUPO
// ==========================================

/**
 * GET /acreditacion/autoevaluacion/:grupo - Obtener autoevaluación por grupo
 */
acreditacion.get('/autoevaluacion/:grupo', permissionMiddleware('calidad'), async (c) => {
  try {
    const { grupo } = c.req.param();
    const autoevaluacion = await acreditacionService.getAutoevaluacionPorGrupo(grupo);
    return c.json(success({ autoevaluacion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /acreditacion/grupos - Obtener lista de grupos de estándares
 */
acreditacion.get('/grupos/lista', permissionMiddleware('calidad'), async (c) => {
  try {
    const grupos = [
      { codigo: 'ATENCION_CLIENTE', nombre: 'Atención al Cliente Asistencial' },
      { codigo: 'APOYO_ADMINISTRATIVO', nombre: 'Apoyo Administrativo' },
      { codigo: 'DIRECCIONAMIENTO', nombre: 'Direccionamiento' },
      { codigo: 'GERENCIA', nombre: 'Gerencia' },
      { codigo: 'RECURSO_HUMANO', nombre: 'Gerencia del Recurso Humano' },
      { codigo: 'AMBIENTE_FISICO', nombre: 'Gerencia del Ambiente Físico' },
      { codigo: 'INFORMACION', nombre: 'Gerencia de la Información' },
      { codigo: 'MEJORAMIENTO_CALIDAD', nombre: 'Mejoramiento de la Calidad' },
    ];
    return c.json(success({ grupos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// REPORTES CONSOLIDADOS
// ==========================================

/**
 * GET /acreditacion/reporte-consolidado - Reporte consolidado de acreditación
 */
acreditacion.get('/reporte-consolidado', permissionMiddleware('calidad'), async (c) => {
  try {
    const reporte = await acreditacionService.getReporteConsolidado();
    return c.json(success({ reporte }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /acreditacion/brechas - Obtener brechas y oportunidades de mejora
 */
acreditacion.get('/brechas', permissionMiddleware('calidad'), async (c) => {
  try {
    const brechas = await acreditacionService.getBrechasYOportunidades();
    return c.json(success({ brechas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD
// ==========================================

/**
 * GET /acreditacion/dashboard - Dashboard de acreditación
 */
acreditacion.get('/dashboard', permissionMiddleware('calidad'), async (c) => {
  try {
    const dashboard = await acreditacionService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// NIVELES DE CALIFICACIÓN (Referencia)
// ==========================================

/**
 * GET /acreditacion/niveles-calificacion - Obtener niveles de calificación
 */
acreditacion.get('/niveles-calificacion', permissionMiddleware('calidad'), async (c) => {
  try {
    const niveles = {
      niveles: [
        { nivel: 5, nombre: 'Excelente', rango: '4.5 - 5.0', descripcion: 'Cumplimiento superior. El estándar se cumple de manera ejemplar.' },
        { nivel: 4, nombre: 'Bueno', rango: '3.5 - 4.4', descripcion: 'Cumplimiento satisfactorio. El estándar se cumple con fortalezas identificables.' },
        { nivel: 3, nombre: 'Aceptable', rango: '2.5 - 3.4', descripcion: 'Cumplimiento básico. El estándar se cumple pero con oportunidades de mejora.' },
        { nivel: 2, nombre: 'Deficiente', rango: '1.5 - 2.4', descripcion: 'Cumplimiento insuficiente. El estándar no se cumple completamente.' },
        { nivel: 1, nombre: 'Crítico', rango: '1.0 - 1.4', descripcion: 'No cumple. El estándar no se cumple o existe riesgo significativo.' },
      ],
      guiaCalificacion: `
        Para calificar cada estándar:
        1. Revisar todos los criterios asociados al estándar
        2. Evaluar el nivel de cumplimiento de cada criterio
        3. Identificar fortalezas y oportunidades de mejora
        4. Documentar evidencias que soporten la calificación
        5. Asignar calificación global del estándar (1-5)
      `,
    };
    return c.json(success(niveles));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = acreditacion;
