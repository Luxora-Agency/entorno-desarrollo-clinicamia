/**
 * MCP Tools - Doctor Information
 *
 * Tools for searching doctors and their availability.
 */

const prisma = require('../../db/prisma');

// UUID validation helper
const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Tool definitions
const definitions = [
  {
    name: 'buscar_doctores',
    description: 'Busca doctores disponibles. Puede filtrar por especialidad o buscar por nombre.',
    inputSchema: {
      type: 'object',
      properties: {
        especialidad: {
          type: 'string',
          description: 'Nombre de la especialidad para filtrar (ej: "Cardiología", "Medicina General"). Puede ser parcial.',
        },
        nombre: {
          type: 'string',
          description: 'Nombre o apellido del doctor para buscar (opcional)',
        },
        limite: {
          type: 'number',
          description: 'Número máximo de resultados (default: 10)',
        },
      },
    },
  },
  {
    name: 'informacion_doctor',
    description: 'Obtiene información detallada de un doctor específico, incluyendo su biografía, experiencia y especialidades.',
    inputSchema: {
      type: 'object',
      properties: {
        doctor_id: {
          type: 'string',
          description: 'ID del doctor (UUID)',
        },
      },
      required: ['doctor_id'],
    },
  },
  {
    name: 'horarios_doctor',
    description: 'Obtiene los horarios de atención configurados de un doctor para los próximos días.',
    inputSchema: {
      type: 'object',
      properties: {
        doctor_id: {
          type: 'string',
          description: 'ID del doctor (UUID)',
        },
        dias: {
          type: 'number',
          description: 'Número de días a consultar (default: 7)',
        },
      },
      required: ['doctor_id'],
    },
  },
];

// Tool handlers
const handlers = {
  /**
   * Buscar doctores
   */
  buscar_doctores: async ({ especialidad, nombre, limite = 10 }) => {
    const where = {
      usuario: { activo: true },
    };

    // Filter by specialty
    if (especialidad) {
      where.especialidades = {
        some: {
          especialidad: {
            titulo: { contains: especialidad, mode: 'insensitive' },
          },
        },
      };
    }

    // Filter by name
    if (nombre) {
      where.usuario = {
        ...where.usuario,
        OR: [
          { nombre: { contains: nombre, mode: 'insensitive' } },
          { apellido: { contains: nombre, mode: 'insensitive' } },
        ],
      };
    }

    const doctores = await prisma.doctor.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true } },
        especialidades: {
          include: {
            especialidad: { select: { id: true, titulo: true, costoCOP: true } },
          },
        },
      },
      take: limite,
    });

    if (doctores.length === 0) {
      return {
        encontrados: 0,
        mensaje: especialidad
          ? `No se encontraron doctores de ${especialidad}`
          : 'No se encontraron doctores con los criterios especificados',
        sugerencia: 'Intente con otra especialidad o use listar_especialidades para ver las disponibles',
      };
    }

    return {
      encontrados: doctores.length,
      doctores: doctores.map((d) => ({
        id: d.id,
        nombre: `Dr. ${d.usuario.nombre} ${d.usuario.apellido}`,
        especialidades: d.especialidades.map((e) => ({
          id: e.especialidad.id,
          nombre: e.especialidad.titulo,
          costo: `$${parseFloat(e.especialidad.costoCOP).toLocaleString('es-CO')} COP`,
        })),
        experiencia: d.aniosExperiencia ? `${d.aniosExperiencia} años` : 'No especificada',
      })),
      nota: 'Use buscar_disponibilidad con el ID del doctor para ver horarios disponibles',
    };
  },

  /**
   * Información detallada de un doctor
   */
  informacion_doctor: async ({ doctor_id }) => {
    // Validate UUID format
    if (!isValidUUID(doctor_id)) {
      throw new Error('ID de doctor inválido. Debe ser un UUID válido. Use buscar_doctores para obtener el ID.');
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctor_id },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },
        especialidades: {
          include: {
            especialidad: {
              select: {
                titulo: true,
                descripcion: true,
                costoCOP: true,
                duracionMinutos: true,
              },
            },
          },
        },
      },
    });

    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    return {
      id: doctor.id,
      nombre: `Dr. ${doctor.usuario.nombre} ${doctor.usuario.apellido}`,
      contacto: {
        email: doctor.usuario.email,
        telefono: doctor.usuario.telefono,
      },
      informacion_profesional: {
        licencia_medica: doctor.licenciaMedica || 'No registrada',
        universidad: doctor.universidad || 'No registrada',
        experiencia: doctor.aniosExperiencia ? `${doctor.aniosExperiencia} años` : 'No especificada',
        biografia: doctor.biografia || 'Sin biografía disponible',
      },
      especialidades: doctor.especialidades.map((e) => ({
        nombre: e.especialidad.titulo,
        descripcion: e.especialidad.descripcion,
        costo: `$${parseFloat(e.especialidad.costoCOP).toLocaleString('es-CO')} COP`,
        duracion: `${e.especialidad.duracionMinutos} minutos`,
      })),
    };
  },

  /**
   * Horarios de un doctor
   */
  horarios_doctor: async ({ doctor_id, dias = 7 }) => {
    // Validate UUID format
    if (!isValidUUID(doctor_id)) {
      throw new Error('ID de doctor inválido. Debe ser un UUID válido. Use buscar_doctores para obtener el ID.');
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctor_id },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
      },
    });

    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    // Get doctor's schedule configuration
    const horarios = doctor.horarios || {};

    // Map day names
    const diasSemana = {
      0: 'Domingo',
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sábado',
    };

    const diasEnglish = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    // Get next N days
    const proximosDias = [];
    const today = new Date();

    for (let i = 0; i < dias; i++) {
      const fecha = new Date(today);
      fecha.setDate(today.getDate() + i);
      const diaSemana = fecha.getDay();
      const diaKey = diasEnglish[diaSemana];
      const horarioDia = horarios[diaKey];

      proximosDias.push({
        fecha: fecha.toLocaleDateString('es-CO', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }),
        fecha_iso: fecha.toISOString().split('T')[0],
        dia: diasSemana[diaSemana],
        disponible: horarioDia && horarioDia.activo,
        horario: horarioDia && horarioDia.activo
          ? `${horarioDia.inicio} - ${horarioDia.fin}`
          : 'No disponible',
      });
    }

    return {
      doctor: `Dr. ${doctor.usuario.nombre} ${doctor.usuario.apellido}`,
      proximos_dias: proximosDias,
      nota: 'Use buscar_disponibilidad con una fecha específica para ver los slots disponibles',
    };
  },
};

module.exports = { definitions, handlers };
