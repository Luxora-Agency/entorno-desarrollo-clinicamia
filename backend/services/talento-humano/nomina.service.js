/**
 * Servicio de Gestión de Nómina - Módulo Talento Humano
 * Incluye cálculos de nómina según normativa colombiana vigente 2025
 */
const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const NORMATIVA = require('../../config/normatividad-colombia-2025');
const calculosService = require('./calculos-laborales.service');
const reportesService = require('./reportes-legales.service');

// Constantes Colombia 2025 (importadas de normatividad)
const SALARIO_MINIMO = NORMATIVA.SMLV_2025;
const AUXILIO_TRANSPORTE = NORMATIVA.AUXILIO_TRANSPORTE_2025;
const TOPE_AUXILIO_TRANSPORTE = 2 * SALARIO_MINIMO;
const PORCENTAJE_SALUD_EMPLEADO = NORMATIVA.SALUD.EMPLEADO;
const PORCENTAJE_PENSION_EMPLEADO = NORMATIVA.PENSION.EMPLEADO;
const PORCENTAJE_SALUD_EMPRESA = NORMATIVA.SALUD.EMPLEADOR;
const PORCENTAJE_PENSION_EMPRESA = NORMATIVA.PENSION.EMPLEADOR;
const PORCENTAJE_ARL_RIESGO_1 = NORMATIVA.ARL.RIESGO_I;
const PORCENTAJE_CAJA = NORMATIVA.PARAFISCALES.CAJA_COMPENSACION;
const PORCENTAJE_SENA = NORMATIVA.PARAFISCALES.SENA;
const PORCENTAJE_ICBF = NORMATIVA.PARAFISCALES.ICBF;

