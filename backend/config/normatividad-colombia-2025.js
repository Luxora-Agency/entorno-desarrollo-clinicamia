/**
 * NORMATIVIDAD LABORAL COLOMBIANA 2025
 * Actualizado: Diciembre 27, 2025
 *
 * Este archivo contiene todas las constantes y parámetros legales
 * para el cálculo de nómina, prestaciones sociales y aportes
 * según la legislación laboral colombiana vigente.
 *
 * Referencias legales:
 * - Código Sustantivo del Trabajo
 * - Ley 100 de 1993 (Sistema de Seguridad Social)
 * - Decreto de SMLV 2025
 * - Estatuto Tributario (Retención en la fuente)
 * - Ley 1819 de 2016 (Reforma tributaria)
 * - Ley 2277 de 2022 (Reforma tributaria)
 */

module.exports = {
  // ============================================
  // SALARIO MÍNIMO Y AUXILIOS 2025
  // ============================================
  SMLV_2025: 1423500,                    // Salario Mínimo Legal Vigente 2025
  AUXILIO_TRANSPORTE_2025: 200000,        // Auxilio de Transporte 2025
  TOPE_AUXILIO_TRANSPORTE: 2,             // Aplica hasta 2 SMLV

  // ============================================
  // APORTES A SEGURIDAD SOCIAL
  // ============================================

  // Salud (Ley 100 de 1993, Art. 204)
  SALUD: {
    EMPLEADO: 0.04,                       // 4% a cargo del empleado
    EMPLEADOR: 0.085,                     // 8.5% a cargo del empleador
    TOTAL: 0.125                          // 12.5% total
  },

  // Pensión (Ley 100 de 1993, Art. 20)
  PENSION: {
    EMPLEADO: 0.04,                       // 4% a cargo del empleado
    EMPLEADOR: 0.12,                      // 12% a cargo del empleador
    TOTAL: 0.16                           // 16% total
  },

  // Fondo de Solidaridad Pensional (Ley 100/1993, Art. 27)
  FONDO_SOLIDARIDAD: {
    DESDE_4_SMLV: 0.01,                   // 1% desde 4 SMLV
    DESDE_16_SMLV: 0.012,                 // 1.2% desde 16 SMLV
    DESDE_17_SMLV: 0.014,                 // 1.4% desde 17 SMLV
    DESDE_18_SMLV: 0.016,                 // 1.6% desde 18 SMLV
    DESDE_19_SMLV: 0.018,                 // 1.8% desde 19 SMLV
    DESDE_20_SMLV: 0.02                   // 2.0% desde 20 SMLV (máximo)
  },

  // ARL - Riesgos Laborales (Decreto 1295/1994, Art. 26)
  ARL: {
    RIESGO_I: 0.00522,                    // 0.522% - Riesgo mínimo (oficinas)
    RIESGO_II: 0.01044,                   // 1.044% - Riesgo bajo
    RIESGO_III: 0.02436,                  // 2.436% - Riesgo medio
    RIESGO_IV: 0.04350,                   // 4.350% - Riesgo alto
    RIESGO_V: 0.06960                     // 6.960% - Riesgo máximo
  },

  // Clasificación de riesgos para IPS/Clínica
  RIESGOS_CARGOS: {
    ADMINISTRATIVO: 'RIESGO_I',           // Personal administrativo
    MEDICO: 'RIESGO_III',                 // Médicos, enfermeras
    QUIROFANO: 'RIESGO_IV',               // Personal de quirófano
    RADIOLOGIA: 'RIESGO_IV',              // Imagenología (radiación)
    LABORATORIO: 'RIESGO_III',            // Laboratorio clínico
    SERVICIOS_GENERALES: 'RIESGO_II',     // Aseo, mantenimiento
    SEGURIDAD: 'RIESGO_II'                // Vigilancia
  },

  // ============================================
  // APORTES PARAFISCALES
  // ============================================
  PARAFISCALES: {
    CAJA_COMPENSACION: 0.04,              // 4% Caja de Compensación
    SENA: 0.02,                           // 2% SENA (exento si < 10 empleados y < 2 SMLV)
    ICBF: 0.03                            // 3% ICBF (exento si < 10 empleados y < 2 SMLV)
  },

  // Exención de SENA e ICBF (Ley 1607/2012, Art. 25)
  EXENCION_PARAFISCALES: {
    APLICA_SI_SALARIO_MENOR_A: 10,        // 10 SMLV
    EXCLUYE_CAJA: false                   // Caja nunca se exonera
  },

  // ============================================
  // PRESTACIONES SOCIALES
  // ============================================
  PRESTACIONES: {
    // Cesantías (CST Art. 249)
    CESANTIAS: {
      PORCENTAJE: 1/12,                   // 8.33% (1 mes por año)
      FECHA_CONSIGNACION: { mes: 2, dia: 14 } // 14 de febrero
    },

    // Intereses sobre cesantías (Ley 52/1975)
    INTERESES_CESANTIAS: {
      PORCENTAJE: 0.12,                   // 12% anual sobre cesantías
      FECHA_PAGO: { mes: 1, dia: 31 }     // 31 de enero
    },

    // Prima de servicios (CST Art. 306)
    PRIMA: {
      PORCENTAJE: 1/12,                   // 8.33% (1 mes por año)
      FECHA_PAGO_1: { mes: 6, dia: 30 },  // Junio 30
      FECHA_PAGO_2: { mes: 12, dia: 20 }  // Diciembre 20
    },

    // Vacaciones (CST Art. 186)
    VACACIONES: {
      DIAS_HABILES: 15,                   // 15 días hábiles por año
      PORCENTAJE_PROVISION: 1/24,         // 4.17% (15 días / 360)
      DIAS_POR_MES: 1.25                  // 1.25 días por mes trabajado
    },

    // Dotación (CST Art. 230)
    DOTACION: {
      APLICA_DESDE_MESES: 3,              // Después de 3 meses
      APLICA_SI_SALARIO_MENOR_A: 2,       // Hasta 2 SMLV
      ENTREGAS_ANO: 3,                    // 30 abril, 31 agosto, 20 diciembre
      FECHAS: [
        { mes: 4, dia: 30 },
        { mes: 8, dia: 31 },
        { mes: 12, dia: 20 }
      ]
    }
  },

  // ============================================
  // HORAS EXTRAS Y RECARGOS (CST Art. 168-172)
  // ============================================
  RECARGOS: {
    // Jornada ordinaria
    JORNADA_DIURNA: { inicio: 6, fin: 21 },  // 6:00 AM - 9:00 PM
    JORNADA_NOCTURNA: { inicio: 21, fin: 6 }, // 9:00 PM - 6:00 AM

    // Recargos sobre hora ordinaria
    HORA_EXTRA_DIURNA: 1.25,              // 25% adicional
    HORA_EXTRA_NOCTURNA: 1.75,            // 75% adicional
    HORA_EXTRA_DOMINICAL_DIURNA: 2.00,    // 100% adicional
    HORA_EXTRA_DOMINICAL_NOCTURNA: 2.50,  // 150% adicional
    RECARGO_NOCTURNO: 0.35,               // 35% sobre hora ordinaria
    RECARGO_DOMINICAL_FESTIVO: 0.75,      // 75% sobre hora ordinaria

    // Límites legales
    HORAS_EXTRAS_MAX_DIA: 2,              // Máximo 2 horas extras por día
    HORAS_EXTRAS_MAX_SEMANA: 12           // Máximo 12 horas extras por semana
  },

  // ============================================
  // RETENCIÓN EN LA FUENTE 2025
  // ============================================
  RETENCION: {
    // UVT 2025 (Unidad de Valor Tributario)
    UVT_2025: 49799,                      // Valor UVT 2025

    // Tabla de retención Procedimiento 1 (Art. 383 ET)
    TABLA_PROCEDIMIENTO_1: [
      { desde: 0, hasta: 95, tarifa: 0, adicional: 0 },
      { desde: 95, hasta: 150, tarifa: 0.19, adicional: 0 },
      { desde: 150, hasta: 360, tarifa: 0.28, adicional: 10.49 },
      { desde: 360, hasta: 640, tarifa: 0.33, adicional: 69.29 },
      { desde: 640, hasta: 945, tarifa: 0.35, adicional: 161.69 },
      { desde: 945, hasta: 2300, tarifa: 0.37, adicional: 268.44 },
      { desde: 2300, hasta: Infinity, tarifa: 0.39, adicional: 769.84 }
    ],

    // Deducciones permitidas (Art. 387 ET)
    DEDUCCIONES: {
      DEPENDIENTES_MAX_PORCENTAJE: 0.10,  // Máximo 10% del ingreso
      DEPENDIENTES_MAX_UVT: 32,           // Máximo 32 UVT mensuales
      MEDICINA_PREPAGADA_MAX_UVT: 16,     // Máximo 16 UVT mensuales
      VIVIENDA_MAX_UVT: 100,              // Máximo 100 UVT mensuales (intereses)
      SALUD_PENSION: 0.08                 // Aportes obligatorios (salud + pensión)
    },

    // Renta exenta (Art. 206 ET)
    RENTA_EXENTA: {
      PORCENTAJE: 0.25,                   // 25% del ingreso
      MAX_UVT_MENSUAL: 240                // Máximo 240 UVT mensuales
    },

    // Límite global de deducciones y rentas exentas
    LIMITE_GLOBAL: {
      PORCENTAJE: 0.40,                   // 40% del ingreso bruto
      MAX_UVT_ANUAL: 1340                 // Máximo 1340 UVT anuales
    }
  },

  // ============================================
  // CONTRATOS DE TRABAJO (CST)
  // ============================================
  CONTRATOS: {
    TIPOS: {
      INDEFINIDO: {
        codigo: 'INDEFINIDO',
        descripcion: 'Término Indefinido',
        periodoPrueba: { dias: 60 }       // Máximo 60 días
      },
      FIJO: {
        codigo: 'FIJO',
        descripcion: 'Término Fijo',
        duracionMinima: 1,                // 1 día mínimo
        duracionMaxima: 1095,             // 3 años máximo
        periodoPrueba: {
          porcentaje: 0.2,                // 1/5 del término pactado
          maximo: 60                      // Máximo 60 días
        },
        renovaciones: 3,                  // Máximo 3 renovaciones
        preavisoTerminacion: 30           // 30 días antes del vencimiento
      },
      OBRA_LABOR: {
        codigo: 'OBRA_LABOR',
        descripcion: 'Obra o Labor',
        periodoPrueba: { dias: 60 }
      },
      PRESTACION_SERVICIOS: {
        codigo: 'PRESTACION_SERVICIOS',
        descripcion: 'Prestación de Servicios',
        esCivil: true,                    // No hay relación laboral
        requiereAfiliacion: true          // Independiente se afilia
      },
      APRENDIZAJE: {
        codigo: 'APRENDIZAJE',
        descripcion: 'Contrato de Aprendizaje SENA',
        apoyo: {
          lectiva: 0.5,                   // 50% SMLV en etapa lectiva
          practica: 0.75                  // 75% SMLV en etapa práctica
        },
        duracionMaxima: 24                // 24 meses máximo
      },
      TEMPORAL: {
        codigo: 'TEMPORAL',
        descripcion: 'Temporal por Empresa de Servicios Temporales',
        duracionMaxima: 6,                // 6 meses iniciales
        prorrogas: 6                      // Hasta 6 meses más
      }
    },

    // Jornadas laborales (CST Art. 161)
    JORNADAS: {
      COMPLETA: { horas: 48, descripcion: '48 horas semanales' },
      MEDIA: { horas: 24, descripcion: '24 horas semanales' },
      FLEXIBLE: { horas: 48, descripcion: 'Horario flexible hasta 48h' },
      TURNOS: { horas: 48, descripcion: 'Por turnos rotativos' }
    }
  },

  // ============================================
  // LICENCIAS Y PERMISOS (CST)
  // ============================================
  LICENCIAS: {
    MATERNIDAD: {
      semanas: 18,                        // 18 semanas (Ley 1822/2017)
      preparto: 2,                        // 2 semanas antes del parto
      postparto: 16                       // 16 semanas después
    },
    PATERNIDAD: {
      diasHabiles: 2 * 7,                 // 2 semanas calendario (Ley 2114/2021)
      condicion: 'nacimiento o adopción'
    },
    LUTO: {
      diasHabiles: 5,                     // 5 días hábiles (Ley 1280/2009)
      parentesco: ['cónyuge', 'compañero permanente', 'padres', 'hijos', 'hermanos', 'abuelos', 'nietos', 'suegros']
    },
    MATRIMONIO: {
      diasHabiles: 0,                     // No hay licencia legal (convencional)
      convencional: 3                     // Común: 3 días
    },
    CALAMIDAD_DOMESTICA: {
      diasHabiles: null,                  // Según gravedad
      remunerada: true
    },
    SINDICAL: {
      remunerada: true,
      requierePermiso: true
    },
    VOTACION: {
      mediaDia: true,                     // Medio día
      remunerada: true
    }
  },

  // ============================================
  // INDEMNIZACIONES (CST Art. 64)
  // ============================================
  INDEMNIZACION: {
    // Por despido sin justa causa
    INDEFINIDO: {
      menos_1_ano: { dias: 30 },          // 30 días por el primer año
      adicional: { dias: 20 },            // 20 días por cada año siguiente
      proporcional: true                  // Proporcional a fracción de año
    },
    FIJO: {
      formula: 'salarios restantes',      // Salarios del tiempo faltante
      minimo: { dias: 15 }                // Mínimo 15 días
    },
    OBRA_LABOR: {
      formula: 'salarios restantes',
      minimo: { dias: 15 }
    }
  },

  // ============================================
  // SEGURIDAD Y SALUD EN EL TRABAJO (SG-SST)
  // ============================================
  SST: {
    // Decreto 1072 de 2015
    DOCUMENTOS_OBLIGATORIOS: [
      'Política SST',
      'Objetivos SST',
      'Reglamento de Higiene y Seguridad',
      'Matriz de peligros (IPEVR)',
      'Plan de emergencias',
      'Programa de capacitación SST',
      'Profesiograma',
      'Indicadores SST'
    ],

    // COPASST o Vigía (Resolución 2013/1986)
    COPASST: {
      obligatorio_desde: 10,              // Desde 10 trabajadores
      vigia_hasta: 9,                     // Vigía si < 10 trabajadores
      reunion_mensual: true
    },

    // Comité de Convivencia (Resolución 652/2012)
    COMITE_CONVIVENCIA: {
      obligatorio: true,
      reunion_trimestral: true
    },

    // Exámenes ocupacionales (Resolución 2346/2007)
    EXAMENES: {
      ingreso: true,
      periodicos: true,
      egreso: true,
      post_incapacidad: true
    }
  },

  // ============================================
  // INCAPACIDADES (Decreto 1848/1969)
  // ============================================
  INCAPACIDADES: {
    ENFERMEDAD_COMUN: {
      dias_1_2: { paga: 'empleador', porcentaje: 0.6667 },  // 66.67%
      dias_3_90: { paga: 'EPS', porcentaje: 0.6667 },
      dias_91_180: { paga: 'EPS', porcentaje: 0.50 },       // 50%
      dias_181_540: { paga: 'AFP', porcentaje: 0.50 }
    },
    ACCIDENTE_TRABAJO: {
      desde_dia_1: { paga: 'ARL', porcentaje: 1.0 }         // 100%
    },
    MATERNIDAD: {
      paga: 'EPS',
      porcentaje: 1.0                                        // 100%
    }
  },

  // ============================================
  // RÉGIMEN DE IPS (Resolución 3100/2019)
  // ============================================
  IPS: {
    // Personal obligatorio por servicio
    HABILITACION: {
      urgencias: ['médico', 'enfermera'],
      consulta_externa: ['médico'],
      hospitalizacion: ['médico', 'enfermera', 'auxiliar'],
      cirugia: ['cirujano', 'anestesiólogo', 'instrumentadora', 'enfermera'],
      laboratorio: ['bacteriólogo'],
      imagenologia: ['radiólogo', 'técnico']
    },

    // Horas mínimas de disponibilidad
    TURNOS_MINIMOS: {
      urgencias_24h: true,
      hospitalizacion_24h: true
    },

    // Credenciales requeridas
    DOCUMENTOS_PERSONAL: [
      'Título profesional',
      'Tarjeta profesional',
      'RETHUS vigente',
      'Certificado de antecedentes disciplinarios',
      'Póliza de responsabilidad civil (médicos)'
    ]
  },

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  /**
   * Calcular el valor del SMLV para un año específico
   * @param {number} anio - Año a consultar
   * @returns {number} Valor del SMLV
   */
  getSMLV(anio = 2025) {
    const historico = {
      2020: 877803,
      2021: 908526,
      2022: 1000000,
      2023: 1160000,
      2024: 1300000,
      2025: 1423500
    };
    return historico[anio] || this.SMLV_2025;
  },

  /**
   * Calcular auxilio de transporte para un año
   * @param {number} anio - Año a consultar
   * @returns {number} Valor del auxilio
   */
  getAuxilioTransporte(anio = 2025) {
    const historico = {
      2020: 102854,
      2021: 106454,
      2022: 117172,
      2023: 140606,
      2024: 162000,
      2025: 200000
    };
    return historico[anio] || this.AUXILIO_TRANSPORTE_2025;
  },

  /**
   * Calcular porcentaje del Fondo de Solidaridad según salario
   * @param {number} salario - Salario base
   * @param {number} smlv - Valor del SMLV
   * @returns {number} Porcentaje a aplicar
   */
  getPorcentajeFondoSolidaridad(salario, smlv = this.SMLV_2025) {
    const salarios = salario / smlv;
    if (salarios < 4) return 0;
    if (salarios < 16) return this.FONDO_SOLIDARIDAD.DESDE_4_SMLV;
    if (salarios < 17) return this.FONDO_SOLIDARIDAD.DESDE_16_SMLV;
    if (salarios < 18) return this.FONDO_SOLIDARIDAD.DESDE_17_SMLV;
    if (salarios < 19) return this.FONDO_SOLIDARIDAD.DESDE_18_SMLV;
    if (salarios < 20) return this.FONDO_SOLIDARIDAD.DESDE_19_SMLV;
    return this.FONDO_SOLIDARIDAD.DESDE_20_SMLV;
  },

  /**
   * Obtener nivel de riesgo ARL según tipo de cargo
   * @param {string} tipoCargo - Tipo de cargo
   * @returns {string} Nivel de riesgo
   */
  getRiesgoARL(tipoCargo) {
    return this.RIESGOS_CARGOS[tipoCargo] || 'RIESGO_I';
  },

  /**
   * Calcular porcentaje ARL según riesgo
   * @param {string} nivelRiesgo - Nivel de riesgo (I-V)
   * @returns {number} Porcentaje de cotización
   */
  getPorcentajeARL(nivelRiesgo) {
    const nivel = nivelRiesgo.toUpperCase().replace('RIESGO_', '');
    const mapa = {
      'I': this.ARL.RIESGO_I,
      'II': this.ARL.RIESGO_II,
      'III': this.ARL.RIESGO_III,
      'IV': this.ARL.RIESGO_IV,
      'V': this.ARL.RIESGO_V
    };
    return mapa[nivel] || this.ARL.RIESGO_I;
  },

  /**
   * Verificar si aplica exoneración de parafiscales
   * @param {number} salario - Salario del empleado
   * @param {number} totalEmpleados - Total de empleados de la empresa
   * @returns {boolean} Si aplica exoneración
   */
  aplicaExoneracionParafiscales(salario, totalEmpleados = 100) {
    // Ley 1607/2012: Exoneración de SENA e ICBF
    // Aplica para empleadores de trabajadores que devenguen hasta 10 SMLV
    return salario < (10 * this.SMLV_2025);
  },

  /**
   * Calcular días de vacaciones según tiempo trabajado
   * @param {Date} fechaIngreso - Fecha de ingreso
   * @param {Date} fechaCorte - Fecha de corte
   * @returns {object} Días de vacaciones
   */
  calcularDiasVacaciones(fechaIngreso, fechaCorte = new Date()) {
    const msEnDia = 1000 * 60 * 60 * 24;
    const diasTrabajados = Math.floor((fechaCorte - new Date(fechaIngreso)) / msEnDia);
    const diasVacaciones = (diasTrabajados / 360) * 15;

    return {
      diasTrabajados,
      diasVacacionesAcumulados: Math.floor(diasVacaciones * 100) / 100,
      diasHabiles: Math.floor(diasVacaciones)
    };
  },

  /**
   * Verificar si un contrato a término fijo debe convertirse a indefinido
   * @param {Date} fechaInicio - Fecha de inicio del contrato
   * @param {number} renovaciones - Número de renovaciones
   * @param {number} duracionMeses - Duración en meses
   * @returns {object} Estado del contrato
   */
  verificarContratoFijo(fechaInicio, renovaciones, duracionMeses) {
    // Después de 3 renovaciones, el contrato se convierte en indefinido
    // Si el contrato es menor a 1 año, después de 3 renovaciones se convierte en indefinido
    const tiempoTotal = (renovaciones + 1) * duracionMeses;

    return {
      debeConvertirseIndefinido: renovaciones >= 3 || tiempoTotal >= 36,
      renovacionesRestantes: Math.max(0, 3 - renovaciones),
      mesesRestantes: Math.max(0, 36 - tiempoTotal)
    };
  }
};
