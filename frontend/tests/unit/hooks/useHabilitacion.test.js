/**
 * Tests para useHabilitacion Hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHabilitacion } from '@/hooks/useHabilitacion';
import { apiGet, apiPost, apiPut } from '@/services/api';

// Mock del servicio API
jest.mock('@/services/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

describe('useHabilitacion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // ESTÁNDARES
  // ==========================================
  describe('fetchEstandares', () => {
    it('debe cargar estándares correctamente', async () => {
      const mockEstandares = [
        { id: '1', codigo: 'TH-001', nombre: 'Talento Humano' },
        { id: '2', codigo: 'INF-001', nombre: 'Infraestructura' },
      ];

      apiGet.mockResolvedValueOnce({ data: { estandares: mockEstandares } });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.fetchEstandares();
        expect(response.success).toBe(true);
      });

      expect(result.current.estandares).toHaveLength(2);
      expect(apiGet).toHaveBeenCalledWith('/habilitacion/estandares', {});
    });

    it('debe manejar errores correctamente', async () => {
      apiGet.mockRejectedValueOnce(new Error('Error de red'));

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.fetchEstandares();
        expect(response.success).toBe(false);
        expect(response.error).toBe('Error de red');
      });

      expect(result.current.error).toBe('Error de red');
    });

    it('debe filtrar por tipo', async () => {
      apiGet.mockResolvedValueOnce({ data: { estandares: [] } });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        await result.current.fetchEstandares({ tipo: 'TALENTO_HUMANO' });
      });

      expect(apiGet).toHaveBeenCalledWith('/habilitacion/estandares', { tipo: 'TALENTO_HUMANO' });
    });
  });

  describe('getEstandarById', () => {
    it('debe obtener un estándar por ID', async () => {
      const mockEstandar = { id: '1', codigo: 'TH-001', nombre: 'Talento Humano' };

      apiGet.mockResolvedValueOnce({ data: mockEstandar });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.getEstandarById('1');
        expect(response.success).toBe(true);
        expect(response.data.codigo).toBe('TH-001');
      });

      expect(apiGet).toHaveBeenCalledWith('/habilitacion/estandares/1');
    });
  });

  describe('getCriteriosByEstandar', () => {
    it('debe obtener criterios de un estándar', async () => {
      const mockCriterios = [
        { id: 'c1', codigo: 'TH-001-01', descripcion: 'Criterio 1' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockCriterios });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.getCriteriosByEstandar('1');
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(1);
      });

      expect(apiGet).toHaveBeenCalledWith('/habilitacion/estandares/1/criterios');
    });
  });

  // ==========================================
  // AUTOEVALUACIONES
  // ==========================================
  describe('fetchAutoevaluaciones', () => {
    it('debe cargar autoevaluaciones', async () => {
      const mockAutoevaluaciones = [
        { id: 'ae1', estandarId: '1', estado: 'En Proceso' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockAutoevaluaciones, pagination: { total: 1 } });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.fetchAutoevaluaciones();
        expect(response.success).toBe(true);
      });

      expect(result.current.autoevaluaciones).toHaveLength(1);
    });
  });

  describe('createAutoevaluacion', () => {
    it('debe crear una autoevaluación', async () => {
      const nuevaAutoevaluacion = {
        estandarId: '1',
        evaluadorId: 'user-id',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'ae1', ...nuevaAutoevaluacion, estado: 'En Proceso' },
      });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.createAutoevaluacion(nuevaAutoevaluacion);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('En Proceso');
      });

      expect(apiPost).toHaveBeenCalledWith('/habilitacion/autoevaluaciones', nuevaAutoevaluacion);
    });
  });

  describe('updateAutoevaluacion', () => {
    it('debe actualizar una autoevaluación', async () => {
      apiPut.mockResolvedValueOnce({
        data: { id: 'ae1', estado: 'Finalizada' },
      });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.updateAutoevaluacion('ae1', { estado: 'Finalizada' });
        expect(response.success).toBe(true);
      });

      expect(apiPut).toHaveBeenCalledWith('/habilitacion/autoevaluaciones/ae1', { estado: 'Finalizada' });
    });
  });

  // ==========================================
  // EVALUACIÓN DE CRITERIOS
  // ==========================================
  describe('evaluarCriterio', () => {
    it('debe evaluar un criterio', async () => {
      const evaluacion = {
        criterioId: 'c1',
        cumplimiento: 'CUMPLE',
        observacion: 'Cumple correctamente',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'eval1', ...evaluacion },
      });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.evaluarCriterio('ae1', evaluacion);
        expect(response.success).toBe(true);
        expect(response.data.cumplimiento).toBe('CUMPLE');
      });

      expect(apiPost).toHaveBeenCalledWith('/habilitacion/autoevaluaciones/ae1/criterios', evaluacion);
    });
  });

  // ==========================================
  // VISITAS
  // ==========================================
  describe('fetchVisitas', () => {
    it('debe cargar visitas de verificación', async () => {
      const mockVisitas = [
        { id: 'v1', tipoVisita: 'Verificación', estado: 'Programada' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockVisitas, pagination: { total: 1 } });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.fetchVisitas();
        expect(response.success).toBe(true);
      });

      expect(result.current.visitas).toHaveLength(1);
    });
  });

  describe('createVisita', () => {
    it('debe crear una visita', async () => {
      const nuevaVisita = {
        tipoVisita: 'Verificación',
        entidadVisitadora: 'Secretaría de Salud',
        fechaVisita: '2025-01-20',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'v1', ...nuevaVisita, estado: 'Programada' },
      });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.createVisita(nuevaVisita);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Programada');
      });

      expect(apiPost).toHaveBeenCalledWith('/habilitacion/visitas', nuevaVisita);
    });
  });

  describe('registrarHallazgosVisita', () => {
    it('debe registrar hallazgos de una visita', async () => {
      const hallazgos = [
        { tipo: 'NC', descripcion: 'No conformidad detectada' },
      ];

      apiPost.mockResolvedValueOnce({
        data: { visitaId: 'v1', hallazgos },
      });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.registrarHallazgosVisita('v1', hallazgos);
        expect(response.success).toBe(true);
      });

      expect(apiPost).toHaveBeenCalledWith('/habilitacion/visitas/v1/hallazgos', { hallazgos });
    });
  });

  // ==========================================
  // DASHBOARD
  // ==========================================
  describe('fetchDashboard', () => {
    it('debe cargar datos del dashboard', async () => {
      const mockDashboard = {
        totalEstandares: 7,
        autoevaluacionesEnProceso: 2,
        porcentajeCumplimiento: 85,
      };

      apiGet.mockResolvedValueOnce({ data: { dashboard: mockDashboard } });

      const { result } = renderHook(() => useHabilitacion());

      await act(async () => {
        const response = await result.current.fetchDashboard();
        expect(response.success).toBe(true);
      });

      expect(result.current.dashboard).toEqual(mockDashboard);
      expect(apiGet).toHaveBeenCalledWith('/habilitacion/dashboard');
    });
  });

  // ==========================================
  // ESTADO LOADING
  // ==========================================
  describe('estado loading', () => {
    it('debe manejar el estado loading correctamente', async () => {
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      apiGet.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useHabilitacion());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.fetchEstandares();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ data: { estandares: [] } });
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });
});
