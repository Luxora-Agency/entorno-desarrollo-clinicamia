/**
 * Service de Planes de Acción de Calidad
 * Gestión transversal de planes de mejora, seguimientos y evidencias
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class PlanAccionService {
  // ==========================================
  // PLANES DE ACCIÓN
  // ==========================================

  /**
   * Obtener planes de acción con filtros
   */
  async getPlanes(query = {}) {
    const {
      page = 1,
      limit = 10,
      origen,
      tipoAccion,
      estado,
      responsableId,
      vencidos,
      fechaDesde,
      fechaHasta,
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(origen && { origen }),
      ...(tipoAccion && { tipoAccion }),
      ...(estado && { estado }),
      ...(responsableId && { responsableId }),
      ...(vencidos === 'true' && {
        fechaLimite: { lt: new Date() },
        estado: { notIn: ['Cerrado', 'Cancelado'] },
      }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaInicio: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [planes, total] = await Promise.all([
      prisma.planAccionCalidad.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          responsable: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { seguimientos: true, evidencias: true },
          },
        },
        orderBy: [{ estado: 'asc' }, { fechaLimite: 'asc' }],
      }),
      prisma.planAccionCalidad.count({ where }),
    ]);

    return {
      planes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener plan por ID
   */
  async getPlanById(id) {
    const plan = await prisma.planAccionCalidad.findUnique({
      where: { id },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        autoevaluacion: {
          include: {
            estandar: { select: { codigo: true, nombre: true } },
          },
        },
        visita: true,
        proceso: { select: { nombre: true } },
        hallazgo: {
          include: {
            auditoria: { select: { id: true, tipoAuditoria: true } },
          },
        },
        evento: {
          select: { codigo: true, tipoEvento: true, severidad: true },
        },
        ronda: true,
        seguimientos: {
          include: {
            registrador: { select: { nombre: true, apellido: true } },
          },
          orderBy: { fechaSeguimiento: 'desc' },
        },
        evidencias: {
          include: {
            cargador: { select: { nombre: true, apellido: true } },
          },
          orderBy: { fechaCargue: 'desc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError('Plan de acción no encontrado');
    }

    return plan;
  }

  /**
   * Crear plan de acción
   */
  async createPlan(data) {
    const {
      origen,
      autoevaluacionId,
      visitaId,
      procesoId,
      hallazgoId,
      eventoId,
      rondaId,
      descripcionProblema,
      causaRaiz,
      accionPropuesta,
      tipoAccion,
      responsableId,
      fechaInicio,
      fechaLimite,
      recursos,
      indicadorSeguimiento,
      metaEsperada,
    } = data;

    // Validar responsable
    const responsable = await prisma.usuario.findUnique({ where: { id: responsableId } });
    if (!responsable) {
      throw new NotFoundError('Responsable no encontrado');
    }

    // Validar fechas
    if (new Date(fechaLimite) < new Date(fechaInicio)) {
      throw new ValidationError('La fecha límite no puede ser anterior a la fecha de inicio');
    }

    return prisma.planAccionCalidad.create({
      data: {
        origen,
        autoevaluacionId,
        visitaId,
        procesoId,
        hallazgoId,
        eventoId,
        rondaId,
        descripcionProblema,
        causaRaiz,
        accionPropuesta,
        tipoAccion,
        responsableId,
        fechaInicio: new Date(fechaInicio),
        fechaLimite: new Date(fechaLimite),
        recursos,
        indicadorSeguimiento,
        metaEsperada,
        avancePorcentaje: 0,
        estado: 'Abierto',
      },
      include: {
        responsable: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Actualizar plan de acción
   */
  async updatePlan(id, data) {
    const plan = await prisma.planAccionCalidad.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundError('Plan de acción no encontrado');
    }

    return prisma.planAccionCalidad.update({
      where: { id },
      data: {
        ...data,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : undefined,
      },
    });
  }

  // ==========================================
  // SEGUIMIENTOS
  // ==========================================

  /**
   * Registrar seguimiento de plan
   */
  async registrarSeguimiento(data) {
    const {
      planId,
      avanceReportado,
      descripcionAvance,
      dificultades,
      requiereAjuste,
      registradoPor,
    } = data;

    const plan = await prisma.planAccionCalidad.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundError('Plan de acción no encontrado');
    }

    if (plan.estado === 'Cerrado' || plan.estado === 'Cancelado') {
      throw new ValidationError('No se pueden agregar seguimientos a planes cerrados o cancelados');
    }

    // Crear seguimiento
    const seguimiento = await prisma.seguimientoPlanAccion.create({
      data: {
        planId,
        fechaSeguimiento: new Date(),
        avanceReportado,
        descripcionAvance,
        dificultades,
        requiereAjuste: requiereAjuste || false,
        registradoPor,
      },
    });

    // Actualizar avance del plan
    await prisma.planAccionCalidad.update({
      where: { id: planId },
      data: {
        avancePorcentaje: avanceReportado,
        estado: avanceReportado >= 100 ? 'Completado' : 'En Ejecución',
      },
    });

    return seguimiento;
  }

  /**
   * Obtener seguimientos de un plan
   */
  async getSeguimientos(planId) {
    return prisma.seguimientoPlanAccion.findMany({
      where: { planId },
      include: {
        registrador: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaSeguimiento: 'desc' },
    });
  }

  // ==========================================
  // EVIDENCIAS
  // ==========================================

  /**
   * Cargar evidencia
   */
  async cargarEvidencia(data) {
    const {
      planAccionId,
      autoevaluacionId,
      tipo,
      nombre,
      descripcion,
      archivoUrl,
      cargadoPor,
    } = data;

    // Validar que exista el plan o la autoevaluación
    if (planAccionId) {
      const plan = await prisma.planAccionCalidad.findUnique({ where: { id: planAccionId } });
      if (!plan) {
        throw new NotFoundError('Plan de acción no encontrado');
      }
    }

    if (autoevaluacionId) {
      const autoevaluacion = await prisma.autoevaluacionHabilitacion.findUnique({
        where: { id: autoevaluacionId },
      });
      if (!autoevaluacion) {
        throw new NotFoundError('Autoevaluación no encontrada');
      }
    }

    return prisma.evidenciaCalidad.create({
      data: {
        tipo,
        nombre,
        descripcion,
        archivoUrl,
        cargadoPor,
        planAccionId,
        autoevaluacionId,
      },
      include: {
        cargador: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Obtener evidencias de un plan
   */
  async getEvidencias(planId) {
    return prisma.evidenciaCalidad.findMany({
      where: { planAccionId: planId },
      include: {
        cargador: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaCargue: 'desc' },
    });
  }

  /**
   * Eliminar evidencia
   */
  async eliminarEvidencia(id) {
    const evidencia = await prisma.evidenciaCalidad.findUnique({ where: { id } });
    if (!evidencia) {
      throw new NotFoundError('Evidencia no encontrada');
    }

    return prisma.evidenciaCalidad.delete({ where: { id } });
  }

  // ==========================================
  // CIERRE Y VERIFICACIÓN
  // ==========================================

  /**
   * Cerrar plan de acción
   */
  async cerrarPlan(id, data) {
    const { resultadoObtenido, eficaciaVerificada } = data;

    const plan = await prisma.planAccionCalidad.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundError('Plan de acción no encontrado');
    }

    return prisma.planAccionCalidad.update({
      where: { id },
      data: {
        estado: 'Cerrado',
        fechaCierre: new Date(),
        resultadoObtenido,
        eficaciaVerificada,
        avancePorcentaje: 100,
      },
    });
  }

  /**
   * Cancelar plan de acción
   */
  async cancelarPlan(id, motivo) {
    const plan = await prisma.planAccionCalidad.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundError('Plan de acción no encontrado');
    }

    return prisma.planAccionCalidad.update({
      where: { id },
      data: {
        estado: 'Cancelado',
        fechaCierre: new Date(),
        resultadoObtenido: `[CANCELADO] ${motivo}`,
      },
    });
  }

  /**
   * Reabrir plan de acción
   */
  async reabrirPlan(id, nuevaFechaLimite) {
    const plan = await prisma.planAccionCalidad.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundError('Plan de acción no encontrado');
    }

    if (plan.estado !== 'Cerrado' && plan.estado !== 'Cancelado') {
      throw new ValidationError('Solo se pueden reabrir planes cerrados o cancelados');
    }

    return prisma.planAccionCalidad.update({
      where: { id },
      data: {
        estado: 'En Ejecución',
        fechaCierre: null,
        fechaLimite: nuevaFechaLimite ? new Date(nuevaFechaLimite) : plan.fechaLimite,
        eficaciaVerificada: null,
      },
    });
  }

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  /**
   * Dashboard de planes de acción
   */
  async getDashboard() {
    const hoy = new Date();

    const [
      totalPlanes,
      planesPorEstado,
      planesPorOrigen,
      planesPorTipo,
      planesVencidos,
      planesPorVencer,
      eficaciaPromedio,
    ] = await Promise.all([
      prisma.planAccionCalidad.count(),
      prisma.planAccionCalidad.groupBy({
        by: ['estado'],
        _count: true,
      }),
      prisma.planAccionCalidad.groupBy({
        by: ['origen'],
        _count: true,
      }),
      prisma.planAccionCalidad.groupBy({
        by: ['tipoAccion'],
        _count: true,
      }),
      prisma.planAccionCalidad.count({
        where: {
          fechaLimite: { lt: hoy },
          estado: { notIn: ['Cerrado', 'Cancelado'] },
        },
      }),
      prisma.planAccionCalidad.count({
        where: {
          fechaLimite: {
            gte: hoy,
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // próximos 7 días
          },
          estado: { notIn: ['Cerrado', 'Cancelado'] },
        },
      }),
      prisma.planAccionCalidad.aggregate({
        _avg: { avancePorcentaje: true },
        where: { estado: 'Cerrado', eficaciaVerificada: true },
      }),
    ]);

    // Planes que requieren atención (vencidos o sin seguimiento reciente)
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const planesRequierenAtencion = await prisma.planAccionCalidad.findMany({
      where: {
        estado: { in: ['Abierto', 'En Ejecución'] },
        OR: [
          { fechaLimite: { lt: hoy } },
          {
            seguimientos: {
              none: { fechaSeguimiento: { gte: hace30Dias } },
            },
          },
        ],
      },
      include: {
        responsable: { select: { nombre: true, apellido: true } },
      },
      take: 10,
      orderBy: { fechaLimite: 'asc' },
    });

    // Cumplimiento de planes por responsable
    const cumplimientoPorResponsable = await prisma.planAccionCalidad.groupBy({
      by: ['responsableId'],
      _count: true,
      _avg: { avancePorcentaje: true },
      where: { estado: { notIn: ['Cancelado'] } },
    });

    return {
      resumen: {
        totalPlanes,
        abiertos: planesPorEstado.find((e) => e.estado === 'Abierto')?._count || 0,
        enEjecucion: planesPorEstado.find((e) => e.estado === 'En Ejecución')?._count || 0,
        completados: planesPorEstado.find((e) => e.estado === 'Completado')?._count || 0,
        cerrados: planesPorEstado.find((e) => e.estado === 'Cerrado')?._count || 0,
        planesVencidos,
        planesPorVencer,
        eficaciaPromedio: eficaciaPromedio._avg?.avancePorcentaje || 0,
      },
      planesPorEstado,
      planesPorOrigen,
      planesPorTipo,
      planesRequierenAtencion,
      cumplimientoPorResponsable,
    };
  }

  /**
   * Reporte de eficacia de planes
   */
  async getReporteEficacia(fechaDesde, fechaHasta) {
    const where = {
      estado: 'Cerrado',
      ...(fechaDesde || fechaHasta
        ? {
            fechaCierre: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const planes = await prisma.planAccionCalidad.findMany({
      where,
      include: {
        responsable: { select: { nombre: true, apellido: true } },
      },
    });

    const totales = {
      total: planes.length,
      eficaces: planes.filter((p) => p.eficaciaVerificada === true).length,
      noEficaces: planes.filter((p) => p.eficaciaVerificada === false).length,
      sinVerificar: planes.filter((p) => p.eficaciaVerificada === null).length,
    };

    const porOrigen = {};
    planes.forEach((p) => {
      if (!porOrigen[p.origen]) {
        porOrigen[p.origen] = { total: 0, eficaces: 0 };
      }
      porOrigen[p.origen].total++;
      if (p.eficaciaVerificada) {
        porOrigen[p.origen].eficaces++;
      }
    });

    return {
      periodo: { fechaDesde, fechaHasta },
      totales,
      tasaEficacia: totales.total > 0
        ? (totales.eficaces / (totales.total - totales.sinVerificar)) * 100
        : 0,
      porOrigen,
      planes,
    };
  }

  /**
   * Obtener planes próximos a vencer
   */
  async getPlanesPorVencer(diasAnticipacion = 7) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    return prisma.planAccionCalidad.findMany({
      where: {
        fechaLimite: {
          gte: new Date(),
          lte: fechaLimite,
        },
        estado: { notIn: ['Cerrado', 'Cancelado'] },
      },
      include: {
        responsable: { select: { nombre: true, apellido: true, email: true } },
      },
      orderBy: { fechaLimite: 'asc' },
    });
  }
}

module.exports = new PlanAccionService();
