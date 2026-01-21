/**
 * Rutas de Signos Vitales
 */
const { Hono } = require('hono');
const signosVitalesService = require('../services/signosVitales.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const signosVitales = new Hono();

// Todas las rutas requieren autenticación
signosVitales.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     SignoVital:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         fecha_registro:
 *           type: string
 *           format: date-time
 *         temperatura:
 *           type: number
 *         presion_sistolica:
 *           type: integer
 *         presion_diastolica:
 *           type: integer
 *         frecuencia_cardiaca:
 *           type: integer
 *         frecuencia_respiratoria:
 *           type: integer
 *         saturacion_oxigeno:
 *           type: integer
 *         peso:
 *           type: number
 *         talla:
 *           type: number
 *     SignoVitalInput:
 *       type: object
 *       required:
 *         - paciente_id
 *       properties:
 *         paciente_id:
 *           type: string
 *           format: uuid
 *         temperatura:
 *           type: number
 *         presion_sistolica:
 *           type: integer
 *         presion_diastolica:
 *           type: integer
 *         frecuencia_cardiaca:
 *           type: integer
 *         frecuencia_respiratoria:
 *           type: integer
 *         saturacion_oxigeno:
 *           type: integer
 *         peso:
 *           type: number
 *         talla:
 *           type: number
 * tags:
 *   name: SignosVitales
 *   description: Registro de signos vitales
 */

/**
 * @swagger
 * /signos-vitales:
 *   get:
 *     summary: Obtener todos los signos vitales
 *     tags: [SignosVitales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paciente_id
 *         schema:
 *           type: string
 *         description: Filtrar por paciente
 *     responses:
 *       200:
 *         description: Lista de signos vitales
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
 *                     $ref: '#/components/schemas/SignoVital'
 *       500:
 *         description: Error del servidor
 */
signosVitales.get('/', async (c) => {
  try {
    const query = c.req.query();
    console.log('[SignosVitales] GET / - Query params:', JSON.stringify(query));
    const result = await signosVitalesService.getAll(query);
    console.log('[SignosVitales] GET / - Resultados:', result.signos?.length || 0, 'registros');
    return c.json(paginated(result.signos, result.pagination));
  } catch (err) {
    console.error('[SignosVitales] GET / - Error:', err.message);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /signos-vitales:
 *   post:
 *     summary: Registrar signos vitales
 *     tags: [SignosVitales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignoVitalInput'
 *     responses:
 *       201:
 *         description: Signos vitales registrados correctamente
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
 *                     signoVital:
 *                       $ref: '#/components/schemas/SignoVital'
 *       500:
 *         description: Error del servidor
 */
signosVitales.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    const ipOrigen = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    const signoVital = await signosVitalesService.create(body, user.id, user, ipOrigen);
    return c.json(success({ signoVital }, 'Signos vitales registrados correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /signos-vitales/grafica/{paciente_id}:
 *   get:
 *     summary: Obtener gráfica de evolución
 *     tags: [SignosVitales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paciente_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del paciente
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [temperatura, presion, frecuencia, peso]
 *           default: temperatura
 *         description: Tipo de signo vital a graficar
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Número de días atrás a consultar
 *     responses:
 *       200:
 *         description: Datos para gráfica
 *       500:
 *         description: Error del servidor
 */
signosVitales.get('/grafica/:paciente_id', async (c) => {
  try {
    const { paciente_id } = c.req.param();
    const { tipo = 'temperatura', dias = '7' } = c.req.query();
    
    const datos = await signosVitalesService.getGraficaEvolucion(
      paciente_id,
      tipo,
      parseInt(dias)
    );
    
    return c.json(success({ datos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = signosVitales;
