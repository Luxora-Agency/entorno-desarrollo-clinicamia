/**
 * Service de Vigilancia en Salud Pública
 * Gestión de notificaciones SIVIGILA, farmacovigilancia y tecnovigilancia
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class VigilanciaSaludService {
  // ==========================================
  // NOTIFICACIONES SIVIGILA
  // ==========================================

  /**
   * Obtener notificaciones SIVIGILA
   */
  async getNotificacionesSIVIGILA(query = {}) {
    const {
      page = 1,
      limit = 10,
      codigoEvento,
      tipoNotificacion,
      semanaEpidemiologica,
      anioEpidemiologico,
      enviadoINS,
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(codigoEvento && { codigoEvento }),
      ...(tipoNotificacion && { tipoNotificacion }),
      ...(semanaEpidemiologica && { semanaEpidemiologica: parseInt(semanaEpidemiologica) }),
      ...(anioEpidemiologico && { anioEpidemiologico: parseInt(anioEpidemiologico) }),
      ...(enviadoINS !== undefined && { enviadoINS: enviadoINS === 'true' }),
    };

    const [notificaciones, total] = await Promise.all([
      prisma.notificacionSIVIGILA.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          paciente: {
            select: { id: true, nombre: true, apellido: true, cedula: true },
          },
          notificador: {
            select: { nombre: true, apellido: true },
          },
        },
        orderBy: [{ anioEpidemiologico: 'desc' }, { semanaEpidemiologica: 'desc' }],
      }),
      prisma.notificacionSIVIGILA.count({ where }),
    ]);

    return {
      notificaciones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener notificación por ID
   */
  async getNotificacionSIVIGILAById(id) {
    const notificacion = await prisma.notificacionSIVIGILA.findUnique({
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
            direccion: true,
            telefono: true,
          },
        },
        notificador: {
          select: { nombre: true, apellido: true, email: true },
        },
      },
    });

    if (!notificacion) {
      throw new NotFoundError('Notificación SIVIGILA no encontrada');
    }

    return notificacion;
  }

  /**
   * Crear notificación SIVIGILA
   */
  async createNotificacionSIVIGILA(data) {
    const {
      pacienteId,
      codigoEvento,
      nombreEvento,
      tipoNotificacion,
      fechaInicioSintomas,
      clasificacionInicial,
      hospitalizacion,
      observaciones,
      notificadoPor,
    } = data;

    // Validar paciente
    const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    // Calcular semana epidemiológica
    const { semana, anio } = this.calcularSemanaEpidemiologica(new Date());

    return prisma.notificacionSIVIGILA.create({
      data: {
        pacienteId,
        codigoEvento,
        nombreEvento,
        tipoNotificacion,
        semanaEpidemiologica: semana,
        anioEpidemiologico: anio,
        fechaNotificacion: new Date(),
        fechaInicioSintomas: fechaInicioSintomas ? new Date(fechaInicioSintomas) : null,
        clasificacionInicial,
        hospitalizacion: hospitalizacion || false,
        observaciones,
        notificadoPor,
        enviadoINS: false,
      },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Actualizar notificación SIVIGILA
   */
  async updateNotificacionSIVIGILA(id, data) {
    const notificacion = await prisma.notificacionSIVIGILA.findUnique({ where: { id } });
    if (!notificacion) {
      throw new NotFoundError('Notificación SIVIGILA no encontrada');
    }

    return prisma.notificacionSIVIGILA.update({
      where: { id },
      data: {
        ...data,
        fechaInicioSintomas: data.fechaInicioSintomas ? new Date(data.fechaInicioSintomas) : undefined,
      },
    });
  }

  /**
   * Marcar notificación como enviada al INS
   */
  async marcarEnviadoINS(id) {
    const notificacion = await prisma.notificacionSIVIGILA.findUnique({ where: { id } });
    if (!notificacion) {
      throw new NotFoundError('Notificación SIVIGILA no encontrada');
    }

    return prisma.notificacionSIVIGILA.update({
      where: { id },
      data: {
        enviadoINS: true,
        fechaEnvioINS: new Date(),
      },
    });
  }

  // ==========================================
  // FARMACOVIGILANCIA
  // ==========================================

  /**
   * Obtener reportes de farmacovigilancia
   */
  async getReportesFarmacovigilancia(query = {}) {
    const {
      page = 1,
      limit = 10,
      tipoReporte,
      gravedadReaccion,
      reportadoINVIMA,
      fechaDesde,
      fechaHasta,
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(tipoReporte && { tipoReporte }),
      ...(gravedadReaccion && { gravedadReaccion }),
      ...(reportadoINVIMA !== undefined && { reportadoINVIMA: reportadoINVIMA === 'true' }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaEvento: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [reportes, total] = await Promise.all([
      prisma.reporteFarmacovigilancia.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          paciente: {
            select: { id: true, nombre: true, apellido: true },
          },
          producto: {
            select: { id: true, nombre: true, principioActivo: true },
          },
          reportador: {
            select: { nombre: true, apellido: true },
          },
        },
        orderBy: { fechaEvento: 'desc' },
      }),
      prisma.reporteFarmacovigilancia.count({ where }),
    ]);

    return {
      reportes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Crear reporte de farmacovigilancia
   */
  async createReporteFarmacovigilancia(data) {
    const {
      pacienteId,
      productoId,
      tipoReporte,
      fechaEvento,
      descripcionReaccion,
      gravedadReaccion,
      causalidad,
      desenlace,
      accionTomada,
      reportadoPor,
    } = data;

    // Validar paciente si se proporciona
    if (pacienteId) {
      const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
      if (!paciente) {
        throw new NotFoundError('Paciente no encontrado');
      }
    }

    // Validar producto si se proporciona
    if (productoId) {
      const producto = await prisma.producto.findUnique({ where: { id: productoId } });
      if (!producto) {
        throw new NotFoundError('Producto no encontrado');
      }
    }

    return prisma.reporteFarmacovigilancia.create({
      data: {
        pacienteId,
        productoId,
        tipoReporte,
        fechaEvento: new Date(fechaEvento),
        descripcionReaccion,
        gravedadReaccion,
        causalidad,
        desenlace,
        accionTomada,
        reportadoPor,
        reportadoINVIMA: false,
      },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
        producto: { select: { nombre: true } },
      },
    });
  }

  /**
   * Marcar reporte como enviado a INVIMA
   */
  async marcarReporteFarmacoEnviadoINVIMA(id) {
    const reporte = await prisma.reporteFarmacovigilancia.findUnique({ where: { id } });
    if (!reporte) {
      throw new NotFoundError('Reporte de farmacovigilancia no encontrado');
    }

    return prisma.reporteFarmacovigilancia.update({
      where: { id },
      data: {
        reportadoINVIMA: true,
        fechaReporteINVIMA: new Date(),
      },
    });
  }

  // ==========================================
  // TECNOVIGILANCIA
  // ==========================================

  /**
   * Obtener reportes de tecnovigilancia
   */
  async getReportesTecnovigilancia(query = {}) {
    const {
      page = 1,
      limit = 10,
      gravedadIncidente,
      reportadoINVIMA,
      fechaDesde,
      fechaHasta,
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(gravedadIncidente && { gravedadIncidente }),
      ...(reportadoINVIMA !== undefined && { reportadoINVIMA: reportadoINVIMA === 'true' }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaEvento: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [reportes, total] = await Promise.all([
      prisma.reporteTecnovigilancia.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          paciente: {
            select: { id: true, nombre: true, apellido: true },
          },
          reportador: {
            select: { nombre: true, apellido: true },
          },
        },
        orderBy: { fechaEvento: 'desc' },
      }),
      prisma.reporteTecnovigilancia.count({ where }),
    ]);

    return {
      reportes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Crear reporte de tecnovigilancia
   */
  async createReporteTecnovigilancia(data) {
    const {
      pacienteId,
      nombreDispositivo,
      fabricante,
      registroSanitario,
      lote,
      fechaEvento,
      descripcionIncidente,
      consecuencias,
      gravedadIncidente,
      accionTomada,
      reportadoPor,
    } = data;

    // Validar paciente si se proporciona
    if (pacienteId) {
      const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
      if (!paciente) {
        throw new NotFoundError('Paciente no encontrado');
      }
    }

    return prisma.reporteTecnovigilancia.create({
      data: {
        pacienteId,
        nombreDispositivo,
        fabricante,
        registroSanitario,
        lote,
        fechaEvento: new Date(fechaEvento),
        descripcionIncidente,
        consecuencias,
        gravedadIncidente,
        accionTomada,
        reportadoPor,
        reportadoINVIMA: false,
      },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Marcar reporte tecnovigilancia como enviado a INVIMA
   */
  async marcarReporteTecnoEnviadoINVIMA(id) {
    const reporte = await prisma.reporteTecnovigilancia.findUnique({ where: { id } });
    if (!reporte) {
      throw new NotFoundError('Reporte de tecnovigilancia no encontrado');
    }

    return prisma.reporteTecnovigilancia.update({
      where: { id },
      data: {
        reportadoINVIMA: true,
        fechaReporteINVIMA: new Date(),
      },
    });
  }

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  /**
   * Dashboard de vigilancia en salud
   */
  async getDashboard() {
    const anioActual = new Date().getFullYear();
    const { semana: semanaActual } = this.calcularSemanaEpidemiologica(new Date());

    const [
      totalSIVIGILA,
      sivigilaSemanActual,
      sivigilaPendientesINS,
      totalFarmacovigilancia,
      farmacoGraves,
      farmacoPendientesINVIMA,
      totalTecnovigilancia,
      tecnoPendientesINVIMA,
    ] = await Promise.all([
      prisma.notificacionSIVIGILA.count({
        where: { anioEpidemiologico: anioActual },
      }),
      prisma.notificacionSIVIGILA.count({
        where: {
          anioEpidemiologico: anioActual,
          semanaEpidemiologica: semanaActual,
        },
      }),
      prisma.notificacionSIVIGILA.count({
        where: { enviadoINS: false },
      }),
      prisma.reporteFarmacovigilancia.count({
        where: {
          createdAt: { gte: new Date(anioActual, 0, 1) },
        },
      }),
      prisma.reporteFarmacovigilancia.count({
        where: {
          gravedadReaccion: { in: ['Grave', 'Mortal'] },
          createdAt: { gte: new Date(anioActual, 0, 1) },
        },
      }),
      prisma.reporteFarmacovigilancia.count({
        where: { reportadoINVIMA: false },
      }),
      prisma.reporteTecnovigilancia.count({
        where: {
          createdAt: { gte: new Date(anioActual, 0, 1) },
        },
      }),
      prisma.reporteTecnovigilancia.count({
        where: { reportadoINVIMA: false },
      }),
    ]);

    // Eventos SIVIGILA por semana
    const eventosPorSemana = await prisma.notificacionSIVIGILA.groupBy({
      by: ['semanaEpidemiologica'],
      _count: true,
      where: { anioEpidemiologico: anioActual },
      orderBy: { semanaEpidemiologica: 'asc' },
    });

    // Top eventos notificados
    const topEventos = await prisma.notificacionSIVIGILA.groupBy({
      by: ['codigoEvento', 'nombreEvento'],
      _count: true,
      where: { anioEpidemiologico: anioActual },
      orderBy: { _count: { codigoEvento: 'desc' } },
      take: 10,
    });

    // Últimas notificaciones
    const ultimasNotificaciones = await prisma.notificacionSIVIGILA.findMany({
      take: 5,
      orderBy: { fechaNotificacion: 'desc' },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
      },
    });

    return {
      resumen: {
        sivigila: {
          total: totalSIVIGILA,
          semanaActual: sivigilaSemanActual,
          pendientesINS: sivigilaPendientesINS,
        },
        farmacovigilancia: {
          total: totalFarmacovigilancia,
          graves: farmacoGraves,
          pendientesINVIMA: farmacoPendientesINVIMA,
        },
        tecnovigilancia: {
          total: totalTecnovigilancia,
          pendientesINVIMA: tecnoPendientesINVIMA,
        },
      },
      semanaEpidemiologica: semanaActual,
      anioEpidemiologico: anioActual,
      eventosPorSemana,
      topEventos,
      ultimasNotificaciones,
    };
  }

  /**
   * Reporte semanal SIVIGILA
   */
  async getReporteSemanal(semana, anio) {
    const notificaciones = await prisma.notificacionSIVIGILA.findMany({
      where: {
        semanaEpidemiologica: parseInt(semana),
        anioEpidemiologico: parseInt(anio),
      },
      include: {
        paciente: {
          select: {
            nombre: true,
            apellido: true,
            cedula: true,
            fechaNacimiento: true,
            genero: true,
            direccion: true,
          },
        },
      },
      orderBy: { fechaNotificacion: 'asc' },
    });

    const resumenPorEvento = {};
    notificaciones.forEach((n) => {
      if (!resumenPorEvento[n.codigoEvento]) {
        resumenPorEvento[n.codigoEvento] = {
          codigo: n.codigoEvento,
          nombre: n.nombreEvento,
          tipo: n.tipoNotificacion,
          casos: 0,
        };
      }
      resumenPorEvento[n.codigoEvento].casos++;
    });

    return {
      semana: parseInt(semana),
      anio: parseInt(anio),
      totalCasos: notificaciones.length,
      resumenPorEvento: Object.values(resumenPorEvento),
      notificaciones,
    };
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Calcular semana epidemiológica (ISO 8601)
   */
  calcularSemanaEpidemiologica(fecha) {
    const date = new Date(fecha);
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const semana = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return { semana, anio: date.getUTCFullYear() };
  }

  /**
   * Obtener eventos de notificación obligatoria
   */
  getEventosNotificacionObligatoria() {
    return [
      { codigo: '100', nombre: 'Accidente ofídico', tipo: 'Semanal' },
      { codigo: '110', nombre: 'Agresiones por animales potencialmente transmisores de rabia', tipo: 'Semanal' },
      { codigo: '210', nombre: 'Dengue', tipo: 'Semanal' },
      { codigo: '220', nombre: 'Dengue grave', tipo: 'Inmediata' },
      { codigo: '300', nombre: 'Tuberculosis', tipo: 'Semanal' },
      { codigo: '346', nombre: 'COVID-19', tipo: 'Inmediata' },
      { codigo: '420', nombre: 'VIH/SIDA', tipo: 'Semanal' },
      { codigo: '455', nombre: 'Hepatitis B', tipo: 'Semanal' },
      { codigo: '550', nombre: 'Muerte perinatal', tipo: 'Inmediata' },
      { codigo: '560', nombre: 'Mortalidad materna', tipo: 'Inmediata' },
      { codigo: '600', nombre: 'Enfermedades transmitidas por alimentos (ETA)', tipo: 'Semanal' },
      { codigo: '820', nombre: 'Infecciones asociadas a dispositivos', tipo: 'Semanal' },
    ];
  }
}

module.exports = new VigilanciaSaludService();
