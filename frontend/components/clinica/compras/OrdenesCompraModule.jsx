'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus, Search, Edit, Eye, Loader2, CheckCircle,
  XCircle, ShoppingCart, Trash2, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

const ESTADOS_ORDEN = {
  'BORRADOR': { color: 'bg-gray-100 text-gray-800', label: 'Borrador' },
  'ENVIADA': { color: 'bg-blue-100 text-blue-800', label: 'Enviada' },
  'PARCIAL': { color: 'bg-yellow-100 text-yellow-800', label: 'Parcial' },
  'RECIBIDA': { color: 'bg-green-100 text-green-800', label: 'Recibida' },
  'CANCELADA': { color: 'bg-red-100 text-red-800', label: 'Cancelada' }
};

export default function OrdenesCompraModule({ user }) {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [recepcionDialogOpen, setRecepcionDialogOpen] = useState(false);
  const [editingOrden, setEditingOrden] = useState(null);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [formData, setFormData] = useState({
    proveedorId: '',
    fechaEntregaEsperada: '',
    observaciones: '',
    items: []
  });
  const [newItem, setNewItem] = useState({
    productoId: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    porcentajeIva: 19
  });

  useEffect(() => {
    fetchOrdenes();
    fetchProveedores();
    fetchProductos();
  }, [page, filtroEstado]);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const filters = { page, limit: 20 };
      if (filtroEstado !== 'all') filters.estado = filtroEstado;
      if (search) filters.search = search;

      const response = await apiGet('/compras/ordenes', filters);
      setOrdenes(response.data || []);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Error cargando órdenes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      const response = await apiGet('/compras/proveedores', { limit: 100 });
      setProveedores(response.data || []);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await apiGet('/productos', { limit: 100 });
      setProductos(response.data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const handleAddItem = () => {
    if (!newItem.descripcion || newItem.cantidad <= 0 || newItem.precioUnitario <= 0) {
      toast.error('Complete los datos del item');
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, {
        ...newItem,
        subtotal: newItem.cantidad * newItem.precioUnitario
      }]
    });
    setNewItem({
      productoId: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      porcentajeIva: 19
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
    const iva = formData.items.reduce((sum, item) => {
      return sum + (item.cantidad * item.precioUnitario * (item.porcentajeIva / 100));
    }, 0);
    return { subtotal, iva, total: subtotal + iva };
  };

  const handleSubmit = async () => {
    try {
      if (!formData.proveedorId || formData.items.length === 0) {
        toast.error('Seleccione proveedor y agregue items');
        return;
      }

      const totals = calculateTotals();
      const data = {
        ...formData,
        ...totals
      };

      if (editingOrden) {
        await apiPut(`/compras/ordenes/${editingOrden.id}`, data);
        toast.success('Orden actualizada');
      } else {
        await apiPost('/compras/ordenes', data);
        toast.success('Orden creada');
      }
      setDialogOpen(false);
      resetForm();
      fetchOrdenes();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleAprobar = async (ordenId) => {
    try {
      await apiPost(`/compras/ordenes/${ordenId}/aprobar`);
      toast.success('Orden aprobada');
      fetchOrdenes();
    } catch (error) {
      toast.error('Error aprobando: ' + error.message);
    }
  };

  const handleCancelar = async (ordenId) => {
    const motivo = prompt('Motivo de cancelación:');
    if (!motivo) return;
    try {
      await apiPost(`/compras/ordenes/${ordenId}/cancelar`, { motivo });
      toast.success('Orden cancelada');
      fetchOrdenes();
    } catch (error) {
      toast.error('Error cancelando: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingOrden(null);
    setFormData({
      proveedorId: '',
      fechaEntregaEsperada: '',
      observaciones: '',
      items: []
    });
  };

  const openDetailDialog = async (orden) => {
    try {
      const response = await apiGet(`/compras/ordenes/${orden.id}`);
      setSelectedOrden(response.data);
      setDetailDialogOpen(true);
    } catch (error) {
      toast.error('Error cargando detalle: ' + error.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Órdenes de Compra
              </CardTitle>
              <CardDescription>
                Gestión de órdenes de compra a proveedores
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Orden
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingOrden ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Cabecera */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Proveedor *</Label>
                      <Select
                        value={formData.proveedorId}
                        onValueChange={(v) => setFormData({ ...formData, proveedorId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {proveedores.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.razonSocial} ({p.documento})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Entrega Esperada</Label>
                      <Input
                        type="date"
                        value={formData.fechaEntregaEsperada}
                        onChange={(e) => setFormData({ ...formData, fechaEntregaEsperada: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-4">Items de la Orden</h4>

                    {/* Agregar item */}
                    <div className="grid grid-cols-6 gap-2 mb-4">
                      <div className="col-span-2">
                        <Input
                          placeholder="Descripción"
                          value={newItem.descripcion}
                          onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Cant"
                          value={newItem.cantidad}
                          onChange={(e) => setNewItem({ ...newItem, cantidad: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Precio"
                          value={newItem.precioUnitario}
                          onChange={(e) => setNewItem({ ...newItem, precioUnitario: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Select
                          value={newItem.porcentajeIva.toString()}
                          onValueChange={(v) => setNewItem({ ...newItem, porcentajeIva: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="19">19%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Button onClick={handleAddItem} className="w-full">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Lista de items */}
                    {formData.items.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Cant</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">IVA</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.descripcion}</TableCell>
                              <TableCell className="text-right">{item.cantidad}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                              <TableCell className="text-right">{item.porcentajeIva}%</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.cantidad * item.precioUnitario)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    {/* Totales */}
                    {formData.items.length > 0 && (
                      <div className="mt-4 text-right space-y-1">
                        <div>Subtotal: {formatCurrency(totals.subtotal)}</div>
                        <div>IVA: {formatCurrency(totals.iva)}</div>
                        <div className="text-lg font-bold">Total: {formatCurrency(totals.total)}</div>
                      </div>
                    )}
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <Textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleSubmit} className="w-full">
                    {editingOrden ? 'Actualizar' : 'Crear'} Orden de Compra
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, proveedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                onKeyDown={(e) => e.key === 'Enter' && fetchOrdenes()}
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(ESTADOS_ORDEN).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No hay órdenes de compra
                    </TableCell>
                  </TableRow>
                ) : (
                  ordenes.map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell className="font-mono">{orden.numero}</TableCell>
                      <TableCell>
                        {new Date(orden.fecha).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                      </TableCell>
                      <TableCell>{orden.proveedor?.razonSocial}</TableCell>
                      <TableCell>
                        <Badge className={ESTADOS_ORDEN[orden.estado]?.color}>
                          {ESTADOS_ORDEN[orden.estado]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(orden.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetailDialog(orden)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {orden.estado === 'BORRADOR' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleAprobar(orden.id)}>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleCancelar(orden.id)}>
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                          {orden.estado === 'ENVIADA' && (
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedOrden(orden);
                              setRecepcionDialogOpen(true);
                            }}>
                              <Package className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Página {page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Orden de Compra: {selectedOrden?.numero}</DialogTitle>
          </DialogHeader>
          {selectedOrden && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Proveedor</Label>
                  <p className="font-medium">{selectedOrden.proveedor?.razonSocial}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p>{new Date(selectedOrden.fecha).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge className={ESTADOS_ORDEN[selectedOrden.estado]?.color}>
                    {ESTADOS_ORDEN[selectedOrden.estado]?.label}
                  </Badge>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrden.items?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.descripcion}</TableCell>
                      <TableCell className="text-right">{item.cantidad}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="text-right space-y-1 border-t pt-4">
                <div>Subtotal: {formatCurrency(selectedOrden.subtotal)}</div>
                <div>IVA: {formatCurrency(selectedOrden.iva)}</div>
                <div className="text-lg font-bold">Total: {formatCurrency(selectedOrden.total)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
