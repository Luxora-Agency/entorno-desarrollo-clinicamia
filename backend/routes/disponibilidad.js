/**
 * Rutas para disponibilidad de doctores
 */
const { Hono } = require('hono');
const disponibilidadService = require('../services/disponibilidad.service');
const { authMiddleware } = require('../middleware/auth');

const disponibilidad = new Hono();

// Aplicar autenticación
disponibilidad.use('/*', authMiddleware);

/**
 * GET /disponibilidad/:doctorId - Obtener disponibilidad de un doctor para una fecha
 */
disponibilidad.get('/:doctorId', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const { fecha } = c.req.query();

    if (!fecha) {
      return c.json(
        {
          success: false,
          message: 'El parámetro fecha es requerido (formato: YYYY-MM-DD)',
        },
        400
      );
    }

    const result = await disponibilidadService.getDisponibilidad(doctorId, fecha);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    return c.json(
      {
        success: false,
        message: error.message || 'Error al obtener disponibilidad',
      },
      status
    );
  }
});

/**
 * GET /disponibilidad/:doctorId/semana - Obtener disponibilidad de 7 días
 */
disponibilidad.get('/:doctorId/semana', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const { fecha_inicio } = c.req.query();

    const fechaInicio = fecha_inicio || new Date().toISOString().split('T')[0];

    const result = await disponibilidadService.getDisponibilidadSemana(doctorId, fechaInicio);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error al obtener disponibilidad semanal:', error);
    return c.json(
      {
        success: false,
        message: error.message || 'Error al obtener disponibilidad semanal',
      },
      500
    );
  }
});

/**
 * POST /disponibilidad/validar - Validar si una hora está disponible
 */
disponibilidad.post('/validar', async (c) => {
  try {
    const { doctor_id, fecha, hora, duracion_minutos } = await c.req.json();

    if (!doctor_id || !fecha || !hora) {
      return c.json(
        {
          success: false,
          message: 'Los campos doctor_id, fecha y hora son requeridos',
        },
        400
      );
    }

    await disponibilidadService.validarDisponibilidad(
      doctor_id,
      fecha,
      hora,
      duracion_minutos || 30
    );

    return c.json({
      success: true,
      message: 'Horario disponible',
      disponible: true,
    });
  } catch (error) {
    console.error('Error al validar disponibilidad:', error);
    
    if (error.message.includes('no está disponible') || error.message.includes('no tiene horarios')) {
      return c.json(
        {
          success: false,
          message: error.message,
          disponible: false,
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        message: error.message || 'Error al validar disponibilidad',
      },
      500
    );
  }
});

module.exports = disponibilidad;
