/**
 * Contabilidad Routes
 * Manage PUC (Plan Único de Cuentas), cost centers, and accounting entries
 */
const { Hono } = require('hono');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const contabilidadService = require('../services/contabilidad.service');
const { success, error, paginated } = require('../utils/response');
const prisma = require('../db/prisma');

const router = new Hono();

router.use('*', authMiddleware);

// ============ PUC - PLAN ÚNICO DE CUENTAS ============

// GET /contabilidad/puc/selector - Get PUC for selectors (must be before /:id)
router.get('/puc/selector', async (c) => {
  try {
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        tipo: true,
        naturaleza: true,
        nivel: true
      },
      orderBy: { codigo: 'asc' }
    });
    return c.json(success(cuentas, 'Cuentas obtenidas'));
  } catch (err) {
    console.error('Error getting PUC selector:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/puc/arbol - Get PUC as tree structure (must be before /:id)
router.get('/puc/arbol', async (c) => {
  try {
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true },
      orderBy: { codigo: 'asc' }
    });

    // Build tree structure based on codigo hierarchy
    const buildTree = (cuentas) => {
      const map = {};
      const roots = [];

      // First pass: create map
      cuentas.forEach(cuenta => {
        map[cuenta.codigo] = { ...cuenta, children: [] };
      });

      // Second pass: build tree
      cuentas.forEach(cuenta => {
        const parentCodigo = cuenta.codigo.slice(0, -2); // Remove last 2 digits for parent
        if (parentCodigo && map[parentCodigo]) {
          map[parentCodigo].children.push(map[cuenta.codigo]);
        } else if (cuenta.nivel === 1) {
          roots.push(map[cuenta.codigo]);
        }
      });

      return roots;
    };

    const arbol = buildTree(cuentas);
    return c.json(success(arbol, 'Árbol de cuentas obtenido'));
  } catch (err) {
    console.error('Error getting PUC tree:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/puc/inicializar - Initialize Colombian PUC (must be before /:id)
router.post('/puc/inicializar', async (c) => {
  try {
    // Check if PUC already exists
    const existing = await prisma.cuentaContable.count();
    if (existing > 0) {
      return c.json(error('El PUC ya está inicializado. Use sincronización para actualizar.'), 400);
    }

    // Colombian PUC base structure
    const pucBase = [
      // Clase 1 - Activo
      { codigo: '1', nombre: 'ACTIVO', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 1 },
      { codigo: '11', nombre: 'DISPONIBLE', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 2 },
      { codigo: '1105', nombre: 'CAJA', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '110505', nombre: 'Caja General', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '1110', nombre: 'BANCOS', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '111005', nombre: 'Moneda Nacional', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '13', nombre: 'DEUDORES', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 2 },
      { codigo: '1305', nombre: 'CLIENTES', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '130505', nombre: 'Nacionales', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '14', nombre: 'INVENTARIOS', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 2 },
      { codigo: '1435', nombre: 'MERCANCIAS NO FABRICADAS POR LA EMPRESA', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '15', nombre: 'PROPIEDADES PLANTA Y EQUIPO', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 2 },
      { codigo: '1524', nombre: 'EQUIPO DE OFICINA', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '1528', nombre: 'EQUIPO DE COMPUTACION', tipo: 'ACTIVO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '1592', nombre: 'DEPRECIACION ACUMULADA', tipo: 'ACTIVO', naturaleza: 'CREDITO', nivel: 3 },

      // Clase 2 - Pasivo
      { codigo: '2', nombre: 'PASIVO', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 1 },
      { codigo: '21', nombre: 'OBLIGACIONES FINANCIERAS', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 2 },
      { codigo: '22', nombre: 'PROVEEDORES', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 2 },
      { codigo: '2205', nombre: 'NACIONALES', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '23', nombre: 'CUENTAS POR PAGAR', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 2 },
      { codigo: '2335', nombre: 'COSTOS Y GASTOS POR PAGAR', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '2365', nombre: 'RETENCION EN LA FUENTE', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '2367', nombre: 'IMPUESTO A LAS VENTAS RETENIDO', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '2368', nombre: 'IMPUESTO DE INDUSTRIA Y COMERCIO RETENIDO', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '24', nombre: 'IMPUESTOS GRAVAMENES Y TASAS', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 2 },
      { codigo: '2408', nombre: 'IMPUESTO SOBRE LAS VENTAS POR PAGAR', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '25', nombre: 'OBLIGACIONES LABORALES', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 2 },
      { codigo: '2505', nombre: 'SALARIOS POR PAGAR', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '2510', nombre: 'CESANTIAS CONSOLIDADAS', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '2515', nombre: 'INTERESES SOBRE CESANTIAS', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '2520', nombre: 'PRIMA DE SERVICIOS', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '2525', nombre: 'VACACIONES CONSOLIDADAS', tipo: 'PASIVO', naturaleza: 'CREDITO', nivel: 3 },

      // Clase 3 - Patrimonio
      { codigo: '3', nombre: 'PATRIMONIO', tipo: 'PATRIMONIO', naturaleza: 'CREDITO', nivel: 1 },
      { codigo: '31', nombre: 'CAPITAL SOCIAL', tipo: 'PATRIMONIO', naturaleza: 'CREDITO', nivel: 2 },
      { codigo: '3105', nombre: 'CAPITAL SUSCRITO Y PAGADO', tipo: 'PATRIMONIO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '36', nombre: 'RESULTADOS DEL EJERCICIO', tipo: 'PATRIMONIO', naturaleza: 'CREDITO', nivel: 2 },
      { codigo: '3605', nombre: 'UTILIDAD DEL EJERCICIO', tipo: 'PATRIMONIO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '3610', nombre: 'PERDIDA DEL EJERCICIO', tipo: 'PATRIMONIO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '37', nombre: 'RESULTADOS DE EJERCICIOS ANTERIORES', tipo: 'PATRIMONIO', naturaleza: 'CREDITO', nivel: 2 },

      // Clase 4 - Ingresos
      { codigo: '4', nombre: 'INGRESOS', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 1 },
      { codigo: '41', nombre: 'OPERACIONALES', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 2 },
      { codigo: '4110', nombre: 'SERVICIOS DE SALUD', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 3 },
      { codigo: '411005', nombre: 'Consultas Médicas', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 4 },
      { codigo: '411010', nombre: 'Procedimientos', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 4 },
      { codigo: '411015', nombre: 'Hospitalización', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 4 },
      { codigo: '411020', nombre: 'Laboratorio', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 4 },
      { codigo: '411025', nombre: 'Imagenología', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 4 },
      { codigo: '411030', nombre: 'Farmacia', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 4 },
      { codigo: '42', nombre: 'NO OPERACIONALES', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 2 },
      { codigo: '4210', nombre: 'FINANCIEROS', tipo: 'INGRESO', naturaleza: 'CREDITO', nivel: 3 },

      // Clase 5 - Gastos
      { codigo: '5', nombre: 'GASTOS', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 1 },
      { codigo: '51', nombre: 'OPERACIONALES DE ADMINISTRACION', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 2 },
      { codigo: '5105', nombre: 'GASTOS DE PERSONAL', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '510506', nombre: 'Sueldos', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '510515', nombre: 'Horas Extras', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '510527', nombre: 'Auxilio de Transporte', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '510530', nombre: 'Cesantías', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '510533', nombre: 'Intereses sobre Cesantías', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '510536', nombre: 'Prima de Servicios', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '510539', nombre: 'Vacaciones', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '510568', nombre: 'Aportes ARL', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '510569', nombre: 'Aportes EPS', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '510570', nombre: 'Aportes Pensión', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '510572', nombre: 'Aportes Caja de Compensación', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '5110', nombre: 'HONORARIOS', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '5115', nombre: 'IMPUESTOS', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '5120', nombre: 'ARRENDAMIENTOS', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '5135', nombre: 'SERVICIOS', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '513525', nombre: 'Acueducto y Alcantarillado', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '513530', nombre: 'Energía Eléctrica', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '513535', nombre: 'Teléfono', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 4 },
      { codigo: '5140', nombre: 'GASTOS LEGALES', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '5145', nombre: 'MANTENIMIENTO Y REPARACIONES', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '5160', nombre: 'DEPRECIACIONES', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '5195', nombre: 'DIVERSOS', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 3 },
      { codigo: '52', nombre: 'OPERACIONALES DE VENTAS', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 2 },
      { codigo: '53', nombre: 'NO OPERACIONALES', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 2 },
      { codigo: '5305', nombre: 'FINANCIEROS', tipo: 'GASTO', naturaleza: 'DEBITO', nivel: 3 },

      // Clase 6 - Costos
      { codigo: '6', nombre: 'COSTOS DE VENTAS', tipo: 'COSTO', naturaleza: 'DEBITO', nivel: 1 },
      { codigo: '61', nombre: 'COSTO DE VENTAS Y PRESTACION DE SERVICIOS', tipo: 'COSTO', naturaleza: 'DEBITO', nivel: 2 },
      { codigo: '6135', nombre: 'SERVICIOS DE SALUD', tipo: 'COSTO', naturaleza: 'DEBITO', nivel: 3 },
    ];

    await prisma.cuentaContable.createMany({
      data: pucBase.map(cuenta => ({
        ...cuenta,
        activa: true
      }))
    });

    return c.json(success({ count: pucBase.length }, 'PUC Colombia inicializado correctamente'), 201);
  } catch (err) {
    console.error('Error initializing PUC:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/puc/sync-siigo - Sync PUC with Siigo (must be before /:id)
router.post('/puc/sync-siigo', async (c) => {
  try {
    const catalogsSiigoService = require('../services/siigo/catalogs.siigo.service');
    const result = await catalogsSiigoService.getAccountGroups();
    return c.json(success(result, 'PUC sincronizado con Siigo'));
  } catch (err) {
    console.error('Error syncing PUC with Siigo:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/puc - List all accounts with pagination
router.get('/puc', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const search = c.req.query('search');
    const tipo = c.req.query('tipo');
    const nivel = c.req.query('nivel');

    const where = { activa: true };

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (tipo) where.tipo = tipo;
    if (nivel) where.nivel = parseInt(nivel);

    const [cuentas, total] = await Promise.all([
      prisma.cuentaContable.findMany({
        where,
        orderBy: { codigo: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.cuentaContable.count({ where })
    ]);

    return c.json(paginated(cuentas, { page, limit, total, totalPages: Math.ceil(total / limit) }));
  } catch (err) {
    console.error('Error listing PUC:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/puc - Create new account
router.post('/puc', async (c) => {
  try {
    const body = await c.req.json();
    const { codigo, nombre, tipo, naturaleza, nivel } = body;

    // Validate unique codigo
    const existing = await prisma.cuentaContable.findUnique({ where: { codigo } });
    if (existing) {
      return c.json(error('Ya existe una cuenta con este código'), 400);
    }

    const cuenta = await prisma.cuentaContable.create({
      data: { codigo, nombre, tipo, naturaleza, nivel: nivel || 4, activa: true }
    });

    return c.json(success(cuenta, 'Cuenta creada exitosamente'), 201);
  } catch (err) {
    console.error('Error creating account:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/puc/:id - Get account by ID
router.get('/puc/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const cuenta = await prisma.cuentaContable.findUnique({ where: { id } });

    if (!cuenta) {
      return c.json(error('Cuenta no encontrada'), 404);
    }

    return c.json(success(cuenta, 'Cuenta obtenida'));
  } catch (err) {
    console.error('Error getting account:', err);
    return c.json(error(err.message), 500);
  }
});

// PUT /contabilidad/puc/:id - Update account
router.put('/puc/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const cuenta = await prisma.cuentaContable.update({
      where: { id },
      data: body
    });

    return c.json(success(cuenta, 'Cuenta actualizada'));
  } catch (err) {
    console.error('Error updating account:', err);
    if (err.code === 'P2025') {
      return c.json(error('Cuenta no encontrada'), 404);
    }
    return c.json(error(err.message), 500);
  }
});

// DELETE /contabilidad/puc/:id - Deactivate account
router.delete('/puc/:id', async (c) => {
  try {
    const id = c.req.param('id');

    await prisma.cuentaContable.update({
      where: { id },
      data: { activa: false }
    });

    return c.json(success(null, 'Cuenta desactivada'));
  } catch (err) {
    console.error('Error deleting account:', err);
    if (err.code === 'P2025') {
      return c.json(error('Cuenta no encontrada'), 404);
    }
    return c.json(error(err.message), 500);
  }
});

// ============ CENTROS DE COSTO ============

// GET /contabilidad/centros-costo/selector - Get cost centers for selectors (must be before /:id)
router.get('/centros-costo/selector', async (c) => {
  try {
    const centros = await prisma.centroCosto.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        tipo: true,
        nivel: true
      },
      orderBy: { codigo: 'asc' }
    });
    return c.json(success(centros, 'Centros de costo obtenidos'));
  } catch (err) {
    console.error('Error getting centros-costo selector:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/centros-costo/sync-siigo - Sync cost centers with Siigo
router.post('/centros-costo/sync-siigo', async (c) => {
  try {
    const catalogsSiigoService = require('../services/siigo/catalogs.siigo.service');
    const result = await catalogsSiigoService.getCostCenters();
    return c.json(success(result, 'Centros de costo sincronizados con Siigo'));
  } catch (err) {
    console.error('Error syncing cost centers with Siigo:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/centros-costo - List all cost centers
router.get('/centros-costo', async (c) => {
  try {
    const centros = await prisma.centroCosto.findMany({
      where: { activo: true },
      orderBy: { codigo: 'asc' }
    });
    return c.json(success(centros, 'Centros de costo obtenidos'));
  } catch (err) {
    console.error('Error listing cost centers:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/centros-costo - Create cost center
router.post('/centros-costo', async (c) => {
  try {
    const body = await c.req.json();
    const centro = await prisma.centroCosto.create({ data: { ...body, activo: true } });
    return c.json(success(centro, 'Centro de costo creado'), 201);
  } catch (err) {
    console.error('Error creating cost center:', err);
    return c.json(error(err.message), 500);
  }
});

// PUT /contabilidad/centros-costo/:id - Update cost center
router.put('/centros-costo/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const centro = await prisma.centroCosto.update({ where: { id }, data: body });
    return c.json(success(centro, 'Centro de costo actualizado'));
  } catch (err) {
    console.error('Error updating cost center:', err);
    return c.json(error(err.message), 500);
  }
});

// ============ ASIENTOS CONTABLES ============

// GET /contabilidad/asientos - List all asientos
router.get('/asientos', async (c) => {
  try {
    const filters = {
      page: parseInt(c.req.query('page') || '1'),
      limit: parseInt(c.req.query('limit') || '20'),
      periodoId: c.req.query('periodoId'),
      tipo: c.req.query('tipo'),
      estado: c.req.query('estado'),
      fechaDesde: c.req.query('fechaDesde'),
      fechaHasta: c.req.query('fechaHasta'),
      search: c.req.query('search')
    };

    const result = await contabilidadService.findAll(filters);
    return c.json(paginated(result.asientos, result.pagination));
  } catch (err) {
    console.error('Error listing asientos:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/asientos/:id - Get asiento by ID
router.get('/asientos/:id', async (c) => {
  try {
    const asiento = await contabilidadService.findById(c.req.param('id'));
    return c.json(success(asiento, 'Asiento obtenido'));
  } catch (err) {
    console.error('Error getting asiento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// POST /contabilidad/asientos - Create new asiento
router.post('/asientos', async (c) => {
  try {
    const body = await c.req.json();
    body.creadoPor = c.get('user')?.id;
    const asiento = await contabilidadService.create(body);
    return c.json(success(asiento, 'Asiento creado exitosamente'), 201);
  } catch (err) {
    console.error('Error creating asiento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// PUT /contabilidad/asientos/:id - Update asiento
router.put('/asientos/:id', async (c) => {
  try {
    const body = await c.req.json();
    const asiento = await contabilidadService.update(c.req.param('id'), body);
    return c.json(success(asiento, 'Asiento actualizado'));
  } catch (err) {
    console.error('Error updating asiento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// POST /contabilidad/asientos/:id/aprobar - Approve asiento
router.post('/asientos/:id/aprobar', async (c) => {
  try {
    const userId = c.get('user')?.id;
    const asiento = await contabilidadService.aprobar(c.req.param('id'), userId);
    return c.json(success(asiento, 'Asiento aprobado'));
  } catch (err) {
    console.error('Error approving asiento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// POST /contabilidad/asientos/:id/anular - Annul asiento
router.post('/asientos/:id/anular', async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('user')?.id;
    const asiento = await contabilidadService.anular(c.req.param('id'), userId, body.motivo);
    return c.json(success(asiento, 'Asiento anulado'));
  } catch (err) {
    console.error('Error annulling asiento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// DELETE /contabilidad/asientos/:id - Delete asiento
router.delete('/asientos/:id', async (c) => {
  try {
    await contabilidadService.delete(c.req.param('id'));
    return c.json(success(null, 'Asiento eliminado'));
  } catch (err) {
    console.error('Error deleting asiento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ============ REPORTES CONTABLES ============

// GET /contabilidad/reportes/balance-prueba - Trial balance from Siigo
router.get('/reportes/balance-prueba', async (c) => {
  try {
    const reportsSiigoService = require('../services/siigo/reports.siigo.service');
    const fechaInicio = c.req.query('fechaInicio') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const fechaFin = c.req.query('fechaFin') || new Date().toISOString().split('T')[0];

    const result = await reportsSiigoService.getTrialBalance(fechaInicio, fechaFin);
    return c.json(success(result.data, 'Balance de prueba obtenido'));
  } catch (err) {
    console.error('Error getting trial balance:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/reportes/cuentas-por-pagar - Accounts payable from Siigo
router.get('/reportes/cuentas-por-pagar', async (c) => {
  try {
    const reportsSiigoService = require('../services/siigo/reports.siigo.service');
    const result = await reportsSiigoService.getAccountsPayable();
    return c.json(success(result.data, 'Cuentas por pagar obtenidas'));
  } catch (err) {
    console.error('Error getting accounts payable:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/reportes/balance-documentos - Document balance from Siigo
router.get('/reportes/balance-documentos', async (c) => {
  try {
    const reportsSiigoService = require('../services/siigo/reports.siigo.service');
    const result = await reportsSiigoService.getDocumentBalance();
    return c.json(success(result.data, 'Balance de documentos obtenido'));
  } catch (err) {
    console.error('Error getting document balance:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/reportes/estado-resultados - Income statement
router.get('/reportes/estado-resultados', async (c) => {
  try {
    const reportsSiigoService = require('../services/siigo/reports.siigo.service');
    const fechaInicio = c.req.query('fechaInicio') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = c.req.query('fechaFin') || new Date().toISOString().split('T')[0];

    const result = await reportsSiigoService.getIncomeStatement(fechaInicio, fechaFin);
    return c.json(success(result.data, 'Estado de resultados obtenido'));
  } catch (err) {
    console.error('Error getting income statement:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/reportes/flujo-caja - Cash flow
router.get('/reportes/flujo-caja', async (c) => {
  try {
    const reportsSiigoService = require('../services/siigo/reports.siigo.service');
    const fechaInicio = c.req.query('fechaInicio') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = c.req.query('fechaFin') || new Date().toISOString().split('T')[0];

    const result = await reportsSiigoService.getCashFlow(fechaInicio, fechaFin);
    return c.json(success(result.data, 'Flujo de caja obtenido'));
  } catch (err) {
    console.error('Error getting cash flow:', err);
    return c.json(error(err.message), 500);
  }
});

// ============ CATÁLOGOS ============

// GET /contabilidad/catalogos/grupos-contables - Account groups from Siigo
router.get('/catalogos/grupos-contables', async (c) => {
  try {
    const catalogsSiigoService = require('../services/siigo/catalogs.siigo.service');
    const result = await catalogsSiigoService.getAccountGroups();
    return c.json(success(result));
  } catch (err) {
    console.error('Error getting account groups:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/catalogos/centros-costo - Cost centers from Siigo
router.get('/catalogos/centros-costo', async (c) => {
  try {
    const catalogsSiigoService = require('../services/siigo/catalogs.siigo.service');
    const result = await catalogsSiigoService.getCostCenters();
    return c.json(success(result));
  } catch (err) {
    console.error('Error getting cost centers:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/catalogos/tipos-pago - Payment types from Siigo
router.get('/catalogos/tipos-pago', async (c) => {
  try {
    const catalogsSiigoService = require('../services/siigo/catalogs.siigo.service');
    const result = await catalogsSiigoService.getPaymentTypes();
    return c.json(success(result));
  } catch (err) {
    console.error('Error getting payment types:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/cuentas/sync - Sync accounts from Siigo
router.post('/cuentas/sync', async (c) => {
  try {
    const catalogsSiigoService = require('../services/siigo/catalogs.siigo.service');
    await catalogsSiigoService.syncAllCatalogs();
    return c.json(success(null, 'Plan de cuentas sincronizado'));
  } catch (err) {
    console.error('Error syncing accounts:', err);
    return c.json(error(err.message), 500);
  }
});

// ============ LIBRO MAYOR ============

// GET /contabilidad/libro-mayor - Get libro mayor
router.get('/libro-mayor', async (c) => {
  try {
    const anio = parseInt(c.req.query('anio') || new Date().getFullYear());
    const mes = parseInt(c.req.query('mes') || new Date().getMonth() + 1);
    const cuentaCodigo = c.req.query('cuenta');

    const where = { anio, mes };
    if (cuentaCodigo) where.cuentaCodigo = cuentaCodigo;

    const libroMayor = await prisma.libroMayor.findMany({
      where,
      orderBy: { cuentaCodigo: 'asc' }
    });

    // If empty, calculate from asientos
    if (libroMayor.length === 0) {
      const cuentas = await prisma.cuentaContable.findMany({
        where: { activa: true },
        orderBy: { codigo: 'asc' }
      });

      const fechaInicio = new Date(anio, mes - 1, 1);
      const fechaFin = new Date(anio, mes, 0);

      const movimientos = await prisma.asientoContableLinea.findMany({
        where: {
          asiento: {
            fecha: { gte: fechaInicio, lte: fechaFin },
            estado: 'APROBADO'
          }
        },
        include: { asiento: true }
      });

      // Group by cuenta
      const saldosPorCuenta = {};
      for (const mov of movimientos) {
        if (!saldosPorCuenta[mov.cuentaCodigo]) {
          saldosPorCuenta[mov.cuentaCodigo] = { debitos: 0, creditos: 0 };
        }
        saldosPorCuenta[mov.cuentaCodigo].debitos += Number(mov.debito || 0);
        saldosPorCuenta[mov.cuentaCodigo].creditos += Number(mov.credito || 0);
      }

      const resultado = cuentas.map(cuenta => ({
        cuentaCodigo: cuenta.codigo,
        cuentaNombre: cuenta.nombre,
        tipo: cuenta.tipo,
        naturaleza: cuenta.naturaleza,
        saldoInicial: 0,
        debitos: saldosPorCuenta[cuenta.codigo]?.debitos || 0,
        creditos: saldosPorCuenta[cuenta.codigo]?.creditos || 0,
        saldoFinal: (saldosPorCuenta[cuenta.codigo]?.debitos || 0) - (saldosPorCuenta[cuenta.codigo]?.creditos || 0),
        anio,
        mes
      })).filter(c => c.debitos > 0 || c.creditos > 0);

      return c.json(success(resultado, 'Libro mayor calculado'));
    }

    return c.json(success(libroMayor, 'Libro mayor obtenido'));
  } catch (err) {
    console.error('Error getting libro mayor:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/libro-mayor/recalcular - Recalculate libro mayor
router.post('/libro-mayor/recalcular', async (c) => {
  try {
    const { anio, mes } = await c.req.json();

    // Delete existing
    await prisma.libroMayor.deleteMany({ where: { anio, mes } });

    // Recalculate from asientos
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);

    const movimientos = await prisma.asientoContableLinea.findMany({
      where: {
        asiento: {
          fecha: { gte: fechaInicio, lte: fechaFin },
          estado: 'APROBADO'
        }
      }
    });

    const saldosPorCuenta = {};
    for (const mov of movimientos) {
      if (!saldosPorCuenta[mov.cuentaCodigo]) {
        saldosPorCuenta[mov.cuentaCodigo] = { debitos: 0, creditos: 0 };
      }
      saldosPorCuenta[mov.cuentaCodigo].debitos += Number(mov.debito || 0);
      saldosPorCuenta[mov.cuentaCodigo].creditos += Number(mov.credito || 0);
    }

    // Create libro mayor entries
    const entries = Object.entries(saldosPorCuenta).map(([codigo, saldos]) => ({
      anio,
      mes,
      cuentaCodigo: codigo,
      saldoInicial: 0,
      debitos: saldos.debitos,
      creditos: saldos.creditos,
      saldoFinal: saldos.debitos - saldos.creditos
    }));

    if (entries.length > 0) {
      await prisma.libroMayor.createMany({ data: entries });
    }

    return c.json(success({ recalculados: entries.length }, 'Libro mayor recalculado'));
  } catch (err) {
    console.error('Error recalculating libro mayor:', err);
    return c.json(error(err.message), 500);
  }
});

// ============ PERIODOS CONTABLES ============

// GET /contabilidad/periodos/actual - Get current period (must be before /:id)
router.get('/periodos/actual', async (c) => {
  try {
    const now = new Date();
    const periodo = await prisma.periodoContable.findFirst({
      where: {
        anio: now.getFullYear(),
        mes: now.getMonth() + 1
      }
    });

    if (!periodo) {
      // Return virtual current period
      return c.json(success({
        anio: now.getFullYear(),
        mes: now.getMonth() + 1,
        estado: 'ABIERTO',
        virtual: true
      }, 'Período actual'));
    }

    return c.json(success(periodo, 'Período actual obtenido'));
  } catch (err) {
    console.error('Error getting current period:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/periodos/stats - Get period statistics (must be before /:id)
router.get('/periodos/stats', async (c) => {
  try {
    const [total, abiertos, cerrados] = await Promise.all([
      prisma.periodoContable.count(),
      prisma.periodoContable.count({ where: { estado: 'ABIERTO' } }),
      prisma.periodoContable.count({ where: { estado: 'CERRADO' } })
    ]);

    return c.json(success({ total, abiertos, cerrados }, 'Estadísticas obtenidas'));
  } catch (err) {
    console.error('Error getting period stats:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/periodos/crear-anio - Create all periods for a year (must be before /:id)
router.post('/periodos/crear-anio', async (c) => {
  try {
    const { anio } = await c.req.json();

    const periodos = [];
    for (let mes = 1; mes <= 12; mes++) {
      const existing = await prisma.periodoContable.findFirst({ where: { anio, mes } });
      if (!existing) {
        periodos.push({
          anio,
          mes,
          fechaInicio: new Date(anio, mes - 1, 1),
          fechaFin: new Date(anio, mes, 0),
          estado: 'ABIERTO'
        });
      }
    }

    if (periodos.length > 0) {
      await prisma.periodoContable.createMany({ data: periodos });
    }

    return c.json(success({ creados: periodos.length }, `Períodos ${anio} creados`), 201);
  } catch (err) {
    console.error('Error creating year periods:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/periodos/cierre-anual - Close all periods for a year
router.post('/periodos/cierre-anual', async (c) => {
  try {
    const { anio } = await c.req.json();

    await prisma.periodoContable.updateMany({
      where: { anio, estado: 'ABIERTO' },
      data: { estado: 'CERRADO', fechaCierre: new Date() }
    });

    return c.json(success(null, `Cierre anual ${anio} completado`));
  } catch (err) {
    console.error('Error closing year:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/periodos - List all periods
router.get('/periodos', async (c) => {
  try {
    const anio = c.req.query('anio');
    const where = anio ? { anio: parseInt(anio) } : {};

    const periodos = await prisma.periodoContable.findMany({
      where,
      orderBy: [{ anio: 'desc' }, { mes: 'asc' }]
    });

    return c.json(success(periodos, 'Períodos obtenidos'));
  } catch (err) {
    console.error('Error listing periods:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/periodos - Create period
router.post('/periodos', async (c) => {
  try {
    const { anio, mes } = await c.req.json();

    const existing = await prisma.periodoContable.findFirst({ where: { anio, mes } });
    if (existing) {
      return c.json(error('El período ya existe'), 400);
    }

    const periodo = await prisma.periodoContable.create({
      data: {
        anio,
        mes,
        fechaInicio: new Date(anio, mes - 1, 1),
        fechaFin: new Date(anio, mes, 0),
        estado: 'ABIERTO'
      }
    });

    return c.json(success(periodo, 'Período creado'), 201);
  } catch (err) {
    console.error('Error creating period:', err);
    return c.json(error(err.message), 500);
  }
});

// ============ CENTROS DE COSTO - ADDITIONAL ============

// GET /contabilidad/centros-costo/arbol - Get cost centers as tree
router.get('/centros-costo/arbol', async (c) => {
  try {
    const centros = await prisma.centroCosto.findMany({
      where: { activo: true },
      orderBy: { codigo: 'asc' }
    });

    // Build tree structure
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    const arbol = buildTree(centros);
    return c.json(success(arbol, 'Árbol de centros de costo obtenido'));
  } catch (err) {
    console.error('Error getting cost center tree:', err);
    return c.json(error(err.message), 500);
  }
});

// POST /contabilidad/centros-costo/inicializar - Initialize default cost centers
router.post('/centros-costo/inicializar', async (c) => {
  try {
    const existing = await prisma.centroCosto.count();
    if (existing > 0) {
      return c.json(error('Los centros de costo ya están inicializados'), 400);
    }

    const centrosBase = [
      { codigo: '01', nombre: 'ADMINISTRACIÓN', tipo: 'ADMINISTRATIVO', nivel: 1 },
      { codigo: '0101', nombre: 'Gerencia', tipo: 'ADMINISTRATIVO', nivel: 2 },
      { codigo: '0102', nombre: 'Contabilidad', tipo: 'ADMINISTRATIVO', nivel: 2 },
      { codigo: '0103', nombre: 'Recursos Humanos', tipo: 'ADMINISTRATIVO', nivel: 2 },
      { codigo: '02', nombre: 'SERVICIOS MÉDICOS', tipo: 'OPERATIVO', nivel: 1 },
      { codigo: '0201', nombre: 'Consulta Externa', tipo: 'OPERATIVO', nivel: 2 },
      { codigo: '0202', nombre: 'Urgencias', tipo: 'OPERATIVO', nivel: 2 },
      { codigo: '0203', nombre: 'Hospitalización', tipo: 'OPERATIVO', nivel: 2 },
      { codigo: '0204', nombre: 'Cirugía', tipo: 'OPERATIVO', nivel: 2 },
      { codigo: '0205', nombre: 'UCI', tipo: 'OPERATIVO', nivel: 2 },
      { codigo: '03', nombre: 'SERVICIOS DE APOYO', tipo: 'APOYO', nivel: 1 },
      { codigo: '0301', nombre: 'Laboratorio', tipo: 'APOYO', nivel: 2 },
      { codigo: '0302', nombre: 'Imagenología', tipo: 'APOYO', nivel: 2 },
      { codigo: '0303', nombre: 'Farmacia', tipo: 'APOYO', nivel: 2 },
      { codigo: '04', nombre: 'MANTENIMIENTO', tipo: 'APOYO', nivel: 1 },
      { codigo: '0401', nombre: 'Equipos Médicos', tipo: 'APOYO', nivel: 2 },
      { codigo: '0402', nombre: 'Infraestructura', tipo: 'APOYO', nivel: 2 },
    ];

    await prisma.centroCosto.createMany({
      data: centrosBase.map(c => ({ ...c, activo: true }))
    });

    return c.json(success({ count: centrosBase.length }, 'Centros de costo inicializados'), 201);
  } catch (err) {
    console.error('Error initializing cost centers:', err);
    return c.json(error(err.message), 500);
  }
});

// ============ ESTADOS FINANCIEROS ============

// GET /contabilidad/estados-financieros/balance-general - Balance sheet
router.get('/estados-financieros/balance-general', async (c) => {
  try {
    const anio = parseInt(c.req.query('anio') || new Date().getFullYear());
    const mes = parseInt(c.req.query('mes') || new Date().getMonth() + 1);

    // Get accounts by type
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true },
      orderBy: { codigo: 'asc' }
    });

    // Get libro mayor for the period
    const fechaFin = new Date(anio, mes, 0);
    const movimientos = await prisma.asientoContableLinea.findMany({
      where: {
        asiento: {
          fecha: { lte: fechaFin },
          estado: 'APROBADO'
        }
      }
    });

    // Calculate balances
    const saldos = {};
    for (const mov of movimientos) {
      if (!saldos[mov.cuentaCodigo]) saldos[mov.cuentaCodigo] = 0;
      saldos[mov.cuentaCodigo] += Number(mov.debito || 0) - Number(mov.credito || 0);
    }

    const activos = cuentas.filter(c => c.tipo === 'ACTIVO').map(c => ({
      ...c, saldo: saldos[c.codigo] || 0
    }));
    const pasivos = cuentas.filter(c => c.tipo === 'PASIVO').map(c => ({
      ...c, saldo: Math.abs(saldos[c.codigo] || 0)
    }));
    const patrimonio = cuentas.filter(c => c.tipo === 'PATRIMONIO').map(c => ({
      ...c, saldo: Math.abs(saldos[c.codigo] || 0)
    }));

    const totalActivos = activos.reduce((sum, c) => sum + c.saldo, 0);
    const totalPasivos = pasivos.reduce((sum, c) => sum + c.saldo, 0);
    const totalPatrimonio = patrimonio.reduce((sum, c) => sum + c.saldo, 0);

    return c.json(success({
      periodo: { anio, mes },
      activos: { cuentas: activos.filter(c => c.saldo !== 0), total: totalActivos },
      pasivos: { cuentas: pasivos.filter(c => c.saldo !== 0), total: totalPasivos },
      patrimonio: { cuentas: patrimonio.filter(c => c.saldo !== 0), total: totalPatrimonio },
      ecuacionContable: {
        activos: totalActivos,
        pasivosPatrimonio: totalPasivos + totalPatrimonio,
        cuadrado: Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) < 0.01
      }
    }, 'Balance general obtenido'));
  } catch (err) {
    console.error('Error getting balance general:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/estados-financieros/estado-resultados - Income statement
router.get('/estados-financieros/estado-resultados', async (c) => {
  try {
    const anio = parseInt(c.req.query('anio') || new Date().getFullYear());
    const mes = parseInt(c.req.query('mes') || new Date().getMonth() + 1);

    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, mes, 0);

    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true, tipo: { in: ['INGRESO', 'GASTO', 'COSTO'] } },
      orderBy: { codigo: 'asc' }
    });

    const movimientos = await prisma.asientoContableLinea.findMany({
      where: {
        asiento: {
          fecha: { gte: fechaInicio, lte: fechaFin },
          estado: 'APROBADO'
        }
      }
    });

    const saldos = {};
    for (const mov of movimientos) {
      if (!saldos[mov.cuentaCodigo]) saldos[mov.cuentaCodigo] = 0;
      saldos[mov.cuentaCodigo] += Number(mov.credito || 0) - Number(mov.debito || 0);
    }

    const ingresos = cuentas.filter(c => c.tipo === 'INGRESO').map(c => ({
      ...c, saldo: saldos[c.codigo] || 0
    }));
    const gastos = cuentas.filter(c => c.tipo === 'GASTO').map(c => ({
      ...c, saldo: Math.abs(saldos[c.codigo] || 0)
    }));
    const costos = cuentas.filter(c => c.tipo === 'COSTO').map(c => ({
      ...c, saldo: Math.abs(saldos[c.codigo] || 0)
    }));

    const totalIngresos = ingresos.reduce((sum, c) => sum + c.saldo, 0);
    const totalGastos = gastos.reduce((sum, c) => sum + c.saldo, 0);
    const totalCostos = costos.reduce((sum, c) => sum + c.saldo, 0);
    const utilidadBruta = totalIngresos - totalCostos;
    const utilidadNeta = utilidadBruta - totalGastos;

    return c.json(success({
      periodo: { anio, mes, acumulado: true },
      ingresos: { cuentas: ingresos.filter(c => c.saldo !== 0), total: totalIngresos },
      costos: { cuentas: costos.filter(c => c.saldo !== 0), total: totalCostos },
      utilidadBruta,
      gastos: { cuentas: gastos.filter(c => c.saldo !== 0), total: totalGastos },
      utilidadNeta
    }, 'Estado de resultados obtenido'));
  } catch (err) {
    console.error('Error getting income statement:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/estados-financieros/flujo-efectivo - Cash flow statement
router.get('/estados-financieros/flujo-efectivo', async (c) => {
  try {
    const anio = parseInt(c.req.query('anio') || new Date().getFullYear());
    const mes = parseInt(c.req.query('mes') || new Date().getMonth() + 1);

    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);

    // Get cash accounts (11xx)
    const movimientosCaja = await prisma.asientoContableLinea.findMany({
      where: {
        cuentaCodigo: { startsWith: '11' },
        asiento: {
          fecha: { gte: fechaInicio, lte: fechaFin },
          estado: 'APROBADO'
        }
      },
      include: { asiento: true }
    });

    const entradas = movimientosCaja.reduce((sum, m) => sum + Number(m.debito || 0), 0);
    const salidas = movimientosCaja.reduce((sum, m) => sum + Number(m.credito || 0), 0);

    return c.json(success({
      periodo: { anio, mes },
      operaciones: {
        entradas,
        salidas,
        neto: entradas - salidas
      },
      inversiones: { entradas: 0, salidas: 0, neto: 0 },
      financiamiento: { entradas: 0, salidas: 0, neto: 0 },
      flujoNeto: entradas - salidas,
      saldoInicial: 0,
      saldoFinal: entradas - salidas
    }, 'Flujo de efectivo obtenido'));
  } catch (err) {
    console.error('Error getting cash flow:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/estados-financieros/indicadores - Financial indicators
router.get('/estados-financieros/indicadores', async (c) => {
  try {
    const anio = parseInt(c.req.query('anio') || new Date().getFullYear());

    // Basic financial indicators (would need full balance data)
    return c.json(success({
      periodo: { anio },
      liquidez: {
        razonCorriente: 0,
        pruebaAcida: 0,
        capitalTrabajo: 0
      },
      endeudamiento: {
        nivelEndeudamiento: 0,
        concentracionCortoPlazo: 0
      },
      rentabilidad: {
        margenBruto: 0,
        margenOperacional: 0,
        margenNeto: 0,
        roa: 0,
        roe: 0
      },
      actividad: {
        rotacionCartera: 0,
        rotacionInventarios: 0,
        rotacionProveedores: 0
      }
    }, 'Indicadores financieros obtenidos'));
  } catch (err) {
    console.error('Error getting indicators:', err);
    return c.json(error(err.message), 500);
  }
});

// GET /contabilidad/estados-financieros/balance-comprobacion - Trial balance
router.get('/estados-financieros/balance-comprobacion', async (c) => {
  try {
    const anio = parseInt(c.req.query('anio') || new Date().getFullYear());
    const mes = parseInt(c.req.query('mes') || new Date().getMonth() + 1);
    const nivel = parseInt(c.req.query('nivel') || '4');

    const fechaFin = new Date(anio, mes, 0);

    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true, nivel: { lte: nivel } },
      orderBy: { codigo: 'asc' }
    });

    const movimientos = await prisma.asientoContableLinea.findMany({
      where: {
        asiento: {
          fecha: { lte: fechaFin },
          estado: 'APROBADO'
        }
      }
    });

    const saldos = {};
    for (const mov of movimientos) {
      if (!saldos[mov.cuentaCodigo]) {
        saldos[mov.cuentaCodigo] = { debitos: 0, creditos: 0 };
      }
      saldos[mov.cuentaCodigo].debitos += Number(mov.debito || 0);
      saldos[mov.cuentaCodigo].creditos += Number(mov.credito || 0);
    }

    const balanceData = cuentas.map(cuenta => {
      const mov = saldos[cuenta.codigo] || { debitos: 0, creditos: 0 };
      const saldoDeudor = mov.debitos > mov.creditos ? mov.debitos - mov.creditos : 0;
      const saldoAcreedor = mov.creditos > mov.debitos ? mov.creditos - mov.debitos : 0;

      return {
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        nivel: cuenta.nivel,
        debitos: mov.debitos,
        creditos: mov.creditos,
        saldoDeudor,
        saldoAcreedor
      };
    }).filter(c => c.debitos > 0 || c.creditos > 0);

    const totales = balanceData.reduce((acc, c) => ({
      debitos: acc.debitos + c.debitos,
      creditos: acc.creditos + c.creditos,
      saldoDeudor: acc.saldoDeudor + c.saldoDeudor,
      saldoAcreedor: acc.saldoAcreedor + c.saldoAcreedor
    }), { debitos: 0, creditos: 0, saldoDeudor: 0, saldoAcreedor: 0 });

    return c.json(success({
      periodo: { anio, mes },
      cuentas: balanceData,
      totales,
      cuadrado: Math.abs(totales.saldoDeudor - totales.saldoAcreedor) < 0.01
    }, 'Balance de comprobación obtenido'));
  } catch (err) {
    console.error('Error getting trial balance:', err);
    return c.json(error(err.message), 500);
  }
});

module.exports = router;
