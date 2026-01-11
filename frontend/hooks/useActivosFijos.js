'use client';

import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para gestión de Activos Fijos
 * Incluye CRUD, depreciación y mantenimientos
 */
export function useActivosFijos() {
  const [activos, setActivos] = useState([]);
  const [activoActual, setActivoActual] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener lista de activos con filtros
  const fetchActivos = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.offset) params.append('offset', filtros.offset);

      const response = await apiGet(`/activos-fijos?${params.toString()}`);
      setActivos(response.data || []);
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error cargando activos fijos');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener activo por ID
  const fetchActivo = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await apiGet(`/activos-fijos/${id}`);
      setActivoActual(response.data);
      return response.data;
    } catch (err) {
      toast.error('Error cargando activo');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear nuevo activo
  const crearActivo = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await apiPost('/activos-fijos', data);
      toast.success('Activo fijo creado exitosamente');
      await fetchActivos();
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error creando activo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchActivos]);

  // Actualizar activo
  const actualizarActivo = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await apiPut(`/activos-fijos/${id}`, data);
      toast.success('Activo actualizado');
      await fetchActivos();
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error actualizando activo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchActivos]);

  // Dar de baja un activo
  const darDeBaja = useCallback(async (id, motivo) => {
    setLoading(true);
    try {
      const response = await apiPost(`/activos-fijos/${id}/baja`, { motivo });
      toast.success('Activo dado de baja');
      await fetchActivos();
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error dando de baja');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchActivos]);

  // Obtener dashboard
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet('/activos-fijos/dashboard');
      setDashboard(response.data);
      return response.data;
    } catch (err) {
      toast.error('Error cargando dashboard');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener tipos de activos
  const fetchTipos = useCallback(async () => {
    try {
      const response = await apiGet('/activos-fijos/tipos');
      return response.data || [];
    } catch (err) {
      return [];
    }
  }, []);

  // Ejecutar depreciación mensual
  const ejecutarDepreciacion = useCallback(async (periodo) => {
    setLoading(true);
    try {
      const response = await apiPost('/activos-fijos/depreciacion/ejecutar', { periodo });
      toast.success(`Depreciación ejecutada: $${response.data.totalDepreciacion.toLocaleString('es-CO')}`);
      await fetchDashboard();
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error ejecutando depreciación');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDashboard]);

  // Obtener depreciaciones de un período
  const fetchDepreciaciones = useCallback(async (periodo) => {
    try {
      const response = await apiGet(`/activos-fijos/depreciacion/${periodo}`);
      return response.data;
    } catch (err) {
      toast.error('Error cargando depreciaciones');
      return null;
    }
  }, []);

  // Obtener resumen contable para Siigo
  const fetchResumenContable = useCallback(async (periodo) => {
    try {
      const response = await apiGet(`/activos-fijos/depreciacion/${periodo}/resumen-contable`);
      return response.data;
    } catch (err) {
      return null;
    }
  }, []);

  // Registrar mantenimiento
  const registrarMantenimiento = useCallback(async (activoId, data) => {
    setLoading(true);
    try {
      const response = await apiPost(`/activos-fijos/${activoId}/mantenimientos`, data);
      toast.success('Mantenimiento registrado');
      return response.data;
    } catch (err) {
      toast.error(err.message || 'Error registrando mantenimiento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener mantenimientos de un activo
  const fetchMantenimientos = useCallback(async (activoId) => {
    try {
      const response = await apiGet(`/activos-fijos/${activoId}/mantenimientos`);
      return response.data || [];
    } catch (err) {
      return [];
    }
  }, []);

  // Obtener activos pendientes de mantenimiento
  const fetchMantenimientosPendientes = useCallback(async () => {
    try {
      const response = await apiGet('/activos-fijos/mantenimientos-pendientes');
      return response.data || [];
    } catch (err) {
      return [];
    }
  }, []);

  // Generar reporte
  const generarReporte = useCallback(async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);

      const response = await apiGet(`/activos-fijos/reporte?${params.toString()}`);
      return response.data;
    } catch (err) {
      toast.error('Error generando reporte');
      return null;
    }
  }, []);

  return {
    // Estado
    activos,
    activoActual,
    dashboard,
    loading,
    error,

    // Acciones CRUD
    fetchActivos,
    fetchActivo,
    crearActivo,
    actualizarActivo,
    darDeBaja,

    // Dashboard y catálogos
    fetchDashboard,
    fetchTipos,

    // Depreciación
    ejecutarDepreciacion,
    fetchDepreciaciones,
    fetchResumenContable,

    // Mantenimientos
    registrarMantenimiento,
    fetchMantenimientos,
    fetchMantenimientosPendientes,

    // Reportes
    generarReporte
  };
}

export default useActivosFijos;
