const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class PQRSFService {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      tipo = '',
      estado = '',
      prioridad = '',
      fechaInicio = '',
      fechaFin = '',
      sortBy = 'fechaRadicacion',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { activo: true };

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombrePeticionario: { contains: search, mode: 'insensitive' } },
        { asunto: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;

    if (fechaInicio || fechaFin) {
      where.fechaRadicacion = {};
      if (fechaInicio) where.fechaRadicacion.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaRadicacion.lte = new Date(fechaFin);
    }

    const [pqrsf, total] = await Promise.all([
      prisma.pQRSF.findMany({
        where,
        include: {
          paciente: { select: { id: true, nombre: true, apellido: true } },
          responsable: { select: { id: true, nombre: true, apellido: true } },
          registrador: { select: { id: true, nombre: true, apellido: true } },
          documentos: { where: { activo: true } },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.pQRSF.count({ where }),
    ]);

    return {
      data: pqrsf,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async findById(id) {
    const pqrsf = await prisma.pQRSF.findUnique({
      where: { id },
      include: {
        paciente: {
          select: { id: true, nombre: true, apellido: true, cedula: true },
        },
        responsable: { select: { id: true, nombre: true, apellido: true, email: true } },
        registrador: { select: { id: true, nombre: true, apellido: true } },
        documentos: {
          where: { activo: true },
          include: {
            cargador: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!pqrsf || !pqrsf.activo) {
      throw new NotFoundError('PQRSF no encontrada');
    }

    return pqrsf;
  }

  async create(data, userId) {
    // Generate unique code
    const year = new Date().getFullYear();
    const count = await prisma.pQRSF.count({
      where: { codigo: { startsWith: `PQRSF-${year}-` } },
    });
    const codigo = `PQRSF-${year}-${String(count + 1).padStart(3, '0')}`;

    // Calculate response deadline (15 business days)
    const fechaRespuestaEsperada = new Date();
    fechaRespuestaEsperada.setDate(fechaRespuestaEsperada.getDate() + 15);

    const pqrsf = await prisma.pQRSF.create({
      data: {
        ...data,
        codigo,
        fechaRespuestaEsperada,
        registradoPor: userId,
        estado: 'RADICADA',
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return pqrsf;
  }

  async update(id, data) {
    await this.findById(id);

    const updated = await prisma.pQRSF.update({
      where: { id },
      data,
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        responsable: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return updated;
  }

  async delete(id) {
    await this.findById(id);

    await prisma.pQRSF.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'PQRSF eliminada exitosamente' };
  }

  async responder(id, respuesta, userId) {
    const existing = await this.findById(id);

    if (existing.estado === 'RESPONDIDA' || existing.estado === 'CERRADA') {
      throw new ValidationError('Esta PQRSF ya fue respondida');
    }

    const updated = await prisma.pQRSF.update({
      where: { id },
      data: {
        respuesta: respuesta.respuesta,
        fechaRespuesta: new Date(),
        estado: 'RESPONDIDA',
        responsableGestion: userId,
      },
      include: {
        responsable: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return updated;
  }

  async getVencidas() {
    const pqrsf = await prisma.pQRSF.findMany({
      where: {
        activo: true,
        estado: { in: ['RADICADA', 'EN_GESTION'] },
        fechaRespuestaEsperada: { lt: new Date() },
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        responsable: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fechaRespuestaEsperada: 'asc' },
    });

    return pqrsf;
  }

  async getEstadisticas(filters = {}) {
    const { fechaInicio, fechaFin, tipo } = filters;
    const whereBase = { activo: true };

    if (fechaInicio || fechaFin) {
      whereBase.fechaRadicacion = {};
      if (fechaInicio) whereBase.fechaRadicacion.gte = new Date(fechaInicio);
      if (fechaFin) whereBase.fechaRadicacion.lte = new Date(fechaFin);
    }
    if (tipo) whereBase.tipo = tipo;

    const [
      total,
      porTipo,
      porEstado,
      porPrioridad,
      vencidas,
      porVencer,
      respondidasATiempo,
      promedioSatisfaccionRespuesta,
    ] = await Promise.all([
      prisma.pQRSF.count({ where: whereBase }),

      prisma.pQRSF.groupBy({
        by: ['tipo'],
        where: whereBase,
        _count: true,
      }),

      prisma.pQRSF.groupBy({
        by: ['estado'],
        where: whereBase,
        _count: true,
      }),

      prisma.pQRSF.groupBy({
        by: ['prioridad'],
        where: whereBase,
        _count: true,
      }),

      prisma.pQRSF.count({
        where: {
          ...whereBase,
          fechaRespuestaEsperada: { lt: new Date() },
          estado: { in: ['RADICADA', 'EN_GESTION'] },
        },
      }),

      prisma.pQRSF.count({
        where: {
          ...whereBase,
          fechaRespuestaEsperada: {
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
          estado: { in: ['RADICADA', 'EN_GESTION'] },
        },
      }),

      prisma.pQRSF.count({
        where: {
          ...whereBase,
          estado: { in: ['RESPONDIDA', 'CERRADA'] },
          fechaRespuesta: { lte: prisma.pQRSF.fields.fechaRespuestaEsperada },
        },
      }),

      prisma.pQRSF.aggregate({
        where: {
          ...whereBase,
          satisfaccionRespuesta: { not: null },
        },
        _avg: { satisfaccionRespuesta: true },
      }),
    ]);

    return {
      total,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {}),
      porPrioridad: porPrioridad.reduce((acc, item) => {
        acc[item.prioridad] = item._count;
        return acc;
      }, {}),
      vencidas,
      porVencer,
      respondidasATiempo,
      promedioSatisfaccion: promedioSatisfaccionRespuesta._avg.satisfaccionRespuesta || 0,
    };
  }
}

module.exports = new PQRSFService();
