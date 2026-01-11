import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useEvaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [currentEvaluacion, setCurrentEvaluacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadEvaluaciones = useCallback(async (capacitacionId) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/capacitaciones/${capacitacionId}/evaluaciones`);
      setEvaluaciones(response.data?.evaluaciones || []);
      return response.data;
    } catch (error) {
      console.error('Error loading evaluaciones:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar las evaluaciones.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getEvaluacion = useCallback(async (evaluacionId) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/capacitaciones/evaluaciones/${evaluacionId}`);
      setCurrentEvaluacion(response.data?.evaluacion || response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting evaluacion:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la evaluación.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createEvaluacion = useCallback(async (capacitacionId, data) => {
    try {
      const response = await apiPost(`/calidad2/capacitaciones/${capacitacionId}/evaluaciones`, data);
      toast({
        title: 'Evaluación creada',
        description: `${data.tipo === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'} creado correctamente.`,
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      return response.data?.evaluacion || response.data;
    } catch (error) {
      console.error('Error creating evaluacion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la evaluación.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateEvaluacion = useCallback(async (evaluacionId, data) => {
    try {
      const response = await apiPut(`/calidad2/capacitaciones/evaluaciones/${evaluacionId}`, data);
      toast({
        title: 'Evaluación actualizada',
        description: 'La evaluación se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentEvaluacion?.id === evaluacionId) {
        setCurrentEvaluacion(response.data?.evaluacion || response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error updating evaluacion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la evaluación.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentEvaluacion, toast]);

  const deleteEvaluacion = useCallback(async (evaluacionId) => {
    try {
      await apiDelete(`/calidad2/capacitaciones/evaluaciones/${evaluacionId}`);
      toast({
        title: 'Evaluación eliminada',
        description: 'La evaluación se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      return true;
    } catch (error) {
      console.error('Error deleting evaluacion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la evaluación.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Preguntas
  const addPregunta = useCallback(async (evaluacionId, data) => {
    try {
      const response = await apiPost(`/calidad2/capacitaciones/evaluaciones/${evaluacionId}/preguntas`, data);
      toast({
        title: 'Pregunta agregada',
        description: 'La pregunta se ha agregado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      getEvaluacion(evaluacionId);
      return response.data?.pregunta || response.data;
    } catch (error) {
      console.error('Error adding pregunta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar la pregunta.',
        variant: 'destructive',
      });
      return null;
    }
  }, [getEvaluacion, toast]);

  const updatePregunta = useCallback(async (preguntaId, data, evaluacionId) => {
    try {
      const response = await apiPut(`/calidad2/capacitaciones/evaluaciones/preguntas/${preguntaId}`, data);
      toast({
        title: 'Pregunta actualizada',
        description: 'La pregunta se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (evaluacionId) getEvaluacion(evaluacionId);
      return response.data;
    } catch (error) {
      console.error('Error updating pregunta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la pregunta.',
        variant: 'destructive',
      });
      return null;
    }
  }, [getEvaluacion, toast]);

  const deletePregunta = useCallback(async (preguntaId, evaluacionId) => {
    try {
      await apiDelete(`/calidad2/capacitaciones/evaluaciones/preguntas/${preguntaId}`);
      toast({
        title: 'Pregunta eliminada',
        description: 'La pregunta se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (evaluacionId) getEvaluacion(evaluacionId);
      return true;
    } catch (error) {
      console.error('Error deleting pregunta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la pregunta.',
        variant: 'destructive',
      });
      return false;
    }
  }, [getEvaluacion, toast]);

  const reorderPreguntas = useCallback(async (evaluacionId, orderedIds) => {
    try {
      await apiPost(`/calidad2/capacitaciones/evaluaciones/${evaluacionId}/preguntas/reorder`, {
        orderedIds,
      });
      toast({
        title: 'Orden actualizado',
        description: 'El orden de las preguntas se ha actualizado.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      getEvaluacion(evaluacionId);
      return true;
    } catch (error) {
      console.error('Error reordering preguntas:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el orden.',
        variant: 'destructive',
      });
      return false;
    }
  }, [getEvaluacion, toast]);

  // Opciones
  const addOpcion = useCallback(async (preguntaId, data, evaluacionId) => {
    try {
      const response = await apiPost(`/calidad2/capacitaciones/evaluaciones/preguntas/${preguntaId}/opciones`, data);
      toast({
        title: 'Opción agregada',
        description: 'La opción se ha agregado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (evaluacionId) getEvaluacion(evaluacionId);
      return response.data?.opcion || response.data;
    } catch (error) {
      console.error('Error adding opcion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar la opción.',
        variant: 'destructive',
      });
      return null;
    }
  }, [getEvaluacion, toast]);

  const updateOpcion = useCallback(async (opcionId, data, evaluacionId) => {
    try {
      const response = await apiPut(`/calidad2/capacitaciones/evaluaciones/opciones/${opcionId}`, data);
      toast({
        title: 'Opción actualizada',
        description: 'La opción se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (evaluacionId) getEvaluacion(evaluacionId);
      return response.data;
    } catch (error) {
      console.error('Error updating opcion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la opción.',
        variant: 'destructive',
      });
      return null;
    }
  }, [getEvaluacion, toast]);

  const deleteOpcion = useCallback(async (opcionId, evaluacionId) => {
    try {
      await apiDelete(`/calidad2/capacitaciones/evaluaciones/opciones/${opcionId}`);
      toast({
        title: 'Opción eliminada',
        description: 'La opción se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (evaluacionId) getEvaluacion(evaluacionId);
      return true;
    } catch (error) {
      console.error('Error deleting opcion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la opción.',
        variant: 'destructive',
      });
      return false;
    }
  }, [getEvaluacion, toast]);

  return {
    evaluaciones,
    currentEvaluacion,
    loading,
    setCurrentEvaluacion,
    loadEvaluaciones,
    getEvaluacion,
    createEvaluacion,
    updateEvaluacion,
    deleteEvaluacion,
    addPregunta,
    updatePregunta,
    deletePregunta,
    reorderPreguntas,
    addOpcion,
    updateOpcion,
    deleteOpcion,
  };
}
