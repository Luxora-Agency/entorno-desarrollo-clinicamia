const { Hono } = require('hono');
const citaService = require('../services/cita.service');
const { authMiddleware } = require('../middleware/auth');

const router = new Hono();

// Obtener todas las citas (con filtros)
router.get('/', authMiddleware, async (c) => {
  try {
    const page = c.req.query('page') || 1;
    const limit = c.req.query('limit') || 10;
    const fecha = c.req.query('fecha');
    const fechaDesde = c.req.query('fechaDesde');
    const estado = c.req.query('estado');
    const pacienteId = c.req.query('pacienteId') || c.req.query('paciente_id');
    const doctorId = c.req.query('doctorId') || c.req.query('doctor_id');

    const result = await citaService.getAll({ 
      page, limit, fecha, fechaDesde, estado, pacienteId, doctorId 
    });
    return c.json({ status: 'success', ...result });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// Checksum para sincronización de agenda
router.get('/sync/checksum', authMiddleware, async (c) => {
    try {
        const doctorId = c.req.query('doctorId');
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');

        if (!doctorId) {
            return c.json({ status: 'error', message: 'doctorId required' }, 400);
        }

        const checksumData = await citaService.getScheduleChecksum(doctorId, startDate, endDate);
        return c.json({ status: 'success', data: checksumData });
    } catch (error) {
        return c.json({ status: 'error', message: error.message }, 500);
    }
});

// Obtener cita por ID
router.get('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const cita = await citaService.getById(id);
    return c.json({ status: 'success', data: cita });
  } catch (error) {
    console.error('Error al obtener cita:', error);
    if (error.message === 'Cita no encontrada') {
      return c.json({ status: 'error', message: error.message }, 404);
    }
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// Crear cita
router.post('/', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');
    const userId = user?.id; // Del token
    
    // Inyectar usuario para auditoría
    const cita = await citaService.create({
        ...data,
        createdBy: userId 
    });
    
    return c.json({ status: 'success', data: cita }, 201);
  } catch (error) {
    console.error('Error al crear cita:', error);
    if (error.name === 'ZodError' || error.message.includes('solapa')) {
        return c.json({ status: 'error', message: error.message, errors: error.errors }, 400);
    }
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// Actualizar cita
router.put('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const user = c.get('user');
    const userId = user?.id;

    const cita = await citaService.update(id, {
        ...data,
        updatedBy: userId
    });
    return c.json({ status: 'success', data: cita });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    if (error.name === 'ZodError' || error.message.includes('solapa')) {
        return c.json({ status: 'error', message: error.message, errors: error.errors }, 400);
    }
    if (error.message === 'Cita no encontrada') {
        return c.json({ status: 'error', message: error.message }, 404);
    }
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// Cancelar cita
router.post('/cancelar/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const cita = await citaService.cancel(id);
    return c.json({ status: 'success', data: cita });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// Cambiar estado cita
router.post('/estado/:id', authMiddleware, async (c) => {
    try {
        const id = c.req.param('id');
        const { estado } = await c.req.json();
        const user = c.get('user');
        const userId = user?.id;

        const cita = await citaService.update(id, { 
            estado,
            updatedBy: userId 
        });
        return c.json({ status: 'success', data: cita });
    } catch (error) {
        return c.json({ status: 'error', message: error.message }, 500);
    }
});

module.exports = router;
