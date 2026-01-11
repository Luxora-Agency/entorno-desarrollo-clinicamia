/**
 * Servicio de Capacitación - Módulo Talento Humano
 */
const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class CapacitacionService {
  /**
   * Listar capacitaciones
   */
  async list({ estado, categoria, modalidad, page = 1, limit = 20 }) {
    const where = {};
    if (estado) where.estado = estado;
    if (categoria) where.categoria = categoria;
    if (modalidad) where.modalidad = modalidad;

    const [data, total] = await Promise.all([
      prisma.tHCapacitacion.findMany({
        where,
        include: {
          _count: { select: { asistentes: true, sesiones: true } }
        },
        orderBy: { fechaInicio: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHCapacitacion.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Obtener capacitación por ID
   */
  async getById(id) {
    const capacitacion = await prisma.tHCapacitacion.findUnique({
      where: { id },
      include: {
        sesiones: { orderBy: { fecha: 'asc' } },
        asistentes: {
          include: {
            empleado: { select: { id: true, nombre: true, apellido: true, fotoUrl: true } }
          }
        }
      }
    });

    if (!capacitacion) throw new NotFoundError('Capacitación no encontrada');
    return capacitacion;
  }

  /**
   * Crear capacitación
   */
  async create(data) {
    return prisma.tHCapacitacion.create({
      data,
      include: { _count: { select: { asistentes: true } } }
    });
  }

  /**
   * Actualizar capacitación
   */
  async update(id, data) {
    const capacitacion = await prisma.tHCapacitacion.findUnique({ where: { id } });
    if (!capacitacion) throw new NotFoundError('Capacitación no encontrada');

    return prisma.tHCapacitacion.update({
      where: { id },
      data
    });
  }

  /**
   * Agregar sesión a capacitación
   */
  async addSesion(capacitacionId, data) {
    const capacitacion = await prisma.tHCapacitacion.findUnique({ where: { id: capacitacionId } });
    if (!capacitacion) throw new NotFoundError('Capacitación no encontrada');

    return prisma.tHSesionCapacitacion.create({
      data: {
        capacitacionId,
        ...data
      }
    });
  }

  /**
   * Inscribir empleado
   */
  async inscribirEmpleado(capacitacionId, empleadoId) {
    const [capacitacion, empleado] = await Promise.all([
      prisma.tHCapacitacion.findUnique({ where: { id: capacitacionId } }),
      prisma.tHEmpleado.findUnique({ where: { id: empleadoId } })
    ]);

    if (!capacitacion) throw new NotFoundError('Capacitación no encontrada');
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    // Verificar cupos
    if (capacitacion.cuposMaximos) {
      const inscritos = await prisma.tHAsistenteCapacitacion.count({
        where: { capacitacionId }
      });
      if (inscritos >= capacitacion.cuposMaximos) {
        throw new ValidationError('La capacitación está llena');
      }
    }

    // Verificar si ya está inscrito
    const existing = await prisma.tHAsistenteCapacitacion.findUnique({
      where: {
        capacitacionId_empleadoId: { capacitacionId, empleadoId }
      }
    });

    if (existing) {
      throw new ValidationError('El empleado ya está inscrito');
    }

    return prisma.tHAsistenteCapacitacion.create({
      data: {
        capacitacionId,
        empleadoId,
        estado: 'INSCRITO'
      }
    });
  }

  /**
   * Cancelar inscripción
   */
  async cancelarInscripcion(capacitacionId, empleadoId) {
    const inscripcion = await prisma.tHAsistenteCapacitacion.findUnique({
      where: {
        capacitacionId_empleadoId: { capacitacionId, empleadoId }
      }
    });

    if (!inscripcion) throw new NotFoundError('Inscripción no encontrada');

    return prisma.tHAsistenteCapacitacion.update({
      where: { id: inscripcion.id },
      data: { estado: 'CANCELADO' }
    });
  }

  /**
   * Registrar asistencia
   */
  async registrarAsistencia(capacitacionId, empleadoId, asistio) {
    const inscripcion = await prisma.tHAsistenteCapacitacion.findUnique({
      where: {
        capacitacionId_empleadoId: { capacitacionId, empleadoId }
      }
    });

    if (!inscripcion) throw new NotFoundError('Inscripción no encontrada');

    return prisma.tHAsistenteCapacitacion.update({
      where: { id: inscripcion.id },
      data: {
        asistio,
        estado: asistio ? 'ASISTIO' : 'NO_ASISTIO'
      }
    });
  }

  /**
   * Registrar evaluación y certificado
   */
  async registrarEvaluacion(capacitacionId, empleadoId, data) {
    const inscripcion = await prisma.tHAsistenteCapacitacion.findUnique({
      where: {
        capacitacionId_empleadoId: { capacitacionId, empleadoId }
      }
    });

    if (!inscripcion) throw new NotFoundError('Inscripción no encontrada');

    return prisma.tHAsistenteCapacitacion.update({
      where: { id: inscripcion.id },
      data: {
        notaEvaluacion: data.nota,
        certificadoUrl: data.certificadoUrl,
        feedbackCurso: data.feedback
      }
    });
  }

  /**
   * Obtener capacitaciones de un empleado
   */
  async getByEmpleado(empleadoId, { estado, page = 1, limit = 10 }) {
    const where = { empleadoId };
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      prisma.tHAsistenteCapacitacion.findMany({
        where,
        include: {
          capacitacion: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHAsistenteCapacitacion.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Obtener certificados de un empleado
   */
  async getCertificados(empleadoId) {
    return prisma.tHAsistenteCapacitacion.findMany({
      where: {
        empleadoId,
        certificadoUrl: { not: null }
      },
      include: {
        capacitacion: { select: { id: true, nombre: true, duracionHoras: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Obtener estadísticas de capacitaciones
   */
  async getStats() {
    const [
      total,
      programadas,
      enCurso,
      completadas,
      totalAsistentes,
      horasTotales
    ] = await Promise.all([
      prisma.tHCapacitacion.count(),
      prisma.tHCapacitacion.count({ where: { estado: 'PROGRAMADA' } }),
      prisma.tHCapacitacion.count({ where: { estado: 'EN_CURSO' } }),
      prisma.tHCapacitacion.count({ where: { estado: 'COMPLETADA' } }),
      prisma.tHAsistenteCapacitacion.count({ where: { estado: 'ASISTIO' } }),
      prisma.tHCapacitacion.aggregate({
        where: { estado: 'COMPLETADA' },
        _sum: { duracionHoras: true }
      })
    ]);

    return {
      capacitaciones: { total, programadas, enCurso, completadas },
      asistentes: totalAsistentes,
      horasImpartidas: horasTotales._sum.duracionHoras || 0
    };
  }

  /**
   * Cambiar estado de capacitación
   */
  async changeStatus(id, estado) {
    const capacitacion = await prisma.tHCapacitacion.findUnique({ where: { id } });
    if (!capacitacion) throw new NotFoundError('Capacitación no encontrada');

    return prisma.tHCapacitacion.update({
      where: { id },
      data: { estado }
    });
  }
}

module.exports = new CapacitacionService();
