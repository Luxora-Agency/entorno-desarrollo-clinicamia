/**
 * Service de Productos/Medicamentos (Vademécum)
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { createProductoSchema, updateProductoSchema } = require('../validators/producto.schema');
const { removeAccents } = require('../utils/validators');

// Siigo integration for product synchronization
let productSiigoService = null;
let siigoService = null;

const getSiigoServices = () => {
  if (!productSiigoService) {
    try {
      productSiigoService = require('./siigo/product.siigo.service');
      siigoService = require('./siigo/siigo.service');
    } catch (e) {
      console.warn('[Producto] Siigo services not available:', e.message);
    }
  }
  return { productSiigoService, siigoService };
};

class ProductoService {
  /**
   * Obtener todos los medicamentos con filtros y búsqueda
   */
  async getAll({ 
    page = 1, 
    limit = 50, 
    search, 
    activo,
    controlado,
    requiereReceta,
    categoriaId
  }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Filtro de búsqueda (nombre, principio activo, ATC, CUM)
    // Incluye búsqueda normalizada (sin acentos) para mejor experiencia de usuario
    if (search) {
      // Normalizar el término de búsqueda (quitar acentos)
      const searchNormalized = removeAccents(search).toLowerCase();
      const searchPattern = `%${searchNormalized}%`;

      // Usar búsqueda SQL raw con unaccent para insensibilidad a acentos
      // Esto permite buscar "acido" y encontrar "Ácido"
      try {
        const medicamentos = await prisma.$queryRawUnsafe(`
          SELECT p.*, c.nombre as categoria_nombre, c.color as categoria_color
          FROM productos p
          LEFT JOIN categorias_productos c ON p.categoria_id = c.id
          WHERE (
            unaccent(lower(p.nombre)) LIKE $1
            OR unaccent(lower(COALESCE(p.principio_activo, ''))) LIKE $1
            OR unaccent(lower(COALESCE(p.descripcion, ''))) LIKE $1
            OR lower(COALESCE(p.codigo_atc, '')) LIKE $1
            OR lower(COALESCE(p.cum, '')) LIKE $1
            OR lower(COALESCE(p.sku, '')) LIKE $1
          )
          ORDER BY p.nombre ASC
          LIMIT $2
          OFFSET $3
        `, searchPattern, parseInt(limit), skip);

        // Transformar resultados al formato esperado
        return medicamentos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          sku: p.sku,
          codigoBarras: p.codigo_barras,
          descripcion: p.descripcion,
          laboratorio: p.laboratorio,

          // Información Farmacológica
          principioActivo: p.principio_activo,
          concentracion: p.concentracion,
          formaFarmaceutica: p.forma_farmaceutica,
          unidadMedida: p.unidad_medida,
          viaAdministracion: p.via_administracion,
          presentacion: p.presentacion,
          codigoAtc: p.codigo_atc,
          cum: p.cum,
          registroSanitario: p.registro_sanitario,

          // Control y Regulación
          requiereReceta: p.requiere_receta,
          controlado: p.controlado,
          tipoControlado: p.tipo_controlado,

          // Almacenamiento
          temperaturaAlmacenamiento: p.temperatura_almacenamiento,
          requiereCadenaFrio: p.requiere_cadena_frio,
          ubicacionAlmacen: p.ubicacion_almacen,

          // Inventario
          cantidadTotal: p.cantidad_total,
          cantidadConsumida: p.cantidad_consumida,
          cantidadMinAlerta: p.cantidad_min_alerta,
          cantidadMaxAlerta: p.cantidad_max_alerta,
          lote: p.lote,
          fechaVencimiento: p.fecha_vencimiento,

          // Precios
          precioVenta: p.precio_venta ? parseFloat(p.precio_venta) : 0,
          precioCompra: p.precio_compra ? parseFloat(p.precio_compra) : null,
          costoPromedio: p.costo_promedio ? parseFloat(p.costo_promedio) : null,
          margenGanancia: p.margen_ganancia ? parseFloat(p.margen_ganancia) : null,

          // Estado e Integración
          activo: p.activo,
          imagenUrl: p.imagen_url,
          siigoId: p.siigo_id,
          categoriaId: p.categoria_id,
          categoria: p.categoria_nombre ? {
            id: p.categoria_id,
            nombre: p.categoria_nombre,
            colorHex: p.categoria_color
          } : null,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
      } catch (e) {
        // Si falla la búsqueda con unaccent (extensión no instalada), usar búsqueda estándar
        console.warn('[Producto] Busqueda con unaccent fallo, usando busqueda estandar:', e.message);

        where.OR = [
          { nombre: { contains: search, mode: 'insensitive' } },
          { principioActivo: { contains: search, mode: 'insensitive' } },
          { codigoAtc: { contains: search, mode: 'insensitive' } },
          { cum: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    if (activo !== undefined) where.activo = activo === 'true' || activo === true;
    if (controlado !== undefined) where.controlado = controlado === 'true' || controlado === true;
    if (requiereReceta !== undefined) where.requiereReceta = requiereReceta === 'true' || requiereReceta === true;
    if (categoriaId) where.categoriaId = categoriaId;

    const [medicamentos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { nombre: 'asc' },
        include: {
          categoria: true,
          lotes: {
            where: { estado: 'activo' },
            orderBy: { fechaVencimiento: 'asc' },
            take: 5
          }
        }
      }),
      prisma.producto.count({ where }),
    ]);

    // Retornar solo el array para mantener compatibilidad con frontend existente
    // TODO: Migrar a respuesta paginada { data, total } en v2
    return medicamentos;
  }

  /**
   * Obtener estadísticas de productos
   */
  async getStats() {
    const [total, activos, inactivos, requierenReceta, todosProductos] = await Promise.all([
      prisma.producto.count(),
      prisma.producto.count({ where: { activo: true } }),
      prisma.producto.count({ where: { activo: false } }),
      prisma.producto.count({ where: { requiereReceta: true } }),
      prisma.producto.findMany({
          select: {
              cantidadTotal: true,
              cantidadConsumida: true,
              cantidadMinAlerta: true,
              precioVenta: true,
              activo: true
          }
      })
    ]);

    let bajoStock = 0;
    let valorInventario = 0;

    todosProductos.forEach(p => {
        if (p.activo) {
            const disponible = p.cantidadTotal - p.cantidadConsumida;
            if (disponible < p.cantidadMinAlerta) {
                bajoStock++;
            }
            if (disponible > 0) {
                valorInventario += (disponible * p.precioVenta);
            }
        }
    });

    return {
      total,
      activos,
      inactivos,
      bajoStock,
      requiereReceta: requierenReceta, // Fixed key name to match frontend expectation (requierenReceta vs requiereReceta)
      requierenReceta, // Keeping both just in case
      valorInventario
    };
  }

  /**
   * Obtener medicamento por ID
   */
  async getById(id) {
    const medicamento = await prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        lotes: {
          orderBy: { fechaVencimiento: 'asc' }
        },
        prescripcionesMedicamentos: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        presentaciones: {
          orderBy: { concentracion: 'asc' },
          include: {
            lotes: {
              where: { estado: 'activo' },
              orderBy: { fechaVencimiento: 'asc' }
            }
          }
        },
      },
    });

    if (!medicamento) {
      throw new NotFoundError('Medicamento no encontrado');
    }

    return medicamento;
  }

  /**
   * Crear medicamento/producto
   */
  async create(data) {
    // Validar datos con Zod
    const validatedData = createProductoSchema.parse(data);

    // Verificar si el SKU ya existe
    const existingSku = await prisma.producto.findUnique({
      where: { sku: validatedData.sku }
    });

    if (existingSku) {
      throw new ValidationError(`El SKU ${validatedData.sku} ya está registrado`);
    }

    const producto = await prisma.producto.create({
      data: validatedData,
    });

    // Sincronizar con Siigo de forma asíncrona
    this.syncProductoConSiigoAsync(producto.id).catch(err => {
      console.error(`[Producto] Error sincronizando producto ${producto.id} con Siigo:`, err.message);
    });

    return producto;
  }

  /**
   * Actualizar producto/medicamento
   */
  async update(id, data) {
    await this.getById(id); // Verificar existencia

    // Validar datos con Zod (partial)
    const validatedData = updateProductoSchema.parse(data);

    // Si se actualiza el SKU, verificar duplicados
    if (validatedData.sku) {
      const existingSku = await prisma.producto.findFirst({
        where: { 
          sku: validatedData.sku,
          id: { not: id }
        }
      });
      if (existingSku) {
        throw new ValidationError(`El SKU ${validatedData.sku} ya está registrado`);
      }
    }

    const updated = await prisma.producto.update({
      where: { id },
      data: validatedData,
    });

    // Sincronizar con Siigo de forma asíncrona
    this.syncProductoConSiigoAsync(updated.id).catch(err => {
      console.error(`[Producto] Error sincronizando actualización de producto ${updated.id} con Siigo:`, err.message);
    });

    return updated;
  }

  /**
   * Eliminar medicamento (soft delete)
   */
  async delete(id) {
    await this.getById(id);

    const deleted = await prisma.producto.update({
      where: { id },
      data: { activo: false },
    });

    return deleted;
  }

  /**
   * Verificar disponibilidad de stock
   */
  async verificarStock(id, cantidad) {
    const producto = await this.getById(id);
    const disponible = producto.cantidadTotal - producto.cantidadConsumida;
    return disponible >= cantidad;
  }

  /**
   * Verificar interacciones medicamentosas
   */
  async verificarInteracciones(medicamentosIds) {
    const medicamentos = await prisma.producto.findMany({
      where: {
        id: { in: medicamentosIds },
      },
      select: {
        id: true,
        nombre: true,
        principioActivo: true,
        descripcion: true,
      },
    });

    const alertas = [];

    // Verificar interacciones entre los medicamentos
    for (let i = 0; i < medicamentos.length; i++) {
      for (let j = i + 1; j < medicamentos.length; j++) {
        const med1 = medicamentos[i];
        const med2 = medicamentos[j];

        // Verificar si med1 tiene interacciones con med2 (basado en descripción)
        if (med1.descripcion && med2.principioActivo) {
          if (med1.descripcion.toLowerCase().includes('interaccion') &&
              med1.descripcion.toLowerCase().includes(med2.principioActivo.toLowerCase())) {
            alertas.push({
              tipo: 'interaccion',
              medicamento1: med1.nombre,
              medicamento2: med2.nombre,
              mensaje: `Posible interacción entre ${med1.nombre} y ${med2.nombre}`,
            });
          }
        }
      }
    }

    return alertas;
  }

  /**
   * Verificar alergias del paciente
   */
  /**
   * Importar medicamentos desde la API de Datos Abiertos Colombia (Socrata)
   * Dataset: Medicamentos incluidos en el PBS
   * Importa todos los registros usando paginación
   */
  async importFromSocrata() {
    const baseUrl = 'https://www.datos.gov.co/resource/jtqe-tuvf.json';
    const limit = 10000; // Máximo por página
    let offset = 0;
    let allData = [];
    let hasMore = true;

    console.log('[PBS Import] Iniciando importación de medicamentos PBS...');

    // Obtener todos los registros con paginación
    while (hasMore) {
      const url = `${baseUrl}?$limit=${limit}&$offset=${offset}`;
      console.log(`[PBS Import] Obteniendo registros desde offset ${offset}...`);

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al conectar con la API de Datos Abiertos');

      const pageData = await response.json();

      if (pageData.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(pageData);
        offset += limit;
        // Si recibimos menos del límite, no hay más datos
        if (pageData.length < limit) {
          hasMore = false;
        }
      }
    }

    console.log(`[PBS Import] Total de registros obtenidos: ${allData.length}`);
    const data = allData;
    
    // 1. Obtener o crear categoría PBS
    let categoria = await prisma.categoriaProducto.findFirst({
      where: { nombre: 'Plan de Beneficios en Salud (PBS)' }
    });
    
    if (!categoria) {
      categoria = await prisma.categoriaProducto.create({
        data: {
          nombre: 'Plan de Beneficios en Salud (PBS)',
          descripcion: 'Medicamentos financiados con recursos de la UPC',
          color: '#3b82f6'
        }
      });
    }

    const resultados = {
      procesados: 0,
      creados: 0,
      actualizados: 0,
      errores: 0
    };

    // 2. Procesar en lotes para no saturar la BD
    for (const item of data) {
      try {
        resultados.procesados++;
        
        // El SKU será el código ATC + ID para asegurar unicidad en este dataset
        const sku = `PBS-${item.codigoatc || 'GEN'}-${item.id}`;
        const nombre = (item.principioactivo || 'Medicamento sin nombre').trim().toUpperCase();
        
        const productoData = {
          nombre: nombre.substring(0, 255),
          sku: sku,
          categoriaId: categoria.id,
          principioActivo: item.principioactivo,
          codigoAtc: item.codigoatc,
          presentacion: item.formafarmaceutica,
          descripcion: item.resumen || item.aclaracion,
          cantidadTotal: 0, 
          cantidadMinAlerta: 10,
          precioVenta: 0, 
          activo: true,
          requiereReceta: true
        };

        const existing = await prisma.producto.findUnique({ where: { sku } });

        if (existing) {
          await prisma.producto.update({
            where: { id: existing.id },
            data: productoData
          });
          resultados.actualizados++;
        } else {
          await prisma.producto.create({ data: productoData });
          resultados.creados++;
        }
      } catch (err) {
        console.error(`Error procesando item ${item.id}:`, err.message);
        resultados.errores++;
      }
    }

    return resultados;
  }

  /**
   * Importar medicamentos desde contenido CSV
   */
  async importFromCSV(csvContent, categoriaId = null) {
    const lines = csvContent.split('\n');
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const resultados = {
      procesados: 0,
      creados: 0,
      actualizados: 0,
      errores: 0
    };

    // Obtener categoría por defecto si no se pasa una
    if (!categoriaId) {
      const cat = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Importados' } });
      if (cat) categoriaId = cat.id;
      else {
        const newCat = await prisma.categoriaProducto.create({
          data: { nombre: 'Importados', color: '#10b981' }
        });
        categoriaId = newCat.id;
      }
    }

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      try {
        resultados.procesados++;
        const values = lines[i].split(',').map(v => v.trim());
        const data = {};
        
        header.forEach((key, index) => {
          data[key] = values[index];
        });

        // Mapeo básico de campos comunes en CSV
        const sku = data.sku || data.codigo || `CSV-${Date.now()}-${i}`;
        const finalData = {
          nombre: (data.nombre || data.producto || 'Sin Nombre').trim().toUpperCase(),
          sku: sku,
          categoriaId: categoriaId,
          principioActivo: data.principio_activo || data.principioactivo || null,
          codigoAtc: data.codigo_atc || data.atc || null,
          cum: data.cum || null,
          concentracion: data.concentracion || null,
          presentacion: data.presentacion || data.forma_farmaceutica || null,
          laboratorio: data.laboratorio || null,
          registroSanitario: data.registro_sanitario || data.invima || null,
          precioVenta: parseFloat(data.precio_venta || data.precio || 0),
          cantidadTotal: parseInt(data.cantidad || data.stock || 0),
          cantidadMinAlerta: parseInt(data.stock_minimo || 5),
          activo: true
        };

        const existing = await prisma.producto.findUnique({ where: { sku } });

        if (existing) {
          await prisma.producto.update({ where: { id: existing.id }, data: finalData });
          resultados.actualizados++;
        } else {
          await prisma.producto.create({ data: finalData });
          resultados.creados++;
        }
      } catch (err) {
        console.error(`Error en línea ${i}:`, err.message);
        resultados.errores++;
      }
    }

    return resultados;
  }

  // =============================================
  // Integración con Siigo
  // =============================================

  /**
   * Sincronizar producto con Siigo de forma asíncrona
   * Este método no bloquea la operación principal
   */
  async syncProductoConSiigoAsync(productoId) {
    try {
      const { productSiigoService, siigoService } = getSiigoServices();

      if (!productSiigoService || !siigoService) {
        console.log(`[Producto] Servicios Siigo no disponibles - producto ${productoId} pendiente de sync`);
        return;
      }

      // Verificar si Siigo está conectado
      if (!siigoService.initialized) {
        console.log(`[Producto] Siigo no conectado - producto ${productoId} será sincronizado por cron job`);
        // Crear registro de sincronización pendiente
        await prisma.siigoSync.upsert({
          where: {
            entidad_entidadId: { entidad: 'producto', entidadId: productoId }
          },
          update: {
            estado: 'pendiente',
            ultimaSync: new Date()
          },
          create: {
            entidad: 'producto',
            entidadId: productoId,
            estado: 'pendiente'
          }
        });
        return;
      }

      // Sincronizar con Siigo
      await productSiigoService.syncProductoFarmacia(productoId);
      console.log(`[Producto] ✓ Producto ${productoId} sincronizado con Siigo`);
    } catch (error) {
      console.error(`[Producto] Error en sync con Siigo para producto ${productoId}:`, error.message);

      // Registrar error para reintento por cron
      try {
        await prisma.siigoSync.upsert({
          where: {
            entidad_entidadId: { entidad: 'producto', entidadId: productoId }
          },
          update: {
            estado: 'error',
            errorMessage: error.message,
            ultimaSync: new Date()
          },
          create: {
            entidad: 'producto',
            entidadId: productoId,
            estado: 'error',
            errorMessage: error.message
          }
        });
      } catch (syncErr) {
        console.error(`[Producto] Error registrando sync error:`, syncErr.message);
      }

      throw error;
    }
  }

  /**
   * Forzar sincronización de un producto con Siigo
   * Uso manual o desde endpoints de admin
   */
  async forceSyncWithSiigo(productoId) {
    const producto = await this.getById(productoId);
    if (!producto) {
      throw new NotFoundError('Producto no encontrado');
    }

    return this.syncProductoConSiigoAsync(productoId);
  }

  /**
   * Sincronizar todos los productos activos con Siigo
   */
  async syncAllProductsWithSiigo() {
    const { productSiigoService, siigoService } = getSiigoServices();

    if (!productSiigoService || !siigoService) {
      throw new Error('Servicios Siigo no disponibles');
    }

    if (!siigoService.initialized) {
      throw new Error('Siigo no está conectado');
    }

    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: { id: true }
    });

    const results = { success: 0, errors: [] };

    for (const producto of productos) {
      try {
        await productSiigoService.syncProductoFarmacia(producto.id);
        results.success++;
      } catch (error) {
        results.errors.push({ productoId: producto.id, error: error.message });
      }
    }

    return results;
  }

  /**
   * Verificar alergias del paciente contra medicamentos
   * @param {string} pacienteId - ID del paciente
   * @param {string[]} medicamentosIds - IDs de los medicamentos a verificar
   * @returns {Object} - Resultado de la verificación de alergias
   */
  async verificarAlergias(pacienteId, medicamentosIds) {
    if (!pacienteId || !medicamentosIds || medicamentosIds.length === 0) {
      return { hayAlergias: false, alergias: [] };
    }

    // Obtener información del paciente
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: { alergias: true }
    });

    if (!paciente || !paciente.alergias) {
      return { hayAlergias: false, alergias: [] };
    }

    // Normalizar alergias del paciente
    const alergiasNormalizadas = paciente.alergias
      .toLowerCase()
      .split(/[,;]/)
      .map(a => a.trim())
      .filter(a => a.length > 0);

    if (alergiasNormalizadas.length === 0) {
      return { hayAlergias: false, alergias: [] };
    }

    // Obtener información de los medicamentos
    const medicamentos = await prisma.producto.findMany({
      where: { id: { in: medicamentosIds } },
      select: {
        id: true,
        nombre: true,
        principioActivo: true,
        descripcion: true
      }
    });

    // Verificar si algún medicamento coincide con las alergias
    const alertas = [];
    for (const med of medicamentos) {
      const nombreLower = (med.nombre || '').toLowerCase();
      const principioLower = (med.principioActivo || '').toLowerCase();
      const descripcionLower = (med.descripcion || '').toLowerCase();

      for (const alergia of alergiasNormalizadas) {
        if (nombreLower.includes(alergia) ||
            principioLower.includes(alergia) ||
            descripcionLower.includes(alergia)) {
          alertas.push({
            medicamentoId: med.id,
            medicamentoNombre: med.nombre,
            alergia: alergia,
            tipo: 'ALERGIA_DETECTADA'
          });
        }
      }
    }

    return {
      hayAlergias: alertas.length > 0,
      alergias: alertas
    };
  }
}

module.exports = new ProductoService();
