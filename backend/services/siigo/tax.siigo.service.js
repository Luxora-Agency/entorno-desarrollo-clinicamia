/**
 * Servicio de Configuración Tributaria de Siigo
 *
 * Maneja la configuración de impuestos, cálculo de retenciones
 * y reportes tributarios según normativa colombiana.
 */

const siigoService = require('./siigo.service');
const prisma = require('../../db/prisma');

class TaxSiigoService {
  // =====================================================
  // PARÁMETROS TRIBUTARIOS
  // =====================================================

  /**
   * Valores tributarios 2025/2026 Colombia
   */
  getParametrosTributarios() {
    return {
      UVT_2025: 49799,
      UVT_2026: 52263, // Proyectado
      SMLV_2025: 1423500,
      SMLV_2026: 1500000, // Proyectado
      AUXILIO_TRANSPORTE_2025: 200000,
      AUXILIO_TRANSPORTE_2026: 210000, // Proyectado

      // Bases de retención en la fuente (en UVT)
      BASE_RETENCION_COMPRAS_UVT: 27,     // $1,344,573 (2025)
      BASE_RETENCION_SERVICIOS_UVT: 4,    // $199,196 (2025)
      BASE_RETENCION_HONORARIOS_UVT: 0,   // Desde $1
      BASE_RETENCION_ARRENDAMIENTO_UVT: 27,

      // Tarifas de retención en la fuente
      TARIFA_RETENCION_COMPRAS: 0.025,           // 2.5%
      TARIFA_RETENCION_SERVICIOS_PN: 0.04,       // 4% Persona Natural
      TARIFA_RETENCION_SERVICIOS_PJ: 0.04,       // 4% Persona Jurídica
      TARIFA_RETENCION_HONORARIOS_PN: 0.10,      // 10% No declarante
      TARIFA_RETENCION_HONORARIOS_PN_DEC: 0.11,  // 11% Declarante
      TARIFA_RETENCION_ARRENDAMIENTO: 0.035,     // 3.5%

      // IVA
      TARIFA_IVA_GENERAL: 0.19,  // 19%
      TARIFA_IVA_REDUCIDA: 0.05, // 5%

      // Retención ICA (ejemplo Bogotá - sector salud)
      BASE_RETENCION_ICA_UVT: 27,
      TARIFA_ICA_SERVICIOS_SALUD: 0.00966, // 9.66 x mil

      // Retención de IVA
      BASE_RETENCION_IVA_UVT: 27,
      TARIFA_RETENCION_IVA: 0.15, // 15% del IVA
    };
  }

  /**
   * Obtiene el valor actual de la UVT
   */
  getUVT(año = new Date().getFullYear()) {
    const params = this.getParametrosTributarios();
    return año >= 2026 ? params.UVT_2026 : params.UVT_2025;
  }

  // =====================================================
  // CÁLCULO DE RETENCIONES
  // =====================================================

  /**
   * Calcula todas las retenciones aplicables a una compra/servicio
   */
  calcularRetenciones(data) {
    const {
      monto,
      concepto,         // COMPRAS | SERVICIOS | HONORARIOS | ARRENDAMIENTO
      tipoTercero,      // PERSONA_NATURAL | PERSONA_JURIDICA
      esDeclarante,     // true | false (aplica para honorarios PN)
      aplicaIVA,        // true | false
      porcentajeIVA,    // 0 | 5 | 19
      ciudadICA         // Código ciudad para ICA (opcional)
    } = data;

    const params = this.getParametrosTributarios();
    const uvt = this.getUVT();
    const montoNum = parseFloat(monto);

    const resultado = {
      base: montoNum,
      retencionFuente: 0,
      retencionICA: 0,
      retencionIVA: 0,
      ivaGenerado: 0,
      totalRetenciones: 0,
      netoAPagar: montoNum,
      detalles: []
    };

    // 1. Retención en la Fuente
    const retefuente = this.calcularRetencionFuente(
      montoNum,
      concepto,
      tipoTercero,
      esDeclarante,
      uvt,
      params
    );
    resultado.retencionFuente = retefuente.valor;
    if (retefuente.aplica) {
      resultado.detalles.push(retefuente);
    }

    // 2. Retención ICA (si aplica)
    if (ciudadICA) {
      const reteica = this.calcularRetencionICA(montoNum, ciudadICA, uvt, params);
      resultado.retencionICA = reteica.valor;
      if (reteica.aplica) {
        resultado.detalles.push(reteica);
      }
    }

    // 3. IVA y Retención de IVA
    if (aplicaIVA && porcentajeIVA > 0) {
      const iva = montoNum * (porcentajeIVA / 100);
      resultado.ivaGenerado = iva;
      resultado.detalles.push({
        concepto: `IVA ${porcentajeIVA}%`,
        base: montoNum,
        tarifa: porcentajeIVA / 100,
        valor: iva,
        aplica: true
      });

      // Retención de IVA (solo grandes contribuyentes)
      if (montoNum >= params.BASE_RETENCION_IVA_UVT * uvt) {
        const reteiva = iva * params.TARIFA_RETENCION_IVA;
        resultado.retencionIVA = reteiva;
        resultado.detalles.push({
          concepto: 'Retención de IVA 15%',
          base: iva,
          tarifa: params.TARIFA_RETENCION_IVA,
          valor: reteiva,
          aplica: true
        });
      }
    }

    // Calcular totales
    resultado.totalRetenciones =
      resultado.retencionFuente +
      resultado.retencionICA +
      resultado.retencionIVA;

    resultado.netoAPagar =
      montoNum +
      resultado.ivaGenerado -
      resultado.totalRetenciones;

    return resultado;
  }

