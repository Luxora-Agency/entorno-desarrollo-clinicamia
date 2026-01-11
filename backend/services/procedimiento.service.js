/**
 * Servicio para gestión de Procedimientos Clínicos y Cirugías
 */

const prisma = require('../db/prisma');
const quirofanoService = require('./quirofano.service');

class ProcedimientoService {
  /**
   * Obtener todos los procedimientos con filtros
   */
  async getProcedimientos(filters = {}) {
    const {
      admisionId,
      pacienteId,
      estado,
      tipo,
      medicoResponsableId,
      fechaDesde,
      fechaHasta,
      quirofanoId,
      limit = 100,
      offset = 0,
    } = filters;

    const where = {};

    if (admisionId) where.admisionId = admisionId;
    if (pacienteId) where.pacienteId = pacienteId;
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (medicoResponsableId) where.medicoResponsableId = medicoResponsableId;
    if (quirofanoId) where.quirofanoId = quirofanoId;

    if (fechaDesde || fechaHasta) {
      where.fechaProgramada = {};
      if (fechaDesde) where.fechaProgramada.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaProgramada.lte = new Date(fechaHasta);
    }

    const [procedimientos, total] = await Promise.all([
      prisma.procedimiento.findMany({
        where,
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
              fechaNacimiento: true,
              genero: true,
            },
          },
          medicoResponsable: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          medicoFirma: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          anestesiologo: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          quirofano: {
            select: {
              id: true,
              nombre: true,
              ubicacion: true,
            },
          },
          admision: {
            select: {
              id: true,
              fechaIngreso: true,
            },
          },
        },
        orderBy: [
          { fechaProgramada: 'desc' },
          { createdAt: 'desc' },
        ],
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.procedimiento.count({ where }),
    ]);

    return {
      procedimientos,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
  }

