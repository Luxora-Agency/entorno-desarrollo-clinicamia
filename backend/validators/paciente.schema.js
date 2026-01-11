const { z } = require('zod');

const contactoEmergenciaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de contacto es requerido'),
  telefono: z.string().min(1, 'El teléfono de contacto es requerido'),
  parentesco: z.string().min(1, 'El parentesco es requerido'),
});

const createPacienteSchema = z.object({
  // Datos Personales
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  tipo_documento: z.string().min(1, 'El tipo de documento es requerido'),
  cedula: z.string().min(3, 'El número de documento debe tener al menos 3 caracteres'),
  fecha_nacimiento: z.string().optional().or(z.null()).transform((val) => val ? new Date(val) : null),
  genero: z.string().optional().or(z.null()),
  estado_civil: z.string().optional().or(z.null()),

  // Ubicación
  pais_nacimiento: z.string().optional().or(z.null()),
  departamento: z.string().optional().or(z.null()),
  municipio: z.string().optional().or(z.null()),
  barrio: z.string().optional().or(z.null()),
  direccion: z.string().optional().or(z.null()),

  // Contacto
  telefono: z.string().optional().or(z.null()),
  email: z.string().email('Email inválido').optional().or(z.literal('')).or(z.null()),

  // Contactos de Emergencia
  contactos_emergencia: z.array(contactoEmergenciaSchema).optional().or(z.null()),

  // Aseguramiento
  eps: z.string().optional().or(z.null()),
  regimen: z.string().optional().or(z.null()),
  tipo_afiliacion: z.string().optional().or(z.null()),
  nivel_sisben: z.string().optional().or(z.null()),
  numero_autorizacion: z.string().optional().or(z.null()),
  fecha_afiliacion: z.string().optional().or(z.null()).transform((val) => val ? new Date(val) : null),
  convenio: z.string().optional().or(z.null()),
  carnet_poliza: z.string().optional().or(z.null()),
  arl: z.string().optional().or(z.null()),

  // Información Demográfica y Laboral
  ocupacion: z.string().optional().or(z.null()),
  nivel_educacion: z.string().optional().or(z.null()),
  empleador_actual: z.string().optional().or(z.null()),
  tipo_usuario: z.string().optional().or(z.null()),

  // Información de Referencia
  referido_por: z.string().optional().or(z.null()),
  nombre_refiere: z.string().optional().or(z.null()),
  tipo_paciente: z.string().optional().or(z.null()),
  categoria: z.string().optional().or(z.null()),

  // Información Médica
  tipo_sangre: z.string().optional().or(z.null()),
  peso: z.number().or(z.string().transform(val => parseFloat(val))).optional().or(z.null()),
  altura: z.number().or(z.string().transform(val => parseFloat(val))).optional().or(z.null()),
  alergias: z.string().optional().or(z.null()),
  enfermedades_cronicas: z.string().optional().or(z.null()),
  medicamentos_actuales: z.string().optional().or(z.null()),
  antecedentes_quirurgicos: z.string().optional().or(z.null()),
});

const updatePacienteSchema = createPacienteSchema.partial();

module.exports = {
  createPacienteSchema,
  updatePacienteSchema,
};
