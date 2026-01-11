'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para obtener los pacientes hospitalizados a cargo de un doctor
 * @param {string} doctorId - ID del doctor
 * @param {Object} options - Opciones de filtrado
 */
export function useHospitalizedPatients(doctorId, options = {}) {
  const { estado, page = 1, limit = 20, autoFetch = true } = options;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchPatients = useCallback(async (fetchOptions = {}) => {
    const { silent = false } = fetchOptions;

    if (!doctorId) {
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(estado && { estado }),
      });

      const response = await fetch(
        `${apiUrl}/admisiones/doctor/${doctorId}?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar pacientes hospitalizados');
      }

      const result = await response.json();

      if (result.success) {
        setPatients(result.data?.data || []);
        setPagination(result.data?.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        });
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error fetching hospitalized patients:', err);
      setError(err.message);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId, estado, page, limit]);

  // Fetch inicial
  useEffect(() => {
    if (autoFetch && doctorId) {
      fetchPatients();
    }
  }, [autoFetch, doctorId, fetchPatients]);

  // Refrescar datos
  const refresh = useCallback(() => {
    return fetchPatients({ silent: true });
  }, [fetchPatients]);

  return {
    patients,
    loading,
    error,
    pagination,
    refresh,
    refetch: fetchPatients,
  };
}

/**
 * Hook para obtener estadísticas del doctor
 * @param {string} doctorId - ID del doctor
 */
export function useDoctorStats(doctorId) {
  const [stats, setStats] = useState({
    hospitalizacion: 0,
    consultaExterna: 0,
    enEspera: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/admisiones/doctor/${doctorId}/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      const result = await response.json();

      if (result.success && result.data?.stats) {
        setStats(result.data.stats);
      }
    } catch (err) {
      console.error('Error fetching doctor stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) {
      fetchStats();
    }
  }, [doctorId, fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}

export default useHospitalizedPatients;
