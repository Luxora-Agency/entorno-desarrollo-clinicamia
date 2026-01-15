const prisma = require('../db/prisma');

class PlantillaDoctorService {
  async create(data) {
    return await prisma.plantillaDoctor.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipoCampo: data.tipoCampo,
        contenido: data.contenido,
        doctorId: data.doctorId,
        esFavorito: data.esFavorito || false,
      }
    });
  }

  async getAll(doctorId, filters = {}) {
    const where = {
      activo: true,
      doctorId: doctorId
    };

    if (filters.tipoCampo) where.tipoCampo = filters.tipoCampo;
    if (filters.nombre) where.nombre = { contains: filters.nombre, mode: 'insensitive' };
    if (filters.esFavorito !== undefined) where.esFavorito = filters.esFavorito;

    return await prisma.plantillaDoctor.findMany({
      where,
      orderBy: [
        { esFavorito: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async getById(id) {
    return await prisma.plantillaDoctor.findUnique({
      where: { id }
    });
  }

  async update(id, data) {
    const updateData = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.tipoCampo !== undefined) updateData.tipoCampo = data.tipoCampo;
    if (data.contenido !== undefined) updateData.contenido = data.contenido;
    if (data.esFavorito !== undefined) updateData.esFavorito = data.esFavorito;

    return await prisma.plantillaDoctor.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id) {
    return await prisma.plantillaDoctor.update({
      where: { id },
      data: { activo: false }
    });
  }

  async toggleFavorite(id) {
    const plantilla = await this.getById(id);
    if (!plantilla) return null;

    return await prisma.plantillaDoctor.update({
      where: { id },
      data: { esFavorito: !plantilla.esFavorito }
    });
  }
}

module.exports = new PlantillaDoctorService();
