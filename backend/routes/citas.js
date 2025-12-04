const { Hono } = require('hono');
const Cita = require('../models/Cita');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const citas = new Hono();

// Aplicar autenticación a todas las rutas
citas.use('*', authMiddleware);

// Obtener todas las citas
citas.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await Cita.findAll(query);

    return c.json({
      citas: result.citas,
      pagination: {
        page: parseInt(query.page || 1),
        limit: parseInt(query.limit || 10),
        total: result.total,
        totalPages: Math.ceil(result.total / (query.limit || 10))
      }
    });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return c.json({ error: 'Error al obtener citas' }, 500);
  }
});

// Obtener citas por doctor
citas.get('/doctor/:doctorId', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const { fecha } = c.req.query();
    
    const citasList = await Cita.findByDoctor(doctorId, fecha);
    return c.json({ citas: citasList });
  } catch (error) {
    console.error('Error al obtener citas del doctor:', error);
    return c.json({ error: 'Error al obtener citas del doctor' }, 500);
  }
});

// Obtener una cita por ID
citas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const cita = await Cita.findById(id);

    if (!cita) {
      return c.json({ error: 'Cita no encontrada' }, 404);
    }

    return c.json({ cita });
  } catch (error) {
    console.error('Error al obtener cita:', error);
    return c.json({ error: 'Error al obtener cita' }, 500);
  }
});

// Crear cita
citas.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const data = await c.req.json();

    // Validar campos requeridos
    if (!data.paciente_id || !data.doctor_id || !data.fecha || !data.hora || !data.motivo) {
      return c.json({ error: 'Todos los campos son requeridos' }, 400);
    }

    const cita = await Cita.create(data);
    return c.json({ cita }, 201);
  } catch (error) {
    console.error('Error al crear cita:', error);
    return c.json({ error: error.message || 'Error al crear cita' }, 500);
  }
});

// Actualizar cita
citas.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();

    const cita = await Cita.update(id, data);
    return c.json({ cita });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    return c.json({ error: error.message || 'Error al actualizar cita' }, 500);
  }
});

// Cancelar cita
citas.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const { id } = c.req.param();
    await Cita.cancel(id);
    return c.json({ message: 'Cita cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    return c.json({ error: error.message || 'Error al cancelar cita' }, 500);
  }
});

module.exports = citas;
