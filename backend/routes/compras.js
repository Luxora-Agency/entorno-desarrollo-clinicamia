/**
 * Compras Routes - Proveedores, Ordenes de Compra, Facturas Proveedor
 */
const { Hono } = require('hono');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const prisma = require('../db/prisma');

const router = new Hono();
router.use('*', authMiddleware);

// ============ PROVEEDORES ============

router.get('/proveedores', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search');
    const tipo = c.req.query('tipo');

    const where = { activo: true };
    if (tipo) where.tipoProveedor = tipo;
    if (search) {
      where.OR = [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { documento: { contains: search } }
      ];
    }

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        orderBy: { razonSocial: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.proveedor.count({ where })
    ]);

    return c.json(paginated(proveedores, { page, limit, total, totalPages: Math.ceil(total / limit) }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Stats de proveedores (DEBE ir antes de /:id)
router.get('/proveedores/stats', async (c) => {
  try {
    const [total, activos, porTipo] = await Promise.all([
      prisma.proveedor.count(),
      prisma.proveedor.count({ where: { activo: true } }),
      prisma.proveedor.groupBy({
        by: ['tipoProveedor'],
        _count: true,
        where: { activo: true }
      })
    ]);

    return c.json(success({
      total,
      activos,
      inactivos: total - activos,
      porTipo: porTipo.map(p => ({ tipo: p.tipoProveedor || 'Sin tipo', count: p._count }))
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/proveedores/:id', async (c) => {
  try {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: c.req.param('id') }
    });
    if (!proveedor) return c.json(error('Proveedor no encontrado'), 404);
    return c.json(success(proveedor));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/proveedores', async (c) => {
  try {
    const body = await c.req.json();
    const proveedor = await prisma.proveedor.create({ data: body });
    return c.json(success(proveedor, 'Proveedor creado'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.put('/proveedores/:id', async (c) => {
  try {
    const body = await c.req.json();
    const proveedor = await prisma.proveedor.update({
      where: { id: c.req.param('id') },
      data: body
    });
    return c.json(success(proveedor, 'Proveedor actualizado'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============ ORDENES DE COMPRA ============

router.get('/ordenes', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const estado = c.req.query('estado');

    const where = {};
    if (estado) where.estado = estado;

    const [ordenes, total] = await Promise.all([
      prisma.ordenCompra.findMany({
        where,
        include: { proveedor: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.ordenCompra.count({ where })
    ]);

    return c.json(paginated(ordenes, { page, limit, total, totalPages: Math.ceil(total / limit) }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Stats de ordenes de compra
router.get('/ordenes/stats', async (c) => {
  try {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const hace6Meses = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [total, porEstado, totalMes, comprasPorMes] = await Promise.all([
      prisma.ordenCompra.count(),
      prisma.ordenCompra.groupBy({
        by: ['estado'],
        _count: true
      }),
      prisma.ordenCompra.aggregate({
        where: { createdAt: { gte: inicioMes } },
        _sum: { total: true },
        _count: true
      }),
      prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "created_at"), 'YYYY-MM') as mes,
          SUM(total) as total,
          COUNT(*) as cantidad
        FROM "ordenes_compra"
        WHERE "created_at" >= ${hace6Meses}
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY mes ASC
      `
    ]);

    return c.json(success({
      total,
      porEstado: porEstado.map(e => ({ estado: e.estado, count: e._count })),
      mesActual: {
        ordenes: totalMes._count,
        monto: totalMes._sum.total || 0
      },
      comprasPorMes: comprasPorMes.map(m => ({
        mes: m.mes,
        total: parseFloat(m.total) || 0,
        cantidad: parseInt(m.cantidad)
      }))
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/ordenes', async (c) => {
  try {
    const body = await c.req.json();
    const { items, ...ordenData } = body;
    
    const orden = await prisma.ordenCompra.create({
      data: {
        ...ordenData,
        items: { create: items }
      },
      include: { proveedor: true, items: true }
    });
    return c.json(success(orden, 'Orden de compra creada'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============ FACTURAS PROVEEDOR ============

router.get('/facturas', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const estado = c.req.query('estado');

    const where = {};
    if (estado) where.estado = estado;

    const [facturas, total] = await Promise.all([
      prisma.facturaProveedor.findMany({
        where,
        include: { proveedor: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.facturaProveedor.count({ where })
    ]);

    return c.json(paginated(facturas, { page, limit, total, totalPages: Math.ceil(total / limit) }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/facturas', async (c) => {
  try {
    const body = await c.req.json();
    const factura = await prisma.facturaProveedor.create({
      data: body,
      include: { proveedor: true }
    });
    return c.json(success(factura, 'Factura proveedor registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============ STATS ============

router.get('/stats', async (c) => {
  try {
    const [proveedores, ordenesPendientes, facturasPendientes] = await Promise.all([
      prisma.proveedor.count({ where: { activo: true } }),
      prisma.ordenCompra.count({ where: { estado: { in: ['BORRADOR', 'ENVIADA'] } } }),
      prisma.facturaProveedor.count({ where: { estado: 'PENDIENTE' } })
    ]);

    return c.json(success({
      totalProveedores: proveedores,
      ordenesPendientes,
      facturasPendientes
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

module.exports = router;
