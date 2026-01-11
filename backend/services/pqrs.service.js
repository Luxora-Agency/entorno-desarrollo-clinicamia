/**
 * Service de PQRS
 * Gestión de Peticiones, Quejas, Reclamos, Sugerencias, Denuncias y Felicitaciones
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class PQRSService {
  // ==========================================
  // GESTIÓN DE PQRS
  // ==========================================

  /**
   * Obtener PQRS con filtros
   */
  async getPQRS(query = {}) {
    const {
      page = 1,
      limit = 10,
      tipo,
      estado,
      prioridad,
      areaAsignada,
      responsableId,
      fechaDesde,
      fechaHasta,
      vencidas,
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(tipo && { tipo }),
      ...(estado && { estado }),
      ...(prioridad && { prioridad }),
      ...(areaAsignada && { areaAsignada }),
      ...(responsableId && { responsableId }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaRecepcion: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
      ...(vencidas === 'true' && {
        fechaLimiteRespuesta: { lt: new Date() },
        estado: { notIn: ['Resuelta', 'Cerrada'] },
      }),
    };

    const [pqrs, total] = await Promise.all([
      prisma.pQRS.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          paciente: {
            select: { id: true, nombre: true, apellido: true },
          },
          responsable: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { seguimientos: true },
          },
        },
        orderBy: [{ prioridad: 'asc' }, { fechaRecepcion: 'desc' }],
      }),
      prisma.pQRS.count({ where }),
    ]);

    return {
      pqrs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener PQRS por ID
   */
  async getPQRSById(id) {
    const pqrs = await prisma.pQRS.findUnique({
      where: { id },
      include: {
        paciente: {
          select: { id: true, nombre: true, apellido: true, cedula: true, telefono: true, email: true },
        },
        responsable: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        respondedor: {
          select: { id: true, nombre: true, apellido: true },
        },
        seguimientos: {
          include: {
            usuario: { select: { nombre: true, apellido: true } },
          },
          orderBy: { fechaAccion: 'desc' },
        },
      },
    });

    if (!pqrs) {
      throw new NotFoundError('PQRS no encontrada');
    }

    return pqrs;
  }

  /**
   * Obtener PQRS por radicado
   */
  async getPQRSByRadicado(radicado) {
    const pqrs = await prisma.pQRS.findUnique({
      where: { radicado },
      include: {
        seguimientos: {
          orderBy: { fechaAccion: 'desc' },
        },
      },
    });

    if (!pqrs) {
      throw new NotFoundError('PQRS no encontrada');
    }

    return pqrs;
  }

  /**
   * Crear PQRS
   */
  async createPQRS(data) {
    const {
      tipo,
      canal,
      nombrePeticionario,
      documentoPeticionario,
      emailPeticionario,
      telefonoPeticionario,
      direccionPeticionario,
      esAnonimo,
      pacienteId,
      admisionId,
      citaId,
      asunto,
      descripcion,
      servicioRelacionado,
      funcionarioRelacionado,
      prioridad,
    } = data;

    // Calcular días hábiles límite según tipo
    const diasHabilesLimite = this.calcularDiasHabiles(tipo);
    const fechaLimiteRespuesta = this.calcularFechaLimite(diasHabilesLimite);

    const pqrs = await prisma.pQRS.create({
      data: {
        tipo,
        canal,
        fechaRecepcion: new Date(),
        nombrePeticionario,
        documentoPeticionario,
        emailPeticionario,
        telefonoPeticionario,
        direccionPeticionario,
        esAnonimo: esAnonimo || false,
        pacienteId,
        admisionId,
        citaId,
        asunto,
        descripcion,
        servicioRelacionado,
        funcionarioRelacionado,
        prioridad: prioridad || 'Normal',
        diasHabilesLimite,
        fechaLimiteRespuesta,
        estado: 'Radicada',
      },
    });

    return pqrs;
  }

  /**
   * Asignar PQRS a responsable
   */
  async asignarPQRS(id, data) {
    const { areaAsignada, responsableId, usuarioId } = data;

    const pqrs = await prisma.pQRS.findUnique({ where: { id } });
    if (!pqrs) {
      throw new NotFoundError('PQRS no encontrada');
    }

    // Actualizar PQRS
    const pqrsActualizada = await prisma.pQRS.update({
      where: { id },
      data: {
        areaAsignada,
        responsableId,
        estado: 'Asignada',
      },
    });

    // Registrar seguimiento
    await prisma.seguimientoPQRS.create({
      data: {
        pqrsId: id,
        accion: 'Asignación',
        observaciones: `Asignada a ${areaAsignada}`,
        usuarioId,
      },
    });

    return pqrsActualizada;
  }

  /**
   * Responder PQRS
   */
  async responderPQRS(id, data) {
    const { respuesta, archivoRespuesta, respondidoPor } = data;

    const pqrs = await prisma.pQRS.findUnique({ where: { id } });
    if (!pqrs) {
      throw new NotFoundError('PQRS no encontrada');
    }

    // Actualizar PQRS con respuesta
    const pqrsActualizada = await prisma.pQRS.update({
      where: { id },
      data: {
        respuesta,
        fechaRespuesta: new Date(),
        respondidoPor,
        archivoRespuesta,
        estado: 'Resuelta',
      },
    });

    // Registrar seguimiento
    await prisma.seguimientoPQRS.create({
      data: {
        pqrsId: id,
        accion: 'Respuesta',
        observaciones: 'Se generó respuesta a la PQRS',
        usuarioId: respondidoPor,
      },
    });

    return pqrsActualizada;
  }

  /**
   * Cerrar PQRS
   */
  async cerrarPQRS(id, usuarioId) {
    const pqrs = await prisma.pQRS.findUnique({ where: { id } });
    if (!pqrs) {
      throw new NotFoundError('PQRS no encontrada');
    }

    await prisma.$transaction([
      prisma.pQRS.update({
        where: { id },
        data: { estado: 'Cerrada' },
      }),
      prisma.seguimientoPQRS.create({
        data: {
          pqrsId: id,
          accion: 'Cierre',
          observaciones: 'PQRS cerrada',
          usuarioId,
        },
      }),
    ]);

    return { success: true };
  }

  // ==========================================
  // SEGUIMIENTOS
  // ==========================================

  /**
   * Agregar seguimiento a PQRS
   */
  async agregarSeguimiento(pqrsId, data) {
    const { accion, observaciones, usuarioId } = data;

    const pqrs = await prisma.pQRS.findUnique({ where: { id: pqrsId } });
    if (!pqrs) {
      throw new NotFoundError('PQRS no encontrada');
    }

    return prisma.seguimientoPQRS.create({
      data: {
        pqrsId,
        accion,
        observaciones,
        usuarioId,
      },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Obtener seguimientos de una PQRS
   */
  async getSeguimientos(pqrsId) {
    return prisma.seguimientoPQRS.findMany({
      where: { pqrsId },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaAccion: 'desc' },
    });
  }

  // ==========================================
  // ENCUESTA DE SATISFACCIÓN
  // ==========================================

  /**
   * Registrar satisfacción del peticionario
   */
  async registrarSatisfaccion(id, data) {
    const { calificacionRespuesta, comentarioSatisfaccion } = data;

    const pqrs = await prisma.pQRS.findUnique({ where: { id } });
    if (!pqrs) {
      throw new NotFoundError('PQRS no encontrada');
    }

    if (calificacionRespuesta < 1 || calificacionRespuesta > 5) {
      throw new ValidationError('La calificación debe estar entre 1 y 5');
    }

    return prisma.pQRS.update({
      where: { id },
      data: {
        calificacionRespuesta,
        comentarioSatisfaccion,
        encuestaEnviada: true,
      },
    });
  }

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  /**
   * Dashboard de PQRS
   */
  async getDashboard() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      totalPQRS,
      pqrsPorTipo,
      pqrsPorEstado,
      pqrsVencidas,
      pqrsPorVencer,
      promedioSatisfaccion,
      pqrsDelMes,
      tiempoPromedioRespuesta,
    ] = await Promise.all([
      prisma.pQRS.count(),
      prisma.pQRS.groupBy({
        by: ['tipo'],
        _count: true,
      }),
      prisma.pQRS.groupBy({
        by: ['estado'],
        _count: true,
      }),
      prisma.pQRS.count({
        where: {
          fechaLimiteRespuesta: { lt: hoy },
          estado: { notIn: ['Resuelta', 'Cerrada'] },
        },
      }),
      prisma.pQRS.count({
        where: {
          fechaLimiteRespuesta: {
            gte: hoy,
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // próximos 3 días
          },
          estado: { notIn: ['Resuelta', 'Cerrada'] },
        },
      }),
      prisma.pQRS.aggregate({
        _avg: { calificacionRespuesta: true },
        where: { calificacionRespuesta: { not: null } },
      }),
      prisma.pQRS.count({
        where: { fechaRecepcion: { gte: inicioMes } },
      }),
      // Tiempo promedio de respuesta (en días)
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(DAY FROM (fecha_respuesta - fecha_recepcion))) as promedio
        FROM pqrs
        WHERE fecha_respuesta IS NOT NULL
      `,
    ]);

    // PQRS pendientes más antiguas
    const pendientesAntiguas = await prisma.pQRS.findMany({
      where: { estado: { notIn: ['Resuelta', 'Cerrada'] } },
      orderBy: { fechaRecepcion: 'asc' },
      take: 5,
      select: {
        id: true,
        radicado: true,
        tipo: true,
        asunto: true,
        fechaRecepcion: true,
        fechaLimiteRespuesta: true,
        prioridad: true,
      },
    });

    // PQRS por canal
    const pqrsPorCanal = await prisma.pQRS.groupBy({
      by: ['canal'],
      _count: true,
    });

    return {
      resumen: {
        totalPQRS,
        pqrsDelMes,
        pqrsVencidas,
        pqrsPorVencer,
        promedioSatisfaccion: promedioSatisfaccion._avg?.calificacionRespuesta || 0,
        tiempoPromedioRespuesta: tiempoPromedioRespuesta[0]?.promedio || 0,
      },
      pqrsPorTipo,
      pqrsPorEstado,
      pqrsPorCanal,
      pendientesAntiguas,
    };
  }

  /**
   * Reporte mensual de PQRS
   */
  async getReporteMensual(anio, mes) {
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);

    const [
      pqrsRecibidas,
      pqrsResueltas,
      pqrsVencidas,
      pqrsPorTipo,
      pqrsPorCanal,
      promedioTiempoRespuesta,
      satisfaccionPromedio,
    ] = await Promise.all([
      prisma.pQRS.count({
        where: {
          fechaRecepcion: { gte: fechaInicio, lte: fechaFin },
        },
      }),
      prisma.pQRS.count({
        where: {
          fechaRespuesta: { gte: fechaInicio, lte: fechaFin },
        },
      }),
      prisma.pQRS.count({
        where: {
          fechaRecepcion: { gte: fechaInicio, lte: fechaFin },
          fechaLimiteRespuesta: { lt: new Date() },
          estado: { notIn: ['Resuelta', 'Cerrada'] },
        },
      }),
      prisma.pQRS.groupBy({
        by: ['tipo'],
        _count: true,
        where: {
          fechaRecepcion: { gte: fechaInicio, lte: fechaFin },
        },
      }),
      prisma.pQRS.groupBy({
        by: ['canal'],
        _count: true,
        where: {
          fechaRecepcion: { gte: fechaInicio, lte: fechaFin },
        },
      }),
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(DAY FROM (fecha_respuesta - fecha_recepcion))) as promedio
        FROM pqrs
        WHERE fecha_respuesta IS NOT NULL
        AND fecha_recepcion >= ${fechaInicio}
        AND fecha_recepcion <= ${fechaFin}
      `,
      prisma.pQRS.aggregate({
        _avg: { calificacionRespuesta: true },
        where: {
          fechaRecepcion: { gte: fechaInicio, lte: fechaFin },
          calificacionRespuesta: { not: null },
        },
      }),
    ]);

    return {
      periodo: { anio, mes },
      pqrsRecibidas,
      pqrsResueltas,
      pqrsVencidas,
      tasaResolucion: pqrsRecibidas > 0 ? (pqrsResueltas / pqrsRecibidas) * 100 : 0,
      pqrsPorTipo,
      pqrsPorCanal,
      promedioTiempoRespuesta: promedioTiempoRespuesta[0]?.promedio || 0,
      satisfaccionPromedio: satisfaccionPromedio._avg?.calificacionRespuesta || 0,
    };
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Calcular días hábiles según tipo de PQRS
   * Según normativa colombiana (Ley 1755/2015)
   */
  calcularDiasHabiles(tipo) {
    const diasPorTipo = {
      PETICION: 15,      // 15 días hábiles
      QUEJA: 15,         // 15 días hábiles
      RECLAMO: 15,       // 15 días hábiles
      SUGERENCIA: 15,    // 15 días hábiles
      DENUNCIA: 10,      // 10 días hábiles (prioridad alta)
      FELICITACION: 5,   // 5 días hábiles (solo acuse de recibo)
    };
    return diasPorTipo[tipo] || 15;
  }

  /**
   * Calcular fecha límite excluyendo fines de semana
   */
  calcularFechaLimite(diasHabiles) {
    const fecha = new Date();
    let diasContados = 0;

    while (diasContados < diasHabiles) {
      fecha.setDate(fecha.getDate() + 1);
      const diaSemana = fecha.getDay();
      // Excluir sábado (6) y domingo (0)
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasContados++;
      }
    }

    return fecha;
  }

  /**
   * Verificar PQRS próximas a vencer (para notificaciones)
   */
  async getPQRSProximasVencer(diasAnticipacion = 3) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    return prisma.pQRS.findMany({
      where: {
        fechaLimiteRespuesta: {
          gte: new Date(),
          lte: fechaLimite,
        },
        estado: { notIn: ['Resuelta', 'Cerrada'] },
      },
      include: {
        responsable: { select: { nombre: true, apellido: true, email: true } },
      },
      orderBy: { fechaLimiteRespuesta: 'asc' },
    });
  }
}

module.exports = new PQRSService();
