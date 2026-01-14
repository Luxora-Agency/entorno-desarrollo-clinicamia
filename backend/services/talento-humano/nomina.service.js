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
      prisma.tHPeriodoNomina.findMany({
        where,
        include: {
          procesador: { select: { id: true, nombre: true, apellido: true } },
          _count: { select: { detalles: true } }
        },
        orderBy: [{ anio: 'desc' }, { mes: 'desc' }, { quincena: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHPeriodoNomina.count({ where })
    ]);

    // Map to camelCase
    const mappedData = data.map(p => ({
      id: p.id,
      anio: p.anio,
      mes: p.mes,
      quincena: p.quincena,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
      fechaPago: p.fechaPago,
      estado: p.estado,
      procesadoPor: p.procesador ? {
        id: p.procesador.id,
        nombre: p.procesador.nombre,
        apellido: p.procesador.apellido
      } : null,
      detallesCount: p._count.detalles
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
    const existing = await prisma.tHPeriodoNomina.findFirst({
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
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: new Date(data.fechaFin),
      fechaPago: new Date(data.fechaPago),
      estado: 'ABIERTO',
      observaciones: data.observaciones
    };

    return prisma.tHPeriodoNomina.create({ data: dbData });
  }

  /**
   * Obtener periodo con detalles
   */
  async getPeriodo(id) {
    const periodo = await prisma.tHPeriodoNomina.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            empleado: {
              select: { id: true, nombre: true, apellido: true, documento: true }
            }
          }
        },
        procesador: { select: { id: true, nombre: true, apellido: true } }
      }
    });

    if (!periodo) throw new NotFoundError('Periodo no encontrado');

    // Map to camelCase
    return {
      id: periodo.id,
      anio: periodo.anio,
      mes: periodo.mes,
      quincena: periodo.quincena,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      fechaPago: periodo.fechaPago,
      estado: periodo.estado,
      observaciones: periodo.observaciones,
      procesadoPor: periodo.procesador,
      fechaProceso: periodo.fechaProceso,
      detalles: periodo.detalles.map(d => ({
        id: d.id,
        empleadoId: d.empleadoId,
        empleado: d.empleado,
        salarioBase: d.salarioBase,
        auxTransporte: d.auxTransporte,
        horasExtras: d.horasExtras,
        comisiones: d.comisiones,
        bonificaciones: d.bonificaciones,
        otrosIngresos: d.otrosIngresos,
        totalDevengado: d.totalDevengado,
        saludEmpleado: d.saludEmpleado,
        pensionEmpleado: d.pensionEmpleado,
        fondoSolidaridad: d.fondoSolidaridad,
        retencionFuente: d.retencionFuente,
        embargos: d.embargos,
        prestamos: d.prestamos,
        otrosDescuentos: d.otrosDescuentos,
        totalDeducciones: d.totalDeducciones,
        netoPagar: d.netoPagar,
        saludEmpresa: d.saludEmpresa,
        pensionEmpresa: d.pensionEmpresa,
        arl: d.arl,
        cajaCompensacion: d.cajaCompensacion,
        sena: d.sena,
        icbf: d.icbf,
        cesantias: d.cesantias,
        intCesantias: d.intCesantias,
        prima: d.prima,
        vacacionesProv: d.vacacionesProv
      }))
    };
  }

  /**
   * Procesar nómina del periodo
   */
  async procesarNomina(periodoId, userId) {
    const periodo = await prisma.tHPeriodoNomina.findUnique({ where: { id: periodoId } });
    if (!periodo) throw new NotFoundError('Periodo no encontrado');

    if (periodo.estado !== 'ABIERTO') {
      throw new ValidationError('Solo se pueden procesar periodos abiertos');
    }

    // Obtener empleados activos con contrato vigente
    const empleados = await prisma.tHEmpleado.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        contratos: {
          where: { estado: 'ACTIVO' },
          take: 1
        },
        cargo: true
      }
    });

    // Obtener novedades del periodo
    const novedades = await prisma.tHNovedadNomina.findMany({
      where: {
        OR: [
          { periodoId: periodoId },
          { recurrente: true, estado: 'APROBADO' }
        ]
      }
    });

    const novedadesPorEmpleado = novedades.reduce((acc, n) => {
      if (!acc[n.empleadoId]) acc[n.empleadoId] = [];
      acc[n.empleadoId].push(n);
      return acc;
    }, {});

    // Calcular nómina por empleado
    const detalles = [];
    for (const empleado of empleados) {
      if (!empleado.contratos.length) continue;

      const contrato = empleado.contratos[0];
      const novedadesEmp = novedadesPorEmpleado[empleado.id] || [];

      // Mapear contrato y novedades a formato de cálculo
      const contratoCalc = {
        salarioBase: Number(contrato.salarioBase),
        auxTransporte: contrato.auxTransporte,
        tipoRiesgoARL: empleado.cargo?.riesgoArl || 'I',
        tipoCargo: empleado.cargo?.nivel || 'ADMINISTRATIVO'
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
        periodoId: periodoId,
        empleadoId: empleado.id,
        salarioBase: detalle.salarioBase,
        auxTransporte: detalle.auxTransporte,
        horasExtras: detalle.horasExtras,
        comisiones: detalle.comisiones,
        bonificaciones: detalle.bonificaciones,
        otrosIngresos: detalle.otrosIngresos,
        totalDevengado: detalle.totalDevengado,
        saludEmpleado: detalle.saludEmpleado,
        pensionEmpleado: detalle.pensionEmpleado,
        fondoSolidaridad: detalle.fondoSolidaridad,
        retencionFuente: detalle.retencionFuente,
        embargos: detalle.embargos,
        prestamos: detalle.prestamos,
        otrosDescuentos: detalle.otrosDescuentos,
        totalDeducciones: detalle.totalDeducciones,
        netoPagar: detalle.netoPagar,
        saludEmpresa: detalle.saludEmpresa,
        pensionEmpresa: detalle.pensionEmpresa,
        arl: detalle.arl,
        cajaCompensacion: detalle.cajaCompensacion,
        sena: detalle.sena,
        icbf: detalle.icbf,
        cesantias: detalle.cesantias,
        intCesantias: detalle.intCesantias,
        prima: detalle.prima,
        vacacionesProv: detalle.vacacionesProv
      });
    }

    // Eliminar detalles anteriores y crear nuevos
    await prisma.tHNominaDetalle.deleteMany({ where: { periodoId: periodoId } });
    if (detalles.length > 0) {
      await prisma.tHNominaDetalle.createMany({ data: detalles });
    }

    // Actualizar estado del periodo
    await prisma.tHPeriodoNomina.update({
      where: { id: periodoId },
      data: {
        estado: 'EN_PROCESO',
        procesadoPor: userId,
        fechaProceso: new Date()
      }
    });

    return this.getPeriodo(periodoId);
  }

  /**
   * Cerrar periodo de nómina
   */
  async cerrarPeriodo(id) {
    const periodo = await prisma.tHPeriodoNomina.findUnique({ where: { id } });
    if (!periodo) throw new NotFoundError('Periodo no encontrado');
    if (periodo.estado !== 'EN_PROCESO') {
      throw new ValidationError('El periodo debe estar en proceso para cerrarse');
    }

    return prisma.tHPeriodoNomina.update({
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
    const periodo = await prisma.tHPeriodoNomina.findUnique({
      where: { id: periodoId },
      include: { detalles: true }
    });

    if (!periodo) throw new NotFoundError('Periodo no encontrado');

    const resumen = periodo.detalles.reduce(
      (acc, d) => ({
        totalDevengado: acc.totalDevengado + Number(d.totalDevengado),
        totalDeducciones: acc.totalDeducciones + Number(d.totalDeducciones),
        netoPagar: acc.netoPagar + Number(d.netoPagar),
        aportesEmpresa:
          acc.aportesEmpresa +
          Number(d.saludEmpresa) +
          Number(d.pensionEmpresa) +
          Number(d.arl) +
          Number(d.cajaCompensacion) +
          Number(d.sena) +
          Number(d.icbf),
        provisiones:
          acc.provisiones +
          Number(d.cesantias) +
          Number(d.intCesantias) +
          Number(d.prima) +
          Number(d.vacacionesProv),
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
    if (empleadoId) where.empleadoId = empleadoId;
    if (periodoId) where.periodoId = periodoId;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      prisma.tHNovedadNomina.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tHNovedadNomina.count({ where })
    ]);

    return {
      data: data.map(n => ({
        id: n.id,
        tipo: n.tipo,
        valor: n.valor,
        cantidad: n.cantidad,
        observaciones: n.observaciones,
        estado: n.estado,
        fechaInicio: n.fechaInicio,
        empleadoId: n.empleadoId
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async createNovedad(data) {
    return prisma.tHNovedadNomina.create({
      data: {
        empleadoId: data.empleadoId,
        periodoId: data.periodoId,
        tipo: data.tipo,
        concepto: data.concepto || data.tipo,
        valor: data.valor,
        cantidad: data.cantidad,
        observaciones: data.observaciones,
        recurrente: data.recurrente || false,
        estado: 'PENDIENTE',
        fechaInicio: new Date()
      }
    });
  }

  async aprobarNovedad(id, userId) {
    const novedad = await prisma.tHNovedadNomina.findUnique({ where: { id } });
    if (!novedad) throw new NotFoundError('Novedad no encontrada');

    return prisma.tHNovedadNomina.update({
      where: { id },
      data: {
        estado: 'APROBADO',
        aprobadoPor: userId
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
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: empleadoId },
      include: {
        contratos: { where: { estado: 'ACTIVO' }, take: 1 }
      }
    });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    if (!empleado.contratos.length) throw new ValidationError('Empleado sin contrato activo');

    const contrato = empleado.contratos[0];

    // Preparar objeto empleado para el servicio de cálculo
    const empleadoData = {
      salarioBase: Number(contrato.salarioBase),
      auxTransporte: contrato.auxTransporte,
      tipoContrato: contrato.tipoContrato,
      fechaFinContrato: contrato.fechaFin
    };

    return calculosService.calcularLiquidacionDefinitiva(
      empleadoData,
      new Date(contrato.fechaInicio),
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
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: empleadoId },
      include: {
        contratos: { where: { estado: 'ACTIVO' }, take: 1 },
        cargo: true
      }
    });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    if (!empleado.contratos.length) throw new ValidationError('Empleado sin contrato activo');

    const contrato = empleado.contratos[0];
    const empleadoData = {
      salarioBase: Number(contrato.salarioBase),
      auxTransporte: contrato.auxTransporte,
      tipoRiesgoARL: empleado.cargo?.riesgoArl || 'I',
      tipoCargo: empleado.cargo?.nivel || 'ADMINISTRATIVO'
    };

    return calculosService.calcularNominaMensual(empleadoData, novedades);
  }
}

module.exports = new NominaService();
