const prisma = require('../db/prisma');

class PlantillaDoctorService {
  async create(data) {
    return await prisma.plantillaDoctor.create({
      data
    });
  }

  async getAll(doctorId, filters = {}) {
    const where = { 
        activo: true,
        doctorId: doctorId 
    };
    
    if (filters.tipoCampo) where.tipoCampo = filters.tipoCampo;
    if (filters.nombre) where.nombre = { contains: filters.nombre, mode: 'insensitive' };

    return await prisma.plantillaDoctor.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });
  }

  async getById(id) {
    return await prisma.plantillaDoctor.findUnique({
      where: { id }
    });
  }

  async update(id, data) {
    return await prisma.plantillaDoctor.update({
      where: { id },
      data
    });
  }
  
  async delete(id) {
      return await prisma.plantillaDoctor.update({
          where: { id },
          data: { activo: false }
      });
  }
}

module.exports = new PlantillaDoctorService();
