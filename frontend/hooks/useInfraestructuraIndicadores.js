import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useInfraestructuraIndicadores() {
  const [indicadores, setIndicadores] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Cargar indicadores con filtros
   */
  const loadIndicadores = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.dominio) params.append('dominio', filters.dominio);
      if (filters.tipoCalculo) params.append('tipoCalculo', filters.tipoCalculo);
      if (filters.frecuencia) params.append('frecuencia', filters.frecuencia);

      const response = await apiGet(`/calidad2/infraestructura/indicadores?${params.toString()}`);
      setIndicadores(response.data || []);
      return response.data;
    } catch (error) {
      console.error('Error al cargar indicadores:', error);
      toast.error(error.response?.data?.message || 'Error al cargar indicadores');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar dashboard completo
   */
  const loadDashboard = useCallback(async (anio = null) => {
    try {
      setLoading(true);
      const url = anio
        ? `/calidad2/infraestructura/indicadores/dashboard?anio=${anio}`
        : '/calidad2/infraestructura/indicadores/dashboard';

      const response = await apiGet(url);
      setDashboard(response.data);
      return response.data;
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      toast.error(error.response?.data?.message || 'Error al cargar dashboard');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener resumen de indicadores
   */
  const getResumen = useCallback(async (anio = null) => {
    try {
      const url = anio
        ? `/calidad2/infraestructura/indicadores/resumen?anio=${anio}`
        : '/calidad2/infraestructura/indicadores/resumen';

      const response = await apiGet(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      toast.error(error.response?.data?.message || 'Error al obtener resumen');
      return [];
    }
  }, []);

  /**
   * Obtener indicador por ID
   */
  const getById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/indicadores/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener indicador:', error);
      toast.error(error.response?.data?.message || 'Error al obtener indicador');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener ficha técnica completa
   */
  const getFichaTecnica = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/indicadores/${id}/ficha-tecnica`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener ficha técnica:', error);
      toast.error(error.response?.data?.message || 'Error al obtener ficha técnica');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear indicador
   */
  const createIndicador = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/infraestructura/indicadores', data);
      toast.success('Indicador creado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al crear indicador:', error);
      toast.error(error.response?.data?.message || 'Error al crear indicador');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar indicador
   */
  const updateIndicador = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/infraestructura/indicadores/${id}`, data);
      toast.success('Indicador actualizado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al actualizar indicador:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar indicador');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar indicador
   */
  const deleteIndicador = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/indicadores/${id}`);
      toast.success('Indicador eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar indicador:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar indicador');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener mediciones de un indicador
   */
  const getMediciones = useCallback(async (indicadorId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.anio) params.append('anio', filters.anio);
      if (filters.mes) params.append('mes', filters.mes);
      if (filters.periodo) params.append('periodo', filters.periodo);

      const response = await apiGet(
        `/calidad2/infraestructura/indicadores/${indicadorId}/mediciones?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener mediciones:', error);
      toast.error(error.response?.data?.message || 'Error al obtener mediciones');
      return [];
    }
  }, []);

  /**
   * Obtener serie histórica para gráficas
   */
  const getSerieHistorica = useCallback(async (indicadorId, limite = 12) => {
    try {
      const response = await apiGet(
        `/calidad2/infraestructura/indicadores/${indicadorId}/serie-historica?limite=${limite}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener serie histórica:', error);
      toast.error(error.response?.data?.message || 'Error al obtener serie histórica');
      return null;
    }
  }, []);

  /**
   * Crear medición manual
   */
  const createMedicion = useCallback(async (indicadorId, data) => {
    try {
      setLoading(true);
      const response = await apiPost(
        `/calidad2/infraestructura/indicadores/${indicadorId}/mediciones`,
        data
      );
      toast.success('Medición registrada exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al registrar medición:', error);
      toast.error(error.response?.data?.message || 'Error al registrar medición');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar medición
   */
  const updateMedicion = useCallback(async (medicionId, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/infraestructura/mediciones/${medicionId}`, data);
      toast.success('Medición actualizada exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al actualizar medición:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar medición');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verificar medición
   */
  const verificarMedicion = useCallback(async (medicionId) => {
    try {
      setLoading(true);
      const response = await apiPatch(`/calidad2/infraestructura/mediciones/${medicionId}/verificar`, {});
      toast.success('Medición verificada exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al verificar medición:', error);
      toast.error(error.response?.data?.message || 'Error al verificar medición');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar medición
   */
  const deleteMedicion = useCallback(async (medicionId) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/mediciones/${medicionId}`);
      toast.success('Medición eliminada exitosamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar medición:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar medición');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calcular indicadores automáticos desde RH1
   */
  const calcularIndicadores = useCallback(async (mes, anio) => {
    try {
      setLoading(true);
      const response = await apiPost(
        `/calidad2/infraestructura/calcular-indicadores/${mes}/${anio}`,
        {}
      );
      toast.success('Indicadores calculados automáticamente');
      return response.data;
    } catch (error) {
      console.error('Error al calcular indicadores:', error);
      toast.error(error.response?.data?.message || 'Error al calcular indicadores');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Recalcular año completo
   */
  const recalcularAnio = useCallback(async (anio) => {
    try {
      setLoading(true);
      const response = await apiPost(
        `/calidad2/infraestructura/calcular-indicadores/recalcular/${anio}`,
        {}
      );
      toast.success(`Año ${anio} recalculado exitosamente`);
      return response.data;
    } catch (error) {
      console.error('Error al recalcular año:', error);
      toast.error(error.response?.data?.message || 'Error al recalcular año');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Comparar periodos
   */
  const compararPeriodos = useCallback(async (periodo1, periodo2) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/infraestructura/comparar-periodos', {
        periodo1,
        periodo2,
      });
      return response.data;
    } catch (error) {
      console.error('Error al comparar periodos:', error);
      toast.error(error.response?.data?.message || 'Error al comparar periodos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas
   */
  const getEstadisticas = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/infraestructura/indicadores/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }, []);

  return {
    indicadores,
    dashboard,
    loading,
    loadIndicadores,
    loadDashboard,
    getResumen,
    getById,
    getFichaTecnica,
    createIndicador,
    updateIndicador,
    deleteIndicador,
    getMediciones,
    getSerieHistorica,
    createMedicion,
    updateMedicion,
    verificarMedicion,
    deleteMedicion,
    calcularIndicadores,
    recalcularAnio,
    compararPeriodos,
    getEstadisticas,
  };
}
