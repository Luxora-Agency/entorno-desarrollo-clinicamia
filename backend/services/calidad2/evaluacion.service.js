const prisma = require('../../db/prisma');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class EvaluacionService {
  // ==========================================
  // EVALUACIONES TEMPLATE
  // ==========================================

  async findByCapacitacion(capacitacionId) {
    return prisma.evaluacionTemplate.findMany({
      where: { capacitacionId, activo: true },
      include: {
        preguntas: {
          where: { activo: true },
          include: {
            opciones: { orderBy: { orden: 'asc' } }
          },
          orderBy: { orden: 'asc' }
        },
        _count: { select: { preguntas: true } }
      },
      orderBy: { tipo: 'asc' }
    });
  }

  async findById(id) {
    const evaluacion = await prisma.evaluacionTemplate.findUnique({
      where: { id },
      include: {
        capacitacion: {
          select: { id: true, tema: true, actividad: true }
        },
        preguntas: {
          where: { activo: true },
          include: {
            opciones: { orderBy: { orden: 'asc' } }
          },
          orderBy: { orden: 'asc' }
        }
      }
    });

    if (!evaluacion) {
      throw new NotFoundError('Evaluación no encontrada');
    }

    return evaluacion;
  }

  async create(capacitacionId, data, userId) {
    const capacitacion = await prisma.capacitacion.findUnique({
      where: { id: capacitacionId }
    });

    if (!capacitacion) {
      throw new NotFoundError('Capacitación no encontrada');
    }

    // Check if already exists for this type
    const existing = await prisma.evaluacionTemplate.findFirst({
      where: {
        capacitacionId,
        tipo: data.tipo,
        activo: true
      }
    });

    if (existing) {
      throw new ValidationError(`Ya existe una evaluación ${data.tipo} para esta capacitación`);
    }

    return prisma.evaluacionTemplate.create({
      data: {
        ...data,
        capacitacionId,
        creadoPor: userId
      },
      include: {
        preguntas: true
      }
    });
  }

  async update(id, data) {
    const existing = await prisma.evaluacionTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Evaluación no encontrada');
    }

    return prisma.evaluacionTemplate.update({
      where: { id },
      data,
      include: {
        preguntas: {
          where: { activo: true },
          include: { opciones: true },
          orderBy: { orden: 'asc' }
        }
      }
    });
  }

  async delete(id) {
    const existing = await prisma.evaluacionTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Evaluación no encontrada');
    }

    // Soft delete
    return prisma.evaluacionTemplate.update({
      where: { id },
      data: { activo: false }
    });
  }

  // ==========================================
  // PREGUNTAS
  // ==========================================

  async addPregunta(evaluacionId, data) {
    const evaluacion = await prisma.evaluacionTemplate.findUnique({
      where: { id: evaluacionId }
    });

    if (!evaluacion) {
      throw new NotFoundError('Evaluación no encontrada');
    }

    // Get next order
    const maxOrden = await prisma.preguntaEvaluacion.aggregate({
      where: { evaluacionId },
      _max: { orden: true }
    });

    const { opciones, ...preguntaData } = data;

    // Debug: Log what's being saved
    console.log('[Evaluacion] Creando pregunta:');
    console.log('  - Texto:', preguntaData.texto);
    console.log('  - Tipo:', preguntaData.tipo);
    console.log('  - Opciones recibidas:', opciones);

    // Create question with options
    return prisma.preguntaEvaluacion.create({
      data: {
        ...preguntaData,
        evaluacionId,
        orden: preguntaData.orden ?? (maxOrden._max.orden || 0) + 1,
        opciones: opciones ? {
          create: opciones.map((op, index) => ({
            texto: op.texto,
            esCorrecta: op.esCorrecta || false,
            orden: index + 1
          }))
        } : undefined
      },
      include: {
        opciones: { orderBy: { orden: 'asc' } }
      }
    });
  }

  async updatePregunta(preguntaId, data) {
    const existing = await prisma.preguntaEvaluacion.findUnique({
      where: { id: preguntaId }
    });

    if (!existing) {
      throw new NotFoundError('Pregunta no encontrada');
    }

    const { opciones, ...preguntaData } = data;

    return prisma.preguntaEvaluacion.update({
      where: { id: preguntaId },
      data: preguntaData,
      include: {
        opciones: { orderBy: { orden: 'asc' } }
      }
    });
  }

  async deletePregunta(preguntaId) {
    const existing = await prisma.preguntaEvaluacion.findUnique({
      where: { id: preguntaId }
    });

    if (!existing) {
      throw new NotFoundError('Pregunta no encontrada');
    }

    // Soft delete
    return prisma.preguntaEvaluacion.update({
      where: { id: preguntaId },
      data: { activo: false }
    });
  }

  async reorderPreguntas(evaluacionId, orderedIds) {
    const updates = orderedIds.map((id, index) =>
      prisma.preguntaEvaluacion.update({
        where: { id },
        data: { orden: index + 1 }
      })
    );

    return prisma.$transaction(updates);
  }

  // ==========================================
  // OPCIONES
  // ==========================================

  async addOpcion(preguntaId, data) {
    const pregunta = await prisma.preguntaEvaluacion.findUnique({
      where: { id: preguntaId }
    });

    if (!pregunta) {
      throw new NotFoundError('Pregunta no encontrada');
    }

    const maxOrden = await prisma.opcionPregunta.aggregate({
      where: { preguntaId },
      _max: { orden: true }
    });

    return prisma.opcionPregunta.create({
      data: {
        ...data,
        preguntaId,
        orden: data.orden ?? (maxOrden._max.orden || 0) + 1
      }
    });
  }

  async updateOpcion(opcionId, data) {
    const existing = await prisma.opcionPregunta.findUnique({
      where: { id: opcionId }
    });

    if (!existing) {
      throw new NotFoundError('Opción no encontrada');
    }

    return prisma.opcionPregunta.update({
      where: { id: opcionId },
      data
    });
  }

  async deleteOpcion(opcionId) {
    const existing = await prisma.opcionPregunta.findUnique({
      where: { id: opcionId }
    });

    if (!existing) {
      throw new NotFoundError('Opción no encontrada');
    }

    return prisma.opcionPregunta.delete({
      where: { id: opcionId }
    });
  }

  // ==========================================
  // EJECUCIÓN DE EVALUACIÓN (KAHOOT ASÍNCRONO)
  // ==========================================

  async getEvaluacionParaResponder(sesionId, tipo) {
    const sesion = await prisma.sesionCapacitacion.findUnique({
      where: { id: sesionId },
      include: {
        capacitacion: {
          include: {
            evaluaciones: {
              where: { tipo, activo: true },
              include: {
                preguntas: {
                  where: { activo: true },
                  include: {
                    opciones: {
                      orderBy: { orden: 'asc' },
                      select: { id: true, texto: true, orden: true }
                    }
                  },
                  orderBy: { orden: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!sesion) {
      throw new NotFoundError('Sesión no encontrada');
    }

    const evaluacion = sesion.capacitacion.evaluaciones[0];
    if (!evaluacion) {
      throw new NotFoundError(`No hay ${tipo} configurado para esta capacitación`);
    }

    // Remove correct answer info for participants
    return {
      id: evaluacion.id,
      nombre: evaluacion.nombre,
      descripcion: evaluacion.descripcion,
      tipo: evaluacion.tipo,
      tiempoLimiteMin: evaluacion.tiempoLimiteMin,
      puntajePorPregunta: evaluacion.puntajePorPregunta,
      preguntas: evaluacion.preguntas.map(p => ({
        id: p.id,
        texto: p.texto,
        tipo: p.tipo,
        orden: p.orden,
        tiempoSegundos: p.tiempoSegundos,
        imagenUrl: p.imagenUrl,
        opciones: p.opciones
      })),
      sesion: {
        id: sesion.id,
        capacitacion: sesion.capacitacion.tema
      }
    };
  }

  async registrarRespuesta(sesionId, data) {
    const { preguntaId, participanteId, nombreParticipante, opcionesSeleccionadas, tiempoRespuestaMs } = data;

    // Validate session
    const sesion = await prisma.sesionCapacitacion.findUnique({
      where: { id: sesionId }
    });

    if (!sesion) {
      throw new NotFoundError('Sesión no encontrada');
    }

    // Get question with correct answers
    const pregunta = await prisma.preguntaEvaluacion.findUnique({
      where: { id: preguntaId },
      include: {
        opciones: true,
        evaluacion: true
      }
    });

    if (!pregunta) {
      throw new NotFoundError('Pregunta no encontrada');
    }

    // Check if already answered by this participant
    const existingRespuesta = await prisma.respuestaEvaluacion.findFirst({
      where: {
        sesionId,
        preguntaId,
        OR: [
          { participanteId },
          { nombreParticipante }
        ]
      }
    });

    if (existingRespuesta) {
      throw new ValidationError('Ya respondiste esta pregunta');
    }

    // Determine if answer is correct
    const opcionesCorrectas = pregunta.opciones
      .filter(o => o.esCorrecta)
      .map(o => o.id);

    // Debug logging
    console.log('[Evaluacion] Validando respuesta:');
    console.log('  - Pregunta:', pregunta.texto);
    console.log('  - Tipo:', pregunta.tipo);
    console.log('  - Opciones en BD:', pregunta.opciones.map(o => ({ id: o.id, texto: o.texto, esCorrecta: o.esCorrecta })));
    console.log('  - Opciones correctas (IDs):', opcionesCorrectas);
    console.log('  - Opciones seleccionadas:', opcionesSeleccionadas);

    let esCorrecta = false;
    if (pregunta.tipo === 'SELECCION_MULTIPLE') {
      // All correct options must be selected and no incorrect ones
      esCorrecta = opcionesCorrectas.length === opcionesSeleccionadas.length &&
        opcionesCorrectas.every(id => opcionesSeleccionadas.includes(id));
    } else {
      // Single answer must match
      esCorrecta = opcionesSeleccionadas.length === 1 &&
        opcionesCorrectas.includes(opcionesSeleccionadas[0]);
    }

    console.log('  - Es correcta:', esCorrecta);

    // Calcular puntaje basado en tiempo (tipo Kahoot)
    // Puntaje máximo si responde correctamente
    // Bonus por velocidad: hasta 50% extra si responde en menos de 5 segundos
    let puntaje = 0;
    if (esCorrecta) {
      const puntajeBase = pregunta.evaluacion.puntajePorPregunta || 1;
      const tiempoLimite = (pregunta.tiempoSegundos || 30) * 1000; // En ms

      // Calcular bonus por velocidad (máximo 50% extra)
      let bonusVelocidad = 0;
      if (tiempoRespuestaMs && tiempoRespuestaMs < tiempoLimite) {
        // Mientras más rápido, más bonus (lineal inverso)
        const porcentajeTiempoUsado = tiempoRespuestaMs / tiempoLimite;
        bonusVelocidad = Math.round(puntajeBase * 0.5 * (1 - porcentajeTiempoUsado));
      }

      puntaje = puntajeBase + bonusVelocidad;
    }

    return prisma.respuestaEvaluacion.create({
      data: {
        sesionId,
        preguntaId,
        participanteId,
        nombreParticipante,
        opcionesSeleccionadas,
        esCorrecta,
        tiempoRespuestaMs,
        puntaje
      }
    });
  }

  async getResultadosSesion(sesionId) {
    const respuestas = await prisma.respuestaEvaluacion.findMany({
      where: { sesionId },
      include: {
        pregunta: {
          include: {
            evaluacion: { select: { tipo: true, nombre: true } },
            opciones: true
          }
        }
      },
      orderBy: [
        { pregunta: { evaluacion: { tipo: 'asc' } } },
        { nombreParticipante: 'asc' },
        { pregunta: { orden: 'asc' } }
      ]
    });

    // Group by participant
    const porParticipante = {};
    respuestas.forEach(r => {
      const key = r.participanteId || r.nombreParticipante;
      if (!porParticipante[key]) {
        porParticipante[key] = {
          participanteId: r.participanteId,
          nombreParticipante: r.nombreParticipante,
          preTest: { respuestas: [], correctas: 0, total: 0, puntaje: 0 },
          postTest: { respuestas: [], correctas: 0, total: 0, puntaje: 0 }
        };
      }

      const tipo = r.pregunta.evaluacion.tipo === 'PRE_TEST' ? 'preTest' : 'postTest';
      porParticipante[key][tipo].respuestas.push(r);
      porParticipante[key][tipo].total++;
      if (r.esCorrecta) {
        porParticipante[key][tipo].correctas++;
        porParticipante[key][tipo].puntaje += r.puntaje;
      }
    });

    // Calculate percentages
    Object.values(porParticipante).forEach(p => {
      p.preTest.porcentaje = p.preTest.total > 0
        ? Math.round((p.preTest.correctas / p.preTest.total) * 100)
        : 0;
      p.postTest.porcentaje = p.postTest.total > 0
        ? Math.round((p.postTest.correctas / p.postTest.total) * 100)
        : 0;
      p.mejora = p.postTest.porcentaje - p.preTest.porcentaje;
    });

    return {
      participantes: Object.values(porParticipante),
      totalRespuestas: respuestas.length
    };
  }

  async getComparativoPrePost(sesionId) {
    const resultados = await this.getResultadosSesion(sesionId);

    // Get all questions
    const sesion = await prisma.sesionCapacitacion.findUnique({
      where: { id: sesionId },
      include: {
        capacitacion: {
          include: {
            evaluaciones: {
              where: { activo: true },
              include: {
                preguntas: {
                  where: { activo: true },
                  orderBy: { orden: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    const evaluaciones = sesion?.capacitacion.evaluaciones || [];
    const preTest = evaluaciones.find(e => e.tipo === 'PRE_TEST');
    const postTest = evaluaciones.find(e => e.tipo === 'POST_TEST');

    // Calculate per-question stats
    const preguntasStats = {};

    for (const resp of resultados.participantes) {
      for (const r of resp.preTest.respuestas) {
        if (!preguntasStats[r.preguntaId]) {
          preguntasStats[r.preguntaId] = {
            preguntaId: r.preguntaId,
            texto: r.pregunta.texto,
            tipo: 'PRE_TEST',
            correctas: 0,
            total: 0
          };
        }
        preguntasStats[r.preguntaId].total++;
        if (r.esCorrecta) preguntasStats[r.preguntaId].correctas++;
      }

      for (const r of resp.postTest.respuestas) {
        if (!preguntasStats[r.preguntaId]) {
          preguntasStats[r.preguntaId] = {
            preguntaId: r.preguntaId,
            texto: r.pregunta.texto,
            tipo: 'POST_TEST',
            correctas: 0,
            total: 0
          };
        }
        preguntasStats[r.preguntaId].total++;
        if (r.esCorrecta) preguntasStats[r.preguntaId].correctas++;
      }
    }

    // Calculate percentages
    Object.values(preguntasStats).forEach(p => {
      p.porcentaje = p.total > 0 ? Math.round((p.correctas / p.total) * 100) : 0;
    });

    // Calculate overall stats
    const preTestStats = resultados.participantes.reduce(
      (acc, p) => ({
        correctas: acc.correctas + p.preTest.correctas,
        total: acc.total + p.preTest.total,
        puntaje: acc.puntaje + p.preTest.puntaje
      }),
      { correctas: 0, total: 0, puntaje: 0 }
    );

    const postTestStats = resultados.participantes.reduce(
      (acc, p) => ({
        correctas: acc.correctas + p.postTest.correctas,
        total: acc.total + p.postTest.total,
        puntaje: acc.puntaje + p.postTest.puntaje
      }),
      { correctas: 0, total: 0, puntaje: 0 }
    );

    preTestStats.porcentaje = preTestStats.total > 0
      ? Math.round((preTestStats.correctas / preTestStats.total) * 100)
      : 0;

    postTestStats.porcentaje = postTestStats.total > 0
      ? Math.round((postTestStats.correctas / postTestStats.total) * 100)
      : 0;

    const mejora = postTestStats.porcentaje - preTestStats.porcentaje;

    return {
      preTest: {
        ...preTestStats,
        nombre: preTest?.nombre || 'Pre-Test',
        totalPreguntas: preTest?.preguntas.length || 0
      },
      postTest: {
        ...postTestStats,
        nombre: postTest?.nombre || 'Post-Test',
        totalPreguntas: postTest?.preguntas.length || 0
      },
      mejora,
      porcentajeMejora: preTestStats.porcentaje > 0
        ? Math.round((mejora / preTestStats.porcentaje) * 100)
        : 0,
      preguntasStats: Object.values(preguntasStats),
      participantes: resultados.participantes.length
    };
  }

  async getRankingParticipantes(sesionId) {
    const resultados = await this.getResultadosSesion(sesionId);

    // Sort by total score (pre + post)
    const ranking = resultados.participantes
      .map(p => ({
        participanteId: p.participanteId,
        nombreParticipante: p.nombreParticipante,
        puntajeTotal: p.preTest.puntaje + p.postTest.puntaje,
        porcentajePreTest: p.preTest.porcentaje,
        porcentajePostTest: p.postTest.porcentaje,
        mejora: p.mejora
      }))
      .sort((a, b) => b.puntajeTotal - a.puntajeTotal);

    return ranking.map((p, index) => ({
      ...p,
      posicion: index + 1
    }));
  }
}

module.exports = new EvaluacionService();