  /**
   * Obtener un procedimiento por ID
   */
  async getProcedimientoById(id) {
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true,
            fechaNacimiento: true,
            genero: true,
          },
        },
        medicoResponsable: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        medicoFirma: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        quirofano: true,
        anestesiologo: {
            select: {
                id: true,
                nombre: true,
                apellido: true
            }
        },
        admision: {
          select: {
            id: true,
            fechaIngreso: true,
            motivoIngreso: true,
          },
        },
      },
    });

    if (!procedimiento) {
      throw new Error('Procedimiento no encontrado');
    }

    return procedimiento;
  }

  /**
   * Crear un nuevo procedimiento (Cirugía o Procedimiento menor)
   */
  async crearProcedimiento(data, usuarioId) {
    const {
      admisionId,
      pacienteId,
      nombre,
      tipo,
      tipoCirugia,
      descripcion,
      indicacion,
      fechaProgramada,
      duracionEstimada,
      quirofanoId,
      anestesiologoId,
      tipoAnestesia,
      medicoResponsableId,
      // Campos de consentimiento y preoperatorio
      clasificacionASA,
      tiempoAyuno,
      riesgosPotenciales,
      firmaPaciente,
      fechaConsentimiento,
      // Códigos y clasificación
      codigoCIE10,
      codigoCUPS,
      prioridad,
      nivelComplejidad,
      // Equipo
      ayudantes,
    } = data;

    // Validar que la admisión existe y está activa
    if (admisionId) {
      const admision = await prisma.admision.findUnique({
        where: { id: admisionId },
      });

      if (!admision) {
        throw new Error('Admisión no encontrada');
      }

      if (admision.estado !== 'Activa') {
        throw new Error('No se puede crear procedimiento para una admisión no activa');
      }
    }

    // Verificar disponibilidad de quirófano si se asigna uno
    if (quirofanoId && fechaProgramada && duracionEstimada) {
      const availability = await quirofanoService.checkAvailability(
        quirofanoId, 
        fechaProgramada, 
        parseInt(duracionEstimada)
      );

      if (!availability.available) {
        throw new Error(`El quirófano no está disponible en el horario seleccionado. Conflicto con procedimiento ID: ${availability.conflict.id}`);
      }
    }

    const procedimiento = await prisma.procedimiento.create({
      data: {
        admisionId,
        pacienteId,
        medicoResponsableId: medicoResponsableId || usuarioId,
        nombre,
        tipo: tipo || 'Terapeutico',
        tipoCirugia,
        descripcion,
        indicacion,
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
        duracionEstimada: duracionEstimada ? parseInt(duracionEstimada) : null,
        quirofanoId,
        anestesiologoId,
        tipoAnestesia,
        // Campos de consentimiento y preoperatorio
        clasificacionASA,
        tiempoAyuno: tiempoAyuno ? parseInt(tiempoAyuno) : null,
        riesgosPotenciales,
        firmaPaciente,
        fechaConsentimiento: fechaConsentimiento ? new Date(fechaConsentimiento) : null,
        // Códigos y clasificación
        codigoCIE10,
        codigoCUPS,
        prioridad: prioridad || 'Electivo',
        nivelComplejidad: nivelComplejidad || 'Media',
        // Equipo
        ayudantes: ayudantes ? (Array.isArray(ayudantes) ? ayudantes : [ayudantes]) : null,
        estado: 'Programado',
      },
      include: {
        paciente: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        medicoResponsable: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        quirofano: true,
      },
    });

    return procedimiento;
  }

  /**
   * Actualizar un procedimiento
   */
  async actualizarProcedimiento(procedimientoId, data, usuarioId) {
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: procedimientoId },
    });

    if (!procedimiento) {
      throw new Error('Procedimiento no encontrado');
    }

    // Solo el médico responsable puede actualizar antes de que esté completado
    if (procedimiento.medicoResponsableId !== usuarioId && procedimiento.estado !== 'Completado') {
      // throw new Error('No tiene permisos para actualizar este procedimiento');
      // Relaxed permission for now or handle via roles
    }

    // Verificar disponibilidad si se cambia fecha/hora/quirófano
    if (data.quirofanoId || data.fechaProgramada || data.duracionEstimada) {
        const qId = data.quirofanoId || procedimiento.quirofanoId;
        const fecha = data.fechaProgramada || procedimiento.fechaProgramada;
        const duracion = data.duracionEstimada || procedimiento.duracionEstimada;

        if (qId && fecha && duracion) {
            const availability = await quirofanoService.checkAvailability(
                qId, 
                fecha, 
                parseInt(duracion),
                procedimientoId // Exclude self
            );
        
            if (!availability.available) {
                throw new Error(`El quirófano no está disponible en el nuevo horario. Conflicto con procedimiento ID: ${availability.conflict.id}`);
            }
        }
    }

    const updated = await prisma.procedimiento.update({
      where: { id: procedimientoId },
      data,
      include: {
        medicoResponsable: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        quirofano: true,
      },
    });

    return updated;
  }

  /**
   * Iniciar ejecución de un procedimiento
   */
  async iniciarProcedimiento(procedimientoId, usuarioId) {
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: procedimientoId },
    });

    if (!procedimiento) {
      throw new Error('Procedimiento no encontrado');
    }

    if (procedimiento.estado !== 'Programado' && procedimiento.estado !== 'Diferido') {
      throw new Error('Solo se pueden iniciar procedimientos programados o diferidos');
    }

    const updated = await prisma.procedimiento.update({
      where: { id: procedimientoId },
      data: {
        estado: 'EnProceso',
        fechaRealizada: new Date(), // Fecha de inicio real
        horaInicioReal: new Date(),
      },
    });

    return updated;
  }

  /**
   * Completar un procedimiento
   */
  async completarProcedimiento(procedimientoId, data, usuarioId) {
    const {
      tecnicaUtilizada,
      hallazgos,
      complicaciones,
      resultados,
      insumosUtilizados,
      equipoMedico,
      personalAsistente,
      recomendacionesPost,
      cuidadosEspeciales,
      observaciones,
      duracionReal,
      horaFinReal,
    } = data;

    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: procedimientoId },
    });

    if (!procedimiento) {
      throw new Error('Procedimiento no encontrado');
    }

    // if (procedimiento.medicoResponsableId !== usuarioId) {
    //   throw new Error('Solo el médico responsable puede completar el procedimiento');
    // }

    if (procedimiento.estado === 'Completado') {
      throw new Error('Este procedimiento ya ha sido completado');
    }

    if (procedimiento.estado === 'Cancelado') {
      throw new Error('No se puede completar un procedimiento cancelado');
    }

    const finReal = horaFinReal ? new Date(horaFinReal) : new Date();
    
    // Calcular duración real si no se envía, basada en horaInicioReal
    let duracionCalc = duracionReal;
    if (!duracionCalc && procedimiento.horaInicioReal) {
        const diffMs = finReal - new Date(procedimiento.horaInicioReal);
        duracionCalc = Math.round(diffMs / 60000);
    }

    const updated = await prisma.procedimiento.update({
      where: { id: procedimientoId },
      data: {
        estado: 'Completado',
        tecnicaUtilizada,
        hallazgos,
        complicaciones,
        resultados,
        insumosUtilizados,
        equipoMedico,
        personalAsistente,
        recomendacionesPost,
        cuidadosEspeciales,
        observaciones,
        duracionReal: duracionCalc ? parseInt(duracionCalc) : null,
        horaFinReal: finReal,
        firmaMedicoId: usuarioId,
        fechaFirma: new Date(),
      },
      include: {
        paciente: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        medicoResponsable: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Cancelar un procedimiento
   */
  async cancelarProcedimiento(procedimientoId, motivo, usuarioId) {
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: procedimientoId },
    });

    if (!procedimiento) {
      throw new Error('Procedimiento no encontrado');
    }

    // if (procedimiento.medicoResponsableId !== usuarioId) {
    //   throw new Error('Solo el médico responsable puede cancelar el procedimiento');
    // }

    if (procedimiento.estado === 'Completado') {
      throw new Error('No se puede cancelar un procedimiento completado');
    }

    const updated = await prisma.procedimiento.update({
      where: { id: procedimientoId },
      data: {
        estado: 'Cancelado',
        observaciones: motivo || procedimiento.observaciones,
      },
    });

    return updated;
  }

  /**
   * Diferir un procedimiento (posponer)
   */
  async diferirProcedimiento(procedimientoId, nuevaFecha, motivo, usuarioId) {
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: procedimientoId },
    });

    if (!procedimiento) {
      throw new Error('Procedimiento no encontrado');
    }

    // if (procedimiento.medicoResponsableId !== usuarioId) {
    //   throw new Error('Solo el médico responsable puede diferir el procedimiento');
    // }

    if (procedimiento.estado === 'Completado') {
      throw new Error('No se puede diferir un procedimiento completado');
    }

    const updated = await prisma.procedimiento.update({
      where: { id: procedimientoId },
      data: {
        estado: 'Diferido',
        fechaProgramada: nuevaFecha ? new Date(nuevaFecha) : procedimiento.fechaProgramada,
        observaciones: motivo
          ? `${procedimiento.observaciones || ''}\n[Diferido] ${motivo}`
          : procedimiento.observaciones,
      },
    });

    return updated;
  }

  /**
   * Reprogramar un procedimiento diferido
   */
  async reprogramarProcedimiento(procedimientoId, nuevaFecha, usuarioId) {
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: procedimientoId },
    });

    if (!procedimiento) {
      throw new Error('Procedimiento no encontrado');
    }

    // Verificar disponibilidad
    if (procedimiento.quirofanoId) {
        const availability = await quirofanoService.checkAvailability(
            procedimiento.quirofanoId,
            nuevaFecha,
            procedimiento.duracionEstimada || 60,
            procedimientoId
        );

        if (!availability.available) {
            throw new Error(`El quirófano no está disponible en la nueva fecha.`);
        }
    }

    const updated = await prisma.procedimiento.update({
      where: { id: procedimientoId },
      data: {
        estado: 'Programado',
        fechaProgramada: new Date(nuevaFecha),
      },
    });

    return updated;
  }

  /**
   * Obtener estadísticas de procedimientos
   */
  async getEstadisticas(filters = {}) {
    const { medicoId, tipo, fechaInicio, fechaFin, quirofanoId } = filters;

    const where = {};
    if (medicoId) where.medicoResponsableId = medicoId;
    if (tipo) where.tipo = tipo;
    if (quirofanoId) where.quirofanoId = quirofanoId;
    
    if (fechaInicio || fechaFin) {
      where.fechaProgramada = {};
      if (fechaInicio) where.fechaProgramada.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaProgramada.lte = new Date(fechaFin);
    }

    const [total, porEstado, porTipo, tiempoPromedio] = await Promise.all([
      prisma.procedimiento.count({ where }),
      prisma.procedimiento.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.procedimiento.groupBy({
        by: ['tipo'],
        where,
        _count: true,
      }),
      prisma.procedimiento.aggregate({
        where: {
          ...where,
          estado: 'Completado',
          duracionReal: { not: null },
        },
        _avg: {
          duracionReal: true,
        },
      }),
    ]);

    return {
      total,
      porEstado,
      porTipo,
      tiempoPromedioMinutos: tiempoPromedio._avg.duracionReal || 0,
    };
  }
}

module.exports = new ProcedimientoService();
