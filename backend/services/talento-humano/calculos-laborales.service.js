/**
 * Servicio de Cálculos Laborales Colombia
 * Implementa todos los cálculos según normatividad colombiana vigente 2025
 *
 * Referencias:
 * - Código Sustantivo del Trabajo (CST)
 * - Ley 100 de 1993 (Seguridad Social)
 * - Estatuto Tributario (Retención en la fuente)
 * - Decretos reglamentarios vigentes
 */
const NORMATIVA = require('../../config/normatividad-colombia-2025');

class CalculosLaboralesService {
  constructor() {
    this.SMLV = NORMATIVA.SMLV_2025;
    this.AUXILIO_TRANSPORTE = NORMATIVA.AUXILIO_TRANSPORTE_2025;
    this.UVT = NORMATIVA.RETENCION.UVT_2025;
  }

  // ============================================
  // CÁLCULO DE NÓMINA MENSUAL
  // ============================================

  /**
   * Calcular nómina completa de un empleado
   * @param {object} empleado - Datos del empleado y contrato
   * @param {object} novedades - Novedades del periodo (horas extras, incapacidades, etc.)
   * @param {object} deducciones - Deducciones adicionales (préstamos, embargos, etc.)
   * @returns {object} Liquidación completa
   */
  calcularNominaMensual(empleado, novedades = {}, deducciones = {}) {
    const { salarioBase, auxTransporte: tieneAuxilio, tipoRiesgoARL, tipoCargo } = empleado;

    // 1. Calcular devengados
    const devengados = this.calcularDevengados(salarioBase, tieneAuxilio, novedades);

    // 2. Calcular base de cotización (IBC)
    const ibc = this.calcularIBC(devengados);

    // 3. Calcular deducciones del empleado
    const deduccionesEmpleado = this.calcularDeduccionesEmpleado(ibc, salarioBase, deducciones);

    // 4. Calcular aportes del empleador
    const aportesEmpleador = this.calcularAportesEmpleador(ibc, tipoCargo || 'ADMINISTRATIVO');

    // 5. Calcular provisiones de prestaciones
    const provisiones = this.calcularProvisiones(devengados.total, salarioBase);

    // 6. Calcular retención en la fuente
    const retencion = this.calcularRetencionFuente(ibc, empleado.deducciones || {});

    // 7. Calcular neto a pagar
    const totalDeducciones = deduccionesEmpleado.total + retencion;
    const netoPagar = devengados.total - totalDeducciones;

    return {
      // Información del periodo
      salarioBase: Math.round(salarioBase),

      // Devengados
      devengados: {
        salarioBase: Math.round(salarioBase),
        auxTransporte: Math.round(devengados.auxTransporte),
        horasExtras: {
          diurnas: Math.round(devengados.horasExtras.diurnas),
          nocturnas: Math.round(devengados.horasExtras.nocturnas),
          dominicalesDiurnas: Math.round(devengados.horasExtras.dominicalesDiurnas),
          dominicalesNocturnas: Math.round(devengados.horasExtras.dominicalesNocturnas)
        },
        recargos: {
          nocturno: Math.round(devengados.recargos.nocturno),
          dominical: Math.round(devengados.recargos.dominical)
        },
        comisiones: Math.round(devengados.comisiones),
        bonificaciones: Math.round(devengados.bonificaciones),
        auxilios: Math.round(devengados.auxilios),
        incapacidades: Math.round(devengados.incapacidades),
        licencias: Math.round(devengados.licencias),
        vacaciones: Math.round(devengados.vacaciones),
        otrosIngresos: Math.round(devengados.otros),
        total: Math.round(devengados.total)
      },

      // Base de cotización
      ibc: Math.round(ibc),

      // Deducciones empleado
      deduccionesEmpleado: {
        salud: Math.round(deduccionesEmpleado.salud),
        pension: Math.round(deduccionesEmpleado.pension),
        fondoSolidaridad: Math.round(deduccionesEmpleado.fondoSolidaridad),
        retencionFuente: Math.round(retencion),
        embargos: Math.round(deduccionesEmpleado.embargos),
        prestamos: Math.round(deduccionesEmpleado.prestamos),
        libranzas: Math.round(deduccionesEmpleado.libranzas),
        cooperativas: Math.round(deduccionesEmpleado.cooperativas),
        sindicato: Math.round(deduccionesEmpleado.sindicato),
        otros: Math.round(deduccionesEmpleado.otros),
        total: Math.round(totalDeducciones)
      },

      // Aportes empleador
      aportesEmpleador: {
        salud: Math.round(aportesEmpleador.salud),
        pension: Math.round(aportesEmpleador.pension),
        arl: Math.round(aportesEmpleador.arl),
        cajaCompensacion: Math.round(aportesEmpleador.cajaCompensacion),
        sena: Math.round(aportesEmpleador.sena),
        icbf: Math.round(aportesEmpleador.icbf),
        total: Math.round(aportesEmpleador.total)
      },

      // Provisiones prestaciones sociales
      provisiones: {
        cesantias: Math.round(provisiones.cesantias),
        interesesCesantias: Math.round(provisiones.interesesCesantias),
        prima: Math.round(provisiones.prima),
        vacaciones: Math.round(provisiones.vacaciones),
        total: Math.round(provisiones.total)
      },

      // Totales
      totalDevengado: Math.round(devengados.total),
      totalDeducciones: Math.round(totalDeducciones),
      netoPagar: Math.round(netoPagar),

      // Costos empleador
      costoTotalEmpleador: Math.round(
        devengados.total + aportesEmpleador.total + provisiones.total
      )
    };
  }

