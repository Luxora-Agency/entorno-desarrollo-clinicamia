/**
 * Rutas de Mia Pass (Planes, Suscripciones, Cupones, Comisiones)
 * Implementa la Política de Comisiones MIA PASS v1.1 (2026)
 */
const { Hono } = require('hono');
const prisma = require('../db/prisma');
const miaPassService = require('../services/miaPass.service');
const comisionService = require('../services/miaPassComision.service');
const { authMiddleware, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createPlanSchema,
  updatePlanSchema,
  createSubscriptionSchema,
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema
} = require('../validators/miaPass.schema');
const { success, error } = require('../utils/response');

const miaPass = new Hono();

// Todas las rutas requieren autenticación
miaPass.use('*', authMiddleware);

/**
 * COMISIONES Y VENDEDORES
 */

/**
 * @swagger
 * /mia-pass/vendedores/me:
 *   get:
 *     summary: Obtener mi estado como vendedor
 *     tags: [Mia Pass]
 */
miaPass.get('/vendedores/me', requirePermission('miapass.vendedores.read_own'), async (c) => {
  try {
    const user = c.get('user');
    const estado = await comisionService.getEstadoVendedor(user.id);
    return c.json(success(estado));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /mia-pass/vendedores/me/red:
 *   get:
 *     summary: Obtener estructura de red de referidos (N1 y N2)
 *     tags: [Mia Pass]
 */
miaPass.get('/vendedores/me/red', requirePermission('miapass.vendedores.read_own'), async (c) => {
  try {
    const user = c.get('user');
    const red = await comisionService.getEstructuraRed(user.id);
    return c.json(success(red));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /mia-pass/comisiones/stats:
 *   get:
 *     summary: Estadísticas de comisiones para el usuario actual
 *     tags: [Mia Pass]
 */
miaPass.get('/comisiones/stats', requirePermission('miapass.comisiones.read_own'), async (c) => {
  try {
    const user = c.get('user');
    const resultado = await comisionService.getMisComisiones(user.id);
    return c.json(success(resultado));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /mia-pass/comisiones/historial-pagos:
 *   get:
 *     summary: Historial de pagos de comisiones
 *     tags: [Mia Pass]
 */
miaPass.get('/comisiones/historial-pagos', requirePermission('miapass.comisiones.read_own'), async (c) => {
  try {
    const user = c.get('user');
    const historial = await miaPassService.getHistorialPagos(user.id);
    return c.json(success(historial));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /mia-pass/admin/cortes:
 *   post:
 *     summary: Generar un nuevo corte de comisiones (Admin)
 *     tags: [Mia Pass]
 */
miaPass.post('/admin/cortes', requirePermission('miapass.cortes.generate'), async (c) => {
  try {
    const user = c.get('user');
    const { periodo } = await c.req.json(); // Formato YYYY-MM

    const comisionService = require('../services/miaPassComision.service');
    const corte = await comisionService.generarReporteCorte(periodo, user.id);

    return c.json(success(corte, 'Corte de comisiones generado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

/**
 * PLANES
 */

/**
 * @swagger
 * /mia-pass/planes:
 *   get:
 *     summary: Listar planes de Mia Pass
 *     tags: [Mia Pass]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de planes
 */
miaPass.get('/planes', requirePermission('miapass.planes.read'), async (c) => {
  try {
    const filters = c.req.query();
    const planes = await miaPassService.getPlans(filters);
    return c.json(success({ planes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/planes/{id}:
 *   get:
 *     summary: Obtener detalle de un plan
 *     tags: [Mia Pass]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
miaPass.get('/planes/:id', requirePermission('miapass.planes.read'), async (c) => {
  try {
    const { id } = c.req.param();
    const plan = await miaPassService.getPlanById(id);
    return c.json(success({ plan }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/planes:
 *   post:
 *     summary: Crear nuevo plan
 *     tags: [Mia Pass]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlanInput'
 */
miaPass.post('/planes', requirePermission('miapass.planes.create'), validate(createPlanSchema), async (c) => {
  try {
    const data = c.req.validData;
    const plan = await miaPassService.createPlan(data);
    return c.json(success({ plan }, 'Plan creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/planes/{id}:
 *   put:
 *     summary: Actualizar plan
 *     tags: [Mia Pass]
 */
miaPass.put('/planes/:id', requirePermission('miapass.planes.update'), validate(updatePlanSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const plan = await miaPassService.updatePlan(id, data);
    return c.json(success({ plan }, 'Plan actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/planes/{id}/toggle:
 *   post:
 *     summary: Activar/Desactivar plan
 *     tags: [Mia Pass]
 */
miaPass.post('/planes/:id/toggle', requirePermission('miapass.planes.toggle'), async (c) => {
  try {
    const { id } = c.req.param();
    const plan = await miaPassService.togglePlanStatus(id);
    return c.json(success({ plan }, `Plan ${plan.activo ? 'activado' : 'desactivado'} correctamente`));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * SUSCRIPCIONES
 */

/**
 * @swagger
 * /mia-pass/suscripciones:
 *   post:
 *     summary: Crear suscripción
 *     tags: [Mia Pass]
 */
miaPass.post('/suscripciones', requirePermission('miapass.suscripciones.create'), validate(createSubscriptionSchema), async (c) => {
  try {
    const data = c.req.validData;
    const suscripcion = await miaPassService.createSubscription(data);
    return c.json(success({ suscripcion }, 'Suscripción creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/suscripciones:
 *   get:
 *     summary: Listar todas las suscripciones
 *     tags: [Mia Pass]
 */
miaPass.get('/suscripciones', requirePermission('miapass.suscripciones.read'), async (c) => {
  try {
    const suscripciones = await miaPassService.getAllSubscriptions();
    return c.json(success({ suscripciones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/suscripciones/paciente/{pacienteId}:
 *   get:
 *     summary: Obtener suscripciones de un paciente
 *     tags: [Mia Pass]
 */
miaPass.get('/suscripciones/paciente/:pacienteId', requirePermission('miapass.suscripciones.read'), async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const suscripciones = await miaPassService.getSubscriptionsByPaciente(pacienteId);
    return c.json(success({ suscripciones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/suscripciones/{id}:
 *   get:
 *     summary: Obtener detalle de una suscripción
 *     tags: [Mia Pass]
 */
miaPass.get('/suscripciones/:id', requirePermission('miapass.suscripciones.read'), async (c) => {
  try {
    const { id } = c.req.param();
    const suscripcion = await miaPassService.getSubscriptionById(id);
    return c.json(success({ suscripcion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/suscripciones/{id}/cancel:
 *   post:
 *     summary: Cancelar suscripción (post-activación)
 *     tags: [Mia Pass]
 */
miaPass.post('/suscripciones/:id/cancel', requirePermission('miapass.suscripciones.cancel'), async (c) => {
  try {
    const { id } = c.req.param();
    const { motivo } = await c.req.json().catch(() => ({}));
    const suscripcion = await miaPassService.cancelSubscription(id, motivo);
    return c.json(success({ suscripcion }, 'Suscripción cancelada y comisiones revertidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/suscripciones/{id}/anular:
 *   post:
 *     summary: Anular suscripción (antes de activación)
 *     tags: [Mia Pass]
 */
miaPass.post('/suscripciones/:id/anular', requirePermission('miapass.suscripciones.anular'), async (c) => {
  try {
    const { id } = c.req.param();
    const { motivo } = await c.req.json().catch(() => ({}));
    const suscripcion = await miaPassService.anularSubscription(id, motivo);
    return c.json(success({ suscripcion }, 'Suscripción anulada y comisiones revertidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/suscripciones/{id}/devolver:
 *   post:
 *     summary: Registrar devolución de suscripción
 *     tags: [Mia Pass]
 */
miaPass.post('/suscripciones/:id/devolver', requirePermission('miapass.suscripciones.devolver'), async (c) => {
  try {
    const { id } = c.req.param();
    const { motivo } = await c.req.json().catch(() => ({}));
    const suscripcion = await miaPassService.devolverSubscription(id, motivo);
    return c.json(success({ suscripcion }, 'Devolución registrada y comisiones revertidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * CUPONES
 */

/**
 * @swagger
 * /mia-pass/cupones:
 *   get:
 *     summary: Listar cupones
 *     tags: [Mia Pass]
 */
miaPass.get('/cupones', requirePermission('miapass.cupones.read'), async (c) => {
  try {
    const cupones = await miaPassService.getCoupons();
    return c.json(success({ cupones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/cupones:
 *   post:
 *     summary: Crear cupón
 *     tags: [Mia Pass]
 */
miaPass.post('/cupones', requirePermission('miapass.cupones.create'), validate(createCouponSchema), async (c) => {
  try {
    const data = c.req.validData;
    const cupon = await miaPassService.createCoupon(data);
    return c.json(success({ cupon }, 'Cupón creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/cupones/validate:
 *   post:
 *     summary: Validar cupón
 *     tags: [Mia Pass]
 */
miaPass.post('/cupones/validate', requirePermission('miapass.cupones.read'), validate(validateCouponSchema), async (c) => {
  try {
    const { codigo, plan_id } = c.req.validData;
    const cupon = await miaPassService.validateCoupon(codigo, plan_id);
    return c.json(success({ cupon, valido: true }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

/**
 * @swagger
 * /mia-pass/cupones/{id}:
 *   get:
 *     summary: Obtener detalle de un cupón
 *     tags: [Mia Pass]
 */
miaPass.get('/cupones/:id', requirePermission('miapass.cupones.read'), async (c) => {
  try {
    const { id } = c.req.param();
    const cupon = await miaPassService.getCouponById(id);
    return c.json(success({ cupon }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/cupones/{id}:
 *   put:
 *     summary: Actualizar cupón
 *     tags: [Mia Pass]
 */
miaPass.put('/cupones/:id', requirePermission('miapass.cupones.update'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const cupon = await miaPassService.updateCoupon(id, data);
    return c.json(success({ cupon }, 'Cupón actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/cupones/{id}/toggle:
 *   post:
 *     summary: Activar/Desactivar cupón
 *     tags: [Mia Pass]
 */
miaPass.post('/cupones/:id/toggle', requirePermission('miapass.cupones.toggle'), async (c) => {
  try {
    const { id } = c.req.param();
    const cupon = await miaPassService.toggleCoupon(id);
    return c.json(success({ cupon }, `Cupón ${cupon.activo ? 'activado' : 'desactivado'} correctamente`));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /mia-pass/cupones/{id}:
 *   delete:
 *     summary: Eliminar cupón (solo si no tiene usos)
 *     tags: [Mia Pass]
 */
miaPass.delete('/cupones/:id', requirePermission('miapass.cupones.delete'), async (c) => {
  try {
    const { id } = c.req.param();
    await miaPassService.deleteCoupon(parseInt(id));
    return c.json(success(null, 'Cupón eliminado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DASHBOARD Y ESTADÍSTICAS
 */

/**
 * @swagger
 * /mia-pass/dashboard/stats:
 *   get:
 *     summary: Estadísticas del dashboard MiaPass
 *     tags: [Mia Pass]
 */
miaPass.get('/dashboard/stats', requirePermission('miapass.dashboard.admin'), async (c) => {
  try {
    const stats = await miaPassService.getDashboardStats();
    return c.json(success(stats));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * REPORTES
 */

/**
 * @swagger
 * /mia-pass/reportes/ventas:
 *   get:
 *     summary: Reporte de ventas por período
 *     tags: [Mia Pass Reportes]
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: vendedorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: canal
 *         schema:
 *           type: string
 */
miaPass.get('/reportes/ventas', requirePermission('miapass.reportes.ventas'), async (c) => {
  try {
    const { fechaInicio, fechaFin, vendedorId, canal, planId } = c.req.query();

    const where = {
      estado: 'ACTIVA'
    };

    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) where.createdAt.gte = new Date(fechaInicio);
      if (fechaFin) where.createdAt.lte = new Date(fechaFin + 'T23:59:59.999Z');
    }

    if (vendedorId) where.vendedorId = vendedorId;
    if (canal) where.canal = canal;
    if (planId) where.planId = parseInt(planId);

    const suscripciones = await prisma.miaPassSuscripcion.findMany({
      where,
      include: {
        paciente: { select: { nombre: true, apellido: true, cedula: true } },
        plan: { select: { nombre: true, precio: true } },
        vendedor: { select: { nombre: true, apellido: true, vendedorCodigo: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Agrupar por vendedor
    const ventasPorVendedor = {};
    const ventasPorCanal = {};
    const ventasPorPlan = {};

    suscripciones.forEach(s => {
      const vendedorKey = s.vendedor?.vendedorCodigo || 'Sin vendedor';
      const canalKey = s.canal || 'Presencial';
      const planKey = s.plan?.nombre || 'Sin plan';

      if (!ventasPorVendedor[vendedorKey]) {
        ventasPorVendedor[vendedorKey] = { cantidad: 0, monto: 0, vendedor: s.vendedor };
      }
      ventasPorVendedor[vendedorKey].cantidad++;
      ventasPorVendedor[vendedorKey].monto += Number(s.precioPagado || 0);

      if (!ventasPorCanal[canalKey]) ventasPorCanal[canalKey] = { cantidad: 0, monto: 0 };
      ventasPorCanal[canalKey].cantidad++;
      ventasPorCanal[canalKey].monto += Number(s.precioPagado || 0);

      if (!ventasPorPlan[planKey]) ventasPorPlan[planKey] = { cantidad: 0, monto: 0 };
      ventasPorPlan[planKey].cantidad++;
      ventasPorPlan[planKey].monto += Number(s.precioPagado || 0);
    });

    const totales = {
      cantidadVentas: suscripciones.length,
      montoTotal: suscripciones.reduce((sum, s) => sum + Number(s.precioPagado || 0), 0)
    };

    return c.json(success({
      periodo: { fechaInicio, fechaFin },
      totales,
      ventasPorVendedor: Object.entries(ventasPorVendedor).map(([k, v]) => ({ codigo: k, ...v })),
      ventasPorCanal: Object.entries(ventasPorCanal).map(([k, v]) => ({ canal: k, ...v })),
      ventasPorPlan: Object.entries(ventasPorPlan).map(([k, v]) => ({ plan: k, ...v })),
      detalle: suscripciones
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /mia-pass/reportes/comisiones:
 *   get:
 *     summary: Reporte de comisiones por período
 *     tags: [Mia Pass Reportes]
 */
miaPass.get('/reportes/comisiones', requirePermission('miapass.reportes.comisiones'), async (c) => {
  try {
    const { periodo, estado, vendedorId, rolBeneficiario } = c.req.query();

    const where = {};

    if (periodo) {
      const [year, month] = periodo.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.createdAt = { gte: startDate, lte: endDate };
    }

    if (estado) where.estado = estado;
    if (vendedorId) where.vendedorId = vendedorId;
    if (rolBeneficiario) where.rolBeneficiario = rolBeneficiario;

    const comisiones = await prisma.miaPassComision.findMany({
      where,
      include: {
        vendedor: { select: { nombre: true, apellido: true, vendedorCodigo: true, email: true } },
        suscripcion: {
          select: {
            paciente: { select: { nombre: true, apellido: true } },
            canal: true,
            precioPagado: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Agrupar por vendedor
    const comisionesPorVendedor = {};
    comisiones.forEach(c => {
      const key = c.vendedor?.vendedorCodigo || c.vendedorId;
      if (!comisionesPorVendedor[key]) {
        comisionesPorVendedor[key] = {
          vendedor: c.vendedor,
          totalPendiente: 0,
          totalPagado: 0,
          totalRevertido: 0,
          cantidad: 0
        };
      }
      comisionesPorVendedor[key].cantidad++;
      if (c.estado === 'PENDIENTE') comisionesPorVendedor[key].totalPendiente += Number(c.valor);
      if (c.estado === 'PAGADO') comisionesPorVendedor[key].totalPagado += Number(c.valor);
      if (c.estado === 'REVERTIDO') comisionesPorVendedor[key].totalRevertido += Number(c.valor);
    });

    // Agrupar por rol
    const comisionesPorRol = {};
    comisiones.forEach(c => {
      const key = c.rolBeneficiario;
      if (!comisionesPorRol[key]) comisionesPorRol[key] = { cantidad: 0, total: 0 };
      comisionesPorRol[key].cantidad++;
      comisionesPorRol[key].total += Number(c.valor);
    });

    const totales = {
      cantidadComisiones: comisiones.length,
      totalPendiente: comisiones.filter(c => c.estado === 'PENDIENTE').reduce((s, c) => s + Number(c.valor), 0),
      totalPagado: comisiones.filter(c => c.estado === 'PAGADO').reduce((s, c) => s + Number(c.valor), 0),
      totalRevertido: comisiones.filter(c => c.estado === 'REVERTIDO').reduce((s, c) => s + Number(c.valor), 0)
    };

    return c.json(success({
      periodo,
      totales,
      comisionesPorVendedor: Object.entries(comisionesPorVendedor).map(([k, v]) => ({ codigo: k, ...v })),
      comisionesPorRol: Object.entries(comisionesPorRol).map(([k, v]) => ({ rol: k, ...v })),
      detalle: comisiones
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /mia-pass/reportes/conversion:
 *   get:
 *     summary: Tasa de conversión de formularios
 *     tags: [Mia Pass Reportes]
 */
miaPass.get('/reportes/conversion', requirePermission('miapass.reportes.conversion'), async (c) => {
  try {
    const { fechaInicio, fechaFin } = c.req.query();

    const whereFormularios = {};
    if (fechaInicio || fechaFin) {
      whereFormularios.createdAt = {};
      if (fechaInicio) whereFormularios.createdAt.gte = new Date(fechaInicio);
      if (fechaFin) whereFormularios.createdAt.lte = new Date(fechaFin + 'T23:59:59.999Z');
    }

    const [totalFormularios, formulariosPorEstado, formulariosConvertidos] = await Promise.all([
      prisma.formularioMiaPass.count({ where: whereFormularios }),
      prisma.formularioMiaPass.groupBy({
        by: ['estado'],
        where: whereFormularios,
        _count: { id: true }
      }),
      prisma.formularioMiaPass.count({
        where: {
          ...whereFormularios,
          suscripcionId: { not: null }
        }
      })
    ]);

    const tasaConversion = totalFormularios > 0
      ? ((formulariosConvertidos / totalFormularios) * 100).toFixed(2)
      : 0;

    return c.json(success({
      periodo: { fechaInicio, fechaFin },
      totalFormularios,
      formulariosConvertidos,
      tasaConversion: parseFloat(tasaConversion),
      porEstado: formulariosPorEstado.map(e => ({
        estado: e.estado,
        cantidad: e._count.id
      }))
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

module.exports = miaPass;
