const transfusionService = require('../services/transfusion.service');
const { success, error } = require('../utils/response');

exports.create = async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = { ...body, registradoPor: user.id };
    const result = await transfusionService.create(data);
    return c.json(success(result, 'Transfusión registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
};

exports.getAll = async (c) => {
  try {
    const { page, limit, pacienteId, admisionId } = c.req.query();
    const result = await transfusionService.getAll(
      { pacienteId, admisionId },
      { page, limit }
    );
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
};

exports.verify = async (c) => {
    try {
        const user = c.get('user');
        const { id } = c.req.param();
        const result = await transfusionService.verify(id, user.id);
        return c.json(success(result, 'Verificación de doble chequeo registrada'));
    } catch (err) {
        return c.json(error(err.message), 500);
    }
}