/**
 * Servicio de Atenciones de Urgencias
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class UrgenciaService {
  /**
   * Crear nueva atención de urgencias (Triaje)
   */
  async crearTriaje(data) {
    const atencion = await prisma.atencionUrgencia.create({
      data: {
        pacienteId: data.paciente_id,
        categoriaManchester: data.categoria_manchester,
        nivelUrgencia: data.nivel_urgencia,
        prioridad: parseInt(data.prioridad),
        motivoConsulta: data.motivo_consulta,
        horaTriaje: new Date(),
        medioLlegada: data.medio_llegada,
        acompanante: data.acompanante,
        // Signos vitales - convertir a números
        presionSistolica: data.presion_sistolica ? parseInt(data.presion_sistolica) : null,
        presionDiastolica: data.presion_diastolica ? parseInt(data.presion_diastolica) : null,
        frecuenciaCardiaca: data.frecuencia_cardiaca ? parseInt(data.frecuencia_cardiaca) : null,
        frecuenciaRespiratoria: data.frecuencia_respiratoria ? parseInt(data.frecuencia_respiratoria) : null,
        temperatura: data.temperatura ? parseFloat(data.temperatura) : null,
        saturacionOxigeno: data.saturacion_oxigeno ? parseFloat(data.saturacion_oxigeno) : null,
        escalaGlasgow: data.escala_glasgow ? parseInt(data.escala_glasgow) : null,
        escalaDolor: data.escala_dolor ? parseInt(data.escala_dolor) : null,
        observaciones: data.observaciones,
        estado: 'Espera',
      },
      include: {
        paciente: true,
      },
    });

    return atencion;
  }

  /**
   * Listar atenciones de urgencias
   */
  async listar({ estado, fecha, limit = 50 }) {
    const where = {};
    
    if (estado) {
      where.estado = estado;
    }
    
    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
      
      where.horaLlegada = {
        gte: fechaInicio,
        lte: fechaFin,
      };
    } else {
      // Por defecto, solo hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finHoy = new Date();
      finHoy.setHours(23, 59, 59, 999);
      
      where.horaLlegada = {
        gte: hoy,
        lte: finHoy,
      };
    }

    const atenciones = await prisma.atencionUrgencia.findMany({
      where,
      include: {
        paciente: true,
        medicoAsignado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        enfermeraAsignada: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: [
        { prioridad: 'asc' },
        { horaLlegada: 'asc' },
      ],
      take: parseInt(limit),
    });

    return atenciones;
  }

  /**
   * Obtener atención por ID
   */
  async obtenerPorId(id) {
    const atencion = await prisma.atencionUrgencia.findUnique({
      where: { id },
      include: {
        paciente: true,
        medicoAsignado: true,
        enfermeraAsignada: true,
        cita: true,
        admision: {
          include: {
            unidad: true,
            cama: true,
          },
        },
      },
    });

    if (!atencion) {
      throw new NotFoundError('Atención de urgencias no encontrada');
    }

    return atencion;
  }

  /**
   * Asignar médico y comenzar atención
   */
  async iniciarAtencion(id, data) {
    const atencion = await this.obtenerPorId(id);

    if (atencion.estado !== 'Espera' && atencion.estado !== 'Triaje') {
      throw new ValidationError('La atención ya fue iniciada');
    }

    // Validar que el médico existe (opcional si no se proporciona)
    let medicoId = data.medico_id;
    if (medicoId) {
      const medico = await prisma.usuario.findUnique({
        where: { id: medicoId },
      });
      if (!medico) {
        medicoId = null; // Si no existe, no asignar médico
      }
    }

    const actualizada = await prisma.atencionUrgencia.update({
      where: { id },
      data: {
        medicoAsignadoId: medicoId || null,
        areaAsignada: data.area_asignada,
        horaInicioAtencion: new Date(),
        estado: 'EnAtencion',
      },
      include: {
        paciente: true,
        medicoAsignado: true,
      },
    });

    return actualizada;
  }

  /**
   * Dar de alta
   */
  async darAlta(id, data) {
    const atencion = await this.obtenerPorId(id);

    const actualizada = await prisma.atencionUrgencia.update({
      where: { id },
      data: {
        diagnosticoInicial: data.diagnostico,
        tratamientoAplicado: data.tratamiento,
        indicacionesAlta: data.indicaciones_alta,
        disposicion: 'Alta',
        estado: 'Alta',
        horaFinAtencion: new Date(),
      },
      include: {
        paciente: true,
        medicoAsignado: true,
      },
    });

    return actualizada;
  }

  /**
   * Hospitalizar desde urgencias
   */
  async hospitalizar(id, data) {
    const atencion = await this.obtenerPorId(id);

    // Crear la admisión hospitalaria
    const admision = await prisma.admision.create({
      data: {
        pacienteId: atencion.pacienteId,
        unidadId: data.unidad_id,
        camaId: data.cama_id || null, // Opcional - puede ser null para salones comunes
        motivoIngreso: data.motivo_ingreso || atencion.motivoConsulta,
        diagnosticoIngreso: data.diagnostico_ingreso || atencion.diagnosticoInicial || atencion.motivoConsulta,
        observaciones: data.observaciones,
        estado: 'Activa',
      },
      include: {
        unidad: true,
        cama: true,
      },
    });

    // Actualizar la cama si fue asignada
    if (data.cama_id) {
      await prisma.cama.update({
        where: { id: data.cama_id },
        data: { estado: 'Ocupada' },
      });
    }

    // Actualizar atención de urgencias
    const actualizada = await prisma.atencionUrgencia.update({
      where: { id },
      data: {
        admisionId: admision.id,
        disposicion: 'Hospitalizar',
        estado: 'Hospitalizado',
        horaFinAtencion: new Date(),
      },
      include: {
        paciente: true,
        medicoAsignado: true,
        admision: {
          include: {
            unidad: true,
            cama: true,
          },
        },
      },
    });

    return actualizada;
  }

  /**
   * Programar cita de seguimiento
   */
  async programarCita(id, data) {
    const atencion = await this.obtenerPorId(id);

    // Crear la cita
    const cita = await prisma.cita.create({
      data: {
        pacienteId: atencion.pacienteId,
        doctorId: data.doctor_id,
        especialidadId: data.especialidad_id,
        fecha: new Date(data.fecha),
        hora: new Date(data.hora),
        motivo: data.motivo || 'Seguimiento post-urgencias',
        estado: 'Programada',
        costo: data.costo || 0,
      },
      include: {
        doctor: true,
        especialidad: true,
      },
    });

    // Actualizar atención de urgencias
    const actualizada = await prisma.atencionUrgencia.update({
      where: { id },
      data: {
        citaId: cita.id,
        diagnosticoInicial: data.diagnostico,
        indicacionesAlta: data.indicaciones,
        disposicion: 'Alta',
        estado: 'Alta',
        horaFinAtencion: new Date(),
      },
      include: {
        paciente: true,
        medicoAsignado: true,
        cita: {
          include: {
            doctor: true,
            especialidad: true,
          },
        },
      },
    });

    return actualizada;
  }

  /**
   * Actualizar observaciones/diagnóstico
   */
  async actualizar(id, data) {
    const actualizada = await prisma.atencionUrgencia.update({
      where: { id },
      data: {
        diagnosticoInicial: data.diagnostico_inicial,
        tratamientoAplicado: data.tratamiento_aplicado,
        observaciones: data.observaciones,
        areaAsignada: data.area_asignada,
      },
      include: {
        paciente: true,
        medicoAsignado: true,
      },
    });

    return actualizada;
  }

  /**
   * Obtener estadísticas del día
   */
  async estadisticas(fecha) {
    const fechaInicio = fecha ? new Date(fecha) : new Date();
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);

    const [total, porCategoria, porEstado] = await Promise.all([
      prisma.atencionUrgencia.count({
        where: {
          horaLlegada: { gte: fechaInicio, lte: fechaFin },
        },
      }),
      
      prisma.atencionUrgencia.groupBy({
        by: ['categoriaManchester'],
        where: {
          horaLlegada: { gte: fechaInicio, lte: fechaFin },
        },
        _count: true,
      }),
      
      prisma.atencionUrgencia.groupBy({
        by: ['estado'],
        where: {
          horaLlegada: { gte: fechaInicio, lte: fechaFin },
        },
        _count: true,
      }),
    ]);

    return {
      total,
      porCategoria,
      porEstado,
    };
  }
}

module.exports = new UrgenciaService();
