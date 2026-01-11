const { z } = require('zod');

const createPlanSchema = z.object({
  nombre: z.string().max(255).min(1),
  descripcion: z.string().optional().or(z.null()),
  costo: z.number().min(0).or(z.string().transform(v => parseFloat(v))),
  duracion_meses: z.number().int().min(1).or(z.string().transform(v => parseInt(v, 10))),
  color: z.string().max(50).optional().or(z.null()),
  icono: z.string().max(50).optional().or(z.null()),
  destacado: z.boolean().default(false).optional(),
  beneficios: z.array(z.string()).optional().or(z.null()),
  descuentos: z.record(z.any()).optional().or(z.null()),
  items_consumibles: z.array(z.any()).optional().or(z.null())
});

const updatePlanSchema = createPlanSchema.partial();

const createSubscriptionSchema = z.object({
  plan_id: z.number().int().or(z.string().transform(v => parseInt(v, 10))),
  paciente_id: z.string(),
  metodo_pago: z.string().max(50).optional().or(z.null()),
  codigo_cupon: z.string().max(50).optional().or(z.null()).or(z.literal('')),
  vendedor_codigo: z.string().optional().or(z.null()),
  canal: z.string().optional().or(z.null())
});

const createCouponSchema = z.object({
  codigo: z.string().max(50).min(1),
  descripcion: z.string().optional().or(z.null()),
  tipo_descuento: z.enum(['porcentaje', 'valor']),
  valor_descuento: z.number().min(0).or(z.string().transform(v => parseFloat(v))),
  fecha_inicio: z.string().transform(str => new Date(str)).or(z.date()),
  fecha_fin: z.string().transform(str => new Date(str)).or(z.date()),
  usos_maximos: z.number().int().min(1).or(z.string().transform(v => parseInt(v, 10))),
  planes_ids: z.array(z.number().int()).optional()
});

const updateCouponSchema = createCouponSchema.partial();

const validateCouponSchema = z.object({
  codigo: z.string().min(1),
  plan_id: z.number().int().or(z.string().transform(v => parseInt(v, 10)))
});

const convertFormularioSchema = z.object({
  planId: z.number().int().or(z.string().transform(v => parseInt(v, 10))),
  metodoPago: z.string().optional(),
  vendedorCodigo: z.string().optional()
});

module.exports = {
  createPlanSchema,
  updatePlanSchema,
  createSubscriptionSchema,
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  convertFormularioSchema
};
