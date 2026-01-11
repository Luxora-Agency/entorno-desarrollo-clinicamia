const prisma = require('../db/prisma');

class BalanceLiquidosService {
  async create(data) {
    return await prisma.balanceLiquidos.create({
      data,
      include: {
        registrador: { select: { nombre: true, apellido: true } }
      }
    });
  }

  async getAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (filters.pacienteId) where.pacienteId = filters.pacienteId;
    if (filters.admisionId) where.admisionId = filters.admisionId;
    if (filters.fecha) {
        // Filter by specific day
        const start = new Date(filters.fecha);
        start.setHours(0,0,0,0);
        const end = new Date(filters.fecha);
        end.setHours(23,59,59,999);
        where.fechaRegistro = { gte: start, lte: end };
    }

    const [total, movimientos] = await Promise.all([
      prisma.balanceLiquidos.count({ where }),
      prisma.balanceLiquidos.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaRegistro: 'desc' },
        include: {
          registrador: { select: { nombre: true, apellido: true } }
        }
      })
    ]);

    return {
      data: movimientos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getBalance(admisionId, hours = 24) {
      // Calculate balance for the last N hours
      const dateLimit = new Date();
      dateLimit.setHours(dateLimit.getHours() - hours);
      
      const movimientos = await prisma.balanceLiquidos.findMany({
          where: {
              admisionId,
              fechaRegistro: { gte: dateLimit }
          },
          orderBy: { fechaRegistro: 'asc' }
      });
      
      let totalIngresos = 0;
      let totalEgresos = 0;
      
      movimientos.forEach(m => {
          if (m.tipo === 'Ingreso') totalIngresos += Number(m.cantidad);
          else if (m.tipo === 'Egreso') totalEgresos += Number(m.cantidad);
      });
      
      return {
          periodoHoras: hours,
          ingresos: totalIngresos,
          egresos: totalEgresos,
          balanceTotal: totalIngresos - totalEgresos,
          movimientos
      };
  }
}

module.exports = new BalanceLiquidosService();
