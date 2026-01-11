/**
 * Rutas de exámenes y procedimientos
 */
const { Hono } = require('hono');
const examenProcedimientoService = require('../services/examenProcedimiento.service');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const examenProcedimiento = new Hono();

// Todas las rutas requieren autenticación
examenProcedimiento.use('*', authMiddleware);

/**
 * GET /examenes-procedimientos/estadisticas - Obtener estadísticas
 */
examenProcedimiento.get('/estadisticas', async (c) => {
  try {
    const estadisticas = await examenProcedimientoService.getEstadisticas();
    return c.json(success(estadisticas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /examenes-procedimientos - Obtener todos los exámenes y procedimientos
 */
examenProcedimiento.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await examenProcedimientoService.getAll(query);
    return c.json(paginated(result.items, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /examenes-procedimientos/:id - Obtener un examen/procedimiento por ID
 */
examenProcedimiento.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const item = await examenProcedimientoService.getById(id);
    return c.json(success({ item }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /examenes-procedimientos - Crear un examen/procedimiento
 */
examenProcedimiento.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const item = await examenProcedimientoService.create(data);
    return c.json(success({ item }, `${data.tipo} creado exitosamente`), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /examenes-procedimientos/:id - Actualizar un examen/procedimiento
 */
examenProcedimiento.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const item = await examenProcedimientoService.update(id, data);
    return c.json(success({ item }, 'Examen/Procedimiento actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /examenes-procedimientos/:id - Eliminar un examen/procedimiento
 */
examenProcedimiento.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await examenProcedimientoService.delete(id);
    return c.json(success(null, 'Examen/Procedimiento eliminado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = examenProcedimiento;
