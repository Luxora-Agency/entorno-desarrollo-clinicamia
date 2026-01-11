const firmaDigitalService = require('../../services/firmaDigital.service');
const crypto = require('crypto');

describe('FirmaDigitalService', () => {
  const mockData = {
    subjetivo: 'Paciente con dolor',
    objetivo: 'TA 120/80',
    analisis: 'Cefalea',
    plan: 'Acetaminofen',
    fechaEvolucion: new Date('2024-01-01T12:00:00Z'),
  };
  const mockUsuarioId = 'user-123';

  describe('generarHash', () => {
    it('should generate a consistent SHA-256 hash', () => {
      const timestamp = '2024-01-01T12:00:00.000Z';
      const hash1 = firmaDigitalService.generarHash(mockData, mockUsuarioId, timestamp);
      const hash2 = firmaDigitalService.generarHash(mockData, mockUsuarioId, timestamp);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 is 64 hex chars
    });

    it('should change hash if data changes', () => {
      const timestamp = '2024-01-01T12:00:00.000Z';
      const hash1 = firmaDigitalService.generarHash(mockData, mockUsuarioId, timestamp);
      
      const modifiedData = { ...mockData, plan: 'Ibuprofeno' };
      const hash2 = firmaDigitalService.generarHash(modifiedData, mockUsuarioId, timestamp);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('crearFirma', () => {
    it('should return an object with signature and timestamp', () => {
      const firma = firmaDigitalService.crearFirma(mockData, mockUsuarioId);
      
      expect(firma).toHaveProperty('firmaDigital');
      expect(firma).toHaveProperty('hashRegistro');
      expect(firma).toHaveProperty('fechaFirma');
      expect(firma).toHaveProperty('usuarioId', mockUsuarioId);
      expect(firma.firmaDigital).toBe(firma.hashRegistro);
    });
  });

  describe('verificarFirma', () => {
    it('should return true for valid signature', () => {
      const timestamp = '2024-01-01T12:00:00.000Z';
      const hash = firmaDigitalService.generarHash(mockData, mockUsuarioId, timestamp);
      
      const isValid = firmaDigitalService.verificarFirma(mockData, mockUsuarioId, timestamp, hash);
      expect(isValid).toBe(true);
    });

    it('should return false if data was tampered', () => {
      const timestamp = '2024-01-01T12:00:00.000Z';
      const hash = firmaDigitalService.generarHash(mockData, mockUsuarioId, timestamp);
      
      const tamperedData = { ...mockData, subjetivo: 'HACKED' };
      const isValid = firmaDigitalService.verificarFirma(tamperedData, mockUsuarioId, timestamp, hash);
      
      expect(isValid).toBe(false);
    });
  });
});
