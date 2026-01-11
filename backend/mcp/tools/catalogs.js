/**
 * MCP Tools - Catalogs & General Information
 *
 * Tools for listing specialties, departments, and general clinic information.
 */

const prisma = require('../../db/prisma');

// Tool definitions
const definitions = [
  {
    name: 'listar_especialidades',
    description: 'Lista todas las especialidades médicas disponibles en la clínica con sus costos y duración de consulta.',
    inputSchema: {
      type: 'object',
      properties: {
        departamento: {
          type: 'string',
          description: 'Filtrar por departamento/área (opcional)',
        },
      },
    },
  },
  {
    name: 'listar_departamentos',
    description: 'Lista todos los departamentos o áreas médicas de la clínica.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'informacion_especialidad',
    description: 'Obtiene información detallada de una especialidad específica, incluyendo descripción, costo, duración y doctores disponibles.',
    inputSchema: {
      type: 'object',
      properties: {
        especialidad_id: {
          type: 'string',
          description: 'ID de la especialidad (UUID)',
        },
        nombre_especialidad: {
          type: 'string',
          description: 'Nombre de la especialidad (alternativa al ID)',
        },
      },
    },
  },
  {
    name: 'consultar_precios',
    description: 'Consulta los precios de consultas y procedimientos. Puede buscar por nombre o especialidad.',
    inputSchema: {
      type: 'object',
      properties: {
        busqueda: {
          type: 'string',
          description: 'Término de búsqueda (nombre de especialidad o procedimiento)',
        },
      },
    },
  },
  {
    name: 'verificar_cobertura_eps',
    description: 'Verifica si un servicio está cubierto por una EPS específica. Nota: Esta es una consulta informativa general.',
    inputSchema: {
      type: 'object',
      properties: {
        eps: {
          type: 'string',
          description: 'Nombre de la EPS',
        },
        servicio: {
          type: 'string',
          description: 'Nombre del servicio o especialidad a consultar',
        },
      },
      required: ['eps', 'servicio'],
    },
  },
  {
    name: 'proximas_citas_disponibles',
    description: 'Busca las próximas citas disponibles para una especialidad específica en los próximos días.',
    inputSchema: {
      type: 'object',
      properties: {
        especialidad: {
          type: 'string',
          description: 'Nombre de la especialidad',
        },
        dias_busqueda: {
          type: 'number',
          description: 'Número de días a buscar (default: 14)',
        },
      },
      required: ['especialidad'],
    },
  },
];

