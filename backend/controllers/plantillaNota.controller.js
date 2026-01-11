const plantillaService = require('../services/plantillaNota.service');
const { success, error } = require('../utils/response');

exports.create = async (req, res) => {
  try {
    const data = { ...req.body, creadoPor: req.user.id };
    const result = await plantillaService.create(data);
    return success(res, result, 'Plantilla creada', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getAll = async (req, res) => {
  try {
    const { tipoNota, nombre } = req.query;
    const result = await plantillaService.getAll({ tipoNota, nombre });
    return success(res, result);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await plantillaService.update(id, req.body);
        return success(res, result, 'Plantilla actualizada');
    } catch (err) {
        return error(res, err.message, 500);
    }
}

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await plantillaService.delete(id);
        return success(res, null, 'Plantilla eliminada');
    } catch (err) {
        return error(res, err.message, 500);
    }
}
