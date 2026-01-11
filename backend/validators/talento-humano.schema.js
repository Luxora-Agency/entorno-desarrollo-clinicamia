/**
 * Validadores Zod para el Módulo de Talento Humano
 */
const { z } = require('zod');

// ============ CARGOS ============

const createCargoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  nivel: z.number().int().positive().default(1),
  departamentoId: z.string().uuid().optional().nullable(),
  cargoSuperiorId: z.string().uuid().optional().nullable(),
  funciones: z.string().optional(),
  requisitos: z.object({
    educacion: z.string().optional(),
    experiencia: z.string().optional(),
    competencias: z.array(z.string()).optional()
  }).optional(),
  salarioMinimo: z.number().positive().optional().nullable(),
  salarioMaximo: z.number().positive().optional().nullable(),
  competencias: z.array(z.string()).optional()
});

const updateCargoSchema = createCargoSchema.partial();

// ============ VACANTES ============

const createVacanteSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  departamentoId: z.string().uuid().optional().nullable(),
  cargoId: z.string().uuid().optional().nullable(),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  requisitos: z.object({
    educacion: z.string().optional(),
    experienciaAnios: z.number().int().min(0).optional(),
    habilidades: z.array(z.string()).optional(),
    idiomas: z.array(z.string()).optional(),
    otros: z.string().optional()
  }).optional(),
  salarioMin: z.number().positive().optional().nullable(),
  salarioMax: z.number().positive().optional().nullable(),
  tipoContrato: z.enum(['INDEFINIDO', 'FIJO', 'OBRA_LABOR', 'PRESTACION_SERVICIOS', 'APRENDIZAJE', 'TEMPORAL']),
  jornada: z.enum(['COMPLETA', 'MEDIA', 'POR_HORAS', 'TURNOS']),
  ubicacion: z.string().optional(),
  cantidadPuestos: z.number().int().positive().default(1),
  fechaApertura: z.string().transform(val => new Date(val)),
  fechaCierre: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  publicarExterno: z.boolean().default(false),
  urlsPublicacion: z.array(z.string().url()).optional()
});

const updateVacanteSchema = createVacanteSchema.partial();

// ============ CANDIDATOS ============