  /**
   * Calcular devengados del empleado
   */
  calcularDevengados(salarioBase, tieneAuxilio, novedades = {}) {
    // Auxilio de transporte (aplica si salario <= 2 SMLV)
    let auxTransporte = 0;
    if (tieneAuxilio && salarioBase <= (2 * this.SMLV)) {
      auxTransporte = this.AUXILIO_TRANSPORTE;
    }

    // Valor hora ordinaria
    const valorHora = salarioBase / 240; // 30 días * 8 horas

    // Horas extras
    const horasExtras = {
      diurnas: (novedades.horasExtrasDiurnas || 0) * valorHora * NORMATIVA.RECARGOS.HORA_EXTRA_DIURNA,
      nocturnas: (novedades.horasExtrasNocturnas || 0) * valorHora * NORMATIVA.RECARGOS.HORA_EXTRA_NOCTURNA,
      dominicalesDiurnas: (novedades.horasExtrasDominicalesDiurnas || 0) * valorHora * NORMATIVA.RECARGOS.HORA_EXTRA_DOMINICAL_DIURNA,
      dominicalesNocturnas: (novedades.horasExtrasDominicalesNocturnas || 0) * valorHora * NORMATIVA.RECARGOS.HORA_EXTRA_DOMINICAL_NOCTURNA
    };

    // Recargos (sin hora extra, solo recargo)
    const recargos = {
      nocturno: (novedades.horasNocturnas || 0) * valorHora * NORMATIVA.RECARGOS.RECARGO_NOCTURNO,
      dominical: (novedades.horasDominicales || 0) * valorHora * NORMATIVA.RECARGOS.RECARGO_DOMINICAL_FESTIVO
    };

    // Otros devengados
    const comisiones = novedades.comisiones || 0;
    const bonificaciones = novedades.bonificaciones || 0;
    const auxilios = novedades.auxilios || 0;
    const otros = novedades.otrosIngresos || 0;

    // Incapacidades (pagadas por empleador los primeros 2 días)
    let incapacidades = 0;
    if (novedades.diasIncapacidad && novedades.diasIncapacidad <= 2) {
      incapacidades = (salarioBase / 30) * novedades.diasIncapacidad * 0.6667;
    }

    // Licencias remuneradas
    const licencias = novedades.diasLicenciaRemunerada ?
      (salarioBase / 30) * novedades.diasLicenciaRemunerada : 0;

    // Vacaciones disfrutadas
    const vacaciones = novedades.diasVacaciones ?
      (salarioBase / 30) * novedades.diasVacaciones : 0;

    // Total devengado
    const total =
      salarioBase +
      auxTransporte +
      horasExtras.diurnas +
      horasExtras.nocturnas +
      horasExtras.dominicalesDiurnas +
      horasExtras.dominicalesNocturnas +
      recargos.nocturno +
      recargos.dominical +
      comisiones +
      bonificaciones +
      auxilios +
      incapacidades +
      licencias +
      vacaciones +
      otros;

    return {
      salarioBase,
      auxTransporte,
      horasExtras,
      recargos,
      comisiones,
      bonificaciones,
      auxilios,
      incapacidades,
      licencias,
      vacaciones,
      otros,
      total
    };
  }

