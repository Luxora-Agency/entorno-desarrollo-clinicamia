/**
 * Servicio de Bienestar Laboral - Módulo Talento Humano
 */
const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class BienestarService {
  // ============ BENEFICIOS ============

  /**
   * Listar beneficios
   */
  async listBeneficios({ tipo, activo = true }) {
    const where = {};
    if (tipo) where.tipo = tipo;
    if (activo !== undefined) where.activo = activo;

    return prisma.tHBeneficio.findMany({
      where,
      include: {
        _count: { select: { asignaciones: true } }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  /**
   * Crear beneficio
   */
  async createBeneficio(data) {
    return prisma.tHBeneficio.create({ data });
  }

  /**
   * Actualizar beneficio
   */
  async updateBeneficio(id, data) {
    const beneficio = await prisma.tHBeneficio.findUnique({ where: { id } });
    if (!beneficio) throw new NotFoundError('Beneficio no encontrado');

    return prisma.tHBeneficio.update({
      where: { id },
      data
    });
  }

  /**
   * Asignar beneficio a empleado
   */
  async asignarBeneficio(beneficioId, empleadoId, data) {
    const [beneficio, empleado] = await Promise.all([
      prisma.tHBeneficio.findUnique({ where: { id: beneficioId } }),
      prisma.tHEmpleado.findUnique({ where: { id: empleadoId } })
    ]);

    if (!beneficio) throw new NotFoundError('Beneficio no encontrado');
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    return prisma.tHBeneficioEmpleado.create({
      data: {
        beneficioId,
        empleadoId,
        fechaInicio: data.fechaInicio || new Date(),
        fechaFin: data.fechaFin
      }
    });
  }

  /**
   * Obtener beneficios de un empleado
   */
  async getBeneficiosEmpleado(empleadoId) {
    return prisma.tHBeneficioEmpleado.findMany({
      where: { empleadoId, estado: 'ACTIVO' },
      include: { beneficio: true }
    });
  }

  // ============ ENCUESTAS ============

  /**
   * Listar encuestas
   */
  async listEncuestas({ tipo, estado, page = 1, limit = 10 }) {
    const where = {};
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      prisma.tHEncuesta.findMany({
        where,
        include: {
          _count: { select: { respuestas: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHEncuesta.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Crear encuesta
   */
  async createEncuesta(data) {
    return prisma.tHEncuesta.create({ data });
  }

  /**
   * Obtener encuesta por ID
   */
  async getEncuesta(id) {
    const encuesta = await prisma.tHEncuesta.findUnique({
      where: { id },
      include: {
        _count: { select: { respuestas: true } }
      }
    });

    if (!encuesta) throw new NotFoundError('Encuesta no encontrada');
    return encuesta;
  }

  /**
   * Activar encuesta
   */
  async activarEncuesta(id) {
    const encuesta = await prisma.tHEncuesta.findUnique({ where: { id } });
    if (!encuesta) throw new NotFoundError('Encuesta no encontrada');

    return prisma.tHEncuesta.update({
      where: { id },
      data: { estado: 'ACTIVA' }
    });
  }

  /**
   * Responder encuesta
   */
  async responderEncuesta(encuestaId, empleadoId, respuestas) {
    const encuesta = await prisma.tHEncuesta.findUnique({ where: { id: encuestaId } });
    if (!encuesta) throw new NotFoundError('Encuesta no encontrada');

    if (encuesta.estado !== 'ACTIVA') {
      throw new ValidationError('La encuesta no está activa');
    }

    const now = new Date();
    if (now < encuesta.fechaInicio || now > encuesta.fechaFin) {
      throw new ValidationError('La encuesta no está en el periodo de respuesta');
    }

    // Verificar si ya respondió (si no es anónima)
    if (!encuesta.esAnonima) {
      const existing = await prisma.tHRespuestaEncuesta.findFirst({
        where: { encuestaId, empleadoId }
      });
      if (existing) {
        throw new ValidationError('Ya respondiste esta encuesta');
      }
    }

    return prisma.tHRespuestaEncuesta.create({
      data: {
        encuestaId,
        empleadoId: encuesta.esAnonima ? null : empleadoId,
        respuestas
      }
    });
  }

  /**
   * Obtener resultados de encuesta
   */
  async getResultadosEncuesta(encuestaId) {
    const encuesta = await prisma.tHEncuesta.findUnique({
      where: { id: encuestaId },
      include: { respuestas: true }
    });

    if (!encuesta) throw new NotFoundError('Encuesta no encontrada');

    const totalRespuestas = encuesta.respuestas.length;
    const preguntas = encuesta.preguntas;

    // Agregar respuestas por pregunta
    const resultados = preguntas.map((pregunta, index) => {
      const respuestasPregunta = encuesta.respuestas.map(r => r.respuestas[index]);

      if (pregunta.tipo === 'escala' || pregunta.tipo === 'numero') {
        const valores = respuestasPregunta.filter(v => v !== undefined && v !== null).map(Number);
        const promedio = valores.length > 0
          ? valores.reduce((a, b) => a + b, 0) / valores.length
          : 0;
        return {
          pregunta: pregunta.texto,
          tipo: pregunta.tipo,
          promedio: Math.round(promedio * 100) / 100,
          respuestas: valores.length
        };
      }

      if (pregunta.tipo === 'opcion_multiple' || pregunta.tipo === 'seleccion') {
        const conteo = respuestasPregunta.reduce((acc, v) => {
          if (v) {
            acc[v] = (acc[v] || 0) + 1;
          }
          return acc;
        }, {});
        return {
          pregunta: pregunta.texto,
          tipo: pregunta.tipo,
          opciones: conteo,
          respuestas: respuestasPregunta.filter(v => v).length
        };
      }

      return {
        pregunta: pregunta.texto,
        tipo: pregunta.tipo,
        respuestas: respuestasPregunta.filter(v => v)
      };
    });

    return {
      encuesta: {
        titulo: encuesta.titulo,
        tipo: encuesta.tipo,
        fechaInicio: encuesta.fechaInicio,
        fechaFin: encuesta.fechaFin
      },
      totalRespuestas,
      resultados
    };
  }

  // ============ EVENTOS ============

  /**
   * Listar eventos
   */
  async listEventos({ tipo, estado, fechaDesde, fechaHasta, page = 1, limit = 10 }) {
    const where = {};
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }

    const [data, total] = await Promise.all([
      prisma.tHEvento.findMany({
        where,
        include: {
          _count: { select: { asistentes: true } }
        },
        orderBy: { fecha: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHEvento.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Crear evento
   */
  async createEvento(data) {
    return prisma.tHEvento.create({ data });
  }

  /**
   * Confirmar asistencia a evento
   */
  async confirmarAsistencia(eventoId, empleadoId) {
    const evento = await prisma.tHEvento.findUnique({ where: { id: eventoId } });
    if (!evento) throw new NotFoundError('Evento no encontrado');

    // Verificar cupo
    if (evento.cupoMaximo) {
      const confirmados = await prisma.tHAsistenteEvento.count({
        where: { eventoId, confirmado: true }
      });
      if (confirmados >= evento.cupoMaximo) {
        throw new ValidationError('El evento está lleno');
      }
    }

    return prisma.tHAsistenteEvento.upsert({
      where: {
        eventoId_empleadoId: { eventoId, empleadoId }
      },
      create: {
        eventoId,
        empleadoId,
        confirmado: true
      },
      update: {
        confirmado: true
      }
    });
  }

  /**
   * Registrar asistencia a evento
   */
  async registrarAsistenciaEvento(eventoId, empleadoId, asistio) {
    const asistente = await prisma.tHAsistenteEvento.findUnique({
      where: {
        eventoId_empleadoId: { eventoId, empleadoId }
      }
    });

    if (!asistente) throw new NotFoundError('Registro no encontrado');

    return prisma.tHAsistenteEvento.update({
      where: { id: asistente.id },
      data: { asistio }
    });
  }

  // ============ RECONOCIMIENTOS ============

  /**
   * Crear reconocimiento
   */
  async createReconocimiento(empleadoId, userId, data) {
    const empleado = await prisma.tHEmpleado.findUnique({ where: { id: empleadoId } });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    return prisma.tHReconocimiento.create({
      data: {
        empleadoId,
        otorgadoPor: userId,
        ...data
      }
    });
  }

  /**
   * Listar reconocimientos
   */
  async listReconocimientos({ empleadoId, tipo, page = 1, limit = 20 }) {
    const where = {};
    if (empleadoId) where.empleadoId = empleadoId;
    if (tipo) where.tipo = tipo;

    const [data, total] = await Promise.all([
      prisma.tHReconocimiento.findMany({
        where,
        include: {
          empleado: { select: { id: true, nombre: true, apellido: true, fotoUrl: true } },
          otorgante: { select: { id: true, nombre: true, apellido: true } }
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHReconocimiento.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Obtener reconocimientos públicos recientes
   */
  async getReconocimientosPublicos(limit = 10) {
    return prisma.tHReconocimiento.findMany({
      where: { esPublico: true },
      include: {
        empleado: { select: { id: true, nombre: true, apellido: true, fotoUrl: true } }
      },
      orderBy: { fecha: 'desc' },
      take: limit
    });
  }
}

module.exports = new BienestarService();
