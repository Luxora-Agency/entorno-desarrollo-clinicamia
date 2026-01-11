const prisma = require('../db/prisma');

class PlantillaNotaService {
  async create(data) {
    return await prisma.plantillaNotaEnfermeria.create({
      data
    });
  }

  async getAll(filters = {}) {
    const where = { activo: true };
    if (filters.tipoNota) where.tipoNota = filters.tipoNota;
    if (filters.nombre) where.nombre = { contains: filters.nombre, mode: 'insensitive' };

    return await prisma.plantillaNotaEnfermeria.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });
  }

  async update(id, data) {
    return await prisma.plantillaNotaEnfermeria.update({
      where: { id },
      data
    });
  }
  
  async delete(id) {
      return await prisma.plantillaNotaEnfermeria.update({
          where: { id },
          data: { activo: false }
      });
  }
}

module.exports = new PlantillaNotaService();
