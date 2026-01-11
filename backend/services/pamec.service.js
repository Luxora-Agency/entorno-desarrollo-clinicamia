/**
 * Service de PAMEC - Programa de Auditoría para el Mejoramiento de la Calidad
 * Gestión de equipo, procesos, indicadores y auditorías
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class PAMECService {
  // ==========================================
  // EQUIPO PAMEC
  // ==========================================

  /**
   * Obtener miembros del equipo PAMEC
   */
  async getEquipo(query = {}) {
    const { activo = true, rol } = query;

    const where = {
      ...(activo !== undefined && { activo: activo === 'true' || activo === true }),
      ...(rol && { rol }),
    };

    const equipo = await prisma.equipoPAMEC.findMany({
      where,
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true, rol: true },
        },
        _count: {
          select: { auditorias: true },
        },
      },
      orderBy: { fechaIngreso: 'desc' },
    });

    return equipo;
  }

  /**
   * Agregar miembro al equipo PAMEC
   */
  async addMiembroEquipo(data) {
    const { usuarioId, rol, actaDesignacion } = data;

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Verificar si ya está en el equipo
    const existing = await prisma.equipoPAMEC.findFirst({
      where: { usuarioId, activo: true },
    });
    if (existing) {
      throw new ValidationError('El usuario ya es miembro activo del equipo PAMEC');
    }

    return prisma.equipoPAMEC.create({
      data: {
        usuarioId,
        rol,
        actaDesignacion,
        fechaIngreso: new Date(),
        activo: true,
      },
      include: {
        usuario: { select: { nombre: true, apellido: true, email: true } },
      },
    });
  }

  /**
   * Retirar miembro del equipo
   */
  async retirarMiembroEquipo(id) {
    const miembro = await prisma.equipoPAMEC.findUnique({ where: { id } });
    if (!miembro) {
      throw new NotFoundError('Miembro no encontrado');
    }

    return prisma.equipoPAMEC.update({
      where: { id },
      data: {
        activo: false,
        fechaRetiro: new Date(),
      },
    });
  }

  // ==========================================
  // PROCESOS PAMEC
  // ==========================================

  /**
   * Obtener procesos PAMEC
   */
  async getProcesos(query = {}) {
    const { page = 1, limit = 10, estado, prioridad, search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(estado && { estado }),
      ...(prioridad && { prioridad: parseInt(prioridad) }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { areaResponsable: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [procesos, total] = await Promise.all([
      prisma.procesoPAMEC.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          responsable: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { indicadores: true, auditorias: true, planesAccion: true },
          },
        },
        orderBy: [{ prioridad: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.procesoPAMEC.count({ where }),
    ]);

    return {
      procesos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener proceso por ID
   */
  async getProcesoById(id) {
    const proceso = await prisma.procesoPAMEC.findUnique({
      where: { id },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        indicadores: {
          where: { activo: true },
          include: {
            mediciones: {
              take: 12,
              orderBy: { periodo: 'desc' },
            },
          },
        },
        auditorias: {
          orderBy: { fechaProgramada: 'desc' },
          include: {
            auditor: {
              include: {
                usuario: { select: { nombre: true, apellido: true } },
              },
            },
          },
        },
        planesAccion: {
          orderBy: { createdAt: 'desc' },
          include: {
            responsable: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!proceso) {
      throw new NotFoundError('Proceso no encontrado');
    }

    return proceso;
  }

  /**
   * Crear proceso PAMEC
   */
  async createProceso(data) {
    const {
      nombre,
      descripcion,
      areaResponsable,
      responsableId,
      calidadObservada,
      calidadEsperada,
    } = data;

    const brecha = calidadEsperada && calidadObservada
      ? calidadEsperada - calidadObservada
      : null;

    return prisma.procesoPAMEC.create({
      data: {
        nombre,
        descripcion,
        areaResponsable,
        responsableId,
        calidadObservada,
        calidadEsperada,
        brecha,
        estado: 'Identificado',
      },
      include: {
        responsable: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Actualizar proceso
   */
  async updateProceso(id, data) {
    const proceso = await prisma.procesoPAMEC.findUnique({ where: { id } });
    if (!proceso) {
      throw new NotFoundError('Proceso no encontrado');
    }

    // Recalcular brecha si cambian los valores
    if (data.calidadEsperada !== undefined || data.calidadObservada !== undefined) {
      const calidadEsperada = data.calidadEsperada ?? proceso.calidadEsperada;
      const calidadObservada = data.calidadObservada ?? proceso.calidadObservada;
      data.brecha = calidadEsperada && calidadObservada
        ? calidadEsperada - calidadObservada
        : null;
    }

    return prisma.procesoPAMEC.update({
      where: { id },
      data,
    });
  }

  /**
   * Priorizar procesos (matriz de priorización)
   */
  async priorizarProceso(id, criteriosPriorizacion) {
    const proceso = await prisma.procesoPAMEC.findUnique({ where: { id } });
    if (!proceso) {
      throw new NotFoundError('Proceso no encontrado');
    }

    // Calcular puntaje de prioridad basado en criterios
    // Criterios típicos: impacto, frecuencia, costo, riesgo
    let puntajeTotal = 0;
    let maxPuntaje = 0;

    for (const [criterio, valor] of Object.entries(criteriosPriorizacion)) {
      puntajeTotal += valor || 0;
      maxPuntaje += 5; // Asumiendo escala 1-5
    }

    // Calcular prioridad 1-5 (1 = más alta)
    const prioridad = Math.max(1, Math.min(5, 6 - Math.ceil((puntajeTotal / maxPuntaje) * 5)));

    return prisma.procesoPAMEC.update({
      where: { id },
      data: {
        criteriosPriorizacion,
        prioridad,
        estado: 'Priorizado',
      },
    });
  }

  // ==========================================
  // INDICADORES PAMEC
  // ==========================================

  /**
   * Obtener indicadores
   */
  async getIndicadores(query = {}) {
    const { procesoId, activo = true } = query;

    const where = {
      ...(procesoId && { procesoId }),
      ...(activo !== undefined && { activo: activo === 'true' || activo === true }),
    };

    return prisma.indicadorPAMEC.findMany({
      where,
      include: {
        proceso: { select: { id: true, nombre: true } },
        _count: { select: { mediciones: true } },
      },
      orderBy: { codigo: 'asc' },
    });
  }

  /**
   * Obtener indicador por ID
   */
  async getIndicadorById(id) {
    const indicador = await prisma.indicadorPAMEC.findUnique({
      where: { id },
      include: {
        proceso: { select: { id: true, nombre: true, areaResponsable: true } },
        mediciones: {
          orderBy: { periodo: 'desc' },
          take: 24, // Últimos 24 periodos
          include: {
            registrador: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!indicador) {
      throw new NotFoundError('Indicador no encontrado');
    }

    return indicador;
  }

  /**
   * Crear indicador
   */
  async createIndicador(data) {
    const {
      procesoId,
      codigo,
      nombre,
      objetivo,
      formulaCalculo,
      fuenteDatos,
      frecuenciaMedicion,
      metaInstitucional,
      unidadMedida,
      tendenciaEsperada,
      responsableMedicion,
    } = data;

    // Validar código único
    const existing = await prisma.indicadorPAMEC.findUnique({ where: { codigo } });
    if (existing) {
      throw new ValidationError('Ya existe un indicador con este código');
    }

    return prisma.indicadorPAMEC.create({
      data: {
        procesoId,
        codigo,
        nombre,
        objetivo,
        formulaCalculo,
        fuenteDatos,
        frecuenciaMedicion,
        metaInstitucional,
        unidadMedida,
        tendenciaEsperada,
        responsableMedicion,
      },
    });
  }

  /**
   * Registrar medición de indicador
   */
  async registrarMedicion(data) {
    const {
      indicadorId,
      periodo,
      numerador,
      denominador,
      analisis,
      accionesTomadas,
      registradoPor,
    } = data;

    const indicador = await prisma.indicadorPAMEC.findUnique({ where: { id: indicadorId } });
    if (!indicador) {
      throw new NotFoundError('Indicador no encontrado');
    }

    // Calcular resultado
    const resultado = denominador > 0 ? (numerador / denominador) : 0;
    const cumpleMeta = indicador.metaInstitucional
      ? (indicador.tendenciaEsperada === 'Descendente'
          ? resultado <= indicador.metaInstitucional
          : resultado >= indicador.metaInstitucional)
      : null;

    // Verificar si ya existe medición para este periodo
    const existingMedicion = await prisma.medicionIndicador.findFirst({
      where: { indicadorId, periodo },
    });

    if (existingMedicion) {
      return prisma.medicionIndicador.update({
        where: { id: existingMedicion.id },
        data: {
          numerador,
          denominador,
          resultado,
          meta: indicador.metaInstitucional,
          cumpleMeta,
          analisis,
          accionesTomadas,
          fechaRegistro: new Date(),
        },
      });
    }

    return prisma.medicionIndicador.create({
      data: {
        indicadorId,
        periodo,
        numerador,
        denominador,
        resultado,
        meta: indicador.metaInstitucional,
        cumpleMeta,
        analisis,
        accionesTomadas,
        registradoPor,
        fechaRegistro: new Date(),
      },
    });
  }

  // ==========================================
  // AUDITORÍAS PAMEC
  // ==========================================

  /**
   * Obtener auditorías
   */
  async getAuditorias(query = {}) {
    const { page = 1, limit = 10, procesoId, tipoAuditoria, estado, fechaDesde, fechaHasta } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(procesoId && { procesoId }),
      ...(tipoAuditoria && { tipoAuditoria }),
      ...(estado && { estado }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaProgramada: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [auditorias, total] = await Promise.all([
      prisma.auditoriaPAMEC.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          proceso: { select: { id: true, nombre: true } },
          auditor: {
            include: {
              usuario: { select: { nombre: true, apellido: true } },
            },
          },
          _count: { select: { hallazgos: true } },
        },
        orderBy: { fechaProgramada: 'desc' },
      }),
      prisma.auditoriaPAMEC.count({ where }),
    ]);

    return {
      auditorias,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener auditoría por ID
   */
  async getAuditoriaById(id) {
    const auditoria = await prisma.auditoriaPAMEC.findUnique({
      where: { id },
      include: {
        proceso: true,
        auditor: {
          include: {
            usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
          },
        },
        hallazgos: {
          include: {
            planesAccion: {
              include: {
                responsable: { select: { nombre: true, apellido: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoría no encontrada');
    }

    return auditoria;
  }

  /**
   * Crear auditoría
   */
  async createAuditoria(data) {
    const {
      procesoId,
      tipoAuditoria,
      objetivo,
      alcance,
      auditorId,
      fechaProgramada,
    } = data;

    // Validar proceso si se especifica
    if (procesoId) {
      const proceso = await prisma.procesoPAMEC.findUnique({ where: { id: procesoId } });
      if (!proceso) {
        throw new NotFoundError('Proceso no encontrado');
      }
    }

    // Validar auditor
    const auditor = await prisma.equipoPAMEC.findUnique({ where: { id: auditorId } });
    if (!auditor || !auditor.activo) {
      throw new ValidationError('El auditor debe ser miembro activo del equipo PAMEC');
    }

    return prisma.auditoriaPAMEC.create({
      data: {
        procesoId,
        tipoAuditoria,
        objetivo,
        alcance,
        auditorId,
        fechaProgramada: new Date(fechaProgramada),
        estado: 'Programada',
      },
      include: {
        proceso: { select: { nombre: true } },
        auditor: {
          include: {
            usuario: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });
  }

  /**
   * Ejecutar auditoría
   */
  async ejecutarAuditoria(id, data) {
    const auditoria = await prisma.auditoriaPAMEC.findUnique({ where: { id } });
    if (!auditoria) {
      throw new NotFoundError('Auditoría no encontrada');
    }

    return prisma.auditoriaPAMEC.update({
      where: { id },
      data: {
        fechaEjecucion: new Date(),
        estado: 'En Ejecución',
        ...data,
      },
    });
  }

  /**
   * Cerrar auditoría
   */
  async cerrarAuditoria(id, data) {
    const { conclusiones, informeUrl } = data;

    const auditoria = await prisma.auditoriaPAMEC.findUnique({ where: { id } });
    if (!auditoria) {
      throw new NotFoundError('Auditoría no encontrada');
    }

    return prisma.auditoriaPAMEC.update({
      where: { id },
      data: {
        conclusiones,
        informeUrl,
        estado: 'Cerrada',
      },
    });
  }

  // ==========================================
  // HALLAZGOS
  // ==========================================

  /**
   * Registrar hallazgo de auditoría
   */
  async registrarHallazgo(data) {
    const {
      auditoriaId,
      tipo,
      descripcion,
      criterioAuditoria,
      evidencia,
      analisisCausa,
      requiereAccion,
      fechaLimiteAccion,
    } = data;

    const auditoria = await prisma.auditoriaPAMEC.findUnique({ where: { id: auditoriaId } });
    if (!auditoria) {
      throw new NotFoundError('Auditoría no encontrada');
    }

    return prisma.hallazgoAuditoria.create({
      data: {
        auditoriaId,
        tipo,
        descripcion,
        criterioAuditoria,
        evidencia,
        analisisCausa,
        requiereAccion: requiereAccion ?? true,
        fechaLimiteAccion: fechaLimiteAccion ? new Date(fechaLimiteAccion) : null,
        estado: 'Abierto',
      },
    });
  }

  /**
   * Actualizar hallazgo
   */
  async updateHallazgo(id, data) {
    const hallazgo = await prisma.hallazgoAuditoria.findUnique({ where: { id } });
    if (!hallazgo) {
      throw new NotFoundError('Hallazgo no encontrado');
    }

    return prisma.hallazgoAuditoria.update({
      where: { id },
      data: {
        ...data,
        fechaLimiteAccion: data.fechaLimiteAccion ? new Date(data.fechaLimiteAccion) : undefined,
      },
    });
  }

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  /**
   * Dashboard PAMEC
   */
  async getDashboard() {
    const [
      totalProcesos,
      procesosPriorizados,
      totalIndicadores,
      indicadoresBajoMeta,
      auditoriasProgramadas,
      auditoriasEnEjecucion,
      hallazgosAbiertos,
      ultimasAuditorias,
    ] = await Promise.all([
      prisma.procesoPAMEC.count(),
      prisma.procesoPAMEC.count({ where: { estado: 'Priorizado' } }),
      prisma.indicadorPAMEC.count({ where: { activo: true } }),
      prisma.medicionIndicador.count({
        where: {
          cumpleMeta: false,
          // Solo del último periodo
          periodo: {
            gte: new Date().toISOString().substring(0, 7), // YYYY-MM
          },
        },
      }),
      prisma.auditoriaPAMEC.count({ where: { estado: 'Programada' } }),
      prisma.auditoriaPAMEC.count({ where: { estado: 'En Ejecución' } }),
      prisma.hallazgoAuditoria.count({ where: { estado: 'Abierto' } }),
      prisma.auditoriaPAMEC.findMany({
        take: 5,
        orderBy: { fechaProgramada: 'desc' },
        include: {
          proceso: { select: { nombre: true } },
          auditor: {
            include: {
              usuario: { select: { nombre: true, apellido: true } },
            },
          },
        },
      }),
    ]);

    // Ruta crítica PAMEC (9 pasos)
    const rutaCritica = [
      { paso: 1, nombre: 'Autoevaluación', descripcion: 'Aplicación de estándares de calidad' },
      { paso: 2, nombre: 'Selección de procesos', descripcion: 'Identificar procesos a mejorar' },
      { paso: 3, nombre: 'Priorización', descripcion: 'Matriz de priorización' },
      { paso: 4, nombre: 'Definición de indicadores', descripcion: 'Fichas técnicas' },
      { paso: 5, nombre: 'Medición inicial', descripcion: 'Línea base' },
      { paso: 6, nombre: 'Definición de metas', descripcion: 'Metas institucionales' },
      { paso: 7, nombre: 'Análisis causal', descripcion: 'Identificar causas raíz' },
      { paso: 8, nombre: 'Plan de mejoramiento', descripcion: 'Acciones correctivas' },
      { paso: 9, nombre: 'Evaluación', descripcion: 'Seguimiento y verificación' },
    ];

    return {
      resumen: {
        totalProcesos,
        procesosPriorizados,
        totalIndicadores,
        indicadoresBajoMeta,
        auditoriasProgramadas,
        auditoriasEnEjecucion,
        hallazgosAbiertos,
      },
      ultimasAuditorias,
      rutaCritica,
    };
  }

  /**
   * Generar ficha técnica de indicador (PDF)
   */
  async generarFichaTecnica(indicadorId) {
    const indicador = await this.getIndicadorById(indicadorId);

    return {
      codigo: indicador.codigo,
      nombre: indicador.nombre,
      proceso: indicador.proceso?.nombre,
      objetivo: indicador.objetivo,
      formula: indicador.formulaCalculo,
      fuenteDatos: indicador.fuenteDatos,
      frecuencia: indicador.frecuenciaMedicion,
      meta: indicador.metaInstitucional,
      unidad: indicador.unidadMedida,
      tendencia: indicador.tendenciaEsperada,
      responsable: indicador.responsableMedicion,
      ultimasMediciones: indicador.mediciones.slice(0, 12),
    };
  }
}

module.exports = new PAMECService();
