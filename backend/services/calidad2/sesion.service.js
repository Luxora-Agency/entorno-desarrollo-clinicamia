const prisma = require('../../db/prisma');
const { NotFoundError, ValidationError } = require('../../utils/errors');

// Generar código de sesión de 6 dígitos desde el UUID
function generateSessionCode(sessionId) {
  // Tomar los primeros caracteres del UUID y convertir a número
  const hex = sessionId.replace(/-/g, '').substring(0, 8);
  const num = parseInt(hex, 16);
  // Generar código de 6 dígitos (100000 - 999999)
  return String(100000 + (num % 900000));
}

class SesionService {
  // Obtener código de sesión
  getSessionCode(sessionId) {
    return generateSessionCode(sessionId);
  }

  // Buscar sesión por código
  async findByCode(code) {
    // Buscar todas las sesiones EN_CURSO y verificar su código
    const sesionesActivas = await prisma.sesionCapacitacion.findMany({
      where: {
        estado: 'EN_CURSO'
      },
      include: {
        capacitacion: {
          select: { id: true, tema: true, actividad: true }
        },
        _count: {
          select: { asistentes: true }
        }
      }
    });

    // Encontrar la sesión cuyo código coincida
    const sesion = sesionesActivas.find(s => generateSessionCode(s.id) === code);

    if (!sesion) {
      throw new NotFoundError('Código de sesión inválido o sesión no activa');
    }

    return {
      id: sesion.id,
      codigo: code,
      capacitacion: sesion.capacitacion,
      participantes: sesion._count.asistentes
    };
  }
  async findByCapacitacion(capacitacionId, query = {}) {
    const { estado, page = 1, limit = 20 } = query;

    const where = { capacitacionId };
    if (estado) where.estado = estado;

    const [sesiones, total] = await Promise.all([
      prisma.sesionCapacitacion.findMany({
        where,
        include: {
          acta: { select: { id: true, numero: true } },
          asistentes: {
            include: {
              personal: { select: { id: true, nombreCompleto: true, cargo: true } }
            }
          },
          respuestasEvaluacion: {
            select: { nombreParticipante: true, participanteId: true }
          },
          _count: {
            select: { asistentes: true, respuestasEvaluacion: true }
          }
        },
        orderBy: { fechaProgramada: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.sesionCapacitacion.count({ where })
    ]);

    // Calculate attendance stats
    const sesionesConStats = sesiones.map(s => {
      // Contar asistentes marcados manualmente
      const asistentesManual = s.asistentes.filter(a => a.asistio).length;

      // Contar participantes únicos de evaluaciones (que no estén ya en asistentes)
      const nombresAsistentes = new Set(s.asistentes.map(a => a.nombreCompleto?.toLowerCase()));
      const participantesEvaluacion = new Set();
      s.respuestasEvaluacion.forEach(r => {
        const nombre = r.nombreParticipante?.toLowerCase();
        if (nombre && !nombresAsistentes.has(nombre)) {
          participantesEvaluacion.add(nombre);
        }
      });

      // Total de asistentes = manual + evaluaciones
      const asistieron = asistentesManual + participantesEvaluacion.size;

      // No incluir respuestasEvaluacion en la respuesta para no sobrecargar
      const { respuestasEvaluacion, ...sesionSinRespuestas } = s;

      return {
        ...sesionSinRespuestas,
        asistieron,
        participantesEvaluacion: participantesEvaluacion.size,
        porcentajeAsistencia: s.convocados > 0
          ? Math.round((asistieron / s.convocados) * 100)
          : 0
      };
    });

    return {
      sesiones: sesionesConStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id) {
    const sesion = await prisma.sesionCapacitacion.findUnique({
      where: { id },
      include: {
        capacitacion: {
          include: {
            categoria: true,
            responsable: { select: { id: true, nombre: true, apellido: true } },
            evaluaciones: {
              where: { activo: true },
              include: {
                _count: { select: { preguntas: true } }
              }
            }
          }
        },
        acta: true,
        asistentes: {
          include: {
            personal: { select: { id: true, nombreCompleto: true, cargo: true } }
          },
          orderBy: { nombreCompleto: 'asc' }
        },
        respuestasEvaluacion: {
          include: {
            pregunta: {
              include: {
                evaluacion: { select: { tipo: true } },
                opciones: true
              }
            }
          }
        }
      }
    });

    if (!sesion) {
      throw new NotFoundError('Sesión no encontrada');
    }

    // Calculate attendance
    const asistieron = sesion.asistentes.filter(a => a.asistio).length;
    sesion.asistieron = asistieron;
    sesion.porcentajeAsistencia = sesion.convocados > 0
      ? Math.round((asistieron / sesion.convocados) * 100)
      : 0;

    return sesion;
  }

  async create(capacitacionId, data, userId) {
    const capacitacion = await prisma.capacitacion.findUnique({
      where: { id: capacitacionId }
    });

    if (!capacitacion) {
      throw new NotFoundError('Capacitación no encontrada');
    }

    return prisma.sesionCapacitacion.create({
      data: {
        ...data,
        capacitacionId,
        creadoPor: userId
      },
      include: {
        asistentes: true
      }
    });
  }

  async update(id, data) {
    const existing = await prisma.sesionCapacitacion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Sesión no encontrada');
    }

    return prisma.sesionCapacitacion.update({
      where: { id },
      data,
      include: {
        asistentes: true
      }
    });
  }

  async delete(id) {
    const existing = await prisma.sesionCapacitacion.findUnique({
      where: { id },
      include: { acta: true }
    });

    if (!existing) {
      throw new NotFoundError('Sesión no encontrada');
    }

    if (existing.acta) {
      throw new ValidationError('No se puede eliminar una sesión con acta generada');
    }

    return prisma.sesionCapacitacion.delete({ where: { id } });
  }

  async iniciar(id) {
    const sesion = await prisma.sesionCapacitacion.findUnique({ where: { id } });
    if (!sesion) {
      throw new NotFoundError('Sesión no encontrada');
    }

    if (sesion.estado !== 'PROGRAMADA') {
      throw new ValidationError('Solo se pueden iniciar sesiones programadas');
    }

    return prisma.sesionCapacitacion.update({
      where: { id },
      data: {
        estado: 'EN_CURSO',
        fechaEjecutada: new Date()
      }
    });
  }

  async finalizar(id) {
    const sesion = await prisma.sesionCapacitacion.findUnique({
      where: { id },
      include: {
        capacitacion: true,
        asistentes: true,
        respuestasEvaluacion: {
          include: {
            pregunta: {
              include: { evaluacion: true }
            }
          }
        }
      }
    });

    if (!sesion) {
      throw new NotFoundError('Sesión no encontrada');
    }

    if (sesion.estado !== 'EN_CURSO') {
      throw new ValidationError('Solo se pueden finalizar sesiones en curso');
    }

    // Get next acta number
    const maxActa = await prisma.actaReunion.aggregate({
      _max: { numero: true }
    });
    const siguienteNumero = (maxActa._max.numero || 0) + 1;

    // Calculate evaluation analysis if exists
    let analisisEvaluacion = null;
    if (sesion.respuestasEvaluacion.length > 0) {
      const preTest = sesion.respuestasEvaluacion.filter(r => r.pregunta.evaluacion.tipo === 'PRE_TEST');
      const postTest = sesion.respuestasEvaluacion.filter(r => r.pregunta.evaluacion.tipo === 'POST_TEST');

      analisisEvaluacion = {
        preTest: {
          total: preTest.length,
          correctas: preTest.filter(r => r.esCorrecta).length,
          porcentaje: preTest.length > 0
            ? Math.round((preTest.filter(r => r.esCorrecta).length / preTest.length) * 100)
            : 0
        },
        postTest: {
          total: postTest.length,
          correctas: postTest.filter(r => r.esCorrecta).length,
          porcentaje: postTest.length > 0
            ? Math.round((postTest.filter(r => r.esCorrecta).length / postTest.length) * 100)
            : 0
        }
      };
    }

    // Create acta
    const asistieron = sesion.asistentes.filter(a => a.asistio);
    const acta = await prisma.actaReunion.create({
      data: {
        numero: siguienteNumero,
        tiposReunion: ['CAPACITACION'],
        objetivo: `Capacitación: ${sesion.capacitacion.tema}`,
        fecha: sesion.fechaEjecutada || new Date(),
        horaInicio: sesion.horaInicio || '00:00',
        horaFin: sesion.horaFin || '00:00',
        lugar: sesion.lugar || 'No especificado',
        temasTratar: [sesion.capacitacion.tema],
        analisisEvaluacion,
        creadoPor: sesion.creadoPor,
        asistentes: {
          create: asistieron.map(a => ({
            personalId: a.personalId,
            nombreCompleto: a.nombreCompleto,
            cargo: a.cargo,
            firmaUrl: a.firmaUrl
          }))
        }
      }
    });

    // Update session
    return prisma.sesionCapacitacion.update({
      where: { id },
      data: {
        estado: 'COMPLETADA',
        actaId: acta.id
      },
      include: {
        acta: true
      }
    });
  }

  // Asistentes
  async getAsistentes(sesionId) {
    const sesion = await prisma.sesionCapacitacion.findUnique({
      where: { id: sesionId },
      include: {
        asistentes: {
          include: {
            personal: { select: { id: true, nombreCompleto: true, cargo: true, correo: true } }
          },
          orderBy: { nombreCompleto: 'asc' }
        }
      }
    });

    if (!sesion) {
      throw new NotFoundError('Sesión no encontrada');
    }

    return sesion.asistentes;
  }

  async addAsistentes(sesionId, asistentesData) {
    const sesion = await prisma.sesionCapacitacion.findUnique({ where: { id: sesionId } });
    if (!sesion) {
      throw new NotFoundError('Sesión no encontrada');
    }

    const creates = asistentesData.map(a => ({
      sesionId,
      personalId: a.personalId || null,
      nombreCompleto: a.nombreCompleto,
      cargo: a.cargo || null
    }));

    await prisma.asistenteSesion.createMany({
      data: creates,
      skipDuplicates: true
    });

    // Update convocados count
    const count = await prisma.asistenteSesion.count({ where: { sesionId } });
    await prisma.sesionCapacitacion.update({
      where: { id: sesionId },
      data: { convocados: count }
    });

    return this.getAsistentes(sesionId);
  }

  async updateAsistente(sesionId, asistenteId, data) {
    const asistente = await prisma.asistenteSesion.findFirst({
      where: { id: asistenteId, sesionId }
    });

    if (!asistente) {
      throw new NotFoundError('Asistente no encontrado');
    }

    return prisma.asistenteSesion.update({
      where: { id: asistenteId },
      data: {
        asistio: data.asistio,
        firmaUrl: data.firmaUrl
      }
    });
  }

  async removeAsistente(sesionId, asistenteId) {
    const asistente = await prisma.asistenteSesion.findFirst({
      where: { id: asistenteId, sesionId }
    });

    if (!asistente) {
      throw new NotFoundError('Asistente no encontrado');
    }

    await prisma.asistenteSesion.delete({ where: { id: asistenteId } });

    // Update convocados count
    const count = await prisma.asistenteSesion.count({ where: { sesionId } });
    await prisma.sesionCapacitacion.update({
      where: { id: sesionId },
      data: { convocados: count }
    });

    return { message: 'Asistente eliminado' };
  }

  async marcarAsistenciaMasiva(sesionId, asistentesIds, asistio = true) {
    await prisma.asistenteSesion.updateMany({
      where: {
        sesionId,
        id: { in: asistentesIds }
      },
      data: { asistio }
    });

    return this.getAsistentes(sesionId);
  }
}

module.exports = new SesionService();
