const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { safeDate } = require('../../utils/date');

class InduccionService {
  /**
   * Obtener todos los procesos de inducción
   */
  async findAll(query = {}) {
    const { page = 1, limit = 20, tipo, estado, personalId, search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(tipo && { tipo }),
      ...(estado && { estado }),
      ...(personalId && { personalId }),
      ...(search && {
        OR: [
          { personal: { nombreCompleto: { contains: search, mode: 'insensitive' } } },
          { observaciones: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.procesoInduccion.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          personal: {
            select: { id: true, nombreCompleto: true, cargo: true, numeroDocumento: true },
          },
          fases: { orderBy: { orden: 'asc' } },
          evaluacion: true,
        },
        orderBy: [{ estado: 'asc' }, { fechaInicio: 'desc' }],
      }),
      prisma.procesoInduccion.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener proceso de inducción por ID
   */
  async findById(id) {
    const proceso = await prisma.procesoInduccion.findUnique({
      where: { id },
      include: {
        personal: {
          select: { id: true, nombreCompleto: true, cargo: true, numeroDocumento: true, email: true },
        },
        fases: { orderBy: { orden: 'asc' } },
        evaluacion: true,
      },
    });

    if (!proceso) {
      throw new NotFoundError('Proceso de inducción no encontrado');
    }

    return proceso;
  }

  /**
   * Crear proceso de inducción con fases predeterminadas
   */
  async create(data, userId) {
    const { personalId, tipo, fechaInicio, observaciones, fases } = data;

    // Verificar que el personal existe
    const personal = await prisma.personal.findUnique({ where: { id: personalId } });
    if (!personal) {
      throw new NotFoundError('Personal no encontrado');
    }

    // Verificar que no tenga un proceso activo
    const procesoActivo = await prisma.procesoInduccion.findFirst({
      where: {
        personalId,
        estado: { in: ['PROGRAMADO', 'EN_PROCESO'] },
      },
    });

    if (procesoActivo) {
      throw new ValidationError('El personal ya tiene un proceso de inducción activo');
    }

    // Fases predeterminadas según el tipo
    const fasesDefault = this.getFasesPredeterminadas(tipo);
    const fasesToCreate = fases && fases.length > 0 ? fases : fasesDefault;

    const proceso = await prisma.procesoInduccion.create({
      data: {
        personalId,
        tipo,
        fechaInicio: safeDate(fechaInicio) || new Date(),
        observaciones,
        creadoPor: userId,
        fases: {
          create: fasesToCreate.map((f, idx) => ({
            fase: f.fase,
            tema: f.tema,
            descripcion: f.descripcion || null,
            responsable: f.responsable || null,
            fechaProgramada: safeDate(f.fechaProgramada),
            orden: f.orden ?? idx,
          })),
        },
      },
      include: {
        personal: { select: { id: true, nombreCompleto: true, cargo: true } },
        fases: { orderBy: { orden: 'asc' } },
      },
    });

    return proceso;
  }

  /**
   * Actualizar proceso de inducción
   */
  async update(id, data) {
    const proceso = await prisma.procesoInduccion.findUnique({ where: { id } });
    if (!proceso) {
      throw new NotFoundError('Proceso de inducción no encontrado');
    }

    if (proceso.estado === 'COMPLETADO' || proceso.estado === 'CANCELADO') {
      throw new ValidationError('No se puede modificar un proceso completado o cancelado');
    }

    const { fechaInicio, fechaFin, estado, observaciones } = data;

    return prisma.procesoInduccion.update({
      where: { id },
      data: {
        ...(fechaInicio && { fechaInicio: safeDate(fechaInicio) }),
        ...(fechaFin && { fechaFin: safeDate(fechaFin) }),
        ...(estado && { estado }),
        ...(observaciones !== undefined && { observaciones }),
      },
      include: {
        personal: { select: { id: true, nombreCompleto: true, cargo: true } },
        fases: { orderBy: { orden: 'asc' } },
        evaluacion: true,
      },
    });
  }

  /**
   * Eliminar proceso de inducción
   */
  async delete(id) {
    const proceso = await prisma.procesoInduccion.findUnique({ where: { id } });
    if (!proceso) {
      throw new NotFoundError('Proceso de inducción no encontrado');
    }

    if (proceso.estado === 'EN_PROCESO') {
      throw new ValidationError('No se puede eliminar un proceso en ejecución');
    }

    await prisma.procesoInduccion.delete({ where: { id } });
    return { message: 'Proceso de inducción eliminado correctamente' };
  }

  /**
   * Iniciar proceso de inducción
   */
  async iniciar(id) {
    const proceso = await prisma.procesoInduccion.findUnique({ where: { id } });
    if (!proceso) {
      throw new NotFoundError('Proceso de inducción no encontrado');
    }

    if (proceso.estado !== 'PROGRAMADO') {
      throw new ValidationError('Solo se pueden iniciar procesos programados');
    }

    return prisma.procesoInduccion.update({
      where: { id },
      data: { estado: 'EN_PROCESO' },
      include: {
        personal: { select: { id: true, nombreCompleto: true, cargo: true } },
        fases: { orderBy: { orden: 'asc' } },
      },
    });
  }

  /**
   * Completar proceso de inducción
   */
  async completar(id) {
    const proceso = await prisma.procesoInduccion.findUnique({
      where: { id },
      include: { fases: true },
    });

    if (!proceso) {
      throw new NotFoundError('Proceso de inducción no encontrado');
    }

    if (proceso.estado !== 'EN_PROCESO') {
      throw new ValidationError('Solo se pueden completar procesos en ejecución');
    }

    // Verificar que todas las fases estén completadas
    const fasesIncompletas = proceso.fases.filter(f => !f.completado);
    if (fasesIncompletas.length > 0) {
      throw new ValidationError(`Hay ${fasesIncompletas.length} fases pendientes por completar`);
    }

    return prisma.procesoInduccion.update({
      where: { id },
      data: {
        estado: 'COMPLETADO',
        fechaFin: new Date(),
      },
      include: {
        personal: { select: { id: true, nombreCompleto: true, cargo: true } },
        fases: { orderBy: { orden: 'asc' } },
        evaluacion: true,
      },
    });
  }

  /**
   * Cancelar proceso de inducción
   */
  async cancelar(id, motivo) {
    const proceso = await prisma.procesoInduccion.findUnique({ where: { id } });
    if (!proceso) {
      throw new NotFoundError('Proceso de inducción no encontrado');
    }

    if (proceso.estado === 'COMPLETADO' || proceso.estado === 'CANCELADO') {
      throw new ValidationError('No se puede cancelar un proceso ya finalizado');
    }

    return prisma.procesoInduccion.update({
      where: { id },
      data: {
        estado: 'CANCELADO',
        observaciones: motivo ? `${proceso.observaciones || ''}\nMotivo cancelación: ${motivo}` : proceso.observaciones,
      },
    });
  }

  // ==========================================
  // FASES
  // ==========================================

  /**
   * Agregar fase a proceso
   */
  async addFase(procesoId, data) {
    const proceso = await prisma.procesoInduccion.findUnique({
      where: { id: procesoId },
      include: { fases: true },
    });

    if (!proceso) {
      throw new NotFoundError('Proceso de inducción no encontrado');
    }

    if (proceso.estado === 'COMPLETADO' || proceso.estado === 'CANCELADO') {
      throw new ValidationError('No se pueden agregar fases a un proceso finalizado');
    }

    const maxOrden = Math.max(...proceso.fases.map(f => f.orden), -1);

    return prisma.faseInduccion.create({
      data: {
        procesoId,
        fase: data.fase,
        tema: data.tema,
        descripcion: data.descripcion || null,
        responsable: data.responsable || null,
        fechaProgramada: safeDate(data.fechaProgramada),
        orden: data.orden ?? maxOrden + 1,
      },
    });
  }

  /**
   * Actualizar fase
   */
  async updateFase(faseId, data) {
    const fase = await prisma.faseInduccion.findUnique({ where: { id: faseId } });
    if (!fase) {
      throw new NotFoundError('Fase no encontrada');
    }

    return prisma.faseInduccion.update({
      where: { id: faseId },
      data: {
        ...(data.tema && { tema: data.tema }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.responsable !== undefined && { responsable: data.responsable }),
        ...(data.fechaProgramada !== undefined && { fechaProgramada: safeDate(data.fechaProgramada) }),
        ...(data.observaciones !== undefined && { observaciones: data.observaciones }),
        ...(data.orden !== undefined && { orden: data.orden }),
      },
    });
  }

  /**
   * Completar fase
   */
  async completarFase(faseId) {
    const fase = await prisma.faseInduccion.findUnique({
      where: { id: faseId },
      include: { proceso: true },
    });

    if (!fase) {
      throw new NotFoundError('Fase no encontrada');
    }

    if (fase.proceso.estado !== 'EN_PROCESO' && fase.proceso.estado !== 'PROGRAMADO') {
      throw new ValidationError('No se puede modificar un proceso finalizado');
    }

    return prisma.faseInduccion.update({
      where: { id: faseId },
      data: {
        completado: true,
        fechaCompletado: new Date(),
      },
    });
  }

  /**
   * Eliminar fase
   */
  async deleteFase(faseId) {
    const fase = await prisma.faseInduccion.findUnique({
      where: { id: faseId },
      include: { proceso: true },
    });

    if (!fase) {
      throw new NotFoundError('Fase no encontrada');
    }

    if (fase.proceso.estado === 'COMPLETADO' || fase.proceso.estado === 'CANCELADO') {
      throw new ValidationError('No se puede eliminar una fase de un proceso finalizado');
    }

    await prisma.faseInduccion.delete({ where: { id: faseId } });
    return { message: 'Fase eliminada correctamente' };
  }

  // ==========================================
  // EVALUACIÓN
  // ==========================================

  /**
   * Registrar evaluación del proceso
   */
  async registrarEvaluacion(procesoId, data, userId) {
    const proceso = await prisma.procesoInduccion.findUnique({
      where: { id: procesoId },
      include: { evaluacion: true },
    });

    if (!proceso) {
      throw new NotFoundError('Proceso de inducción no encontrado');
    }

    if (proceso.evaluacion) {
      // Actualizar evaluación existente
      return prisma.evaluacionInduccion.update({
        where: { id: proceso.evaluacion.id },
        data: {
          fechaEvaluacion: new Date(),
          aprobado: data.aprobado,
          puntaje: data.puntaje,
          comentarios: data.comentarios,
          respuestas: data.respuestas,
          evaluadoPor: userId,
        },
      });
    }

    // Crear nueva evaluación
    return prisma.evaluacionInduccion.create({
      data: {
        procesoId,
        fechaEvaluacion: new Date(),
        aprobado: data.aprobado,
        puntaje: data.puntaje,
        comentarios: data.comentarios,
        respuestas: data.respuestas,
        evaluadoPor: userId,
      },
    });
  }

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  /**
   * Obtener estadísticas de inducción
   */
  async getStats(query = {}) {
    const { anio } = query;
    const year = anio ? parseInt(anio) : new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [
      total,
      porEstado,
      porTipo,
      completadosEnTiempo,
      promedioFases,
    ] = await Promise.all([
      prisma.procesoInduccion.count({
        where: { createdAt: { gte: startDate, lt: endDate } },
      }),
      prisma.procesoInduccion.groupBy({
        by: ['estado'],
        where: { createdAt: { gte: startDate, lt: endDate } },
        _count: true,
      }),
      prisma.procesoInduccion.groupBy({
        by: ['tipo'],
        where: { createdAt: { gte: startDate, lt: endDate } },
        _count: true,
      }),
      prisma.procesoInduccion.count({
        where: {
          estado: 'COMPLETADO',
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      prisma.faseInduccion.aggregate({
        _count: { id: true },
      }),
    ]);

    return {
      total,
      porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count })),
      porTipo: porTipo.map(t => ({ tipo: t.tipo, cantidad: t._count })),
      completados: completadosEnTiempo,
      tasaCompletacion: total > 0 ? ((completadosEnTiempo / total) * 100).toFixed(1) : 0,
    };
  }

  /**
   * Obtener fases predeterminadas según tipo de inducción
   */
  getFasesPredeterminadas(tipo) {
    const fasesInduccion = [
      { fase: 'GENERAL', tema: 'Bienvenida y presentación institucional', orden: 0 },
      { fase: 'GENERAL', tema: 'Misión, Visión y Valores', orden: 1 },
      { fase: 'GENERAL', tema: 'Recorrido por las instalaciones', orden: 2 },
      { fase: 'GENERAL', tema: 'Políticas de Seguridad y Salud en el Trabajo', orden: 3 },
      { fase: 'GENERAL', tema: 'Sistema de Gestión de Calidad (Habilitación, PAMEC, Acreditación)', orden: 4 },
      { fase: 'ESPECIFICA', tema: 'Reglamento interno de trabajo', orden: 5 },
      { fase: 'ESPECIFICA', tema: 'Factores de riesgo del puesto de trabajo', orden: 6 },
      { fase: 'ESPECIFICA', tema: 'Funciones del cargo', orden: 7 },
      { fase: 'ESPECIFICA', tema: 'Elementos de Protección Personal (EPP)', orden: 8 },
      { fase: 'ESPECIFICA', tema: 'Reporte de accidentes de trabajo', orden: 9 },
      { fase: 'ESPECIFICA', tema: 'Plan de emergencias', orden: 10 },
      { fase: 'ESPECIFICA', tema: 'Horarios y modalidad de contratación', orden: 11 },
      { fase: 'EVALUATIVA', tema: 'Cuestionario de evaluación', orden: 12 },
    ];

    const fasesReinduccion = [
      { fase: 'GENERAL', tema: 'Actualización de políticas institucionales', orden: 0 },
      { fase: 'GENERAL', tema: 'Cambios en normatividad aplicable', orden: 1 },
      { fase: 'ESPECIFICA', tema: 'Actualización de procesos del área', orden: 2 },
      { fase: 'ESPECIFICA', tema: 'Refuerzo en seguridad y salud en el trabajo', orden: 3 },
      { fase: 'EVALUATIVA', tema: 'Cuestionario de evaluación', orden: 4 },
    ];

    return tipo === 'REINDUCCION' ? fasesReinduccion : fasesInduccion;
  }
}

module.exports = new InduccionService();
