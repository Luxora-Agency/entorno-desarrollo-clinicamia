/**
 * Rutas de citas
 */
const { Hono } = require('hono');
const citaService = require('../services/cita.service');
const emailService = require('../services/email.service');
const prisma = require('../db/prisma');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { ZodError } = require('zod');


const citas = new Hono();

// Helper para manejar errores
const handleError = (c, err) => {
  if (err instanceof ZodError) {
    const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return c.json(error(`Error de validación: ${messages}`), 400);
  }
  return c.json(error(err.message), err.statusCode || 500);
};

/**
 * Middleware para validar propiedad de cita
 * Los doctores solo pueden modificar sus propias citas
 * Los roles administrativos pueden modificar cualquier cita
 */
const validateCitaOwnership = async (c, next) => {
  const user = c.get('user');
  const { id } = c.req.param();

  if (!user || !id) {
    await next();
    return;
  }

  // Roles que pueden modificar cualquier cita
  const adminRoles = ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA', 'ADMINISTRATIVO'];
  const userRole = (user.rol || '').toUpperCase();

  if (adminRoles.includes(userRole)) {
    await next();
    return;
  }

  // Para doctores, verificar que la cita les pertenece
  if (userRole === 'DOCTOR' || userRole === 'MEDICO') {
    try {
      const cita = await citaService.getById(id);
      // doctorId en citas apunta a Usuario.id
      if (cita.doctorId !== user.id) {
        return c.json(error('No tiene permisos para modificar esta cita'), 403);
      }
    } catch (err) {
      // Si la cita no existe, dejar que el handler normal lo maneje
      await next();
      return;
    }
  }

  await next();
};

// Todas las rutas requieren autenticación
citas.use('*', authMiddleware);

// Todas las rutas requieren permiso al módulo 'citas'
citas.use('*', permissionMiddleware('citas'));

/**
 * @swagger
 * components:
 *   schemas:
 *     Cita:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         fecha:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: string
 *           enum: [PENDIENTE, CONFIRMADA, CANCELADA, REALIZADA]
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         doctor_id:
 *           type: string
 *           format: uuid
 *         especialidad_id:
 *           type: string
 *         observaciones:
 *           type: string
 *     CitaInput:
 *       type: object
 *       required:
 *         - fecha
 *         - paciente_id
 *         - doctor_id
 *       properties:
 *         fecha:
 *           type: string
 *           format: date-time
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         doctor_id:
 *           type: string
 *           format: uuid
 *         especialidad_id:
 *           type: string
 *         observaciones:
 *           type: string
 * tags:
 *   name: Citas
 *   description: Gestión de citas médicas
 */

/**
 * @swagger
 * /citas:
 *   get:
 *     summary: Obtener todas las citas paginadas
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *         description: Filtrar por doctor
 *       - in: query
 *         name: paciente_id
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *     responses:
 *       200:
 *         description: Lista de citas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cita'
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Error del servidor
 */
