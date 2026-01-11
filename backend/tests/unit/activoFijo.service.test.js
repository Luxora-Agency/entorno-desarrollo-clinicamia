/**
 * Tests para Activo Fijo Service
 */

const activoFijoService = require('../../services/activoFijo.service');

describe('ActivoFijo Service', () => {
  describe('calcularDepreciacionMensual', () => {
    it('debería calcular depreciación línea recta correctamente', () => {
      const activo = {
        valorAdquisicion: 85000000,
        valorResidual: 8500000,
        vidaUtilAnios: 10,
        depreciacionAcumulada: 0
      };

      const depreciacionMensual = activoFijoService.calcularDepreciacionMensual(activo);

      // (85,000,000 - 8,500,000) / (10 * 12) = 637,500
      expect(depreciacionMensual).toBe(637500);
    });

    it('debería retornar 0 si el activo está totalmente depreciado', () => {
      const activo = {
        valorAdquisicion: 10000000,
        valorResidual: 1000000,
        vidaUtilAnios: 5,
        depreciacionAcumulada: 9000000 // Ya depreciado completamente
      };

      const depreciacionMensual = activoFijoService.calcularDepreciacionMensual(activo);
      expect(depreciacionMensual).toBe(0);
    });

    it('debería manejar activos sin valor residual', () => {
      const activo = {
        valorAdquisicion: 12000000,
        valorResidual: 0,
        vidaUtilAnios: 5,
        depreciacionAcumulada: 0
      };

      const depreciacionMensual = activoFijoService.calcularDepreciacionMensual(activo);

      // 12,000,000 / (5 * 12) = 200,000
      expect(depreciacionMensual).toBe(200000);
    });

    it('debería calcular depreciación parcial correctamente', () => {
      const activo = {
        valorAdquisicion: 24000000,
        valorResidual: 2400000,
        vidaUtilAnios: 10,
        depreciacionAcumulada: 5400000 // 3 años de depreciación
      };

      const depreciacionMensual = activoFijoService.calcularDepreciacionMensual(activo);

      // (24,000,000 - 2,400,000) / (10 * 12) = 180,000
      expect(depreciacionMensual).toBe(180000);
    });
  });

  describe('getCuentaGastoDepreciacion', () => {
    it('debería retornar cuenta correcta para equipo médico', () => {
      const cuenta = activoFijoService.getCuentaGastoDepreciacion('EquipoMedico');
      expect(cuenta).toBe('516515');
    });

    it('debería retornar cuenta correcta para tecnología', () => {
      const cuenta = activoFijoService.getCuentaGastoDepreciacion('Tecnologia');
      expect(cuenta).toBe('516525');
    });

    it('debería retornar cuenta correcta para mobiliario', () => {
      const cuenta = activoFijoService.getCuentaGastoDepreciacion('Mobiliario');
      expect(cuenta).toBe('516510');
    });

    it('debería retornar cuenta correcta para vehículo', () => {
      const cuenta = activoFijoService.getCuentaGastoDepreciacion('Vehiculo');
      expect(cuenta).toBe('516520');
    });

    it('debería retornar cuenta por defecto para tipo desconocido', () => {
      const cuenta = activoFijoService.getCuentaGastoDepreciacion('TipoDesconocido');
      expect(cuenta).toBe('516595');
    });
  });

  describe('getCuentaDepreciacionAcumulada', () => {
    it('debería retornar cuenta acumulada correcta para equipo médico', () => {
      const cuenta = activoFijoService.getCuentaDepreciacionAcumulada('EquipoMedico');
      expect(cuenta).toBe('159215');
    });

    it('debería retornar cuenta acumulada correcta para tecnología', () => {
      const cuenta = activoFijoService.getCuentaDepreciacionAcumulada('Tecnologia');
      expect(cuenta).toBe('159225');
    });
  });
});
