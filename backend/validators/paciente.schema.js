const { z } = require('zod');

// Helper para convertir strings vacíos a null
const emptyStringToNull = (val) => (val === '' || val === undefined ? null : val);

// Helper para parsear fechas, convirtiendo strings vacíos a null
const parseDate = (val) => {
  if (!val || val === '') return null;
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
};

// Helper para parsear números, convirtiendo strings vacíos a null
const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const contactoEmergenciaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de contacto es requerido'),
  telefono: z.string().min(1, 'El teléfono de contacto es requerido'),
  parentesco: z.string().optional().transform(emptyStringToNull),
});

const createPacienteSchema = z.object({
  // Datos Personales (requeridos)
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  tipo_documento: z.string().min(1, 'El tipo de documento es requerido'),
  cedula: z.string().min(3, 'El número de documento debe tener al menos 3 caracteres'),

  // Datos Personales (opcionales)
  fecha_nacimiento: z.string().optional().or(z.null()).transform(parseDate),
  genero: z.string().optional().or(z.null()).transform(emptyStringToNull),
  estado_civil: z.string().optional().or(z.null()).transform(emptyStringToNull),

  // Ubicación
  pais_nacimiento: z.string().optional().or(z.null()).transform(emptyStringToNull),
  departamento: z.string().optional().or(z.null()).transform(emptyStringToNull),
  municipio: z.string().optional().or(z.null()).transform(emptyStringToNull),
  barrio: z.string().optional().or(z.null()).transform(emptyStringToNull),
  direccion: z.string().optional().or(z.null()).transform(emptyStringToNull),

  // Contacto
  telefono: z.string().optional().or(z.null()).transform(emptyStringToNull),
  email: z.string().optional().or(z.null()).transform((val) => {
    if (!val || val === '') return null;
    // Validar email solo si hay valor
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val) ? val : null;
  }),

  // Contactos de Emergencia
  contactos_emergencia: z.array(contactoEmergenciaSchema).optional().or(z.null()),

  // Aseguramiento
  eps: z.string().optional().or(z.null()).transform(emptyStringToNull),
  regimen: z.string().optional().or(z.null()).transform(emptyStringToNull),
  tipo_afiliacion: z.string().optional().or(z.null()).transform(emptyStringToNull),
  nivel_sisben: z.string().optional().or(z.null()).transform(emptyStringToNull),
  numero_autorizacion: z.string().optional().or(z.null()).transform(emptyStringToNull),
  fecha_afiliacion: z.string().optional().or(z.null()).transform(parseDate),
  convenio: z.string().optional().or(z.null()).transform(emptyStringToNull),
  carnet_poliza: z.string().optional().or(z.null()).transform(emptyStringToNull),
  arl: z.string().optional().or(z.null()).transform(emptyStringToNull),

  // Información Demográfica y Laboral
  ocupacion: z.string().optional().or(z.null()).transform(emptyStringToNull),
  nivel_educacion: z.string().optional().or(z.null()).transform(emptyStringToNull),
  empleador_actual: z.string().optional().or(z.null()).transform(emptyStringToNull),
  tipo_usuario: z.string().optional().or(z.null()).transform(emptyStringToNull),

  // Información de Referencia
  referido_por: z.string().optional().or(z.null()).transform(emptyStringToNull),
  nombre_refiere: z.string().optional().or(z.null()).transform(emptyStringToNull),
  tipo_paciente: z.string().optional().or(z.null()).transform(emptyStringToNull),
  categoria: z.string().optional().or(z.null()).transform(emptyStringToNull),

  // Información Médica
  tipo_sangre: z.string().optional().or(z.null()).transform(emptyStringToNull),
  peso: z.any().optional().transform(parseNumber),
  altura: z.any().optional().transform(parseNumber),
  alergias: z.string().optional().or(z.null()).transform(emptyStringToNull),
  enfermedades_cronicas: z.string().optional().or(z.null()).transform(emptyStringToNull),
  medicamentos_actuales: z.string().optional().or(z.null()).transform(emptyStringToNull),
  antecedentes_quirurgicos: z.string().optional().or(z.null()).transform(emptyStringToNull),
});

const updatePacienteSchema = createPacienteSchema.partial();

module.exports = {
  createPacienteSchema,
  updatePacienteSchema,
};