citas.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await citaService.getAll(query);
    return c.json(paginated(result.citas, result.pagination));
  } catch (err) {
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas/{id}:
 *   get:
 *     summary: Obtener una cita por ID
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cita
 *     responses:
 *       200:
 *         description: Datos de la cita
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     cita:
 *                       $ref: '#/components/schemas/Cita'
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
citas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const cita = await citaService.getById(id);
    return c.json(success({ cita }));
  } catch (err) {
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas:
 *   post:
 *     summary: Crear una nueva cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CitaInput'
 *     responses:
 *       201:
 *         description: Cita creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     cita:
 *                       $ref: '#/components/schemas/Cita'
 *       500:
 *         description: Error del servidor
 */
citas.post('/', async (c) => {
  try {
    const data = await c.req.json();
    console.log('[Citas POST] Datos recibidos:', JSON.stringify(data, null, 2));
    const cita = await citaService.create(data);
    return c.json(success({ cita }, 'Cita creada exitosamente'), 201);
  } catch (err) {
    console.error('[Citas POST] Error:', err.message);
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas/{id}:
 *   put:
 *     summary: Actualizar una cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cita
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CitaInput'
 *     responses:
 *       200:
 *         description: Cita actualizada exitosamente
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
citas.put('/:id', validateCitaOwnership, async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const cita = await citaService.update(id, data);
    return c.json(success({ cita }, 'Cita actualizada exitosamente'));
  } catch (err) {
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas/estado/{id}:
 *   post:
 *     summary: Actualizar estado de una cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cita
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [PENDIENTE, CONFIRMADA, CANCELADA, REALIZADA]
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
citas.post('/estado/:id', validateCitaOwnership, async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const cita = await citaService.update(id, data);

    // Si el nuevo estado es NoAsistio, enviar email de notificación
    if (data.estado === 'NoAsistio') {
      try {
        // Obtener datos completos de la cita para el email
        const citaCompleta = await prisma.cita.findUnique({
          where: { id },
          include: {
            paciente: { select: { nombre: true, apellido: true, email: true } },
            doctor: { select: { nombre: true, apellido: true } },
            especialidad: { select: { titulo: true } }
          }
        });

        if (citaCompleta?.paciente?.email) {
          await emailService.sendNoShowEmail({
            to: citaCompleta.paciente.email,
            paciente: {
              nombre: citaCompleta.paciente.nombre,
              apellido: citaCompleta.paciente.apellido
            },
            cita: {
              fecha: citaCompleta.fecha,
              hora: citaCompleta.hora
            },
            doctor: citaCompleta.doctor ? {
              nombre: citaCompleta.doctor.nombre,
              apellido: citaCompleta.doctor.apellido
            } : null,
            especialidad: citaCompleta.especialidad?.titulo || 'Consulta General'
          });
          console.log('[Citas] Email de No Asistió enviado a:', citaCompleta.paciente.email);
        }
      } catch (emailError) {
        console.error('[Citas] Error enviando email de No Asistió:', emailError.message);
      }
    }

    return c.json(success({ cita }, 'Cita actualizada exitosamente'));
  } catch (err) {
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas/{id}:
 *   delete:
 *     summary: Cancelar (eliminar) una cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la cita
 *     responses:
 *       200:
 *         description: Cita cancelada correctamente
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
citas.delete('/:id', validateCitaOwnership, async (c) => {
  try {
    const { id } = c.req.param();
    await citaService.cancel(id);
    return c.json(success(null, 'Cita cancelada correctamente'));
  } catch (err) {
    return handleError(c, err);
  }
});

/**
 * @swagger
 * /citas/notificar-reagendamiento:
 *   post:
 *     summary: Enviar notificación de cita re-agendada por email
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - citaAnteriorId
 *               - citaNuevaId
 *             properties:
 *               citaAnteriorId:
 *                 type: string
 *                 format: uuid
 *               citaNuevaId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Notificación enviada
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
citas.post('/notificar-reagendamiento', async (c) => {
  try {
    const { citaAnteriorId, citaNuevaId } = await c.req.json();

    if (!citaAnteriorId || !citaNuevaId) {
      return c.json(error('Se requieren citaAnteriorId y citaNuevaId'), 400);
    }

    // Obtener la cita anterior con paciente
    const citaAnterior = await prisma.cita.findUnique({
      where: { id: citaAnteriorId },
      include: {
        paciente: true,
        especialidad: true
      }
    });

    if (!citaAnterior) {
      return c.json(error('Cita anterior no encontrada'), 404);
    }

    // Obtener la nueva cita con doctor y especialidad
    const citaNueva = await prisma.cita.findUnique({
      where: { id: citaNuevaId },
      include: {
        doctor: true,
        especialidad: true
      }
    });

    if (!citaNueva) {
      return c.json(error('Nueva cita no encontrada'), 404);
    }

    // Verificar que el paciente tenga email
    if (!citaAnterior.paciente?.email) {
      console.warn('[Citas] Paciente sin email, no se puede enviar notificación');
      return c.json(success({ emailSent: false, reason: 'Paciente sin email' }, 'No se envió email: paciente sin correo'));
    }

    // Enviar email de notificación
    const emailResult = await emailService.sendRescheduleEmail({
      to: citaAnterior.paciente.email,
      paciente: {
        nombre: citaAnterior.paciente.nombre,
        apellido: citaAnterior.paciente.apellido
      },
      citaAnterior: {
        fecha: citaAnterior.fecha,
        hora: citaAnterior.hora
      },
      citaNueva: {
        fecha: citaNueva.fecha,
        hora: citaNueva.hora
      },
      doctor: citaNueva.doctor ? {
        nombre: citaNueva.doctor.nombre,
        apellido: citaNueva.doctor.apellido
      } : null,
      especialidad: citaNueva.especialidad?.titulo || citaAnterior.especialidad?.titulo || 'Consulta General'
    });

    console.log('[Citas] Email de re-agendamiento enviado:', emailResult);

    return c.json(success({
      emailSent: emailResult.success,
      emailId: emailResult.id
    }, emailResult.success ? 'Notificación enviada exitosamente' : 'Error al enviar notificación'));
  } catch (err) {
    console.error('[Citas] Error enviando notificación:', err);
    return handleError(c, err);
  }
});

module.exports = citas;
