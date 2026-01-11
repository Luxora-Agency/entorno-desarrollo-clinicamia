import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiDelete } from '@/services/api';

export function useCalidad2Certificados() {
  const [certificados, setCertificados] = useState([]);
  const [currentCertificado, setCurrentCertificado] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filtros
  const [filters, setFilters] = useState({
    personalId: '',
    sesionId: '',
    search: '',
    anio: '',
  });

  const loadCertificados = useCallback(async (params = {}) => {
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

      const response = await apiGet('/calidad2/certificados', queryParams);
      setCertificados(Array.isArray(response.data) ? response.data : []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading certificados:', error);
      setCertificados([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los certificados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  const getCertificado = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/certificados/${id}`);
      setCurrentCertificado(response.data?.certificado || response.data);
      return response.data?.certificado || response.data;
    } catch (error) {
      console.error('Error getting certificado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el certificado.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const verificarCertificado = useCallback(async (codigo) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/certificados/verificar/${codigo}`);
      return response.data;
    } catch (error) {
      console.error('Error verificando certificado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo verificar el certificado.',
        variant: 'destructive',
      });
      return { valido: false, mensaje: 'Error al verificar' };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCertificado = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/certificados', data);
      toast({
        title: 'Certificado creado',
        description: 'El certificado se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadCertificados();
      return response.data?.certificado || response.data;
    } catch (error) {
      console.error('Error creating certificado:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el certificado.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadCertificados, toast]);

  const generarParaSesion = useCallback(async (sesionId) => {
    try {
      setLoading(true);
      const response = await apiPost(`/calidad2/certificados/generar-sesion/${sesionId}`);
      toast({
        title: 'Certificados generados',
        description: `Se generaron ${response.data?.generados || 0} certificados.`,
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadCertificados();
      return response.data;
    } catch (error) {
      console.error('Error generando certificados:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron generar los certificados.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadCertificados, toast]);

  const getCertificadosByPersonal = useCallback(async (personalId) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/certificados/personal/${personalId}`);
      return response.data?.certificados || [];
    } catch (error) {
      console.error('Error loading certificados by personal:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los certificados del personal.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getCertificadosBySesion = useCallback(async (sesionId) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/certificados/sesion/${sesionId}`);
      return response.data?.certificados || [];
    } catch (error) {
      console.error('Error loading certificados by sesion:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los certificados de la sesión.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteCertificado = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/certificados/${id}`);
      toast({
        title: 'Certificado eliminado',
        description: 'El certificado se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadCertificados();
      if (currentCertificado?.id === id) {
        setCurrentCertificado(null);
      }
      return true;
    } catch (error) {
      console.error('Error deleting certificado:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el certificado.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadCertificados, currentCertificado, toast]);

  // Stats
  const loadStats = useCallback(async (anio) => {
    try {
      const response = await apiGet('/calidad2/certificados/stats', { anio });
      setStats(response.data?.stats || response.data);
      return response.data?.stats || response.data;
    } catch (error) {
      console.error('Error loading stats:', error);
      return null;
    }
  }, []);

  const clearCurrentCertificado = useCallback(() => {
    setCurrentCertificado(null);
  }, []);

  return {
    certificados,
    currentCertificado,
    stats,
    pagination,
    loading,
    filters,
    setFilters,
    setPagination,
    loadCertificados,
    getCertificado,
    verificarCertificado,
    createCertificado,
    generarParaSesion,
    getCertificadosByPersonal,
    getCertificadosBySesion,
    deleteCertificado,
    loadStats,
    clearCurrentCertificado,
  };
}
