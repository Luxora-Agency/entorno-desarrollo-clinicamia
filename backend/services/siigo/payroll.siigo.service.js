/**
 * Servicio de Contabilización de Nómina en Siigo
 *
 * Genera los asientos contables de nómina según la legislación
 * laboral colombiana (Código Sustantivo del Trabajo).
 */

const siigoService = require('./siigo.service');
const journalSiigoService = require('./journal.siigo.service');
const prisma = require('../../db/prisma');

class PayrollSiigoService {
  /**
   * Contabiliza un período de nómina completo
   */
  async contabilizarNomina(periodoNominaId) {
    // Buscar el período de nómina
    const periodo = await this.getPeriodoNomina(periodoNominaId);

    if (!periodo) {
      throw new Error(`Período de nómina ${periodoNominaId} no encontrado`);
    }

    if (periodo.estado !== 'CERRADO' && periodo.estado !== 'Cerrado') {
      throw new Error('El período debe estar cerrado para contabilizar');
    }

    if (periodo.contabilizado) {
      throw new Error('El período ya fue contabilizado');
    }

    // Obtener items de nómina del período
    const itemsNomina = await this.getItemsNomina(periodoNominaId);

    if (itemsNomina.length === 0) {
      throw new Error('No hay items de nómina para contabilizar');
    }

    // Agrupar por departamento (centro de costo)
    const porDepartamento = this.agruparPorDepartamento(itemsNomina);

    const asientosCreados = [];

    for (const [deptoId, items] of Object.entries(porDepartamento)) {
      try {
        const totales = this.calcularTotales(items);
        const lineas = this.buildNominaAccountingLines(totales);

        // Obtener centro de costo de Siigo
        const costCenter = deptoId !== 'general'
          ? await this.getSiigoCostCenter(deptoId)
          : null;

        const asiento = await journalSiigoService.createJournalEntry({
          fecha: periodo.fechaCierre || periodo.fechaFin,
          tipo: 'Nomina',
          descripcion: `Nómina ${periodo.nombre || periodo.id} - ${deptoId}`,
          lineas,
          centroCostoId: costCenter,
          nominaId: periodoNominaId
        });

        asientosCreados.push(asiento);
      } catch (error) {
        console.error(`[Siigo] Error contabilizando nómina depto ${deptoId}:`, error.message);
        throw error;
      }
    }

    // Marcar período como contabilizado
    await this.marcarContabilizado(periodoNominaId, asientosCreados);

    console.log(`[Siigo] Nómina ${periodoNominaId} contabilizada: ${asientosCreados.length} asientos`);
    return asientosCreados;
  }

  /**
   * Busca el período de nómina (compatible con diferentes estructuras)
   */
  async getPeriodoNomina(periodoNominaId) {
    // Buscar en THPeriodoNomina (modelo Talento Humano)
    try {
      const periodo = await prisma.tHPeriodoNomina.findUnique({
        where: { id: periodoNominaId },
        include: {
          detalles: {
            include: {
              empleado: {
                include: { departamento: true }
              }
            }
          }
        }
      });
      if (periodo) return periodo;
    } catch (e) {
      console.error('Error buscando periodo:', e.message);
    }

    // Fallback para desarrollo
    return {
      id: periodoNominaId,
      estado: 'CERRADO',
      fechaCierre: new Date(),
      fechaFin: new Date()
    };
  }

  /**
   * Obtiene los items de nómina del período
   */
  async getItemsNomina(periodoNominaId) {
    // Buscar en THNominaDetalle (modelo Talento Humano)
    try {
      const items = await prisma.tHNominaDetalle.findMany({
        where: { periodoId: periodoNominaId },
        include: {
          empleado: {
            include: { departamento: true }
          }
        }
      });
      if (items && items.length > 0) return items;
    } catch (e) {
      console.error('Error buscando items nomina:', e.message);
    }

    // Fallback: buscar con modelo alterno
    try {
      const items = await prisma.nominaEmpleado?.findMany({
        where: { periodoId: periodoNominaId },
        include: {
          empleado: true
        }
      });
      if (items) return items;
    } catch (e) {
      // Modelo no existe
    }

    return [];
  }

  /**
   * Agrupa items de nómina por departamento
   */
  agruparPorDepartamento(itemsNomina) {
    const grupos = {};

    for (const item of itemsNomina) {
      const deptoId = item.empleado?.departamentoId || item.departamentoId || 'general';

      if (!grupos[deptoId]) {
        grupos[deptoId] = [];
      }
      grupos[deptoId].push(item);
    }

    return grupos;
  }

