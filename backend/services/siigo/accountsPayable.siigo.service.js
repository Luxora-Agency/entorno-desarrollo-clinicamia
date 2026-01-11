/**
 * Servicio de Cuentas por Pagar de Siigo
 *
 * Maneja la contabilización de facturas de proveedor y pagos
 * en Siigo para el módulo de compras.
 */

const siigoService = require('./siigo.service');
const prisma = require('../../db/prisma');

class AccountsPayableSiigoService {
  /**
   * Registra una factura de proveedor en Siigo (causación)
   * Genera el asiento contable de la compra
   */
  async registrarFacturaProveedor(facturaProveedorId) {
    const factura = await prisma.facturaProveedor.findUnique({
      where: { id: facturaProveedorId },
      include: {
        proveedor: true,
        items: true
      }
    });

    if (!factura) {
      throw new Error(`Factura proveedor ${facturaProveedorId} no encontrada`);
    }

    if (factura.siigoId) {
      throw new Error(`Factura ${factura.numero} ya está registrada en Siigo`);
    }

    try {
      const voucherCommand = this.buildPurchaseVoucher(factura);

      const voucherApi = siigoService.getVoucherApi();
      const result = await siigoService.executeWithLogging(
        () => voucherApi.createVoucher({
          createVoucherCommand: voucherCommand
        }),
        {
          operacion: 'registrarFacturaProveedor',
          endpoint: '/vouchers',
          metodo: 'POST',
          entidad: 'factura_proveedor',
          entidadId: facturaProveedorId,
          requestBody: voucherCommand
        }
      );

      // Actualizar factura con datos de Siigo
      await prisma.facturaProveedor.update({
        where: { id: facturaProveedorId },
        data: { siigoId: result.id }
      });

      // Registrar sincronización
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'factura_proveedor',
            entidadId: facturaProveedorId
          }
        },
        update: {
          siigoId: result.id,
          estado: 'sincronizado',
          errorMessage: null,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'factura_proveedor',
          entidadId: facturaProveedorId,
          siigoId: result.id,
          estado: 'sincronizado'
        }
      });

      console.log(`[Siigo] Factura proveedor ${factura.numero} causada: ${result.id}`);
      return result;
    } catch (error) {
      // Registrar error
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'factura_proveedor',
            entidadId: facturaProveedorId
          }
        },
        update: {
          estado: 'error',
          errorMessage: error.message,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'factura_proveedor',
          entidadId: facturaProveedorId,
          siigoId: '',
          estado: 'error',
          errorMessage: error.message
        }
      });

      console.error(`[Siigo] Error causando factura ${facturaProveedorId}:`, error.message);
      throw error;
    }
  }

  /**
   * Construye el comprobante de compra para Siigo
   */
  buildPurchaseVoucher(factura) {
    const items = this.buildAccountingItems(factura);

    return {
      document: { id: 1045 }, // Factura de compra
      date: siigoService.formatDate(factura.fechaFactura),
      type: 'Vendor',
      customer: {
        identification: factura.proveedor.documento,
        branchOffice: 0
      },
      observations: this.buildObservations(factura),
      items,
      payments: [{
        id: 5636, // Crédito
        value: parseFloat(factura.total),
        dueDate: siigoService.formatDate(factura.fechaVencimiento)
      }]
    };
  }

  /**
   * Construye las líneas contables del comprobante
   */
  buildAccountingItems(factura) {
    const items = [];

    // Débito: Inventario/Gasto según tipo de producto
    for (const item of factura.items) {
      const cuentaContable = item.cuentaContable || this.getCuentaInventario(factura.proveedor.tipoProveedor);
      items.push({
        account: { code: cuentaContable },
        customer: {
          identification: factura.proveedor.documento,
          branchOffice: 0
        },
        description: item.descripcion.substring(0, 100),
        value: parseFloat(item.subtotal)
      });
    }

    // Si no hay items, usar el subtotal general
    if (factura.items.length === 0) {
      items.push({
        account: { code: this.getCuentaInventario(factura.proveedor.tipoProveedor) },
        customer: {
          identification: factura.proveedor.documento,
          branchOffice: 0
        },
        description: `Compra - Factura ${factura.numero}`,
        value: parseFloat(factura.subtotal)
      });
    }

    // Débito: IVA descontable
    if (parseFloat(factura.iva) > 0) {
      items.push({
        account: { code: '24080501' }, // IVA descontable compras
        customer: {
          identification: factura.proveedor.documento,
          branchOffice: 0
        },
        description: 'IVA descontable',
        value: parseFloat(factura.iva)
      });
    }

    // Crédito: Retención en la fuente por pagar (si aplica)
    if (parseFloat(factura.retencionFuente) > 0) {
      items.push({
        account: { code: '23650501' }, // Retención fuente por pagar
        customer: {
          identification: factura.proveedor.documento,
          branchOffice: 0
        },
        description: 'Retención en la fuente',
        value: -parseFloat(factura.retencionFuente)
      });
    }

    // Crédito: Retención ICA por pagar (si aplica)
    if (parseFloat(factura.retencionICA) > 0) {
      items.push({
        account: { code: '23680501' }, // Retención ICA por pagar
        customer: {
          identification: factura.proveedor.documento,
          branchOffice: 0
        },
        description: 'Retención ICA',
        value: -parseFloat(factura.retencionICA)
      });
    }

    // Crédito: Retención IVA (si aplica)
    if (parseFloat(factura.retencionIVA) > 0) {
      items.push({
        account: { code: '23670501' }, // Retención IVA por pagar
        customer: {
          identification: factura.proveedor.documento,
          branchOffice: 0
        },
        description: 'Retención IVA',
        value: -parseFloat(factura.retencionIVA)
      });
    }

    // Crédito: Cuentas por pagar proveedores
    items.push({
      account: { code: '22050501' }, // Proveedores nacionales
      customer: {
        identification: factura.proveedor.documento,
        branchOffice: 0
      },
      description: `CxP Factura ${factura.numero}`,
      value: -parseFloat(factura.saldoPendiente)
    });

    return items;
  }

  /**
   * Obtiene la cuenta de inventario según el tipo de proveedor
   */
  getCuentaInventario(tipoProveedor) {
    const cuentas = {
      'Medicamentos': '14350501',     // Inventario medicamentos
      'Insumos': '14350505',          // Inventario insumos médicos
      'Laboratorio': '14350510',      // Inventario laboratorio
      'Equipos': '15240501',          // Equipo médico (activo fijo)
      'Servicios': '51050501',        // Gasto servicios
      'Papeleria': '51951001',        // Gasto papelería
      'Aseo': '51951005',             // Gasto aseo
      'Tecnologia': '15280501',       // Equipo de cómputo
      'default': '14359501'           // Inventario otros
    };

    return cuentas[tipoProveedor] || cuentas.default;
  }

  /**
   * Construye las observaciones del comprobante
   */
  buildObservations(factura) {
    const obs = [];

    obs.push(`Factura proveedor: ${factura.numero}`);
    obs.push(`Proveedor: ${factura.proveedor.razonSocial}`);
    obs.push(`NIT: ${factura.proveedor.documento}`);

    if (factura.ordenCompraId) {
      obs.push(`OC: ${factura.ordenCompraId}`);
    }

    return obs.join(' | ');
  }

  /**
   * Registra un pago a proveedor en Siigo (comprobante de egreso)
   */
  async registrarPagoProveedor(pagoId) {
    const pago = await prisma.pagoProveedor.findUnique({
      where: { id: pagoId },
      include: {
        facturaProveedor: {
          include: { proveedor: true }
        }
      }
    });

    if (!pago) {
      throw new Error(`Pago ${pagoId} no encontrado`);
    }

    if (pago.siigoId) {
      throw new Error(`Pago ${pago.numero} ya está registrado en Siigo`);
    }

    try {
      const voucherCommand = this.buildPaymentVoucher(pago);

      const voucherApi = siigoService.getVoucherApi();
      const result = await siigoService.executeWithLogging(
        () => voucherApi.createVoucher({
          createVoucherCommand: voucherCommand
        }),
        {
          operacion: 'registrarPagoProveedor',
          endpoint: '/vouchers',
          metodo: 'POST',
          entidad: 'pago_proveedor',
          entidadId: pagoId,
          requestBody: voucherCommand
        }
      );

      // Actualizar pago con datos de Siigo
      await prisma.pagoProveedor.update({
        where: { id: pagoId },
        data: { siigoId: result.id }
      });

      // Registrar sincronización
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'pago_proveedor',
            entidadId: pagoId
          }
        },
        update: {
          siigoId: result.id,
          estado: 'sincronizado',
          errorMessage: null,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'pago_proveedor',
          entidadId: pagoId,
          siigoId: result.id,
          estado: 'sincronizado'
        }
      });

      console.log(`[Siigo] Pago proveedor ${pago.numero} registrado: ${result.id}`);
      return result;
    } catch (error) {
      // Registrar error
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'pago_proveedor',
            entidadId: pagoId
          }
        },
        update: {
          estado: 'error',
          errorMessage: error.message,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'pago_proveedor',
          entidadId: pagoId,
          siigoId: '',
          estado: 'error',
          errorMessage: error.message
        }
      });

      console.error(`[Siigo] Error registrando pago ${pagoId}:`, error.message);
      throw error;
    }
  }

  /**
   * Construye el comprobante de egreso para Siigo
   */
  buildPaymentVoucher(pago) {
    return {
      document: { id: 1051 }, // Comprobante de egreso
      date: siigoService.formatDate(pago.fecha),
      type: 'Vendor',
      customer: {
        identification: pago.facturaProveedor.proveedor.documento,
        branchOffice: 0
      },
      observations: this.buildPaymentObservations(pago),
      items: [
        // Débito: Cuentas por pagar (reducción del pasivo)
        {
          account: { code: '22050501' }, // Proveedores nacionales
          customer: {
            identification: pago.facturaProveedor.proveedor.documento,
            branchOffice: 0
          },
          description: `Pago factura ${pago.facturaProveedor.numero}`,
          debit: parseFloat(pago.monto)
        },
        // Crédito: Banco (salida de dinero)
        {
          account: { code: this.getCuentaBanco(pago.metodoPago, pago.bancoOrigen) },
          description: `${pago.metodoPago}${pago.numeroTransferencia ? ` - Ref: ${pago.numeroTransferencia}` : ''}`,
          credit: parseFloat(pago.monto)
        }
      ],
      payments: [{
        id: siigoService.getPaymentTypeId(pago.metodoPago),
        value: parseFloat(pago.monto)
      }]
    };
  }

  /**
   * Obtiene la cuenta de banco según el método de pago
   */
  getCuentaBanco(metodoPago, banco) {
    // Cuentas bancarias genéricas del PUC
    const cuentas = {
      'Transferencia': '11100501',  // Bancos nacionales
      'Cheque': '11100501',         // Bancos nacionales
      'Efectivo': '11050501',       // Caja general
      'PSE': '11100501',            // Bancos nacionales
      'default': '11100501'
    };

    return cuentas[metodoPago] || cuentas.default;
  }

  /**
   * Construye las observaciones del pago
   */
  buildPaymentObservations(pago) {
    const obs = [];

    obs.push(`Comprobante egreso: ${pago.numero}`);
    obs.push(`Pago a: ${pago.facturaProveedor.proveedor.razonSocial}`);
    obs.push(`Factura: ${pago.facturaProveedor.numero}`);
    obs.push(`Método: ${pago.metodoPago}`);

    if (pago.numeroTransferencia) {
      obs.push(`Ref: ${pago.numeroTransferencia}`);
    }

    if (pago.observaciones) {
      obs.push(pago.observaciones);
    }

    return obs.join(' | ');
  }

  /**
   * Obtiene el reporte de cuentas por pagar desde Siigo
   */
  async getAccountsPayableReport() {
    try {
      const accountsPayableApi = siigoService.getAccountsPayableApi();

      if (!accountsPayableApi) {
        // Si no hay API específica, usar el saldo local
        return this.getLocalAccountsPayable();
      }

      const result = await siigoService.executeWithLogging(
        () => accountsPayableApi.getAccountsPayable(),
        {
          operacion: 'getAccountsPayable',
          endpoint: '/accounts-payable',
          metodo: 'GET',
          entidad: 'reporte'
        }
      );

      return result;
    } catch (error) {
      console.error('[Siigo] Error obteniendo cuentas por pagar:', error.message);
      // Fallback a datos locales
      return this.getLocalAccountsPayable();
    }
  }

  /**
   * Obtiene cuentas por pagar desde la base de datos local
   */
  async getLocalAccountsPayable() {
    const facturas = await prisma.facturaProveedor.findMany({
      where: {
        estado: { in: ['Pendiente', 'Parcial'] },
        saldoPendiente: { gt: 0 }
      },
      include: {
        proveedor: {
          select: { id: true, razonSocial: true, documento: true }
        }
      },
      orderBy: { fechaVencimiento: 'asc' }
    });

    // Agrupar por proveedor
    const porProveedor = {};

    for (const factura of facturas) {
      const key = factura.proveedor.id;
      if (!porProveedor[key]) {
        porProveedor[key] = {
          proveedor: factura.proveedor,
          totalPendiente: 0,
          facturas: []
        };
      }

      porProveedor[key].totalPendiente += parseFloat(factura.saldoPendiente);
      porProveedor[key].facturas.push({
        id: factura.id,
        numero: factura.numero,
        fechaFactura: factura.fechaFactura,
        fechaVencimiento: factura.fechaVencimiento,
        total: factura.total,
        saldoPendiente: factura.saldoPendiente
      });
    }

    return {
      totalCuentasPorPagar: facturas.reduce((sum, f) => sum + parseFloat(f.saldoPendiente), 0),
      totalFacturas: facturas.length,
      porProveedor: Object.values(porProveedor)
    };
  }

  /**
   * Obtiene aging de cuentas por pagar con detalle
   */
  async getAgingCuentasPorPagar() {
    const facturas = await prisma.facturaProveedor.findMany({
      where: {
        estado: { in: ['Pendiente', 'Parcial'] },
        saldoPendiente: { gt: 0 }
      },
      include: {
        proveedor: { select: { razonSocial: true, documento: true } }
      }
    });

    const hoy = new Date();
    const aging = {
      corriente: { count: 0, monto: 0, facturas: [] },
      vencido_1_30: { count: 0, monto: 0, facturas: [] },
      vencido_31_60: { count: 0, monto: 0, facturas: [] },
      vencido_61_90: { count: 0, monto: 0, facturas: [] },
      vencido_90_mas: { count: 0, monto: 0, facturas: [] }
    };

    for (const factura of facturas) {
      const diasVencido = Math.floor(
        (hoy - new Date(factura.fechaVencimiento)) / (1000 * 60 * 60 * 24)
      );

      let categoria;
      if (diasVencido <= 0) categoria = 'corriente';
      else if (diasVencido <= 30) categoria = 'vencido_1_30';
      else if (diasVencido <= 60) categoria = 'vencido_31_60';
      else if (diasVencido <= 90) categoria = 'vencido_61_90';
      else categoria = 'vencido_90_mas';

      aging[categoria].count++;
      aging[categoria].monto += parseFloat(factura.saldoPendiente);
      aging[categoria].facturas.push({
        id: factura.id,
        numero: factura.numero,
        proveedor: factura.proveedor.razonSocial,
        documento: factura.proveedor.documento,
        saldo: parseFloat(factura.saldoPendiente),
        fechaVencimiento: factura.fechaVencimiento,
        diasVencido: Math.max(0, diasVencido)
      });
    }

    return aging;
  }

  /**
   * Procesa facturas de proveedor pendientes de sincronizar
   */
  async processPendingInvoices() {
    const pendientes = await prisma.facturaProveedor.findMany({
      where: {
        siigoId: null
      },
      take: 50,
      orderBy: { createdAt: 'asc' }
    });

    const results = {
      total: pendientes.length,
      success: 0,
      errors: []
    };

    for (const factura of pendientes) {
      try {
        await this.registrarFacturaProveedor(factura.id);
        results.success++;
      } catch (error) {
        results.errors.push({
          facturaId: factura.id,
          numero: factura.numero,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Procesadas ${results.success}/${results.total} facturas proveedor`);
    return results;
  }

  /**
   * Procesa pagos pendientes de sincronizar
   */
  async processPendingPayments() {
    const pendientes = await prisma.pagoProveedor.findMany({
      where: {
        siigoId: null
      },
      take: 50,
      orderBy: { createdAt: 'asc' }
    });

    const results = {
      total: pendientes.length,
      success: 0,
      errors: []
    };

    for (const pago of pendientes) {
      try {
        await this.registrarPagoProveedor(pago.id);
        results.success++;
      } catch (error) {
        results.errors.push({
          pagoId: pago.id,
          numero: pago.numero,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Procesados ${results.success}/${results.total} pagos proveedor`);
    return results;
  }

  /**
   * Calcula retenciones para una compra
   */
  calcularRetenciones(monto, tipoProveedor, esGranContribuyente = false) {
    const UVT_2025 = 49799; // Valor UVT 2025
    const baseGravable = parseFloat(monto);

    const retenciones = {
      retencionFuente: 0,
      retencionICA: 0,
      retencionIVA: 0
    };

    // Retención en la fuente por compras (base 27 UVT = $1,344,573)
    if (baseGravable >= 27 * UVT_2025) {
      // Compras generales: 2.5%
      retenciones.retencionFuente = baseGravable * 0.025;
    }

    // Retención ICA (varía por ciudad, usando Bogotá 9.66 x mil para servicios de salud)
    if (baseGravable >= 27 * UVT_2025) {
      retenciones.retencionICA = baseGravable * 0.00966;
    }

    // Retención IVA: 15% del IVA (solo si es gran contribuyente o régimen común)
    if (esGranContribuyente) {
      const ivaEstimado = baseGravable * 0.19; // IVA 19%
      retenciones.retencionIVA = ivaEstimado * 0.15;
    }

    return retenciones;
  }
}

module.exports = new AccountsPayableSiigoService();
