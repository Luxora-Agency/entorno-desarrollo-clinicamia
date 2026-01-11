const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class IndicadorService {
  async findAll(query = {}) {
    const { page = 1, limit = 50, search = '', categoria = '', estado = '', sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const where = { activo: true };
    if (search) where.OR = [{ codigo: { contains: search, mode: 'insensitive' } }, { nombre: { contains: search, mode: 'insensitive' } }];
    if (categoria) where.categoria = categoria;
    if (estado) where.estado = estado;

    const [indicadores, total] = await Promise.all([
      prisma.indicadorProcesosPrioritarios.findMany({ where, include: { creador: { select: { id: true, nombre: true, apellido: true } }, responsableUsuario: { select: { id: true, nombre: true, apellido: true } }, mediciones: { orderBy: [{ anio: 'desc' }, { mes: 'desc' }], take: 12 } }, skip, take, orderBy: { [sortBy]: sortOrder } }),
      prisma.indicadorProcesosPrioritarios.count({ where }),
    ]);

    return { data: indicadores, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } };
  }

  async findById(id) {
    const indicador = await prisma.indicadorProcesosPrioritarios.findUnique({ where: { id }, include: { creador: { select: { id: true, nombre: true, apellido: true } }, responsableUsuario: { select: { id: true, nombre: true, apellido: true } }, mediciones: { include: { registrador: { select: { id: true, nombre: true, apellido: true } } }, orderBy: [{ anio: 'desc' }, { mes: 'desc' }] } } });
    if (!indicador || !indicador.activo) throw new NotFoundError('Indicador no encontrado');
    return indicador;
  }

  async create(data, userId) {
    const existing = await prisma.indicadorProcesosPrioritarios.findUnique({ where: { codigo: data.codigo } });
    if (existing) throw new ValidationError('Ya existe un indicador con este código');
    const indicador = await prisma.indicadorProcesosPrioritarios.create({ data: { ...data, creadoPor: userId, responsable: data.responsable || userId, estado: 'ACTIVO' }, include: { creador: { select: { id: true, nombre: true, apellido: true } }, responsableUsuario: { select: { id: true, nombre: true, apellido: true } } } });
    return indicador;
  }

  async update(id, data) {
    await this.findById(id);
    const updated = await prisma.indicadorProcesosPrioritarios.update({ where: { id }, data, include: { creador: { select: { id: true, nombre: true, apellido: true } }, responsableUsuario: { select: { id: true, nombre: true, apellido: true } } } });
    return updated;
  }

  async delete(id) {
    await this.findById(id);
    await prisma.indicadorProcesosPrioritarios.update({ where: { id }, data: { activo: false } });
    return { message: 'Indicador eliminado exitosamente' };
  }

  async registrarMedicion(indicadorId, medicion, userId) {
    await this.findById(indicadorId);
    const existing = await prisma.medicionIndicadorPP.findUnique({ where: { indicadorId_periodo: { indicadorId, periodo: medicion.periodo } } });
    if (existing) throw new ValidationError('Ya existe una medición para este periodo');
    const nueva = await prisma.medicionIndicadorPP.create({ data: { indicadorId, ...medicion, registradoPor: userId }, include: { indicador: { select: { id: true, nombre: true, codigo: true, meta: true } }, registrador: { select: { id: true, nombre: true, apellido: true } } } });
    return nueva;
  }

  async getMediciones(indicadorId) {
    await this.findById(indicadorId);
    const mediciones = await prisma.medicionIndicadorPP.findMany({ where: { indicadorId, activo: true }, include: { registrador: { select: { id: true, nombre: true, apellido: true } } }, orderBy: [{ anio: 'desc' }, { mes: 'desc' }] });
    return mediciones;
  }

  async getDashboard() {
    const [total, porCategoria, activos, inactivos, medicionesRecientes] = await Promise.all([
      prisma.indicadorProcesosPrioritarios.count({ where: { activo: true } }),
      prisma.indicadorProcesosPrioritarios.groupBy({ by: ['categoria'], where: { activo: true }, _count: true }),
      prisma.indicadorProcesosPrioritarios.count({ where: { activo: true, estado: 'ACTIVO' } }),
      prisma.indicadorProcesosPrioritarios.count({ where: { activo: true, estado: 'INACTIVO' } }),
      prisma.medicionIndicadorPP.findMany({ where: { activo: true }, include: { indicador: { select: { id: true, nombre: true, codigo: true } } }, orderBy: { createdAt: 'desc' }, take: 10 })
    ]);

    return { total, porCategoria: porCategoria.reduce((acc, item) => { acc[item.categoria] = item._count; return acc; }, {}), activos, inactivos, medicionesRecientes };
  }
}

module.exports = new IndicadorService();
