/**
 * MCP Tools - Historia Clínica Electrónica (HCE)
 *
 * Tools for accessing and requesting electronic health records.
 */

const prisma = require('../../db/prisma');

// Tool definitions
const definitions = [
  {
    name: 'resumen_hce',
    description: 'Obtiene un resumen de la historia clínica electrónica de un paciente. Incluye diagnósticos recientes, medicamentos activos, alergias y últimas consultas.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
      },
      required: ['documento'],
    },
  },
  {
    name: 'solicitar_copia_hce',
    description: 'Solicita una copia de la historia clínica electrónica. Genera una solicitud que será procesada por el departamento de archivo.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
        email: {
          type: 'string',
          description: 'Correo electrónico donde enviar la notificación cuando esté lista',
        },
        motivo: {
          type: 'string',
          description: 'Motivo de la solicitud (ej: "trámite de EPS", "segunda opinión", "viaje al exterior")',
        },
      },
      required: ['documento', 'motivo'],
    },
  },
  {
    name: 'consultar_resultados_laboratorio',
    description: 'Consulta los resultados de exámenes de laboratorio recientes de un paciente.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
        limite: {
          type: 'number',
          description: 'Número máximo de resultados (default: 5)',
        },
      },
      required: ['documento'],
    },
  },
  {
    name: 'consultar_resultados_imagenologia',
    description: 'Consulta los resultados de estudios de imagenología (rayos X, ecografías, TAC, etc.) de un paciente.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
        limite: {
          type: 'number',
          description: 'Número máximo de resultados (default: 5)',
        },
      },
      required: ['documento'],
    },
  },
  {
    name: 'consultar_medicamentos_activos',
    description: 'Consulta los medicamentos actualmente prescritos a un paciente.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
      },
      required: ['documento'],
    },
  },
  {
    name: 'consultar_alergias',
    description: 'Consulta las alergias registradas de un paciente.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
      },
      required: ['documento'],
    },
  },
  {
    name: 'consultar_diagnosticos',
    description: 'Consulta los diagnósticos registrados de un paciente.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
        solo_activos: {
          type: 'boolean',
          description: 'Si es true, solo muestra diagnósticos activos/crónicos (default: true)',
        },
        limite: {
          type: 'number',
          description: 'Número máximo de diagnósticos (default: 10)',
        },
      },
      required: ['documento'],
    },
  },
  {
    name: 'consultar_signos_vitales',
    description: 'Consulta los últimos signos vitales registrados de un paciente.',
    inputSchema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          description: 'Número de documento del paciente',
        },
      },
      required: ['documento'],
    },
  },
];

// Helper function to get patient
async function getPaciente(documento) {
  const paciente = await prisma.paciente.findUnique({
    where: { cedula: documento },
  });

  if (!paciente) {
    throw new Error(`No se encontró paciente con documento ${documento}`);
  }

  return paciente;
}

