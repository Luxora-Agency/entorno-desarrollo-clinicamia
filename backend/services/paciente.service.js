/**
 * Service de pacientes
 */
const prisma = require('../db/prisma');
const { validateRequired } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

class PacienteService {
  /**
   * Obtener todos los pacientes con paginación
   */
  async getAll({ page = 1, limit = 10, search = '' }) {
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

    return {
      pacientes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener un paciente por ID
   */
  async getById(id) {
    const paciente = await prisma.paciente.findUnique({
      where: { id, activo: true },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    return paciente;
  }

  /**
   * Crear un paciente
   */
  async create(data) {
    // Validar campos requeridos
    const missing = validateRequired(['nombre', 'apellido', 'cedula', 'fecha_nacimiento'], data);
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    // Verificar cédula única
    const existing = await prisma.paciente.findUnique({ 
      where: { cedula: data.cedula } 
    });
    
    if (existing) {
      throw new ValidationError('La cédula ya está registrada');
    }

    // Crear paciente
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

    return paciente;
  }

  /**
   * Actualizar un paciente
   */
  async update(id, data) {
    // Verificar que existe
    await this.getById(id);

    // Construir datos de actualización
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

    return paciente;
  }

  /**
   * Eliminar un paciente (soft delete)
   */
  async delete(id) {
    await this.getById(id);
    
    await prisma.paciente.update({
      where: { id },
      data: { activo: false },
    });

    return true;
  }
}

module.exports = new PacienteService();
