/**
 * Servicio de Capacitaciones SST
 * Gestiona programacion, ejecucion y evaluacion de capacitaciones
 * Normativa: Decreto 1072/2015, Resolucion 0312/2019
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class CapacitacionSSTService {
  /**
   * Listar capacitaciones con filtros
   */
  async findAll({ page = 1, limit = 20, estado, tipo, desde, hasta }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) where.estado = estado;
    if (tipo) where.tipoCapacitacion = tipo;

    if (desde || hasta) {
      where.fechaProgramada = {};
      if (desde) where.fechaProgramada.gte = new Date(desde);
      if (hasta) where.fechaProgramada.lte = new Date(hasta);
    }

    const [capacitaciones, total] = await Promise.all([
      prisma.sSTCapacitacionSST.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaProgramada: 'desc' },
        include: {
          facilitador: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { asistentes: true },
          },
        },
      }),
      prisma.sSTCapacitacionSST.count({ where }),
    ]);

    return {
      data: capacitaciones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener capacitacion por ID
   */
  async findById(id) {
    const capacitacion = await prisma.sSTCapacitacionSST.findUnique({
      where: { id },
      include: {
        facilitador: {
          select: { id: true, nombre: true, apellido: true },
        },
        asistentes: {
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                cargo: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });

    if (!capacitacion) {
      throw new NotFoundError('Capacitacion no encontrada');
    }

    return capacitacion;
  }

  /**
   * Crear capacitacion
   */
  async create(data) {
    // Validar facilitador si es interno
    if (data.facilitadorId) {
      const facilitador = await prisma.tHEmpleado.findUnique({
        where: { id: data.facilitadorId },
      });
      if (!facilitador) {
        throw new ValidationError('Facilitador no encontrado');
      }
    }

    const capacitacion = await prisma.sSTCapacitacionSST.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipoCapacitacion: data.tipoCapacitacion, // INDUCCION, REINDUCCION, ESPECIFICA, COPASST, BRIGADA, EMERGENCIAS
        modalidad: data.modalidad, // PRESENCIAL, VIRTUAL, MIXTA
        temario: data.temario,
        objetivos: data.objetivos,
        fechaProgramada: new Date(data.fechaProgramada),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        duracionHoras: data.duracionHoras,
        lugar: data.lugar,
        facilitadorId: data.facilitadorId,
        facilitadorExterno: data.facilitadorExterno,
        entidadCapacitadora: data.entidadCapacitadora,
        cupoMaximo: data.cupoMaximo,
        requiereEvaluacion: data.requiereEvaluacion || false,
        notaMinimaAprobacion: data.notaMinimaAprobacion,
        estado: 'PROGRAMADA',
      },
      include: {
        facilitador: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return capacitacion;
  }

  /**
   * Actualizar capacitacion
   */
  async update(id, data) {
    const capacitacion = await prisma.sSTCapacitacionSST.findUnique({
      where: { id },
    });

    if (!capacitacion) {
      throw new NotFoundError('Capacitacion no encontrada');
    }

    const updated = await prisma.sSTCapacitacionSST.update({
      where: { id },
      data: {
        ...data,
        fechaProgramada: data.fechaProgramada ? new Date(data.fechaProgramada) : undefined,
        fechaEjecucion: data.fechaEjecucion ? new Date(data.fechaEjecucion) : undefined,
      },
    });

    return updated;
  }

  /**
   * Inscribir empleados a capacitacion
   */
  async inscribirEmpleados(capacitacionId, empleadoIds) {
    const capacitacion = await prisma.sSTCapacitacionSST.findUnique({
      where: { id: capacitacionId },
      include: { _count: { select: { asistentes: true } } },
    });

    if (!capacitacion) {
      throw new NotFoundError('Capacitacion no encontrada');
    }

    // Verificar cupo
    if (capacitacion.cupoMaximo && capacitacion._count.asistentes + empleadoIds.length > capacitacion.cupoMaximo) {
      throw new ValidationError('No hay cupo suficiente');
    }

    const inscripciones = [];

    for (const empleadoId of empleadoIds) {
      // Verificar que no este ya inscrito
      const existe = await prisma.sSTAsistenteCapacitacion.findUnique({
        where: {
          capacitacionId_empleadoId: { capacitacionId, empleadoId },
        },
      });

      if (!existe) {
        const inscripcion = await prisma.sSTAsistenteCapacitacion.create({
          data: {
            capacitacionId,
            empleadoId,
            estado: 'INSCRITO',
          },
          include: {
            empleado: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        });
        inscripciones.push(inscripcion);
      }
    }

    return inscripciones;
  }

  /**
   * Registrar asistencia
   */
  async registrarAsistencia(capacitacionId, data) {
    const capacitacion = await prisma.sSTCapacitacionSST.findUnique({
      where: { id: capacitacionId },
    });

    if (!capacitacion) {
      throw new NotFoundError('Capacitacion no encontrada');
    }

    const asistente = await prisma.sSTAsistenteCapacitacion.findUnique({
      where: {
        capacitacionId_empleadoId: {
          capacitacionId,
          empleadoId: data.empleadoId,
        },
      },
    });

    if (!asistente) {
      throw new NotFoundError('Asistente no inscrito');
    }

    const updated = await prisma.sSTAsistenteCapacitacion.update({
      where: {
        capacitacionId_empleadoId: {
          capacitacionId,
          empleadoId: data.empleadoId,
        },
      },
      data: {
        asistio: data.asistio,
        horaLlegada: data.horaLlegada,
        horaSalida: data.horaSalida,
        estado: data.asistio ? 'ASISTIO' : 'NO_ASISTIO',
        justificacionInasistencia: data.justificacionInasistencia,
      },
    });

    return updated;
  }

  /**
   * Registrar evaluacion
   */
  async registrarEvaluacion(capacitacionId, empleadoId, data) {
    const asistente = await prisma.sSTAsistenteCapacitacion.findUnique({
      where: {
        capacitacionId_empleadoId: { capacitacionId, empleadoId },
      },
      include: { capacitacion: true },
    });

    if (!asistente) {
      throw new NotFoundError('Asistente no encontrado');
    }

    if (!asistente.asistio) {
      throw new ValidationError('El empleado no asistio a la capacitacion');
    }

    // Determinar si aprobo
    const aprobo = data.notaObtenida >= (asistente.capacitacion.notaMinimaAprobacion || 60);

    const updated = await prisma.sSTAsistenteCapacitacion.update({
      where: {
        capacitacionId_empleadoId: { capacitacionId, empleadoId },
      },
      data: {
        evaluado: true,
        notaObtenida: data.notaObtenida,
        aprobo,
        observacionesEvaluacion: data.observaciones,
        estado: aprobo ? 'APROBADO' : 'REPROBADO',
      },
    });

    return updated;
  }

  /**
   * Finalizar capacitacion
   */
  async finalizar(id, data) {
    const capacitacion = await prisma.sSTCapacitacionSST.findUnique({
      where: { id },
      include: { asistentes: true },
    });

    if (!capacitacion) {
      throw new NotFoundError('Capacitacion no encontrada');
    }

    const asistieron = capacitacion.asistentes.filter(a => a.asistio).length;
    const totalInscritos = capacitacion.asistentes.length;

    const updated = await prisma.sSTCapacitacionSST.update({
      where: { id },
      data: {
        estado: 'REALIZADA',
        fechaEjecucion: data.fechaEjecucion ? new Date(data.fechaEjecucion) : new Date(),
        observaciones: data.observaciones,
        urlMaterial: data.urlMaterial,
        urlFotos: data.urlFotos,
        urlListaAsistencia: data.urlListaAsistencia,
        totalInscritos,
        totalAsistentes: asistieron,
      },
    });

    return updated;
  }

  /**
   * Cancelar capacitacion
   */
  async cancelar(id, motivo) {
    const updated = await prisma.sSTCapacitacionSST.update({
      where: { id },
      data: {
        estado: 'CANCELADA',
        observaciones: motivo,
      },
    });

    return updated;
  }

  /**
   * Obtener capacitaciones proximas
   */
  async getProximas(dias = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    return prisma.sSTCapacitacionSST.findMany({
      where: {
        estado: 'PROGRAMADA',
        fechaProgramada: {
          gte: new Date(),
          lte: fechaLimite,
        },
      },
      include: {
        _count: { select: { asistentes: true } },
      },
      orderBy: { fechaProgramada: 'asc' },
    });
  }

  /**
   * Obtener cobertura de capacitacion
   */
  async getCobertura({ anio }) {
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const totalEmpleados = await prisma.tHEmpleado.count({
      where: { estado: 'ACTIVO' },
    });

    // Empleados que asistieron a al menos una capacitacion
    const empleadosCapacitados = await prisma.sSTAsistenteCapacitacion.groupBy({
      by: ['empleadoId'],
      where: {
        asistio: true,
        capacitacion: {
          fechaEjecucion: { gte: fechaInicio, lte: fechaFin },
        },
      },
    });

    // Estadisticas por tipo
    const porTipo = await prisma.sSTCapacitacionSST.groupBy({
      by: ['tipoCapacitacion'],
      where: {
        fechaEjecucion: { gte: fechaInicio, lte: fechaFin },
        estado: 'REALIZADA',
      },
      _count: true,
      _sum: { totalAsistentes: true },
    });

    // Horas de capacitacion
    const horasTotales = await prisma.sSTCapacitacionSST.aggregate({
      where: {
        fechaEjecucion: { gte: fechaInicio, lte: fechaFin },
        estado: 'REALIZADA',
      },
      _sum: { duracionHoras: true },
    });

    return {
      anio,
      totalEmpleados,
      empleadosCapacitados: empleadosCapacitados.length,
      cobertura: totalEmpleados > 0 ? (empleadosCapacitados.length / totalEmpleados) * 100 : 0,
      horasTotalesCapacitacion: horasTotales._sum.duracionHoras || 0,
      porTipo: porTipo.map(t => ({
        tipo: t.tipoCapacitacion,
        cantidad: t._count,
        asistentes: t._sum.totalAsistentes || 0,
      })),
    };
  }

  /**
   * Obtener historial de capacitaciones de un empleado
   */
  async getHistorialEmpleado(empleadoId) {
    return prisma.sSTAsistenteCapacitacion.findMany({
      where: { empleadoId },
      include: {
        capacitacion: {
          select: {
            id: true,
            titulo: true,
            tipoCapacitacion: true,
            fechaEjecucion: true,
            duracionHoras: true,
          },
        },
      },
      orderBy: { capacitacion: { fechaEjecucion: 'desc' } },
    });
  }
}

module.exports = new CapacitacionSSTService();
