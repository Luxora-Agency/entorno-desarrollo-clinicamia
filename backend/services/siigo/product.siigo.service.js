/**
 * Servicio de Productos de Siigo
 *
 * Sincroniza productos de farmacia, servicios médicos, procedimientos
 * y otros items facturables con Siigo para facturación electrónica.
 */

const siigoService = require('./siigo.service');
const prisma = require('../../db/prisma');

class ProductSiigoService {
  /**
   * Sincroniza un producto de farmacia con Siigo
   */
  async syncProductoFarmacia(productoId) {
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      include: { categoria: true }
    });

    if (!producto) {
      throw new Error(`Producto ${productoId} no encontrado`);
    }

    const existingSync = await prisma.siigoSync.findUnique({
      where: {
        entidad_entidadId: {
          entidad: 'producto',
          entidadId: productoId
        }
      }
    });

    const productApi = siigoService.getProductApi();
    const productData = this.mapProductoToSiigo(producto);

    try {
      let result;

      if (existingSync?.siigoId) {
        // Actualizar producto existente
        result = await siigoService.executeWithLogging(
          () => productApi.updateProduct(existingSync.siigoId, {
            updateProductCommand: productData
          }),
          {
            operacion: 'updateProduct',
            endpoint: `/products/${existingSync.siigoId}`,
            metodo: 'PUT',
            entidad: 'producto',
            entidadId: productoId,
            requestBody: productData
          }
        );
      } else {
        // Crear nuevo producto
        result = await siigoService.executeWithLogging(
          () => productApi.createProduct({
            createProductCommand: productData
          }),
          {
            operacion: 'createProduct',
            endpoint: '/products',
            metodo: 'POST',
            entidad: 'producto',
            entidadId: productoId,
            requestBody: productData
          }
        );

        // Guardar sincronización
        await prisma.siigoSync.create({
          data: {
            entidad: 'producto',
            entidadId: productoId,
            siigoId: result.id,
            estado: 'sincronizado'
          }
        });
      }

      // Actualizar fecha de sincronización
      if (existingSync) {
        await prisma.siigoSync.update({
          where: { id: existingSync.id },
          data: {
            ultimaSync: new Date(),
            estado: 'sincronizado',
            errorMessage: null
          }
        });
      }

      console.log(`[Siigo] Producto ${producto.nombre} sincronizado: ${result.id}`);
      return result;
    } catch (error) {
      // Registrar error
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'producto',
            entidadId: productoId
          }
        },
        update: {
          estado: 'error',
          errorMessage: error.message,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'producto',
          entidadId: productoId,
          siigoId: '',
          estado: 'error',
          errorMessage: error.message
        }
      });

      console.error(`[Siigo] Error sincronizando producto ${productoId}:`, error.message);
      throw error;
    }
  }

  /**
   * Mapea un producto del sistema a la estructura de Siigo
   */
  mapProductoToSiigo(producto) {
    const esServicio = producto.esServicio || false;
    const esMedicamento = producto.requiereReceta ||
                          (producto.categoria?.nombre?.toLowerCase().includes('medicamento'));

    return {
      code: producto.sku || producto.codigo || `PROD-${producto.id.substring(0, 8)}`,
      name: producto.nombre.substring(0, 100), // Límite de Siigo
      accountGroup: this.getAccountGroup(producto),
      type: esServicio ? 'Service' : 'Product',
      stockControl: !esServicio,
      active: producto.activo !== false,
      // Medicamentos exentos de IVA en Colombia
      taxClassification: esMedicamento ? 'Excluded' : 'Taxed',
      taxes: esMedicamento ? [] : [{
        id: 1, // IVA 19%
        percentage: 19
      }],
      prices: [{
        currencyCode: 'COP',
        priceList: [{
          position: 1,
          value: parseFloat(producto.precioVenta || producto.precio || 0)
        }]
      }],
      unit: this.getUnidadMedida(producto.unidadMedida),
      additionalFields: {
        codigoAtc: producto.codigoAtc || null,
        cum: producto.cum || null,
        principioActivo: producto.principioActivo || null,
        categoria: producto.categoria?.nombre || null
      }
    };
  }

  /**
   * Obtiene el grupo contable según el tipo de producto
   */
  getAccountGroup(producto) {
    // Grupos contables predefinidos en Siigo
    // Estos IDs deben configurarse según la cuenta del cliente
    const grupos = {
      'medicamento': 1281, // Inventario medicamentos
      'insumo': 1282,      // Inventario insumos médicos
      'servicio': 1283,    // Servicios de salud
      'equipo': 1284,      // Equipos médicos
      'default': 1281
    };

    if (producto.esServicio) return grupos.servicio;
    if (producto.requiereReceta) return grupos.medicamento;
    if (producto.categoria?.nombre?.toLowerCase().includes('insumo')) return grupos.insumo;
    if (producto.categoria?.nombre?.toLowerCase().includes('equipo')) return grupos.equipo;

    return grupos.default;
  }

  /**
   * Mapea unidad de medida a código de Siigo
   */
  getUnidadMedida(unidad) {
    const unidades = {
      'unidad': '94',
      'und': '94',
      'caja': '94',
      'tableta': '94',
      'capsula': '94',
      'ampolla': '94',
      'frasco': '94',
      'ml': '70',
      'litro': '24',
      'gramo': '31',
      'kg': '22',
      'metro': '30',
      'cm': '42'
    };

    const key = (unidad || '').toLowerCase().trim();
    return unidades[key] || '94'; // Default: Unidad
  }

  /**
   * Sincroniza un servicio médico (consulta, procedimiento, etc.)
   */
  async syncServicioMedico(tipo, servicioId) {
    let servicio;
    let codigo;
    let nombre;
    let precio;

    // Obtener datos según tipo de servicio
    switch (tipo) {
      case 'especialidad':
        servicio = await prisma.especialidad.findUnique({ where: { id: servicioId } });
        codigo = `ESP-${servicioId.substring(0, 8)}`;
        nombre = `Consulta ${servicio?.nombre || 'Médica'}`;
        precio = servicio?.precioConsulta || 0;
        break;

      case 'examen':
        servicio = await prisma.examenProcedimiento.findUnique({ where: { id: servicioId } });
        codigo = servicio?.cups || `EXM-${servicioId.substring(0, 8)}`;
        nombre = servicio?.nombre || 'Examen médico';
        precio = servicio?.precio || 0;
        break;

      case 'procedimiento':
        servicio = await prisma.procedimiento.findUnique({ where: { id: servicioId } });
        codigo = servicio?.cups || `PROC-${servicioId.substring(0, 8)}`;
        nombre = servicio?.nombre || 'Procedimiento médico';
        precio = servicio?.costo || 0;
        break;

      default:
        throw new Error(`Tipo de servicio no soportado: ${tipo}`);
    }

    if (!servicio) {
      throw new Error(`Servicio ${tipo}/${servicioId} no encontrado`);
    }

    const entidadKey = `${tipo}_${servicioId}`;
    const existingSync = await prisma.siigoSync.findUnique({
      where: {
        entidad_entidadId: {
          entidad: 'servicio',
          entidadId: entidadKey
        }
      }
    });

    const productApi = siigoService.getProductApi();
    const productData = {
      code: codigo,
      name: nombre.substring(0, 100),
      accountGroup: 1283, // Servicios de salud (ajustar según configuración)
      type: 'Service',
      stockControl: false,
      active: true,
      taxClassification: 'Excluded', // Servicios de salud exentos de IVA
      taxes: [],
      prices: [{
        currencyCode: 'COP',
        priceList: [{
          position: 1,
          value: parseFloat(precio)
        }]
      }]
    };

    try {
      let result;

      if (existingSync?.siigoId) {
        result = await siigoService.executeWithLogging(
          () => productApi.updateProduct(existingSync.siigoId, {
            updateProductCommand: productData
          }),
          {
            operacion: 'updateServiceProduct',
            endpoint: `/products/${existingSync.siigoId}`,
            metodo: 'PUT',
            entidad: 'servicio',
            entidadId: entidadKey,
            requestBody: productData
          }
        );
      } else {
        result = await siigoService.executeWithLogging(
          () => productApi.createProduct({
            createProductCommand: productData
          }),
          {
            operacion: 'createServiceProduct',
            endpoint: '/products',
            metodo: 'POST',
            entidad: 'servicio',
            entidadId: entidadKey,
            requestBody: productData
          }
        );

        await prisma.siigoSync.create({
          data: {
            entidad: 'servicio',
            entidadId: entidadKey,
            siigoId: result.id,
            estado: 'sincronizado'
          }
        });
      }

      console.log(`[Siigo] Servicio ${nombre} sincronizado: ${result.id}`);
      return result;
    } catch (error) {
      console.error(`[Siigo] Error sincronizando servicio ${entidadKey}:`, error.message);
      throw error;
    }
  }

  /**
   * Sincroniza todos los productos de farmacia activos
   */
  async syncAllProductosFarmacia(options = { limit: 100, offset: 0 }) {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      include: { categoria: true },
      skip: options.offset,
      take: options.limit,
      orderBy: { createdAt: 'desc' }
    });

    const results = {
      total: productos.length,
      success: 0,
      errors: []
    };

    for (const producto of productos) {
      try {
        await this.syncProductoFarmacia(producto.id);
        results.success++;
      } catch (error) {
        results.errors.push({
          productoId: producto.id,
          nombre: producto.nombre,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Sincronizados ${results.success}/${results.total} productos`);
    return results;
  }

  /**
   * Sincroniza todas las especialidades como servicios
   */
  async syncAllEspecialidades() {
    const especialidades = await prisma.especialidad.findMany({
      where: { activo: true }
    });

    const results = {
      total: especialidades.length,
      success: 0,
      errors: []
    };

    for (const especialidad of especialidades) {
      try {
        await this.syncServicioMedico('especialidad', especialidad.id);
        results.success++;
      } catch (error) {
        results.errors.push({
          especialidadId: especialidad.id,
          nombre: especialidad.nombre,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Sincronizadas ${results.success}/${results.total} especialidades`);
    return results;
  }

  /**
   * Sincroniza todos los exámenes/procedimientos
   */
  async syncAllExamenes() {
    const examenes = await prisma.examenProcedimiento.findMany({
      where: { activo: true }
    });

    const results = {
      total: examenes.length,
      success: 0,
      errors: []
    };

    for (const examen of examenes) {
      try {
        await this.syncServicioMedico('examen', examen.id);
        results.success++;
      } catch (error) {
        results.errors.push({
          examenId: examen.id,
          nombre: examen.nombre,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Sincronizados ${results.success}/${results.total} exámenes`);
    return results;
  }

  /**
   * Obtiene productos pendientes de sincronización
   */
  async getPendingSyncs() {
    const pendientes = await prisma.siigoSync.findMany({
      where: {
        entidad: 'producto',
        estado: { in: ['error', 'pendiente'] }
      },
      take: 100
    });

    return pendientes;
  }

  /**
   * Reintenta sincronización de productos con error
   */
  async retrySyncErrors() {
    const pendientes = await this.getPendingSyncs();

    const results = {
      total: pendientes.length,
      success: 0,
      errors: []
    };

    for (const sync of pendientes) {
      try {
        await this.syncProductoFarmacia(sync.entidadId);
        results.success++;
      } catch (error) {
        results.errors.push({
          productoId: sync.entidadId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Busca un producto en Siigo por código
   */
  async buscarProductoEnSiigo(codigo) {
    try {
      const productApi = siigoService.getProductApi();
      const result = await siigoService.executeWithLogging(
        () => productApi.getProducts({ code: codigo }),
        {
          operacion: 'searchProduct',
          endpoint: `/products?code=${codigo}`,
          metodo: 'GET',
          entidad: 'producto',
          entidadId: codigo,
          requestBody: { code: codigo }
        }
      );

      return result.results || [];
    } catch (error) {
      console.error(`[Siigo] Error buscando producto ${codigo}:`, error.message);
      return [];
    }
  }

  /**
   * Obtiene el ID de Siigo para un producto
   */
  async getSiigoIdForProducto(productoId) {
    const sync = await prisma.siigoSync.findUnique({
      where: {
        entidad_entidadId: {
          entidad: 'producto',
          entidadId: productoId
        }
      }
    });

    if (sync?.siigoId) {
      return sync.siigoId;
    }

    // Sincronizar producto
    const result = await this.syncProductoFarmacia(productoId);
    return result.id;
  }

  /**
   * Obtiene el código de producto para facturación
   */
  getProductCode(item) {
    // Prefijos según tipo de servicio
    const prefijos = {
      'Consulta': 'CON',
      'Procedimiento': 'PROC',
      'Laboratorio': 'LAB',
      'Imagenologia': 'IMG',
      'Medicamento': 'MED',
      'Insumo': 'INS',
      'Hospitalizacion': 'HOSP',
      'Cirugia': 'CIR'
    };

    const prefijo = prefijos[item.tipo] || 'SRV';
    return `${prefijo}-${item.id.substring(0, 8)}`;
  }
}

module.exports = new ProductSiigoService();
