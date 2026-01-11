import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

// ==========================================
// TEMPLATES HOOK
// ==========================================

export function useCalidad2FormatoTemplates() {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    categoria: '',
    activo: '',
    search: '',
  });

  const loadTemplates = useCallback(async (params = {}) => {
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

      const response = await apiGet('/calidad2/formatos/templates', queryParams);
      setTemplates(Array.isArray(response.data) ? response.data : []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los templates.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  const getTemplate = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/formatos/templates/${id}`);
      setCurrentTemplate(response.data?.template || response.data);
      return response.data?.template || response.data;
    } catch (error) {
      console.error('Error getting template:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el template.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createTemplate = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/formatos/templates', data);
      toast({
        title: 'Template creado',
        description: 'El template se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadTemplates();
      return response.data?.template || response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el template.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadTemplates, toast]);

  const updateTemplate = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/formatos/templates/${id}`, data);
      toast({
        title: 'Template actualizado',
        description: 'El template se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadTemplates();
      if (currentTemplate?.id === id) {
        setCurrentTemplate(response.data?.template || response.data);
      }
      return response.data?.template || response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el template.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadTemplates, currentTemplate, toast]);

  const deleteTemplate = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/formatos/templates/${id}`);
      toast({
        title: 'Template eliminado',
        description: 'El template se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadTemplates();
      if (currentTemplate?.id === id) {
        setCurrentTemplate(null);
      }
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el template.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadTemplates, currentTemplate, toast]);

  const duplicateTemplate = useCallback(async (id, data = {}) => {
    try {
      setLoading(true);
      const response = await apiPost(`/calidad2/formatos/templates/${id}/duplicar`, data);
      toast({
        title: 'Template duplicado',
        description: 'El template se ha duplicado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadTemplates();
      return response.data?.template || response.data;
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo duplicar el template.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadTemplates, toast]);

  // Secciones
  const addSeccion = useCallback(async (templateId, data) => {
    try {
      const response = await apiPost(`/calidad2/formatos/templates/${templateId}/secciones`, data);
      toast({
        title: 'Sección agregada',
        description: 'La sección ha sido agregada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentTemplate?.id === templateId) {
        getTemplate(templateId);
      }
      return response.data?.seccion || response.data;
    } catch (error) {
      console.error('Error adding seccion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar la sección.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentTemplate, getTemplate, toast]);

  const updateSeccion = useCallback(async (seccionId, data) => {
    try {
      const response = await apiPut(`/calidad2/formatos/secciones/${seccionId}`, data);
      toast({
        title: 'Sección actualizada',
        description: 'La sección ha sido actualizada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentTemplate) {
        getTemplate(currentTemplate.id);
      }
      return response.data?.seccion || response.data;
    } catch (error) {
      console.error('Error updating seccion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la sección.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentTemplate, getTemplate, toast]);

  const deleteSeccion = useCallback(async (seccionId) => {
    try {
      await apiDelete(`/calidad2/formatos/secciones/${seccionId}`);
      toast({
        title: 'Sección eliminada',
        description: 'La sección ha sido eliminada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentTemplate) {
        getTemplate(currentTemplate.id);
      }
      return true;
    } catch (error) {
      console.error('Error deleting seccion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la sección.',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentTemplate, getTemplate, toast]);

  const reorderSecciones = useCallback(async (templateId, orderedIds) => {
    try {
      const response = await apiPut(`/calidad2/formatos/templates/${templateId}/secciones/reordenar`, { orderedIds });
      if (currentTemplate?.id === templateId) {
        getTemplate(templateId);
      }
      return response.data;
    } catch (error) {
      console.error('Error reordering secciones:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo reordenar las secciones.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentTemplate, getTemplate, toast]);

  // Campos
  const addCampo = useCallback(async (templateId, data) => {
    try {
      const response = await apiPost(`/calidad2/formatos/templates/${templateId}/campos`, data);
      toast({
        title: 'Campo agregado',
        description: 'El campo ha sido agregado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentTemplate?.id === templateId) {
        getTemplate(templateId);
      }
      return response.data?.campo || response.data;
    } catch (error) {
      console.error('Error adding campo:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar el campo.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentTemplate, getTemplate, toast]);

  const updateCampo = useCallback(async (campoId, data) => {
    try {
      const response = await apiPut(`/calidad2/formatos/campos/${campoId}`, data);
      toast({
        title: 'Campo actualizado',
        description: 'El campo ha sido actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentTemplate) {
        getTemplate(currentTemplate.id);
      }
      return response.data?.campo || response.data;
    } catch (error) {
      console.error('Error updating campo:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el campo.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentTemplate, getTemplate, toast]);

  const deleteCampo = useCallback(async (campoId) => {
    try {
      await apiDelete(`/calidad2/formatos/campos/${campoId}`);
      toast({
        title: 'Campo eliminado',
        description: 'El campo ha sido eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentTemplate) {
        getTemplate(currentTemplate.id);
      }
      return true;
    } catch (error) {
      console.error('Error deleting campo:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el campo.',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentTemplate, getTemplate, toast]);

  const reorderCampos = useCallback(async (templateId, orderedIds) => {
    try {
      const response = await apiPut(`/calidad2/formatos/templates/${templateId}/campos/reordenar`, { orderedIds });
      if (currentTemplate?.id === templateId) {
        getTemplate(templateId);
      }
      return response.data;
    } catch (error) {
      console.error('Error reordering campos:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo reordenar los campos.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentTemplate, getTemplate, toast]);

  const clearCurrentTemplate = useCallback(() => {
    setCurrentTemplate(null);
  }, []);

  return {
    templates,
    currentTemplate,
    pagination,
    loading,
    filters,
    setFilters,
    setPagination,
    loadTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    addSeccion,
    updateSeccion,
    deleteSeccion,
    reorderSecciones,
    addCampo,
    updateCampo,
    deleteCampo,
    reorderCampos,
    clearCurrentTemplate,
  };
}

// ==========================================
// INSTANCIAS HOOK
// ==========================================

export function useCalidad2FormatoInstancias() {
  const [instancias, setInstancias] = useState([]);
  const [currentInstancia, setCurrentInstancia] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    templateId: '',
    personalId: '',
    estado: '',
    search: '',
  });

  const loadInstancias = useCallback(async (params = {}) => {
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

      const response = await apiGet('/calidad2/formatos/instancias', queryParams);
      setInstancias(Array.isArray(response.data) ? response.data : []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading instancias:', error);
      setInstancias([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las instancias.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  const getInstancia = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/formatos/instancias/${id}`);
      setCurrentInstancia(response.data?.instancia || response.data);
      return response.data?.instancia || response.data;
    } catch (error) {
      console.error('Error getting instancia:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la instancia.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createInstancia = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/formatos/instancias', data);
      toast({
        title: 'Formato creado',
        description: 'El formato se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadInstancias();
      return response.data?.instancia || response.data;
    } catch (error) {
      console.error('Error creating instancia:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el formato.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadInstancias, toast]);

  const updateInstancia = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/formatos/instancias/${id}`, data);
      toast({
        title: 'Formato actualizado',
        description: 'El formato se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadInstancias();
      if (currentInstancia?.id === id) {
        setCurrentInstancia(response.data?.instancia || response.data);
      }
      return response.data?.instancia || response.data;
    } catch (error) {
      console.error('Error updating instancia:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el formato.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadInstancias, currentInstancia, toast]);

  const deleteInstancia = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/formatos/instancias/${id}`);
      toast({
        title: 'Formato eliminado',
        description: 'El formato se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadInstancias();
      if (currentInstancia?.id === id) {
        setCurrentInstancia(null);
      }
      return true;
    } catch (error) {
      console.error('Error deleting instancia:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el formato.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadInstancias, currentInstancia, toast]);

  const completarInstancia = useCallback(async (id) => {
    try {
      const response = await apiPut(`/calidad2/formatos/instancias/${id}/completar`);
      toast({
        title: 'Formato completado',
        description: 'El formato ha sido completado.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadInstancias();
      return response.data?.instancia || response.data;
    } catch (error) {
      console.error('Error completando instancia:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo completar el formato.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadInstancias, toast]);

  const cancelarInstancia = useCallback(async (id) => {
    try {
      const response = await apiPut(`/calidad2/formatos/instancias/${id}/cancelar`);
      toast({
        title: 'Formato cancelado',
        description: 'El formato ha sido cancelado.',
        className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      });
      loadInstancias();
      return response.data?.instancia || response.data;
    } catch (error) {
      console.error('Error cancelando instancia:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cancelar el formato.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadInstancias, toast]);

  // Respuestas
  const saveRespuestas = useCallback(async (instanciaId, respuestas) => {
    try {
      const response = await apiPut(`/calidad2/formatos/instancias/${instanciaId}/respuestas`, { respuestas });
      toast({
        title: 'Respuestas guardadas',
        description: 'Las respuestas han sido guardadas correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentInstancia?.id === instanciaId) {
        getInstancia(instanciaId);
      }
      return response.data?.respuestas || response.data;
    } catch (error) {
      console.error('Error saving respuestas:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron guardar las respuestas.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentInstancia, getInstancia, toast]);

  // Asistentes
  const getAsistentes = useCallback(async (instanciaId) => {
    try {
      const response = await apiGet(`/calidad2/formatos/instancias/${instanciaId}/asistentes`);
      return response.data?.asistentes || [];
    } catch (error) {
      console.error('Error loading asistentes:', error);
      return [];
    }
  }, []);

  const addAsistente = useCallback(async (instanciaId, data) => {
    try {
      const response = await apiPost(`/calidad2/formatos/instancias/${instanciaId}/asistentes`, data);
      toast({
        title: 'Asistente agregado',
        description: 'El asistente ha sido agregado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentInstancia?.id === instanciaId) {
        getInstancia(instanciaId);
      }
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
  }, [currentInstancia, getInstancia, toast]);

  const updateAsistente = useCallback(async (instanciaId, asistenteId, data) => {
    try {
      const response = await apiPut(`/calidad2/formatos/instancias/${instanciaId}/asistentes/${asistenteId}`, data);
      toast({
        title: 'Asistente actualizado',
        description: 'El asistente ha sido actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentInstancia?.id === instanciaId) {
        getInstancia(instanciaId);
      }
      return response.data?.asistente || response.data;
    } catch (error) {
      console.error('Error updating asistente:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el asistente.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentInstancia, getInstancia, toast]);

  const deleteAsistente = useCallback(async (instanciaId, asistenteId) => {
    try {
      await apiDelete(`/calidad2/formatos/instancias/${instanciaId}/asistentes/${asistenteId}`);
      toast({
        title: 'Asistente eliminado',
        description: 'El asistente ha sido eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentInstancia?.id === instanciaId) {
        getInstancia(instanciaId);
      }
      return true;
    } catch (error) {
      console.error('Error deleting asistente:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el asistente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentInstancia, getInstancia, toast]);

  // Firmas
  const addFirma = useCallback(async (instanciaId, data) => {
    try {
      const response = await apiPost(`/calidad2/formatos/instancias/${instanciaId}/firmas`, data);
      toast({
        title: 'Firma agregada',
        description: 'La firma ha sido agregada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentInstancia?.id === instanciaId) {
        getInstancia(instanciaId);
      }
      return response.data?.firma || response.data;
    } catch (error) {
      console.error('Error adding firma:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar la firma.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentInstancia, getInstancia, toast]);

  const updateFirma = useCallback(async (instanciaId, firmaId, data) => {
    try {
      const response = await apiPut(`/calidad2/formatos/instancias/${instanciaId}/firmas/${firmaId}`, data);
      toast({
        title: 'Firma actualizada',
        description: 'La firma ha sido actualizada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentInstancia?.id === instanciaId) {
        getInstancia(instanciaId);
      }
      return response.data?.firma || response.data;
    } catch (error) {
      console.error('Error updating firma:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la firma.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentInstancia, getInstancia, toast]);

  const deleteFirma = useCallback(async (instanciaId, firmaId) => {
    try {
      await apiDelete(`/calidad2/formatos/instancias/${instanciaId}/firmas/${firmaId}`);
      toast({
        title: 'Firma eliminada',
        description: 'La firma ha sido eliminada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentInstancia?.id === instanciaId) {
        getInstancia(instanciaId);
      }
      return true;
    } catch (error) {
      console.error('Error deleting firma:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la firma.',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentInstancia, getInstancia, toast]);

  // Historial
  const getHistorial = useCallback(async (instanciaId) => {
    try {
      const response = await apiGet(`/calidad2/formatos/instancias/${instanciaId}/historial`);
      return response.data?.historial || [];
    } catch (error) {
      console.error('Error loading historial:', error);
      return [];
    }
  }, []);

  // Stats
  const loadStats = useCallback(async (params = {}) => {
    try {
      const response = await apiGet('/calidad2/formatos/instancias/stats', params);
      setStats(response.data?.stats || response.data);
      return response.data?.stats || response.data;
    } catch (error) {
      console.error('Error loading stats:', error);
      return null;
    }
  }, []);

  const getCumplimiento = useCallback(async (params = {}) => {
    try {
      const response = await apiGet('/calidad2/formatos/instancias/cumplimiento', params);
      return response.data?.cumplimiento || response.data;
    } catch (error) {
      console.error('Error loading cumplimiento:', error);
      return null;
    }
  }, []);

  const clearCurrentInstancia = useCallback(() => {
    setCurrentInstancia(null);
  }, []);

  return {
    instancias,
    currentInstancia,
    stats,
    pagination,
    loading,
    filters,
    setFilters,
    setPagination,
    loadInstancias,
    getInstancia,
    createInstancia,
    updateInstancia,
    deleteInstancia,
    completarInstancia,
    cancelarInstancia,
    saveRespuestas,
    getAsistentes,
    addAsistente,
    updateAsistente,
    deleteAsistente,
    addFirma,
    updateFirma,
    deleteFirma,
    getHistorial,
    loadStats,
    getCumplimiento,
    clearCurrentInstancia,
  };
}

// ==========================================
// ALERTAS HOOK
// ==========================================

export function useCalidad2FormatoAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    tipo: '',
    atendida: '',
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
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null) {
          delete queryParams[key];
        }
      });

      const response = await apiGet('/calidad2/formatos/alertas', queryParams);
      setAlertas(Array.isArray(response.data) ? response.data : []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading alertas:', error);
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
      const response = await apiGet('/calidad2/formatos/alertas/dashboard');
      setDashboard(response.data?.dashboard || response.data);
      return response.data?.dashboard || response.data;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      return null;
    }
  }, []);

  const atenderAlerta = useCallback(async (id) => {
    try {
      const response = await apiPut(`/calidad2/formatos/alertas/${id}/atender`);
      toast({
        title: 'Alerta atendida',
        description: 'La alerta ha sido atendida correctamente.',
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
    }
  }, [loadAlertas, loadDashboard, toast]);

  const generarAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/formatos/alertas/generar');
      toast({
        title: 'Alertas generadas',
        description: 'Las alertas han sido generadas correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadAlertas();
      loadDashboard();
      return response.data?.result || response.data;
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