  /**
   * Calcular Ingreso Base de Cotización (IBC)
   * El IBC no incluye auxilio de transporte
   */
  calcularIBC(devengados) {
    return devengados.total - devengados.auxTransporte;
  }

  /**
   * Calcular deducciones del empleado
   */
  calcularDeduccionesEmpleado(ibc, salarioBase, deducciones = {}) {
    // Salud: 4% del IBC
    const salud = ibc * NORMATIVA.SALUD.EMPLEADO;

    // Pensión: 4% del IBC
    const pension = ibc * NORMATIVA.PENSION.EMPLEADO;

    // Fondo de Solidaridad Pensional (desde 4 SMLV)
    const porcentajeFSP = NORMATIVA.getPorcentajeFondoSolidaridad(salarioBase, this.SMLV);
    const fondoSolidaridad = ibc * porcentajeFSP;

    // Deducciones adicionales
    const embargos = deducciones.embargos || 0;
    const prestamos = deducciones.prestamos || 0;
    const libranzas = deducciones.libranzas || 0;
    const cooperativas = deducciones.cooperativas || 0;
    const sindicato = deducciones.sindicato || 0;
    const otros = deducciones.otros || 0;

    const total = salud + pension + fondoSolidaridad + embargos +
      prestamos + libranzas + cooperativas + sindicato + otros;

    return {
      salud,
      pension,
      fondoSolidaridad,
      embargos,
      prestamos,
      libranzas,
      cooperativas,
      sindicato,
      otros,
      total
    };
  }

  /**
   * Calcular aportes del empleador
   */
  calcularAportesEmpleador(ibc, tipoCargo = 'ADMINISTRATIVO') {
    // Salud: 8.5% del IBC
    const salud = ibc * NORMATIVA.SALUD.EMPLEADOR;

    // Pensión: 12% del IBC
    const pension = ibc * NORMATIVA.PENSION.EMPLEADOR;

    // ARL: Según nivel de riesgo
    const nivelRiesgo = NORMATIVA.getRiesgoARL(tipoCargo);
    const porcentajeARL = NORMATIVA.getPorcentajeARL(nivelRiesgo);
    const arl = ibc * porcentajeARL;

    // Caja de Compensación: 4%
    const cajaCompensacion = ibc * NORMATIVA.PARAFISCALES.CAJA_COMPENSACION;

    // SENA e ICBF (con posible exoneración Ley 1607/2012)
    const exento = NORMATIVA.aplicaExoneracionParafiscales(ibc);
    const sena = exento ? 0 : ibc * NORMATIVA.PARAFISCALES.SENA;
    const icbf = exento ? 0 : ibc * NORMATIVA.PARAFISCALES.ICBF;

    const total = salud + pension + arl + cajaCompensacion + sena + icbf;

    return {
      salud,
      pension,
      arl,
      nivelRiesgo,
      cajaCompensacion,
      sena,
      icbf,
      exoneradoSenaIcbf: exento,
      total
    };
  }