// Tool handlers
const handlers = {
  /**
   * Resumen de HCE
   */
  resumen_hce: async ({ documento }) => {
    const paciente = await getPaciente(documento);

    // Get recent diagnoses
    const diagnosticos = await prisma.diagnostico.findMany({
      where: { pacienteId: paciente.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        codigo: true,
        descripcion: true,
        tipo: true,
        estado: true,
        createdAt: true,
      },
    });

    // Get active prescriptions
    const prescripciones = await prisma.prescripcion.findMany({
      where: {
        pacienteId: paciente.id,
        estado: 'Activa',
      },
      include: {
        producto: { select: { nombre: true } },
      },
      take: 10,
    });

    // Get allergies
    const alergias = paciente.alergias || [];

    // Get recent appointments
    const citasRecientes = await prisma.cita.findMany({
      where: {
        pacienteId: paciente.id,
        estado: 'Completada',
      },
      include: {
        doctor: { select: { nombre: true, apellido: true } },
        especialidad: { select: { titulo: true } },
      },
      orderBy: { fecha: 'desc' },
      take: 5,
    });

    // Get vital signs
    const signosVitales = await prisma.signosVitales.findFirst({
      where: { pacienteId: paciente.id },
      orderBy: { fecha: 'desc' },
    });

    return {
      paciente: {
        nombre: `${paciente.nombre} ${paciente.apellido}`,
        documento: `${paciente.tipoDocumento} ${paciente.cedula}`,
        edad: paciente.fechaNacimiento
          ? `${Math.floor((new Date() - new Date(paciente.fechaNacimiento)) / 31557600000)} años`
          : 'No registrada',
        genero: paciente.genero || 'No especificado',
        eps: paciente.eps || 'No registrada',
        grupo_sanguineo: paciente.grupoSanguineo || 'No registrado',
      },
      alergias: alergias.length > 0 ? alergias : ['Sin alergias registradas'],
      diagnosticos_recientes: diagnosticos.length > 0
        ? diagnosticos.map((d) => ({
            codigo: d.codigo,
            descripcion: d.descripcion,
            tipo: d.tipo,
            estado: d.estado,
            fecha: new Date(d.createdAt).toLocaleDateString('es-CO'),
          }))
        : 'Sin diagnósticos registrados',
      medicamentos_activos: prescripciones.length > 0
        ? prescripciones.map((p) => ({
            medicamento: p.producto?.nombre || p.medicamento,
            dosis: p.dosis,
            frecuencia: p.frecuencia,
            via: p.via,
          }))
        : 'Sin medicamentos activos',
      ultimos_signos_vitales: signosVitales
        ? {
            fecha: new Date(signosVitales.fecha).toLocaleString('es-CO'),
            presion_arterial: signosVitales.presionSistolica && signosVitales.presionDiastolica
              ? `${signosVitales.presionSistolica}/${signosVitales.presionDiastolica} mmHg`
              : 'No registrada',
            frecuencia_cardiaca: signosVitales.frecuenciaCardiaca
              ? `${signosVitales.frecuenciaCardiaca} lpm`
              : 'No registrada',
            temperatura: signosVitales.temperatura
              ? `${signosVitales.temperatura}°C`
              : 'No registrada',
            peso: signosVitales.peso
              ? `${signosVitales.peso} kg`
              : 'No registrado',
            saturacion: signosVitales.saturacionOxigeno
              ? `${signosVitales.saturacionOxigeno}%`
              : 'No registrada',
          }
        : 'Sin signos vitales registrados',
      ultimas_consultas: citasRecientes.length > 0
        ? citasRecientes.map((c) => ({
            fecha: new Date(c.fecha).toLocaleDateString('es-CO'),
            especialidad: c.especialidad.titulo,
            doctor: `Dr. ${c.doctor.nombre} ${c.doctor.apellido}`,
            motivo: c.motivo || 'No especificado',
          }))
        : 'Sin consultas registradas',
      nota: 'Para solicitar una copia oficial de la historia clínica, use la herramienta solicitar_copia_hce',
    };
  },

  /**
   * Solicitar copia de HCE
   */
  solicitar_copia_hce: async ({ documento, email, motivo }) => {
    const paciente = await getPaciente(documento);

    // Create a ticket/request for HCE copy
    const solicitud = await prisma.ticket.create({
      data: {
        tipo: 'Solicitud_HCE',
        asunto: `Solicitud de copia de Historia Clínica - ${paciente.nombre} ${paciente.apellido}`,
        descripcion: `Paciente: ${paciente.nombre} ${paciente.apellido}
Documento: ${paciente.tipoDocumento} ${paciente.cedula}
Motivo: ${motivo}
Email de contacto: ${email || paciente.email || 'No proporcionado'}
Solicitado vía: WhatsApp Bot`,
        estado: 'Abierto',
        prioridad: 'Media',
        pacienteId: paciente.id,
      },
    });

    // Update patient email if provided
    if (email && email !== paciente.email) {
      await prisma.paciente.update({
        where: { id: paciente.id },
        data: { email },
      });
    }

    return {
      solicitud_creada: true,
      numero_solicitud: solicitud.id.slice(0, 8).toUpperCase(),
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      mensaje: 'Su solicitud de copia de historia clínica ha sido registrada exitosamente.',
      informacion: {
        tiempo_estimado: '3-5 días hábiles',
        email_notificacion: email || paciente.email || 'No registrado',
        motivo: motivo,
      },
      instrucciones: [
        'Recibirá una notificación cuando su historia clínica esté lista.',
        'Deberá presentar su documento de identidad para retirarla.',
        'Si es un tercero quien la retira, debe traer autorización notariada.',
        'Para consultas, comuníquese al 324 333 8555',
      ],
    };
  },

  /**
   * Consultar resultados de laboratorio
   */
  consultar_resultados_laboratorio: async ({ documento, limite = 5 }) => {
    const paciente = await getPaciente(documento);

    const examenes = await prisma.examenProcedimiento.findMany({
      where: {
        pacienteId: paciente.id,
        tipo: 'Laboratorio',
        estado: { in: ['Completado', 'Validado'] },
      },
      include: {
        doctor: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaRealizacion: 'desc' },
      take: limite,
    });

    if (examenes.length === 0) {
      return {
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        mensaje: 'No hay resultados de laboratorio disponibles',
        examenes: [],
      };
    }

    return {
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      total_resultados: examenes.length,
      examenes: examenes.map((e) => ({
        nombre: e.nombre,
        fecha: e.fechaRealizacion
          ? new Date(e.fechaRealizacion).toLocaleDateString('es-CO')
          : 'Pendiente',
        estado: e.estado,
        resultado: e.resultado || 'Ver en portal de resultados',
        interpretacion: e.interpretacion || null,
        doctor_ordenante: e.doctor
          ? `Dr. ${e.doctor.nombre} ${e.doctor.apellido}`
          : 'No especificado',
      })),
      nota: 'Para resultados detallados, visite nuestro portal web o solicite copia física.',
    };
  },

  /**
   * Consultar resultados de imagenología
   */
  consultar_resultados_imagenologia: async ({ documento, limite = 5 }) => {
    const paciente = await getPaciente(documento);

    const estudios = await prisma.examenProcedimiento.findMany({
      where: {
        pacienteId: paciente.id,
        tipo: 'Imagenologia',
        estado: { in: ['Completado', 'Validado'] },
      },
      include: {
        doctor: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaRealizacion: 'desc' },
      take: limite,
    });

    if (estudios.length === 0) {
      return {
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        mensaje: 'No hay estudios de imagenología disponibles',
        estudios: [],
      };
    }

    return {
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      total_estudios: estudios.length,
      estudios: estudios.map((e) => ({
        nombre: e.nombre,
        fecha: e.fechaRealizacion
          ? new Date(e.fechaRealizacion).toLocaleDateString('es-CO')
          : 'Pendiente',
        estado: e.estado,
        hallazgos: e.hallazgos || 'Ver informe completo',
        conclusion: e.conclusion || null,
        doctor_ordenante: e.doctor
          ? `Dr. ${e.doctor.nombre} ${e.doctor.apellido}`
          : 'No especificado',
      })),
      nota: 'Las imágenes están disponibles en nuestro portal PACS. Solicite acceso en recepción.',
    };
  },

  /**
   * Consultar medicamentos activos
   */
  consultar_medicamentos_activos: async ({ documento }) => {
    const paciente = await getPaciente(documento);

    const prescripciones = await prisma.prescripcion.findMany({
      where: {
        pacienteId: paciente.id,
        estado: 'Activa',
      },
      include: {
        producto: { select: { nombre: true } },
        doctor: { select: { nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (prescripciones.length === 0) {
      return {
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        mensaje: 'No hay medicamentos activos registrados',
        medicamentos: [],
      };
    }

    return {
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      total_medicamentos: prescripciones.length,
      medicamentos: prescripciones.map((p) => ({
        medicamento: p.producto?.nombre || p.medicamento,
        dosis: p.dosis,
        frecuencia: p.frecuencia,
        via: p.via,
        duracion: p.duracion || 'Continuo',
        indicaciones: p.indicaciones || 'Según prescripción médica',
        doctor: p.doctor
          ? `Dr. ${p.doctor.nombre} ${p.doctor.apellido}`
          : 'No especificado',
        fecha_inicio: new Date(p.createdAt).toLocaleDateString('es-CO'),
      })),
      advertencia: 'No suspenda ni modifique sus medicamentos sin consultar a su médico.',
    };
  },

  /**
   * Consultar alergias
   */
  consultar_alergias: async ({ documento }) => {
    const paciente = await getPaciente(documento);

    const alergias = paciente.alergias || [];

    if (alergias.length === 0) {
      return {
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        tiene_alergias: false,
        mensaje: 'No hay alergias registradas para este paciente',
        recomendacion: 'Si tiene alguna alergia conocida, informe al personal médico para actualizar su historia.',
      };
    }

    return {
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      tiene_alergias: true,
      total_alergias: alergias.length,
      alergias: alergias,
      advertencia: 'Siempre informe al personal médico sobre sus alergias antes de cualquier procedimiento.',
    };
  },

  /**
   * Consultar diagnósticos
   */
  consultar_diagnosticos: async ({ documento, solo_activos = true, limite = 10 }) => {
    const paciente = await getPaciente(documento);

    const where = {
      pacienteId: paciente.id,
    };

    if (solo_activos) {
      where.estado = { in: ['Activo', 'Cronico'] };
    }

    const diagnosticos = await prisma.diagnostico.findMany({
      where,
      include: {
        doctor: { select: { nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limite,
    });

    if (diagnosticos.length === 0) {
      return {
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        mensaje: solo_activos
          ? 'No hay diagnósticos activos registrados'
          : 'No hay diagnósticos registrados',
        diagnosticos: [],
      };
    }

    return {
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      total_diagnosticos: diagnosticos.length,
      filtro: solo_activos ? 'Solo activos/crónicos' : 'Todos',
      diagnosticos: diagnosticos.map((d) => ({
        codigo: d.codigo,
        descripcion: d.descripcion,
        tipo: d.tipo,
        estado: d.estado,
        fecha_diagnostico: new Date(d.createdAt).toLocaleDateString('es-CO'),
        doctor: d.doctor
          ? `Dr. ${d.doctor.nombre} ${d.doctor.apellido}`
          : 'No especificado',
        notas: d.notas || null,
      })),
    };
  },

  /**
   * Consultar signos vitales
   */
  consultar_signos_vitales: async ({ documento }) => {
    const paciente = await getPaciente(documento);

    const signosVitales = await prisma.signosVitales.findMany({
      where: { pacienteId: paciente.id },
      orderBy: { fecha: 'desc' },
      take: 5,
    });

    if (signosVitales.length === 0) {
      return {
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        mensaje: 'No hay signos vitales registrados',
        registros: [],
      };
    }

    return {
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      ultimos_registros: signosVitales.map((sv) => ({
        fecha: new Date(sv.fecha).toLocaleString('es-CO'),
        presion_arterial: sv.presionSistolica && sv.presionDiastolica
          ? `${sv.presionSistolica}/${sv.presionDiastolica} mmHg`
          : null,
        frecuencia_cardiaca: sv.frecuenciaCardiaca
          ? `${sv.frecuenciaCardiaca} lpm`
          : null,
        frecuencia_respiratoria: sv.frecuenciaRespiratoria
          ? `${sv.frecuenciaRespiratoria} rpm`
          : null,
        temperatura: sv.temperatura
          ? `${sv.temperatura}°C`
          : null,
        saturacion_oxigeno: sv.saturacionOxigeno
          ? `${sv.saturacionOxigeno}%`
          : null,
        peso: sv.peso
          ? `${sv.peso} kg`
          : null,
        talla: sv.talla
          ? `${sv.talla} cm`
          : null,
        imc: sv.peso && sv.talla
          ? (sv.peso / Math.pow(sv.talla / 100, 2)).toFixed(1)
          : null,
        glucometria: sv.glucometria
          ? `${sv.glucometria} mg/dL`
          : null,
      })),
    };
  },
};

module.exports = { definitions, handlers };
