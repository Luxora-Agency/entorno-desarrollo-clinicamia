/**
 * Tests para useIndicadoresSIC Hook
 */
import { renderHook, act } from '@testing-library/react';
import { useIndicadoresSIC } from '@/hooks/useIndicadoresSIC';
import { apiGet, apiPost, apiPut } from '@/services/api';

// Mock del servicio API
jest.mock('@/services/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

describe('useIndicadoresSIC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // INDICADORES
  // ==========================================
  describe('fetchIndicadores', () => {
    it('debe cargar lista de indicadores SIC', async () => {
      const mockIndicadores = [
        { id: '1', codigo: 'P.1.1', nombre: 'Indicador 1', dominio: 'EFECTIVIDAD' },
        { id: '2', codigo: 'P.2.9', nombre: 'Indicador 2', dominio: 'SEGURIDAD' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockIndicadores });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.fetchIndicadores();
        expect(response.success).toBe(true);
      });

      expect(result.current.indicadores).toHaveLength(2);
    });

    it('debe filtrar por dominio', async () => {
      apiGet.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        await result.current.fetchIndicadores({ dominio: 'EFECTIVIDAD' });
      });

      expect(apiGet).toHaveBeenCalledWith('/indicadores-sic', expect.objectContaining({ dominio: 'EFECTIVIDAD' }));
    });
  });

  describe('getIndicadorById', () => {
    it('debe obtener un indicador por ID', async () => {
      const mockIndicador = {
        id: '1',
        codigo: 'P.1.1',
        nombre: 'Proporción de gestantes con control prenatal',
        dominio: 'EFECTIVIDAD',
        metaNacional: 90.00,
      };

      apiGet.mockResolvedValueOnce({ data: mockIndicador });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.getIndicadorById('1');
        expect(response.success).toBe(true);
        expect(response.data.codigo).toBe('P.1.1');
      });
    });
  });

  describe('getIndicadoresPorDominio', () => {
    it('debe obtener indicadores por dominio', async () => {
      const mockIndicadores = [
        { id: '1', codigo: 'P.1.1', dominio: 'EFECTIVIDAD' },
        { id: '2', codigo: 'P.1.2', dominio: 'EFECTIVIDAD' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockIndicadores });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.getIndicadoresPorDominio('EFECTIVIDAD');
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(2);
      });

      expect(apiGet).toHaveBeenCalledWith('/indicadores-sic/dominio/EFECTIVIDAD');
    });
  });

  describe('getFichaTecnica', () => {
    it('debe obtener ficha técnica de un indicador', async () => {
      const mockFicha = {
        codigo: 'P.1.1',
        definicionOperacional: 'Definición del indicador',
        formulaNumerador: 'Numerador',
        formulaDenominador: 'Denominador',
        metaNacional: 90.00,
      };

      apiGet.mockResolvedValueOnce({ data: mockFicha });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.getFichaTecnica('1');
        expect(response.success).toBe(true);
        expect(response.data).toHaveProperty('definicionOperacional');
      });
    });
  });

  // ==========================================
  // MEDICIONES
  // ==========================================
  describe('fetchMediciones', () => {
    it('debe cargar mediciones de un indicador', async () => {
      const mockMediciones = [
        { id: 'm1', periodo: '2025-S1', resultado: 85.00, cumpleMeta: true },
        { id: 'm2', periodo: '2024-S2', resultado: 80.00, cumpleMeta: false },
      ];

      apiGet.mockResolvedValueOnce({
        data: { mediciones: mockMediciones },
        pagination: { total: 2 },
      });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.fetchMediciones('ind-1');
        expect(response.success).toBe(true);
      });

      expect(result.current.mediciones).toHaveLength(2);
    });
  });

  describe('registrarMedicion', () => {
    it('debe registrar una medición', async () => {
      const medicion = {
        periodo: '2025-S1',
        numerador: 85,
        denominador: 100,
        registradoPor: 'user-id',
      };

      apiPost.mockResolvedValueOnce({
        data: {
          id: 'm1',
          indicadorId: 'ind-1',
          ...medicion,
          resultado: 85.00,
          cumpleMeta: true,
          semaforoEstado: 'Verde',
        },
      });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.registrarMedicion('ind-1', medicion);
        expect(response.success).toBe(true);
        expect(response.data.resultado).toBe(85.00);
        expect(response.data.semaforoEstado).toBe('Verde');
      });
    });
  });

  describe('updateMedicion', () => {
    it('debe actualizar una medición', async () => {
      apiPut.mockResolvedValueOnce({
        data: { id: 'm1', analisis: 'Análisis actualizado' },
      });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.updateMedicion('m1', { analisis: 'Análisis actualizado' });
        expect(response.success).toBe(true);
      });
    });
  });

  // ==========================================
  // TENDENCIAS Y SEMÁFOROS
  // ==========================================
  describe('getTendencia', () => {
    it('debe obtener tendencia de un indicador', async () => {
      const mockTendencia = [
        { periodo: '2024-S1', resultado: 75.00 },
        { periodo: '2024-S2', resultado: 80.00 },
        { periodo: '2025-S1', resultado: 85.00 },
      ];

      apiGet.mockResolvedValueOnce({ data: mockTendencia });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.getTendencia('ind-1', 6);
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(3);
      });
    });
  });

  describe('fetchSemaforos', () => {
    it('debe cargar semáforos para un periodo', async () => {
      const mockSemaforos = [
        { indicadorId: 'i1', resultado: 92, semaforoEstado: 'Verde' },
        { indicadorId: 'i2', resultado: 75, semaforoEstado: 'Amarillo' },
        { indicadorId: 'i3', resultado: 50, semaforoEstado: 'Rojo' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockSemaforos });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.fetchSemaforos('2025-S1');
        expect(response.success).toBe(true);
      });

      expect(result.current.semaforos).toHaveLength(3);
    });
  });

  // ==========================================
  // DASHBOARD
  // ==========================================
  describe('fetchDashboard', () => {
    it('debe cargar datos del dashboard', async () => {
      const mockDashboard = {
        totalIndicadores: 20,
        indicadoresConMedicion: 18,
        promedioGeneral: 82.5,
        verdes: 10,
        amarillos: 5,
        rojos: 3,
      };

      apiGet.mockResolvedValueOnce({ data: mockDashboard });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.fetchDashboard('2025-S1');
        expect(response.success).toBe(true);
      });

      expect(result.current.dashboard).toEqual(mockDashboard);
    });
  });

  // ==========================================
  // REPORTE SISPRO
  // ==========================================
  describe('marcarReportadoSISPRO', () => {
    it('debe marcar medición como reportada a SISPRO', async () => {
      apiPut.mockResolvedValueOnce({
        data: { id: 'm1', reportadoSISPRO: true, fechaReporteSISPRO: new Date().toISOString() },
      });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.marcarReportadoSISPRO('m1');
        expect(response.success).toBe(true);
        expect(response.data.reportadoSISPRO).toBe(true);
      });
    });
  });

  describe('getConsolidadoSemestral', () => {
    it('debe obtener consolidado semestral', async () => {
      const mockConsolidado = {
        indicadores: [],
        resumen: { cumpleMeta: 15, noCumple: 5 },
      };

      apiGet.mockResolvedValueOnce({ data: mockConsolidado });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.getConsolidadoSemestral('2025-S1');
        expect(response.success).toBe(true);
        expect(response.data).toHaveProperty('resumen');
      });
    });
  });

  // ==========================================
  // META INSTITUCIONAL
  // ==========================================
  describe('actualizarMetaInstitucional', () => {
    it('debe actualizar meta institucional', async () => {
      apiPut.mockResolvedValueOnce({
        data: { id: 'i1', metaInstitucional: 85.00 },
      });

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.actualizarMetaInstitucional('i1', 85.00);
        expect(response.success).toBe(true);
        expect(response.data.metaInstitucional).toBe(85.00);
      });
    });
  });

  // ==========================================
  // MANEJO DE ERRORES
  // ==========================================
  describe('manejo de errores', () => {
    it('debe manejar errores correctamente', async () => {
      apiGet.mockRejectedValueOnce(new Error('Error de conexión'));

      const { result } = renderHook(() => useIndicadoresSIC());

      await act(async () => {
        const response = await result.current.fetchIndicadores();
        expect(response.success).toBe(false);
        expect(response.error).toBe('Error de conexión');
      });

      expect(result.current.error).toBe('Error de conexión');
    });
  });
});
