const { Hono } = require('hono');
const prisma = require('../db/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const especialidades = new Hono();

especialidades.use('*', authMiddleware);

// Obtener todas las especialidades
especialidades.get('/', async (c) => {
  try {
    const { page = '1', limit = '50', search = '', departamento_id = '' } = c.req.query();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(search && {
        OR: [
          { titulo: { contains: search, mode: 'insensitive' } },
          { codigo: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(departamento_id && { departamentoId: departamento_id }),
    };

    const [especialidades, total] = await Promise.all([
      prisma.especialidad.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          departamento: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      }),
      prisma.especialidad.count({ where }),
    ]);

    // Formatear datos
    const especialidadesFormateadas = especialidades.map(esp => ({
      ...esp,
      departamentoNombre: esp.departamento.nombre,
      costoCOP: parseFloat(esp.costoCOP),
    }));

    return c.json({
      especialidades: especialidadesFormateadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error al obtener especialidades:', error);
    return c.json({ error: 'Error al obtener especialidades' }, 500);
  }
});

// Obtener una especialidad por ID
especialidades.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const especialidad = await prisma.especialidad.findUnique({
      where: { id },
      include: {
        departamento: true,
      },
    });

    if (!especialidad) {
      return c.json({ error: 'Especialidad no encontrada' }, 404);
    }

    return c.json({ especialidad });
  } catch (error) {
    console.error('Error al obtener especialidad:', error);
    return c.json({ error: 'Error al obtener especialidad' }, 500);
  }
});

// Crear especialidad
especialidades.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const data = await c.req.json();

    if (!data.titulo || !data.departamento_id || !data.costo_cop || !data.duracion_minutos) {
      return c.json({ error: 'Titulo, departamento, costo y duración son requeridos' }, 400);
    }

    // Verificar que el departamento existe
    const departamento = await prisma.departamento.findUnique({
      where: { id: data.departamento_id },
    });
    if (!departamento) {
      return c.json({ error: 'El departamento no existe' }, 404);
    }

    const especialidad = await prisma.especialidad.create({
      data: {
        titulo: data.titulo,
        codigo: data.codigo,
        departamentoId: data.departamento_id,
        costoCOP: parseFloat(data.costo_cop),
        duracionMinutos: parseInt(data.duracion_minutos),
        duracionExternaMin: data.duracion_externa_min ? parseInt(data.duracion_externa_min) : null,
        duracionInternaMin: data.duracion_interna_min ? parseInt(data.duracion_interna_min) : null,
        descripcion: data.descripcion,
        estado: data.estado || 'Activo',
      },
      include: {
        departamento: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return c.json({ especialidad }, 201);
  } catch (error) {
    console.error('Error al crear especialidad:', error);
    return c.json({ error: error.message || 'Error al crear especialidad' }, 500);
  }
});

// Actualizar especialidad
especialidades.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();

    const updateData = {};
    if (data.titulo) updateData.titulo = data.titulo;
    if (data.codigo !== undefined) updateData.codigo = data.codigo;
    if (data.departamento_id) updateData.departamentoId = data.departamento_id;
    if (data.costo_cop) updateData.costoCOP = parseFloat(data.costo_cop);
    if (data.duracion_minutos) updateData.duracionMinutos = parseInt(data.duracion_minutos);
    if (data.duracion_externa_min !== undefined) updateData.duracionExternaMin = data.duracion_externa_min ? parseInt(data.duracion_externa_min) : null;
    if (data.duracion_interna_min !== undefined) updateData.duracionInternaMin = data.duracion_interna_min ? parseInt(data.duracion_interna_min) : null;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.estado) updateData.estado = data.estado;

    const especialidad = await prisma.especialidad.update({
      where: { id },
      data: updateData,
      include: {
        departamento: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return c.json({ especialidad });
  } catch (error) {
    console.error('Error al actualizar especialidad:', error);
    return c.json({ error: error.message || 'Error al actualizar especialidad' }, 500);
  }
});

// Eliminar especialidad
especialidades.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();

    // Verificar si tiene citas asociadas
    const citasCount = await prisma.cita.count({
      where: { especialidadId: id },
    });

    if (citasCount > 0) {
      return c.json({
        error: `No se puede eliminar la especialidad porque tiene ${citasCount} cita(s) asociada(s). Cambie el estado a Inactivo en su lugar.`,
      }, 400);
    }

    await prisma.especialidad.delete({
      where: { id },
    });

    return c.json({ message: 'Especialidad eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar especialidad:', error);
    return c.json({ error: 'Error al eliminar especialidad' }, 500);
  }
});

module.exports = especialidades;
