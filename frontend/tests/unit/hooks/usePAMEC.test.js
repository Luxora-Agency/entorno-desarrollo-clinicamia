/**
 * Tests para usePAMEC Hook
 */
import { renderHook, act } from '@testing-library/react';
import { usePAMEC } from '@/hooks/usePAMEC';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

// Mock del servicio API
jest.mock('@/services/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

describe('usePAMEC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // EQUIPO PAMEC
  // ==========================================
  describe('fetchEquipo', () => {
    it('debe cargar miembros del equipo PAMEC', async () => {
      const mockEquipo = [
        { id: '1', rol: 'Líder', usuario: { nombre: 'Juan' } },
        { id: '2', rol: 'Auditor', usuario: { nombre: 'María' } },
      ];

      apiGet.mockResolvedValueOnce({ data: mockEquipo });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.fetchEquipo();
        expect(response.success).toBe(true);
      });

      expect(result.current.equipo).toHaveLength(2);
      expect(apiGet).toHaveBeenCalledWith('/pamec/equipo', {});
    });
  });

  describe('addMiembroEquipo', () => {
    it('debe agregar un miembro al equipo', async () => {
      const nuevoMiembro = {
        usuarioId: 'user-id',
        rol: 'Auditor',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: '1', ...nuevoMiembro, activo: true },
      });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.addMiembroEquipo(nuevoMiembro);
        expect(response.success).toBe(true);
        expect(response.data.rol).toBe('Auditor');
      });

      expect(apiPost).toHaveBeenCalledWith('/pamec/equipo', nuevoMiembro);
    });
  });

  describe('retirarMiembro', () => {
    it('debe retirar un miembro del equipo', async () => {
      apiDelete.mockResolvedValueOnce({
        data: { id: '1', activo: false },
      });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.retirarMiembro('1');
        expect(response.success).toBe(true);
        expect(response.data.activo).toBe(false);
      });

      expect(apiDelete).toHaveBeenCalledWith('/pamec/equipo/1');
    });
  });

  // ==========================================
  // PROCESOS
  // ==========================================
  describe('fetchProcesos', () => {
    it('debe cargar procesos PAMEC', async () => {
      const mockProcesos = [
        { id: '1', nombre: 'Proceso 1', estado: 'Identificado' },
        { id: '2', nombre: 'Proceso 2', estado: 'En mejora' },
      ];

      apiGet.mockResolvedValueOnce({
        data: { procesos: mockProcesos },
        pagination: { total: 2 },
      });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.fetchProcesos();
        expect(response.success).toBe(true);
      });

      expect(result.current.procesos).toHaveLength(2);
    });
  });

  describe('createProceso', () => {
    it('debe crear un proceso', async () => {
      const nuevoProceso = {
        nombre: 'Nuevo Proceso',
        descripcion: 'Descripción del proceso',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: '1', ...nuevoProceso, estado: 'Identificado' },
      });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.createProceso(nuevoProceso);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Identificado');
      });

      expect(apiPost).toHaveBeenCalledWith('/pamec/procesos', nuevoProceso);
    });
  });

  describe('priorizarProcesos', () => {
    it('debe priorizar procesos', async () => {
      const priorizacion = {
        procesoIds: ['p1', 'p2', 'p3'],
        criterios: { altoRiesgo: true, altoVolumen: true },
      };

      apiPost.mockResolvedValueOnce({
        data: { success: true },
      });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.priorizarProcesos(
          priorizacion.procesoIds,
          priorizacion.criterios
        );
        expect(response.success).toBe(true);
      });

      expect(apiPost).toHaveBeenCalledWith('/pamec/procesos/priorizar', priorizacion);
    });
  });

  // ==========================================
  // INDICADORES
  // ==========================================
  describe('fetchIndicadores', () => {
    it('debe cargar indicadores PAMEC', async () => {
      const mockIndicadores = [
        { id: '1', codigo: 'PAMEC-001', nombre: 'Indicador 1' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockIndicadores });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.fetchIndicadores();
        expect(response.success).toBe(true);
      });

      expect(result.current.indicadores).toHaveLength(1);
    });
  });

  describe('registrarMedicion', () => {
    it('debe registrar medición de indicador', async () => {
      const medicion = {
        periodo: '2025-01',
        numerador: 85,
        denominador: 100,
        registradoPor: 'user-id',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'm1', indicadorId: 'ind-1', ...medicion, resultado: 85.00, cumpleMeta: true },
      });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.registrarMedicion('ind-1', medicion);
        expect(response.success).toBe(true);
        expect(response.data.cumpleMeta).toBe(true);
      });

      expect(apiPost).toHaveBeenCalledWith('/pamec/indicadores/ind-1/mediciones', medicion);
    });
  });

  // ==========================================
  // AUDITORÍAS
  // ==========================================
  describe('fetchAuditorias', () => {
    it('debe cargar auditorías', async () => {
      const mockAuditorias = [
        { id: 'a1', tipoAuditoria: 'Interna', estado: 'Programada' },
      ];

      apiGet.mockResolvedValueOnce({
        data: { auditorias: mockAuditorias },
        pagination: { total: 1 },
      });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.fetchAuditorias();
        expect(response.success).toBe(true);
      });

      expect(result.current.auditorias).toHaveLength(1);
    });
  });

  describe('programarAuditoria', () => {
    it('debe programar una auditoría', async () => {
      const nuevaAuditoria = {
        procesoId: 'p1',
        tipoAuditoria: 'Interna',
        auditorId: 'auditor-1',
        fechaProgramada: '2025-02-01',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'a1', ...nuevaAuditoria, estado: 'Programada' },
      });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.programarAuditoria(nuevaAuditoria);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Programada');
      });

      expect(apiPost).toHaveBeenCalledWith('/pamec/auditorias', nuevaAuditoria);
    });
  });

  describe('ejecutarAuditoria', () => {
    it('debe ejecutar una auditoría', async () => {
      apiPut.mockResolvedValueOnce({
        data: { id: 'a1', estado: 'En Ejecución' },
      });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.ejecutarAuditoria('a1', {});
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('En Ejecución');
      });

      expect(apiPut).toHaveBeenCalledWith('/pamec/auditorias/a1/ejecutar', {});
    });
  });

  // ==========================================
  // HALLAZGOS
  // ==========================================
  describe('registrarHallazgo', () => {
    it('debe registrar hallazgo de auditoría', async () => {
      const hallazgo = {
        tipo: 'NC_Menor',
        descripcion: 'No conformidad encontrada',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'h1', auditoriaId: 'a1', ...hallazgo, estado: 'Abierto' },
      });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.registrarHallazgo('a1', hallazgo);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Abierto');
      });

      expect(apiPost).toHaveBeenCalledWith('/pamec/auditorias/a1/hallazgos', hallazgo);
    });
  });

  // ==========================================
  // DASHBOARD Y RUTA CRÍTICA
  // ==========================================
  describe('fetchDashboard', () => {
    it('debe cargar datos del dashboard', async () => {
      const mockDashboard = {
        totalProcesos: 5,
        totalAuditorias: 3,
        hallazgosAbiertos: 8,
      };

      apiGet.mockResolvedValueOnce({ data: mockDashboard });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.fetchDashboard();
        expect(response.success).toBe(true);
      });

      expect(result.current.dashboard).toEqual(mockDashboard);
    });
  });

  describe('fetchRutaCritica', () => {
    it('debe cargar estado de la ruta crítica', async () => {
      const mockRutaCritica = {
        progreso: {
          autoevaluacion: true,
          seleccionProcesos: true,
          priorizacion: false,
        },
      };

      apiGet.mockResolvedValueOnce({ data: mockRutaCritica });

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.fetchRutaCritica();
        expect(response.success).toBe(true);
      });

      expect(result.current.rutaCritica).toEqual(mockRutaCritica);
    });
  });

  // ==========================================
  // MANEJO DE ERRORES
  // ==========================================
  describe('manejo de errores', () => {
    it('debe manejar errores en fetchProcesos', async () => {
      apiGet.mockRejectedValueOnce(new Error('Error de servidor'));

      const { result } = renderHook(() => usePAMEC());

      await act(async () => {
        const response = await result.current.fetchProcesos();
        expect(response.success).toBe(false);
        expect(response.error).toBe('Error de servidor');
      });

      expect(result.current.error).toBe('Error de servidor');
    });
  });
});
