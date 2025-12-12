/**
 * Rutas de paquetes de hospitalización
 */
const { Hono } = require('hono');
const paqueteService = require('../services/paqueteHospitalizacion.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const paquetesHospitalizacion = new Hono();

// Todas las rutas requieren autenticación
paquetesHospitalizacion.use('*', authMiddleware);

/**
 * GET /paquetes-hospitalizacion - Obtener todos los paquetes
 */
paquetesHospitalizacion.get('/', async (c) => {
  try {
    const query = c.req.query();
    const paquetes = await paqueteService.getAll(query);
    return c.json(success({ paquetes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /paquetes-hospitalizacion/:id - Obtener un paquete por ID
 */
paquetesHospitalizacion.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const paquete = await paqueteService.getById(id);
    return c.json(success({ paquete }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /paquetes-hospitalizacion - Crear un nuevo paquete
 */
paquetesHospitalizacion.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const paquete = await paqueteService.create(body);
    return c.json(success({ paquete }, 'Paquete creado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /paquetes-hospitalizacion/:id - Actualizar un paquete
 */
paquetesHospitalizacion.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const paquete = await paqueteService.update(id, body);
    return c.json(success({ paquete }, 'Paquete actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /paquetes-hospitalizacion/:id - Eliminar un paquete
 */
paquetesHospitalizacion.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await paqueteService.delete(id);
    return c.json(success(null, 'Paquete eliminado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /paquetes-hospitalizacion/calcular - Calcular costo de hospitalización
 */
paquetesHospitalizacion.post('/calcular', async (c) => {
  try {
    const body = await c.req.json();
    const { tipo_unidad, fecha_ingreso, fecha_egreso } = body;
    
    if (!tipo_unidad || !fecha_ingreso) {
      return c.json(error('tipo_unidad y fecha_ingreso son requeridos'), 400);
    }
    
    const costo = await paqueteService.calcularCosto(tipo_unidad, fecha_ingreso, fecha_egreso);
    return c.json(success({ costo }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = paquetesHospitalizacion;
