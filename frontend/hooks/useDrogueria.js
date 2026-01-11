import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/services/api';

const BASE_URL = '/drogueria';

export function useDrogueria() {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await apiGet(`${BASE_URL}/dashboard/stats`);
      setDashboardStats(res.data);
      return res.data;
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCajaActiva = useCallback(async () => {
    try {
      const res = await apiGet(`${BASE_URL}/caja/activa`);
      setCajaActiva(res.data);
      return res.data;
    } catch (err) {
      console.error(err);
    }
  }, []);

  const abrirCaja = async (montoInicial) => {
    try {
      const res = await apiPost(`${BASE_URL}/caja/abrir`, { montoInicial });
      setCajaActiva(res.data);
      toast({ title: "Caja Abierta", description: `Iniciada con ${montoInicial}` });
      return res.data;
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const cerrarCaja = async (montoFinal) => {
    try {
      const res = await apiPost(`${BASE_URL}/caja/cerrar/${cajaActiva.id}`, { montoFinal });
      setCajaActiva(null);
      toast({ title: "Caja Cerrada", description: `Total ventas procesadas` });
      return res.data;
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const fetchProductos = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      const res = await apiGet(`${BASE_URL}/productos?${query}`);
      setProductos(res.data);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertProducto = async (data) => {
    try {
      const res = await apiPost(`${BASE_URL}/productos`, data);
      toast({ title: "Producto Guardado", description: "El catálogo ha sido actualizado." });
      return res.data;
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const deleteProducto = async (id) => {
    try {
      await apiDelete(`${BASE_URL}/productos/${id}`);
      toast({ title: "Producto Eliminado", description: "El item ha sido removido del catálogo." });
      fetchProductos();
      return true;
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const registrarVenta = async (ventaData) => {
    try {
      const res = await apiPost(`${BASE_URL}/ventas`, {
        ...ventaData,
        cajaId: cajaActiva?.id
      });
      toast({ 
        title: "Venta Exitosa", 
        description: `Factura ${res.data.numeroFactura} generada.`,
        className: "bg-green-50 border-green-200"
      });
      return res.data;
    } catch (err) {
      toast({ title: "Error en venta", description: err.message, variant: "destructive" });
    }
  };

  const anularVenta = async (id, motivo) => {
    try {
      const res = await apiPost(`${BASE_URL}/ventas/${id}/anular`, { motivo });
      toast({ title: "Venta Anulada", description: "El stock ha sido devuelto al inventario." });
      return res.data;
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const fetchVentas = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      const res = await apiGet(`${BASE_URL}/ventas?${query}`);
      setVentas(res.data);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const importarDesdeFarmacia = async (productoIds) => {
    try {
      const res = await apiPost(`${BASE_URL}/productos/importar`, { productoIds });
      toast({ title: "Importación completa", description: `${res.data.length} productos agregados.` });
      fetchProductos();
      return res.data;
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return {
    productos,
    ventas,
    dashboardStats,
    cajaActiva,
    loading,
    fetchCajaActiva,
    fetchDashboardStats,
    abrirCaja,
    cerrarCaja,
    fetchProductos,
    upsertProducto,
    deleteProducto,
    registrarVenta,
    anularVenta,
    fetchVentas,
    importarDesdeFarmacia
  };
}