  /**
   * Calcular provisiones de prestaciones sociales
   */
  calcularProvisiones(totalDevengado, salarioBase) {
    // Cesantías: 8.33% (1 mes por año trabajado)
    // Base: Salario + Auxilio de transporte + otros factores salariales
    const cesantias = totalDevengado * NORMATIVA.PRESTACIONES.CESANTIAS.PORCENTAJE;

    // Intereses sobre cesantías: 12% anual sobre cesantías acumuladas
    const interesesCesantias = cesantias * NORMATIVA.PRESTACIONES.INTERESES_CESANTIAS.PORCENTAJE / 12;

    // Prima de servicios: 8.33% (1 mes por año)
    const prima = totalDevengado * NORMATIVA.PRESTACIONES.PRIMA.PORCENTAJE;

    // Vacaciones: 4.17% (15 días por año sobre salario base, sin auxilio)
    const vacaciones = salarioBase * NORMATIVA.PRESTACIONES.VACACIONES.PORCENTAJE_PROVISION;

    return {
      cesantias,
      interesesCesantias,
      prima,
      vacaciones,
      total: cesantias + interesesCesantias + prima + vacaciones
    };
  }

  /**
   * Calcular retención en la fuente - Procedimiento 1
   * @param {number} ibc - Ingreso base de cotización
   * @param {object} deducciones - Deducciones para disminuir base
   * @returns {number} Valor de retención
   */
  calcularRetencionFuente(ibc, deducciones = {}) {
    // 1. Restar aportes obligatorios (salud y pensión del empleado)
    const aportesObligatorios = ibc * NORMATIVA.RETENCION.DEDUCCIONES.SALUD_PENSION;
    let baseGravable = ibc - aportesObligatorios;

    // 2. Aplicar deducciones permitidas
    const maxDependientes = Math.min(
      ibc * NORMATIVA.RETENCION.DEDUCCIONES.DEPENDIENTES_MAX_PORCENTAJE,
      NORMATIVA.RETENCION.DEDUCCIONES.DEPENDIENTES_MAX_UVT * this.UVT
    );
    const dependientes = Math.min(deducciones.dependientes || 0, maxDependientes);

    const maxMedicinaPrepagada = NORMATIVA.RETENCION.DEDUCCIONES.MEDICINA_PREPAGADA_MAX_UVT * this.UVT;
    const medicinaPrepagada = Math.min(deducciones.medicinaPrepagada || 0, maxMedicinaPrepagada);

    const maxVivienda = NORMATIVA.RETENCION.DEDUCCIONES.VIVIENDA_MAX_UVT * this.UVT;
    const interesesVivienda = Math.min(deducciones.interesesVivienda || 0, maxVivienda);

    baseGravable -= (dependientes + medicinaPrepagada + interesesVivienda);

    // 3. Aplicar renta exenta del 25%
    const maxRentaExenta = NORMATIVA.RETENCION.RENTA_EXENTA.MAX_UVT_MENSUAL * this.UVT;
    const rentaExenta = Math.min(
      baseGravable * NORMATIVA.RETENCION.RENTA_EXENTA.PORCENTAJE,
      maxRentaExenta
    );
    baseGravable -= rentaExenta;

    // 4. Verificar límite global del 40%
    const totalDeducciones = aportesObligatorios + dependientes + medicinaPrepagada +
      interesesVivienda + rentaExenta;
    const limiteGlobal = ibc * NORMATIVA.RETENCION.LIMITE_GLOBAL.PORCENTAJE;

    if (totalDeducciones > limiteGlobal) {
      baseGravable = ibc - limiteGlobal;
    }

    // 5. Convertir a UVT y aplicar tabla
    const baseEnUVT = baseGravable / this.UVT;

    // 6. Buscar rango en la tabla
    const tabla = NORMATIVA.RETENCION.TABLA_PROCEDIMIENTO_1;
    for (const rango of tabla) {
      if (baseEnUVT >= rango.desde && baseEnUVT < rango.hasta) {
        const retencionUVT = (baseEnUVT - rango.desde) * rango.tarifa + rango.adicional;
        return Math.max(0, retencionUVT * this.UVT);
      }
    }

    return 0;
  }