const createCandidatoSchema = z.object({
  tipoDocumento: z.string().min(1, 'El tipo de documento es requerido'),
  documento: z.string().min(1, 'El documento es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  fechaNacimiento: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  genero: z.string().optional().nullable(),
  estadoCivil: z.string().optional().nullable(),
  nacionalidad: z.string().optional().nullable(),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  direccion: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  departamento: z.string().optional().nullable(),
  profesion: z.string().optional().nullable(),
  nivelEducativo: z.string().optional().nullable(),
  institucionEducativa: z.string().optional().nullable(),
  anioGraduacion: z.number().int().optional().nullable(),
  experienciaAnios: z.number().int().min(0).optional().nullable(),
  cargoActual: z.string().optional().nullable(),
  empresaActual: z.string().optional().nullable(),
  salarioActual: z.number().positive().optional().nullable(),
  expectativaSalarial: z.number().positive().optional().nullable(),
  disponibilidad: z.string().optional().nullable(),
  cvUrl: z.string().url().optional().nullable(),
  cvTexto: z.string().optional().nullable(),
  documentos: z.array(z.string().url()).optional(),
  fuenteAplicacion: z.string().optional().nullable(),
  referidoPor: z.string().optional().nullable(),
  notas: z.string().optional().nullable()
});

const updateCandidatoSchema = createCandidatoSchema.partial();

const aplicarVacanteSchema = z.object({
  vacanteId: z.string().uuid('ID de vacante inválido')
});

const updateEstadoCandidatoSchema = z.object({
  candidatoVacanteId: z.string().uuid('ID de relación inválido'),
  estado: z.enum([
    'APLICADO', 'EN_REVISION', 'PRESELECCIONADO', 'ENTREVISTA_PROGRAMADA',
    'ENTREVISTA_REALIZADA', 'PRUEBAS_PENDIENTES', 'PRUEBAS_COMPLETADAS',
    'SELECCIONADO', 'OFERTA_ENVIADA', 'OFERTA_ACEPTADA', 'RECHAZADO',
    'RETIRADO', 'CONTRATADO'
  ]),
  notas: z.string().optional(),
  motivoRechazo: z.string().optional()
});

// ============ ENTREVISTAS ============

const createEntrevistaSchema = z.object({
  candidatoId: z.string().uuid('ID de candidato inválido'),
  vacanteId: z.string().uuid().optional().nullable(),
  tipo: z.enum(['TELEFONICA', 'VIRTUAL', 'PRESENCIAL', 'TECNICA', 'PSICOLOGICA', 'FINAL']),
  fechaProgramada: z.string().transform(val => new Date(val)),
  duracionMinutos: z.number().int().positive().default(60),
  modalidad: z.string().min(1, 'La modalidad es requerida'),
  ubicacion: z.string().optional().nullable(),
  entrevistadorId: z.string().uuid('ID de entrevistador inválido')
});

const updateEntrevistaSchema = createEntrevistaSchema.partial();

const completarEntrevistaSchema = z.object({
  respuestas: z.record(z.string(), z.any()).optional(),
  evaluacion: z.object({
    competencias: z.record(z.string(), z.number().min(1).max(5)).optional(),
    comentarios: z.string().optional()
  }).optional(),
  observaciones: z.string().optional(),
  recomendacion: z.enum(['AVANZAR', 'RECHAZAR', 'PENDIENTE']).optional()
});

// ============ EMPLEADOS ============

const createEmpleadoSchema = z.object({
  usuarioId: z.string().uuid().optional().nullable(),
  candidatoId: z.string().uuid().optional().nullable(),
  tipoDocumento: z.string().min(1, 'El tipo de documento es requerido'),
  documento: z.string().min(1, 'El documento es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  fechaNacimiento: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  lugarNacimiento: z.string().optional().nullable(),
  genero: z.string().optional().nullable(),
  estadoCivil: z.string().optional().nullable(),
  nacionalidad: z.string().optional().nullable(),
  tipoSangre: z.string().optional().nullable(),
  fotoUrl: z.string().url().optional().nullable(),
  email: z.string().email('Email inválido'),
  emailCorporativo: z.string().email().optional().nullable(),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  telefonoEmergencia: z.string().optional().nullable(),
  contactoEmergencia: z.string().optional().nullable(),
  parentescoEmergencia: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  departamento: z.string().optional().nullable(),
  cargoId: z.string().uuid('ID de cargo inválido'),
  departamentoId: z.string().uuid().optional().nullable(),
  jefeDirectoId: z.string().uuid().optional().nullable(),
  fechaIngreso: z.string().transform(val => new Date(val)),
  tipoEmpleado: z.enum(['MEDICO', 'ENFERMERIA', 'ADMINISTRATIVO', 'ASISTENCIAL', 'TECNICO', 'DIRECTIVO', 'OPERATIVO', 'PRACTICANTE']),
  nivelEducativo: z.string().optional().nullable(),
  profesion: z.string().optional().nullable(),
  especializaciones: z.array(z.string()).optional(),
  numeroTarjetaProfesional: z.string().optional().nullable(),
  rethus: z.string().optional().nullable(),
  eps: z.string().optional().nullable(),
  afp: z.string().optional().nullable(),
  arl: z.string().optional().nullable(),
  cajaCompensacion: z.string().optional().nullable(),
  banco: z.string().optional().nullable(),
  tipoCuenta: z.string().optional().nullable(),
  numeroCuenta: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable()
});

const updateEmpleadoSchema = createEmpleadoSchema.partial();

const changeEstadoEmpleadoSchema = z.object({
  estado: z.enum(['ACTIVO', 'INACTIVO', 'VACACIONES', 'INCAPACIDAD', 'LICENCIA', 'SUSPENDIDO', 'RETIRADO']),
  motivo: z.string().optional()
});

// ============ CONTRATOS ============

const createContratoSchema = z.object({
  empleadoId: z.string().uuid('ID de empleado inválido'),
  tipoContrato: z.enum(['INDEFINIDO', 'FIJO', 'OBRA_LABOR', 'PRESTACION_SERVICIOS', 'APRENDIZAJE', 'TEMPORAL']),
  fechaInicio: z.string().transform(val => new Date(val)),
  fechaFin: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  salarioBase: z.number().positive('El salario debe ser positivo'),
  auxTransporte: z.boolean().default(true),
  jornada: z.enum(['COMPLETA', 'MEDIA', 'POR_HORAS', 'TURNOS']),
  horasSemana: z.number().int().positive().default(48),
  periodoPruebaDias: z.number().int().min(0).optional().nullable(),
  clausulasAdicionales: z.string().optional().nullable()
});

const updateContratoSchema = createContratoSchema.partial();

const terminarContratoSchema = z.object({
  motivo: z.string().min(1, 'El motivo es requerido'),
  fechaTerminacion: z.string().transform(val => new Date(val))
});

const renovarContratoSchema = z.object({
  nuevaFechaFin: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  nuevoSalario: z.number().positive().optional(),
  observaciones: z.string().optional()
});

// ============ MOVIMIENTOS ============

const createMovimientoSchema = z.object({
  empleadoId: z.string().uuid('ID de empleado inválido'),
  tipoMovimiento: z.enum([
    'INGRESO', 'ASCENSO', 'DESCENSO', 'TRASLADO', 'CAMBIO_AREA',
    'CAMBIO_JORNADA', 'AJUSTE_SALARIAL', 'SUSPENSION', 'REINTEGRO',
    'RETIRO_VOLUNTARIO', 'DESPIDO', 'PENSION'
  ]),
  fechaEfectiva: z.string().transform(val => new Date(val)),
  motivo: z.string().optional(),
  cargoNuevoId: z.string().uuid().optional().nullable(),
  salarioNuevo: z.number().positive().optional().nullable(),
  departamentoNuevo: z.string().optional().nullable(),
  documentoSoporte: z.string().url().optional().nullable(),
  observaciones: z.string().optional().nullable()
});

// ============ NÓMINA ============

const createPeriodoNominaSchema = z.object({
  anio: z.number().int().min(2020).max(2100),
  mes: z.number().int().min(1).max(12),
  quincena: z.number().int().min(1).max(2).optional().nullable(),
  fechaInicio: z.string().transform(val => new Date(val)),
  fechaFin: z.string().transform(val => new Date(val)),
  fechaPago: z.string().transform(val => new Date(val)),
  observaciones: z.string().optional()
});

const createNovedadNominaSchema = z.object({
  empleadoId: z.string().uuid('ID de empleado inválido'),
  periodoId: z.string().uuid().optional().nullable(),
  tipo: z.enum(['HORA_EXTRA', 'COMISION', 'BONIFICACION', 'DESCUENTO', 'PRESTAMO', 'INCAPACIDAD', 'LICENCIA']),
  concepto: z.string().min(1, 'El concepto es requerido'),
  valor: z.number(),
  cantidad: z.number().optional().nullable(),
  fechaInicio: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  fechaFin: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  recurrente: z.boolean().default(false),
  observaciones: z.string().optional()
});

// ============ ASISTENCIA ============

const registrarAsistenciaSchema = z.object({
  empleadoId: z.string().uuid('ID de empleado inválido'),
  tipo: z.enum(['ENTRADA', 'SALIDA']),
  tipoRegistro: z.string().default('MANUAL'),
  ubicacion: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  observaciones: z.string().optional()
});

const createTurnoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  codigo: z.string().min(1, 'El código es requerido'),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida'),
  horaFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida'),
  horasJornada: z.number().positive(),
  esNocturno: z.boolean().default(false),
  esRotativo: z.boolean().default(false),
  color: z.string().optional()
});