  /**
   * Calcula la retención en la fuente
   */
  calcularRetencionFuente(monto, concepto, tipoTercero, esDeclarante, uvt, params) {
    let base, tarifa, concepto_nombre;

    switch (concepto) {
      case 'COMPRAS':
        base = params.BASE_RETENCION_COMPRAS_UVT * uvt;
        tarifa = params.TARIFA_RETENCION_COMPRAS;
        concepto_nombre = 'Retención compras 2.5%';
        break;

      case 'SERVICIOS':
        base = params.BASE_RETENCION_SERVICIOS_UVT * uvt;
        tarifa = tipoTercero === 'PERSONA_NATURAL'
          ? params.TARIFA_RETENCION_SERVICIOS_PN
          : params.TARIFA_RETENCION_SERVICIOS_PJ;
        concepto_nombre = `Retención servicios ${tarifa * 100}%`;
        break;

      case 'HONORARIOS':
        base = 0; // Desde el primer peso
        tarifa = tipoTercero === 'PERSONA_NATURAL'
          ? (esDeclarante ? params.TARIFA_RETENCION_HONORARIOS_PN_DEC : params.TARIFA_RETENCION_HONORARIOS_PN)
          : params.TARIFA_RETENCION_SERVICIOS_PJ;
        concepto_nombre = `Retención honorarios ${tarifa * 100}%`;
        break;

      case 'ARRENDAMIENTO':
        base = params.BASE_RETENCION_ARRENDAMIENTO_UVT * uvt;
        tarifa = params.TARIFA_RETENCION_ARRENDAMIENTO;
        concepto_nombre = 'Retención arrendamiento 3.5%';
        break;

      default:
        return { aplica: false, valor: 0 };
    }

    if (monto >= base) {
      return {
        concepto: concepto_nombre,
        base: monto,
        baseMinima: base,
        tarifa,
        valor: monto * tarifa,
        aplica: true
      };
    }

    return {
      concepto: concepto_nombre,
      base: monto,
      baseMinima: base,
      tarifa,
      valor: 0,
      aplica: false,
      mensaje: `Monto inferior a base mínima de ${base.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`
    };
  }

  /**
   * Calcula la retención de ICA según ciudad
   */
  calcularRetencionICA(monto, ciudadCodigo, uvt, params) {
    const base = params.BASE_RETENCION_ICA_UVT * uvt;

    // Tarifas por ciudad (ejemplos)
    const tarifasPorCiudad = {
      '11001': 0.00966,  // Bogotá - Servicios de salud
      '05001': 0.00700,  // Medellín
      '76001': 0.00800,  // Cali
      '08001': 0.00700,  // Barranquilla
      'DEFAULT': 0.00966
    };

    const tarifa = tarifasPorCiudad[ciudadCodigo] || tarifasPorCiudad.DEFAULT;

    if (monto >= base) {
      return {
        concepto: 'Retención ICA',
        base: monto,
        baseMinima: base,
        tarifa,
        valor: monto * tarifa,
        aplica: true
      };
    }

    return { aplica: false, valor: 0 };
  }

  // =====================================================
  // SINCRONIZACIÓN CON SIIGO
  // =====================================================

