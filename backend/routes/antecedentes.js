/**
 * Rutas para antecedentes médicos estructurados
 */
const { Hono } = require('hono');
const antecedenteService = require('../services/antecedente.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const antecedentes = new Hono();

// Todas las rutas requieren autenticación
antecedentes.use('*', authMiddleware);

// ================================
// GET ALL BY PACIENTE
// ================================
antecedentes.get('/paciente/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await antecedenteService.getAllByPaciente(pacienteId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ================================
// PATOLÓGICOS
// ================================
antecedentes.get('/patologicos/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await antecedenteService.getPatologicos(pacienteId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

antecedentes.post('/patologicos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await antecedenteService.createPatologico(data);
    return c.json(success(result, 'Antecedente patológico creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

antecedentes.put('/patologicos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const result = await antecedenteService.updatePatologico(id, data);
    return c.json(success(result, 'Antecedente patológico actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

antecedentes.delete('/patologicos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await antecedenteService.deletePatologico(id);
    return c.json(success(null, 'Antecedente patológico eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ================================
// QUIRÚRGICOS
// ================================
antecedentes.get('/quirurgicos/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await antecedenteService.getQuirurgicos(pacienteId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

antecedentes.post('/quirurgicos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await antecedenteService.createQuirurgico(data);
    return c.json(success(result, 'Antecedente quirúrgico creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

antecedentes.put('/quirurgicos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const result = await antecedenteService.updateQuirurgico(id, data);
    return c.json(success(result, 'Antecedente quirúrgico actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

antecedentes.delete('/quirurgicos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await antecedenteService.deleteQuirurgico(id);
    return c.json(success(null, 'Antecedente quirúrgico eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ================================
// ALÉRGICOS
// ================================
antecedentes.get('/alergicos/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await antecedenteService.getAlergicos(pacienteId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

antecedentes.post('/alergicos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await antecedenteService.createAlergico(data);
    return c.json(success(result, 'Antecedente alérgico creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

antecedentes.put('/alergicos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const result = await antecedenteService.updateAlergico(id, data);
    return c.json(success(result, 'Antecedente alérgico actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

antecedentes.delete('/alergicos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await antecedenteService.deleteAlergico(id);
    return c.json(success(null, 'Antecedente alérgico eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ================================
// FAMILIARES
// ================================
antecedentes.get('/familiares/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await antecedenteService.getFamiliares(pacienteId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

antecedentes.post('/familiares', async (c) => {
  try {
    const data = await c.req.json();
    const result = await antecedenteService.createFamiliar(data);
    return c.json(success(result, 'Antecedente familiar creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

antecedentes.put('/familiares/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const result = await antecedenteService.updateFamiliar(id, data);
    return c.json(success(result, 'Antecedente familiar actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

antecedentes.delete('/familiares/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await antecedenteService.deleteFamiliar(id);
    return c.json(success(null, 'Antecedente familiar eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ================================
// FARMACOLÓGICOS
// ================================
antecedentes.get('/farmacologicos/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await antecedenteService.getFarmacologicos(pacienteId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

antecedentes.post('/farmacologicos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await antecedenteService.createFarmacologico(data);
    return c.json(success(result, 'Antecedente farmacológico creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

antecedentes.put('/farmacologicos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const result = await antecedenteService.updateFarmacologico(id, data);
    return c.json(success(result, 'Antecedente farmacológico actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

antecedentes.delete('/farmacologicos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await antecedenteService.deleteFarmacologico(id);
    return c.json(success(null, 'Antecedente farmacológico eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ================================
// GINECO-OBSTÉTRICOS
// ================================
antecedentes.get('/gineco-obstetrico/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await antecedenteService.getGinecoObstetrico(pacienteId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

antecedentes.put('/gineco-obstetrico/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await c.req.json();
    const result = await antecedenteService.upsertGinecoObstetrico(pacienteId, data);
    return c.json(success(result, 'Antecedentes gineco-obstétricos actualizados'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

module.exports = antecedentes;
