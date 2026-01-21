/**
 * OpenRouter Service - Integración con modelos de IA via OpenRouter
 * Usado para análisis de adherencia en capacitaciones
 */

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.defaultModel = 'google/gemini-2.0-flash-001';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Realiza una petición al API de OpenRouter
   */
  async chat(messages, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('OPENROUTER_API_KEY no configurada. Configure la variable de entorno.');
    }

    const model = options.model || this.defaultModel;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://clinicamia.com',
        'X-Title': 'Clínica MÍA - Sistema de Gestión'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage,
      model: data.model
    };
  }

  /**
   * Genera análisis de adherencia para una capacitación basándose en los resultados de evaluaciones
   * Retorna: análisis conciso (1 párrafo) + compromisos generados automáticamente
   */
  async generarAnalisisAdherencia(datosCapacitacion) {
    const {
      tema,
      actividad,
      categoria,
      orientadoA,
      duracionMinutos,
      resultadosEvaluaciones,
      asistentes,
      sesionFecha
    } = datosCapacitacion;

    // Preparar resumen de resultados
    const totalParticipantes = resultadosEvaluaciones?.length || 0;

    let promedioPreTest = 0;
    let promedioPostTest = 0;
    let participantesConPreTest = 0;
    let participantesConPostTest = 0;

    if (resultadosEvaluaciones && resultadosEvaluaciones.length > 0) {
      resultadosEvaluaciones.forEach(p => {
        if (p.preTest?.porcentaje !== null && p.preTest?.porcentaje !== undefined) {
          promedioPreTest += p.preTest.porcentaje;
          participantesConPreTest++;
        }
        if (p.postTest?.porcentaje !== null && p.postTest?.porcentaje !== undefined) {
          promedioPostTest += p.postTest.porcentaje;
          participantesConPostTest++;
        }
      });

      if (participantesConPreTest > 0) promedioPreTest = Math.round(promedioPreTest / participantesConPreTest);
      if (participantesConPostTest > 0) promedioPostTest = Math.round(promedioPostTest / participantesConPostTest);
    }

    const mejoraPorcentual = promedioPostTest - promedioPreTest;

    // Determinar nivel de adherencia
    let nivelAdherencia = 'Deficiente';
    if (promedioPostTest >= 90) nivelAdherencia = 'Excelente';
    else if (promedioPostTest >= 75) nivelAdherencia = 'Bueno';
    else if (promedioPostTest >= 60) nivelAdherencia = 'Aceptable';

    // Prompt para análisis conciso + compromisos
    const systemPrompt = `Eres un experto en gestión de calidad en instituciones de salud colombianas.
Debes generar un análisis de adherencia CONCISO y compromisos de mejora.

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "analisis": "Un párrafo conciso (máximo 4-5 oraciones) que resuma: nivel de adherencia, resultado principal, y conclusión.",
  "compromisos": [
    {
      "descripcion": "Descripción del compromiso",
      "encargado": "Área o rol responsable",
      "fechaEntrega": "Plazo sugerido (ej: '15 días', '1 mes')"
    }
  ]
}

Los compromisos deben ser:
- Específicos y medibles
- Relacionados con las áreas de mejora identificadas
- Entre 2 y 4 compromisos máximo
- Enfocados en mejorar la adherencia al tema capacitado`;

    const userPrompt = `Analiza estos resultados y genera el JSON:

CAPACITACIÓN: ${tema}
${actividad ? `Actividad: ${actividad}` : ''}
${orientadoA ? `Orientado a: ${orientadoA}` : ''}
Fecha: ${sesionFecha || 'No especificada'}

RESULTADOS:
- Participantes evaluados: ${totalParticipantes}
- Promedio Pre-Test: ${promedioPreTest}%
- Promedio Post-Test: ${promedioPostTest}%
- Mejora: ${mejoraPorcentual > 0 ? '+' : ''}${mejoraPorcentual}%
- Nivel de adherencia: ${nivelAdherencia}

${resultadosEvaluaciones?.length > 0 ? `Detalle: ${resultadosEvaluaciones.map(p =>
  `${p.nombre}: Pre ${p.preTest?.porcentaje ?? 'N/A'}% → Post ${p.postTest?.porcentaje ?? 'N/A'}%`
).join(', ')}` : ''}

Genera el análisis conciso (1 párrafo) y los compromisos de mejora en formato JSON.`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.3,
      maxTokens: 1000,
      jsonMode: true
    });

    // Parsear respuesta JSON
    let resultado;
    try {
      // Limpiar posibles caracteres extra
      const contenidoLimpio = response.content.trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      resultado = JSON.parse(contenidoLimpio);
    } catch (e) {
      console.error('Error parseando respuesta IA:', e.message);
      // Fallback si no se puede parsear
      resultado = {
        analisis: `La capacitación "${tema}" mostró un nivel de adherencia ${nivelAdherencia.toLowerCase()} con un promedio de ${promedioPostTest}% en el post-test. ${mejoraPorcentual > 0 ? `Se evidenció una mejora del ${mejoraPorcentual}% respecto al pre-test.` : ''} Se recomienda reforzar los conceptos con los participantes que obtuvieron resultados por debajo del 70%.`,
        compromisos: [
          {
            descripcion: `Realizar sesión de refuerzo sobre "${tema}" con participantes que obtuvieron menos del 70%`,
            encargado: 'Talento Humano',
            fechaEntrega: '15 días'
          },
          {
            descripcion: 'Implementar evaluación de seguimiento para verificar retención del conocimiento',
            encargado: 'Calidad',
            fechaEntrega: '1 mes'
          }
        ]
      };
    }

    return {
      analisis: resultado.analisis || '',
      compromisos: resultado.compromisos || [],
      metadatos: {
        modelo: response.model,
        tokensUsados: response.usage?.total_tokens || 0,
        fechaGeneracion: new Date().toISOString(),
        datosAnalizados: {
          totalParticipantes,
          promedioPreTest,
          promedioPostTest,
          mejoraPorcentual,
          nivelAdherencia
        }
      }
    };
  }
}

module.exports = new OpenRouterService();
