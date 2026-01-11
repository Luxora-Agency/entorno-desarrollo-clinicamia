/**
 * Servicio de Clientes de Siigo
 *
 * Sincroniza pacientes con Siigo como terceros (clientes)
 * para facturación electrónica.
 */

const siigoService = require('./siigo.service');
const prisma = require('../../db/prisma');

class CustomerSiigoService {
  /**
   * Sincroniza un paciente con Siigo
   * Crea o actualiza el tercero en Siigo según corresponda
   */
  async syncPaciente(pacienteId) {
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId }
    });

    if (!paciente) {
      throw new Error(`Paciente ${pacienteId} no encontrado`);
    }

    // Verificar si ya existe sincronización
    const existingSync = await prisma.siigoSync.findUnique({
      where: {
        entidad_entidadId: {
          entidad: 'paciente',
          entidadId: pacienteId
        }
      }
    });

    const customerApi = siigoService.getCustomerApi();
    const customerData = this.mapPacienteToCustomer(paciente);

    try {
      let result;

      if (existingSync?.siigoId) {
        // Actualizar cliente existente
        result = await siigoService.executeWithLogging(
          () => customerApi.updateCustomer(existingSync.siigoId, {
            updateCustomerCommand: customerData
          }),
          {
            operacion: 'updateCustomer',
            endpoint: `/customers/${existingSync.siigoId}`,
            metodo: 'PUT',
            entidad: 'paciente',
            entidadId: pacienteId,
            requestBody: customerData
          }
        );
      } else {
        // Crear nuevo cliente
        result = await siigoService.executeWithLogging(
          () => customerApi.createCustomer({
            createCustomerCommand: customerData
          }),
          {
            operacion: 'createCustomer',
            endpoint: '/customers',
            metodo: 'POST',
            entidad: 'paciente',
            entidadId: pacienteId,
            requestBody: customerData
          }
        );

        // Guardar sincronización
        await prisma.siigoSync.create({
          data: {
            entidad: 'paciente',
            entidadId: pacienteId,
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

      return result;
    } catch (error) {
      // Registrar error
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'paciente',
            entidadId: pacienteId
          }
        },
        update: {
          estado: 'error',
          errorMessage: error.message,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'paciente',
          entidadId: pacienteId,
          siigoId: '',
          estado: 'error',
          errorMessage: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Mapea un paciente a la estructura de cliente de Siigo
   */
  mapPacienteToCustomer(paciente) {
    // Separar nombres si vienen juntos
    const nombres = paciente.nombre ? paciente.nombre.split(' ') : [''];
    const apellidos = paciente.apellido ? paciente.apellido.split(' ') : [''];

    return {
      type: 'Customer',
      personType: paciente.tipoDocumento === 'NIT' ? 'Company' : 'Person',
      idType: {
        code: siigoService.mapTipoDocumento(paciente.tipoDocumento)
      },
      identification: paciente.cedula,
      branchOffice: 0,
      name: paciente.tipoDocumento === 'NIT'
        ? [`${paciente.nombre} ${paciente.apellido}`]
        : [paciente.nombre, paciente.apellido],
      address: {
        address: paciente.direccion || 'Sin dirección',
        city: {
          countryCode: 'Co',
          stateCode: this.getStateCode(paciente.departamento),
          cityCode: siigoService.getCityCode(paciente.municipio, paciente.departamento)
        }
      },
      phones: paciente.telefono ? [{
        indicative: '57',
        number: paciente.telefono.replace(/\D/g, ''),
        extension: ''
      }] : [],
      contacts: [{
        firstName: nombres[0] || '',
        lastName: apellidos[0] || '',
        email: paciente.email || 'sin-email@clinica.com',
        phone: {
          indicative: '57',
          number: paciente.telefono ? paciente.telefono.replace(/\D/g, '') : '0000000000',
          extension: ''
        }
      }],
      fiscalResponsibilities: [{
        code: 'R-99-PN' // No responsable de IVA (persona natural)
      }],
      active: paciente.activo !== false
    };
  }

  /**
   * Obtiene el código de departamento para Siigo
   */
  getStateCode(departamento) {
    const departamentos = {
      'amazonas': '91',
      'antioquia': '05',
      'arauca': '81',
      'atlántico': '08',
      'atlantico': '08',
      'bogotá': '11',
      'bogota': '11',
      'bolívar': '13',
      'bolivar': '13',
      'boyacá': '15',
      'boyaca': '15',
      'caldas': '17',
      'caquetá': '18',
      'caqueta': '18',
      'casanare': '85',
      'cauca': '19',
      'cesar': '20',
      'chocó': '27',
      'choco': '27',
      'córdoba': '23',
      'cordoba': '23',
      'cundinamarca': '25',
      'guainía': '94',
      'guainia': '94',
      'guaviare': '95',
      'huila': '41',
      'la guajira': '44',
      'magdalena': '47',
      'meta': '50',
      'nariño': '52',
      'narino': '52',
      'norte de santander': '54',
      'putumayo': '86',
      'quindío': '63',
      'quindio': '63',
      'risaralda': '66',
      'san andrés': '88',
      'san andres': '88',
      'santander': '68',
      'sucre': '70',
      'tolima': '73',
      'valle del cauca': '76',
      'vaupés': '97',
      'vaupes': '97',
      'vichada': '99'
    };

    const key = (departamento || '').toLowerCase().trim();
    return departamentos[key] || '11'; // Default: Bogotá
  }

  /**
   * Obtiene el ID de Siigo para un paciente
   * Si no existe, lo sincroniza primero
   */
  async getSiigoIdForPaciente(pacienteId) {
    const sync = await prisma.siigoSync.findUnique({
      where: {
        entidad_entidadId: {
          entidad: 'paciente',
          entidadId: pacienteId
        }
      }
    });

    if (sync?.siigoId) {
      return sync.siigoId;
    }

    // Sincronizar paciente
    const result = await this.syncPaciente(pacienteId);
    return result.id;
  }

  /**
   * Asegura que un cliente exista en Siigo
   * Usado para clientes genéricos (consumidor final)
   */
  async ensureCustomerExists(clienteData) {
    const documento = clienteData.documento || '222222222222';
    const nombre = clienteData.nombre || 'CONSUMIDOR FINAL';

    try {
      const customerApi = siigoService.getCustomerApi();

      // Buscar si ya existe
      const existingCustomers = await siigoService.executeWithLogging(
        () => customerApi.getCustomers({ identification: documento }),
        {
          operacion: 'searchCustomer',
          endpoint: `/customers?identification=${documento}`,
          metodo: 'GET',
          entidad: 'cliente_generico',
          entidadId: documento,
          requestBody: { identification: documento }
        }
      );

      if (existingCustomers.results && existingCustomers.results.length > 0) {
        return existingCustomers.results[0].id;
      }

      // Crear cliente genérico
      const customerData = {
        type: 'Customer',
        personType: 'Person',
        idType: { code: '13' }, // CC
        identification: documento,
        branchOffice: 0,
        name: [nombre],
        address: {
          address: 'Sin dirección',
          city: { countryCode: 'Co', stateCode: '11', cityCode: '11001' }
        },
        phones: [],
        contacts: [{
          firstName: nombre,
          lastName: '',
          email: 'consumidor@cliente.com',
          phone: { indicative: '57', number: '0000000000', extension: '' }
        }],
        fiscalResponsibilities: [{ code: 'R-99-PN' }],
        active: true
      };

      const result = await siigoService.executeWithLogging(
        () => customerApi.createCustomer({
          createCustomerCommand: customerData
        }),
        {
          operacion: 'createCustomerGeneric',
          endpoint: '/customers',
          metodo: 'POST',
          entidad: 'cliente_generico',
          entidadId: documento,
          requestBody: customerData
        }
      );

      return result.id;
    } catch (error) {
      console.error('[Siigo] Error asegurando cliente:', error.message);
      throw error;
    }
  }

  /**
   * Sincroniza todos los pacientes activos con Siigo
   */
  async syncAllPacientes(options = { limit: 100, offset: 0 }) {
    const pacientes = await prisma.paciente.findMany({
      where: { activo: true },
      skip: options.offset,
      take: options.limit,
      orderBy: { createdAt: 'desc' }
    });

    const results = {
      total: pacientes.length,
      success: 0,
      errors: []
    };

    for (const paciente of pacientes) {
      try {
        await this.syncPaciente(paciente.id);
        results.success++;
      } catch (error) {
        results.errors.push({
          pacienteId: paciente.id,
          nombre: `${paciente.nombre} ${paciente.apellido}`,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Sincronizados ${results.success}/${results.total} pacientes`);
    return results;
  }

  /**
   * Obtiene pacientes pendientes de sincronización
   */
  async getPendingSyncs() {
    const pendientes = await prisma.siigoSync.findMany({
      where: {
        entidad: 'paciente',
        estado: { in: ['error', 'pendiente'] }
      },
      take: 100
    });

    return pendientes;
  }

  /**
   * Reintenta sincronización de pacientes con error
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
        await this.syncPaciente(sync.entidadId);
        results.success++;
      } catch (error) {
        results.errors.push({
          pacienteId: sync.entidadId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Sincroniza un proveedor con Siigo
   * Los proveedores se crean como terceros tipo 'Vendor' en Siigo
   */
  async syncProveedor(proveedorId) {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: proveedorId }
    });

    if (!proveedor) {
      throw new Error(`Proveedor ${proveedorId} no encontrado`);
    }

    // Verificar si ya existe sincronización
    const existingSync = await prisma.siigoSync.findUnique({
      where: {
        entidad_entidadId: {
          entidad: 'proveedor',
          entidadId: proveedorId
        }
      }
    });

    const customerApi = siigoService.getCustomerApi();
    const customerData = this.mapProveedorToCustomer(proveedor);

    try {
      let result;

      if (existingSync?.siigoId) {
        // Actualizar proveedor existente
        result = await siigoService.executeWithLogging(
          () => customerApi.updateCustomer(existingSync.siigoId, {
            updateCustomerCommand: customerData
          }),
          {
            operacion: 'updateVendor',
            endpoint: `/customers/${existingSync.siigoId}`,
            metodo: 'PUT',
            entidad: 'proveedor',
            entidadId: proveedorId,
            requestBody: customerData
          }
        );

        await prisma.siigoSync.update({
          where: { id: existingSync.id },
          data: {
            ultimaSync: new Date(),
            estado: 'sincronizado',
            errorMessage: null
          }
        });
      } else {
        // Crear nuevo proveedor en Siigo
        result = await siigoService.executeWithLogging(
          () => customerApi.createCustomer({
            createCustomerCommand: customerData
          }),
          {
            operacion: 'createVendor',
            endpoint: '/customers',
            metodo: 'POST',
            entidad: 'proveedor',
            entidadId: proveedorId,
            requestBody: customerData
          }
        );

        // Guardar sincronización
        await prisma.siigoSync.create({
          data: {
            entidad: 'proveedor',
            entidadId: proveedorId,
            siigoId: result.id,
            estado: 'sincronizado'
          }
        });

        // Actualizar proveedor con siigoId
        await prisma.proveedor.update({
          where: { id: proveedorId },
          data: { siigoId: result.id }
        });
      }

      console.log(`[Siigo] Proveedor ${proveedor.razonSocial} sincronizado: ${result.id}`);
      return result;
    } catch (error) {
      // Registrar error
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'proveedor',
            entidadId: proveedorId
          }
        },
        update: {
          estado: 'error',
          errorMessage: error.message,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'proveedor',
          entidadId: proveedorId,
          siigoId: '',
          estado: 'error',
          errorMessage: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Mapea un proveedor a la estructura de tercero de Siigo
   */
  mapProveedorToCustomer(proveedor) {
    const esPersonaJuridica = proveedor.tipoDocumento === 'NIT';

    return {
      type: 'Vendor', // Tipo proveedor
      personType: esPersonaJuridica ? 'Company' : 'Person',
      idType: {
        code: siigoService.mapTipoDocumento(proveedor.tipoDocumento)
      },
      identification: proveedor.documento,
      checkDigit: proveedor.digitoVerificacion || undefined,
      branchOffice: 0,
      name: esPersonaJuridica
        ? [proveedor.razonSocial]
        : proveedor.razonSocial.split(' ').slice(0, 2),
      commercialName: proveedor.nombreComercial || undefined,
      address: {
        address: proveedor.direccion || 'Sin dirección',
        city: {
          countryCode: 'Co',
          stateCode: this.getStateCode(proveedor.departamento),
          cityCode: siigoService.getCityCode(proveedor.ciudad, proveedor.departamento)
        }
      },
      phones: proveedor.telefono ? [{
        indicative: '57',
        number: proveedor.telefono.replace(/\D/g, ''),
        extension: ''
      }] : [],
      contacts: [{
        firstName: proveedor.razonSocial.split(' ')[0] || 'Contacto',
        lastName: proveedor.razonSocial.split(' ')[1] || 'Proveedor',
        email: proveedor.email || 'proveedor@empresa.com',
        phone: {
          indicative: '57',
          number: proveedor.telefono ? proveedor.telefono.replace(/\D/g, '') : '0000000000',
          extension: ''
        }
      }],
      fiscalResponsibilities: proveedor.responsabilidadFiscal?.map(r => ({ code: r })) || [{ code: 'R-99-PN' }],
      relatedUsers: {
        sellerID: null,
        collectorID: null
      },
      comments: `Proveedor tipo: ${proveedor.tipoProveedor}. Plazo crédito: ${proveedor.plazoCredito} días.`,
      active: proveedor.activo !== false
    };
  }

  /**
   * Obtiene el ID de Siigo para un proveedor
   * Si no existe, lo sincroniza primero
   */
  async getSiigoIdForProveedor(proveedorId) {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: proveedorId }
    });

    if (proveedor?.siigoId) {
      return proveedor.siigoId;
    }

    const sync = await prisma.siigoSync.findUnique({
      where: {
        entidad_entidadId: {
          entidad: 'proveedor',
          entidadId: proveedorId
        }
      }
    });

    if (sync?.siigoId) {
      return sync.siigoId;
    }

    // Sincronizar proveedor
    const result = await this.syncProveedor(proveedorId);
    return result.id;
  }

  /**
   * Sincroniza todos los proveedores activos con Siigo
   */
  async syncAllProveedores(options = { limit: 100, offset: 0 }) {
    const proveedores = await prisma.proveedor.findMany({
      where: { activo: true },
      skip: options.offset,
      take: options.limit,
      orderBy: { createdAt: 'desc' }
    });

    const results = {
      total: proveedores.length,
      success: 0,
      errors: []
    };

    for (const proveedor of proveedores) {
      try {
        await this.syncProveedor(proveedor.id);
        results.success++;
      } catch (error) {
        results.errors.push({
          proveedorId: proveedor.id,
          nombre: proveedor.razonSocial,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Sincronizados ${results.success}/${results.total} proveedores`);
    return results;
  }
}

module.exports = new CustomerSiigoService();
