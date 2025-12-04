const { Hono } = require('hono');
const prisma = require('../db/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const pacientes = new Hono();

pacientes.use('*', authMiddleware);

// Obtener todos los pacientes
pacientes.get('/', async (c) => {
  try {
    const { page = '1', limit = '10', search = '' } = c.req.query();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      activo: true,
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { cedula: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paciente.count({ where }),
    ]);

    return c.json({
      pacientes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
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
    const paciente = await prisma.paciente.findUnique({
      where: { id, activo: true },
    });

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

    if (!data.nombre || !data.apellido || !data.cedula || !data.fecha_nacimiento) {
      return c.json({ error: 'Nombre, apellido, cédula y fecha de nacimiento son requeridos' }, 400);
    }

    // Verificar si la cédula ya existe
    const existing = await prisma.paciente.findUnique({ where: { cedula: data.cedula } });
    if (existing) {
      return c.json({ error: 'La cédula ya está registrada' }, 400);
    }

    const paciente = await prisma.paciente.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        cedula: data.cedula,
        fechaNacimiento: new Date(data.fecha_nacimiento),
        genero: data.genero,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
        tipoSangre: data.tipo_sangre,
        alergias: data.alergias,
        contactoEmergenciaNombre: data.contacto_emergencia_nombre,
        contactoEmergenciaTelefono: data.contacto_emergencia_telefono,
      },
    });

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

    const updateData = {};
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.apellido) updateData.apellido = data.apellido;
    if (data.fecha_nacimiento) updateData.fechaNacimiento = new Date(data.fecha_nacimiento);
    if (data.genero) updateData.genero = data.genero;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.direccion !== undefined) updateData.direccion = data.direccion;
    if (data.tipo_sangre !== undefined) updateData.tipoSangre = data.tipo_sangre;
    if (data.alergias !== undefined) updateData.alergias = data.alergias;
    if (data.contacto_emergencia_nombre !== undefined) updateData.contactoEmergenciaNombre = data.contacto_emergencia_nombre;
    if (data.contacto_emergencia_telefono !== undefined) updateData.contactoEmergenciaTelefono = data.contacto_emergencia_telefono;

    const paciente = await prisma.paciente.update({
      where: { id },
      data: updateData,
    });

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
    await prisma.paciente.update({
      where: { id },
      data: { activo: false },
    });
    return c.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    return c.json({ error: 'Error al eliminar paciente' }, 500);
  }
});

module.exports = pacientes;
