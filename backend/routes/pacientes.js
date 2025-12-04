const { Hono } = require('hono');
const Paciente = require('../models/Paciente');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const pacientes = new Hono();

// Aplicar autenticación a todas las rutas
pacientes.use('*', authMiddleware);

// Obtener todos los pacientes
pacientes.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await Paciente.findAll(query);

    return c.json({
      pacientes: result.pacientes,
      pagination: {
        page: parseInt(query.page || 1),
        limit: parseInt(query.limit || 10),
        total: result.total,
        totalPages: Math.ceil(result.total / (query.limit || 10))
      }
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    return c.json({ error: 'Error al obtener pacientes' }, 500);
  }
});

// Obtener un paciente por ID
pacientes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const paciente = await Paciente.findById(id);

    if (!paciente) {
      return c.json({ error: 'Paciente no encontrado' }, 404);
    }

    return c.json({ paciente });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    return c.json({ error: 'Error al obtener paciente' }, 500);
  }
});

// Crear paciente
pacientes.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const data = await c.req.json();

    // Validar campos requeridos
    if (!data.nombre || !data.apellido || !data.cedula || !data.fecha_nacimiento) {
      return c.json({ error: 'Nombre, apellido, cédula y fecha de nacimiento son requeridos' }, 400);
    }

    const paciente = await Paciente.create(data);
    return c.json({ paciente }, 201);
  } catch (error) {
    console.error('Error al crear paciente:', error);
    return c.json({ error: error.message || 'Error al crear paciente' }, 500);
  }
});

// Actualizar paciente
pacientes.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();

    const paciente = await Paciente.update(id, data);
    
    if (!paciente) {
      return c.json({ error: 'Paciente no encontrado' }, 404);
    }

    return c.json({ paciente });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return c.json({ error: error.message || 'Error al actualizar paciente' }, 500);
  }
});

// Eliminar paciente (soft delete)
pacientes.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    await Paciente.delete(id);
    return c.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    return c.json({ error: 'Error al eliminar paciente' }, 500);
  }
});

module.exports = pacientes;
