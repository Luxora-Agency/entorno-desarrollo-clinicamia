/**
 * Service de productos farmacéuticos
 */
const prisma = require('../db/prisma');
const { ValidationError } = require('../utils/errors');
const { validateRequired } = require('../utils/validators');

const ProductoService = {
  /**
   * Obtener todos los productos
   */
  async getAll(filters = {}) {
    const where = {};
    
    if (filters.activo !== undefined) {
      where.activo = filters.activo === 'true';
    }
    
    if (filters.categoriaId) {
      where.categoriaId = filters.categoriaId;
    }
    
    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { descripcion: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        categoria: true,
        etiquetas: {
          include: {
            etiqueta: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return productos.map(prod => ({
      ...prod,
      etiquetas: prod.etiquetas.map(e => e.etiqueta),
      cantidadDisponible: prod.cantidadTotal - prod.cantidadConsumida,
      valorInventario: (prod.cantidadTotal - prod.cantidadConsumida) * prod.precioVenta,
    }));
  },

  /**
   * Obtener estadísticas
   */
  async getStats() {
    const total = await prisma.producto.count();
    const activos = await prisma.producto.count({ where: { activo: true } });
    const inactivos = total - activos;
    
    const productos = await prisma.producto.findMany({
      select: {
        cantidadTotal: true,
        cantidadConsumida: true,
        cantidadMinAlerta: true,
        precioVenta: true,
        requiereReceta: true,
        activo: true,
      }
    });

    let valorInventario = 0;
    let bajoStock = 0;
    let requierenReceta = 0;

    productos.forEach(p => {
      const disponible = p.cantidadTotal - p.cantidadConsumida;
      valorInventario += disponible * p.precioVenta;
      
      if (disponible < p.cantidadMinAlerta && p.activo) {
        bajoStock++;
      }
      
      if (p.requiereReceta && p.activo) {
        requierenReceta++;
      }
    });

    return {
      total,
      activos,
      inactivos,
      valorInventario: parseFloat(valorInventario.toFixed(2)),
      bajoStock,
      requierenReceta,
    };
  },

  /**
   * Obtener un producto por ID
   */
  async getById(id) {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        etiquetas: {
          include: {
            etiqueta: true
          }
        }
      }
    });

    if (!producto) {
      throw new ValidationError('Producto no encontrado');
    }

    return {
      ...producto,
      etiquetas: producto.etiquetas.map(e => e.etiqueta),
      cantidadDisponible: producto.cantidadTotal - producto.cantidadConsumida,
    };
  },

  /**
   * Crear un producto
   */
  async create(data) {
    const missing = validateRequired(['nombre', 'categoriaId', 'sku', 'cantidadTotal', 'cantidadMinAlerta', 'precioVenta'], data);
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    // Verificar SKU único
    const existing = await prisma.producto.findUnique({ 
      where: { sku: data.sku } 
    });
    
    if (existing) {
      throw new ValidationError('El SKU ya está registrado');
    }

    // Crear producto
    const producto = await prisma.producto.create({
      data: {
        nombre: data.nombre,
        categoriaId: data.categoriaId,
        sku: data.sku,
        laboratorio: data.laboratorio,
        descripcion: data.descripcion,
        principioActivo: data.principioActivo,
        concentracion: data.concentracion,
        viaAdministracion: data.viaAdministracion,
        presentacion: data.presentacion,
        registroSanitario: data.registroSanitario,
        temperaturaAlmacenamiento: data.temperaturaAlmacenamiento,
        requiereReceta: data.requiereReceta || false,
        cantidadTotal: parseInt(data.cantidadTotal),
        cantidadConsumida: parseInt(data.cantidadConsumida) || 0,
        cantidadMinAlerta: parseInt(data.cantidadMinAlerta),
        lote: data.lote,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        precioVenta: parseFloat(data.precioVenta),
        precioCompra: data.precioCompra ? parseFloat(data.precioCompra) : null,
        activo: data.activo !== undefined ? data.activo : true,
        imagenUrl: data.imagenUrl,
      },
    });

    // Agregar etiquetas si existen
    if (data.etiquetasIds && data.etiquetasIds.length > 0) {
      await Promise.all(
        data.etiquetasIds.map(etiquetaId =>
          prisma.productoEtiqueta.create({
            data: {
              productoId: producto.id,
              etiquetaId: etiquetaId,
            }
          })
        )
      );
    }

    return this.getById(producto.id);
  },

  /**
   * Actualizar un producto
   */
  async update(id, data) {
    await this.getById(id);

    const updateData = {};
    
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.categoriaId) updateData.categoriaId = data.categoriaId;
    if (data.sku) updateData.sku = data.sku;
    if (data.laboratorio !== undefined) updateData.laboratorio = data.laboratorio;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.principioActivo !== undefined) updateData.principioActivo = data.principioActivo;
    if (data.concentracion !== undefined) updateData.concentracion = data.concentracion;
    if (data.viaAdministracion !== undefined) updateData.viaAdministracion = data.viaAdministracion;
    if (data.presentacion !== undefined) updateData.presentacion = data.presentacion;
    if (data.registroSanitario !== undefined) updateData.registroSanitario = data.registroSanitario;
    if (data.temperaturaAlmacenamiento !== undefined) updateData.temperaturaAlmacenamiento = data.temperaturaAlmacenamiento;
    if (data.requiereReceta !== undefined) updateData.requiereReceta = data.requiereReceta;
    if (data.cantidadTotal !== undefined) updateData.cantidadTotal = parseInt(data.cantidadTotal);
    if (data.cantidadConsumida !== undefined) updateData.cantidadConsumida = parseInt(data.cantidadConsumida);
    if (data.cantidadMinAlerta !== undefined) updateData.cantidadMinAlerta = parseInt(data.cantidadMinAlerta);
    if (data.lote !== undefined) updateData.lote = data.lote;
    if (data.fechaVencimiento !== undefined) updateData.fechaVencimiento = data.fechaVencimiento ? new Date(data.fechaVencimiento) : null;
    if (data.precioVenta !== undefined) updateData.precioVenta = parseFloat(data.precioVenta);
    if (data.precioCompra !== undefined) updateData.precioCompra = data.precioCompra ? parseFloat(data.precioCompra) : null;
    if (data.activo !== undefined) updateData.activo = data.activo;
    if (data.imagenUrl !== undefined) updateData.imagenUrl = data.imagenUrl;

    const producto = await prisma.producto.update({
      where: { id },
      data: updateData,
    });

    // Actualizar etiquetas si se proporcionan
    if (data.etiquetasIds !== undefined) {
      // Eliminar etiquetas existentes
      await prisma.productoEtiqueta.deleteMany({
        where: { productoId: id }
      });
      
      // Agregar nuevas etiquetas
      if (data.etiquetasIds.length > 0) {
        await Promise.all(
          data.etiquetasIds.map(etiquetaId =>
            prisma.productoEtiqueta.create({
              data: {
                productoId: id,
                etiquetaId: etiquetaId,
              }
            })
          )
        );
      }
    }

    return this.getById(id);
  },

  /**
   * Eliminar un producto
   */
  async delete(id) {
    await this.getById(id);

    await prisma.producto.delete({
      where: { id },
    });

    return { message: 'Producto eliminado correctamente' };
  },
};

module.exports = ProductoService;