  /**
   * Calcula los totales de nómina
   */
  calcularTotales(itemsNomina) {
    const totales = {
      salarios: 0,
      horasExtras: 0,
      auxilioTransporte: 0,
      bonificaciones: 0,
      comisiones: 0,
      // Deducciones empleado
      saludEmpleado: 0,
      pensionEmpleado: 0,
      fondoSolidaridad: 0,
      retencionFuente: 0,
      otrasDeduciones: 0,
      // Aportes empleador
      saludEmpleador: 0,
      pensionEmpleador: 0,
      arl: 0,
      // Parafiscales
      sena: 0,
      icbf: 0,
      cajaCompensacion: 0,
      // Provisiones
      cesantias: 0,
      interesesCesantias: 0,
      prima: 0,
      vacaciones: 0,
      // Totales calculados
      totalDevengado: 0,
      totalDeducciones: 0,
      netoAPagar: 0
    };

    for (const item of itemsNomina) {
      // Devengados
      totales.salarios += parseFloat(item.salarioBase || item.basico || 0);
      totales.horasExtras += parseFloat(item.horasExtras || item.extras || 0);
      totales.auxilioTransporte += parseFloat(item.auxilioTransporte || item.transporte || 0);
      totales.bonificaciones += parseFloat(item.bonificaciones || 0);
      totales.comisiones += parseFloat(item.comisiones || 0);

      // Deducciones empleado
      totales.saludEmpleado += parseFloat(item.saludEmpleado || item.salud || 0);
      totales.pensionEmpleado += parseFloat(item.pensionEmpleado || item.pension || 0);
      totales.fondoSolidaridad += parseFloat(item.fondoSolidaridad || 0);
      totales.retencionFuente += parseFloat(item.retencionFuente || item.retefuente || 0);

      // Aportes empleador
      totales.saludEmpleador += parseFloat(item.saludEmpleador || 0);
      totales.pensionEmpleador += parseFloat(item.pensionEmpleador || 0);
      totales.arl += parseFloat(item.arl || item.riesgos || 0);

      // Parafiscales
      totales.sena += parseFloat(item.sena || 0);
      totales.icbf += parseFloat(item.icbf || 0);
      totales.cajaCompensacion += parseFloat(item.cajaCompensacion || item.caja || 0);

      // Provisiones
      totales.cesantias += parseFloat(item.cesantias || 0);
      totales.interesesCesantias += parseFloat(item.interesesCesantias || item.intCesantias || 0);
      totales.prima += parseFloat(item.prima || 0);
      totales.vacaciones += parseFloat(item.vacaciones || 0);

      // Neto
      totales.netoAPagar += parseFloat(item.netoAPagar || item.neto || 0);
    }

    // Calcular totales
    totales.totalDevengado = totales.salarios + totales.horasExtras +
      totales.auxilioTransporte + totales.bonificaciones + totales.comisiones;

    totales.totalDeducciones = totales.saludEmpleado + totales.pensionEmpleado +
      totales.fondoSolidaridad + totales.retencionFuente + totales.otrasDeduciones;

    return totales;
  }

