const prisma = require('../db/prisma');

class TransfusionService {
  async create(data) {
    return await prisma.transfusion.create({
      data,
      include: {
        registrador: { select: { nombre: true, apellido: true } },
        verificador: { select: { nombre: true, apellido: true } }
      }
    });
  }

  async getAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (filters.pacienteId) where.pacienteId = filters.pacienteId;
    if (filters.admisionId) where.admisionId = filters.admisionId;

    const [total, transfusiones] = await Promise.all([
      prisma.transfusion.count({ where }),
      prisma.transfusion.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaInicio: 'desc' },
        include: {
          registrador: { select: { nombre: true, apellido: true } },
          verificador: { select: { nombre: true, apellido: true } }
        }
      })
    ]);

    return {
      data: transfusiones,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async verify(id, verificadorId) {
      return await prisma.transfusion.update({
          where: { id },
          data: { verificadoPor: verificadorId },
          include: {
            verificador: { select: { nombre: true, apellido: true } }
          }
      });
  }
  
  async updateSignos(id, type, signos) {
      // type: 'pre' or 'post'
      const data = {};
      if (type === 'pre') data.signosVitalesPre = signos;
      else if (type === 'post') data.signosVitalesPost = signos;
      
      return await prisma.transfusion.update({
          where: { id },
          data
      });
  }
}

module.exports = new TransfusionService();
