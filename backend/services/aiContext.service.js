/**
 * Servicio de Contexto Clínico para el Asistente IA
 * Recopila toda la información relevante del paciente para el asistente
 */
const prisma = require('../db/prisma');

class AIContextService {
  /**
   * Obtener contexto clínico completo del paciente
   * @param {string} pacienteId - ID del paciente
   * @param {object} options - Opciones de configuración
   * @returns {object} Contexto clínico completo
   */
  async getCompletePatientContext(pacienteId, options = {}) {
    const {
      includeHistory = true,
      includeVitalsHistory = true,
      includeMedications = true,
      includeLabResults = true,
      includeHospitalizations = true,
      maxConsultations = 10,
      maxVitalRecords = 20
    } = options;

    try {
      // 1. Información básica del paciente con todos los antecedentes
      const paciente = await prisma.paciente.findUnique({
        where: { id: pacienteId },
        include: {
          // Antecedentes estructurados (nombres correctos según schema)
          patologicosEstructurados: {
            orderBy: { fechaDiagnostico: 'desc' }
          },
          quirurgicosEstructurados: {
            orderBy: { fecha: 'desc' }
          },
          alergicosEstructurados: true,
          familiaresEstructurados: true,
          farmacologicosEstructurados: {
            where: { activo: true }
          },
          ginecoObstetrico: true
        }
      });

      if (!paciente) {
        return null;
      }

      const context = {
        paciente: this.formatPatientBasicInfo(paciente),
        antecedentes: this.formatMedicalHistory(paciente),
        consultasPrevias: [],
        evolucionesPrevias: [],
        signosVitalesHistorico: [],
        medicamentosActuales: [],
        resultadosLaboratorio: [],
        hospitalizaciones: [],
        urgencias: [],
        alertasActivas: [],
        resumenClinico: ''
      };

      // 2. Consultas previas (evoluciones)
      if (includeHistory) {
        const evoluciones = await prisma.evolucion.findMany({
          where: { pacienteId },
          take: maxConsultations,
          orderBy: { fecha: 'desc' },
          include: {
            diagnosticos: true,
            doctor: {
              select: { nombre: true, apellido: true, especialidad: true }
            }
          }
        });

        context.evolucionesPrevias = evoluciones.map(e => ({
          fecha: e.fecha,
          doctor: e.doctor ? `${e.doctor.nombre} ${e.doctor.apellido}` : 'No registrado',
          especialidad: e.doctor?.especialidad,
          motivoConsulta: e.motivoConsulta,
          subjetivo: e.subjetivo,
          objetivo: e.objetivo,
          analisis: e.analisis,
          plan: e.plan,
          diagnosticos: e.diagnosticos.map(d => ({
            codigo: d.codigoCIE10,
            descripcion: d.descripcion,
            tipo: d.tipo
          }))
        }));

        // Consultas/Citas previas
        const citas = await prisma.cita.findMany({
          where: {
            pacienteId,
            estado: { in: ['Atendida', 'Completada'] }
          },
          take: maxConsultations,
          orderBy: { fecha: 'desc' },
          include: {
            doctor: {
              select: { nombre: true, apellido: true }
            },
            especialidad: {
              select: { nombre: true }
            }
          }
        });

        context.consultasPrevias = citas.map(c => ({
          fecha: c.fecha,
          motivo: c.motivo,
          notas: c.notas,
          doctor: c.doctor ? `${c.doctor.nombre} ${c.doctor.apellido}` : null,
          especialidad: c.especialidad?.nombre
        }));
      }

      // 3. Historial de signos vitales
      if (includeVitalsHistory) {
        const signosVitales = await prisma.signosVitales.findMany({
          where: { pacienteId },
          take: maxVitalRecords,
          orderBy: { fechaHora: 'desc' }
        });

        context.signosVitalesHistorico = signosVitales.map(sv => ({
          fecha: sv.fechaHora,
          temperatura: sv.temperatura,
          presionSistolica: sv.presionSistolica,
          presionDiastolica: sv.presionDiastolica,
          frecuenciaCardiaca: sv.frecuenciaCardiaca,
          frecuenciaRespiratoria: sv.frecuenciaRespiratoria,
          saturacionOxigeno: sv.saturacionOxigeno,
          peso: sv.peso,
          talla: sv.talla,
          imc: sv.peso && sv.talla ? (sv.peso / ((sv.talla / 100) ** 2)).toFixed(1) : null
        }));

        // Calcular tendencias
        if (signosVitales.length >= 2) {
          context.tendenciasVitales = this.calculateVitalsTrends(signosVitales);
        }
      }

      // 4. Medicamentos actuales (prescripciones activas)
      if (includeMedications) {
        const prescripciones = await prisma.prescripcion.findMany({
          where: {
            pacienteId,
            estado: 'Activa'
          },
          include: {
            medicamentos: {
              include: {
                producto: {
                  select: { nombre: true, principioActivo: true, concentracion: true }
                }
              }
            }
          }
        });

        context.medicamentosActuales = prescripciones.flatMap(p =>
          p.medicamentos.map(m => ({
            medicamento: m.producto?.nombre || 'Sin nombre',
            principioActivo: m.producto?.principioActivo,
            dosis: m.dosis,
            frecuencia: m.frecuencia,
            via: m.via,
            duracion: m.duracionDias,
            instrucciones: m.instrucciones,
            fechaInicio: p.fechaInicio
          }))
        );

        // También agregar medicamentos de antecedentes farmacológicos
        const medsFarmacologicos = paciente.farmacologicosEstructurados || [];
        for (const med of medsFarmacologicos) {
          if (!context.medicamentosActuales.find(m =>
            m.medicamento?.toLowerCase() === med.medicamento?.toLowerCase()
          )) {
            context.medicamentosActuales.push({
              medicamento: med.medicamento,
              dosis: med.dosis,
              frecuencia: med.frecuencia,
              fuente: 'antecedente'
            });
          }
        }
      }

      // 5. Resultados de laboratorio recientes
      if (includeLabResults) {
        const ordenesLab = await prisma.ordenMedica.findMany({
          where: {
            pacienteId,
            tipoOrden: 'Laboratorio',
            estado: { in: ['Completada', 'Resultados'] }
          },
          take: 10,
          orderBy: { fechaOrden: 'desc' },
          include: {
            items: true
          }
        });

        context.resultadosLaboratorio = ordenesLab.map(o => ({
          fecha: o.fechaOrden,
          examenes: o.items.map(i => ({
            examen: i.nombre,
            resultado: i.resultado,
            valorReferencia: i.valorReferencia,
            unidad: i.unidad,
            esAnormal: i.esAnormal
          }))
        }));
      }

      // 6. Hospitalizaciones previas
      if (includeHospitalizations) {
        const admisiones = await prisma.admision.findMany({
          where: { pacienteId },
          take: 5,
          orderBy: { fechaIngreso: 'desc' },
          include: {
            unidad: { select: { nombre: true } },
            diagnosticosAdmision: true
          }
        });

        context.hospitalizaciones = admisiones.map(a => ({
          fechaIngreso: a.fechaIngreso,
          fechaEgreso: a.fechaEgreso,
          unidad: a.unidad?.nombre,
          motivoIngreso: a.motivoIngreso,
          diagnosticos: a.diagnosticosAdmision?.map(d => d.descripcion) || [],
          diasEstancia: a.fechaEgreso ?
            Math.ceil((new Date(a.fechaEgreso) - new Date(a.fechaIngreso)) / (1000 * 60 * 60 * 24)) :
            null
        }));
      }

      // 7. Urgencias previas
      try {
        const urgencias = await prisma.atencionUrgencia.findMany({
          where: { pacienteId },
          take: 5,
          orderBy: { fechaIngreso: 'desc' }
        });

        context.urgencias = urgencias.map(u => ({
          fecha: u.fechaIngreso,
          motivoConsulta: u.motivoConsulta,
          prioridad: u.prioridad,
          diagnostico: u.diagnosticoFinal,
          procedimientos: u.procedimientosRealizados
        }));
      } catch (e) {
        context.urgencias = [];
      }

      // 8. Alertas activas
      try {
        const alertas = await prisma.alertaClinica.findMany({
          where: {
            pacienteId,
            activa: true
          },
          orderBy: { fechaCreacion: 'desc' }
        });

        context.alertasActivas = alertas.map(a => ({
          tipo: a.tipo,
          mensaje: a.descripcion,
          prioridad: a.prioridad,
          fecha: a.fechaCreacion
        }));
      } catch (e) {
        context.alertasActivas = [];
      }

      // 9. Generar resumen clínico para el contexto
      context.resumenClinico = this.generateClinicalSummary(context);

      return context;

    } catch (error) {
      console.error('Error obteniendo contexto del paciente:', error);
      throw error;
    }
  }

