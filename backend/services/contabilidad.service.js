/**
 * Contabilidad Service
 * Manage accounting entries (asientos contables) and financial reporting
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class ContabilidadService {
  async getNextNumero() {
    const year = new Date().getFullYear();
    const prefix = `AC-${year}-`;
    
    const lastAsiento = await prisma.asientoContable.findFirst({
      where: { numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' }
    });

    if (!lastAsiento) return `${prefix}00001`;
    const lastNum = parseInt(lastAsiento.numero.replace(prefix, ''));
    return `${prefix}${String(lastNum + 1).padStart(5, '0')}`;
  }

  async create(data) {
    const { lineas, ...asientoData } = data;

    if (!lineas || lineas.length < 2) {
      throw new ValidationError('El asiento debe tener al menos 2 lineas');
    }

    let totalDebito = 0;
    let totalCredito = 0;
    
    for (const linea of lineas) {
      totalDebito += parseFloat(linea.debito || 0);
      totalCredito += parseFloat(linea.credito || 0);
    }

    if (Math.abs(totalDebito - totalCredito) > 0.01) {
      throw new ValidationError('El asiento no esta balanceado. Debito: ' + totalDebito + ', Credito: ' + totalCredito);
    }

    const periodo = await prisma.periodoContable.findFirst({
      where: { estado: 'ABIERTO' }
    });

    if (!periodo) {
      throw new ValidationError('No hay un periodo contable abierto');
    }

    const fecha = new Date(asientoData.fecha);
    const numero = await this.getNextNumero();

    const asiento = await prisma.asientoContable.create({
      data: {
        numero,
        periodoId: periodo.id,
        fecha: fecha,
        tipo: asientoData.tipo || 'DIARIO',
        descripcion: asientoData.descripcion,
        totalDebito,
        totalCredito,
        estado: 'BORRADOR',
        creadoPor: asientoData.creadoPor,
        tipoDocOrigen: asientoData.tipoDocOrigen,
        docOrigenId: asientoData.docOrigenId,
        lineas: {
          create: lineas.map((linea, index) => ({
            cuentaCodigo: linea.cuentaCodigo,
            cuentaNombre: linea.cuentaNombre || linea.cuentaCodigo,
            debito: parseFloat(linea.debito || 0),
            credito: parseFloat(linea.credito || 0),
            descripcion: linea.descripcion,
            terceroTipo: linea.terceroTipo,
            terceroId: linea.terceroId,
            terceroNombre: linea.terceroNombre,
            centroCostoId: linea.centroCostoId,
            orden: index
          }))
        }
      },
      include: {
        lineas: { include: { centroCosto: true }, orderBy: { orden: 'asc' } },
        periodo: true
      }
    });

    return asiento;
  }

  async findAll(filters = {}) {
    const { page = 1, limit = 20, periodoId, tipo, estado, fechaDesde, fechaHasta, search } = filters;
    const where = {};
    
    if (periodoId) where.periodoId = periodoId;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (fechaDesde) where.fecha = { ...where.fecha, gte: new Date(fechaDesde) };
    if (fechaHasta) where.fecha = { ...where.fecha, lte: new Date(fechaHasta) };
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [asientos, total] = await Promise.all([
      prisma.asientoContable.findMany({
        where,
        include: {
          lineas: { include: { centroCosto: true }, orderBy: { orden: 'asc' } },
          periodo: true
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.asientoContable.count({ where })
    ]);

    return {
      asientos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async findById(id) {
    const asiento = await prisma.asientoContable.findUnique({
      where: { id },
      include: {
        lineas: { include: { centroCosto: true }, orderBy: { orden: 'asc' } },
        periodo: true
      }
    });

    if (!asiento) throw new NotFoundError('Asiento no encontrado');
    return asiento;
  }

  async aprobar(id, aprobadorId) {
    const asiento = await this.findById(id);
    
    if (asiento.estado !== 'BORRADOR' && asiento.estado !== 'PENDIENTE') {
      throw new ValidationError('Solo se pueden aprobar asientos en BORRADOR o PENDIENTE');
    }

    return prisma.asientoContable.update({
      where: { id },
      data: { estado: 'APROBADO', aprobadoPor: aprobadorId, fechaAprobacion: new Date() },
      include: { lineas: { include: { centroCosto: true }, orderBy: { orden: 'asc' } }, periodo: true }
    });
  }

  async anular(id, usuarioId, motivo) {
    const asiento = await this.findById(id);
    if (asiento.estado === 'ANULADO') throw new ValidationError('El asiento ya esta anulado');

    return prisma.asientoContable.update({
      where: { id },
      data: { estado: 'ANULADO', anuladoPor: usuarioId, fechaAnulacion: new Date(), motivoAnulacion: motivo },
      include: { lineas: { include: { centroCosto: true }, orderBy: { orden: 'asc' } }, periodo: true }
    });
  }

  async delete(id) {
    const asiento = await this.findById(id);
    if (asiento.estado !== 'BORRADOR') throw new ValidationError('Solo se pueden eliminar asientos en estado BORRADOR');

    await prisma.asientoContableLinea.deleteMany({ where: { asientoId: id } });
    await prisma.asientoContable.delete({ where: { id } });
    return { success: true };
  }
}

module.exports = new ContabilidadService();
