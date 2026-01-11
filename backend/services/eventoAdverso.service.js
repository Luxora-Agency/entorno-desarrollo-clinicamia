/**
 * Service de Eventos Adversos y Seguridad del Paciente
 * Gestión de reportes, análisis causa raíz y factores contributivos
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class EventoAdversoService {
  // ==========================================
  // EVENTOS ADVERSOS
  // ==========================================

  /**
   * Obtener eventos adversos con filtros
   */
  async getEventos(query = {}) {
    const {
      page = 1,
      limit = 10,
      tipoEvento,
      severidad,
      estado,
      servicioOcurrencia,
      fechaDesde,
      fechaHasta,
      requiereAnalisis,
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(tipoEvento && { tipoEvento }),
      ...(severidad && { severidad }),
      ...(estado && { estado }),
      ...(servicioOcurrencia && { servicioOcurrencia: { contains: servicioOcurrencia, mode: 'insensitive' } }),
      ...(requiereAnalisis !== undefined && { requiereAnalisis: requiereAnalisis === 'true' }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaEvento: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [eventos, total] = await Promise.all([
      prisma.eventoAdverso.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          paciente: {
            select: { id: true, nombre: true, apellido: true, cedula: true },
          },
          reportador: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { factoresContributivos: true, planesAccion: true },
          },
        },
        orderBy: { fechaEvento: 'desc' },
      }),
      prisma.eventoAdverso.count({ where }),
    ]);

    return {
      eventos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener evento por ID
   */
  async getEventoById(id) {
    const evento = await prisma.eventoAdverso.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true,
            fechaNacimiento: true,
            genero: true,
          },
        },
        cita: {
          select: { id: true, fecha: true, motivo: true, estado: true },
        },
        admision: {
          select: {
            id: true,
            fechaIngreso: true,
            motivoIngreso: true,
            estado: true,
          },
        },
        reportador: {
          select: { id: true, nombre: true, apellido: true, email: true, rol: true },
        },
        analisisCausaRaiz: {
          include: {
            analista: { select: { nombre: true, apellido: true } },
          },
        },
        factoresContributivos: true,
        planesAccion: {
          include: {
            responsable: { select: { nombre: true, apellido: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!evento) {
      throw new NotFoundError('Evento adverso no encontrado');
    }

    return evento;
  }

  /**
   * Reportar evento adverso
   */
  async reportarEvento(data) {
    const {
      pacienteId,
      citaId,
      admisionId,
      tipoEvento,
      severidad,
      fechaEvento,
      horaEvento,
      servicioOcurrencia,
      lugarEspecifico,
      descripcionEvento,
      consecuencias,
      accionesInmediatas,
      reportadoPor,
      esAnonimo,
    } = data;

    // Validar paciente si se proporciona
    if (pacienteId) {
      const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
      if (!paciente) {
        throw new NotFoundError('Paciente no encontrado');
      }
    }

    // Determinar si requiere análisis basado en severidad
    const requiereAnalisis = ['GRAVE', 'CENTINELA'].includes(severidad);

    const evento = await prisma.eventoAdverso.create({
      data: {
        pacienteId,
        citaId,
        admisionId,
        tipoEvento,
        severidad,
        fechaEvento: new Date(fechaEvento),
        horaEvento,
        servicioOcurrencia,
        lugarEspecifico,
        descripcionEvento,
        consecuencias,
        accionesInmediatas,
        reportadoPor,
        esAnonimo: esAnonimo || false,
        estado: 'Reportado',
        requiereAnalisis,
      },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
        reportador: { select: { nombre: true, apellido: true } },
      },
    });

    return evento;
  }

  /**
   * Actualizar evento adverso
   */
  async updateEvento(id, data) {
    const evento = await prisma.eventoAdverso.findUnique({ where: { id } });
    if (!evento) {
      throw new NotFoundError('Evento adverso no encontrado');
    }

    return prisma.eventoAdverso.update({
      where: { id },
      data: {
        ...data,
        fechaEvento: data.fechaEvento ? new Date(data.fechaEvento) : undefined,
      },
    });
  }

  /**
   * Cambiar estado del evento
   */
  async cambiarEstado(id, nuevoEstado) {
    const evento = await prisma.eventoAdverso.findUnique({ where: { id } });
    if (!evento) {
      throw new NotFoundError('Evento adverso no encontrado');
    }

    const estadosValidos = [
      'Reportado',
      'En Investigación',
      'Analizado',
      'Plan de Acción',
      'En Seguimiento',
      'Cerrado',
    ];

    if (!estadosValidos.includes(nuevoEstado)) {
      throw new ValidationError('Estado no válido');
    }

    return prisma.eventoAdverso.update({
      where: { id },
      data: { estado: nuevoEstado },
    });
  }

  // ==========================================
  // ANÁLISIS DE CAUSA RAÍZ
  // ==========================================

  /**
   * Crear análisis de causa raíz
   */
  async crearAnalisisCausaRaiz(data) {
    const {
      eventoId,
      metodoAnalisis,
      analistaId,
    } = data;

    // Validar evento
    const evento = await prisma.eventoAdverso.findUnique({ where: { id: eventoId } });
    if (!evento) {
      throw new NotFoundError('Evento adverso no encontrado');
    }

    // Verificar si ya existe análisis
    const existingAnalisis = await prisma.analisisCausaRaiz.findUnique({
      where: { eventoId },
    });
    if (existingAnalisis) {
      throw new ValidationError('Ya existe un análisis de causa raíz para este evento');
    }

    // Crear análisis y actualizar estado del evento
    const [analisis] = await prisma.$transaction([
      prisma.analisisCausaRaiz.create({
        data: {
          eventoId,
          metodoAnalisis,
          analistaId,
          fechaAnalisis: new Date(),
          estado: 'En Análisis',
        },
      }),
      prisma.eventoAdverso.update({
        where: { id: eventoId },
        data: { estado: 'En Investigación' },
      }),
    ]);

    return analisis;
  }

  /**
   * Actualizar análisis de causa raíz (Protocolo de Londres)
   */
  async actualizarAnalisisProtocoloLondres(eventoId, data) {
    const analisis = await prisma.analisisCausaRaiz.findUnique({
      where: { eventoId },
    });
    if (!analisis) {
      throw new NotFoundError('Análisis de causa raíz no encontrado');
    }

    const {
      fallas_activas,
      condiciones_latentes,
      barreras_defensas,
      conclusiones,
      recomendaciones,
      leccionesAprendidas,
    } = data;

    return prisma.analisisCausaRaiz.update({
      where: { eventoId },
      data: {
        fallas_activas,
        condiciones_latentes,
        barreras_defensas,
        conclusiones,
        recomendaciones,
        leccionesAprendidas,
      },
    });
  }

  /**
   * Actualizar análisis de causa raíz (Espina de Pescado/Ishikawa)
   */
  async actualizarAnalisisIshikawa(eventoId, data) {
    const analisis = await prisma.analisisCausaRaiz.findUnique({
      where: { eventoId },
    });
    if (!analisis) {
      throw new NotFoundError('Análisis de causa raíz no encontrado');
    }

    const {
      causa_metodo,
      causa_maquina,
      causa_material,
      causa_mano_obra,
      causa_medio_ambiente,
      causa_medicion,
      conclusiones,
      recomendaciones,
      leccionesAprendidas,
    } = data;

    return prisma.analisisCausaRaiz.update({
      where: { eventoId },
      data: {
        causa_metodo,
        causa_maquina,
        causa_material,
        causa_mano_obra,
        causa_medio_ambiente,
        causa_medicion,
        conclusiones,
        recomendaciones,
        leccionesAprendidas,
      },
    });
  }

  /**
   * Actualizar análisis de causa raíz (5 Porqués)
   */
  async actualizarAnalisis5Porques(eventoId, data) {
    const analisis = await prisma.analisisCausaRaiz.findUnique({
      where: { eventoId },
    });
    if (!analisis) {
      throw new NotFoundError('Análisis de causa raíz no encontrado');
    }

    const {
      porque_1,
      porque_2,
      porque_3,
      porque_4,
      porque_5,
      causa_raiz_final,
      conclusiones,
      recomendaciones,
      leccionesAprendidas,
    } = data;

    return prisma.analisisCausaRaiz.update({
      where: { eventoId },
      data: {
        porque_1,
        porque_2,
        porque_3,
        porque_4,
        porque_5,
        causa_raiz_final,
        conclusiones,
        recomendaciones,
        leccionesAprendidas,
      },
    });
  }

  /**
   * Cerrar análisis de causa raíz
   */
  async cerrarAnalisis(eventoId) {
    const analisis = await prisma.analisisCausaRaiz.findUnique({
      where: { eventoId },
    });
    if (!analisis) {
      throw new NotFoundError('Análisis de causa raíz no encontrado');
    }

    // Actualizar análisis y estado del evento
    await prisma.$transaction([
      prisma.analisisCausaRaiz.update({
        where: { eventoId },
        data: { estado: 'Completado' },
      }),
      prisma.eventoAdverso.update({
        where: { id: eventoId },
        data: { estado: 'Analizado' },
      }),
    ]);

    return { success: true };
  }

  // ==========================================
  // FACTORES CONTRIBUTIVOS
  // ==========================================

  /**
   * Agregar factor contributivo
   */
  async agregarFactorContributivo(data) {
    const {
      eventoId,
      categoria,
      subcategoria,
      descripcion,
      nivelContribucion,
    } = data;

    const evento = await prisma.eventoAdverso.findUnique({ where: { id: eventoId } });
    if (!evento) {
      throw new NotFoundError('Evento adverso no encontrado');
    }

    // Categorías válidas según Protocolo de Londres
    const categoriasValidas = [
      'Paciente',
      'Tarea',
      'Individuo',
      'Equipo',
      'Ambiente',
      'Organizacion',
    ];

    if (!categoriasValidas.includes(categoria)) {
      throw new ValidationError('Categoría de factor no válida');
    }

    return prisma.factorContributivo.create({
      data: {
        eventoId,
        categoria,
        subcategoria,
        descripcion,
        nivelContribucion,
      },
    });
  }

  /**
   * Obtener factores contributivos de un evento
   */
  async getFactoresContributivos(eventoId) {
    const evento = await prisma.eventoAdverso.findUnique({ where: { id: eventoId } });
    if (!evento) {
      throw new NotFoundError('Evento adverso no encontrado');
    }

    return prisma.factorContributivo.findMany({
      where: { eventoId },
      orderBy: [{ categoria: 'asc' }, { nivelContribucion: 'desc' }],
    });
  }

  /**
   * Eliminar factor contributivo
   */
  async eliminarFactorContributivo(id) {
    const factor = await prisma.factorContributivo.findUnique({ where: { id } });
    if (!factor) {
      throw new NotFoundError('Factor contributivo no encontrado');
    }

    return prisma.factorContributivo.delete({ where: { id } });
  }

  // ==========================================
  // ESTADÍSTICAS Y DASHBOARD
  // ==========================================

  /**
   * Dashboard de eventos adversos
   */
  async getDashboard(query = {}) {
    const { fechaDesde, fechaHasta } = query;

    const whereDate = fechaDesde || fechaHasta
      ? {
          fechaEvento: {
            ...(fechaDesde && { gte: new Date(fechaDesde) }),
            ...(fechaHasta && { lte: new Date(fechaHasta) }),
          },
        }
      : {};

    const [
      totalEventos,
      eventosPorTipo,
      eventosPorSeveridad,
      eventosPorServicio,
      eventosPorEstado,
      eventosUltimos30Dias,
      eventosCentinela,
      eventosRequierenAnalisis,
    ] = await Promise.all([
      prisma.eventoAdverso.count({ where: whereDate }),
      prisma.eventoAdverso.groupBy({
        by: ['tipoEvento'],
        _count: true,
        where: whereDate,
      }),
      prisma.eventoAdverso.groupBy({
        by: ['severidad'],
        _count: true,
        where: whereDate,
      }),
      prisma.eventoAdverso.groupBy({
        by: ['servicioOcurrencia'],
        _count: true,
        where: whereDate,
        orderBy: { _count: { servicioOcurrencia: 'desc' } },
        take: 10,
      }),
      prisma.eventoAdverso.groupBy({
        by: ['estado'],
        _count: true,
        where: whereDate,
      }),
      prisma.eventoAdverso.count({
        where: {
          fechaEvento: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.eventoAdverso.count({
        where: { ...whereDate, severidad: 'CENTINELA' },
      }),
      prisma.eventoAdverso.count({
        where: { ...whereDate, requiereAnalisis: true, estado: { not: 'Cerrado' } },
      }),
    ]);

    // Últimos eventos reportados
    const ultimosEventos = await prisma.eventoAdverso.findMany({
      take: 10,
      orderBy: { fechaEvento: 'desc' },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
      },
    });

    return {
      resumen: {
        totalEventos,
        eventosUltimos30Dias,
        eventosCentinela,
        eventosRequierenAnalisis,
      },
      eventosPorTipo,
      eventosPorSeveridad,
      eventosPorServicio,
      eventosPorEstado,
      ultimosEventos,
    };
  }

  /**
   * Tendencia de eventos por mes
   */
  async getTendenciaMensual(anio) {
    const year = parseInt(anio) || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const eventos = await prisma.eventoAdverso.findMany({
      where: {
        fechaEvento: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        fechaEvento: true,
        tipoEvento: true,
        severidad: true,
      },
    });

    // Agrupar por mes
    const tendencia = {};
    for (let i = 0; i < 12; i++) {
      tendencia[i + 1] = { total: 0, porTipo: {}, porSeveridad: {} };
    }

    eventos.forEach((evento) => {
      const mes = evento.fechaEvento.getMonth() + 1;
      tendencia[mes].total++;
      tendencia[mes].porTipo[evento.tipoEvento] =
        (tendencia[mes].porTipo[evento.tipoEvento] || 0) + 1;
      tendencia[mes].porSeveridad[evento.severidad] =
        (tendencia[mes].porSeveridad[evento.severidad] || 0) + 1;
    });

    return tendencia;
  }
}

module.exports = new EventoAdversoService();
