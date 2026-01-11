/**
 * Servicio de Facturación Electrónica de Siigo
 *
 * Maneja la emisión de facturas electrónicas DIAN,
 * incluyendo consultas médicas, farmacia/droguería y otros servicios.
 */

const siigoService = require('./siigo.service');
const customerSiigoService = require('./customer.siigo.service');
const prisma = require('../../db/prisma');

class InvoiceSiigoService {
  /**
   * Crea y envía una factura electrónica a la DIAN
   */
  async createElectronicInvoice(facturaId) {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        items: true,
        paciente: true,
        pagos: true
      }
    });

    if (!factura) {
      throw new Error(`Factura ${facturaId} no encontrada`);
    }

    if (factura.siigoId) {
      throw new Error(`Factura ${facturaId} ya fue emitida electrónicamente`);
    }

    try {
      // 1. Asegurar que el paciente está sincronizado en Siigo
      await customerSiigoService.getSiigoIdForPaciente(factura.pacienteId);

      // 2. Preparar datos de la factura
      const invoiceCommand = this.mapFacturaToInvoice(factura);

      // 3. Crear factura en Siigo
      const invoiceApi = siigoService.getInvoiceApi();
      const result = await siigoService.executeWithLogging(
        () => invoiceApi.createInvoice({
          createInvoiceCommand: invoiceCommand
        }),
        {
          operacion: 'createInvoice',
          endpoint: '/invoices',
          metodo: 'POST',
          entidad: 'factura',
          entidadId: facturaId,
          requestBody: invoiceCommand
        }
      );

      // 4. Actualizar factura local con datos de Siigo/DIAN
      const updatedFactura = await prisma.factura.update({
        where: { id: facturaId },
        data: {
          siigoId: result.id,
          cufe: result.stamp?.cufe || null,
          qrCode: result.stamp?.qr_code || null,
          estadoDian: result.stamp?.status === 'Approved' ? 'accepted' : 'pending',
          fechaEmisionDian: new Date(),
          numeroElectronico: result.name || result.number?.toString()
        }
      });

      // 5. Registrar sincronización
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'factura',
            entidadId: facturaId
          }
        },
        update: {
          siigoId: result.id,
          estado: 'sincronizado',
          errorMessage: null,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'factura',
          entidadId: facturaId,
          siigoId: result.id,
          estado: 'sincronizado'
        }
      });

      console.log(`[Siigo] Factura ${factura.numero} emitida electrónicamente: ${result.id}`);
      return { ...result, factura: updatedFactura };
    } catch (error) {
      // Registrar error
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'factura',
            entidadId: facturaId
          }
        },
        update: {
          estado: 'error',
          errorMessage: error.message,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'factura',
          entidadId: facturaId,
          siigoId: '',
          estado: 'error',
          errorMessage: error.message
        }
      });

      console.error(`[Siigo] Error emitiendo factura ${facturaId}:`, error.message);
      throw error;
    }
  }

  /**
   * Mapea una factura del sistema a la estructura de Siigo
   */
  mapFacturaToInvoice(factura) {
    // Determinar método de pago
    const metodoPago = factura.pagos.length > 0
      ? factura.pagos[0].metodoPago
      : 'Efectivo';

    // Determinar si es a crédito
    const esCredito = factura.saldoPendiente > 0;

    return {
      document: { id: 24 }, // ID de Factura de Venta en Siigo
      date: siigoService.formatDate(factura.fechaEmision),
      customer: {
        identification: factura.paciente.cedula,
        branchOffice: 0
      },
      seller: 1, // ID del vendedor por defecto
      observations: this.buildObservations(factura),
      items: factura.items.map(item => this.mapItemToSiigoItem(item)),
      payments: [{
        id: esCredito ? 5636 : siigoService.getPaymentTypeId(metodoPago),
        value: parseFloat(factura.total),
        dueDate: siigoService.formatDate(factura.fechaVencimiento || factura.fechaEmision)
      }],
      stamp: {
        send: true // Enviar a DIAN inmediatamente
      },
      mail: {
        send: !!factura.paciente.email // Enviar por email si tiene
      }
    };
  }

  /**
   * Mapea un item de factura a la estructura de Siigo
   */
  mapItemToSiigoItem(item) {
    return {
      code: this.getProductCode(item),
      description: item.descripcion.substring(0, 500), // Límite de Siigo
      quantity: item.cantidad,
      price: parseFloat(item.precioUnitario),
      discount: parseFloat(item.descuento || 0),
      taxes: [] // Servicios de salud exentos de IVA
    };
  }

  /**
   * Genera el código de producto para Siigo
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

  /**
   * Construye las observaciones de la factura
   */
  buildObservations(factura) {
    const obs = [];

    if (factura.cubiertoPorEPS) {
      obs.push(`Cubierto por EPS: ${factura.paciente.eps || 'N/A'}`);
      if (factura.epsAutorizacion) {
        obs.push(`Autorización: ${factura.epsAutorizacion}`);
      }
    }

    if (factura.observaciones) {
      obs.push(factura.observaciones);
    }

    return obs.join('. ') || 'Servicios médicos';
  }

  /**
   * Obtiene el PDF de la factura electrónica
   */
  async getInvoicePdf(facturaId) {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId }
    });

    if (!factura?.siigoId) {
      throw new Error('Factura no emitida electrónicamente');
    }

    const invoiceApi = siigoService.getInvoiceApi();
    return siigoService.executeWithLogging(
      () => invoiceApi.getInvoicePDF(factura.siigoId),
      {
        operacion: 'getInvoicePDF',
        endpoint: `/invoices/${factura.siigoId}/pdf`,
        metodo: 'GET',
        entidad: 'factura',
        entidadId: facturaId,
        siigoId: factura.siigoId
      }
    );
  }

  /**
   * Consulta el estado de una factura en la DIAN
   */
  async checkDianStatus(facturaId) {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId }
    });

    if (!factura?.siigoId) {
      return { status: 'not_sent', message: 'No emitida electrónicamente' };
    }

    try {
      const invoiceApi = siigoService.getInvoiceApi();
      const errors = await siigoService.executeWithLogging(
        () => invoiceApi.getElectronicInvoiceErrors(factura.siigoId),
        {
          operacion: 'checkDianStatus',
          endpoint: `/invoices/${factura.siigoId}/errors`,
          metodo: 'GET',
          entidad: 'factura',
          entidadId: facturaId,
          siigoId: factura.siigoId
        }
      );

      const status = (!errors || errors.length === 0) ? 'accepted' : 'rejected';

      // Actualizar estado en BD
      await prisma.factura.update({
        where: { id: facturaId },
        data: { estadoDian: status }
      });

      return {
        status,
        errors: errors || [],
        cufe: factura.cufe
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Obtiene los errores de una factura rechazada por DIAN
   */
  async getDianErrors(facturaId) {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId }
    });

    if (!factura?.siigoId) {
      return [];
    }

    try {
      const invoiceApi = siigoService.getInvoiceApi();
      return siigoService.executeWithLogging(
        () => invoiceApi.getElectronicInvoiceErrors(factura.siigoId),
        {
          operacion: 'getDianErrors',
          endpoint: `/invoices/${factura.siigoId}/errors`,
          metodo: 'GET',
          entidad: 'factura',
          entidadId: facturaId,
          siigoId: factura.siigoId
        }
      );
    } catch (error) {
      console.error('[Siigo] Error obteniendo errores DIAN:', error.message);
      return [];
    }
  }

  /**
   * Reenvía la factura por email al paciente
   */
  async resendEmail(facturaId) {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: { paciente: true }
    });

    if (!factura?.siigoId) {
      throw new Error('Factura no emitida electrónicamente');
    }

    if (!factura.paciente.email) {
      throw new Error('El paciente no tiene email registrado');
    }

    const invoiceApi = siigoService.getInvoiceApi();
    return siigoService.executeWithLogging(
      () => invoiceApi.sendElectronicInvoice(factura.siigoId, {
        sendElectronicInvoiceCommand: {
          mail: { send: true }
        }
      }),
      {
        operacion: 'resendInvoiceEmail',
        endpoint: `/invoices/${factura.siigoId}/send`,
        metodo: 'POST',
        entidad: 'factura',
        entidadId: facturaId,
        siigoId: factura.siigoId,
        requestBody: { mail: { send: true } }
      }
    );
  }

  // ============================================================
  // Facturación de Droguería
  // ============================================================

  /**
   * Crea factura electrónica para venta de droguería
   */
  async createElectronicInvoiceDrogueria(ventaId) {
    const venta = await prisma.drogueriaVenta.findUnique({
      where: { id: ventaId },
      include: {
        items: {
          include: { producto: true }
        },
        vendedor: true
      }
    });

    if (!venta) {
      throw new Error(`Venta de droguería ${ventaId} no encontrada`);
    }

    if (venta.siigoId) {
      throw new Error(`Venta ${ventaId} ya fue facturada electrónicamente`);
    }

    try {
      // Asegurar cliente existe (genérico si no tiene documento)
      await customerSiigoService.ensureCustomerExists({
        documento: venta.clienteDocumento || '222222222222',
        nombre: venta.clienteNombre || 'CONSUMIDOR FINAL'
      });

      const invoiceApi = siigoService.getInvoiceApi();

      const invoiceCommand = {
        document: { id: 24 },
        date: siigoService.formatDate(venta.fechaVenta),
        customer: {
          identification: venta.clienteDocumento || '222222222222',
          branchOffice: 0
        },
        seller: 1,
        observations: `Venta droguería ${venta.numeroFactura}`,
        items: venta.items.map(item => ({
          code: item.producto.sku || `DROG-${item.drogueriaProductoId.substring(0, 8)}`,
          description: item.producto.nombre.substring(0, 500),
          quantity: item.cantidad,
          price: item.precioUnitario,
          discount: 0,
          taxes: item.porcentajeIva > 0 ? [{
            id: 1, // IVA
            percentage: item.porcentajeIva
          }] : []
        })),
        payments: [{
          id: siigoService.getPaymentTypeId(venta.metodoPago),
          value: venta.total,
          dueDate: siigoService.formatDate(venta.fechaVenta)
        }],
        stamp: { send: true },
        mail: { send: !!venta.clienteEmail }
      };

      const result = await siigoService.executeWithLogging(
        () => invoiceApi.createInvoice({ createInvoiceCommand: invoiceCommand }),
        {
          operacion: 'createInvoiceDrogueria',
          endpoint: '/invoices',
          metodo: 'POST',
          entidad: 'drogueria_venta',
          entidadId: ventaId,
          requestBody: invoiceCommand
        }
      );

      // Actualizar venta con datos electrónicos
      await prisma.drogueriaVenta.update({
        where: { id: ventaId },
        data: {
          siigoId: result.id,
          cufe: result.stamp?.cufe || null,
          estadoDian: result.stamp?.status === 'Approved' ? 'accepted' : 'pending',
          pdfUrl: result.public_url || null
        }
      });

      // Registrar sincronización
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'drogueria_venta',
            entidadId: ventaId
          }
        },
        update: {
          siigoId: result.id,
          estado: 'sincronizado',
          ultimaSync: new Date()
        },
        create: {
          entidad: 'drogueria_venta',
          entidadId: ventaId,
          siigoId: result.id,
          estado: 'sincronizado'
        }
      });

      console.log(`[Siigo] Venta droguería ${venta.numeroFactura} facturada: ${result.id}`);
      return result;
    } catch (error) {
      console.error(`[Siigo] Error facturando droguería ${ventaId}:`, error.message);

      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'drogueria_venta',
            entidadId: ventaId
          }
        },
        update: {
          estado: 'error',
          errorMessage: error.message,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'drogueria_venta',
          entidadId: ventaId,
          siigoId: '',
          estado: 'error',
          errorMessage: error.message
        }
      });

      throw error;
    }
  }

  // ============================================================
  // Utilidades
  // ============================================================

  /**
   * Obtiene facturas pendientes de emisión electrónica
   */
  async getPendingInvoices() {
    return prisma.factura.findMany({
      where: {
        siigoId: null,
        estado: { not: 'Cancelada' }
      },
      include: {
        paciente: true,
        items: true
      },
      orderBy: { fechaEmision: 'desc' },
      take: 100
    });
  }

  /**
   * Obtiene ventas de droguería pendientes de facturación
   */
  async getPendingDrogueriaVentas() {
    return prisma.drogueriaVenta.findMany({
      where: {
        siigoId: null,
        estado: 'Completada',
        clienteDocumento: { not: null }
      },
      include: {
        items: { include: { producto: true } }
      },
      orderBy: { fechaVenta: 'desc' },
      take: 100
    });
  }

  /**
   * Procesa facturas pendientes en lote
   */
  async processPendingInvoices() {
    const pendientes = await this.getPendingInvoices();

    const results = {
      total: pendientes.length,
      success: 0,
      errors: []
    };

    for (const factura of pendientes) {
      try {
        await this.createElectronicInvoice(factura.id);
        results.success++;
      } catch (error) {
        results.errors.push({
          facturaId: factura.id,
          numero: factura.numero,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Procesadas ${results.success}/${results.total} facturas pendientes`);
    return results;
  }

  /**
   * Verifica el estado DIAN de facturas pendientes
   */
  async verifyPendingDianStatus() {
    const facturas = await prisma.factura.findMany({
      where: {
        siigoId: { not: null },
        estadoDian: 'pending'
      },
      take: 50
    });

    const results = {
      total: facturas.length,
      accepted: 0,
      rejected: 0,
      pending: 0
    };

    for (const factura of facturas) {
      const status = await this.checkDianStatus(factura.id);
      results[status.status]++;
    }

    return results;
  }
  /**
   * Retry syncing a previously failed invoice
   */
  async retrySyncInvoice(facturaId) {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId }
    });

    if (!factura) {
      throw new Error(`Factura ${facturaId} no encontrada`);
    }

    // If already has siigoId, just verify DIAN status
    if (factura.siigoId) {
      return this.checkDianStatus(facturaId);
    }

    // Otherwise, try to emit electronically
    return this.createElectronicInvoice(facturaId);
  }
}

module.exports = new InvoiceSiigoService();
