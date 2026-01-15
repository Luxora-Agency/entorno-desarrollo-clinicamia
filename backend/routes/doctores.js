/**
 * Rutas de doctores
 */
const { Hono } = require('hono');
const doctorService = require('../services/doctor.service');
const { authMiddleware, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { doctorSchema, updateDoctorSchema } = require('../validators/doctor.schema');
const { success, error } = require('../utils/response');

const doctores = new Hono();

// Aplicar middleware de autenticación
doctores.use('/*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         apellido:
 *           type: string
 *         cedula:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         telefono:
 *           type: string
 *         licenciaMedica:
 *           type: string
 *         universidad:
 *           type: string
 *         aniosExperiencia:
 *           type: integer
 *         biografia:
 *           type: string
 *         especialidades:
 *           type: array
 *           items:
 *             type: string
 *         activo:
 *           type: boolean
 *     DoctorInput:
 *       type: object
 *       required:
 *         - nombre
 *         - apellido
 *         - cedula
 *         - email
 *         - telefono
 *       properties:
 *         nombre:
 *           type: string
 *           minLength: 2
 *         apellido:
 *           type: string
 *           minLength: 2
 *         cedula:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         telefono:
 *           type: string
 *         licencia_medica:
 *           type: string
 *         universidad:
 *           type: string
 *         anios_experiencia:
 *           type: integer
 *         biografia:
 *           type: string
 *         especialidades_ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         horarios:
 *           type: object
 *         activo:
 *           type: boolean
 * tags:
 *   name: Doctores
 *   description: Gestión de médicos
 */

/**
 * @swagger
 * /doctores:
 *   get:
 *     summary: Obtener todos los doctores
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre, apellido o cédula
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de doctores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Doctor'
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Error del servidor
 */
/**
 * @swagger
 * /doctores/mi-agenda:
 *   get:
 *     summary: Obtener mi perfil de doctor y horarios (para doctores)
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del doctor con horarios
 */
doctores.get('/mi-agenda', async (c) => {
  try {
    const user = c.get('user');
    if (user.rol !== 'DOCTOR') {
      return c.json(error('Solo doctores pueden acceder a esta ruta'), 403);
    }

    const result = await doctorService.listar({ usuarioId: user.id, limit: 1 });
    if (!result.doctores || result.doctores.length === 0) {
      return c.json(error('Perfil de doctor no encontrado'), 404);
    }

    return c.json(success(result.doctores[0], 'Perfil obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /doctores/mi-agenda/horarios:
 *   patch:
 *     summary: Actualizar mis propios horarios (para doctores)
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               horarios:
 *                 type: object
 *     responses:
 *       200:
 *         description: Horarios actualizados
 */
doctores.patch('/mi-agenda/horarios', async (c) => {
  try {
    const user = c.get('user');
    console.log('[PATCH /mi-agenda/horarios] Usuario:', { id: user.id, rol: user.rol });

    if (user.rol !== 'DOCTOR') {
      return c.json(error('Solo doctores pueden acceder a esta ruta'), 403);
    }

    // Obtener el doctor asociado al usuario
    const doctorResult = await doctorService.listar({ usuarioId: user.id, limit: 1 });
    if (!doctorResult.doctores || doctorResult.doctores.length === 0) {
      console.log('[PATCH /mi-agenda/horarios] Doctor no encontrado para usuario:', user.id);
      return c.json(error('Perfil de doctor no encontrado'), 404);
    }

    const doctorId = doctorResult.doctores[0].id;
    const { horarios } = await c.req.json();
    console.log('[PATCH /mi-agenda/horarios] Guardando horarios:', { doctorId, horariosKeys: Object.keys(horarios || {}) });

    const result = await doctorService.actualizarHorarios(doctorId, horarios);
    console.log('[PATCH /mi-agenda/horarios] Horarios guardados exitosamente');
    return c.json(success(result, 'Horarios actualizados exitosamente'));
  } catch (err) {
    console.error('[PATCH /mi-agenda/horarios] Error:', err.message);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /doctores/mi-perfil:
 *   put:
 *     summary: Actualizar mi propio perfil (para doctores)
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Doctor'
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       403:
 *         description: Solo doctores pueden acceder
 *       404:
 *         description: Perfil no encontrado
 */
doctores.put('/mi-perfil', validate(updateDoctorSchema), async (c) => {
  try {
    const user = c.get('user');
    // Verificar rol (case-insensitive)
    const userRol = (user.rol || '').toUpperCase();
    if (userRol !== 'DOCTOR' && userRol !== 'MEDICO') {
      return c.json(error('Solo doctores pueden acceder a esta ruta'), 403);
    }

    // Obtener el doctor asociado al usuario
    const doctorResult = await doctorService.listar({ usuarioId: user.id, limit: 1 });
    if (!doctorResult.doctores || doctorResult.doctores.length === 0) {
      return c.json(error('Perfil de doctor no encontrado'), 404);
    }

    const doctorId = doctorResult.doctores[0].id;
    const body = c.req.validData;

    // Campos restringidos que un doctor no puede cambiar por sí mismo
    delete body.activo;
    delete body.rol;
    delete body.cedula; // La cédula no debe cambiar

    const doctor = await doctorService.actualizar(doctorId, body);
    return c.json(success({ doctor }, 'Perfil actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

doctores.get('/', async (c) => {
  try {
    const { search = '', limit = '50', page = '1', activo, usuarioId } = c.req.query();
    const result = await doctorService.listar({
      search,
      limit: parseInt(limit),
      page: parseInt(page),
      activo: activo !== undefined ? activo === 'true' : undefined,
      usuarioId: usuarioId || '',
    });
    return c.json({ success: true, data: result.doctores, pagination: result.pagination });
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /doctores/{id}:
 *   get:
 *     summary: Obtener un doctor por ID
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalles del doctor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Doctor no encontrado
 *       500:
 *         description: Error del servidor
 */
doctores.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const doctor = await doctorService.obtenerPorId(id);
    return c.json(success({ doctor }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /doctores:
 *   post:
 *     summary: Crear un nuevo doctor
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorInput'
 *     responses:
 *       201:
 *         description: Doctor creado exitosamente
 *       400:
 *         description: Datos inválidos o doctor ya existente
 *       500:
 *         description: Error del servidor
 */
doctores.post('/', requirePermission('doctores.create'), validate(doctorSchema), async (c) => {
  try {
    const body = c.req.validData;
    const doctor = await doctorService.crear(body);
    return c.json(success({ doctor }, 'Doctor creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /doctores/{id}:
 *   put:
 *     summary: Actualizar un doctor existente
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorInput'
 *     responses:
 *       200:
 *         description: Doctor actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Doctor no encontrado
 *       500:
 *         description: Error del servidor
 */
doctores.put('/:id', requirePermission('doctores.update'), validate(updateDoctorSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const body = c.req.validData;
    const doctor = await doctorService.actualizar(id, body);
    return c.json(success({ doctor }, 'Doctor actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /doctores/{id}/toggle-activo:
 *   patch:
 *     summary: Activar o desactivar un doctor
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Estado del doctor actualizado
 *       404:
 *         description: Doctor no encontrado
 *       500:
 *         description: Error del servidor
 */
doctores.patch('/:id/toggle-activo', requirePermission('doctores.update'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await doctorService.toggleActivo(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /doctores/{id}/horarios:
 *   patch:
 *     summary: Actualizar horarios de un doctor
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               horarios:
 *                 type: object
 *                 description: Objeto con horarios por día de semana (0-6)
 *     responses:
 *       200:
 *         description: Horarios actualizados exitosamente
 *       404:
 *         description: Doctor no encontrado
 *       500:
 *         description: Error del servidor
 */
doctores.patch('/:id/horarios', requirePermission('doctores.update'), async (c) => {
  try {
    const { id } = c.req.param();
    const { horarios } = await c.req.json();
    const result = await doctorService.actualizarHorarios(id, horarios);
    return c.json(success(result, 'Horarios actualizados exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /doctores/{id}:
 *   delete:
 *     summary: Eliminar un doctor
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Doctor eliminado exitosamente
 *       404:
 *         description: Doctor no encontrado
 *       500:
 *         description: Error del servidor
 */
doctores.delete('/:id', requirePermission('doctores.delete'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await doctorService.eliminar(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = doctores;
