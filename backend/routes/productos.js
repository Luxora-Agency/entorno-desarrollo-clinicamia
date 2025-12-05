const { Hono } = require('hono');
const ProductoService = require('../services/producto.service');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const app = new Hono();

app.use('*', authMiddleware);

// GET /api/productos (con filtros y búsqueda)
app.get('/', async (c) => {
  try {
    const { activo, categoriaId, search } = c.req.query();
    const productos = await ProductoService.getAll({ activo, categoriaId, search });
    return c.json(success(productos));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// GET /api/productos/stats
app.get('/stats', async (c) => {
  try {
    const stats = await ProductoService.getStats();
    return c.json(success(stats));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// GET /api/productos/:id
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const producto = await ProductoService.getById(id);
    return c.json(success(producto));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// POST /api/productos
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const producto = await ProductoService.create(body);
    return c.json(success(producto), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// PUT /api/productos/:id
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const producto = await ProductoService.update(id, body);
    return c.json(success(producto));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// DELETE /api/productos/:id
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await ProductoService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = app;
