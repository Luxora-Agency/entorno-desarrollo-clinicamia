import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useOrdenesMedicamentos() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: 'Pendiente', // Default to pending
    search: '',
  });
  const { toast } = useToast();

  const loadOrdenes = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const params = new URLSearchParams();
      if (filters.estado && filters.estado !== 'all') params.append('estado', filters.estado);
      
      const response = await fetch(`${apiUrl}/ordenes-medicamentos?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOrdenes(data.data || []);
      } else {
        throw new Error(data.message || 'Error al cargar órdenes');
      }
    } catch (error) {
      console.error('Error loading ordenes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes de medicamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadOrdenes();
  }, [loadOrdenes]);

  const despacharOrden = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/ordenes-medicamentos/${id}/despachar`, {
        method: 'POST',
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
            title: "Orden Despachada",
            description: "Los medicamentos han sido descontados del inventario.",
            className: "bg-green-50 border-green-200 text-green-800"
        });
        loadOrdenes();
        return true;
      } else {
        throw new Error(data.message || data.error || 'Error al despachar orden');
      }
    } catch (error) {
      console.error('Error dispatching orden:', error);
      toast({
        title: "Error al despachar",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    ordenes,
    loading,
    filters,
    setFilters,
    refresh: loadOrdenes,
    despacharOrden
  };
}
