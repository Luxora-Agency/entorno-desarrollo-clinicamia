/**
 * Rutas de Agenda - Para gestión de bloques horarios
 */
const { Hono } = require('hono');
const agendaService = require('../services/agenda.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const agenda = new Hono();

// Autenticación para todas las rutas
agenda.use('*', authMiddleware);

// Verificación de permisos (solo recepcionistas, admins y superadmins)
agenda.use('*', permissionMiddleware('citas'));

/**
 * @swagger
 * tags:
 *   name: Agenda
 *   description: Gestión de agenda y disponibilidad de bloques
 */

/**
 * @swagger
 * /agenda/bloques/{doctorId}:
 *   get:
 *     summary: Obtener bloques horarios de un doctor
 *     tags: [Agenda]
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
 *         description: Fecha para consultar (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de bloques horarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     bloques:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           hora:
 *                             type: string
 *                           disponible:
 *                             type: boolean
 *       400:
 *         description: Fecha requerida
 *       500:
 *         description: Error del servidor
 */
agenda.get('/bloques/:doctorId', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const { fecha } = c.req.query();

    if (!fecha) {
      return c.json(error('Fecha es requerida'), 400);
    }

    const bloques = await agendaService.generarBloques(doctorId, fecha);
    return c.json(success({ bloques }));
  } catch (err) {
    console.error('[ERROR Agenda] Fallo al generar bloques:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /agenda/citas:
 *   get:
 *     summary: Obtener citas filtradas para agenda
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Fecha de las citas
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por doctor
 *     responses:
 *       200:
 *         description: Lista de citas
 *       400:
 *         description: Fecha requerida
 *       500:
 *         description: Error del servidor
 */
agenda.get('/citas', async (c) => {
  try {
    const { fecha, doctorId } = c.req.query();

    if (!fecha) {
      return c.json(error('Fecha es requerida'), 400);
    }

    const citas = await agendaService.obtenerCitasPorFiltros(fecha, doctorId);
    return c.json(success({ citas, total: citas.length }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Checksum endpoint for sync
agenda.get('/checksum', async (c) => {
    try {
        const { doctorId, startDate, endDate } = c.req.query();
        if (!doctorId) return c.json(error('doctorId required'), 400);
        
        // Use citaService for checksum logic as it holds the core schedule data
        const citaService = require('../services/cita.service');
        const checksumData = await citaService.getScheduleChecksum(doctorId, startDate, endDate);
        
        return c.json(success(checksumData));
    } catch (err) {
        return c.json(error(err.message), err.statusCode || 500);
    }
});

/**
 * @swagger
 * /agenda/doctores:
 *   get:
 *     summary: Obtener lista de doctores activos para agenda
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de doctores activos
 *       500:
 *         description: Error del servidor
 */
agenda.get('/doctores', async (c) => {
  try {
    const doctores = await agendaService.obtenerDoctoresActivos();
    return c.json(success({ doctores }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = agenda;
