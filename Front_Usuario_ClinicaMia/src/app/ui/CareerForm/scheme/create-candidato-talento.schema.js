import { z } from "zod"

// Helper to convert empty strings to undefined (for required fields)
const requiredString = (minLength, maxLength, message) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string({ required_error: message }).min(minLength, message).max(maxLength)
  );

// Helper for required enums - converts empty string to undefined so Zod shows proper error
// Note: z.enum() doesn't support required_error/invalid_type_error with errorMap, so we use only errorMap
const requiredEnum = (values, errorMessage) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.enum(values, {
      errorMap: () => ({ message: errorMessage }),
    })
  );

// Helper for optional fields - converts empty strings to undefined
const optionalString = (maxLength) =>
  z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(maxLength).optional()
  );

// Helper for optional enums
const optionalEnum = (values, errorMessage) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.enum(values, { errorMap: () => ({ message: errorMessage }) }).optional()
  );

const languageSkillSchema = z.object({
  language: z.string().min(2, 'El idioma debe tener al menos 2 caracteres'),
  level: z.enum(['basic', 'intermediate', 'advanced', 'native'], {
    errorMap: () => ({ message: 'Nivel de idioma inválido' }),
  }),
});

// Professional reference schema
const professionalReferenceSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  position: z.string().min(2, 'El cargo debe tener al menos 2 caracteres'),
  institution: z.string().min(2, 'La institución debe tener al menos 2 caracteres'),
  phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, 'Formato de teléfono inválido'),
  email: z.string().email('Correo electrónico inválido'),
  relationship: z.string().min(2, 'La relación debe tener al menos 2 caracteres'),
});

/**
 * Create Candidate Schema
 * All required fields use preprocess to convert empty strings to undefined
 * This ensures proper validation errors when fields are empty
 */
export const createCandidateSchema = z.object({
  // Personal Information - ALL REQUIRED
  firstName: requiredString(2, 100, 'El nombre es requerido (mínimo 2 caracteres)'),
  lastName: requiredString(2, 100, 'El apellido es requerido (mínimo 2 caracteres)'),
  documentType: requiredEnum(['CC', 'CE', 'PA', 'TI'], 'Seleccione un tipo de documento válido'),
  documentNumber: requiredString(5, 50, 'El número de documento es requerido (mínimo 5 caracteres)'),
  birthDate: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string({ required_error: 'La fecha de nacimiento es requerida' })
      .refine((date) => !isNaN(new Date(date).getTime()), 'Fecha de nacimiento inválida')
  ),
  gender: requiredEnum(['male', 'female', 'other', 'prefer_not_to_say'], 'Seleccione un género'),
  maritalStatus: requiredEnum(['single', 'married', 'common_law', 'divorced', 'widowed'], 'Seleccione un estado civil'),
  nationality: requiredString(2, 100, 'La nacionalidad es requerida'),

  // Contact Information - REQUIRED (except landlinePhone and alternativeEmail)
  mobilePhone: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string({ required_error: 'El teléfono móvil es requerido' })
      .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Formato de teléfono móvil inválido')
  ),
  landlinePhone: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, 'Formato de teléfono fijo inválido').optional()
  ),
  email: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string({ required_error: 'El correo electrónico es requerido' })
      .email('Correo electrónico inválido').max(255)
  ),
  alternativeEmail: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().email('Correo electrónico alternativo inválido').max(255).optional()
  ),
  residenceAddress: requiredString(10, 500, 'La dirección es requerida (mínimo 10 caracteres)'),
  city: requiredString(2, 100, 'La ciudad es requerida'),
  department: requiredString(2, 100, 'El departamento es requerido'),
  country: requiredString(2, 100, 'El país es requerido'),

  // Professional Information - REQUIRED
  profession: requiredString(2, 150, 'La profesión es requerida'),
  specialty: optionalString(150),
  subspecialty: optionalString(150),
  professionalLicenseNumber: optionalString(100),
  medicalRegistryNumber: optionalString(100),
  educationInstitution: requiredString(2, 200, 'La institución educativa es requerida'),
  educationCountry: requiredString(2, 100, 'El país de formación es requerido'),
  graduationYear: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number({ required_error: 'El año de graduación es requerido', invalid_type_error: 'El año debe ser un número' })
      .int()
      .min(1950, 'Año de graduación inválido')
      .max(new Date().getFullYear(), `El año no puede ser mayor a ${new Date().getFullYear()}`)
  ),

  // Work Experience - REQUIRED
  yearsOfExperience: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number({ required_error: 'Los años de experiencia son requeridos', invalid_type_error: 'Debe ser un número' })
      .int()
      .min(0, 'Los años de experiencia no pueden ser negativos')
      .max(70)
  ),
  previousExperience: optionalString(2000),
  previousInstitutions: z.array(z.string().max(200)).optional().default([]),
  currentPosition: optionalString(150),
  currentInstitution: optionalString(200),
  currentlyEmployed: z.boolean().optional().default(false),
  immediateAvailability: z.boolean().optional().default(false),

  // Additional Information - OPTIONAL
  areasOfInterest: z.array(z.string().max(150)).optional().default([]),
  preferredModality: optionalEnum(['on_site', 'remote', 'hybrid', 'indifferent'], 'Modalidad de trabajo inválida'),
  preferredContractType: optionalEnum(['full_time', 'part_time', 'hourly', 'service_contract', 'indifferent'], 'Tipo de contrato inválido'),
  salaryExpectation: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || val === 0 ? undefined : Number(val)),
    z.number().min(0, 'La expectativa salarial no puede ser negativa').optional()
  ),
  scheduleAvailability: optionalString(500),
  availableShifts: z.array(z.enum(['morning', 'afternoon', 'night', 'weekend'])).optional().default([]),

  // Languages
  languages: z.array(languageSkillSchema).optional().default([]),

  // Professional References
  references: z.array(professionalReferenceSchema).optional().default([]),

  // Additional Application Details - OPTIONAL
  howDidYouHear: optionalString(500),
  motivation: optionalString(2000),
  professionalExpectations: optionalString(2000),
  willingToTravel: z.boolean().optional().default(false),
  willingToRelocate: z.boolean().optional().default(false),
  hasOwnVehicle: z.boolean().optional().default(false),
  driverLicense: optionalString(50),

  // Document uploads
  documentIds: z.array(z.string()).optional().default([]),
});
