'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ShoppingBag,
  Search,
  Eye,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  History,
  User,
  MessageSquare,
  ChevronRight,
  CircleDot,
  ArrowRight,
  MapPin,
  ArrowRightCircle,
  Settings2
} from 'lucide-react';
import { useOrdenesTienda } from '@/hooks/useOrdenesTienda';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ESTADOS = [
  { value: '', label: 'Todos los estados', color: 'bg-gray-100 text-gray-700', icon: Filter },
  { value: 'PendientePago', label: 'Pendiente de Pago', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  { value: 'Pagada', label: 'Pagada', color: 'bg-green-100 text-green-700', icon: DollarSign },
  { value: 'Procesando', label: 'Procesando', color: 'bg-blue-100 text-blue-700', icon: Package },
  { value: 'Enviada', label: 'Enviada', color: 'bg-purple-100 text-purple-700', icon: Truck },
  { value: 'Entregada', label: 'Entregada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  { value: 'Cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: XCircle },
  { value: 'Reembolsada', label: 'Reembolsada', color: 'bg-gray-100 text-gray-700', icon: RefreshCw },
];

const getEstadoConfig = (estado) => {
  return ESTADOS.find(e => e.value === estado) || ESTADOS[0];
};

// Transiciones de estado válidas (solo fulfillment, el pago es automático)
const TRANSICIONES_VALIDAS = {
  'PendientePago': ['Cancelada'], // Solo cancelar, el pago es automático
  'Pagada': ['Procesando', 'Cancelada'], // El reembolso se maneja aparte
  'Procesando': ['Enviada', 'Cancelada'],
  'Enviada': ['Entregada'],
  'Entregada': [], // Estado final
  'Cancelada': [],
  'Reembolsada': [],
};

const getEstadosDisponibles = (estadoActual) => {
  const transiciones = TRANSICIONES_VALIDAS[estadoActual] || [];
  return ESTADOS.filter(e => transiciones.includes(e.value));
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Bogota'
  });
};

const formatDateLong = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota'
  });
};

