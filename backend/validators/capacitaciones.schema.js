const { z } = require('zod');

// ==========================================
// CATEGORÍAS CAPACITACIÓN
// ==========================================

const createCategoriaCapacitacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato hex)').optional(),
  orden: z.number().int().optional()
});

const updateCategoriaCapacitacionSchema = createCategoriaCapacitacionSchema.partial();

const reorderCategoriasSchema = z.object({
  orderedIds: z.array(z.string().uuid())
});

// ==========================================
// CAPACITACIONES
// ==========================================

const createCapacitacionSchema = z.object({
  categoriaId: z.string().uuid('Categoría inválida'),
  tema: z.string().min(1, 'El tema es requerido'),
  actividad: z.string().optional(),
  responsableId: z.string().uuid('Responsable requerido'),
  orientadoA: z.string().optional(),
  duracionMinutos: z.number().int().positive().optional(),
  periodicidad: z.enum(['UNICA', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']).default('UNICA'),
  anio: z.number().int().min(2020).max(2100),
  programadoEne: z.boolean().default(false),
  programadoFeb: z.boolean().default(false),
  programadoMar: z.boolean().default(false),
  programadoAbr: z.boolean().default(false),
  programadoMay: z.boolean().default(false),
  programadoJun: z.boolean().default(false),
  programadoJul: z.boolean().default(false),
  programadoAgo: z.boolean().default(false),
  programadoSep: z.boolean().default(false),
  programadoOct: z.boolean().default(false),
  programadoNov: z.boolean().default(false),
  programadoDic: z.boolean().default(false),
  carpetaMaterialId: z.string().uuid().optional()
});

const updateCapacitacionSchema = createCapacitacionSchema.partial();

// ==========================================
// SESIONES
// ==========================================

const createSesionSchema = z.object({
  fechaProgramada: z.string().transform(val => new Date(val)),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm').optional(),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm').optional(),
  lugar: z.string().optional(),
  convocados: z.number().int().min(0).default(0),
  observaciones: z.string().optional()
});

const updateSesionSchema = createSesionSchema.partial();

const addAsistentesSchema = z.object({
  asistentes: z.array(z.object({
    personalId: z.string().uuid().optional(),
    nombreCompleto: z.string().min(1, 'El nombre es requerido'),
    cargo: z.string().optional()
  }))
});

const updateAsistenteSchema = z.object({
  asistio: z.boolean().optional(),
  firmaUrl: z.string().url().optional().nullable()
});

const marcarAsistenciaMasivaSchema = z.object({
  asistentesIds: z.array(z.string().uuid()),
  asistio: z.boolean().default(true)
});

// ==========================================
// EVALUACIONES
// ==========================================

const createEvaluacionSchema = z.object({
  tipo: z.enum(['PRE_TEST', 'POST_TEST']),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  tiempoLimiteMin: z.number().int().positive().optional(),
  puntajePorPregunta: z.number().int().positive().default(1)
});

const updateEvaluacionSchema = createEvaluacionSchema.partial();

const createPreguntaSchema = z.object({
  texto: z.string().min(1, 'El texto de la pregunta es requerido'),
  tipo: z.enum(['OPCION_MULTIPLE', 'VERDADERO_FALSO', 'SELECCION_MULTIPLE']).default('OPCION_MULTIPLE'),
  orden: z.number().int().optional(),
  tiempoSegundos: z.number().int().positive().optional(),
  imagenUrl: z.string().url().optional(),
  opciones: z.array(z.object({
    texto: z.string().min(1, 'El texto de la opción es requerido'),
    esCorrecta: z.boolean().default(false)
  })).min(2, 'Se requieren al menos 2 opciones').optional()
});

const updatePreguntaSchema = z.object({
  texto: z.string().min(1).optional(),
  tipo: z.enum(['OPCION_MULTIPLE', 'VERDADERO_FALSO', 'SELECCION_MULTIPLE']).optional(),
  orden: z.number().int().optional(),
  tiempoSegundos: z.number().int().positive().optional().nullable(),
  imagenUrl: z.string().url().optional().nullable(),
  activo: z.boolean().optional()
});

const reorderPreguntasSchema = z.object({
  orderedIds: z.array(z.string().uuid())
});

const createOpcionSchema = z.object({
  texto: z.string().min(1, 'El texto de la opción es requerido'),
  esCorrecta: z.boolean().default(false),
  orden: z.number().int().optional()
});

const updateOpcionSchema = createOpcionSchema.partial();

// ==========================================
// RESPUESTAS (KAHOOT)
// ==========================================

const registrarRespuestaSchema = z.object({
  preguntaId: z.string().uuid(),
  participanteId: z.string().uuid().optional(),
  nombreParticipante: z.string().min(1, 'El nombre es requerido'),
  opcionesSeleccionadas: z.array(z.string().uuid()),
  tiempoRespuestaMs: z.number().int().positive().optional()
});

// ==========================================
// ACTAS
// ==========================================

const createActaSchema = z.object({
  tiposReunion: z.array(z.enum([
    'COMITE', 'AUDITORIA', 'REUNION_INTERNA', 'CAPACITACION',
    'REUNION_PERSONAL', 'JUNTA_DIRECTIVA', 'REUNION_CLIENTE_PROVEEDOR',
    'VISITA_ENTES_REGULADORES', 'OTRO'
  ])).min(1, 'Seleccione al menos un tipo de reunión'),
  tipoOtro: z.string().optional(),
  objetivo: z.string().min(1, 'El objetivo es requerido'),
  fecha: z.string().transform(val => new Date(val)),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
  lugar: z.string().min(1, 'El lugar es requerido'),
  temasTratar: z.array(z.string()).optional(),
  compromisosAnteriores: z.array(z.object({
    descripcion: z.string(),
    cumplio: z.enum(['SI', 'NO', 'N/A']).optional()
  })).optional(),
  desarrolloReunion: z.string().optional(),
  analisisEvaluacion: z.any().optional(),
  informeAdherencia: z.string().optional(),
  compromisosSiguientes: z.array(z.object({
    descripcion: z.string(),
    encargado: z.string().optional(),
    fechaEntrega: z.string().optional()
  })).optional(),
  asistentes: z.array(z.object({
    personalId: z.string().uuid().optional(),
    nombreCompleto: z.string().min(1, 'El nombre es requerido'),
    cargo: z.string().optional(),
    firmaUrl: z.string().optional()
  })).optional()
});

const updateActaSchema = createActaSchema.partial();

const addAsistenteActaSchema = z.object({
  personalId: z.string().uuid().optional(),
  nombreCompleto: z.string().min(1, 'El nombre es requerido'),
  cargo: z.string().optional(),
  firmaUrl: z.string().optional()
});

const updateAsistenteActaSchema = z.object({
  nombreCompleto: z.string().min(1).optional(),
  cargo: z.string().optional().nullable(),
  firmaUrl: z.string().optional().nullable()
});

module.exports = {
  // Categorías
  createCategoriaCapacitacionSchema,
  updateCategoriaCapacitacionSchema,
  reorderCategoriasSchema,
  // Capacitaciones
  createCapacitacionSchema,
  updateCapacitacionSchema,
  // Sesiones
  createSesionSchema,
  updateSesionSchema,
  addAsistentesSchema,
  updateAsistenteSchema,
  marcarAsistenciaMasivaSchema,
  // Evaluaciones
  createEvaluacionSchema,
  updateEvaluacionSchema,
  createPreguntaSchema,
  updatePreguntaSchema,
  reorderPreguntasSchema,
  createOpcionSchema,
  updateOpcionSchema,
  // Respuestas
  registrarRespuestaSchema,
  // Actas
  createActaSchema,
  updateActaSchema,
  addAsistenteActaSchema,
  updateAsistenteActaSchema
};
