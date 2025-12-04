const { Hono } = require('hono');
const prisma = require('../db/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const citas = new Hono();

citas.use('*', authMiddleware);

// Obtener todas las citas
citas.get('/', async (c) => {
  try {
    const { page = '1', limit = '10', fecha = '', estado = '' } = c.req.query();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(fecha && { fecha: new Date(fecha) }),
      ...(estado && { estado }),
    };

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ fecha: 'desc' }, { hora: 'desc' }],
        include: {
          paciente: { select: { nombre: true, apellido: true, cedula: true } },
          doctor: { select: { nombre: true, apellido: true } },
          especialidad: { select: { titulo: true } },
        },
      }),
      prisma.cita.count({ where }),
    ]);

    const citasFormateadas = citas.map(cita => ({
      ...cita,
      paciente_nombre: cita.paciente.nombre,
      paciente_apellido: cita.paciente.apellido,
      paciente_cedula: cita.paciente.cedula,
      doctor_nombre: cita.doctor.nombre,
      doctor_apellido: cita.doctor.apellido,
    }));

    return c.json({
      citas: citasFormateadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return c.json({ error: 'Error al obtener citas' }, 500);
  }
});

// Obtener una cita por ID
citas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const cita = await prisma.cita.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: true,
        especialidad: true,
      },
    });

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

    if (!data.paciente_id || !data.doctor_id || !data.fecha || !data.hora || !data.motivo) {
      return c.json({ error: 'Todos los campos son requeridos' }, 400);
    }

    // Verificar disponibilidad
    const conflicto = await prisma.cita.findFirst({
      where: {
        doctorId: data.doctor_id,
        fecha: new Date(data.fecha),
        hora: new Date(`1970-01-01T${data.hora}`),
        estado: { notIn: ['Cancelada', 'NoAsistio'] },
      },
    });

    if (conflicto) {
      return c.json({ error: 'El doctor ya tiene una cita programada en ese horario' }, 400);
    }

    const cita = await prisma.cita.create({
      data: {
        pacienteId: data.paciente_id,
        doctorId: data.doctor_id,
        especialidadId: data.especialidad_id,
        fecha: new Date(data.fecha),
        hora: new Date(`1970-01-01T${data.hora}`),
        motivo: data.motivo,
        notas: data.notas,
        estado: 'Programada',
      },
    });

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

    const updateData = {};
    if (data.fecha) updateData.fecha = new Date(data.fecha);
    if (data.hora) updateData.hora = new Date(`1970-01-01T${data.hora}`);
    if (data.motivo) updateData.motivo = data.motivo;
    if (data.notas !== undefined) updateData.notas = data.notas;
    if (data.estado) updateData.estado = data.estado;
    if (data.especialidad_id !== undefined) updateData.especialidadId = data.especialidad_id;

    const cita = await prisma.cita.update({
      where: { id },
      data: updateData,
    });

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
    await prisma.cita.update({
      where: { id },
      data: { estado: 'Cancelada' },
    });
    return c.json({ message: 'Cita cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    return c.json({ error: 'Error al cancelar cita' }, 500);
  }
});

module.exports = citas;
