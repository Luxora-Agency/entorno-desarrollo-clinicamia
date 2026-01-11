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
  Plus, Search, Eye, Loader2, DollarSign,
  FileText, Calendar, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/services/api';

const ESTADOS_FACTURA = {
  'PENDIENTE': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
  'PARCIAL': { color: 'bg-blue-100 text-blue-800', label: 'Parcial' },
  'PAGADA': { color: 'bg-green-100 text-green-800', label: 'Pagada' },
  'ANULADA': { color: 'bg-red-100 text-red-800', label: 'Anulada' }
};

export default function FacturasProveedorModule({ user }) {
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [formData, setFormData] = useState({
    proveedorId: '',
    numero: '',
    fechaFactura: '',
    fechaVencimiento: '',
    subtotal: 0,
    iva: 0,
    retencionFuente: 0,
    retencionICA: 0,
    retencionIVA: 0,
    total: 0,
    observaciones: ''
  });
  const [pagoData, setPagoData] = useState({
    monto: 0,
    metodoPago: 'TRANSFERENCIA',
    bancoOrigen: '',
    numeroTransferencia: '',
    observaciones: ''
  });

  useEffect(() => {
    fetchFacturas();
    fetchProveedores();
  }, [page, filtroEstado]);

  const fetchFacturas = async () => {
    try {
      setLoading(true);
      const filters = { page, limit: 20 };
      if (filtroEstado !== 'all') filters.estado = filtroEstado;
      if (search) filters.search = search;

      const response = await apiGet('/compras/facturas-proveedor', filters);
      setFacturas(response.data || []);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Error cargando facturas: ' + error.message);
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

  const calculateTotal = () => {
    const { subtotal, iva, retencionFuente, retencionICA, retencionIVA } = formData;
    return parseFloat(subtotal) + parseFloat(iva) - parseFloat(retencionFuente) - parseFloat(retencionICA) - parseFloat(retencionIVA);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        total: calculateTotal(),
        saldoPendiente: calculateTotal()
      };

      await apiPost('/compras/facturas-proveedor', data);
      toast.success('Factura registrada');
      setDialogOpen(false);
      resetForm();
      fetchFacturas();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handlePago = async () => {
    try {
      await apiPost(`/compras/facturas-proveedor/${selectedFactura.id}/pago`, pagoData);
      toast.success('Pago registrado');
      setPagoDialogOpen(false);
      resetPagoForm();
      fetchFacturas();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      proveedorId: '',
      numero: '',
      fechaFactura: '',
      fechaVencimiento: '',
      subtotal: 0,
      iva: 0,
      retencionFuente: 0,
      retencionICA: 0,
      retencionIVA: 0,
      total: 0,
      observaciones: ''
    });
  };

  const resetPagoForm = () => {
    setPagoData({
      monto: 0,
      metodoPago: 'TRANSFERENCIA',
      bancoOrigen: '',
      numeroTransferencia: '',
      observaciones: ''
    });
  };

  const openPagoDialog = (factura) => {
    setSelectedFactura(factura);
    setPagoData({
      ...pagoData,
      monto: parseFloat(factura.saldoPendiente)
    });
    setPagoDialogOpen(true);
  };

  const openDetailDialog = async (factura) => {
    try {
      const response = await apiGet(`/compras/facturas-proveedor/${factura.id}`);
      setSelectedFactura(response.data);
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

  const getDiasVencimiento = (fechaVencimiento) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const dias = Math.floor((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    return dias;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Facturas de Proveedor
              </CardTitle>
              <CardDescription>
                Cuentas por pagar y facturas de proveedores
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Registrar Factura
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Factura de Proveedor</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Proveedor y número */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Proveedor *</Label>
                      <Select
                        value={formData.proveedorId}
                        onValueChange={(v) => setFormData({ ...formData, proveedorId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {proveedores.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.razonSocial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Número Factura *</Label>
                      <Input
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        placeholder="FAC-12345"
                      />
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Factura *</Label>
                      <Input
                        type="date"
                        value={formData.fechaFactura}
                        onChange={(e) => setFormData({ ...formData, fechaFactura: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Vencimiento *</Label>
                      <Input
                        type="date"
                        value={formData.fechaVencimiento}
                        onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subtotal *</Label>
                      <Input
                        type="number"
                        value={formData.subtotal}
                        onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IVA</Label>
                      <Input
                        type="number"
                        value={formData.iva}
                        onChange={(e) => setFormData({ ...formData, iva: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Retenciones */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Ret. Fuente</Label>
                      <Input
                        type="number"
                        value={formData.retencionFuente}
                        onChange={(e) => setFormData({ ...formData, retencionFuente: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ret. ICA</Label>
                      <Input
                        type="number"
                        value={formData.retencionICA}
                        onChange={(e) => setFormData({ ...formData, retencionICA: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ret. IVA</Label>
                      <Input
                        type="number"
                        value={formData.retencionIVA}
                        onChange={(e) => setFormData({ ...formData, retencionIVA: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Total calculado */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-lg font-bold">
                      Total a Pagar: {formatCurrency(calculateTotal())}
                    </div>
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
                    Registrar Factura
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
                onKeyDown={(e) => e.key === 'Enter' && fetchFacturas()}
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(ESTADOS_FACTURA).map(([key, value]) => (
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
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No hay facturas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  facturas.map((factura) => {
                    const diasVencimiento = getDiasVencimiento(factura.fechaVencimiento);
                    const vencida = diasVencimiento < 0 && factura.estado !== 'PAGADA';

                    return (
                      <TableRow key={factura.id} className={vencida ? 'bg-red-50' : ''}>
                        <TableCell className="font-mono">{factura.numero}</TableCell>
                        <TableCell>{factura.proveedor?.razonSocial}</TableCell>
                        <TableCell>
                          {new Date(factura.fechaFactura).toLocaleDateString('es-CO')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {vencida && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            {new Date(factura.fechaVencimiento).toLocaleDateString('es-CO')}
                            {vencida && (
                              <Badge variant="destructive" className="ml-1">
                                {Math.abs(diasVencimiento)}d
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={ESTADOS_FACTURA[factura.estado]?.color}>
                            {ESTADOS_FACTURA[factura.estado]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(factura.total)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(factura.saldoPendiente)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openDetailDialog(factura)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {factura.estado !== 'PAGADA' && factura.estado !== 'ANULADA' && (
                              <Button variant="ghost" size="sm" onClick={() => openPagoDialog(factura)}>
                                <DollarSign className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      {/* Pago Dialog */}
      <Dialog open={pagoDialogOpen} onOpenChange={setPagoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          {selectedFactura && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Factura: {selectedFactura.numero}</p>
                <p className="text-sm text-muted-foreground">Proveedor: {selectedFactura.proveedor?.razonSocial}</p>
                <p className="text-lg font-bold">Saldo: {formatCurrency(selectedFactura.saldoPendiente)}</p>
              </div>

              <div className="space-y-2">
                <Label>Monto a Pagar *</Label>
                <Input
                  type="number"
                  value={pagoData.monto}
                  onChange={(e) => setPagoData({ ...pagoData, monto: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select
                  value={pagoData.metodoPago}
                  onValueChange={(v) => setPagoData({ ...pagoData, metodoPago: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pagoData.metodoPago === 'TRANSFERENCIA' && (
                <>
                  <div className="space-y-2">
                    <Label>Banco Origen</Label>
                    <Input
                      value={pagoData.bancoOrigen}
                      onChange={(e) => setPagoData({ ...pagoData, bancoOrigen: e.target.value })}
                      placeholder="Bancolombia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número Transferencia</Label>
                    <Input
                      value={pagoData.numeroTransferencia}
                      onChange={(e) => setPagoData({ ...pagoData, numeroTransferencia: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={pagoData.observaciones}
                  onChange={(e) => setPagoData({ ...pagoData, observaciones: e.target.value })}
                  rows={2}
                />
              </div>

              <Button onClick={handlePago} className="w-full">
                Registrar Pago
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Factura: {selectedFactura?.numero}</DialogTitle>
          </DialogHeader>
          {selectedFactura && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Proveedor</Label>
                  <p className="font-medium">{selectedFactura.proveedor?.razonSocial}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge className={ESTADOS_FACTURA[selectedFactura.estado]?.color}>
                    {ESTADOS_FACTURA[selectedFactura.estado]?.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fecha Factura</Label>
                  <p>{new Date(selectedFactura.fechaFactura).toLocaleDateString('es-CO')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha Vencimiento</Label>
                  <p>{new Date(selectedFactura.fechaVencimiento).toLocaleDateString('es-CO')}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedFactura.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span>{formatCurrency(selectedFactura.iva)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Ret. Fuente:</span>
                  <span>-{formatCurrency(selectedFactura.retencionFuente)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Ret. ICA:</span>
                  <span>-{formatCurrency(selectedFactura.retencionICA)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedFactura.total)}</span>
                </div>
                <div className="flex justify-between font-bold text-green-600">
                  <span>Saldo Pendiente:</span>
                  <span>{formatCurrency(selectedFactura.saldoPendiente)}</span>
                </div>
              </div>

              {/* Historial de pagos */}
              {selectedFactura.pagos?.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Historial de Pagos</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFactura.pagos.map((pago, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(pago.fecha).toLocaleDateString('es-CO')}</TableCell>
                          <TableCell>{pago.metodoPago}</TableCell>
                          <TableCell className="text-right">{formatCurrency(pago.monto)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
