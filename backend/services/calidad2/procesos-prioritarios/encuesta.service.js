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

    // Obtener inicio del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [
      total,
      totalMesActual,
      porServicio,
      porTipo,
      promedios,
      promediosDoctor,
      porCategoria,
      bajaSatisfaccion,
      porcentajeRecomendacion,
    ] = await Promise.all([
      prisma.encuestaSatisfaccion.count({ where: whereBase }),

      // Encuestas del mes actual
      prisma.encuestaSatisfaccion.count({
        where: { ...whereBase, fechaEncuesta: { gte: inicioMes } },
      }),

      prisma.encuestaSatisfaccion.groupBy({
        by: ['servicioAtendido'],
        where: whereBase,
        _count: true,
        _avg: { satisfaccionGeneral: true },
      }),

      prisma.encuestaSatisfaccion.groupBy({
        by: ['tipoEncuesta'],
        where: whereBase,
        _count: true,
      }),

      // Promedios para encuestas de calidad general
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

      // Promedios para encuestas de consulta (POST_CONSULTA)
      prisma.encuestaSatisfaccion.aggregate({
        where: { ...whereBase, tipoEncuesta: 'POST_CONSULTA' },
        _avg: {
          atencionDoctor: true,
          claridadDoctor: true,
          tiempoConsulta: true,
          empatiaDoctor: true,
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

      // Porcentaje de recomendación
      prisma.encuestaSatisfaccion.count({
        where: { ...whereBase, recomendaria: true },
      }),
    ]);

    // Calcular promedio general combinando ambos tipos de encuestas
    const promedioCalidad = [
      promedios._avg.accesibilidad,
      promedios._avg.oportunidad,
      promedios._avg.seguridadPaciente,
      promedios._avg.experienciaAtencion,
      promedios._avg.satisfaccionGeneral,
    ].filter(v => v != null);

    const promedioConsulta = [
      promediosDoctor._avg.atencionDoctor,
      promediosDoctor._avg.claridadDoctor,
      promediosDoctor._avg.tiempoConsulta,
      promediosDoctor._avg.empatiaDoctor,
      promediosDoctor._avg.satisfaccionGeneral,
    ].filter(v => v != null);

    const todosPromedios = [...promedioCalidad, ...promedioConsulta];
    const promedioGeneral = todosPromedios.length > 0
      ? todosPromedios.reduce((a, b) => a + b, 0) / todosPromedios.length
      : 0;

    // Encontrar mejor servicio
    let mejorServicio = null;
    if (porServicio.length > 0) {
      const servicioOrdenado = porServicio
        .filter(s => s._avg.satisfaccionGeneral != null)
        .sort((a, b) => (b._avg.satisfaccionGeneral || 0) - (a._avg.satisfaccionGeneral || 0));
      if (servicioOrdenado.length > 0) {
        mejorServicio = {
          servicio: servicioOrdenado[0].servicioAtendido || 'Consulta Médica',
          promedio: servicioOrdenado[0]._avg.satisfaccionGeneral,
        };
      }
    }

    return {
      total,
      mesActual: totalMesActual,
      promedioGeneral,
      mejorServicio,
      porServicio: porServicio.reduce((acc, item) => {
        acc[item.servicioAtendido || 'Sin servicio'] = item._count;
        return acc;
      }, {}),
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipoEncuesta] = item._count;
        return acc;
      }, {}),
      promedios: {
        // Campos de calidad general
        accesibilidad: promedios._avg.accesibilidad || 0,
        oportunidad: promedios._avg.oportunidad || 0,
        seguridadPaciente: promedios._avg.seguridadPaciente || 0,
        experienciaAtencion: promedios._avg.experienciaAtencion || 0,
        satisfaccionGeneral: promedios._avg.satisfaccionGeneral || 0,
        // Campos de encuestas de consulta
        atencionDoctor: promediosDoctor._avg.atencionDoctor || 0,
        claridadDoctor: promediosDoctor._avg.claridadDoctor || 0,
        tiempoConsulta: promediosDoctor._avg.tiempoConsulta || 0,
        empatiaDoctor: promediosDoctor._avg.empatiaDoctor || 0,
      },
      porCategoria: porCategoria.reduce((acc, item) => {
        acc[item.categoriaSugerencia] = item._count;
        return acc;
      }, {}),
      bajaSatisfaccion,
      porcentajeRecomendacion: total > 0 ? ((porcentajeRecomendacion / total) * 100).toFixed(1) : 0,
    };
  }
}

module.exports = new EncuestaService();
