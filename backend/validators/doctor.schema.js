const { z } = require('zod');

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
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),

  // Arrays/Objects
  especialidades_ids: z.array(z.string().uuid('ID de especialidad inválido')).optional(),
  horarios: z.any().optional(), // Using z.any() for compatibility

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
  password: z.string().min(6).optional(),

  especialidades_ids: z.array(z.string().uuid()).optional(),
  horarios: z.any().optional(),

  activo: z.boolean().optional(),
});

module.exports = {
  doctorSchema,
  updateDoctorSchema
};
