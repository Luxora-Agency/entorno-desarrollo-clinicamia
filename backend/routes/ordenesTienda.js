/**
 * Rutas de administración de Órdenes de Tienda
 */

const { Hono } = require('hono');
const ordenTiendaService = require('../services/ordenTienda.service');
const { success, error, paginated } = require('../utils/response');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');

const router = new Hono();

// Todas las rutas requieren autenticación y permiso de farmacia/productos
router.use('*', authMiddleware, permissionMiddleware('productos'));

/**
 * GET /ordenes-tienda/stats
 * Estadísticas de órdenes (must be before /:id)
 */
router.get('/stats', async (c) => {
  try {
    const stats = await ordenTiendaService.getStats();
    return c.json(success(stats, 'Estadísticas obtenidas'));
  } catch (err) {
    console.error('Error obteniendo estadísticas:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /ordenes-tienda
 * Listar todas las órdenes con filtros y paginación
 */
router.get('/', async (c) => {
  try {
    const page = c.req.query('page');
    const limit = c.req.query('limit');
    const estado = c.req.query('estado');
    const search = c.req.query('search');
    const fechaDesde = c.req.query('fechaDesde');
    const fechaHasta = c.req.query('fechaHasta');

    const result = await ordenTiendaService.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      estado,
      search,
      fechaDesde,
      fechaHasta,
    });

    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    console.error('Error listando órdenes:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /ordenes-tienda/:id
 * Obtener una orden por ID o número
 */
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const orden = await ordenTiendaService.getById(id);
    return c.json(success(orden, 'Orden encontrada'));
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return c.json(error(err.message), 404);
    }
    console.error('Error obteniendo orden:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * PUT /ordenes-tienda/:id/estado
 * Actualizar estado de una orden
 */
router.put('/:id/estado', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const { estado, comentario, ...datos } = await c.req.json();

    if (!estado) {
      return c.json(error('Estado es requerido'), 400);
    }

    // Obtener IP del cliente para auditoría
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    const orden = await ordenTiendaService.updateEstado(id, estado, user, {
      ...datos,
      comentario,
      ipAddress,
    });
    return c.json(success(orden, `Estado actualizado a ${estado}`));
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return c.json(error(err.message), 404);
    }
    if (err.name === 'ValidationError') {
      return c.json(error(err.message), 400);
    }
    console.error('Error actualizando estado:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /ordenes-tienda/:id/procesar
 * Marcar una orden como en proceso (descuenta stock)
 */
router.post('/:id/procesar', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const { comentario } = await c.req.json().catch(() => ({}));

    const orden = await ordenTiendaService.marcarProcesando(id, user, comentario);
    return c.json(success(orden, 'Orden marcada como en proceso'));
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return c.json(error(err.message), 404);
    }
    if (err.name === 'ValidationError') {
      return c.json(error(err.message), 400);
    }
    console.error('Error procesando orden:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /ordenes-tienda/:id/enviar
 * Marcar una orden como enviada
 */
router.post('/:id/enviar', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const datosEnvio = await c.req.json();

    const orden = await ordenTiendaService.marcarEnviado(id, user, datosEnvio);
    return c.json(success(orden, 'Orden marcada como enviada'));
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return c.json(error(err.message), 404);
    }
    if (err.name === 'ValidationError') {
      return c.json(error(err.message), 400);
    }
    console.error('Error enviando orden:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /ordenes-tienda/:id/entregar
 * Marcar una orden como entregada
 */
router.post('/:id/entregar', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const { comentario } = await c.req.json().catch(() => ({}));

    const orden = await ordenTiendaService.marcarEntregado(id, user, comentario);
    return c.json(success(orden, 'Orden marcada como entregada'));
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return c.json(error(err.message), 404);
    }
    if (err.name === 'ValidationError') {
      return c.json(error(err.message), 400);
    }
    console.error('Error entregando orden:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * PUT /ordenes-tienda/:id/envio
 * Actualizar información de envío
 */
router.put('/:id/envio', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const datosEnvio = await c.req.json();
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    const orden = await ordenTiendaService.updateEnvio(id, { ...datosEnvio, ipAddress }, user);
    return c.json(success(orden, 'Información de envío actualizada'));
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return c.json(error(err.message), 404);
    }
    console.error('Error actualizando envío:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /ordenes-tienda/:id/notas
 * Agregar nota interna
 */
router.post('/:id/notas', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const { nota } = await c.req.json();

    if (!nota || !nota.trim()) {
      return c.json(error('Nota es requerida'), 400);
    }

    const orden = await ordenTiendaService.addNotaInterna(id, nota, user);
    return c.json(success(orden, 'Nota agregada'));
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return c.json(error(err.message), 404);
    }
    console.error('Error agregando nota:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /ordenes-tienda/:id/cancelar
 * Cancelar una orden
 */
router.post('/:id/cancelar', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const { motivo } = await c.req.json();

    if (!motivo || !motivo.trim()) {
      return c.json(error('Motivo de cancelación es requerido'), 400);
    }

    const orden = await ordenTiendaService.cancelar(id, motivo, user);
    return c.json(success(orden, 'Orden cancelada'));
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return c.json(error(err.message), 404);
    }
    if (err.name === 'ValidationError') {
      return c.json(error(err.message), 400);
    }
    console.error('Error cancelando orden:', err);
    return c.json(error(err.message), 500);
  }
});

module.exports = router;
