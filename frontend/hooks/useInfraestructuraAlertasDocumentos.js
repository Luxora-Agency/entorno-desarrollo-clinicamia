import { useState, useCallback } from 'react';
import { apiGet, apiPost } from '@/services/api';
import { toast } from 'sonner';

export function useInfraestructuraAlertasDocumentos() {
  const [alertas, setAlertas] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/infraestructura/alertas/dashboard');
      setDashboard(response.data);
      return response.data;
    } catch (error) {
      console.error('Error al cargar dashboard de alertas:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlertas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters).toString();
      const response = await apiGet(`/calidad2/infraestructura/alertas${params ? `?${params}` : ''}`);

      setAlertas(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });

      return response.data;
    } catch (error) {
      toast.error('Error al cargar alertas');
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAlertasPorDocumento = useCallback(async (documentoId) => {
    try {
      const response = await apiGet(`/calidad2/infraestructura/alertas/documento/${documentoId}`);
      return response.data || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  const resolverAlerta = useCallback(async (alertaId) => {
    try {
      setLoading(true);
      await apiPost(`/calidad2/infraestructura/alertas/${alertaId}/resolver`);
      toast.success('Alerta marcada como resuelta');
      return true;
    } catch (error) {
      toast.error('Error al resolver alerta');
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reenviarEmail = useCallback(async (alertaId) => {
    try {
      setLoading(true);
      await apiPost(`/calidad2/infraestructura/alertas/${alertaId}/reenviar`);
      toast.success('Email reenviado exitosamente');
      return true;
    } catch (error) {
      toast.error('Error al reenviar email');
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const generarAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/infraestructura/alertas/generar');
      toast.success(`Alertas generadas: ${response.data.alertasCreadas || 0}`);
      return response.data;
    } catch (error) {
      toast.error('Error al generar alertas');
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    alertas,
    dashboard,
    loading,
    pagination,
    loadDashboard,
    loadAlertas,
    getAlertasPorDocumento,
    resolverAlerta,
    reenviarEmail,
    generarAlertas,
  };
}