  // ============================================
  // LIQUIDACIÓN DE PRESTACIONES SOCIALES
  // ============================================

  /**
   * Calcular cesantías acumuladas
   * @param {number} salarioPromedio - Salario promedio últimos 3 meses
   * @param {number} diasTrabajados - Días trabajados en el año
   * @returns {number} Valor de cesantías
   */
  calcularCesantias(salarioPromedio, diasTrabajados) {
    // Fórmula: (Salario × Días trabajados) / 360
    return (salarioPromedio * diasTrabajados) / 360;
  }

  /**
   * Calcular intereses sobre cesantías
   * @param {number} cesantias - Valor de cesantías acumuladas
   * @param {number} diasTrabajados - Días trabajados en el año
   * @returns {number} Valor de intereses
   */
  calcularInteresesCesantias(cesantias, diasTrabajados) {
    // Fórmula: (Cesantías × Días × 0.12) / 360
    return (cesantias * diasTrabajados * 0.12) / 360;
  }

  /**
   * Calcular prima de servicios
   * @param {number} salarioPromedio - Salario promedio del semestre
   * @param {number} diasTrabajados - Días trabajados en el semestre
   * @returns {number} Valor de prima
   */
  calcularPrima(salarioPromedio, diasTrabajados) {
    // Fórmula: (Salario × Días trabajados) / 360
    // Máximo 180 días por semestre
    const diasEfectivos = Math.min(diasTrabajados, 180);
    return (salarioPromedio * diasEfectivos) / 360;
  }

  /**
   * Calcular vacaciones
   * @param {number} salarioBase - Salario base (sin auxilio de transporte)
   * @param {number} diasTrabajados - Días trabajados
   * @returns {object} Valor en dinero y días
   */
  calcularVacaciones(salarioBase, diasTrabajados) {
    // 15 días hábiles por año = 15/360 por día trabajado
    const diasVacaciones = (diasTrabajados * 15) / 360;
    const valorDia = salarioBase / 30;
    const valorVacaciones = diasVacaciones * valorDia;

    return {
      diasHabiles: Math.floor(diasVacaciones * 100) / 100,
      valorDia: Math.round(valorDia),
      valorTotal: Math.round(valorVacaciones)
    };
  }

