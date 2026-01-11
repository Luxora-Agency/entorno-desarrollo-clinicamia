/**
 * Activos Fijos Routes - Equipos Medicos, Depreciacion, Mantenimientos
 */
const { Hono } = require('hono');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const prisma = require('../db/prisma');

const router = new Hono();
router.use('*', authMiddleware);

// ============ ACTIVOS ============

router.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const tipo = c.req.query('tipo');
    const estado = c.req.query('estado');
    const search = c.req.query('search');

    const where = {};
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [activos, total] = await Promise.all([
      prisma.activoFijo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.activoFijo.count({ where })
    ]);

    return c.json(paginated(activos, { page, limit, total, totalPages: Math.ceil(total / limit) }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/:id', async (c) => {
  try {
    const activo = await prisma.activoFijo.findUnique({
      where: { id: c.req.param('id') },
      include: { depreciaciones: { orderBy: { periodo: 'desc' }, take: 12 }, mantenimientos: { orderBy: { fecha: 'desc' }, take: 10 } }
    });
    if (!activo) return c.json(error('Activo no encontrado'), 404);
    return c.json(success(activo));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/', async (c) => {
  try {
    const body = await c.req.json();
    body.valorEnLibros = body.valorAdquisicion;
    const activo = await prisma.activoFijo.create({ data: body });
    return c.json(success(activo, 'Activo fijo registrado'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.put('/:id', async (c) => {
  try {
    const body = await c.req.json();
    const activo = await prisma.activoFijo.update({
      where: { id: c.req.param('id') },
      data: body
    });
    return c.json(success(activo, 'Activo actualizado'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============ DEPRECIACION ============

router.get('/depreciaciones/:activoId', async (c) => {
  try {
    const depreciaciones = await prisma.depreciacionActivo.findMany({
      where: { activoFijoId: c.req.param('activoId') },
      orderBy: { periodo: 'desc' }
    });
    return c.json(success(depreciaciones));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/depreciar/:periodo', async (c) => {
  try {
    const periodo = c.req.param('periodo');
    const activos = await prisma.activoFijo.findMany({
      where: { estado: 'ACTIVO' }
    });

    const resultados = [];
    for (const activo of activos) {
      const baseDepreciable = parseFloat(activo.valorAdquisicion) - parseFloat(activo.valorResidual || 0);
      const mesesVidaUtil = activo.vidaUtilAnios * 12;
      const depreciacionMensual = baseDepreciable / mesesVidaUtil;

      if (parseFloat(activo.depreciacionAcumulada) < baseDepreciable) {
        const nuevaDepAcumulada = parseFloat(activo.depreciacionAcumulada) + depreciacionMensual;
        const nuevoValorLibros = parseFloat(activo.valorAdquisicion) - nuevaDepAcumulada;

        const dep = await prisma.depreciacionActivo.create({
          data: {
            activoFijoId: activo.id,
            periodo,
            valorDepreciacion: depreciacionMensual,
            depreciacionAcumulada: nuevaDepAcumulada,
            valorEnLibros: Math.max(nuevoValorLibros, parseFloat(activo.valorResidual || 0))
          }
        });

        await prisma.activoFijo.update({
          where: { id: activo.id },
          data: {
            depreciacionAcumulada: nuevaDepAcumulada,
            valorEnLibros: Math.max(nuevoValorLibros, parseFloat(activo.valorResidual || 0))
          }
        });

        resultados.push(dep);
      }
    }

    return c.json(success({ depreciaciones: resultados.length }, 'Depreciacion ejecutada'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============ MANTENIMIENTOS ============

router.get('/mantenimientos/:activoId', async (c) => {
  try {
    const mantenimientos = await prisma.mantenimientoActivo.findMany({
      where: { activoFijoId: c.req.param('activoId') },
      orderBy: { fecha: 'desc' }
    });
    return c.json(success(mantenimientos));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/mantenimientos', async (c) => {
  try {
    const body = await c.req.json();
    body.registradoPor = c.get('user')?.id;
    const mantenimiento = await prisma.mantenimientoActivo.create({ data: body });

    await prisma.activoFijo.update({
      where: { id: body.activoFijoId },
      data: { fechaUltimoMantenimiento: new Date() }
    });

    return c.json(success(mantenimiento, 'Mantenimiento registrado'), 201);
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============ STATS ============

router.get('/stats/resumen', async (c) => {
  try {
    const [totalActivos, valorTotal, depreciacionTotal, mantenimientosPendientes] = await Promise.all([
      prisma.activoFijo.count({ where: { estado: 'ACTIVO' } }),
      prisma.activoFijo.aggregate({
        where: { estado: 'ACTIVO' },
        _sum: { valorAdquisicion: true, valorEnLibros: true, depreciacionAcumulada: true }
      }),
      prisma.activoFijo.aggregate({
        where: { estado: 'ACTIVO' },
        _sum: { depreciacionAcumulada: true }
      }),
      prisma.activoFijo.count({
        where: {
          estado: 'ACTIVO',
          proximoMantenimiento: { lte: new Date() }
        }
      })
    ]);

    return c.json(success({
      totalActivos,
      valorAdquisicionTotal: valorTotal._sum.valorAdquisicion || 0,
      valorEnLibrosTotal: valorTotal._sum.valorEnLibros || 0,
      depreciacionAcumuladaTotal: depreciacionTotal._sum.depreciacionAcumulada || 0,
      mantenimientosPendientes
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

module.exports = router;
