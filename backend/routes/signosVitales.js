/**
 * Rutas de Signos Vitales
 */
const { Hono } = require('hono');
const signosVitalesService = require('../services/signosVitales.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const signosVitales = new Hono();

// Todas las rutas requieren autenticación
signosVitales.use('*', authMiddleware);

/**
 * GET /signos-vitales - Obtener todos los signos vitales
 */
signosVitales.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await signosVitalesService.getAll(query);
    return c.json(paginated(result.signos, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /signos-vitales - Registrar signos vitales
 */
signosVitales.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const signoVital = await signosVitalesService.create(body, user.id, user, ipOrigen);
    return c.json(success({ signoVital }, 'Signos vitales registrados correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /signos-vitales/grafica/:paciente_id - Obtener gráfica de evolución
 */
signosVitales.get('/grafica/:paciente_id', async (c) => {
  try {
    const { paciente_id } = c.req.param();
    const { tipo = 'temperatura', dias = '7' } = c.req.query();
    
    const datos = await signosVitalesService.getGraficaEvolucion(
      paciente_id,
      tipo,
      parseInt(dias)
    );
    
    return c.json(success({ datos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = signosVitales;
