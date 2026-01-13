/**
 * Rutas de Bloqueos de Agenda
 *
 * Sistema de bloqueos de horarios para doctores:
 * - Vacaciones
 * - Congresos
 * - Permisos personales
 * - Bloqueos parciales (horas específicas)
 * - Modo solo emergencias
 */
const { Hono } = require('hono');
const { bloqueoService, TIPOS_BLOQUEO } = require('../services/bloqueo.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { z, ZodError } = require('zod');

const router = new Hono();

// Schema de validación para crear bloqueo
const createBloqueoSchema = z.object({
  doctor_id: z.string().uuid({ message: 'ID de doctor inválido' }),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inicio debe ser YYYY-MM-DD' }),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha fin debe ser YYYY-MM-DD' }),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Hora inicio debe ser HH:MM' }).optional().nullable(),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Hora fin debe ser HH:MM' }).optional().nullable(),
  motivo: z.string().min(1, { message: 'Motivo es requerido' }).max(255),
  tipo: z.enum(Object.values(TIPOS_BLOQUEO)).default('BLOQUEO'),
});

// Schema para actualizar bloqueo
const updateBloqueoSchema = z.object({
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  motivo: z.string().min(1).max(255).optional(),
  tipo: z.enum(Object.values(TIPOS_BLOQUEO)).optional(),
  activo: z.boolean().optional(),
});

/**
 * GET /bloqueos/tipos
 * Obtener los tipos de bloqueo disponibles
 */
router.get('/tipos', authMiddleware, (c) => {
  return c.json(success(TIPOS_BLOQUEO, 'Tipos de bloqueo'));
});

/**
 * GET /bloqueos/mis-bloqueos
 * Obtener mis propios bloqueos (para doctores)
 */
router.get('/mis-bloqueos', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (user.rol !== 'DOCTOR') {
      return c.json(error('Solo doctores pueden acceder a esta ruta'), 403);
    }

    const fechaInicio = c.req.query('fecha_inicio');
    const fechaFin = c.req.query('fecha_fin');

    const bloqueos = await bloqueoService.obtenerBloqueos(user.id, fechaInicio, fechaFin);
    return c.json(success(bloqueos));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /bloqueos/mis-bloqueos
 * Crear un bloqueo para mi agenda (para doctores)
 */
router.post('/mis-bloqueos', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (user.rol !== 'DOCTOR') {
      return c.json(error('Solo doctores pueden acceder a esta ruta'), 403);
    }

    const body = await c.req.json();
    // Usar el ID del usuario como doctor_id
    const validatedData = createBloqueoSchema.parse({
      ...body,
      doctor_id: user.id
    });

    const bloqueo = await bloqueoService.crearBloqueo(validatedData, user.id);
    return c.json(success(bloqueo, 'Bloqueo creado exitosamente'), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json(error('Error de validación', err.errors), 400);
    }
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /bloqueos/mis-bloqueos/:id
 * Eliminar un bloqueo propio (para doctores)
 */
router.delete('/mis-bloqueos/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (user.rol !== 'DOCTOR') {
      return c.json(error('Solo doctores pueden acceder a esta ruta'), 403);
    }

    const bloqueoId = c.req.param('id');

    // Verificar que el bloqueo pertenece al doctor
    const bloqueo = await bloqueoService.obtenerPorId(bloqueoId);
    if (bloqueo.doctorId !== user.id) {
      return c.json(error('No tienes permiso para eliminar este bloqueo'), 403);
    }

    const resultado = await bloqueoService.eliminarBloqueo(bloqueoId);
    return c.json(success(resultado, 'Bloqueo eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /bloqueos
 * Crear un nuevo bloqueo de agenda
 */
router.post('/', authMiddleware, permissionMiddleware('agenda'), async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = createBloqueoSchema.parse(body);
    const userId = c.get('user').id;

    const bloqueo = await bloqueoService.crearBloqueo(validatedData, userId);
    return c.json(success(bloqueo, 'Bloqueo creado exitosamente'), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json(error('Error de validación', err.errors), 400);
    }
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /bloqueos/doctor/:doctorId
 * Obtener bloqueos de un doctor (con filtro opcional de fechas)
 */
router.get('/doctor/:doctorId', authMiddleware, async (c) => {
  try {
    const doctorId = c.req.param('doctorId');
    const fechaInicio = c.req.query('fecha_inicio');
    const fechaFin = c.req.query('fecha_fin');

    const bloqueos = await bloqueoService.obtenerBloqueos(doctorId, fechaInicio, fechaFin);
    return c.json(success(bloqueos));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /bloqueos/doctor/:doctorId/resumen
 * Obtener resumen mensual de bloqueos
 */
router.get('/doctor/:doctorId/resumen', authMiddleware, async (c) => {
  try {
    const doctorId = c.req.param('doctorId');
    const anio = parseInt(c.req.query('anio') || new Date().getFullYear());
    const mes = parseInt(c.req.query('mes') || (new Date().getMonth() + 1));

    if (isNaN(anio) || isNaN(mes) || mes < 1 || mes > 12) {
      return c.json(error('Año y mes deben ser valores numéricos válidos'), 400);
    }

    const resumen = await bloqueoService.obtenerResumenMes(doctorId, anio, mes);
    return c.json(success(resumen));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /bloqueos/verificar
 * Verificar si una fecha/hora está bloqueada para un doctor
 */
router.get('/verificar', authMiddleware, async (c) => {
  try {
    const doctorId = c.req.query('doctor_id');
    const fecha = c.req.query('fecha');
    const hora = c.req.query('hora');

    if (!doctorId || !fecha) {
      return c.json(error('doctor_id y fecha son requeridos'), 400);
    }

    const resultado = await bloqueoService.verificarBloqueo(doctorId, fecha, hora);
    return c.json(success(resultado || { bloqueado: false }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /bloqueos/:id
 * Obtener un bloqueo por ID
 */
router.get('/:id', authMiddleware, async (c) => {
  try {
    const bloqueoId = c.req.param('id');
    const bloqueo = await bloqueoService.obtenerPorId(bloqueoId);
    return c.json(success(bloqueo));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /bloqueos/:id
 * Actualizar un bloqueo
 */
router.put('/:id', authMiddleware, permissionMiddleware('agenda'), async (c) => {
  try {
    const bloqueoId = c.req.param('id');
    const body = await c.req.json();
    const validatedData = updateBloqueoSchema.parse(body);

    const bloqueo = await bloqueoService.actualizarBloqueo(bloqueoId, validatedData);
    return c.json(success(bloqueo, 'Bloqueo actualizado exitosamente'));
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json(error('Error de validación', err.errors), 400);
    }
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PATCH /bloqueos/:id/desactivar
 * Desactivar un bloqueo (soft delete)
 */
router.patch('/:id/desactivar', authMiddleware, permissionMiddleware('agenda'), async (c) => {
  try {
    const bloqueoId = c.req.param('id');
    const bloqueo = await bloqueoService.desactivarBloqueo(bloqueoId);
    return c.json(success(bloqueo, 'Bloqueo desactivado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /bloqueos/:id
 * Eliminar un bloqueo permanentemente
 */
router.delete('/:id', authMiddleware, permissionMiddleware('agenda'), async (c) => {
  try {
    const bloqueoId = c.req.param('id');
    const resultado = await bloqueoService.eliminarBloqueo(bloqueoId);
    return c.json(success(resultado, 'Bloqueo eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = router;
