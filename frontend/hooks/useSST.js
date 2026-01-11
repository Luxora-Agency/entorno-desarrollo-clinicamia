'use client';

import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/services/api';

const BASE_URL = '/sst';

/**
 * Hook para el modulo de SST (Seguridad y Salud en el Trabajo)
 * Decreto 1072/2015, Resolucion 0312/2019
 */
export default function useSST() {
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [dashboard, setDashboard] = useState(null);
  const [accidentes, setAccidentes] = useState([]);
  const [investigaciones, setInvestigaciones] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [enfermedades, setEnfermedades] = useState([]);
  const [matrizIPVR, setMatrizIPVR] = useState(null);
  const [peligros, setPeligros] = useState([]);
  const [examenesMedicos, setExamenesMedicos] = useState([]);
  const [profesiogramas, setProfesiogramas] = useState([]);
  const [copasst, setCopasst] = useState(null);
  const [reunionesCopasst, setReunionesCopasst] = useState([]);
  const [comiteConvivencia, setComiteConvivencia] = useState(null);
  const [quejas, setQuejas] = useState([]);
  const [planAnual, setPlanAnual] = useState(null);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [inspecciones, setInspecciones] = useState([]);
  const [indicadores, setIndicadores] = useState(null);
  const [epp, setEpp] = useState([]);
  const [entregasEpp, setEntregasEpp] = useState([]);
  const [planEmergencias, setPlanEmergencias] = useState(null);
  const [brigada, setBrigada] = useState(null);
  const [simulacros, setSimulacros] = useState([]);
  const [documentosSST, setDocumentosSST] = useState([]);
  const [auditorias, setAuditorias] = useState([]);
  const [accionesCorrectivas, setAccionesCorrectivas] = useState([]);
  const [evaluacionEstandares, setEvaluacionEstandares] = useState(null);
  const [pagination, setPagination] = useState(null);

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
  const fetchDashboard = useCallback(async (anio) => {
    const query = anio ? `?anio=${anio}` : '';
    const data = await apiCall(() => apiGet(`${BASE_URL}/dashboard${query}`));
    setDashboard(data);
    return data;
  }, [apiCall]);

  // ============ ACCIDENTES DE TRABAJO ============
  const fetchAccidentes = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/accidentes${query ? `?${query}` : ''}`));
    setAccidentes(data.data || data);
    setPagination(data.pagination);
    return data;
  }, [apiCall]);

  const getAccidente = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/accidentes/${id}`));
  }, [apiCall]);

  const createAccidente = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/accidentes`, data));
  }, [apiCall]);

  const updateAccidente = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/accidentes/${id}`, data));
  }, [apiCall]);

  const deleteAccidente = useCallback(async (id) => {
    return apiCall(() => apiDelete(`${BASE_URL}/accidentes/${id}`));
  }, [apiCall]);

  const getAccidentesPendientesInvestigacion = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/accidentes/pendientes-investigacion`));
  }, [apiCall]);

  const getEstadisticasAccidentes = useCallback(async (anio, mes) => {
    const params = new URLSearchParams({ anio });
    if (mes) params.append('mes', mes);
    return apiCall(() => apiGet(`${BASE_URL}/accidentes/estadisticas?${params}`));
  }, [apiCall]);

  const generarFURAT = useCallback(async (accidenteId) => {
    return apiCall(() => apiPost(`${BASE_URL}/accidentes/${accidenteId}/furat`));
  }, [apiCall]);

  const descargarFURAT = useCallback(async (accidenteId) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${BASE_URL}/accidentes/${accidenteId}/furat/pdf`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
    });
    return response.blob();
  }, []);

  // ============ INVESTIGACIONES ============
  const fetchInvestigaciones = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/investigaciones${query ? `?${query}` : ''}`));
    setInvestigaciones(data.data || data);
    return data;
  }, [apiCall]);

  const getInvestigacion = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/investigaciones/${id}`));
  }, [apiCall]);

  const createInvestigacion = useCallback(async (accidenteId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/investigaciones`, { accidenteId, ...data }));
  }, [apiCall]);

  const updateInvestigacion = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/investigaciones/${id}`, data));
  }, [apiCall]);

  const cerrarInvestigacion = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/investigaciones/${id}/cerrar`, data));
  }, [apiCall]);

  // ============ INCIDENTES ============
  const fetchIncidentes = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/incidentes${query ? `?${query}` : ''}`));
    setIncidentes(data.data || data);
    return data;
  }, [apiCall]);

  const getIncidente = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/incidentes/${id}`));
  }, [apiCall]);

  const createIncidente = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/incidentes`, data));
  }, [apiCall]);

  const updateIncidente = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/incidentes/${id}`, data));
  }, [apiCall]);

  const cerrarIncidente = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/incidentes/${id}/cerrar`, data));
  }, [apiCall]);

  // ============ ENFERMEDADES LABORALES ============
  const fetchEnfermedades = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/enfermedades${query ? `?${query}` : ''}`));
    setEnfermedades(data.data || data);
    return data;
  }, [apiCall]);

  const getEnfermedad = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/enfermedades/${id}`));
  }, [apiCall]);

  const createEnfermedad = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/enfermedades`, data));
  }, [apiCall]);

  const updateEnfermedad = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/enfermedades/${id}`, data));
  }, [apiCall]);

  const calificarEnfermedad = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/enfermedades/${id}/calificar`, data));
  }, [apiCall]);

  const generarFUREL = useCallback(async (enfermedadId) => {
    return apiCall(() => apiPost(`${BASE_URL}/enfermedades/${enfermedadId}/furel`));
  }, [apiCall]);

  const descargarFUREL = useCallback(async (enfermedadId) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${BASE_URL}/enfermedades/${enfermedadId}/furel/pdf`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
    });
    return response.blob();
  }, []);

  // ============ MATRIZ IPVR (GTC 45) ============
  const getMatrizVigente = useCallback(async () => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/matriz-ipvr/vigente`));
    setMatrizIPVR(data);
    return data;
  }, [apiCall]);

  const fetchMatrices = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(() => apiGet(`${BASE_URL}/matriz-ipvr${query ? `?${query}` : ''}`));
  }, [apiCall]);

  const getMatriz = useCallback(async (id) => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/matriz-ipvr/${id}`));
    setMatrizIPVR(data);
    return data;
  }, [apiCall]);

  const createMatriz = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/matriz-ipvr`, data));
  }, [apiCall]);

  const activarMatriz = useCallback(async (id) => {
    return apiCall(() => apiPost(`${BASE_URL}/matriz-ipvr/${id}/activar`));
  }, [apiCall]);

  const agregarPeligro = useCallback(async (matrizId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/matriz-ipvr/${matrizId}/peligros`, data));
  }, [apiCall]);

  const actualizarPeligro = useCallback(async (matrizId, peligroId, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/matriz-ipvr/${matrizId}/peligros/${peligroId}`, data));
  }, [apiCall]);

  const agregarValoracion = useCallback(async (peligroId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/matriz-ipvr/peligros/${peligroId}/valoracion`, data));
  }, [apiCall]);

  const agregarMedidaIntervencion = useCallback(async (valoracionId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/matriz-ipvr/valoraciones/${valoracionId}/medidas`, data));
  }, [apiCall]);

  // ============ EXAMENES MEDICOS OCUPACIONALES ============
  const fetchExamenesMedicos = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/examenes-medicos${query ? `?${query}` : ''}`));
    setExamenesMedicos(data.data || data);
    return data;
  }, [apiCall]);

  const getExamenMedico = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/examenes-medicos/${id}`));
  }, [apiCall]);

  const createExamenMedico = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/examenes-medicos`, data));
  }, [apiCall]);

  const registrarResultado = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/examenes-medicos/${id}/resultado`, data));
  }, [apiCall]);

  const getExamenesVencidos = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/examenes-medicos/vencidos`));
  }, [apiCall]);

  const getExamenesProximosVencer = useCallback(async (dias = 30) => {
    return apiCall(() => apiGet(`${BASE_URL}/examenes-medicos/proximos-vencer?dias=${dias}`));
  }, [apiCall]);

  // ============ PROFESIOGRAMAS ============
  const fetchProfesiogramas = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/profesiogramas${query ? `?${query}` : ''}`));
    setProfesiogramas(data.data || data);
    return data;
  }, [apiCall]);

  const getProfesiograma = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/profesiogramas/${id}`));
  }, [apiCall]);

  const getProfesiogramaPorCargo = useCallback(async (cargoId) => {
    return apiCall(() => apiGet(`${BASE_URL}/profesiogramas/cargo/${cargoId}`));
  }, [apiCall]);

  const createProfesiograma = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/profesiogramas`, data));
  }, [apiCall]);

  const updateProfesiograma = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/profesiogramas/${id}`, data));
  }, [apiCall]);

  // ============ COPASST ============
  const getCopasstVigente = useCallback(async () => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/copasst/vigente`));
    setCopasst(data);
    return data;
  }, [apiCall]);

  const fetchCopasst = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/copasst`));
  }, [apiCall]);

  const createCopasst = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/copasst`, data));
  }, [apiCall]);

  const agregarIntegranteCopasst = useCallback(async (copasstId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/copasst/${copasstId}/integrantes`, data));
  }, [apiCall]);

  const fetchReunionesCopasst = useCallback(async (copasstId) => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/copasst/${copasstId}/reuniones`));
    setReunionesCopasst(data.data || data);
    return data;
  }, [apiCall]);

  const createReunionCopasst = useCallback(async (copasstId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/copasst/${copasstId}/reuniones`, data));
  }, [apiCall]);

  const cerrarReunionCopasst = useCallback(async (reunionId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/copasst/reuniones/${reunionId}/cerrar`, data));
  }, [apiCall]);

  const descargarActaCopasst = useCallback(async (reunionId) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${BASE_URL}/copasst/reuniones/${reunionId}/acta`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
    });
    return response.blob();
  }, []);

  // ============ COMITE DE CONVIVENCIA LABORAL ============
  const getCCLVigente = useCallback(async () => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/comite-convivencia/vigente`));
    setComiteConvivencia(data);
    return data;
  }, [apiCall]);

  const createCCL = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/comite-convivencia`, data));
  }, [apiCall]);

  const agregarIntegranteCCL = useCallback(async (cclId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/comite-convivencia/${cclId}/integrantes`, data));
  }, [apiCall]);

  const fetchQuejas = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/comite-convivencia/quejas${query ? `?${query}` : ''}`));
    setQuejas(data.data || data);
    return data;
  }, [apiCall]);

  const createQueja = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/comite-convivencia/quejas`, data));
  }, [apiCall]);

  const tramitarQueja = useCallback(async (quejaId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/comite-convivencia/quejas/${quejaId}/tramitar`, data));
  }, [apiCall]);

  // ============ PLAN ANUAL DE TRABAJO SST ============
  const getPlanAnual = useCallback(async (anio) => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/plan-anual/${anio || new Date().getFullYear()}`));
    setPlanAnual(data);
    return data;
  }, [apiCall]);

  const createPlanAnual = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/plan-anual`, data));
  }, [apiCall]);

  const agregarActividad = useCallback(async (planId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/plan-anual/${planId}/actividades`, data));
  }, [apiCall]);

  const actualizarActividad = useCallback(async (planId, actividadId, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/plan-anual/${planId}/actividades/${actividadId}`, data));
  }, [apiCall]);

  const registrarEvidencia = useCallback(async (actividadId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/plan-anual/actividades/${actividadId}/evidencias`, data));
  }, [apiCall]);

  const getCumplimientoPlan = useCallback(async (planId) => {
    return apiCall(() => apiGet(`${BASE_URL}/plan-anual/${planId}/cumplimiento`));
  }, [apiCall]);

  // ============ CAPACITACIONES SST ============
  const fetchCapacitaciones = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/capacitaciones${query ? `?${query}` : ''}`));
    setCapacitaciones(data.data || data);
    return data;
  }, [apiCall]);

  const getCapacitacion = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/capacitaciones/${id}`));
  }, [apiCall]);

  const createCapacitacion = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/capacitaciones`, data));
  }, [apiCall]);

  const updateCapacitacion = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/capacitaciones/${id}`, data));
  }, [apiCall]);

  const registrarAsistencia = useCallback(async (capacitacionId, asistentes) => {
    return apiCall(() => apiPost(`${BASE_URL}/capacitaciones/${capacitacionId}/asistencia`, { asistentes }));
  }, [apiCall]);

  const evaluarAsistente = useCallback(async (capacitacionId, empleadoId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/capacitaciones/${capacitacionId}/evaluar/${empleadoId}`, data));
  }, [apiCall]);

  const getIndicadoresCapacitacion = useCallback(async (anio) => {
    return apiCall(() => apiGet(`${BASE_URL}/capacitaciones/indicadores?anio=${anio || new Date().getFullYear()}`));
  }, [apiCall]);

  // ============ INSPECCIONES ============
  const fetchInspecciones = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/inspecciones${query ? `?${query}` : ''}`));
    setInspecciones(data.data || data);
    return data;
  }, [apiCall]);

  const getInspeccion = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/inspecciones/${id}`));
  }, [apiCall]);

  const createInspeccion = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/inspecciones`, data));
  }, [apiCall]);

  const registrarHallazgo = useCallback(async (inspeccionId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/inspecciones/${inspeccionId}/hallazgos`, data));
  }, [apiCall]);

  const cerrarHallazgo = useCallback(async (hallazgoId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/inspecciones/hallazgos/${hallazgoId}/cerrar`, data));
  }, [apiCall]);

  const getListasVerificacion = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/inspecciones/listas-verificacion`));
  }, [apiCall]);

  // ============ INDICADORES SST ============
  const getIndicadores = useCallback(async (anio) => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/indicadores?anio=${anio || new Date().getFullYear()}`));
    setIndicadores(data);
    return data;
  }, [apiCall]);

  const calcularIndicadores = useCallback(async (anio, mes) => {
    return apiCall(() => apiPost(`${BASE_URL}/indicadores/calcular`, { anio, mes }));
  }, [apiCall]);

  const getIndicadoresAccidentalidad = useCallback(async (anio, mes) => {
    const params = new URLSearchParams({ anio });
    if (mes) params.append('mes', mes);
    return apiCall(() => apiGet(`${BASE_URL}/indicadores/accidentalidad?${params}`));
  }, [apiCall]);

  const getIndicadoresEnfermedad = useCallback(async (anio) => {
    return apiCall(() => apiGet(`${BASE_URL}/indicadores/enfermedad?anio=${anio}`));
  }, [apiCall]);

  const getIndicadoresProceso = useCallback(async (anio) => {
    return apiCall(() => apiGet(`${BASE_URL}/indicadores/proceso?anio=${anio}`));
  }, [apiCall]);

  // ============ EPP ============
  const fetchElementosEPP = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/epp${query ? `?${query}` : ''}`));
    setEpp(data.data || data);
    return data;
  }, [apiCall]);

  const createElementoEPP = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/epp`, data));
  }, [apiCall]);

  const updateElementoEPP = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/epp/${id}`, data));
  }, [apiCall]);

  const fetchEntregasEPP = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/epp/entregas${query ? `?${query}` : ''}`));
    setEntregasEpp(data.data || data);
    return data;
  }, [apiCall]);

  const registrarEntregaEPP = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/epp/entregas`, data));
  }, [apiCall]);

  const getEPPEmpleado = useCallback(async (empleadoId) => {
    return apiCall(() => apiGet(`${BASE_URL}/epp/empleado/${empleadoId}`));
  }, [apiCall]);

  const getEPPVencidos = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/epp/vencidos`));
  }, [apiCall]);

  // ============ PLAN DE EMERGENCIAS ============
  const getPlanEmergencias = useCallback(async () => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/plan-emergencias`));
    setPlanEmergencias(data);
    return data;
  }, [apiCall]);

  const createPlanEmergencias = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/plan-emergencias`, data));
  }, [apiCall]);

  const updatePlanEmergencias = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/plan-emergencias/${id}`, data));
  }, [apiCall]);

  const agregarAmenaza = useCallback(async (planId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/plan-emergencias/${planId}/amenazas`, data));
  }, [apiCall]);

  const agregarRecurso = useCallback(async (planId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/plan-emergencias/${planId}/recursos`, data));
  }, [apiCall]);

  // ============ BRIGADA DE EMERGENCIA ============
  const getBrigada = useCallback(async () => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/brigada`));
    setBrigada(data);
    return data;
  }, [apiCall]);

  const createBrigada = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/brigada`, data));
  }, [apiCall]);

  const agregarBrigadista = useCallback(async (brigadaId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/brigada/${brigadaId}/miembros`, data));
  }, [apiCall]);

  const actualizarBrigadista = useCallback(async (brigadaId, miembroId, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/brigada/${brigadaId}/miembros/${miembroId}`, data));
  }, [apiCall]);

  // ============ SIMULACROS ============
  const fetchSimulacros = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/simulacros${query ? `?${query}` : ''}`));
    setSimulacros(data.data || data);
    return data;
  }, [apiCall]);

  const getSimulacro = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/simulacros/${id}`));
  }, [apiCall]);

  const createSimulacro = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/simulacros`, data));
  }, [apiCall]);

  const ejecutarSimulacro = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/simulacros/${id}/ejecutar`, data));
  }, [apiCall]);

  const agregarMejoraSimulacro = useCallback(async (simulacroId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/simulacros/${simulacroId}/mejoras`, data));
  }, [apiCall]);

  // ============ DOCUMENTOS SST ============
  const fetchDocumentosSST = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/documentos${query ? `?${query}` : ''}`));
    setDocumentosSST(data.data || data);
    return data;
  }, [apiCall]);

  const getDocumentoSST = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/documentos/${id}`));
  }, [apiCall]);

  const createDocumentoSST = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/documentos`, data));
  }, [apiCall]);

  const updateDocumentoSST = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/documentos/${id}`, data));
  }, [apiCall]);

  const aprobarDocumentoSST = useCallback(async (id) => {
    return apiCall(() => apiPost(`${BASE_URL}/documentos/${id}/aprobar`));
  }, [apiCall]);

  const getDocumentosVencidos = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/documentos/vencidos`));
  }, [apiCall]);

  // ============ AUDITORIAS SST ============
  const fetchAuditorias = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/auditorias${query ? `?${query}` : ''}`));
    setAuditorias(data.data || data);
    return data;
  }, [apiCall]);

  const getAuditoria = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/auditorias/${id}`));
  }, [apiCall]);

  const createAuditoria = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/auditorias`, data));
  }, [apiCall]);

  const ejecutarAuditoria = useCallback(async (id) => {
    return apiCall(() => apiPost(`${BASE_URL}/auditorias/${id}/ejecutar`));
  }, [apiCall]);

  const registrarHallazgoAuditoria = useCallback(async (auditoriaId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/auditorias/${auditoriaId}/hallazgos`, data));
  }, [apiCall]);

  const cerrarAuditoria = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/auditorias/${id}/cerrar`, data));
  }, [apiCall]);

  // ============ ACCIONES CORRECTIVAS Y PREVENTIVAS ============
  const fetchAccionesCorrectivas = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/acciones-correctivas${query ? `?${query}` : ''}`));
    setAccionesCorrectivas(data.data || data);
    return data;
  }, [apiCall]);

  const getAccionCorrectiva = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/acciones-correctivas/${id}`));
  }, [apiCall]);

  const createAccionCorrectiva = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/acciones-correctivas`, data));
  }, [apiCall]);

  const updateAccionCorrectiva = useCallback(async (id, data) => {
    return apiCall(() => apiPut(`${BASE_URL}/acciones-correctivas/${id}`, data));
  }, [apiCall]);

  const implementarAccion = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/acciones-correctivas/${id}/implementar`, data));
  }, [apiCall]);

  const agregarSeguimiento = useCallback(async (accionId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/acciones-correctivas/${accionId}/seguimiento`, data));
  }, [apiCall]);

  const verificarEficacia = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/acciones-correctivas/${id}/verificar`, data));
  }, [apiCall]);

  const cerrarAccion = useCallback(async (id, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/acciones-correctivas/${id}/cerrar`, data));
  }, [apiCall]);

  const getAccionesVencidas = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/acciones-correctivas/vencidas`));
  }, [apiCall]);

  // ============ EVALUACION ESTANDARES MINIMOS (Res. 0312/2019) ============
  const getEvaluacionActual = useCallback(async (anio) => {
    const data = await apiCall(() => apiGet(`${BASE_URL}/evaluacion-estandares/${anio || new Date().getFullYear()}`));
    setEvaluacionEstandares(data);
    return data;
  }, [apiCall]);

  const createEvaluacion = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/evaluacion-estandares`, data));
  }, [apiCall]);

  const evaluarItem = useCallback(async (evaluacionId, itemId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/evaluacion-estandares/${evaluacionId}/items/${itemId}/evaluar`, data));
  }, [apiCall]);

  const finalizarEvaluacion = useCallback(async (evaluacionId) => {
    return apiCall(() => apiPost(`${BASE_URL}/evaluacion-estandares/${evaluacionId}/finalizar`));
  }, [apiCall]);

  const crearPlanMejora = useCallback(async (evaluacionId, itemId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/evaluacion-estandares/${evaluacionId}/items/${itemId}/plan-mejora`, data));
  }, [apiCall]);

  const descargarEvaluacionPDF = useCallback(async (evaluacionId) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${BASE_URL}/evaluacion-estandares/${evaluacionId}/pdf`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
    });
    return response.blob();
  }, []);

  // ============ CATALOGOS SST ============
  const getFactoresRiesgo = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/catalogos/factores-riesgo`));
  }, [apiCall]);

  const getTiposExamen = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/catalogos/tipos-examen`));
  }, [apiCall]);

  const getTiposCapacitacion = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/catalogos/tipos-capacitacion`));
  }, [apiCall]);

  const getCatalogoIndicadores = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/catalogos/indicadores`));
  }, [apiCall]);

  // ============ INTEGRACION SST-RRHH ============

  /**
   * Obtener perfil SST completo de un empleado
   */
  const getPerfilSSTEmpleado = useCallback(async (empleadoId) => {
    return apiCall(() => apiGet(`${BASE_URL}/empleado/${empleadoId}/perfil-sst`));
  }, [apiCall]);

  /**
   * Obtener riesgos asociados a un cargo
   */
  const getRiesgosPorCargo = useCallback(async (cargoId) => {
    return apiCall(() => apiGet(`${BASE_URL}/cargo/${cargoId}/riesgos`));
  }, [apiCall]);

  /**
   * Inicializar SST para nuevo empleado (onboarding)
   */
  const inicializarSSTEmpleado = useCallback(async (empleadoId) => {
    return apiCall(() => apiPost(`${BASE_URL}/empleado/${empleadoId}/onboarding-sst`));
  }, [apiCall]);

  /**
   * Sincronizar capacitacion SST con RRHH
   */
  const sincronizarCapacitacionConRRHH = useCallback(async (capacitacionId) => {
    return apiCall(() => apiPost(`${BASE_URL}/capacitaciones/${capacitacionId}/sincronizar-rrhh`));
  }, [apiCall]);

  /**
   * Obtener alertas de documentos proximos a vencer
   */
  const getAlertasDocumentosVencer = useCallback(async (dias = 30) => {
    return apiCall(() => apiGet(`${BASE_URL}/alertas/documentos-vencer?dias=${dias}`));
  }, [apiCall]);

  /**
   * Obtener alertas de examenes medicos proximos a vencer
   */
  const getAlertasExamenesVencer = useCallback(async (dias = 30) => {
    return apiCall(() => apiGet(`${BASE_URL}/alertas/examenes-vencer?dias=${dias}`));
  }, [apiCall]);

  /**
   * Programar todas las alertas SST (documentos, examenes, etc.)
   * Ejecutar como cron diario
   */
  const programarAlertas = useCallback(async () => {
    return apiCall(() => apiPost(`${BASE_URL}/alertas/programar`));
  }, [apiCall]);

  /**
   * Programar alertas de documentos SST
   */
  const programarAlertasDocumentos = useCallback(async () => {
    return apiCall(() => apiPost(`${BASE_URL}/alertas/programar-documentos`));
  }, [apiCall]);

  /**
   * Programar alertas de examenes medicos SST
   */
  const programarAlertasExamenes = useCallback(async () => {
    return apiCall(() => apiPost(`${BASE_URL}/alertas/programar-examenes`));
  }, [apiCall]);

  return {
    // States
    loading,
    error,
    dashboard,
    accidentes,
    investigaciones,
    incidentes,
    enfermedades,
    matrizIPVR,
    peligros,
    examenesMedicos,
    profesiogramas,
    copasst,
    reunionesCopasst,
    comiteConvivencia,
    quejas,
    planAnual,
    capacitaciones,
    inspecciones,
    indicadores,
    epp,
    entregasEpp,
    planEmergencias,
    brigada,
    simulacros,
    documentosSST,
    auditorias,
    accionesCorrectivas,
    evaluacionEstandares,
    pagination,

    // Dashboard
    fetchDashboard,

    // Accidentes
    fetchAccidentes,
    getAccidente,
    createAccidente,
    updateAccidente,
    deleteAccidente,
    getAccidentesPendientesInvestigacion,
    getEstadisticasAccidentes,
    generarFURAT,
    descargarFURAT,

    // Investigaciones
    fetchInvestigaciones,
    getInvestigacion,
    createInvestigacion,
    updateInvestigacion,
    cerrarInvestigacion,

    // Incidentes
    fetchIncidentes,
    getIncidente,
    createIncidente,
    updateIncidente,
    cerrarIncidente,

    // Enfermedades
    fetchEnfermedades,
    getEnfermedad,
    createEnfermedad,
    updateEnfermedad,
    calificarEnfermedad,
    generarFUREL,
    descargarFUREL,

    // Matriz IPVR
    getMatrizVigente,
    fetchMatrices,
    getMatriz,
    createMatriz,
    activarMatriz,
    agregarPeligro,
    actualizarPeligro,
    agregarValoracion,
    agregarMedidaIntervencion,

    // Examenes Medicos
    fetchExamenesMedicos,
    getExamenMedico,
    createExamenMedico,
    registrarResultado,
    getExamenesVencidos,
    getExamenesProximosVencer,

    // Profesiogramas
    fetchProfesiogramas,
    getProfesiograma,
    getProfesiogramaPorCargo,
    createProfesiograma,
    updateProfesiograma,

    // COPASST
    getCopasstVigente,
    fetchCopasst,
    createCopasst,
    agregarIntegranteCopasst,
    fetchReunionesCopasst,
    createReunionCopasst,
    cerrarReunionCopasst,
    descargarActaCopasst,

    // Comite Convivencia
    getCCLVigente,
    createCCL,
    agregarIntegranteCCL,
    fetchQuejas,
    createQueja,
    tramitarQueja,

    // Plan Anual
    getPlanAnual,
    createPlanAnual,
    agregarActividad,
    actualizarActividad,
    registrarEvidencia,
    getCumplimientoPlan,

    // Capacitaciones
    fetchCapacitaciones,
    getCapacitacion,
    createCapacitacion,
    updateCapacitacion,
    registrarAsistencia,
    evaluarAsistente,
    getIndicadoresCapacitacion,

    // Inspecciones
    fetchInspecciones,
    getInspeccion,
    createInspeccion,
    registrarHallazgo,
    cerrarHallazgo,
    getListasVerificacion,

    // Indicadores
    getIndicadores,
    calcularIndicadores,
    getIndicadoresAccidentalidad,
    getIndicadoresEnfermedad,
    getIndicadoresProceso,

    // EPP
    fetchElementosEPP,
    createElementoEPP,
    updateElementoEPP,
    fetchEntregasEPP,
    registrarEntregaEPP,
    getEPPEmpleado,
    getEPPVencidos,

    // Plan Emergencias
    getPlanEmergencias,
    createPlanEmergencias,
    updatePlanEmergencias,
    agregarAmenaza,
    agregarRecurso,

    // Brigada
    getBrigada,
    createBrigada,
    agregarBrigadista,
    actualizarBrigadista,

    // Simulacros
    fetchSimulacros,
    getSimulacro,
    createSimulacro,
    ejecutarSimulacro,
    agregarMejoraSimulacro,

    // Documentos
    fetchDocumentosSST,
    getDocumentoSST,
    createDocumentoSST,
    updateDocumentoSST,
    aprobarDocumentoSST,
    getDocumentosVencidos,

    // Auditorias
    fetchAuditorias,
    getAuditoria,
    createAuditoria,
    ejecutarAuditoria,
    registrarHallazgoAuditoria,
    cerrarAuditoria,

    // Acciones Correctivas
    fetchAccionesCorrectivas,
    getAccionCorrectiva,
    createAccionCorrectiva,
    updateAccionCorrectiva,
    implementarAccion,
    agregarSeguimiento,
    verificarEficacia,
    cerrarAccion,
    getAccionesVencidas,

    // Evaluacion Estandares
    getEvaluacionActual,
    createEvaluacion,
    evaluarItem,
    finalizarEvaluacion,
    crearPlanMejora,
    descargarEvaluacionPDF,

    // Catalogos
    getFactoresRiesgo,
    getTiposExamen,
    getTiposCapacitacion,
    getCatalogoIndicadores,

    // Integracion SST-RRHH
    getPerfilSSTEmpleado,
    getRiesgosPorCargo,
    inicializarSSTEmpleado,
    sincronizarCapacitacionConRRHH,
    getAlertasDocumentosVencer,
    getAlertasExamenesVencer,

    // Programacion de alertas
    programarAlertas,
    programarAlertasDocumentos,
    programarAlertasExamenes,
  };
}
