/**
 * Siigo Catalogs Service
 * Sync and manage Siigo catalog data (taxes, payment types, document types, account groups)
 */
const prisma = require('../../db/prisma');
const siigoService = require('./siigo.service');

class CatalogsSiigoService {
  /**
   * Get taxes from Siigo API
   */
  async getTaxes() {
    try {
      // Try to get from Siigo if connected
      if (siigoService.initialized && siigoService.SiigoApi) {
        const taxApi = siigoService.getTaxApi();
        const result = await siigoService.executeWithLogging(
          () => taxApi.getTaxes(),
          {
            operacion: 'getTaxes',
            endpoint: '/taxes',
            metodo: 'GET',
            entidad: 'catalogo'
          }
        );

        return result.results || [];
      }

      // Return cached data if not connected
      return this.getCachedOrEmptyTaxes();
    } catch (error) {
      console.error('[CatalogsSiigo] Error getting taxes:', error.message);
      // Return cached data on error
      return this.getCachedOrEmptyTaxes();
    }
  }

  /**
   * Get payment types from Siigo API
   */
  async getPaymentTypes() {
    try {
      if (siigoService.initialized && siigoService.SiigoApi) {
        const paymentTypeApi = siigoService.getPaymentTypeApi();
        const result = await siigoService.executeWithLogging(
          () => paymentTypeApi.getPaymentTypes(),
          {
            operacion: 'getPaymentTypes',
            endpoint: '/payment-types',
            metodo: 'GET',
            entidad: 'catalogo'
          }
        );

        return result.results || [];
      }

      return this.getCachedOrEmptyPaymentTypes();
    } catch (error) {
      console.error('[CatalogsSiigo] Error getting payment types:', error.message);
      return this.getCachedOrEmptyPaymentTypes();
    }
  }

  /**
   * Get document types from Siigo API
   */
  async getDocumentTypes() {
    try {
      if (siigoService.initialized && siigoService.SiigoApi) {
        const documentTypeApi = siigoService.getDocumentTypeApi();
        const result = await siigoService.executeWithLogging(
          () => documentTypeApi.getDocumentTypes(),
          {
            operacion: 'getDocumentTypes',
            endpoint: '/document-types',
            metodo: 'GET',
            entidad: 'catalogo'
          }
        );

        return result.results || [];
      }

      return this.getCachedOrEmptyDocumentTypes();
    } catch (error) {
      console.error('[CatalogsSiigo] Error getting document types:', error.message);
      return this.getCachedOrEmptyDocumentTypes();
    }
  }

  /**
   * Get account groups from Siigo API
   */
  async getAccountGroups() {
    try {
      if (siigoService.initialized && siigoService.SiigoApi) {
        const accountGroupApi = siigoService.getAccountGroupApi();
        const result = await siigoService.executeWithLogging(
          () => accountGroupApi.getAccountGroups(),
          {
            operacion: 'getAccountGroups',
            endpoint: '/account-groups',
            metodo: 'GET',
            entidad: 'catalogo'
          }
        );

        return result.results || [];
      }

      return this.getCachedOrEmptyAccountGroups();
    } catch (error) {
      console.error('[CatalogsSiigo] Error getting account groups:', error.message);
      return this.getCachedOrEmptyAccountGroups();
    }
  }

  /**
   * Get cost centers from Siigo API
   */
  async getCostCenters() {
    try {
      if (siigoService.initialized && siigoService.SiigoApi) {
        const costCenterApi = siigoService.getCostCenterApi();
        const result = await siigoService.executeWithLogging(
          () => costCenterApi.getCostCenters(),
          {
            operacion: 'getCostCenters',
            endpoint: '/cost-centers',
            metodo: 'GET',
            entidad: 'catalogo'
          }
        );

        return result.results || [];
      }

      return this.getCachedOrEmptyCostCenters();
    } catch (error) {
      console.error('[CatalogsSiigo] Error getting cost centers:', error.message);
      return this.getCachedOrEmptyCostCenters();
    }
  }

