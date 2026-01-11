/**
 * Servicio de Reportes Legales - Talento Humano
 * Genera reportes requeridos por la normatividad colombiana
 *
 * Reportes incluidos:
 * - Planilla PILA (Planilla Integrada de Liquidación de Aportes)
 * - Certificado Laboral
 * - Certificado de Ingresos y Retenciones
 * - Colilla de Pago
 * - Carta de Terminación de Contrato
 */
const prisma = require('../../db/prisma');
const NORMATIVA = require('../../config/normatividad-colombia-2025');
const calculosService = require('./calculos-laborales.service');

class ReportesLegalesService {
  constructor() {
    this.SMLV = NORMATIVA.SMLV_2025;
    this.UVT = NORMATIVA.RETENCION.UVT_2025;
  }

  // ============================================
  // PLANILLA PILA
  // ============================================

  /**
   * Generar datos para Planilla PILA
   * Formato requerido por el operador de información
   *
   * @param {string} periodoId - ID del periodo de nómina
   * @returns {object} Datos estructurados para PILA
   */
  async generarPILA(periodoId) {
    const periodo = await prisma.tHPeriodoNomina.findUnique({
      where: { id: periodoId },
      include: {
        detalles: {
          include: {
            empleado: {
              include: {
                cargo: true,
                contratos: {
                  where: { estado: 'ACTIVO' },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (!periodo) {
      throw new Error('Periodo no encontrado');
    }

    // Datos del aportante (empresa)
    const aportante = {
      tipoDocumento: 'NI', // NIT
      numeroDocumento: '900123456',  // Debe venir de configuración
      digitoVerificacion: '1',
      razonSocial: 'CLINICA MIA S.A.S',
      tipoAportante: '1', // Empleador
      direccion: 'CALLE 123 # 45-67',
      municipio: '11001', // Código DANE Bogotá
      departamento: '11',
      telefono: '6012345678',
      correo: 'contabilidad@clinicamia.com',
      representanteLegal: {
        tipoDocumento: 'CC',
        numeroDocumento: '12345678',
        nombre: 'JUAN PEREZ'
      }
    };

    // Periodo de cotización
    const periodoCotizacion = {
      anio: periodo.anio,
      mes: periodo.mes.toString().padStart(2, '0'),
      periodoPago: `${periodo.anio}-${periodo.mes.toString().padStart(2, '0')}`
    };

    // Cotizantes (empleados)
    const cotizantes = periodo.detalles.map(detalle => {
      const empleado = detalle.empleado;
      const contrato = empleado.contratos[0];

      // Determinar tipo de cotizante
      let tipoCotizante = '01'; // Dependiente
      if (contrato?.tipoContrato === 'APRENDIZAJE') {
        tipoCotizante = '12'; // Aprendiz SENA
      }

      // Determinar subtipo
      let subtipoCotizante = '00';
      if (contrato?.tipoContrato === 'PRESTACION_SERVICIOS') {
        subtipoCotizante = '01'; // Independiente
      }

      // Códigos de administradoras
      const codigosAdmin = {
        eps: empleado.eps || 'EPS001',
        afp: empleado.afp || 'AFP001',
        arl: 'ARL001',
        ccf: empleado.cajaCompensacion || 'CCF001'
      };

      return {
        // Identificación
        tipoDocumento: empleado.tipoDocumento === 'CC' ? 'CC' :
          empleado.tipoDocumento === 'CE' ? 'CE' :
            empleado.tipoDocumento === 'PA' ? 'PA' : 'CC',
        numeroDocumento: empleado.documento,
        primerApellido: empleado.apellido.split(' ')[0].toUpperCase(),
        segundoApellido: empleado.apellido.split(' ')[1]?.toUpperCase() || '',
        primerNombre: empleado.nombre.split(' ')[0].toUpperCase(),
        segundoNombre: empleado.nombre.split(' ')[1]?.toUpperCase() || '',

        // Tipo de cotizante
        tipoCotizante,
        subtipoCotizante,

        // Ubicación laboral
        departamentoUbicacion: '11', // Bogotá
        municipioUbicacion: '11001',

        // Tipo de contrato PILA
        tipoContratoPILA: this.mapearTipoContratoPILA(contrato?.tipoContrato),

        // Administradoras
        codigoEPS: codigosAdmin.eps,
        codigoAFP: codigosAdmin.afp,
        codigoARL: codigosAdmin.arl,
        codigoCCF: codigosAdmin.ccf,

        // Días cotizados
        diasCotizados: 30,

        // IBC y aportes
        ibcSalud: Math.round(Number(detalle.totalDevengado) - Number(detalle.auxTransporte)),
        ibcPension: Math.round(Number(detalle.totalDevengado) - Number(detalle.auxTransporte)),
        ibcARL: Math.round(Number(detalle.totalDevengado) - Number(detalle.auxTransporte)),
        ibcCCF: Math.round(Number(detalle.totalDevengado) - Number(detalle.auxTransporte)),

        // Tarifas
        tarifaSalud: 12.5,
        tarifaPension: 16,
        tarifaARL: this.obtenerTarifaARL(empleado.cargo?.codigo),
        tarifaCCF: 4,
        tarifaSENA: 2,
        tarifaICBF: 3,

        // Valores cotización
        cotizacionSalud: Math.round(Number(detalle.saludEmpleado) + Number(detalle.saludEmpresa)),
        cotizacionPension: Math.round(Number(detalle.pensionEmpleado) + Number(detalle.pensionEmpresa)),
        cotizacionARL: Math.round(Number(detalle.arl)),
        cotizacionCCF: Math.round(Number(detalle.cajaCompensacion)),
        cotizacionSENA: Math.round(Number(detalle.sena)),
        cotizacionICBF: Math.round(Number(detalle.icbf)),

        // Fondo de Solidaridad
        fondoSolidaridad: Math.round(Number(detalle.fondoSolidaridad)),

        // Total aportes
        totalAportes: Math.round(
          Number(detalle.saludEmpleado) + Number(detalle.saludEmpresa) +
          Number(detalle.pensionEmpleado) + Number(detalle.pensionEmpresa) +
          Number(detalle.arl) + Number(detalle.cajaCompensacion) +
          Number(detalle.sena) + Number(detalle.icbf) +
          Number(detalle.fondoSolidaridad)
        ),

        // Novedades
        novedades: {
          ingreso: false,
          retiro: false,
          trasladoDesdeEPS: false,
          trasladoAEPS: false,
          trasladoDesdeAFP: false,
          trasladoAAFP: false,
          variacionPermanenteSalario: false,
          suspencion: false,
          incapacidadGeneral: false,
          licenciaMaternidad: false,
          vacaciones: false,
          licenciaRemunerada: false,
          licenciaNoRemunerada: false,
          comision: false
        }
      };
    });

    // Totales
    const totales = cotizantes.reduce((acc, c) => ({
      totalCotizantes: acc.totalCotizantes + 1,
      totalIBCSalud: acc.totalIBCSalud + c.ibcSalud,
      totalIBCPension: acc.totalIBCPension + c.ibcPension,
      totalCotizacionSalud: acc.totalCotizacionSalud + c.cotizacionSalud,
      totalCotizacionPension: acc.totalCotizacionPension + c.cotizacionPension,
      totalCotizacionARL: acc.totalCotizacionARL + c.cotizacionARL,
      totalCotizacionParafiscales: acc.totalCotizacionParafiscales +
        c.cotizacionCCF + c.cotizacionSENA + c.cotizacionICBF,
      totalFondoSolidaridad: acc.totalFondoSolidaridad + c.fondoSolidaridad,
      totalGeneral: acc.totalGeneral + c.totalAportes
    }), {
      totalCotizantes: 0,
      totalIBCSalud: 0,
      totalIBCPension: 0,
      totalCotizacionSalud: 0,
      totalCotizacionPension: 0,
      totalCotizacionARL: 0,
      totalCotizacionParafiscales: 0,
      totalFondoSolidaridad: 0,
      totalGeneral: 0
    });

    return {
      formatoVersion: '1.0',
      fechaGeneracion: new Date().toISOString(),
      tipoArchivo: 'PILA',

      aportante,
      periodoCotizacion,
      cotizantes,
      totales,

      // Metadatos para el archivo plano
      estructura: {
        tipoArchivo: '01', // Planilla tipo E
        modalidadPlanilla: '1', // Activos
        fechaPago: periodo.fechaPago
      }
    };
  }

  /**
   * Mapear tipo de contrato a código PILA
   */
  mapearTipoContratoPILA(tipoContrato) {
    const mapeo = {
      'INDEFINIDO': '1',
      'FIJO': '2',
      'OBRA_LABOR': '3',
      'APRENDIZAJE': '4',
      'TEMPORAL': '5',
      'PRESTACION_SERVICIOS': '51' // Independiente
    };
    return mapeo[tipoContrato] || '1';
  }

  /**
   * Obtener tarifa ARL según cargo
   */
  obtenerTarifaARL(codigoCargo) {
    // Por defecto retornamos riesgo I para administrativos
    // En producción esto debería consultarse de la configuración del cargo
    return NORMATIVA.ARL.RIESGO_I * 100;
  }

  // ============================================
  // CERTIFICADO LABORAL
  // ============================================

  /**
   * Generar Certificado Laboral
   * Según Art. 57 numeral 7 del CST
   *
   * @param {string} empleadoId - ID del empleado
   * @param {string} dirigidoA - A quien va dirigido (opcional)
   * @returns {object} Datos del certificado
   */
  async generarCertificadoLaboral(empleadoId, dirigidoA = 'A QUIEN INTERESE') {
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: empleadoId },
      include: {
        cargo: true,
        departamentoRel: true,
        contratos: {
          where: { estado: 'ACTIVO' },
          take: 1,
          orderBy: { fechaInicio: 'desc' }
        }
      }
    });

    if (!empleado) {
      throw new Error('Empleado no encontrado');
    }

    const contrato = empleado.contratos[0];
    if (!contrato) {
      throw new Error('El empleado no tiene contrato activo');
    }

    const fechaExpedicion = new Date();
    const numeroConsecutivo = await this.obtenerConsecutivoCertificado();

    return {
      // Encabezado
      tipo: 'CERTIFICADO_LABORAL',
      numero: numeroConsecutivo,
      fechaExpedicion: fechaExpedicion.toISOString(),

      // Empresa
      empresa: {
        razonSocial: 'CLINICA MIA S.A.S',
        nit: '900.123.456-1',
        direccion: 'CALLE 123 # 45-67, BOGOTA D.C.',
        telefono: '(601) 234-5678',
        representanteLegal: {
          nombre: 'JUAN PEREZ GARCIA',
          cargo: 'GERENTE GENERAL',
          documento: 'C.C. 12.345.678'
        }
      },

      // Empleado
      empleado: {
        nombre: `${empleado.nombre} ${empleado.apellido}`.toUpperCase(),
        documento: `${empleado.tipoDocumento} ${empleado.documento}`,
        cargo: empleado.cargo?.nombre?.toUpperCase() || 'NO ESPECIFICADO',
        departamento: empleado.departamentoRel?.nombre?.toUpperCase() || 'NO ESPECIFICADO',
        tipoContrato: this.formatearTipoContrato(contrato.tipoContrato),
        fechaIngreso: contrato.fechaInicio,
        fechaRetiro: contrato.fechaFin || null,
        estado: empleado.estado,
        salarioActual: Number(contrato.salarioBase),
        salarioEnLetras: this.numeroALetras(Number(contrato.salarioBase))
      },

      // Texto del certificado
      contenido: this.generarTextoCertificadoLaboral(
        empleado,
        contrato,
        dirigidoA,
        fechaExpedicion
      ),

      // Metadatos
      dirigidoA,
      expedidoPor: {
        nombre: 'DEPARTAMENTO DE TALENTO HUMANO',
        firma: 'COORDINADOR DE TALENTO HUMANO'
      },

      // Notas legales
      notasLegales: [
        'Este certificado se expide a solicitud del interesado.',
        'Según el Artículo 57 numeral 7 del Código Sustantivo del Trabajo.',
        'Válido por 30 días a partir de la fecha de expedición.'
      ]
    };
  }

  /**
   * Generar texto completo del certificado laboral
   */
  generarTextoCertificadoLaboral(empleado, contrato, dirigidoA, fecha) {
    const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`.toUpperCase();
    const tipoDoc = empleado.tipoDocumento === 'CC' ? 'Cédula de Ciudadanía' :
      empleado.tipoDocumento === 'CE' ? 'Cédula de Extranjería' : 'Pasaporte';

    const fechaIngreso = new Date(contrato.fechaInicio);
    const fechaFormateada = this.formatearFechaLetras(fechaIngreso);

    let texto = `${dirigidoA}\n\n`;
    texto += `El suscrito Coordinador de Talento Humano de CLINICA MIA S.A.S., identificada con NIT 900.123.456-1, certifica que:\n\n`;

    texto += `${nombreCompleto}, identificado(a) con ${tipoDoc} No. ${empleado.documento}, `;

    if (empleado.estado === 'ACTIVO') {
      texto += `se encuentra vinculado(a) laboralmente con la empresa desde el ${fechaFormateada}, `;
      texto += `desempeñando actualmente el cargo de ${empleado.cargo?.nombre?.toUpperCase() || 'NO ESPECIFICADO'}, `;
      texto += `mediante contrato de trabajo a ${this.formatearTipoContrato(contrato.tipoContrato).toLowerCase()}, `;
      texto += `devengando un salario mensual de ${this.formatearMoneda(Number(contrato.salarioBase))} `;
      texto += `(${this.numeroALetras(Number(contrato.salarioBase)).toUpperCase()} PESOS M/CTE).\n\n`;
    } else {
      const fechaRetiro = contrato.fechaFin ? new Date(contrato.fechaFin) : new Date();
      texto += `estuvo vinculado(a) laboralmente con la empresa desde el ${fechaFormateada} `;
      texto += `hasta el ${this.formatearFechaLetras(fechaRetiro)}, `;
      texto += `desempeñando el cargo de ${empleado.cargo?.nombre?.toUpperCase() || 'NO ESPECIFICADO'}, `;
      texto += `mediante contrato de trabajo a ${this.formatearTipoContrato(contrato.tipoContrato).toLowerCase()}, `;
      texto += `devengando un último salario mensual de ${this.formatearMoneda(Number(contrato.salarioBase))} `;
      texto += `(${this.numeroALetras(Number(contrato.salarioBase)).toUpperCase()} PESOS M/CTE).\n\n`;
    }

    texto += `La presente certificación se expide a solicitud del interesado, en ${this.formatearFechaLetras(fecha)}.\n\n`;
    texto += `Atentamente,\n\n\n`;
    texto += `___________________________\n`;
    texto += `COORDINADOR DE TALENTO HUMANO\n`;
    texto += `CLINICA MIA S.A.S.`;

    return texto;
  }

  // ============================================
  // CERTIFICADO DE INGRESOS Y RETENCIONES
  // ============================================

  /**
   * Generar Certificado de Ingresos y Retenciones
   * Formulario 220 DIAN
   *
   * @param {string} empleadoId - ID del empleado
   * @param {number} anio - Año gravable
   * @returns {object} Datos del certificado
   */
  async generarCertificadoIngresosRetenciones(empleadoId, anio) {
    // Obtener empleado
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: empleadoId }
    });

    if (!empleado) {
      throw new Error('Empleado no encontrado');
    }

    // Obtener todos los periodos del año
    const periodos = await prisma.tHPeriodoNomina.findMany({
      where: { anio },
      include: {
        detalles: {
          where: { empleadoId }
        }
      }
    });

    // Consolidar ingresos del año
    const consolidado = periodos.reduce((acc, periodo) => {
      const detalle = periodo.detalles[0];
      if (!detalle) return acc;

      return {
        salarios: acc.salarios + Number(detalle.salarioBase),
        horasExtras: acc.horasExtras + (
          Number(detalle.horasExtras?.diurnas || 0) +
          Number(detalle.horasExtras?.nocturnas || 0) +
          Number(detalle.horasExtras?.dominicales || 0)
        ),
        comisiones: acc.comisiones + Number(detalle.comisiones),
        auxTransporte: acc.auxTransporte + Number(detalle.auxTransporte),
        bonificaciones: acc.bonificaciones + Number(detalle.bonificaciones),
        otrosIngresos: acc.otrosIngresos + Number(detalle.otrosIngresos),
        cesantias: acc.cesantias + Number(detalle.cesantias),
        interesesCesantias: acc.interesesCesantias + Number(detalle.intCesantias),
        prima: acc.prima + Number(detalle.prima),
        vacaciones: acc.vacaciones + Number(detalle.vacacionesProv),
        aporteSalud: acc.aporteSalud + Number(detalle.saludEmpleado),
        aportePension: acc.aportePension + Number(detalle.pensionEmpleado),
        fondoSolidaridad: acc.fondoSolidaridad + Number(detalle.fondoSolidaridad),
        retencionFuente: acc.retencionFuente + Number(detalle.retencionFuente),
        mesesTrabajados: acc.mesesTrabajados + 1
      };
    }, {
      salarios: 0,
      horasExtras: 0,
      comisiones: 0,
      auxTransporte: 0,
      bonificaciones: 0,
      otrosIngresos: 0,
      cesantias: 0,
      interesesCesantias: 0,
      prima: 0,
      vacaciones: 0,
      aporteSalud: 0,
      aportePension: 0,
      fondoSolidaridad: 0,
      retencionFuente: 0,
      mesesTrabajados: 0
    });

    // Calcular totales
    const ingresosLaborales = consolidado.salarios + consolidado.horasExtras +
      consolidado.comisiones + consolidado.bonificaciones +
      consolidado.otrosIngresos;

    const prestacionesSociales = consolidado.cesantias +
      consolidado.interesesCesantias + consolidado.prima + consolidado.vacaciones;

    const totalIngresosBrutos = ingresosLaborales + prestacionesSociales +
      consolidado.auxTransporte;

    const totalAportes = consolidado.aporteSalud + consolidado.aportePension +
      consolidado.fondoSolidaridad;

    const uvtAnio = NORMATIVA.RETENCION.UVT_2025;

    return {
      // Encabezado
      tipo: 'CERTIFICADO_INGRESOS_RETENCIONES',
      anioGravable: anio,
      fechaExpedicion: new Date().toISOString(),

      // Agente retenedor
      agenteRetenedor: {
        razonSocial: 'CLINICA MIA S.A.S',
        nit: '900123456',
        dv: '1',
        direccion: 'CALLE 123 # 45-67, BOGOTA D.C.',
        ciudad: 'BOGOTA'
      },

      // Beneficiario (empleado)
      beneficiario: {
        nombre: `${empleado.nombre} ${empleado.apellido}`.toUpperCase(),
        tipoDocumento: empleado.tipoDocumento,
        documento: empleado.documento,
        direccion: empleado.direccion || 'NO REGISTRADA',
        ciudad: empleado.ciudad || 'BOGOTA'
      },

      // Concepto de los ingresos
      conceptoIngreso: 'PAGOS LABORALES',

      // Renglones del certificado (similar a Formulario 220)
      renglones: {
        // Sección: Pagos
        pagosOIngresosPorConceptoDeSalarios: Math.round(consolidado.salarios),
        pagosRealizadosConBonosDePapel: 0,
        pagosPorCesantias: Math.round(consolidado.cesantias),
        pagosPorInteresesDeCesantias: Math.round(consolidado.interesesCesantias),
        pagosPorPrima: Math.round(consolidado.prima),
        pagosPorVacaciones: Math.round(consolidado.vacaciones),
        pagosPorViaticosPermanentes: 0,
        pagosPorGastosRepresentacion: 0,
        pagosPorComisiones: Math.round(consolidado.comisiones),
        pagosPorHorasExtras: Math.round(consolidado.horasExtras),
        pagosPorBonificaciones: Math.round(consolidado.bonificaciones),
        pagosPorAuxilioTransporte: Math.round(consolidado.auxTransporte),
        otrosPagos: Math.round(consolidado.otrosIngresos),
        totalPagos: Math.round(totalIngresosBrutos),

        // Sección: Retenciones
        aporteObligatorioSalud: Math.round(consolidado.aporteSalud),
        aporteObligatorioPension: Math.round(consolidado.aportePension),
        aporteVoluntarioPension: 0,
        aporteVoluntarioAFC: 0,
        valorRetenidoRentaTrabajoGravado: Math.round(consolidado.retencionFuente),
        valorRetenidoRentaTrabajoExento: 0,
        totalRetencionesFuente: Math.round(consolidado.retencionFuente)
      },

      // Información adicional
      informacionAdicional: {
        mesesTrabajados: consolidado.mesesTrabajados,
        uvtAplicado: uvtAnio,
        metodoProcedimiento: 1,
        porcentajeRetencion: consolidado.retencionFuente > 0 ?
          ((consolidado.retencionFuente / ingresosLaborales) * 100).toFixed(2) : '0.00'
      },

      // Totales resumen
      totales: {
        totalIngresosBrutos: Math.round(totalIngresosBrutos),
        totalAportesObligatorios: Math.round(totalAportes),
        ingresoBaseRetencion: Math.round(ingresosLaborales - totalAportes),
        totalRetenido: Math.round(consolidado.retencionFuente)
      },

      // Notas
      notas: [
        'Este certificado se expide de conformidad con el Artículo 378 del Estatuto Tributario.',
        `Valor UVT aplicado: ${this.formatearMoneda(uvtAnio)}`,
        'Conservar por 5 años para efectos de la declaración de renta.'
      ]
    };
  }

  // ============================================
  // COLILLA DE PAGO
  // ============================================

  /**
   * Generar Colilla de Pago detallada
   *
   * @param {string} empleadoId - ID del empleado
   * @param {string} periodoId - ID del periodo
   * @returns {object} Colilla de pago
   */
  async generarColillaPago(empleadoId, periodoId) {
    const detalle = await prisma.tHNominaDetalle.findUnique({
      where: {
        periodoId_empleadoId: { periodoId, empleadoId }
      },
      include: {
        empleado: {
          include: {
            cargo: true,
            departamentoRel: true,
            contratos: {
              where: { estado: 'ACTIVO' },
              take: 1
            }
          }
        },
        periodo: true
      }
    });

    if (!detalle) {
      throw new Error('Colilla no encontrada');
    }

    const empleado = detalle.empleado;
    const periodo = detalle.periodo;
    const contrato = empleado.contratos[0];

    // Formatear periodo
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const periodoTexto = periodo.quincena ?
      `${periodo.quincena}ª Quincena de ${meses[periodo.mes - 1]} ${periodo.anio}` :
      `${meses[periodo.mes - 1]} ${periodo.anio}`;

    return {
      // Encabezado
      tipo: 'COLILLA_PAGO',
      numero: `COL-${periodo.anio}${periodo.mes.toString().padStart(2, '0')}-${empleado.documento}`,
      fechaGeneracion: new Date().toISOString(),

      // Empresa
      empresa: {
        razonSocial: 'CLINICA MIA S.A.S',
        nit: '900.123.456-1',
        direccion: 'CALLE 123 # 45-67, BOGOTA D.C.'
      },

      // Periodo
      periodo: {
        descripcion: periodoTexto,
        anio: periodo.anio,
        mes: periodo.mes,
        quincena: periodo.quincena,
        fechaInicio: periodo.fechaInicio,
        fechaFin: periodo.fechaFin,
        fechaPago: periodo.fechaPago
      },

      // Empleado
      empleado: {
        nombre: `${empleado.nombre} ${empleado.apellido}`,
        documento: `${empleado.tipoDocumento} ${empleado.documento}`,
        cargo: empleado.cargo?.nombre || 'No especificado',
        departamento: empleado.departamentoRel?.nombre || 'No especificado',
        fechaIngreso: empleado.fechaIngreso,
        tipoContrato: this.formatearTipoContrato(contrato?.tipoContrato),
        // Datos bancarios (enmascarados)
        banco: empleado.banco || 'No registrado',
        tipoCuenta: empleado.tipoCuenta || 'No registrada',
        numeroCuenta: empleado.numeroCuenta ?
          `****${empleado.numeroCuenta.slice(-4)}` : 'No registrada'
      },

      // Devengados
      devengados: [
        { concepto: 'Salario Básico', dias: 30, valor: Number(detalle.salarioBase) },
        ...(Number(detalle.auxTransporte) > 0 ? [
          { concepto: 'Auxilio de Transporte', dias: 30, valor: Number(detalle.auxTransporte) }
        ] : []),
        ...(detalle.horasExtras?.diurnas > 0 ? [
          { concepto: 'Horas Extras Diurnas', cantidad: detalle.horasExtras.diurnas, valor: Number(detalle.horasExtras.diurnas) }
        ] : []),
        ...(detalle.horasExtras?.nocturnas > 0 ? [
          { concepto: 'Horas Extras Nocturnas', cantidad: detalle.horasExtras.nocturnas, valor: Number(detalle.horasExtras.nocturnas) }
        ] : []),
        ...(Number(detalle.comisiones) > 0 ? [
          { concepto: 'Comisiones', valor: Number(detalle.comisiones) }
        ] : []),
        ...(Number(detalle.bonificaciones) > 0 ? [
          { concepto: 'Bonificaciones', valor: Number(detalle.bonificaciones) }
        ] : []),
        ...(Number(detalle.otrosIngresos) > 0 ? [
          { concepto: 'Otros Ingresos', valor: Number(detalle.otrosIngresos) }
        ] : [])
      ],

      // Deducciones
      deducciones: [
        { concepto: 'Aporte Salud (4%)', valor: Number(detalle.saludEmpleado) },
        { concepto: 'Aporte Pensión (4%)', valor: Number(detalle.pensionEmpleado) },
        ...(Number(detalle.fondoSolidaridad) > 0 ? [
          { concepto: 'Fondo de Solidaridad', valor: Number(detalle.fondoSolidaridad) }
        ] : []),
        ...(Number(detalle.retencionFuente) > 0 ? [
          { concepto: 'Retención en la Fuente', valor: Number(detalle.retencionFuente) }
        ] : []),
        ...(Number(detalle.embargos) > 0 ? [
          { concepto: 'Embargos Judiciales', valor: Number(detalle.embargos) }
        ] : []),
        ...(Number(detalle.prestamos) > 0 ? [
          { concepto: 'Préstamos Empresa', valor: Number(detalle.prestamos) }
        ] : []),
        ...(Number(detalle.otrosDescuentos) > 0 ? [
          { concepto: 'Otros Descuentos', valor: Number(detalle.otrosDescuentos) }
        ] : [])
      ],

      // Provisiones (informativas)
      provisiones: [
        { concepto: 'Cesantías', valor: Number(detalle.cesantias) },
        { concepto: 'Intereses Cesantías', valor: Number(detalle.intCesantias) },
        { concepto: 'Prima de Servicios', valor: Number(detalle.prima) },
        { concepto: 'Vacaciones', valor: Number(detalle.vacacionesProv) }
      ],

      // Aportes patronales (informativos)
      aportesPatronales: [
        { concepto: 'Salud Empleador (8.5%)', valor: Number(detalle.saludEmpresa) },
        { concepto: 'Pensión Empleador (12%)', valor: Number(detalle.pensionEmpresa) },
        { concepto: 'ARL', valor: Number(detalle.arl) },
        { concepto: 'Caja de Compensación (4%)', valor: Number(detalle.cajaCompensacion) },
        { concepto: 'SENA (2%)', valor: Number(detalle.sena) },
        { concepto: 'ICBF (3%)', valor: Number(detalle.icbf) }
      ],

      // Totales
      totales: {
        totalDevengado: Number(detalle.totalDevengado),
        totalDeducciones: Number(detalle.totalDeducciones),
        netoPagar: Number(detalle.netoPagar),
        netoPagarLetras: this.numeroALetras(Number(detalle.netoPagar))
      },

      // Nota de confidencialidad
      notaConfidencialidad: 'Este documento es personal y confidencial. Contiene información salarial protegida por ley. Cualquier inquietud comunicarse con el área de Talento Humano.'
    };
  }

  // ============================================
  // UTILIDADES
  // ============================================

  formatearTipoContrato(tipo) {
    const mapeo = {
      'INDEFINIDO': 'Término Indefinido',
      'FIJO': 'Término Fijo',
      'OBRA_LABOR': 'Obra o Labor',
      'PRESTACION_SERVICIOS': 'Prestación de Servicios',
      'APRENDIZAJE': 'Aprendizaje SENA',
      'TEMPORAL': 'Temporal'
    };
    return mapeo[tipo] || tipo;
  }

  formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  formatearFechaLetras(fecha) {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    return `${dia} de ${mes} de ${anio}`;
  }

  async obtenerConsecutivoCertificado() {
    // En producción esto vendría de una tabla de consecutivos
    const anio = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    return `CL-${anio}-${random.toString().padStart(5, '0')}`;
  }

  numeroALetras(numero) {
    const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    const convertirMiles = (n) => {
      if (n === 0) return '';
      if (n === 1) return 'mil';
      if (n < 10) return unidades[n] + ' mil';
      if (n < 20) return especiales[n - 10] + ' mil';
      if (n < 100) {
        const d = Math.floor(n / 10);
        const u = n % 10;
        if (u === 0) return decenas[d] + ' mil';
        return decenas[d] + ' y ' + unidades[u] + ' mil';
      }
      if (n === 100) return 'cien mil';
      const c = Math.floor(n / 100);
      const resto = n % 100;
      if (resto === 0) return centenas[c] + ' mil';
      return centenas[c] + ' ' + convertirMiles(resto).replace(' mil', '') + ' mil';
    };

    const convertirCentenas = (n) => {
      if (n === 0) return '';
      if (n < 10) return unidades[n];
      if (n < 20) return especiales[n - 10];
      if (n < 100) {
        const d = Math.floor(n / 10);
        const u = n % 10;
        if (u === 0) return decenas[d];
        if (d === 2) return 'veinti' + unidades[u];
        return decenas[d] + ' y ' + unidades[u];
      }
      if (n === 100) return 'cien';
      const c = Math.floor(n / 100);
      const resto = n % 100;
      if (resto === 0) return centenas[c];
      return centenas[c] + ' ' + convertirCentenas(resto);
    };

    if (numero === 0) return 'cero pesos';

    const entero = Math.floor(numero);
    const millones = Math.floor(entero / 1000000);
    const miles = Math.floor((entero % 1000000) / 1000);
    const unidadesVal = entero % 1000;

    let resultado = '';

    if (millones > 0) {
      if (millones === 1) {
        resultado += 'un millón ';
      } else {
        resultado += convertirCentenas(millones) + ' millones ';
      }
    }

    if (miles > 0) {
      resultado += convertirMiles(miles) + ' ';
    }

    if (unidadesVal > 0) {
      resultado += convertirCentenas(unidadesVal);
    }

    return resultado.trim() + ' pesos';
  }
}

module.exports = new ReportesLegalesService();
