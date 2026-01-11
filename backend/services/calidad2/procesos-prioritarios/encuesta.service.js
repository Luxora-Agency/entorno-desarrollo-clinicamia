const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class EncuestaService {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      servicioAtendido = '',
      tipoEncuesta = '',
      fechaInicio = '',
      fechaFin = '',
      sortBy = 'fechaEncuesta',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { activo: true };

    if (search) {
      where.OR = [
        { nombrePaciente: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (servicioAtendido) where.servicioAtendido = servicioAtendido;
    if (tipoEncuesta) where.tipoEncuesta = tipoEncuesta;

    if (fechaInicio || fechaFin) {
      where.fechaEncuesta = {};
      if (fechaInicio) where.fechaEncuesta.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaEncuesta.lte = new Date(fechaFin);
    }

    const [encuestas, total] = await Promise.all([
      prisma.encuestaSatisfaccion.findMany({
        where,
        include: {
          paciente: {
            select: { id: true, nombre: true, apellido: true },
          },
          registrador: {
            select: { id: true, nombre: true, apellido: true },
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.encuestaSatisfaccion.count({ where }),
    ]);

    return {
      data: encuestas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async findById(id) {
    const encuesta = await prisma.encuestaSatisfaccion.findUnique({
      where: { id },
      include: {
        paciente: {
          select: { id: true, nombre: true, apellido: true, cedula: true },
        },
        registrador: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    if (!encuesta || !encuesta.activo) {
      throw new NotFoundError('Encuesta no encontrada');
    }

    return encuesta;
  }

  async create(data, userId) {
    const encuesta = await prisma.encuestaSatisfaccion.create({
      data: {
        ...data,
        registradoPor: userId,
        analizada: false,
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return encuesta;
  }

  async update(id, data) {
    await this.findById(id);

    const updated = await prisma.encuestaSatisfaccion.update({
      where: { id },
      data,
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return updated;
  }

  async delete(id) {
    await this.findById(id);

    await prisma.encuestaSatisfaccion.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Encuesta eliminada exitosamente' };
  }

  async getEstadisticas(filters = {}) {
    const { fechaInicio, fechaFin, servicioAtendido } = filters;
    const whereBase = { activo: true };

    if (fechaInicio || fechaFin) {
      whereBase.fechaEncuesta = {};
      if (fechaInicio) whereBase.fechaEncuesta.gte = new Date(fechaInicio);
      if (fechaFin) whereBase.fechaEncuesta.lte = new Date(fechaFin);
    }
    if (servicioAtendido) whereBase.servicioAtendido = servicioAtendido;

    const [
      total,
      porServicio,
      porTipo,
      promedios,
      porCategoria,
      bajaSatisfaccion,
    ] = await Promise.all([
      prisma.encuestaSatisfaccion.count({ where: whereBase }),

      prisma.encuestaSatisfaccion.groupBy({
        by: ['servicioAtendido'],
        where: whereBase,
        _count: true,
      }),

      prisma.encuestaSatisfaccion.groupBy({
        by: ['tipoEncuesta'],
        where: whereBase,
        _count: true,
      }),

      prisma.encuestaSatisfaccion.aggregate({
        where: whereBase,
        _avg: {
          accesibilidad: true,
          oportunidad: true,
          seguridadPaciente: true,
          experienciaAtencion: true,
          satisfaccionGeneral: true,
        },
      }),

      prisma.encuestaSatisfaccion.groupBy({
        by: ['categoriaSugerencia'],
        where: { ...whereBase, categoriaSugerencia: { not: null } },
        _count: true,
      }),

      prisma.encuestaSatisfaccion.count({
        where: {
          ...whereBase,
          satisfaccionGeneral: { lt: 3 },
        },
      }),
    ]);

    return {
      total,
      porServicio: porServicio.reduce((acc, item) => {
        acc[item.servicioAtendido] = item._count;
        return acc;
      }, {}),
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipoEncuesta] = item._count;
        return acc;
      }, {}),
      promedios: {
        accesibilidad: promedios._avg.accesibilidad || 0,
        oportunidad: promedios._avg.oportunidad || 0,
        seguridadPaciente: promedios._avg.seguridadPaciente || 0,
        experienciaAtencion: promedios._avg.experienciaAtencion || 0,
        satisfaccionGeneral: promedios._avg.satisfaccionGeneral || 0,
      },
      porCategoria: porCategoria.reduce((acc, item) => {
        acc[item.categoriaSugerencia] = item._count;
        return acc;
      }, {}),
      bajaSatisfaccion,
    };
  }
}

module.exports = new EncuestaService();
