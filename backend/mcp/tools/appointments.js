/**
 * MCP Tools - Appointment Management
 *
 * Tools for scheduling, canceling, rescheduling, and querying medical appointments.
 */

const prisma = require('../../db/prisma');
const disponibilidadService = require('../../services/disponibilidad.service');

// UUID validation helper
const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Tool definitions
const definitions = [
  {
    name: 'buscar_disponibilidad',
    description: 'Busca horarios disponibles para agendar una cita médica con un doctor específico en una fecha determinada. Retorna los slots de tiempo disponibles.',
    inputSchema: {
      type: 'object',
      properties: {
        doctor_id: {
          type: 'string',
          description: 'ID del doctor (UUID). Usar buscar_doctores primero para obtener el ID.',
        },
        fecha: {
          type: 'string',
          description: 'Fecha para buscar disponibilidad en formato YYYY-MM-DD (ej: 2025-01-15)',
        },
      },
      required: ['doctor_id', 'fecha'],
    },
  },
  {
    name: 'agendar_cita',
    description: 'Agenda una nueva cita médica para un paciente. Requiere datos del paciente, doctor, especialidad, fecha y hora. Si el paciente no existe, se crea automáticamente.',
    inputSchema: {
      type: 'object',
      properties: {
        // Datos del paciente
        documento: {
          type: 'string',
          description: 'Número de documento de identidad del paciente (cédula)',
        },
        tipo_documento: {
          type: 'string',
          enum: ['CC', 'CE', 'TI', 'PP', 'NIT'],
          description: 'Tipo de documento: CC (Cédula), CE (Cédula Extranjería), TI (Tarjeta Identidad), PP (Pasaporte)',
        },
        nombre: {
          type: 'string',
          description: 'Nombre del paciente',
        },
        apellido: {
          type: 'string',
          description: 'Apellido del paciente',
        },
        telefono: {
          type: 'string',
          description: 'Número de teléfono del paciente',
        },
        email: {
          type: 'string',
          description: 'Correo electrónico del paciente (opcional)',
        },
        // Datos de la cita
        doctor_id: {
          type: 'string',
          description: 'ID del doctor (UUID)',
        },
        especialidad_id: {
          type: 'string',
          description: 'ID de la especialidad (UUID)',
        },
        fecha: {
          type: 'string',
          description: 'Fecha de la cita en formato YYYY-MM-DD',
        },
        hora: {
          type: 'string',
          description: 'Hora de la cita en formato HH:MM (24 horas, ej: 14:30)',
        },
        motivo: {
          type: 'string',
          description: 'Motivo o razón de la consulta',
        },
      },
      required: ['documento', 'nombre', 'apellido', 'telefono', 'doctor_id', 'especialidad_id', 'fecha', 'hora'],
    },
  },
  {
    name: 'cancelar_cita',
    description: 'Cancela una cita médica existente. La cita debe estar en estado Programada o PendientePago.',
    inputSchema: {
      type: 'object',
      properties: {
        cita_id: {
          type: 'string',
          description: 'ID de la cita a cancelar (UUID)',
        },
        motivo: {
          type: 'string',
          description: 'Motivo de la cancelación',
        },
      },
      required: ['cita_id', 'motivo'],
    },
  },
  {
    name: 'reprogramar_cita',
    description: 'Reprograma una cita médica existente a una nueva fecha y hora. Mantiene el mismo doctor y especialidad.',
    inputSchema: {
      type: 'object',
      properties: {
        cita_id: {
          type: 'string',
          description: 'ID de la cita a reprogramar (UUID)',
        },
        nueva_fecha: {
          type: 'string',
          description: 'Nueva fecha para la cita en formato YYYY-MM-DD',
        },
        nueva_hora: {
          type: 'string',
          description: 'Nueva hora para la cita en formato HH:MM (24 horas)',
        },
        motivo: {
          type: 'string',
          description: 'Motivo de la reprogramación',
        },
      },
      required: ['cita_id', 'nueva_fecha', 'nueva_hora'],
    },
  },
  {
    name: 'consultar_citas_paciente',
    description: 'Consulta las citas de un paciente. Puede filtrar por estado y rango de fechas.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
        estado: {
          type: 'string',
          enum: ['Programada', 'Completada', 'Cancelada', 'NoAsistio', 'PendientePago', 'EnProceso'],
          description: 'Filtrar por estado de la cita (opcional)',
        },
        desde: {
          type: 'string',
          description: 'Fecha desde en formato YYYY-MM-DD (opcional)',
        },
        hasta: {
          type: 'string',
          description: 'Fecha hasta en formato YYYY-MM-DD (opcional)',
        },
        limite: {
          type: 'number',
          description: 'Número máximo de citas a retornar (default: 10)',
        },
      },
      required: ['documento'],
    },
  },
  {
    name: 'detalle_cita',
    description: 'Obtiene el detalle completo de una cita específica incluyendo información del paciente, doctor y especialidad.',
    inputSchema: {
      type: 'object',
      properties: {
        cita_id: {
          type: 'string',
          description: 'ID de la cita (UUID)',
        },
      },
      required: ['cita_id'],
    },
  },
  {
    name: 'confirmar_asistencia',
    description: 'Confirma la asistencia del paciente a una cita programada. Útil para recordatorios.',
    inputSchema: {
      type: 'object',
      properties: {
        cita_id: {
          type: 'string',
          description: 'ID de la cita a confirmar (UUID)',
        },
      },
      required: ['cita_id'],
    },
  },
];

