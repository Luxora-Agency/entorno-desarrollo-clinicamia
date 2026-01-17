/**
 * Service de Evoluciones Clínicas (SOAP)
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const firmaDigitalService = require('./firmaDigital.service');
const auditoriaService = require('./auditoria.service');

class EvolucionClinicaService {
  /**
   * Obtener todas las evoluciones con filtros
   */
  async getAll({ page = 1, limit = 20, paciente_id, admision_id, doctor_id, cita_id, fecha_desde, fecha_hasta }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (paciente_id) where.pacienteId = paciente_id;
    if (admision_id) where.admisionId = admision_id;
    if (doctor_id) where.doctorId = doctor_id;
    if (cita_id) where.citaId = cita_id;
    
    if (fecha_desde || fecha_hasta) {
      where.fechaEvolucion = {};
      if (fecha_desde) where.fechaEvolucion.gte = new Date(fecha_desde);
      if (fecha_hasta) where.fechaEvolucion.lte = new Date(fecha_hasta);
    }

    const [evoluciones, total] = await Promise.all([
      prisma.evolucionClinica.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaEvolucion: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
            },
          },
          doctor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          diagnosticos: true,
        },
      }),
      prisma.evolucionClinica.count({ where }),
    ]);

    return {
      evoluciones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener evolución por ID
   */
  async getById(id) {
    const evolucion = await prisma.evolucionClinica.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        admision: true,
        cita: true,
        diagnosticos: true,
      },
    });

    if (!evolucion) {
      throw new NotFoundError('Evolución clínica no encontrada');
    }

    return evolucion;
  }

  /**
   * Crear evolución clínica
   */
  async create(data, usuarioId, usuarioData, ipOrigen = null) {
    // Validar campos requeridos SOAP
    if (!data.paciente_id) throw new ValidationError('paciente_id es requerido');
    if (!data.subjetivo) throw new ValidationError('Subjetivo es requerido');
    if (!data.objetivo) throw new ValidationError('Objetivo es requerido');
    if (!data.analisis) throw new ValidationError('Análisis es requerido');
    if (!data.plan) throw new ValidationError('Plan es requerido');

    const evolucion = await prisma.evolucionClinica.create({
      data: {
        pacienteId: data.paciente_id,
        admisionId: data.admision_id || null,
        citaId: data.cita_id || null,
        doctorId: usuarioId,
        subjetivo: data.subjetivo,
        objetivo: data.objetivo,
        analisis: data.analisis,
        plan: data.plan,
        tipoEvolucion: data.tipo_evolucion || 'Seguimiento',
        turno: data.turno || null,
        areaHospitalizacion: data.area_hospitalizacion || null,
        fechaEvolucion: data.fecha_evolucion ? new Date(data.fecha_evolucion) : new Date(),
        ipRegistro: ipOrigen,
      },
      include: {
        paciente: true,
        doctor: true,
      },
    });

    // Auditoría
    await auditoriaService.registrarAccion({
      entidad: 'EvolucionClinica',
      entidadId: evolucion.id,
      accion: 'Creacion',
      usuarioId,
      nombreUsuario: `${usuarioData.nombre} ${usuarioData.apellido}`,
      rol: usuarioData.rol,
      valoresNuevos: evolucion,
      ipOrigen,
    });

    return evolucion;
  }

  /**
   * Firmar evolución clínica
   */
  async firmar(id, usuarioId, usuarioData, ipOrigen = null) {
    const evolucion = await this.getById(id);

    if (evolucion.firmada) {
      throw new ValidationError('La evolución ya está firmada');
    }

    if (evolucion.doctorId !== usuarioId) {
      throw new ValidationError('Solo el médico que creó la evolución puede firmarla');
    }

    // Generar firma
    const dataParaFirmar = {
      subjetivo: evolucion.subjetivo,
      objetivo: evolucion.objetivo,
      analisis: evolucion.analisis,
      plan: evolucion.plan,
      fechaEvolucion: evolucion.fechaEvolucion,
    };

    const firma = firmaDigitalService.crearFirma(dataParaFirmar, usuarioId);

    const evolucionFirmada = await prisma.evolucionClinica.update({
      where: { id },
      data: {
        firmada: true,
        firmaDigital: firma.firmaDigital,
        hashRegistro: firma.hashRegistro,
        fechaFirma: firma.fechaFirma,
      },
    });

    // Auditoría
    await auditoriaService.registrarAccion({
      entidad: 'EvolucionClinica',
      entidadId: id,
      accion: 'Firma',
      usuarioId,
      nombreUsuario: `${usuarioData.nombre} ${usuarioData.apellido}`,
      rol: usuarioData.rol,
      ipOrigen,
    });

    return evolucionFirmada;
  }

  /**
   * Eliminar evolución (solo si no está firmada)
   */
  async delete(id, usuarioId, usuarioData) {
    const evolucion = await this.getById(id);

    if (evolucion.firmada) {
      throw new ValidationError('No se puede eliminar una evolución firmada');
    }

    await prisma.evolucionClinica.delete({ where: { id } });

    // Auditoría
    await auditoriaService.registrarAccion({
      entidad: 'EvolucionClinica',
      entidadId: id,
      accion: 'Eliminacion',
      usuarioId,
      nombreUsuario: `${usuarioData.nombre} ${usuarioData.apellido}`,
      rol: usuarioData.rol,
      valoresAnteriores: evolucion,
    });

    return true;
  }
}

module.exports = new EvolucionClinicaService();