  /**
   * Liquidación completa de un empleado
   * @param {object} empleado - Datos del empleado
   * @param {Date} fechaIngreso - Fecha de ingreso
   * @param {Date} fechaRetiro - Fecha de retiro
   * @param {string} motivoRetiro - Motivo del retiro
   * @returns {object} Liquidación completa
   */
  calcularLiquidacionDefinitiva(empleado, fechaIngreso, fechaRetiro, motivoRetiro = 'RENUNCIA') {
    const { salarioBase, promedioUltimosTresMeses, auxTransporte } = empleado;

    const msEnDia = 1000 * 60 * 60 * 24;
    const diasTotales = Math.floor((fechaRetiro - fechaIngreso) / msEnDia);
    const anioActual = fechaRetiro.getFullYear();
    const inicioAnio = new Date(anioActual, 0, 1);
    const diasAnioActual = Math.floor((fechaRetiro - inicioAnio) / msEnDia);

    // Salario promedio para prestaciones
    const salarioPromedio = promedioUltimosTresMeses || salarioBase;
    const salarioConAuxilio = salarioPromedio + (auxTransporte ? this.AUXILIO_TRANSPORTE : 0);

    // 1. Cesantías (del año en curso)
    const cesantias = this.calcularCesantias(salarioConAuxilio, diasAnioActual);

    // 2. Intereses sobre cesantías
    const interesesCesantias = this.calcularInteresesCesantias(cesantias, diasAnioActual);

    // 3. Prima de servicios (del semestre en curso)
    const inicioSemestre = fechaRetiro.getMonth() < 6 ?
      new Date(anioActual, 0, 1) :
      new Date(anioActual, 6, 1);
    const diasSemestre = Math.floor((fechaRetiro - inicioSemestre) / msEnDia);
    const prima = this.calcularPrima(salarioConAuxilio, diasSemestre);

    // 4. Vacaciones (días pendientes)
    const vacaciones = this.calcularVacaciones(salarioBase, diasTotales);
    // Restar vacaciones ya disfrutadas
    const vacacionesDisfrutadas = empleado.diasVacacionesDisfrutadas || 0;
    const diasVacacionesPendientes = Math.max(0, vacaciones.diasHabiles - vacacionesDisfrutadas);
    const valorVacacionesPendientes = diasVacacionesPendientes * vacaciones.valorDia;

    // 5. Salario pendiente (días del mes de retiro)
    const diasMesRetiro = fechaRetiro.getDate();
    const salarioPendiente = (salarioBase / 30) * diasMesRetiro;

    // 6. Indemnización (si aplica)
    let indemnizacion = 0;
    if (motivoRetiro === 'DESPIDO_SIN_JUSTA_CAUSA') {
      indemnizacion = this.calcularIndemnizacion(empleado, fechaIngreso, fechaRetiro);
    }

    // Total a pagar
    const subtotal = cesantias + interesesCesantias + prima + valorVacacionesPendientes + salarioPendiente;
    const total = subtotal + indemnizacion;

    return {
      fechaIngreso,
      fechaRetiro,
      diasTrabajados: diasTotales,
      motivoRetiro,

      detalles: {
        salarioBase: Math.round(salarioBase),
        salarioPromedio: Math.round(salarioPromedio),
        auxTransporte: auxTransporte ? this.AUXILIO_TRANSPORTE : 0,
        salarioConAuxilio: Math.round(salarioConAuxilio)
      },

      prestaciones: {
        cesantias: {
          diasBase: diasAnioActual,
          valor: Math.round(cesantias)
        },
        interesesCesantias: {
          porcentaje: 12,
          valor: Math.round(interesesCesantias)
        },
        prima: {
          diasBase: diasSemestre,
          valor: Math.round(prima)
        },
        vacaciones: {
          diasAcumulados: vacaciones.diasHabiles,
          diasDisfrutados: vacacionesDisfrutadas,
          diasPendientes: diasVacacionesPendientes,
          valor: Math.round(valorVacacionesPendientes)
        }
      },

      salarioPendiente: {
        dias: diasMesRetiro,
        valor: Math.round(salarioPendiente)
      },

      indemnizacion: {
        aplica: motivoRetiro === 'DESPIDO_SIN_JUSTA_CAUSA',
        valor: Math.round(indemnizacion)
      },

      totales: {
        subtotal: Math.round(subtotal),
        indemnizacion: Math.round(indemnizacion),
        total: Math.round(total)
      }
    };
  }

  /**
   * Calcular indemnización por despido sin justa causa
   * Según Art. 64 del CST
   */
  calcularIndemnizacion(empleado, fechaIngreso, fechaRetiro) {
    const { salarioBase, tipoContrato } = empleado;
    const msEnDia = 1000 * 60 * 60 * 24;
    const diasTrabajados = Math.floor((fechaRetiro - fechaIngreso) / msEnDia);
    const aniosTrabajados = diasTrabajados / 365;

    const valorDia = salarioBase / 30;

    if (tipoContrato === 'INDEFINIDO') {
      // Contrato a término indefinido
      if (aniosTrabajados < 1) {
        // Menos de 1 año: 30 días
        return 30 * valorDia;
      } else {
        // Más de 1 año: 30 días por el primer año + 20 días por cada año adicional
        const aniosAdicionales = Math.floor(aniosTrabajados - 1);
        const fraccionAnio = aniosTrabajados - 1 - aniosAdicionales;
        return (30 + (aniosAdicionales * 20) + (fraccionAnio * 20)) * valorDia;
      }
    } else if (tipoContrato === 'FIJO' || tipoContrato === 'OBRA_LABOR') {
      // Contrato a término fijo u obra/labor: salarios faltantes
      // (Mínimo 15 días)
      const fechaFinContrato = new Date(empleado.fechaFinContrato);
      const diasRestantes = Math.max(
        15,
        Math.floor((fechaFinContrato - fechaRetiro) / msEnDia)
      );
      return diasRestantes * valorDia;
    }

    return 0;
  }

