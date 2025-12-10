/**
 * Rutas para Procedimientos Clínicos
 */

const { Hono } = require('hono');
const procedimientoService = require('../services/procedimiento.service');
const { authMiddleware } = require('../middleware/auth');

const procedimiento = new Hono();

// Middleware de autenticación
procedimiento.use('/*', authMiddleware);

/**
 * GET /procedimientos
 * Obtener lista de procedimientos con filtros
 */
procedimiento.get('/', async (c) => {
  try {
    const {
      admisionId,
      pacienteId,
      estado,
      tipo,
      medicoResponsableId,
      fechaDesde,
      fechaHasta,
      limit,
      offset,
    } = c.req.query();

    const result = await procedimientoService.getProcedimientos({
      admisionId,
      pacienteId,
      estado,
      tipo,
      medicoResponsableId,
      fechaDesde,
      fechaHasta,
      limit,
      offset,
    });

    return c.json({
      success: true,
      data: result.procedimientos,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    console.error('Error al obtener procedimientos:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al obtener procedimientos',
      },
      500
    );
  }
});

/**
 * GET /procedimientos/estadisticas
 * Obtener estadísticas de procedimientos
 */
procedimiento.get('/estadisticas', async (c) => {
  try {
    const { medicoId, tipo, fechaInicio, fechaFin } = c.req.query();

    const estadisticas = await procedimientoService.getEstadisticas({
      medicoId,
      tipo,
      fechaInicio,
      fechaFin,
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
        error: error.message || 'Error al obtener estadísticas',
      },
      500
    );
  }
});

/**
 * GET /procedimientos/:id
 * Obtener un procedimiento por ID
 */
procedimiento.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const procedimientoData = await procedimientoService.getProcedimientoById(id);

    return c.json({
      success: true,
      data: procedimientoData,
    });
  } catch (error) {
    console.error('Error al obtener procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al obtener procedimiento',
      },
      error.message === 'Procedimiento no encontrado' ? 404 : 500
    );
  }
});

/**
 * POST /procedimientos
 * Crear un nuevo procedimiento
 */
procedimiento.post('/', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    // Validaciones
    if (!data.admisionId) {
      return c.json({ success: false, error: 'admisionId es requerido' }, 400);
    }
    if (!data.pacienteId) {
      return c.json({ success: false, error: 'pacienteId es requerido' }, 400);
    }
    if (!data.nombre) {
      return c.json({ success: false, error: 'nombre es requerido' }, 400);
    }
    if (!data.descripcion) {
      return c.json({ success: false, error: 'descripcion es requerida' }, 400);
    }
    if (!data.indicacion) {
      return c.json({ success: false, error: 'indicacion es requerida' }, 400);
    }

    const procedimientoCreado = await procedimientoService.crearProcedimiento(data, user.id);

    return c.json(
      {
        success: true,
        message: 'Procedimiento creado exitosamente',
        data: procedimientoCreado,
      },
      201
    );
  } catch (error) {
    console.error('Error al crear procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al crear procedimiento',
      },
      400
    );
  }
});

/**
 * POST /procedimientos/:id/iniciar
 * Iniciar la ejecución de un procedimiento
 */
procedimiento.post('/:id/iniciar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const procedimientoIniciado = await procedimientoService.iniciarProcedimiento(id, user.id);

    return c.json({
      success: true,
      message: 'Procedimiento iniciado',
      data: procedimientoIniciado,
    });
  } catch (error) {
    console.error('Error al iniciar procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al iniciar procedimiento',
      },
      400
    );
  }
});

/**
 * POST /procedimientos/:id/completar
 * Completar un procedimiento
 */
procedimiento.post('/:id/completar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const data = await c.req.json();

    const procedimientoCompletado = await procedimientoService.completarProcedimiento(
      id,
      data,
      user.id
    );

    return c.json({
      success: true,
      message: 'Procedimiento completado exitosamente',
      data: procedimientoCompletado,
    });
  } catch (error) {
    console.error('Error al completar procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al completar procedimiento',
      },
      400
    );
  }
});

/**
 * POST /procedimientos/:id/cancelar
 * Cancelar un procedimiento
 */
procedimiento.post('/:id/cancelar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const { motivo } = await c.req.json();

    const procedimientoCancelado = await procedimientoService.cancelarProcedimiento(
      id,
      motivo,
      user.id
    );

    return c.json({
      success: true,
      message: 'Procedimiento cancelado',
      data: procedimientoCancelado,
    });
  } catch (error) {
    console.error('Error al cancelar procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al cancelar procedimiento',
      },
      400
    );
  }
});

/**
 * POST /procedimientos/:id/diferir
 * Diferir (posponer) un procedimiento
 */
procedimiento.post('/:id/diferir', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const { nuevaFecha, motivo } = await c.req.json();

    const procedimientoDiferido = await procedimientoService.diferirProcedimiento(
      id,
      nuevaFecha,
      motivo,
      user.id
    );

    return c.json({
      success: true,
      message: 'Procedimiento diferido',
      data: procedimientoDiferido,
    });
  } catch (error) {
    console.error('Error al diferir procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al diferir procedimiento',
      },
      400
    );
  }
});

/**
 * POST /procedimientos/:id/reprogramar
 * Reprogramar un procedimiento diferido
 */
procedimiento.post('/:id/reprogramar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const { nuevaFecha } = await c.req.json();

    if (!nuevaFecha) {
      return c.json({ success: false, error: 'nuevaFecha es requerida' }, 400);
    }

    const procedimientoReprogramado = await procedimientoService.reprogramarProcedimiento(
      id,
      nuevaFecha,
      user.id
    );

    return c.json({
      success: true,
      message: 'Procedimiento reprogramado',
      data: procedimientoReprogramado,
    });
  } catch (error) {
    console.error('Error al reprogramar procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al reprogramar procedimiento',
      },
      400
    );
  }
});

/**
 * PUT /procedimientos/:id
 * Actualizar un procedimiento
 */
procedimiento.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const data = await c.req.json();

    const procedimientoActualizado = await procedimientoService.actualizarProcedimiento(
      id,
      data,
      user.id
    );

    return c.json({
      success: true,
      message: 'Procedimiento actualizado exitosamente',
      data: procedimientoActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar procedimiento:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al actualizar procedimiento',
      },
      400
    );
  }
});

module.exports = procedimiento;
