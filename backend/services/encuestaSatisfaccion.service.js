/**
 * Service de Encuestas de Satisfacción
 * Gestiona encuestas post-consulta para calificar doctores y atención
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const crypto = require('crypto');

class EncuestaSatisfaccionService {
  /**
   * Genera un token único para la encuesta
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Crear encuesta después de finalizar consulta
   * @param {Object} data - Datos de la consulta
   * @returns {Object} - Encuesta creada con token
   */
  async crearEncuestaPostConsulta({ citaId, pacienteId, doctorId, especialidad }) {
    // Verificar que la cita existe
    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: {
        paciente: true,
        doctor: true,
        especialidad: true
      }
    });

    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }

    // Verificar si ya existe una encuesta para esta cita
    const encuestaExistente = await prisma.encuestaSatisfaccion.findFirst({
      where: { citaId }
    });

    if (encuestaExistente) {
      return encuestaExistente;
    }

    // Generar token único
    const token = this.generateToken();

    // Crear la encuesta
    const encuesta = await prisma.encuestaSatisfaccion.create({
      data: {
        citaId,
        pacienteId: pacienteId || cita.pacienteId,
        doctorId: doctorId || cita.doctorId,
        nombrePaciente: cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellido}` : null,
        nombreDoctor: cita.doctor ? `${cita.doctor.nombre} ${cita.doctor.apellido}` : null,
        especialidad: especialidad || cita.especialidad?.titulo || 'Consulta General',
        servicioAtendido: 'Consulta Médica',
        token,
        tipoEncuesta: 'POST_CONSULTA',
        canal: 'EMAIL',
        activo: true
      }
    });

    return encuesta;
  }

  /**
   * Obtener encuesta por token (para página pública)
   */
  async getByToken(token) {
    const encuesta = await prisma.encuestaSatisfaccion.findUnique({
      where: { token },
      include: {
        paciente: {
          select: { id: true, nombre: true, apellido: true }
        },
        doctor: {
          select: { id: true, nombre: true, apellido: true }
        }
      }
    });

    if (!encuesta) {
      throw new NotFoundError('Encuesta no encontrada o enlace inválido');
    }

    if (encuesta.respondido) {
      throw new ValidationError('Esta encuesta ya fue respondida');
    }

    return encuesta;
  }

  /**
   * Responder encuesta (endpoint público)
   */
  async responderEncuesta(token, respuestas, ipOrigen = null) {
    const encuesta = await prisma.encuestaSatisfaccion.findUnique({
      where: { token }
    });

    if (!encuesta) {
      throw new NotFoundError('Encuesta no encontrada');
    }

    if (encuesta.respondido) {
      throw new ValidationError('Esta encuesta ya fue respondida');
    }

    // Validar que las calificaciones estén en rango 1-5
    const camposCalificacion = [
      'atencionDoctor', 'claridadDoctor', 'tiempoConsulta', 'empatiaDoctor',
      'atencionRecepcion', 'atencionEnfermeria', 'tiempoEspera',
      'instalaciones', 'satisfaccionGeneral', 'accesibilidad', 'oportunidad',
      'seguridadPaciente', 'experienciaAtencion'
    ];

    for (const campo of camposCalificacion) {
      if (respuestas[campo] !== undefined && respuestas[campo] !== null) {
        const valor = parseInt(respuestas[campo]);
        if (isNaN(valor) || valor < 1 || valor > 5) {
          throw new ValidationError(`La calificación de ${campo} debe estar entre 1 y 5`);
        }
      }
    }

    // Actualizar la encuesta con las respuestas
    const encuestaActualizada = await prisma.encuestaSatisfaccion.update({
      where: { id: encuesta.id },
      data: {
        // Calificaciones del doctor
        atencionDoctor: respuestas.atencionDoctor ? parseInt(respuestas.atencionDoctor) : null,
        claridadDoctor: respuestas.claridadDoctor ? parseInt(respuestas.claridadDoctor) : null,
        tiempoConsulta: respuestas.tiempoConsulta ? parseInt(respuestas.tiempoConsulta) : null,
        empatiaDoctor: respuestas.empatiaDoctor ? parseInt(respuestas.empatiaDoctor) : null,

        // Calificaciones del personal
        atencionRecepcion: respuestas.atencionRecepcion ? parseInt(respuestas.atencionRecepcion) : null,
        atencionEnfermeria: respuestas.atencionEnfermeria ? parseInt(respuestas.atencionEnfermeria) : null,
        tiempoEspera: respuestas.tiempoEspera ? parseInt(respuestas.tiempoEspera) : null,

        // Calificaciones generales
        instalaciones: respuestas.instalaciones ? parseInt(respuestas.instalaciones) : null,
        satisfaccionGeneral: respuestas.satisfaccionGeneral ? parseInt(respuestas.satisfaccionGeneral) : null,
        accesibilidad: respuestas.accesibilidad ? parseInt(respuestas.accesibilidad) : null,
        oportunidad: respuestas.oportunidad ? parseInt(respuestas.oportunidad) : null,
        seguridadPaciente: respuestas.seguridadPaciente ? parseInt(respuestas.seguridadPaciente) : null,
        experienciaAtencion: respuestas.experienciaAtencion ? parseInt(respuestas.experienciaAtencion) : null,

        // Recomendación
        recomendaria: respuestas.recomendaria === true || respuestas.recomendaria === 'true',

        // Comentarios
        aspectosPositivos: respuestas.aspectosPositivos || null,
        aspectosMejorar: respuestas.aspectosMejorar || null,
        sugerencias: respuestas.sugerencias || null,
        comentarioDoctor: respuestas.comentarioDoctor || null,

        // Marcar como respondida
        respondido: true,
        fechaRespuesta: new Date(),
        ipRespuesta: ipOrigen
      }
    });

    return encuestaActualizada;
  }

  /**
   * Obtener estadísticas de satisfacción por doctor
   */
  async getEstadisticasDoctor(doctorId, fechaDesde = null, fechaHasta = null) {
    const where = {
      doctorId,
      respondido: true,
      activo: true
    };

    if (fechaDesde || fechaHasta) {
      where.fechaRespuesta = {};
      if (fechaDesde) where.fechaRespuesta.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaRespuesta.lte = new Date(fechaHasta);
    }

    const encuestas = await prisma.encuestaSatisfaccion.findMany({
      where,
      select: {
        atencionDoctor: true,
        claridadDoctor: true,
        tiempoConsulta: true,
        empatiaDoctor: true,
        satisfaccionGeneral: true,
        recomendaria: true,
        fechaRespuesta: true
      }
    });

    if (encuestas.length === 0) {
      return {
        totalEncuestas: 0,
        promedios: null,
        porcentajeRecomendacion: null
      };
    }

    // Calcular promedios
    const calcularPromedio = (campo) => {
      const valores = encuestas.filter(e => e[campo] != null).map(e => e[campo]);
      if (valores.length === 0) return null;
      return (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2);
    };

    const recomendaciones = encuestas.filter(e => e.recomendaria === true).length;

    return {
      totalEncuestas: encuestas.length,
      promedios: {
        atencionDoctor: calcularPromedio('atencionDoctor'),
        claridadDoctor: calcularPromedio('claridadDoctor'),
        tiempoConsulta: calcularPromedio('tiempoConsulta'),
        empatiaDoctor: calcularPromedio('empatiaDoctor'),
        satisfaccionGeneral: calcularPromedio('satisfaccionGeneral'),
        promedioGeneral: (
          (parseFloat(calcularPromedio('atencionDoctor') || 0) +
           parseFloat(calcularPromedio('claridadDoctor') || 0) +
           parseFloat(calcularPromedio('tiempoConsulta') || 0) +
           parseFloat(calcularPromedio('empatiaDoctor') || 0)) / 4
        ).toFixed(2)
      },
      porcentajeRecomendacion: ((recomendaciones / encuestas.length) * 100).toFixed(1)
    };
  }

  /**
   * Obtener todas las encuestas (admin)
   */
  async getAll({ page = 1, limit = 20, doctorId, respondido, fechaDesde, fechaHasta }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { activo: true };
    if (doctorId) where.doctorId = doctorId;
    if (respondido !== undefined) where.respondido = respondido === 'true' || respondido === true;
    if (fechaDesde || fechaHasta) {
      where.fechaEncuesta = {};
      if (fechaDesde) where.fechaEncuesta.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaEncuesta.lte = new Date(fechaHasta);
    }

    const [encuestas, total] = await Promise.all([
      prisma.encuestaSatisfaccion.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaEncuesta: 'desc' },
        include: {
          paciente: { select: { id: true, nombre: true, apellido: true } },
          doctor: { select: { id: true, nombre: true, apellido: true } }
        }
      }),
      prisma.encuestaSatisfaccion.count({ where })
    ]);

    return {
      data: encuestas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Obtener ranking de doctores por satisfacción
   */
  async getRankingDoctores(limit = 10) {
    const doctores = await prisma.encuestaSatisfaccion.groupBy({
      by: ['doctorId', 'nombreDoctor'],
      where: {
        respondido: true,
        activo: true,
        doctorId: { not: null }
      },
      _avg: {
        atencionDoctor: true,
        claridadDoctor: true,
        tiempoConsulta: true,
        empatiaDoctor: true,
        satisfaccionGeneral: true
      },
      _count: {
        id: true
      }
    });

    // Calcular promedio general y ordenar
    const ranking = doctores.map(d => ({
      doctorId: d.doctorId,
      nombreDoctor: d.nombreDoctor,
      totalEncuestas: d._count.id,
      promedioAtencion: d._avg.atencionDoctor?.toFixed(2) || null,
      promedioClaridad: d._avg.claridadDoctor?.toFixed(2) || null,
      promedioTiempo: d._avg.tiempoConsulta?.toFixed(2) || null,
      promedioEmpatia: d._avg.empatiaDoctor?.toFixed(2) || null,
      promedioSatisfaccion: d._avg.satisfaccionGeneral?.toFixed(2) || null,
      promedioGeneral: (
        ((d._avg.atencionDoctor || 0) +
         (d._avg.claridadDoctor || 0) +
         (d._avg.tiempoConsulta || 0) +
         (d._avg.empatiaDoctor || 0)) / 4
      ).toFixed(2)
    })).sort((a, b) => parseFloat(b.promedioGeneral) - parseFloat(a.promedioGeneral));

    return ranking.slice(0, limit);
  }
}

module.exports = new EncuestaSatisfaccionService();
