/**
 * Service de Seguridad del Paciente
 * Gestión de rondas de seguridad, prácticas seguras y adherencia
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class SeguridadPacienteService {
  // ==========================================
  // RONDAS DE SEGURIDAD
  // ==========================================

  /**
   * Obtener rondas de seguridad
   */
  async getRondas(query = {}) {
    const { page = 1, limit = 10, estado, servicioId, unidadId, fechaDesde, fechaHasta } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(estado && { estado }),
      ...(servicioId && { servicioId }),
      ...(unidadId && { unidadId }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaProgramada: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [rondas, total] = await Promise.all([
      prisma.rondaSeguridad.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          ejecutor: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { accionesCorrectivas: true },
          },
        },
        orderBy: { fechaProgramada: 'desc' },
      }),
      prisma.rondaSeguridad.count({ where }),
    ]);

    return {
      rondas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener ronda por ID
   */
  async getRondaById(id) {
    const ronda = await prisma.rondaSeguridad.findUnique({
      where: { id },
      include: {
        ejecutor: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        accionesCorrectivas: {
          include: {
            responsable: { select: { nombre: true, apellido: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ronda) {
      throw new NotFoundError('Ronda de seguridad no encontrada');
    }

    return ronda;
  }

  /**
   * Programar ronda de seguridad
   */
  async programarRonda(data) {
    const {
      servicioId,
      unidadId,
      fechaProgramada,
      checklistUsado,
      observaciones,
    } = data;

    return prisma.rondaSeguridad.create({
      data: {
        servicioId,
        unidadId,
        fechaProgramada: new Date(fechaProgramada),
        checklistUsado,
        observaciones,
        estado: 'Programada',
      },
    });
  }

  /**
   * Ejecutar ronda de seguridad
   */
  async ejecutarRonda(id, data) {
    const ronda = await prisma.rondaSeguridad.findUnique({ where: { id } });
    if (!ronda) {
      throw new NotFoundError('Ronda de seguridad no encontrada');
    }

    const { ejecutorId, hallazgos, fotosEvidencia, observaciones } = data;

    return prisma.rondaSeguridad.update({
      where: { id },
      data: {
        ejecutorId,
        fechaEjecucion: new Date(),
        hallazgos,
        fotosEvidencia: fotosEvidencia || [],
        observaciones,
        estado: 'Ejecutada',
      },
    });
  }

  /**
   * Cerrar ronda de seguridad
   */
  async cerrarRonda(id) {
    const ronda = await prisma.rondaSeguridad.findUnique({ where: { id } });
    if (!ronda) {
      throw new NotFoundError('Ronda de seguridad no encontrada');
    }

    return prisma.rondaSeguridad.update({
      where: { id },
      data: { estado: 'Cerrada' },
    });
  }

  // ==========================================
  // PRÁCTICAS SEGURAS
  // ==========================================

  /**
   * Obtener prácticas seguras
   */
  async getPracticas(query = {}) {
    const { categoria, activo = true } = query;

    const where = {
      ...(categoria && { categoria }),
      ...(activo !== undefined && { activo: activo === 'true' || activo === true }),
    };

    return prisma.practicaSegura.findMany({
      where,
      include: {
        _count: {
          select: { adherencias: true },
        },
      },
      orderBy: { codigo: 'asc' },
    });
  }

  /**
   * Obtener práctica por ID
   */
  async getPracticaById(id) {
    const practica = await prisma.practicaSegura.findUnique({
      where: { id },
      include: {
        adherencias: {
          orderBy: { periodo: 'desc' },
          take: 12,
          include: {
            evaluador: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!practica) {
      throw new NotFoundError('Práctica segura no encontrada');
    }

    return practica;
  }

  /**
   * Crear práctica segura
   */
  async createPractica(data) {
    const {
      codigo,
      nombre,
      descripcion,
      categoria,
      checklistItems,
      frecuenciaMonitoreo,
      responsable,
    } = data;

    // Validar código único
    const existing = await prisma.practicaSegura.findUnique({ where: { codigo } });
    if (existing) {
      throw new ValidationError('Ya existe una práctica segura con este código');
    }

    return prisma.practicaSegura.create({
      data: {
        codigo,
        nombre,
        descripcion,
        categoria,
        checklistItems,
        frecuenciaMonitoreo,
        responsable,
      },
    });
  }

  /**
   * Actualizar práctica segura
   */
  async updatePractica(id, data) {
    const practica = await prisma.practicaSegura.findUnique({ where: { id } });
    if (!practica) {
      throw new NotFoundError('Práctica segura no encontrada');
    }

    return prisma.practicaSegura.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // ADHERENCIA A PRÁCTICAS SEGURAS
  // ==========================================

  /**
   * Registrar evaluación de adherencia
   */
  async registrarAdherencia(data) {
    const {
      practicaId,
      periodo,
      totalEvaluados,
      totalCumplen,
      observaciones,
      evaluadorId,
    } = data;

    const practica = await prisma.practicaSegura.findUnique({ where: { id: practicaId } });
    if (!practica) {
      throw new NotFoundError('Práctica segura no encontrada');
    }

    // Calcular porcentaje de adherencia
    const porcentajeAdherencia = totalEvaluados > 0
      ? (totalCumplen / totalEvaluados) * 100
      : 0;

    // Verificar si ya existe registro para este periodo
    const existingAdherencia = await prisma.adherenciaPracticaSegura.findFirst({
      where: { practicaId, periodo },
    });

    if (existingAdherencia) {
      return prisma.adherenciaPracticaSegura.update({
        where: { id: existingAdherencia.id },
        data: {
          totalEvaluados,
          totalCumplen,
          porcentajeAdherencia,
          observaciones,
          evaluadorId,
          fechaEvaluacion: new Date(),
        },
      });
    }

    return prisma.adherenciaPracticaSegura.create({
      data: {
        practicaId,
        periodo,
        totalEvaluados,
        totalCumplen,
        porcentajeAdherencia,
        observaciones,
        evaluadorId,
        fechaEvaluacion: new Date(),
      },
    });
  }

  /**
   * Obtener historial de adherencia de una práctica
   */
  async getHistorialAdherencia(practicaId, query = {}) {
    const { periodoDesde, periodoHasta } = query;

    const where = {
      practicaId,
      ...(periodoDesde || periodoHasta
        ? {
            periodo: {
              ...(periodoDesde && { gte: periodoDesde }),
              ...(periodoHasta && { lte: periodoHasta }),
            },
          }
        : {}),
    };

    return prisma.adherenciaPracticaSegura.findMany({
      where,
      include: {
        evaluador: { select: { nombre: true, apellido: true } },
      },
      orderBy: { periodo: 'desc' },
    });
  }

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  /**
   * Dashboard de seguridad del paciente
   */
  async getDashboard() {
    const hoy = new Date();
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPracticas,
      rondasProgramadas,
      rondasEjecutadas,
      rondasPendientes,
      eventosUltimos30Dias,
      eventosCentinela,
      promedioAdherencia,
      practicasBajaAdherencia,
    ] = await Promise.all([
      prisma.practicaSegura.count({ where: { activo: true } }),
      prisma.rondaSeguridad.count({ where: { estado: 'Programada' } }),
      prisma.rondaSeguridad.count({
        where: { estado: 'Ejecutada', fechaEjecucion: { gte: hace30Dias } },
      }),
      prisma.rondaSeguridad.count({
        where: { estado: 'Programada', fechaProgramada: { lte: hoy } },
      }),
      prisma.eventoAdverso.count({
        where: { fechaEvento: { gte: hace30Dias } },
      }),
      prisma.eventoAdverso.count({
        where: { severidad: 'CENTINELA', fechaEvento: { gte: hace30Dias } },
      }),
      prisma.adherenciaPracticaSegura.aggregate({
        _avg: { porcentajeAdherencia: true },
        where: {
          periodo: { gte: new Date().toISOString().substring(0, 7) },
        },
      }),
      prisma.adherenciaPracticaSegura.findMany({
        where: {
          porcentajeAdherencia: { lt: 80 },
          periodo: { gte: new Date().toISOString().substring(0, 7) },
        },
        include: {
          practica: { select: { codigo: true, nombre: true } },
        },
        orderBy: { porcentajeAdherencia: 'asc' },
        take: 5,
      }),
    ]);

    // Próximas rondas programadas
    const proximasRondas = await prisma.rondaSeguridad.findMany({
      where: {
        estado: 'Programada',
        fechaProgramada: { gte: hoy },
      },
      orderBy: { fechaProgramada: 'asc' },
      take: 5,
    });

    // Adherencia por práctica (últimos 3 meses)
    const adherenciaPorPractica = await prisma.practicaSegura.findMany({
      where: { activo: true },
      include: {
        adherencias: {
          orderBy: { periodo: 'desc' },
          take: 3,
        },
      },
    });

    return {
      resumen: {
        totalPracticas,
        rondasProgramadas,
        rondasEjecutadas,
        rondasPendientes,
        eventosUltimos30Dias,
        eventosCentinela,
        promedioAdherencia: promedioAdherencia._avg?.porcentajeAdherencia || 0,
      },
      practicasBajaAdherencia,
      proximasRondas,
      adherenciaPorPractica: adherenciaPorPractica.map((p) => ({
        codigo: p.codigo,
        nombre: p.nombre,
        adherencias: p.adherencias.map((a) => ({
          periodo: a.periodo,
          porcentaje: a.porcentajeAdherencia,
        })),
      })),
    };
  }

  /**
   * Generar reporte de prácticas seguras
   */
  async generarReportePracticas(periodo) {
    const practicas = await prisma.practicaSegura.findMany({
      where: { activo: true },
      include: {
        adherencias: {
          where: { periodo },
          take: 1,
        },
      },
      orderBy: { codigo: 'asc' },
    });

    return practicas.map((p) => ({
      codigo: p.codigo,
      nombre: p.nombre,
      categoria: p.categoria,
      frecuenciaMonitoreo: p.frecuenciaMonitoreo,
      adherencia: p.adherencias.length > 0
        ? {
            totalEvaluados: p.adherencias[0].totalEvaluados,
            totalCumplen: p.adherencias[0].totalCumplen,
            porcentaje: p.adherencias[0].porcentajeAdherencia,
          }
        : null,
    }));
  }

  /**
   * Indicadores de seguridad del paciente
   */
  async getIndicadoresSeguridad(anio) {
    const year = parseInt(anio) || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Eventos adversos por mes
    const eventosAdversos = await prisma.eventoAdverso.groupBy({
      by: ['tipoEvento'],
      _count: true,
      where: {
        fechaEvento: { gte: startDate, lte: endDate },
      },
    });

    // Tasa de eventos adversos por 1000 pacientes-día
    // Esto requeriría datos de días-paciente que dependen del módulo de hospitalización

    // Adherencia promedio por práctica
    const adherenciaPorPractica = await prisma.adherenciaPracticaSegura.groupBy({
      by: ['practicaId'],
      _avg: { porcentajeAdherencia: true },
      where: {
        periodo: { gte: `${year}-01`, lte: `${year}-12` },
      },
    });

    // Rondas ejecutadas vs programadas
    const rondasStats = await prisma.rondaSeguridad.groupBy({
      by: ['estado'],
      _count: true,
      where: {
        fechaProgramada: { gte: startDate, lte: endDate },
      },
    });

    return {
      eventosAdversos,
      adherenciaPorPractica,
      rondasStats,
      periodo: { anio: year, inicio: startDate, fin: endDate },
    };
  }
}

module.exports = new SeguridadPacienteService();
