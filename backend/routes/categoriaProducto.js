const { Hono } = require('hono');
const CategoriaProductoService = require('../services/categoriaProducto.service');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const app = new Hono();

// Aplicar autenticación a todas las rutas
app.use('*', authMiddleware);

// GET /api/categorias-productos
app.get('/', async (c) => {
  try {
    const categorias = await CategoriaProductoService.getAll();
    return c.json(success(categorias));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// GET /api/categorias-productos/:id
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const categoria = await CategoriaProductoService.getById(id);
    return c.json(success(categoria));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// POST /api/categorias-productos
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const categoria = await CategoriaProductoService.create(body);
    return c.json(success(categoria), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// PUT /api/categorias-productos/:id
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const categoria = await CategoriaProductoService.update(id, body);
    return c.json(success(categoria));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// DELETE /api/categorias-productos/:id
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await CategoriaProductoService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = app;
