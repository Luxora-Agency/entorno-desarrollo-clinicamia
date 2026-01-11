/**
 * Esquemas de validación Zod para Facturas
 */
const { z } = require('zod');

// Schema para item de factura
const facturaItemSchema = z.object({
  tipo: z.enum(['Consulta', 'OrdenMedica', 'OrdenMedicamento', 'Hospitalizacion', 'Otro'], {
    errorMap: () => ({ message: 'Tipo de item inválido' }),
  }),
  descripcion: z.string().min(1, 'La descripción es requerida').max(500, 'Descripción muy larga'),
  cantidad: z.number().int().positive('La cantidad debe ser positiva').default(1),
  precio_unitario: z.number().positive('El precio unitario debe ser mayor a 0'),
  descuento: z.number().min(0, 'El descuento no puede ser negativo').default(0),
  // Referencias opcionales
  cita_id: z.string().uuid().optional().nullable(),
  orden_medica_id: z.string().uuid().optional().nullable(),
  orden_medicamento_id: z.string().uuid().optional().nullable(),
  admision_id: z.string().uuid().optional().nullable(),
});

// Schema para crear factura
const createFacturaSchema = z.object({
  paciente_id: z.string().uuid('ID de paciente inválido'),
  items: z.array(facturaItemSchema).min(1, 'Debe incluir al menos un item'),
  observaciones: z.string().max(1000, 'Observaciones muy largas').optional().nullable(),
  cubierto_por_eps: z.boolean().default(false),
  eps_autorizacion: z.string().max(100).optional().nullable(),
  monto_eps: z.number().min(0).optional().nullable(),
  monto_paciente: z.number().min(0).optional().nullable(),
  fecha_vencimiento: z.string().datetime().optional().nullable(),
  descuentos: z.number().min(0).default(0),
  impuestos: z.number().min(0).default(0),
});

// Schema para actualizar factura
const updateFacturaSchema = z.object({
  estado: z.enum(['Pendiente', 'Parcial', 'Pagada', 'Cancelada']).optional(),
  observaciones: z.string().max(1000).optional().nullable(),
  fecha_vencimiento: z.string().datetime().optional().nullable(),
  cubierto_por_eps: z.boolean().optional(),
  eps_autorizacion: z.string().max(100).optional().nullable(),
  monto_eps: z.number().min(0).optional().nullable(),
  monto_paciente: z.number().min(0).optional().nullable(),
});

// Schema para registrar pago
const createPagoSchema = z.object({
  monto: z.number().positive('El monto debe ser mayor a 0'),
  metodo_pago: z.enum(['Efectivo', 'Tarjeta', 'Transferencia', 'EPS', 'Otro'], {
    errorMap: () => ({ message: 'Método de pago inválido' }),
  }),
  referencia: z.string().max(100).optional().nullable(),
  observaciones: z.string().max(500).optional().nullable(),
  fecha_pago: z.string().datetime().optional().nullable(),
});

// Schema para generar RIPS
const generateRIPSSchema = z.object({
  factura_ids: z.array(z.string().uuid('ID de factura inválido')).min(1, 'Debe seleccionar al menos una factura'),
});

// Schema para cancelar factura
const cancelFacturaSchema = z.object({
  observaciones: z.string().min(1, 'Las observaciones son requeridas para cancelar').max(500),
});

module.exports = {
  facturaItemSchema,
  createFacturaSchema,
  updateFacturaSchema,
  createPagoSchema,
  generateRIPSSchema,
  cancelFacturaSchema,
};
