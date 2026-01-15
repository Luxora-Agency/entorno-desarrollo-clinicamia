const { z } = require('zod');

// Base schema without refinements (for use with .partial())
const baseCitaSchema = z.object({
  paciente_id: z.string().uuid({ message: 'ID de paciente inválido' }),
  doctor_id: z.string().uuid({ message: 'ID de doctor inválido' }).optional().nullable(),
  especialidad_id: z.string().uuid({ message: 'ID de especialidad inválido' }).optional().nullable(),
  examen_procedimiento_id: z.string().uuid({ message: 'ID de examen/procedimiento inválido' }).optional().nullable(),
  admision_id: z.string().uuid({ message: 'ID de admisión inválido' }).optional().nullable(),

  tipo_cita: z.enum(['Especialidad', 'Examen', 'Procedimiento', 'Interconsulta']).default('Especialidad'),

  fecha: z.string().optional().nullable(), // Puede ser null si es PorAgendar
  hora: z.string().optional().nullable(), // HH:mm format expected

  duracion_minutos: z.number().int().positive().default(30),
  costo: z.number().min(0, { message: 'El costo no puede ser negativo' }),

  motivo: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),

  estado: z.enum([
    'PorAgendar', 'PendientePago', 'Programada', 'Confirmada', 'EnEspera',
    'Atendiendo', 'Completada', 'Cancelada', 'NoAsistio'
  ]).default('Programada'),

  prioridad: z.enum(['Baja', 'Media', 'Alta', 'Urgente']).default('Media'),

  // Campos para facturación automática
  metodo_pago: z.enum(['Efectivo', 'Tarjeta', 'Transferencia', 'EPS', 'Otro']).optional(),
  estado_pago: z.enum(['Pendiente', 'Parcial', 'Pagado', 'Cancelado', 'Vencida']).optional(),
  cubierto_por_eps: z.boolean().optional(),

  // Campos para citas de emergencia
  es_emergencia: z.boolean().default(false),
  motivo_emergencia: z.string().max(500, { message: 'El motivo de emergencia no puede exceder 500 caracteres' }).optional().nullable(),
});

// Create schema with refinements
const createCitaSchema = baseCitaSchema.refine(data => {
  // Las citas de emergencia no requieren fecha/hora
  if (data.es_emergencia) {
    return true;
  }
  // Para citas normales no PorAgendar, fecha y hora son requeridas
  if (data.estado !== 'PorAgendar') {
    return !!data.fecha && !!data.hora;
  }
  return true;
}, {
  message: "Fecha y hora son requeridas para citas programadas (excepto emergencias)",
  path: ["fecha"]
}).refine(data => {
  // Si es emergencia, debe tener un motivo de emergencia
  if (data.es_emergencia && !data.motivo_emergencia) {
    return false;
  }
  return true;
}, {
  message: "El motivo de emergencia es requerido para citas de emergencia",
  path: ["motivo_emergencia"]
});

// Update schema - use base schema (without refinements) with .partial()
const updateCitaSchema = baseCitaSchema.partial();

const estadoCitaSchema = z.object({
  estado: z.enum([
    'PorAgendar', 'PendientePago', 'Programada', 'Confirmada', 'EnEspera',
    'Atendiendo', 'Completada', 'Cancelada', 'NoAsistio'
  ])
});

module.exports = {
  createCitaSchema,
  updateCitaSchema,
  estadoCitaSchema
};
