const { z } = require('zod');

// ==========================================
// CARPETAS
// ==========================================

const createCarpetaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(255),
  descripcion: z.string().optional(),
  tipo: z.enum(['INSCRIPCION', 'PROCESOS', 'CAPACIDAD', 'PERSONAL', 'PROCESOS_INFRAESTRUCTURA']),
  parentId: z.string().uuid().optional().nullable(),
  orden: z.number().int().optional(),
});

const updateCarpetaSchema = createCarpetaSchema.partial();

// ==========================================
// DOCUMENTOS
// ==========================================

const createDocumentoSchema = z.object({
  nombre: z.string().max(255).optional(),
  descripcion: z.string().optional(),
  carpetaId: z.string().uuid().optional().nullable(),
  tipo: z.enum(['INSCRIPCION', 'PROCESOS', 'CAPACIDAD', 'PERSONAL', 'PROCESOS_INFRAESTRUCTURA']).optional(),
});

const updateDocumentoSchema = z.object({
  nombre: z.string().max(255).optional(),
  descripcion: z.string().optional(),
});

const moverDocumentoSchema = z.object({
  carpetaId: z.string().uuid().optional().nullable(),
});

// ==========================================
// PERSONAL
// ==========================================

const createPersonalSchema = z.object({
  tipoDocumento: z.string().min(1, 'El tipo de documento es requerido'),
  numeroDocumento: z.string().min(1, 'El número de documento es requerido'),
  nombreCompleto: z.string().min(1, 'El nombre completo es requerido'),
  cargo: z.string().min(1, 'El cargo es requerido'),
  tipoPersonal: z.enum(['MEDICO', 'ENFERMERIA', 'ADMINISTRATIVO', 'ASISTENCIAL', 'TECNICO', 'OTRO']),
  correo: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  tipoContrato: z.enum(['INDEFINIDO', 'FIJO', 'OBRA_LABOR', 'PRESTACION_SERVICIOS', 'APRENDIZAJE', 'OTRO']),
  fechaIngreso: z.string().datetime().optional().nullable(),
  usuarioId: z.string().uuid().optional().nullable(),
});

const updatePersonalSchema = z.object({
  nombreCompleto: z.string().min(1).optional(),
  cargo: z.string().min(1).optional(),
  tipoPersonal: z.enum(['MEDICO', 'ENFERMERIA', 'ADMINISTRATIVO', 'ASISTENCIAL', 'TECNICO', 'OTRO']).optional(),
  correo: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  tipoContrato: z.enum(['INDEFINIDO', 'FIJO', 'OBRA_LABOR', 'PRESTACION_SERVICIOS', 'APRENDIZAJE', 'OTRO']).optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'RETIRADO', 'SUSPENDIDO']).optional(),
  fechaIngreso: z.string().datetime().optional().nullable(),
  fechaRetiro: z.string().datetime().optional().nullable(),
  usuarioId: z.string().uuid().optional().nullable(),
});

const createFromCandidatoSchema = z.object({
  cargo: z.string().optional(),
  tipoPersonal: z.enum(['MEDICO', 'ENFERMERIA', 'ADMINISTRATIVO', 'ASISTENCIAL', 'TECNICO', 'OTRO']).optional(),
  tipoContrato: z.enum(['INDEFINIDO', 'FIJO', 'OBRA_LABOR', 'PRESTACION_SERVICIOS', 'APRENDIZAJE', 'OTRO']).optional(),
  fechaIngreso: z.string().datetime().optional(),
  usuarioId: z.string().uuid().optional().nullable(),
});

// ==========================================
// DOCUMENTOS DE PERSONAL
// ==========================================

const uploadDocumentoPersonalSchema = z.object({
  nombre: z.string().max(255).optional(),
  checklistItemId: z.string().uuid().optional().nullable(),
  fechaEmision: z.string().datetime().optional().nullable(),
  fechaVencimiento: z.string().datetime().optional().nullable(),
});

// ==========================================
// CHECKLIST
// ==========================================

const createChecklistTemplateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(255),
  descripcion: z.string().optional(),
  tipoEntidad: z.enum(['PERSONAL', 'INSCRIPCION', 'PROCESOS', 'CAPACIDAD']),
  categoria: z.string().optional(),
  orden: z.number().int().optional(),
});

