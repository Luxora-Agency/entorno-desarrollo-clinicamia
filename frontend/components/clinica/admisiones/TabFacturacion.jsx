'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Receipt, 
  DollarSign, 
  TrendingUp,
  CreditCard,
  Plus,
  Eye,
  FileText
} from 'lucide-react';

export default function TabFacturacion({ pacienteId, paciente }) {
  const [facturas, setFacturas] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogPago, setDialogPago] = useState(false);
  const [dialogDetalle, setDialogDetalle] = useState(false);
  const [pagoForm, setPagoForm] = useState({
    monto: '',
    metodo_pago: 'Efectivo',
    referencia: '',
  });

  useEffect(() => {
    if (pacienteId) {
      loadFacturas();
    }
  }, [pacienteId]);

  const loadFacturas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/facturas?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setFacturas(data.data || []);
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFacturaDetalle = async (facturaId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/facturas/${facturaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFacturaSeleccionada(data.data.factura);
      setDialogDetalle(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/facturas/${facturaSeleccionada.id}/pagos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(pagoForm),
        }
      );

      if (response.ok) {
        setDialogPago(false);
        setPagoForm({ monto: '', metodo_pago: 'Efectivo', referencia: '' });
        loadFacturas();
        loadFacturaDetalle(facturaSeleccionada.id);
      } else {
        const error = await response.json();
        alert(error.message || 'Error al registrar pago');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar el pago');
    }
  };

  const calcularResumen = () => {
    const totalFacturado = facturas.reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
    const totalPendiente = facturas.reduce((sum, f) => sum + parseFloat(f.saldoPendiente || 0), 0);
    const totalPagado = totalFacturado - totalPendiente;

    return { totalFacturado, totalPendiente, totalPagado };
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      Pendiente: <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>,
      Parcial: <Badge className="bg-blue-100 text-blue-800">Parcial</Badge>,
      Pagada: <Badge className="bg-green-100 text-green-800">Pagada</Badge>,
      Cancelada: <Badge className="bg-red-100 text-red-800">Cancelada</Badge>,
      Vencida: <Badge className="bg-red-100 text-red-800">Vencida</Badge>,
    };
    return badges[estado] || <Badge>{estado}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Bogota'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando facturación...</p>
        </div>
      </div>
    );
  }

  const resumen = calcularResumen();

  return (
    <div className="space-y-6">
      {/* Resumen de Cuenta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Facturado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(resumen.totalFacturado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-10 w-10 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Pagado</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(resumen.totalPagado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 shadow-md bg-gradient-to-br from-red-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Receipt className="h-10 w-10 text-red-500" />
              <div>
                <p className="text-sm text-red-600 font-medium">Saldo Pendiente</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(resumen.totalPendiente)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información EPS */}
      {paciente?.eps && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Aseguramiento</p>
                <p className="text-sm text-blue-700 mt-1">
                  <span className="font-semibold">EPS:</span> {paciente.eps}
                  {paciente.regimen && <span> | <span className="font-semibold">Régimen:</span> {paciente.regimen}</span>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Facturas */}
      <Card className="border-emerald-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Facturas del Paciente</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {facturas.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">No hay facturas registradas</p>
              <p className="text-sm text-gray-500 mt-2">
                Las facturas se generan automáticamente desde el sistema administrativo
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturas.map((factura) => (
                    <TableRow key={factura.id}>
                      <TableCell className="font-medium">{factura.numero}</TableCell>
                      <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
                      <TableCell>{formatDate(factura.fechaEmision)}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">
                        {formatCurrency(factura.total)}
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {formatCurrency(factura.saldoPendiente)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadFacturaDetalle(factura.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          {factura.estado !== 'Pagada' && factura.estado !== 'Cancelada' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setFacturaSeleccionada(factura);
                                setPagoForm({ ...pagoForm, monto: factura.saldoPendiente.toString() });
                                setDialogPago(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Pago
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Detalle de Factura */}
      <Dialog open={dialogDetalle} onOpenChange={setDialogDetalle}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Factura {facturaSeleccionada?.numero}</DialogTitle>
          </DialogHeader>
          {facturaSeleccionada && (
            <div className="space-y-4">
              {/* Información general */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Estado:</p>
                  <p className="font-semibold">{getEstadoBadge(facturaSeleccionada.estado)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fecha Emisión:</p>
                  <p className="font-semibold">{formatDate(facturaSeleccionada.fechaEmision)}</p>
                </div>
              </div>

              {/* Items de factura */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Servicios Facturados</h3>
                <div className="space-y-2">
                  {facturaSeleccionada.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">{item.descripcion}</p>
                        <p className="text-xs text-gray-500">
                          {item.cantidad} x {formatCurrency(item.precioUnitario)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(facturaSeleccionada.subtotal)}</span>
                  </div>
                  {facturaSeleccionada.descuentos > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Descuentos:</span>
                      <span>-{formatCurrency(facturaSeleccionada.descuentos)}</span>
                    </div>
                  )}
                  {facturaSeleccionada.impuestos > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Impuestos:</span>
                      <span>{formatCurrency(facturaSeleccionada.impuestos)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-emerald-600">{formatCurrency(facturaSeleccionada.total)}</span>
                  </div>
                  {facturaSeleccionada.saldoPendiente > 0 && (
                    <div className="flex justify-between text-lg font-bold text-red-600">
                      <span>Saldo Pendiente:</span>
                      <span>{formatCurrency(facturaSeleccionada.saldoPendiente)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagos realizados */}
              {facturaSeleccionada.pagos && facturaSeleccionada.pagos.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Pagos Realizados</h3>
                  <div className="space-y-2">
                    {facturaSeleccionada.pagos.map((pago, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b pb-2">
                        <div>
                          <p className="font-medium">{pago.metodoPago}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(pago.fechaPago)}
                            {pago.referencia && ` - Ref: ${pago.referencia}`}
                          </p>
                        </div>
                        <p className="font-semibold text-green-600">{formatCurrency(pago.monto)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Pago */}
      <Dialog open={dialogPago} onOpenChange={setDialogPago}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegistrarPago} className="space-y-4">
            <div>
              <Label>Monto a Pagar *</Label>
              <Input
                type="number"
                step="0.01"
                value={pagoForm.monto}
                onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Saldo pendiente: {formatCurrency(facturaSeleccionada?.saldoPendiente || 0)}
              </p>
            </div>

            <div>
              <Label>Método de Pago *</Label>
              <Select
                value={pagoForm.metodo_pago}
                onValueChange={(value) => setPagoForm({ ...pagoForm, metodo_pago: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="EPS">EPS</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Referencia / Comprobante</Label>
              <Input
                value={pagoForm.referencia}
                onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })}
                placeholder="Número de transacción, cheque, etc."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogPago(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Registrar Pago
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
