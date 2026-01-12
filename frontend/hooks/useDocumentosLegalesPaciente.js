'use client';

import { useState, useCallback } from 'react';
import { apiGet, apiPut, apiPost } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para gestionar documentos legales de pacientes
 * (términos y condiciones, política de privacidad)
 */
export function useDocumentosLegalesPaciente() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Cargar todos los documentos legales
   */
  const fetchDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/documentos-legales');
      if (response.success) {
        setDocumentos(response.data || []);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching legal documents:', error);
      toast.error('Error al cargar los documentos legales');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener un documento por tipo
   */
  const getByTipo = useCallback(async (tipo) => {
    try {
      setLoading(true);
      const response = await apiGet(`/documentos-legales/public/${tipo}`);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Error fetching document ${tipo}:`, error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Guardar documento (crear o actualizar por tipo)
   */
  const saveDocumento = useCallback(async (tipo, data) => {
    try {
      setSaving(true);
      const response = await apiPut(`/documentos-legales/tipo/${tipo}`, data);

      if (response.success) {
        toast.success('Documento guardado exitosamente');
        // Actualizar lista local
        setDocumentos(prev => {
          const index = prev.findIndex(d => d.tipo === tipo);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = response.data;
            return updated;
          }
          return [...prev, response.data];
        });
        return response.data;
      } else {
        toast.error(response.message || 'Error al guardar el documento');
        return null;
      }
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Error al guardar el documento');
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Crear documentos de ejemplo (seed)
   */
  const seedDocumentos = useCallback(async () => {
    try {
      setSaving(true);
      const response = await apiPost('/documentos-legales/seed');

      if (response.success) {
        toast.success(response.message || 'Documentos de ejemplo creados');
        await fetchDocumentos();
        return true;
      } else {
        toast.error(response.message || 'Error al crear documentos de ejemplo');
        return false;
      }
    } catch (error) {
      console.error('Error seeding documents:', error);
      toast.error('Error al crear documentos de ejemplo');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchDocumentos]);

  /**
   * Actualizar documento por ID
   */
  const updateDocumento = useCallback(async (id, data) => {
    try {
      setSaving(true);
      const response = await apiPut(`/documentos-legales/${id}`, data);

      if (response.success) {
        toast.success('Documento actualizado exitosamente');
        setDocumentos(prev =>
          prev.map(d => d.id === id ? response.data : d)
        );
        return response.data;
      } else {
        toast.error(response.message || 'Error al actualizar el documento');
        return null;
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Error al actualizar el documento');
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    documentos,
    loading,
    saving,
    fetchDocumentos,
    getByTipo,
    saveDocumento,
    seedDocumentos,
    updateDocumento,
  };
}
