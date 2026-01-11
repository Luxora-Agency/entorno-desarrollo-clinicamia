/**
 * Servicio de Incidentes de Trabajo (Casi Accidentes)
 * Gestiona el registro y seguimiento de incidentes laborales
 * Normativa: Decreto 1072/2015
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class IncidenteService {
  /**
   * Listar incidentes con filtros y paginacion
   */
  async findAll({ page = 1, limit = 20, tipo, empleadoId, desde, hasta, search }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipoIncidente = tipo;
    if (empleadoId) where.empleadoId = empleadoId;

    if (desde || hasta) {
      where.fechaIncidente = {};
      if (desde) where.fechaIncidente.gte = new Date(desde);
      if (hasta) where.fechaIncidente.lte = new Date(hasta);
    }

    if (search) {
      where.OR = [
        { lugarIncidente: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { empleado: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [incidentes, total] = await Promise.all([
      prisma.sSTIncidente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaIncidente: 'desc' },
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
        },
      }),
      prisma.sSTIncidente.count({ where }),
    ]);

    return {
      data: incidentes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener incidente por ID
   */
  async findById(id) {
    const incidente = await prisma.sSTIncidente.findUnique({
      where: { id },
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
        reportante: {
          select: { id: true, nombre: true, apellido: true, cargo: { select: { nombre: true } } },
        },
      },
    });

    if (!incidente) {
      throw new NotFoundError('Incidente no encontrado');
    }

    return incidente;
  }

  /**
   * Registrar nuevo incidente
   */
  async create(data) {
    // Validar que el empleado existe
    if (data.empleadoId) {
      const empleado = await prisma.tHEmpleado.findUnique({
        where: { id: data.empleadoId },
      });

      if (!empleado) {
        throw new ValidationError('Empleado no encontrado');
      }
    }

    const incidente = await prisma.sSTIncidente.create({
      data: {
        empleadoId: data.empleadoId,
        reportanteId: data.reportanteId,
        fechaIncidente: new Date(data.fechaIncidente),
        horaIncidente: data.horaIncidente,
        lugarIncidente: data.lugarIncidente,
        tipoIncidente: data.tipoIncidente,
        descripcion: data.descripcion,
        actividadRealizaba: data.actividadRealizaba,
        causasPotenciales: data.causasPotenciales,
        accionesInmediatas: data.accionesInmediatas,
        accionesPreventivas: data.accionesPreventivas,
        testigos: data.testigos,
        potencialDano: data.potencialDano,
        requiereInvestigacion: data.requiereInvestigacion || false,
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return incidente;
  }

  /**
   * Actualizar incidente
   */
  async update(id, data) {
    const incidente = await prisma.sSTIncidente.findUnique({
      where: { id },
    });

    if (!incidente) {
      throw new NotFoundError('Incidente no encontrado');
    }

    const updated = await prisma.sSTIncidente.update({
      where: { id },
      data: {
        ...data,
        fechaIncidente: data.fechaIncidente ? new Date(data.fechaIncidente) : undefined,
      },
    });

    return updated;
  }

  /**
   * Obtener estadisticas de incidentes
   */
  async getEstadisticas({ anio, mes }) {
    const fechaInicio = new Date(anio, mes ? mes - 1 : 0, 1);
    const fechaFin = mes
      ? new Date(anio, mes, 0)
      : new Date(anio, 11, 31);

    const where = {
      fechaIncidente: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    const [total, porTipo, porPotencial] = await Promise.all([
      prisma.sSTIncidente.count({ where }),
      prisma.sSTIncidente.groupBy({
        by: ['tipoIncidente'],
        where,
        _count: true,
      }),
      prisma.sSTIncidente.groupBy({
        by: ['potencialDano'],
        where,
        _count: true,
      }),
    ]);

    return {
      periodo: { anio, mes },
      totalIncidentes: total,
      porTipo: porTipo.map(t => ({ tipo: t.tipoIncidente, cantidad: t._count })),
      porPotencial: porPotencial.map(p => ({ potencial: p.potencialDano, cantidad: p._count })),
    };
  }

  /**
   * Eliminar incidente
   */
  async delete(id) {
    const incidente = await prisma.sSTIncidente.findUnique({
      where: { id },
    });

    if (!incidente) {
      throw new NotFoundError('Incidente no encontrado');
    }

    await prisma.sSTIncidente.delete({
      where: { id },
    });

    return { message: 'Incidente eliminado correctamente' };
  }
}

module.exports = new IncidenteService();