  /**
   * Formatear información básica del paciente
   */
  formatPatientBasicInfo(paciente) {
    const edad = paciente.fechaNacimiento ?
      this.calculateAge(paciente.fechaNacimiento) : null;

    return {
      id: paciente.id,
      nombre: `${paciente.nombre} ${paciente.apellido}`,
      documento: paciente.documento,
      edad,
      fechaNacimiento: paciente.fechaNacimiento,
      genero: paciente.genero,
      tipoSangre: paciente.tipoSangre,
      estadoCivil: paciente.estadoCivil,
      ocupacion: paciente.ocupacion,
      eps: paciente.eps,
      telefono: paciente.telefono
    };
  }

  /**
   * Calcular edad desde fecha de nacimiento
   */
  calculateAge(fechaNacimiento) {
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Formatear historial médico (antecedentes)
   */
  formatMedicalHistory(paciente) {
    return {
      patologicos: (paciente.patologicosEstructurados || []).map(a => ({
        enfermedad: a.enfermedad,
        codigoCIE10: a.codigoCIE10,
        fechaDiagnostico: a.fechaDiagnostico,
        enTratamiento: a.enTratamiento,
        observaciones: a.observaciones
      })),
      quirurgicos: (paciente.quirurgicosEstructurados || []).map(a => ({
        procedimiento: a.procedimiento,
        fecha: a.fecha,
        hospital: a.hospital,
        complicaciones: a.complicaciones
      })),
      alergicos: (paciente.alergicosEstructurados || []).map(a => ({
        tipoAlergia: a.tipoAlergia,
        sustancia: a.sustancia,
        reaccion: a.reaccion,
        severidad: a.severidad
      })),
      familiares: (paciente.familiaresEstructurados || []).map(a => ({
        parentesco: a.parentesco,
        enfermedad: a.enfermedad,
        vive: a.vive
      })),
      farmacologicos: (paciente.farmacologicosEstructurados || []).map(a => ({
        medicamento: a.medicamento,
        dosis: a.dosis,
        frecuencia: a.frecuencia,
        activo: a.activo
      })),
      ginecoObstetrico: paciente.ginecoObstetrico ? {
        gestas: paciente.ginecoObstetrico.gestas,
        partos: paciente.ginecoObstetrico.partos,
        abortos: paciente.ginecoObstetrico.abortos,
        cesareas: paciente.ginecoObstetrico.cesareas,
        fum: paciente.ginecoObstetrico.fum,
        cicloMenstrual: paciente.ginecoObstetrico.cicloMenstrual,
        metodoPlanificacion: paciente.ginecoObstetrico.metodoPlanificacion
      } : null
    };
  }

  /**
   * Calcular tendencias en signos vitales
   */
  calculateVitalsTrends(signosVitales) {
    const trends = {};
    const latest = signosVitales[0];
    const previous = signosVitales.slice(1, 5);

    const calcTrend = (current, previousValues, key) => {
      if (!current || previousValues.length === 0) return null;
      const avg = previousValues.reduce((sum, v) => sum + (v[key] || 0), 0) / previousValues.filter(v => v[key]).length;
      if (isNaN(avg)) return null;
      const diff = current - avg;
      const percentChange = (diff / avg) * 100;
      return {
        current,
        average: avg.toFixed(1),
        change: diff > 0 ? `+${percentChange.toFixed(1)}%` : `${percentChange.toFixed(1)}%`,
        trend: diff > 5 ? 'subiendo' : diff < -5 ? 'bajando' : 'estable'
      };
    };

    if (latest.presionSistolica) {
      trends.presionSistolica = calcTrend(latest.presionSistolica, previous, 'presionSistolica');
    }
    if (latest.frecuenciaCardiaca) {
      trends.frecuenciaCardiaca = calcTrend(latest.frecuenciaCardiaca, previous, 'frecuenciaCardiaca');
    }
    if (latest.peso) {
      trends.peso = calcTrend(latest.peso, previous, 'peso');
    }

    return trends;
  }

  /**
   * Generar resumen clínico para contexto de IA
   */
  generateClinicalSummary(context) {
    const parts = [];

    // Resumen de antecedentes
    const patologicos = context.antecedentes.patologicos;
    if (patologicos.length > 0) {
      parts.push(`Antecedentes patológicos: ${patologicos.map(p => p.enfermedad).join(', ')}.`);
    }

    // Alergias (muy importante)
    const alergias = context.antecedentes.alergicos;
    if (alergias.length > 0) {
      parts.push(`⚠️ ALERGIAS: ${alergias.map(a => `${a.sustancia} (${a.severidad})`).join(', ')}.`);
    }

    // Medicamentos actuales
    if (context.medicamentosActuales.length > 0) {
      parts.push(`Medicamentos actuales: ${context.medicamentosActuales.map(m => m.medicamento).join(', ')}.`);
    }

    // Último diagnóstico
    if (context.evolucionesPrevias.length > 0) {
      const ultimaEvo = context.evolucionesPrevias[0];
      if (ultimaEvo.diagnosticos.length > 0) {
        parts.push(`Último diagnóstico (${new Date(ultimaEvo.fecha).toLocaleDateString()}): ${ultimaEvo.diagnosticos.map(d => d.descripcion).join(', ')}.`);
      }
    }

    // Hospitalizaciones recientes
    if (context.hospitalizaciones.length > 0) {
      const ultimaHosp = context.hospitalizaciones[0];
      parts.push(`Última hospitalización: ${new Date(ultimaHosp.fechaIngreso).toLocaleDateString()} - ${ultimaHosp.motivoIngreso}.`);
    }

    // Alertas activas
    if (context.alertasActivas.length > 0) {
      parts.push(`Alertas activas: ${context.alertasActivas.map(a => a.mensaje).join('; ')}.`);
    }

    // Tendencias de vitales
    if (context.tendenciasVitales) {
      const trends = [];
      if (context.tendenciasVitales.presionSistolica?.trend === 'subiendo') {
        trends.push('PA subiendo');
      }
      if (context.tendenciasVitales.peso?.trend === 'subiendo') {
        trends.push('peso aumentando');
      }
      if (trends.length > 0) {
        parts.push(`Tendencias a vigilar: ${trends.join(', ')}.`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Formatear contexto para prompt de OpenAI
   */
  formatContextForAI(context) {
    if (!context) return '';

    let prompt = `
=== HISTORIA CLÍNICA DEL PACIENTE ===

INFORMACIÓN BÁSICA:
- Nombre: ${context.paciente.nombre}
- Edad: ${context.paciente.edad || 'No especificada'} años
- Género: ${context.paciente.genero || 'No especificado'}
- Tipo de sangre: ${context.paciente.tipoSangre || 'No especificado'}
- EPS: ${context.paciente.eps || 'No especificada'}
`;

    // Resumen clínico
    if (context.resumenClinico) {
      prompt += `\nRESUMEN CLÍNICO:\n${context.resumenClinico}\n`;
    }

    // Antecedentes patológicos
    if (context.antecedentes.patologicos.length > 0) {
      prompt += `\nANTECEDENTES PATOLÓGICOS:\n`;
      for (const ant of context.antecedentes.patologicos) {
        prompt += `- ${ant.enfermedad}${ant.codigoCIE10 ? ` (${ant.codigoCIE10})` : ''}${ant.enTratamiento ? ' - En tratamiento' : ''}\n`;
      }
    }

    // Antecedentes quirúrgicos
    if (context.antecedentes.quirurgicos.length > 0) {
      prompt += `\nANTECEDENTES QUIRÚRGICOS:\n`;
      for (const ant of context.antecedentes.quirurgicos) {
        prompt += `- ${ant.procedimiento} (${ant.fecha ? new Date(ant.fecha).getFullYear() : 'Fecha no especificada'})${ant.complicaciones ? ` - Complicaciones: ${ant.complicaciones}` : ''}\n`;
      }
    }

    // ALERGIAS (MUY IMPORTANTE)
    if (context.antecedentes.alergicos.length > 0) {
      prompt += `\n⚠️ ALERGIAS CONOCIDAS:\n`;
      for (const ant of context.antecedentes.alergicos) {
        prompt += `- ${ant.sustancia} (${ant.tipoAlergia}) - Severidad: ${ant.severidad}${ant.reaccion ? ` - Reacción: ${ant.reaccion}` : ''}\n`;
      }
    }

    // Antecedentes familiares
    if (context.antecedentes.familiares.length > 0) {
      prompt += `\nANTECEDENTES FAMILIARES:\n`;
      for (const ant of context.antecedentes.familiares) {
        prompt += `- ${ant.parentesco}: ${ant.enfermedad}\n`;
      }
    }

    // Medicamentos actuales
    if (context.medicamentosActuales.length > 0) {
      prompt += `\nMEDICAMENTOS ACTUALES:\n`;
      for (const med of context.medicamentosActuales) {
        prompt += `- ${med.medicamento}${med.dosis ? ` ${med.dosis}` : ''}${med.frecuencia ? ` - ${med.frecuencia}` : ''}\n`;
      }
    }

    // Gineco-obstétrico (si aplica)
    if (context.antecedentes.ginecoObstetrico) {
      const go = context.antecedentes.ginecoObstetrico;
      prompt += `\nANTECEDENTES GINECO-OBSTÉTRICOS:\n`;
      prompt += `- G${go.gestas}P${go.partos}A${go.abortos}C${go.cesareas}\n`;
      if (go.fum) prompt += `- FUM: ${new Date(go.fum).toLocaleDateString()}\n`;
      if (go.cicloMenstrual) prompt += `- Ciclo: ${go.cicloMenstrual}\n`;
      if (go.metodoPlanificacion) prompt += `- Planificación: ${go.metodoPlanificacion}\n`;
    }

    // Últimas consultas
    if (context.evolucionesPrevias.length > 0) {
      prompt += `\nÚLTIMAS CONSULTAS (${context.evolucionesPrevias.length}):\n`;
      for (const evo of context.evolucionesPrevias.slice(0, 5)) {
        prompt += `\n[${new Date(evo.fecha).toLocaleDateString()}] ${evo.especialidad || 'Medicina General'}\n`;
        prompt += `Motivo: ${evo.motivoConsulta || 'No especificado'}\n`;
        if (evo.diagnosticos.length > 0) {
          prompt += `Dx: ${evo.diagnosticos.map(d => `${d.codigo} - ${d.descripcion}`).join(', ')}\n`;
        }
        if (evo.plan) {
          prompt += `Plan: ${evo.plan.substring(0, 200)}${evo.plan.length > 200 ? '...' : ''}\n`;
        }
      }
    }

    // Signos vitales recientes
    if (context.signosVitalesHistorico.length > 0) {
      const sv = context.signosVitalesHistorico[0];
      prompt += `\nÚLTIMOS SIGNOS VITALES (${new Date(sv.fecha).toLocaleDateString()}):\n`;
      if (sv.temperatura) prompt += `- Temperatura: ${sv.temperatura}°C\n`;
      if (sv.presionSistolica && sv.presionDiastolica) prompt += `- PA: ${sv.presionSistolica}/${sv.presionDiastolica} mmHg\n`;
      if (sv.frecuenciaCardiaca) prompt += `- FC: ${sv.frecuenciaCardiaca} lpm\n`;
      if (sv.frecuenciaRespiratoria) prompt += `- FR: ${sv.frecuenciaRespiratoria} rpm\n`;
      if (sv.saturacionOxigeno) prompt += `- SpO2: ${sv.saturacionOxigeno}%\n`;
      if (sv.peso) prompt += `- Peso: ${sv.peso} kg\n`;
      if (sv.talla) prompt += `- Talla: ${sv.talla} cm\n`;
      if (sv.imc) prompt += `- IMC: ${sv.imc}\n`;
    }

    // Resultados de laboratorio
    if (context.resultadosLaboratorio.length > 0) {
      prompt += `\nRESULTADOS DE LABORATORIO RECIENTES:\n`;
      for (const lab of context.resultadosLaboratorio.slice(0, 3)) {
        prompt += `[${new Date(lab.fecha).toLocaleDateString()}]\n`;
        for (const exam of lab.examenes) {
          const anormalMarker = exam.esAnormal ? ' ⚠️' : '';
          prompt += `- ${exam.examen}: ${exam.resultado}${exam.unidad ? ` ${exam.unidad}` : ''}${anormalMarker}\n`;
        }
      }
    }

    // Hospitalizaciones
    if (context.hospitalizaciones.length > 0) {
      prompt += `\nHOSPITALIZACIONES PREVIAS:\n`;
      for (const hosp of context.hospitalizaciones) {
        prompt += `- ${new Date(hosp.fechaIngreso).toLocaleDateString()}: ${hosp.motivoIngreso} (${hosp.unidad}, ${hosp.diasEstancia || '?'} días)\n`;
      }
    }

    // Urgencias
    if (context.urgencias.length > 0) {
      prompt += `\nVISITAS A URGENCIAS:\n`;
      for (const urg of context.urgencias) {
        prompt += `- ${new Date(urg.fecha).toLocaleDateString()}: ${urg.motivoConsulta} (${urg.prioridad})\n`;
      }
    }

    // Alertas
    if (context.alertasActivas.length > 0) {
      prompt += `\n🚨 ALERTAS ACTIVAS:\n`;
      for (const alerta of context.alertasActivas) {
        prompt += `- [${alerta.prioridad}] ${alerta.mensaje}\n`;
      }
    }

    return prompt;
  }
}

module.exports = new AIContextService();