  /**
   * Sincroniza configuración de impuestos desde Siigo
   */
  async syncTaxConfiguration() {
    try {
      const taxApi = siigoService.getTaxApi();

      if (!taxApi) {
        return { message: 'API de impuestos no disponible', taxes: this.getDefaultTaxes() };
      }

      const result = await siigoService.executeWithLogging(
        () => taxApi.getTaxes(),
        {
          operacion: 'syncTaxConfiguration',
          endpoint: '/taxes',
          metodo: 'GET',
          entidad: 'catalogo'
        }
      );

      // Guardar en caché local
      if (result.results) {
        for (const tax of result.results) {
          await prisma.configuracionImpuesto.upsert({
            where: { siigoId: tax.id?.toString() },
            update: {
              nombre: tax.name,
              porcentaje: tax.percentage || 0,
              tipo: tax.type
            },
            create: {
              siigoId: tax.id?.toString(),
              nombre: tax.name,
              porcentaje: tax.percentage || 0,
              tipo: tax.type
            }
          }).catch(() => null); // Ignorar si tabla no existe
        }
      }

      return result;
    } catch (error) {
      console.error('[Siigo] Error sincronizando impuestos:', error.message);
      return { taxes: this.getDefaultTaxes() };
    }
  }

  /**
   * Impuestos por defecto (fallback)
   */
  getDefaultTaxes() {
    return [
      { id: 1, name: 'IVA 19%', percentage: 19, type: 'IVA' },
      { id: 2, name: 'IVA 5%', percentage: 5, type: 'IVA' },
      { id: 3, name: 'Excluido de IVA', percentage: 0, type: 'Excluido' },
      { id: 4, name: 'Exento de IVA', percentage: 0, type: 'Exento' },
      { id: 5, name: 'Retefuente 2.5% Compras', percentage: 2.5, type: 'ReteFuente' },
      { id: 6, name: 'Retefuente 4% Servicios', percentage: 4, type: 'ReteFuente' },
      { id: 7, name: 'Retefuente 10% Honorarios', percentage: 10, type: 'ReteFuente' },
      { id: 8, name: 'ReteICA 9.66‰', percentage: 0.966, type: 'ReteICA' }
    ];
  }

  // =====================================================
  // REPORTES TRIBUTARIOS
  // =====================================================

  /**
   * Genera reporte de retenciones practicadas
   */
  async getReporteRetenciones(fechaInicio, fechaFin) {
    try {
      const facturas = await prisma.facturaProveedor.findMany({
        where: {
          fechaFactura: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin)
          },
          OR: [
            { retencionFuente: { gt: 0 } },
            { retencionICA: { gt: 0 } },
            { retencionIVA: { gt: 0 } }
          ]
        },
        include: {
          proveedor: {
            select: {
              id: true,
              documento: true,
              razonSocial: true,
              tipoDocumento: true
            }
          }
        },
        orderBy: { fechaFactura: 'asc' }
      });

      // Agrupar por tipo de retención
      const resumen = {
        retencionFuente: {
          total: 0,
          cantidad: 0
        },
        retencionICA: {
          total: 0,
          cantidad: 0
        },
        retencionIVA: {
          total: 0,
          cantidad: 0
        }
      };

      // Agrupar por tercero (para certificados)
      const porTercero = {};

      for (const factura of facturas) {
        const terceroId = factura.proveedor.id;

        if (!porTercero[terceroId]) {
          porTercero[terceroId] = {
            documento: factura.proveedor.documento,
            tipoDocumento: factura.proveedor.tipoDocumento,
            razonSocial: factura.proveedor.razonSocial,
            retencionFuente: 0,
            retencionICA: 0,
            retencionIVA: 0,
            baseRetencion: 0,
            facturas: []
          };
        }

        const rf = parseFloat(factura.retencionFuente) || 0;
        const rica = parseFloat(factura.retencionICA) || 0;
        const riva = parseFloat(factura.retencionIVA) || 0;

        if (rf > 0) {
          resumen.retencionFuente.total += rf;
          resumen.retencionFuente.cantidad++;
          porTercero[terceroId].retencionFuente += rf;
        }

        if (rica > 0) {
          resumen.retencionICA.total += rica;
          resumen.retencionICA.cantidad++;
          porTercero[terceroId].retencionICA += rica;
        }

        if (riva > 0) {
          resumen.retencionIVA.total += riva;
          resumen.retencionIVA.cantidad++;
          porTercero[terceroId].retencionIVA += riva;
        }

        porTercero[terceroId].baseRetencion += parseFloat(factura.subtotal);
        porTercero[terceroId].facturas.push({
          numero: factura.numero,
          fecha: factura.fechaFactura,
          base: factura.subtotal,
          retencionFuente: rf,
          retencionICA: rica,
          retencionIVA: riva
        });
      }

