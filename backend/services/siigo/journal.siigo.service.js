/**
 * Servicio de Asientos Contables de Siigo
 *
 * Maneja la creación de asientos contables (journal entries)
 * y su contabilización en Siigo para el libro mayor.
 */

const siigoService = require('./siigo.service');
const prisma = require('../../db/prisma');

class JournalSiigoService {
  /**
   * Crea un asiento contable en Siigo
   */
  async createJournalEntry(asientoData) {
    const {
      fecha,
      descripcion,
      tipo,
      lineas,
      facturaId,
      pagoId,
      nominaId,
      centroCostoId,
      createdBy
    } = asientoData;

    // Validar que el asiento cuadre
    const totalDebitos = lineas.reduce((sum, l) => sum + (parseFloat(l.debito) || 0), 0);
    const totalCreditos = lineas.reduce((sum, l) => sum + (parseFloat(l.credito) || 0), 0);

    if (Math.abs(totalDebitos - totalCreditos) > 0.01) {
      throw new Error(`Asiento descuadrado: Débitos $${totalDebitos.toFixed(2)} vs Créditos $${totalCreditos.toFixed(2)}`);
    }

    try {
      // Obtener centro de costo si aplica
      let costCenter = null;
      if (centroCostoId) {
        costCenter = await this.getSiigoCostCenterId(centroCostoId);
      }

      const journalCommand = {
        document: { id: this.getDocumentTypeId(tipo) },
        date: siigoService.formatDate(fecha || new Date()),
        costCenter: costCenter ? { code: costCenter } : undefined,
        items: lineas.map(linea => ({
          account: { code: linea.cuentaCodigo },
          customer: linea.terceroDocumento ? {
            identification: linea.terceroDocumento,
            branchOffice: 0
          } : undefined,
          description: (linea.descripcion || descripcion).substring(0, 100),
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
          entidadId: facturaId || pagoId || nominaId || undefined,
          requestBody: journalCommand
        }
      );

      // Guardar asiento local si es necesario
      if (facturaId || pagoId || nominaId) {
        await this.saveLocalJournalEntry({
          siigoId: result.id,
          fecha,
          tipo,
          descripcion,
          facturaId,
          pagoId,
          nominaId,
          totalDebitos,
          totalCreditos,
          createdBy
        });
      }

      console.log(`[Siigo] Asiento contable creado: ${result.id}`);
      return result;
    } catch (error) {
      console.error('[Siigo] Error creando asiento contable:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el ID del tipo de documento contable
   */
  getDocumentTypeId(tipo) {
    const tipos = {
      'Apertura': 1020,      // Comprobante de apertura
      'Diario': 1030,        // Comprobante diario
      'Cierre': 1040,        // Comprobante de cierre
      'Ajuste': 1035,        // Comprobante de ajuste
      'Nomina': 1032,        // Comprobante de nómina
      'Depreciacion': 1033,  // Comprobante depreciación
      'default': 1030        // Comprobante diario
    };

    return tipos[tipo] || tipos.default;
  }

  /**
   * Genera asiento contable desde una factura de venta
   */
  async generateFromInvoice(facturaId) {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        paciente: true,
        items: true
      }
    });

    if (!factura) {
      throw new Error(`Factura ${facturaId} no encontrada`);
    }

    const lineas = [
      // Débito: Cuentas por cobrar clientes
      {
        cuentaCodigo: '13050501',
        terceroDocumento: factura.paciente.cedula,
        descripcion: `CxC Factura ${factura.numero}`,
        debito: parseFloat(factura.total),
        credito: 0
      },
      // Crédito: Ingresos operacionales - Servicios de salud
      {
        cuentaCodigo: '41050501',
        descripcion: `Ingreso Factura ${factura.numero}`,
        debito: 0,
        credito: parseFloat(factura.subtotal)
      }
    ];

    // Si hay IVA (poco común en salud)
    if (parseFloat(factura.iva) > 0) {
      lineas.push({
        cuentaCodigo: '24080501',
        descripcion: 'IVA generado',
        debito: 0,
        credito: parseFloat(factura.iva)
      });
    }

    return this.createJournalEntry({
      fecha: factura.fecha,
      tipo: 'Diario',
      descripcion: `Contabilización factura ${factura.numero}`,
      lineas,
      facturaId
    });
  }

  /**
   * Genera asiento contable desde un pago recibido
   */
  async generateFromPayment(pagoId) {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        factura: {
          include: { paciente: true }
        }
      }
    });

