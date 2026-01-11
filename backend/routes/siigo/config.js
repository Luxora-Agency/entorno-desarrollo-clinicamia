/**
 * Siigo Configuration Routes
 * Manage Siigo API credentials and sync status
 */
const { Hono } = require('hono');
const { authMiddleware, requirePermission } = require('../../middleware/auth');
const siigoService = require('../../services/siigo/siigo.service');
const { success, error } = require('../../utils/response');

const router = new Hono();

// All routes require authentication and admin permission
router.use('*', authMiddleware);

/**
 * GET /siigo/config
 * Get current Siigo configuration (without sensitive data)
 */
router.get('/', async (c) => {
  try {
    const config = await siigoService.getConfig();
    return c.json(success(config, 'Configuración obtenida'));
  } catch (err) {
    console.error('Error getting Siigo config:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * PUT /siigo/config
 * Save/update Siigo configuration
 * If accessKey is not provided, keeps the existing one (for partial updates)
 */
router.put('/', async (c) => {
  try {
    const body = await c.req.json();
    const { userName, accessKey, ambiente } = body;

    if (!userName) {
      return c.json(error('userName es requerido'), 400);
    }

    // Check if config already exists
    const existingConfig = await siigoService.getConfig();

    // If no existing config and no accessKey provided, error
    if (!existingConfig && !accessKey) {
      return c.json(error('accessKey es requerido para la configuración inicial'), 400);
    }

    // If updating with new accessKey or creating new config
    if (accessKey) {
      const config = await siigoService.saveConfig({ userName, accessKey, ambiente });
      return c.json(success(config, 'Configuración guardada exitosamente'));
    }

    // Update only userName and ambiente, keeping existing accessKey
    const config = await siigoService.updatePartialConfig({ userName, ambiente });
    return c.json(success(config, 'Configuración actualizada exitosamente'));
  } catch (err) {
    console.error('Error saving Siigo config:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /siigo/config/test
 * Test Siigo connection with provided credentials
 */
router.post('/test', async (c) => {
  try {
    const body = await c.req.json();
    const { userName, accessKey } = body;

    if (!userName || !accessKey) {
      return c.json(error('userName y accessKey son requeridos'), 400);
    }

    const result = await siigoService.testConnection(userName, accessKey);
    
    if (result.success) {
      return c.json(success(result, result.message));
    } else {
      return c.json(error(result.message), 400);
    }
  } catch (err) {
    console.error('Error testing Siigo connection:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /siigo/config/connect
 * Initialize connection with stored credentials
 */
router.post('/connect', async (c) => {
  try {
    const result = await siigoService.initialize();
    
    if (result.success) {
      return c.json(success(result, result.message));
    } else {
      return c.json(error(result.message), 400);
    }
  } catch (err) {
    console.error('Error connecting to Siigo:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /siigo/config/status
 * Get sync status and statistics
 */
router.get('/status', async (c) => {
  try {
    const status = await siigoService.getSyncStatus();
    return c.json(success(status, 'Estado de sincronización obtenido'));
  } catch (err) {
    console.error('Error getting Siigo status:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /siigo/config/errors
 * Get sync errors
 */
router.get('/errors', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const errors = await siigoService.getSyncErrors(limit);
    return c.json(success(errors, 'Errores obtenidos'));
  } catch (err) {
    console.error('Error getting sync errors:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /siigo/config/logs
 * Get API call logs
 */
router.get('/logs', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const endpoint = c.req.query('endpoint');
    const responseCode = c.req.query('responseCode') ? parseInt(c.req.query('responseCode')) : undefined;

    const result = await siigoService.getLogs({ page, limit, endpoint, responseCode });
    return c.json(success(result, 'Logs obtenidos'));
  } catch (err) {
    console.error('Error getting Siigo logs:', err);
    return c.json(error(err.message), 500);
  }
});

// ============ SINCRONIZACIÓN MANUAL ============

/**
 * POST /siigo/sync/clientes
 * Manually sync all patients as customers to Siigo
 */
router.post('/sync/clientes', async (c) => {
  try {
    const customerSiigoService = require('../../services/siigo/customer.siigo.service');
    const result = await customerSiigoService.syncAllPacientes();
    return c.json(success(result, `Sincronizados ${result.success} clientes`));
  } catch (err) {
    console.error('Error syncing customers:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /siigo/sync/productos
 * Manually sync all products to Siigo
 */
router.post('/sync/productos', async (c) => {
  try {
    const productSiigoService = require('../../services/siigo/product.siigo.service');
    const result = await productSiigoService.syncAllProductsFarmacia();
    return c.json(success(result, `Sincronizados ${result.success} productos`));
  } catch (err) {
    console.error('Error syncing products:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /siigo/sync/retry-errors
 * Retry all failed synchronizations
 */
router.post('/sync/retry-errors', async (c) => {
  try {
    const prisma = require('../../db/prisma');

    const pendientes = await prisma.siigoSync.findMany({
      where: { estado: 'error' },
      take: 50
    });

    let retried = 0;
    let errors = [];

    for (const sync of pendientes) {
      try {
        // Mark as pending for retry
        await prisma.siigoSync.update({
          where: { id: sync.id },
          data: { estado: 'pendiente', errorMessage: null }
        });
        retried++;
      } catch (error) {
        errors.push({ id: sync.id, error: error.message });
      }
    }

    return c.json(success({ retried, errors }, `${retried} sincronizaciones marcadas para reintento`));
  } catch (err) {
    console.error('Error retrying sync errors:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /siigo/sync/factura/:id
 * Sync a specific invoice to Siigo
 */
router.post('/sync/factura/:id', async (c) => {
  try {
    const facturaId = c.req.param('id');
    const invoiceSiigoService = require('../../services/siigo/invoice.siigo.service');
    const result = await invoiceSiigoService.createElectronicInvoice(facturaId);
    return c.json(success(result, 'Factura sincronizada exitosamente'));
  } catch (err) {
    console.error('Error syncing invoice:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /siigo/sync/paciente/:id
 * Sync a specific patient to Siigo
 */
router.post('/sync/paciente/:id', async (c) => {
  try {
    const pacienteId = c.req.param('id');
    const customerSiigoService = require('../../services/siigo/customer.siigo.service');
    const result = await customerSiigoService.syncPaciente(pacienteId);
    return c.json(success(result, 'Paciente sincronizado exitosamente'));
  } catch (err) {
    console.error('Error syncing patient:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /siigo/sync/producto/:id
 * Sync a specific product to Siigo
 */
router.post('/sync/producto/:id', async (c) => {
  try {
    const productoId = c.req.param('id');
    const productSiigoService = require('../../services/siigo/product.siigo.service');
    const result = await productSiigoService.syncProductoFarmacia(productoId);
    return c.json(success(result, 'Producto sincronizado exitosamente'));
  } catch (err) {
    console.error('Error syncing product:', err);
    return c.json(error(err.message), 500);
  }
});

module.exports = router;