  /**
   * Sync all catalogs
   */
  async syncAllCatalogs() {
    const results = {
      taxes: { success: false, count: 0 },
      paymentTypes: { success: false, count: 0 },
      documentTypes: { success: false, count: 0 },
      accountGroups: { success: false, count: 0 }
    };

    try {
      const taxes = await this.getTaxes();
      results.taxes = { success: true, count: taxes.length };
    } catch (e) {
      results.taxes.error = e.message;
    }

    try {
      const paymentTypes = await this.getPaymentTypes();
      results.paymentTypes = { success: true, count: paymentTypes.length };
    } catch (e) {
      results.paymentTypes.error = e.message;
    }

    try {
      const documentTypes = await this.getDocumentTypes();
      results.documentTypes = { success: true, count: documentTypes.length };
    } catch (e) {
      results.documentTypes.error = e.message;
    }

    try {
      const accountGroups = await this.getAccountGroups();
      results.accountGroups = { success: true, count: accountGroups.length };
    } catch (e) {
      results.accountGroups.error = e.message;
    }

    return results;
  }

  // ============ LOCAL DATABASE FALLBACKS (when Siigo not connected) ============

  /**
   * Get taxes from local cache or return empty array
   * Users should configure taxes in Siigo for proper integration
   */
  async getCachedOrEmptyTaxes() {
    try {
      // Try to get from local ConfiguracionImpuesto table if it exists
      const cached = await prisma.configuracionImpuesto.findMany({
        where: { activo: true }
      });
      if (cached && cached.length > 0) {
        return cached.map(t => ({
          id: parseInt(t.siigoId) || 0,
          name: t.nombre,
          percentage: parseFloat(t.porcentaje),
          type: t.tipo,
          active: true
        }));
      }
    } catch (e) {
      // Table doesn't exist
    }

    // Return empty array - Siigo connection required for taxes
    console.warn('[CatalogsSiigo] Siigo no conectado - catálogo de impuestos vacío');
    return [];
  }

  /**
   * Get payment types from local cache or return empty array
   */
  async getCachedOrEmptyPaymentTypes() {
    // No local cache for payment types - requires Siigo connection
    console.warn('[CatalogsSiigo] Siigo no conectado - catálogo de tipos de pago vacío');
    return [];
  }

  /**
   * Get document types from local cache or return empty array
   */
  async getCachedOrEmptyDocumentTypes() {
    // No local cache for document types - requires Siigo connection
    console.warn('[CatalogsSiigo] Siigo no conectado - catálogo de tipos de documento vacío');
    return [];
  }

  /**
   * Get account groups from local CuentaContable table if available
   */
  async getCachedOrEmptyAccountGroups() {
    try {
      // Try to get distinct groups from CuentaContable
      const cuentas = await prisma.cuentaContable.groupBy({
        by: ['tipo'],
        _count: { id: true }
      });
      if (cuentas && cuentas.length > 0) {
        return cuentas.map((g, i) => ({
          id: i + 1,
          name: g.tipo,
          type: g.tipo === 'ACTIVO' || g.tipo === 'PASIVO' ? 'Asset' : 'Service',
          accounts: []
        }));
      }
    } catch (e) {
      // Table doesn't exist
    }

    console.warn('[CatalogsSiigo] Siigo no conectado - catálogo de grupos contables vacío');
    return [];
  }

  /**
   * Get cost centers from local Departamento table
   */
  async getCachedOrEmptyCostCenters() {
    try {
      // Use Departamento as cost centers
      const departamentos = await prisma.departamento.findMany({
        where: { activo: true },
        select: { id: true, codigo: true, nombre: true }
      });

      if (departamentos && departamentos.length > 0) {
        return departamentos.map((d, i) => ({
          id: i + 1,
          code: d.codigo || d.id.slice(0, 4).toUpperCase(),
          name: d.nombre,
          active: true,
          localId: d.id
        }));
      }
    } catch (e) {
      // Table doesn't exist
    }

    console.warn('[CatalogsSiigo] Siigo no conectado - catálogo de centros de costo vacío');
    return [];
  }
}

module.exports = new CatalogsSiigoService();
