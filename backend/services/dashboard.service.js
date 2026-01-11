const prisma = require('../db/prisma');
const { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, format, subMonths, parseISO } = require('date-fns');

const getDashboardStats = async (period = 'month', customStartDate = null, customEndDate = null) => {
  const today = new Date();
  let startDate, endDate;

  // Definir rango de fechas
  if (period === 'custom' && customStartDate && customEndDate) {
    startDate = startOfDay(parseISO(customStartDate));
    endDate = endOfDay(parseISO(customEndDate));
  } else if (period === 'week') {
    startDate = subDays(today, 7);
    endDate = endOfDay(today);
  } else if (period === 'year') {
    startDate = startOfDay(new Date(today.getFullYear(), 0, 1));
    endDate = endOfDay(today);
  } else {
    // Default: Mes actual
    startDate = startOfMonth(today);
    endDate = endOfMonth(today);
  }

  // --- SECCIÓN 1: KPIs GENERALES Y COMPARATIVAS ---
  const [
    totalPacientes,
    citasPeriodo,
    ingresosPeriodo,
    admisionesActivas,
    citasCanceladas
  ] = await Promise.all([
    prisma.paciente.count({ where: { estado: 'Activo' } }),
    prisma.cita.count({
      where: {
        fecha: { gte: startDate, lte: endDate },
        estado: { not: 'Cancelada' }
      }
    }),
    prisma.factura.aggregate({
      _sum: { total: true },
      where: {
        fechaEmision: { gte: startDate, lte: endDate },
        estado: { not: 'Cancelada' }
      }
    }),
    prisma.admision.count({ where: { estado: 'Activa' } }),
    prisma.cita.count({
      where: {
        fecha: { gte: startDate, lte: endDate },
        estado: 'Cancelada'
      }
    })
  ]);

  // --- SECCIÓN 2: FINANCIERO ---
  // Ingresos por método de pago
  const ingresosPorMetodo = await prisma.pago.groupBy({
    by: ['metodoPago'],
    _sum: { monto: true },
    where: {
      fechaPago: { gte: startDate, lte: endDate }
    }
  });

  // Facturas pendientes (Cartera)
  const carteraPendiente = await prisma.factura.aggregate({
    _sum: { saldoPendiente: true },
    where: { saldoPendiente: { gt: 0 } }
  });

  // Tendencia de ingresos (últimos 6 meses)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(today, 5 - i);
    return {
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: format(d, 'MMM yyyy')
    };
  });

  const revenueTrend = await Promise.all(last6Months.map(async (m) => {
    const revenue = await prisma.factura.aggregate({
      _sum: { total: true },
      where: {
        fechaEmision: { gte: m.start, lte: m.end },
        estado: { not: 'Cancelada' }
      }
    });
    return { date: m.label, value: revenue._sum.total || 0 };
  }));

  // --- SECCIÓN 3: OPERATIVO ---
  // Top 5 Doctores con más citas
  const topDoctores = await prisma.cita.groupBy({
    by: ['doctorId'],
    _count: { id: true },
    where: {
      fecha: { gte: startDate, lte: endDate },
      estado: 'Completada',
      doctorId: { not: null }
    },
    orderBy: {
      _count: { id: 'desc' }
    },
    take: 5
  });

  // Enriquecer con nombres de doctores
  const doctoresData = await Promise.all(topDoctores.map(async (d) => {
    const doctor = await prisma.usuario.findUnique({
      where: { id: d.doctorId },
      select: { nombre: true, apellido: true }
    });
    return {
      name: `Dr. ${doctor?.nombre || ''} ${doctor?.apellido || ''}`,
      value: d._count.id
    };
  }));

  // Distribución de estado de citas
  const citasStatus = await prisma.cita.groupBy({
    by: ['estado'],
    _count: { id: true },
    where: { fecha: { gte: startDate, lte: endDate } }
  });

  // --- SECCIÓN 4: INVENTARIO (Alertas) ---
  const lowStock = await prisma.producto.findMany({
    where: {
      cantidadTotal: { lte: prisma.producto.fields.cantidadMinAlerta },
      activo: true
    },
    take: 5,
    select: { nombre: true, cantidadTotal: true, cantidadMinAlerta: true }
  });

  const expiringSoon = await prisma.producto.findMany({
    where: {
      fechaVencimiento: {
        lte: new Date(new Date().setDate(new Date().getDate() + 30)) // Próximos 30 días
      },
      activo: true
    },
    take: 5,
    select: { nombre: true, fechaVencimiento: true }
  });

  // --- SECCIÓN 5: CLÍNICO ---
  // Top 5 Diagnósticos (CIE-10/11)
  const topDiagnosticos = await prisma.diagnosticoHCE.groupBy({
    by: ['codigoCIE11', 'descripcionCIE11'],
    _count: { id: true },
    where: { fechaDiagnostico: { gte: startDate, lte: endDate } },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });

  return {
    period: { start: startDate, end: endDate },
    kpis: {
      totalPacientes,
      citasPeriodo,
      ingresosPeriodo: ingresosPeriodo._sum.total || 0,
      admisionesActivas,
      tasaCancelacion: citasPeriodo > 0 ? ((citasCanceladas / (citasPeriodo + citasCanceladas)) * 100).toFixed(1) : 0,
      carteraPendiente: carteraPendiente._sum.saldoPendiente || 0
    },
    financial: {
      revenueTrend,
      ingresosPorMetodo: ingresosPorMetodo.map(i => ({ name: i.metodoPago, value: i._sum.monto || 0 }))
    },
    operational: {
      topDoctores: doctoresData,
      citasStatus: citasStatus.map(c => ({ name: c.estado, value: c._count.id }))
    },
    inventory: {
      lowStock,
      expiringSoon
    },
    clinical: {
      topDiagnosticos: topDiagnosticos.map(d => ({ 
        code: d.codigoCIE11, 
        name: d.descripcionCIE11, 
        value: d._count.id 
      }))
    }
  };
};

module.exports = {
  getDashboardStats
};
