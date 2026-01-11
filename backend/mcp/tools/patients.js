/**
 * MCP Tools - Patient Management
 *
 * Tools for searching and managing patient information.
 */

const prisma = require('../../db/prisma');

// Tool definitions
const definitions = [
  {
    name: 'buscar_paciente',
    description: 'Busca un paciente por número de documento (cédula). Retorna información básica del paciente si existe.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento de identidad del paciente',
        },
      },
      required: ['documento'],
    },
  },
  {
    name: 'registrar_paciente',
    description: 'Registra un nuevo paciente en el sistema. Todos los campos básicos son requeridos.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento de identidad',
        },
        tipo_documento: {
          type: 'string',
          enum: ['CC', 'CE', 'TI', 'PP', 'NIT'],
          description: 'Tipo de documento',
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
          description: 'Número de teléfono',
        },
        email: {
          type: 'string',
          description: 'Correo electrónico (opcional)',
        },
        fecha_nacimiento: {
          type: 'string',
          description: 'Fecha de nacimiento en formato YYYY-MM-DD (opcional)',
        },
        genero: {
          type: 'string',
          enum: ['Masculino', 'Femenino', 'Otro'],
          description: 'Género del paciente (opcional)',
        },
        direccion: {
          type: 'string',
          description: 'Dirección de residencia (opcional)',
        },
        ciudad: {
          type: 'string',
          description: 'Ciudad de residencia (opcional)',
        },
        eps: {
          type: 'string',
          description: 'Nombre de la EPS (opcional)',
        },
      },
      required: ['documento', 'nombre', 'apellido', 'telefono'],
    },
  },
  {
    name: 'actualizar_contacto_paciente',
    description: 'Actualiza la información de contacto de un paciente existente (teléfono, email, dirección).',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
        telefono: {
          type: 'string',
          description: 'Nuevo número de teléfono (opcional)',
        },
        email: {
          type: 'string',
          description: 'Nuevo correo electrónico (opcional)',
        },
        direccion: {
          type: 'string',
          description: 'Nueva dirección (opcional)',
        },
      },
      required: ['documento'],
    },
  },
  {
    name: 'historial_visitas_paciente',
    description: 'Obtiene un resumen del historial de visitas médicas de un paciente.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
        limite: {
          type: 'number',
          description: 'Número máximo de visitas a retornar (default: 10)',
        },
      },
      required: ['documento'],
    },
  },
];

