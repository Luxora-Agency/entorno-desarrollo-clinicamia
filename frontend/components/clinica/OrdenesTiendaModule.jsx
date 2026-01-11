'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  AlertCircle
} from 'lucide-react';
import { useOrdenesTienda } from '@/hooks/useOrdenesTienda';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const ESTADOS = [
  { value: '', label: 'Todos los estados', color: 'bg-gray-100 text-gray-700' },
  { value: 'PendientePago', label: 'Pendiente de Pago', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Pagada', label: 'Pagada', color: 'bg-green-100 text-green-700' },
  { value: 'Procesando', label: 'Procesando', color: 'bg-blue-100 text-blue-700' },
  { value: 'Enviada', label: 'Enviada', color: 'bg-purple-100 text-purple-700' },
  { value: 'Entregada', label: 'Entregada', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'Cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  { value: 'Reembolsada', label: 'Reembolsada', color: 'bg-gray-100 text-gray-700' },
];

const getEstadoConfig = (estado) => {
  return ESTADOS.find(e => e.value === estado) || ESTADOS[0];
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
  });
};

export default function OrdenesTiendaModule() {
  const {
    ordenes,
    stats,
    loading,
    pagination,
    filters,
    setFilters,
    setPage,
    updateEstado,
    updateEnvio,
    cancelarOrden,
    refresh,
  } = useOrdenesTienda();

  const [selectedOrden, setSelectedOrden] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    numeroGuia: '',
    transportadora: '',
    notasEnvio: '',
  });
  const [cancelMotivo, setCancelMotivo] = useState('');

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleEstadoFilter = (estado) => {
    setFilters({ ...filters, estado });
  };

  const handleViewDetails = (orden) => {
    setSelectedOrden(orden);
    setIsDetailOpen(true);
  };

  const handleUpdateEstado = async (orden, nuevoEstado) => {
    const success = await updateEstado(orden.id, nuevoEstado);
    if (success) {
      setIsDetailOpen(false);
      setSelectedOrden(null);
    }
  };

  const handleOpenShipping = (orden) => {
    setSelectedOrden(orden);
    setShippingForm({
      numeroGuia: orden.numeroGuia || '',
      transportadora: orden.transportadora || '',
      notasEnvio: orden.notasEnvio || '',
    });
    setIsShippingOpen(true);
  };

  const handleSaveShipping = async () => {
    const success = await updateEnvio(selectedOrden.id, shippingForm);
    if (success) {
      setIsShippingOpen(false);
      setSelectedOrden(null);
    }
  };

  const handleOpenCancel = (orden) => {
    setSelectedOrden(orden);
    setCancelMotivo('');
    setIsCancelOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelMotivo.trim()) return;
    const success = await cancelarOrden(selectedOrden.id, cancelMotivo);
    if (success) {
      setIsCancelOpen(false);
      setSelectedOrden(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
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
                        <Badge className={`${estadoConfig.color} font-medium`}>
                          {estadoConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(orden.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(orden)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {['Pagada', 'Procesando'].includes(orden.estado) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenShipping(orden)}
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                          )}
                          {!['Entregada', 'Cancelada', 'Reembolsada'].includes(orden.estado) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleOpenCancel(orden)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Pedido {selectedOrden?.numero}
            </DialogTitle>
          </DialogHeader>

          {selectedOrden && (
            <div className="space-y-6">
              {/* Estado y acciones */}
              <div className="flex items-center justify-between">
                <Badge className={`${getEstadoConfig(selectedOrden.estado).color} text-sm px-3 py-1`}>
                  {getEstadoConfig(selectedOrden.estado).label}
                </Badge>
                <div className="flex gap-2">
                  {selectedOrden.estado === 'Pagada' && (
                    <Button size="sm" onClick={() => handleUpdateEstado(selectedOrden, 'Procesando')}>
                      <Package className="w-4 h-4 mr-1" /> Procesar
                    </Button>
                  )}
                  {selectedOrden.estado === 'Procesando' && (
                    <Button size="sm" onClick={() => handleUpdateEstado(selectedOrden, 'Enviada')}>
                      <Truck className="w-4 h-4 mr-1" /> Marcar Enviado
                    </Button>
                  )}
                  {selectedOrden.estado === 'Enviada' && (
                    <Button size="sm" onClick={() => handleUpdateEstado(selectedOrden, 'Entregada')}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Marcar Entregado
                    </Button>
                  )}
                </div>
              </div>

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
                <h3 className="font-semibold text-gray-900 mb-3">Dirección de Envío</h3>
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
          )}
        </DialogContent>
      </Dialog>

      {/* Shipping Modal */}
      <Dialog open={isShippingOpen} onOpenChange={setIsShippingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Información de Envío
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Número de Guía</label>
              <Input
                value={shippingForm.numeroGuia}
                onChange={(e) => setShippingForm({ ...shippingForm, numeroGuia: e.target.value })}
                placeholder="Ej: 1234567890"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Transportadora</label>
              <Input
                value={shippingForm.transportadora}
                onChange={(e) => setShippingForm({ ...shippingForm, transportadora: e.target.value })}
                placeholder="Ej: Servientrega, Coordinadora..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notas de Envío</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={3}
                value={shippingForm.notasEnvio}
                onChange={(e) => setShippingForm({ ...shippingForm, notasEnvio: e.target.value })}
                placeholder="Instrucciones adicionales..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsShippingOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveShipping}>
                Guardar
              </Button>
            </div>
          </div>
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
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mt-1"
                rows={3}
                value={cancelMotivo}
                onChange={(e) => setCancelMotivo(e.target.value)}
                placeholder="Describe el motivo de la cancelación..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
                Volver
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={!cancelMotivo.trim()}
              >
                Confirmar Cancelación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
