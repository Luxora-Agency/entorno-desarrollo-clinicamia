/**
 * Rutas para Interconsultas
 */

const { Hono } = require('hono');
const interconsultaService = require('../services/interconsulta.service');
const { authMiddleware } = require('../middleware/auth');

const interconsulta = new Hono();

// Middleware de autenticación para todas las rutas
interconsulta.use('/*', authMiddleware);

/**
 * GET /interconsultas
 * Obtener lista de interconsultas con filtros
 */
interconsulta.get('/', async (c) => {
  try {
    const {
      admisionId,
      pacienteId,
      estado,
      prioridad,
      medicoSolicitanteId,
      medicoEspecialistaId,
      limit,
      offset,
    } = c.req.query();

    const result = await interconsultaService.getInterconsultas({
      admisionId,
      pacienteId,
      estado,
      prioridad,
      medicoSolicitanteId,
      medicoEspecialistaId,
      limit,
      offset,
    });

    return c.json({
      success: true,
      data: result.interconsultas,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    console.error('Error al obtener interconsultas:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al obtener interconsultas',
      },
      500
    );
  }
});

/**
 * GET /interconsultas/estadisticas
 * Obtener estadísticas de interconsultas
 */
interconsulta.get('/estadisticas', async (c) => {
  try {
    const { medicoId, especialidad, fechaInicio, fechaFin } = c.req.query();

    const estadisticas = await interconsultaService.getEstadisticas({
      medicoId,
      especialidad,
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
 * GET /interconsultas/:id
 * Obtener una interconsulta por ID
 */
interconsulta.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const interconsultaData = await interconsultaService.getInterconsultaById(id);

    return c.json({
      success: true,
      data: interconsultaData,
    });
  } catch (error) {
    console.error('Error al obtener interconsulta:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al obtener interconsulta',
      },
      error.message === 'Interconsulta no encontrada' ? 404 : 500
    );
  }
});

/**
 * POST /interconsultas
 * Crear una nueva interconsulta
 */
interconsulta.post('/', async (c) => {
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
    if (!data.especialidadSolicitada) {
      return c.json({ success: false, error: 'especialidadSolicitada es requerida' }, 400);
    }
    if (!data.motivoConsulta) {
      return c.json({ success: false, error: 'motivoConsulta es requerido' }, 400);
    }

    const interconsultaCreada = await interconsultaService.crearInterconsulta(data, user.id);

    return c.json({
      success: true,
      message: 'Interconsulta creada exitosamente',
      data: interconsultaCreada,
    }, 201);
  } catch (error) {
    console.error('Error al crear interconsulta:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al crear interconsulta',
      },
      400
    );
  }
});

/**
 * POST /interconsultas/:id/asignar
 * Asignar un especialista a la interconsulta
 */
interconsulta.post('/:id/asignar', async (c) => {
  try {
    const { id } = c.req.param();
    const { medicoEspecialistaId } = await c.req.json();

    if (!medicoEspecialistaId) {
      return c.json(
        {
          success: false,
          error: 'medicoEspecialistaId es requerido',
        },
        400
      );
    }

    const interconsultaActualizada = await interconsultaService.asignarEspecialista(
      id,
      medicoEspecialistaId
    );

    return c.json({
      success: true,
      message: 'Especialista asignado exitosamente',
      data: interconsultaActualizada,
    });
  } catch (error) {
    console.error('Error al asignar especialista:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al asignar especialista',
      },
      400
    );
  }
});

/**
 * POST /interconsultas/:id/responder
 * Responder una interconsulta (especialista)
 */
interconsulta.post('/:id/responder', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const data = await c.req.json();

    // Validaciones
    if (!data.evaluacionEspecialista) {
      return c.json(
        {
          success: false,
          error: 'evaluacionEspecialista es requerida',
        },
        400
      );
    }

    const interconsultaRespondida = await interconsultaService.responderInterconsulta(
      id,
      data,
      user.id
    );

    return c.json({
      success: true,
      message: 'Interconsulta respondida exitosamente',
      data: interconsultaRespondida,
    });
  } catch (error) {
    console.error('Error al responder interconsulta:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al responder interconsulta',
      },
      400
    );
  }
});

/**
 * PUT /interconsultas/:id
 * Actualizar una interconsulta
 */
interconsulta.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const data = await c.req.json();

    const interconsultaActualizada = await interconsultaService.actualizarInterconsulta(
      id,
      data,
      user.id
    );

    return c.json({
      success: true,
      message: 'Interconsulta actualizada exitosamente',
      data: interconsultaActualizada,
    });
  } catch (error) {
    console.error('Error al actualizar interconsulta:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al actualizar interconsulta',
      },
        400
    );
  }
});

/**
 * DELETE /interconsultas/:id/cancelar
 * Cancelar una interconsulta
 */
interconsulta.delete('/:id/cancelar', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const interconsultaCancelada = await interconsultaService.cancelarInterconsulta(id, user.id);

    return c.json({
      success: true,
      message: 'Interconsulta cancelada exitosamente',
      data: interconsultaCancelada,
    });
  } catch (error) {
    console.error('Error al cancelar interconsulta:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Error al cancelar interconsulta',
      },
      400
    );
  }
});

module.exports = interconsulta;
