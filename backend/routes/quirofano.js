const { Hono } = require('hono');
const quirofanoController = require('../controllers/quirofano.controller');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const prisma = require('../db/prisma');
const { success, error } = require('../utils/response');

const quirofano = new Hono();

// Aplicar middleware de autenticación y permisos a todas las rutas
quirofano.use('/*', authMiddleware);
quirofano.use('/*', permissionMiddleware('quirofano'));

/**
 * @swagger
 * tags:
 *   name: Quirofanos
 *   description: Gestión de Quirófanos y Salas de Cirugía
 */

/**
 * @swagger
 * /quirofanos:
 *   get:
 *     summary: Obtener todos los quirófanos
 *     tags: [Quirofanos]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de quirófanos
 */
quirofano.get('/', quirofanoController.getAll);

/**
 * @swagger
 * /quirofanos/personal:
 *   get:
 *     summary: Obtener personal quirúrgico (médicos y enfermeros)
 *     tags: [Quirofanos]
 *     description: Retorna lista de personal disponible para asignar a cirugías
 *     responses:
 *       200:
 *         description: Lista de personal quirúrgico
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 medicos:
 *                   type: array
 *                 enfermeros:
 *                   type: array
 */
quirofano.get('/personal', async (c) => {
  try {
    // Obtener médicos/doctores con sus datos
    const doctores = await prisma.doctor.findMany({
      where: {
        usuario: { activo: true }
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            rol: true,
          }
        },
        especialidades: {
          include: {
            especialidad: {
              select: { titulo: true }
            }
          }
        }
      }
    });

    // Obtener enfermeros/auxiliares
    const enfermeros = await prisma.usuario.findMany({
      where: {
        activo: true,
        rol: { in: ['NURSE', 'Enfermero', 'Auxiliar'] }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
      }
    });

    const medicosFormateados = doctores.map(d => ({
      id: d.id,
      usuarioId: d.usuario?.id,
      nombre: d.usuario?.nombre,
      apellido: d.usuario?.apellido,
      email: d.usuario?.email,
      rol: d.usuario?.rol || 'Medico',
      especialidades: d.especialidades?.map(e => e.especialidad?.titulo) || []
    }));

    return c.json(success({
      medicos: medicosFormateados,
      enfermeros: enfermeros
    }, 'Personal quirúrgico obtenido'));
  } catch (err) {
    console.error('Error obteniendo personal quirúrgico:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /quirofanos/{id}:
 *   get:
 *     summary: Obtener quirófano por ID
 *     tags: [Quirofanos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Detalle del quirófano
 */
quirofano.get('/:id', quirofanoController.getById);

/**
 * @swagger
 * /quirofanos:
 *   post:
 *     summary: Crear un nuevo quirófano
 *     tags: [Quirofanos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - tipo
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *               capacidad:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Quirófano creado
 */
quirofano.post('/', quirofanoController.create);

/**
 * @swagger
 * /quirofanos/{id}:
 *   put:
 *     summary: Actualizar quirófano
 *     tags: [Quirofanos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Quirófano actualizado
 */
quirofano.put('/:id', quirofanoController.update);

/**
 * @swagger
 * /quirofanos/{id}:
 *   delete:
 *     summary: Desactivar quirófano
 *     tags: [Quirofanos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Quirófano desactivado
 */
quirofano.delete('/:id', quirofanoController.delete);

/**
 * @swagger
 * /quirofanos/{id}/disponibilidad:
 *   get:
 *     summary: Verificar disponibilidad de quirófano
 *     tags: [Quirofanos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: query
 *         name: fechaInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: duracionMinutos
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado de disponibilidad
 */
quirofano.get('/:id/disponibilidad', quirofanoController.checkAvailability);

module.exports = quirofano;
