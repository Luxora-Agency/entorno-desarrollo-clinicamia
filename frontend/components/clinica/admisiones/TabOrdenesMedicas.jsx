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
  FileText, 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Upload,
  AlertCircle
} from 'lucide-react';

export default function TabOrdenesMedicas({ pacienteId, paciente }) {
  const [ordenes, setOrdenes] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [formData, setFormData] = useState({
    examen_procedimiento_id: '',
    prioridad: 'Normal',
    observaciones: '',
    precio_aplicado: '',
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

      // Cargar órdenes médicas del paciente
      const ordenesRes = await fetch(
        `${apiUrl}/ordenes-medicas?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ordenesData = await ordenesRes.json();
      setOrdenes(ordenesData.data || []);

      // Cargar exámenes y procedimientos disponibles
      const examenesRes = await fetch(`${apiUrl}/examenes-procedimientos?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const examenesData = await examenesRes.json();
      setExamenes(examenesData.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const user = JSON.parse(localStorage.getItem('user'));

      const examenSeleccionado = examenes.find(e => e.id === formData.examen_procedimiento_id);
      
      const payload = {
        paciente_id: pacienteId,
        examen_procedimiento_id: formData.examen_procedimiento_id,
        doctor_id: user.id,
        prioridad: formData.prioridad,
        observaciones: formData.observaciones,
        precio_aplicado: formData.precio_aplicado || examenSeleccionado?.costoBase || 0,
      };

      const response = await fetch(`${apiUrl}/ordenes-medicas`, {
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
      alert('Error al crear la orden médica');
    }
  };

  const handleCompletarOrden = async (ordenId) => {
    const resultados = prompt('Ingrese los resultados del examen/procedimiento:');
    if (!resultados) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/ordenes-medicas/${ordenId}/completar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resultados }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCancelarOrden = async (ordenId) => {
    const observaciones = prompt('Motivo de cancelación:');
    if (!observaciones) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/ordenes-medicas/${ordenId}/cancelar`, {
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
      examen_procedimiento_id: '',
      prioridad: 'Normal',
      observaciones: '',
      precio_aplicado: '',
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      Pendiente: <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>,
      EnProceso: <Badge className="bg-blue-100 text-blue-800">En Proceso</Badge>,
      Completada: <Badge className="bg-green-100 text-green-800">Completada</Badge>,
      Cancelada: <Badge className="bg-red-100 text-red-800">Cancelada</Badge>,
    };
    return badges[estado] || <Badge>{estado}</Badge>;
  };

  const getPrioridadBadge = (prioridad) => {
    return prioridad === 'Urgente' ? (
      <Badge className="bg-red-100 text-red-800">Urgente</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Normal</Badge>
    );
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
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando órdenes médicas...</p>
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
                  {ordenes.filter(o => o.estado === 'Pendiente').length}
                </p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {ordenes.filter(o => o.estado === 'EnProceso').length}
                </p>
                <p className="text-sm text-gray-600">En Proceso</p>
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
                  {ordenes.filter(o => o.estado === 'Completada').length}
                </p>
                <p className="text-sm text-gray-600">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {ordenes.filter(o => o.prioridad === 'Urgente' && o.estado !== 'Completada').length}
                </p>
                <p className="text-sm text-gray-600">Urgentes</p>
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
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Órdenes Médicas</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Orden
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nueva Orden Médica</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Examen / Procedimiento *</Label>
                    <Select
                      value={formData.examen_procedimiento_id}
                      onValueChange={(value) => {
                        const examen = examenes.find(e => e.id === value);
                        setFormData({
                          ...formData,
                          examen_procedimiento_id: value,
                          precio_aplicado: examen?.costoBase || '',
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {examenes.map((examen) => (
                          <SelectItem key={examen.id} value={examen.id}>
                            {examen.nombre} - {formatCurrency(examen.costoBase)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prioridad</Label>
                      <Select
                        value={formData.prioridad}
                        onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Precio</Label>
                      <Input
                        type="number"
                        value={formData.precio_aplicado}
                        onChange={(e) => setFormData({ ...formData, precio_aplicado: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Observaciones</Label>
                    <Textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      placeholder="Indicaciones especiales..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
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
              <ClipboardCheck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">No hay órdenes médicas registradas</p>
              <p className="text-sm text-gray-500 mt-2">
                Cree una orden para exámenes o procedimientos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Examen/Procedimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Fecha Orden</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenes.map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {orden.examenProcedimiento?.nombre}
                          </p>
                          <p className="text-sm text-gray-500">
                            {orden.examenProcedimiento?.tipo}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getEstadoBadge(orden.estado)}</TableCell>
                      <TableCell>{getPrioridadBadge(orden.prioridad)}</TableCell>
                      <TableCell className="text-sm">{formatDate(orden.fechaOrden)}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">
                        {formatCurrency(orden.precioAplicado)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {orden.estado === 'Pendiente' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompletarOrden(orden.id)}
                                className="text-green-600 hover:bg-green-50"
                              >
                                Completar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelarOrden(orden.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                          {orden.estado === 'Completada' && orden.resultados && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => alert(orden.resultados)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              Ver Resultados
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
    </div>
  );
}
