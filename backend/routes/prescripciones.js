/**
 * Rutas de Prescripciones Médicas
 */
const { Hono } = require('hono');
const prescripcionService = require('../services/prescripcion.service');
const prescripcionIAService = require('../services/prescripcionIA.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const prescripciones = new Hono();

// Middleware de autenticación
prescripciones.use('/*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Prescripcion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         medico_id:
 *           type: string
 *           format: uuid
 *         estado:
 *           type: string
 *           enum: [Activa, Suspendida, Completada, Cancelada]
 *         fecha_inicio:
 *           type: string
 *           format: date-time
 *     PrescripcionInput:
 *       type: object
 *       required:
 *         - paciente_id
 *         - medicamentos
 *       properties:
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         admision_id:
 *           type: string
 *           format: uuid
 *         medicamentos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               producto_id:
 *                 type: string
 *                 format: uuid
 *               dosis:
 *                 type: string
 *               frecuencia:
 *                 type: string
 *               via_administracion:
 *                 type: string
 *               duracion_dias:
 *                 type: integer
 * tags:
 *   name: Prescripciones
 *   description: Gestión de recetas y prescripciones
 */

/**
 * @swagger
 * /prescripciones:
 *   get:
 *     summary: Listar prescripciones
 *     tags: [Prescripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pacienteId
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de prescripciones
 *       500:
 *         description: Error del servidor
 */
prescripciones.get('/', async (c) => {
  try {
    const { page, limit, pacienteId, paciente_id, admisionId, medicoId, estado } = c.req.query();

    const result = await prescripcionService.getAll({
      page,
      limit,
      pacienteId: pacienteId || paciente_id,
      admisionId,
      medicoId,
      estado,
    });

    return c.json({
      success: true,
      ...result,
    }, 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /prescripciones/activas/{pacienteId}:
 *   get:
 *     summary: Obtener prescripciones activas de un paciente
 *     tags: [Prescripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Prescripciones activas
 *       500:
 *         description: Error del servidor
 */
prescripciones.get('/activas/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const result = await prescripcionService.getPrescripcionesActivas(pacienteId);
    return c.json(success(result), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==================== RUTAS DE CÁLCULO CON IA ====================

/**
 * @swagger
 * /prescripciones/calcular-cantidad:
 *   post:
 *     summary: Calcular cantidad de medicamento con IA
 *     tags: [Prescripciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medicamento
 *               - dosis
 *               - frecuencia
 *               - duracionDias
 *             properties:
 *               productoId:
 *                 type: string
 *               medicamento:
 *                 type: string
 *               principioActivo:
 *                 type: string
 *               concentracion:
 *                 type: string
 *               formaFarmaceutica:
 *                 type: string
 *               dosis:
 *                 type: string
 *               via:
 *                 type: string
 *               frecuencia:
 *                 type: string
 *               duracionDias:
 *                 type: integer
 *               pacienteId:
 *                 type: string
 *               usarIA:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cálculo de cantidad
 *       500:
 *         description: Error del servidor
 */
prescripciones.post('/calcular-cantidad', async (c) => {
  try {
    const data = await c.req.json();
    const { usarIA = true, productoId, pacienteId, ...prescripcionData } = data;

    // Obtener información adicional si hay IDs
    let producto = null;
    let paciente = null;

    if (productoId) {
      producto = await prescripcionIAService.obtenerInfoProducto(productoId);
      if (producto) {
        prescripcionData.medicamento = prescripcionData.medicamento || producto.nombre;
        prescripcionData.principioActivo = prescripcionData.principioActivo || producto.principioActivo;
        prescripcionData.concentracion = prescripcionData.concentracion || producto.concentracion;
        prescripcionData.formaFarmaceutica = prescripcionData.formaFarmaceutica || producto.formaFarmaceutica;
      }
    }

    if (pacienteId) {
      paciente = await prescripcionIAService.obtenerInfoPaciente(pacienteId);
      if (paciente) {
        prescripcionData.paciente = paciente;
      }
    }

    let resultado;

    if (usarIA && prescripcionIAService.isConfigured()) {
      // Usar cálculo inteligente con IA
      resultado = await prescripcionIAService.calculoInteligente(prescripcionData);
    } else {
      // Usar cálculo algorítmico básico
      resultado = prescripcionIAService.calculoBasico(
        prescripcionData.medicamento,
        prescripcionData.dosis,
        prescripcionData.frecuencia,
        prescripcionData.duracionDias,
        prescripcionData.formaFarmaceutica
      );
    }

    return c.json(success({
      ...resultado,
      producto,
      paciente: paciente ? {
        nombre: `${paciente.nombre} ${paciente.apellido}`,
        edad: paciente.edad,
        peso: paciente.peso
      } : null
    }, 'Cálculo realizado'), 200);

  } catch (err) {
    console.error('[Prescripciones] Error cálculo:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /prescripciones/validar-dosis:
 *   post:
 *     summary: Validar dosificación con IA
 *     tags: [Prescripciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medicamento
 *               - dosis
 *             properties:
 *               medicamento:
 *                 type: string
 *               principioActivo:
 *                 type: string
 *               dosis:
 *                 type: string
 *               pacienteId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validación de dosis
 *       500:
 *         description: Error del servidor
 */
prescripciones.post('/validar-dosis', async (c) => {
  try {
    const data = await c.req.json();
    const { pacienteId, ...validacionData } = data;

    // Obtener información del paciente si hay ID
    if (pacienteId) {
      const paciente = await prescripcionIAService.obtenerInfoPaciente(pacienteId);
      if (paciente) {
        validacionData.paciente = paciente;
      }
    }

    const resultado = await prescripcionIAService.detectarErroresDosificacion(validacionData);
    return c.json(success(resultado, 'Validación completada'), 200);

  } catch (err) {
    console.error('[Prescripciones] Error validación:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /prescripciones/ia-status:
 *   get:
 *     summary: Verificar si IA está configurada
 *     tags: [Prescripciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de configuración IA
 */
prescripciones.get('/ia-status', async (c) => {
  try {
    return c.json(success({
      configurado: prescripcionIAService.isConfigured(),
      modelo: process.env.OPENAI_MODEL || 'gpt-4o'
    }), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==================== FIN RUTAS IA ====================

/**
 * @swagger
 * /prescripciones/{id}:
 *   get:
 *     summary: Obtener prescripción por ID
 *     tags: [Prescripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la prescripción
 *     responses:
 *       200:
 *         description: Datos de la prescripción
 *       404:
 *         description: Prescripción no encontrada
 *       500:
 *         description: Error del servidor
 */
prescripciones.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const prescripcion = await prescripcionService.getById(id);
    return c.json(success(prescripcion), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /prescripciones:
 *   post:
 *     summary: Crear prescripción (solo Doctor)
 *     tags: [Prescripciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrescripcionInput'
 *     responses:
 *       201:
 *         description: Prescripción creada exitosamente
 *       500:
 *         description: Error del servidor
 */
prescripciones.post('/', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const result = await prescripcionService.create(data, user.id);
    
    return c.json({
      success: true,
      message: 'Prescripción creada exitosamente',
      data: result.prescripcion,
      alertas: result.alertas,
    }, 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /prescripciones/{id}/suspender-producto:
 *   post:
 *     summary: Suspender producto de una prescripción
 *     tags: [Prescripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la prescripción
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prescripcionProductoId
 *               - motivo
 *             properties:
 *               prescripcionProductoId:
 *                 type: string
 *                 format: uuid
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto suspendido
 *       500:
 *         description: Error del servidor
 */
prescripciones.post('/medicamentos/:id/suspender', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { motivo } = await c.req.json();
    
    const result = await prescripcionService.suspenderMedicamento(
      id,
      motivo,
      user.id
    );
    
    return c.json(success(result, 'Producto suspendido'), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /prescripciones/{id}/completar:
 *   post:
 *     summary: Completar prescripción
 *     tags: [Prescripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la prescripción
 *     responses:
 *       200:
 *         description: Prescripción completada
 *       500:
 *         description: Error del servidor
 */
prescripciones.post('/:id/completar', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const result = await prescripcionService.completar(id, user.id);
    return c.json(success(result, 'Prescripción completada'), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /prescripciones/{id}/cancelar:
 *   post:
 *     summary: Cancelar prescripción
 *     tags: [Prescripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la prescripción
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prescripción cancelada
 *       500:
 *         description: Error del servidor
 */
prescripciones.post('/:id/cancelar', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { motivo } = await c.req.json();
    const result = await prescripcionService.cancelar(id, motivo, user.id);
    return c.json(success(result, 'Prescripción cancelada'), 200);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = prescripciones;