const { z } = require('zod');

const createProductoSchema = z.object({
  // Información Básica
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoriaId: z.string().uuid('ID de categoría inválido'),
  sku: z.string().min(1, 'El SKU es requerido'),
  laboratorio: z.string().optional().or(z.null()),
  descripcion: z.string().optional().or(z.null()),
  
  // Información Farmacológica
  principioActivo: z.string().optional().or(z.null()),
  concentracion: z.string().optional().or(z.null()),
  viaAdministracion: z.string().optional().or(z.null()),
  presentacion: z.string().optional().or(z.null()),
  registroSanitario: z.string().optional().or(z.null()),
  temperaturaAlmacenamiento: z.string().optional().or(z.null()),
  requiereReceta: z.boolean().default(false),
  
  // Inventario
  cantidadTotal: z.number().int().min(0, 'La cantidad no puede ser negativa').default(0),
  cantidadMinAlerta: z.number().int().min(0, 'La cantidad mínima no puede ser negativa').default(10),
  lote: z.string().optional().or(z.null()),
  fechaVencimiento: z.string().optional().or(z.null()).transform((val) => val ? new Date(val) : null),
  
  // Precios
  precioVenta: z.number().min(0, 'El precio de venta no puede ser negativo'),
  precioCompra: z.number().min(0, 'El precio de compra no puede ser negativo').optional().or(z.null()),
  
  // Estado e Imagen
  activo: z.boolean().default(true),
  imagenUrl: z.string().url().optional().or(z.literal('')).or(z.null()),
});

const updateProductoSchema = createProductoSchema.partial();

module.exports = {
  createProductoSchema,
  updateProductoSchema,
};
