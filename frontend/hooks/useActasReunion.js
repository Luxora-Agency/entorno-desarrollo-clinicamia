import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete, getAuthToken } from '@/services/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export function useActasReunion() {
  const [actas, setActas] = useState([]);
  const [currentActa, setCurrentActa] = useState(null);
  const [siguienteNumero, setSiguienteNumero] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    tipo: '',
    fechaDesde: '',
    fechaHasta: '',
    search: '',
  });

  const loadActas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      };
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null) {
          delete queryParams[key];
        }
      });

      const response = await apiGet('/calidad2/actas', queryParams);
      setActas(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading actas:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar las actas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  const getActa = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/actas/${id}`);
      setCurrentActa(response.data?.acta || response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el acta.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getSiguienteNumero = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/actas/siguiente-numero');
      const numero = response.data?.numero;
      setSiguienteNumero(numero);
      return numero;
    } catch (error) {
      console.error('Error getting siguiente numero:', error);
      return null;
    }
  }, []);

  const createActa = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/actas', data);
      toast({
        title: 'Acta creada',
        description: `El acta N° ${response.data?.acta?.numero || ''} se ha creado correctamente.`,
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadActas();
      return response.data?.acta || response.data;
    } catch (error) {
      console.error('Error creating acta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el acta.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadActas, toast]);

  const updateActa = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/actas/${id}`, data);
      toast({
        title: 'Acta actualizada',
        description: 'El acta se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentActa?.id === id) {
        setCurrentActa(response.data?.acta || response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error updating acta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el acta.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentActa, toast]);

  const deleteActa = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/actas/${id}`);
      toast({
        title: 'Acta eliminada',
        description: 'El acta se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadActas();
      return true;
    } catch (error) {
      console.error('Error deleting acta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el acta.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadActas, toast]);

  // Descargar PDF
  const downloadPDF = useCallback(async (id, numero) => {
    try {
      setDownloading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/calidad2/actas/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acta-${numero || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF descargado',
        description: 'El acta se ha descargado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el PDF.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  }, [toast]);

  // Asistentes
  const addAsistente = useCallback(async (actaId, data) => {
    try {
      const response = await apiPost(`/calidad2/actas/${actaId}/asistentes`, data);
      toast({
        title: 'Asistente agregado',
        description: 'El asistente se ha agregado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      getActa(actaId);
      return response.data?.asistente || response.data;
    } catch (error) {
      console.error('Error adding asistente:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar el asistente.',
        variant: 'destructive',
      });
      return null;
    }
  }, [getActa, toast]);

  const updateAsistente = useCallback(async (actaId, asistenteId, data) => {
    try {
      const response = await apiPut(`/calidad2/actas/${actaId}/asistentes/${asistenteId}`, data);
      toast({
        title: 'Asistente actualizado',
        description: 'El asistente se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      getActa(actaId);
      return response.data;
    } catch (error) {
      console.error('Error updating asistente:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el asistente.',
        variant: 'destructive',
      });
      return null;
    }
  }, [getActa, toast]);

  const removeAsistente = useCallback(async (actaId, asistenteId) => {
    try {
      await apiDelete(`/calidad2/actas/${actaId}/asistentes/${asistenteId}`);
      toast({
        title: 'Asistente eliminado',
        description: 'El asistente se ha eliminado del acta.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      getActa(actaId);
      return true;
    } catch (error) {
      console.error('Error removing asistente:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el asistente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [getActa, toast]);

  // Stats
  const loadStats = useCallback(async (params = {}) => {
    try {
      const response = await apiGet('/calidad2/actas/stats', params);
      setStats(response.data?.stats || response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading stats:', error);
      return null;
    }
  }, []);

  return {
    actas,
    currentActa,
    siguienteNumero,
    stats,
    pagination,
    loading,
    downloading,
    filters,
    setFilters,
    setPagination,
    setCurrentActa,
    loadActas,
    getActa,
    getSiguienteNumero,
    createActa,
    updateActa,
    deleteActa,
    downloadPDF,
    addAsistente,
    updateAsistente,
    removeAsistente,
    loadStats,
  };
}
