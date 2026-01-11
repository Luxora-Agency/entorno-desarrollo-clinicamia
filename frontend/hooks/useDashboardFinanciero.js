'use client';

import { useState, useCallback } from 'react';
import { apiGet } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para Dashboard Financiero
 * KPIs ejecutivos, tendencias, cartera, liquidez
 */
export function useDashboardFinanciero() {
  const [dashboard, setDashboard] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [cartera, setCartera] = useState(null);
  const [cuentasPorPagar, setCuentasPorPagar] = useState(null);
  const [tendencias, setTendencias] = useState([]);
  const [liquidez, setLiquidez] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener dashboard ejecutivo completo
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet('/dashboard-financiero');
      setDashboard(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      toast.error('Error cargando dashboard financiero');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener KPIs del período
  const fetchKPIs = useCallback(async (fechaInicio, fechaFin) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0]
      });
      const response = await apiGet(`/dashboard-financiero/kpis?${params.toString()}`);
      setKpis(response.data);
      return response.data;
    } catch (err) {
      toast.error('Error cargando KPIs');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener ingresos del período
  const fetchIngresos = useCallback(async (fechaInicio, fechaFin) => {
    try {
      const params = new URLSearchParams({
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0]
      });
      const response = await apiGet(`/dashboard-financiero/ingresos?${params.toString()}`);
      return response.data;
    } catch (err) {
      return null;
    }
  }, []);

  // Obtener cartera por cobrar con aging
  const fetchCartera = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet('/dashboard-financiero/cartera');
      setCartera(response.data);
      return response.data;
    } catch (err) {
      toast.error('Error cargando cartera');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener cuentas por pagar con aging
  const fetchCuentasPorPagar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet('/dashboard-financiero/cuentas-por-pagar');
      setCuentasPorPagar(response.data);
      return response.data;
    } catch (err) {
      toast.error('Error cargando cuentas por pagar');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener ingresos por departamento
  const fetchIngresosPorDepartamento = useCallback(async (fechaInicio, fechaFin) => {
    try {
      const params = new URLSearchParams({
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0]
      });
      const response = await apiGet(`/dashboard-financiero/ingresos-departamento?${params.toString()}`);
      return response.data;
    } catch (err) {
      return null;
    }
  }, []);

  // Obtener tendencias históricas
  const fetchTendencias = useCallback(async (meses = 12) => {
    setLoading(true);
    try {
      const response = await apiGet(`/dashboard-financiero/tendencias?meses=${meses}`);
      setTendencias(response.data || []);
      return response.data;
    } catch (err) {
      toast.error('Error cargando tendencias');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener indicadores de liquidez
  const fetchLiquidez = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet('/dashboard-financiero/liquidez');
      setLiquidez(response.data);
      return response.data;
    } catch (err) {
      toast.error('Error cargando indicadores de liquidez');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener valor del inventario
  const fetchInventario = useCallback(async () => {
    try {
      const response = await apiGet('/dashboard-financiero/inventario');
      return response.data;
    } catch (err) {
      return null;
    }
  }, []);

  // Obtener valor de activos fijos
  const fetchActivosFijos = useCallback(async () => {
    try {
      const response = await apiGet('/dashboard-financiero/activos-fijos');
      return response.data;
    } catch (err) {
      return null;
    }
  }, []);

  // Cargar todos los datos del dashboard
  const cargarTodo = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardData, tendenciasData, liquidezData] = await Promise.all([
        fetchDashboard(),
        fetchTendencias(12),
        fetchLiquidez()
      ]);
      return { dashboard: dashboardData, tendencias: tendenciasData, liquidez: liquidezData };
    } catch (err) {
      toast.error('Error cargando datos financieros');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDashboard, fetchTendencias, fetchLiquidez]);

  // Helpers para formateo
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  return {
    // Estado
    dashboard,
    kpis,
    cartera,
    cuentasPorPagar,
    tendencias,
    liquidez,
    loading,
    error,

    // Acciones
    fetchDashboard,
    fetchKPIs,
    fetchIngresos,
    fetchCartera,
    fetchCuentasPorPagar,
    fetchIngresosPorDepartamento,
    fetchTendencias,
    fetchLiquidez,
    fetchInventario,
    fetchActivosFijos,
    cargarTodo,

    // Helpers
    formatCurrency,
    formatPercent
  };
}

export default useDashboardFinanciero;
