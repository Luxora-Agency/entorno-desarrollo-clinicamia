/**
 * Tests para useComites Hook
 */
import { renderHook, act } from '@testing-library/react';
import { useComites } from '@/hooks/useComites';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

// Mock del servicio API
jest.mock('@/services/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

describe('useComites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // COMITÉS
  // ==========================================
  describe('fetchComites', () => {
    it('debe cargar lista de comités', async () => {
      const mockComites = [
        { id: '1', codigo: 'CSP', nombre: 'Comité de Seguridad del Paciente' },
        { id: '2', codigo: 'COVE', nombre: 'Comité de Vigilancia Epidemiológica' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockComites });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.fetchComites();
        expect(response.success).toBe(true);
      });

      expect(result.current.comites).toHaveLength(2);
    });
  });

  describe('getComiteById', () => {
    it('debe obtener un comité por ID', async () => {
      const mockComite = {
        id: '1',
        codigo: 'CSP',
        nombre: 'Comité de Seguridad del Paciente',
        periodicidad: 'Mensual',
      };

      apiGet.mockResolvedValueOnce({ data: mockComite });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.getComiteById('1');
        expect(response.success).toBe(true);
        expect(response.data.codigo).toBe('CSP');
      });
    });
  });

  describe('createComite', () => {
    it('debe crear un nuevo comité', async () => {
      const nuevoComite = {
        codigo: 'CNE',
        nombre: 'Comité Nuevo',
        periodicidad: 'Trimestral',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: '1', ...nuevoComite, activo: true },
      });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.createComite(nuevoComite);
        expect(response.success).toBe(true);
        expect(response.data.codigo).toBe('CNE');
      });
    });
  });

  // ==========================================
  // INTEGRANTES
  // ==========================================
  describe('fetchIntegrantes', () => {
    it('debe cargar integrantes de un comité', async () => {
      const mockIntegrantes = [
        { id: 'i1', rol: 'Presidente', usuario: { nombre: 'Juan' } },
        { id: 'i2', rol: 'Secretario', usuario: { nombre: 'María' } },
      ];

      apiGet.mockResolvedValueOnce({ data: mockIntegrantes });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.fetchIntegrantes('1');
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(2);
      });
    });
  });

  describe('addIntegrante', () => {
    it('debe agregar integrante al comité', async () => {
      const nuevoIntegrante = {
        usuarioId: 'user-id',
        rol: 'Miembro',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'i1', comiteId: '1', ...nuevoIntegrante, activo: true },
      });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.addIntegrante('1', nuevoIntegrante);
        expect(response.success).toBe(true);
        expect(response.data.rol).toBe('Miembro');
      });
    });
  });

  describe('retirarIntegrante', () => {
    it('debe retirar integrante del comité', async () => {
      apiDelete.mockResolvedValueOnce({
        data: { id: 'i1', activo: false },
      });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.retirarIntegrante('i1');
        expect(response.success).toBe(true);
        expect(response.data.activo).toBe(false);
      });
    });
  });

  // ==========================================
  // REUNIONES
  // ==========================================
  describe('fetchReuniones', () => {
    it('debe cargar reuniones de un comité', async () => {
      const mockReuniones = [
        { id: 'r1', numeroActa: 'ACT-001', estado: 'Realizada' },
        { id: 'r2', numeroActa: 'ACT-002', estado: 'Programada' },
      ];

      apiGet.mockResolvedValueOnce({
        data: { reuniones: mockReuniones },
        pagination: { total: 2 },
      });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.fetchReuniones('1');
        expect(response.success).toBe(true);
      });

      expect(result.current.reuniones).toHaveLength(2);
    });
  });

  describe('programarReunion', () => {
    it('debe programar una reunión', async () => {
      const nuevaReunion = {
        fechaProgramada: '2025-02-01',
        lugar: 'Sala de Reuniones',
        ordenDelDia: ['Tema 1', 'Tema 2'],
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'r1', comiteId: '1', numeroActa: 'ACT-003', ...nuevaReunion, estado: 'Programada' },
      });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.programarReunion('1', nuevaReunion);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Programada');
      });
    });
  });

  describe('registrarReunion', () => {
    it('debe registrar la realización de una reunión', async () => {
      const datosReunion = {
        fechaRealizacion: '2025-01-20',
        asistentes: [{ nombre: 'Juan', cargo: 'Presidente' }],
        temasDiscutidos: ['Tema 1 discutido'],
        decisiones: ['Decisión 1'],
      };

      apiPut.mockResolvedValueOnce({
        data: { id: 'r1', estado: 'Realizada', ...datosReunion },
      });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.registrarReunion('r1', datosReunion);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Realizada');
      });
    });
  });

  // ==========================================
  // COMPROMISOS
  // ==========================================
  describe('fetchCompromisos', () => {
    it('debe cargar compromisos de un comité', async () => {
      const mockCompromisos = [
        { id: 'cp1', descripcion: 'Compromiso 1', estado: 'Pendiente' },
        { id: 'cp2', descripcion: 'Compromiso 2', estado: 'Cumplido' },
      ];

      apiGet.mockResolvedValueOnce({ data: mockCompromisos });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.fetchCompromisos('1');
        expect(response.success).toBe(true);
      });

      expect(result.current.compromisos).toHaveLength(2);
    });
  });

  describe('crearCompromiso', () => {
    it('debe crear un compromiso', async () => {
      const nuevoCompromiso = {
        descripcion: 'Nuevo compromiso',
        responsableId: 'user-id',
        fechaLimite: '2025-02-15',
      };

      apiPost.mockResolvedValueOnce({
        data: { id: 'cp1', reunionId: 'r1', ...nuevoCompromiso, estado: 'Pendiente' },
      });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.crearCompromiso('r1', nuevoCompromiso);
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Pendiente');
      });
    });
  });

  describe('cerrarCompromiso', () => {
    it('debe cerrar un compromiso', async () => {
      apiPut.mockResolvedValueOnce({
        data: { id: 'cp1', estado: 'Cumplido', fechaCierre: new Date().toISOString() },
      });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.cerrarCompromiso('cp1', { observacionCierre: 'Completado' });
        expect(response.success).toBe(true);
        expect(response.data.estado).toBe('Cumplido');
      });
    });
  });

  // ==========================================
  // ACTAS
  // ==========================================
  describe('generarActa', () => {
    it('debe generar acta de reunión', async () => {
      const mockActa = {
        numeroActa: 'ACT-001',
        comite: { nombre: 'Comité Test' },
        fechaRealizacion: '2025-01-20',
      };

      apiGet.mockResolvedValueOnce({ data: mockActa });

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.generarActa('r1');
        expect(response.success).toBe(true);
        expect(response.data).toHaveProperty('numeroActa');
      });
    });
  });

  // ==========================================
  // MANEJO DE ERRORES
  // ==========================================
  describe('manejo de errores', () => {
    it('debe manejar errores correctamente', async () => {
      apiGet.mockRejectedValueOnce(new Error('Error de conexión'));

      const { result } = renderHook(() => useComites());

      await act(async () => {
        const response = await result.current.fetchComites();
        expect(response.success).toBe(false);
        expect(response.error).toBe('Error de conexión');
      });

      expect(result.current.error).toBe('Error de conexión');
    });
  });
});
