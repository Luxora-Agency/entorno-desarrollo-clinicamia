/**
 * OpenAI Service - Asistente IA Médico
 * Utiliza GPT-5.2 para asistencia médica durante consultas
 */
const { ValidationError } = require('../utils/errors');
const aiContextService = require('./aiContext.service');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-5.2';
    this.baseUrl = 'https://api.openai.com/v1';

    // System prompt para contexto médico
    this.systemPrompt = `Eres un asistente médico IA altamente capacitado que ayuda a doctores durante consultas médicas en Clínica Mía, una institución de salud en Colombia.

Tu rol es:
1. **Sugerir diagnósticos CIE-10** basados en síntomas, signos vitales e HISTORIA CLÍNICA COMPLETA del paciente
2. **Alertar sobre interacciones medicamentosas** y contraindicaciones con alergias del paciente
3. **Identificar banderas rojas** en signos vitales o síntomas, considerando antecedentes
4. **Correlacionar síntomas actuales** con diagnósticos previos y tratamientos anteriores
5. **Ayudar a redactar notas SOAP** profesionales y completas, coherentes con la historia
6. **Responder preguntas clínicas** con información basada en evidencia
7. **Sugerir exámenes de seguimiento** basados en patologías crónicas del paciente

Directrices importantes:
- SIEMPRE revisa la historia clínica completa antes de hacer sugerencias
- Verifica TODAS las alergias antes de sugerir medicamentos
- Considera los medicamentos actuales para evitar interacciones
- Correlaciona síntomas actuales con antecedentes patológicos
- Usa terminología médica apropiada
- Cita códigos CIE-10 cuando sugieras diagnósticos
- Indica nivel de urgencia (🔴 Alta, 🟡 Media, 🟢 Baja)
- Recuerda que el médico toma las decisiones finales - tú solo asistes
- Responde en español
- Sé conciso pero completo
- Considera el contexto colombiano (normatividad, medicamentos disponibles)
- Si detectas inconsistencias con tratamientos previos, alerta al médico

Formato de respuestas:
- Usa viñetas y estructura clara
- Incluye justificación basada en la historia clínica
- Ordena por probabilidad o relevancia
- Menciona explícitamente si algo contraindica con antecedentes o alergias`;
  }

  /**
   * Verificar que el servicio esté configurado
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Obtener headers de autenticación
   */
  getHeaders() {
    if (!this.apiKey) {
      throw new ValidationError('OPENAI_API_KEY no configurada');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Definiciones de herramientas (function calling) para el asistente
   */
  getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'get_patient_full_history',
          description: 'Obtener la historia clínica COMPLETA del paciente incluyendo antecedentes, consultas previas, medicamentos, hospitalizaciones y resultados de laboratorio. Usar SIEMPRE antes de hacer sugerencias clínicas.',
          parameters: {
            type: 'object',
            properties: {
              patient_id: {
                type: 'string',
                description: 'ID del paciente'
              }
            },
            required: ['patient_id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_patient_allergies',
          description: 'Obtener TODAS las alergias conocidas del paciente con su severidad. OBLIGATORIO consultar antes de sugerir medicamentos.',
          parameters: {
            type: 'object',
            properties: {
              patient_id: {
                type: 'string',
                description: 'ID del paciente'
              }
            },
            required: ['patient_id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_current_medications',
          description: 'Obtener todos los medicamentos que el paciente está tomando actualmente (prescripciones activas + antecedentes farmacológicos).',
          parameters: {
            type: 'object',
            properties: {
              patient_id: {
                type: 'string',
                description: 'ID del paciente'
              }
            },
            required: ['patient_id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_previous_diagnoses',
          description: 'Obtener historial de diagnósticos previos del paciente para correlacionar con síntomas actuales.',
          parameters: {
            type: 'object',
            properties: {
              patient_id: {
                type: 'string',
                description: 'ID del paciente'
              }
            },
            required: ['patient_id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_vitals_trend',
          description: 'Obtener tendencias de signos vitales del paciente (últimas mediciones y cambios).',
          parameters: {
            type: 'object',
            properties: {
              patient_id: {
                type: 'string',
                description: 'ID del paciente'
              },
              limit: {
                type: 'integer',
                description: 'Número de registros a obtener (default: 10)',
                default: 10
              }
            },
            required: ['patient_id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_cie10',
          description: 'Buscar códigos CIE-10 por descripción o síntomas. Usar cuando se necesite sugerir diagnósticos.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Término de búsqueda (síntoma, condición o código parcial)'
              },
              limit: {
                type: 'integer',
                description: 'Número máximo de resultados (default: 5)',
                default: 5
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'check_drug_interactions',
          description: 'Verificar interacciones entre medicamentos y con alergias del paciente',
          parameters: {
            type: 'object',
            properties: {
              medications: {
                type: 'array',
                items: { type: 'string' },
                description: 'Lista de medicamentos a verificar'
              },
              allergies: {
                type: 'array',
                items: { type: 'string' },
                description: 'Alergias conocidas del paciente'
              },
              current_medications: {
                type: 'array',
                items: { type: 'string' },
                description: 'Medicamentos que el paciente toma actualmente'
              }
            },
            required: ['medications']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'analyze_vital_signs',
          description: 'Analizar signos vitales y detectar valores anormales o banderas rojas',
          parameters: {
            type: 'object',
            properties: {
              temperature: { type: 'number', description: 'Temperatura en °C' },
              systolic_bp: { type: 'integer', description: 'Presión sistólica mmHg' },
              diastolic_bp: { type: 'integer', description: 'Presión diastólica mmHg' },
              heart_rate: { type: 'integer', description: 'Frecuencia cardíaca lpm' },
              respiratory_rate: { type: 'integer', description: 'Frecuencia respiratoria rpm' },
              oxygen_saturation: { type: 'integer', description: 'Saturación O2 %' },
              weight: { type: 'number', description: 'Peso en kg' },
              height: { type: 'number', description: 'Altura en cm' },
              age: { type: 'integer', description: 'Edad del paciente' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_soap_note',
          description: 'Generar o mejorar nota SOAP basada en la información de la consulta',
          parameters: {
            type: 'object',
            properties: {
              chief_complaint: { type: 'string', description: 'Motivo de consulta' },
              symptoms: { type: 'string', description: 'Síntomas reportados por el paciente' },
              vital_signs: { type: 'object', description: 'Signos vitales' },
              physical_exam: { type: 'string', description: 'Hallazgos del examen físico' },
              medical_history: { type: 'string', description: 'Antecedentes relevantes' },
              current_soap: { type: 'object', description: 'Nota SOAP actual para mejorar' }
            },
            required: ['chief_complaint']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'suggest_treatment',
          description: 'Sugerir plan de tratamiento basado en diagnóstico',
          parameters: {
            type: 'object',
            properties: {
              diagnosis: { type: 'string', description: 'Diagnóstico principal' },
              cie10_code: { type: 'string', description: 'Código CIE-10' },
              patient_age: { type: 'integer', description: 'Edad del paciente' },
              patient_weight: { type: 'number', description: 'Peso en kg' },
              allergies: { type: 'array', items: { type: 'string' }, description: 'Alergias' },
              contraindications: { type: 'array', items: { type: 'string' }, description: 'Contraindicaciones' }
            },
            required: ['diagnosis']
          }
        }
      }
    ];
  }

  /**
   * Ejecutar herramienta localmente
   */
  async executeToolCall(toolName, args, context = {}) {
    const prisma = require('../db/prisma');

    switch (toolName) {
      case 'get_patient_full_history': {
        // Obtener historia clínica completa usando el servicio de contexto
        try {
          const fullContext = await aiContextService.getCompletePatientContext(args.patient_id);
          if (!fullContext) {
            return { error: 'Paciente no encontrado', patient_id: args.patient_id };
          }
          return {
            paciente: fullContext.paciente,
            antecedentes: fullContext.antecedentes,
            resumenClinico: fullContext.resumenClinico,
            consultasPrevias: fullContext.evolucionesPrevias.slice(0, 5),
            hospitalizaciones: fullContext.hospitalizaciones,
            urgencias: fullContext.urgencias,
            alertasActivas: fullContext.alertasActivas
          };
        } catch (error) {
          return { error: error.message };
        }
      }

      case 'get_patient_allergies': {
        // Obtener alergias del paciente
        const alergias = await prisma.antecedenteAlergico.findMany({
          where: { pacienteId: args.patient_id }
        });

        if (alergias.length === 0) {
          return {
            message: 'No hay alergias registradas para este paciente',
            alergias: [],
            advertencia: 'Verificar con el paciente si tiene alergias no registradas'
          };
        }

        return {
          alergias: alergias.map(a => ({
            sustancia: a.sustancia,
            tipo: a.tipoAlergia,
            severidad: a.severidad,
            reaccion: a.reaccion
          })),
          alertas: alergias.filter(a => a.severidad === 'Severa').map(a =>
            `⚠️ ALERGIA SEVERA: ${a.sustancia} - ${a.reaccion || 'Reacción grave'}`
          )
        };
      }

      case 'get_current_medications': {
        // Obtener medicamentos actuales (prescripciones activas + antecedentes farmacológicos)
        const [prescripciones, antecedentes] = await Promise.all([
          prisma.prescripcion.findMany({
            where: { pacienteId: args.patient_id, estado: 'Activa' },
            include: {
              medicamentos: {
                include: {
                  producto: { select: { nombre: true, principioActivo: true } }
                }
              }
            }
          }),
          prisma.antecedenteFarmacologico.findMany({
            where: { pacienteId: args.patient_id, activo: true }
          })
        ]);

        const medicamentos = [
          ...prescripciones.flatMap(p => p.medicamentos.map(m => ({
            medicamento: m.producto?.nombre || 'Sin nombre',
            principioActivo: m.producto?.principioActivo,
            dosis: m.dosis,
            frecuencia: m.frecuencia,
            via: m.via,
            fechaInicio: p.fechaInicio,
            fuente: 'prescripcion_activa'
          }))),
          ...antecedentes.map(a => ({
            medicamento: a.medicamento,
            dosis: a.dosis,
            frecuencia: a.frecuencia,
            fuente: 'antecedente_farmacologico'
          }))
        ];

        return {
          medicamentosActuales: medicamentos,
          total: medicamentos.length,
          nota: medicamentos.length > 0 ?
            'Verificar interacciones antes de prescribir nuevos medicamentos' :
            'No hay medicamentos activos registrados'
        };
      }

      case 'get_previous_diagnoses': {
        // Obtener diagnósticos previos
        const [diagnosticosEvo, antecedentesPatologicos] = await Promise.all([
          prisma.diagnostico.findMany({
            where: {
              evolucion: { pacienteId: args.patient_id }
            },
            include: {
              evolucion: { select: { fecha: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
          }),
          prisma.antecedentePatologico.findMany({
            where: { pacienteId: args.patient_id }
          })
        ]);

        return {
          diagnosticosPrevios: diagnosticosEvo.map(d => ({
            codigo: d.codigoCIE10,
            descripcion: d.descripcion,
            tipo: d.tipo,
            fecha: d.evolucion?.fecha
          })),
          antecedentesPatologicos: antecedentesPatologicos.map(a => ({
            enfermedad: a.enfermedad,
            codigoCIE10: a.codigoCIE10,
            enTratamiento: a.enTratamiento,
            observaciones: a.observaciones
          })),
          resumen: {
            totalDiagnosticos: diagnosticosEvo.length,
            patologiasCronicas: antecedentesPatologicos.filter(a => a.enTratamiento).length
          }
        };
      }

      case 'get_vitals_trend': {
        // Obtener tendencias de signos vitales
        const signosVitales = await prisma.signosVitales.findMany({
          where: { pacienteId: args.patient_id },
          take: args.limit || 10,
          orderBy: { fechaHora: 'desc' }
        });

        if (signosVitales.length === 0) {
          return { message: 'No hay registros de signos vitales para este paciente' };
        }

        const vitals = signosVitales.map(sv => ({
          fecha: sv.fechaHora,
          temperatura: sv.temperatura,
          presionSistolica: sv.presionSistolica,
          presionDiastolica: sv.presionDiastolica,
          frecuenciaCardiaca: sv.frecuenciaCardiaca,
          frecuenciaRespiratoria: sv.frecuenciaRespiratoria,
          saturacionOxigeno: sv.saturacionOxigeno,
          peso: sv.peso,
          imc: sv.peso && sv.talla ? (sv.peso / ((sv.talla / 100) ** 2)).toFixed(1) : null
        }));

        // Calcular tendencias si hay suficientes datos
        let trends = null;
        if (vitals.length >= 2) {
          const latest = vitals[0];
          const previous = vitals.slice(1);
          const avgCalc = (key) => {
            const values = previous.filter(v => v[key]).map(v => v[key]);
            return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
          };

          trends = {
            presionSistolica: latest.presionSistolica && avgCalc('presionSistolica') ?
              { actual: latest.presionSistolica, promedio: avgCalc('presionSistolica').toFixed(0) } : null,
            peso: latest.peso && avgCalc('peso') ?
              { actual: latest.peso, promedio: avgCalc('peso').toFixed(1) } : null
          };
        }

        return {
          registros: vitals,
          tendencias: trends,
          ultimasMediciones: vitals[0]
        };
      }

      case 'search_cie10': {
        const results = await prisma.catalogoCie10.findMany({
          where: {
            OR: [
              { codigo: { contains: args.query, mode: 'insensitive' } },
              { descripcion: { contains: args.query, mode: 'insensitive' } },
            ],
            estado: 'Activo'
          },
          take: args.limit || 5,
          orderBy: { codigo: 'asc' }
        });
        return results.map(r => ({
          codigo: r.codigo,
          descripcion: r.descripcion,
          capitulo: r.capitulo
        }));
      }

      case 'check_drug_interactions': {
        // Análisis básico de interacciones conocidas
        const interactions = [];
        const warnings = [];

        // Verificar alergias
        if (args.allergies && args.medications) {
          for (const med of args.medications) {
            for (const allergy of args.allergies) {
              if (med.toLowerCase().includes(allergy.toLowerCase()) ||
                  this.checkRelatedAllergy(med, allergy)) {
                interactions.push({
                  type: 'ALLERGY',
                  severity: 'HIGH',
                  medication: med,
                  allergen: allergy,
                  message: `⚠️ ALERGIA: ${med} puede contener o estar relacionado con ${allergy}`
                });
              }
            }
          }
        }

        // Interacciones comunes entre medicamentos
        const commonInteractions = this.getCommonDrugInteractions();
        if (args.medications && args.current_medications) {
          const allMeds = [...args.medications, ...args.current_medications];
          for (let i = 0; i < allMeds.length; i++) {
            for (let j = i + 1; j < allMeds.length; j++) {
              const interaction = this.checkInteraction(allMeds[i], allMeds[j], commonInteractions);
              if (interaction) {
                interactions.push(interaction);
              }
            }
          }
        }

        return { interactions, warnings, checkedMedications: args.medications };
      }

      case 'analyze_vital_signs': {
        const alerts = [];
        const values = args;

        // Temperatura
        if (values.temperature) {
          if (values.temperature >= 38.5) {
            alerts.push({ type: 'HIGH', sign: 'Temperatura', value: values.temperature, message: '🔴 Fiebre alta', urgency: 'HIGH' });
          } else if (values.temperature >= 37.5) {
            alerts.push({ type: 'ELEVATED', sign: 'Temperatura', value: values.temperature, message: '🟡 Febrícula', urgency: 'MEDIUM' });
          } else if (values.temperature < 35.5) {
            alerts.push({ type: 'LOW', sign: 'Temperatura', value: values.temperature, message: '🔴 Hipotermia', urgency: 'HIGH' });
          }
        }

        // Presión arterial
        if (values.systolic_bp && values.diastolic_bp) {
          if (values.systolic_bp >= 180 || values.diastolic_bp >= 120) {
            alerts.push({ type: 'CRITICAL', sign: 'PA', value: `${values.systolic_bp}/${values.diastolic_bp}`, message: '🔴 Crisis hipertensiva', urgency: 'CRITICAL' });
          } else if (values.systolic_bp >= 140 || values.diastolic_bp >= 90) {
            alerts.push({ type: 'HIGH', sign: 'PA', value: `${values.systolic_bp}/${values.diastolic_bp}`, message: '🟡 Hipertensión', urgency: 'MEDIUM' });
          } else if (values.systolic_bp < 90 || values.diastolic_bp < 60) {
            alerts.push({ type: 'LOW', sign: 'PA', value: `${values.systolic_bp}/${values.diastolic_bp}`, message: '🔴 Hipotensión', urgency: 'HIGH' });
          }
        }

        // Frecuencia cardíaca
        if (values.heart_rate) {
          if (values.heart_rate > 120) {
            alerts.push({ type: 'HIGH', sign: 'FC', value: values.heart_rate, message: '🟡 Taquicardia', urgency: 'MEDIUM' });
          } else if (values.heart_rate < 50) {
            alerts.push({ type: 'LOW', sign: 'FC', value: values.heart_rate, message: '🟡 Bradicardia', urgency: 'MEDIUM' });
          }
        }

        // Saturación O2
        if (values.oxygen_saturation) {
          if (values.oxygen_saturation < 90) {
            alerts.push({ type: 'CRITICAL', sign: 'SpO2', value: values.oxygen_saturation, message: '🔴 Hipoxemia severa', urgency: 'CRITICAL' });
          } else if (values.oxygen_saturation < 94) {
            alerts.push({ type: 'LOW', sign: 'SpO2', value: values.oxygen_saturation, message: '🟡 Hipoxemia leve', urgency: 'MEDIUM' });
          }
        }

        // Frecuencia respiratoria
        if (values.respiratory_rate) {
          if (values.respiratory_rate > 24) {
            alerts.push({ type: 'HIGH', sign: 'FR', value: values.respiratory_rate, message: '🟡 Taquipnea', urgency: 'MEDIUM' });
          } else if (values.respiratory_rate < 12) {
            alerts.push({ type: 'LOW', sign: 'FR', value: values.respiratory_rate, message: '🔴 Bradipnea', urgency: 'HIGH' });
          }
        }

        // IMC
        if (values.weight && values.height) {
          const heightM = values.height / 100;
          const imc = values.weight / (heightM * heightM);
          if (imc < 18.5) {
            alerts.push({ type: 'LOW', sign: 'IMC', value: imc.toFixed(1), message: '🟡 Bajo peso', urgency: 'LOW' });
          } else if (imc >= 30) {
            alerts.push({ type: 'HIGH', sign: 'IMC', value: imc.toFixed(1), message: '🟡 Obesidad', urgency: 'LOW' });
          }
        }

        return {
          alerts,
          summary: alerts.length === 0 ? 'Signos vitales dentro de parámetros normales' : `${alerts.length} alerta(s) detectada(s)`,
          criticalCount: alerts.filter(a => a.urgency === 'CRITICAL').length
        };
      }

      case 'generate_soap_note': {
        // Esta función retorna datos que la IA usará para generar la nota
        return {
          template: {
            S: `Paciente refiere ${args.chief_complaint}. ${args.symptoms || ''}`,
            O: args.physical_exam || 'Pendiente examen físico',
            A: 'Análisis clínico pendiente',
            P: 'Plan de tratamiento pendiente'
          },
          context: {
            chief_complaint: args.chief_complaint,
            vital_signs: args.vital_signs,
            medical_history: args.medical_history
          }
        };
      }

      case 'suggest_treatment': {
        // Retornar contexto para que la IA genere sugerencias
        return {
          diagnosis: args.diagnosis,
          cie10: args.cie10_code,
          patient_context: {
            age: args.patient_age,
            weight: args.patient_weight,
            allergies: args.allergies,
            contraindications: args.contraindications
          },
          note: 'La IA generará sugerencias de tratamiento basadas en guías clínicas'
        };
      }

      default:
        throw new ValidationError(`Herramienta no reconocida: ${toolName}`);
    }
  }

  /**
   * Verificar alergias relacionadas
   */
  checkRelatedAllergy(medication, allergy) {
    const allergyGroups = {
      'penicilina': ['amoxicilina', 'ampicilina', 'penicilina', 'piperacilina'],
      'sulfa': ['sulfametoxazol', 'trimetoprim', 'sulfadiazina'],
      'aines': ['ibuprofeno', 'naproxeno', 'diclofenaco', 'aspirina', 'asa'],
      'cefalosporinas': ['cefalexina', 'ceftriaxona', 'cefuroxima', 'cefazolina']
    };

    const medLower = medication.toLowerCase();
    const allergyLower = allergy.toLowerCase();

    for (const [group, meds] of Object.entries(allergyGroups)) {
      if (meds.some(m => allergyLower.includes(m) || allergyLower.includes(group))) {
        if (meds.some(m => medLower.includes(m))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Obtener interacciones medicamentosas comunes
   */
  getCommonDrugInteractions() {
    return [
      { drugs: ['warfarina', 'aspirina'], severity: 'HIGH', message: 'Riesgo aumentado de sangrado' },
      { drugs: ['warfarina', 'ibuprofeno'], severity: 'HIGH', message: 'Riesgo aumentado de sangrado' },
      { drugs: ['metformina', 'alcohol'], severity: 'MEDIUM', message: 'Riesgo de acidosis láctica' },
      { drugs: ['enalapril', 'espironolactona'], severity: 'MEDIUM', message: 'Riesgo de hiperkalemia' },
      { drugs: ['omeprazol', 'clopidogrel'], severity: 'MEDIUM', message: 'Reducción del efecto antiagregante' },
      { drugs: ['simvastatina', 'gemfibrozilo'], severity: 'HIGH', message: 'Riesgo de rabdomiólisis' },
      { drugs: ['sildenafil', 'nitratos'], severity: 'CRITICAL', message: 'Hipotensión severa - CONTRAINDICADO' },
      { drugs: ['metronidazol', 'alcohol'], severity: 'HIGH', message: 'Efecto antabuse - náuseas, vómitos' },
      { drugs: ['litio', 'ibuprofeno'], severity: 'MEDIUM', message: 'Aumento de niveles de litio' },
      { drugs: ['digoxina', 'amiodarona'], severity: 'HIGH', message: 'Toxicidad por digoxina' }
    ];
  }

  /**
   * Verificar interacción entre dos medicamentos
   */
  checkInteraction(med1, med2, interactions) {
    const m1 = med1.toLowerCase();
    const m2 = med2.toLowerCase();

    for (const interaction of interactions) {
      const [drug1, drug2] = interaction.drugs;
      if ((m1.includes(drug1) && m2.includes(drug2)) ||
          (m1.includes(drug2) && m2.includes(drug1))) {
        return {
          type: 'INTERACTION',
          severity: interaction.severity,
          medications: [med1, med2],
          message: `⚠️ ${interaction.message}`
        };
      }
    }
    return null;
  }

  /**
   * Chat con el asistente IA
   */
  async chat(messages, context = {}, stream = false) {
    if (!this.isConfigured()) {
      throw new ValidationError('El servicio de IA no está configurado. Configure OPENAI_API_KEY.');
    }

    // Construir mensaje de sistema con contexto del paciente
    let systemMessage = this.systemPrompt;

    // Si hay pacienteId, obtener contexto clínico COMPLETO
    if (context.patient?.id) {
      try {
        const fullContext = await aiContextService.getCompletePatientContext(context.patient.id);
        if (fullContext) {
          systemMessage += '\n\n' + aiContextService.formatContextForAI(fullContext);
          // Guardar el contexto para uso posterior
          context.fullPatientContext = fullContext;
        }
      } catch (error) {
        console.error('Error obteniendo contexto completo del paciente:', error);
        // Fallback al contexto básico si falla
      }
    }

    // Si no se pudo obtener contexto completo, usar el básico
    if (!context.fullPatientContext && context.patient) {
      systemMessage += `\n\n--- CONTEXTO DEL PACIENTE ACTUAL ---
Nombre: ${context.patient.nombre || ''} ${context.patient.apellido || ''}
Edad: ${context.patient.edad || 'No especificada'}
Género: ${context.patient.genero || 'No especificado'}
Tipo de sangre: ${context.patient.tipoSangre || 'No especificado'}
Alergias: ${context.patient.alergias || 'Ninguna conocida'}
Enfermedades crónicas: ${context.patient.enfermedadesCronicas || 'Ninguna conocida'}
Motivo de consulta: ${context.motivo || 'No especificado'}`;
    }

    // Agregar signos vitales actuales si no están en el contexto completo
    if (context.vitals && !context.fullPatientContext) {
      systemMessage += `\n\nSignos vitales actuales:
- Temperatura: ${context.vitals.temperatura || 'N/A'} °C
- PA: ${context.vitals.presionSistolica || 'N/A'}/${context.vitals.presionDiastolica || 'N/A'} mmHg
- FC: ${context.vitals.frecuenciaCardiaca || 'N/A'} lpm
- FR: ${context.vitals.frecuenciaRespiratoria || 'N/A'} rpm
- SpO2: ${context.vitals.saturacionOxigeno || 'N/A'}%
- Peso: ${context.vitals.peso || 'N/A'} kg
- Talla: ${context.vitals.talla || 'N/A'} cm`;
    }

    // Agregar vitales actuales de la consulta en curso
    if (context.vitals) {
      systemMessage += `\n\n--- SIGNOS VITALES DE ESTA CONSULTA ---
- Temperatura: ${context.vitals.temperatura || 'N/A'} °C
- PA: ${context.vitals.presionSistolica || 'N/A'}/${context.vitals.presionDiastolica || 'N/A'} mmHg
- FC: ${context.vitals.frecuenciaCardiaca || 'N/A'} lpm
- FR: ${context.vitals.frecuenciaRespiratoria || 'N/A'} rpm
- SpO2: ${context.vitals.saturacionOxigeno || 'N/A'}%`;
    }

    if (context.diagnosis) {
      systemMessage += `\n\nDiagnóstico actual de esta consulta: ${context.diagnosis.codigoCIE10} - ${context.diagnosis.descripcion}`;
    }

    // Motivo de consulta actual
    if (context.motivo) {
      systemMessage += `\n\n--- MOTIVO DE CONSULTA ACTUAL ---\n${context.motivo}`;
    }

    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      tools: this.getTools(),
      tool_choice: 'auto',
      temperature: 0.7,
      max_completion_tokens: 4096,
      stream
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error en API de OpenAI');
      }

      if (stream) {
        return response.body;
      }

      const data = await response.json();
      const message = data.choices[0].message;

      // Procesar tool calls si existen
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolResults = [];

        for (const toolCall of message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await this.executeToolCall(toolCall.function.name, args, context);

          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(result)
          });
        }

        // Hacer segunda llamada con resultados de herramientas
        const followUpPayload = {
          model: this.model,
          messages: [
            { role: 'system', content: systemMessage },
            ...messages,
            message,
            ...toolResults
          ],
          temperature: 0.7,
          max_completion_tokens: 4096
        };

        const followUpResponse = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(followUpPayload)
        });

        if (!followUpResponse.ok) {
          const error = await followUpResponse.json();
          throw new Error(error.error?.message || 'Error en follow-up de OpenAI');
        }

        const followUpData = await followUpResponse.json();
        return {
          content: followUpData.choices[0].message.content,
          toolsUsed: message.tool_calls.map(tc => tc.function.name),
          usage: {
            prompt_tokens: data.usage.prompt_tokens + followUpData.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens + followUpData.usage.completion_tokens,
            total_tokens: data.usage.total_tokens + followUpData.usage.total_tokens
          }
        };
      }

      return {
        content: message.content,
        toolsUsed: [],
        usage: data.usage
      };

    } catch (error) {
      console.error('Error en OpenAI service:', error);
      throw error;
    }
  }

  /**
   * Obtener sugerencias de diagnóstico basadas en síntomas
   */
  async getDiagnosisSuggestions(symptoms, context = {}) {
    const messages = [
      {
        role: 'user',
        content: `Basándote en los siguientes síntomas y contexto, sugiere los 5 diagnósticos CIE-10 más probables con su justificación:

Síntomas: ${symptoms}
${context.vitals ? `Signos vitales: ${JSON.stringify(context.vitals)}` : ''}
${context.history ? `Antecedentes relevantes: ${context.history}` : ''}

Por favor, usa la herramienta search_cie10 para obtener los códigos exactos y formatea tu respuesta como una lista ordenada por probabilidad.`
      }
    ];

    return this.chat(messages, context);
  }

  /**
   * Verificar seguridad de prescripción
   */
  async checkPrescriptionSafety(medications, patientContext) {
    const messages = [
      {
        role: 'user',
        content: `Verifica la seguridad de la siguiente prescripción:

Medicamentos a prescribir: ${medications.join(', ')}
Medicamentos actuales del paciente: ${patientContext.currentMedications?.join(', ') || 'Ninguno'}
Alergias conocidas: ${patientContext.allergies?.join(', ') || 'Ninguna'}
Edad: ${patientContext.age || 'No especificada'}
Peso: ${patientContext.weight || 'No especificado'} kg

Usa la herramienta check_drug_interactions y proporciona un análisis de seguridad.`
      }
    ];

    return this.chat(messages, patientContext);
  }

  /**
   * Generar resumen de consulta
   */
  async generateConsultationSummary(consultationData) {
    const messages = [
      {
        role: 'user',
        content: `Genera un resumen ejecutivo de la siguiente consulta médica:

Motivo: ${consultationData.motivo}
SOAP:
- Subjetivo: ${consultationData.soap?.subjetivo || 'N/A'}
- Objetivo: ${consultationData.soap?.objetivo || 'N/A'}
- Análisis: ${consultationData.soap?.analisis || 'N/A'}
- Plan: ${consultationData.soap?.plan || 'N/A'}

Diagnóstico: ${consultationData.diagnostico?.descripcion || 'N/A'} (${consultationData.diagnostico?.codigoCIE10 || 'N/A'})
Tratamiento: ${consultationData.prescripciones?.map(p => p.nombre).join(', ') || 'N/A'}

Genera un resumen conciso de 2-3 párrafos para el expediente del paciente.`
      }
    ];

    return this.chat(messages, { patient: consultationData.paciente });
  }

  /**
   * Extraer datos de documentos médicos usando Vision API
   * @param {string} imageBase64 - Imagen en base64 (sin prefijo data:image)
   * @param {string} extractionType - Tipo de extracción ('cancer_validation', 'general')
   * @returns {Promise<object>} - Datos extraídos
   */
  async extractMedicalDocumentData(imageBase64, extractionType = 'cancer_validation') {
    if (!this.isConfigured()) {
      throw new ValidationError('OpenAI no configurado');
    }

    try {
      const promptText = extractionType === 'cancer_validation'
        ? `Analiza este documento médico y extrae la siguiente información EXACTA:
1. Fecha exacta del diagnóstico (formato YYYY-MM-DD)
2. Estado de confirmación (debe ser: "confirmado", "sospecha" o "descartado")
3. Método de confirmación (debe ser: "biopsia", "histopatologia", "imagen", "genetico" o "clinico")
4. Detalles del método (descripción breve del método usado)

Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{
  "fechaDiagnosticoExacta": "YYYY-MM-DD",
  "estadoConfirmacion": "confirmado|sospecha|descartado",
  "metodoConfirmacion": "biopsia|histopatologia|imagen|genetico|clinico",
  "metodoConfirmacionDetalle": "descripción breve"
}

Si no encuentras algún dato, usa null para ese campo.`
        : `Analiza este documento médico y extrae toda la información relevante en formato JSON estructurado.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'gpt-4o', // Usar GPT-4 Vision
          messages: [
            {
              role: 'system',
              content: 'Eres un extractor de datos médicos. Extrae ÚNICAMENTE la información solicitada en formato JSON válido.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: promptText
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      return JSON.parse(content);
    } catch (error) {
      console.error('Error extrayendo datos de documento médico:', error);
      throw new ValidationError('Error al procesar el documento: ' + error.message);
    }
  }
}

module.exports = new OpenAIService();
