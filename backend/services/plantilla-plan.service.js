const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class PlantillaPlanService {
  async list(doctorId, search) {
    const where = {
      doctorId,
      activo: true,
    };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.plantillaPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data, doctorId) {
    return prisma.plantillaPlan.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        doctorId,
        procedimientos: data.procedimientos || [],
        medicamentos: data.medicamentos || [],
        interconsultas: data.interconsultas || [],
        observaciones: data.observaciones,
        planManejo: data.planManejo,
      },
    });
  }

  async update(id, data, doctorId) {
    const plantilla = await prisma.plantillaPlan.findUnique({ where: { id } });
    if (!plantilla) throw new NotFoundError('Plantilla no encontrada');
    if (plantilla.doctorId !== doctorId) throw new ValidationError('No tienes permiso para editar esta plantilla');

    return prisma.plantillaPlan.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        procedimientos: data.procedimientos,
        medicamentos: data.medicamentos,
        interconsultas: data.interconsultas,
        observaciones: data.observaciones,
        planManejo: data.planManejo,
      },
    });
  }

  async delete(id, doctorId) {
    const plantilla = await prisma.plantillaPlan.findUnique({ where: { id } });
    if (!plantilla) throw new NotFoundError('Plantilla no encontrada');
    if (plantilla.doctorId !== doctorId) throw new ValidationError('No tienes permiso para eliminar esta plantilla');

    // Soft delete
    return prisma.plantillaPlan.update({
      where: { id },
      data: { activo: false },
    });
  }

  async getById(id) {
    const plantilla = await prisma.plantillaPlan.findUnique({ where: { id } });
    if (!plantilla) throw new NotFoundError('Plantilla no encontrada');
    return plantilla;
  }
}

module.exports = new PlantillaPlanService();