      return {
        periodo: { inicio: fechaInicio, fin: fechaFin },
        resumen,
        totalRetenciones:
          resumen.retencionFuente.total +
          resumen.retencionICA.total +
          resumen.retencionIVA.total,
        porTercero: Object.values(porTercero).sort(
          (a, b) => b.retencionFuente - a.retencionFuente
        ),
        cantidadFacturas: facturas.length
      };
    } catch (error) {
      console.error('[Tax] Error generando reporte retenciones:', error);
      throw error;
    }
  }

  /**
   * Genera certificado de retención para un tercero
   */
  async getCertificadoRetencion(proveedorId, año) {
    const fechaInicio = new Date(año, 0, 1);
    const fechaFin = new Date(año, 11, 31);

    const proveedor = await prisma.proveedor.findUnique({
      where: { id: proveedorId }
    });

    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }

    const facturas = await prisma.facturaProveedor.findMany({
      where: {
        proveedorId,
        fechaFactura: { gte: fechaInicio, lte: fechaFin },
        OR: [
          { retencionFuente: { gt: 0 } },
          { retencionICA: { gt: 0 } },
          { retencionIVA: { gt: 0 } }
        ]
      },
      orderBy: { fechaFactura: 'asc' }
    });

    // Totales
    let baseTotal = 0;
    let retencionFuenteTotal = 0;
    let retencionICATotal = 0;
    let retencionIVATotal = 0;

    const detalle = facturas.map(f => {
      const rf = parseFloat(f.retencionFuente) || 0;
      const rica = parseFloat(f.retencionICA) || 0;
      const riva = parseFloat(f.retencionIVA) || 0;
      const base = parseFloat(f.subtotal);

      baseTotal += base;
      retencionFuenteTotal += rf;
      retencionICATotal += rica;
      retencionIVATotal += riva;

      return {
        numeroFactura: f.numero,
        fecha: f.fechaFactura,
        base,
        retencionFuente: rf,
        retencionICA: rica,
        retencionIVA: riva
      };
    });

    return {
      año,
      retenedor: {
        // Datos de la clínica (se pueden obtener de configuración)
        nombre: 'Clínica Mía S.A.S.',
        nit: '900123456-1',
        direccion: 'Calle 123 #45-67, Bogotá'
      },
      retenido: {
        tipoDocumento: proveedor.tipoDocumento,
        documento: proveedor.documento,
        razonSocial: proveedor.razonSocial,
        direccion: proveedor.direccion
      },
      totales: {
        baseGravable: baseTotal,
        retencionFuente: retencionFuenteTotal,
        retencionICA: retencionICATotal,
        retencionIVA: retencionIVATotal,
        totalRetenido: retencionFuenteTotal + retencionICATotal + retencionIVATotal
      },
      detalle,
      fechaExpedicion: new Date()
    };
  }

  /**
   * Obtiene resumen de IVA del período
   */
  async getResumenIVA(fechaInicio, fechaFin) {
    try {
      // IVA Generado (ventas)
      const ventasConIVA = await prisma.factura.findMany({
        where: {
          fechaEmision: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin)
          },
          impuestos: { gt: 0 },
          estado: { not: 'Cancelada' }
        }
      });

      const ivaGenerado = ventasConIVA.reduce(
        (sum, f) => sum + parseFloat(f.impuestos),
        0
      );

      // IVA Descontable (compras)
      const comprasConIVA = await prisma.facturaProveedor.findMany({
        where: {
          fechaFactura: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin)
          },
          iva: { gt: 0 }
        }
      });

      const ivaDescontable = comprasConIVA.reduce(
        (sum, f) => sum + parseFloat(f.iva),
        0
      );

      return {
        periodo: { inicio: fechaInicio, fin: fechaFin },
        ivaGenerado: {
          valor: ivaGenerado,
          cantidadFacturas: ventasConIVA.length
        },
        ivaDescontable: {
          valor: ivaDescontable,
          cantidadFacturas: comprasConIVA.length
        },
        saldoAPagar: Math.max(0, ivaGenerado - ivaDescontable),
        saldoAFavor: Math.max(0, ivaDescontable - ivaGenerado)
      };
    } catch (error) {
      console.error('[Tax] Error calculando IVA:', error);
      throw error;
    }
  }
}

module.exports = new TaxSiigoService();
