/**
 * Service de Prescripciones Médicas
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const productoService = require('./producto.service');

class PrescripcionService {
  /**
   * Obtener todas las prescripciones con filtros
   */
  async getAll({ 
    page = 1, 
    limit = 20, 
    pacienteId, 
    admisionId,
    medicoId,
    estado 
  }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (pacienteId) where.pacienteId = pacienteId;
    if (admisionId) where.admisionId = admisionId;
    if (medicoId) where.medicoId = medicoId;
    if (estado) where.estado = estado;

    const [prescripciones, total] = await Promise.all([
      prisma.prescripcion.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaPrescripcion: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
            },
          },
          medico: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          medicamentos: {
            include: {
              producto: {
                select: {
                  id: true,
                  nombre: true,
                  descripcion: true,
                },
              },
            },
          },
        },
      }),
      prisma.prescripcion.count({ where }),
    ]);

    return {
      data: prescripciones,
      total,
      limit: parseInt(limit),
      offset: skip,
    };
  }

  /**
   * Obtener prescripción por ID
   */
  async getById(id) {
    const prescripcion = await prisma.prescripcion.findUnique({
      where: { id },
      include: {
        paciente: true,
        medico: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        admision: {
          select: {
            id: true,
            fechaIngreso: true,
            motivoIngreso: true,
            estado: true,
          },
        },
        medicamentos: {
          include: {
            producto: true,
            administraciones: {
              orderBy: { fechaProgramada: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!prescripcion) {
      throw new NotFoundError('Prescripción no encontrada');
    }

    return prescripcion;
  }

  /**
   * Crear prescripción
   */
  async create(data, medicoId) {
    // Validaciones
    if (!data.pacienteId) {
      throw new ValidationError('pacienteId es requerido');
    }
    if (!data.medicamentos || data.medicamentos.length === 0) {
      throw new ValidationError('Debe incluir al menos un medicamento');
    }

    // Verificar que el paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id: data.pacienteId },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    // Verificar interacciones medicamentosas
    const medicamentosIds = data.medicamentos.map(m => m.productoId);
    const interacciones = await productoService.verificarInteracciones(medicamentosIds);
    
    // Verificar alergias del paciente
    const alergias = await productoService.verificarAlergias(data.pacienteId, medicamentosIds);

    // Crear prescripción con medicamentos
    const prescripcion = await prisma.prescripcion.create({
      data: {
        pacienteId: data.pacienteId,
        admisionId: data.admisionId,
        medicoId,
        fechaInicio: data.fechaInicio || new Date(),
        fechaFin: data.fechaFin,
        diagnostico: data.diagnostico,
        observaciones: data.observaciones,
        estado: 'Activa',
        medicamentos: {
          create: data.medicamentos.map(med => ({
            productoId: med.productoId,
            dosis: med.dosis,
            via: med.via || 'Oral',
            frecuencia: med.frecuencia || 'Cada8Horas',
            frecuenciaDetalle: med.frecuenciaDetalle,
            duracionDias: med.duracionDias,
            cantidadTotal: med.cantidadTotal,
            instrucciones: med.instrucciones,
            indicacionEspecial: med.indicacionEspecial,
            prn: med.prn || false,
          })),
        },
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        medico: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        medicamentos: {
          include: {
            producto: true,
          },
        },
      },
    });

    // Si hay programación, crear administraciones automáticamente
    if (data.admisionId) {
      await this.programarAdministraciones(prescripcion.id);
    }

    return {
      prescripcion,
      alertas: {
        interacciones,
        alergias,
      },
    };
  }

  /**
   * Programar administraciones de medicamentos
   */
  async programarAdministraciones(prescripcionId) {
    const prescripcion = await this.getById(prescripcionId);

    const administraciones = [];

    for (const medPrescrito of prescripcion.medicamentos) {
      if (medPrescrito.suspendido || medPrescrito.prn) {
        continue; // No programar si está suspendido o es PRN
      }

      const horarios = this.calcularHorarios(medPrescrito.frecuencia);
      const dias = medPrescrito.duracionDias || 7; // Por defecto 7 días

      for (let dia = 0; dia < dias; dia++) {
        const fecha = new Date(prescripcion.fechaInicio);
        fecha.setDate(fecha.getDate() + dia);

        for (const hora of horarios) {
          administraciones.push({
            prescripcionMedicamentoId: medPrescrito.id,
            pacienteId: prescripcion.pacienteId,
            fechaProgramada: fecha,
            horaProgramada: hora,
            estado: 'Programada',
          });
        }
      }
    }

    if (administraciones.length > 0) {
      await prisma.administracionMedicamento.createMany({
        data: administraciones,
      });
    }

    return administraciones.length;
  }

  /**
   * Calcular horarios según frecuencia
   */
  calcularHorarios(frecuencia) {
    const horarios = {
      'Unica': ['08:00'],
      'Cada4Horas': ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      'Cada6Horas': ['00:00', '06:00', '12:00', '18:00'],
      'Cada8Horas': ['08:00', '16:00', '00:00'],
      'Cada12Horas': ['08:00', '20:00'],
      'Cada24Horas': ['08:00'],
      'PRN': [], // No se programa, se administra según necesidad
      'Continua': ['00:00'], // Infusión continua
      'Otra': ['08:00'], // Por defecto
    };

    return horarios[frecuencia] || ['08:00'];
  }

  /**
   * Suspender medicamento de una prescripción
   */
  async suspenderMedicamento(prescripcionMedicamentoId, motivo, userId) {
    const medPrescrito = await prisma.prescripcionMedicamento.findUnique({
      where: { id: prescripcionMedicamentoId },
    });

    if (!medPrescrito) {
      throw new NotFoundError('Medicamento prescrito no encontrado');
    }

    const updated = await prisma.prescripcionMedicamento.update({
      where: { id: prescripcionMedicamentoId },
      data: {
        suspendido: true,
        fechaSuspension: new Date(),
        motivoSuspension: motivo,
      },
    });

    // Cancelar administraciones futuras
    await prisma.administracionMedicamento.updateMany({
      where: {
        prescripcionMedicamentoId,
        estado: 'Programada',
        fechaProgramada: { gte: new Date() },
      },
      data: {
        estado: 'Omitida',
        motivoOmision: `Medicamento suspendido: ${motivo}`,
      },
    });

    return updated;
  }

  /**
   * Completar prescripción
   */
  async completar(id, userId) {
    const prescripcion = await this.getById(id);

    const updated = await prisma.prescripcion.update({
      where: { id },
      data: {
        estado: 'Completada',
        fechaFin: new Date(),
      },
    });

    return updated;
  }

  /**
   * Cancelar prescripción
   */
  async cancelar(id, motivo, userId) {
    const prescripcion = await this.getById(id);

    const updated = await prisma.prescripcion.update({
      where: { id },
      data: {
        estado: 'Cancelada',
        observaciones: `${prescripcion.observaciones || ''}\nCANCELADA: ${motivo}`,
      },
    });

    // Cancelar todas las administraciones pendientes
    await prisma.administracionMedicamento.updateMany({
      where: {
        prescripcionMedicamentoId: {
          in: prescripcion.medicamentos.map(m => m.id),
        },
        estado: 'Programada',
      },
      data: {
        estado: 'Omitida',
        motivoOmision: `Prescripción cancelada: ${motivo}`,
      },
    });

    return updated;
  }

  /**
   * Obtener prescripciones activas de un paciente
   */
  async getPrescripcionesActivas(pacienteId) {
    const prescripciones = await prisma.prescripcion.findMany({
      where: {
        pacienteId,
        estado: 'Activa',
        OR: [
          { fechaFin: null },
          { fechaFin: { gte: new Date() } },
        ],
      },
      include: {
        medicamentos: {
          where: {
            suspendido: false,
          },
          include: {
            producto: true,
          },
        },
        medico: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: { fechaPrescripcion: 'desc' },
    });

    return prescripciones;
  }
}

module.exports = new PrescripcionService();