// Tool handlers
const handlers = {
  /**
   * Buscar disponibilidad de un doctor
   */
  buscar_disponibilidad: async ({ doctor_id, fecha }) => {
    // Validate UUID format
    if (!isValidUUID(doctor_id)) {
      throw new Error('ID de doctor inválido. Debe ser un UUID válido. Use buscar_doctores para obtener el ID correcto.');
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(fecha + 'T00:00:00');
    if (requestedDate < today) {
      throw new Error('No se puede buscar disponibilidad en fechas pasadas');
    }

    // Get doctor
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctor_id },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true } },
        especialidades: {
          include: { especialidad: { select: { titulo: true } } },
        },
      },
    });

    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    // Get availability
    const disponibilidad = await disponibilidadService.getDisponibilidad(doctor.usuarioId, fecha);

    // El servicio devuelve slots_disponibles con hora_inicio/hora_fin
    const slots = disponibilidad.slots_disponibles || [];
    const slotsDisponibles = slots.filter((s) => s.disponible);

    return {
      doctor: `Dr. ${doctor.usuario.nombre} ${doctor.usuario.apellido}`,
      especialidades: doctor.especialidades.map((e) => e.especialidad.titulo),
      fecha: fecha,
      total_slots: slots.length,
      slots_disponibles: slotsDisponibles.length,
      horarios: slotsDisponibles.map((s) => ({
        hora: s.hora_inicio,
        hora_fin: s.hora_fin,
      })),
      mensaje:
        slotsDisponibles.length > 0
          ? `Hay ${slotsDisponibles.length} horarios disponibles para el ${fecha}`
          : `No hay horarios disponibles para el ${fecha}. Intente con otra fecha.`,
    };
  },

  /**
   * Agendar una nueva cita
   */
  agendar_cita: async ({
    documento,
    tipo_documento = 'CC',
    nombre,
    apellido,
    telefono,
    email,
    doctor_id,
    especialidad_id,
    fecha,
    hora,
    motivo,
  }) => {
    // Validate UUID formats
    if (!isValidUUID(doctor_id)) {
      throw new Error('ID de doctor inválido. Debe ser un UUID válido. Use buscar_doctores para obtener el ID.');
    }
    if (!isValidUUID(especialidad_id)) {
      throw new Error('ID de especialidad inválido. Debe ser un UUID válido. Use listar_especialidades para obtener el ID.');
    }

    // Validate inputs
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    if (!/^\d{2}:\d{2}$/.test(hora)) {
      throw new Error('Formato de hora inválido. Use HH:MM');
    }

    // Find or create patient
    let paciente = await prisma.paciente.findUnique({
      where: { cedula: documento },
    });

    if (!paciente) {
      paciente = await prisma.paciente.create({
        data: {
          nombre,
          apellido,
          tipoDocumento: tipo_documento,
          cedula: documento,
          telefono,
          email: email || null,
        },
      });
    } else {
      // Update contact info
      paciente = await prisma.paciente.update({
        where: { id: paciente.id },
        data: {
          nombre,
          apellido,
          telefono,
          email: email || paciente.email,
        },
      });
    }

    // Get doctor
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctor_id },
      include: { usuario: { select: { id: true, nombre: true, apellido: true } } },
    });

    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    // Get specialty
    const especialidad = await prisma.especialidad.findUnique({
      where: { id: especialidad_id },
    });

    if (!especialidad) {
      throw new Error('Especialidad no encontrada');
    }

    // Validate availability
    try {
      await disponibilidadService.validarDisponibilidad(
        doctor.usuarioId,
        fecha,
        hora,
        especialidad.duracionMinutos
      );
    } catch (err) {
      throw new Error(`Horario no disponible: ${err.message}`);
    }

    // Create appointment
    const cita = await prisma.cita.create({
      data: {
        pacienteId: paciente.id,
        doctorId: doctor.usuarioId,
        especialidadId: especialidad.id,
        tipoCita: 'Especialidad',
        fecha: new Date(fecha + 'T00:00:00Z'),
        hora: new Date(`1970-01-01T${hora}:00Z`),
        duracionMinutos: especialidad.duracionMinutos,
        costo: especialidad.costoCOP,
        motivo: motivo || 'Consulta programada vía WhatsApp',
        estado: 'Programada',
        prioridad: 'Media',
      },
    });

    return {
      exito: true,
      mensaje: '¡Cita agendada exitosamente!',
      cita: {
        id: cita.id,
        fecha: fecha,
        hora: hora,
        duracion: `${especialidad.duracionMinutos} minutos`,
        doctor: `Dr. ${doctor.usuario.nombre} ${doctor.usuario.apellido}`,
        especialidad: especialidad.titulo,
        paciente: `${nombre} ${apellido}`,
        costo: `$${parseFloat(especialidad.costoCOP).toLocaleString('es-CO')} COP`,
        estado: cita.estado,
      },
      recordatorio: `Recuerde llegar 15 minutos antes de su cita. Traiga su documento de identidad y carné de EPS si aplica.`,
    };
  },

  /**
   * Cancelar una cita
   */
  cancelar_cita: async ({ cita_id, motivo }) => {
    // Validate UUID format
    if (!isValidUUID(cita_id)) {
      throw new Error('ID de cita inválido. Debe ser un UUID válido. Use consultar_citas_paciente para obtener el ID.');
    }

    const cita = await prisma.cita.findUnique({
      where: { id: cita_id },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
        doctor: { select: { nombre: true, apellido: true } },
        especialidad: { select: { titulo: true } },
      },
    });

    if (!cita) {
      throw new Error('Cita no encontrada');
    }

    if (!['Programada', 'PendientePago'].includes(cita.estado)) {
      throw new Error(
        `No se puede cancelar una cita en estado "${cita.estado}". Solo se pueden cancelar citas Programadas o PendientePago.`
      );
    }

    // Cancel appointment
    await prisma.cita.update({
      where: { id: cita_id },
      data: {
        estado: 'Cancelada',
        notas: cita.notas
          ? `${cita.notas}\n[Cancelada vía WhatsApp]: ${motivo}`
          : `[Cancelada vía WhatsApp]: ${motivo}`,
      },
    });

    const fechaFormateada = new Date(cita.fecha).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      exito: true,
      mensaje: 'Cita cancelada exitosamente',
      cita_cancelada: {
        id: cita_id,
        fecha: fechaFormateada,
        hora: new Date(cita.hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        doctor: `Dr. ${cita.doctor.nombre} ${cita.doctor.apellido}`,
        especialidad: cita.especialidad.titulo,
        paciente: `${cita.paciente.nombre} ${cita.paciente.apellido}`,
        motivo_cancelacion: motivo,
      },
      nota: 'Si desea reagendar su cita, puede hacerlo en cualquier momento.',
    };
  },

  /**
   * Reprogramar una cita
   */
  reprogramar_cita: async ({ cita_id, nueva_fecha, nueva_hora, motivo }) => {
    // Validate UUID format
    if (!isValidUUID(cita_id)) {
      throw new Error('ID de cita inválido. Debe ser un UUID válido. Use consultar_citas_paciente para obtener el ID.');
    }

    // Validate formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nueva_fecha)) {
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    if (!/^\d{2}:\d{2}$/.test(nueva_hora)) {
      throw new Error('Formato de hora inválido. Use HH:MM');
    }

    const cita = await prisma.cita.findUnique({
      where: { id: cita_id },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
        doctor: { select: { id: true, nombre: true, apellido: true } },
        especialidad: { select: { titulo: true, duracionMinutos: true } },
      },
    });

    if (!cita) {
      throw new Error('Cita no encontrada');
    }

    if (!['Programada', 'PendientePago'].includes(cita.estado)) {
      throw new Error(`No se puede reprogramar una cita en estado "${cita.estado}"`);
    }

    // Get doctor's usuario ID
    const doctor = await prisma.doctor.findFirst({
      where: { usuarioId: cita.doctorId },
    });

    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    // Validate new availability
    try {
      await disponibilidadService.validarDisponibilidad(
        cita.doctorId,
        nueva_fecha,
        nueva_hora,
        cita.especialidad.duracionMinutos
      );
    } catch (err) {
      throw new Error(`Nuevo horario no disponible: ${err.message}`);
    }

    const fechaAnterior = new Date(cita.fecha).toLocaleDateString('es-CO');
    const horaAnterior = new Date(cita.hora).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Update appointment
    await prisma.cita.update({
      where: { id: cita_id },
      data: {
        fecha: new Date(nueva_fecha + 'T00:00:00Z'),
        hora: new Date(`1970-01-01T${nueva_hora}:00Z`),
        notas: cita.notas
          ? `${cita.notas}\n[Reprogramada vía WhatsApp de ${fechaAnterior} ${horaAnterior}]: ${motivo || 'Sin motivo especificado'}`
          : `[Reprogramada vía WhatsApp de ${fechaAnterior} ${horaAnterior}]: ${motivo || 'Sin motivo especificado'}`,
      },
    });

    return {
      exito: true,
      mensaje: '¡Cita reprogramada exitosamente!',
      cambio: {
        anterior: {
          fecha: fechaAnterior,
          hora: horaAnterior,
        },
        nueva: {
          fecha: nueva_fecha,
          hora: nueva_hora,
        },
      },
      cita: {
        id: cita_id,
        doctor: `Dr. ${cita.doctor.nombre} ${cita.doctor.apellido}`,
        especialidad: cita.especialidad.titulo,
        paciente: `${cita.paciente.nombre} ${cita.paciente.apellido}`,
      },
      recordatorio: 'Recuerde llegar 15 minutos antes de su nueva cita.',
    };
  },

  /**
   * Consultar citas de un paciente
   */
  consultar_citas_paciente: async ({ documento, estado, desde, hasta, limite = 10 }) => {
    const paciente = await prisma.paciente.findUnique({
      where: { cedula: documento },
    });

    if (!paciente) {
      return {
        encontrado: false,
        mensaje: `No se encontró ningún paciente con documento ${documento}. ¿Desea agendar una cita nueva?`,
      };
    }

    const where = {
      pacienteId: paciente.id,
    };

    if (estado) {
      where.estado = estado;
    }

    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde + 'T00:00:00Z');
      if (hasta) where.fecha.lte = new Date(hasta + 'T23:59:59Z');
    }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        doctor: { select: { nombre: true, apellido: true } },
        especialidad: { select: { titulo: true } },
      },
      orderBy: { fecha: 'desc' },
      take: limite,
    });

    if (citas.length === 0) {
      return {
        encontrado: true,
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        mensaje: estado
          ? `No tiene citas en estado "${estado}"`
          : 'No tiene citas registradas',
        citas: [],
      };
    }

    return {
      encontrado: true,
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      total_citas: citas.length,
      citas: citas.map((c) => ({
        id: c.id,
        fecha: new Date(c.fecha).toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        hora: new Date(c.hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        doctor: `Dr. ${c.doctor.nombre} ${c.doctor.apellido}`,
        especialidad: c.especialidad.titulo,
        estado: c.estado,
        costo: c.costo ? `$${parseFloat(c.costo).toLocaleString('es-CO')} COP` : 'Por definir',
      })),
    };
  },

  /**
   * Obtener detalle de una cita
   */
  detalle_cita: async ({ cita_id }) => {
    // Validate UUID format
    if (!isValidUUID(cita_id)) {
      throw new Error('ID de cita inválido. Debe ser un UUID válido. Use consultar_citas_paciente para obtener el ID.');
    }

    const cita = await prisma.cita.findUnique({
      where: { id: cita_id },
      include: {
        paciente: true,
        doctor: { select: { nombre: true, apellido: true, telefono: true } },
        especialidad: true,
      },
    });

    if (!cita) {
      throw new Error('Cita no encontrada');
    }

    return {
      id: cita.id,
      estado: cita.estado,
      tipo: cita.tipoCita,
      fecha: new Date(cita.fecha).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      hora: new Date(cita.hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      duracion: `${cita.duracionMinutos} minutos`,
      paciente: {
        nombre: `${cita.paciente.nombre} ${cita.paciente.apellido}`,
        documento: cita.paciente.cedula,
        telefono: cita.paciente.telefono,
        email: cita.paciente.email,
      },
      doctor: {
        nombre: `Dr. ${cita.doctor.nombre} ${cita.doctor.apellido}`,
        telefono: cita.doctor.telefono,
      },
      especialidad: {
        nombre: cita.especialidad.titulo,
        descripcion: cita.especialidad.descripcion,
      },
      costo: cita.costo ? `$${parseFloat(cita.costo).toLocaleString('es-CO')} COP` : 'Por definir',
      motivo: cita.motivo,
      notas: cita.notas,
      creada: new Date(cita.createdAt).toLocaleString('es-CO'),
    };
  },

  /**
   * Confirmar asistencia a una cita
   */
  confirmar_asistencia: async ({ cita_id }) => {
    // Validate UUID format
    if (!isValidUUID(cita_id)) {
      throw new Error('ID de cita inválido. Debe ser un UUID válido. Use consultar_citas_paciente para obtener el ID.');
    }

    const cita = await prisma.cita.findUnique({
      where: { id: cita_id },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
        doctor: { select: { nombre: true, apellido: true } },
        especialidad: { select: { titulo: true } },
      },
    });

    if (!cita) {
      throw new Error('Cita no encontrada');
    }

    if (cita.estado !== 'Programada') {
      return {
        confirmada: false,
        mensaje: `La cita está en estado "${cita.estado}" y no requiere confirmación.`,
      };
    }

    // Add confirmation note
    await prisma.cita.update({
      where: { id: cita_id },
      data: {
        notas: cita.notas
          ? `${cita.notas}\n[Asistencia confirmada vía WhatsApp: ${new Date().toLocaleString('es-CO')}]`
          : `[Asistencia confirmada vía WhatsApp: ${new Date().toLocaleString('es-CO')}]`,
      },
    });

    return {
      confirmada: true,
      mensaje: '¡Gracias por confirmar su asistencia!',
      cita: {
        fecha: new Date(cita.fecha).toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        hora: new Date(cita.hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        doctor: `Dr. ${cita.doctor.nombre} ${cita.doctor.apellido}`,
        especialidad: cita.especialidad.titulo,
      },
      recordatorio: 'Recuerde llegar 15 minutos antes. Traiga su documento de identidad.',
    };
  },
};

module.exports = { definitions, handlers };
