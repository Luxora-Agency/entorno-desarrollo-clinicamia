const { Hono } = require('hono');
const service = require('../services/drogueria.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const app = new Hono();

app.use('*', async (c, next) => {
  console.log(`[Drogueria] Request: ${c.req.method} ${c.req.url}`);
  await next();
});

app.use('*', authMiddleware);

// ============ CAJA ============

app.post('/caja/abrir', async (c) => {
  try {
    const user = c.get('user');
    const { montoInicial } = await c.req.json();
    const result = await service.abrirCaja(user.id, montoInicial);
    return c.json(success(result, 'Caja abierta correctamente'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

app.post('/caja/cerrar/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const { montoFinal } = await c.req.json();
    const result = await service.cerrarCaja(id, montoFinal);
    return c.json(success(result, 'Caja cerrada correctamente'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

app.get('/caja/activa', async (c) => {
  try {
    const user = c.get('user');
    const result = await service.getCajaActiva(user.id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

app.get('/dashboard/stats', async (c) => {
  try {
    const result = await service.getStatsDashboard();
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============ PRODUCTOS ============

app.get('/productos', async (c) => {
  try {
    const query = c.req.query();
    const result = await service.getProductos(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

app.post('/productos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await service.upsertProducto(data);
    return c.json(success(result, 'Producto guardado en droguería'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

app.post('/productos/importar', async (c) => {
  try {
    const { productoIds } = await c.req.json();
    const result = await service.importarDesdeFarmacia(productoIds);
    return c.json(success(result, `${result.length} productos importados`));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

app.delete('/productos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await service.deleteProducto(id);
    return c.json(success(result, 'Producto eliminado de la droguería'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

// ============ VENTAS ============

app.post('/ventas', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const result = await service.registrarVenta(data, user.id);
    return c.json(success(result, 'Venta realizada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

app.get('/ventas', async (c) => {
  try {
    const query = c.req.query();
    const result = await service.getVentas(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

app.post('/ventas/:id/anular', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { motivo } = await c.req.json();
    const result = await service.anularVenta(id, motivo, user.id);
    return c.json(success(result, 'Venta anulada correctamente'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

module.exports = app;
