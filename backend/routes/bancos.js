/**
 * Bancos Routes - Cuentas Bancarias, Movimientos, Conciliacion
 */
const { Hono } = require('hono');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const prisma = require('../db/prisma');

const router = new Hono();
router.use('*', authMiddleware);

// ============ CUENTAS BANCARIAS ============

router.get('/cuentas', async (c) => {
  try {
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { activa: true },
      orderBy: { banco: 'asc' }
    });
    return c.json(success(cuentas));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/cuentas/:id', async (c) => {
  try {
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: c.req.param('id') }
    });
    if (!cuenta) return c.json(error('Cuenta no encontrada'), 404);
    return c.json(success(cuenta));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/cuentas', async (c) => {
  try {
    const body = await c.req.json();
    const cuenta = await prisma.cuentaBancaria.create({ data: body });
    return c.json(success(cuenta, 'Cuenta bancaria creada'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.put('/cuentas/:id', async (c) => {
  try {
    const body = await c.req.json();
    const cuenta = await prisma.cuentaBancaria.update({
      where: { id: c.req.param('id') },
      data: body
    });
    return c.json(success(cuenta, 'Cuenta actualizada'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============ MOVIMIENTOS ============

router.get('/movimientos', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const cuentaId = c.req.query('cuentaId');
    const conciliado = c.req.query('conciliado');

    const where = {};
    if (cuentaId) where.cuentaBancariaId = cuentaId;
    if (conciliado !== undefined) where.conciliado = conciliado === 'true';

    const [movimientos, total] = await Promise.all([
      prisma.movimientoBancario.findMany({
        where,
        include: { cuentaBancaria: true },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.movimientoBancario.count({ where })
    ]);

    return c.json(paginated(movimientos, { page, limit, total, totalPages: Math.ceil(total / limit) }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/movimientos', async (c) => {
  try {
    const body = await c.req.json();
    body.creadoPor = c.get('user')?.id;
    const movimiento = await prisma.movimientoBancario.create({
      data: body,
      include: { cuentaBancaria: true }
    });
    return c.json(success(movimiento, 'Movimiento registrado'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============ CONCILIACION ============

router.get('/conciliaciones', async (c) => {
  try {
    const cuentaId = c.req.query('cuentaId');
    const where = {};
    if (cuentaId) where.cuentaBancariaId = cuentaId;

    const conciliaciones = await prisma.conciliacion.findMany({
      where,
      include: { cuentaBancaria: true },
      orderBy: { periodo: 'desc' }
    });
    return c.json(success(conciliaciones));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/conciliaciones', async (c) => {
  try {
    const body = await c.req.json();
    body.creadoPor = c.get('user')?.id;
    const conciliacion = await prisma.conciliacion.create({
      data: body,
      include: { cuentaBancaria: true }
    });
    return c.json(success(conciliacion, 'Conciliacion iniciada'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============ STATS ============

router.get('/stats', async (c) => {
  try {
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { activa: true },
      select: { id: true, banco: true, saldoActual: true, saldoConciliado: true }
    });

    const saldoTotal = cuentas.reduce((sum, c) => sum + parseFloat(c.saldoActual || 0), 0);
    const movimientosPendientes = await prisma.movimientoBancario.count({
      where: { conciliado: false }
    });

    return c.json(success({
      cuentas,
      saldoTotal,
      movimientosPendientes,
      totalCuentas: cuentas.length
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

module.exports = router;