const updateChecklistTemplateSchema = createChecklistTemplateSchema.partial().extend({
  activo: z.boolean().optional(),
});

const createChecklistItemSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(255),
  descripcion: z.string().optional(),
  categoria: z.string().optional(),
  esObligatorio: z.boolean().optional().default(true),
  requiereVencimiento: z.boolean().optional().default(false),
  diasAlertaVencimiento: z.number().int().optional().nullable(),
  permiteMultiplesArchivos: z.boolean().optional().default(false),
  orden: z.number().int().optional(),
});

const updateChecklistItemSchema = createChecklistItemSchema.partial().extend({
  activo: z.boolean().optional(),
});

const updateEstadoChecklistSchema = z.object({
  cumple: z.boolean(),
  observaciones: z.string().optional().nullable(),
});

// ==========================================
// CAPACIDAD INSTALADA
// ==========================================

const createCapacidadSchema = z.object({
  servicio: z.string().min(1, 'El servicio es requerido'),
  profesional: z.string().min(1, 'El profesional es requerido'),
  ambientes: z.string().optional(),
  numeroEquiposAmbiente: z.number().int().min(1, 'Debe tener al menos 1 equipo'),
  duracionPromedioMinutos: z.number().int().min(1, 'La duración debe ser mayor a 0'),
});

const updateCapacidadSchema = createCapacidadSchema.partial();

// ==========================================
// OFERTA
// ==========================================

const createOfertaSchema = z.object({
  servicio: z.string().min(1, 'El servicio es requerido'),
  profesionalCargo: z.string().min(1, 'El cargo es requerido'),
  numeroProfesionales: z.number().int().min(1),
  horasTrabajoSemana: z.number().int().min(1),
  tiempoPorActividadMin: z.number().int().min(1),
  pacientesAtendidosSemana: z.number().int().optional().nullable(),
});

const updateOfertaSchema = createOfertaSchema.partial();

// ==========================================
// RESUMEN MENSUAL
// ==========================================

const saveResumenSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
  totalPacientesTalentoHumano: z.number().int().optional().nullable(),
  totalPacientesAtendidosMesAnterior: z.number().int().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

// ==========================================
// QUERIES
// ==========================================

const queryPaginationSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('20'),
  search: z.string().optional(),
  activo: z.string().optional(),
});

const queryPersonalSchema = queryPaginationSchema.extend({
  tipoPersonal: z.enum(['MEDICO', 'ENFERMERIA', 'ADMINISTRATIVO', 'ASISTENCIAL', 'TECNICO', 'OTRO']).optional(),
  tipoContrato: z.enum(['INDEFINIDO', 'FIJO', 'OBRA_LABOR', 'PRESTACION_SERVICIOS', 'APRENDIZAJE', 'OTRO']).optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'RETIRADO', 'SUSPENDIDO']).optional(),
});

const queryAlertasSchema = queryPaginationSchema.extend({
  tipo: z.enum(['DOCUMENTO_VENCIDO', 'DOCUMENTO_POR_VENCER', 'CHECKLIST_INCOMPLETO', 'CAPACITACION_PENDIENTE']).optional(),
  estado: z.enum(['PENDIENTE', 'ATENDIDA', 'DESCARTADA']).optional(),
  entidadTipo: z.string().optional(),
});

module.exports = {
  // Carpetas
  createCarpetaSchema,
  updateCarpetaSchema,
  // Documentos
  createDocumentoSchema,
  updateDocumentoSchema,
  moverDocumentoSchema,
  // Personal
  createPersonalSchema,
  updatePersonalSchema,
  createFromCandidatoSchema,
  uploadDocumentoPersonalSchema,
  // Checklist
  createChecklistTemplateSchema,
  updateChecklistTemplateSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
  updateEstadoChecklistSchema,
  // Capacidad
  createCapacidadSchema,
  updateCapacidadSchema,
  // Oferta
  createOfertaSchema,
  updateOfertaSchema,
  // Resumen
  saveResumenSchema,
  // Queries
  queryPaginationSchema,
  queryPersonalSchema,
  queryAlertasSchema,
};
