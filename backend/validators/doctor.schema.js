const { z } = require('zod');

// Schema para un slot de horario (ej: { start: "08:00", end: "12:00" })
const slotSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)'),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)'),
}).refine(data => data.start < data.end, {
  message: 'La hora de inicio debe ser menor que la hora de fin',
});

// Schema para un día de horario (ej: { enabled: true, slots: [...] })
const dayScheduleSchema = z.object({
  enabled: z.boolean().default(false),
  slots: z.array(slotSchema).default([]),
}).optional();

// Schema para horarios completos
// Acepta claves de día de semana ("0"-"6") o fechas específicas ("YYYY-MM-DD")
const horariosSchema = z.record(
  z.string().regex(/^([0-6]|\d{4}-\d{2}-\d{2})$/, 'Clave inválida (debe ser 0-6 o fecha YYYY-MM-DD)'),
  z.array(z.object({
    inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)').optional(),
    fin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)').optional(),
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)').optional(),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)').optional(),
  })).optional()
).optional().nullable();

const doctorSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  cedula: z.string().min(5, 'La cédula es requerida'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(7, 'Teléfono inválido'),
  genero: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  direccion: z.string().optional(),

  // Doctor specific fields
  licencia_medica: z.string().optional(),
  universidad: z.string().optional(),
  anios_experiencia: z.union([z.string(), z.number()]).optional(),
  biografia: z.string().optional(),
  foto: z.string().optional(), // Base64 image or URL
  firma: z.string().nullable().optional(), // Firma digital en base64
  sello: z.string().nullable().optional(), // Sello médico en base64
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),

  // Arrays/Objects
  especialidades_ids: z.array(z.string().uuid('ID de especialidad inválido')).optional(),
  horarios: horariosSchema,

  activo: z.boolean().optional(),
});

// Explicit definition for update to avoid potential issues with .partial() in some Zod versions
const updateDoctorSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  cedula: z.string().min(5).optional(),
  email: z.string().email().optional(),
  telefono: z.string().min(7).optional(),
  genero: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  direccion: z.string().optional(),

  licencia_medica: z.string().optional(),
  universidad: z.string().optional(),
  anios_experiencia: z.union([z.string(), z.number()]).optional(),
  biografia: z.string().optional(),
  foto: z.string().nullable().optional(), // Base64 image, URL, or null to remove
  firma: z.string().nullable().optional(), // Firma digital en base64
  sello: z.string().nullable().optional(), // Sello médico en base64
  password: z.string().min(6).optional(),

  especialidades_ids: z.array(z.string().uuid()).optional(),
  horarios: horariosSchema,

  activo: z.boolean().optional(),
});

module.exports = {
  doctorSchema,
  updateDoctorSchema
};
