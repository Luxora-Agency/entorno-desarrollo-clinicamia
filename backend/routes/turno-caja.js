/**
 * Rutas de Turnos de Caja (POS)
 */
const { Hono } = require('hono');
const turnoCajaService = require('../services/turno-caja.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const prisma = require('../db/prisma');

const turnoCaja = new Hono();

// Todas las rutas requieren autenticación
turnoCaja.use('*', authMiddleware);
turnoCaja.use('*', permissionMiddleware('admisiones'));

/**
 * @swagger
 * /turno-caja/mi-turno:
 *   get:
 *     summary: Obtiene el turno abierto del usuario actual
 *     tags: [Turno Caja]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Turno actual o null si no hay turno abierto
 */
turnoCaja.get('/mi-turno', async (c) => {
  try {
    const user = c.get('user');
    const turno = await turnoCajaService.getTurnoAbierto(user.id);

    if (turno) {
      const resumen = await turnoCajaService.getResumenTurno(turno.id);
      return c.json(success({ turno, resumen: resumen.totales }));
    }

    return c.json(success({ turno: null, resumen: null }));
  } catch (err) {
    console.error('[TurnoCaja] Error obteniendo turno:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /turno-caja/abrir:
 *   post:
 *     summary: Abre un nuevo turno de caja
 *     tags: [Turno Caja]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - montoInicial
 *             properties:
 *               montoInicial:
 *                 type: number
 *                 description: Monto inicial de caja (base)
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Turno abierto exitosamente
 *       400:
 *         description: Ya existe un turno abierto
 */
turnoCaja.post('/abrir', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const turno = await turnoCajaService.abrirTurno({
      usuarioId: user.id,
      montoInicial: body.montoInicial,
      observaciones: body.observaciones
    });

    return c.json(success({ turno }, 'Turno abierto exitosamente'), 201);
  } catch (err) {
    console.error('[TurnoCaja] Error abriendo turno:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /turno-caja/resumen/{id}:
 *   get:
 *     summary: Obtiene el resumen de un turno para cierre
 *     tags: [Turno Caja]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resumen del turno
 */
turnoCaja.get('/resumen/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const resumen = await turnoCajaService.getResumenTurno(id);
    return c.json(success(resumen));
  } catch (err) {
    console.error('[TurnoCaja] Error obteniendo resumen:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /turno-caja/cerrar/{id}:
 *   post:
 *     summary: Cierra un turno de caja
 *     tags: [Turno Caja]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - montoEfectivoCierre
 *             properties:
 *               montoEfectivoCierre:
 *                 type: number
 *                 description: Monto de efectivo contado al cierre
 *               responsableCierreId:
 *                 type: string
 *                 description: ID del usuario que recibe el dinero
 *               nombreResponsable:
 *                 type: string
 *                 description: Nombre del responsable (si no está en sistema)
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Turno cerrado exitosamente
 */
turnoCaja.post('/cerrar/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const resultado = await turnoCajaService.cerrarTurno(id, {
      montoEfectivoCierre: body.montoEfectivoCierre,
      responsableCierreId: body.responsableCierreId,
      nombreResponsable: body.nombreResponsable,
      observaciones: body.observaciones
    });

    return c.json(success(resultado, 'Turno cerrado exitosamente'));
  } catch (err) {
    console.error('[TurnoCaja] Error cerrando turno:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /turno-caja/registrar-pago/{turnoId}:
 *   post:
 *     summary: Registra un pago en el turno actual
 *     tags: [Turno Caja]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: turnoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monto
 *               - metodoPago
 *             properties:
 *               monto:
 *                 type: number
 *               metodoPago:
 *                 type: string
 *               facturaId:
 *                 type: string
 *               referencia:
 *                 type: string
 *               bancoDestino:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pago registrado en el turno
 */
turnoCaja.post('/registrar-pago/:turnoId', async (c) => {
  try {
    const { turnoId } = c.req.param();
    const body = await c.req.json();

    const pago = await turnoCajaService.registrarPago(turnoId, body);
    return c.json(success({ pago }, 'Pago registrado en turno'), 201);
  } catch (err) {
    console.error('[TurnoCaja] Error registrando pago:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /turno-caja/historial:
 *   get:
 *     summary: Obtiene el historial de turnos
 *     tags: [Turno Caja]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: usuarioId
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [ABIERTO, CERRADO, ANULADO]
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de turnos
 */
turnoCaja.get('/historial', async (c) => {
  try {
    const query = c.req.query();
    const resultado = await turnoCajaService.getHistorial(query);
    return c.json(paginated(resultado.turnos, resultado.pagination));
  } catch (err) {
    console.error('[TurnoCaja] Error obteniendo historial:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /turno-caja/responsables:
 *   get:
 *     summary: Obtiene la lista de usuarios que pueden recibir el cierre
 *     tags: [Turno Caja]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de responsables
 */
turnoCaja.get('/responsables', async (c) => {
  try {
    // Obtener usuarios con roles administrativos que pueden recibir dinero
    const responsables = await prisma.usuario.findMany({
      where: {
        activo: true,
        rol: {
          in: ['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATIVO', 'CONTADOR', 'TESORERO']
        }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        rol: true
      },
      orderBy: [
        { nombre: 'asc' },
        { apellido: 'asc' }
      ]
    });

    return c.json(success({ responsables }));
  } catch (err) {
    console.error('[TurnoCaja] Error obteniendo responsables:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /turno-caja/{id}:
 *   get:
 *     summary: Obtiene un turno por ID
 *     tags: [Turno Caja]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del turno
 *       404:
 *         description: Turno no encontrado
 */
turnoCaja.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const turno = await turnoCajaService.getById(id);
    return c.json(success({ turno }));
  } catch (err) {
    console.error('[TurnoCaja] Error obteniendo turno:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /turno-caja/anular/{id}:
 *   post:
 *     summary: Anula un turno abierto sin pagos
 *     tags: [Turno Caja]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Turno anulado
 */
turnoCaja.post('/anular/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json().catch(() => ({}));

    const turno = await turnoCajaService.anularTurno(id, body.motivo);
    return c.json(success({ turno }, 'Turno anulado'));
  } catch (err) {
    console.error('[TurnoCaja] Error anulando turno:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = turnoCaja;
