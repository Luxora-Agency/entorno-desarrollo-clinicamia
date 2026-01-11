/**
 * Service de especialidades
 */
const prisma = require('../db/prisma');
const { validateRequired } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

class EspecialidadService {
  /**
   * Obtener todas las especialidades
   */
  async getAll({ page = 1, limit = 50, search = '', departamento_id = '' }) {
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

    return {
      especialidades: especialidadesFormateadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener una especialidad por ID
   */
  async getById(id) {
    const especialidad = await prisma.especialidad.findUnique({
      where: { id },
      include: {
        departamento: true,
      },
    });

    if (!especialidad) {
      throw new NotFoundError('Especialidad no encontrada');
    }

    return especialidad;
  }

  /**
   * Crear una especialidad
   */
  async create(data) {
    // Validar campos requeridos
    const missing = validateRequired(['titulo', 'departamento_id', 'costo_cop', 'duracion_minutos'], data);
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    // Verificar que el departamento existe
    const departamento = await prisma.departamento.findUnique({
      where: { id: data.departamento_id },
    });
    
    if (!departamento) {
      throw new NotFoundError('El departamento no existe');
    }

    // Crear especialidad
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

    return especialidad;
  }

  /**
   * Actualizar una especialidad
   */
  async update(id, data) {
    // Verificar que existe
    await this.getById(id);

    // Construir datos de actualización
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

    return especialidad;
  }

  /**
   * Eliminar una especialidad
   */
  async delete(id) {
    await this.getById(id);

    // Verificar si tiene citas asociadas
    const citasCount = await prisma.cita.count({
      where: { especialidadId: id },
    });

    if (citasCount > 0) {
      throw new ValidationError(
        `No se puede eliminar la especialidad porque tiene ${citasCount} cita(s) asociada(s). Cambie el estado a Inactivo en su lugar.`
      );
    }

    await prisma.especialidad.delete({
      where: { id },
    });

    return true;
  }
}

module.exports = new EspecialidadService();
