/**
 * Dashboard Financiero Routes - KPIs, Reportes, Tendencias
 */
const { Hono } = require('hono');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const prisma = require('../db/prisma');

const router = new Hono();
router.use('*', authMiddleware);

// GET /dashboard-financiero/kpis
router.get('/kpis', async (c) => {
  try {
    const fechaInicio = c.req.query('fechaInicio') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const fechaFin = c.req.query('fechaFin') || new Date().toISOString();

    const [ingresos, cartera, cxp, gastoNomina] = await Promise.all([
      prisma.factura.aggregate({
        where: {
          fechaEmision: { gte: new Date(fechaInicio), lte: new Date(fechaFin) },
          estado: { not: 'CANCELADA' }
        },
        _sum: { total: true }
      }),
      prisma.factura.aggregate({
        where: { estado: { in: ['PENDIENTE', 'PARCIAL'] } },
        _sum: { saldoPendiente: true }
      }),
      prisma.facturaProveedor.aggregate({
        where: { estado: { in: ['PENDIENTE', 'PARCIAL'] } },
        _sum: { saldoPendiente: true }
      }),
      prisma.itemNomina.aggregate({
        where: {
          periodoNomina: {
            fechaInicio: { gte: new Date(fechaInicio) },
            fechaFin: { lte: new Date(fechaFin) }
          }
        },
        _sum: { netoAPagar: true }
      })
    ]);

    return c.json(success({
      ingresos: {
        total: ingresos._sum.total || 0
      },
      cartera: {
        total: cartera._sum.saldoPendiente || 0
      },
      cuentasPorPagar: {
        total: cxp._sum.saldoPendiente || 0
      },
      nomina: {
        totalMes: gastoNomina._sum.netoAPagar || 0
      }
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// GET /dashboard-financiero/tendencias
router.get('/tendencias', async (c) => {
  try {
    const meses = parseInt(c.req.query('meses') || '12');
    const tendencias = [];
    const hoy = new Date();

    for (let i = meses - 1; i >= 0; i--) {
      const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0);

      const [ingresos, gastos] = await Promise.all([
        prisma.factura.aggregate({
          where: {
            fechaEmision: { gte: fechaInicio, lte: fechaFin },
            estado: { not: 'CANCELADA' }
          },
          _sum: { total: true }
        }),
        prisma.facturaProveedor.aggregate({
          where: { fechaFactura: { gte: fechaInicio, lte: fechaFin } },
          _sum: { total: true }
        })
      ]);

      tendencias.push({
        mes: fechaInicio.toISOString().substring(0, 7),
        ingresos: ingresos._sum.total || 0,
        gastos: gastos._sum.total || 0,
        utilidad: (ingresos._sum.total || 0) - (gastos._sum.total || 0)
      });
    }

    return c.json(success(tendencias));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// GET /dashboard-financiero/aging-cartera
router.get('/aging-cartera', async (c) => {
  try {
    const facturas = await prisma.factura.findMany({
      where: { estado: { in: ['PENDIENTE', 'PARCIAL'] } },
      select: { id: true, numero: true, fechaVencimiento: true, saldoPendiente: true, paciente: { select: { nombres: true, apellidos: true } } }
    });

    const hoy = new Date();
    const aging = {
      corriente: { count: 0, monto: 0 },
      vencido_1_30: { count: 0, monto: 0 },
      vencido_31_60: { count: 0, monto: 0 },
      vencido_61_90: { count: 0, monto: 0 },
      vencido_90_mas: { count: 0, monto: 0 }
    };

    for (const f of facturas) {
      const dias = Math.floor((hoy - new Date(f.fechaVencimiento)) / (1000 * 60 * 60 * 24));
      let cat;
      if (dias <= 0) cat = 'corriente';
      else if (dias <= 30) cat = 'vencido_1_30';
      else if (dias <= 60) cat = 'vencido_31_60';
      else if (dias <= 90) cat = 'vencido_61_90';
      else cat = 'vencido_90_mas';

      aging[cat].count++;
      aging[cat].monto += parseFloat(f.saldoPendiente || 0);
    }

    return c.json(success(aging));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// GET /dashboard-financiero/aging-cxp
router.get('/aging-cxp', async (c) => {
  try {
    const facturas = await prisma.facturaProveedor.findMany({
      where: { estado: { in: ['PENDIENTE', 'PARCIAL'] } },
      select: { id: true, numero: true, fechaVencimiento: true, saldoPendiente: true, proveedor: { select: { razonSocial: true } } }
    });

    const hoy = new Date();
    const aging = {
      corriente: { count: 0, monto: 0 },
      vencido_1_30: { count: 0, monto: 0 },
      vencido_31_60: { count: 0, monto: 0 },
      vencido_61_90: { count: 0, monto: 0 },
      vencido_90_mas: { count: 0, monto: 0 }
    };

    for (const f of facturas) {
      const dias = Math.floor((hoy - new Date(f.fechaVencimiento)) / (1000 * 60 * 60 * 24));
      let cat;
      if (dias <= 0) cat = 'corriente';
      else if (dias <= 30) cat = 'vencido_1_30';
      else if (dias <= 60) cat = 'vencido_31_60';
      else if (dias <= 90) cat = 'vencido_61_90';
      else cat = 'vencido_90_mas';

      aging[cat].count++;
      aging[cat].monto += parseFloat(f.saldoPendiente || 0);
    }

    return c.json(success(aging));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// GET /dashboard-financiero/liquidez
router.get('/liquidez', async (c) => {
  try {
    const [saldoBancos, cartera, cxp] = await Promise.all([
      prisma.cuentaBancaria.aggregate({
        where: { activa: true },
        _sum: { saldoActual: true }
      }),
      prisma.factura.aggregate({
        where: { estado: { in: ['PENDIENTE', 'PARCIAL'] } },
        _sum: { saldoPendiente: true }
      }),
      prisma.facturaProveedor.aggregate({
        where: { estado: { in: ['PENDIENTE', 'PARCIAL'] } },
        _sum: { saldoPendiente: true }
      })
    ]);

    const disponible = parseFloat(saldoBancos._sum.saldoActual || 0);
    const porCobrar = parseFloat(cartera._sum.saldoPendiente || 0);
    const porPagar = parseFloat(cxp._sum.saldoPendiente || 0);

    return c.json(success({
      disponible,
      porCobrar,
      porPagar,
      capitalTrabajo: disponible + porCobrar - porPagar,
      razonCorriente: porPagar > 0 ? ((disponible + porCobrar) / porPagar).toFixed(2) : 'N/A'
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

module.exports = router;
