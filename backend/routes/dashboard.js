const { Hono } = require('hono');
const dashboardService = require('../services/dashboard.service');
const { authMiddleware } = require('../middleware/auth');

const app = new Hono();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Estadísticas generales del sistema
 */

// Public test route
app.get('/test', (c) => {
  return c.json({ message: 'Dashboard route is working' });
});

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas generales para el dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Periodo de tiempo
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio personalizada
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin personalizada
 *     responses:
 *       200:
 *         description: Estadísticas del dashboard
 *       500:
 *         description: Error del servidor
 */
app.get('/stats', authMiddleware, async (c) => {
  try {
    const period = c.req.query('period') || 'month';
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    
    const stats = await dashboardService.getDashboardStats(period, startDate, endDate);
    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return c.json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard'
    }, 500);
  }
});

module.exports = app;
