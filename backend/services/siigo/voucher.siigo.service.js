/**
 * Servicio de Recibos de Caja (Vouchers) de Siigo
 *
 * Maneja la creación de recibos de caja y comprobantes
 * de pago en Siigo para registro contable.
 */

const siigoService = require('./siigo.service');
const prisma = require('../../db/prisma');

class VoucherSiigoService {
  /**
   * Crea un recibo de caja en Siigo para un pago
   */
  async createVoucher(pagoId) {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        factura: {
          include: {
            paciente: true
          }
        }
      }
    });

    if (!pago) {
      throw new Error(`Pago ${pagoId} no encontrado`);
    }

    if (pago.siigoId) {
      throw new Error(`Pago ${pagoId} ya tiene recibo electrónico`);
    }

    try {
      const voucherCommand = this.mapPagoToVoucher(pago);

      const voucherApi = siigoService.getVoucherApi();
      const result = await siigoService.executeWithLogging(
        () => voucherApi.createVoucher({
          createVoucherCommand: voucherCommand
        }),
        {
          operacion: 'createVoucher',
          endpoint: '/vouchers',
          metodo: 'POST',
          entidad: 'pago',
          entidadId: pagoId,
          requestBody: voucherCommand
        }
      );

      // Actualizar pago con datos de Siigo
      await prisma.pago.update({
        where: { id: pagoId },
        data: {
          siigoId: result.id,
          numeroRecibo: result.name || result.number?.toString()
        }
      });

      // Registrar sincronización
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'pago',
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
          entidad: 'pago',
          entidadId: pagoId,
          siigoId: result.id,
          estado: 'sincronizado'
        }
      });

      console.log(`[Siigo] Recibo de caja creado para pago ${pagoId}: ${result.id}`);
      return result;
    } catch (error) {
      // Registrar error
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'pago',
            entidadId: pagoId
          }
        },
        update: {
          estado: 'error',
          errorMessage: error.message,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'pago',
          entidadId: pagoId,
          siigoId: '',
          estado: 'error',
          errorMessage: error.message
        }
      });

      console.error(`[Siigo] Error creando recibo de caja ${pagoId}:`, error.message);
      throw error;
    }
  }

  /**
   * Mapea un pago del sistema a la estructura de voucher de Siigo
   */
  mapPagoToVoucher(pago) {
    const esTarjeta = pago.metodoPago?.toLowerCase().includes('tarjeta');
    const esTransferencia = pago.metodoPago?.toLowerCase().includes('transferencia') ||
                            pago.metodoPago?.toLowerCase().includes('pse');

    return {
      document: { id: 1050 }, // Recibo de caja
      date: siigoService.formatDate(pago.fecha || pago.createdAt),
      type: 'Customer', // Recibo de cliente
      customer: {
        identification: pago.factura.paciente.cedula,
        branchOffice: 0
      },
      observations: this.buildObservations(pago),
      items: [
        {
          account: {
            code: this.getCuentaContable(pago.metodoPago)
          },
          customer: {
            identification: pago.factura.paciente.cedula,
            branchOffice: 0
          },
          description: `Pago factura ${pago.factura.numero}`,
          value: parseFloat(pago.monto)
        }
      ],
      payments: [{
        id: siigoService.getPaymentTypeId(pago.metodoPago),
        value: parseFloat(pago.monto),
        dueDate: siigoService.formatDate(pago.fecha || pago.createdAt)
      }]
    };
  }

  /**
   * Obtiene la cuenta contable según el método de pago
   */
  getCuentaContable(metodoPago) {
    // Cuentas contables del plan único de cuentas colombiano
    const cuentas = {
      'Efectivo': '11050501',         // Caja general
      'TarjetaCredito': '11100501',   // Bancos nacionales (datáfono)
      'TarjetaDebito': '11100501',    // Bancos nacionales
      'Tarjeta': '11100501',          // Bancos nacionales
      'Transferencia': '11100501',    // Bancos nacionales
      'PSE': '11100501',              // Bancos nacionales
      'Cheque': '11100501',           // Bancos nacionales
      'default': '11050501'           // Caja general
    };

    return cuentas[metodoPago] || cuentas.default;
  }

  /**
   * Construye las observaciones del recibo
   */
  buildObservations(pago) {
    const obs = [];

    obs.push(`Recibo de pago factura ${pago.factura.numero}`);
    obs.push(`Método: ${pago.metodoPago}`);

    if (pago.referencia) {
      obs.push(`Ref: ${pago.referencia}`);
    }

    if (pago.notas) {
      obs.push(pago.notas);
    }

    return obs.join('. ');
  }

  /**
   * Crea comprobante de egreso (pago a proveedor)
   * Para el módulo de compras y proveedores
   */
  async createPaymentVoucher(data) {
    const { proveedorId, monto, metodoPago, referencia, facturaProveedorId, createdBy } = data;

    const proveedor = await prisma.proveedor?.findUnique({
      where: { id: proveedorId }
    });

    if (!proveedor) {
      throw new Error(`Proveedor ${proveedorId} no encontrado`);
    }

    const voucherCommand = {
      document: { id: 1051 }, // Comprobante de egreso
      date: siigoService.formatDate(new Date()),
      type: 'Vendor', // Pago a proveedor
      customer: {
        identification: proveedor.documento,
        branchOffice: 0
      },
      observations: `Pago a ${proveedor.razonSocial}${referencia ? ` - Ref: ${referencia}` : ''}`,
      items: [
        {
          account: {
            code: '22050501' // Proveedores nacionales
          },
          customer: {
            identification: proveedor.documento,
            branchOffice: 0
          },
          description: `Pago proveedor${facturaProveedorId ? ` factura ${facturaProveedorId}` : ''}`,
          debit: parseFloat(monto)
        },
        {
          account: {
            code: this.getCuentaContable(metodoPago)
          },
          description: `Egreso ${metodoPago}`,
          credit: parseFloat(monto)
        }
      ],
      payments: [{
        id: siigoService.getPaymentTypeId(metodoPago),
        value: parseFloat(monto)
      }]
    };

    const voucherApi = siigoService.getVoucherApi();
    const result = await siigoService.executeWithLogging(
      () => voucherApi.createVoucher({ createVoucherCommand: voucherCommand }),
      {
        operacion: 'createPaymentVoucher',
        endpoint: '/vouchers',
        metodo: 'POST',
        entidad: 'pago_proveedor',
        entidadId: proveedorId,
        requestBody: voucherCommand
      }
    );

    console.log(`[Siigo] Comprobante de egreso creado: ${result.id}`);
    return result;
  }

  /**
   * Envía recibo electrónico por email
   */
  async sendElectronicVoucher(pagoId) {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        factura: { include: { paciente: true } }
      }
    });

    if (!pago?.siigoId) {
      throw new Error('Pago no tiene recibo electrónico');
    }

    if (!pago.factura.paciente.email) {
      throw new Error('El paciente no tiene email registrado');
    }

    const voucherApi = siigoService.getVoucherApi();
    return siigoService.executeWithLogging(
      () => voucherApi.sendElectronicVoucher(pago.siigoId, {
        sendElectronicVoucherCommand: {
          mail: { send: true }
        }
      }),
      {
        operacion: 'sendVoucherEmail',
        endpoint: `/vouchers/${pago.siigoId}/send`,
        metodo: 'POST',
        entidad: 'pago',
        entidadId: pagoId,
        siigoId: pago.siigoId,
        requestBody: { mail: { send: true } }
      }
    );
  }

  /**
   * Obtiene el PDF del recibo de caja
   */
  async getVoucherPdf(pagoId) {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId }
    });

    if (!pago?.siigoId) {
      throw new Error('Pago no tiene recibo electrónico');
    }

    const voucherApi = siigoService.getVoucherApi();
    return siigoService.executeWithLogging(
      () => voucherApi.getVoucherPDF(pago.siigoId),
      {
        operacion: 'getVoucherPDF',
        endpoint: `/vouchers/${pago.siigoId}/pdf`,
        metodo: 'GET',
        entidad: 'pago',
        entidadId: pagoId,
        siigoId: pago.siigoId
      }
    );
  }

  /**
   * Obtiene pagos pendientes de generar recibo
   */
  async getPendingPayments() {
    return prisma.pago.findMany({
      where: {
        siigoId: null,
        factura: {
          siigoId: { not: null } // Solo facturas ya emitidas electrónicamente
        }
      },
      include: {
        factura: {
          include: { paciente: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  /**
   * Procesa pagos pendientes en lote
   */
  async processPendingPayments() {
    const pendientes = await this.getPendingPayments();

    const results = {
      total: pendientes.length,
      success: 0,
      errors: []
    };

    for (const pago of pendientes) {
      try {
        await this.createVoucher(pago.id);
        results.success++;
      } catch (error) {
        results.errors.push({
          pagoId: pago.id,
          facturaNumero: pago.factura.numero,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Procesados ${results.success}/${results.total} recibos pendientes`);
    return results;
  }

  /**
   * Crea asiento contable manual (journal entry)
   * Para registros contables especiales
   */
  async createJournalEntry(data) {
    const { fecha, descripcion, lineas, createdBy } = data;

    // Validar que cuadre el asiento
    const totalDebitos = lineas.reduce((sum, l) => sum + (parseFloat(l.debito) || 0), 0);
    const totalCreditos = lineas.reduce((sum, l) => sum + (parseFloat(l.credito) || 0), 0);

    if (Math.abs(totalDebitos - totalCreditos) > 0.01) {
      throw new Error(`Asiento descuadrado: Débitos ${totalDebitos} vs Créditos ${totalCreditos}`);
    }

    const journalCommand = {
      document: { id: 1030 }, // Comprobante diario
      date: siigoService.formatDate(fecha || new Date()),
      items: lineas.map(linea => ({
        account: { code: linea.cuentaCodigo },
        customer: linea.terceroDocumento ? {
          identification: linea.terceroDocumento,
          branchOffice: 0
        } : undefined,
        description: linea.descripcion || descripcion,
        debit: parseFloat(linea.debito) || 0,
        credit: parseFloat(linea.credito) || 0
      }))
    };

    const journalApi = siigoService.getJournalApi();
    const result = await siigoService.executeWithLogging(
      () => journalApi.createJournal({ createJournalEntryCommand: journalCommand }),
      {
        operacion: 'createJournalEntry',
        endpoint: '/journals',
        metodo: 'POST',
        entidad: 'asiento',
        requestBody: journalCommand
      }
    );

    console.log(`[Siigo] Asiento contable creado: ${result.id}`);
    return result;
  }

  /**
   * Obtiene el balance de prueba desde Siigo
   */
  async getTrialBalance(fechaInicio, fechaFin) {
    const testBalanceApi = siigoService.getTestBalanceApi();
    return siigoService.executeWithLogging(
      () => testBalanceApi.createTestBalance({
        createTestBalanceCommand: {
          startDate: siigoService.formatDate(fechaInicio),
          endDate: siigoService.formatDate(fechaFin)
        }
      }),
      {
        operacion: 'getTrialBalance',
        endpoint: '/test-balance',
        metodo: 'POST',
        entidad: 'reporte',
        requestBody: { startDate: fechaInicio, endDate: fechaFin }
      }
    );
  }
}

module.exports = new VoucherSiigoService();
