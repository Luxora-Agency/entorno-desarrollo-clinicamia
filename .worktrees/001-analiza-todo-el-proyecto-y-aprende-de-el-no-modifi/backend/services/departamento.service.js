/**
 * Service de departamentos
 */
const prisma = require('../db/prisma');
const { validateRequired } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

class DepartamentoService {
  /**
   * Obtener todos los departamentos
   */
  async getAll({ page = 1, limit = 50, search = '' }) {
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
      responsableNombre: dept.responsable 
        ? `${dept.responsable.nombre} ${dept.responsable.apellido}` 
        : 'N/A',
    }));

    return {
      departamentos: departamentosFormateados,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener un departamento por ID
   */
  async getById(id) {
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
      throw new NotFoundError('Departamento no encontrado');
    }

    return departamento;
  }

  /**
   * Crear un departamento
   */
  async create(data) {
    // Validar nombre requerido
    const missing = validateRequired(['nombre'], data);
    if (missing) {
      throw new ValidationError('El nombre es requerido');
    }

    // Verificar nombre único
    const existing = await prisma.departamento.findUnique({
      where: { nombre: data.nombre },
    });
    
    if (existing) {
      throw new ValidationError('Ya existe un departamento con ese nombre');
    }

    // Crear departamento
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

    return departamento;
  }

  /**
   * Actualizar un departamento
   */
  async update(id, data) {
    // Verificar que existe
    await this.getById(id);

    // Construir datos de actualización
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

    return departamento;
  }

  /**
   * Eliminar un departamento
   */
  async delete(id) {
    await this.getById(id);

    // Verificar si tiene especialidades activas
    const especialidadesCount = await prisma.especialidad.count({
      where: {
        departamentoId: id,
        estado: 'Activo',
      },
    });

    if (especialidadesCount > 0) {
      throw new ValidationError(
        `No se puede eliminar el departamento porque tiene ${especialidadesCount} especialidad(es) activa(s)`
      );
    }

    await prisma.departamento.delete({
      where: { id },
    });

    return true;
  }
}

module.exports = new DepartamentoService();
