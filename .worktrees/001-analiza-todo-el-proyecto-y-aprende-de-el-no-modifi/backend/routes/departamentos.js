/**
 * Rutas de departamentos
 */
const { Hono } = require('hono');
const departamentoService = require('../services/departamento.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const departamentos = new Hono();

// Todas las rutas requieren autenticación
departamentos.use('*', authMiddleware);

/**
 * GET /departamentos - Obtener todos los departamentos
 */
departamentos.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await departamentoService.getAll(query);
    return c.json(paginated(result.departamentos, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /departamentos/:id - Obtener un departamento por ID
 */
departamentos.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const departamento = await departamentoService.getById(id);
    return c.json(success({ departamento }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /departamentos - Crear un departamento
 */
departamentos.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const data = await c.req.json();
    const departamento = await departamentoService.create(data);
    return c.json(success({ departamento }, 'Departamento creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /departamentos/:id - Actualizar un departamento
 */
departamentos.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const departamento = await departamentoService.update(id, data);
    return c.json(success({ departamento }, 'Departamento actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /departamentos/:id - Eliminar un departamento
 */
departamentos.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    await departamentoService.delete(id);
    return c.json(success(null, 'Departamento eliminado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = departamentos;