  // ============================================
  // CÁLCULOS DE INCAPACIDADES
  // ============================================

  /**
   * Calcular valor de incapacidad
   * @param {number} salarioBase - Salario base
   * @param {number} diasIncapacidad - Total de días
   * @param {string} tipoIncapacidad - Tipo (COMUN, LABORAL, MATERNIDAD)
   * @returns {object} Desglose de pagos
   */
  calcularIncapacidad(salarioBase, diasIncapacidad, tipoIncapacidad = 'COMUN') {
    const valorDia = salarioBase / 30;
    const resultado = {
      diasTotales: diasIncapacidad,
      valorDiaBase: Math.round(valorDia),
      desglose: []
    };

    if (tipoIncapacidad === 'LABORAL') {
      // Accidente o enfermedad laboral: 100% pagado por ARL desde día 1
      resultado.desglose.push({
        pagador: 'ARL',
        dias: diasIncapacidad,
        porcentaje: 100,
        valor: Math.round(valorDia * diasIncapacidad)
      });
    } else if (tipoIncapacidad === 'MATERNIDAD') {
      // Licencia de maternidad: 100% pagado por EPS
      resultado.desglose.push({
        pagador: 'EPS',
        dias: diasIncapacidad,
        porcentaje: 100,
        valor: Math.round(valorDia * diasIncapacidad)
      });
    } else {
      // Enfermedad común
      // Días 1-2: Empleador paga 66.67%
      if (diasIncapacidad >= 1) {
        const dias1_2 = Math.min(diasIncapacidad, 2);
        resultado.desglose.push({
          pagador: 'EMPLEADOR',
          dias: dias1_2,
          porcentaje: 66.67,
          valor: Math.round(valorDia * dias1_2 * 0.6667)
        });
      }

      // Días 3-90: EPS paga 66.67%
      if (diasIncapacidad > 2) {
        const dias3_90 = Math.min(diasIncapacidad - 2, 88);
        resultado.desglose.push({
          pagador: 'EPS',
          dias: dias3_90,
          porcentaje: 66.67,
          valor: Math.round(valorDia * dias3_90 * 0.6667)
        });
      }

      // Días 91-180: EPS paga 50%
      if (diasIncapacidad > 90) {
        const dias91_180 = Math.min(diasIncapacidad - 90, 90);
        resultado.desglose.push({
          pagador: 'EPS',
          dias: dias91_180,
          porcentaje: 50,
          valor: Math.round(valorDia * dias91_180 * 0.50)
        });
      }

      // Días 181-540: AFP paga 50%
      if (diasIncapacidad > 180) {
        const dias181_540 = Math.min(diasIncapacidad - 180, 360);
        resultado.desglose.push({
          pagador: 'AFP',
          dias: dias181_540,
          porcentaje: 50,
          valor: Math.round(valorDia * dias181_540 * 0.50)
        });
      }
    }

    resultado.totalAPagar = resultado.desglose.reduce((sum, d) => sum + d.valor, 0);

    return resultado;
  }

  // ============================================
  // VALIDACIONES NORMATIVAS
  // ============================================

