import { z } from 'zod';

// Helper para calcular edad
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

const contactoEmergenciaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  parentesco: z.string().min(1, 'El parentesco es requerido'),
});

const acompananteSchema = z.object({
  nombre: z.string().min(1, 'El nombre del acompañante es requerido'),
  telefono: z.string().min(1, 'El teléfono del acompañante es requerido'),
});

const responsableSchema = z.object({
  nombre: z.string().min(1, 'El nombre del responsable es requerido'),
  telefono: z.string().min(1, 'El teléfono del responsable es requerido'),
  parentesco: z.string().min(1, 'El parentesco del responsable es requerido'),
});

export const pacienteFormSchema = z.object({
  // Paso 1 - Información Básica (todos obligatorios)
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  tipoDocumento: z.string().min(1, 'Seleccione un tipo de documento'),
  cedula: z.string().min(3, 'Mínimo 3 caracteres'),
  lugarExpedicion: z.string().min(1, 'El lugar de expedición es requerido'),
  fechaNacimiento: z.string().min(1, 'Fecha requerida').refine((date) => new Date(date) < new Date(), {
    message: 'La fecha debe ser en el pasado',
  }),
  edad: z.number().optional(),
  genero: z.string().min(1, 'El género biológico es requerido'),
  identidadGenero: z.string().min(1, 'La identidad de género es requerida'),
  otraIdentidadGenero: z.string().optional(),
  etnia: z.string().min(1, 'La etnia es requerida'),
  preferenciaLlamado: z.string().min(1, 'La preferencia de llamado es requerida'),
  otroGenero: z.string().optional(),
  estadoCivil: z.string().min(1, 'El estado civil es requerido'),
  ocupacion: z.string().optional(),
  
  // Ubicación
  paisNacimiento: z.string().optional(),
  departamento: z.string().min(1, 'El departamento es requerido'),
  municipio: z.string().min(1, 'El municipio es requerido'),
  barrio: z.string().min(1, 'El barrio es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  zona: z.string().optional(),

  // Paso 2
  telefono: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().min(1, 'El correo es requerido').email('Email inválido'),
  contactosEmergencia: z.array(contactoEmergenciaSchema).min(1, 'Debe agregar al menos un contacto de emergencia'),
  acompanante: acompananteSchema,
  responsable: responsableSchema,
  nivelEducacion: z.string().min(1, 'El nivel de educación es requerido'),
  empleadorActual: z.string().optional(),

  // Paso 3 (Aseguramiento - obligatorios)
  eps: z.string().min(1, 'La EPS es requerida'),
  regimen: z.string().min(1, 'El régimen es requerido'),
  tipoAfiliacion: z.string().min(1, 'El tipo de afiliación es requerido'),
  nivelSisben: z.string().optional(),
  numeroAutorizacion: z.string().optional(),
  fechaAfiliacion: z.string().optional(),
  convenio: z.string().optional(),
  carnetPoliza: z.string().optional(),
  arl: z.string().optional(),
  tipoUsuario: z.string().optional(),

  // Paso 4 (Médica)
  referidoPor: z.string().optional(),
  nombreRefiere: z.string().optional(),
  tipoPaciente: z.string().optional(),
  categoria: z.string().optional(),
  tipoSangre: z.string().min(1, 'Seleccione tipo de sangre'),
  peso: z.string().optional(), // Input is text, convert later
  altura: z.string().optional(), // Input is text, convert later
  alergias: z.array(z.string()).default([]),
  enfermedadesCronicas: z.array(z.string()).default([]),
  medicamentosActuales: z.array(z.string()).default([]),
  antecedentesQuirurgicos: z.array(z.string()).default([]),
}).refine((data) => {
  // Validar que si género biológico es "Otro", se especifique
  if (data.genero === 'Otro' && !data.otroGenero) {
    return false;
  }
  return true;
}, {
  message: "Especifique el género",
  path: ["otroGenero"],
}).refine((data) => {
  // Validar que si identidad de género es "Otro", se especifique
  if (data.identidadGenero === 'Otro' && !data.otraIdentidadGenero) {
    return false;
  }
  return true;
}, {
  message: "Especifique la identidad de género",
  path: ["otraIdentidadGenero"],
}).refine((data) => {
  // Para menores de edad, el acompañante (contacto de emergencia) es obligatorio
  const edad = calcularEdad(data.fechaNacimiento);
  if (edad !== null && edad < 18) {
    // Verificar que tenga al menos un contacto de emergencia completo
    const contactosValidos = data.contactosEmergencia?.filter(
      c => c.nombre && c.telefono && c.parentesco
    ) || [];
    return contactosValidos.length > 0;
  }
  return true;
}, {
  message: "Para pacientes menores de edad, debe registrar un acompañante (contacto de emergencia completo con nombre, teléfono y parentesco)",
  path: ["contactosEmergencia"],
});
