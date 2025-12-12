/**
 * Rutas de Diagnósticos HCE
 */
const { Hono } = require('hono');
const diagnosticoService = require('../services/diagnosticoHCE.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const diagnosticos = new Hono();

// Todas las rutas requieren autenticación
diagnosticos.use('*', authMiddleware);

/**
 * GET /diagnosticos - Obtener todos los diagnósticos
 */
diagnosticos.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await diagnosticoService.getAll(query);
    return c.json(paginated(result.diagnosticos, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /diagnosticos/:id - Obtener un diagnóstico por ID
 */
diagnosticos.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const diagnostico = await diagnosticoService.getById(id);
    return c.json(success({ diagnostico }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /diagnosticos/principal/:paciente_id - Obtener diagnóstico principal activo
 */
diagnosticos.get('/principal/:paciente_id', async (c) => {
  try {
    const { paciente_id } = c.req.param();
    const diagnostico = await diagnosticoService.getDiagnosticoPrincipal(paciente_id);
    return c.json(success({ diagnostico }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /diagnosticos - Crear nuevo diagnóstico
 */
diagnosticos.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const diagnostico = await diagnosticoService.create(body, user.id, user, ipOrigen);
    return c.json(success({ diagnostico }, 'Diagnóstico registrado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /diagnosticos/:id - Actualizar diagnóstico
 */
diagnosticos.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const diagnostico = await diagnosticoService.update(id, body, user.id, user, ipOrigen);
    return c.json(success({ diagnostico }, 'Diagnóstico actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = diagnosticos;
