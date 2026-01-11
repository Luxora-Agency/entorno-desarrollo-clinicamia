/**
 * Siigo Sync Cron Job
 * Periodic synchronization tasks with Siigo API
 */
const cron = require('node-cron');
const prisma = require('../db/prisma');

class SiigoSyncJob {
  constructor() {
    this.isRunning = false;
    this.siigoService = null;
  }

  getSiigoService() {
    if (!this.siigoService) {
      this.siigoService = require('../services/siigo/siigo.service');
    }
    return this.siigoService;
  }

  start() {
    // Every 5 minutes: Retry failed sync operations
    cron.schedule('*/5 * * * *', async () => {
      if (this.isRunning) return;
      this.isRunning = true;

      try {
        await this.retryFailedSyncs();
      } catch (error) {
        console.error('[SiigoSync] Error in retry job:', error.message);
      } finally {
        this.isRunning = false;
      }
    });

    // Every hour: Check DIAN status for pending invoices
    cron.schedule('0 * * * *', async () => {
      try {
        await this.checkDianStatus();
      } catch (error) {
        console.error('[SiigoSync] Error checking DIAN status:', error.message);
      }
    });

    // Daily at 6am: Sync catalogs
    cron.schedule('0 6 * * *', async () => {
      try {
        await this.syncCatalogs();
      } catch (error) {
        console.error('[SiigoSync] Error syncing catalogs:', error.message);
      }
    });

    // Every 30 minutes: Sync pending invoices
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.syncPendingInvoices();
      } catch (error) {
        console.error('[SiigoSync] Error syncing pending invoices:', error.message);
      }
    });

    // Every 15 minutes: Sync pending payment vouchers
    cron.schedule('*/15 * * * *', async () => {
      try {
        await this.syncPendingPayments();
      } catch (error) {
        console.error('[SiigoSync] Error syncing pending payments:', error.message);
      }
    });

    console.log('[SiigoSync] Cron jobs started');
  }

  async syncPendingPayments() {
    const siigoService = this.getSiigoService();

    if (!siigoService.initialized) {
      return;
    }

    // Find payments that should have vouchers but don't
    const pagosSinRecibo = await prisma.pago.findMany({
      where: {
        siigoId: null,
        factura: {
          siigoId: { not: null } // Only for invoices already in Siigo
        }
      },
      include: {
        factura: {
          include: { paciente: true }
        }
      },
      take: 30,
      orderBy: { createdAt: 'desc' }
    });

    if (pagosSinRecibo.length === 0) return;

    console.log(`[SiigoSync] Syncing ${pagosSinRecibo.length} pending payment vouchers...`);

    const voucherService = require('../services/siigo/voucher.siigo.service');

    for (const pago of pagosSinRecibo) {
      try {
        await voucherService.createVoucher(pago.id);
        console.log(`[SiigoSync] ✓ Voucher created for payment ${pago.id}`);
      } catch (error) {
        console.error(`[SiigoSync] ✗ Failed to create voucher for payment ${pago.id}:`, error.message);

        // Create sync error record
        await prisma.siigoSync.upsert({
          where: {
            entidad_entidadId: { entidad: 'pago', entidadId: pago.id }
          },
          update: {
            estado: 'error',
            errorMessage: error.message,
            ultimaSync: new Date()
          },
          create: {
            entidad: 'pago',
            entidadId: pago.id,
            estado: 'error',
            errorMessage: error.message
          }
        });
      }
    }
  }

  async retryFailedSyncs() {
    const siigoService = this.getSiigoService();

    // Check if Siigo is connected
    if (!siigoService.initialized) {
      return; // Skip if not connected
    }

    const pendientes = await prisma.siigoSync.findMany({
      where: { estado: 'error' },
      take: 10,
      orderBy: { ultimaSync: 'asc' }
    });

    if (pendientes.length === 0) return;

    console.log(`[SiigoSync] Retrying ${pendientes.length} failed syncs...`);

    for (const sync of pendientes) {
      try {
        let success = false;

        // Retry based on entity type
        switch (sync.entidad) {
          case 'paciente':
            const customerService = require('../services/siigo/customer.siigo.service');
            await customerService.syncPaciente(sync.entidadId);
            success = true;
            break;

          case 'producto':
            const productService = require('../services/siigo/product.siigo.service');
            await productService.syncProductoFarmacia(sync.entidadId);
            success = true;
            break;

          case 'factura':
            const invoiceService = require('../services/siigo/invoice.siigo.service');
            await invoiceService.retrySyncInvoice(sync.entidadId);
            success = true;
            break;

          case 'pago':
            const voucherService = require('../services/siigo/voucher.siigo.service');
            await voucherService.createVoucher(sync.entidadId);
            success = true;
            break;

          case 'asiento':
            const journalService = require('../services/siigo/journal.siigo.service');
            await journalService.retrySyncJournal(sync.entidadId);
            success = true;
            break;

          case 'nota_credito':
          case 'notaCredito': // Legacy compatibility
            const creditNoteService = require('../services/siigo/creditNote.siigo.service');
            await creditNoteService.retrySyncCreditNote(sync.entidadId);
            success = true;
            break;

          default:
            console.warn(`[SiigoSync] Unknown entity type: ${sync.entidad}`);
        }

        if (success) {
          await prisma.siigoSync.update({
            where: { id: sync.id },
            data: {
              estado: 'sincronizado',
              errorMessage: null,
              ultimaSync: new Date()
            }
          });
          console.log(`[SiigoSync] ✓ Retry successful for ${sync.entidad}:${sync.entidadId}`);
        }
      } catch (error) {
        // Update error message and increment retry count
        await prisma.siigoSync.update({
          where: { id: sync.id },
          data: {
            errorMessage: error.message,
            ultimaSync: new Date()
          }
        });
        console.error(`[SiigoSync] ✗ Retry failed for ${sync.entidad}:${sync.entidadId}:`, error.message);
      }
    }
  }

  async checkDianStatus() {
    const siigoService = this.getSiigoService();

    if (!siigoService.initialized) {
      return;
    }

    const facturasPendientes = await prisma.factura.findMany({
      where: {
        estadoDian: 'PENDIENTE',
        siigoId: { not: null }
      },
      take: 50
    });

    if (facturasPendientes.length === 0) return;

    console.log(`[SiigoSync] Checking DIAN status for ${facturasPendientes.length} invoices...`);

    const invoiceService = require('../services/siigo/invoice.siigo.service');

    for (const factura of facturasPendientes) {
      try {
        const status = await invoiceService.checkDianStatus(factura.id);
        console.log(`[SiigoSync] Invoice ${factura.numero}: DIAN status = ${status}`);
      } catch (error) {
        console.error(`[SiigoSync] Error checking DIAN for ${factura.numero}:`, error.message);
      }
    }
  }

  async syncCatalogs() {
    const siigoService = this.getSiigoService();

    if (!siigoService.initialized) {
      console.log('[SiigoSync] Skipping catalog sync - Siigo not connected');
      return;
    }

    console.log('[SiigoSync] Starting daily catalog sync...');

    try {
      const catalogsService = require('../services/siigo/catalogs.siigo.service');
      const results = await catalogsService.syncAllCatalogs();

      console.log('[SiigoSync] Catalog sync results:', results);
    } catch (error) {
      console.error('[SiigoSync] Catalog sync error:', error.message);
    }

    console.log('[SiigoSync] Catalog sync completed');
  }

  async syncPendingInvoices() {
    const siigoService = this.getSiigoService();

    if (!siigoService.initialized) {
      return;
    }

    // Find invoices that should have been synced but weren't
    const facturasSinSync = await prisma.factura.findMany({
      where: {
        siigoId: null,
        estado: { not: 'CANCELADA' },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      take: 20
    });

    if (facturasSinSync.length === 0) return;

    console.log(`[SiigoSync] Syncing ${facturasSinSync.length} pending invoices...`);

    const invoiceService = require('../services/siigo/invoice.siigo.service');

    for (const factura of facturasSinSync) {
      try {
        await invoiceService.createElectronicInvoice(factura.id);
        console.log(`[SiigoSync] ✓ Invoice ${factura.numero} synced to Siigo`);
      } catch (error) {
        console.error(`[SiigoSync] ✗ Failed to sync invoice ${factura.numero}:`, error.message);

        // Create sync error record
        await prisma.siigoSync.upsert({
          where: {
            entidad_entidadId: { entidad: 'factura', entidadId: factura.id }
          },
          update: {
            estado: 'error',
            errorMessage: error.message,
            ultimaSync: new Date()
          },
          create: {
            entidad: 'factura',
            entidadId: factura.id,
            estado: 'error',
            errorMessage: error.message
          }
        });
      }
    }
  }
}

module.exports = new SiigoSyncJob();