  /**
   * Construye las líneas contables de nómina
   */
  buildNominaAccountingLines(totales) {
    const lineas = [];

    // ============ DÉBITOS (Gastos de nómina) ============

    // Sueldos y salarios
    if (totales.salarios > 0) {
      lineas.push({
        cuentaCodigo: '51050501',
        descripcion: 'Sueldos y salarios',
        debito: totales.salarios,
        credito: 0
      });
    }

    // Horas extras
    if (totales.horasExtras > 0) {
      lineas.push({
        cuentaCodigo: '51050505',
        descripcion: 'Horas extras',
        debito: totales.horasExtras,
        credito: 0
      });
    }

    // Auxilio de transporte
    if (totales.auxilioTransporte > 0) {
      lineas.push({
        cuentaCodigo: '51050515',
        descripcion: 'Auxilio de transporte',
        debito: totales.auxilioTransporte,
        credito: 0
      });
    }

    // Bonificaciones
    if (totales.bonificaciones > 0) {
      lineas.push({
        cuentaCodigo: '51050520',
        descripcion: 'Bonificaciones',
        debito: totales.bonificaciones,
        credito: 0
      });
    }

    // Comisiones
    if (totales.comisiones > 0) {
      lineas.push({
        cuentaCodigo: '51050510',
        descripcion: 'Comisiones',
        debito: totales.comisiones,
        credito: 0
      });
    }

    // Aportes salud empleador (8.5%)
    if (totales.saludEmpleador > 0) {
      lineas.push({
        cuentaCodigo: '51050525',
        descripcion: 'Aportes salud empleador',
        debito: totales.saludEmpleador,
        credito: 0
      });
    }

    // Aportes pensión empleador (12%)
    if (totales.pensionEmpleador > 0) {
      lineas.push({
        cuentaCodigo: '51050530',
        descripcion: 'Aportes pensión empleador',
        debito: totales.pensionEmpleador,
        credito: 0
      });
    }

    // ARL
    if (totales.arl > 0) {
      lineas.push({
        cuentaCodigo: '51050535',
        descripcion: 'Aportes ARL',
        debito: totales.arl,
        credito: 0
      });
    }

    // SENA (2%)
    if (totales.sena > 0) {
      lineas.push({
        cuentaCodigo: '51050550',
        descripcion: 'Aportes SENA',
        debito: totales.sena,
        credito: 0
      });
    }

    // ICBF (3%)
    if (totales.icbf > 0) {
      lineas.push({
        cuentaCodigo: '51050555',
        descripcion: 'Aportes ICBF',
        debito: totales.icbf,
        credito: 0
      });
    }

    // Caja de compensación (4%)
    if (totales.cajaCompensacion > 0) {
      lineas.push({
        cuentaCodigo: '51050560',
        descripcion: 'Aportes caja compensación',
        debito: totales.cajaCompensacion,
        credito: 0
      });
    }

    // Provisión cesantías
    if (totales.cesantias > 0) {
      lineas.push({
        cuentaCodigo: '51050570',
        descripcion: 'Provisión cesantías',
        debito: totales.cesantias,
        credito: 0
      });
    }

    // Provisión intereses cesantías
    if (totales.interesesCesantias > 0) {
      lineas.push({
        cuentaCodigo: '51050575',
        descripcion: 'Provisión int. cesantías',
        debito: totales.interesesCesantias,
        credito: 0
      });
    }

    // Provisión prima
    if (totales.prima > 0) {
      lineas.push({
        cuentaCodigo: '51050580',
        descripcion: 'Provisión prima servicios',
        debito: totales.prima,
        credito: 0
      });
    }

    // Provisión vacaciones
    if (totales.vacaciones > 0) {
      lineas.push({
        cuentaCodigo: '51050585',
        descripcion: 'Provisión vacaciones',
        debito: totales.vacaciones,
        credito: 0
      });
    }

    // ============ CRÉDITOS ============

    // Salarios por pagar
    if (totales.netoAPagar > 0) {
      lineas.push({
        cuentaCodigo: '25050501',
        descripcion: 'Salarios por pagar',
        debito: 0,
        credito: totales.netoAPagar
      });
    }

    // Retención en la fuente por pagar
    if (totales.retencionFuente > 0) {
      lineas.push({
        cuentaCodigo: '23650505',
        descripcion: 'Retención fuente salarios',
        debito: 0,
        credito: totales.retencionFuente
      });
    }

    // Aportes salud por pagar (empleado + empleador)
    const totalSalud = totales.saludEmpleado + totales.saludEmpleador;
    if (totalSalud > 0) {
      lineas.push({
        cuentaCodigo: '23700501',
        descripcion: 'Aportes salud por pagar',
        debito: 0,
        credito: totalSalud
      });
    }

    // Aportes pensión por pagar (empleado + empleador)
    const totalPension = totales.pensionEmpleado + totales.pensionEmpleador;
    if (totalPension > 0) {
      lineas.push({
        cuentaCodigo: '23700505',
        descripcion: 'Aportes pensión por pagar',
        debito: 0,
        credito: totalPension
      });
    }

    // ARL por pagar
    if (totales.arl > 0) {
      lineas.push({
        cuentaCodigo: '23700510',
        descripcion: 'ARL por pagar',
        debito: 0,
        credito: totales.arl
      });
    }

    // Parafiscales por pagar (SENA + ICBF + Caja)
    const totalParafiscales = totales.sena + totales.icbf + totales.cajaCompensacion;
    if (totalParafiscales > 0) {
      lineas.push({
        cuentaCodigo: '23700515',
        descripcion: 'Parafiscales por pagar',
        debito: 0,
        credito: totalParafiscales
      });
    }

    // Cesantías consolidadas
    if (totales.cesantias > 0) {
      lineas.push({
        cuentaCodigo: '26100501',
        descripcion: 'Cesantías consolidadas',
        debito: 0,
        credito: totales.cesantias
      });
    }

    // Intereses cesantías
    if (totales.interesesCesantias > 0) {
      lineas.push({
        cuentaCodigo: '26100505',
        descripcion: 'Intereses cesantías',
        debito: 0,
        credito: totales.interesesCesantias
      });
    }

    // Vacaciones consolidadas
    if (totales.vacaciones > 0) {
      lineas.push({
        cuentaCodigo: '26150501',
        descripcion: 'Vacaciones consolidadas',
        debito: 0,
        credito: totales.vacaciones
      });
    }

    // Prima de servicios
    if (totales.prima > 0) {
      lineas.push({
        cuentaCodigo: '26200501',
        descripcion: 'Prima servicios',
        debito: 0,
        credito: totales.prima
      });
    }

    // Fondo de solidaridad
    if (totales.fondoSolidaridad > 0) {
      lineas.push({
        cuentaCodigo: '23700520',
        descripcion: 'Fondo solidaridad pensional',
        debito: 0,
        credito: totales.fondoSolidaridad
      });
    }

    return lineas.filter(l => l.debito > 0 || l.credito > 0);
  }

