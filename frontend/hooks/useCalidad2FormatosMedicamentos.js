import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCalidad2FormatosMedicamentos() {
  const [formatos, setFormatos] = useState([]);
  const [instancias, setInstancias] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // ==========================================
  // FORMATOS (PLANTILLAS)
  // ==========================================

  /**
   * Load all formatos with optional filters
   */
  const loadFormatos = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/formatos', params);
      setFormatos(Array.isArray(response.data) ? response.data : []);
      return response;
    } catch (error) {
      console.error('Error loading formatos:', error);
      setFormatos([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los formatos.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get formato by ID
   */
  const getFormato = useCallback(async (id) => {
    try {
      const response = await apiGet(`/calidad2/medicamentos/formatos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting formato:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el formato.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Get vigentes formatos (for dropdowns)
   */
  const getFormatosVigentes = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/medicamentos/formatos/vigentes');
      return response.data;
    } catch (error) {
      console.error('Error getting formatos vigentes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los formatos vigentes.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  /**
   * Create formato
   */
  const createFormato = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/medicamentos/formatos', data);

      if (response.data) {
        setFormatos(prev => [response.data, ...prev]);
      }

      toast({
        title: 'Formato creado',
        description: `El formato "${response.data.nombre}" ha sido creado correctamente.`,
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error creating formato:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el formato.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Update formato
   */
  const updateFormato = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/medicamentos/formatos/${id}`, data);

      if (response.data) {
        setFormatos(prev =>
          prev.map(formato => formato.id === id ? response.data : formato)
        );
      }

      toast({
        title: 'Formato actualizado',
        description: 'El formato ha sido actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error updating formato:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el formato.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Delete formato
   */
  const deleteFormato = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/medicamentos/formatos/${id}`);

      setFormatos(prev => prev.filter(formato => formato.id !== id));

      toast({
        title: 'Formato eliminado',
        description: 'El formato ha sido eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return true;
    } catch (error) {
      console.error('Error deleting formato:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el formato.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // ==========================================
  // INSTANCIAS (LLENADOS)
  // ==========================================

  /**
   * Load all instancias with optional filters
   */
  const loadInstancias = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/formatos/instancias', params);
      setInstancias(Array.isArray(response.data) ? response.data : []);
      return response;
    } catch (error) {
      console.error('Error loading instancias:', error);
      setInstancias([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las instancias.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get instancias by formato ID
   */
  const getInstanciasByFormato = useCallback(async (formatoId, params = {}) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/medicamentos/formatos/${formatoId}/instancias`, params);
      return response.data;
    } catch (error) {
      console.error('Error getting instancias by formato:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las instancias del formato.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get instancia by ID
   */
  const getInstancia = useCallback(async (id) => {
    try {
      const response = await apiGet(`/calidad2/medicamentos/formatos/instancias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting instancia:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la instancia.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Create instancia
   */
  const createInstancia = useCallback(async (formatoId, data) => {
    try {
      const response = await apiPost(`/calidad2/medicamentos/formatos/${formatoId}/instancias`, data);

      if (response.data) {
        setInstancias(prev => [response.data, ...prev]);
      }

      toast({
        title: 'Instancia creada',
        description: `La instancia para el período "${response.data.periodo}" ha sido creada correctamente.`,
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error creating instancia:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la instancia.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Update instancia
   */
  const updateInstancia = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/medicamentos/formatos/instancias/${id}`, data);

      if (response.data) {
        setInstancias(prev =>
          prev.map(instancia => instancia.id === id ? response.data : instancia)
        );
      }

      toast({
        title: 'Instancia actualizada',
        description: 'La instancia ha sido actualizada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error updating instancia:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la instancia.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Revisar instancia
   */
  const revisarInstancia = useCallback(async (id, observaciones = null) => {
    try {
      const response = await apiPost(`/calidad2/medicamentos/formatos/instancias/${id}/revisar`, {
        observaciones,
      });

      if (response.data) {
        setInstancias(prev =>
          prev.map(instancia => instancia.id === id ? response.data : instancia)
        );
      }

      toast({
        title: 'Instancia revisada',
        description: 'La instancia ha sido marcada como revisada.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error revisando instancia:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo revisar la instancia.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Delete instancia
   */
  const deleteInstancia = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/medicamentos/formatos/instancias/${id}`);

      setInstancias(prev => prev.filter(instancia => instancia.id !== id));

      toast({
        title: 'Instancia eliminada',
        description: 'La instancia ha sido eliminada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return true;
    } catch (error) {
      console.error('Error deleting instancia:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la instancia.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  /**
   * Get estadísticas
   */
  const getEstadisticas = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/medicamentos/formatos/estadisticas');
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
    formatos,
    instancias,
    estadisticas,
    loading,

    // Formatos methods
    loadFormatos,
    getFormato,
    getFormatosVigentes,
    createFormato,
    updateFormato,
    deleteFormato,

    // Instancias methods
    loadInstancias,
    getInstanciasByFormato,
    getInstancia,
    createInstancia,
    updateInstancia,
    revisarInstancia,
    deleteInstancia,

    // Statistics
    getEstadisticas,
  };
}