  /**
   * Validar contrato según normatividad colombiana
   */
  validarContrato(contrato) {
    const errores = [];
    const advertencias = [];

    // Validar salario mínimo
    if (contrato.salarioBase < this.SMLV) {
      errores.push(`El salario base (${contrato.salarioBase}) no puede ser menor al SMLV (${this.SMLV})`);
    }

    // Validar tipo de contrato
    const tipoValido = Object.keys(NORMATIVA.CONTRATOS.TIPOS).includes(contrato.tipoContrato);
    if (!tipoValido) {
      errores.push(`Tipo de contrato inválido: ${contrato.tipoContrato}`);
    }

    // Validar periodo de prueba
    if (contrato.periodoPruebaDias) {
      const maxPeriodo = NORMATIVA.CONTRATOS.TIPOS[contrato.tipoContrato]?.periodoPrueba?.dias || 60;
      if (contrato.periodoPruebaDias > maxPeriodo) {
        errores.push(`El periodo de prueba no puede exceder ${maxPeriodo} días`);
      }
    }

    // Validar contrato a término fijo
    if (contrato.tipoContrato === 'FIJO') {
      const config = NORMATIVA.CONTRATOS.TIPOS.FIJO;

      // Verificar duración máxima
      if (contrato.duracionMeses > (config.duracionMaxima / 30)) {
        errores.push(`El contrato a término fijo no puede exceder 3 años`);
      }

      // Verificar renovaciones
      const estadoContrato = NORMATIVA.verificarContratoFijo(
        contrato.fechaInicio,
        contrato.renovaciones || 0,
        contrato.duracionMeses || 12
      );

      if (estadoContrato.debeConvertirseIndefinido) {
        advertencias.push('Este contrato debe convertirse a término indefinido según la ley');
      }
    }

    // Validar jornada laboral
    if (contrato.horasSemana > 48) {
      errores.push('La jornada laboral máxima es de 48 horas semanales');
    }

    return {
      valido: errores.length === 0,
      errores,
      advertencias
    };
  }

  /**
   * Calcular fechas importantes del año para un empleado
   */
  calcularFechasImportantes(anio = new Date().getFullYear()) {
    return {
      primaJunio: new Date(anio, 5, 30),          // 30 de junio
      primaDiciembre: new Date(anio, 11, 20),     // 20 de diciembre
      interesesCesantias: new Date(anio, 0, 31),  // 31 de enero (del año siguiente)
      consignacionCesantias: new Date(anio, 1, 14), // 14 de febrero (del año siguiente)
      dotacion1: new Date(anio, 3, 30),           // 30 de abril
      dotacion2: new Date(anio, 7, 31),           // 31 de agosto
      dotacion3: new Date(anio, 11, 20)           // 20 de diciembre
    };
  }

  /**
   * Obtener parámetros vigentes
   */
  getParametrosVigentes() {
    return {
      smlv: this.SMLV,
      auxilioTransporte: this.AUXILIO_TRANSPORTE,
      uvt: this.UVT,
      porcentajes: {
        saludEmpleado: NORMATIVA.SALUD.EMPLEADO * 100,
        saludEmpleador: NORMATIVA.SALUD.EMPLEADOR * 100,
        pensionEmpleado: NORMATIVA.PENSION.EMPLEADO * 100,
        pensionEmpleador: NORMATIVA.PENSION.EMPLEADOR * 100,
        cajaCompensacion: NORMATIVA.PARAFISCALES.CAJA_COMPENSACION * 100,
        sena: NORMATIVA.PARAFISCALES.SENA * 100,
        icbf: NORMATIVA.PARAFISCALES.ICBF * 100
      },
      arl: NORMATIVA.ARL,
      prestaciones: {
        cesantias: '8.33% (1 mes por año)',
        interesesCesantias: '12% anual sobre cesantías',
        prima: '8.33% (1 mes por año)',
        vacaciones: '15 días hábiles por año'
      }
    };
  }
}

module.exports = new CalculosLaboralesService();
