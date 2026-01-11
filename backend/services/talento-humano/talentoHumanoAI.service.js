/**
 * Servicio de IA para Talento Humano
 * Simula respuestas de IA para demostración.
 * En producción, conectar con OpenAI/Anthropic.
 */

class TalentoHumanoAIService {
  constructor() {
    this.configured = true;
  }

  isConfigured() {
    return this.configured;
  }

  /**
   * Analizar CV y comparar con vacante
   */
  async screenCV(cvText, vacante) {
    // Simulación de análisis
    await new Promise(resolve => setTimeout(resolve, 2000));

    const skillsEncontrados = ['React', 'Node.js', 'Trabajo en equipo', 'Liderazgo'];
    const matchScore = Math.floor(Math.random() * (95 - 70) + 70); // 70-95

    return {
      matchScore,
      analisis: `El candidato muestra un perfil sólido para el cargo de ${vacante.titulo}.`,
      skillsEncontrados,
      skillsFaltantes: ['GraphQL', 'AWS'],
      recomendacion: matchScore > 80 ? 'ALTAMENTE RECOMENDADO' : 'RECOMENDADO CON RESERVAS',
      preguntasSugeridas: [
        'Explique su experiencia liderando equipos ágiles.',
        '¿Cómo maneja la presión en entregas críticas?'
      ]
    };
  }

  /**
   * Generar preguntas de entrevista
   */
  async generateInterviewQuestions(candidato, vacante, tipoEntrevista) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const preguntas = [
      {
        pregunta: `Dado su perfil para ${vacante.titulo}, ¿cuál considera su mayor logro profesional?`,
        tipo: 'EXPERIENCIA',
        duracionEstimada: '5 min'
      },
      {
        pregunta: 'Describa una situación difícil con un compañero y cómo la resolvió.',
        tipo: 'COMPORTAMENTAL',
        duracionEstimada: '7 min'
      },
      {
        pregunta: '¿Qué le motiva a trabajar en nuestra clínica?',
        tipo: 'MOTIVACIONAL',
        duracionEstimada: '3 min'
      }
    ];

    if (tipoEntrevista === 'TECNICA') {
      preguntas.push({
        pregunta: 'Describa el protocolo de atención para un paciente con síntomas de X.',
        tipo: 'TECNICA',
        duracionEstimada: '10 min'
      });
    }

    return preguntas;
  }

  /**
   * Analizar desempeño de empleado
   */
  async analyzePerformance(empleado, evaluaciones, feedback, asistencia) {
    await new Promise(resolve => setTimeout(resolve, 2500));

    const promedioEvaluaciones = evaluaciones.reduce((acc, e) => acc + (e.scoreTotal || 0), 0) / (evaluaciones.length || 1);
    
    return {
      resumenEjecutivo: `${empleado.nombre} ha mostrado un desempeño ${promedioEvaluaciones > 4 ? 'sobresaliente' : 'constante'} en el último periodo.`,
      tendencias: {
        rendimiento: 'ASCENDENTE',
        asistencia: asistencia.tardanzas > 2 ? 'IRREGULAR' : 'EXCELENTE',
        participacion: 'ALTA'
      },
      puntosFuertes: ['Compromiso', 'Calidad técnica', 'Puntualidad'],
      areasMejora: ['Comunicación interdepartamental', 'Delegación de tareas'],
      riesgoBurnout: 'BAJO',
      potencialLiderazgo: 'ALTO'
    };
  }

  /**
   * Predecir rotación
   */
  async predictTurnover(empleados) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular análisis de riesgo para algunos empleados
    return empleados
      .map(emp => ({
        empleadoId: emp.id,
        nombre: `${emp.nombre} ${emp.apellido}`,
        riesgo: Math.random() > 0.7 ? 'ALTO' : (Math.random() > 0.4 ? 'MEDIO' : 'BAJO'),
        probabilidad: Math.floor(Math.random() * 100),
        factores: ['Tiempo sin ascenso', 'Salario vs Mercado', 'Distancia al trabajo'].slice(0, Math.floor(Math.random() * 3) + 1)
      }))
      .sort((a, b) => b.probabilidad - a.probabilidad)
      .slice(0, 5); // Top 5 riesgos
  }

  /**
   * Sugerir capacitación
   */
  async suggestTraining(empleado) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      empleadoId: empleado.id,
      recomendaciones: [
        {
          titulo: 'Liderazgo Situacional',
          razon: 'Para fortalecer habilidades de gestión de equipos detectadas en la evaluación.',
          prioridad: 'ALTA'
        },
        {
          titulo: 'Actualización en Normativa 2025',
          razon: 'Requisito anual para el cargo.',
          prioridad: 'MEDIA'
        }
      ]
    };
  }

  /**
   * Chat general
   */
  async chat(messages, context, userId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    let response = "Entiendo tu consulta. Como asistente de IA para RRHH, puedo ayudarte con información sobre empleados, nómina y normatividad.";

    if (lastMessage.includes('hola') || lastMessage.includes('buenos dias')) {
      response = "¡Hola! ¿En qué puedo ayudarte hoy con la gestión de talento humano?";
    } else if (lastMessage.includes('nomina') || lastMessage.includes('pago')) {
      response = "Para temas de nómina, recuerda que el corte es el día 25 de cada mes. Puedes consultar las colillas en la pestaña de Nómina.";
    } else if (lastMessage.includes('vacaciones')) {
      response = "Las vacaciones se solicitan con 15 días de anticipación. El empleado promedio tiene 15 días hábiles por año laborado.";
    } else if (lastMessage.includes('ley') || lastMessage.includes('norma')) {
      response = "Según la normativa colombiana vigente para 2025, debemos tener en cuenta los cambios en la reducción de jornada laboral y las nuevas disposiciones de seguridad social.";
    }

    return {
      message: response,
      timestamp: new Date()
    };
  }
}

module.exports = new TalentoHumanoAIService();