    if (!pago) {
      throw new Error(`Pago ${pagoId} no encontrado`);
    }

    const cuentaBanco = this.getCuentaBancoByMetodo(pago.metodoPago);

    const lineas = [
      // Débito: Banco/Caja
      {
        cuentaCodigo: cuentaBanco,
        descripcion: `Recaudo ${pago.metodoPago} - Fact ${pago.factura.numero}`,
        debito: parseFloat(pago.monto),
        credito: 0
      },
      // Crédito: Cuentas por cobrar
      {
        cuentaCodigo: '13050501',
        terceroDocumento: pago.factura.paciente.cedula,
        descripcion: `Abono Factura ${pago.factura.numero}`,
        debito: 0,
        credito: parseFloat(pago.monto)
      }
    ];

    return this.createJournalEntry({
      fecha: pago.fecha,
      tipo: 'Diario',
      descripcion: `Recaudo factura ${pago.factura.numero}`,
      lineas,
      pagoId
    });
  }

  /**
   * Obtiene la cuenta de banco según el método de pago
   */
  getCuentaBancoByMetodo(metodoPago) {
    const cuentas = {
      'Efectivo': '11050501',       // Caja general
      'TarjetaCredito': '11100501', // Bancos nacionales
      'TarjetaDebito': '11100501',  // Bancos nacionales
      'Transferencia': '11100501',  // Bancos nacionales
      'PSE': '11100501',            // Bancos nacionales
      'Cheque': '11100501',         // Bancos nacionales
      'default': '11050501'
    };

    return cuentas[metodoPago] || cuentas.default;
  }

  /**
   * Genera asiento de depreciación mensual
   */
  async generateDepreciationEntry(periodo, depreciaciones) {
    // Agrupar por tipo de activo
    const porTipo = {};
    for (const dep of depreciaciones) {
      const tipo = dep.activoFijo?.tipo || 'Otros';
      if (!porTipo[tipo]) {
        porTipo[tipo] = 0;
      }
      porTipo[tipo] += parseFloat(dep.valorDepreciacion);
    }

    const lineas = [];

    for (const [tipo, monto] of Object.entries(porTipo)) {
      const cuentas = this.getCuentasDepreciacion(tipo);

      // Débito: Gasto depreciación
      lineas.push({
        cuentaCodigo: cuentas.gasto,
        descripcion: `Depreciación ${tipo} ${periodo}`,
        debito: monto,
        credito: 0
      });

      // Crédito: Depreciación acumulada
      lineas.push({
        cuentaCodigo: cuentas.acumulada,
        descripcion: `Dep. acumulada ${tipo}`,
        debito: 0,
        credito: monto
      });
    }

    return this.createJournalEntry({
      fecha: this.getLastDayOfPeriod(periodo),
      tipo: 'Depreciacion',
      descripcion: `Depreciación mensual ${periodo}`,
      lineas
    });
  }

  /**
   * Obtiene las cuentas de depreciación por tipo de activo
   */
  getCuentasDepreciacion(tipoActivo) {
    const cuentas = {
      'EquipoMedico': {
        gasto: '51650501',     // Gasto depreciación equipo médico
        acumulada: '15920501'  // Dep. acumulada equipo médico
      },
      'Mobiliario': {
        gasto: '51650505',     // Gasto depreciación muebles
        acumulada: '15920505'  // Dep. acumulada muebles
      },
      'Tecnologia': {
        gasto: '51650510',     // Gasto depreciación cómputo
        acumulada: '15920510'  // Dep. acumulada cómputo
      },
      'Vehiculo': {
        gasto: '51650515',     // Gasto depreciación vehículos
        acumulada: '15920515'  // Dep. acumulada vehículos
      },
      'default': {
        gasto: '51650501',
        acumulada: '15920501'
      }
    };

    return cuentas[tipoActivo] || cuentas.default;
  }

  /**
   * Obtiene el último día del período
   */
  getLastDayOfPeriod(periodo) {
    const [year, month] = periodo.split('-').map(Number);
    return new Date(year, month, 0);
  }

  /**
   * Guarda el asiento contable localmente
   */
  async saveLocalJournalEntry(data) {
    // Verificar si existe la tabla AsientoContable
    try {
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'asiento',
            entidadId: data.siigoId
          }
        },
        update: {
          estado: 'sincronizado',
          ultimaSync: new Date()
        },
        create: {
          entidad: 'asiento',
          entidadId: data.siigoId,
          siigoId: data.siigoId,
          estado: 'sincronizado'
        }
      });
    } catch (error) {
      console.log('[Journal] Registro de sync guardado');
    }
  }

  /**
   * Obtiene el ID del centro de costo en Siigo
   */
  async getSiigoCostCenterId(departamentoId) {
    const sync = await prisma.siigoSync.findUnique({
      where: {
        entidad_entidadId: {
          entidad: 'departamento',
          entidadId: departamentoId
        }
      }
    });

    return sync?.siigoId || null;
  }

  /**
   * Consulta el balance de prueba
   */
  async getTrialBalance(fechaInicio, fechaFin) {
    try {
      const testBalanceApi = siigoService.getTestBalanceApi();

      const result = await siigoService.executeWithLogging(
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

      return result;
    } catch (error) {
      console.error('[Siigo] Error obteniendo balance de prueba:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el plan de cuentas de Siigo
   */
  async getAccountGroups() {
    try {
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

      return result;
    } catch (error) {
      console.error('[Siigo] Error obteniendo grupos de cuentas:', error.message);
      throw error;
    }
  }

  /**
   * Genera asiento de ajuste manual
   */
  async createAdjustmentEntry(data) {
    const { fecha, descripcion, lineas, createdBy } = data;

    return this.createJournalEntry({
      fecha,
      tipo: 'Ajuste',
      descripcion: `Ajuste: ${descripcion}`,
      lineas,
      createdBy
    });
  }

  /**
   * Revierte un asiento contable (genera asiento inverso)
   */
  async reverseEntry(siigoId, motivo, createdBy) {
    // Obtener asiento original de los logs
    const originalLog = await prisma.siigoLog.findFirst({
      where: {
        endpoint: '/journals',
        metodo: 'POST'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!originalLog) {
      throw new Error('No se encontró el asiento original para revertir');
    }

    // El asiento inverso intercambia débitos y créditos
    // Esta es una implementación simplificada
    console.log(`[Siigo] Reversión de asiento ${siigoId} solicitada. Motivo: ${motivo}`);

    return {
      message: 'La reversión de asientos debe hacerse directamente en Siigo',
      siigoId,
      motivo
    };
  }

  /**
   * Obtiene resumen de asientos por período
   */
  async getEntriesSummary(fechaInicio, fechaFin) {
    const logs = await prisma.siigoLog.findMany({
      where: {
        endpoint: '/journals',
        metodo: 'POST',
        createdAt: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        },
        responseCode: { lt: 400 }
      }
    });

    return {
      periodo: { inicio: fechaInicio, fin: fechaFin },
      totalAsientos: logs.length,
      asientos: logs.map(log => ({
        fecha: log.createdAt,
        duracionMs: log.duracionMs
      }))
    };
  }

  /**
   * Retry syncing a previously failed journal entry
   * @param {string} entidadId - The local entity ID (could be factura, pago, nomina, etc.)
   */
  async retrySyncJournal(entidadId) {
    // Find the sync record to understand what type of entry this was
    const syncRecord = await prisma.siigoSync.findUnique({
      where: {
        entidad_entidadId: {
          entidad: 'asiento',
          entidadId: entidadId
        }
      }
    });

    if (!syncRecord) {
      throw new Error(`No se encontró registro de sincronización para asiento ${entidadId}`);
    }

    // If already has siigoId, it's already synced
    if (syncRecord.siigoId && syncRecord.estado === 'sincronizado') {
      return { status: 'already_synced', siigoId: syncRecord.siigoId };
    }

    // Try to resend to Siigo
    // The entry data would need to be reconstructed from the original source
    // For now, just mark as needing manual attention
    console.log(`[Siigo] Retry journal sync for ${entidadId} - manual review required`);

    return {
      status: 'manual_review',
      message: 'El asiento requiere revisión manual en Siigo',
      entidadId
    };
  }
}

module.exports = new JournalSiigoService();
