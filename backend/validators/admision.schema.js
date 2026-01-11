const { z } = require('zod');

const createAdmisionSchema = z.object({
  pacienteId: z.string().uuid({ message: 'ID de paciente inválido' }),
  unidadId: z.string().uuid({ message: 'ID de unidad inválido' }),
  camaId: z.string().uuid({ message: 'ID de cama inválido' }).optional().or(z.null()),
  motivoIngreso: z.string().min(1, { message: 'El motivo de ingreso es requerido' }),
  diagnosticoIngreso: z.string().min(1, { message: 'El diagnóstico de ingreso es requerido' }),
  observaciones: z.string().optional().or(z.null()),
  responsableIngreso: z.string().uuid({ message: 'ID de responsable inválido' }).optional(),
});

const egresoAdmisionSchema = z.object({
  fecha_egreso: z.string().datetime().optional().or(z.null()),
  diagnostico_salida: z.string().min(1, { message: 'El diagnóstico de salida es requerido' }),
  descripcion_diagnostico: z.string().min(1, { message: 'La descripción del diagnóstico es requerida' }),
  resumen_clinico: z.string().min(1, { message: 'El resumen clínico es requerido' }),
  tratamiento_domiciliario: z.string().optional().or(z.null()),
  recomendaciones: z.string().optional().or(z.null()),
  tipo_egreso: z.enum(['AltaMedica', 'Remision', 'Voluntario', 'Fallecimiento', 'Fuga']),
  estado_paciente: z.enum(['Mejorado', 'Estable', 'Complicado', 'Fallecido']),
  requiere_control: z.boolean().optional().or(z.null()),
  fecha_control: z.string().optional().or(z.null()),
  observaciones: z.string().optional().or(z.null()),
  profesional_responsable_id: z.string().uuid({ message: 'ID de profesional responsable inválido' }),
});

module.exports = {
  createAdmisionSchema,
  egresoAdmisionSchema,
};
