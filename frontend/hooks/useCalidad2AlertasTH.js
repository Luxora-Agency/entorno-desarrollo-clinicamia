import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPut, apiPost } from '@/services/api';

export function useCalidad2AlertasTH() {
  const [alertas, setAlertas] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filtros
  const [filters, setFilters] = useState({
    tipo: '',
    prioridad: '',
    atendida: '',
    personalId: '',
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

      const response = await apiGet('/calidad2/alertas-th', queryParams);
      setAlertas(Array.isArray(response.data) ? response.data : []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading alertas TH:', error);
      setAlertas([]);
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
      const response = await apiGet('/calidad2/alertas-th/dashboard');
      setDashboard(response.data?.dashboard || response.data);
      return response.data?.dashboard || response.data;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      return null;
    }
  }, []);

  const atenderAlerta = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/alertas-th/${id}/atender`);
      toast({
        title: 'Alerta atendida',
        description: 'La alerta ha sido marcada como atendida.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadAlertas();
      loadDashboard();
      return response.data?.alerta || response.data;
    } catch (error) {
      console.error('Error atendiendo alerta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo atender la alerta.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAlertas, loadDashboard, toast]);

  const generarAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/alertas-th/generar');
      toast({
        title: 'Alertas generadas',
        description: `Se generaron ${response.data?.result?.alertasCreadas || 0} alertas.`,
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadAlertas();
      loadDashboard();
      return response.data?.result;
    } catch (error) {
      console.error('Error generando alertas:', error);
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
    pagination,
    loading,
    filters,
    setFilters,
    setPagination,
    loadAlertas,
    loadDashboard,
    atenderAlerta,
    generarAlertas,
  };
}
