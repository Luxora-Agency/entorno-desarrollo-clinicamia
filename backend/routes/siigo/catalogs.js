/**
 * Siigo Catalogs Routes
 * Access Siigo catalog data (taxes, payment types, document types, account groups)
 */
const { Hono } = require('hono');
const { authMiddleware } = require('../../middleware/auth');
const catalogsService = require('../../services/siigo/catalogs.siigo.service');
const { success, error } = require('../../utils/response');

const router = new Hono();

router.use('*', authMiddleware);

/**
 * GET /siigo/catalogs/taxes
 * Get available tax types
 */
router.get('/taxes', async (c) => {
  try {
    const taxes = await catalogsService.getTaxes();
    return c.json(success(taxes, 'Impuestos obtenidos'));
  } catch (err) {
    console.error('Error getting taxes:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /siigo/catalogs/payment-types
 * Get available payment types
 */
router.get('/payment-types', async (c) => {
  try {
    const paymentTypes = await catalogsService.getPaymentTypes();
    return c.json(success(paymentTypes, 'Tipos de pago obtenidos'));
  } catch (err) {
    console.error('Error getting payment types:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /siigo/catalogs/document-types
 * Get available document types
 */
router.get('/document-types', async (c) => {
  try {
    const documentTypes = await catalogsService.getDocumentTypes();
    return c.json(success(documentTypes, 'Tipos de documento obtenidos'));
  } catch (err) {
    console.error('Error getting document types:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /siigo/catalogs/account-groups
 * Get available account groups
 */
router.get('/account-groups', async (c) => {
  try {
    const accountGroups = await catalogsService.getAccountGroups();
    return c.json(success(accountGroups, 'Grupos contables obtenidos'));
  } catch (err) {
    console.error('Error getting account groups:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /siigo/catalogs/cost-centers
 * Get available cost centers
 */
router.get('/cost-centers', async (c) => {
  try {
    const costCenters = await catalogsService.getCostCenters();
    return c.json(success(costCenters, 'Centros de costo obtenidos'));
  } catch (err) {
    console.error('Error getting cost centers:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /siigo/catalogs/sync
 * Sync all catalogs from Siigo
 */
router.post('/sync', async (c) => {
  try {
    const results = await catalogsService.syncAllCatalogs();
    return c.json(success(results, 'Sincronización de catálogos completada'));
  } catch (err) {
    console.error('Error syncing catalogs:', err);
    return c.json(error(err.message), 500);
  }
});

module.exports = router;