class NominaService {
  /**
   * Listar periodos de nómina
   */
  async listPeriodos({ anio, estado, page = 1, limit = 12 }) {
    const where = {};
    if (anio) where.anio = anio;
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      prisma.th_periodos_nomina.findMany({
        where,
        include: {
          usuarios: { select: { id: true, nombre: true, apellido: true } },
          _count: { select: { th_nomina_detalle: true } }
        },
        orderBy: [{ anio: 'desc' }, { mes: 'desc' }, { quincena: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.th_periodos_nomina.count({ where })
    ]);

    // Map to camelCase
    const mappedData = data.map(p => ({
      id: p.id,
      anio: p.anio,
      mes: p.mes,
      quincena: p.quincena,
      fechaInicio: p.fecha_inicio,
      fechaFin: p.fecha_fin,
      fechaPago: p.fecha_pago,
      estado: p.estado,
      procesadoPor: p.usuarios ? {
        id: p.usuarios.id,
        nombre: p.usuarios.nombre,
        apellido: p.usuarios.apellido
      } : null,
      detallesCount: p._count.th_nomina_detalle
    }));

    return {
      data: mappedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Crear periodo de nómina
   */
  async createPeriodo(data) {
    // Verificar que no exista el periodo
    const existing = await prisma.th_periodos_nomina.findFirst({
      where: {
        anio: data.anio,
        mes: data.mes,
        quincena: data.quincena || null
      }
    });

    if (existing) {
      throw new ValidationError('El periodo de nómina ya existe');
    }

    const dbData = {
      anio: data.anio,
      mes: data.mes,
      quincena: data.quincena,
      fecha_inicio: new Date(data.fechaInicio),
      fecha_fin: new Date(data.fechaFin),
      fecha_pago: new Date(data.fechaPago),
      estado: 'ABIERTO',
      observaciones: data.observaciones
    };

    return prisma.th_periodos_nomina.create({ data: dbData });
  }

  /**
   * Obtener periodo con detalles
   */
  async getPeriodo(id) {
    const periodo = await prisma.th_periodos_nomina.findUnique({
      where: { id },
      include: {
        th_nomina_detalle: {
          include: {
            th_empleados: {
              select: { id: true, nombre: true, apellido: true, documento: true }
            }
          }
        },
        usuarios: { select: { id: true, nombre: true, apellido: true } }
      }
    });

    if (!periodo) throw new NotFoundError('Periodo no encontrado');
    
    // Map to camelCase
    return {
      id: periodo.id,
      anio: periodo.anio,
      mes: periodo.mes,
      quincena: periodo.quincena,
      fechaInicio: periodo.fecha_inicio,
      fechaFin: periodo.fecha_fin,
      fechaPago: periodo.fecha_pago,
      estado: periodo.estado,
      observaciones: periodo.observaciones,
      procesadoPor: periodo.usuarios,
      fechaProceso: periodo.fecha_proceso,
      detalles: periodo.th_nomina_detalle.map(d => ({
        id: d.id,
        empleadoId: d.empleado_id,
        empleado: d.th_empleados,
        salarioBase: d.salario_base,
        auxTransporte: d.aux_transporte,
        horasExtras: d.horas_extras,
        comisiones: d.comisiones,
        bonificaciones: d.bonificaciones,
        otrosIngresos: d.otros_ingresos,
        totalDevengado: d.total_devengado,
        saludEmpleado: d.salud_empleado,
        pensionEmpleado: d.pension_empleado,
        fondoSolidaridad: d.fondo_solidaridad,
        retencionFuente: d.retencion_fuente,
        embargos: d.embargos,
        prestamos: d.prestamos,
        otrosDescuentos: d.otros_descuentos,
        totalDeducciones: d.total_deducciones,
        netoPagar: d.neto_pagar,
        saludEmpresa: d.salud_empresa,
        pensionEmpresa: d.pension_empresa,
        arl: d.arl,
        cajaCompensacion: d.caja_compensacion,
        sena: d.sena,
        icbf: d.icbf,
        cesantias: d.cesantias,
        intCesantias: d.int_cesantias,
        prima: d.prima,
        vacacionesProv: d.vacaciones_prov
      }))
    };
  }

  /**
   * Procesar nómina del periodo
   */
  async procesarNomina(periodoId, userId) {
    const periodo = await prisma.th_periodos_nomina.findUnique({ where: { id: periodoId } });
    if (!periodo) throw new NotFoundError('Periodo no encontrado');

    if (periodo.estado !== 'ABIERTO') {
      throw new ValidationError('Solo se pueden procesar periodos abiertos');
    }

    // Obtener empleados activos con contrato vigente
    const empleados = await prisma.th_empleados.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        th_contratos: {
          where: { estado: 'ACTIVO' },
          take: 1
        },
        th_cargos: true
      }
    });

    // Obtener novedades del periodo
    const novedades = await prisma.th_novedades_nomina.findMany({
      where: {
        OR: [
          { periodo_id: periodoId },
          { recurrente: true, estado: 'APROBADO' }
        ]
      }
    });

    const novedadesPorEmpleado = novedades.reduce((acc, n) => {
      if (!acc[n.empleado_id]) acc[n.empleado_id] = [];
      acc[n.empleado_id].push(n);
      return acc;
    }, {});

    // Calcular nómina por empleado
    const detalles = [];
    for (const empleado of empleados) {
      if (!empleado.th_contratos.length) continue;

      const contrato = empleado.th_contratos[0];
      const novedadesEmp = novedadesPorEmpleado[empleado.id] || [];

      // Mapear contrato y novedades a formato de cálculo
      const contratoCalc = {
        salarioBase: Number(contrato.salario_base),
        auxTransporte: contrato.aux_transporte,
        tipoRiesgoARL: empleado.th_cargos?.riesgo_arl || 'I',
        tipoCargo: empleado.th_cargos?.nivel || 'ADMINISTRATIVO'
      };
      
      const novedadesCalc = novedadesEmp.map(n => ({
        tipo: n.tipo,
        valor: Number(n.valor),
        cantidad: Number(n.cantidad)
      }));

      // Usar servicio de cálculos
      const detalle = this.calcularNominaEmpleado(contratoCalc, novedadesCalc);
      
      // Mapear detalle calculado a modelo DB
      detalles.push({
        id: require('uuid').v4(),
        periodo_id: periodoId,
        empleado_id: empleado.id,
        salario_base: detalle.salarioBase,
        aux_transporte: detalle.auxTransporte,
        horas_extras: detalle.horasExtras,
        comisiones: detalle.comisiones,
        bonificaciones: detalle.bonificaciones,
        otros_ingresos: detalle.otrosIngresos,
        total_devengado: detalle.totalDevengado,
        salud_empleado: detalle.saludEmpleado,
        pension_empleado: detalle.pensionEmpleado,
        fondo_solidaridad: detalle.fondoSolidaridad,
        retencion_fuente: detalle.retencionFuente,
        embargos: detalle.embargos,
        prestamos: detalle.prestamos,
        otros_descuentos: detalle.otrosDescuentos,
        total_deducciones: detalle.totalDeducciones,
        neto_pagar: detalle.netoPagar,
        salud_empresa: detalle.saludEmpresa,
        pension_empresa: detalle.pensionEmpresa,
        arl: detalle.arl,
        caja_compensacion: detalle.cajaCompensacion,
        sena: detalle.sena,
        icbf: detalle.icbf,
        cesantias: detalle.cesantias,
        int_cesantias: detalle.intCesantias,
        prima: detalle.prima,
        vacaciones_prov: detalle.vacacionesProv
      });
    }

    // Eliminar detalles anteriores y crear nuevos
    await prisma.th_nomina_detalle.deleteMany({ where: { periodo_id: periodoId } });
    if (detalles.length > 0) {
      await prisma.th_nomina_detalle.createMany({ data: detalles });
    }

    // Actualizar estado del periodo
    await prisma.th_periodos_nomina.update({
      where: { id: periodoId },
      data: {
        estado: 'EN_PROCESO',
        procesado_por: userId, // Assuming userId maps to an employee ID somewhere or needs lookup
        fecha_proceso: new Date()
      }
    });

    return this.getPeriodo(periodoId);
  }

  /**
   * Cerrar periodo de nómina
   */
  async cerrarPeriodo(id) {
    const periodo = await prisma.th_periodos_nomina.findUnique({ where: { id } });
    if (!periodo) throw new NotFoundError('Periodo no encontrado');
    if (periodo.estado !== 'EN_PROCESO') {
      throw new ValidationError('El periodo debe estar en proceso para cerrarse');
    }

    return prisma.th_periodos_nomina.update({
      where: { id },
      data: { estado: 'CERRADO' }
    });
  }

  /**
   * Calcular nómina de un empleado (Versión interna simplificada compatible con lógica anterior)
   * Se recomienda migrar a calculosService.calcularNominaMensual para mayor precisión
   */
  calcularNominaEmpleado(contrato, novedades) {
    const salarioBase = Number(contrato.salarioBase);
    let auxTransporte = 0;

    // Auxilio de transporte si aplica
    if (contrato.auxTransporte && salarioBase <= TOPE_AUXILIO_TRANSPORTE) {
      auxTransporte = AUXILIO_TRANSPORTE;
    }

    // Procesar novedades
    let horasExtras = { diurnas: 0, nocturnas: 0, dominicales: 0 };
    let comisiones = 0;
    let bonificaciones = 0;
    let otrosIngresos = 0;
    let embargos = 0;
    let prestamos = 0;
    let otrosDescuentos = 0;

    for (const novedad of novedades) {
      const valor = Number(novedad.valor);
      switch (novedad.tipo) {
        case 'HORA_EXTRA':
          horasExtras.diurnas += valor; // Simplificación
          break;
        case 'COMISION':
          comisiones += valor;
          break;
        case 'BONIFICACION':
          bonificaciones += valor;
          break;
        case 'DESCUENTO':
          otrosDescuentos += valor;
          break;
        case 'PRESTAMO':
          prestamos += valor;
          break;
      }
    }

    // Calcular valor horas extras (simplificado)
    const valorHoraBase = salarioBase / 240;
    const valorHorasExtras =
      horasExtras.diurnas * valorHoraBase * 1.25 +
      horasExtras.nocturnas * valorHoraBase * 1.75 +
      horasExtras.dominicales * valorHoraBase * 2;

    // Total devengado
    const totalDevengado =
      salarioBase + auxTransporte + valorHorasExtras + comisiones + bonificaciones + otrosIngresos;

    // Base para aportes (sin auxilio transporte)
    const ibc = totalDevengado - auxTransporte;

    // Deducciones empleado
    const saludEmpleado = ibc * PORCENTAJE_SALUD_EMPLEADO;
    const pensionEmpleado = ibc * PORCENTAJE_PENSION_EMPLEADO;
    let fondoSolidaridad = 0;
    if (salarioBase >= 4 * SALARIO_MINIMO) {
      fondoSolidaridad = ibc * 0.01;
    }

    // Retención en la fuente (simplificado)
    const retencionFuente = this.calcularRetencion(ibc);

    const totalDeducciones =
      saludEmpleado + pensionEmpleado + fondoSolidaridad + retencionFuente +
      embargos + prestamos + otrosDescuentos;

    // Neto a pagar
    const netoPagar = totalDevengado - totalDeducciones;

    // Aportes empresa
    const saludEmpresa = ibc * PORCENTAJE_SALUD_EMPRESA;
    const pensionEmpresa = ibc * PORCENTAJE_PENSION_EMPRESA;
    const arl = ibc * PORCENTAJE_ARL_RIESGO_1;
    const cajaCompensacion = ibc * PORCENTAJE_CAJA;
    const sena = ibc * PORCENTAJE_SENA;
    const icbf = ibc * PORCENTAJE_ICBF;

    // Provisiones prestaciones
    const cesantias = totalDevengado / 12;
    const intCesantias = cesantias * 0.12 / 12;
    const prima = totalDevengado / 12;
    const vacacionesProv = salarioBase / 24;

    return {
      salarioBase,
      auxTransporte,
      horasExtras: { diurnas: horasExtras.diurnas, nocturnas: horasExtras.nocturnas, dominicales: horasExtras.dominicales },
      comisiones,
      bonificaciones,
      otrosIngresos,
      totalDevengado: Math.round(totalDevengado),
      saludEmpleado: Math.round(saludEmpleado),
      pensionEmpleado: Math.round(pensionEmpleado),
      fondoSolidaridad: Math.round(fondoSolidaridad),
      retencionFuente: Math.round(retencionFuente),
      embargos,
      prestamos,
      otrosDescuentos,
      totalDeducciones: Math.round(totalDeducciones),
      netoPagar: Math.round(netoPagar),
      saludEmpresa: Math.round(saludEmpresa),
      pensionEmpresa: Math.round(pensionEmpresa),
      arl: Math.round(arl),
      cajaCompensacion: Math.round(cajaCompensacion),
      sena: Math.round(sena),
      icbf: Math.round(icbf),
      cesantias: Math.round(cesantias),
      intCesantias: Math.round(intCesantias),
      prima: Math.round(prima),
      vacacionesProv: Math.round(vacacionesProv)
    };
  }

  /**
   * Calcular retención en la fuente según tabla 2025
   */
  calcularRetencion(ibc, deducciones = {}) {
    return calculosService.calcularRetencionFuente(ibc, deducciones);
  }

  async getResumenPeriodo(periodoId) {
    const periodo = await prisma.th_periodos_nomina.findUnique({
      where: { id: periodoId },
      include: { th_detalles_nomina: true }
    });

    if (!periodo) throw new NotFoundError('Periodo no encontrado');

    const resumen = periodo.th_detalles_nomina.reduce(
      (acc, d) => ({
        totalDevengado: acc.totalDevengado + Number(d.total_devengado),
        totalDeducciones: acc.totalDeducciones + Number(d.total_deducciones),
        netoPagar: acc.netoPagar + Number(d.neto_pagar),
        aportesEmpresa:
          acc.aportesEmpresa +
          Number(d.salud_empresa) +
          Number(d.pension_empresa) +
          Number(d.arl) +
          Number(d.caja_compensacion) +
          Number(d.sena) +
          Number(d.icbf),
        provisiones:
          acc.provisiones +
          Number(d.cesantias) +
          Number(d.int_cesantias) +
          Number(d.prima) +
          Number(d.vacaciones_prov),
        empleados: acc.empleados + 1
      }),
      {
        totalDevengado: 0,
        totalDeducciones: 0,
        netoPagar: 0,
        aportesEmpresa: 0,
        provisiones: 0,
        empleados: 0
      }
    );

    return {
      periodo: {
        anio: periodo.anio,
        mes: periodo.mes,
        quincena: periodo.quincena,
        estado: periodo.estado
      },
      resumen: {
        ...resumen,
        costoTotal: resumen.netoPagar + resumen.aportesEmpresa + resumen.provisiones
      }
    };
  }

  // ============================================
  // NOVEDADES
  // ============================================

  async listNovedades({ empleadoId, periodoId, tipo, estado, page = 1, limit = 20 }) {
    const where = {};
    if (empleadoId) where.empleado_id = empleadoId;
    if (periodoId) where.periodo_id = periodoId;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      prisma.th_novedades_nomina.findMany({
        where,
        include: {
          th_empleados: { select: { id: true, nombre: true, apellido: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.th_novedades_nomina.count({ where })
    ]);

    return {
      data: data.map(n => ({
          id: n.id,
          tipo: n.tipo,
          valor: n.valor,
          cantidad: n.cantidad,
          observaciones: n.observaciones,
          estado: n.estado,
          fechaReporte: n.fecha_reporte,
          empleado: n.th_empleados
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async createNovedad(data) {
    return prisma.th_novedades_nomina.create({
      data: {
        empleado_id: data.empleadoId,
        periodo_id: data.periodoId,
        tipo: data.tipo,
        valor: data.valor,
        cantidad: data.cantidad,
        observaciones: data.observaciones,
        recurrente: data.recurrente || false,
        estado: 'PENDIENTE',
        fecha_reporte: new Date()
      }
    });
  }

  async aprobarNovedad(id, userId) {
    const novedad = await prisma.th_novedades_nomina.findUnique({ where: { id } });
    if (!novedad) throw new NotFoundError('Novedad no encontrada');

    return prisma.th_novedades_nomina.update({
      where: { id },
      data: {
        estado: 'APROBADO',
        aprobado_por: userId,
        fecha_aprobacion: new Date()
      }
    });
  }

  // ============================================
  // DELEGACIÓN A SERVICIOS ESPECIALIZADOS
  // ============================================

  async generarPILA(periodoId) {
    return reportesService.generarPILA(periodoId);
  }

  async generarCertificadoLaboral(empleadoId, dirigidoA) {
    return reportesService.generarCertificadoLaboral(empleadoId, dirigidoA);
  }

  async generarCertificadoIngresos(empleadoId, anio) {
    return reportesService.generarCertificadoIngresosRetenciones(empleadoId, anio);
  }

  async generarColillaDetallada(empleadoId, periodoId) {
    return reportesService.generarColillaPago(empleadoId, periodoId);
  }

  async getColilla(empleadoId, periodoId) {
    return reportesService.generarColillaPago(empleadoId, periodoId);
  }

  async generarLiquidacion(empleadoId, fechaRetiro, motivoRetiro) {
    const empleado = await prisma.th_empleados.findUnique({
      where: { id: empleadoId },
      include: {
        th_contratos: { where: { estado: 'ACTIVO' }, take: 1 }
      }
    });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    if (!empleado.th_contratos.length) throw new ValidationError('Empleado sin contrato activo');

    const contrato = empleado.th_contratos[0];
    
    // Preparar objeto empleado para el servicio de cálculo
    const empleadoData = {
      salarioBase: Number(contrato.salario_base),
      auxTransporte: contrato.aux_transporte,
      tipoContrato: contrato.tipo_contrato,
      fechaFinContrato: contrato.fecha_fin
    };

    return calculosService.calcularLiquidacionDefinitiva(
      empleadoData,
      new Date(contrato.fecha_inicio),
      fechaRetiro,
      motivoRetiro
    );
  }

  calcularIncapacidad(salarioBase, dias, tipo) {
    return calculosService.calcularIncapacidad(salarioBase, dias, tipo);
  }

  validarContrato(contrato) {
    return calculosService.validarContrato(contrato);
  }

  getParametrosVigentes() {
    return calculosService.getParametrosVigentes();
  }

  getFechasImportantes(anio) {
    return calculosService.calcularFechasImportantes(anio);
  }

  async calcularNominaCompleta(empleadoId, novedades) {
    const empleado = await prisma.th_empleados.findUnique({
      where: { id: empleadoId },
      include: {
        th_contratos: { where: { estado: 'ACTIVO' }, take: 1 },
        th_cargos: true
      }
    });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    if (!empleado.th_contratos.length) throw new ValidationError('Empleado sin contrato activo');

    const contrato = empleado.th_contratos[0];
    const empleadoData = {
      salarioBase: Number(contrato.salario_base),
      auxTransporte: contrato.aux_transporte,
      tipoRiesgoARL: empleado.th_cargos?.riesgo_arl || 'I',
      tipoCargo: empleado.th_cargos?.nivel || 'ADMINISTRATIVO'
    };

    return calculosService.calcularNominaMensual(empleadoData, novedades);
  }
}

module.exports = new NominaService();
