const { z } = require('zod');

// ========================================
// PROTOCOLOS
// ========================================

const createProtocoloSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.enum(['PROGRAMA', 'PROCEDIMIENTO', 'PROTOCOLO', 'POLITICA', 'MANUAL'], {
    errorMap: () => ({ message: 'Tipo de protocolo inválido' }),
  }),
  version: z.string().min(1, 'La versión es requerida'),
  fechaEmision: z.string().transform(val => new Date(val)),
  fechaVigencia: z.string().transform(val => new Date(val)),
  descripcion: z.string().optional(),
  alcance: z.string().optional(),
  responsable: z.string().min(1, 'El responsable es requerido'),
  proximaRevision: z.string().optional().transform(val => val ? new Date(val) : null),
});

const updateProtocoloSchema = createProtocoloSchema.partial();

// ========================================
// FARMACOVIGILANCIA
// ========================================

const createReporteFarmacoSchema = z.object({
  pacienteId: z.string().uuid('ID de paciente inválido'),
  tipoReporte: z.string().min(1, 'El tipo de reporte es requerido'),
  medicamento: z.string().min(1, 'El medicamento es requerido'),
  lote: z.string().optional(),
  fechaCaducidad: z.string().optional().transform(val => val ? new Date(val) : null),
  laboratorio: z.string().optional(),
  fechaEvento: z.string().transform(val => new Date(val)),
  descripcionReaccion: z.string().min(1, 'La descripción de la reacción es requerida'),
  gravedadReaccion: z.enum(['Leve', 'Moderada', 'Grave', 'Mortal'], {
    errorMap: () => ({ message: 'Gravedad de reacción inválida' }),
  }),
  indicacion: z.string().optional(),
  causalidad: z.enum(['POSIBLE', 'PROBABLE', 'DEFINITIVA', 'NO_RELACIONADA']).optional(),
  desenlace: z.string().optional(),
  accionesTomadas: z.string().optional(),
  observaciones: z.string().optional(),
  numeroReporteINVIMA: z.string().optional(),
  fechaReporteINVIMA: z.string().optional().transform(val => val ? new Date(val) : null),
  estado: z.enum(['BORRADOR', 'ENVIADO', 'REPORTADO_INVIMA', 'CERRADO']).optional(),
});

const updateReporteFarmacoSchema = createReporteFarmacoSchema.partial();

// ========================================
// TECNOVIGILANCIA
// ========================================

const createReporteTecnoSchema = z.object({
  pacienteId: z.string().uuid('ID de paciente inválido'),
  dispositivoMedico: z.string().min(1, 'El dispositivo médico es requerido'),
  fabricante: z.string().optional().or(z.literal('')),
  modelo: z.string().optional().or(z.literal('')),
  numeroSerie: z.string().optional().or(z.literal('')),
  lote: z.string().optional().or(z.literal('')),
  registroSanitario: z.string().optional().or(z.literal('')),
  fechaEvento: z.string().transform(val => new Date(val)),
  descripcionEvento: z.string().min(1, 'La descripción del evento es requerida'),
  clasificacion: z.string().min(1, 'La clasificación es requerida'),
  tipoEvento: z.enum(['LESION', 'MUERTE', 'FALLA_DISPOSITIVO', 'USO_INADECUADO']).optional().or(z.literal('')),
  gravedadEvento: z.enum(['LEVE', 'MODERADA', 'GRAVE', 'MORTAL']).optional().or(z.literal('')),
  desenlace: z.string().optional().or(z.literal('')),
  accionesTomadas: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional().or(z.literal('')),
  numeroReporteINVIMA: z.string().optional().or(z.literal('')),
  fechaReporteINVIMA: z.string().optional().or(z.literal('')).transform(val => val ? new Date(val) : null),
  estado: z.enum(['BORRADOR', 'ENVIADO', 'REPORTADO_INVIMA', 'CERRADO']).optional().or(z.literal('')),
});

const updateReporteTecnoSchema = createReporteTecnoSchema.partial();

// ========================================
// INVENTARIO
// ========================================

const createInventarioSchema = z.object({
  tipo: z.enum(['MEDICAMENTO', 'DISPOSITIVO_MEDICO', 'INSUMO_MEDICO_QUIRURGICO'], {
    errorMap: () => ({ message: 'Tipo de inventario inválido' }),
  }),
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),

  // Para medicamentos
  principioActivo: z.string().optional(),
  concentracion: z.string().optional(),
  formaFarmaceutica: z.string().optional(),
  via: z.string().optional(),

  // Para dispositivos
  clasificacionRiesgo: z.string().optional(),

  // Información regulatoria
  registroSanitario: z.string().optional(),
  laboratorio: z.string().optional(),
  fabricante: z.string().optional(),

  // Control de stock
  lote: z.string().min(1, 'El lote es requerido'),
  fechaVencimiento: z.string().transform(val => new Date(val)),
  cantidadActual: z.number().positive('La cantidad debe ser mayor a 0'),
  unidadMedida: z.string().min(1, 'La unidad de medida es requerida'),
  stockMinimo: z.number().optional(),
  stockMaximo: z.number().optional(),

  // Ubicación
  ubicacionFisica: z.string().optional(),
});

const updateInventarioSchema = createInventarioSchema.partial();

// ========================================
// TEMPERATURA Y HUMEDAD
// ========================================

const createTemperaturaSchema = z.object({
  fecha: z.string().transform(val => new Date(val)),
  hora: z.number().int().min(0).max(23, 'La hora debe estar entre 0 y 23'),
  area: z.string().min(1, 'El área es requerida'),
  temperatura: z.number(),
  humedad: z.number().min(0).max(100, 'La humedad debe estar entre 0 y 100'),
  temperaturaMin: z.number(),
  temperaturaMax: z.number(),
  humedadMin: z.number().min(0).max(100),
  humedadMax: z.number().min(0).max(100),
  accionCorrectiva: z.string().optional(),
  responsableAccion: z.string().optional(),
});

const updateTemperaturaSchema = createTemperaturaSchema.partial();

// ========================================
// FORMATOS
// ========================================

const createFormatoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  categoria: z.string().min(1, 'La categoría es requerida'),
  version: z.string().min(1, 'La versión es requerida'),
  periodicidad: z.string().optional(),
});

const updateFormatoSchema = createFormatoSchema.partial();

const createInstanciaFormatoSchema = z.object({
  formatoId: z.string().uuid('ID de formato inválido'),
  periodo: z.string().min(1, 'El período es requerido'),
  fechaLlenado: z.string().transform(val => new Date(val)),
  observaciones: z.string().optional(),
});

const updateInstanciaFormatoSchema = createInstanciaFormatoSchema.partial();

module.exports = {
  // Protocolos
  createProtocoloSchema,
  updateProtocoloSchema,

  // Farmacovigilancia
  createReporteFarmacoSchema,
  updateReporteFarmacoSchema,

  // Tecnovigilancia
  createReporteTecnoSchema,
  updateReporteTecnoSchema,

  // Inventario
  createInventarioSchema,
  updateInventarioSchema,

  // Temperatura
  createTemperaturaSchema,
  updateTemperaturaSchema,

  // Formatos
  createFormatoSchema,
  updateFormatoSchema,
  createInstanciaFormatoSchema,
  updateInstanciaFormatoSchema,
};
