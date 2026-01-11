/**
 * Rutas de pacientes
 */
const { Hono } = require('hono');
const pacienteService = require('../services/paciente.service');
const citaService = require('../services/cita.service');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createPacienteSchema, updatePacienteSchema } = require('../validators/paciente.schema');
const { success, error, paginated } = require('../utils/response');

const pacientes = new Hono();

// Todas las rutas requieren autenticación
pacientes.use('*', authMiddleware);

// =============================================
// Rutas para el perfil del paciente autenticado
// =============================================

/**
 * @swagger
 * /pacientes/me:
 *   get:
 *     summary: Obtener perfil del paciente autenticado
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del paciente
 *       404:
 *         description: Paciente no encontrado
 */
pacientes.get('/me', async (c) => {
  try {
    const user = c.get('user');
    const paciente = await pacienteService.getByEmail(user.email);
    return c.json(success(paciente, 'Perfil obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/completar-perfil:
 *   post:
 *     summary: Completar perfil de paciente después del registro
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 */
pacientes.post('/completar-perfil', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const paciente = await pacienteService.completarPerfil(user.email, data);
    return c.json(success(paciente, 'Perfil completado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/actualizar-perfil:
 *   put:
 *     summary: Actualizar perfil del paciente autenticado
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 */
pacientes.put('/actualizar-perfil', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const paciente = await pacienteService.actualizarPerfil(user.email, data);
    return c.json(success(paciente, 'Perfil actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/mis-solicitudes-hce:
 *   get:
 *     summary: Obtener solicitudes de historia clínica del paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 */
pacientes.get('/mis-solicitudes-hce', async (c) => {
  try {
    const user = c.get('user');
    const solicitudes = await pacienteService.getSolicitudesHCE(user.email);
    return c.json(success(solicitudes, 'Solicitudes obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/solicitar-historia-medica:
 *   post:
 *     summary: Solicitar copia de historia clínica
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 */
pacientes.post('/solicitar-historia-medica', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const solicitud = await pacienteService.solicitarHistoriaMedica(user.email, data);
    return c.json(success(solicitud, 'Solicitud enviada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/descargar-historia/{id}:
 *   get:
 *     summary: Descargar historia clínica como PDF
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
pacientes.get('/descargar-historia/:id', async (c) => {
  try {
    const user = c.get('user');
    const solicitudId = c.req.param('id');
    const pdfBuffer = await pacienteService.descargarHistoriaMedica(user.email, solicitudId);

    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="historia-medica-${solicitudId}.pdf"`);
    return c.body(pdfBuffer);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// =============================================
// Rutas de citas para el paciente autenticado
// =============================================

/**
 * @swagger
 * /pacientes/mis-citas:
 *   get:
 *     summary: Obtener citas próximas del paciente autenticado
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de citas del paciente
 */
pacientes.get('/mis-citas', async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const result = await citaService.getCitasByPacienteEmail(user.email, {
      ...query,
      upcoming: true // Solo citas futuras por defecto
    });
    return c.json(paginated(result.citas, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/historial-citas:
 *   get:
 *     summary: Obtener historial de citas del paciente (citas pasadas)
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Historial de citas del paciente
 */
pacientes.get('/historial-citas', async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const result = await citaService.getHistorialByPacienteEmail(user.email, query);
    return c.json(paginated(result.citas, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/citas/{id}:
 *   get:
 *     summary: Obtener detalle de una cita del paciente
 *     tags: [Pacientes]
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
 *         description: Detalle de la cita
 *       404:
 *         description: Cita no encontrada
 */
pacientes.get('/citas/:id', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const cita = await citaService.getCitaByIdForPaciente(id, user.email);
    return c.json(success({ cita }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/citas/{id}/cancelar:
 *   post:
 *     summary: Cancelar una cita del paciente
 *     tags: [Pacientes]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cita cancelada exitosamente
 *       400:
 *         description: No se puede cancelar la cita
 *       404:
 *         description: Cita no encontrada
 */
pacientes.post('/citas/:id/cancelar', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const data = await c.req.json().catch(() => ({}));
    const cita = await citaService.cancelByPaciente(id, user.email, data.motivo);
    return c.json(success({ cita }, 'Cita cancelada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/citas/{id}/reprogramar:
 *   post:
 *     summary: Reprogramar una cita del paciente
 *     tags: [Pacientes]
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
 *             required:
 *               - fecha
 *               - hora
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *               hora:
 *                 type: string
 *                 example: "09:00"
 *     responses:
 *       200:
 *         description: Cita reprogramada exitosamente
 *       400:
 *         description: No se puede reprogramar la cita o horario no disponible
 *       404:
 *         description: Cita no encontrada
 */
pacientes.post('/citas/:id/reprogramar', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const data = await c.req.json();

    if (!data.fecha || !data.hora) {
      return c.json(error('Fecha y hora son requeridos'), 400);
    }

    const cita = await citaService.reprogramarByPaciente(id, user.email, data.fecha, data.hora);
    return c.json(success({ cita }, 'Cita reprogramada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// =============================================
// Rutas administrativas
// =============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactoEmergencia:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         telefono:
 *           type: string
 *         parentesco:
 *           type: string
 *     Paciente:
 *       type: object
 *       required:
 *         - nombre
 *         - apellido
 *         - tipo_documento
 *         - cedula
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         apellido:
 *           type: string
 *         tipo_documento:
 *           type: string
 *         cedula:
 *           type: string
 *         fecha_nacimiento:
 *           type: string
 *           format: date-time
 *         genero:
 *           type: string
 *         estado_civil:
 *           type: string
 *         direccion:
 *           type: string
 *         telefono:
 *           type: string
 *         email:
 *           type: string
 *         contactos_emergencia:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContactoEmergencia'
 *         eps:
 *           type: string
 *         regimen:
 *           type: string
 *         activo:
 *           type: boolean
 *     PacienteInput:
 *       type: object
 *       required:
 *         - nombre
 *         - apellido
 *         - tipo_documento
 *         - cedula
 *       properties:
 *         nombre:
 *           type: string
 *         apellido:
 *           type: string
 *         tipo_documento:
 *           type: string
 *         cedula:
 *           type: string
 *         fecha_nacimiento:
 *           type: string
 *           format: date
 *         genero:
 *           type: string
 *         estado_civil:
 *           type: string
 *         pais_nacimiento:
 *           type: string
 *         departamento:
 *           type: string
 *         municipio:
 *           type: string
 *         barrio:
 *           type: string
 *         direccion:
 *           type: string
 *         telefono:
 *           type: string
 *         email:
 *           type: string
 *         contactos_emergencia:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContactoEmergencia'
 *         eps:
 *           type: string
 *         regimen:
 *           type: string
 *         tipo_afiliacion:
 *           type: string
 *         nivel_sisben:
 *           type: string
 *         numero_autorizacion:
 *           type: string
 *         fecha_afiliacion:
 *           type: string
 *           format: date
 *         convenio:
 *           type: string
 *         carnet_poliza:
 *           type: string
 *         arl:
 *           type: string
 *         ocupacion:
 *           type: string
 *         nivel_educacion:
 *           type: string
 *         empleador_actual:
 *           type: string
 *         tipo_usuario:
 *           type: string
 *         referido_por:
 *           type: string
 *         nombre_refiere:
 *           type: string
 *         tipo_paciente:
 *           type: string
 *         categoria:
 *           type: string
 *         tipo_sangre:
 *           type: string
 *         peso:
 *           type: number
 *         altura:
 *           type: number
 *         alergias:
 *           type: string
 *         enfermedades_cronicas:
 *           type: string
 *         medicamentos_actuales:
 *           type: string
 *         antecedentes_quirurgicos:
 *           type: string
 * tags:
 *   name: Pacientes
 *   description: Gestión de pacientes
 */

/**
 * @swagger
 * /pacientes/search:
 *   get:
 *     summary: Búsqueda rápida de pacientes
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Término de búsqueda (nombre, cédula)
 *     responses:
 *       200:
 *         description: Lista de pacientes encontrados
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
 *                     pacientes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Paciente'
 *       500:
 *         description: Error del servidor
 */
pacientes.get('/search', async (c) => {
  try {
    const { q } = c.req.query();
    const pacientes = await pacienteService.search(q);
    return c.json(success({ pacientes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes:
 *   get:
 *     summary: Obtener todos los pacientes paginados
 *     tags: [Pacientes]
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
 *     responses:
 *       200:
 *         description: Lista de pacientes paginada
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
 *                     $ref: '#/components/schemas/Paciente'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Error del servidor
 */
pacientes.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await pacienteService.getAll(query);
    return c.json(paginated(result.pacientes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/{id}:
 *   get:
 *     summary: Obtener un paciente por ID
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Datos del paciente
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
 *                     paciente:
 *                       $ref: '#/components/schemas/Paciente'
 *       404:
 *         description: Paciente no encontrado
 *       500:
 *         description: Error del servidor
 */
pacientes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const paciente = await pacienteService.getById(id);
    return c.json(success({ paciente }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes:
 *   post:
 *     summary: Crear un nuevo paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PacienteInput'
 *     responses:
 *       201:
 *         description: Paciente creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     paciente:
 *                       $ref: '#/components/schemas/Paciente'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
pacientes.post('/', validate(createPacienteSchema), async (c) => {
  try {
    // Usar datos validados del middleware
    const data = c.req.validData;
    const paciente = await pacienteService.create(data);
    return c.json(success({ paciente }, 'Paciente creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/{id}:
 *   put:
 *     summary: Actualizar un paciente existente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PacienteInput'
 *     responses:
 *       200:
 *         description: Paciente actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     paciente:
 *                       $ref: '#/components/schemas/Paciente'
 *       404:
 *         description: Paciente no encontrado
 *       500:
 *         description: Error del servidor
 */
pacientes.put('/:id', validate(updatePacienteSchema), async (c) => {
  try {
    const { id } = c.req.param();
    // Usar datos validados del middleware
    const data = c.req.validData;
    const paciente = await pacienteService.update(id, data);
    return c.json(success({ paciente }, 'Paciente actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/{id}:
 *   delete:
 *     summary: Eliminar (inactivar) un paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Paciente inactivado correctamente
 *       404:
 *         description: Paciente no encontrado
 *       500:
 *         description: Error del servidor
 */
pacientes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await pacienteService.delete(id);
    return c.json(success(null, 'Paciente inactivado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /pacientes/{id}/toggle-activo:
 *   post:
 *     summary: Activar o inactivar un paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Estado del paciente cambiado correctamente
 *       404:
 *         description: Paciente no encontrado
 *       500:
 *         description: Error del servidor
 */
pacientes.post('/:id/toggle-activo', async (c) => {
  try {
    const { id } = c.req.param();
    const paciente = await pacienteService.toggleActivo(id);
    const mensaje = paciente.activo 
      ? 'Paciente activado correctamente' 
      : 'Paciente inactivado correctamente';
    return c.json(success({ paciente }, mensaje));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = pacientes;
