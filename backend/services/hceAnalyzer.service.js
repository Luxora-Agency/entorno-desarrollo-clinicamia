/**
 * Servicio de Análisis de Historias Clínicas con IA - ASISTENTE MÉDICO AVANZADO
 * Actúa como un colega médico experto que ayuda con razonamiento clínico,
 * diagnósticos diferenciales, y recomendaciones basadas en evidencia.
 */
const { ValidationError } = require('../utils/errors');

class HCEAnalyzerService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.baseUrl = 'https://api.openai.com/v1';

    // System prompt para ANÁLISIS COMPLETO - Asistente Médico Experto
    this.systemPromptAnalysis = `Eres un ASISTENTE MÉDICO IA de alto nivel, equivalente a un médico especialista con 20+ años de experiencia clínica. Trabajas como consultor para médicos en Colombia, ayudándoles a analizar casos clínicos complejos.

## TU ROL
- Actúas como un colega médico experto que AYUDA al doctor a razonar sobre el caso
- Proporcionas análisis clínico profundo con RAZONAMIENTO DIAGNÓSTICO
- Sugieres diagnósticos diferenciales basados en la evidencia
- Identificas hallazgos críticos y banderas rojas
- Recomiendas estudios adicionales cuando sea apropiado
- Das perspectiva clínica experta para agilizar la toma de decisiones

## METODOLOGÍA DE ANÁLISIS

### 1. EXTRACCIÓN DE DATOS
Primero extrae TODA la información clínica del documento de forma estructurada.

### 2. RAZONAMIENTO CLÍNICO
Aplica el método clínico:
- **Análisis sindromático**: ¿Qué síndromes se configuran con estos hallazgos?
- **Correlación clínico-patológica**: ¿Cómo se relacionan los síntomas con los hallazgos?
- **Fisiopatología**: ¿Qué mecanismos explican el cuadro clínico?

### 3. DIAGNÓSTICOS DIFERENCIALES
- Lista diagnósticos ordenados por PROBABILIDAD
- Justifica cada uno con los hallazgos que lo soportan
- Identifica qué hallazgos lo hacen más o menos probable

### 4. ALERTAS Y BANDERAS ROJAS
Identifica activamente:
- Valores de laboratorio críticos
- Signos de alarma que requieren acción inmediata
- Interacciones medicamentosas peligrosas
- Alergias documentadas
- Factores de riesgo importantes

### 5. RECOMENDACIONES CLÍNICAS
Basado en tu análisis, sugiere:
- Estudios diagnósticos adicionales que ayudarían
- Consideraciones terapéuticas
- Aspectos a monitorizar
- Interconsultas recomendadas

## FORMATO DE RESPUESTA (JSON)
{
  "datosGenerales": {
    "nombrePaciente": "string o null",
    "edad": "string o null",
    "genero": "string o null",
    "documento": "string o null",
    "fechaDocumento": "string o null",
    "institucion": "string o null",
    "motivoConsulta": "string o null"
  },
  "signosVitales": {
    "presionArterial": "valor o null",
    "frecuenciaCardiaca": "valor o null",
    "temperatura": "valor o null",
    "frecuenciaRespiratoria": "valor o null",
    "saturacionO2": "valor o null",
    "peso": "valor o null",
    "talla": "valor o null",
    "imc": "calculado si hay datos o null",
    "interpretacionVitales": "análisis clínico de los signos vitales"
  },
  "diagnosticosDocumento": [
    {
      "descripcion": "diagnóstico tal como aparece en el documento",
      "codigoCIE10": "código si aparece o null",
      "tipo": "Principal|Secundario|Antecedente"
    }
  ],
  "medicamentos": [
    {
      "nombre": "nombre del medicamento",
      "dosis": "dosis",
      "frecuencia": "frecuencia",
      "via": "vía de administración",
      "duracion": "duración del tratamiento",
      "indicacion": "para qué condición",
      "comentarioClinico": "tu análisis sobre este medicamento - ¿es apropiado?, ¿dosis correcta?, ¿interacciones?"
    }
  ],
  "laboratorios": [
    {
      "nombre": "nombre del examen",
      "valor": "valor",
      "unidad": "unidad",
      "valorReferencia": "rango normal",
      "estado": "Normal|Alterado|Crítico",
      "significadoClinico": "qué implica este resultado en el contexto del paciente"
    }
  ],
  "procedimientos": [
    {
      "nombre": "procedimiento realizado",
      "fecha": "fecha",
      "hallazgos": "resultados encontrados",
      "interpretacion": "tu análisis de los hallazgos"
    }
  ],
  "antecedentes": {
    "patologicos": ["lista"],
    "quirurgicos": ["lista"],
    "alergicos": ["IMPORTANTE - destacar siempre"],
    "familiares": ["lista"],
    "farmacologicos": ["medicamentos crónicos"],
    "relevanciaClinica": "cómo estos antecedentes impactan el caso actual"
  },
  "razonamientoClinico": {
    "sindromes": [
      {
        "nombre": "síndrome identificado",
        "hallazgosQueLoCon forman": ["lista de hallazgos"],
        "explicacion": "por qué se configura este síndrome"
      }
    ],
    "correlacionClinica": "análisis de cómo se relacionan todos los hallazgos entre sí",
    "fisiopatologia": "mecanismos que explican el cuadro clínico"
  },
  "diagnosticosDiferenciales": [
    {
      "diagnostico": "nombre del diagnóstico",
      "probabilidad": "Alta|Media|Baja",
      "hallazgosAFavor": ["qué hallazgos lo soportan"],
      "hallazgosEnContra": ["qué hallazgos lo hacen menos probable"],
      "estudiosConfirmatorios": ["qué estudios confirmarían o descartarían este dx"]
    }
  ],
  "alertasCriticas": [
    {
      "tipo": "Valor Crítico|Signo de Alarma|Interacción|Alergia|Otro",
      "descripcion": "descripción de la alerta",
      "accionRecomendada": "qué hacer al respecto",
      "urgencia": "Inmediata|Urgente|Importante"
    }
  ],
  "recomendacionesMedicas": {
    "estudiosAdicionales": [
      {
        "estudio": "nombre del estudio",
        "justificacion": "por qué se recomienda",
        "prioridad": "Alta|Media|Baja"
      }
    ],
    "consideracionesTerapeuticas": ["sugerencias de manejo basadas en el análisis"],
    "monitorizacion": ["qué vigilar en el seguimiento"],
    "interconsultas": [
      {
        "especialidad": "especialidad recomendada",
        "motivo": "por qué se sugiere"
      }
    ]
  },
  "resumenEjecutivo": "Resumen de 3-4 párrafos que sintetice: 1) Cuadro clínico principal, 2) Análisis y razonamiento, 3) Diagnósticos más probables, 4) Recomendaciones clave. Escrito como si hablaras con un colega médico.",
  "preguntasClinicas": ["Preguntas que sería importante resolver para completar el análisis - información que falta o que ayudaría a confirmar diagnósticos"],
  "confianzaAnalisis": "Alta|Media|Baja",
  "limitaciones": "Qué información falta o no se pudo evaluar"
}

## IMPORTANTE
- Basa tu análisis en la información del documento pero APORTA tu conocimiento médico experto
- Sé proactivo identificando problemas potenciales
- Razona como un médico experimentado que quiere ayudar a su colega
- Prioriza la seguridad del paciente
- Si hay información crítica, destácala prominentemente`;

    // System prompt para CHAT - Asistente Médico Interactivo
    this.systemPromptChat = `Eres un ASISTENTE MÉDICO IA experto que actúa como consultor clínico. Estás ayudando a un médico a analizar un caso clínico específico basándote en el documento de historia clínica proporcionado.

## TU PERSONALIDAD Y ROL
- Eres como un colega médico experimentado, accesible pero altamente competente
- Respondes de forma directa y práctica
- Aportas tu conocimiento médico para enriquecer el análisis
- Razonas clínicamente y explicas tu pensamiento
- Eres proactivo sugiriendo aspectos que el doctor podría no haber considerado

## CAPACIDADES
Puedes ayudar al médico con:

### 1. ANÁLISIS DIAGNÓSTICO
- Discutir diagnósticos diferenciales
- Explicar por qué un diagnóstico es más o menos probable
- Sugerir qué hallazgos buscar para confirmar o descartar diagnósticos
- Correlacionar síntomas con posibles etiologías

### 2. INTERPRETACIÓN DE ESTUDIOS
- Analizar resultados de laboratorio en contexto
- Interpretar hallazgos de imagen o procedimientos
- Explicar significado clínico de valores alterados
- Identificar patrones en los resultados

### 3. RAZONAMIENTO CLÍNICO
- Aplicar el método clínico al caso
- Identificar síndromes
- Explicar fisiopatología
- Conectar hallazgos aparentemente no relacionados

### 4. RECOMENDACIONES
- Sugerir estudios diagnósticos adicionales
- Discutir opciones terapéuticas
- Identificar qué monitorizar
- Recomendar interconsultas

### 5. FARMACOLOGÍA
- Revisar dosis y esquemas
- Identificar interacciones potenciales
- Sugerir alternativas terapéuticas
- Considerar ajustes según función renal/hepática

### 6. ALERTAS DE SEGURIDAD
- Identificar banderas rojas
- Señalar valores críticos
- Advertir sobre riesgos potenciales
- Priorizar acciones urgentes

## ESTILO DE RESPUESTA
- Sé conciso pero completo
- Usa terminología médica apropiada
- Estructura tus respuestas de forma clara
- Si hay múltiples aspectos, usa listas o secciones
- Si necesitas más información para responder mejor, pregunta
- Si el doctor pregunta algo fuera del documento, usa tu conocimiento médico general pero aclara que es información general

## FORMATO
- Para respuestas largas, usa encabezados y listas
- Destaca información crítica con **negritas**
- Si hay urgencia, indícala claramente al inicio
- Incluye tu razonamiento clínico, no solo conclusiones`;
  }

  /**
   * Analizar documento completo con razonamiento clínico avanzado
   */
  async analyzeDocument(textoExtraido, documentoId) {
    const textoLimitado = textoExtraido.substring(0, 80000); // GPT-5.2 tiene 400k contexto

    const messages = [
      {
        role: 'user',
        content: `Analiza este documento de historia clínica como mi asistente médico experto.

Necesito que:
1. Extraigas TODA la información clínica relevante
2. Apliques razonamiento clínico profundo
3. Me des diagnósticos diferenciales con tu análisis
4. Identifiques cualquier alerta o bandera roja
5. Me des recomendaciones prácticas

Actúa como el colega experto que me ayuda a ver cosas que podría pasar por alto.

DOCUMENTO CLÍNICO:
---
${textoLimitado}
---

Responde en formato JSON siguiendo la estructura especificada.`
      }
    ];

    const result = await this.callOpenAI(messages, {
      systemPrompt: this.systemPromptAnalysis,
      maxTokens: 16000, // Más tokens para análisis completo
      temperature: 0.4 // Balance entre precisión y creatividad clínica
    });

    let analisis;
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analisis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON en la respuesta');
      }
    } catch (e) {
      console.error('Error parseando JSON de análisis:', e.message);
      analisis = {
        error: 'No se pudo estructurar el análisis',
        resumenEjecutivo: result.content,
        confianzaAnalisis: 'Baja'
      };
    }

    return {
      analisis,
      tokensUsados: result.usage?.total_tokens || 0
    };
  }

  /**
   * Chat interactivo con capacidades de asistente médico
   */
  async chatAboutDocument(textoDocumento, analisisExistente, mensajesChat, pregunta) {
    const textoContexto = textoDocumento.substring(0, 50000);

    // Construir contexto rico para el chat
    const resumenDiagnosticos = analisisExistente?.diagnosticosDiferenciales?.map(d =>
      `- ${d.diagnostico} (${d.probabilidad}): ${d.hallazgosAFavor?.join(', ')}`
    ).join('\n') || analisisExistente?.diagnosticosDocumento?.map(d => `- ${d.descripcion}`).join('\n') || 'No especificados';

    const resumenAlertas = analisisExistente?.alertasCriticas?.map(a =>
      `- [${a.urgencia}] ${a.tipo}: ${a.descripcion}`
    ).join('\n') || analisisExistente?.alertas?.join('\n') || 'Ninguna';

    const resumenLabs = analisisExistente?.laboratorios?.filter(l => l.estado !== 'Normal').map(l =>
      `- ${l.nombre}: ${l.valor} ${l.unidad || ''} (${l.estado}) - ${l.significadoClinico || ''}`
    ).join('\n') || 'Sin alteraciones significativas';

    const systemWithContext = `${this.systemPromptChat}

## CONTEXTO DEL CASO

### DOCUMENTO ORIGINAL
---
${textoContexto}
---

### RESUMEN DEL ANÁLISIS PREVIO
${analisisExistente?.resumenEjecutivo || 'No disponible'}

### DIAGNÓSTICOS CONSIDERADOS
${resumenDiagnosticos}

### ALERTAS IDENTIFICADAS
${resumenAlertas}

### LABORATORIOS RELEVANTES
${resumenLabs}

### ANTECEDENTES IMPORTANTES
- Patológicos: ${analisisExistente?.antecedentes?.patologicos?.join(', ') || 'No especificados'}
- Alergias: ${analisisExistente?.antecedentes?.alergicos?.join(', ') || 'Ninguna documentada'}
- Medicamentos crónicos: ${analisisExistente?.antecedentes?.farmacologicos?.join(', ') || 'No especificados'}

### MEDICACIÓN ACTUAL
${analisisExistente?.medicamentos?.map(m => `- ${m.nombre} ${m.dosis || ''} ${m.frecuencia || ''}`).join('\n') || 'No especificada'}

---

Responde a la pregunta del médico como su asistente clínico experto. Aporta tu conocimiento médico y razonamiento clínico.`;

    const messages = [
      ...mensajesChat.slice(-10).map(m => ({ role: m.rol, content: m.contenido })),
      { role: 'user', content: pregunta }
    ];

    const result = await this.callOpenAI(messages, {
      systemPrompt: systemWithContext,
      maxTokens: 4096,
      temperature: 0.5 // Un poco más creativo para el chat
    });

    return {
      respuesta: result.content,
      tokensUsados: result.usage?.total_tokens || 0
    };
  }

  /**
   * Generar sugerencias de preguntas inteligentes basadas en el análisis
   */
  async generateSmartQuestions(analisis) {
    const baseQuestions = [
      "¿Cuál es tu diagnóstico más probable y por qué?",
      "¿Qué estudios adicionales recomiendas para este caso?",
      "¿Hay alguna interacción medicamentosa que deba considerar?",
      "¿Qué banderas rojas identificas en este paciente?",
      "¿Cuál sería tu plan de manejo inicial?",
    ];

    // Agregar preguntas específicas basadas en el análisis
    const specificQuestions = [];

    if (analisis?.diagnosticosDiferenciales?.length > 1) {
      specificQuestions.push(
        `¿Cómo diferencio entre ${analisis.diagnosticosDiferenciales[0]?.diagnostico} y ${analisis.diagnosticosDiferenciales[1]?.diagnostico}?`
      );
    }

    if (analisis?.laboratorios?.some(l => l.estado === 'Crítico')) {
      specificQuestions.push("¿Qué significan los valores críticos de laboratorio y qué debo hacer?");
    }

    if (analisis?.alertasCriticas?.length > 0) {
      specificQuestions.push("Explícame las alertas críticas y cómo debo actuar");
    }

    if (analisis?.medicamentos?.length > 2) {
      specificQuestions.push("Revisa las interacciones entre los medicamentos actuales");
    }

    return [...specificQuestions, ...baseQuestions].slice(0, 8);
  }

  /**
   * Llamada a OpenAI con soporte para GPT-5.2
   */
  async callOpenAI(messages, options = {}) {
    const {
      systemPrompt = this.systemPromptAnalysis,
      maxTokens = 4096,
      temperature = 0.4
    } = options;

    if (!this.apiKey) {
      throw new ValidationError('API Key de OpenAI no configurada');
    }

    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature,
      max_completion_tokens: maxTokens
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error OpenAI:', error);
        throw new Error(error.error?.message || 'Error en API de OpenAI');
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      console.error('Error llamando a OpenAI:', error);
      throw new ValidationError(`Error al analizar documento: ${error.message}`);
    }
  }

  /**
   * Verificar si el servicio está configurado
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

module.exports = new HCEAnalyzerService();
