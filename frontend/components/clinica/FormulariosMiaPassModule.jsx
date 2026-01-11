'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Mail, Phone, FileText, DollarSign, RefreshCw, Eye, Trash2, CheckCircle, Clock, XCircle, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiGet, apiPatch, apiDelete } from '@/services/api';
import { miaPassService } from '@/services/miaPass.service';
import { toast } from 'sonner';

const ESTADOS = {
  Pendiente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  Contactado: { color: 'bg-blue-100 text-blue-800', icon: Phone },
  EnProceso: { color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  Completado: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  Cancelado: { color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function FormulariosMiaPassModule() {
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormulario, setSelectedFormulario] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, porEstado: {} });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Conversion modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [planes, setPlanes] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [vendedorCodigo, setVendedorCodigo] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [converting, setConverting] = useState(false);

  const fetchFormularios = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (estadoFilter) params.estado = estadoFilter;

      const response = await apiGet('/formulario-mia-pass', params);
      if (response.success) {
        setFormularios(response.data || []);
        setPagination(prev => ({ ...prev, ...response.pagination }));
      }
    } catch (error) {
      toast.error('Error al cargar formularios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiGet('/formulario-mia-pass/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const fetchPlanes = async () => {
    try {
      const response = await miaPassService.getPlanes({ activo: true });
      if (response.status === 'success' || response.success) {
        setPlanes(response.data?.planes || []);
      }
    } catch (error) {
      console.error('Error al cargar planes:', error);
    }
  };

  const handleOpenConvertModal = (formulario) => {
    setSelectedFormulario(formulario);
    setShowConvertModal(true);
    setSelectedPlan('');
    setVendedorCodigo('');
    setMetodoPago('');
  };

  const handleConvertir = async () => {
    if (!selectedPlan) {
      toast.error('Debe seleccionar un plan');
      return;
    }
    if (!metodoPago) {
      toast.error('Debe seleccionar un método de pago');
      return;
    }

    setConverting(true);
    try {
      await miaPassService.convertirFormulario(selectedFormulario.id, {
        planId: parseInt(selectedPlan),
        metodoPago,
        vendedorCodigo: vendedorCodigo || null
      });

      toast.success('Formulario convertido a suscripción exitosamente');
      setShowConvertModal(false);
      setSelectedFormulario(null);
      fetchFormularios();
      fetchStats();
    } catch (error) {
      toast.error(error.message || 'Error al convertir formulario');
    } finally {
      setConverting(false);
    }
  };

  useEffect(() => {
    fetchFormularios();
    fetchStats();
    fetchPlanes();
  }, [pagination.page, estadoFilter]);

  const handleUpdateStatus = async (id, nuevoEstado) => {
    try {
      const response = await apiPatch(`/formulario-mia-pass/${id}/status`, { estado: nuevoEstado });
      if (response.success) {
        toast.success('Estado actualizado');
        fetchFormularios();
        fetchStats();
        if (selectedFormulario?.id === id) {
          setSelectedFormulario({ ...selectedFormulario, estado: nuevoEstado });
        }
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este formulario?')) return;

    try {
      const response = await apiDelete(`/formulario-mia-pass/${id}`);
      if (response.success) {
        toast.success('Formulario eliminado');
        fetchFormularios();
        fetchStats();
        setSelectedFormulario(null);
      }
    } catch (error) {
      toast.error('Error al eliminar formulario');
    }
  };

  const filteredFormularios = formularios.filter(form =>
    form.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.numeroDocumento?.includes(searchTerm) ||
    form.correoElectronico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.celular?.includes(searchTerm)
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formularios MiaPass</h1>
          <p className="text-gray-600 mt-1">Solicitudes de contacto de planes MiaPass</p>
        </div>
        <Button onClick={() => { fetchFormularios(); fetchStats(); }} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total || 0}</p>
            </div>
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </Card>

        {Object.entries(ESTADOS).map(([estado, config]) => {
          const Icon = config.icon;
          return (
            <Card
              key={estado}
              className={`p-4 cursor-pointer transition-all ${estadoFilter === estado ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
              onClick={() => setEstadoFilter(estadoFilter === estado ? '' : estado)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">{estado}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.porEstado?.[estado] || 0}</p>
                </div>
                <Icon className={`w-6 h-6 ${config.color.split(' ')[1]}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre, documento, email o celular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {estadoFilter && (
            <Button variant="ghost" onClick={() => setEstadoFilter('')}>
              Limpiar filtro
            </Button>
          )}
        </div>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-500">Cargando formularios...</p>
        </div>
      ) : (
        <>
          {/* Formularios Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Solicitante</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contacto</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Personas</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFormularios.map((formulario) => {
                    const estadoConfig = ESTADOS[formulario.estado] || ESTADOS.Pendiente;
                    const EstadoIcon = estadoConfig.icon;

                    return (
                      <tr key={formulario.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {formulario.nombreCompleto?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{formulario.nombreCompleto}</p>
                              <p className="text-xs text-gray-500">Doc: {formulario.numeroDocumento}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{formulario.correoElectronico}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span>{formulario.celular}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">{formulario.cantidadPersonas}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(formulario.valorTotal)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoConfig.color}`}>
                            <EstadoIcon className="w-3 h-3" />
                            {formulario.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                          {formatDate(formulario.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFormulario(formulario)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(formulario.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {filteredFormularios.length} de {pagination.total} formularios
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Anterior
                  </Button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {filteredFormularios.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300" />
              <p className="mt-2 text-gray-500">No se encontraron formularios</p>
            </div>
          )}
        </>
      )}

      {/* Modal de Detalles */}
      {selectedFormulario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedFormulario.nombreCompleto}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Recibido: {formatDate(selectedFormulario.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFormulario(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Documento</label>
                    <p className="text-gray-900">{selectedFormulario.numeroDocumento}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Celular</label>
                    <p className="text-gray-900">{selectedFormulario.celular}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Correo Electrónico</label>
                  <p className="text-gray-900">{selectedFormulario.correoElectronico}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cantidad de Personas</label>
                    <p className="text-2xl font-bold text-gray-900">{selectedFormulario.cantidadPersonas}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Valor Total</label>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(selectedFormulario.valorTotal)}
                    </p>
                  </div>
                </div>

                {selectedFormulario.notas && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notas</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedFormulario.notas}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Cambiar Estado</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ESTADOS).map(([estado, config]) => {
                      const Icon = config.icon;
                      const isActive = selectedFormulario.estado === estado;
                      return (
                        <Button
                          key={estado}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={isActive ? '' : config.color}
                          onClick={() => handleUpdateStatus(selectedFormulario.id, estado)}
                          disabled={isActive}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {estado}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`mailto:${selectedFormulario.correoElectronico}`, '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Email
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`tel:${selectedFormulario.celular}`, '_blank')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Llamar
                </Button>
              </div>

              {/* Convertir a Suscripción - solo para estados Contactado o EnProceso */}
              {['Contactado', 'EnProceso'].includes(selectedFormulario.estado) && (
                <div className="mt-4">
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                    onClick={() => handleOpenConvertModal(selectedFormulario)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convertir a Suscripción
                  </Button>
                </div>
              )}

              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedFormulario(null)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Conversión a Suscripción */}
      <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Convertir a Suscripción
            </DialogTitle>
          </DialogHeader>

          {selectedFormulario && (
            <div className="space-y-4 py-4">
              {/* Información del formulario */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{selectedFormulario.nombreCompleto}</p>
                <p className="text-sm text-gray-500">Doc: {selectedFormulario.numeroDocumento}</p>
                <p className="text-sm text-gray-500">{selectedFormulario.correoElectronico}</p>
              </div>

              {/* Seleccionar Plan */}
              <div className="space-y-2">
                <Label htmlFor="plan">Plan MiaPass *</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {planes.map(plan => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.nombre} - {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(plan.costo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Método de Pago */}
              <div className="space-y-2">
                <Label htmlFor="metodoPago">Método de Pago *</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                    <SelectItem value="PSE">PSE</SelectItem>
                    <SelectItem value="Nequi">Nequi</SelectItem>
                    <SelectItem value="Daviplata">Daviplata</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Código de Vendedor (opcional) */}
              <div className="space-y-2">
                <Label htmlFor="vendedorCodigo">Código de Vendedor (opcional)</Label>
                <Input
                  id="vendedorCodigo"
                  placeholder="Cédula del vendedor..."
                  value={vendedorCodigo}
                  onChange={(e) => setVendedorCodigo(e.target.value)}
                />
                <p className="text-xs text-gray-500">Si no especifica, no se asignarán comisiones de vendedor.</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConvertModal(false)}
              disabled={converting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConvertir}
              disabled={converting || !selectedPlan || !metodoPago}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {converting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Crear Suscripción
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
