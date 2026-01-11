/**
 * Rutas de categorías de exámenes
 */
const { Hono } = require('hono');
const categoriaExamenService = require('../services/categoriaExamen.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const categoriaExamen = new Hono();

// Todas las rutas requieren autenticación
categoriaExamen.use('*', authMiddleware);

/**
 * GET /categorias-examenes/estadisticas - Obtener estadísticas
 */
categoriaExamen.get('/estadisticas', async (c) => {
  try {
    const estadisticas = await categoriaExamenService.getEstadisticas();
    return c.json(success(estadisticas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /categorias-examenes - Obtener todas las categorías
 */
categoriaExamen.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await categoriaExamenService.getAll(query);
    return c.json(paginated(result.categorias, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /categorias-examenes/:id - Obtener una categoría por ID
 */
categoriaExamen.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const categoria = await categoriaExamenService.getById(id);
    return c.json(success({ categoria }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /categorias-examenes - Crear una categoría
 */
categoriaExamen.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const categoria = await categoriaExamenService.create(data);
    return c.json(success({ categoria }, 'Categoría creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /categorias-examenes/:id - Actualizar una categoría
 */
categoriaExamen.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const categoria = await categoriaExamenService.update(id, data);
    return c.json(success({ categoria }, 'Categoría actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /categorias-examenes/:id - Eliminar una categoría
 */
categoriaExamen.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await categoriaExamenService.delete(id);
    return c.json(success(null, 'Categoría eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = categoriaExamen;
