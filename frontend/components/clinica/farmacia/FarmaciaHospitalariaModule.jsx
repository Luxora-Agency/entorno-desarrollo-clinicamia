'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Pill, Package, AlertTriangle, Clock, TrendingUp,
  Activity, RefreshCw, Search, Filter, Plus, Eye,
  Calendar, Thermometer, AlertCircle, CheckCircle2,
  XCircle, ArrowUpCircle, ArrowDownCircle, FileText,
  Users, Clipboard, BarChart3, Bell, Boxes, Timer,
  Edit, Trash2, ArrowRightLeft, LogOut, LogIn,
  ClipboardList, History, Send, PackagePlus, PackageMinus,
  FileSpreadsheet, Download, Upload, Hash, Home, DollarSign
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import ProductoModal from '../ProductoModal';

// Helpers
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price || 0);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  ,
      timeZone: 'America/Bogota'
    });
};

const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  ,
      timeZone: 'America/Bogota'
    });
};

const getDiasVencimiento = (fechaVencimiento) => {
  if (!fechaVencimiento) return null;
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diffTime = vencimiento - hoy;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getSemaforoColor = (diasVencimiento) => {
  if (diasVencimiento === null) return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Sin fecha' };
  if (diasVencimiento <= 0) return { bg: 'bg-red-100', text: 'text-red-700', label: 'Vencido', icon: XCircle };
  if (diasVencimiento <= 30) return { bg: 'bg-red-100', text: 'text-red-700', label: 'Crítico', icon: AlertCircle };
  if (diasVencimiento <= 90) return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Por vencer', icon: AlertTriangle };
  if (diasVencimiento <= 180) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Atención', icon: Clock };
  return { bg: 'bg-green-100', text: 'text-green-700', label: 'OK', icon: CheckCircle2 };
};

const getStockStatus = (disponible, minimo, maximo) => {
  if (disponible <= 0) return { bg: 'bg-red-100', text: 'text-red-700', label: 'Agotado', icon: XCircle };
  if (disponible < minimo) return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Bajo Stock', icon: ArrowDownCircle };
  if (maximo && disponible > maximo) return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Exceso', icon: ArrowUpCircle };
  return { bg: 'bg-green-100', text: 'text-green-700', label: 'Normal', icon: CheckCircle2 };
};

// Tipos de movimiento
const TIPOS_MOVIMIENTO = {
  ENTRADA: { label: 'Entrada', color: 'bg-green-100 text-green-700', icon: LogIn },
  SALIDA: { label: 'Salida', color: 'bg-red-100 text-red-700', icon: LogOut },
  AJUSTE_POSITIVO: { label: 'Ajuste +', color: 'bg-blue-100 text-blue-700', icon: ArrowUpCircle },
  AJUSTE_NEGATIVO: { label: 'Ajuste -', color: 'bg-orange-100 text-orange-700', icon: ArrowDownCircle },
  DISPENSACION: { label: 'Dispensación', color: 'bg-purple-100 text-purple-700', icon: Pill },
  DEVOLUCION: { label: 'Devolución', color: 'bg-teal-100 text-teal-700', icon: ArrowRightLeft },
  TRANSFERENCIA: { label: 'Transferencia', color: 'bg-indigo-100 text-indigo-700', icon: Send }
};

export default function FarmaciaHospitalariaModule({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Data states
  const [productos, setProductos] = useState([]);
  const [stats, setStats] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [prescripcionesPendientes, setPrescripcionesPendientes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterSemaforo, setFilterSemaforo] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [filterMovimiento, setFilterMovimiento] = useState('all');

  // Modal states
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPrescripcion, setSelectedPrescripcion] = useState(null);
  const [isDispensarModalOpen, setIsDispensarModalOpen] = useState(false);

  // Nuevo Producto Modal
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);

  // Ajuste de Inventario Modal
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({
    productoId: '',
    tipo: 'AJUSTE_POSITIVO',
    cantidad: '',
    motivo: '',
    lote: '',
    fechaVencimiento: ''
  });

  // Salida de Inventario Modal
  const [isSalidaModalOpen, setIsSalidaModalOpen] = useState(false);
  const [salidaForm, setSalidaForm] = useState({
    productoId: '',
    cantidad: '',
    destino: '',
    motivo: '',
    solicitante: ''
  });

  // Solicitud Modal
  const [isSolicitudModalOpen, setIsSolicitudModalOpen] = useState(false);
  const [solicitudForm, setSolicitudForm] = useState({
    productoId: '',
    cantidad: '',
    urgencia: 'normal',
    motivo: '',
    departamento: ''
  });

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const [productosRes, statsRes, catRes, prescRes] = await Promise.all([
        fetch(`${apiUrl}/productos?limit=1000&incluirLotes=true`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/productos/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/categorias-productos`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/prescripciones?estado=Activa&limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [productosData, statsData, catData, prescData] = await Promise.all([
        productosRes.json(),
        statsRes.json(),
        catRes.json(),
        prescRes.json()
      ]);

      setProductos(productosData.data || []);
      setStats(statsData.data);
      setCategorias(catData.data || []);
      setPrescripcionesPendientes(prescData.data || []);
      generateAlertas(productosData.data || []);

      // Generar movimientos de ejemplo (en producción vendrían del backend)
      generateMovimientosEjemplo(productosData.data || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Generate alerts from productos
  const generateAlertas = (prods) => {
    const alertasList = [];
    prods.forEach(prod => {
      const disponible = (prod.cantidadTotal || 0) - (prod.cantidadConsumida || 0);
      const minimo = prod.cantidadMinAlerta || 10;
      const maximo = prod.cantidadMaxAlerta;

      if (disponible < minimo && disponible > 0) {
        alertasList.push({
          id: `stock-bajo-${prod.id}`,
          tipo: 'stock_bajo',
          severidad: 'warning',
          producto: prod,
          mensaje: `Stock bajo: ${disponible} unidades (mínimo: ${minimo})`,
          fecha: new Date()
        });
      }
      if (disponible <= 0) {
        alertasList.push({
          id: `agotado-${prod.id}`,
          tipo: 'agotado',
          severidad: 'critical',
          producto: prod,
          mensaje: `Producto agotado`,
          fecha: new Date()
        });
      }
      if (maximo && disponible > maximo) {
        alertasList.push({
          id: `exceso-${prod.id}`,
          tipo: 'exceso',
          severidad: 'info',
          producto: prod,
          mensaje: `Exceso de stock: ${disponible} unidades (máximo: ${maximo})`,
          fecha: new Date()
        });
      }
      const fechaVenc = prod.fechaVencimiento || prod.lotes?.[0]?.fechaVencimiento;
      if (fechaVenc) {
        const dias = getDiasVencimiento(fechaVenc);
        if (dias !== null && dias <= 90) {
          alertasList.push({
            id: `vencimiento-${prod.id}`,
            tipo: dias <= 0 ? 'vencido' : 'por_vencer',
            severidad: dias <= 0 ? 'critical' : dias <= 30 ? 'critical' : 'warning',
            producto: prod,
            mensaje: dias <= 0 ? 'Producto vencido' : `Vence en ${dias} días`,
            fecha: new Date(),
            diasVencimiento: dias
          });
        }
      }
    });
    alertasList.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severidad] - severityOrder[b.severidad];
    });
    setAlertas(alertasList);
  };

  // Generar movimientos de ejemplo
  const generateMovimientosEjemplo = (prods) => {
    const movList = [];
    const tipos = Object.keys(TIPOS_MOVIMIENTO);
    const ahora = new Date();

    prods.slice(0, 20).forEach((prod, idx) => {
      const tipoRandom = tipos[Math.floor(Math.random() * tipos.length)];
      movList.push({
        id: `mov-${idx}`,
        producto: prod,
        tipo: tipoRandom,
        cantidad: Math.floor(Math.random() * 50) + 1,
        fecha: new Date(ahora.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        usuario: user?.nombre || 'Sistema',
        motivo: 'Movimiento de inventario',
        lote: prod.lotes?.[0]?.numero || `LOT-${Math.floor(Math.random() * 10000)}`
      });
    });

    movList.sort((a, b) => b.fecha - a.fecha);
    setMovimientos(movList);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter productos
  const filteredProductos = productos.filter(prod => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        prod.nombre?.toLowerCase().includes(search) ||
        prod.codigoBarras?.toLowerCase().includes(search) ||
        prod.principioActivo?.toLowerCase().includes(search) ||
        prod.sku?.toLowerCase().includes(search) ||
        prod.laboratorio?.toLowerCase().includes(search) ||
        prod.registroSanitario?.toLowerCase().includes(search) ||
        prod.cum?.toLowerCase().includes(search) ||
        prod.codigoAtc?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    if (filterCategoria !== 'all' && prod.categoriaId !== filterCategoria) return false;

    const disponible = (prod.cantidadTotal || 0) - (prod.cantidadConsumida || 0);
    const minimo = prod.cantidadMinAlerta || 10;
    const maximo = prod.cantidadMaxAlerta;

    if (filterStock === 'bajo' && disponible >= minimo) return false;
    if (filterStock === 'agotado' && disponible > 0) return false;
    if (filterStock === 'exceso' && (!maximo || disponible <= maximo)) return false;
    if (filterStock === 'normal') {
      if (disponible < minimo || disponible <= 0 || (maximo && disponible > maximo)) return false;
    }

    const fechaVenc = prod.fechaVencimiento || prod.lotes?.[0]?.fechaVencimiento;
    const dias = getDiasVencimiento(fechaVenc);
    if (filterSemaforo === 'vencido' && (dias === null || dias > 0)) return false;
    if (filterSemaforo === 'critico' && (dias === null || dias <= 0 || dias > 30)) return false;
    if (filterSemaforo === 'por_vencer' && (dias === null || dias <= 30 || dias > 90)) return false;
    if (filterSemaforo === 'atencion' && (dias === null || dias <= 90 || dias > 180)) return false;

    return true;
  });

  // Filter movimientos
  const filteredMovimientos = movimientos.filter(mov => {
    if (filterMovimiento !== 'all' && mov.tipo !== filterMovimiento) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!mov.producto?.nombre?.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  // Dashboard stats
  const dashboardStats = {
    totalProductos: productos.length,
    valorInventario: productos.reduce((sum, p) => {
      const disponible = (p.cantidadTotal || 0) - (p.cantidadConsumida || 0);
      return sum + (disponible * (p.precio || 0));
    }, 0),
    productosAgotados: productos.filter(p => ((p.cantidadTotal || 0) - (p.cantidadConsumida || 0)) <= 0).length,
    productosBajoStock: productos.filter(p => {
      const disponible = (p.cantidadTotal || 0) - (p.cantidadConsumida || 0);
      return disponible > 0 && disponible < (p.cantidadMinAlerta || 10);
    }).length,
    productosExceso: productos.filter(p => {
      const disponible = (p.cantidadTotal || 0) - (p.cantidadConsumida || 0);
      return p.cantidadMaxAlerta && disponible > p.cantidadMaxAlerta;
    }).length,
    productosPorVencer: productos.filter(p => {
      const dias = getDiasVencimiento(p.fechaVencimiento || p.lotes?.[0]?.fechaVencimiento);
      return dias !== null && dias > 0 && dias <= 90;
    }).length,
    prescripcionesPendientes: prescripcionesPendientes.length,
    alertasCriticas: alertas.filter(a => a.severidad === 'critical').length,
    movimientosHoy: movimientos.filter(m => {
      const hoy = new Date();
      return m.fecha.toDateString() === hoy.toDateString();
    }).length
  };

  // Handlers
  const handleDispensarPrescripcion = (prescripcion) => {
    setSelectedPrescripcion(prescripcion);
    setIsDispensarModalOpen(true);
  };

  const confirmarDispensacion = async () => {
    if (!selectedPrescripcion) return;
    toast({
      title: 'Dispensación registrada',
      description: 'Los medicamentos han sido despachados correctamente',
      className: 'bg-green-50 border-green-200'
    });
    setIsDispensarModalOpen(false);
    setSelectedPrescripcion(null);
    loadData();
  };

  const handleNuevoProducto = () => {
    setEditingProducto(null);
    setIsProductoModalOpen(true);
  };

  const handleEditarProducto = (producto) => {
    setEditingProducto(producto);
    setIsProductoModalOpen(true);
  };

  // Cargar detalles completos del producto (incluyendo presentaciones)
  const handleVerDetalleProducto = async (producto) => {
    setSelectedProducto(producto); // Mostrar datos básicos inmediatamente
    setIsDetailModalOpen(true);

    // Cargar detalles completos incluyendo presentaciones
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/productos/${producto.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setSelectedProducto(data.data);
      }
    } catch (error) {
      console.error('Error loading product details:', error);
    }
  };

  const handleAjusteInventario = (producto = null) => {
    setAjusteForm({
      productoId: producto?.id || '',
      tipo: 'AJUSTE_POSITIVO',
      cantidad: '',
      motivo: '',
      lote: '',
      fechaVencimiento: ''
    });
    setIsAjusteModalOpen(true);
  };

  const confirmarAjuste = async () => {
    if (!ajusteForm.productoId || !ajusteForm.cantidad) {
      toast({ title: 'Error', description: 'Complete todos los campos requeridos', variant: 'destructive' });
      return;
    }

    // Aquí iría la llamada al backend
    const nuevoMov = {
      id: `mov-${Date.now()}`,
      producto: productos.find(p => p.id === ajusteForm.productoId),
      tipo: ajusteForm.tipo,
      cantidad: parseInt(ajusteForm.cantidad),
      fecha: new Date(),
      usuario: user?.nombre || 'Usuario',
      motivo: ajusteForm.motivo,
      lote: ajusteForm.lote
    };

    setMovimientos(prev => [nuevoMov, ...prev]);
    toast({
      title: 'Ajuste registrado',
      description: `Se registró ${ajusteForm.tipo === 'AJUSTE_POSITIVO' ? 'entrada' : 'salida'} de ${ajusteForm.cantidad} unidades`,
      className: 'bg-green-50 border-green-200'
    });
    setIsAjusteModalOpen(false);
  };

  const handleSalidaInventario = (producto = null) => {
    setSalidaForm({
      productoId: producto?.id || '',
      cantidad: '',
      destino: '',
      motivo: '',
      solicitante: ''
    });
    setIsSalidaModalOpen(true);
  };

  const confirmarSalida = async () => {
    if (!salidaForm.productoId || !salidaForm.cantidad || !salidaForm.destino) {
      toast({ title: 'Error', description: 'Complete todos los campos requeridos', variant: 'destructive' });
      return;
    }

    const nuevoMov = {
      id: `mov-${Date.now()}`,
      producto: productos.find(p => p.id === salidaForm.productoId),
      tipo: 'SALIDA',
      cantidad: parseInt(salidaForm.cantidad),
      fecha: new Date(),
      usuario: user?.nombre || 'Usuario',
      motivo: `Destino: ${salidaForm.destino}. ${salidaForm.motivo}`,
      lote: ''
    };

    setMovimientos(prev => [nuevoMov, ...prev]);
    toast({
      title: 'Salida registrada',
      description: `Se registró salida de ${salidaForm.cantidad} unidades hacia ${salidaForm.destino}`,
      className: 'bg-green-50 border-green-200'
    });
    setIsSalidaModalOpen(false);
  };

  const handleNuevaSolicitud = () => {
    setSolicitudForm({
      productoId: '',
      cantidad: '',
      urgencia: 'normal',
      motivo: '',
      departamento: ''
    });
    setIsSolicitudModalOpen(true);
  };

  const confirmarSolicitud = async () => {
    if (!solicitudForm.productoId || !solicitudForm.cantidad) {
      toast({ title: 'Error', description: 'Complete todos los campos requeridos', variant: 'destructive' });
      return;
    }

    const nuevaSolicitud = {
      id: `sol-${Date.now()}`,
      producto: productos.find(p => p.id === solicitudForm.productoId),
      cantidad: parseInt(solicitudForm.cantidad),
      urgencia: solicitudForm.urgencia,
      motivo: solicitudForm.motivo,
      departamento: solicitudForm.departamento,
      estado: 'Pendiente',
      fecha: new Date(),
      solicitante: user?.nombre || 'Usuario'
    };

    setSolicitudes(prev => [nuevaSolicitud, ...prev]);
    toast({
      title: 'Solicitud creada',
      description: 'La solicitud ha sido enviada para aprobación',
      className: 'bg-green-50 border-green-200'
    });
    setIsSolicitudModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Farmacia Hospitalaria</h1>
              <p className="text-sm text-gray-500">Gestión interna de medicamentos e insumos</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {dashboardStats.alertasCriticas > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                <Bell className="w-4 h-4 text-red-600 animate-pulse" />
                <span className="text-sm font-semibold text-red-700">{dashboardStats.alertasCriticas} alertas</span>
              </div>
            )}
            <Button onClick={handleNuevoProducto} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Plus className="w-4 h-4" /> Nuevo Producto
            </Button>
            <Button onClick={() => handleAjusteInventario()} variant="outline" className="gap-2">
              <ArrowRightLeft className="w-4 h-4" /> Ajuste
            </Button>
            <Button onClick={() => handleSalidaInventario()} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" /> Salida
            </Button>
            <Button onClick={loadData} variant="ghost" size="icon">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 overflow-x-auto">
          <TabsList className="h-12 bg-transparent gap-1 -mb-px inline-flex">
            <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-4 font-medium whitespace-nowrap">
              <BarChart3 className="w-4 h-4 mr-2" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="alertas" className="data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-red-700 rounded-none px-4 font-medium relative whitespace-nowrap">
              <Bell className="w-4 h-4 mr-2" /> Alertas
              {alertas.length > 0 && <Badge className="ml-2 bg-red-500 text-white text-xs">{alertas.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="prescripciones" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-none px-4 font-medium relative whitespace-nowrap">
              <FileText className="w-4 h-4 mr-2" /> Prescripciones
              {prescripcionesPendientes.length > 0 && <Badge className="ml-2 bg-blue-500 text-white text-xs">{prescripcionesPendientes.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="inventario" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-4 font-medium whitespace-nowrap">
              <Package className="w-4 h-4 mr-2" /> Inventario
            </TabsTrigger>
            <TabsTrigger value="movimientos" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 rounded-none px-4 font-medium whitespace-nowrap">
              <History className="w-4 h-4 mr-2" /> Movimientos
            </TabsTrigger>
            <TabsTrigger value="solicitudes" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-700 rounded-none px-4 font-medium whitespace-nowrap">
              <ClipboardList className="w-4 h-4 mr-2" /> Solicitudes
              {solicitudes.filter(s => s.estado === 'Pendiente').length > 0 && (
                <Badge className="ml-2 bg-purple-500 text-white text-xs">{solicitudes.filter(s => s.estado === 'Pendiente').length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="semaforizacion" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-600 data-[state=active]:text-orange-700 rounded-none px-4 font-medium whitespace-nowrap">
              <Timer className="w-4 h-4 mr-2" /> Semaforización
            </TabsTrigger>
            <TabsTrigger value="lotes" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 data-[state=active]:text-teal-700 rounded-none px-4 font-medium whitespace-nowrap">
              <Boxes className="w-4 h-4 mr-2" /> Lotes
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Productos</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalProductos}</p>
                      <p className="text-xs text-emerald-600 mt-1">En catálogo activo</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-xl"><Package className="w-8 h-8 text-emerald-600" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Valor Inventario</p>
                      <p className="text-2xl font-bold text-gray-900">{formatPrice(dashboardStats.valorInventario)}</p>
                      <p className="text-xs text-blue-600 mt-1">Costo total</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl"><TrendingUp className="w-8 h-8 text-blue-600" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Prescripciones</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardStats.prescripcionesPendientes}</p>
                      <p className="text-xs text-amber-600 mt-1">Pendientes</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-xl"><Clipboard className="w-8 h-8 text-amber-600" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Movimientos Hoy</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardStats.movimientosHoy}</p>
                      <p className="text-xs text-indigo-600 mt-1">Entradas/Salidas</p>
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-xl"><ArrowRightLeft className="w-8 h-8 text-indigo-600" /></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-red-200 bg-red-50/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setFilterStock('agotado'); setActiveTab('inventario'); }}>
                <CardContent className="p-4 text-center">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700">{dashboardStats.productosAgotados}</p>
                  <p className="text-sm text-red-600">Agotados</p>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setFilterStock('bajo'); setActiveTab('inventario'); }}>
                <CardContent className="p-4 text-center">
                  <ArrowDownCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-700">{dashboardStats.productosBajoStock}</p>
                  <p className="text-sm text-orange-600">Bajo Stock</p>
                </CardContent>
              </Card>
              <Card className="border-purple-200 bg-purple-50/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setFilterStock('exceso'); setActiveTab('inventario'); }}>
                <CardContent className="p-4 text-center">
                  <ArrowUpCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">{dashboardStats.productosExceso}</p>
                  <p className="text-sm text-purple-600">Exceso</p>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('semaforizacion')}>
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-700">{dashboardStats.productosPorVencer}</p>
                  <p className="text-sm text-yellow-600">Por Vencer</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-red-600" /> Alertas Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-auto">
                    {alertas.slice(0, 5).map(alerta => (
                      <div key={alerta.id} className={`p-3 rounded-lg border flex items-center gap-3 ${alerta.severidad === 'critical' ? 'bg-red-50 border-red-200' : alerta.severidad === 'warning' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                        {alerta.severidad === 'critical' ? <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{alerta.producto?.nombre}{alerta.producto?.concentracion && ` ${alerta.producto.concentracion}`}</p>
                          <p className="text-xs text-gray-600">{alerta.mensaje}</p>
                        </div>
                      </div>
                    ))}
                    {alertas.length === 0 && <div className="text-center py-8 text-gray-500"><CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" /><p>Sin alertas</p></div>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2"><History className="w-5 h-5 text-indigo-600" /> Últimos Movimientos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-auto">
                    {movimientos.slice(0, 5).map(mov => {
                      const tipoInfo = TIPOS_MOVIMIENTO[mov.tipo] || { label: mov.tipo, color: 'bg-gray-100 text-gray-700' };
                      return (
                        <div key={mov.id} className="p-3 rounded-lg border bg-white flex items-center gap-3">
                          <Badge className={tipoInfo.color}>{tipoInfo.label}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{mov.producto?.nombre}{mov.producto?.concentracion && ` ${mov.producto.concentracion}`}</p>
                            <p className="text-xs text-gray-500">{mov.cantidad} uds • {formatDateTime(mov.fecha)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ALERTAS */}
          <TabsContent value="alertas" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Centro de Alertas</CardTitle>
                <CardDescription>Monitoreo de stock, vencimientos y situaciones críticas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertas.map(alerta => (
                    <div key={alerta.id} className={`p-4 rounded-xl border-l-4 ${alerta.severidad === 'critical' ? 'bg-red-50 border-l-red-500' : alerta.severidad === 'warning' ? 'bg-orange-50 border-l-orange-500' : 'bg-blue-50 border-l-blue-500'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${alerta.severidad === 'critical' ? 'bg-red-100' : 'bg-orange-100'}`}>
                          <AlertCircle className={`w-5 h-5 ${alerta.severidad === 'critical' ? 'text-red-600' : 'text-orange-600'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{alerta.producto?.nombre}</h4>
                              {alerta.producto?.concentracion && <p className="text-xs text-gray-500">{alerta.producto.principioActivo} • {alerta.producto.concentracion}</p>}
                            </div>
                            <Badge className={alerta.severidad === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}>{alerta.tipo.replace('_', ' ').toUpperCase()}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alerta.mensaje}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { handleVerDetalleProducto(alerta.producto); }}><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {alertas.length === 0 && <div className="text-center py-12"><CheckCircle2 className="w-16 h-16 mx-auto text-green-400 mb-4" /><h3 className="text-lg font-medium">Todo en orden</h3></div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRESCRIPCIONES */}
          <TabsContent value="prescripciones" className="m-0">
            <Card>
              <CardHeader><CardTitle>Prescripciones Médicas Pendientes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prescripcionesPendientes.map(presc => (
                    <div key={presc.id} className="p-4 border rounded-xl bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600">
                            <AvatarFallback className="text-white font-semibold">{presc.paciente?.nombre?.[0]}{presc.paciente?.apellido?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-900">{presc.paciente?.nombre} {presc.paciente?.apellido}</h4>
                            <p className="text-sm text-gray-500">CC: {presc.paciente?.cedula} • Hab: {presc.admision?.cama?.habitacion?.nombre || 'Ambulatorio'}</p>
                            <Badge variant="outline" className="text-xs mt-1">{presc.medicamentos?.length || 0} medicamentos</Badge>
                          </div>
                        </div>
                        <Button onClick={() => handleDispensarPrescripcion(presc)} className="bg-emerald-600 hover:bg-emerald-700"><Pill className="w-4 h-4 mr-2" /> Dispensar</Button>
                      </div>
                    </div>
                  ))}
                  {prescripcionesPendientes.length === 0 && <div className="text-center py-12"><FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No hay prescripciones pendientes</p></div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INVENTARIO */}
          <TabsContent value="inventario" className="m-0">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div><CardTitle>Inventario de Medicamentos</CardTitle><CardDescription>Control de existencias y stock - {filteredProductos.length} productos</CardDescription></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[250px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input placeholder="Buscar por nombre, principio activo, SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Categoría" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {categorias.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterStock} onValueChange={setFilterStock}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Stock" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bajo">Bajo</SelectItem>
                        <SelectItem value="agotado">Agotado</SelectItem>
                        <SelectItem value="exceso">Exceso</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleNuevoProducto} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> Nuevo</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead className="bg-gray-50 border-y">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto / Principio Activo</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Concentración</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Forma Farm.</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Laboratorio</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Vence</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {filteredProductos.slice(0, 100).map(prod => {
                        const disponible = (prod.cantidadTotal || 0) - (prod.cantidadConsumida || 0);
                        const stockStatus = getStockStatus(disponible, prod.cantidadMinAlerta || 10, prod.cantidadMaxAlerta);
                        const diasVenc = getDiasVencimiento(prod.fechaVencimiento || prod.lotes?.[0]?.fechaVencimiento);
                        const semaforoStatus = getSemaforoColor(diasVenc);
                        const StockIcon = stockStatus.icon;
                        return (
                          <tr key={prod.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { handleVerDetalleProducto(prod); }}>
                            <td className="px-4 py-3">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{prod.nombre}</p>
                                  <p className="text-xs text-gray-500 truncate">{prod.principioActivo || '-'}</p>
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {prod.requiereReceta && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">Rx</span>}
                                    {prod.controlado && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">C{prod.tipoControlado}</span>}
                                    {prod.requiereCadenaFrio && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">❄️</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-sm font-medium text-gray-900">{prod.concentracion || '-'}</span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-gray-600 line-clamp-2">{prod.formaFarmaceutica || '-'}</span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-gray-600 line-clamp-2">{prod.laboratorio || '-'}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-lg font-bold ${disponible <= 0 ? 'text-red-600' : disponible < (prod.cantidadMinAlerta || 10) ? 'text-orange-600' : 'text-gray-900'}`}>{disponible}</span>
                                <span className="text-[10px] text-gray-400">mín: {prod.cantidadMinAlerta || 10}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Badge className={`${stockStatus.bg} ${stockStatus.text} text-xs gap-1`}>
                                <StockIcon className="w-3 h-3" />
                                {stockStatus.label}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {diasVenc !== null ? (
                                <div className="flex flex-col items-center">
                                  <Badge className={`${semaforoStatus.bg} ${semaforoStatus.text} text-xs`}>
                                    {diasVenc <= 0 ? 'Vencido' : `${diasVenc}d`}
                                  </Badge>
                                  <span className="text-[10px] text-gray-400 mt-0.5">{formatDate(prod.fechaVencimiento)}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="font-medium text-gray-900">${(prod.precioVenta || 0).toLocaleString()}</span>
                            </td>
                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-center gap-0.5">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { handleVerDetalleProducto(prod); }} title="Ver detalle">
                                  <Eye className="w-4 h-4 text-gray-500" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditarProducto(prod)} title="Editar">
                                  <Edit className="w-4 h-4 text-gray-500" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleAjusteInventario(prod)} title="Ajuste">
                                  <ArrowRightLeft className="w-4 h-4 text-gray-500" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleSalidaInventario(prod)} title="Salida">
                                  <LogOut className="w-4 h-4 text-gray-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredProductos.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No se encontraron productos</p>
                    </div>
                  )}
                  {filteredProductos.length > 100 && (
                    <div className="text-center py-4 bg-gray-50 border-t">
                      <p className="text-sm text-gray-500">Mostrando 100 de {filteredProductos.length} productos. Use los filtros para refinar la búsqueda.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MOVIMIENTOS (TRAZABILIDAD) */}
          <TabsContent value="movimientos" className="m-0">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div><CardTitle>Trazabilidad de Movimientos</CardTitle><CardDescription>Historial completo de entradas, salidas y ajustes</CardDescription></div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                    </div>
                    <Select value={filterMovimiento} onValueChange={setFilterMovimiento}>
                      <SelectTrigger className="w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {Object.entries(TIPOS_MOVIMIENTO).map(([key, val]) => <SelectItem key={key} value={key}>{val.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Exportar</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha/Hora</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lote</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredMovimientos.map(mov => {
                        const tipoInfo = TIPOS_MOVIMIENTO[mov.tipo] || { label: mov.tipo, color: 'bg-gray-100 text-gray-700' };
                        const IconComp = tipoInfo.icon || Activity;
                        return (
                          <tr key={mov.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(mov.fecha)}</td>
                            <td className="px-4 py-3"><Badge className={`${tipoInfo.color} gap-1`}><IconComp className="w-3 h-3" />{tipoInfo.label}</Badge></td>
                            <td className="px-4 py-3"><p className="font-medium text-gray-900">{mov.producto?.nombre}</p></td>
                            <td className="px-4 py-3 text-center font-semibold">{mov.cantidad}</td>
                            <td className="px-4 py-3 font-mono text-sm text-gray-600">{mov.lote || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{mov.usuario}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{mov.motivo}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SOLICITUDES */}
          <TabsContent value="solicitudes" className="m-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle>Solicitudes de Medicamentos</CardTitle><CardDescription>Gestión de pedidos internos de departamentos</CardDescription></div>
                  <Button onClick={handleNuevaSolicitud} className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-2" /> Nueva Solicitud</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {solicitudes.map(sol => (
                    <div key={sol.id} className="p-4 border rounded-xl bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${sol.urgencia === 'urgente' ? 'bg-red-100' : sol.urgencia === 'alta' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                            <ClipboardList className={`w-6 h-6 ${sol.urgencia === 'urgente' ? 'text-red-600' : sol.urgencia === 'alta' ? 'text-orange-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{sol.producto?.nombre}</h4>
                            <p className="text-sm text-gray-500">Cantidad: {sol.cantidad} • {sol.departamento}</p>
                            <p className="text-xs text-gray-400">Solicitado por {sol.solicitante} • {formatDateTime(sol.fecha)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={sol.urgencia === 'urgente' ? 'bg-red-100 text-red-700' : sol.urgencia === 'alta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>{sol.urgencia}</Badge>
                          <Badge variant="outline">{sol.estado}</Badge>
                          {sol.estado === 'Pendiente' && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">Aprobar</Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Rechazar</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {solicitudes.length === 0 && <div className="text-center py-12"><ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No hay solicitudes</p></div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEMAFORIZACIÓN */}
          <TabsContent value="semaforizacion" className="m-0">
            <Card>
              <CardHeader><CardTitle>Semaforización de Vencimientos</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'vencido', label: 'Vencidos', color: 'bg-red-100 text-red-700' },
                    { value: 'critico', label: '<30d', color: 'bg-red-100 text-red-700' },
                    { value: 'por_vencer', label: '30-90d', color: 'bg-orange-100 text-orange-700' },
                    { value: 'atencion', label: '90-180d', color: 'bg-yellow-100 text-yellow-700' }
                  ].map(f => (
                    <Button key={f.value} variant={filterSemaforo === f.value ? 'default' : 'outline'} size="sm" onClick={() => setFilterSemaforo(f.value)} className={filterSemaforo !== f.value && f.color ? f.color : ''}>{f.label}</Button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProductos.filter(p => { const d = getDiasVencimiento(p.fechaVencimiento || p.lotes?.[0]?.fechaVencimiento); return d !== null && d <= 180; }).sort((a, b) => (getDiasVencimiento(a.fechaVencimiento) || 999) - (getDiasVencimiento(b.fechaVencimiento) || 999)).slice(0, 30).map(prod => {
                    const dias = getDiasVencimiento(prod.fechaVencimiento || prod.lotes?.[0]?.fechaVencimiento);
                    const status = getSemaforoColor(dias);
                    const IconComp = status.icon || Clock;
                    return (
                      <div key={prod.id} className={`p-4 rounded-xl border-2 ${status.bg}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1"><h4 className="font-semibold text-gray-900 truncate">{prod.nombre}</h4><p className="text-xs text-gray-600">{prod.principioActivo}{prod.concentracion && ` • ${prod.concentracion}`}</p></div>
                          <div className={`p-2 rounded-lg ${status.bg}`}><IconComp className={`w-5 h-5 ${status.text}`} /></div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div><p className="text-xs text-gray-500">Vencimiento</p><p className="font-medium">{formatDate(prod.fechaVencimiento)}</p></div>
                          <Badge className={`${status.bg} ${status.text} text-sm px-3`}>{dias <= 0 ? 'VENCIDO' : `${dias} días`}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LOTES */}
          <TabsContent value="lotes" className="m-0">
            <Card>
              <CardHeader><CardTitle>Gestión de Lotes</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Boxes className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900">Gestión de Lotes</h3>
                  <p className="text-gray-500 mt-2">Control de lotes, números de serie y trazabilidad</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* MODALES */}

      {/* Modal Nuevo/Editar Producto */}
      <ProductoModal isOpen={isProductoModalOpen} onClose={() => setIsProductoModalOpen(false)} editingProducto={editingProducto} onSuccess={() => { setIsProductoModalOpen(false); loadData(); }} />

      {/* Modal Detalle Producto */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Pill className="w-5 h-5 text-emerald-600" />
                  </div>
                  {selectedProducto?.nombre}
                </DialogTitle>
                {selectedProducto?.descripcion && (
                  <p className="text-sm text-gray-500 mt-1 ml-11">{selectedProducto.descripcion}</p>
                )}
              </div>
            </div>
          </DialogHeader>
          {selectedProducto && (
            <div className="space-y-6 pt-4">
              {/* Badges de estado */}
              <div className="flex flex-wrap gap-2">
                {selectedProducto.requiereReceta && (
                  <Badge className="bg-orange-100 text-orange-700 px-3 py-1">
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Requiere Receta Médica
                  </Badge>
                )}
                {selectedProducto.controlado && (
                  <Badge className="bg-red-100 text-red-700 px-3 py-1">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Medicamento Controlado {selectedProducto.tipoControlado && `- Grupo ${selectedProducto.tipoControlado}`}
                  </Badge>
                )}
                {selectedProducto.requiereCadenaFrio && (
                  <Badge className="bg-blue-100 text-blue-700 px-3 py-1">
                    <Thermometer className="w-3.5 h-3.5 mr-1.5" /> Cadena de Frío
                  </Badge>
                )}
                {selectedProducto.activo ? (
                  <Badge className="bg-green-100 text-green-700 px-3 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Activo
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-700 px-3 py-1">Inactivo</Badge>
                )}
              </div>

              {/* Stock y Precios - Cards destacadas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 text-center border border-emerald-200 shadow-sm">
                  <p className="text-xs text-emerald-600 uppercase font-semibold tracking-wider">Disponible</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">{(selectedProducto.cantidadTotal || 0) - (selectedProducto.cantidadConsumida || 0)}</p>
                  <p className="text-[10px] text-gray-500 mt-1">unidades</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-200 shadow-sm">
                  <p className="text-xs text-blue-600 uppercase font-semibold tracking-wider">Stock Mín</p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">{selectedProducto.cantidadMinAlerta || 10}</p>
                  <p className="text-[10px] text-gray-500 mt-1">alerta</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 text-center border border-purple-200 shadow-sm">
                  <p className="text-xs text-purple-600 uppercase font-semibold tracking-wider">Stock Máx</p>
                  <p className="text-3xl font-bold text-purple-700 mt-1">{selectedProducto.cantidadMaxAlerta || '-'}</p>
                  <p className="text-[10px] text-gray-500 mt-1">límite</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 text-center border border-amber-200 shadow-sm">
                  <p className="text-xs text-amber-600 uppercase font-semibold tracking-wider">Precio Venta</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">${(selectedProducto.precioVenta || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 mt-1">COP</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 text-center border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-600 uppercase font-semibold tracking-wider">Precio Compra</p>
                  <p className="text-2xl font-bold text-gray-700 mt-1">${(selectedProducto.precioCompra || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 mt-1">COP</p>
                </div>
              </div>

              {/* Información Farmacológica */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Pill className="w-4 h-4" /> Información Farmacológica
                  </h4>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Principio Activo</p>
                      <p className="font-semibold text-gray-900">{selectedProducto.principioActivo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Concentración</p>
                      <p className="font-semibold text-gray-900">{selectedProducto.concentracion || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Forma Farmacéutica</p>
                      <p className="font-semibold text-gray-900">{selectedProducto.formaFarmaceutica || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Unidad de Medida</p>
                      <p className="font-semibold text-gray-900">{selectedProducto.unidadMedida || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Vía Administración</p>
                      <p className="font-semibold text-gray-900">{selectedProducto.viaAdministracion || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Presentación</p>
                      <p className="font-semibold text-gray-900 text-sm">{selectedProducto.presentacion || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Códigos e Identificación */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Hash className="w-4 h-4" /> Códigos e Identificación INVIMA
                  </h4>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">SKU</p>
                      <p className="font-mono font-semibold text-gray-900">{selectedProducto.sku || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Código de Barras</p>
                      <p className="font-mono font-semibold text-gray-900">{selectedProducto.codigoBarras || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Código ATC</p>
                      <p className="font-mono font-semibold text-blue-700">{selectedProducto.codigoAtc || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">CUM (Expediente)</p>
                      <p className="font-mono font-semibold text-blue-700">{selectedProducto.cum || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Registro Sanitario (INVIMA)</p>
                      <p className="font-mono font-semibold text-emerald-700 text-lg">{selectedProducto.registroSanitario || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Laboratorio / Titular</p>
                      <p className="font-semibold text-gray-900">{selectedProducto.laboratorio || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Almacenamiento y Lote */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2.5">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Home className="w-4 h-4" /> Almacenamiento y Lote
                  </h4>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Temperatura</p>
                      <p className="font-semibold text-gray-900 text-sm">{selectedProducto.temperaturaAlmacenamiento || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Ubicación Almacén</p>
                      <p className="font-semibold text-gray-900">{selectedProducto.ubicacionAlmacen || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Lote Actual</p>
                      <p className="font-mono font-semibold text-gray-900">{selectedProducto.lote || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Fecha Vencimiento</p>
                      {selectedProducto.fechaVencimiento ? (
                        <div>
                          <p className="font-semibold text-gray-900">{formatDate(selectedProducto.fechaVencimiento)}</p>
                          {(() => {
                            const dias = getDiasVencimiento(selectedProducto.fechaVencimiento);
                            const status = getSemaforoColor(dias);
                            return (
                              <Badge className={`${status.bg} ${status.text} text-xs mt-1`}>
                                {dias <= 0 ? 'VENCIDO' : `${dias} días`}
                              </Badge>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className="font-semibold text-gray-900">-</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lotes activos si existen */}
              {selectedProducto.lotes && selectedProducto.lotes.length > 0 && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-violet-600 px-4 py-2.5">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Boxes className="w-4 h-4" /> Lotes Activos ({selectedProducto.lotes.length})
                    </h4>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {selectedProducto.lotes.map((lote, idx) => {
                        const diasLote = getDiasVencimiento(lote.fechaVencimiento);
                        const statusLote = getSemaforoColor(diasLote);
                        return (
                          <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${statusLote.bg}`}>
                            <div className="flex items-center gap-4">
                              <span className="font-mono font-semibold text-gray-900">{lote.numero}</span>
                              <span className="text-sm text-gray-600">Vence: {formatDate(lote.fechaVencimiento)}</span>
                              <Badge className={`${statusLote.bg} ${statusLote.text} text-xs`}>
                                {diasLote <= 0 ? 'VENCIDO' : `${diasLote}d`}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="font-semibold">{lote.cantidadActual} unidades</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Presentaciones / Variaciones del producto */}
              {selectedProducto.presentaciones && selectedProducto.presentaciones.length > 0 && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-teal-600 px-4 py-2.5">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Package className="w-4 h-4" /> Presentaciones Disponibles ({selectedProducto.presentaciones.length})
                    </h4>
                  </div>
                  <div className="p-4">
                    <div className="grid gap-3">
                      {selectedProducto.presentaciones.map((pres, idx) => {
                        const stockStatus = getStockStatus(pres.cantidadTotal, pres.cantidadMinimaAlerta, pres.cantidadMaximaAlerta);
                        const StockIcon = stockStatus.icon;
                        return (
                          <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-cyan-100 text-cyan-700 font-bold text-sm px-3">
                                    {pres.concentracion}
                                  </Badge>
                                  {pres.formaFarmaceutica && (
                                    <Badge variant="outline" className="text-xs">
                                      {pres.formaFarmaceutica}
                                    </Badge>
                                  )}
                                  {pres.esPredeterminada && (
                                    <Badge className="bg-amber-100 text-amber-700 text-xs">
                                      Predeterminada
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{pres.nombre}</p>
                                <p className="text-xs text-gray-400 font-mono">SKU: {pres.sku}</p>
                                {pres.registroSanitario && (
                                  <p className="text-xs text-emerald-600 mt-1">INVIMA: {pres.registroSanitario}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${stockStatus.bg}`}>
                                  <StockIcon className={`w-4 h-4 ${stockStatus.text}`} />
                                  <span className={`font-bold ${stockStatus.text}`}>{pres.cantidadTotal}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Alerta: {pres.cantidadMinimaAlerta}</p>
                                {pres.precioVenta > 0 && (
                                  <p className="text-sm font-semibold text-gray-900 mt-2">
                                    ${pres.precioVenta.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Lotes de la presentación */}
                            {pres.lotes && pres.lotes.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-2">Lotes activos:</p>
                                <div className="flex flex-wrap gap-2">
                                  {pres.lotes.map((lote, loteIdx) => {
                                    const diasLote = getDiasVencimiento(lote.fechaVencimiento);
                                    const statusLote = getSemaforoColor(diasLote);
                                    return (
                                      <div key={loteIdx} className={`text-xs px-2 py-1 rounded ${statusLote.bg} ${statusLote.text}`}>
                                        {lote.numeroLote}: {lote.cantidadActual} und | Vence: {formatDate(lote.fechaVencimiento)}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => handleEditarProducto(selectedProducto)} className="gap-2">
                  <Edit className="w-4 h-4" /> Editar Producto
                </Button>
                <Button variant="outline" onClick={() => handleAjusteInventario(selectedProducto)} className="gap-2">
                  <ArrowRightLeft className="w-4 h-4" /> Ajuste de Stock
                </Button>
                <Button variant="outline" onClick={() => handleSalidaInventario(selectedProducto)} className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50">
                  <LogOut className="w-4 h-4" /> Registrar Salida
                </Button>
                <Button onClick={() => setIsDetailModalOpen(false)} className="bg-gray-900 hover:bg-gray-800">
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Dispensación */}
      <Dialog open={isDispensarModalOpen} onOpenChange={setIsDispensarModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle><Pill className="w-5 h-5 text-emerald-600 inline mr-2" /> Dispensar Prescripción</DialogTitle></DialogHeader>
          {selectedPrescripcion && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12 bg-blue-600"><AvatarFallback className="text-white font-semibold">{selectedPrescripcion.paciente?.nombre?.[0]}{selectedPrescripcion.paciente?.apellido?.[0]}</AvatarFallback></Avatar>
                <div><h4 className="font-semibold">{selectedPrescripcion.paciente?.nombre} {selectedPrescripcion.paciente?.apellido}</h4><p className="text-sm text-gray-600">CC: {selectedPrescripcion.paciente?.cedula}</p></div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Medicamentos:</h4>
                <div className="space-y-2">
                  {selectedPrescripcion.medicamentos?.map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3"><Pill className="w-5 h-5 text-emerald-600" /><div><p className="font-medium">{med.producto?.nombre || med.nombreMedicamento}{med.producto?.concentracion && ` ${med.producto.concentracion}`}</p><p className="text-sm text-gray-500">{med.dosis} • {med.frecuencia}</p></div></div>
                      <Badge variant="outline">{med.cantidadTotal || 1} uds</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setIsDispensarModalOpen(false)}>Cancelar</Button><Button onClick={confirmarDispensacion} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Ajuste Inventario */}
      <Dialog open={isAjusteModalOpen} onOpenChange={setIsAjusteModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle><ArrowRightLeft className="w-5 h-5 text-blue-600 inline mr-2" /> Ajuste de Inventario</DialogTitle><DialogDescription>Registre entradas o ajustes de stock</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Producto *</Label>
              <Select value={ajusteForm.productoId} onValueChange={(v) => setAjusteForm({ ...ajusteForm, productoId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>{productos.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Ajuste *</Label>
                <Select value={ajusteForm.tipo} onValueChange={(v) => setAjusteForm({ ...ajusteForm, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AJUSTE_POSITIVO">Entrada / Ajuste +</SelectItem>
                    <SelectItem value="AJUSTE_NEGATIVO">Ajuste -</SelectItem>
                    <SelectItem value="ENTRADA">Compra / Ingreso</SelectItem>
                    <SelectItem value="DEVOLUCION">Devolución</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Cantidad *</Label><Input type="number" value={ajusteForm.cantidad} onChange={(e) => setAjusteForm({ ...ajusteForm, cantidad: e.target.value })} placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Lote</Label><Input value={ajusteForm.lote} onChange={(e) => setAjusteForm({ ...ajusteForm, lote: e.target.value })} placeholder="LOT-00001" /></div>
              <div><Label>Fecha Vencimiento</Label><Input type="date" value={ajusteForm.fechaVencimiento} onChange={(e) => setAjusteForm({ ...ajusteForm, fechaVencimiento: e.target.value })} /></div>
            </div>
            <div><Label>Motivo</Label><Textarea value={ajusteForm.motivo} onChange={(e) => setAjusteForm({ ...ajusteForm, motivo: e.target.value })} placeholder="Razón del ajuste..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsAjusteModalOpen(false)}>Cancelar</Button><Button onClick={confirmarAjuste} className="bg-blue-600 hover:bg-blue-700">Registrar Ajuste</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Salida Inventario */}
      <Dialog open={isSalidaModalOpen} onOpenChange={setIsSalidaModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle><LogOut className="w-5 h-5 text-orange-600 inline mr-2" /> Salida de Inventario</DialogTitle><DialogDescription>Registre salidas de medicamentos</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Producto *</Label>
              <Select value={salidaForm.productoId} onValueChange={(v) => setSalidaForm({ ...salidaForm, productoId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>{productos.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cantidad *</Label><Input type="number" value={salidaForm.cantidad} onChange={(e) => setSalidaForm({ ...salidaForm, cantidad: e.target.value })} /></div>
              <div>
                <Label>Destino *</Label>
                <Select value={salidaForm.destino} onValueChange={(v) => setSalidaForm({ ...salidaForm, destino: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UCI">UCI</SelectItem>
                    <SelectItem value="Urgencias">Urgencias</SelectItem>
                    <SelectItem value="Hospitalización">Hospitalización</SelectItem>
                    <SelectItem value="Cirugía">Cirugía</SelectItem>
                    <SelectItem value="Consulta Externa">Consulta Externa</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Solicitante</Label><Input value={salidaForm.solicitante} onChange={(e) => setSalidaForm({ ...salidaForm, solicitante: e.target.value })} placeholder="Nombre del solicitante" /></div>
            <div><Label>Observaciones</Label><Textarea value={salidaForm.motivo} onChange={(e) => setSalidaForm({ ...salidaForm, motivo: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsSalidaModalOpen(false)}>Cancelar</Button><Button onClick={confirmarSalida} className="bg-orange-600 hover:bg-orange-700">Registrar Salida</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nueva Solicitud */}
      <Dialog open={isSolicitudModalOpen} onOpenChange={setIsSolicitudModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle><ClipboardList className="w-5 h-5 text-purple-600 inline mr-2" /> Nueva Solicitud</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Producto *</Label>
              <Select value={solicitudForm.productoId} onValueChange={(v) => setSolicitudForm({ ...solicitudForm, productoId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>{productos.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cantidad *</Label><Input type="number" value={solicitudForm.cantidad} onChange={(e) => setSolicitudForm({ ...solicitudForm, cantidad: e.target.value })} /></div>
              <div>
                <Label>Urgencia</Label>
                <Select value={solicitudForm.urgencia} onValueChange={(v) => setSolicitudForm({ ...solicitudForm, urgencia: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Departamento</Label>
              <Select value={solicitudForm.departamento} onValueChange={(v) => setSolicitudForm({ ...solicitudForm, departamento: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UCI">UCI</SelectItem>
                  <SelectItem value="Urgencias">Urgencias</SelectItem>
                  <SelectItem value="Hospitalización">Hospitalización</SelectItem>
                  <SelectItem value="Cirugía">Cirugía</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Motivo</Label><Textarea value={solicitudForm.motivo} onChange={(e) => setSolicitudForm({ ...solicitudForm, motivo: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsSolicitudModalOpen(false)}>Cancelar</Button><Button onClick={confirmarSolicitud} className="bg-purple-600 hover:bg-purple-700">Crear Solicitud</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
