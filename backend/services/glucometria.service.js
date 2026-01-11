const prisma = require('../db/prisma');

class GlucometriaService {
  async create(data) {
    return await prisma.glucometria.create({
      data,
      include: {
        paciente: true,
        registrador: { select: { nombre: true, apellido: true } }
      }
    });
  }

  async getAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (filters.pacienteId) where.pacienteId = filters.pacienteId;
    if (filters.admisionId) where.admisionId = filters.admisionId;
    if (filters.fechaDesde && filters.fechaHasta) {
      where.fechaRegistro = {
        gte: new Date(filters.fechaDesde),
        lte: new Date(filters.fechaHasta)
      };
    }

    const [total, glucometrias] = await Promise.all([
      prisma.glucometria.count({ where }),
      prisma.glucometria.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaRegistro: 'desc' },
        include: {
          paciente: { select: { nombre: true, apellido: true, tipoDocumento: true, cedula: true } },
          registrador: { select: { nombre: true, apellido: true } }
        }
      })
    ]);

    return {
      data: glucometrias,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  async getStats(pacienteId) {
     const glucometrias = await prisma.glucometria.findMany({
       where: { pacienteId },
       orderBy: { fechaRegistro: 'desc' },
       take: 20
     });
     
     // Detectar tendencias o alertas
     const alertas = [];
     glucometrias.forEach(g => {
       if (g.valor < 70) alertas.push({ tipo: 'Hipoglucemia', valor: g.valor, fecha: g.fechaRegistro });
       if (g.valor > 180) alertas.push({ tipo: 'Hiperglucemia', valor: g.valor, fecha: g.fechaRegistro });
     });
     
     return { glucometrias, alertas };
  }
}

module.exports = new GlucometriaService();
