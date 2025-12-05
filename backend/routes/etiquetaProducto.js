const { Hono } = require('hono');
const EtiquetaProductoService = require('../services/etiquetaProducto.service');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const app = new Hono();

app.use('*', authMiddleware);

app.get('/', async (c) => {
  try {
    const etiquetas = await EtiquetaProductoService.getAll();
    return c.json(success(etiquetas));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const etiqueta = await EtiquetaProductoService.getById(id);
    return c.json(success(etiqueta));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const etiqueta = await EtiquetaProductoService.create(body);
    return c.json(success(etiqueta), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const etiqueta = await EtiquetaProductoService.update(id, body);
    return c.json(success(etiqueta));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await EtiquetaProductoService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = app;
