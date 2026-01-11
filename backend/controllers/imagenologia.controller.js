const imagenologiaService = require('../services/imagenologia.service');
const { success, error } = require('../utils/response');

class ImagenologiaController {
  async create(c) {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      const data = {
        ...body,
        medicoSolicitanteId: user.id
      };
      const estudio = await imagenologiaService.create(data);
      return c.json(success(estudio, 'Estudio solicitado exitosamente'), 201);
    } catch (err) {
      return c.json(error(err.message), 500);
    }
  }

  async getAll(c) {
    try {
      const query = c.req.query();
      const result = await imagenologiaService.getAll(query);
      return c.json(success(result));
    } catch (err) {
      return c.json(error(err.message), 500);
    }
  }

  async getById(c) {
    try {
      const id = c.req.param('id');
      const estudio = await imagenologiaService.getById(id);
      return c.json(success(estudio));
    } catch (err) {
      return c.json(error(err.message), 500);
    }
  }

  async updateInforme(c) {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      const body = await c.req.json();
      const estudio = await imagenologiaService.updateInforme(id, body, user.id);
      return c.json(success(estudio, 'Informe guardado exitosamente'));
    } catch (err) {
      return c.json(error(err.message), 500);
    }
  }

  async updateEstado(c) {
    try {
      const id = c.req.param('id');
      const { estado, fechaProgramada } = await c.req.json();
      const estudio = await imagenologiaService.updateEstado(id, estado, fechaProgramada);
      return c.json(success(estudio, 'Estado actualizado exitosamente'));
    } catch (err) {
      return c.json(error(err.message), 500);
    }
  }

  async getEstadisticas(c) {
    try {
      const stats = await imagenologiaService.getEstadisticas();
      return c.json(success(stats));
    } catch (err) {
      return c.json(error(err.message), 500);
    }
  }
}

module.exports = new ImagenologiaController();