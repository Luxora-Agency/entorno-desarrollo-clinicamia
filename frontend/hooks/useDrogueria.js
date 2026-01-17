import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiDelete } from '@/services/api';

const BASE_URL = '/drogueria';

export function useDrogueria() {
  const [productos, setProductos] = useState([]);
  const [productosFarmacia, setProductosFarmacia] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [cajaDetalle, setCajaDetalle] = useState(null);
  const [cajasAbiertas, setCajasAbiertas] = useState([]);
  const [historialCajas, setHistorialCajas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
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

  const abrirCaja = async (montoInicial, nombreCaja = 'Caja Principal') => {
    try {
      const res = await apiPost(`${BASE_URL}/caja/abrir`, { montoInicial, nombreCaja });
      setCajaActiva(res.data);
      toast({
        title: "Caja Abierta",
        description: `${nombreCaja} iniciada con $${montoInicial.toLocaleString()}`,
        className: "bg-green-50 border-green-200"
      });
      return res.data;
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      throw err;
    }
  };

  const cerrarCaja = async (montoFinal, observaciones = '') => {
    if (!cajaActiva) {
      toast({ title: "Error", description: "No hay caja activa", variant: "destructive" });
      return;
    }
    try {
      const res = await apiPost(`${BASE_URL}/caja/cerrar/${cajaActiva.id}`, { montoFinal, observaciones });
      setCajaActiva(null);
      toast({
        title: "Caja Cerrada",
        description: `${res.data.resumen?.cantidadVentas || 0} ventas procesadas`,
        className: "bg-blue-50 border-blue-200"
      });
      return res.data;
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      throw err;
    }
  };

  const fetchCajasAbiertas = useCallback(async () => {
    try {
      const res = await apiGet(`${BASE_URL}/caja/abiertas`);
      setCajasAbiertas(res.data || []);
      return res.data;
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCajaDetalle = useCallback(async (cajaId) => {
    try {
      const res = await apiGet(`${BASE_URL}/caja/${cajaId}/detalle`);
      setCajaDetalle(res.data);
      return res.data;
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchHistorialCajas = useCallback(async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await apiGet(`${BASE_URL}/caja/historial?${query}`);
      setHistorialCajas(res.data || []);
      return res;
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchProductos = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      // Filtrar valores undefined, null y vacíos
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiGet(`${BASE_URL}/productos?${query}`);
      setProductos(res.data);
      if (res.pagination) setPagination(res.pagination);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await apiGet(`${BASE_URL}/categorias`);
      setCategorias(res.data || []);
      return res.data;
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchProductosFarmacia = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      const res = await apiGet(`${BASE_URL}/farmacia/productos?${query}`);
      setProductosFarmacia(res.data || []);
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

  const importarTodosPBS = async () => {
    setLoading(true);
    try {
      const res = await apiPost(`${BASE_URL}/productos/importar-todos`);
      toast({
        title: "Importación Masiva Completa",
        description: `${res.data.productos} productos y ${res.data.presentaciones} presentaciones importadas.`,
        className: "bg-green-50 border-green-200"
      });
      fetchProductos();
      return res.data;
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Clientes
  const buscarClientePorCedula = async (cedula) => {
    try {
      const res = await apiGet(`${BASE_URL}/clientes/buscar/${cedula}`);
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const crearCliente = async (data) => {
    try {
      const res = await apiPost(`${BASE_URL}/clientes`, data);
      toast({
        title: "Cliente Creado",
        description: `${data.nombres} ${data.apellidos} registrado exitosamente`,
        className: "bg-green-50 border-green-200"
      });
      return res.data;
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      throw err;
    }
  };

  return {
    // Estados
    productos,
    productosFarmacia,
    categorias,
    ventas,
    dashboardStats,
    cajaActiva,
    cajaDetalle,
    cajasAbiertas,
    historialCajas,
    loading,
    pagination,
    // Caja
    fetchCajaActiva,
    fetchCajasAbiertas,
    fetchCajaDetalle,
    fetchHistorialCajas,
    abrirCaja,
    cerrarCaja,
    // Dashboard
    fetchDashboardStats,
    // Productos
    fetchProductos,
    fetchCategorias,
    fetchProductosFarmacia,
    upsertProducto,
    deleteProducto,
    importarDesdeFarmacia,
    importarTodosPBS,
    // Ventas
    registrarVenta,
    anularVenta,
    fetchVentas,
    // Clientes
    buscarClientePorCedula,
    crearCliente
  };
}
