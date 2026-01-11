/**
 * Tests para usePQRS Hook
 */
import { renderHook, act } from '@testing-library/react';
import { usePQRS } from '@/hooks/usePQRS';
import { apiGet, apiPost, apiPut } from '@/services/api';

// Mock del servicio API
jest.mock('@/services/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

describe('usePQRS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // PQRS CRUD
  // ==========================================
  describe('fetchPQRS', () => {
    it('debe cargar lista de PQRS', async () => {
      const mockPQRS = [
        { id: '1', radicado: 'PQRS-001', tipo: 'PETICION', estado: 'Radicada' },
        { id: '2', radicado: 'PQRS-002', tipo: 'QUEJA', estado: 'En Proceso' },
      ];

      apiGet.mockResolvedValueOnce({
        data: { pqrs: mockPQRS },
        pagination: { total: 2, page: 1, limit: 10 },
      });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.fetchPQRS();
        expect(response.success).toBe(true);
      });

      expect(result.current.pqrs).toHaveLength(2);
    });

    it('debe filtrar por tipo', async () => {
      apiGet.mockResolvedValueOnce({
        data: { pqrs: [] },
        pagination: { total: 0 },
      });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        await result.current.fetchPQRS({ tipo: 'QUEJA' });
      });

      expect(apiGet).toHaveBeenCalledWith('/pqrs', expect.objectContaining({ tipo: 'QUEJA' }));
    });

    it('debe filtrar por estado', async () => {
      apiGet.mockResolvedValueOnce({
        data: { pqrs: [] },
        pagination: { total: 0 },
      });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        await result.current.fetchPQRS({ estado: 'Respondida' });
      });

      expect(apiGet).toHaveBeenCalledWith('/pqrs', expect.objectContaining({ estado: 'Respondida' }));
    });
  });

  describe('getPQRSById', () => {
    it('debe obtener un PQRS por ID', async () => {
      const mockPQRS = {
        id: '1',
        radicado: 'PQRS-001',
        tipo: 'PETICION',
        nombrePeticionario: 'Juan Pérez',
      };

      apiGet.mockResolvedValueOnce({ data: mockPQRS });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.getPQRSById('1');
        expect(response.success).toBe(true);
        expect(response.data.radicado).toBe('PQRS-001');
      });
    });
  });

  describe('crearPQRS', () => {
    it('debe crear un nuevo PQRS', async () => {
      const nuevoPQRS = {
        tipo: 'PETICION',
        canal: 'PRESENCIAL',
        nombrePeticionario: 'Juan Pérez',
        asunto: 'Solicitud de historia clínica',
        descripcion: 'Descripción de la solicitud',
      };

      apiPost.mockResolvedValueOnce({
        data: {
          id: '1',
          radicado: 'PQRS-20251217-001',
          ...nuevoPQRS,
          estado: 'Radicada',
          diasHabilesLimite: 15,
        },
      });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.crearPQRS(nuevoPQRS);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Radicada');
        expect(response.data.diasHabilesLimite).toBe(15);
      });

      expect(apiPost).toHaveBeenCalledWith('/pqrs', nuevoPQRS);
    });
  });

  // ==========================================
  // GESTIÓN DE PQRS
  // ==========================================
  describe('asignarPQRS', () => {
    it('debe asignar PQRS a responsable', async () => {
      const asignacion = {
        responsableId: 'user-id',
        areaAsignada: 'Atención al Usuario',
      };

      apiPut.mockResolvedValueOnce({
        data: { id: '1', ...asignacion, estado: 'Asignada' },
      });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.asignarPQRS('1', asignacion);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Asignada');
      });
    });
  });

  describe('responderPQRS', () => {
    it('debe registrar respuesta a PQRS', async () => {
      const respuesta = {
        respuesta: 'Respuesta al peticionario',
        respondidoPor: 'user-id',
      };

      apiPut.mockResolvedValueOnce({
        data: { id: '1', ...respuesta, estado: 'Respondida', fechaRespuesta: new Date().toISOString() },
      });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.responderPQRS('1', respuesta);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Respondida');
      });
    });
  });

  describe('cerrarPQRS', () => {
    it('debe cerrar un PQRS', async () => {
      apiPut.mockResolvedValueOnce({
        data: { id: '1', estado: 'Cerrada' },
      });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.cerrarPQRS('1', { observaciones: 'Caso cerrado' });
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Cerrada');
      });
    });
  });

  // ==========================================
  // SEGUIMIENTOS
  // ==========================================
  describe('agregarSeguimiento', () => {
    it('debe agregar seguimiento a PQRS', async () => {
      const seguimiento = {
        accion: 'Se contactó al peticionario',
        observaciones: 'Se informó sobre el estado',
        usuarioId: 'user-id',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 's1', pqrsId: '1', ...seguimiento, fechaAccion: new Date().toISOString() },
      });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.agregarSeguimiento('1', seguimiento);
        expect(response.success).toBe(true);
        expect(response.data.accion).toBe('Se contactó al peticionario');
      });
    });
  });

  describe('getSeguimientos', () => {
    it('debe obtener seguimientos de un PQRS', async () => {
      const mockSeguimientos = [
        { id: 's1', accion: 'Acción 1', fechaAccion: new Date().toISOString() },
        { id: 's2', accion: 'Acción 2', fechaAccion: new Date().toISOString() },
      ];

      apiGet.mockResolvedValueOnce({ data: mockSeguimientos });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.getSeguimientos('1');
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(2);
      });
    });
  });

  // ==========================================
  // SATISFACCIÓN
  // ==========================================
  describe('registrarSatisfaccion', () => {
    it('debe registrar calificación de satisfacción', async () => {
      const satisfaccion = {
        calificacion: 5,
        comentario: 'Muy satisfecho con la respuesta',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: '1', calificacionRespuesta: 5, comentarioSatisfaccion: satisfaccion.comentario },
      });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.registrarSatisfaccion('1', satisfaccion);
        expect(response.success).toBe(true);
        expect(response.data.calificacionRespuesta).toBe(5);
      });
    });
  });

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================
  describe('fetchEstadisticas', () => {
    it('debe cargar estadísticas de PQRS', async () => {
      const mockEstadisticas = {
        total: 100,
        porEstado: { Radicada: 30, Respondida: 40, Cerrada: 30 },
        porTipo: { PETICION: 50, QUEJA: 30, RECLAMO: 20 },
      };

      apiGet.mockResolvedValueOnce({ data: mockEstadisticas });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.fetchEstadisticas({ periodo: '2025-01' });
        expect(response.success).toBe(true);
      });

      expect(result.current.estadisticas).toEqual(mockEstadisticas);
    });
  });

  describe('getPQRSPorTipo', () => {
    it('debe obtener PQRS agrupados por tipo', async () => {
      const mockAgrupacion = [
        { tipo: 'PETICION', _count: { id: 50 } },
        { tipo: 'QUEJA', _count: { id: 30 } },
      ];

      apiGet.mockResolvedValueOnce({ data: mockAgrupacion });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.getPQRSPorTipo();
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(2);
      });
    });
  });

  describe('getVencidos', () => {
    it('debe obtener PQRS vencidos', async () => {
      const mockVencidos = [
        { id: '1', radicado: 'PQRS-001', estado: 'En Proceso' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockVencidos });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.getVencidos();
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(1);
      });
    });
  });

  describe('getProximosAVencer', () => {
    it('debe obtener PQRS próximos a vencer', async () => {
      const mockProximos = [
        { id: '1', radicado: 'PQRS-001', diasRestantes: 2 },
      ];

      apiGet.mockResolvedValueOnce({ data: mockProximos });

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.getProximosAVencer(3);
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(1);
      });
    });
  });

  // ==========================================
  // MANEJO DE ERRORES
  // ==========================================
  describe('manejo de errores', () => {
    it('debe manejar errores en crearPQRS', async () => {
      apiPost.mockRejectedValueOnce(new Error('Error de validación'));

      const { result } = renderHook(() => usePQRS());

      await act(async () => {
        const response = await result.current.crearPQRS({});
        expect(response.success).toBe(false);
        expect(response.error).toBe('Error de validación');
      });

      expect(result.current.error).toBe('Error de validación');
    });
  });
});
