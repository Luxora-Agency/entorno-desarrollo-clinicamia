import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCalidad2TemperaturaHumedad() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [tendencias, setTendencias] = useState([]);
  const { toast } = useToast();

  /**
   * Load temperature/humidity records
   */
  const loadRegistros = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/temperatura-humedad', params);
      setRegistros(Array.isArray(response.data) ? response.data : []);
      return response;
    } catch (error) {
      console.error('Error loading registros:', error);
      setRegistros([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los registros de temperatura/humedad.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get a single record by ID
   */
  const getRegistro = useCallback(async (id) => {
    try {
      const response = await apiGet(`/calidad2/medicamentos/temperatura-humedad/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting registro:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el registro.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Get records by area
   */
  const getByArea = useCallback(async (area, fechaInicio = null, fechaFin = null) => {
    try {
      setLoading(true);
      const params = {};
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;

      const response = await apiGet(`/calidad2/medicamentos/temperatura-humedad/area/${area}`, params);
      return response.data;
    } catch (error) {
      console.error('Error getting registros by area:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los registros del área.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get alerts (out of range records)
   */
  const getAlertas = useCallback(async (area = null) => {
    try {
      const params = {};
      if (area) params.area = area;

      const response = await apiGet('/calidad2/medicamentos/temperatura-humedad/alertas', params);
      return response.data;
    } catch (error) {
      console.error('Error getting alertas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las alertas.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  /**
   * Get trends for charts
   */
  const getTendencias = useCallback(async (area, periodo = '30') => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/medicamentos/temperatura-humedad/tendencias/${area}`, {
        periodo,
      });
      setTendencias(response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting tendencias:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las tendencias.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get statistics
   */
  const getEstadisticas = useCallback(async (filters = {}) => {
    try {
      const response = await apiGet('/calidad2/medicamentos/temperatura-humedad/estadisticas', filters);
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

  /**
   * Create a new record
   */
  const createRegistro = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/medicamentos/temperatura-humedad', data);

      if (response.data) {
        setRegistros(prev => [response.data, ...prev]);
      }

      toast({
        title: 'Registro creado',
        description: response.data.requiereAlerta
          ? 'El registro se ha creado. ⚠️ Valores fuera de rango detectados.'
          : 'El registro se ha creado correctamente.',
        className: response.data.requiereAlerta
          ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
          : 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error creating registro:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el registro.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Update a record
   */
  const updateRegistro = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/medicamentos/temperatura-humedad/${id}`, data);

      if (response.data) {
        setRegistros(prev =>
          prev.map(registro => registro.id === id ? response.data : registro)
        );
      }

      toast({
        title: 'Registro actualizado',
        description: response.data.requiereAlerta
          ? 'El registro se ha actualizado. ⚠️ Valores fuera de rango detectados.'
          : 'El registro se ha actualizado correctamente.',
        className: response.data.requiereAlerta
          ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
          : 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error updating registro:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el registro.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Delete a record
   */
  const deleteRegistro = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/medicamentos/temperatura-humedad/${id}`);

      setRegistros(prev => prev.filter(registro => registro.id !== id));

      toast({
        title: 'Registro eliminado',
        description: 'El registro se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return true;
    } catch (error) {
      console.error('Error deleting registro:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el registro.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  /**
   * Export data
   */
  const exportar = useCallback(async (area, fechaInicio, fechaFin) => {
    try {
      const params = { area };
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;

      const response = await apiGet('/calidad2/medicamentos/temperatura-humedad/exportar', params);
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron exportar los datos.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  return {
    registros,
    loading,
    estadisticas,
    tendencias,
    loadRegistros,
    getRegistro,
    getByArea,
    getAlertas,
    getTendencias,
    getEstadisticas,
    createRegistro,
    updateRegistro,
    deleteRegistro,
    exportar,
  };
}
