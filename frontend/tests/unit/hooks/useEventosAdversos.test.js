/**
 * Tests para useEventosAdversos Hook
 */
import { renderHook, act } from '@testing-library/react';
import { useEventosAdversos } from '@/hooks/useEventosAdversos';
import { apiGet, apiPost, apiPut } from '@/services/api';

// Mock del servicio API
jest.mock('@/services/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

describe('useEventosAdversos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // EVENTOS
  // ==========================================
  describe('fetchEventos', () => {
    it('debe cargar lista de eventos adversos', async () => {
      const mockEventos = [
        { id: '1', codigo: 'EA-001', tipoEvento: 'INCIDENTE', severidad: 'LEVE' },
        { id: '2', codigo: 'EA-002', tipoEvento: 'EVENTO_ADVERSO_PREVENIBLE', severidad: 'MODERADO' },
      ];

      apiGet.mockResolvedValueOnce({
        data: { eventos: mockEventos },
        pagination: { total: 2 },
      });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.fetchEventos();
        expect(response.success).toBe(true);
      });

      expect(result.current.eventos).toHaveLength(2);
    });

    it('debe filtrar por severidad', async () => {
      apiGet.mockResolvedValueOnce({
        data: { eventos: [] },
        pagination: { total: 0 },
      });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        await result.current.fetchEventos({ severidad: 'GRAVE' });
      });

      expect(apiGet).toHaveBeenCalledWith('/eventos-adversos', expect.objectContaining({ severidad: 'GRAVE' }));
    });

    it('debe filtrar por tipo de evento', async () => {
      apiGet.mockResolvedValueOnce({
        data: { eventos: [] },
        pagination: { total: 0 },
      });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        await result.current.fetchEventos({ tipoEvento: 'INCIDENTE' });
      });

      expect(apiGet).toHaveBeenCalledWith('/eventos-adversos', expect.objectContaining({ tipoEvento: 'INCIDENTE' }));
    });
  });

  describe('getEventoById', () => {
    it('debe obtener un evento por ID', async () => {
      const mockEvento = {
        id: '1',
        codigo: 'EA-001',
        tipoEvento: 'INCIDENTE',
        descripcionEvento: 'Descripción del incidente',
      };

      apiGet.mockResolvedValueOnce({ data: mockEvento });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.getEventoById('1');
        expect(response.success).toBe(true);
        expect(response.data.codigo).toBe('EA-001');
      });
    });
  });

  describe('reportarEvento', () => {
    it('debe reportar un nuevo evento adverso', async () => {
      const nuevoEvento = {
        tipoEvento: 'INCIDENTE',
        severidad: 'LEVE',
        fechaEvento: '2025-01-17',
        servicioOcurrencia: 'Urgencias',
        descripcionEvento: 'Descripción del incidente',
        reportadoPor: 'user-id',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: '1', codigo: 'EA-001', ...nuevoEvento, estado: 'Reportado' },
      });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.reportarEvento(nuevoEvento);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Reportado');
      });

      expect(apiPost).toHaveBeenCalledWith('/eventos-adversos', nuevoEvento);
    });
  });

  describe('updateEvento', () => {
    it('debe actualizar un evento', async () => {
      apiPut.mockResolvedValueOnce({
        data: { id: '1', estado: 'En Análisis' },
      });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.updateEvento('1', { estado: 'En Análisis' });
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('En Análisis');
      });
    });
  });

  // ==========================================
  // ANÁLISIS CAUSA RAÍZ
  // ==========================================
  describe('iniciarAnalisisCausaRaiz', () => {
    it('debe iniciar análisis con Protocolo de Londres', async () => {
      const analisis = {
        metodoAnalisis: 'ProtocoloLondres',
        analistaId: 'user-id',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'acr-1', eventoId: '1', ...analisis, estado: 'En Análisis' },
      });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.iniciarAnalisisCausaRaiz('1', analisis);
        expect(response.success).toBe(true);
        expect(response.data.metodoAnalisis).toBe('ProtocoloLondres');
      });

      expect(apiPost).toHaveBeenCalledWith('/eventos-adversos/1/analisis', analisis);
    });
  });

  describe('actualizarAnalisis', () => {
    it('debe actualizar análisis de causa raíz', async () => {
      const actualizacion = {
        fallas_activas: ['Falla 1', 'Falla 2'],
        condiciones_latentes: ['Condición 1'],
      };

      apiPut.mockResolvedValueOnce({
        data: { id: 'acr-1', ...actualizacion },
      });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.actualizarAnalisis('acr-1', actualizacion);
        expect(response.success).toBe(true);
        expect(response.data.fallas_activas).toHaveLength(2);
      });
    });
  });

  describe('finalizarAnalisis', () => {
    it('debe finalizar análisis', async () => {
      const finalizacion = {
        conclusiones: 'Conclusiones del análisis',
        recomendaciones: 'Recomendaciones',
        leccionesAprendidas: 'Lecciones aprendidas',
      };

      apiPut.mockResolvedValueOnce({
        data: { id: 'acr-1', estado: 'Finalizado', ...finalizacion },
      });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.finalizarAnalisis('acr-1', finalizacion);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Finalizado');
      });
    });
  });

  // ==========================================
  // FACTORES CONTRIBUTIVOS
  // ==========================================
  describe('agregarFactorContributivo', () => {
    it('debe agregar factor contributivo', async () => {
      const factor = {
        categoria: 'Paciente',
        subcategoria: 'Condición clínica',
        descripcion: 'Factor identificado',
        nivelContribucion: 'Alto',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'f1', eventoId: '1', ...factor },
      });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.agregarFactorContributivo('1', factor);
        expect(response.success).toBe(true);
        expect(response.data.categoria).toBe('Paciente');
      });

      expect(apiPost).toHaveBeenCalledWith('/eventos-adversos/1/factores', factor);
    });
  });

  describe('getFactores', () => {
    it('debe obtener factores de un evento', async () => {
      const mockFactores = [
        { id: 'f1', categoria: 'Paciente' },
        { id: 'f2', categoria: 'Equipo' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockFactores });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.getFactores('1');
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(2);
      });
    });
  });

  // ==========================================
  // ESTADÍSTICAS Y DASHBOARD
  // ==========================================
  describe('fetchEstadisticas', () => {
    it('debe cargar estadísticas de eventos', async () => {
      const mockEstadisticas = {
        total: 10,
        porSeveridad: { LEVE: 5, MODERADO: 3, GRAVE: 2 },
        porTipo: { INCIDENTE: 6, EVENTO_ADVERSO_PREVENIBLE: 4 },
      };

      apiGet.mockResolvedValueOnce({ data: mockEstadisticas });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.fetchEstadisticas({ periodo: '2025-01' });
        expect(response.success).toBe(true);
      });

      expect(result.current.estadisticas).toEqual(mockEstadisticas);
    });
  });

  describe('getEventosPorServicio', () => {
    it('debe obtener eventos agrupados por servicio', async () => {
      const mockAgrupacion = [
        { servicioOcurrencia: 'Urgencias', _count: 5 },
        { servicioOcurrencia: 'Hospitalización', _count: 3 },
      ];

      apiGet.mockResolvedValueOnce({ data: mockAgrupacion });

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.getEventosPorServicio();
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(2);
      });
    });
  });

  // ==========================================
  // MANEJO DE ERRORES
  // ==========================================
  describe('manejo de errores', () => {
    it('debe manejar errores en reportarEvento', async () => {
      apiPost.mockRejectedValueOnce(new Error('Error de validación'));

      const { result } = renderHook(() => useEventosAdversos());

      await act(async () => {
        const response = await result.current.reportarEvento({});
        expect(response.success).toBe(false);
        expect(response.error).toBe('Error de validación');
      });

      expect(result.current.error).toBe('Error de validación');
    });
  });
});
