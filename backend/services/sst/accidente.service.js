/**
 * Servicio de Accidentes de Trabajo
 * Gestiona el registro, seguimiento e investigacion de accidentes laborales
 * Normativa: Decreto 1072/2015, Resolucion 1401/2007
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const integracionSST = require('./integracion.service');

class AccidenteService {
  /**
   * Listar accidentes con filtros y paginacion
   */
  async findAll({ page = 1, limit = 20, estado, tipo, empleadoId, desde, hasta, search }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) where.estado = estado;
    if (tipo) where.tipoAccidente = tipo;
    if (empleadoId) where.empleadoId = empleadoId;

    if (desde || hasta) {
      where.fechaAccidente = {};
      if (desde) where.fechaAccidente.gte = new Date(desde);
      if (hasta) where.fechaAccidente.lte = new Date(hasta);
    }

    if (search) {
      where.OR = [
        { lugarAccidente: { contains: search, mode: 'insensitive' } },
        { descripcionHechos: { contains: search, mode: 'insensitive' } },
        { empleado: { nombre: { contains: search, mode: 'insensitive' } } },
        { empleado: { apellido: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [accidentes, total] = await Promise.all([
      prisma.sSTAccidenteTrabajo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaAccidente: 'desc' },
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
          reportante: {
            select: { id: true, nombre: true, apellido: true },
          },
          investigacion: {
            select: { id: true, estado: true },
          },
        },
      }),
      prisma.sSTAccidenteTrabajo.count({ where }),
    ]);

    return {
      data: accidentes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener accidente por ID con detalles completos
   */
  async findById(id) {
    const accidente = await prisma.sSTAccidenteTrabajo.findUnique({
      where: { id },
      include: {
        empleado: {
          include: {
            cargo: true,
            contratos: {
              where: { estado: 'ACTIVO' },
              take: 1,
            },
          },
        },
        reportante: {
          select: { id: true, nombre: true, apellido: true, cargo: { select: { nombre: true } } },
        },
        investigacion: {
          include: {
            investigadorPrincipal: {
              select: { id: true, nombre: true, apellido: true },
            },
            miembros: {
              include: {
                empleado: {
                  select: { id: true, nombre: true, apellido: true },
                },
              },
            },
            medidasControl: {
              include: {
                responsable: {
                  select: { id: true, nombre: true, apellido: true },
                },
              },
            },
            documentos: true,
          },
        },
        testigos: {
          include: {
            empleado: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
    });

    if (!accidente) {
      throw new NotFoundError('Accidente no encontrado');
    }

    return accidente;
  }

  /**
   * Registrar nuevo accidente de trabajo
   */
  async create(data) {
    // Validar que el empleado existe y esta activo
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: data.empleadoId },
      include: { cargo: true },
    });

    if (!empleado) {
      throw new ValidationError('Empleado no encontrado');
    }

    if (empleado.estado !== 'ACTIVO') {
      throw new ValidationError('El empleado no esta activo');
    }

    // Crear el accidente
    const accidente = await prisma.sSTAccidenteTrabajo.create({
      data: {
        empleadoId: data.empleadoId,
        reportanteId: data.reportanteId,
        fechaAccidente: new Date(data.fechaAccidente),
        horaAccidente: data.horaAccidente,
        lugarAccidente: data.lugarAccidente,
        tipoAccidente: data.tipoAccidente,
        tipoLesion: data.tipoLesion,
        parteCuerpoAfectada: data.parteCuerpoAfectada,
        agenteAccidente: data.agenteAccidente,
        mecanismoAccidente: data.mecanismoAccidente,
        descripcionHechos: data.descripcionHechos,
        actividadRealizaba: data.actividadRealizaba,
        testigosNombres: data.testigosNombres,
        testigosContacto: data.testigosContacto,
        diasIncapacidad: data.diasIncapacidad || 0,
        tipoIncapacidad: data.tipoIncapacidad,
        atencionMedica: data.atencionMedica || false,
        hospitalizacion: data.hospitalizacion || false,
        nombreIPS: data.nombreIPS,
        estado: 'REPORTADO',
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    // Hook: Notificar a RRHH si genera incapacidad
    if (data.diasIncapacidad && data.diasIncapacidad > 0) {
      try {
        await integracionSST.onAccidenteRegistrado(accidente.id);
      } catch (err) {
        console.warn('[SST Hook] Error al notificar accidente a RRHH:', err.message);
      }
    }

    return accidente;
  }

  /**
   * Actualizar accidente
   */
  async update(id, data) {
    const accidente = await prisma.sSTAccidenteTrabajo.findUnique({
      where: { id },
    });

    if (!accidente) {
      throw new NotFoundError('Accidente no encontrado');
    }

    // No permitir edicion si ya tiene FURAT generado
    if (accidente.furatGenerado && !data.forceUpdate) {
      throw new ValidationError('No se puede editar un accidente con FURAT generado');
    }

    const updated = await prisma.sSTAccidenteTrabajo.update({
      where: { id },
      data: {
        ...data,
        fechaAccidente: data.fechaAccidente ? new Date(data.fechaAccidente) : undefined,
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return updated;
  }

  /**
   * Cambiar estado del accidente
   */
  async cambiarEstado(id, nuevoEstado, observaciones) {
    const accidente = await prisma.sSTAccidenteTrabajo.findUnique({
      where: { id },
    });

    if (!accidente) {
      throw new NotFoundError('Accidente no encontrado');
    }

    // Validar transiciones de estado
    const transicionesValidas = {
      REPORTADO: ['EN_INVESTIGACION', 'CERRADO'],
      EN_INVESTIGACION: ['CERRADO'],
      CERRADO: [],
    };

    if (!transicionesValidas[accidente.estado]?.includes(nuevoEstado)) {
      throw new ValidationError(`No se puede cambiar de ${accidente.estado} a ${nuevoEstado}`);
    }

    const updated = await prisma.sSTAccidenteTrabajo.update({
      where: { id },
      data: { estado: nuevoEstado },
    });

    return updated;
  }

  /**
   * Agregar testigo al accidente
   */
  async agregarTestigo(accidenteId, data) {
    const accidente = await prisma.sSTAccidenteTrabajo.findUnique({
      where: { id: accidenteId },
    });

    if (!accidente) {
      throw new NotFoundError('Accidente no encontrado');
    }

    const testigo = await prisma.sSTTestigoAccidente.create({
      data: {
        accidenteId,
        empleadoId: data.empleadoId,
        nombreTestigo: data.nombreTestigo,
        documentoTestigo: data.documentoTestigo,
        telefonoTestigo: data.telefonoTestigo,
        cargoTestigo: data.cargoTestigo,
        empresaTestigo: data.empresaTestigo,
        declaracion: data.declaracion,
        fechaDeclaracion: data.fechaDeclaracion ? new Date(data.fechaDeclaracion) : null,
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return testigo;
  }

  /**
   * Obtener estadisticas de accidentes
   */
  async getEstadisticas({ anio, mes }) {
    const fechaInicio = new Date(anio, mes ? mes - 1 : 0, 1);
    const fechaFin = mes
      ? new Date(anio, mes, 0)
      : new Date(anio, 11, 31);

    const where = {
      fechaAccidente: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    const [
      totalAccidentes,
      porTipo,
      porEstado,
      diasPerdidos,
      conIncapacidad,
    ] = await Promise.all([
      prisma.sSTAccidenteTrabajo.count({ where }),
      prisma.sSTAccidenteTrabajo.groupBy({
        by: ['tipoAccidente'],
        where,
        _count: true,
      }),
      prisma.sSTAccidenteTrabajo.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.sSTAccidenteTrabajo.aggregate({
        where,
        _sum: { diasIncapacidad: true },
      }),
      prisma.sSTAccidenteTrabajo.count({
        where: { ...where, diasIncapacidad: { gt: 0 } },
      }),
    ]);

    return {
      periodo: { anio, mes },
      totalAccidentes,
      diasPerdidos: diasPerdidos._sum.diasIncapacidad || 0,
      accidentesConIncapacidad: conIncapacidad,
      porTipo: porTipo.map(t => ({ tipo: t.tipoAccidente, cantidad: t._count })),
      porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count })),
    };
  }

  /**
   * Obtener accidentes pendientes de investigacion
   */
  async getPendientesInvestigacion() {
    return prisma.sSTAccidenteTrabajo.findMany({
      where: {
        estado: 'REPORTADO',
        investigacion: null,
      },
      orderBy: { fechaAccidente: 'asc' },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });
  }

  /**
   * Eliminar accidente (solo si no tiene FURAT ni investigacion)
   */
  async delete(id) {
    const accidente = await prisma.sSTAccidenteTrabajo.findUnique({
      where: { id },
      include: { investigacion: true },
    });

    if (!accidente) {
      throw new NotFoundError('Accidente no encontrado');
    }

    if (accidente.furatGenerado) {
      throw new ValidationError('No se puede eliminar un accidente con FURAT generado');
    }

    if (accidente.investigacion) {
      throw new ValidationError('No se puede eliminar un accidente con investigacion iniciada');
    }

    // Eliminar testigos primero
    await prisma.sSTTestigoAccidente.deleteMany({
      where: { accidenteId: id },
    });

    await prisma.sSTAccidenteTrabajo.delete({
      where: { id },
    });

    return { message: 'Accidente eliminado correctamente' };
  }
}

module.exports = new AccidenteService();
