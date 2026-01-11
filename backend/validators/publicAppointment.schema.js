/**
 * Validation schema for public appointment creation
 *
 * Used for patient self-scheduling (no authentication required)
 */

const { z } = require('zod');

// Colombian phone number regex (10 digits starting with 3)
const colombianPhoneRegex = /^3[0-9]{9}$/;

// Document types for Colombian identification
const documentTypes = ['CC', 'CE', 'TI', 'PA', 'RC', 'NIT'];

const createPublicAppointmentSchema = z.object({
  // Patient data
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'El apellido no puede exceder 100 caracteres'),

  tipo_documento: z.enum(documentTypes, {
    errorMap: () => ({ message: 'Tipo de documento inválido' }),
  }).default('CC'),

  documento: z
    .string()
    .min(5, 'El documento debe tener al menos 5 caracteres')
    .max(20, 'El documento no puede exceder 20 caracteres'),

  telefono: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(15, 'El teléfono no puede exceder 15 dígitos'),

  email: z
    .string()
    .email('Correo electrónico inválido')
    .optional()
    .nullable(),

  genero: z.enum(['Masculino', 'Femenino', 'Otro']).optional().nullable(),

  fecha_nacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .optional()
    .nullable(),

  // Appointment data
  especialidad_id: z
    .string()
    .uuid('ID de especialidad inválido'),

  doctor_id: z
    .string()
    .uuid('ID de doctor inválido'),

  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),

  hora: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),

  motivo: z
    .string()
    .max(500, 'El motivo no puede exceder 500 caracteres')
    .optional()
    .nullable(),
});

module.exports = {
  createPublicAppointmentSchema,
};
