/**
 * Public routes (no authentication required)
 *
 * These endpoints are used by the patient self-scheduling flow
 * in Front_Usuario_ClinicaMia application.
 */

const { Hono } = require('hono');
const prisma = require('../db/prisma');
const { validate } = require('../middleware/validate');
const { success, error } = require('../utils/response');
const { createPublicAppointmentSchema } = require('../validators/publicAppointment.schema');
const disponibilidadService = require('../services/disponibilidad.service');
const emailService = require('../services/email.service');

const publicRoutes = new Hono();

/**
 * GET /public/departments
 * List active departments for patient selection
 */
publicRoutes.get('/departments', async c => {
  try {
    const departments = await prisma.departamento.findMany({
      where: { estado: 'Activo' },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
      },
      orderBy: { nombre: 'asc' },
    });

    return c.json(success(departments));
  } catch (err) {
    console.error('Error fetching departments:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /public/specialties
 * List specialties, optionally filtered by department
 *
 * Query params:
 * - departmentId: Filter by department UUID
 * - limit: Max results (default 100)
 */
publicRoutes.get('/specialties', async c => {
  try {
    const departmentId = c.req.query('departmentId');
    const limit = parseInt(c.req.query('limit') || '100');

    const specialties = await prisma.especialidad.findMany({
      where: {
        estado: 'Activo',
        ...(departmentId && { departamentoId: departmentId }),
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        costoCOP: true,
        duracionMinutos: true,
        departamento: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { titulo: 'asc' },
      take: limit,
    });

    // Transform for frontend compatibility
    const transformed = specialties.map(s => ({
      id: s.id,
      titulo: s.titulo,
      descripcion: s.descripcion,
      consultationCost: parseFloat(s.costoCOP),
      duracionMinutos: s.duracionMinutos,
      departamento: s.departamento,
    }));

    return c.json(success(transformed));
  } catch (err) {
    console.error('Error fetching specialties:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /public/doctors
 * List doctors, optionally filtered by specialty
 *
 * Query params:
 * - specialtyId: Filter by specialty UUID
 * - limit: Max results (default 100)
 */
publicRoutes.get('/doctors', async c => {
  try {
    const specialtyId = c.req.query('specialtyId');
    const limit = parseInt(c.req.query('limit') || '100');

    const doctors = await prisma.doctor.findMany({
      where: {
        usuario: { activo: true },
        ...(specialtyId && {
          especialidades: {
            some: { especialidadId: specialtyId },
          },
        }),
      },
      select: {
        id: true,
        usuarioId: true,
        biografia: true,
        aniosExperiencia: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        especialidades: {
          select: {
            especialidad: {
              select: { id: true, titulo: true },
            },
          },
        },
      },
      take: limit,
    });

    // Format response for frontend
    const formattedDoctors = doctors.map(d => ({
      id: d.id, // Doctor ID
      usuarioId: d.usuarioId, // Usuario ID (for availability)
      nombre: d.usuario.nombre,
      apellido: d.usuario.apellido,
      nombreCompleto: `Dr. ${d.usuario.nombre} ${d.usuario.apellido}`,
      especialidades: d.especialidades.map(e => e.especialidad.titulo),
      especialidadesIds: d.especialidades.map(e => e.especialidad.id),
      biografia: d.biografia,
      aniosExperiencia: d.aniosExperiencia,
    }));

    return c.json(success(formattedDoctors));
  } catch (err) {
    console.error('Error fetching doctors:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /public/doctors/:id/availability
 * Get available time slots for a doctor on a specific date
 *
 * Query params:
 * - fecha: Date in YYYY-MM-DD format (required)
 */
publicRoutes.get('/doctors/:id/availability', async c => {
  try {
    const doctorId = c.req.param('id');
    const fecha = c.req.query('fecha');

    if (!fecha) {
      return c.json(error('El parámetro fecha es requerido'), 400);
    }

    // Get doctor's usuario ID
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { usuarioId: true },
    });

    if (!doctor) {
      return c.json(error('Doctor no encontrado'), 404);
    }

    // Get availability using existing service
    const availability = await disponibilidadService.getDisponibilidad(doctor.usuarioId, fecha);

    return c.json(success(availability));
  } catch (err) {
    console.error('Error fetching availability:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /public/appointments
 * Create appointment with PendientePago status
 *
 * This endpoint:
 * 1. Finds or creates the patient
 * 2. Validates doctor availability
 * 3. Creates appointment with PendientePago status
 * 4. Returns citaId for payment flow
 */
publicRoutes.post('/appointments', validate(createPublicAppointmentSchema), async c => {
  try {
    const data = c.req.validData;

    // 1. Find or create patient by documento
    let paciente = await prisma.paciente.findUnique({
      where: { cedula: data.documento },
    });

    if (!paciente) {
      paciente = await prisma.paciente.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          tipoDocumento: data.tipo_documento || 'CC',
          cedula: data.documento,
          telefono: data.telefono,
          email: data.email || null,
          genero: data.genero || null,
          fechaNacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
        },
      });
    } else {
      // Update contact info if patient exists
      paciente = await prisma.paciente.update({
        where: { id: paciente.id },
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono,
          email: data.email || paciente.email,
        },
      });
    }

    // 2. Get specialty info for cost and duration
    const especialidad = await prisma.especialidad.findUnique({
      where: { id: data.especialidad_id },
    });

    if (!especialidad) {
      return c.json(error('Especialidad no encontrada'), 404);
    }

    // 3. Get doctor and validate exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctor_id },
      select: { id: true, usuarioId: true },
    });

    if (!doctor) {
      return c.json(error('Doctor no encontrado'), 404);
    }

    // 4. Validate availability
    try {
      await disponibilidadService.validarDisponibilidad(
        doctor.usuarioId,
        data.fecha,
        data.hora,
        especialidad.duracionMinutos
      );
    } catch (validationError) {
      return c.json(error(validationError.message), 409);
    }

    // 5. Create appointment with PendientePago status
    const cita = await prisma.cita.create({
      data: {
        pacienteId: paciente.id,
        doctorId: doctor.usuarioId, // Cita uses Usuario.id, not Doctor.id
        especialidadId: especialidad.id,
        tipoCita: 'Especialidad',
        fecha: new Date(data.fecha + 'T00:00:00Z'),
        hora: new Date(`1970-01-01T${data.hora}:00Z`),
        duracionMinutos: especialidad.duracionMinutos,
        costo: especialidad.costoCOP,
        motivo: data.motivo || 'Consulta programada online',
        estado: 'PendientePago',
        prioridad: 'Media',
      },
      include: {
        especialidad: true,
        doctor: true,
        paciente: true,
      },
    });

    // 6. Send pending payment email notification
    if (paciente.email) {
      try {
        const paymentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/appointments/payment?citaId=${cita.id}`;
        await emailService.sendAppointmentPendingPayment({
          to: paciente.email,
          paciente,
          cita,
          doctor: cita.doctor,
          especialidad,
          paymentUrl,
        });
        console.log('[Public] Email de pago pendiente enviado a:', paciente.email);
      } catch (emailError) {
        console.error('[Public] Error enviando email de pago pendiente:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    return c.json(
      success({
        citaId: cita.id,
        costo: parseFloat(especialidad.costoCOP),
        especialidad: especialidad.titulo,
        fecha: data.fecha,
        hora: data.hora,
        paciente: {
          id: paciente.id,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
        },
      }),
      201
    );
  } catch (err) {
    console.error('Error creating public appointment:', err);

    if (err.message && err.message.includes('solapa')) {
      return c.json(error('El horario seleccionado ya no está disponible'), 409);
    }

    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /public/appointments/:id
 * Get appointment details (for result page after payment)
 */
publicRoutes.get('/appointments/:id', async c => {
  try {
    const id = c.req.param('id');

    const cita = await prisma.cita.findUnique({
      where: { id },
      select: {
        id: true,
        fecha: true,
        hora: true,
        estado: true,
        costo: true,
        motivo: true,
        especialidad: {
          select: { titulo: true },
        },
        doctor: {
          select: { nombre: true, apellido: true },
        },
        paciente: {
          select: { nombre: true, apellido: true, email: true },
        },
      },
    });

    if (!cita) {
      return c.json(error('Cita no encontrada'), 404);
    }

    // Format response
    const formatted = {
      id: cita.id,
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado,
      costo: parseFloat(cita.costo),
      motivo: cita.motivo,
      especialidad: cita.especialidad?.titulo,
      doctor: cita.doctor
        ? `Dr. ${cita.doctor.nombre} ${cita.doctor.apellido}`
        : null,
      paciente: cita.paciente
        ? `${cita.paciente.nombre} ${cita.paciente.apellido}`
        : null,
      pacienteEmail: cita.paciente?.email,
    };

    return c.json(success(formatted));
  } catch (err) {
    console.error('Error fetching appointment:', err);
    return c.json(error(err.message), 500);
  }
});

module.exports = publicRoutes;
