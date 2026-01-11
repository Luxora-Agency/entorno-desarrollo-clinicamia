/**
 * Plan de Cuentas Service
 * Gestión del Plan Único de Cuentas (PUC) Colombia con sincronización Siigo
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

// PUC Colombia - Estructura base
const PUC_ESTRUCTURA = {
  '1': { nombre: 'ACTIVO', tipo: 'Activo', naturaleza: 'Débito' },
  '11': { nombre: 'DISPONIBLE', tipo: 'Activo', naturaleza: 'Débito' },
  '1105': { nombre: 'CAJA', tipo: 'Activo', naturaleza: 'Débito' },
  '110505': { nombre: 'Caja general', tipo: 'Activo', naturaleza: 'Débito' },
  '110510': { nombre: 'Cajas menores', tipo: 'Activo', naturaleza: 'Débito' },
  '1110': { nombre: 'BANCOS', tipo: 'Activo', naturaleza: 'Débito' },
  '111005': { nombre: 'Moneda nacional', tipo: 'Activo', naturaleza: 'Débito' },
  '12': { nombre: 'INVERSIONES', tipo: 'Activo', naturaleza: 'Débito' },
  '13': { nombre: 'DEUDORES', tipo: 'Activo', naturaleza: 'Débito' },
  '1305': { nombre: 'CLIENTES', tipo: 'Activo', naturaleza: 'Débito' },
  '130505': { nombre: 'Nacionales', tipo: 'Activo', naturaleza: 'Débito' },
  '1355': { nombre: 'ANTICIPOS Y AVANCES', tipo: 'Activo', naturaleza: 'Débito' },
  '1365': { nombre: 'CUENTAS POR COBRAR A TRABAJADORES', tipo: 'Activo', naturaleza: 'Débito' },
  '1380': { nombre: 'DEUDORES VARIOS', tipo: 'Activo', naturaleza: 'Débito' },
  '14': { nombre: 'INVENTARIOS', tipo: 'Activo', naturaleza: 'Débito' },
  '1435': { nombre: 'MERCANCÍAS NO FABRICADAS POR LA EMPRESA', tipo: 'Activo', naturaleza: 'Débito' },
  '143505': { nombre: 'Medicamentos', tipo: 'Activo', naturaleza: 'Débito' },
  '143510': { nombre: 'Insumos médicos', tipo: 'Activo', naturaleza: 'Débito' },
  '15': { nombre: 'PROPIEDADES, PLANTA Y EQUIPO', tipo: 'Activo', naturaleza: 'Débito' },
  '1516': { nombre: 'CONSTRUCCIONES Y EDIFICACIONES', tipo: 'Activo', naturaleza: 'Débito' },
  '1520': { nombre: 'MAQUINARIA Y EQUIPO', tipo: 'Activo', naturaleza: 'Débito' },
  '1524': { nombre: 'EQUIPO DE OFICINA', tipo: 'Activo', naturaleza: 'Débito' },
  '1528': { nombre: 'EQUIPO DE COMPUTACIÓN Y COMUNICACIÓN', tipo: 'Activo', naturaleza: 'Débito' },
  '1532': { nombre: 'EQUIPO MÉDICO-CIENTÍFICO', tipo: 'Activo', naturaleza: 'Débito' },
  '1540': { nombre: 'FLOTA Y EQUIPO DE TRANSPORTE', tipo: 'Activo', naturaleza: 'Débito' },
  '1592': { nombre: 'DEPRECIACIÓN ACUMULADA', tipo: 'Activo', naturaleza: 'Crédito' },
  '159215': { nombre: 'Equipo médico científico', tipo: 'Activo', naturaleza: 'Crédito' },
  '159220': { nombre: 'Maquinaria y equipo', tipo: 'Activo', naturaleza: 'Crédito' },
  '159225': { nombre: 'Equipo de computación', tipo: 'Activo', naturaleza: 'Crédito' },
  '17': { nombre: 'DIFERIDOS', tipo: 'Activo', naturaleza: 'Débito' },

  '2': { nombre: 'PASIVO', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '21': { nombre: 'OBLIGACIONES FINANCIERAS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '22': { nombre: 'PROVEEDORES', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2205': { nombre: 'NACIONALES', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '220505': { nombre: 'Proveedores nacionales', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '23': { nombre: 'CUENTAS POR PAGAR', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2335': { nombre: 'COSTOS Y GASTOS POR PAGAR', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2365': { nombre: 'RETENCIÓN EN LA FUENTE', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '236505': { nombre: 'Salarios y pagos laborales', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '236515': { nombre: 'Honorarios', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '236520': { nombre: 'Comisiones', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '236525': { nombre: 'Servicios', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '236530': { nombre: 'Arrendamientos', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '236540': { nombre: 'Compras', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2367': { nombre: 'IMPUESTO A LAS VENTAS RETENIDO', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2368': { nombre: 'IMPUESTO DE INDUSTRIA Y COMERCIO RETENIDO', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2370': { nombre: 'RETENCIONES Y APORTES DE NÓMINA', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '237005': { nombre: 'Aportes a EPS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '237006': { nombre: 'Aportes a ARL', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '237010': { nombre: 'Aportes a pensiones', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '237025': { nombre: 'Embargos judiciales', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '237045': { nombre: 'Fondos de cesantías', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2380': { nombre: 'ACREEDORES VARIOS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '24': { nombre: 'IMPUESTOS, GRAVÁMENES Y TASAS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2404': { nombre: 'DE RENTA Y COMPLEMENTARIOS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2408': { nombre: 'IMPUESTO SOBRE LAS VENTAS POR PAGAR', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '240802': { nombre: 'IVA descontable', tipo: 'Pasivo', naturaleza: 'Débito' },
  '240804': { nombre: 'IVA generado', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '25': { nombre: 'OBLIGACIONES LABORALES', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2505': { nombre: 'SALARIOS POR PAGAR', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2510': { nombre: 'CESANTÍAS CONSOLIDADAS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2515': { nombre: 'INTERESES SOBRE CESANTÍAS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2520': { nombre: 'PRIMA DE SERVICIOS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2525': { nombre: 'VACACIONES CONSOLIDADAS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '26': { nombre: 'PASIVOS ESTIMADOS Y PROVISIONES', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2610': { nombre: 'PARA OBLIGACIONES LABORALES', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '261005': { nombre: 'Cesantías', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '261010': { nombre: 'Intereses sobre cesantías', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '261015': { nombre: 'Vacaciones', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '261020': { nombre: 'Prima de servicios', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '27': { nombre: 'DIFERIDOS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '28': { nombre: 'OTROS PASIVOS', tipo: 'Pasivo', naturaleza: 'Crédito' },
  '2805': { nombre: 'ANTICIPOS Y AVANCES RECIBIDOS', tipo: 'Pasivo', naturaleza: 'Crédito' },

  '3': { nombre: 'PATRIMONIO', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '31': { nombre: 'CAPITAL SOCIAL', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '3105': { nombre: 'CAPITAL SUSCRITO Y PAGADO', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '32': { nombre: 'SUPERÁVIT DE CAPITAL', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '33': { nombre: 'RESERVAS', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '3305': { nombre: 'RESERVAS OBLIGATORIAS', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '34': { nombre: 'REVALORIZACIÓN DEL PATRIMONIO', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '36': { nombre: 'RESULTADOS DEL EJERCICIO', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '3605': { nombre: 'UTILIDAD DEL EJERCICIO', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '3610': { nombre: 'PÉRDIDA DEL EJERCICIO', tipo: 'Patrimonio', naturaleza: 'Débito' },
  '37': { nombre: 'RESULTADOS DE EJERCICIOS ANTERIORES', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '3705': { nombre: 'UTILIDADES ACUMULADAS', tipo: 'Patrimonio', naturaleza: 'Crédito' },
  '3710': { nombre: 'PÉRDIDAS ACUMULADAS', tipo: 'Patrimonio', naturaleza: 'Débito' },

  '4': { nombre: 'INGRESOS', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '41': { nombre: 'OPERACIONALES', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '4105': { nombre: 'ACTIVIDADES DE SALUD', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '410505': { nombre: 'Consultas médicas', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '410510': { nombre: 'Procedimientos', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '410515': { nombre: 'Hospitalización', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '410520': { nombre: 'Urgencias', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '410525': { nombre: 'Laboratorio clínico', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '410530': { nombre: 'Imagenología', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '410535': { nombre: 'Cirugías', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '410540': { nombre: 'Venta de medicamentos', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '42': { nombre: 'NO OPERACIONALES', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '4210': { nombre: 'FINANCIEROS', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '421005': { nombre: 'Intereses', tipo: 'Ingreso', naturaleza: 'Crédito' },
  '4295': { nombre: 'DIVERSOS', tipo: 'Ingreso', naturaleza: 'Crédito' },

  '5': { nombre: 'GASTOS', tipo: 'Gasto', naturaleza: 'Débito' },
  '51': { nombre: 'OPERACIONALES DE ADMINISTRACIÓN', tipo: 'Gasto', naturaleza: 'Débito' },
  '5105': { nombre: 'GASTOS DE PERSONAL', tipo: 'Gasto', naturaleza: 'Débito' },
  '510503': { nombre: 'Salario integral', tipo: 'Gasto', naturaleza: 'Débito' },
  '510506': { nombre: 'Sueldos', tipo: 'Gasto', naturaleza: 'Débito' },
  '510515': { nombre: 'Horas extras', tipo: 'Gasto', naturaleza: 'Débito' },
  '510518': { nombre: 'Comisiones', tipo: 'Gasto', naturaleza: 'Débito' },
  '510527': { nombre: 'Auxilio de transporte', tipo: 'Gasto', naturaleza: 'Débito' },
  '510530': { nombre: 'Cesantías', tipo: 'Gasto', naturaleza: 'Débito' },
  '510533': { nombre: 'Intereses sobre cesantías', tipo: 'Gasto', naturaleza: 'Débito' },
  '510536': { nombre: 'Prima de servicios', tipo: 'Gasto', naturaleza: 'Débito' },
  '510539': { nombre: 'Vacaciones', tipo: 'Gasto', naturaleza: 'Débito' },
  '510568': { nombre: 'Aportes a ARL', tipo: 'Gasto', naturaleza: 'Débito' },
  '510569': { nombre: 'Aportes a EPS', tipo: 'Gasto', naturaleza: 'Débito' },
  '510570': { nombre: 'Aportes a pensiones', tipo: 'Gasto', naturaleza: 'Débito' },
  '510572': { nombre: 'Aportes cajas de compensación', tipo: 'Gasto', naturaleza: 'Débito' },
  '510575': { nombre: 'Aportes ICBF', tipo: 'Gasto', naturaleza: 'Débito' },
  '510578': { nombre: 'SENA', tipo: 'Gasto', naturaleza: 'Débito' },
  '5110': { nombre: 'HONORARIOS', tipo: 'Gasto', naturaleza: 'Débito' },
  '5115': { nombre: 'IMPUESTOS', tipo: 'Gasto', naturaleza: 'Débito' },
  '5120': { nombre: 'ARRENDAMIENTOS', tipo: 'Gasto', naturaleza: 'Débito' },
  '5130': { nombre: 'SEGUROS', tipo: 'Gasto', naturaleza: 'Débito' },
  '5135': { nombre: 'SERVICIOS', tipo: 'Gasto', naturaleza: 'Débito' },
  '513505': { nombre: 'Aseo y vigilancia', tipo: 'Gasto', naturaleza: 'Débito' },
  '513525': { nombre: 'Acueducto y alcantarillado', tipo: 'Gasto', naturaleza: 'Débito' },
  '513530': { nombre: 'Energía eléctrica', tipo: 'Gasto', naturaleza: 'Débito' },
  '513535': { nombre: 'Teléfono', tipo: 'Gasto', naturaleza: 'Débito' },
  '513595': { nombre: 'Otros servicios', tipo: 'Gasto', naturaleza: 'Débito' },
  '5140': { nombre: 'GASTOS LEGALES', tipo: 'Gasto', naturaleza: 'Débito' },
  '5145': { nombre: 'MANTENIMIENTO Y REPARACIONES', tipo: 'Gasto', naturaleza: 'Débito' },
  '514505': { nombre: 'Terrenos', tipo: 'Gasto', naturaleza: 'Débito' },
  '514510': { nombre: 'Construcciones y edificaciones', tipo: 'Gasto', naturaleza: 'Débito' },
  '514515': { nombre: 'Maquinaria y equipo', tipo: 'Gasto', naturaleza: 'Débito' },
  '514520': { nombre: 'Equipo de oficina', tipo: 'Gasto', naturaleza: 'Débito' },
  '514525': { nombre: 'Equipo de computación', tipo: 'Gasto', naturaleza: 'Débito' },
  '514530': { nombre: 'Equipo médico', tipo: 'Gasto', naturaleza: 'Débito' },
  '5150': { nombre: 'ADECUACIÓN E INSTALACIÓN', tipo: 'Gasto', naturaleza: 'Débito' },
  '5155': { nombre: 'GASTOS DE VIAJE', tipo: 'Gasto', naturaleza: 'Débito' },
  '5160': { nombre: 'DEPRECIACIONES', tipo: 'Gasto', naturaleza: 'Débito' },
  '516010': { nombre: 'Construcciones y edificaciones', tipo: 'Gasto', naturaleza: 'Débito' },
  '516015': { nombre: 'Maquinaria y equipo', tipo: 'Gasto', naturaleza: 'Débito' },
  '516020': { nombre: 'Equipo de oficina', tipo: 'Gasto', naturaleza: 'Débito' },
  '516025': { nombre: 'Equipo de computación', tipo: 'Gasto', naturaleza: 'Débito' },
  '516030': { nombre: 'Equipo médico-científico', tipo: 'Gasto', naturaleza: 'Débito' },
  '516035': { nombre: 'Flota y equipo de transporte', tipo: 'Gasto', naturaleza: 'Débito' },
  '5165': { nombre: 'AMORTIZACIONES', tipo: 'Gasto', naturaleza: 'Débito' },
  '5195': { nombre: 'DIVERSOS', tipo: 'Gasto', naturaleza: 'Débito' },
  '519510': { nombre: 'Libros y suscripciones', tipo: 'Gasto', naturaleza: 'Débito' },
  '519520': { nombre: 'Gastos de representación', tipo: 'Gasto', naturaleza: 'Débito' },
  '519525': { nombre: 'Elementos de aseo y cafetería', tipo: 'Gasto', naturaleza: 'Débito' },
  '519530': { nombre: 'Útiles, papelería y fotocopias', tipo: 'Gasto', naturaleza: 'Débito' },
  '519595': { nombre: 'Otros', tipo: 'Gasto', naturaleza: 'Débito' },
  '52': { nombre: 'OPERACIONALES DE VENTAS', tipo: 'Gasto', naturaleza: 'Débito' },
  '53': { nombre: 'NO OPERACIONALES', tipo: 'Gasto', naturaleza: 'Débito' },
  '5305': { nombre: 'FINANCIEROS', tipo: 'Gasto', naturaleza: 'Débito' },
  '530505': { nombre: 'Gastos bancarios', tipo: 'Gasto', naturaleza: 'Débito' },
  '530515': { nombre: 'Comisiones', tipo: 'Gasto', naturaleza: 'Débito' },
  '530520': { nombre: 'Intereses', tipo: 'Gasto', naturaleza: 'Débito' },
  '5395': { nombre: 'GASTOS DIVERSOS', tipo: 'Gasto', naturaleza: 'Débito' },

  '6': { nombre: 'COSTOS DE VENTAS', tipo: 'Gasto', naturaleza: 'Débito' },
  '61': { nombre: 'COSTO DE VENTAS Y PRESTACIÓN DE SERVICIOS', tipo: 'Gasto', naturaleza: 'Débito' },
  '6105': { nombre: 'SERVICIOS DE SALUD', tipo: 'Gasto', naturaleza: 'Débito' },
  '610505': { nombre: 'Costo medicamentos', tipo: 'Gasto', naturaleza: 'Débito' },
  '610510': { nombre: 'Costo insumos médicos', tipo: 'Gasto', naturaleza: 'Débito' },
  '610515': { nombre: 'Honorarios médicos', tipo: 'Gasto', naturaleza: 'Débito' }
};

class PlanCuentasService {
  /**
   * Inicializar PUC base en la base de datos
   */
  async inicializarPUC() {
    const cuentas = [];

    for (const [codigo, data] of Object.entries(PUC_ESTRUCTURA)) {
      cuentas.push({
        codigo,
        nombre: data.nombre,
        tipo: data.tipo,
        naturaleza: data.naturaleza,
        nivel: codigo.length <= 2 ? 1 : codigo.length <= 4 ? 2 : codigo.length <= 6 ? 3 : 4,
        activa: true
      });
    }

    // Upsert todas las cuentas
    for (const cuenta of cuentas) {
      await prisma.cuentaContable.upsert({
        where: { codigo: cuenta.codigo },
        update: cuenta,
        create: cuenta
      });
    }

    return { cuentasCreadas: cuentas.length };
  }

  /**
   * Obtener todas las cuentas
   */
  async getAll(filters = {}) {
    const where = { activa: true };

    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.nivel) where.nivel = parseInt(filters.nivel);
    if (filters.search) {
      where.OR = [
        { codigo: { contains: filters.search } },
        { nombre: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const cuentas = await prisma.cuentaContable.findMany({
      where,
      orderBy: { codigo: 'asc' }
    });

    return cuentas;
  }

  /**
   * Obtener cuenta por código
   */
  async getByCodigo(codigo) {
    const cuenta = await prisma.cuentaContable.findUnique({
      where: { codigo }
    });

    if (!cuenta) {
      throw new NotFoundError(`Cuenta ${codigo} no encontrada`);
    }

    return cuenta;
  }

  /**
   * Obtener estructura jerárquica del PUC
   */
  async getArbol(codigoPadre = null) {
    const nivel = codigoPadre ? codigoPadre.length + 2 : 1;
    const prefijo = codigoPadre || '';

    const cuentas = await prisma.cuentaContable.findMany({
      where: {
        activa: true,
        codigo: prefijo ? { startsWith: prefijo } : undefined,
        nivel: nivel <= 2 ? { lte: 2 } : undefined
      },
      orderBy: { codigo: 'asc' }
    });

    // Construir árbol
    const buildTree = (items, parentCode = '') => {
      return items
        .filter(item => {
          if (!parentCode) return item.nivel === 1;
          return item.codigo.startsWith(parentCode) &&
                 item.codigo.length === parentCode.length + 2;
        })
        .map(item => ({
          ...item,
          children: buildTree(items, item.codigo)
        }));
    };

    return buildTree(cuentas);
  }

  /**
   * Crear cuenta contable
   */
  async create(data) {
    // Validar código PUC
    if (!data.codigo || data.codigo.length < 1 || data.codigo.length > 10) {
      throw new ValidationError('Código de cuenta inválido');
    }

    // Verificar si existe
    const existe = await prisma.cuentaContable.findUnique({
      where: { codigo: data.codigo }
    });

    if (existe) {
      throw new ValidationError(`La cuenta ${data.codigo} ya existe`);
    }

    // Determinar nivel
    const nivel = data.codigo.length <= 2 ? 1 :
                  data.codigo.length <= 4 ? 2 :
                  data.codigo.length <= 6 ? 3 : 4;

    // Determinar tipo y naturaleza del padre si existe
    const codigoPadre = data.codigo.slice(0, -2);
    let tipo = data.tipo;
    let naturaleza = data.naturaleza;

    if (codigoPadre.length >= 1) {
      const padre = await prisma.cuentaContable.findFirst({
        where: { codigo: { startsWith: data.codigo.charAt(0) }, nivel: 1 }
      });
      if (padre && !tipo) {
        tipo = padre.tipo;
        naturaleza = padre.naturaleza;
      }
    }

    const cuenta = await prisma.cuentaContable.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        tipo: tipo || 'Activo',
        naturaleza: naturaleza || 'Débito',
        nivel,
        activa: true
      }
    });

    return cuenta;
  }

  /**
   * Actualizar cuenta contable
   */
  async update(codigo, data) {
    const cuenta = await this.getByCodigo(codigo);

    const updated = await prisma.cuentaContable.update({
      where: { codigo },
      data: {
        nombre: data.nombre,
        activa: data.activa
      }
    });

    return updated;
  }

  /**
   * Desactivar cuenta (no eliminar)
   */
  async desactivar(codigo) {
    // Verificar que no tenga movimientos
    const movimientos = await prisma.asientoContableLinea.count({
      where: { cuentaCodigo: codigo }
    });

    if (movimientos > 0) {
      throw new ValidationError(`La cuenta ${codigo} tiene ${movimientos} movimientos y no puede ser desactivada`);
    }

    const updated = await prisma.cuentaContable.update({
      where: { codigo },
      data: { activa: false }
    });

    return updated;
  }

  /**
   * Obtener cuentas para selector
   */
  async getCuentasParaSelector(tipo = null) {
    const where = {
      activa: true,
      nivel: { gte: 3 } // Solo cuentas auxiliares
    };

    if (tipo) where.tipo = tipo;

    return prisma.cuentaContable.findMany({
      where,
      select: {
        codigo: true,
        nombre: true,
        tipo: true,
        naturaleza: true
      },
      orderBy: { codigo: 'asc' }
    });
  }

  /**
   * Buscar cuentas
   */
  async buscar(termino) {
    return prisma.cuentaContable.findMany({
      where: {
        activa: true,
        OR: [
          { codigo: { contains: termino } },
          { nombre: { contains: termino, mode: 'insensitive' } }
        ]
      },
      take: 20,
      orderBy: { codigo: 'asc' }
    });
  }

  /**
   * Sincronizar con Siigo (obtener grupos de cuentas)
   */
  async syncFromSiigo(siigoService) {
    try {
      const accountGroupApi = siigoService.getAccountGroupApi();
      const response = await accountGroupApi.getAccountGroups();

      const grupos = response.results || [];

      for (const grupo of grupos) {
        // Actualizar cuenta con ID de Siigo
        await prisma.cuentaContable.updateMany({
          where: {
            codigo: { startsWith: grupo.code }
          },
          data: {
            siigoGroupId: grupo.id
          }
        });
      }

      return { sincronizados: grupos.length };
    } catch (error) {
      console.error('Error sincronizando con Siigo:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del PUC
   */
  async getStats() {
    const totalCuentas = await prisma.cuentaContable.count({ where: { activa: true } });

    const porTipo = await prisma.cuentaContable.groupBy({
      by: ['tipo'],
      where: { activa: true },
      _count: true
    });

    const porNivel = await prisma.cuentaContable.groupBy({
      by: ['nivel'],
      where: { activa: true },
      _count: true
    });

    return {
      totalCuentas,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      porNivel: porNivel.reduce((acc, item) => {
        acc[`Nivel ${item.nivel}`] = item._count;
        return acc;
      }, {})
    };
  }
}

module.exports = new PlanCuentasService();
