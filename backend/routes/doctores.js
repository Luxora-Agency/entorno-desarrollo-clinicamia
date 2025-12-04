const { Hono } = require('hono');
const doctorService = require('../services/doctor.service');
const { authMiddleware } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');

const doctores = new Hono();

// Aplicar middleware de autenticación
doctores.use('/*', authMiddleware);

// Listar doctores
doctores.get('/', async (c) => {
  try {
    const { search = '', limit = '50', page = '1' } = c.req.query();
    const result = await doctorService.listar({
      search,
      limit: parseInt(limit),
      page: parseInt(page),
    });
    return c.json(successResponse(result.doctores, 'Doctores obtenidos exitosamente', result.pagination));
  } catch (error) {
    return c.json(errorResponse(error.message), 500);
  }
});

// Obtener doctor por ID
doctores.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const doctor = await doctorService.obtenerPorId(id);
    return c.json(successResponse({ doctor }, 'Doctor obtenido exitosamente'));
  } catch (error) {
    return c.json(errorResponse(error.message), 404);
  }
});

// Crear doctor
doctores.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const doctor = await doctorService.crear(body);
    return c.json(successResponse({ doctor }, 'Doctor creado exitosamente'), 201);
  } catch (error) {
    return c.json(errorResponse(error.message), 400);
  }
});

// Actualizar doctor
doctores.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const doctor = await doctorService.actualizar(id, body);
    return c.json(successResponse({ doctor }, 'Doctor actualizado exitosamente'));
  } catch (error) {
    return c.json(errorResponse(error.message), 400);
  }
});

// Eliminar doctor
doctores.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await doctorService.eliminar(id);
    return c.json(successResponse(result, result.message));
  } catch (error) {
    return c.json(errorResponse(error.message), 400);
  }
});

module.exports = doctores;