// Tool handlers
const handlers = {
  /**
   * Buscar paciente por documento
   */
  buscar_paciente: async ({ documento }) => {
    const paciente = await prisma.paciente.findUnique({
      where: { cedula: documento },
      include: {
        _count: {
          select: {
            citas: true,
            admisiones: true,
          },
        },
      },
    });

    if (!paciente) {
      return {
        encontrado: false,
        mensaje: `No se encontró ningún paciente con documento ${documento}`,
        sugerencia: 'Puede registrar al paciente usando la herramienta registrar_paciente',
      };
    }

    return {
      encontrado: true,
      paciente: {
        id: paciente.id,
        nombre: `${paciente.nombre} ${paciente.apellido}`,
        documento: `${paciente.tipoDocumento} ${paciente.cedula}`,
        telefono: paciente.telefono,
        email: paciente.email || 'No registrado',
        fecha_nacimiento: paciente.fechaNacimiento
          ? new Date(paciente.fechaNacimiento).toLocaleDateString('es-CO')
          : 'No registrada',
        genero: paciente.genero || 'No especificado',
        direccion: paciente.direccion || 'No registrada',
        ciudad: paciente.ciudad || 'No registrada',
        eps: paciente.eps || 'No registrada',
        estadisticas: {
          total_citas: paciente._count.citas,
          admisiones: paciente._count.admisiones,
        },
        registrado_desde: new Date(paciente.createdAt).toLocaleDateString('es-CO'),
      },
    };
  },

  /**
   * Registrar nuevo paciente
   */
  registrar_paciente: async ({
    documento,
    tipo_documento = 'CC',
    nombre,
    apellido,
    telefono,
    email,
    fecha_nacimiento,
    genero,
    direccion,
    ciudad,
    eps,
  }) => {
    // Check if patient already exists
    const existente = await prisma.paciente.findUnique({
      where: { cedula: documento },
    });

    if (existente) {
      return {
        registrado: false,
        mensaje: `Ya existe un paciente registrado con documento ${documento}`,
        paciente: {
          nombre: `${existente.nombre} ${existente.apellido}`,
          telefono: existente.telefono,
        },
        sugerencia: 'Use actualizar_contacto_paciente si necesita actualizar sus datos',
      };
    }

    const paciente = await prisma.paciente.create({
      data: {
        cedula: documento,
        tipoDocumento: tipo_documento,
        nombre,
        apellido,
        telefono,
        email: email || null,
        fechaNacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        genero: genero || null,
        direccion: direccion || null,
        ciudad: ciudad || null,
        eps: eps || null,
      },
    });

    return {
      registrado: true,
      mensaje: '¡Paciente registrado exitosamente!',
      paciente: {
        id: paciente.id,
        nombre: `${paciente.nombre} ${paciente.apellido}`,
        documento: `${paciente.tipoDocumento} ${paciente.cedula}`,
        telefono: paciente.telefono,
      },
      siguiente_paso: 'Ahora puede agendar una cita usando la herramienta agendar_cita',
    };
  },

  /**
   * Actualizar contacto de paciente
   */
  actualizar_contacto_paciente: async ({ documento, telefono, email, direccion }) => {
    const paciente = await prisma.paciente.findUnique({
      where: { cedula: documento },
    });

    if (!paciente) {
      throw new Error(`No se encontró paciente con documento ${documento}`);
    }

    const updateData = {};
    const cambios = [];

    if (telefono && telefono !== paciente.telefono) {
      updateData.telefono = telefono;
      cambios.push(`Teléfono: ${paciente.telefono} → ${telefono}`);
    }
    if (email && email !== paciente.email) {
      updateData.email = email;
      cambios.push(`Email: ${paciente.email || 'vacío'} → ${email}`);
    }
    if (direccion && direccion !== paciente.direccion) {
      updateData.direccion = direccion;
      cambios.push(`Dirección: ${paciente.direccion || 'vacía'} → ${direccion}`);
    }

    if (cambios.length === 0) {
      return {
        actualizado: false,
        mensaje: 'No hay cambios para actualizar',
        datos_actuales: {
          telefono: paciente.telefono,
          email: paciente.email || 'No registrado',
          direccion: paciente.direccion || 'No registrada',
        },
      };
    }

    await prisma.paciente.update({
      where: { id: paciente.id },
      data: updateData,
    });

    return {
      actualizado: true,
      mensaje: 'Información de contacto actualizada',
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      cambios_realizados: cambios,
    };
  },

  /**
   * Historial de visitas del paciente
   */
  historial_visitas_paciente: async ({ documento, limite = 10 }) => {
    const paciente = await prisma.paciente.findUnique({
      where: { cedula: documento },
    });

    if (!paciente) {
      throw new Error(`No se encontró paciente con documento ${documento}`);
    }

    // Get completed appointments
    const citas = await prisma.cita.findMany({
      where: {
        pacienteId: paciente.id,
        estado: 'Completada',
      },
      include: {
        doctor: { select: { nombre: true, apellido: true } },
        especialidad: { select: { titulo: true } },
      },
      orderBy: { fecha: 'desc' },
      take: limite,
    });

    if (citas.length === 0) {
      return {
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        mensaje: 'No hay visitas médicas registradas',
        visitas: [],
      };
    }

    return {
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      total_visitas: citas.length,
      visitas: citas.map((c) => ({
        fecha: new Date(c.fecha).toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        doctor: `Dr. ${c.doctor.nombre} ${c.doctor.apellido}`,
        especialidad: c.especialidad.titulo,
        motivo: c.motivo || 'No especificado',
      })),
    };
  },
};

module.exports = { definitions, handlers };