// Timeline component para el historial
function HistorialTimeline({ historial }) {
  if (!historial || historial.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Sin historial de cambios</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Línea vertical */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {historial.map((item, index) => {
          const estadoConfig = getEstadoConfig(item.estadoNuevo);
          const EstadoIcon = estadoConfig.icon;
          return (
            <div key={item.id} className="relative pl-10">
              {/* Icono del estado */}
              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${estadoConfig.color} border-2 border-white shadow-sm`}>
                <EstadoIcon className="w-4 h-4" />
              </div>

              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${estadoConfig.color} font-medium`}>
                      {estadoConfig.label}
                    </Badge>
                    {item.estadoAnterior !== item.estadoNuevo && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        desde {getEstadoConfig(item.estadoAnterior).label}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                {/* Quién hizo el cambio */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{item.nombreUsuario}</span>
                </div>

                {/* Comentario si existe */}
                {item.comentario && (
                  <div className="bg-gray-50 rounded p-2 text-sm text-gray-600 mt-2">
                    <MessageSquare className="w-3 h-3 inline mr-1 text-gray-400" />
                    {item.comentario}
                  </div>
                )}

                {/* Info de envío si existe */}
                {(item.numeroGuia || item.transportadora || item.detalleEnvio) && (
                  <div className="bg-purple-50 rounded p-2 text-sm text-purple-700 mt-2">
                    <Truck className="w-3 h-3 inline mr-1" />
                    {item.transportadora && <span className="font-medium">{item.transportadora}</span>}
                    {item.numeroGuia && <span className="ml-2">Guía: <span className="font-mono">{item.numeroGuia}</span></span>}
                    {item.detalleEnvio && <p className="mt-1 text-xs">{item.detalleEnvio}</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdenesTiendaModule({ user, embedded = false }) {
  const {
    ordenes,
    stats,
    loading,
    pagination,
    filters,
    setFilters,
    setPage,
    getOrden,
    updateEstado,
    marcarProcesando,
    marcarEnviado,
    marcarEntregado,
    updateEnvio,
    cancelarOrden,
    refresh,
  } = useOrdenesTienda();

  const [selectedOrden, setSelectedOrden] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isProcessingOpen, setIsProcessingOpen] = useState(false);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('detalle');
  const [shippingForm, setShippingForm] = useState({
    numeroGuia: '',
    transportadora: '',
    detalleEnvio: '',
    comentario: '',
  });
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [processComentario, setProcessComentario] = useState('');
  const [changeStatusForm, setChangeStatusForm] = useState({
    nuevoEstado: '',
    comentario: '',
  });

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleEstadoFilter = (estado) => {
    setFilters({ ...filters, estado });
  };

  const handleViewDetails = async (orden) => {
    // Cargar orden completa con historial
    const ordenCompleta = await getOrden(orden.id);
    if (ordenCompleta) {
      setSelectedOrden(ordenCompleta);
      setDetailTab('detalle');
      setIsDetailOpen(true);
    }
  };

  const handleProcesar = async () => {
    if (!selectedOrden) return;
    setActionLoading(true);
    const result = await marcarProcesando(selectedOrden.id, processComentario);
    if (result) {
      setSelectedOrden(result);
      setIsProcessingOpen(false);
      setProcessComentario('');
      // Recargar orden para actualizar historial
      const ordenActualizada = await getOrden(selectedOrden.id);
      if (ordenActualizada) setSelectedOrden(ordenActualizada);
    }
    setActionLoading(false);
  };

  const handleOpenShipping = (orden) => {
    setSelectedOrden(orden);
    setShippingForm({
      numeroGuia: orden.numeroGuia || '',
      transportadora: orden.transportadora || '',
      detalleEnvio: '',
      comentario: '',
    });
    setIsShippingOpen(true);
  };

  const handleEnviar = async () => {
    if (!selectedOrden) return;
    setActionLoading(true);
    const result = await marcarEnviado(selectedOrden.id, shippingForm);
    if (result) {
      setIsShippingOpen(false);
      // Recargar orden para actualizar historial
      const ordenActualizada = await getOrden(selectedOrden.id);
      if (ordenActualizada) setSelectedOrden(ordenActualizada);
    }
    setActionLoading(false);
  };

  const handleEntregar = async () => {
    if (!selectedOrden) return;
    setActionLoading(true);
    const result = await marcarEntregado(selectedOrden.id, 'Pedido entregado al cliente');
    if (result) {
      // Recargar orden para actualizar historial
      const ordenActualizada = await getOrden(selectedOrden.id);
      if (ordenActualizada) setSelectedOrden(ordenActualizada);
    }
    setActionLoading(false);
  };

  const handleOpenCancel = (orden) => {
    setSelectedOrden(orden);
    setCancelMotivo('');
    setIsCancelOpen(true);
  };

  const handleOpenChangeStatus = (orden) => {
    setSelectedOrden(orden);
    setChangeStatusForm({ nuevoEstado: '', comentario: '' });
    setIsChangeStatusOpen(true);
  };

  const handleChangeStatus = async () => {
    if (!selectedOrden || !changeStatusForm.nuevoEstado) return;
    setActionLoading(true);

    // Si es cambio a Procesando, usar marcarProcesando para descontar stock
    if (changeStatusForm.nuevoEstado === 'Procesando') {
      const result = await marcarProcesando(selectedOrden.id, changeStatusForm.comentario);
      if (result) {
        setIsChangeStatusOpen(false);
        if (isDetailOpen) {
          const ordenActualizada = await getOrden(selectedOrden.id);
          if (ordenActualizada) setSelectedOrden(ordenActualizada);
        }
      }
    } else {
      // Para otros estados, usar updateEstado genérico
      const result = await updateEstado(selectedOrden.id, changeStatusForm.nuevoEstado, {
        comentario: changeStatusForm.comentario,
      });
      if (result) {
        setIsChangeStatusOpen(false);
        if (isDetailOpen) {
          const ordenActualizada = await getOrden(selectedOrden.id);
          if (ordenActualizada) setSelectedOrden(ordenActualizada);
        }
      }
    }
    setActionLoading(false);
  };

  const handleConfirmCancel = async () => {
    if (!cancelMotivo.trim() || !selectedOrden) return;
    setActionLoading(true);
    const result = await cancelarOrden(selectedOrden.id, cancelMotivo);
    if (result) {
      setIsCancelOpen(false);
      setIsDetailOpen(false);
      setSelectedOrden(null);
    }
    setActionLoading(false);
  };

  return (
    <div className={embedded ? "p-4 bg-white" : "p-6 lg:p-8 bg-white min-h-screen"}>
      {/* Header - Solo mostrar si no está embebido */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Pedidos Tienda</h1>
            </div>
            <p className="text-gray-600 ml-14">Gestiona los pedidos de la tienda online</p>
          </div>
          <Button
            onClick={refresh}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      )}

      {/* Header compacto para modo embebido */}
      {embedded && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pedidos de Tienda Online</h2>
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.porEstado?.pendientes || 0) + (stats.porEstado?.pagadas || 0) + (stats.porEstado?.procesando || 0)}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Ventas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.ventas?.hoy || 0)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Ventas Mes</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.ventas?.mes || 0)}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por número, cliente, email..."
              value={filters.search}
              onChange={handleSearch}
              className="pl-10 bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map(estado => (
              <Button
                key={estado.value}
                variant={filters.estado === estado.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleEstadoFilter(estado.value)}
                className="whitespace-nowrap"
              >
                {estado.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Cargando pedidos...</p>
          </div>
        ) : ordenes.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay pedidos</p>
            <p className="text-gray-400 text-sm">Los nuevos pedidos aparecerán aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordenes.map(orden => {
                  const estadoConfig = getEstadoConfig(orden.estado);
                  return (
                    <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-mono font-semibold text-gray-900">{orden.numero}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {orden.nombreCliente} {orden.apellidoCliente}
                          </p>
                          <p className="text-sm text-gray-500">{orden.emailCliente}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-900">
                          {orden.items?.length || 0} producto(s)
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-gray-900">
                          {formatPrice(orden.total)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {/* Badge del estado general */}
                        <Badge className={`${estadoConfig.color} font-medium mb-2`}>
                          {estadoConfig.label}
                        </Badge>

                        {/* Mini Stepper de Fulfillment - Solo para órdenes pagadas o en proceso */}
                        {!['PendientePago', 'Cancelada', 'Reembolsada'].includes(orden.estado) && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {/* Paso 1: En Proceso */}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                ['Procesando', 'Enviada', 'Entregada'].includes(orden.estado)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-400'
                              }`}
                              title="En Proceso"
                            >
                              <Package className="w-3 h-3" />
                            </div>
                            <div className={`w-2 h-0.5 ${
                              ['Enviada', 'Entregada'].includes(orden.estado) ? 'bg-purple-600' : 'bg-gray-200'
                            }`} />

                            {/* Paso 2: Enviado */}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                ['Enviada', 'Entregada'].includes(orden.estado)
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-200 text-gray-400'
                              }`}
                              title="Enviado"
                            >
                              <Truck className="w-3 h-3" />
                            </div>
                            <div className={`w-2 h-0.5 ${
                              orden.estado === 'Entregada' ? 'bg-emerald-600' : 'bg-gray-200'
                            }`} />

                            {/* Paso 3: Entregado */}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                orden.estado === 'Entregada'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-200 text-gray-400'
                              }`}
                              title="Entregado"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </div>
                          </div>
                        )}

                        {/* Indicador de guía si existe */}
                        {orden.numeroGuia && (
                          <div className="mt-1 text-xs text-purple-600 font-mono flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {orden.numeroGuia.substring(0, 10)}{orden.numeroGuia.length > 10 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {orden.responsable ? (
                          <div className="text-sm">
                            <p className="font-medium text-gray-700">
                              {orden.responsable.nombre} {orden.responsable.apellido}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(orden.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {/* Botón Ver Detalles */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(orden)}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Botones de flujo de fulfillment */}

                          {/* Pagada → Procesando */}
                          {orden.estado === 'Pagada' && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => {
                                setSelectedOrden(orden);
                                setProcessComentario('');
                                setIsProcessingOpen(true);
                              }}
                              title="Iniciar proceso del pedido"
                            >
                              <Package className="w-4 h-4 mr-1" />
                              En Proceso
                            </Button>
                          )}

                          {/* Procesando → Enviado */}
                          {orden.estado === 'Procesando' && (
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={() => handleOpenShipping(orden)}
                              title="Marcar como enviado"
                            >
                              <Truck className="w-4 h-4 mr-1" />
                              Enviado
                            </Button>
                          )}

                          {/* Enviada → Entregado */}
                          {orden.estado === 'Enviada' && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={async () => {
                                setSelectedOrden(orden);
                                setActionLoading(true);
                                await marcarEntregado(orden.id, 'Pedido entregado al cliente');
                                setActionLoading(false);
                              }}
                              title="Marcar como entregado"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Entregado
                            </Button>
                          )}

                          {/* Botón para otros cambios de estado (menos común) */}
                          {getEstadosDisponibles(orden.estado).length > 0 && !['Entregada', 'Cancelada', 'Reembolsada'].includes(orden.estado) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-500"
                              onClick={() => handleOpenChangeStatus(orden)}
                              title="Más opciones de estado"
                            >
                              <Settings2 className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Botón Cancelar - Para todos excepto finales */}
                          {!['Entregada', 'Cancelada', 'Reembolsada'].includes(orden.estado) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleOpenCancel(orden)}
                              title="Cancelar pedido"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {ordenes.length} de {pagination.total} pedidos
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                Anterior
              </Button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Pedido {selectedOrden?.numero}
            </DialogTitle>
          </DialogHeader>

          {selectedOrden && (
            <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mb-4">
                <TabsTrigger value="detalle">Detalle del Pedido</TabsTrigger>
                <TabsTrigger value="historial" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Historial ({selectedOrden.historial?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="detalle" className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    {/* Estados separados: Pago y Envío */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Estado de Pago (automático) */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Estado de Pago</h3>
                        <div className="flex items-center gap-2">
                          {selectedOrden.estado === 'PendientePago' ? (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <Clock className="w-3 h-3 mr-1" /> Pendiente
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" /> Pagado
                            </Badge>
                          )}
                          {selectedOrden.fechaPago && (
                            <span className="text-xs text-gray-500">
                              {formatDate(selectedOrden.fechaPago)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Estado de Envío (editable) */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                        <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Estado de Envío</h3>
                        {selectedOrden.estado === 'PendientePago' ? (
                          <p className="text-sm text-gray-500 italic">Esperando pago...</p>
                        ) : selectedOrden.estado === 'Cancelada' ? (
                          <Badge className="bg-red-100 text-red-700">Cancelado</Badge>
                        ) : selectedOrden.estado === 'Reembolsada' ? (
                          <Badge className="bg-gray-100 text-gray-700">Reembolsado</Badge>
                        ) : (
                          <div className="space-y-3">
                            {/* Stepper visual */}
                            <div className="flex items-center gap-1">
                              {/* En Proceso */}
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                ['Procesando', 'Enviada', 'Entregada'].includes(selectedOrden.estado)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                <Package className="w-3 h-3" />
                                <span className="hidden sm:inline">En Proceso</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300" />

                              {/* Enviado */}
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                ['Enviada', 'Entregada'].includes(selectedOrden.estado)
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                <Truck className="w-3 h-3" />
                                <span className="hidden sm:inline">Enviado</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300" />

                              {/* Entregado */}
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                selectedOrden.estado === 'Entregada'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                <CheckCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Entregado</span>
                              </div>
                            </div>

                            {/* Botón de acción según estado */}
                            <div className="flex gap-2">
                              {selectedOrden.estado === 'Pagada' && (
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                                  onClick={() => setIsProcessingOpen(true)}
                                  disabled={actionLoading}
                                >
                                  <Package className="w-4 h-4 mr-1" /> Marcar En Proceso
                                </Button>
                              )}
                              {selectedOrden.estado === 'Procesando' && (
                                <Button
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                                  onClick={() => {
                                    setShippingForm({
                                      numeroGuia: selectedOrden.numeroGuia || '',
                                      transportadora: selectedOrden.transportadora || '',
                                      detalleEnvio: '',
                                      comentario: '',
                                    });
                                    setIsShippingOpen(true);
                                  }}
                                  disabled={actionLoading}
                                >
                                  <Truck className="w-4 h-4 mr-1" /> Marcar Enviado
                                </Button>
                              )}
                              {selectedOrden.estado === 'Enviada' && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                                  onClick={handleEntregar}
                                  disabled={actionLoading}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" /> Marcar Entregado
                                </Button>
                              )}
                              {selectedOrden.estado === 'Entregada' && (
                                <div className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" /> Pedido completado
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Responsable actual */}
                    {selectedOrden.responsable && (
                      <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          <strong>Responsable actual:</strong> {selectedOrden.responsable.nombre} {selectedOrden.responsable.apellido}
                        </span>
                      </div>
                    )}

                    {/* Cliente */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Cliente</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Nombre</p>
                          <p className="font-medium">{selectedOrden.nombreCliente} {selectedOrden.apellidoCliente}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p className="font-medium">{selectedOrden.emailCliente}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Teléfono</p>
                          <p className="font-medium">{selectedOrden.telefonoCliente}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Documento</p>
                          <p className="font-medium">{selectedOrden.tipoDocumento} {selectedOrden.documento}</p>
                        </div>
                      </div>
                    </div>

                    {/* Dirección de envío */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Dirección de Envío
                      </h3>
                      <p className="text-sm">
                        {selectedOrden.direccionEnvio}
                        {selectedOrden.ciudadEnvio && `, ${selectedOrden.ciudadEnvio}`}
                        {selectedOrden.departamentoEnvio && ` - ${selectedOrden.departamentoEnvio}`}
                      </p>
                      {selectedOrden.numeroGuia && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-500">Número de Guía</p>
                          <p className="font-mono font-semibold text-indigo-600">
                            {selectedOrden.numeroGuia}
                            {selectedOrden.transportadora && ` (${selectedOrden.transportadora})`}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Productos */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
                      <div className="divide-y border rounded-lg overflow-hidden">
                        {selectedOrden.items?.map(item => (
                          <div key={item.id} className="p-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              {item.producto?.imagenUrl && (
                                <img
                                  src={item.producto.imagenUrl}
                                  alt={item.nombreProducto}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">{item.nombreProducto}</p>
                                <p className="text-sm text-gray-500">
                                  {item.cantidad} x {formatPrice(item.precioUnitario)}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold">{formatPrice(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Totales */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span>{formatPrice(selectedOrden.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Envío</span>
                          <span>{formatPrice(selectedOrden.costoEnvio)}</span>
                        </div>
                        {parseFloat(selectedOrden.descuento) > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Descuento</span>
                            <span>-{formatPrice(selectedOrden.descuento)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <span>Total</span>
                          <span>{formatPrice(selectedOrden.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Fecha de Pedido</p>
                        <p className="font-medium">{formatDate(selectedOrden.createdAt)}</p>
                      </div>
                      {selectedOrden.fechaPago && (
                        <div>
                          <p className="text-gray-500">Fecha de Pago</p>
                          <p className="font-medium">{formatDate(selectedOrden.fechaPago)}</p>
                        </div>
                      )}
                      {selectedOrden.fechaEnvio && (
                        <div>
                          <p className="text-gray-500">Fecha de Envío</p>
                          <p className="font-medium">{formatDate(selectedOrden.fechaEnvio)}</p>
                        </div>
                      )}
                      {selectedOrden.fechaEntrega && (
                        <div>
                          <p className="text-gray-500">Fecha de Entrega</p>
                          <p className="font-medium">{formatDate(selectedOrden.fechaEntrega)}</p>
                        </div>
                      )}
                    </div>

                    {/* Notas internas */}
                    {selectedOrden.notasInternas && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Notas Internas</h3>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                          {selectedOrden.notasInternas}
                        </pre>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="historial" className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full pr-4">
                  <HistorialTimeline historial={selectedOrden.historial} />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Processing Modal */}
      <Dialog open={isProcessingOpen} onOpenChange={setIsProcessingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Procesar Pedido
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">Al procesar este pedido:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Se descontará el stock de los productos</li>
                <li>El cliente será notificado del cambio de estado</li>
                <li>Quedará registrado tu nombre como responsable</li>
              </ul>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Comentario (opcional)</label>
              <Textarea
                value={processComentario}
                onChange={(e) => setProcessComentario(e.target.value)}
                placeholder="Agregar un comentario sobre el proceso..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessingOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleProcesar} disabled={actionLoading}>
              {actionLoading ? 'Procesando...' : 'Confirmar Proceso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Modal */}
      <Dialog open={isShippingOpen} onOpenChange={setIsShippingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-600" />
              Marcar como Enviado
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Transportadora *</label>
              <Input
                value={shippingForm.transportadora}
                onChange={(e) => setShippingForm({ ...shippingForm, transportadora: e.target.value })}
                placeholder="Ej: Servientrega, Coordinadora, Interrapidísimo..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Número de Guía *</label>
              <Input
                value={shippingForm.numeroGuia}
                onChange={(e) => setShippingForm({ ...shippingForm, numeroGuia: e.target.value })}
                placeholder="Ej: 1234567890"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Detalles de Envío</label>
              <Textarea
                value={shippingForm.detalleEnvio}
                onChange={(e) => setShippingForm({ ...shippingForm, detalleEnvio: e.target.value })}
                placeholder="Instrucciones adicionales de envío..."
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Comentario interno</label>
              <Textarea
                value={shippingForm.comentario}
                onChange={(e) => setShippingForm({ ...shippingForm, comentario: e.target.value })}
                placeholder="Comentario que quedará en el historial..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShippingOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnviar}
              disabled={actionLoading || !shippingForm.transportadora || !shippingForm.numeroGuia}
            >
              {actionLoading ? 'Guardando...' : 'Marcar como Enviado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Cancelar Pedido
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-600">
              ¿Estás seguro de cancelar el pedido <strong>{selectedOrden?.numero}</strong>?
              Esta acción revertirá el inventario si corresponde.
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700">Motivo de cancelación *</label>
              <Textarea
                value={cancelMotivo}
                onChange={(e) => setCancelMotivo(e.target.value)}
                placeholder="Describe el motivo de la cancelación..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)} disabled={actionLoading}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!cancelMotivo.trim() || actionLoading}
            >
              {actionLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={isChangeStatusOpen} onOpenChange={setIsChangeStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightCircle className="w-5 h-5 text-indigo-600" />
              Cambiar Estado del Pedido
            </DialogTitle>
          </DialogHeader>

          {selectedOrden && (
            <div className="space-y-4">
              {/* Estado actual */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-1">Estado actual:</p>
                <Badge className={`${getEstadoConfig(selectedOrden.estado).color} font-medium`}>
                  {getEstadoConfig(selectedOrden.estado).label}
                </Badge>
              </div>

              {/* Selector de nuevo estado */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nuevo estado *
                </label>
                <Select
                  value={changeStatusForm.nuevoEstado}
                  onValueChange={(value) => setChangeStatusForm({ ...changeStatusForm, nuevoEstado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nuevo estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getEstadosDisponibles(selectedOrden.estado).map(estado => {
                      const EstadoIcon = estado.icon;
                      return (
                        <SelectItem key={estado.value} value={estado.value}>
                          <div className="flex items-center gap-2">
                            <EstadoIcon className="w-4 h-4" />
                            {estado.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Aviso especial para Procesando */}
              {changeStatusForm.nuevoEstado === 'Procesando' && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                  <p className="font-medium">Al marcar como "Procesando":</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Se descontará el stock de los productos</li>
                  </ul>
                </div>
              )}

              {/* Aviso especial para Pagada */}
              {changeStatusForm.nuevoEstado === 'Pagada' && (
                <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
                  <p className="font-medium">Al marcar como "Pagada":</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Se registrará la fecha de pago</li>
                    <li>El pedido estará listo para procesar</li>
                  </ul>
                </div>
              )}

              {/* Aviso especial para Enviada */}
              {changeStatusForm.nuevoEstado === 'Enviada' && (
                <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-700">
                  <p className="font-medium">Nota:</p>
                  <p>Para agregar información de guía y transportadora, usa el botón "Enviar" en su lugar.</p>
                </div>
              )}

              {/* Comentario */}
              <div>
                <label className="text-sm font-medium text-gray-700">Comentario (opcional)</label>
                <Textarea
                  value={changeStatusForm.comentario}
                  onChange={(e) => setChangeStatusForm({ ...changeStatusForm, comentario: e.target.value })}
                  placeholder="Agregar un comentario sobre el cambio de estado..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeStatusOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleChangeStatus}
              disabled={!changeStatusForm.nuevoEstado || actionLoading}
            >
              {actionLoading ? 'Cambiando...' : 'Cambiar Estado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
