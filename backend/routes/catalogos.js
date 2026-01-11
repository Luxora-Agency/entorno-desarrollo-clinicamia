/**
 * Rutas de catálogos oficiales (CUPS, CIE-11)
 */
const { Hono } = require('hono');
const catalogoService = require('../services/catalogo.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const catalogos = new Hono();

// Todas las rutas requieren autenticación
catalogos.use('*', authMiddleware);

/**
 * GET /catalogos/cups?query=... - Buscar códigos CUPS
 */
catalogos.get('/cups', async (c) => {
  try {
    const { query, limit } = c.req.query();
    const items = await catalogoService.searchCups({ query, limit });
    return c.json(success(items));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /catalogos/cie11?query=... - Buscar códigos CIE-11
 */
catalogos.get('/cie11', async (c) => {
  try {
    const { query, limit } = c.req.query();
    const items = await catalogoService.searchCie11({ query, limit });
    return c.json(success(items));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /catalogos/cie10?query=... - Buscar códigos CIE-10
 */
catalogos.get('/cie10', async (c) => {
  try {
    const { query, limit } = c.req.query();
    const items = await catalogoService.searchCie10({ query, limit });
    return c.json(success(items));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /catalogos/update - Actualizar catálogos (Admin)
 */
catalogos.post('/update', async (c) => {
  try {
    const { tipo, data } = await c.req.json();
    const result = await catalogoService.updateCatalogos(tipo, data);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

module.exports = catalogos;
