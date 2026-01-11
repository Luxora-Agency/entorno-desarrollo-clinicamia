const balanceService = require('../services/balanceLiquidos.service');
const { success, error } = require('../utils/response');

exports.create = async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = { ...body, registradoPor: user.id };
    const result = await balanceService.create(data);
    return c.json(success(result, 'Registro de líquidos creado'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
};

exports.getAll = async (c) => {
  try {
    const { page, limit, pacienteId, admisionId, fecha } = c.req.query();
    const result = await balanceService.getAll(
      { pacienteId, admisionId, fecha },
      { page, limit }
    );
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
};

exports.getBalance = async (c) => {
    try {
        const { admisionId } = c.req.param();
        const { hours } = c.req.query();
        const result = await balanceService.getBalance(admisionId, hours ? parseInt(hours) : 24);
        return c.json(success(result));
    } catch (err) {
        return c.json(error(err.message), 500);
    }
}