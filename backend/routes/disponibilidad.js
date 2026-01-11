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
 * @swagger
 * tags:
 *   name: Disponibilidad
 *   description: Consulta de disponibilidad de doctores
 */

/**
 * @swagger
 * /disponibilidad/{doctorId}:
 *   get:
 *     summary: Obtener disponibilidad diaria de un doctor
 *     tags: [Disponibilidad]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del doctor
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Fecha a consultar
 *     responses:
 *       200:
 *         description: Disponibilidad del doctor
 *       400:
 *         description: Fecha requerida
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /disponibilidad/{doctorId}/semana:
 *   get:
 *     summary: Obtener disponibilidad semanal de un doctor
 *     tags: [Disponibilidad]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del doctor
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio de la semana
 *     responses:
 *       200:
 *         description: Disponibilidad semanal
 *       500:
 *         description: Error del servidor
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
 * @swagger
 * /disponibilidad/validar:
 *   post:
 *     summary: Validar si un horario específico está disponible
 *     tags: [Disponibilidad]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *               - fecha
 *               - hora
 *             properties:
 *               doctor_id:
 *                 type: string
 *                 format: uuid
 *               fecha:
 *                 type: string
 *                 format: date
 *               hora:
 *                 type: string
 *               duracion_minutos:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       200:
 *         description: Horario disponible
 *       400:
 *         description: Horario no disponible
 *       500:
 *         description: Error del servidor
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
