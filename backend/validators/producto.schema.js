const { z } = require('zod');

const createProductoSchema = z.object({
  // Información Básica
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoriaId: z.string().uuid('ID de categoría inválido'),
  sku: z.string().min(1, 'El SKU es requerido'),
  codigoBarras: z.string().optional().or(z.null()),
  laboratorio: z.string().optional().or(z.null()),
  descripcion: z.string().optional().or(z.null()),

  // Información Farmacológica
  principioActivo: z.string().optional().or(z.null()),
  concentracion: z.string().optional().or(z.null()),
  formaFarmaceutica: z.string().optional().or(z.null()),
  unidadMedida: z.string().optional().or(z.null()),
  viaAdministracion: z.string().optional().or(z.null()),
  presentacion: z.string().optional().or(z.null()),

  // Códigos Regulatorios
  codigoAtc: z.string().optional().or(z.null()),
  cum: z.string().optional().or(z.null()),
  registroSanitario: z.string().optional().or(z.null()),

  // Información Clínica
  posologiaRecomendada: z.string().optional().or(z.null()),
  indicaciones: z.string().optional().or(z.null()),
  contraindicaciones: z.string().optional().or(z.null()),
  efectosAdversos: z.string().optional().or(z.null()),
  interacciones: z.string().optional().or(z.null()),
  riesgoEmbarazo: z.string().optional().or(z.null()),

  // Control y Regulación
  requiereReceta: z.boolean().default(false),
  controlado: z.boolean().default(false),
  tipoControlado: z.string().optional().or(z.null()),
  medicamentoAltoRiesgo: z.boolean().default(false),
  medicamentoLASA: z.boolean().default(false),

  // Almacenamiento
  temperaturaAlmacenamiento: z.string().optional().or(z.null()),
  requiereCadenaFrio: z.boolean().default(false),
  protegerLuz: z.boolean().default(false),
  protegerHumedad: z.boolean().default(false),
  ubicacionAlmacen: z.string().optional().or(z.null()),
  condicionesEspeciales: z.string().optional().or(z.null()),

  // Inventario
  cantidadTotal: z.number().int().min(0, 'La cantidad no puede ser negativa').default(0),
  cantidadMinAlerta: z.number().int().min(0, 'La cantidad mínima no puede ser negativa').default(10),
  cantidadMaxAlerta: z.number().int().min(0, 'La cantidad máxima no puede ser negativa').optional().or(z.null()),
  puntoReorden: z.number().int().min(0).optional().or(z.null()),
  lote: z.string().optional().or(z.null()),
  fechaVencimiento: z.string().optional().or(z.null()).transform((val) => val ? new Date(val) : null),

  // Precios
  precioVenta: z.number().min(0, 'El precio de venta no puede ser negativo').default(0),
  precioCompra: z.number().min(0, 'El precio de compra no puede ser negativo').optional().or(z.null()),
  costoPromedio: z.number().min(0).optional().or(z.null()),
  margenGanancia: z.number().optional().or(z.null()),

  // Estado e Integración
  activo: z.boolean().default(true),
  imagenUrl: z.string().url().optional().or(z.literal('')).or(z.null()),
  siigoId: z.string().optional().or(z.null()),
});

const updateProductoSchema = createProductoSchema.partial();

// Schema para crear/actualizar lotes
const loteProductoSchema = z.object({
  productoId: z.string().uuid('ID de producto inválido'),
  numero: z.string().min(1, 'El número de lote es requerido'),
  fechaFabricacion: z.string().optional().or(z.null()).transform((val) => val ? new Date(val) : null),
  fechaVencimiento: z.string().transform((val) => new Date(val)),
  cantidadInicial: z.number().int().min(1, 'La cantidad inicial debe ser mayor a 0'),
  cantidadActual: z.number().int().min(0).optional(),
  precioCompra: z.number().min(0).optional().or(z.null()),
  proveedor: z.string().optional().or(z.null()),
  ubicacion: z.string().optional().or(z.null()),
  estado: z.enum(['activo', 'agotado', 'vencido', 'retirado']).default('activo'),
  observaciones: z.string().optional().or(z.null()),
});

const updateLoteSchema = loteProductoSchema.partial().omit({ productoId: true });

module.exports = {
  createProductoSchema,
  updateProductoSchema,
  loteProductoSchema,
  updateLoteSchema,
};
