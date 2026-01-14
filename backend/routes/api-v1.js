/**
 * API v1 Routes
 *
 * This file creates a versioned API route group that matches the
 * frontend's expected path structure (from OpenAPI types).
 *
 * Frontend expects: /api/v1/departments/public, /api/v1/doctors/public, etc.
 */

const { Hono } = require('hono');
const prisma = require('../db/prisma');
const { validate } = require('../middleware/validate');
const { success, error } = require('../utils/response');
const { createPublicAppointmentSchema } = require('../validators/publicAppointment.schema');
const { createPaymentSessionSchema } = require('../validators/payment.schema');
const disponibilidadService = require('../services/disponibilidad.service');
const epaycoService = require('../services/epayco.service');

const apiV1 = new Hono();

// ============================================
// PUBLIC DEPARTMENT ROUTES
// ============================================

/**
 * GET /api/v1/departments/public
 * List active departments for patient selection
 */
apiV1.get('/departments/public', async c => {
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
 * GET /api/v1/departments/public/:id
 * Get a single department with its specialties and related doctors
 */
apiV1.get('/departments/public/:id', async c => {
  try {
    const departmentId = c.req.param('id');

    const department = await prisma.departamento.findUnique({
      where: { id: departmentId },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        especialidades: {
          where: { estado: 'Activo' },
          select: {
            id: true,
            titulo: true,
            descripcion: true,
            costoCOP: true,
            duracionMinutos: true,
          },
        },
      },
    });

    if (!department) {
      return c.json(error('Departamento no encontrado'), 404);
    }

    // Get doctors for this department's specialties
    const specialtyIds = department.especialidades.map(s => s.id);

    let doctors = [];
    if (specialtyIds.length > 0) {
      doctors = await prisma.doctor.findMany({
        where: {
          usuario: { activo: true },
          especialidades: {
            some: { especialidadId: { in: specialtyIds } },
          },
        },
        select: {
          id: true,
          biografia: true,
          aniosExperiencia: true,
          foto: true,
          usuario: {
            select: {
              nombre: true,
              apellido: true,
            },
          },
          especialidades: {
            where: { especialidadId: { in: specialtyIds } },
            select: {
              especialidad: {
                select: { id: true, titulo: true },
              },
            },
          },
        },
        take: 10,
      });
    }

    // Transform doctors for frontend
    const transformedDoctors = doctors.map(d => ({
      id: d.id,
      nombreCompleto: `${d.usuario?.nombre || ''} ${d.usuario?.apellido || ''}`.trim(),
      nombre: d.usuario?.nombre,
      apellido: d.usuario?.apellido,
      biografia: d.biografia,
      aniosExperiencia: d.aniosExperiencia,
      foto: d.foto,
      especialidades: d.especialidades?.map(e => e.especialidad?.titulo).filter(Boolean) || [],
    }));

    return c.json(success({
      ...department,
      doctors: transformedDoctors,
    }));
  } catch (err) {
    console.error('Error fetching department details:', err);
    return c.json(error(err.message), 500);
  }
});

// ============================================
// PUBLIC SPECIALTY ROUTES
// ============================================

/**
 * GET /api/v1/specialties/public
 * List specialties, optionally filtered by department
 *
 * Query params:
 * - departmentId: Filter by department UUID
 * - limit: Max results (default 100)
 */
apiV1.get('/specialties/public', async c => {
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

// ============================================
// PUBLIC DOCTOR ROUTES
// ============================================

/**
 * GET /api/v1/doctors/public
 * List doctors, optionally filtered by specialty
 *
 * Query params:
 * - specialtyId: Filter by specialty UUID
 * - limit: Max results (default 100)
 */
apiV1.get('/doctors/public', async c => {
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
        foto: true,
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
      foto: d.foto,
    }));

    return c.json(success(formattedDoctors));
  } catch (err) {
    console.error('Error fetching doctors:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /api/v1/doctors/public/:id
 * Get a single doctor's public profile by ID
 */
apiV1.get('/doctors/public/:id', async c => {
  try {
    const doctorId = c.req.param('id');

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        usuarioId: true,
        biografia: true,
        aniosExperiencia: true,
        foto: true,
        licenciaMedica: true,
        universidad: true,
        horarios: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
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
    });

    if (!doctor) {
      return c.json(error('Doctor no encontrado'), 404);
    }

    // Format response for frontend
    const formatted = {
      id: doctor.id,
      usuarioId: doctor.usuarioId,
      nombre: doctor.usuario.nombre,
      apellido: doctor.usuario.apellido,
      nombreCompleto: `Dr. ${doctor.usuario.nombre} ${doctor.usuario.apellido}`,
      email: doctor.usuario.email,
      telefono: doctor.usuario.telefono,
      especialidades: doctor.especialidades.map(e => e.especialidad.titulo),
      especialidadesIds: doctor.especialidades.map(e => e.especialidad.id),
      biografia: doctor.biografia,
      aniosExperiencia: doctor.aniosExperiencia,
      foto: doctor.foto,
      licenciaMedica: doctor.licenciaMedica,
      universidad: doctor.universidad,
      horarios: doctor.horarios,
    };

    return c.json(success(formatted));
  } catch (err) {
    console.error('Error fetching doctor:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /api/v1/doctors/:id/availability
 * Get available time slots for a doctor on a specific date
 *
 * Query params:
 * - fecha: Date in YYYY-MM-DD format (required)
 *
 * The :id can be either Doctor.id or Usuario.id (for compatibility with citas)
 */
apiV1.get('/doctors/:id/availability', async c => {
  try {
    const doctorId = c.req.param('id');
    const fecha = c.req.query('fecha');

    if (!fecha) {
      return c.json(error('El parámetro fecha es requerido'), 400);
    }

    // Try to find doctor by Doctor.id first, then by Usuario.id
    let doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { usuarioId: true },
    });

    // If not found by Doctor.id, try finding by Usuario.id
    if (!doctor) {
      doctor = await prisma.doctor.findFirst({
        where: { usuarioId: doctorId },
        select: { usuarioId: true },
      });
    }

    if (!doctor) {
      return c.json(error('Doctor no encontrado'), 404);
    }

    // Get availability using existing service (always uses Usuario.id)
    const availability = await disponibilidadService.getDisponibilidad(doctor.usuarioId, fecha);

    return c.json(success(availability));
  } catch (err) {
    console.error('Error fetching availability:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ============================================
// PUBLIC PATIENT LOOKUP
// ============================================

/**
 * GET /api/v1/patients/lookup
 * Look up patient by document number (public - for appointment form)
 *
 * Query params:
 * - tipoDocumento: Document type (CC, CE, TI, PPN)
 * - documento: Document number
 */
apiV1.get('/patients/lookup', async c => {
  try {
    const tipoDocumentoInput = c.req.query('tipoDocumento') || 'CC';
    const documento = c.req.query('documento');

    if (!documento) {
      return c.json(error('El número de documento es requerido'), 400);
    }

    // Map abbreviations to full document type names used in database
    const documentTypeMap = {
      'CC': 'Cédula de Ciudadanía',
      'TI': 'Tarjeta de Identidad',
      'CE': 'Cédula de Extranjería',
      'PA': 'Pasaporte',
      'RC': 'Registro Civil',
      'PPN': 'Pasaporte',
      // Also support full names
      'Cédula de Ciudadanía': 'Cédula de Ciudadanía',
      'Tarjeta de Identidad': 'Tarjeta de Identidad',
      'Cédula de Extranjería': 'Cédula de Extranjería',
      'Pasaporte': 'Pasaporte',
      'Registro Civil': 'Registro Civil',
    };

    const tipoDocumento = documentTypeMap[tipoDocumentoInput] || tipoDocumentoInput;

    // Look up patient by document - try with type first, then without
    const selectFields = {
      id: true,
      nombre: true,
      apellido: true,
      tipoDocumento: true,
      cedula: true,
      telefono: true,
      email: true,
      genero: true,
      fechaNacimiento: true,
      direccion: true,
      municipio: true,
      departamento: true,
      eps: true,
      tipoAfiliacion: true,
    };

    // Try to find with document type first
    let paciente = await prisma.paciente.findFirst({
      where: {
        cedula: documento,
        tipoDocumento: tipoDocumento,
      },
      select: selectFields,
    });

    // Fallback: search by document number only if not found with type
    if (!paciente) {
      paciente = await prisma.paciente.findFirst({
        where: {
          cedula: documento,
        },
        select: selectFields,
      });
    }

    if (!paciente) {
      return c.json(success({ found: false, patient: null }));
    }

    // Return patient data for pre-filling
    return c.json(success({
      found: true,
      patient: {
        id: paciente.id,
        nombreCompleto: `${paciente.nombre} ${paciente.apellido}`,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        tipoDocumento: paciente.tipoDocumento,
        documento: paciente.cedula,
        telefono: paciente.telefono,
        email: paciente.email,
        genero: paciente.genero,
        fechaNacimiento: paciente.fechaNacimiento,
        direccion: paciente.direccion,
        ciudad: paciente.ciudad,
        departamento: paciente.departamento,
        eps: paciente.eps,
        tipoAfiliacion: paciente.tipoAfiliacion,
      }
    }));
  } catch (err) {
    console.error('Error looking up patient:', err);
    return c.json(error(err.message), 500);
  }
});

// ============================================
// PUBLIC APPOINTMENT ROUTES
// ============================================

/**
 * POST /api/v1/appointments/public
 * Create appointment with PendientePago status
 */
apiV1.post('/appointments/public', validate(createPublicAppointmentSchema), async c => {
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
 * GET /api/v1/appointments/:id
 * Get appointment details (for result page after payment)
 */
apiV1.get('/appointments/:id', async c => {
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

// ============================================
// PAYMENT ROUTES
// ============================================

/**
 * POST /api/v1/payments/sessions
 * Create ePayco payment session for an appointment
 */
apiV1.post('/payments/sessions', validate(createPaymentSessionSchema), async c => {
  try {
    const { cita_id } = c.req.validData;

    // Get appointment with patient and specialty data
    const cita = await prisma.cita.findUnique({
      where: { id: cita_id },
      include: {
        paciente: true,
        especialidad: true,
      },
    });

    if (!cita) {
      return c.json(error('Cita no encontrada'), 404);
    }

    if (cita.estado !== 'PendientePago') {
      return c.json(error('La cita no está pendiente de pago'), 400);
    }

    // Create ePayco session
    const session = await epaycoService.createPaymentSession(cita, cita.paciente);

    return c.json(
      success({
        sessionId: session.sessionId,
        publicKey: session.publicKey,
        amount: parseFloat(cita.costo),
        currency: 'COP',
      })
    );
  } catch (err) {
    console.error('Payment session error:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /api/v1/payments/webhooks/epayco
 * ePayco confirmation webhook
 */
apiV1.post('/payments/webhooks/epayco', async c => {
  try {
    // Parse body - ePayco can send as form-urlencoded or JSON
    let webhookData;
    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('application/json')) {
      webhookData = await c.req.json();
    } else {
      // form-urlencoded
      const text = await c.req.text();
      webhookData = Object.fromEntries(new URLSearchParams(text));
    }

    console.log('ePayco webhook received:', JSON.stringify(webhookData, null, 2));

    // Process webhook (validates signature internally)
    const result = await epaycoService.processWebhook(webhookData);

    // Complete payment if approved
    if (result.status === 'approved') {
      await epaycoService.completePayment(result.citaId, result);
      console.log('Payment completed for cita:', result.citaId);
    } else {
      console.log('Payment not approved:', result.status, 'for cita:', result.citaId);
    }

    // Always respond 200 to acknowledge receipt
    return c.json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Still return 200 to prevent retries for validation errors
    return c.json({ status: 'error', message: err.message });
  }
});

/**
 * GET /api/v1/payments/webhooks/epayco
 * ePayco can also send confirmations via GET
 */
apiV1.get('/payments/webhooks/epayco', async c => {
  try {
    const webhookData = c.req.query();

    console.log('ePayco webhook (GET) received:', JSON.stringify(webhookData, null, 2));

    // Process webhook
    const result = await epaycoService.processWebhook(webhookData);

    // Complete payment if approved
    if (result.status === 'approved') {
      await epaycoService.completePayment(result.citaId, result);
    }

    return c.json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Webhook processing error (GET):', err);
    return c.json({ status: 'error', message: err.message });
  }
});

/**
 * GET /api/v1/payments/status/:citaId
 * Check payment status for an appointment (for polling from frontend)
 */
apiV1.get('/payments/status/:citaId', async c => {
  try {
    const citaId = c.req.param('citaId');

    const status = await epaycoService.getPaymentStatus(citaId);

    return c.json(success(status));
  } catch (err) {
    console.error('Error fetching payment status:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /api/v1/payments/response
 * ePayco response URL (redirect after payment)
 */
apiV1.get('/payments/response', async c => {
  try {
    const query = c.req.query();
    const citaId = query.extra1 || query.citaId;

    // Redirect to frontend with payment result
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const refPayco = query.ref_payco || query.x_ref_payco || '';

    return c.redirect(`${frontendUrl}/cita/resultado?citaId=${citaId}&ref=${refPayco}`);
  } catch (err) {
    console.error('Error in payment response:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return c.redirect(`${frontendUrl}/cita/error`);
  }
});

// ============================================
// PUBLIC PLANS ROUTES (MiaPass)
// ============================================

/**
 * GET /api/v1/plans/public
 * List active MiaPass plans for public display (pricing page)
 */
apiV1.get('/plans/public', async c => {
  try {
    const plans = await prisma.miaPassPlan.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        costo: true,
        duracionMeses: true,
        beneficios: true,
        destacado: true,
      },
      orderBy: { costo: 'asc' },
    });

    // Transform plans to match expected format for frontend
    const transformedPlans = plans.map(plan => ({
      id: plan.id,
      title: plan.nombre,
      description: plan.descripcion,
      price: plan.costo,
      currency: 'COP',
      period: plan.duracionMeses === 1 ? 'mes' : `${plan.duracionMeses} meses`,
      features: plan.beneficios || [],
      featured: plan.destacado || false,
    }));

    return c.json(success(transformedPlans, 'Planes obtenidos'));
  } catch (err) {
    console.error('Error fetching public plans:', err);
    return c.json(error(err.message), 500);
  }
});

// ============================================
// PUBLIC BLOG ROUTES
// ============================================

/**
 * GET /api/v1/posts/public
 * List published blog posts (public - alias for /blog/posts)
 * Used by the patient frontend
 */
apiV1.get('/posts/public', async c => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const page = parseInt(c.req.query('page') || '1');
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.publicacion.findMany({
        where: { estado: 'Publicado' },
        select: {
          id: true,
          titulo: true,
          slug: true,
          extracto: true,
          imagenPortada: true,
          fechaPublicacion: true,
          autor: {
            select: { id: true, nombre: true, apellido: true },
          },
          categoria: {
            select: { id: true, nombre: true },
          },
        },
        orderBy: { fechaPublicacion: 'desc' },
        skip,
        take: limit,
      }),
      prisma.publicacion.count({ where: { estado: 'Publicado' } }),
    ]);

    // Transform posts to match expected format
    const transformedPosts = posts.map(post => ({
      id: post.id,
      title: post.titulo,
      slug: post.slug,
      excerpt: post.extracto,
      featuredImage: post.imagenPortada,
      publishedAt: post.fechaPublicacion,
      author: post.autor ? `${post.autor.nombre} ${post.autor.apellido}` : null,
      category: post.categoria?.nombre,
      href: `/blog/${post.slug}`,
    }));

    return c.json(success(transformedPosts, 'Blog posts obtenidos'));
  } catch (err) {
    console.error('Error fetching public posts:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /api/v1/blog/posts
 * List published blog posts (public)
 *
 * Query params:
 * - categoriaId: Filter by category
 * - search: Search in title and content
 * - limit: Max results (default 10)
 * - page: Page number (default 1)
 */
apiV1.get('/blog/posts', async c => {
  try {
    const categoriaId = c.req.query('categoriaId');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '10');
    const page = parseInt(c.req.query('page') || '1');
    const skip = (page - 1) * limit;

    const where = {
      estado: 'Publicado',
    };

    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { extracto: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.publicacion.findMany({
        where,
        select: {
          id: true,
          titulo: true,
          slug: true,
          extracto: true,
          imagenPortada: true,
          fechaPublicacion: true,
          autor: {
            select: { id: true, nombre: true, apellido: true },
          },
          categoria: {
            select: { id: true, nombre: true, slug: true },
          },
        },
        orderBy: { fechaPublicacion: 'desc' },
        take: limit,
        skip,
      }),
      prisma.publicacion.count({ where }),
    ]);

    // Format for frontend
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.titulo,
      slug: post.slug,
      excerpt: post.extracto,
      thumbUrl: post.imagenPortada,
      date: post.fechaPublicacion,
      author: post.autor ? `${post.autor.nombre} ${post.autor.apellido}` : 'ClinicaMia',
      category: post.categoria?.nombre,
      categorySlug: post.categoria?.slug,
      href: `/blog/${post.slug}`,
    }));

    return c.json({
      success: true,
      data: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /api/v1/blog/posts/:slug
 * Get a single blog post by slug (public)
 */
apiV1.get('/blog/posts/:slug', async c => {
  try {
    const slug = c.req.param('slug');

    const post = await prisma.publicacion.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        estado: 'Publicado',
      },
      include: {
        autor: {
          select: { id: true, nombre: true, apellido: true },
        },
        categoria: {
          select: { id: true, nombre: true, slug: true },
        },
      },
    });

    if (!post) {
      return c.json(error('Artículo no encontrado'), 404);
    }

    // Format for frontend
    const formatted = {
      id: post.id,
      title: post.titulo,
      slug: post.slug,
      content: post.contenido,
      excerpt: post.extracto,
      thumbUrl: post.imagenPortada,
      date: post.fechaPublicacion,
      author: {
        name: post.autor ? `${post.autor.nombre} ${post.autor.apellido}` : 'ClinicaMia',
        id: post.autor?.id,
      },
      category: post.categoria?.nombre,
      categorySlug: post.categoria?.slug,
    };

    return c.json(success(formatted));
  } catch (err) {
    console.error('Error fetching blog post:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /api/v1/blog/categories
 * List all active blog categories (public)
 */
apiV1.get('/blog/categories', async c => {
  try {
    const categories = await prisma.categoriaPublicacion.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        slug: true,
        descripcion: true,
        _count: {
          select: {
            publicaciones: {
              where: { estado: 'Publicado' },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const formatted = categories.map(cat => ({
      id: cat.id,
      name: cat.nombre,
      slug: cat.slug,
      description: cat.descripcion,
      postCount: cat._count.publicaciones,
    }));

    return c.json(success(formatted));
  } catch (err) {
    console.error('Error fetching blog categories:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /api/v1/blog/recent
 * Get recent blog posts (for sidebar, etc.)
 */
apiV1.get('/blog/recent', async c => {
  try {
    const limit = parseInt(c.req.query('limit') || '5');

    const posts = await prisma.publicacion.findMany({
      where: { estado: 'Publicado' },
      select: {
        id: true,
        titulo: true,
        slug: true,
        imagenPortada: true,
        fechaPublicacion: true,
      },
      orderBy: { fechaPublicacion: 'desc' },
      take: limit,
    });

    const formatted = posts.map(post => ({
      id: post.id,
      title: post.titulo,
      slug: post.slug,
      thumbUrl: post.imagenPortada,
      date: post.fechaPublicacion,
      href: `/blog/${post.slug}`,
    }));

    return c.json(success(formatted));
  } catch (err) {
    console.error('Error fetching recent posts:', err);
    return c.json(error(err.message), 500);
  }
});

// ============================================
// PUBLIC SHOP / E-COMMERCE ROUTES
// ============================================

/**
 * GET /api/v1/shop/categories
 * List product categories for the public store
 */
apiV1.get('/shop/categories', async c => {
  try {
    const categories = await prisma.categoriaProducto.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        _count: { select: { productos: { where: { activo: true } } } },
      },
      orderBy: { nombre: 'asc' },
    });

    const formatted = categories.map(cat => ({
      id: cat.id,
      name: cat.nombre,
      description: cat.descripcion,
      color: cat.color,
      productCount: cat._count.productos,
    }));

    return c.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error fetching shop categories:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

/**
 * GET /api/v1/shop/products
 * List products for the public store
 *
 * Query params:
 * - categoryId: Filter by category
 * - search: Search in name/description
 * - limit: Max results (default 50)
 * - page: Page number (default 1)
 * - sort: price_asc, price_desc, name_asc, newest
 */
apiV1.get('/shop/products', async c => {
  try {
    const categoryId = c.req.query('categoryId');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '50');
    const page = parseInt(c.req.query('page') || '1');
    const sort = c.req.query('sort') || 'name_asc';

    const where = {
      activo: true,
      requiereReceta: false, // Solo productos sin receta para tienda pública
      ...(categoryId && { categoriaId: categoryId }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
          { principioActivo: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Ordenamiento
    let orderBy = { nombre: 'asc' };
    switch (sort) {
      case 'price_asc': orderBy = { precioVenta: 'asc' }; break;
      case 'price_desc': orderBy = { precioVenta: 'desc' }; break;
      case 'newest': orderBy = { createdAt: 'desc' }; break;
      default: orderBy = { nombre: 'asc' };
    }

    const [products, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          sku: true,
          descripcion: true,
          presentacion: true,
          laboratorio: true,
          precioVenta: true,
          cantidadTotal: true,
          cantidadConsumida: true,
          imagenUrl: true,
          categoria: {
            select: { id: true, nombre: true, color: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.producto.count({ where }),
    ]);

    const formatted = products.map(p => ({
      id: p.id,
      name: p.nombre,
      sku: p.sku,
      description: p.descripcion,
      presentation: p.presentacion,
      laboratory: p.laboratorio,
      price: p.precioVenta,
      stock: p.cantidadTotal - p.cantidadConsumida,
      image: p.imagenUrl,
      category: p.categoria ? {
        id: p.categoria.id,
        name: p.categoria.nombre,
        color: p.categoria.color,
      } : null,
    }));

    return c.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching shop products:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

/**
 * GET /api/v1/shop/products/:id
 * Get single product details
 */
apiV1.get('/shop/products/:id', async c => {
  try {
    const { id } = c.req.param();

    const product = await prisma.producto.findFirst({
      where: {
        id,
        activo: true,
        requiereReceta: false,
      },
      select: {
        id: true,
        nombre: true,
        sku: true,
        descripcion: true,
        presentacion: true,
        laboratorio: true,
        principioActivo: true,
        concentracion: true,
        viaAdministracion: true,
        precioVenta: true,
        cantidadTotal: true,
        cantidadConsumida: true,
        imagenUrl: true,
        categoria: {
          select: { id: true, nombre: true, color: true },
        },
      },
    });

    if (!product) {
      return c.json({ success: false, message: 'Producto no encontrado' }, 404);
    }

    const formatted = {
      id: product.id,
      name: product.nombre,
      sku: product.sku,
      description: product.descripcion,
      presentation: product.presentacion,
      laboratory: product.laboratorio,
      activeIngredient: product.principioActivo,
      concentration: product.concentracion,
      administrationRoute: product.viaAdministracion,
      price: product.precioVenta,
      stock: product.cantidadTotal - product.cantidadConsumida,
      image: product.imagenUrl,
      category: product.categoria ? {
        id: product.categoria.id,
        name: product.categoria.nombre,
        color: product.categoria.color,
      } : null,
    };

    return c.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error fetching product:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

/**
 * POST /api/v1/shop/orders
 * Create a new shop order
 */
apiV1.post('/shop/orders', async c => {
  try {
    const body = await c.req.json();
    const {
      // Cliente
      nombreCliente,
      apellidoCliente,
      emailCliente,
      telefonoCliente,
      tipoDocumento,
      documento,
      // Envío
      direccionEnvio,
      ciudadEnvio,
      departamentoEnvio,
      codigoPostal,
      notasEnvio,
      // Items
      items,
      notas,
    } = body;

    // Validaciones básicas
    if (!nombreCliente || !apellidoCliente || !emailCliente || !telefonoCliente) {
      return c.json({ success: false, message: 'Datos del cliente incompletos' }, 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ success: false, message: 'La orden debe tener al menos un producto' }, 400);
    }

    // Validar productos y calcular totales
    const productIds = items.map(i => i.productoId);
    const productos = await prisma.producto.findMany({
      where: {
        id: { in: productIds },
        activo: true,
        requiereReceta: false,
      },
    });

    if (productos.length !== productIds.length) {
      return c.json({ success: false, message: 'Uno o más productos no están disponibles' }, 400);
    }

    // Verificar stock y calcular subtotales
    let subtotal = 0;
    const itemsData = [];
    for (const item of items) {
      const producto = productos.find(p => p.id === item.productoId);
      if (!producto) {
        return c.json({ success: false, message: `Producto ${item.productoId} no encontrado` }, 400);
      }

      const stockDisponible = producto.cantidadTotal - producto.cantidadConsumida;
      if (item.cantidad > stockDisponible) {
        return c.json({
          success: false,
          message: `Stock insuficiente para ${producto.nombre}. Disponible: ${stockDisponible}`,
        }, 400);
      }

      const itemSubtotal = producto.precioVenta * item.cantidad;
      subtotal += itemSubtotal;

      itemsData.push({
        productoId: producto.id,
        nombreProducto: producto.nombre,
        skuProducto: producto.sku,
        imagenProducto: producto.imagenUrl,
        cantidad: item.cantidad,
        precioUnitario: producto.precioVenta,
        descuento: 0,
        subtotal: itemSubtotal,
      });
    }

    // Generar número de orden
    const lastOrder = await prisma.ordenTienda.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { numero: true },
    });
    const nextNumber = lastOrder
      ? parseInt(lastOrder.numero.replace('OT-', '')) + 1
      : 1;
    const numeroOrden = `OT-${nextNumber.toString().padStart(6, '0')}`;

    // Buscar si existe paciente con ese documento
    let pacienteId = null;
    if (documento) {
      const paciente = await prisma.paciente.findUnique({
        where: { cedula: documento },
        select: { id: true },
      });
      if (paciente) pacienteId = paciente.id;
    }

    // Crear orden con items
    const orden = await prisma.ordenTienda.create({
      data: {
        numero: numeroOrden,
        pacienteId,
        nombreCliente,
        apellidoCliente,
        emailCliente,
        telefonoCliente,
        tipoDocumento,
        documento,
        direccionEnvio,
        ciudadEnvio,
        departamentoEnvio,
        codigoPostal,
        notasEnvio,
        subtotal,
        descuento: 0,
        costoEnvio: 0,
        impuestos: 0,
        total: subtotal,
        estado: 'PendientePago',
        notas,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return c.json({
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        id: orden.id,
        numero: orden.numero,
        total: parseFloat(orden.total),
        estado: orden.estado,
        items: orden.items.length,
      },
    }, 201);
  } catch (err) {
    console.error('Error creating shop order:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

/**
 * GET /api/v1/shop/orders/:id
 * Get order details by ID or order number
 */
apiV1.get('/shop/orders/:id', async c => {
  try {
    const { id } = c.req.param();

    const orden = await prisma.ordenTienda.findFirst({
      where: {
        OR: [
          { id },
          { numero: id },
        ],
      },
      include: {
        items: true,
        paymentSession: true,
      },
    });

    if (!orden) {
      return c.json({ success: false, message: 'Orden no encontrada' }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: orden.id,
        numero: orden.numero,
        estado: orden.estado,
        cliente: {
          nombre: orden.nombreCliente,
          apellido: orden.apellidoCliente,
          email: orden.emailCliente,
          telefono: orden.telefonoCliente,
          documento: orden.documento,
        },
        envio: {
          direccion: orden.direccionEnvio,
          ciudad: orden.ciudadEnvio,
          departamento: orden.departamentoEnvio,
          codigoPostal: orden.codigoPostal,
          notas: orden.notasEnvio,
          numeroGuia: orden.numeroGuia,
          transportadora: orden.transportadora,
        },
        totales: {
          subtotal: parseFloat(orden.subtotal),
          descuento: parseFloat(orden.descuento),
          costoEnvio: parseFloat(orden.costoEnvio),
          impuestos: parseFloat(orden.impuestos),
          total: parseFloat(orden.total),
        },
        items: orden.items.map(i => ({
          id: i.id,
          productoId: i.productoId,
          nombre: i.nombreProducto,
          sku: i.skuProducto,
          imagen: i.imagenProducto,
          cantidad: i.cantidad,
          precioUnitario: parseFloat(i.precioUnitario),
          subtotal: parseFloat(i.subtotal),
        })),
        pago: orden.paymentSession ? {
          status: orden.paymentSession.status,
          epaycoRef: orden.paymentSession.epaycoRef,
        } : null,
        fechas: {
          creada: orden.createdAt,
          pago: orden.fechaPago,
          envio: orden.fechaEnvio,
          entrega: orden.fechaEntrega,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

/**
 * POST /api/v1/shop/orders/:id/payment
 * Create ePayco payment session for an order
 */
apiV1.post('/shop/orders/:id/payment', async c => {
  try {
    const { id } = c.req.param();

    const orden = await prisma.ordenTienda.findFirst({
      where: {
        OR: [{ id }, { numero: id }],
        estado: 'PendientePago',
      },
      include: { items: true },
    });

    if (!orden) {
      return c.json({ success: false, message: 'Orden no encontrada o ya pagada' }, 404);
    }

    // Obtener token de ePayco
    const token = await epaycoService.getAuthToken();
    if (!token) {
      return c.json({ success: false, message: 'Error al conectar con pasarela de pago' }, 500);
    }

    // Configuración de ePayco
    const epaycoConfig = require('../config/epayco');

    // Mapear tipo de documento
    const docTypeMap = {
      'CC': 'CC',
      'CE': 'CE',
      'NIT': 'NIT',
      'PP': 'PP',
      'TI': 'TI',
    };
    const docType = docTypeMap[orden.tipoDocumento] || 'CC';

    // Crear sesión en ePayco
    const sessionPayload = {
      checkout_version: '2',
      name: `Orden ${orden.numero} - ClinicaMia`,
      description: `Compra de ${orden.items.length} producto(s)`,
      currency: 'COP',
      amount: parseFloat(orden.total).toString(),
      country: 'CO',
      lang: 'es',
      external: 'false',
      response: `${epaycoConfig.urls.frontendUrl}/tienda/resultado?ordenId=${orden.id}`,
      confirmation: `${epaycoConfig.urls.backendUrl}/api/v1/shop/webhook`,
      extra1: orden.id,
      extra2: orden.numero,
      extra3: 'tienda',
      test: epaycoConfig.testMode ? 'true' : 'false',
      name_billing: `${orden.nombreCliente} ${orden.apellidoCliente}`,
      email_billing: orden.emailCliente,
      type_doc_billing: docType,
      number_doc_billing: orden.documento || '0000000000',
      mobilephone_billing: orden.telefonoCliente,
    };

    const sessionResponse = await fetch(epaycoConfig.endpoints.session, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(sessionPayload),
    });

    const sessionData = await sessionResponse.json();

    if (!sessionData.success || !sessionData.data?.sessionId) {
      console.error('ePayco session error:', sessionData);
      return c.json({ success: false, message: 'Error al crear sesión de pago' }, 500);
    }

    // Guardar sesión de pago
    await prisma.paymentSessionTienda.upsert({
      where: { ordenId: orden.id },
      create: {
        ordenId: orden.id,
        sessionId: sessionData.data.sessionId,
        amount: orden.total,
        currency: 'COP',
        status: 'pending',
      },
      update: {
        sessionId: sessionData.data.sessionId,
        status: 'pending',
      },
    });

    return c.json({
      success: true,
      data: {
        sessionId: sessionData.data.sessionId,
        publicKey: epaycoConfig.publicKey,
      },
    });
  } catch (err) {
    console.error('Error creating payment session:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

/**
 * POST /api/v1/shop/webhook
 * ePayco confirmation webhook for shop orders
 */
apiV1.post('/shop/webhook', async c => {
  try {
    const body = await c.req.json();
    console.log('Shop webhook received:', JSON.stringify(body));

    const {
      x_ref_payco,
      x_transaction_id,
      x_amount,
      x_currency_code,
      x_signature,
      x_response,
      x_response_reason_text,
      x_extra1, // ordenId
      x_extra3, // 'tienda'
    } = body;

    // Verificar que es una orden de tienda
    if (x_extra3 !== 'tienda') {
      return c.json({ success: true, message: 'Not a shop order' });
    }

    // Validar firma
    const epaycoConfig = require('../config/epayco');
    const crypto = require('crypto');
    const signatureString = `${epaycoConfig.customerId}^${epaycoConfig.pKey}^${x_ref_payco}^${x_transaction_id}^${x_amount}^${x_currency_code}`;
    const expectedSignature = crypto.createHash('sha256').update(signatureString).digest('hex');

    if (x_signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return c.json({ success: false, message: 'Invalid signature' }, 400);
    }

    const ordenId = x_extra1;
    if (!ordenId) {
      return c.json({ success: false, message: 'Missing order ID' }, 400);
    }

    // Mapear respuesta de ePayco
    let status = 'pending';
    let estadoOrden = 'PendientePago';
    switch (x_response) {
      case '1': // Aprobada
        status = 'approved';
        estadoOrden = 'Pagada';
        break;
      case '2': // Rechazada
        status = 'rejected';
        estadoOrden = 'Cancelada';
        break;
      case '3': // Pendiente
        status = 'pending';
        estadoOrden = 'PendientePago';
        break;
      case '4': // Fallida
        status = 'failed';
        estadoOrden = 'Cancelada';
        break;
    }

    // Actualizar en transacción
    await prisma.$transaction(async (tx) => {
      // Actualizar sesión de pago
      await tx.paymentSessionTienda.update({
        where: { ordenId },
        data: {
          status,
          epaycoRef: x_ref_payco,
          epaycoTxId: x_transaction_id,
          responseCode: x_response,
          responseMessage: x_response_reason_text,
        },
      });

      // Actualizar orden
      const updateData = {
        estado: estadoOrden,
        ...(status === 'approved' && {
          metodoPago: 'ePayco',
          fechaPago: new Date(),
        }),
      };

      const orden = await tx.ordenTienda.update({
        where: { id: ordenId },
        data: updateData,
        include: { items: true },
      });

      // Si fue aprobado, actualizar inventario
      if (status === 'approved') {
        for (const item of orden.items) {
          await tx.producto.update({
            where: { id: item.productoId },
            data: {
              cantidadConsumida: { increment: item.cantidad },
            },
          });
        }
      }
    });

    return c.json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    console.error('Shop webhook error:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

/**
 * GET /api/v1/shop/webhook
 * ePayco also sends GET requests sometimes
 */
apiV1.get('/shop/webhook', async c => {
  const params = c.req.query();
  console.log('Shop webhook GET received:', params);

  // Redirigir a POST handler si tiene datos
  if (params.x_ref_payco) {
    // Simular como si fuera POST
    const body = params;
    // Process same as POST...
    return c.json({ success: true, message: 'Webhook received via GET' });
  }

  return c.json({ success: true, message: 'Webhook endpoint active' });
});

// ============================================
// PUBLIC CAREERS / VACANTES ROUTES
// ============================================

/**
 * GET /api/v1/careers/vacantes
 * List open job vacancies for public careers page
 *
 * Query params:
 * - departamento: Filter by department ID (via cargo.departamentoId)
 * - tipoContrato: Filter by contract type
 * - search: Search in title/description
 * - page: Page number (default 1)
 * - limit: Results per page (default 20)
 */
apiV1.get('/careers/vacantes', async c => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where = {
      estado: 'ABIERTA',
      publicarExterno: true,
    };

    // Filter by department through cargo relation
    if (query.departamento) {
      where.cargo = {
        departamentoId: query.departamento,
      };
    }

    if (query.tipoContrato) {
      where.tipoContrato = query.tipoContrato;
    }

    if (query.search) {
      where.OR = [
        { titulo: { contains: query.search, mode: 'insensitive' } },
        { descripcion: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [vacantes, total] = await Promise.all([
      prisma.tHVacante.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          tipoContrato: true,
          jornada: true,
          salarioMin: true,
          salarioMax: true,
          ubicacion: true,
          fechaApertura: true,
          fechaCierre: true,
          cantidadPuestos: true,
          cargo: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: { fechaApertura: 'desc' },
      }),
      prisma.tHVacante.count({ where }),
    ]);

    // Format for frontend
    const formatted = vacantes.map(v => ({
      id: v.id,
      titulo: v.titulo,
      descripcion: v.descripcion,
      tipoContrato: v.tipoContrato,
      jornada: v.jornada,
      salarioMin: v.salarioMin ? parseFloat(v.salarioMin) : null,
      salarioMax: v.salarioMax ? parseFloat(v.salarioMax) : null,
      ubicacion: v.ubicacion,
      fechaApertura: v.fechaApertura,
      fechaCierre: v.fechaCierre,
      cantidadPuestos: v.cantidadPuestos,
      cargo: v.cargo?.nombre,
    }));

    return c.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching vacantes:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /api/v1/careers/vacantes/:id
 * Get detailed information about a specific vacancy
 */
apiV1.get('/careers/vacantes/:id', async c => {
  try {
    const { id } = c.req.param();

    const vacante = await prisma.tHVacante.findFirst({
      where: {
        id,
        estado: 'ABIERTA',
        publicarExterno: true,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        tipoContrato: true,
        jornada: true,
        salarioMin: true,
        salarioMax: true,
        ubicacion: true,
        fechaApertura: true,
        fechaCierre: true,
        cantidadPuestos: true,
        requisitos: true,
        cargo: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            funciones: true,
            requisitos: true,
          },
        },
      },
    });

    if (!vacante) {
      return c.json(error('Vacante no encontrada o no disponible'), 404);
    }

    // Parse requisitos if it's JSON (can contain beneficios as well)
    let requisitosTexto = null;
    let beneficios = null;
    if (vacante.requisitos) {
      if (typeof vacante.requisitos === 'object') {
        requisitosTexto = vacante.requisitos.descripcion || JSON.stringify(vacante.requisitos);
        beneficios = vacante.requisitos.beneficios || null;
      } else {
        requisitosTexto = vacante.requisitos;
      }
    }

    // Format for frontend
    const formatted = {
      id: vacante.id,
      titulo: vacante.titulo,
      descripcion: vacante.descripcion,
      tipoContrato: vacante.tipoContrato,
      jornada: vacante.jornada,
      salarioMin: vacante.salarioMin ? parseFloat(vacante.salarioMin) : null,
      salarioMax: vacante.salarioMax ? parseFloat(vacante.salarioMax) : null,
      ubicacion: vacante.ubicacion,
      fechaApertura: vacante.fechaApertura,
      fechaCierre: vacante.fechaCierre,
      cantidadPuestos: vacante.cantidadPuestos,
      requisitos: requisitosTexto,
      beneficios: beneficios,
      cargo: vacante.cargo ? {
        nombre: vacante.cargo.nombre,
        descripcion: vacante.cargo.descripcion,
        funciones: vacante.cargo.funciones,
        requisitosBasicos: typeof vacante.cargo.requisitos === 'object'
          ? JSON.stringify(vacante.cargo.requisitos)
          : vacante.cargo.requisitos,
      } : null,
    };

    return c.json(success(formatted));
  } catch (err) {
    console.error('Error fetching vacante:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /api/v1/careers/departamentos
 * Get departments that have open vacancies (through cargo relation)
 */
apiV1.get('/careers/departamentos', async c => {
  try {
    // Get unique departamentoIds from open vacancies via cargo
    const vacantesWithDept = await prisma.tHVacante.findMany({
      where: {
        estado: 'ABIERTA',
        publicarExterno: true,
        cargo: {
          departamentoId: { not: null },
        },
      },
      select: {
        cargo: {
          select: {
            departamentoId: true,
          },
        },
      },
    });

    // Get unique department IDs
    const deptIds = [...new Set(
      vacantesWithDept
        .map(v => v.cargo?.departamentoId)
        .filter(Boolean)
    )];

    if (deptIds.length === 0) {
      return c.json(success([]));
    }

    // Get departments with counts
    const departamentos = await prisma.departamento.findMany({
      where: {
        id: { in: deptIds },
        estado: 'Activo',
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    });

    // Count vacancies per department
    const formatted = await Promise.all(departamentos.map(async (d) => {
      const count = await prisma.tHVacante.count({
        where: {
          estado: 'ABIERTA',
          publicarExterno: true,
          cargo: {
            departamentoId: d.id,
          },
        },
      });
      return {
        id: d.id,
        nombre: d.nombre,
        vacantesCount: count,
      };
    }));

    return c.json(success(formatted));
  } catch (err) {
    console.error('Error fetching departamentos:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /api/v1/careers/vacantes/:id/aplicar
 * Apply to a specific job vacancy
 */
apiV1.post('/careers/vacantes/:id/aplicar', async c => {
  try {
    const { id: vacanteId } = c.req.param();
    const body = await c.req.json();

    // Verify vacancy exists and is open
    const vacante = await prisma.tHVacante.findFirst({
      where: {
        id: vacanteId,
        estado: 'ABIERTA',
        publicarExterno: true,
      },
    });

    if (!vacante) {
      return c.json(error('La vacante no existe o no está disponible'), 404);
    }

    // Create candidate in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create CandidatoTalento record (full application data)
      const candidatoTalento = await tx.candidatoTalento.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          documentType: body.documentType || 'CC',
          documentNumber: body.documentNumber,
          birthDate: body.birthDate ? new Date(body.birthDate) : null,
          gender: body.gender,
          maritalStatus: body.maritalStatus,
          nationality: body.nationality,
          mobilePhone: body.mobilePhone,
          landlinePhone: body.landlinePhone,
          email: body.email,
          alternativeEmail: body.alternativeEmail,
          residenceAddress: body.residenceAddress,
          city: body.city,
          department: body.department,
          country: body.country || 'Colombia',
          profession: body.profession,
          specialty: body.specialty,
          subspecialty: body.subspecialty,
          professionalLicenseNumber: body.professionalLicenseNumber,
          medicalRegistryNumber: body.medicalRegistryNumber,
          educationInstitution: body.educationInstitution,
          educationCountry: body.educationCountry,
          graduationYear: body.graduationYear,
          yearsOfExperience: body.yearsOfExperience,
          previousExperience: body.previousExperience,
          previousInstitutions: body.previousInstitutions || [],
          currentPosition: body.currentPosition,
          currentInstitution: body.currentInstitution,
          currentlyEmployed: body.currentlyEmployed || false,
          immediateAvailability: body.immediateAvailability || false,
          areasOfInterest: body.areasOfInterest || [],
          preferredModality: body.preferredModality,
          preferredContractType: body.preferredContractType,
          salaryExpectation: body.salaryExpectation,
          scheduleAvailability: body.scheduleAvailability,
          availableShifts: body.availableShifts || [],
          languages: body.languages || [],
          references: body.references || [],
          howDidYouHear: body.howDidYouHear,
          motivation: body.motivation,
          professionalExpectations: body.professionalExpectations,
          willingToTravel: body.willingToTravel || false,
          willingToRelocate: body.willingToRelocate || false,
          hasOwnVehicle: body.hasOwnVehicle || false,
          driverLicense: body.driverLicense,
          documentIds: body.documentIds || [],
        },
      });

      // 2. Create or find THCandidato (simplified HR record)
      let thCandidato = await tx.tHCandidato.findFirst({
        where: {
          OR: [
            { email: body.email },
            { tipoDocumento: body.documentType || 'CC', documento: body.documentNumber },
          ],
        },
      });

      if (!thCandidato) {
        thCandidato = await tx.tHCandidato.create({
          data: {
            nombre: body.firstName,
            apellido: body.lastName,
            email: body.email,
            telefono: body.mobilePhone,
            documento: body.documentNumber,
            tipoDocumento: body.documentType || 'CC',
            direccion: body.residenceAddress,
            ciudad: body.city,
            profesion: body.profession,
            experienciaAnios: body.yearsOfExperience,
            expectativaSalarial: body.salaryExpectation,
            fuenteAplicacion: 'Portal Web',
            notas: body.motivation,
          },
        });
      }

      // 3. Check if already applied to this vacancy
      const existingApplication = await tx.tHCandidatoVacante.findFirst({
        where: {
          candidatoId: thCandidato.id,
          vacanteId: vacanteId,
        },
      });

      if (existingApplication) {
        throw new Error('Ya has aplicado a esta vacante anteriormente');
      }

      // 4. Create application to vacancy
      const aplicacion = await tx.tHCandidatoVacante.create({
        data: {
          candidatoId: thCandidato.id,
          vacanteId: vacanteId,
          estado: 'APLICADO',
          notas: body.motivation,
        },
      });

      return {
        candidatoId: thCandidato.id,
        candidatoTalentoId: candidatoTalento.id,
        aplicacionId: aplicacion.id,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        vacanteTitulo: vacante.titulo,
      };
    });

    // Enviar email de agradecimiento (no bloquea la respuesta)
    try {
      const emailService = require('../services/email.service');
      emailService.sendApplicationThankYou({
        to: result.email,
        nombre: result.firstName,
        apellido: result.lastName,
        vacanteTitulo: result.vacanteTitulo,
      }).then(emailResult => {
        if (emailResult.success) {
          console.log('[Careers] Email de agradecimiento enviado a:', result.email);
        } else {
          console.warn('[Careers] No se pudo enviar email de agradecimiento:', emailResult.error);
        }
      }).catch(err => {
        console.error('[Careers] Error enviando email de agradecimiento:', err.message);
      });
    } catch (emailErr) {
      console.warn('[Careers] Error al importar email service:', emailErr.message);
    }

    return c.json(success(result, 'Aplicación enviada exitosamente'), 201);
  } catch (err) {
    console.error('Error applying to vacante:', err);

    if (err.code === 'P2002') {
      return c.json(error('Ya existe una aplicación con este correo o documento'), 409);
    }

    if (err.message && err.message.includes('Ya has aplicado')) {
      return c.json(error(err.message), 409);
    }

    return c.json(error(err.message), 500);
  }
});

// ==========================================
// SEGUIMIENTO DE POSTULACIÓN
// ==========================================

/**
 * Consultar estado de postulaciones por email y documento
 * GET /api/v1/careers/seguimiento
 * Query params: email, documento
 */
apiV1.get('/careers/seguimiento', async (c) => {
  try {
    const { email, documento } = c.req.query();

    if (!email || !documento) {
      return c.json(error('Email y documento son requeridos'), 400);
    }

    // Buscar candidato por email y documento
    const candidato = await prisma.tHCandidato.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        documento: documento.trim(),
      },
      include: {
        vacantes: {
          include: {
            vacante: {
              select: {
                id: true,
                titulo: true,
                tipoContrato: true,
                jornada: true,
                estado: true,
                cargo: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!candidato) {
      return c.json(error('No se encontraron postulaciones con los datos proporcionados'), 404);
    }

    // Mapear estados a descripciones amigables
    const estadosDescripcion = {
      APLICADO: { label: 'Aplicación Recibida', color: 'blue', step: 1 },
      PRESELECCIONADO: { label: 'Preseleccionado', color: 'cyan', step: 2 },
      EN_EVALUACION: { label: 'En Evaluación', color: 'purple', step: 2 },
      ENTREVISTA_PROGRAMADA: { label: 'Entrevista Programada', color: 'orange', step: 3 },
      ENTREVISTA_REALIZADA: { label: 'Entrevista Realizada', color: 'yellow', step: 3 },
      SELECCIONADO: { label: 'Seleccionado', color: 'green', step: 4 },
      CONTRATADO: { label: 'Contratado', color: 'green', step: 5 },
      RECHAZADO: { label: 'No seleccionado', color: 'red', step: 0 },
      DESISTIDO: { label: 'Proceso cancelado', color: 'gray', step: 0 },
    };

    const postulaciones = candidato.vacantes.map((cv) => ({
      id: cv.id,
      fechaAplicacion: cv.createdAt,
      estado: cv.estado,
      estadoInfo: estadosDescripcion[cv.estado] || { label: cv.estado, color: 'gray', step: 0 },
      etapaActual: cv.etapaActual,
      vacante: {
        id: cv.vacante.id,
        titulo: cv.vacante.titulo,
        cargo: cv.vacante.cargo?.nombre,
        tipoContrato: cv.vacante.tipoContrato,
        jornada: cv.vacante.jornada,
        vacanteAbierta: cv.vacante.estado === 'ABIERTA',
      },
    }));

    return c.json(
      success({
        candidato: {
          nombre: `${candidato.nombre} ${candidato.apellido}`,
          email: candidato.email,
        },
        postulaciones,
        totalPostulaciones: postulaciones.length,
      }, 'Postulaciones encontradas')
    );
  } catch (err) {
    console.error('Error al consultar seguimiento:', err);
    return c.json(error('Error al consultar estado de postulaciones'), 500);
  }
});

// ==========================================
// CANDIDATES PUBLIC - POSTULACIÓN ESPONTÁNEA
// ==========================================

const candidatoService = require('../services/candidato.service');
const { createCandidatoSchema } = require('../validators/candidato.schema');

/**
 * POST /api/v1/candidates/public
 * Submit a spontaneous job application (no specific vacancy)
 */
apiV1.post('/candidates/public', validate(createCandidatoSchema), async (c) => {
  try {
    const data = c.req.validData;
    const candidato = await candidatoService.create(data);
    return c.json(success({ id: candidato.id }, 'Solicitud enviada exitosamente'), 201);
  } catch (err) {
    console.error('Error creating candidate:', err);

    if (err.code === 'P2002') {
      return c.json(error('Ya existe una solicitud con este número de documento o correo'), 409);
    }

    if (err.message && err.message.includes('Ya existe')) {
      return c.json(error(err.message), 409);
    }

    return c.json(error(err.message || 'Error al procesar la solicitud'), err.statusCode || 500);
  }
});

module.exports = apiV1;
