/**
 * Hook para gestionar bloqueos de agenda de doctores
 *
 * Permite crear, listar y eliminar bloqueos como:
 * - Vacaciones
 * - Congresos
 * - Permisos personales
 * - Bloqueos parciales (horas específicas)
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/services/api';
import { toast } from 'sonner';

// Tipos de bloqueo disponibles
export const TIPOS_BLOQUEO = {
  BLOQUEO: 'BLOQUEO',
  VACACIONES: 'VACACIONES',
  CONGRESO: 'CONGRESO',
  PERSONAL: 'PERSONAL',
  EMERGENCIA_SOLO: 'EMERGENCIA_SOLO',
};

// Etiquetas para mostrar en UI
export const LABELS_TIPO_BLOQUEO = {
  BLOQUEO: 'Bloqueo General',
  VACACIONES: 'Vacaciones',
  CONGRESO: 'Congreso/Capacitación',
  PERSONAL: 'Permiso Personal',
  EMERGENCIA_SOLO: 'Solo Emergencias',
};

// Colores para cada tipo de bloqueo
export const COLORES_TIPO_BLOQUEO = {
  BLOQUEO: '#6B7280',      // gray
  VACACIONES: '#10B981',   // green
  CONGRESO: '#3B82F6',     // blue
  PERSONAL: '#F59E0B',     // amber
  EMERGENCIA_SOLO: '#EF4444', // red
};

export default function useBloqueos() {
  const [bloqueos, setBloqueos] = useState([]);
  const [resumenMes, setResumenMes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener bloqueos de un doctor
   *
   * @param {string} doctorId - ID del doctor (Usuario.id)
   * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD) opcional
   * @param {string} fechaFin - Fecha fin (YYYY-MM-DD) opcional
   */
  const obtenerBloqueos = useCallback(async (doctorId, fechaInicio = null, fechaFin = null) => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);
    try {
      let url = `/bloqueos/doctor/${doctorId}`;
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await apiGet(url);
      setBloqueos(response.data || []);
      return response.data;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar bloqueos: ' + err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener resumen mensual de días bloqueados
   *
   * @param {string} doctorId - ID del doctor
   * @param {number} anio - Año
   * @param {number} mes - Mes (1-12)
   */
  const obtenerResumenMes = useCallback(async (doctorId, anio, mes) => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const response = await apiGet(
        `/bloqueos/doctor/${doctorId}/resumen?anio=${anio}&mes=${mes}`
      );
      setResumenMes(response.data || []);
      return response.data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verificar si una fecha/hora está bloqueada
   *
   * @param {string} doctorId - ID del doctor
   * @param {string} fecha - Fecha (YYYY-MM-DD)
   * @param {string} hora - Hora (HH:MM) opcional
   * @returns {Promise<Object|null>} Información del bloqueo si existe
   */
  const verificarBloqueo = useCallback(async (doctorId, fecha, hora = null) => {
    try {
      let url = `/bloqueos/verificar?doctor_id=${doctorId}&fecha=${fecha}`;
      if (hora) url += `&hora=${hora}`;

      const response = await apiGet(url);
      return response.data;
    } catch (err) {
      console.error('Error verificando bloqueo:', err.message);
      return null;
    }
  }, []);

  /**
   * Crear un nuevo bloqueo de agenda
   *
   * @param {Object} datos - Datos del bloqueo
   * @param {string} datos.doctor_id - ID del doctor
   * @param {string} datos.fecha_inicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} datos.fecha_fin - Fecha fin (YYYY-MM-DD)
   * @param {string} datos.motivo - Motivo del bloqueo
   * @param {string} datos.tipo - Tipo de bloqueo (BLOQUEO, VACACIONES, etc.)
   * @param {string} datos.hora_inicio - Hora inicio (HH:MM) opcional para bloqueo parcial
   * @param {string} datos.hora_fin - Hora fin (HH:MM) opcional para bloqueo parcial
   */
  const crearBloqueo = useCallback(async (datos) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/bloqueos', datos);
      toast.success('Bloqueo creado exitosamente');

      // Actualizar lista local
      setBloqueos((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      toast.error('Error al crear bloqueo: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar un bloqueo existente
   *
   * @param {string} bloqueoId - ID del bloqueo
   * @param {Object} datos - Datos a actualizar
   */
  const actualizarBloqueo = useCallback(async (bloqueoId, datos) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPut(`/bloqueos/${bloqueoId}`, datos);
      toast.success('Bloqueo actualizado');

      // Actualizar lista local
      setBloqueos((prev) =>
        prev.map((b) => (b.id === bloqueoId ? response.data : b))
      );
      return response.data;
    } catch (err) {
      setError(err.message);
      toast.error('Error al actualizar: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Desactivar un bloqueo (soft delete)
   *
   * @param {string} bloqueoId - ID del bloqueo
   */
  const desactivarBloqueo = useCallback(async (bloqueoId) => {
    setLoading(true);
    try {
      await apiPatch(`/bloqueos/${bloqueoId}/desactivar`);
      toast.success('Bloqueo desactivado');

      // Eliminar de lista local
      setBloqueos((prev) => prev.filter((b) => b.id !== bloqueoId));
    } catch (err) {
      toast.error('Error al desactivar: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar un bloqueo permanentemente
   *
   * @param {string} bloqueoId - ID del bloqueo
   */
  const eliminarBloqueo = useCallback(async (bloqueoId) => {
    setLoading(true);
    try {
      await apiDelete(`/bloqueos/${bloqueoId}`);
      toast.success('Bloqueo eliminado');

      // Eliminar de lista local
      setBloqueos((prev) => prev.filter((b) => b.id !== bloqueoId));
    } catch (err) {
      toast.error('Error al eliminar: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener un bloqueo por ID
   *
   * @param {string} bloqueoId - ID del bloqueo
   */
  const obtenerPorId = useCallback(async (bloqueoId) => {
    try {
      const response = await apiGet(`/bloqueos/${bloqueoId}`);
      return response.data;
    } catch (err) {
      toast.error('Error al cargar bloqueo: ' + err.message);
      throw err;
    }
  }, []);

  return {
    // Estado
    bloqueos,
    resumenMes,
    loading,
    error,

    // Acciones
    obtenerBloqueos,
    obtenerResumenMes,
    verificarBloqueo,
    crearBloqueo,
    actualizarBloqueo,
    desactivarBloqueo,
    eliminarBloqueo,
    obtenerPorId,

    // Constantes
    TIPOS_BLOQUEO,
    LABELS_TIPO_BLOQUEO,
    COLORES_TIPO_BLOQUEO,
  };
}