const asignarTurnoSchema = z.object({
  empleadoId: z.string().uuid('ID de empleado inválido'),
  turnoId: z.string().uuid('ID de turno inválido'),
  fechaInicio: z.string().transform(val => new Date(val)),
  fechaFin: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  diasSemana: z.array(z.number().int().min(0).max(6))
});

// ============ VACACIONES ============

const solicitarVacacionesSchema = z.object({
  tipo: z.enum(['ORDINARIAS', 'COMPENSADAS', 'ANTICIPADAS']).default('ORDINARIAS'),
  fechaInicio: z.string().transform(val => new Date(val)),
  fechaFin: z.string().transform(val => new Date(val)),
  observaciones: z.string().optional()
});

// ============ PERMISOS ============

const solicitarPermisoSchema = z.object({
  tipoPermiso: z.enum([
    'CALAMIDAD', 'CITA_MEDICA', 'MATERNIDAD', 'PATERNIDAD',
    'LICENCIA_NO_REMUNERADA', 'PERSONAL', 'COMISION', 'LUTO',
    'MATRIMONIO', 'ESTUDIO'
  ]),
  fechaInicio: z.string().transform(val => new Date(val)),
  fechaFin: z.string().transform(val => new Date(val)),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  horaFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  motivo: z.string().min(1, 'El motivo es requerido'),
  documentoSoporte: z.string().url().optional().nullable()
});

// ============ EVALUACIONES ============

const createPeriodoEvaluacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  anio: z.number().int().min(2020).max(2100),
  tipo: z.enum(['ANUAL', 'SEMESTRAL', 'TRIMESTRAL', 'PRUEBA']),
  fechaInicio: z.string().transform(val => new Date(val)),
  fechaFin: z.string().transform(val => new Date(val)),
  fechaLimiteEval: z.string().transform(val => new Date(val)),
  competencias: z.array(z.object({
    nombre: z.string(),
    descripcion: z.string().optional(),
    peso: z.number().min(0).max(100).optional()
  })).optional(),
  pesosEvaluadores: z.object({
    jefe: z.number().min(0).max(100).default(40),
    auto: z.number().min(0).max(100).default(20),
    pares: z.number().min(0).max(100).default(20),
    subordinados: z.number().min(0).max(100).default(20)
  }).optional()
});

const responderEvaluacionSchema = z.object({
  respuestas: z.record(z.string(), z.any()),
  fortalezas: z.string().optional(),
  areasMejora: z.string().optional(),
  comentarioGeneral: z.string().optional()
});

// ============ OBJETIVOS ============

const createObjetivoSchema = z.object({
  empleadoId: z.string().uuid('ID de empleado inválido'),
  anio: z.number().int().min(2020).max(2100),
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  metrica: z.string().min(1, 'La métrica es requerida'),
  valorMeta: z.number().optional().nullable(),
  peso: z.number().int().min(0).max(100).default(100),
  fechaLimite: z.string().optional().nullable().transform(val => val ? new Date(val) : null)
});

const updateObjetivoSchema = createObjetivoSchema.partial();

const updateProgresoObjetivoSchema = z.object({
  progreso: z.number().int().min(0).max(100),
  valorActual: z.number().optional().nullable(),
  evidencias: z.array(z.string().url()).optional()
});

// ============ FEEDBACK ============

const createFeedbackSchema = z.object({
  empleadoId: z.string().uuid('ID de empleado inválido'),
  tipo: z.enum(['RECONOCIMIENTO', 'MEJORA', 'GENERAL']),
  contenido: z.string().min(1, 'El contenido es requerido'),
  esPublico: z.boolean().default(false),
  competenciaRelacionada: z.string().optional()
});

// ============ CAPACITACIONES ============

const createCapacitacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  categoria: z.string().optional(),
  modalidad: z.enum(['PRESENCIAL', 'VIRTUAL', 'MIXTA', 'ELEARNING']),
  duracionHoras: z.number().int().positive(),
  instructor: z.string().optional(),
  esInterno: z.boolean().default(true),
  costoTotal: z.number().min(0).optional().nullable(),
  cuposMaximos: z.number().int().positive().optional().nullable(),
  requisitos: z.string().optional(),
  objetivos: z.string().optional(),
  contenido: z.string().optional(),
  fechaInicio: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  fechaFin: z.string().optional().nullable().transform(val => val ? new Date(val) : null)
});

const updateCapacitacionSchema = createCapacitacionSchema.partial();

const addSesionSchema = z.object({
  fecha: z.string().transform(val => new Date(val)),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida'),
  horaFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida'),
  ubicacion: z.string().optional(),
  enlaceVirtual: z.string().url().optional()
});

const registrarEvaluacionCapacitacionSchema = z.object({
  nota: z.number().min(0).max(100).optional().nullable(),
  certificadoUrl: z.string().url().optional().nullable(),
  feedback: z.string().optional()
});

// ============ BENEFICIOS ============

const createBeneficioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  tipo: z.string().min(1, 'El tipo es requerido'),
  valorMensual: z.number().min(0).optional().nullable(),
  requisitos: z.string().optional()
});

const updateBeneficioSchema = createBeneficioSchema.partial();

const asignarBeneficioSchema = z.object({
  beneficioId: z.string().uuid('ID de beneficio inválido'),
  empleadoId: z.string().uuid('ID de empleado inválido'),
  fechaInicio: z.string().optional().transform(val => val ? new Date(val) : new Date()),
  fechaFin: z.string().optional().nullable().transform(val => val ? new Date(val) : null)
});

// ============ ENCUESTAS ============

const createEncuestaSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum(['CLIMA', 'SATISFACCION', 'PULSO', 'SALIDA', 'PERSONALIZADA']),
  fechaInicio: z.string().transform(val => new Date(val)),
  fechaFin: z.string().transform(val => new Date(val)),
  esAnonima: z.boolean().default(true),
  preguntas: z.array(z.object({
    texto: z.string(),
    tipo: z.enum(['escala', 'opcion_multiple', 'seleccion', 'texto', 'numero']),
    opciones: z.array(z.string()).optional(),
    requerida: z.boolean().default(true)
  }))
});

