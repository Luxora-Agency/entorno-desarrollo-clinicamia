/**
 * Rutas para el Asistente IA Médico
 * Endpoints para chat, sugerencias y análisis clínico
 */
const { Hono } = require('hono');
const { streamText } = require('hono/streaming');
const openaiService = require('../services/openai.service');
const correctorOrtografiaService = require('../services/correctorOrtografia.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const prisma = require('../db/prisma');

const aiAssistant = new Hono();

// Todas las rutas requieren autenticación
aiAssistant.use('*', authMiddleware);

/**
 * GET /ai-assistant/status - Verificar estado del servicio IA
 */
aiAssistant.get('/status', async (c) => {
  try {
    const isConfigured = openaiService.isConfigured();
    return c.json(success({
      configured: isConfigured,
      model: process.env.OPENAI_MODEL || 'gpt-5.2',
      features: [
        'chat',
        'diagnosis_suggestions',
        'drug_interactions',
        'vital_signs_analysis',
        'soap_generation',
        'spell_checker'
      ]
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /ai-assistant/corregir-ortografia - Corregir ortografía de texto médico
 */
aiAssistant.post('/corregir-ortografia', async (c) => {
  try {
    const body = await c.req.json();
    const { texto, contexto = 'medico' } = body;

    if (!texto) {
      return c.json(error('Se requiere el texto a corregir'), 400);
    }

    const resultado = await correctorOrtografiaService.corregirTexto(texto, contexto);

    return c.json(success(resultado));
  } catch (err) {
    console.error('Error en corrección ortográfica:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /ai-assistant/extract-document - Extraer datos de documentos médicos con OCR
 */
aiAssistant.post('/extract-document', async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64, extractionType = 'cancer_validation' } = body;

    if (!imageBase64) {
      return c.json(error('Se requiere la imagen en base64'), 400);
    }

    // Remover prefijo data:image si existe
    const base64Clean = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const extracted = await openaiService.extractMedicalDocumentData(base64Clean, extractionType);

    return c.json(success(extracted, 'Datos extraídos. Verifique antes de guardar.'));
  } catch (err) {
    console.error('Error extrayendo documento:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /ai-assistant/chat - Chat libre con el asistente
 */
aiAssistant.post('/chat', async (c) => {
  try {
    const body = await c.req.json();
    const { messages, context, conversationId } = body;
    const user = c.get('user');

    if (!messages || !Array.isArray(messages)) {
      return c.json(error('Se requiere un array de mensajes'), 400);
    }

    // Asegurar que el contexto tenga el ID del paciente para obtener historia completa
    const enrichedContext = {
      ...context,
      patient: context?.patient ? {
        ...context.patient,
        id: context.patient.id || context.pacienteId
      } : null
    };

    // Ejecutar chat con contexto enriquecido
    const result = await openaiService.chat(messages, enrichedContext);

    // Logging de la conversación (para auditoría)
    await prisma.aiConversationLog.create({
      data: {
        conversationId: conversationId || crypto.randomUUID(),
        userId: user.id,
        pacienteId: context?.patient?.id || null,
        citaId: context?.citaId || null,
        messageCount: messages.length,
        toolsUsed: result.toolsUsed || [],
        tokensUsed: result.usage?.total_tokens || 0,
        requestType: 'chat'
      }
    }).catch(err => console.error('Error logging AI conversation:', err));

    return c.json(success({
      response: result.content,
      toolsUsed: result.toolsUsed,
      usage: result.usage
    }));

  } catch (err) {
    console.error('Error en chat IA:', err);
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /ai-assistant/chat/stream - Chat con streaming
 */
aiAssistant.post('/chat/stream', async (c) => {
  try {
    const body = await c.req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return c.json(error('Se requiere un array de mensajes'), 400);
    }

    // Obtener stream de OpenAI
    const stream = await openaiService.chat(messages, context, true);

    // Configurar respuesta de streaming
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');

    return streamText(c, async (textStream) => {
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                await textStream.write('data: [DONE]\n\n');
                break;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  await textStream.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (e) {
                // Ignorar líneas que no son JSON válido
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    });

  } catch (err) {
    console.error('Error en streaming:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /ai-assistant/diagnosis-suggestions - Obtener sugerencias de diagnóstico
 */
aiAssistant.post('/diagnosis-suggestions', async (c) => {
  try {
    const body = await c.req.json();
    const { symptoms, vitals, history, patientContext } = body;
    const user = c.get('user');

    if (!symptoms) {
      return c.json(error('Se requieren síntomas para sugerencias de diagnóstico'), 400);
    }

    const context = {
      patient: patientContext,
      vitals,
      history
    };

    const result = await openaiService.getDiagnosisSuggestions(symptoms, context);

    // Log
    await prisma.aiConversationLog.create({
      data: {
        conversationId: crypto.randomUUID(),
        userId: user.id,
        pacienteId: patientContext?.id || null,
        tokensUsed: result.usage?.total_tokens || 0,
        toolsUsed: result.toolsUsed || [],
        requestType: 'diagnosis_suggestion'
      }
    }).catch(err => console.error('Error logging:', err));

    return c.json(success({
      suggestions: result.content,
      toolsUsed: result.toolsUsed
    }));

  } catch (err) {
    console.error('Error en sugerencias de diagnóstico:', err);
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /ai-assistant/check-prescription - Verificar seguridad de prescripción
 */
aiAssistant.post('/check-prescription', async (c) => {
  try {
    const body = await c.req.json();
    const { medications, currentMedications, allergies, age, weight } = body;
    const user = c.get('user');

    if (!medications || medications.length === 0) {
      return c.json(error('Se requieren medicamentos para verificar'), 400);
    }

    const patientContext = {
      currentMedications,
      allergies,
      age,
      weight
    };

    const result = await openaiService.checkPrescriptionSafety(medications, patientContext);

    // Log
    await prisma.aiConversationLog.create({
      data: {
        conversationId: crypto.randomUUID(),
        userId: user.id,
        tokensUsed: result.usage?.total_tokens || 0,
        toolsUsed: result.toolsUsed || [],
        requestType: 'prescription_check'
      }
    }).catch(err => console.error('Error logging:', err));

    return c.json(success({
      analysis: result.content,
      toolsUsed: result.toolsUsed
    }));

  } catch (err) {
    console.error('Error en verificación de prescripción:', err);
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /ai-assistant/analyze-vitals - Analizar signos vitales
 */
aiAssistant.post('/analyze-vitals', async (c) => {
  try {
    const body = await c.req.json();
    const { vitals, age } = body;

    if (!vitals) {
      return c.json(error('Se requieren signos vitales'), 400);
    }

    // Análisis directo sin llamada a OpenAI (más rápido)
    const analysis = await openaiService.executeToolCall('analyze_vital_signs', {
      temperature: vitals.temperatura,
      systolic_bp: vitals.presionSistolica,
      diastolic_bp: vitals.presionDiastolica,
      heart_rate: vitals.frecuenciaCardiaca,
      respiratory_rate: vitals.frecuenciaRespiratoria,
      oxygen_saturation: vitals.saturacionOxigeno,
      weight: vitals.peso,
      height: vitals.talla,
      age
    });

    return c.json(success(analysis));

  } catch (err) {
    console.error('Error en análisis de vitales:', err);
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /ai-assistant/generate-soap - Generar/mejorar nota SOAP
 */
aiAssistant.post('/generate-soap', async (c) => {
  try {
    const body = await c.req.json();
    const { chiefComplaint, symptoms, vitals, physicalExam, history, currentSoap, patientContext } = body;
    const user = c.get('user');

    if (!chiefComplaint) {
      return c.json(error('Se requiere el motivo de consulta'), 400);
    }

    const messages = [
      {
        role: 'user',
        content: `Ayúdame a ${currentSoap ? 'mejorar' : 'generar'} una nota SOAP para esta consulta:

Motivo de consulta: ${chiefComplaint}
${symptoms ? `Síntomas: ${symptoms}` : ''}
${vitals ? `Signos vitales: ${JSON.stringify(vitals)}` : ''}
${physicalExam ? `Examen físico: ${physicalExam}` : ''}
${history ? `Antecedentes relevantes: ${history}` : ''}
${currentSoap ? `\nNota SOAP actual a mejorar:\nS: ${currentSoap.subjetivo}\nO: ${currentSoap.objetivo}\nA: ${currentSoap.analisis}\nP: ${currentSoap.plan}` : ''}

Genera una nota SOAP completa y profesional. Responde en formato JSON con las claves: subjetivo, objetivo, analisis, plan.`
      }
    ];

    const result = await openaiService.chat(messages, { patient: patientContext, vitals });

    // Intentar parsear la respuesta como JSON
    let soapNote;
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        soapNote = JSON.parse(jsonMatch[0]);
      } else {
        soapNote = { raw: result.content };
      }
    } catch (e) {
      soapNote = { raw: result.content };
    }

    // Log
    await prisma.aiConversationLog.create({
      data: {
        conversationId: crypto.randomUUID(),
        userId: user.id,
        pacienteId: patientContext?.id || null,
        tokensUsed: result.usage?.total_tokens || 0,
        toolsUsed: result.toolsUsed || [],
        requestType: 'soap_generation'
      }
    }).catch(err => console.error('Error logging:', err));

    return c.json(success({
      soap: soapNote,
      raw: result.content
    }));

  } catch (err) {
    console.error('Error en generación SOAP:', err);
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /ai-assistant/consultation-summary - Generar resumen de consulta
 */
aiAssistant.post('/consultation-summary', async (c) => {
  try {
    const body = await c.req.json();
    const { consultationData } = body;
    const user = c.get('user');

    if (!consultationData) {
      return c.json(error('Se requieren datos de la consulta'), 400);
    }

    const result = await openaiService.generateConsultationSummary(consultationData);

    // Log
    await prisma.aiConversationLog.create({
      data: {
        conversationId: crypto.randomUUID(),
        userId: user.id,
        pacienteId: consultationData.paciente?.id || null,
        citaId: consultationData.citaId || null,
        tokensUsed: result.usage?.total_tokens || 0,
        toolsUsed: result.toolsUsed || [],
        requestType: 'consultation_summary'
      }
    }).catch(err => console.error('Error logging:', err));

    return c.json(success({
      summary: result.content
    }));

  } catch (err) {
    console.error('Error en resumen de consulta:', err);
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * GET /ai-assistant/patient-context/:pacienteId - Obtener resumen de contexto clínico
 */
aiAssistant.get('/patient-context/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const aiContextService = require('../services/aiContext.service');

    const context = await aiContextService.getCompletePatientContext(pacienteId);

    if (!context) {
      return c.json(error('Paciente no encontrado'), 404);
    }

    // Retornar resumen importante para el frontend
    return c.json(success({
      paciente: context.paciente,
      resumenClinico: context.resumenClinico,
      alertas: {
        alergias: context.antecedentes.alergicos.map(a => ({
          sustancia: a.sustancia,
          severidad: a.severidad,
          tipo: a.tipoAlergia
        })),
        patologiasCronicas: context.antecedentes.patologicos.filter(p => p.enTratamiento).map(p => ({
          enfermedad: p.enfermedad,
          codigo: p.codigoCIE10
        })),
        medicamentosActuales: context.medicamentosActuales.length,
        alertasActivas: context.alertasActivas
      },
      ultimaConsulta: context.evolucionesPrevias.length > 0 ? {
        fecha: context.evolucionesPrevias[0].fecha,
        diagnostico: context.evolucionesPrevias[0].diagnosticos[0]?.descripcion,
        motivo: context.evolucionesPrevias[0].motivoConsulta
      } : null,
      hospitalizacionesRecientes: context.hospitalizaciones.length,
      urgenciasRecientes: context.urgencias.length
    }));

  } catch (err) {
    console.error('Error obteniendo contexto:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /ai-assistant/history/:pacienteId - Obtener historial de interacciones IA
 */
aiAssistant.get('/history/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();

    const history = await prisma.aiConversationLog.findMany({
      where: { pacienteId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        requestType: true,
        toolsUsed: true,
        tokensUsed: true,
        createdAt: true
      }
    });

    return c.json(success(history));

  } catch (err) {
    console.error('Error obteniendo historial:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /ai-assistant/usage-stats - Estadísticas de uso (admin)
 */
aiAssistant.get('/usage-stats', async (c) => {
  try {
    const user = c.get('user');

    // Solo admins pueden ver estadísticas globales
    const isAdmin = user.rol === 'SUPER_ADMIN' || user.rol === 'ADMIN';

    const where = isAdmin ? {} : { userId: user.id };

    const stats = await prisma.aiConversationLog.groupBy({
      by: ['requestType'],
      where,
      _count: { id: true },
      _sum: { tokensUsed: true }
    });

    const totalTokens = await prisma.aiConversationLog.aggregate({
      where,
      _sum: { tokensUsed: true },
      _count: { id: true }
    });

    // Calcular costo estimado (GPT-5.2: $1.75/1M input, $14/1M output, promedio ~$4/1M)
    const estimatedCost = (totalTokens._sum.tokensUsed || 0) * 0.000004;

    return c.json(success({
      byType: stats.map(s => ({
        type: s.requestType,
        count: s._count.id,
        tokens: s._sum.tokensUsed
      })),
      total: {
        requests: totalTokens._count.id,
        tokens: totalTokens._sum.tokensUsed,
        estimatedCost: `$${estimatedCost.toFixed(2)}`
      }
    }));

  } catch (err) {
    console.error('Error en estadísticas:', err);
    return c.json(error(err.message), 500);
  }
});

module.exports = aiAssistant;
