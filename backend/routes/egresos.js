/**
 * Rutas para egresos hospitalarios
 */
const { Hono } = require('hono');
const egresoService = require('../services/egreso.service');
const authMiddleware = require('../middleware/auth');

const egresos = new Hono();

// Aplicar autenticación a todas las rutas
egresos.use('/*', authMiddleware);

/**
 * GET /egresos
 * Obtener lista de egresos con filtros
 */
egresos.get('/', async (c) => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      paciente_id, 
      tipo_egreso,
      fecha_desde,
      fecha_hasta
    } = c.req.query();

    const result = await egresoService.getAll({
      page,
      limit,
      paciente_id,
      tipo_egreso,
      fecha_desde,
      fecha_hasta,
    });

    return c.json({
      success: true,
      data: result.egresos,
      pagination: {
        page: result.page,
        limit: parseInt(limit),
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Error al obtener egresos:', error);
    return c.json(
      { 
        success: false, 
        message: error.message || 'Error al obtener egresos' 
      },
      500
    );
  }
});

/**
 * GET /egresos/estadisticas
 * Obtener estadísticas de egresos
 */
egresos.get('/estadisticas', async (c) => {
  try {
    const { fecha_desde, fecha_hasta } = c.req.query();

    const estadisticas = await egresoService.getEstadisticas({
      fecha_desde,
      fecha_hasta,
    });

    return c.json({
      success: true,
      data: estadisticas,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return c.json(
      { 
        success: false, 
        message: error.message || 'Error al obtener estadísticas' 
      },
      500
    );
  }
});

/**
 * GET /egresos/admision/:admisionId
 * Obtener egreso por ID de admisión
 */
egresos.get('/admision/:admisionId', async (c) => {
  try {
    const { admisionId } = c.req.param();
    
    const egreso = await egresoService.getByAdmisionId(admisionId);

    if (!egreso) {
      return c.json(
        { 
          success: false, 
          message: 'No se encontró egreso para esta admisión' 
        },
        404
      );
    }

    return c.json({
      success: true,
      data: egreso,
    });
  } catch (error) {
    console.error('Error al obtener egreso:', error);
    return c.json(
      { 
        success: false, 
        message: error.message || 'Error al obtener egreso' 
      },
      500
    );
  }
});

/**
 * GET /egresos/:id
 * Obtener egreso por ID
 */
egresos.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    
    const egreso = await egresoService.getById(id);

    return c.json({
      success: true,
      data: egreso,
    });
  } catch (error) {
    console.error('Error al obtener egreso:', error);
    
    const status = error.message.includes('no encontrado') ? 404 : 500;
    return c.json(
      { 
        success: false, 
        message: error.message || 'Error al obtener egreso' 
      },
      status
    );
  }
});

/**
 * POST /egresos
 * Crear nuevo egreso
 */
egresos.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Agregar el ID del usuario actual como profesional responsable si no viene
    if (!body.profesional_responsable_id && c.get('user')) {
      body.profesional_responsable_id = c.get('user').id;
    }

    const egreso = await egresoService.create(body);

    return c.json(
      {
        success: true,
        message: 'Egreso creado exitosamente',
        data: egreso,
      },
      201
    );
  } catch (error) {
    console.error('Error al crear egreso:', error);
    
    const status = error.message.includes('Validación') || error.message.includes('requerido') ? 400 : 500;
    return c.json(
      { 
        success: false, 
        message: error.message || 'Error al crear egreso' 
      },
      status
    );
  }
});

/**
 * PUT /egresos/:id
 * Actualizar egreso (solo campos no críticos)
 */
egresos.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const egreso = await egresoService.update(id, body);

    return c.json({
      success: true,
      message: 'Egreso actualizado exitosamente',
      data: egreso,
    });
  } catch (error) {
    console.error('Error al actualizar egreso:', error);
    
    const status = error.message.includes('no encontrado') ? 404 : 400;
    return c.json(
      { 
        success: false, 
        message: error.message || 'Error al actualizar egreso' 
      },
      status
    );
  }
});

module.exports = egresos;
