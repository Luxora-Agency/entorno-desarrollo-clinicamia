import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCalidad2InventarioMedicamentos(tipo = null) {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const { toast } = useToast();

  /**
   * Load inventory items with optional filters
   */
  const loadInventario = useCallback(async (params = {}) => {
    try {
      setLoading(true);

      let endpoint = '/calidad2/medicamentos/inventario';

      // If tipo is specified, use specific endpoint
      if (tipo === 'MEDICAMENTO') {
        endpoint = '/calidad2/medicamentos/inventario/medicamentos';
      } else if (tipo === 'DISPOSITIVO_MEDICO') {
        endpoint = '/calidad2/medicamentos/inventario/dispositivos';
      } else if (tipo === 'INSUMO_MEDICO_QUIRURGICO') {
        endpoint = '/calidad2/medicamentos/inventario/insumos';
      }

      const response = await apiGet(endpoint, params);
      setInventario(Array.isArray(response.data) ? response.data : []);
      return response;
    } catch (error) {
      console.error('Error loading inventario:', error);
      setInventario([]);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el inventario.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [tipo, toast]);

  /**
   * Get a single item by ID
   */
  const getItem = useCallback(async (id) => {
    try {
      const response = await apiGet(`/calidad2/medicamentos/inventario/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting item:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el item.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Get items expiring soon
   */
  const getProximosVencer = useCallback(async (dias = 30) => {
    try {
      const response = await apiGet('/calidad2/medicamentos/inventario/proximos-vencer', { dias });
      return response.data;
    } catch (error) {
      console.error('Error getting próximos a vencer:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los items próximos a vencer.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  /**
   * Get expired items
   */
  const getVencidos = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/medicamentos/inventario/vencidos');
      return response.data;
    } catch (error) {
      console.error('Error getting vencidos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los items vencidos.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  /**
   * Get items with low stock
   */
  const getStockBajo = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/medicamentos/inventario/stock-bajo');
      return response.data;
    } catch (error) {
      console.error('Error getting stock bajo:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los items con stock bajo.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  /**
   * Get inventory statistics
   */
  const getEstadisticas = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/medicamentos/inventario/estadisticas');
      setEstadisticas(response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting estadísticas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Create a new inventory item
   */
  const createItem = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/medicamentos/inventario', data);

      if (response.data) {
        setInventario(prev => [response.data, ...prev]);
      }

      toast({
        title: 'Item creado',
        description: 'El item se ha agregado al inventario correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el item.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Update an inventory item
   */
  const updateItem = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/medicamentos/inventario/${id}`, data);

      if (response.data) {
        setInventario(prev =>
          prev.map(item => item.id === id ? response.data : item)
        );
      }

      toast({
        title: 'Item actualizado',
        description: 'El item se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

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
  }, [toast]);

  /**
   * Delete an inventory item
   */
  const deleteItem = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/medicamentos/inventario/${id}`);

      setInventario(prev => prev.filter(item => item.id !== id));

      toast({
        title: 'Item eliminado',
        description: 'El item se ha eliminado del inventario correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

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
  }, [toast]);

  /**
   * Recalculate alerts for all items (admin action)
   */
  const recalcularAlertas = useCallback(async () => {
    try {
      const response = await apiPost('/calidad2/medicamentos/inventario/recalcular-alertas', {});

      toast({
        title: 'Alertas recalculadas',
        description: `Se recalcularon ${response.data.successful} alertas exitosamente.`,
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      // Refresh inventory to get updated alert flags
      await loadInventario();

      return response.data;
    } catch (error) {
      console.error('Error recalculando alertas:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron recalcular las alertas.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast, loadInventario]);

  /**
   * Calculate alerts for a specific item
   */
  const calcularAlertasItem = useCallback(async (id) => {
    try {
      const response = await apiPost(`/calidad2/medicamentos/inventario/${id}/calcular-alertas`, {});

      // Update the item in local state
      if (response.data) {
        setInventario(prev =>
          prev.map(item => {
            if (item.id === id) {
              return {
                ...item,
                diasParaVencer: response.data.diasParaVencer,
                tieneAlertaVencimiento: response.data.tieneAlertaVencimiento,
                tieneAlertaStock: response.data.tieneAlertaStock,
              };
            }
            return item;
          })
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error calculating alerts for item:', error);
      return null;
    }
  }, []);

  return {
    inventario,
    loading,
    estadisticas,
    loadInventario,
    getItem,
    getProximosVencer,
    getVencidos,
    getStockBajo,
    getEstadisticas,
    createItem,
    updateItem,
    deleteItem,
    recalcularAlertas,
    calcularAlertasItem,
  };
}
