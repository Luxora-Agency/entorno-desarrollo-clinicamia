/**
 * Service de Habilitación (SUH) - Resolución 3100/2019
 * Gestión de estándares, autoevaluaciones y visitas de verificación
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class HabilitacionService {
  // ==========================================
  // ESTÁNDARES DE HABILITACIÓN
  // ==========================================

  /**
   * Obtener todos los estándares de habilitación
   */
  async getEstandares(query = {}) {
    const { tipo, activo = true, search } = query;

    const where = {
      ...(activo !== undefined && { activo: activo === 'true' || activo === true }),
      ...(tipo && { tipo }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { codigo: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const estandares = await prisma.estandarHabilitacion.findMany({
      where,
      include: {
        criterios: {
          where: { activo: true },
          orderBy: { codigo: 'asc' },
        },
        _count: {
          select: { autoevaluaciones: true },
        },
      },
      orderBy: { tipo: 'asc' },
    });

    return estandares;
  }

  /**
   * Obtener un estándar por ID
   */
  async getEstandarById(id) {
    const estandar = await prisma.estandarHabilitacion.findUnique({
      where: { id },
      include: {
        criterios: {
          where: { activo: true },
          orderBy: { codigo: 'asc' },
        },
        autoevaluaciones: {
          take: 5,
          orderBy: { fechaEvaluacion: 'desc' },
          include: {
            evaluador: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
    });

    if (!estandar) {
      throw new NotFoundError('Estándar de habilitación no encontrado');
    }

    return estandar;
  }

  /**
   * Crear un estándar de habilitación
   */
  async createEstandar(data) {
    const { codigo, tipo, nombre, descripcion, normativaRef, servicioAplica } = data;

    // Validar código único
    const existing = await prisma.estandarHabilitacion.findUnique({ where: { codigo } });
    if (existing) {
      throw new ValidationError('Ya existe un estándar con este código');
    }

    const estandar = await prisma.estandarHabilitacion.create({
      data: {
        codigo,
        tipo,
        nombre,
        descripcion,
        normativaRef,
        servicioAplica: servicioAplica || [],
      },
    });

    return estandar;
  }

  /**
   * Actualizar un estándar
   */
  async updateEstandar(id, data) {
    const estandar = await prisma.estandarHabilitacion.findUnique({ where: { id } });
    if (!estandar) {
      throw new NotFoundError('Estándar no encontrado');
    }

    return prisma.estandarHabilitacion.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  // ==========================================
  // CRITERIOS DE HABILITACIÓN
  // ==========================================

  /**
   * Obtener criterios de un estándar
   */
  async getCriteriosByEstandar(estandarId) {
    return prisma.criterioHabilitacion.findMany({
      where: { estandarId, activo: true },
      orderBy: { codigo: 'asc' },
    });
  }

  /**
   * Crear un criterio
   */
  async createCriterio(data) {
    const { estandarId, codigo, descripcion, modoVerificacion, evidenciaRequerida, peso } = data;

    // Validar que existe el estándar
    const estandar = await prisma.estandarHabilitacion.findUnique({ where: { id: estandarId } });
    if (!estandar) {
      throw new NotFoundError('Estándar no encontrado');
    }

    return prisma.criterioHabilitacion.create({
      data: {
        estandarId,
        codigo,
        descripcion,
        modoVerificacion,
        evidenciaRequerida,
        peso: peso || 1,
      },
    });
  }

  /**
   * Actualizar un criterio
   */
  async updateCriterio(id, data) {
    const criterio = await prisma.criterioHabilitacion.findUnique({ where: { id } });
    if (!criterio) {
      throw new NotFoundError('Criterio no encontrado');
    }

    return prisma.criterioHabilitacion.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // AUTOEVALUACIONES
  // ==========================================

  /**
   * Obtener autoevaluaciones con filtros
   */
  async getAutoevaluaciones(query = {}) {
    const { page = 1, limit = 10, estandarId, estado, fechaDesde, fechaHasta } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(estandarId && { estandarId }),
      ...(estado && { estado }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaEvaluacion: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [autoevaluaciones, total] = await Promise.all([
      prisma.autoevaluacionHabilitacion.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          estandar: {
            select: { id: true, codigo: true, nombre: true, tipo: true },
          },
          evaluador: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { criteriosEvaluados: true, planesAccion: true },
          },
        },
        orderBy: { fechaEvaluacion: 'desc' },
      }),
      prisma.autoevaluacionHabilitacion.count({ where }),
    ]);

    return {
      autoevaluaciones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener una autoevaluación por ID
   */
  async getAutoevaluacionById(id) {
    const autoevaluacion = await prisma.autoevaluacionHabilitacion.findUnique({
      where: { id },
      include: {
        estandar: {
          include: {
            criterios: { where: { activo: true }, orderBy: { codigo: 'asc' } },
          },
        },
        evaluador: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        criteriosEvaluados: {
          include: {
            criterio: true,
          },
          orderBy: { fechaEvaluacion: 'desc' },
        },
        evidencias: {
          orderBy: { fechaCargue: 'desc' },
        },
        planesAccion: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!autoevaluacion) {
      throw new NotFoundError('Autoevaluación no encontrada');
    }

    return autoevaluacion;
  }

  /**
   * Crear una autoevaluación
   */
  async createAutoevaluacion(data) {
    const { estandarId, servicioId, evaluadorId, observaciones } = data;

    // Validar que existe el estándar
    const estandar = await prisma.estandarHabilitacion.findUnique({ where: { id: estandarId } });
    if (!estandar) {
      throw new NotFoundError('Estándar no encontrado');
    }

    return prisma.autoevaluacionHabilitacion.create({
      data: {
        estandarId,
        servicioId,
        evaluadorId,
        fechaEvaluacion: new Date(),
        porcentajeCumplimiento: 0,
        observaciones,
        estado: 'En Proceso',
      },
      include: {
        estandar: { select: { codigo: true, nombre: true } },
        evaluador: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Evaluar un criterio específico
   */
  async evaluarCriterio(data) {
    const { autoevaluacionId, criterioId, cumplimiento, observacion, evidenciaUrl } = data;

    // Validar autoevaluación
    const autoevaluacion = await prisma.autoevaluacionHabilitacion.findUnique({
      where: { id: autoevaluacionId },
    });
    if (!autoevaluacion) {
      throw new NotFoundError('Autoevaluación no encontrada');
    }

    // Verificar si ya existe evaluación de este criterio
    const existingEval = await prisma.evaluacionCriterio.findFirst({
      where: { autoevaluacionId, criterioId },
    });

    if (existingEval) {
      // Actualizar evaluación existente
      return prisma.evaluacionCriterio.update({
        where: { id: existingEval.id },
        data: {
          cumplimiento,
          observacion,
          evidenciaUrl,
          fechaEvaluacion: new Date(),
        },
      });
    }

    // Crear nueva evaluación
    return prisma.evaluacionCriterio.create({
      data: {
        autoevaluacionId,
        criterioId,
        cumplimiento,
        observacion,
        evidenciaUrl,
        fechaEvaluacion: new Date(),
      },
    });
  }

  /**
   * Calcular y actualizar porcentaje de cumplimiento
   */
  async calcularPorcentajeCumplimiento(autoevaluacionId) {
    const autoevaluacion = await prisma.autoevaluacionHabilitacion.findUnique({
      where: { id: autoevaluacionId },
      include: {
        estandar: {
          include: { criterios: { where: { activo: true } } },
        },
        criteriosEvaluados: {
          include: { criterio: true },
        },
      },
    });

    if (!autoevaluacion) {
      throw new NotFoundError('Autoevaluación no encontrada');
    }

    const totalCriterios = autoevaluacion.estandar.criterios.length;
    if (totalCriterios === 0) return 0;

    let puntajeObtenido = 0;
    let puntajeMaximo = 0;

    for (const criterio of autoevaluacion.estandar.criterios) {
      const evaluacion = autoevaluacion.criteriosEvaluados.find(
        (e) => e.criterioId === criterio.id
      );
      const peso = criterio.peso || 1;
      puntajeMaximo += peso;

      if (evaluacion) {
        switch (evaluacion.cumplimiento) {
          case 'CUMPLE':
            puntajeObtenido += peso;
            break;
          case 'CUMPLE_PARCIAL':
            puntajeObtenido += peso * 0.5;
            break;
          case 'NO_CUMPLE':
          case 'NO_APLICA':
          default:
            break;
        }
      }
    }

    const porcentaje = puntajeMaximo > 0 ? (puntajeObtenido / puntajeMaximo) * 100 : 0;

    await prisma.autoevaluacionHabilitacion.update({
      where: { id: autoevaluacionId },
      data: { porcentajeCumplimiento: Math.round(porcentaje * 100) / 100 },
    });

    return porcentaje;
  }

  /**
   * Cerrar una autoevaluación
   */
  async cerrarAutoevaluacion(id) {
    const autoevaluacion = await prisma.autoevaluacionHabilitacion.findUnique({ where: { id } });
    if (!autoevaluacion) {
      throw new NotFoundError('Autoevaluación no encontrada');
    }

    // Calcular porcentaje final
    await this.calcularPorcentajeCumplimiento(id);

    return prisma.autoevaluacionHabilitacion.update({
      where: { id },
      data: {
        estado: 'Cerrada',
        fechaCierre: new Date(),
      },
    });
  }

  // ==========================================
  // VISITAS DE VERIFICACIÓN
  // ==========================================

  /**
   * Obtener visitas de verificación
   */
  async getVisitas(query = {}) {
    const { page = 1, limit = 10, tipoVisita, estado, fechaDesde, fechaHasta } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(tipoVisita && { tipoVisita }),
      ...(estado && { estado }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaVisita: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [visitas, total] = await Promise.all([
      prisma.visitaVerificacion.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: { planesMejora: true },
          },
        },
        orderBy: { fechaVisita: 'desc' },
      }),
      prisma.visitaVerificacion.count({ where }),
    ]);

    return {
      visitas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener visita por ID
   */
  async getVisitaById(id) {
    const visita = await prisma.visitaVerificacion.findUnique({
      where: { id },
      include: {
        planesMejora: {
          include: {
            responsable: { select: { id: true, nombre: true, apellido: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!visita) {
      throw new NotFoundError('Visita de verificación no encontrada');
    }

    return visita;
  }

  /**
   * Crear visita de verificación
   */
  async createVisita(data) {
    const {
      tipoVisita,
      entidadVisitadora,
      fechaVisita,
      fechaNotificacion,
      observaciones,
    } = data;

    return prisma.visitaVerificacion.create({
      data: {
        tipoVisita,
        entidadVisitadora,
        fechaVisita: new Date(fechaVisita),
        fechaNotificacion: fechaNotificacion ? new Date(fechaNotificacion) : null,
        observaciones,
        estado: 'Programada',
      },
    });
  }

  /**
   * Actualizar visita
   */
  async updateVisita(id, data) {
    const visita = await prisma.visitaVerificacion.findUnique({ where: { id } });
    if (!visita) {
      throw new NotFoundError('Visita no encontrada');
    }

    return prisma.visitaVerificacion.update({
      where: { id },
      data: {
        ...data,
        fechaVisita: data.fechaVisita ? new Date(data.fechaVisita) : undefined,
        fechaNotificacion: data.fechaNotificacion ? new Date(data.fechaNotificacion) : undefined,
        fechaLimitePlan: data.fechaLimitePlan ? new Date(data.fechaLimitePlan) : undefined,
      },
    });
  }

  /**
   * Registrar hallazgos de una visita
   */
  async registrarHallazgosVisita(visitaId, hallazgos) {
    const visita = await prisma.visitaVerificacion.findUnique({ where: { id: visitaId } });
    if (!visita) {
      throw new NotFoundError('Visita no encontrada');
    }

    return prisma.visitaVerificacion.update({
      where: { id: visitaId },
      data: {
        hallazgos,
        estado: 'Realizada',
        requierePlanMejora: hallazgos && hallazgos.length > 0,
      },
    });
  }

  // ==========================================
  // REPORTES Y ESTADÍSTICAS
  // ==========================================

  /**
   * Dashboard de habilitación
   */
  async getDashboard() {
    const [
      totalEstandares,
      autoevaluacionesEnProceso,
      autoevaluacionesCerradas,
      visitasProgramadas,
      visitasRealizadas,
      ultimasAutoevaluaciones,
      proximasVisitas,
    ] = await Promise.all([
      prisma.estandarHabilitacion.count({ where: { activo: true } }),
      prisma.autoevaluacionHabilitacion.count({ where: { estado: 'En Proceso' } }),
      prisma.autoevaluacionHabilitacion.count({ where: { estado: 'Cerrada' } }),
      prisma.visitaVerificacion.count({ where: { estado: 'Programada' } }),
      prisma.visitaVerificacion.count({ where: { estado: 'Realizada' } }),
      prisma.autoevaluacionHabilitacion.findMany({
        take: 5,
        orderBy: { fechaEvaluacion: 'desc' },
        include: {
          estandar: { select: { codigo: true, nombre: true } },
        },
      }),
      prisma.visitaVerificacion.findMany({
        where: { estado: 'Programada', fechaVisita: { gte: new Date() } },
        take: 5,
        orderBy: { fechaVisita: 'asc' },
      }),
    ]);

    // Calcular promedio de cumplimiento por estándar
    const promediosPorEstandar = await prisma.autoevaluacionHabilitacion.groupBy({
      by: ['estandarId'],
      _avg: { porcentajeCumplimiento: true },
      where: { estado: 'Cerrada' },
    });

    return {
      resumen: {
        totalEstandares,
        autoevaluacionesEnProceso,
        autoevaluacionesCerradas,
        visitasProgramadas,
        visitasRealizadas,
      },
      ultimasAutoevaluaciones,
      proximasVisitas,
      promediosPorEstandar,
    };
  }

  /**
   * Generar declaración para REPS
   */
  async generarDeclaracionREPS() {
    // Obtener última autoevaluación cerrada de cada estándar
    const estandares = await prisma.estandarHabilitacion.findMany({
      where: { activo: true },
      include: {
        autoevaluaciones: {
          where: { estado: 'Cerrada' },
          orderBy: { fechaCierre: 'desc' },
          take: 1,
        },
      },
    });

    const declaracion = {
      fechaGeneracion: new Date().toISOString(),
      codigoHabilitacion: process.env.CODIGO_HABILITACION || '',
      estandares: estandares.map((e) => ({
        codigo: e.codigo,
        nombre: e.nombre,
        tipo: e.tipo,
        cumplimiento:
          e.autoevaluaciones.length > 0
            ? e.autoevaluaciones[0].porcentajeCumplimiento
            : null,
        fechaUltimaEvaluacion:
          e.autoevaluaciones.length > 0
            ? e.autoevaluaciones[0].fechaCierre
            : null,
      })),
    };

    return declaracion;
  }
}

module.exports = new HabilitacionService();
