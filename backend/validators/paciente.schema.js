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

// Acompañante es opcional para mayores de edad, obligatorio para menores (validado en servicio)
const acompananteSchema = z.object({
  nombre: z.string().optional().default(''),
  telefono: z.string().optional().default(''),
}).optional().or(z.null());

// Responsable es opcional para mayores de edad, obligatorio para menores (validado en servicio)
const responsableSchema = z.object({
  nombre: z.string().optional().default(''),
  telefono: z.string().optional().default(''),
  parentesco: z.string().optional().default(''),
}).optional().or(z.null());

const createPacienteSchema = z.object({
  // Datos Personales (requeridos)
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  tipo_documento: z.string().min(1, 'El tipo de documento es requerido'),
  cedula: z.string().min(3, 'El número de documento debe tener al menos 3 caracteres'),
  lugar_expedicion: z.string().min(1, 'El lugar de expedición es requerido'),

  // Datos Personales (requeridos)
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida').transform(parseDate),
  genero: z.string().min(1, 'El género biológico es requerido'),
  identidad_genero: z.string().min(1, 'La identidad de género es requerida'),
  etnia: z.string().min(1, 'La etnia es requerida'),
  preferencia_llamado: z.string().min(1, 'La preferencia de llamado es requerida'),
  estado_civil: z.string().min(1, 'El estado civil es requerido'),

  // Ubicación (requeridos)
  pais_nacimiento: z.string().optional().or(z.null()).transform(emptyStringToNull),
  departamento: z.string().min(1, 'El departamento es requerido'),
  municipio: z.string().min(1, 'El municipio es requerido'),
  barrio: z.string().min(1, 'El barrio es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  zona: z.string().min(1, 'La zona es requerida'),

  // Contacto (requeridos)
  telefono: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().min(1, 'El correo es requerido').email('Email inválido'),

  // Contactos de Emergencia (requerido al menos uno)
  contactos_emergencia: z.array(contactoEmergenciaSchema).min(1, 'Debe agregar al menos un contacto de emergencia'),

  // Acompañante y Responsable (opcionales para mayores, requeridos para menores - validado en servicio)
  acompanante: acompananteSchema,
  responsable: responsableSchema,

  // Aseguramiento (requeridos)
  eps: z.string().min(1, 'La EPS es requerida'),
  regimen: z.string().min(1, 'El régimen es requerido'),
  tipo_afiliacion: z.string().min(1, 'El tipo de afiliación es requerido'),
  nivel_sisben: z.string().optional().or(z.null()).transform(emptyStringToNull),
  numero_autorizacion: z.string().optional().or(z.null()).transform(emptyStringToNull),
  fecha_afiliacion: z.string().optional().or(z.null()).transform(parseDate),
  convenio: z.string().optional().or(z.null()).transform(emptyStringToNull),
  carnet_poliza: z.string().optional().or(z.null()).transform(emptyStringToNull),
  arl: z.string().optional().or(z.null()).transform(emptyStringToNull),

  // Información Demográfica y Laboral
  ocupacion: z.string().min(1, 'La ocupación es requerida'),
  nivel_educacion: z.string().min(1, 'El nivel de educación es requerido'),
  empleador_actual: z.string().optional().or(z.null()).transform(emptyStringToNull),
  tipo_usuario: z.string().optional().or(z.null()).transform(emptyStringToNull),

  // Información de Referencia
  referido_por: z.string().optional().or(z.null()).transform(emptyStringToNull),
  nombre_refiere: z.string().optional().or(z.null()).transform(emptyStringToNull),
  tipo_paciente: z.string().optional().or(z.null()).transform(emptyStringToNull),
  categoria: z.string().optional().or(z.null()).transform(emptyStringToNull),

  // Discapacidad (requerido indicar si aplica o no)
  discapacidad: z.string().min(1, 'Debe indicar si tiene discapacidad'),
  tipo_discapacidad: z.string().optional().or(z.null()).transform(emptyStringToNull),

  // Información Médica (requeridos)
  tipo_sangre: z.string().min(1, 'El tipo de sangre es requerido'),
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
