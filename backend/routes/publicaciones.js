/**
 * Publicaciones Routes
 * Blog posts and health articles management
 */
const { Hono } = require('hono');
const publicacionService = require('../services/publicacion.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const publicaciones = new Hono();

publicaciones.use('*', authMiddleware);

// ==========================================
// CATEGORÍAS (must be before /:id routes)
// ==========================================

/**
 * GET /categorias/all - Listar todas las categorías
 */
publicaciones.get('/categorias/all', async (c) => {
  try {
    const result = await publicacionService.getAllCategorias();
    return c.json(success(result, 'Categorías obtenidas'));
  } catch (err) {
    console.error('Error getting categorias:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /categorias - Crear categoría
 */
publicaciones.post('/categorias', async (c) => {
  try {
    const body = await c.req.json();
    const result = await publicacionService.createCategoria(body);
    return c.json(success(result, 'Categoría creada'), 201);
  } catch (err) {
    console.error('Error creating categoria:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// PUBLICACIONES
// ==========================================

/**
 * GET /recomendaciones - Obtener recomendaciones basadas en diagnósticos
 * Query params: codigos (separados por coma)
 */
publicaciones.get('/recomendaciones', async (c) => {
  try {
    const codigos = c.req.query('codigos');
    if (!codigos) {
      return c.json(success([], 'Sin códigos'));
    }
    const listaCodigos = codigos.split(',');
    const result = await publicacionService.getRecomendaciones(listaCodigos);
    return c.json(success(result, 'Recomendaciones obtenidas'));
  } catch (err) {
    console.error('Error getting recomendaciones:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET / - Listar publicaciones
 */
publicaciones.get('/', async (c) => {
  try {
    const query = {
      search: c.req.query('search'),
      categoria: c.req.query('categoria'),
      estado: c.req.query('estado'),
      page: parseInt(c.req.query('page') || '1'),
      limit: parseInt(c.req.query('limit') || '20')
    };
    const result = await publicacionService.getAllPublicaciones(query);
    return c.json(paginated(result.data, result.meta));
  } catch (err) {
    console.error('Error listing publicaciones:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /:id - Obtener detalle de publicación
 */
publicaciones.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await publicacionService.getPublicacion(id);
    return c.json(success(result, 'Publicación obtenida'));
  } catch (err) {
    console.error('Error getting publicacion:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST / - Crear publicación
 */
publicaciones.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('user')?.id;
    const result = await publicacionService.createPublicacion(body, userId);
    return c.json(success(result, 'Publicación creada'), 201);
  } catch (err) {
    console.error('Error creating publicacion:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /:id - Actualizar publicación
 */
publicaciones.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await publicacionService.updatePublicacion(id, body);
    return c.json(success(result, 'Publicación actualizada'));
  } catch (err) {
    console.error('Error updating publicacion:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /:id - Eliminar publicación
 */
publicaciones.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await publicacionService.deletePublicacion(id);
    return c.json(success(null, 'Publicación eliminada'));
  } catch (err) {
    console.error('Error deleting publicacion:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = publicaciones;
