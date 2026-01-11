/**
 * Servicio de Plan Anual de Trabajo SST
 * Gestiona objetivos, metas, actividades y seguimiento
 * Normativa: Decreto 1072/2015, Resolucion 0312/2019
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class PlanAnualService {
  /**
   * Listar planes anuales
   */
  async findAll({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const [planes, total] = await Promise.all([
      prisma.sSTPlanAnualTrabajo.findMany({
        skip,
        take: limit,
        orderBy: { anio: 'desc' },
        include: {
          _count: {
            select: { metas: true, actividades: true },
          },
        },
      }),
      prisma.sSTPlanAnualTrabajo.count(),
    ]);

    return {
      data: planes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener plan del año actual
   */
  async getPlanActual() {
    const anioActual = new Date().getFullYear();

    const plan = await prisma.sSTPlanAnualTrabajo.findFirst({
      where: { anio: anioActual },
      include: {
        metas: {
          orderBy: { orden: 'asc' },
        },
        actividades: {
          orderBy: [{ mes: 'asc' }, { fechaProgramada: 'asc' }],
          include: {
            responsable: {
              select: { id: true, nombre: true, apellido: true },
            },
            evidencias: true,
          },
        },
      },
    });

    return plan;
  }

  /**
   * Obtener plan por ID
   */
  async findById(id) {
    const plan = await prisma.sSTPlanAnualTrabajo.findUnique({
      where: { id },
      include: {
        metas: {
          orderBy: { orden: 'asc' },
        },
        actividades: {
          orderBy: [{ mes: 'asc' }, { fechaProgramada: 'asc' }],
          include: {
            responsable: {
              select: { id: true, nombre: true, apellido: true },
            },
            evidencias: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError('Plan anual no encontrado');
    }

    return plan;
  }

  /**
   * Crear plan anual
   */
  async create(data) {
    // Verificar si ya existe plan para el año
    const existente = await prisma.sSTPlanAnualTrabajo.findFirst({
      where: { anio: data.anio },
    });

    if (existente) {
      throw new ValidationError(`Ya existe un plan para el año ${data.anio}`);
    }

    const plan = await prisma.sSTPlanAnualTrabajo.create({
      data: {
        anio: data.anio,
        version: 1,
        objetivoGeneral: data.objetivoGeneral,
        alcance: data.alcance,
        politicaSST: data.politicaSST,
        recursos: data.recursos,
        presupuesto: data.presupuesto,
        elaboradoPor: data.elaboradoPor,
        revisadoPor: data.revisadoPor,
        aprobadoPor: data.aprobadoPor,
        fechaAprobacion: data.fechaAprobacion ? new Date(data.fechaAprobacion) : null,
        estado: 'BORRADOR',
      },
    });

    return plan;
  }

  /**
   * Actualizar plan
   */
  async update(id, data) {
    const plan = await prisma.sSTPlanAnualTrabajo.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundError('Plan anual no encontrado');
    }

    const updated = await prisma.sSTPlanAnualTrabajo.update({
      where: { id },
      data: {
        ...data,
        fechaAprobacion: data.fechaAprobacion ? new Date(data.fechaAprobacion) : undefined,
      },
    });

    return updated;
  }

  /**
   * Agregar meta al plan
   */
  async agregarMeta(planId, data) {
    const plan = await prisma.sSTPlanAnualTrabajo.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError('Plan anual no encontrado');
    }

    // Obtener orden de la ultima meta
    const ultimaMeta = await prisma.sSTMetaPlan.findFirst({
      where: { planId },
      orderBy: { orden: 'desc' },
    });

    const meta = await prisma.sSTMetaPlan.create({
      data: {
        planId,
        cicloPHVA: data.cicloPHVA, // PLANEAR, HACER, VERIFICAR, ACTUAR
        objetivo: data.objetivo,
        indicador: data.indicador,
        metaCuantitativa: data.metaCuantitativa,
        unidadMedida: data.unidadMedida,
        formula: data.formula,
        frecuenciaMedicion: data.frecuenciaMedicion,
        orden: (ultimaMeta?.orden || 0) + 1,
      },
    });

    return meta;
  }

  /**
   * Actualizar meta
   */
  async actualizarMeta(metaId, data) {
    const meta = await prisma.sSTMetaPlan.findUnique({
      where: { id: metaId },
    });

    if (!meta) {
      throw new NotFoundError('Meta no encontrada');
    }

    const updated = await prisma.sSTMetaPlan.update({
      where: { id: metaId },
      data: {
        resultadoObtenido: data.resultadoObtenido,
        cumplimiento: data.cumplimiento,
        analisis: data.analisis,
        ...data,
      },
    });

    return updated;
  }

  /**
   * Eliminar meta
   */
  async eliminarMeta(metaId) {
    await prisma.sSTMetaPlan.delete({
      where: { id: metaId },
    });

    return { message: 'Meta eliminada' };
  }

  /**
   * Agregar actividad al plan
   */
  async agregarActividad(planId, data) {
    const plan = await prisma.sSTPlanAnualTrabajo.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError('Plan anual no encontrado');
    }

    // Validar responsable
    if (data.responsableId) {
      const responsable = await prisma.tHEmpleado.findUnique({
        where: { id: data.responsableId },
      });
      if (!responsable) {
        throw new ValidationError('Responsable no encontrado');
      }
    }

    const actividad = await prisma.sSTActividadPlan.create({
      data: {
        planId,
        cicloPHVA: data.cicloPHVA,
        descripcion: data.descripcion,
        mes: data.mes,
        fechaProgramada: data.fechaProgramada ? new Date(data.fechaProgramada) : null,
        responsableId: data.responsableId,
        recursos: data.recursos,
        indicadorCumplimiento: data.indicadorCumplimiento,
        estado: 'PENDIENTE',
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return actividad;
  }

  /**
   * Actualizar actividad
   */
  async actualizarActividad(actividadId, data) {
    const actividad = await prisma.sSTActividadPlan.findUnique({
      where: { id: actividadId },
    });

    if (!actividad) {
      throw new NotFoundError('Actividad no encontrada');
    }

    const updated = await prisma.sSTActividadPlan.update({
      where: { id: actividadId },
      data: {
        estado: data.estado,
        fechaEjecucion: data.fechaEjecucion ? new Date(data.fechaEjecucion) : undefined,
        observaciones: data.observaciones,
        porcentajeAvance: data.porcentajeAvance,
        ...data,
      },
    });

    return updated;
  }

  /**
   * Agregar evidencia a actividad
   */
  async agregarEvidencia(actividadId, data) {
    const actividad = await prisma.sSTActividadPlan.findUnique({
      where: { id: actividadId },
    });

    if (!actividad) {
      throw new NotFoundError('Actividad no encontrada');
    }

    const evidencia = await prisma.sSTEvidenciaActividad.create({
      data: {
        actividadId,
        nombre: data.nombre,
        tipo: data.tipo,
        url: data.url,
        descripcion: data.descripcion,
      },
    });

    return evidencia;
  }

  /**
   * Obtener cumplimiento del plan
   */
  async getCumplimiento(planId) {
    const plan = await prisma.sSTPlanAnualTrabajo.findUnique({
      where: { id: planId },
      include: {
        actividades: true,
        metas: true,
      },
    });

    if (!plan) {
      throw new NotFoundError('Plan no encontrado');
    }

    // Calcular cumplimiento por ciclo PHVA
    const porCiclo = { PLANEAR: { total: 0, cumplidas: 0 }, HACER: { total: 0, cumplidas: 0 }, VERIFICAR: { total: 0, cumplidas: 0 }, ACTUAR: { total: 0, cumplidas: 0 } };

    plan.actividades.forEach(a => {
      if (porCiclo[a.cicloPHVA]) {
        porCiclo[a.cicloPHVA].total++;
        if (a.estado === 'COMPLETADA') {
          porCiclo[a.cicloPHVA].cumplidas++;
        }
      }
    });

    // Cumplimiento por mes
    const porMes = {};
    for (let m = 1; m <= 12; m++) {
      const actMes = plan.actividades.filter(a => a.mes === m);
      porMes[m] = {
        total: actMes.length,
        cumplidas: actMes.filter(a => a.estado === 'COMPLETADA').length,
      };
    }

    const totalActividades = plan.actividades.length;
    const actividadesCumplidas = plan.actividades.filter(a => a.estado === 'COMPLETADA').length;

    return {
      anio: plan.anio,
      cumplimientoGeneral: totalActividades > 0 ? (actividadesCumplidas / totalActividades) * 100 : 0,
      actividades: {
        total: totalActividades,
        cumplidas: actividadesCumplidas,
        pendientes: plan.actividades.filter(a => a.estado === 'PENDIENTE').length,
        enProceso: plan.actividades.filter(a => a.estado === 'EN_PROCESO').length,
      },
      porCicloPHVA: Object.entries(porCiclo).map(([ciclo, data]) => ({
        ciclo,
        total: data.total,
        cumplidas: data.cumplidas,
        porcentaje: data.total > 0 ? (data.cumplidas / data.total) * 100 : 0,
      })),
      porMes: Object.entries(porMes).map(([mes, data]) => ({
        mes: parseInt(mes),
        total: data.total,
        cumplidas: data.cumplidas,
        porcentaje: data.total > 0 ? (data.cumplidas / data.total) * 100 : 0,
      })),
    };
  }

  /**
   * Obtener actividades del mes actual
   */
  async getActividadesMesActual() {
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    const plan = await prisma.sSTPlanAnualTrabajo.findFirst({
      where: { anio: anioActual },
    });

    if (!plan) return [];

    return prisma.sSTActividadPlan.findMany({
      where: {
        planId: plan.id,
        mes: mesActual,
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { fechaProgramada: 'asc' },
    });
  }

  /**
   * Clonar plan del año anterior
   */
  async clonarPlanAnterior(anioDestino) {
    const anioOrigen = anioDestino - 1;

    const planOrigen = await prisma.sSTPlanAnualTrabajo.findFirst({
      where: { anio: anioOrigen },
      include: { metas: true, actividades: true },
    });

    if (!planOrigen) {
      throw new NotFoundError(`No existe plan del año ${anioOrigen} para clonar`);
    }

    // Verificar que no exista plan destino
    const planExistente = await prisma.sSTPlanAnualTrabajo.findFirst({
      where: { anio: anioDestino },
    });

    if (planExistente) {
      throw new ValidationError(`Ya existe un plan para el año ${anioDestino}`);
    }

    // Crear nuevo plan
    const nuevoPlan = await prisma.sSTPlanAnualTrabajo.create({
      data: {
        anio: anioDestino,
        version: 1,
        objetivoGeneral: planOrigen.objetivoGeneral,
        alcance: planOrigen.alcance,
        politicaSST: planOrigen.politicaSST,
        recursos: planOrigen.recursos,
        presupuesto: planOrigen.presupuesto,
        estado: 'BORRADOR',
      },
    });

    // Clonar metas
    for (const meta of planOrigen.metas) {
      await prisma.sSTMetaPlan.create({
        data: {
          planId: nuevoPlan.id,
          cicloPHVA: meta.cicloPHVA,
          objetivo: meta.objetivo,
          indicador: meta.indicador,
          metaCuantitativa: meta.metaCuantitativa,
          unidadMedida: meta.unidadMedida,
          formula: meta.formula,
          frecuenciaMedicion: meta.frecuenciaMedicion,
          orden: meta.orden,
        },
      });
    }

    // Clonar actividades
    for (const act of planOrigen.actividades) {
      await prisma.sSTActividadPlan.create({
        data: {
          planId: nuevoPlan.id,
          cicloPHVA: act.cicloPHVA,
          descripcion: act.descripcion,
          mes: act.mes,
          responsableId: act.responsableId,
          recursos: act.recursos,
          indicadorCumplimiento: act.indicadorCumplimiento,
          estado: 'PENDIENTE',
        },
      });
    }

    return nuevoPlan;
  }
}

module.exports = new PlanAnualService();
