const { Hono } = require('hono');
const doctorService = require('../services/doctor.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

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
    return c.json({ success: true, data: result.doctores, pagination: result.pagination });
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Obtener doctor por ID
doctores.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const doctor = await doctorService.obtenerPorId(id);
    return c.json(success({ doctor }));
  } catch (err) {
    return c.json(error(err.message), 404);
  }
});

// Crear doctor
doctores.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const doctor = await doctorService.crear(body);
    return c.json(success({ doctor }, 'Doctor creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

// Actualizar doctor
doctores.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const doctor = await doctorService.actualizar(id, body);
    return c.json(success({ doctor }, 'Doctor actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

// Eliminar doctor
doctores.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await doctorService.eliminar(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

module.exports = doctores;
