/**
 * Tests para useTalentoHumano hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import useTalentoHumano from '@/hooks/useTalentoHumano';

// Mock API functions
jest.mock('@/services/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
  apiPatch: jest.fn()
}));

import { apiGet, apiPost, apiPut, apiPatch } from '@/services/api';

describe('useTalentoHumano', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('debe tener estados iniciales correctos', () => {
      const { result } = renderHook(() => useTalentoHumano());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.empleados).toEqual([]);
      expect(result.current.vacantes).toEqual([]);
      expect(result.current.candidatos).toEqual([]);
      expect(result.current.capacitaciones).toEqual([]);
      expect(result.current.periodosNomina).toEqual([]);
    });
  });

  describe('fetchDashboardStats', () => {
    it('debe obtener estadísticas del dashboard', async () => {
      const mockStats = { empleados: { total: 100 }, vacantes: { abiertas: 5 } };
      apiGet.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.fetchDashboardStats();
      });

      expect(apiGet).toHaveBeenCalledWith('/talento-humano/dashboard/stats');
      expect(result.current.dashboardStats).toEqual(mockStats);
      expect(result.current.loading).toBe(false);
    });

    it('debe manejar errores correctamente', async () => {
      const errorMessage = 'Error de conexión';
      apiGet.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        try {
          await result.current.fetchDashboardStats();
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Empleados', () => {
    it('debe obtener lista de empleados', async () => {
      const mockEmpleados = { data: [{ id: '1', nombre: 'Juan' }, { id: '2', nombre: 'María' }] };
      apiGet.mockResolvedValue(mockEmpleados);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.fetchEmpleados({ estado: 'ACTIVO' });
      });

      expect(apiGet).toHaveBeenCalledWith('/talento-humano/empleados?estado=ACTIVO');
      expect(result.current.empleados).toEqual(mockEmpleados.data);
    });

    it('debe obtener empleado por ID', async () => {
      const mockEmpleado = { id: '1', nombre: 'Juan', apellido: 'Pérez' };
      apiGet.mockResolvedValue(mockEmpleado);

      const { result } = renderHook(() => useTalentoHumano());

      let empleado;
      await act(async () => {
        empleado = await result.current.getEmpleado('1');
      });

      expect(apiGet).toHaveBeenCalledWith('/talento-humano/empleados/1');
      expect(empleado).toEqual(mockEmpleado);
    });

    it('debe crear empleado', async () => {
      const nuevoEmpleado = { nombre: 'Pedro', apellido: 'García' };
      const mockResponse = { id: '3', ...nuevoEmpleado };
      apiPost.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTalentoHumano());

      let response;
      await act(async () => {
        response = await result.current.createEmpleado(nuevoEmpleado);
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/empleados', nuevoEmpleado);
      expect(response).toEqual(mockResponse);
    });

    it('debe actualizar empleado', async () => {
      const updateData = { telefono: '3001234567' };
      const mockResponse = { id: '1', telefono: '3001234567' };
      apiPut.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.updateEmpleado('1', updateData);
      });

      expect(apiPut).toHaveBeenCalledWith('/talento-humano/empleados/1', updateData);
    });

    it('debe cambiar estado del empleado', async () => {
      apiPatch.mockResolvedValue({ id: '1', estado: 'INACTIVO' });

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.changeEstadoEmpleado('1', 'INACTIVO', 'Retiro voluntario');
      });

      expect(apiPatch).toHaveBeenCalledWith('/talento-humano/empleados/1/estado', {
        estado: 'INACTIVO',
        motivo: 'Retiro voluntario'
      });
    });
  });

  describe('Vacantes', () => {
    it('debe obtener lista de vacantes', async () => {
      const mockVacantes = { data: [{ id: '1', titulo: 'Médico' }] };
      apiGet.mockResolvedValue(mockVacantes);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.fetchVacantes({ estado: 'ABIERTA' });
      });

      expect(apiGet).toHaveBeenCalledWith('/talento-humano/vacantes?estado=ABIERTA');
      expect(result.current.vacantes).toEqual(mockVacantes.data);
    });

    it('debe crear vacante', async () => {
      const nuevaVacante = { titulo: 'Enfermera', descripcion: 'Se busca enfermera' };
      apiPost.mockResolvedValue({ id: '1', ...nuevaVacante });

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.createVacante(nuevaVacante);
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/vacantes', nuevaVacante);
    });

    it('debe cambiar estado de vacante', async () => {
      apiPatch.mockResolvedValue({ id: '1', estado: 'CERRADA' });

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.changeVacanteStatus('1', 'CERRADA');
      });

      expect(apiPatch).toHaveBeenCalledWith('/talento-humano/vacantes/1/estado', { estado: 'CERRADA' });
    });
  });

  describe('Candidatos', () => {
    it('debe obtener candidatos', async () => {
      const mockCandidatos = { data: [{ id: '1', nombre: 'Ana' }] };
      apiGet.mockResolvedValue(mockCandidatos);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.fetchCandidatos();
      });

      expect(result.current.candidatos).toEqual(mockCandidatos.data);
    });

    it('debe aplicar a vacante', async () => {
      apiPost.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.aplicarVacante('cand-1', 'vac-1');
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/candidatos/cand-1/aplicar', { vacanteId: 'vac-1' });
    });
  });

  describe('Nómina', () => {
    it('debe obtener periodos de nómina', async () => {
      const mockPeriodos = { data: [{ id: '1', anio: 2025, mes: 1 }] };
      apiGet.mockResolvedValue(mockPeriodos);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.fetchPeriodosNomina({ anio: 2025 });
      });

      expect(apiGet).toHaveBeenCalledWith('/talento-humano/nomina/periodos?anio=2025');
      expect(result.current.periodosNomina).toEqual(mockPeriodos.data);
    });

    it('debe procesar nómina', async () => {
      apiPost.mockResolvedValue({ id: '1', estado: 'EN_PROCESO' });

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.procesarNomina('per-1');
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/nomina/periodos/per-1/procesar');
    });

    it('debe obtener colilla de pago', async () => {
      const mockColilla = { salarioBase: 2000000, netoPagar: 1700000 };
      apiGet.mockResolvedValue(mockColilla);

      const { result } = renderHook(() => useTalentoHumano());

      let colilla;
      await act(async () => {
        colilla = await result.current.getColilla('emp-1', 'per-1');
      });

      expect(apiGet).toHaveBeenCalledWith('/talento-humano/nomina/colilla/emp-1/per-1');
      expect(colilla).toEqual(mockColilla);
    });
  });

  describe('Vacaciones y Permisos', () => {
    it('debe obtener vacaciones', async () => {
      const mockVacaciones = { data: [{ id: '1', estado: 'PENDIENTE' }] };
      apiGet.mockResolvedValue(mockVacaciones);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.fetchVacaciones({ estado: 'PENDIENTE' });
      });

      expect(result.current.vacaciones).toEqual(mockVacaciones.data);
    });

    it('debe solicitar vacaciones', async () => {
      const solicitud = { fechaInicio: '2025-02-01', fechaFin: '2025-02-15' };
      apiPost.mockResolvedValue({ id: '1', ...solicitud, estado: 'PENDIENTE' });

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.solicitarVacaciones(solicitud);
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/vacaciones', solicitud);
    });

    it('debe aprobar vacaciones', async () => {
      apiPatch.mockResolvedValue({ id: '1', estado: 'APROBADA' });

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.aprobarVacaciones('1');
      });

      expect(apiPatch).toHaveBeenCalledWith('/talento-humano/vacaciones/1/aprobar');
    });

    it('debe obtener saldo de vacaciones', async () => {
      const mockSaldo = { diasDisponibles: 15, diasDisfrutados: 5 };
      apiGet.mockResolvedValue(mockSaldo);

      const { result } = renderHook(() => useTalentoHumano());

      let saldo;
      await act(async () => {
        saldo = await result.current.getSaldoVacaciones('emp-1');
      });

      expect(apiGet).toHaveBeenCalledWith('/talento-humano/vacaciones/saldo/emp-1');
      expect(saldo).toEqual(mockSaldo);
    });
  });

  describe('Capacitaciones', () => {
    it('debe obtener capacitaciones', async () => {
      const mockCapacitaciones = { data: [{ id: '1', nombre: 'Primeros Auxilios' }] };
      apiGet.mockResolvedValue(mockCapacitaciones);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.fetchCapacitaciones({ estado: 'PROGRAMADA' });
      });

      expect(result.current.capacitaciones).toEqual(mockCapacitaciones.data);
    });

    it('debe inscribir a capacitación', async () => {
      apiPost.mockResolvedValue({ capacitacionId: 'cap-1', empleadoId: 'emp-1' });

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.inscribirCapacitacion('cap-1', 'emp-1');
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/capacitaciones/cap-1/inscribir', { empleadoId: 'emp-1' });
    });
  });

  describe('Bienestar', () => {
    it('debe obtener beneficios', async () => {
      const mockBeneficios = { data: [{ id: '1', nombre: 'Seguro de vida' }] };
      apiGet.mockResolvedValue(mockBeneficios);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.fetchBeneficios();
      });

      expect(apiGet).toHaveBeenCalledWith('/talento-humano/beneficios');
      expect(result.current.beneficios).toEqual(mockBeneficios.data);
    });

    it('debe obtener encuestas', async () => {
      const mockEncuestas = { data: [{ id: '1', titulo: 'Clima laboral' }] };
      apiGet.mockResolvedValue(mockEncuestas);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.fetchEncuestas();
      });

      expect(result.current.encuestas).toEqual(mockEncuestas.data);
    });

    it('debe responder encuesta', async () => {
      apiPost.mockResolvedValue({ id: 'resp-1' });

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.responderEncuesta('enc-1', 'emp-1', [5, 4, 3]);
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/encuestas/enc-1/responder', {
        empleadoId: 'emp-1',
        respuestas: [5, 4, 3]
      });
    });

    it('debe obtener eventos', async () => {
      const mockEventos = { data: [{ id: '1', titulo: 'Fiesta navideña' }] };
      apiGet.mockResolvedValue(mockEventos);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.fetchEventos();
      });

      expect(result.current.eventos).toEqual(mockEventos.data);
    });

    it('debe crear reconocimiento', async () => {
      const reconocimiento = { tipo: 'EMPLEADO_MES', titulo: 'Mejor desempeño' };
      apiPost.mockResolvedValue({ id: '1', ...reconocimiento });

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.createReconocimiento('emp-1', reconocimiento);
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/reconocimientos/emp-1', reconocimiento);
    });
  });

  describe('AI Functions', () => {
    it('debe hacer screening de CV', async () => {
      const mockResult = { score: 85, fortalezas: ['experiencia'] };
      apiPost.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useTalentoHumano());

      let aiResult;
      await act(async () => {
        aiResult = await result.current.aiScreenCV('CV content here...', 'vac-1');
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/ai/screening-cv', {
        cvText: 'CV content here...',
        vacanteId: 'vac-1'
      });
      expect(aiResult).toEqual(mockResult);
    });

    it('debe generar preguntas de entrevista', async () => {
      const mockPreguntas = { preguntas: ['Pregunta 1', 'Pregunta 2'] };
      apiPost.mockResolvedValue(mockPreguntas);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.aiGenerarPreguntas('cand-1', 'vac-1', 'TECNICA');
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/ai/generar-preguntas', {
        candidatoId: 'cand-1',
        vacanteId: 'vac-1',
        tipoEntrevista: 'TECNICA'
      });
    });

    it('debe chat con IA', async () => {
      const mockResponse = { response: 'Respuesta de IA' };
      apiPost.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.aiChat([{ role: 'user', content: 'Hola' }], { empleadoId: 'emp-1' });
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/ai/chat', {
        messages: [{ role: 'user', content: 'Hola' }],
        context: { empleadoId: 'emp-1' }
      });
    });
  });

  describe('Normatividad Colombia 2025', () => {
    it('debe obtener parámetros de normatividad', async () => {
      const mockParams = { smlv: 1300000, auxTransporte: 162000 };
      apiGet.mockResolvedValue(mockParams);

      const { result } = renderHook(() => useTalentoHumano());

      let params;
      await act(async () => {
        params = await result.current.getParametrosNormatividad();
      });

      expect(apiGet).toHaveBeenCalledWith('/talento-humano/normatividad/parametros');
      expect(params).toEqual(mockParams);
    });

    it('debe generar certificado laboral', async () => {
      const mockCertificado = { contenido: 'Certificado...' };
      apiGet.mockResolvedValue(mockCertificado);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.generarCertificadoLaboral('emp-1', 'A quien corresponda');
      });

      expect(apiGet).toHaveBeenCalledWith('/talento-humano/certificados/laboral/emp-1?dirigidoA=A%20quien%20corresponda');
    });

    it('debe generar liquidación', async () => {
      const mockLiquidacion = { total: 5000000 };
      apiPost.mockResolvedValue(mockLiquidacion);

      const { result } = renderHook(() => useTalentoHumano());

      await act(async () => {
        await result.current.generarLiquidacion('emp-1', '2025-01-31', 'RENUNCIA');
      });

      expect(apiPost).toHaveBeenCalledWith('/talento-humano/nomina/liquidacion/emp-1', {
        fechaRetiro: '2025-01-31',
        motivoRetiro: 'RENUNCIA'
      });
    });
  });
});