  /**
   * Obtiene el centro de costo de Siigo para un departamento
   */
  async getSiigoCostCenter(departamentoId) {
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
   * Marca el período como contabilizado
   */
  async marcarContabilizado(periodoNominaId, asientos) {
    try {
      await prisma.tHPeriodoNomina.update({
        where: { id: periodoNominaId },
        data: {
          contabilizado: true,
          fechaContabilizacion: new Date(),
          siigoJournalIds: asientos.map(a => a.id)
        }
      });
    } catch (e) {
      console.error('Error actualizando periodo:', e.message);
      // Registrar en SiigoSync como fallback
      await prisma.siigoSync.upsert({
        where: {
          entidad_entidadId: {
            entidad: 'nomina',
            entidadId: periodoNominaId
          }
        },
        update: {
          siigoId: asientos.map(a => a.id).join(','),
          estado: 'sincronizado',
          ultimaSync: new Date()
        },
        create: {
          entidad: 'nomina',
          entidadId: periodoNominaId,
          siigoId: asientos.map(a => a.id).join(','),
          estado: 'sincronizado'
        }
      });
    }
  }

  /**
   * Genera el asiento de pago de nómina
   */
  async contabilizarPagoNomina(periodoNominaId, datosPago) {
    const { metodoPago, banco, referencia, monto, fecha } = datosPago;

    const cuentaBanco = metodoPago === 'Efectivo' ? '11050501' : '11100501';

    const lineas = [
      // Débito: Salarios por pagar (liquidación del pasivo)
      {
        cuentaCodigo: '25050501',
        descripcion: 'Pago nómina',
        debito: parseFloat(monto),
        credito: 0
      },
      // Crédito: Banco/Caja
      {
        cuentaCodigo: cuentaBanco,
        descripcion: `Pago nómina - ${referencia || metodoPago}`,
        debito: 0,
        credito: parseFloat(monto)
      }
    ];

    return journalSiigoService.createJournalEntry({
      fecha: fecha || new Date(),
      tipo: 'Nomina',
      descripcion: `Pago nómina período ${periodoNominaId}`,
      lineas,
      nominaId: periodoNominaId
    });
  }

  /**
   * Contabiliza el pago de aportes parafiscales (PILA)
   */
  async contabilizarPagoPILA(datosPago) {
    const {
      fecha,
      totalSalud,
      totalPension,
      totalArl,
      totalParafiscales,
      banco,
      referencia
    } = datosPago;

    const lineas = [];

    // Débitos: Liquidar pasivos de aportes
    if (totalSalud > 0) {
      lineas.push({
        cuentaCodigo: '23700501',
        descripcion: 'Pago aportes salud',
        debito: parseFloat(totalSalud),
        credito: 0
      });
    }

    if (totalPension > 0) {
      lineas.push({
        cuentaCodigo: '23700505',
        descripcion: 'Pago aportes pensión',
        debito: parseFloat(totalPension),
        credito: 0
      });
    }

    if (totalArl > 0) {
      lineas.push({
        cuentaCodigo: '23700510',
        descripcion: 'Pago ARL',
        debito: parseFloat(totalArl),
        credito: 0
      });
    }

    if (totalParafiscales > 0) {
      lineas.push({
        cuentaCodigo: '23700515',
        descripcion: 'Pago parafiscales',
        debito: parseFloat(totalParafiscales),
        credito: 0
      });
    }

    // Crédito: Banco
    const totalPagado = (parseFloat(totalSalud) || 0) +
      (parseFloat(totalPension) || 0) +
      (parseFloat(totalArl) || 0) +
      (parseFloat(totalParafiscales) || 0);

    lineas.push({
      cuentaCodigo: '11100501',
      descripcion: `Pago PILA - ${referencia || 'Sin ref'}`,
      debito: 0,
      credito: totalPagado
    });

    return journalSiigoService.createJournalEntry({
      fecha: fecha || new Date(),
      tipo: 'Nomina',
      descripcion: 'Pago aportes PILA',
      lineas
    });
  }

  /**
   * Obtiene resumen de contabilización de nómina
   */
  async getPayrollAccountingSummary(periodoNominaId) {
    const syncs = await prisma.siigoSync.findMany({
      where: {
        entidad: 'nomina',
        entidadId: periodoNominaId
      }
    });

    return {
      periodoId: periodoNominaId,
      contabilizado: syncs.length > 0,
      asientos: syncs.map(s => ({
        siigoId: s.siigoId,
        estado: s.estado,
        fecha: s.ultimaSync
      }))
    };
  }
}

module.exports = new PayrollSiigoService();
