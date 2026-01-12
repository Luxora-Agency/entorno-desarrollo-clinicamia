/**
 * Rutas para gestión de Solicitudes de Historia Clínica (Admin)
 */

const { Hono } = require('hono');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const solicitudHCService = require('../services/solicitudHC.service');

const solicitudesHC = new Hono();

// Todas las rutas requieren autenticación
solicitudesHC.use('/*', authMiddleware);

/**
 * GET /solicitudes-hc
 * Obtener todas las solicitudes (admin)
 */
solicitudesHC.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await solicitudHCService.getAll(query);
    return c.json(paginated(result.solicitudes, result.pagination));
  } catch (err) {
    console.error('Error fetching solicitudes:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /solicitudes-hc/stats
 * Obtener estadísticas de solicitudes
 */
solicitudesHC.get('/stats', async (c) => {
  try {
    const stats = await solicitudHCService.getStats();
    return c.json(success(stats));
  } catch (err) {
    console.error('Error fetching stats:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /solicitudes-hc/:id
 * Obtener una solicitud por ID
 */
solicitudesHC.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const solicitud = await solicitudHCService.getById(id);
    return c.json(success(solicitud));
  } catch (err) {
    console.error('Error fetching solicitud:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /solicitudes-hc/:id/estado
 * Actualizar estado de una solicitud
 */
solicitudesHC.put('/:id/estado', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const data = await c.req.json();

    // Map frontend estado to enum
    const estadoMap = {
      'Pendiente': 'PENDIENTE',
      'En Proceso': 'EN_PROCESO',
      'Lista': 'LISTA',
      'Entregada': 'ENTREGADA',
      'Rechazada': 'RECHAZADA',
    };

    const estado = estadoMap[data.estado] || data.estado;

    const solicitud = await solicitudHCService.updateEstado(id, {
      estado,
      notas: data.notas,
      archivoUrl: data.archivoUrl,
      procesadoPor: user.email,
    });

    return c.json(success(solicitud, 'Estado actualizado correctamente'));
  } catch (err) {
    console.error('Error updating solicitud:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = solicitudesHC;
