/**
 * Rutas de pacientes
 */
const { Hono } = require('hono');
const pacienteService = require('../services/paciente.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const pacientes = new Hono();

// Todas las rutas requieren autenticación
pacientes.use('*', authMiddleware);

/**
 * GET /pacientes/search - Búsqueda rápida de pacientes
 */
pacientes.get('/search', async (c) => {
  try {
    const { q } = c.req.query();
    const pacientes = await pacienteService.search(q);
    return c.json(success({ pacientes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pacientes - Obtener todos los pacientes
 */
pacientes.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await pacienteService.getAll(query);
    return c.json(paginated(result.pacientes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /pacientes/:id - Obtener un paciente por ID
 */
pacientes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const paciente = await pacienteService.getById(id);
    return c.json(success({ paciente }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /pacientes - Crear un paciente
 */
pacientes.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const data = await c.req.json();
    const paciente = await pacienteService.create(data);
    return c.json(success({ paciente }, 'Paciente creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /pacientes/:id - Actualizar un paciente
 */
pacientes.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const paciente = await pacienteService.update(id, data);
    return c.json(success({ paciente }, 'Paciente actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /pacientes/:id - Eliminar un paciente
 */
pacientes.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    await pacienteService.delete(id);
    return c.json(success(null, 'Paciente eliminado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = pacientes;
