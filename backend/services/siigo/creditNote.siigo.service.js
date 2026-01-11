/**
 * Servicio de Notas Crédito de Siigo
 *
 * Maneja la emisión de notas crédito electrónicas DIAN,
 * para devoluciones, anulaciones y ajustes de facturas.
 */

const siigoService = require('./siigo.service');
const prisma = require('../../db/prisma');

class CreditNoteSiigoService {
  /**
   * Crea y envía una nota crédito electrónica a la DIAN
   */
  async createElectronicCreditNote(notaCreditoId) {
    const notaCredito = await prisma.notaCredito.findUnique({
      where: { id: notaCreditoId },
      include: {
        items: true,
        factura: {
          include: {
            paciente: true
          }
        }
      }
    });

    if (!notaCredito) {
      throw new Error(`Nota crédito ${notaCreditoId} no encontrada`);
    }

    if (notaCredito.siigoId) {
      throw new Error(`Nota crédito ${notaCreditoId} ya fue emitida electrónicamente`);
    }

    if (!notaCredito.factura.siigoId) {
      throw new Error(`La factura original ${notaCredito.facturaId} no ha sido emitida electrónicamente`);
    }

    try {
      // Preparar datos de la nota crédito
      const creditNoteCommand = this.mapNotaCreditoToSiigo(notaCredito);

      // Crear nota crédito en Siigo
      const creditNoteApi = siigoService.getCreditNoteApi();
      const result = await siigoService.executeWithLogging(
        () => creditNoteApi.createCreditNote({
          createCreditNoteCommand: creditNoteCommand
        }),
        {
          operacion: 'createCreditNote',
          endpoint: '/credit-notes',
          metodo: 'POST',
          entidad: 'nota_credito',
          entidadId: notaCreditoId,
          requestBody: creditNoteCommand
        }
      );

      // Actualizar nota crédito local con datos de Siigo/DIAN
      const updatedNotaCredito = await prisma.notaCredito.update({
        where: { id: notaCreditoId },
        data: {
          siigoId: result.id,
          cufe: result.stamp?.cufe || null,
          estadoDian: result.stamp?.status === 'Approved' ? 'accepted' : 'pending',
          fechaEmisionDian: new Date()
        }
      });

      // Registrar sincronización
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'nota_credito',
            entidadId: notaCreditoId
          }
        },
        update: {
          siigoId: result.id,
          estado: 'sincronizado',
          errorMessage: null,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'nota_credito',
          entidadId: notaCreditoId,
          siigoId: result.id,
          estado: 'sincronizado'
        }
      });

      console.log(`[Siigo] Nota crédito ${notaCredito.numero} emitida electrónicamente: ${result.id}`);
      return { ...result, notaCredito: updatedNotaCredito };
    } catch (error) {
      // Registrar error
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'nota_credito',
            entidadId: notaCreditoId
          }
        },
        update: {
          estado: 'error',
          errorMessage: error.message,
          ultimaSync: new Date()
        },
        create: {
          entidad: 'nota_credito',
          entidadId: notaCreditoId,
          siigoId: '',
          estado: 'error',
          errorMessage: error.message
        }
      });

      console.error(`[Siigo] Error emitiendo nota crédito ${notaCreditoId}:`, error.message);
      throw error;
    }
  }

  /**
   * Mapea una nota crédito del sistema a la estructura de Siigo
   */
  mapNotaCreditoToSiigo(notaCredito) {
    return {
      document: { id: 25 }, // ID de Nota Crédito en Siigo
      date: siigoService.formatDate(notaCredito.fecha),
      customer: {
        identification: notaCredito.factura.paciente.cedula,
        branchOffice: 0
      },
      costCenter: null, // Centro de costo si aplica
      // Referencia a factura original (requerido para DIAN)
      observations: this.buildObservations(notaCredito),
      items: notaCredito.items.map(item => this.mapItemToSiigoItem(item)),
      // Motivo de la nota crédito (códigos DIAN)
      reason: this.mapMotivo(notaCredito.motivo),
      // Referencia a la factura electrónica original
      stamp: {
        send: true // Enviar a DIAN inmediatamente
      },
      mail: {
        send: !!notaCredito.factura.paciente.email
      }
    };
  }

  /**
   * Mapea un item de nota crédito a la estructura de Siigo
   */
  mapItemToSiigoItem(item) {
    return {
      code: item.codigo || 'NC-ITEM',
      description: item.descripcion.substring(0, 500),
      quantity: item.cantidad,
      price: parseFloat(item.precioUnitario),
      discount: 0,
      taxes: [] // Servicios de salud exentos de IVA
    };
  }

  /**
   * Mapea el motivo de nota crédito a código DIAN
   */
  mapMotivo(motivo) {
    // Códigos de concepto de corrección según DIAN
    const motivos = {
      'Devolucion': 1,        // Devolución de parte o la totalidad de bienes
      'Anulacion': 2,         // Anulación de factura electrónica
      'Rebate': 3,            // Rebaja o descuento parcial
      'AjustePrecio': 4,      // Ajuste de precio
      'Error': 5,             // Otros (error en datos)
      'default': 2            // Por defecto: Anulación
    };

    return motivos[motivo] || motivos.default;
  }

  /**
   * Construye las observaciones de la nota crédito
   */
  buildObservations(notaCredito) {
    const obs = [];

    obs.push(`Nota Crédito por ${notaCredito.motivo}`);
    obs.push(`Ref. Factura: ${notaCredito.factura.numero}`);

    if (notaCredito.factura.cufe) {
      obs.push(`CUFE Original: ${notaCredito.factura.cufe.substring(0, 20)}...`);
    }

    if (notaCredito.descripcion) {
      obs.push(notaCredito.descripcion);
    }

    return obs.join('. ');
  }

  /**
   * Obtiene el PDF de la nota crédito electrónica
   */
  async getCreditNotePdf(notaCreditoId) {
    const notaCredito = await prisma.notaCredito.findUnique({
      where: { id: notaCreditoId }
    });

    if (!notaCredito?.siigoId) {
      throw new Error('Nota crédito no emitida electrónicamente');
    }

    const creditNoteApi = siigoService.getCreditNoteApi();
    return siigoService.executeWithLogging(
      () => creditNoteApi.getCreditNotePDF(notaCredito.siigoId),
      {
        operacion: 'getCreditNotePDF',
        endpoint: `/credit-notes/${notaCredito.siigoId}/pdf`,
        metodo: 'GET',
        entidad: 'nota_credito',
        entidadId: notaCreditoId,
        siigoId: notaCredito.siigoId
      }
    );
  }

  /**
   * Consulta el estado de una nota crédito en la DIAN
   */
  async checkDianStatus(notaCreditoId) {
    const notaCredito = await prisma.notaCredito.findUnique({
      where: { id: notaCreditoId }
    });

    if (!notaCredito?.siigoId) {
      return { status: 'not_sent', message: 'No emitida electrónicamente' };
    }

    try {
      const creditNoteApi = siigoService.getCreditNoteApi();
      const errors = await siigoService.executeWithLogging(
        () => creditNoteApi.getElectronicCreditNoteErrors(notaCredito.siigoId),
        {
          operacion: 'checkCreditNoteDianStatus',
          endpoint: `/credit-notes/${notaCredito.siigoId}/errors`,
          metodo: 'GET',
          entidad: 'nota_credito',
          entidadId: notaCreditoId,
          siigoId: notaCredito.siigoId
        }
      );

      const status = (!errors || errors.length === 0) ? 'accepted' : 'rejected';

      // Actualizar estado en BD
      await prisma.notaCredito.update({
        where: { id: notaCreditoId },
        data: { estadoDian: status }
      });

      return {
        status,
        errors: errors || [],
        cufe: notaCredito.cufe
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Crea una nota crédito completa (modelo local + Siigo)
   */
  async createCreditNote(data) {
    const { facturaId, motivo, descripcion, items, createdBy } = data;

    // Validar factura
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: { items: true }
    });

    if (!factura) {
      throw new Error(`Factura ${facturaId} no encontrada`);
    }

    // Calcular totales
    const subtotal = items.reduce((sum, item) =>
      sum + (parseFloat(item.cantidad) * parseFloat(item.precioUnitario)), 0);
    const total = subtotal; // Sin IVA para servicios de salud

    // Generar número de nota crédito
    const numero = await this.getNextNumber();

    // Crear nota crédito en BD
    const notaCredito = await prisma.notaCredito.create({
      data: {
        numero,
        facturaId,
        fecha: new Date(),
        motivo,
        descripcion,
        subtotal,
        total,
        createdBy,
        items: {
          create: items.map(item => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.cantidad * item.precioUnitario
          }))
        }
      },
      include: {
        items: true,
        factura: { include: { paciente: true } }
      }
    });

    // Emitir electrónicamente si la factura original ya fue emitida
    if (factura.siigoId) {
      try {
        await this.createElectronicCreditNote(notaCredito.id);
      } catch (error) {
        console.error('[Siigo] Error emitiendo NC electrónica:', error.message);
        // No fallar la creación, marcar para reintento
      }
    }

    return notaCredito;
  }

  /**
   * Genera el siguiente número de nota crédito
   */
  async getNextNumber() {
    const year = new Date().getFullYear();
    const lastNC = await prisma.notaCredito.findFirst({
      where: {
        numero: { startsWith: `NC-${year}` }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastNC) {
      return `NC-${year}-00001`;
    }

    const parts = lastNC.numero.split('-');
    const lastNumber = parseInt(parts[2]) || 0;
    return `NC-${year}-${String(lastNumber + 1).padStart(5, '0')}`;
  }

  /**
   * Obtiene notas crédito pendientes de emisión electrónica
   */
  async getPendingCreditNotes() {
    return prisma.notaCredito.findMany({
      where: {
        siigoId: null,
        factura: {
          siigoId: { not: null }
        }
      },
      include: {
        factura: {
          include: { paciente: true }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  /**
   * Procesa notas crédito pendientes en lote
   */
  async processPendingCreditNotes() {
    const pendientes = await this.getPendingCreditNotes();

    const results = {
      total: pendientes.length,
      success: 0,
      errors: []
    };

    for (const nc of pendientes) {
      try {
        await this.createElectronicCreditNote(nc.id);
        results.success++;
      } catch (error) {
        results.errors.push({
          notaCreditoId: nc.id,
          numero: nc.numero,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Procesadas ${results.success}/${results.total} notas crédito pendientes`);
    return results;
  }

  /**
   * Reintenta sincronizar una nota crédito fallida
   * Usado por el cron job de sincronización
   */
  async retrySyncCreditNote(notaCreditoId) {
    const notaCredito = await prisma.notaCredito.findUnique({
      where: { id: notaCreditoId }
    });

    if (!notaCredito) {
      throw new Error(`Nota crédito ${notaCreditoId} no encontrada`);
    }

    // Si ya tiene siigoId, verificar estado DIAN
    if (notaCredito.siigoId) {
      return this.checkDianStatus(notaCreditoId);
    }

    // Intentar crear en Siigo
    return this.createElectronicCreditNote(notaCreditoId);
  }
}

module.exports = new CreditNoteSiigoService();
