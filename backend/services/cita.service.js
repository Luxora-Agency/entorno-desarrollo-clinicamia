/**
 * Service de citas
 */
const prisma = require('../db/prisma');
const { validateRequired } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

class CitaService {
  /**
   * Obtener todas las citas
   */
  async getAll({ page = 1, limit = 10, fecha = '', fechaDesde = '', estado = '', pacienteId = '', doctorId = '' }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(fecha && { fecha: new Date(fecha) }),
      ...(fechaDesde && { fecha: { gte: new Date(fechaDesde) } }),
      ...(estado && { estado }),
      ...(pacienteId && { pacienteId }),
      ...(doctorId && { doctorId }),
    };

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
        include: {
          paciente: { select: { id: true, nombre: true, apellido: true, cedula: true, telefono: true, email: true } },
          doctor: { 
            select: { 
              id: true,
              usuario: {
                select: { nombre: true, apellido: true }
              }
            } 
          },
          especialidad: { select: { id: true, nombre: true } },
        },
      }),
      prisma.cita.count({ where }),
    ]);

    // Formatear respuesta
    const citasFormateadas = citas.map(cita => ({
      ...cita,
      doctor: cita.doctor ? {
        id: cita.doctor.id,
        nombre: cita.doctor.usuario?.nombre,
        apellido: cita.doctor.usuario?.apellido,
      } : null,
    }));

    return {
      citas: citasFormateadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener una cita por ID
   */
  async getById(id) {
    const cita = await prisma.cita.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: true,
        especialidad: true,
      },
    });

    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }

    return cita;
  }

  /**
   * Crear una cita
   */
  async create(data) {
    // Validar campos requeridos
    const missing = validateRequired(['paciente_id', 'doctor_id', 'fecha', 'hora', 'motivo'], data);
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    // Verificar disponibilidad del doctor
    const conflicto = await prisma.cita.findFirst({
      where: {
        doctorId: data.doctor_id,
        fecha: new Date(data.fecha),
        hora: new Date(`1970-01-01T${data.hora}`),
        estado: { notIn: ['Cancelada', 'NoAsistio'] },
      },
    });

    if (conflicto) {
      throw new ValidationError('El doctor ya tiene una cita programada en ese horario');
    }

    // Crear cita
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

    return cita;
  }

  /**
   * Actualizar una cita
   */
  async update(id, data) {
    // Verificar que existe
    await this.getById(id);

    // Construir datos de actualización
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

    return cita;
  }

  /**
   * Cancelar una cita
   */
  async cancel(id) {
    await this.getById(id);

    const cita = await prisma.cita.update({
      where: { id },
      data: { estado: 'Cancelada' },
    });

    return cita;
  }
}

module.exports = new CitaService();
