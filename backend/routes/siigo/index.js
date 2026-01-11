/**
 * Siigo Routes Index
 * Main entry point for all Siigo-related routes
 */
const { Hono } = require('hono');
const configRoutes = require('./config');
const catalogsRoutes = require('./catalogs');
const siigoService = require('../../services/siigo/siigo.service');
const { success, error } = require('../../utils/response');

const router = new Hono();

/**
 * GET /siigo/health
 * Public health check endpoint for monitoring
 * Does not require authentication
 */
router.get('/health', async (c) => {
  try {
    const health = siigoService.getHealthStatus();
    const status = health.initialized ? 'UP' : 'DOWN';

    const response = {
      status,
      service: 'siigo',
      timestamp: new Date().toISOString(),
      details: {
        connected: health.initialized,
        sdkLoaded: health.sdkLoaded,
        lastHealthCheck: health.lastHealthCheck,
        reconnectAttempts: health.reconnectAttempts
      }
    };

    // Return 503 if service is down, 200 if up
    const httpStatus = health.initialized ? 200 : 503;
    return c.json(response, httpStatus);
  } catch (err) {
    console.error('Error getting Siigo health:', err);
    return c.json({
      status: 'DOWN',
      service: 'siigo',
      timestamp: new Date().toISOString(),
      error: err.message
    }, 503);
  }
});

/**
 * GET /siigo/health/detailed
 * Detailed health check with sync statistics
 * Does not require authentication
 */
router.get('/health/detailed', async (c) => {
  try {
    const prisma = require('../../db/prisma');
    const health = siigoService.getHealthStatus();

    // Get sync statistics
    const [
      totalSynced,
      totalPending,
      totalErrors,
      recentErrors
    ] = await Promise.all([
      prisma.siigoSync.count({ where: { estado: 'sincronizado' } }),
      prisma.siigoSync.count({ where: { estado: 'pendiente' } }),
      prisma.siigoSync.count({ where: { estado: 'error' } }),
      prisma.siigoSync.findMany({
        where: { estado: 'error' },
        orderBy: { ultimaSync: 'desc' },
        take: 5,
        select: {
          entidad: true,
          entidadId: true,
          errorMessage: true,
          ultimaSync: true
        }
      })
    ]);

    const status = health.initialized ? 'UP' : 'DOWN';

    const response = {
      status,
      service: 'siigo',
      timestamp: new Date().toISOString(),
      connection: {
        connected: health.initialized,
        sdkLoaded: health.sdkLoaded,
        lastHealthCheck: health.lastHealthCheck,
        reconnectAttempts: health.reconnectAttempts
      },
      sync: {
        totalSynced,
        totalPending,
        totalErrors,
        recentErrors
      }
    };

    const httpStatus = health.initialized ? 200 : 503;
    return c.json(response, httpStatus);
  } catch (err) {
    console.error('Error getting detailed Siigo health:', err);
    return c.json({
      status: 'ERROR',
      service: 'siigo',
      timestamp: new Date().toISOString(),
      error: err.message
    }, 500);
  }
});

// Mount sub-routers
router.route('/config', configRoutes);
router.route('/catalogs', catalogsRoutes);

module.exports = router;
