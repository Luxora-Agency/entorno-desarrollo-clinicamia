/**
 * Servicio de Enfermedades Laborales
 * Gestiona el registro y seguimiento de enfermedades laborales
 * Normativa: Decreto 1072/2015, Tabla de Enfermedades Laborales
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class EnfermedadService {
  /**
   * Listar enfermedades laborales con filtros
   */
  async findAll({ page = 1, limit = 20, estado, empleadoId, desde, hasta }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) where.estado = estado;
    if (empleadoId) where.empleadoId = empleadoId;

    if (desde || hasta) {
      where.fechaDiagnostico = {};
      if (desde) where.fechaDiagnostico.gte = new Date(desde);
      if (hasta) where.fechaDiagnostico.lte = new Date(hasta);
    }

    const [enfermedades, total] = await Promise.all([
      prisma.sSTEnfermedadLaboral.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaDiagnostico: 'desc' },
        include: {
          empleado: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              documento: true,
              cargo: { select: { nombre: true } },
            },
          },
        },
      }),
      prisma.sSTEnfermedadLaboral.count({ where }),
    ]);

    return {
      data: enfermedades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener enfermedad laboral por ID
   */
  async findById(id) {
    const enfermedad = await prisma.sSTEnfermedadLaboral.findUnique({
      where: { id },
      include: {
        empleado: {
          include: {
            cargo: true,
            contratos: { where: { estado: 'ACTIVO' }, take: 1 },
          },
        },
        seguimientos: {
          orderBy: { fechaSeguimiento: 'desc' },
        },
      },
    });

    if (!enfermedad) {
      throw new NotFoundError('Enfermedad laboral no encontrada');
    }

    return enfermedad;
  }

  /**
   * Registrar nueva enfermedad laboral
   */
  async create(data) {
    // Validar que el empleado existe
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: data.empleadoId },
    });

    if (!empleado) {
      throw new ValidationError('Empleado no encontrado');
    }

    const enfermedad = await prisma.sSTEnfermedadLaboral.create({
      data: {
        empleadoId: data.empleadoId,
        codigoCIE10: data.codigoCIE10,
        nombreEnfermedad: data.nombreEnfermedad,
        fechaDiagnostico: new Date(data.fechaDiagnostico),
        fechaPrimeraIncapacidad: data.fechaPrimeraIncapacidad ? new Date(data.fechaPrimeraIncapacidad) : null,
        agenteEtiologico: data.agenteEtiologico,
        factorRiesgoAsociado: data.factorRiesgoAsociado,
        tiempoExposicion: data.tiempoExposicion,
        actividadesRiesgo: data.actividadesRiesgo,
        relacionCausal: data.relacionCausal,
        ipsCalificadora: data.ipsCalificadora,
        fechaCalificacion: data.fechaCalificacion ? new Date(data.fechaCalificacion) : null,
        porcentajePCL: data.porcentajePCL,
        diasIncapacidad: data.diasIncapacidad || 0,
        reubicacionLaboral: data.reubicacionLaboral || false,
        descripcionReubicacion: data.descripcionReubicacion,
        recomendacionesMedicas: data.recomendacionesMedicas,
        estado: 'EN_ESTUDIO',
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return enfermedad;
  }

  /**
   * Actualizar enfermedad laboral
   */
  async update(id, data) {
    const enfermedad = await prisma.sSTEnfermedadLaboral.findUnique({
      where: { id },
    });

    if (!enfermedad) {
      throw new NotFoundError('Enfermedad laboral no encontrada');
    }

    const updated = await prisma.sSTEnfermedadLaboral.update({
      where: { id },
      data: {
        ...data,
        fechaDiagnostico: data.fechaDiagnostico ? new Date(data.fechaDiagnostico) : undefined,
        fechaPrimeraIncapacidad: data.fechaPrimeraIncapacidad ? new Date(data.fechaPrimeraIncapacidad) : undefined,
        fechaCalificacion: data.fechaCalificacion ? new Date(data.fechaCalificacion) : undefined,
      },
    });

    return updated;
  }

  /**
   * Agregar seguimiento a enfermedad
   */
  async agregarSeguimiento(enfermedadId, data) {
    const enfermedad = await prisma.sSTEnfermedadLaboral.findUnique({
      where: { id: enfermedadId },
    });

    if (!enfermedad) {
      throw new NotFoundError('Enfermedad laboral no encontrada');
    }

    const seguimiento = await prisma.sSTSeguimientoEnfermedad.create({
      data: {
        enfermedadId,
        fechaSeguimiento: new Date(data.fechaSeguimiento),
        tipoSeguimiento: data.tipoSeguimiento,
        observaciones: data.observaciones,
        evolucion: data.evolucion,
        incapacidadAdicional: data.incapacidadAdicional || 0,
        conceptoMedico: data.conceptoMedico,
        proximoControl: data.proximoControl ? new Date(data.proximoControl) : null,
      },
    });

    // Actualizar dias totales de incapacidad
    if (data.incapacidadAdicional > 0) {
      await prisma.sSTEnfermedadLaboral.update({
        where: { id: enfermedadId },
        data: {
          diasIncapacidad: { increment: data.incapacidadAdicional },
        },
      });
    }

    return seguimiento;
  }

  /**
   * Cambiar estado de enfermedad
   */
  async cambiarEstado(id, nuevoEstado) {
    const enfermedad = await prisma.sSTEnfermedadLaboral.findUnique({
      where: { id },
    });

    if (!enfermedad) {
      throw new NotFoundError('Enfermedad laboral no encontrada');
    }

    const updated = await prisma.sSTEnfermedadLaboral.update({
      where: { id },
      data: { estado: nuevoEstado },
    });

    return updated;
  }

  /**
   * Obtener estadisticas de enfermedades laborales
   */
  async getEstadisticas({ anio }) {
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const where = {
      fechaDiagnostico: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    const [
      total,
      porEstado,
      porAgente,
      diasPerdidos,
      conReubicacion,
    ] = await Promise.all([
      prisma.sSTEnfermedadLaboral.count({ where }),
      prisma.sSTEnfermedadLaboral.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.sSTEnfermedadLaboral.groupBy({
        by: ['agenteEtiologico'],
        where,
        _count: true,
      }),
      prisma.sSTEnfermedadLaboral.aggregate({
        where,
        _sum: { diasIncapacidad: true },
      }),
      prisma.sSTEnfermedadLaboral.count({
        where: { ...where, reubicacionLaboral: true },
      }),
    ]);

    return {
      anio,
      totalEnfermedades: total,
      diasPerdidos: diasPerdidos._sum.diasIncapacidad || 0,
      enfermedadesConReubicacion: conReubicacion,
      porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count })),
      porAgente: porAgente.map(a => ({ agente: a.agenteEtiologico, cantidad: a._count })),
    };
  }
}

module.exports = new EnfermedadService();