// Tool handlers
const handlers = {
  /**
   * Listar especialidades
   */
  listar_especialidades: async ({ departamento }) => {
    const where = {
      estado: 'Activo',
    };

    if (departamento) {
      where.departamento = {
        nombre: { contains: departamento, mode: 'insensitive' },
      };
    }

    const especialidades = await prisma.especialidad.findMany({
      where,
      include: {
        departamento: { select: { nombre: true } },
        _count: {
          select: {
            doctores: true,
          },
        },
      },
      orderBy: { titulo: 'asc' },
    });

    if (especialidades.length === 0) {
      return {
        mensaje: departamento
          ? `No se encontraron especialidades en ${departamento}`
          : 'No hay especialidades disponibles',
        especialidades: [],
      };
    }

    return {
      total: especialidades.length,
      especialidades: especialidades.map((e) => ({
        id: e.id,
        nombre: e.titulo,
        departamento: e.departamento?.nombre || 'General',
        descripcion: e.descripcion || 'Sin descripción',
        costo: `$${parseFloat(e.costoCOP).toLocaleString('es-CO')} COP`,
        duracion: `${e.duracionMinutos} minutos`,
        doctores_disponibles: e._count.doctores,
      })),
      nota: 'Use buscar_doctores con el nombre de especialidad para ver los doctores disponibles',
    };
  },

  /**
   * Listar departamentos
   */
  listar_departamentos: async () => {
    const departamentos = await prisma.departamento.findMany({
      where: { estado: 'Activo' },
      include: {
        _count: {
          select: {
            especialidades: { where: { estado: 'Activo' } },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return {
      total: departamentos.length,
      departamentos: departamentos.map((d) => ({
        id: d.id,
        nombre: d.nombre,
        descripcion: d.descripcion || 'Sin descripción',
        especialidades: d._count.especialidades,
      })),
      nota: 'Use listar_especialidades con el nombre del departamento para ver sus especialidades',
    };
  },

  /**
   * Información de especialidad
   */
  informacion_especialidad: async ({ especialidad_id, nombre_especialidad }) => {
    let especialidad;

    if (especialidad_id) {
      especialidad = await prisma.especialidad.findUnique({
        where: { id: especialidad_id },
        include: {
          departamento: { select: { nombre: true } },
          doctores: {
            include: {
              doctor: {
                include: {
                  usuario: { select: { nombre: true, apellido: true } },
                },
              },
            },
          },
        },
      });
    } else if (nombre_especialidad) {
      especialidad = await prisma.especialidad.findFirst({
        where: {
          titulo: { contains: nombre_especialidad, mode: 'insensitive' },
          estado: 'Activo',
        },
        include: {
          departamento: { select: { nombre: true } },
          doctores: {
            include: {
              doctor: {
                include: {
                  usuario: { select: { nombre: true, apellido: true } },
                },
              },
            },
          },
        },
      });
    }

    if (!especialidad) {
      throw new Error('Especialidad no encontrada');
    }

    return {
      id: especialidad.id,
      nombre: especialidad.titulo,
      departamento: especialidad.departamento?.nombre || 'General',
      descripcion: especialidad.descripcion || 'Sin descripción disponible',
      costo: `$${parseFloat(especialidad.costoCOP).toLocaleString('es-CO')} COP`,
      duracion: `${especialidad.duracionMinutos} minutos`,
      doctores: especialidad.doctores.map((de) => ({
        id: de.doctor.id,
        nombre: `Dr. ${de.doctor.usuario.nombre} ${de.doctor.usuario.apellido}`,
      })),
      como_agendar: 'Use agendar_cita con el ID de esta especialidad y el ID de uno de los doctores',
    };
  },

  /**
   * Consultar precios
   */
  consultar_precios: async ({ busqueda }) => {
    const especialidades = await prisma.especialidad.findMany({
      where: {
        estado: 'Activo',
        OR: busqueda
          ? [
              { titulo: { contains: busqueda, mode: 'insensitive' } },
              { descripcion: { contains: busqueda, mode: 'insensitive' } },
            ]
          : undefined,
      },
      select: {
        titulo: true,
        costoCOP: true,
        duracionMinutos: true,
        departamento: { select: { nombre: true } },
      },
      orderBy: { costoCOP: 'asc' },
      take: 20,
    });

    if (especialidades.length === 0) {
      return {
        mensaje: busqueda
          ? `No se encontraron servicios que coincidan con "${busqueda}"`
          : 'No hay servicios disponibles',
        resultados: [],
      };
    }

    return {
      busqueda: busqueda || 'Todos los servicios',
      resultados: especialidades.map((e) => ({
        servicio: e.titulo,
        departamento: e.departamento?.nombre || 'General',
        precio: `$${parseFloat(e.costoCOP).toLocaleString('es-CO')} COP`,
        duracion: `${e.duracionMinutos} minutos`,
      })),
      nota: 'Los precios pueden variar según convenios con EPS. Consulte en admisiones.',
    };
  },

  /**
   * Verificar cobertura EPS
   */
  verificar_cobertura_eps: async ({ eps, servicio }) => {
    // This is informational - actual coverage depends on patient's specific plan
    const epsConocidas = [
      'Sura', 'Sanitas', 'Nueva EPS', 'Salud Total', 'Coomeva',
      'Compensar', 'Famisanar', 'Medimás', 'Coosalud', 'Mutual Ser',
      'Aliansalud', 'SOS', 'Comfenalco', 'Cafesalud', 'Cruz Blanca'
    ];

    const esEpsConocida = epsConocidas.some(
      (e) => eps.toLowerCase().includes(e.toLowerCase())
    );

    // Check if specialty exists
    const especialidad = await prisma.especialidad.findFirst({
      where: {
        titulo: { contains: servicio, mode: 'insensitive' },
        estado: 'Activo',
      },
    });

    return {
      eps: eps,
      servicio: servicio,
      servicio_disponible: !!especialidad,
      informacion: {
        mensaje: esEpsConocida
          ? `${eps} es una EPS con la que trabajamos. La cobertura específica depende de su plan.`
          : `Para verificar cobertura con ${eps}, comuníquese con admisiones.`,
        recomendacion: [
          'La cobertura depende de su plan específico y autorizaciones',
          'Traiga su carné de EPS actualizado a la consulta',
          'Algunas especialidades pueden requerir autorización previa',
          'Los copagos varían según su categoría de afiliación',
        ],
        contacto: 'Para más información: 324 333 8555',
      },
      precio_particular: especialidad
        ? `$${parseFloat(especialidad.costoCOP).toLocaleString('es-CO')} COP (sin EPS)`
        : 'Consulte en admisiones',
    };
  },

  /**
   * Próximas citas disponibles
   */
  proximas_citas_disponibles: async ({ especialidad, dias_busqueda = 14 }) => {
    // Find specialty
    const esp = await prisma.especialidad.findFirst({
      where: {
        titulo: { contains: especialidad, mode: 'insensitive' },
        estado: 'Activo',
      },
      include: {
        doctores: {
          include: {
            doctor: {
              include: {
                usuario: { select: { id: true, nombre: true, apellido: true } },
              },
            },
          },
        },
      },
    });

    if (!esp) {
      throw new Error(`Especialidad "${especialidad}" no encontrada`);
    }

    if (esp.doctores.length === 0) {
      return {
        especialidad: esp.titulo,
        mensaje: 'No hay doctores asignados a esta especialidad actualmente',
        citas_disponibles: [],
      };
    }

    // Check availability for each doctor for next N days
    const disponibilidadService = require('../../services/disponibilidad.service');
    const resultados = [];

    for (const de of esp.doctores) {
      const doctor = de.doctor;
      const today = new Date();

      for (let i = 0; i < dias_busqueda && resultados.length < 10; i++) {
        const fecha = new Date(today);
        fecha.setDate(today.getDate() + i);
        const fechaStr = fecha.toISOString().split('T')[0];

        try {
          const disponibilidad = await disponibilidadService.getDisponibilidad(
            doctor.usuarioId,
            fechaStr
          );

          const slotsDisponibles = (disponibilidad.slots || []).filter((s) => s.disponible);

          if (slotsDisponibles.length > 0) {
            resultados.push({
              fecha: fecha.toLocaleDateString('es-CO', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }),
              fecha_iso: fechaStr,
              doctor: {
                id: doctor.id,
                nombre: `Dr. ${doctor.usuario.nombre} ${doctor.usuario.apellido}`,
              },
              horarios_disponibles: slotsDisponibles.slice(0, 3).map((s) => s.hora),
              total_slots: slotsDisponibles.length,
            });
          }
        } catch (err) {
          // Skip days with errors
          continue;
        }
      }
    }

    if (resultados.length === 0) {
      return {
        especialidad: esp.titulo,
        mensaje: `No hay disponibilidad en los próximos ${dias_busqueda} días`,
        sugerencia: 'Intente buscar con más días o comuníquese con admisiones',
        citas_disponibles: [],
      };
    }

    return {
      especialidad: esp.titulo,
      costo: `$${parseFloat(esp.costoCOP).toLocaleString('es-CO')} COP`,
      duracion: `${esp.duracionMinutos} minutos`,
      proximas_disponibilidades: resultados,
      como_agendar: 'Use agendar_cita con el ID del doctor, la fecha y una de las horas disponibles',
    };
  },
};

module.exports = { definitions, handlers };
