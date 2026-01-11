import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete, getAuthToken } from '@/services/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export function useCalidad2Capacidad() {
  const [capacidades, setCapacidades] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [totalesCapacidad, setTotalesCapacidad] = useState(null);
  const [totalesOferta, setTotalesOferta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // CAPACIDAD
  const loadCapacidades = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/capacidad');
      // response.data puede ser { data: [...], totales: {...} } o directamente un array
      const capData = response.data?.data || response.data;
      setCapacidades(Array.isArray(capData) ? capData : []);
      const totales = response.data?.totales || response.totales;
      if (totales) {
        setTotalesCapacidad(totales);
      }
    } catch (error) {
      console.error('Error loading capacidades:', error);
      setCapacidades([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de capacidad.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCapacidad = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/capacidad', data);
      toast({
        title: 'Capacidad creada',
        description: 'El registro de capacidad se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadCapacidades();
      return response.data;
    } catch (error) {
      console.error('Error creating capacidad:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el registro.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadCapacidades, toast]);

  const updateCapacidad = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/capacidad/${id}`, data);
      toast({
        title: 'Capacidad actualizada',
        description: 'El registro se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadCapacidades();
      return response.data;
    } catch (error) {
      console.error('Error updating capacidad:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el registro.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadCapacidades, toast]);

  const deleteCapacidad = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/capacidad/${id}`);
      toast({
        title: 'Capacidad eliminada',
        description: 'El registro se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadCapacidades();
      return true;
    } catch (error) {
      console.error('Error deleting capacidad:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el registro.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadCapacidades, toast]);

  // OFERTA
  const loadOfertas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/oferta');
      // response.data puede ser { data: [...], totales: {...} } o directamente un array
      const ofData = response.data?.data || response.data;
      setOfertas(Array.isArray(ofData) ? ofData : []);
      const totales = response.data?.totales || response.totales;
      if (totales) {
        setTotalesOferta(totales);
      }
    } catch (error) {
      console.error('Error loading ofertas:', error);
      setOfertas([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de oferta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createOferta = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/oferta', data);
      toast({
        title: 'Oferta creada',
        description: 'El registro de oferta se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadOfertas();
      return response.data;
    } catch (error) {
      console.error('Error creating oferta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el registro.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadOfertas, toast]);

  const updateOferta = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/oferta/${id}`, data);
      toast({
        title: 'Oferta actualizada',
        description: 'El registro se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadOfertas();
      return response.data;
    } catch (error) {
      console.error('Error updating oferta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el registro.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadOfertas, toast]);

  const deleteOferta = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/oferta/${id}`);
      toast({
        title: 'Oferta eliminada',
        description: 'El registro se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadOfertas();
      return true;
    } catch (error) {
      console.error('Error deleting oferta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el registro.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadOfertas, toast]);

  // RESUMEN MENSUAL
  const loadResumen = useCallback(async (mes, anio) => {
    try {
      // El backend espera mes y anio como path parameters
      const response = await apiGet(`/calidad2/capacidad/resumen/${mes}/${anio}`);
      setResumen(response.data?.resumen || response.data);
      return response.data?.resumen || response.data;
    } catch (error) {
      console.error('Error loading resumen:', error);
      setResumen(null);
      return null;
    }
  }, []);

  const saveResumen = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/capacidad/resumen', data);
      toast({
        title: 'Resumen guardado',
        description: 'El resumen mensual se ha guardado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      setResumen(response.data);
      return response.data;
    } catch (error) {
      console.error('Error saving resumen:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el resumen.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const loadResumenCompleto = useCallback(async (mes, anio) => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/capacidad/resumen-completo', { mes, anio });
      if (response.data) {
        const capData = response.data.capacidad?.data;
        const ofData = response.data.oferta?.data;
        setCapacidades(Array.isArray(capData) ? capData : []);
        setTotalesCapacidad(response.data.capacidad?.totales || null);
        setOfertas(Array.isArray(ofData) ? ofData : []);
        setTotalesOferta(response.data.oferta?.totales || null);
        setResumen(response.data.resumenMensual || null);
      }
      return response.data;
    } catch (error) {
      console.error('Error loading resumen completo:', error);
      setCapacidades([]);
      setOfertas([]);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el resumen completo.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // DOCUMENTOS
  const loadDocumentos = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/capacidad/documentos');
      setDocumentos(response.data || []);
    } catch (error) {
      console.error('Error loading documentos:', error);
    }
  }, []);

  const uploadDocumento = useCallback(async (file, metadata = {}) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('archivo', file);
      if (metadata.nombre) formData.append('nombre', metadata.nombre);
      if (metadata.descripcion) formData.append('descripcion', metadata.descripcion);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/calidad2/capacidad/documentos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir documento');
      }

      const result = await response.json();
      toast({
        title: 'Documento subido',
        description: 'El documento se ha subido correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadDocumentos();
      return result.data;
    } catch (error) {
      console.error('Error uploading documento:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo subir el documento.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [loadDocumentos, toast]);

  // Load all
  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCapacidades(), loadOfertas(), loadDocumentos()]);
    setLoading(false);
  }, [loadCapacidades, loadOfertas, loadDocumentos]);

  return {
    capacidades,
    ofertas,
    resumen,
    documentos,
    totalesCapacidad,
    totalesOferta,
    loading,
    uploading,
    loadCapacidades,
    createCapacidad,
    updateCapacidad,
    deleteCapacidad,
    loadOfertas,
    createOferta,
    updateOferta,
    deleteOferta,
    loadResumen,
    saveResumen,
    loadResumenCompleto,
    loadDocumentos,
    uploadDocumento,
    loadAll,
  };
}
