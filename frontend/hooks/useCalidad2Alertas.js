import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPut, apiPost } from '@/services/api';

export function useCalidad2Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [proximosVencer, setProximosVencer] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filtros
  const [filters, setFilters] = useState({
    tipo: '',
    estado: 'PENDIENTE',
    entidadTipo: '',
  });

  const loadAlertas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      };
      // Remove empty values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null) {
          delete queryParams[key];
        }
      });

      const response = await apiGet('/calidad2/alertas', queryParams);
      setAlertas(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading alertas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las alertas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/alertas/dashboard');
      setDashboard(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProximosVencer = useCallback(async (dias = 30) => {
    try {
      const response = await apiGet('/calidad2/alertas/proximos-vencer', { dias });
      setProximosVencer(response.data || []);
      return response.data;
    } catch (error) {
      console.error('Error loading proximos vencer:', error);
      return [];
    }
  }, []);

  const atenderAlerta = useCallback(async (id) => {
    try {
      const response = await apiPut(`/calidad2/alertas/${id}/atender`);
      toast({
        title: 'Alerta atendida',
        description: 'La alerta ha sido marcada como atendida.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadAlertas();
      loadDashboard();
      return response.data;
    } catch (error) {
      console.error('Error attending alerta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo atender la alerta.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadAlertas, loadDashboard, toast]);

  const descartarAlerta = useCallback(async (id) => {
    try {
      const response = await apiPut(`/calidad2/alertas/${id}/descartar`);
      toast({
        title: 'Alerta descartada',
        description: 'La alerta ha sido descartada.',
        className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      });
      loadAlertas();
      loadDashboard();
      return response.data;
    } catch (error) {
      console.error('Error discarding alerta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo descartar la alerta.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadAlertas, loadDashboard, toast]);

  const generarAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/alertas/generar');
      toast({
        title: 'Alertas generadas',
        description: `Se generaron ${response.data?.total || 0} alertas nuevas.`,
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadAlertas();
      loadDashboard();
      return response.data;
    } catch (error) {
      console.error('Error generating alertas:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron generar las alertas.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAlertas, loadDashboard, toast]);

  return {
    alertas,
    dashboard,
    proximosVencer,
    pagination,
    loading,
    filters,
    setFilters,
    setPagination,
    loadAlertas,
    loadDashboard,
    loadProximosVencer,
    atenderAlerta,
    descartarAlerta,
    generarAlertas,
  };
}
