import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCalidad2Carpetas(tipo = null) {
  const [carpetas, setCarpetas] = useState([]);
  const [carpetaTree, setCarpetaTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadCarpetas = useCallback(async () => {
    try {
      setLoading(true);
      const params = tipo ? { tipo } : {};
      const response = await apiGet('/calidad2/carpetas', params);
      setCarpetas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading carpetas:', error);
      setCarpetas([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las carpetas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tipo, toast]);

  const loadCarpetaTree = useCallback(async (tipoParam = tipo) => {
    try {
      setLoading(true);
      // El backend espera el tipo como path parameter
      const tipoToUse = tipoParam || 'INSCRIPCION';
      const response = await apiGet(`/calidad2/carpetas/tree/${tipoToUse}`);
      const treeData = response.data?.tree || response.data;
      setCarpetaTree(Array.isArray(treeData) ? treeData : []);
    } catch (error) {
      console.error('Error loading carpeta tree:', error);
      setCarpetaTree([]);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el árbol de carpetas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tipo, toast]);

  const getCarpeta = useCallback(async (id) => {
    try {
      const response = await apiGet(`/calidad2/carpetas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting carpeta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la carpeta.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const createCarpeta = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/carpetas', data);

      // Actualizar la lista local inmediatamente
      if (response.data) {
        setCarpetas(prev => [response.data, ...prev]);
      }

      toast({
        title: 'Carpeta creada',
        description: 'La carpeta se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      // Recargar el árbol para mantener la estructura jerárquica correcta
      loadCarpetaTree();

      return response.data;
    } catch (error) {
      console.error('Error creating carpeta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la carpeta.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadCarpetaTree, toast]);

  const updateCarpeta = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/carpetas/${id}`, data);

      // Actualizar la lista local inmediatamente
      if (response.data) {
        setCarpetas(prev =>
          prev.map(carpeta => carpeta.id === id ? response.data : carpeta)
        );
      }

      toast({
        title: 'Carpeta actualizada',
        description: 'La carpeta se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      // Recargar el árbol para mantener la estructura jerárquica correcta
      loadCarpetaTree();

      return response.data;
    } catch (error) {
      console.error('Error updating carpeta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la carpeta.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadCarpetaTree, toast]);

  const deleteCarpeta = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/carpetas/${id}`);

      // Actualizar la lista local inmediatamente
      setCarpetas(prev => prev.filter(carpeta => carpeta.id !== id));

      toast({
        title: 'Carpeta eliminada',
        description: 'La carpeta se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      // Recargar el árbol para mantener la estructura jerárquica correcta
      // Usamos setTimeout para evitar problemas de sincronización
      setTimeout(async () => {
        try {
          await loadCarpetaTree();
        } catch (err) {
          console.warn('Error recargando árbol después de eliminar:', err);
        }
      }, 100);

      return true;
    } catch (error) {
      console.error('Error deleting carpeta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la carpeta.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadCarpetaTree, toast]);

  return {
    carpetas,
    carpetaTree,
    loading,
    loadCarpetas,
    loadCarpetaTree,
    getCarpeta,
    createCarpeta,
    updateCarpeta,
    deleteCarpeta,
  };
}
