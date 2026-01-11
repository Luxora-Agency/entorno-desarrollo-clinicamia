'use client';

import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/services/api';

const BASE_URL = '/talento-humano';

export default function useTalentoHumano() {
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [vacantes, setVacantes] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [entrevistas, setEntrevistas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [periodosNomina, setPeriodosNomina] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [periodosEvaluacion, setPeriodosEvaluacion] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [statsCapacitacion, setStatsCapacitacion] = useState(null);
  const [beneficios, setBeneficios] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [reconocimientos, setReconocimientos] = useState([]);

  // Helper for API calls
  const apiCall = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(err.message || 'Error en la operacion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ DASHBOARD ============
  const fetchDashboardStats = useCallback(async () => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/dashboard/stats`));
    setDashboardStats(data);
    return data;
  }, [apiCall]);

  // ============ CARGOS ============
  const fetchCargos = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/cargos${query ? `?${query}` : ''}`));
    setCargos(data.data || data);
    return data;
  }, [apiCall]);

  const createCargo = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/cargos`, data));
  }, [apiCall]);

  const updateCargo = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/cargos/${id}`, data));
  }, [apiCall]);

  // ============ VACANTES ============
  const fetchVacantes = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/vacantes${query ? `?${query}` : ''}`));
    setVacantes(data.data || data);
    return data;
  }, [apiCall]);

  const createVacante = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/vacantes`, data));
  }, [apiCall]);

  const updateVacante = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/vacantes/${id}`, data));
  }, [apiCall]);

  const changeVacanteStatus = useCallback(async (id, estado) => {
    return apiCall(() => apiPatch(`${BASE_URL}/vacantes/${id}/estado`, { estado }));
  }, [apiCall]);

  const deleteVacante = useCallback(async (id) => {
    return apiCall(() => apiDelete(`${BASE_URL}/vacantes/${id}`));
  }, [apiCall]);

  // ============ CANDIDATOS ============
  const fetchCandidatos = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/candidatos${query ? `?${query}` : ''}`));
    setCandidatos(data.data || data);
    return data;
  }, [apiCall]);

  const getCandidato = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/candidatos/${id}`));
  }, [apiCall]);

  const createCandidato = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/candidatos`, data));
  }, [apiCall]);

  const updateCandidato = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/candidatos/${id}`, data));
  }, [apiCall]);

  const aplicarVacante = useCallback(async (candidatoId, vacanteId) => {
    return apiCall(() => apiPost(`${BASE_URL}/candidatos/${candidatoId}/aplicar`, { vacanteId }));
  }, [apiCall]);

  const updateEstadoCandidato = useCallback(async (candidatoId, data) => {
    return apiCall(() => apiPatch(`${BASE_URL}/candidatos/${candidatoId}/estado`, data));
  }, [apiCall]);

  const fetchCandidatosPorVacante = useCallback(async (vacanteId) => {
    return apiCall(() => apiGet(`${BASE_URL}/candidatos/por-vacante/${vacanteId}`));
  }, [apiCall]);

  const deleteCandidato = useCallback(async (id) => {
    return apiCall(() => apiDelete(`${BASE_URL}/candidatos/${id}`));
  }, [apiCall]);

  // ============ ENTREVISTAS ============
  const fetchEntrevistas = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/entrevistas${query ? `?${query}` : ''}`));
    setEntrevistas(data.data || data);
    return data;
  }, [apiCall]);

  const createEntrevista = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/entrevistas`, data));
  }, [apiCall]);

  const completarEntrevista = useCallback(async (id, data) => {
    return apiCall(() => apiPatch(`${BASE_URL}/entrevistas/${id}/completar`, data));
  }, [apiCall]);

  // ============ EMPLEADOS ============
  const fetchEmpleados = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/empleados${query ? `?${query}` : ''}`));
    setEmpleados(data.data || data);
    return data;
  }, [apiCall]);

  const getEmpleado = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/empleados/${id}`));
  }, [apiCall]);

  const getExpediente = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/empleados/${id}/expediente`));
  }, [apiCall]);

  const createEmpleado = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/empleados`, data));
  }, [apiCall]);

  const updateEmpleado = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/empleados/${id}`, data));
  }, [apiCall]);

  const changeEstadoEmpleado = useCallback(async (id, estado, motivo) => {
    return apiCall(() => apiPatch(`${BASE_URL}/empleados/${id}/estado`, { estado, motivo }));
  }, [apiCall]);

  // ============ CONTRATOS ============
  const fetchContratos = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/contratos${query ? `?${query}` : ''}`));
    setContratos(data.data || data);
    return data;
  }, [apiCall]);

  const createContrato = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/contratos`, data));
  }, [apiCall]);

  const terminarContrato = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/contratos/${id}/terminar`, data));
  }, [apiCall]);

  const renovarContrato = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/contratos/${id}/renovar`, data));
  }, [apiCall]);

  // ============ MOVIMIENTOS ============
  const fetchMovimientos = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/movimientos${query ? `?${query}` : ''}`));
    setMovimientos(data.data || data);
    return data;
  }, [apiCall]);

  const createMovimiento = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/movimientos`, data));
  }, [apiCall]);

  // ============ NOMINA ============
  const fetchPeriodosNomina = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/nomina/periodos${query ? `?${query}` : ''}`));
    setPeriodosNomina(data.data || data);
    return data;
  }, [apiCall]);

  const createPeriodoNomina = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/nomina/periodos`, data));
  }, [apiCall]);

  const procesarNomina = useCallback(async (periodoId) => {
    return apiCall(() => apiPost(`${BASE_URL}/nomina/periodos/${periodoId}/procesar`));
  }, [apiCall]);

  const cerrarNomina = useCallback(async (periodoId) => {
    return apiCall(() => apiPost(`${BASE_URL}/nomina/periodos/${periodoId}/cerrar`));
  }, [apiCall]);

  const getColilla = useCallback(async (empleadoId, periodoId) => {
    return apiCall(() => apiGet(`${BASE_URL}/nomina/colilla/${empleadoId}/${periodoId}`));
  }, [apiCall]);

  // ============ ASISTENCIA ============
  const fetchAsistencia = useCallback(async (fecha) => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/asistencia?fecha=${fecha}`));
    setAsistencias(data.data || data);
    return data;
  }, [apiCall]);

  const registrarEntrada = useCallback(async (empleadoId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/asistencia/entrada`, { empleadoId, ...data }));
  }, [apiCall]);

  const registrarSalida = useCallback(async (empleadoId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/asistencia/salida`, { empleadoId, ...data }));
  }, [apiCall]);

  const fetchTurnos = useCallback(async () => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/asistencia/turnos`));
    setTurnos(data.data || data);
    return data;
  }, [apiCall]);

  const createTurno = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/asistencia/turnos`, data));
  }, [apiCall]);

  const asignarTurno = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/asistencia/turnos/asignar`, data));
  }, [apiCall]);

  // ============ VACACIONES Y PERMISOS ============
  const fetchVacaciones = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/vacaciones${query ? `?${query}` : ''}`));
    setVacaciones(data.data || data);
    return data;
  }, [apiCall]);

  const solicitarVacaciones = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/vacaciones`, data));
  }, [apiCall]);

  const aprobarVacaciones = useCallback(async (id) => {
    return apiCall(() => apiPatch(`${BASE_URL}/vacaciones/${id}/aprobar`));
  }, [apiCall]);

  const rechazarVacaciones = useCallback(async (id, motivo) => {
    return apiCall(() => apiPatch(`${BASE_URL}/vacaciones/${id}/rechazar`, { motivo }));
  }, [apiCall]);

  const getSaldoVacaciones = useCallback(async (empleadoId) => {
    return apiCall(() => apiGet(`${BASE_URL}/vacaciones/saldo/${empleadoId}`));
  }, [apiCall]);

  const fetchPermisos = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/permisos${query ? `?${query}` : ''}`));
    setPermisos(data.data || data);
    return data;
  }, [apiCall]);

  const solicitarPermiso = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/permisos`, data));
  }, [apiCall]);

  const aprobarPermiso = useCallback(async (id) => {
    return apiCall(() => apiPatch(`${BASE_URL}/permisos/${id}/aprobar`));
  }, [apiCall]);

  const rechazarPermiso = useCallback(async (id, motivo) => {
    return apiCall(() => apiPatch(`${BASE_URL}/permisos/${id}/rechazar`, { motivo }));
  }, [apiCall]);

  // ============ EVALUACIONES ============
  const fetchPeriodosEvaluacion = useCallback(async () => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/evaluaciones/periodos`));
    setPeriodosEvaluacion(data.data || data);
    return data;
  }, [apiCall]);

  const createPeriodoEvaluacion = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/evaluaciones/periodos`, data));
  }, [apiCall]);

  const iniciarPeriodoEvaluacion = useCallback(async (id) => {
    return apiCall(() => apiPost(`${BASE_URL}/evaluaciones/periodos/${id}/iniciar`));
  }, [apiCall]);

  const responderEvaluacion = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/evaluaciones/${id}/responder`, data));
  }, [apiCall]);

  const getResultadosEmpleado = useCallback(async (empleadoId) => {
    return apiCall(() => apiGet(`${BASE_URL}/evaluaciones/resultados/${empleadoId}`));
  }, [apiCall]);

  // ============ OBJETIVOS ============
  const fetchObjetivos = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/objetivos${query ? `?${query}` : ''}`));
    setObjetivos(data.data || data);
    return data;
  }, [apiCall]);

  const createObjetivo = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/objetivos`, data));
  }, [apiCall]);

  const updateProgresoObjetivo = useCallback(async (id, progreso, evidencias) => {
    return apiCall(() => apiPatch(`${BASE_URL}/objetivos/${id}/progreso`, { progreso, evidencias }));
  }, [apiCall]);

  // ============ FEEDBACK ============
  const fetchFeedbacks = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/feedback${query ? `?${query}` : ''}`));
    setFeedbacks(data.data || data);
    return data;
  }, [apiCall]);

  const createFeedback = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/feedback`, data));
  }, [apiCall]);

  // ============ CAPACITACIONES ============
  const fetchCapacitaciones = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/capacitaciones${query ? `?${query}` : ''}`));
    setCapacitaciones(data.data || data);
    return data;
  }, [apiCall]);

  const fetchStatsCapacitacion = useCallback(async () => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/capacitaciones/stats`));
    setStatsCapacitacion(data);
    return data;
  }, [apiCall]);

  const createCapacitacion = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/capacitaciones`, data));
  }, [apiCall]);

  const inscribirCapacitacion = useCallback(async (capacitacionId, empleadoId) => {
    return apiCall(() => apiPost(`${BASE_URL}/capacitaciones/${capacitacionId}/inscribir`, { empleadoId }));
  }, [apiCall]);

  // ============ BENEFICIOS ============
  const fetchBeneficios = useCallback(async () => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/beneficios`));
    setBeneficios(data.data || data);
    return data;
  }, [apiCall]);

  const createBeneficio = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/beneficios`, data));
  }, [apiCall]);

  const asignarBeneficio = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/beneficios/asignar`, data));
  }, [apiCall]);

  // ============ ENCUESTAS ============
  const fetchEncuestas = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/encuestas${query ? `?${query}` : ''}`));
    setEncuestas(data.data || data);
    return data;
  }, [apiCall]);

  const createEncuesta = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/encuestas`, data));
  }, [apiCall]);

  const responderEncuesta = useCallback(async (encuestaId, empleadoId, respuestas) => {
    return apiCall(() => apiPost(`${BASE_URL}/encuestas/${encuestaId}/responder`, { empleadoId, respuestas }));
  }, [apiCall]);

  const getResultadosEncuesta = useCallback(async (encuestaId) => {
    return apiCall(() => apiGet(`${BASE_URL}/encuestas/${encuestaId}/resultados`));
  }, [apiCall]);

  // ============ EVENTOS ============
  const fetchEventos = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/eventos${query ? `?${query}` : ''}`));
    setEventos(data.data || data);
    return data;
  }, [apiCall]);

  const createEvento = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/eventos`, data));
  }, [apiCall]);

  const confirmarAsistenciaEvento = useCallback(async (eventoId, empleadoId) => {
    return apiCall(() => apiPost(`${BASE_URL}/eventos/${eventoId}/confirmar`, { empleadoId }));
  }, [apiCall]);

  // ============ RECONOCIMIENTOS ============
  const fetchReconocimientos = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/reconocimientos${query ? `?${query}` : ''}`));
    setReconocimientos(data.data || data);
    return data;
  }, [apiCall]);

  const createReconocimiento = useCallback(async (empleadoId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/reconocimientos/${empleadoId}`, data));
  }, [apiCall]);

  // ============ AI ============
  const aiScreenCV = useCallback(async (cvText, vacanteId) => {
    return apiCall(() => apiPost(`${BASE_URL}/ai/screening-cv`, { cvText, vacanteId }));
  }, [apiCall]);

  const aiGenerarPreguntas = useCallback(async (candidatoId, vacanteId, tipoEntrevista) => {
    return apiCall(() => apiPost(`${BASE_URL}/ai/generar-preguntas`, { candidatoId, vacanteId, tipoEntrevista }));
  }, [apiCall]);

  const aiAnalizarDesempeno = useCallback(async (empleadoId) => {
    return apiCall(() => apiPost(`${BASE_URL}/ai/analizar-desempeno`, { empleadoId }));
  }, [apiCall]);

  const aiPredecirRotacion = useCallback(async (departamentoId, limit) => {
    return apiCall(() => apiPost(`${BASE_URL}/ai/predecir-rotacion`, { departamentoId, limit }));
  }, [apiCall]);

  const aiSugerirCapacitacion = useCallback(async (empleadoId) => {
    return apiCall(() => apiPost(`${BASE_URL}/ai/sugerir-capacitacion`, { empleadoId }));
  }, [apiCall]);

  const aiChat = useCallback(async (messages, context) => {
    return apiCall(() => apiPost(`${BASE_URL}/ai/chat`, { messages, context }));
  }, [apiCall]);

  // ============ NORMATIVIDAD COLOMBIANA 2025 ============
  const getParametrosNormatividad = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/normatividad/parametros`));
  }, [apiCall]);

  const getFechasImportantes = useCallback(async (anio) => {
    const query = anio ? `?anio=${anio}` : '';
    return apiCall(() => apiGet(`${BASE_URL}/normatividad/fechas-importantes${query}`));
  }, [apiCall]);

  const validarContrato = useCallback(async (contrato) => {
    return apiCall(() => apiPost(`${BASE_URL}/normatividad/validar-contrato`, contrato));
  }, [apiCall]);

  const calcularIncapacidad = useCallback(async (salarioBase, diasIncapacidad, tipoIncapacidad) => {
    return apiCall(() => apiPost(`${BASE_URL}/normatividad/calcular-incapacidad`, {
      salarioBase,
      diasIncapacidad,
      tipoIncapacidad
    }));
  }, [apiCall]);

  const generarLiquidacion = useCallback(async (empleadoId, fechaRetiro, motivoRetiro) => {
    return apiCall(() => apiPost(`${BASE_URL}/nomina/liquidacion/${empleadoId}`, {
      fechaRetiro,
      motivoRetiro
    }));
  }, [apiCall]);

  const generarPILA = useCallback(async (periodoId) => {
    return apiCall(() => apiGet(`${BASE_URL}/nomina/periodos/${periodoId}/pila`));
  }, [apiCall]);

  const generarCertificadoLaboral = useCallback(async (empleadoId, dirigidoA) => {
    const query = dirigidoA ? `?dirigidoA=${encodeURIComponent(dirigidoA)}` : '';
    return apiCall(() => apiGet(`${BASE_URL}/certificados/laboral/${empleadoId}${query}`));
  }, [apiCall]);

  const generarCertificadoIngresos = useCallback(async (empleadoId, anio) => {
    return apiCall(() => apiGet(`${BASE_URL}/certificados/ingresos-retenciones/${empleadoId}/${anio}`));
  }, [apiCall]);

  const generarColillaDetallada = useCallback(async (empleadoId, periodoId) => {
    return apiCall(() => apiGet(`${BASE_URL}/nomina/colilla-detallada/${empleadoId}/${periodoId}`));
  }, [apiCall]);

  const calcularNominaEmpleado = useCallback(async (empleadoId, novedades = {}) => {
    return apiCall(() => apiPost(`${BASE_URL}/nomina/calcular/${empleadoId}`, novedades));
  }, [apiCall]);

  return {
    // States
    loading,
    error,
    dashboardStats,
    cargos,
    vacantes,
    candidatos,
    entrevistas,
    empleados,
    contratos,
    movimientos,
    periodosNomina,
    asistencias,
    turnos,
    vacaciones,
    permisos,
    periodosEvaluacion,
    objetivos,
    feedbacks,
    capacitaciones,
    statsCapacitacion,
    beneficios,
    encuestas,
    eventos,
    reconocimientos,

    // Dashboard
    fetchDashboardStats,

    // Cargos
    fetchCargos,
    createCargo,
    updateCargo,

    // Vacantes
    fetchVacantes,
    createVacante,
    updateVacante,
    changeVacanteStatus,
    deleteVacante,

    // Candidatos
    fetchCandidatos,
    getCandidato,
    createCandidato,
    updateCandidato,
    aplicarVacante,
    updateEstadoCandidato,
    fetchCandidatosPorVacante,
    deleteCandidato,

    // Entrevistas
    fetchEntrevistas,
    createEntrevista,
    completarEntrevista,

    // Empleados
    fetchEmpleados,
    getEmpleado,
    getExpediente,
    createEmpleado,
    updateEmpleado,
    changeEstadoEmpleado,

    // Contratos
    fetchContratos,
    createContrato,
    terminarContrato,
    renovarContrato,

    // Movimientos
    fetchMovimientos,
    createMovimiento,

    // Nomina
    fetchPeriodosNomina,
    createPeriodoNomina,
    procesarNomina,
    cerrarNomina,
    getColilla,

    // Asistencia
    fetchAsistencia,
    registrarEntrada,
    registrarSalida,
    fetchTurnos,
    createTurno,
    asignarTurno,

    // Vacaciones y Permisos
    fetchVacaciones,
    solicitarVacaciones,
    aprobarVacaciones,
    rechazarVacaciones,
    getSaldoVacaciones,
    fetchPermisos,
    solicitarPermiso,
    aprobarPermiso,
    rechazarPermiso,

    // Evaluaciones
    fetchPeriodosEvaluacion,
    createPeriodoEvaluacion,
    iniciarPeriodoEvaluacion,
    responderEvaluacion,
    getResultadosEmpleado,

    // Objetivos
    fetchObjetivos,
    createObjetivo,
    updateProgresoObjetivo,

    // Feedback
    fetchFeedbacks,
    createFeedback,

    // Capacitaciones
    fetchCapacitaciones,
    fetchStatsCapacitacion,
    createCapacitacion,
    inscribirCapacitacion,

    // Beneficios
    fetchBeneficios,
    createBeneficio,
    asignarBeneficio,

    // Encuestas
    fetchEncuestas,
    createEncuesta,
    responderEncuesta,
    getResultadosEncuesta,

    // Eventos
    fetchEventos,
    createEvento,
    confirmarAsistenciaEvento,

    // Reconocimientos
    fetchReconocimientos,
    createReconocimiento,

    // AI
    aiScreenCV,
    aiGenerarPreguntas,
    aiAnalizarDesempeno,
    aiPredecirRotacion,
    aiSugerirCapacitacion,
    aiChat,

    // Normatividad Colombiana 2025
    getParametrosNormatividad,
    getFechasImportantes,
    validarContrato,
    calcularIncapacidad,
    generarLiquidacion,
    generarPILA,
    generarCertificadoLaboral,
    generarCertificadoIngresos,
    generarColillaDetallada,
    calcularNominaEmpleado,
  };
}