const updateEncuestaSchema = createEncuestaSchema.partial();

const responderEncuestaSchema = z.object({
  respuestas: z.array(z.any())
});

// ============ EVENTOS ============

const createEventoSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  tipo: z.string().min(1, 'El tipo es requerido'),
  fecha: z.string().transform(val => new Date(val)),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  horaFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  ubicacion: z.string().optional(),
  cupoMaximo: z.number().int().positive().optional().nullable(),
  esObligatorio: z.boolean().default(false)
});

const updateEventoSchema = createEventoSchema.partial();

// ============ RECONOCIMIENTOS ============

const createReconocimientoSchema = z.object({
  empleadoId: z.string().uuid('ID de empleado inválido'),
  tipo: z.string().min(1, 'El tipo es requerido'),
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  fecha: z.string().optional().transform(val => val ? new Date(val) : new Date()),
  valorAsociado: z.string().optional(),
  esPublico: z.boolean().default(true)
});

// ============ AI ============

const screeningCVSchema = z.object({
  cvText: z.string().min(1, 'El texto del CV es requerido'),
  vacanteId: z.string().uuid('ID de vacante inválido')
});

const generarPreguntasSchema = z.object({
  candidatoId: z.string().uuid('ID de candidato inválido'),
  vacanteId: z.string().uuid('ID de vacante inválido'),
  tipoEntrevista: z.enum(['TELEFONICA', 'VIRTUAL', 'PRESENCIAL', 'TECNICA', 'PSICOLOGICA', 'FINAL']).optional()
});

const analizarDesempenoSchema = z.object({
  empleadoId: z.string().uuid('ID de empleado inválido')
});

const predecirRotacionSchema = z.object({
  departamentoId: z.string().uuid().optional(),
  limit: z.number().int().positive().default(20)
});

const sugerirCapacitacionSchema = z.object({
  empleadoId: z.string().uuid('ID de empleado inválido')
});

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  context: z.object({
    empleadoId: z.string().uuid().optional(),
    vacanteId: z.string().uuid().optional(),
    candidatoId: z.string().uuid().optional()
  }).optional()
});

module.exports = {
  // Cargos
  createCargoSchema,
  updateCargoSchema,
  // Vacantes
  createVacanteSchema,
  updateVacanteSchema,
  // Candidatos
  createCandidatoSchema,
  updateCandidatoSchema,
  aplicarVacanteSchema,
  updateEstadoCandidatoSchema,
  // Entrevistas
  createEntrevistaSchema,
  updateEntrevistaSchema,
  completarEntrevistaSchema,
  // Empleados
  createEmpleadoSchema,
  updateEmpleadoSchema,
  changeEstadoEmpleadoSchema,
  // Contratos
  createContratoSchema,
  updateContratoSchema,
  terminarContratoSchema,
  renovarContratoSchema,
  // Movimientos
  createMovimientoSchema,
  // Nómina
  createPeriodoNominaSchema,
  createNovedadNominaSchema,
  // Asistencia
  registrarAsistenciaSchema,
  createTurnoSchema,
  asignarTurnoSchema,
  // Vacaciones
  solicitarVacacionesSchema,
  // Permisos
  solicitarPermisoSchema,
  // Evaluaciones
  createPeriodoEvaluacionSchema,
  responderEvaluacionSchema,
  // Objetivos
  createObjetivoSchema,
  updateObjetivoSchema,
  updateProgresoObjetivoSchema,
  // Feedback
  createFeedbackSchema,
  // Capacitaciones
  createCapacitacionSchema,
  updateCapacitacionSchema,
  addSesionSchema,
  registrarEvaluacionCapacitacionSchema,
  // Beneficios
  createBeneficioSchema,
  updateBeneficioSchema,
  asignarBeneficioSchema,
  // Encuestas
  createEncuestaSchema,
  updateEncuestaSchema,
  responderEncuestaSchema,
  // Eventos
  createEventoSchema,
  updateEventoSchema,
  // Reconocimientos
  createReconocimientoSchema,
  // AI
  screeningCVSchema,
  generarPreguntasSchema,
  analizarDesempenoSchema,
  predecirRotacionSchema,
  sugerirCapacitacionSchema,
  chatSchema
};
