const { Hono } = require('hono');
const prisma = require('../db/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const departamentos = new Hono();

departamentos.use('*', authMiddleware);

// Obtener todos los departamentos
departamentos.get('/', async (c) => {
  try {
    const { page = '1', limit = '50', search = '' } = c.req.query();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(search && {
        nombre: { contains: search, mode: 'insensitive' },
      }),
    };

    const [departamentos, total] = await Promise.all([
      prisma.departamento.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          responsable: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
          especialidades: {
            where: { estado: 'Activo' },
            select: { id: true },
          },
        },
      }),
      prisma.departamento.count({ where }),
    ]);

    // Formatear datos
    const departamentosFormateados = departamentos.map(dept => ({
      ...dept,
      cantidadEspecialidades: dept.especialidades.length,
      responsableNombre: dept.responsable ? `${dept.responsable.nombre} ${dept.responsable.apellido}` : 'N/A',
    }));

    return c.json({
      departamentos: departamentosFormateados,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    return c.json({ error: 'Error al obtener departamentos' }, 500);
  }
});

// Obtener un departamento por ID
departamentos.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const departamento = await prisma.departamento.findUnique({
      where: { id },
      include: {
        responsable: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        especialidades: {
          where: { estado: 'Activo' },
        },
      },
    });

    if (!departamento) {
      return c.json({ error: 'Departamento no encontrado' }, 404);
    }

    return c.json({ departamento });
  } catch (error) {
    console.error('Error al obtener departamento:', error);
    return c.json({ error: 'Error al obtener departamento' }, 500);
  }
});

// Crear departamento
departamentos.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const data = await c.req.json();

    if (!data.nombre) {
      return c.json({ error: 'El nombre es requerido' }, 400);
    }

    // Verificar si ya existe
    const existing = await prisma.departamento.findUnique({
      where: { nombre: data.nombre },
    });
    if (existing) {
      return c.json({ error: 'Ya existe un departamento con ese nombre' }, 400);
    }

    const departamento = await prisma.departamento.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        responsableId: data.responsable_id || null,
        estado: data.estado || 'Activo',
      },
      include: {
        responsable: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return c.json({ departamento }, 201);
  } catch (error) {
    console.error('Error al crear departamento:', error);
    return c.json({ error: error.message || 'Error al crear departamento' }, 500);
  }
});

// Actualizar departamento
departamentos.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();

    const updateData = {};
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.responsable_id !== undefined) updateData.responsableId = data.responsable_id || null;
    if (data.estado) updateData.estado = data.estado;

    const departamento = await prisma.departamento.update({
      where: { id },
      data: updateData,
      include: {
        responsable: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return c.json({ departamento });
  } catch (error) {
    console.error('Error al actualizar departamento:', error);
    return c.json({ error: error.message || 'Error al actualizar departamento' }, 500);
  }
});

// Eliminar departamento
departamentos.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();

    // Verificar si tiene especialidades activas
    const especialidadesCount = await prisma.especialidad.count({
      where: {
        departamentoId: id,
        estado: 'Activo',
      },
    });

    if (especialidadesCount > 0) {
      return c.json({
        error: `No se puede eliminar el departamento porque tiene ${especialidadesCount} especialidad(es) activa(s)`,
      }, 400);
    }

    await prisma.departamento.delete({
      where: { id },
    });

    return c.json({ message: 'Departamento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar departamento:', error);
    return c.json({ error: 'Error al eliminar departamento' }, 500);
  }
});

module.exports = departamentos;
