import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCalidad2Checklists() {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadTemplates = useCallback(async (tipoEntidad = null) => {
    try {
      setLoading(true);
      const params = tipoEntidad ? { tipoEntidad } : {};
      const response = await apiGet('/calidad2/checklists', params);
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error loading checklist templates:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los checklists.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getTemplate = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/checklists/${id}`);
      setCurrentTemplate(response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting template:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el checklist.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getTemplatesByEntity = useCallback(async (tipoEntidad) => {
    try {
      const response = await apiGet(`/calidad2/checklists/by-entity/${tipoEntidad}`);
      return response.data || [];
    } catch (error) {
      console.error('Error getting templates by entity:', error);
      return [];
    }
  }, []);

  const createTemplate = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/checklists', data);
      toast({
        title: 'Checklist creado',
        description: 'El checklist se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadTemplates();
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el checklist.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadTemplates, toast]);

  const updateTemplate = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/checklists/${id}`, data);
      toast({
        title: 'Checklist actualizado',
        description: 'El checklist se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadTemplates();
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el checklist.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadTemplates, toast]);

  const deleteTemplate = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/checklists/${id}`);
      toast({
        title: 'Checklist eliminado',
        description: 'El checklist se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadTemplates();
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el checklist.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadTemplates, toast]);

  // Items
  const createItem = useCallback(async (templateId, data) => {
    try {
      const response = await apiPost(`/calidad2/checklists/${templateId}/items`, data);
      toast({
        title: 'Item agregado',
        description: 'El item se ha agregado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      getTemplate(templateId);
      return response.data;
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar el item.',
        variant: 'destructive',
      });
      return null;
    }
  }, [getTemplate, toast]);

  const updateItem = useCallback(async (itemId, data, templateId) => {
    try {
      const response = await apiPut(`/calidad2/checklists/items/${itemId}`, data);
      toast({
        title: 'Item actualizado',
        description: 'El item se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (templateId) getTemplate(templateId);
      return response.data;
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el item.',
        variant: 'destructive',
      });
      return null;
    }
  }, [getTemplate, toast]);

  const deleteItem = useCallback(async (itemId, templateId) => {
    try {
      await apiDelete(`/calidad2/checklists/items/${itemId}`);
      toast({
        title: 'Item eliminado',
        description: 'El item se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (templateId) getTemplate(templateId);
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el item.',
        variant: 'destructive',
      });
      return false;
    }
  }, [getTemplate, toast]);

  return {
    templates,
    currentTemplate,
    loading,
    loadTemplates,
    getTemplate,
    getTemplatesByEntity,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createItem,
    updateItem,
    deleteItem,
  };
}
