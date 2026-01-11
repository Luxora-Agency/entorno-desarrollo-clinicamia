import { z } from 'zod';

const contactoEmergenciaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  parentesco: z.string().min(1, 'El parentesco es requerido'),
});

export const pacienteFormSchema = z.object({
  // Paso 1
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  tipoDocumento: z.string().min(1, 'Seleccione un tipo de documento'),
  cedula: z.string().min(3, 'Mínimo 3 caracteres'),
  fechaNacimiento: z.string().min(1, 'Fecha requerida').refine((date) => new Date(date) < new Date(), {
    message: 'La fecha debe ser en el pasado',
  }),
  genero: z.string().optional(),
  otroGenero: z.string().optional(),
  estadoCivil: z.string().optional(),
  ocupacion: z.string().optional(),
  
  // Ubicación
  paisNacimiento: z.string().optional(),
  departamento: z.string().min(1, 'El departamento es requerido'),
  municipio: z.string().min(1, 'El municipio es requerido'),
  barrio: z.string().min(1, 'El barrio es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),

  // Paso 2
  telefono: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().email('Email inválido').or(z.literal('')),
  contactosEmergencia: z.array(contactoEmergenciaSchema).min(1, 'Debe agregar al menos un contacto de emergencia'),
  nivelEducacion: z.string().optional(),
  empleadorActual: z.string().optional(),

  // Paso 3 (Aseguramiento)
  eps: z.string().optional(),
  regimen: z.string().optional(),
  tipoAfiliacion: z.string().optional(),
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
  if (data.genero === 'Otro' && !data.otroGenero) {
    return false;
  }
  return true;
}, {
  message: "Especifique el género",
  path: ["otroGenero"],
});
