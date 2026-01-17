'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Pill, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Trash2,
  FileText
} from 'lucide-react';

export default function TabOrdenesMedicamentos({ pacienteId, paciente }) {
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemsOrden, setItemsOrden] = useState([]);
  const [formData, setFormData] = useState({
    observaciones: '',
    receta_digital: '',
  });

  useEffect(() => {
    if (pacienteId) {
      loadData();
    }
  }, [pacienteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Cargar órdenes de medicamentos del paciente
      const ordenesRes = await fetch(
        `${apiUrl}/ordenes-medicamentos?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ordenesData = await ordenesRes.json();
      setOrdenes(ordenesData.data || []);

      // Cargar productos disponibles
      const productosRes = await fetch(`${apiUrl}/productos?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productosData = await productosRes.json();
      setProductos(productosData.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarItem = () => {
    setItemsOrden([
      ...itemsOrden,
      {
        producto_id: '',
        cantidad: 1,
        precio_unitario: 0,
        descuento: 0,
        indicaciones: '',
      },
    ]);
  };

  const eliminarItem = (index) => {
    setItemsOrden(itemsOrden.filter((_, i) => i !== index));
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...itemsOrden];
    nuevosItems[index][campo] = valor;

    // Si cambia el producto, actualizar precio
    if (campo === 'producto_id') {
      const producto = productos.find((p) => p.id === valor);
      if (producto) {
        nuevosItems[index].precio_unitario = producto.precioVenta;
      }
    }

    setItemsOrden(nuevosItems);
  };

  const calcularTotal = () => {
    return itemsOrden.reduce((total, item) => {
      const subtotal = (parseFloat(item.precio_unitario) || 0) * (parseInt(item.cantidad) || 0);
      const descuento = parseFloat(item.descuento) || 0;
      return total + (subtotal - descuento);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (itemsOrden.length === 0) {
      alert('Debe agregar al menos un medicamento');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const user = JSON.parse(localStorage.getItem('user'));

      const payload = {
        paciente_id: pacienteId,
        doctor_id: user.id,
        observaciones: formData.observaciones,
        receta_digital: formData.receta_digital,
        items: itemsOrden,
      };

      const response = await fetch(`${apiUrl}/ordenes-medicamentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al crear la orden');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la orden de medicamentos');
    }
  };

  const handleDespachar = async (ordenId) => {
    if (!confirm('¿Está seguro de despachar esta orden? Se actualizará el inventario.')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/ordenes-medicamentos/${ordenId}/despachar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadData();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al despachar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al despachar la orden');
    }
  };

  const handleCancelar = async (ordenId) => {
    const observaciones = prompt('Motivo de cancelación:');
    if (!observaciones) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/ordenes-medicamentos/${ordenId}/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ observaciones }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      observaciones: '',
      receta_digital: '',
    });
    setItemsOrden([]);
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      Pendiente: <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>,
      Preparada: <Badge className="bg-blue-100 text-blue-800">Preparada</Badge>,
      Despachada: <Badge className="bg-green-100 text-green-800">Despachada</Badge>,
      Cancelada: <Badge className="bg-red-100 text-red-800">Cancelada</Badge>,
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
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando órdenes de medicamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {ordenes.filter((o) => o.estado === 'Pendiente').length}
                </p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {ordenes.filter((o) => o.estado === 'Preparada').length}
                </p>
                <p className="text-sm text-gray-600">Preparadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {ordenes.filter((o) => o.estado === 'Despachada').length}
                </p>
                <p className="text-sm text-gray-600">Despachadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Pill className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {ordenes.reduce((sum, o) => sum + (o.items?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Medicamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de órdenes */}
      <Card className="border-emerald-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Órdenes de Medicamentos</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Orden
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nueva Orden de Medicamentos</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Items de medicamentos */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Medicamentos</Label>
                      <Button type="button" size="sm" onClick={agregarItem} variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                    </div>

                    {itemsOrden.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No hay medicamentos agregados. Haga clic en "Agregar" para comenzar.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {itemsOrden.map((item, index) => (
                          <div key={index} className="border rounded p-3 space-y-3 bg-gray-50">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                  <Label className="text-xs">Producto *</Label>
                                  <Select
                                    value={item.producto_id}
                                    onValueChange={(value) => actualizarItem(index, 'producto_id', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {productos.map((producto) => (
                                        <SelectItem key={producto.id} value={producto.id}>
                                          {producto.nombre} - {producto.presentacion} - {formatCurrency(producto.precioVenta)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-xs">Cantidad</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.cantidad}
                                    onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs">Precio Unitario</Label>
                                  <Input
                                    type="number"
                                    value={item.precio_unitario}
                                    onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)}
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <Label className="text-xs">Indicaciones</Label>
                                  <Input
                                    placeholder="Ej: 1 tableta cada 8 horas por 7 días"
                                    value={item.indicaciones}
                                    onChange={(e) => actualizarItem(index, 'indicaciones', e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => eliminarItem(index)}
                                className="text-red-600 hover:bg-red-50 mt-5"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-emerald-600">
                                Subtotal: {formatCurrency((item.precio_unitario || 0) * (item.cantidad || 0) - (item.descuento || 0))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {itemsOrden.length > 0 && (
                      <div className="text-right pt-3 border-t">
                        <span className="text-lg font-bold text-emerald-600">
                          Total: {formatCurrency(calcularTotal())}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Receta digital */}
                  <div>
                    <Label>Receta / Indicaciones Generales</Label>
                    <Textarea
                      value={formData.receta_digital}
                      onChange={(e) => setFormData({ ...formData, receta_digital: e.target.value })}
                      placeholder="Indicaciones generales para el tratamiento..."
                      rows={3}
                    />
                  </div>

                  {/* Observaciones */}
                  <div>
                    <Label>Observaciones</Label>
                    <Textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      placeholder="Observaciones adicionales..."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                      Crear Orden
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {ordenes.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">No hay órdenes de medicamentos registradas</p>
              <p className="text-sm text-gray-500 mt-2">
                Cree una orden para prescribir medicamentos al paciente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ordenes.map((orden) => (
                <Card key={orden.id} className="border border-gray-200 hover:border-emerald-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getEstadoBadge(orden.estado)}
                          <span className="text-sm text-gray-500">{formatDate(orden.fechaOrden)}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Dr(a). {orden.doctor?.nombre} {orden.doctor?.apellido}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(orden.total)}</p>
                        <p className="text-xs text-gray-500">{orden.items?.length || 0} medicamento(s)</p>
                      </div>
                    </div>

                    {/* Items de la orden */}
                    <div className="border-t pt-3 space-y-2">
                      {orden.items?.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between text-sm">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.producto?.nombre} - {item.producto?.presentacion}
                            </p>
                            {item.indicaciones && (
                              <p className="text-xs text-gray-600 italic">{item.indicaciones}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-gray-900">
                              {item.cantidad} x {formatCurrency(item.precioUnitario)}
                            </p>
                            <p className="text-xs text-emerald-600 font-semibold">
                              {formatCurrency(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Receta digital */}
                    {orden.recetaDigital && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-gray-700 mb-1">Receta:</p>
                        <p className="text-sm text-gray-600 italic">{orden.recetaDigital}</p>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      {orden.estado === 'Pendiente' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleDespachar(orden.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Despachar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelar(orden.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                      {orden.estado === 'Despachada' && (
                        <Badge className="bg-green-100 text-green-800">
                          Despachada el {formatDate(orden.fechaDespacho)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
