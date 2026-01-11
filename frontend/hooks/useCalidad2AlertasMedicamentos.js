import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/services/api';

export function useCalidad2AlertasMedicamentos() {
  const [alertas, setAlertas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Load all alerts with optional filters
   */
  const loadAlertas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/alertas', params);
      setAlertas(Array.isArray(response.data) ? response.data : []);
      return response;
    } catch (error) {
      console.error('Error loading alertas:', error);
      setAlertas([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las alertas.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get active (unattended) alerts
   */
  const getActivas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/alertas/activas', filters);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting alertas activas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las alertas activas.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Mark alert as attended
   */
  const marcarAtendida = useCallback(async (id, observaciones = null) => {
    try {
      const response = await apiPost(`/calidad2/medicamentos/alertas/${id}/atender`, {
        observaciones,
      });

      if (response.data) {
        // Update local state
        setAlertas(prev =>
          prev.map(alerta =>
            alerta.id === id
              ? { ...alerta, atendida: true, atendidoPor: response.data.atendidoPor, fechaAtencion: response.data.fechaAtencion }
              : alerta
          )
        );
      }

      toast({
        title: 'Alerta atendida',
        description: 'La alerta ha sido marcada como atendida correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error marcando alerta como atendida:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo marcar la alerta como atendida.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Generate all alerts manually
   */
  const generarAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/medicamentos/alertas/generar', {});

      toast({
        title: 'Alertas generadas',
        description: response.data?.mensaje || 'Las alertas se han generado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
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
  }, [toast]);

  /**
   * Get alert statistics
   */
  const getEstadisticas = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/medicamentos/alertas/estadisticas');
      setEstadisticas(response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting estadísticas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  return {
    // State
    alertas,
    estadisticas,
    loading,

    // Methods
    loadAlertas,
    getActivas,
    marcarAtendida,
    generarAlertas,
    getEstadisticas,
  };
}
