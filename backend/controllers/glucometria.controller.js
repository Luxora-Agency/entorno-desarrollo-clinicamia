const glucometriaService = require('../services/glucometria.service');
const { success, error } = require('../utils/response');

exports.create = async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = { ...body, registradoPor: user.id };
    const result = await glucometriaService.create(data);
    return c.json(success(result, 'Glucometría registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
};

exports.getAll = async (c) => {
  try {
    const { page, limit, pacienteId, admisionId, fechaDesde, fechaHasta } = c.req.query();
    const result = await glucometriaService.getAll(
      { pacienteId, admisionId, fechaDesde, fechaHasta },
      { page, limit }
    );
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
};

exports.getStats = async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const result = await glucometriaService.getStats(pacienteId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
};