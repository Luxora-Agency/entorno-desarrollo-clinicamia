import { useState, useCallback } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete, getAuthToken } from '@/services/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export function useCalidad2Personal() {
  const [personal, setPersonal] = useState([]);
  const [currentPersonal, setCurrentPersonal] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    tipoPersonal: '',
    tipoContrato: '',
    estado: 'ACTIVO',
  });

  const loadPersonal = useCallback(async (params = {}) => {
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

      const response = await apiGet('/calidad2/personal', queryParams);
      setPersonal(Array.isArray(response.data) ? response.data : []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading personal:', error);
      setPersonal([]);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el personal.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  const getPersonal = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/personal/${id}`);
      setCurrentPersonal(response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting personal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar los datos del personal.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createPersonal = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/personal', data);
      toast({
        title: 'Personal creado',
        description: 'El registro de personal se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadPersonal();
      return response.data;
    } catch (error) {
      console.error('Error creating personal:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el registro de personal.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadPersonal, toast]);

  const createFromCandidato = useCallback(async (candidatoId, data = {}) => {
    try {
      const response = await apiPost(`/calidad2/personal/from-candidato/${candidatoId}`, data);
      toast({
        title: 'Personal creado',
        description: 'El personal se ha creado desde el candidato correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadPersonal();
      return response.data;
    } catch (error) {
      console.error('Error creating from candidato:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el personal desde el candidato.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadPersonal, toast]);

  const updatePersonal = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/personal/${id}`, data);
      toast({
        title: 'Personal actualizado',
        description: 'Los datos del personal se han actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadPersonal();
      if (currentPersonal?.id === id) {
        setCurrentPersonal(response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error updating personal:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el personal.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadPersonal, currentPersonal, toast]);

  const deletePersonal = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/personal/${id}`);
      toast({
        title: 'Personal eliminado',
        description: 'El registro de personal se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadPersonal();
      return true;
    } catch (error) {
      console.error('Error deleting personal:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el personal.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadPersonal, toast]);

  // Documentos del personal
  const loadDocumentos = useCallback(async (personalId) => {
    try {
      const response = await apiGet(`/calidad2/personal/${personalId}/documentos`);
      const docs = Array.isArray(response.data) ? response.data : [];
      // Filtrar para asegurar que solo son de este personal (medida defensiva)
      const filtered = docs.filter(doc => doc.personalId === personalId);
      setDocumentos(filtered);
      return filtered;
    } catch (error) {
      console.error('Error loading documentos:', error);
      setDocumentos([]);
      return [];
    }
  }, []);

  const uploadDocumento = useCallback(async (personalId, file, metadata = {}) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file); // Cambiado de 'archivo' a 'file' para coincidir con backend
      if (metadata.nombre) formData.append('nombre', metadata.nombre);
      if (metadata.checklistItemId) formData.append('checklistItemId', metadata.checklistItemId);
      if (metadata.fechaEmision) formData.append('fechaEmision', metadata.fechaEmision);
      if (metadata.fechaVencimiento) formData.append('fechaVencimiento', metadata.fechaVencimiento);

      const response = await apiPost(
        `/calidad2/personal/${personalId}/documentos`,
        formData
      );

      toast({
        title: 'Documento subido',
        description: 'El documento se ha subido correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      await loadDocumentos(personalId);
      await loadChecklist(personalId);

      return response.data;
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
  }, [loadDocumentos, toast]); // loadChecklist se llama pero no es una dependencia necesaria

  const deleteDocumento = useCallback(async (personalId, documentoId) => {
    try {
      await apiDelete(`/calidad2/personal/${personalId}/documentos/${documentoId}`);
      toast({
        title: 'Documento eliminado',
        description: 'El documento se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadDocumentos(personalId);
      loadChecklist(personalId);
      return true;
    } catch (error) {
      console.error('Error deleting documento:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el documento.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadDocumentos, toast]);

  // Checklist del personal
  const loadChecklist = useCallback(async (personalId) => {
    try {
      const response = await apiGet(`/calidad2/personal/${personalId}/checklist`);
      const checklistData = response.data?.checklist || response.data;

      // Transformar la respuesta del backend a la estructura esperada por el frontend
      if (checklistData?.templates) {
        // Aplanar todos los items de todos los templates
        const allItems = checklistData.templates.flatMap(template =>
          (template.items || []).map(item => ({
            ...item,
            templateNombre: template.nombre,
            templateId: template.id,
          }))
        );

        const resumen = checklistData.resumen || {};
        const transformed = {
          items: allItems,
          totalItems: resumen.totalItems || allItems.length,
          itemsCompletados: resumen.itemsCumplidos || 0,
          itemsPendientes: (resumen.totalItems || allItems.length) - (resumen.itemsCumplidos || 0),
          porcentajeCompletado: resumen.porcentajeCumplimiento || 0,
          checklistCompleto: resumen.checklistCompleto || false,
          templates: checklistData.templates,
        };
        setChecklist(transformed);
        return transformed;
      }

      setChecklist(checklistData);
      return checklistData;
    } catch (error) {
      console.error('Error loading checklist:', error);
      setChecklist(null);
      return null;
    }
  }, []);

  const updateChecklistItem = useCallback(async (personalId, itemId, data) => {
    try {
      const response = await apiPut(`/calidad2/personal/${personalId}/checklist/${itemId}`, data);
      toast({
        title: 'Checklist actualizado',
        description: 'El estado del item se ha actualizado.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadChecklist(personalId);
      return response.data;
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el item.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadChecklist, toast]);

  // Stats
  const loadStats = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/personal/stats');
      setStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading stats:', error);
      return null;
    }
  }, []);

  // Export
  const exportExcel = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/personal/export');
      const { data, headers } = response.data || response;

      if (!data || !Array.isArray(data)) {
        throw new Error('Datos inválidos');
      }

      // Convertir a CSV
      const headerRow = headers.map(h => h.label).join(',');
      const dataRows = data.map(row =>
        headers.map(h => {
          const val = row[h.key];
          // Escapar comillas y envolver en comillas si contiene comas
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val ?? '';
        }).join(',')
      );
      const csv = [headerRow, ...dataRows].join('\n');

      // Agregar BOM para Excel
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal_calidad2_${getTodayColombia()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Exportado',
        description: 'El archivo se ha descargado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar el archivo.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    personal,
    currentPersonal,
    documentos,
    checklist,
    stats,
    pagination,
    loading,
    uploading,
    filters,
    setFilters,
    setPagination,
    loadPersonal,
    getPersonal,
    createPersonal,
    createFromCandidato,
    updatePersonal,
    deletePersonal,
    loadDocumentos,
    uploadDocumento,
    deleteDocumento,
    loadChecklist,
    updateChecklistItem,
    loadStats,
    exportExcel,
  };
}
