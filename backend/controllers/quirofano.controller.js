const quirofanoService = require('../services/quirofano.service');
const { success, error } = require('../utils/response');

class QuirofanoController {
  async create(c) {
    try {
      const body = await c.req.json();
      const quirofano = await quirofanoService.createQuirofano(body);
      return c.json(success(quirofano, 'Quirófano creado exitosamente'), 201);
    } catch (err) {
      return c.json(error(err.message), err.statusCode || 500);
    }
  }

  async getAll(c) {
    try {
      const query = c.req.query();
      const result = await quirofanoService.getQuirofanos(query);
      return c.json(success(result));
    } catch (err) {
      return c.json(error(err.message), err.statusCode || 500);
    }
  }

  async getById(c) {
    try {
      const id = c.req.param('id');
      const quirofano = await quirofanoService.getQuirofanoById(id);
      return c.json(success(quirofano));
    } catch (err) {
      return c.json(error(err.message), err.statusCode || 500);
    }
  }

  async update(c) {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const quirofano = await quirofanoService.updateQuirofano(id, body);
      return c.json(success(quirofano, 'Quirófano actualizado exitosamente'));
    } catch (err) {
      return c.json(error(err.message), err.statusCode || 500);
    }
  }

  async delete(c) {
    try {
      const id = c.req.param('id');
      const quirofano = await quirofanoService.deleteQuirofano(id);
      return c.json(success(quirofano, 'Quirófano desactivado exitosamente'));
    } catch (err) {
      return c.json(error(err.message), err.statusCode || 500);
    }
  }

  async checkAvailability(c) {
    try {
      const { fechaInicio, duracionMinutos } = c.req.query();
      const id = c.req.param('id');
      
      if (!fechaInicio || !duracionMinutos) {
        throw new Error('Fecha de inicio y duración son requeridos');
      }

      const result = await quirofanoService.checkAvailability(
        id, 
        fechaInicio, 
        parseInt(duracionMinutos)
      );
      
      return c.json(success(result));
    } catch (err) {
      return c.json(error(err.message), err.statusCode || 500);
    }
  }
}

module.exports = new QuirofanoController();
