/**
 * Hook para sincronización en tiempo real de disponibilidad
 *
 * Implementa polling con checksum para detectar cambios en la agenda
 * y refrescar automáticamente los slots disponibles.
 *
 * Características:
 * - Polling cada 5 segundos (configurable)
 * - Compara checksum para evitar refrescos innecesarios
 * - Pausa automática cuando el tab no está visible
 * - Notifica cuando hay cambios
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '@/services/api';

// Intervalo de polling por defecto (5 segundos)
const DEFAULT_POLL_INTERVAL = 5000;

/**
 * Hook para monitorear cambios en la disponibilidad de un doctor
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.doctorId - ID del doctor a monitorear
 * @param {string} options.fecha - Fecha a monitorear (YYYY-MM-DD)
 * @param {boolean} options.enabled - Si el polling está activo
 * @param {number} options.interval - Intervalo de polling en ms (default: 5000)
 * @param {Function} options.onUpdate - Callback cuando hay cambios
 * @returns {Object} Estado y controles del polling
 */
export default function useDisponibilidadRealtime({
  doctorId,
  fecha,
  enabled = true,
  interval = DEFAULT_POLL_INTERVAL,
  onUpdate,
}) {
  const [isPolling, setIsPolling] = useState(false);
  const [lastChecksum, setLastChecksum] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Ref para el intervalo y el checksum anterior
  const intervalRef = useRef(null);
  const previousChecksumRef = useRef(null);
  const isVisibleRef = useRef(true);

  /**
   * Verificar checksum del servidor
   */
  const checkForUpdates = useCallback(async () => {
    if (!doctorId || !fecha || !isVisibleRef.current) return;

    try {
      const response = await apiGet(
        `/agenda/checksum?doctorId=${doctorId}&startDate=${fecha}&endDate=${fecha}`
      );

      if (response.success && response.data) {
        const newChecksum = response.data.checksum;
        const previousChecksum = previousChecksumRef.current;

        // Detectar si hay cambios
        if (previousChecksum && previousChecksum !== newChecksum) {
          setHasChanges(true);
          setLastUpdate(new Date());

          // Notificar cambio
          if (onUpdate) {
            onUpdate({
              previousChecksum,
              newChecksum,
              timestamp: new Date(),
            });
          }
        }

        setLastChecksum(newChecksum);
        previousChecksumRef.current = newChecksum;
        setError(null);
      }
    } catch (err) {
      // Solo loguear error, no interrumpir polling
      console.warn('[useDisponibilidadRealtime] Error checking updates:', err.message);
      setError(err.message);
    }
  }, [doctorId, fecha, onUpdate]);

  /**
   * Iniciar polling
   */
  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Ya está activo

    setIsPolling(true);
    intervalRef.current = setInterval(checkForUpdates, interval);

    // Hacer check inicial
    checkForUpdates();
  }, [checkForUpdates, interval]);

  /**
   * Detener polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /**
   * Reiniciar polling (útil después de confirmar cambios)
   */
  const resetPolling = useCallback(() => {
    setHasChanges(false);
    previousChecksumRef.current = null;
    stopPolling();
    if (enabled) {
      startPolling();
    }
  }, [enabled, startPolling, stopPolling]);

  /**
   * Marcar cambios como vistos
   */
  const acknowledgeChanges = useCallback(() => {
    setHasChanges(false);
  }, []);

  // Manejar visibilidad del tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';

      if (isVisibleRef.current && enabled) {
        // Tab visible: verificar cambios inmediatamente
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, checkForUpdates]);

  // Iniciar/detener polling según enabled y dependencias
  useEffect(() => {
    if (enabled && doctorId && fecha) {
      // Reset checksum cuando cambian las dependencias
      previousChecksumRef.current = null;
      setHasChanges(false);
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, doctorId, fecha, startPolling, stopPolling]);

  return {
    // Estado
    isPolling,
    lastChecksum,
    lastUpdate,
    hasChanges,
    error,

    // Acciones
    startPolling,
    stopPolling,
    resetPolling,
    acknowledgeChanges,
    checkForUpdates,
  };
}

/**
 * Hook simplificado para detectar si hay cambios en disponibilidad
 * Retorna solo un booleano para casos de uso simples
 */
export function useHasAvailabilityChanges(doctorId, fecha, enabled = true) {
  const { hasChanges, acknowledgeChanges } = useDisponibilidadRealtime({
    doctorId,
    fecha,
    enabled,
  });

  return { hasChanges, acknowledgeChanges };
}
