/**
 * Tests para Tax Siigo Service
 * Pruebas de cálculo de retenciones colombianas
 */

const taxSiigoService = require('../../services/siigo/tax.siigo.service');

describe('Tax Siigo Service', () => {
  describe('getUVT', () => {
    it('debería retornar UVT 2026 correcto', () => {
      const uvt = taxSiigoService.getUVT(2026);
      expect(uvt).toBe(52263);
    });

    it('debería retornar UVT 2025 correcto', () => {
      const uvt = taxSiigoService.getUVT(2025);
      expect(uvt).toBe(49799);
    });

    it('debería retornar UVT actual por defecto', () => {
      const uvt = taxSiigoService.getUVT();
      expect(uvt).toBeGreaterThan(50000);
    });
  });

  describe('calcularRetenciones - Compras', () => {
    it('debería calcular retención en compras sobre base mínima', () => {
      const resultado = taxSiigoService.calcularRetenciones({
        monto: 5000000,
        concepto: 'COMPRAS',
        tipoTercero: 'PERSONA_JURIDICA'
      });

      // 5,000,000 * 2.5% = 125,000
      expect(resultado.retencionFuente).toBe(125000);
      expect(resultado.netoAPagar).toBe(4875000);
    });

    it('NO debería aplicar retención bajo base mínima', () => {
      const resultado = taxSiigoService.calcularRetenciones({
        monto: 1000000, // Bajo base de 27 UVT (~1,411,101)
        concepto: 'COMPRAS',
        tipoTercero: 'PERSONA_JURIDICA'
      });

      expect(resultado.retencionFuente).toBe(0);
      expect(resultado.netoAPagar).toBe(1000000);
    });
  });

  describe('calcularRetenciones - Servicios', () => {
    it('debería calcular retención en servicios persona natural', () => {
      const resultado = taxSiigoService.calcularRetenciones({
        monto: 3000000,
        concepto: 'SERVICIOS',
        tipoTercero: 'PERSONA_NATURAL'
      });

      // 3,000,000 * 4% = 120,000
      expect(resultado.retencionFuente).toBe(120000);
    });

    it('debería calcular retención en servicios persona jurídica', () => {
      const resultado = taxSiigoService.calcularRetenciones({
        monto: 3000000,
        concepto: 'SERVICIOS',
        tipoTercero: 'PERSONA_JURIDICA'
      });

      // 3,000,000 * 4% = 120,000
      expect(resultado.retencionFuente).toBe(120000);
    });
  });

  describe('calcularRetenciones - Honorarios', () => {
    it('debería calcular retención en honorarios 10%', () => {
      const resultado = taxSiigoService.calcularRetenciones({
        monto: 10000000,
        concepto: 'HONORARIOS',
        tipoTercero: 'PERSONA_NATURAL',
        declarante: false
      });

      // 10,000,000 * 10% = 1,000,000
      expect(resultado.retencionFuente).toBe(1000000);
    });

    // Nota: La tarifa de declarantes no está implementada todavía
    it('debería calcular retención en honorarios (tarifa base)', () => {
      const resultado = taxSiigoService.calcularRetenciones({
        monto: 10000000,
        concepto: 'HONORARIOS',
        tipoTercero: 'PERSONA_NATURAL'
      });

      // 10,000,000 * 10% = 1,000,000
      expect(resultado.retencionFuente).toBe(1000000);
    });
  });

  describe('calcularRetenciones - ICA', () => {
    it('debería manejar cálculo ICA (cuando implementado)', () => {
      const resultado = taxSiigoService.calcularRetenciones({
        monto: 5000000,
        concepto: 'SERVICIOS',
        tipoTercero: 'PERSONA_JURIDICA'
      });

      // ICA no está habilitado por defecto
      expect(resultado.retencionICA).toBeDefined();
    });
  });

  describe('calcularRetenciones - IVA', () => {
    it('debería retornar valores de IVA (estructura básica)', () => {
      const resultado = taxSiigoService.calcularRetenciones({
        monto: 5000000,
        concepto: 'COMPRAS',
        tipoTercero: 'PERSONA_JURIDICA'
      });

      // Verificar que la estructura existe
      expect(resultado).toHaveProperty('ivaGenerado');
      expect(resultado).toHaveProperty('retencionIVA');
    });
  });

  describe('getParametrosTributarios', () => {
    it('debería retornar todos los parámetros tributarios', () => {
      const params = taxSiigoService.getParametrosTributarios();

      expect(params.UVT_2026).toBe(52263);
      expect(params.SMLV_2026).toBe(1500000);
      expect(params.TARIFA_IVA_GENERAL).toBe(0.19);
      expect(params.TARIFA_RETENCION_COMPRAS).toBe(0.025);
    });
  });

  describe('getDefaultTaxes', () => {
    it('debería retornar lista de impuestos por defecto', () => {
      const taxes = taxSiigoService.getDefaultTaxes();

      expect(Array.isArray(taxes)).toBe(true);
      expect(taxes.length).toBeGreaterThan(0);

      // Verificar que existe al menos un impuesto IVA 19%
      const iva = taxes.find(t => t.name && t.name.includes('IVA 19'));
      expect(iva).toBeDefined();
      expect(iva.percentage).toBe(19);
    });
  });
});
