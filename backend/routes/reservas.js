/**
 * Rutas de Reservas Temporales de Horarios
 *
 * Sistema de reservas temporales para prevenir doble-reservación de citas.
 * Las reservas expiran automáticamente después de 5 minutos si no se confirman.
 */
const { Hono } = require('hono');
const reservaService = require('../services/reserva.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { z, ZodError } = require('zod');

const router = new Hono();

// Schema de validación para crear reserva
const createReservaSchema = z.object({
  doctor_id: z.string().uuid({ message: 'ID de doctor inválido' }),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha debe ser YYYY-MM-DD' }),
  hora: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Hora debe ser HH:MM' }),
  duracion_minutos: z.number().int().positive().default(30),
  session_id: z.string().min(1, { message: 'Session ID es requerido' }),
});

// Schema para confirmar reserva
const confirmReservaSchema = z.object({
  paciente_id: z.string().uuid({ message: 'ID de paciente inválido' }),
  especialidad_id: z.string().uuid({ message: 'ID de especialidad inválido' }).optional().nullable(),
  examen_procedimiento_id: z.string().uuid({ message: 'ID de examen/procedimiento inválido' }).optional().nullable(),
  tipo_cita: z.enum(['Especialidad', 'Examen', 'Procedimiento', 'Interconsulta']).default('Especialidad'),
  duracion_minutos: z.number().int().positive().default(30),
  costo: z.number().min(0).default(0),
  motivo: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  estado: z.enum(['Programada', 'Confirmada']).default('Programada'),
  prioridad: z.enum(['Baja', 'Media', 'Alta', 'Urgente']).default('Media'),
  metodo_pago: z.enum(['Efectivo', 'Tarjeta', 'Transferencia', 'EPS', 'Otro']).optional(),
  estado_pago: z.enum(['Pendiente', 'Parcial', 'Pagado']).optional(),
  cubierto_por_eps: z.boolean().optional(),
  session_id: z.string().min(1, { message: 'Session ID es requerido' }),
});

/**
 * POST /reservas
 * Crear una nueva reserva temporal de horario
 */
router.post('/', authMiddleware, permissionMiddleware('citas'), async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = createReservaSchema.parse(body);

    const reserva = await reservaService.reservarSlot(
      validatedData.doctor_id,
      validatedData.fecha,
      validatedData.hora,
      validatedData.duracion_minutos,
      validatedData.session_id
    );

    return c.json(success(reserva, 'Horario reservado temporalmente'), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json(error('Error de validación', err.errors), 400);
    }
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /reservas/:id/confirmar
 * Confirmar una reserva y crear la cita
 */
router.post('/:id/confirmar', authMiddleware, permissionMiddleware('citas'), async (c) => {
  try {
    const reservaId = c.req.param('id');
    const body = await c.req.json();
    const validatedData = confirmReservaSchema.parse(body);

    const cita = await reservaService.confirmarReserva(
      reservaId,
      validatedData,
      validatedData.session_id
    );

    return c.json(success(cita, 'Cita creada exitosamente'), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json(error('Error de validación', err.errors), 400);
    }
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /reservas/:id
 * Liberar una reserva (cancelar antes de confirmar)
 */
router.delete('/:id', authMiddleware, async (c) => {
  try {
    const reservaId = c.req.param('id');
    const sessionId = c.req.header('X-Session-ID') || c.req.query('session_id');

    if (!sessionId) {
      return c.json(error('Session ID es requerido'), 400);
    }

    const resultado = await reservaService.liberarReserva(reservaId, sessionId);
    return c.json(success(resultado, 'Reserva liberada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /reservas/:id/extender
 * Extender el tiempo de una reserva
 */
router.put('/:id/extender', authMiddleware, async (c) => {
  try {
    const reservaId = c.req.param('id');
    const body = await c.req.json();
    const sessionId = body.session_id || c.req.header('X-Session-ID');

    if (!sessionId) {
      return c.json(error('Session ID es requerido'), 400);
    }

    const reserva = await reservaService.extenderReserva(
      reservaId,
      sessionId,
      body.minutos_extension || 5
    );

    return c.json(success(reserva, 'Reserva extendida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /reservas/:id
 * Obtener una reserva por ID
 */
router.get('/:id', authMiddleware, async (c) => {
  try {
    const reservaId = c.req.param('id');
    const reserva = await reservaService.getById(reservaId);
    return c.json(success(reserva));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /reservas/doctor/:doctorId
 * Obtener reservas activas de un doctor en una fecha
 */
router.get('/doctor/:doctorId', authMiddleware, async (c) => {
  try {
    const doctorId = c.req.param('doctorId');
    const fecha = c.req.query('fecha');

    if (!fecha) {
      return c.json(error('Fecha es requerida (query param: fecha)'), 400);
    }

    const reservas = await reservaService.getReservasActivas(doctorId, fecha);
    return c.json(success(reservas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = router;
