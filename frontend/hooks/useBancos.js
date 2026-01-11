'use client';

import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para Módulo de Bancos
 * Cuentas bancarias, movimientos, conciliación, tributario
 */
export function useBancos() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentaActual, setCuentaActual] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [conciliaciones, setConciliaciones] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // =====================================================
  // CUENTAS BANCARIAS
  // =====================================================

  const fetchCuentas = useCallback(async (activa = null) => {
    setLoading(true);
    try {
      const params = activa !== null ? `?activa=${activa}` : '';
      const response = await apiGet(`/bancos/cuentas${params}`);
      setCuentas(response.data || []);
      return response.data;
    } catch (err) {
      toast.error('Error cargando cuentas bancarias');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCuenta = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await apiGet(`/bancos/cuentas/${id}`);
      setCuentaActual(response.data);
      return response.data;
    } catch (err) {
      toast.error('Error cargando cuenta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const crearCuenta = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await apiPost('/bancos/cuentas', data);
      toast.success('Cuenta bancaria creada');
      await fetchCuentas();
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error creando cuenta');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCuentas]);

  const actualizarCuenta = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await apiPut(`/bancos/cuentas/${id}`, data);
      toast.success('Cuenta actualizada');
      await fetchCuentas();
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error actualizando cuenta');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCuentas]);

  // =====================================================
  // MOVIMIENTOS BANCARIOS
  // =====================================================

  const fetchMovimientos = useCallback(async (cuentaId, filtros = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      if (filtros.conciliado !== undefined) params.append('conciliado', filtros.conciliado);
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.offset) params.append('offset', filtros.offset);

      const response = await apiGet(`/bancos/cuentas/${cuentaId}/movimientos?${params.toString()}`);
      setMovimientos(response.data || []);
      return response;
    } catch (err) {
      toast.error('Error cargando movimientos');
      return { data: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  }, []);

  const crearMovimiento = useCallback(async (cuentaId, data) => {
    setLoading(true);
    try {
      const response = await apiPost(`/bancos/cuentas/${cuentaId}/movimientos`, data);
      toast.success('Movimiento registrado');
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error registrando movimiento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importarExtracto = useCallback(async (cuentaId, movimientos) => {
    setLoading(true);
    try {
      const response = await apiPost(`/bancos/cuentas/${cuentaId}/importar-extracto`, { movimientos });
      toast.success(`Extracto importado: ${response.data.importados} movimientos`);
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error importando extracto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // CONCILIACIÓN BANCARIA
  // =====================================================

  const iniciarConciliacion = useCallback(async (cuentaId, periodo, saldoBanco) => {
    setLoading(true);
    try {
      const response = await apiPost('/bancos/conciliaciones', {
        cuentaId,
        periodo,
        saldoBanco
      });
      toast.success('Conciliación iniciada');
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error iniciando conciliación');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConciliacion = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await apiGet(`/bancos/conciliaciones/${id}`);
      return response.data;
    } catch (err) {
      toast.error('Error cargando conciliación');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarConciliado = useCallback(async (conciliacionId, movimientoId) => {
    try {
      const response = await apiPost(`/bancos/conciliaciones/${conciliacionId}/marcar-conciliado`, {
        movimientoId
      });
      return response.data;
    } catch (err) {
      toast.error('Error marcando movimiento');
      throw err;
    }
  }, []);

  const desmarcarConciliado = useCallback(async (conciliacionId, movimientoId) => {
    try {
      const response = await apiPost(`/bancos/conciliaciones/${conciliacionId}/desmarcar-conciliado`, {
        movimientoId
      });
      return response.data;
    } catch (err) {
      toast.error('Error desmarcando movimiento');
      throw err;
    }
  }, []);

  const actualizarPartidas = useCallback(async (conciliacionId, partidas) => {
    try {
      const response = await apiPut(`/bancos/conciliaciones/${conciliacionId}/partidas`, partidas);
      toast.success('Partidas actualizadas');
      return response.data;
    } catch (err) {
      toast.error('Error actualizando partidas');
      throw err;
    }
  }, []);

  const finalizarConciliacion = useCallback(async (conciliacionId) => {
    setLoading(true);
    try {
      const response = await apiPost(`/bancos/conciliaciones/${conciliacionId}/finalizar`);
      toast.success('Conciliación finalizada');
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error finalizando conciliación');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistorialConciliaciones = useCallback(async (cuentaId) => {
    try {
      const response = await apiGet(`/bancos/cuentas/${cuentaId}/historial-conciliaciones`);
      setConciliaciones(response.data || []);
      return response.data;
    } catch (err) {
      return [];
    }
  }, []);

  // =====================================================
  // REPORTES Y DASHBOARD
  // =====================================================

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet('/bancos/dashboard');
      setDashboard(response.data);
      return response.data;
    } catch (err) {
      toast.error('Error cargando dashboard');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResumen = useCallback(async () => {
    try {
      const response = await apiGet('/bancos/resumen');
      return response.data;
    } catch (err) {
      return null;
    }
  }, []);

  const fetchFlujoEfectivo = useCallback(async (fechaInicio, fechaFin) => {
    try {
      const params = new URLSearchParams({ fechaInicio, fechaFin });
      const response = await apiGet(`/bancos/flujo-efectivo?${params.toString()}`);
      return response.data;
    } catch (err) {
      toast.error('Error cargando flujo de efectivo');
      return null;
    }
  }, []);

  // =====================================================
  // TRIBUTARIO
  // =====================================================

  const fetchParametrosTributarios = useCallback(async () => {
    try {
      const response = await apiGet('/bancos/tributario/parametros');
      return response.data;
    } catch (err) {
      return null;
    }
  }, []);

  const calcularRetenciones = useCallback(async (monto, concepto, tipoTercero) => {
    try {
      const response = await apiPost('/bancos/tributario/calcular-retenciones', {
        monto,
        concepto,
        tipoTercero
      });
      return response.data;
    } catch (err) {
      toast.error('Error calculando retenciones');
      return null;
    }
  }, []);

  const fetchResumenIVA = useCallback(async (fechaInicio, fechaFin) => {
    try {
      const params = new URLSearchParams({ fechaInicio, fechaFin });
      const response = await apiGet(`/bancos/tributario/resumen-iva?${params.toString()}`);
      return response.data;
    } catch (err) {
      return null;
    }
  }, []);

  const fetchReporteRetenciones = useCallback(async (fechaInicio, fechaFin) => {
    try {
      const params = new URLSearchParams({ fechaInicio, fechaFin });
      const response = await apiGet(`/bancos/tributario/reporte-retenciones?${params.toString()}`);
      return response.data;
    } catch (err) {
      return null;
    }
  }, []);

  const fetchImpuestos = useCallback(async () => {
    try {
      const response = await apiGet('/bancos/tributario/impuestos');
      return response.data;
    } catch (err) {
      return [];
    }
  }, []);

  // Helper para formateo
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  return {
    // Estado
    cuentas,
    cuentaActual,
    movimientos,
    conciliaciones,
    dashboard,
    loading,
    error,

    // Cuentas
    fetchCuentas,
    fetchCuenta,
    crearCuenta,
    actualizarCuenta,

    // Movimientos
    fetchMovimientos,
    crearMovimiento,
    importarExtracto,

    // Conciliación
    iniciarConciliacion,
    fetchConciliacion,
    marcarConciliado,
    desmarcarConciliado,
    actualizarPartidas,
    finalizarConciliacion,
    fetchHistorialConciliaciones,

    // Reportes
    fetchDashboard,
    fetchResumen,
    fetchFlujoEfectivo,

    // Tributario
    fetchParametrosTributarios,
    calcularRetenciones,
    fetchResumenIVA,
    fetchReporteRetenciones,
    fetchImpuestos,

    // Helpers
    formatCurrency
  };
}

export default useBancos;
