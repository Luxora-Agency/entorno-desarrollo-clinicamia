import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useFarmacia() {
  const [productos, setProductos] = useState([]);
  const [stats, setStats] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    categoriaId: 'all',
    stockStatus: 'all', // all, low, available
    estado: 'all' // all, active, inactive
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // Construct query params
      const params = new URLSearchParams();
      params.append('limit', '1000'); // Temporary: fetch more items to allow client-side filtering
      if (filters.search) params.append('search', filters.search);
      if (filters.categoriaId && filters.categoriaId !== 'all') params.append('categoriaId', filters.categoriaId);
      if (filters.estado !== 'all') params.append('activo', filters.estado === 'active' ? 'true' : 'false');
      
      // Fetch products
      const productosRes = await fetch(`${apiUrl}/productos?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productosData = await productosRes.json();
      
      let filteredProductos = productosData.data || [];

      // Client-side filtering for stock status (since backend might not support it yet directly via query param or we want to reuse existing endpoint)
      if (filters.stockStatus === 'low') {
        filteredProductos = filteredProductos.filter(p => {
             const disponible = p.cantidadTotal - p.cantidadConsumida;
             return disponible < p.cantidadMinAlerta;
        });
      } else if (filters.stockStatus === 'available') {
        filteredProductos = filteredProductos.filter(p => {
            const disponible = p.cantidadTotal - p.cantidadConsumida;
            return disponible > 0;
       });
      }

      setProductos(filteredProductos);

      // Fetch stats
      const statsRes = await fetch(`${apiUrl}/productos/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      setStats(statsData.data);
      
      // Fetch categories if not loaded
      if (categorias.length === 0) {
          const catRes = await fetch(`${apiUrl}/categorias-productos`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const catData = await catRes.json();
          setCategorias(catData.data || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de farmacia.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]); // Removed categorias dependency to avoid infinite loop if logic changes

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteProducto = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/productos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
            title: "Producto eliminado",
            description: "El producto ha sido marcado como inactivo.",
            className: "bg-green-50 border-green-200 text-green-800"
        });
        loadData();
        return true;
      } else {
        throw new Error('Error deleting');
      }
    } catch (error) {
      console.error('Error deleting producto:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    productos,
    stats,
    categorias,
    loading,
    filters,
    setFilters,
    refresh: loadData,
    deleteProducto
  };
}
