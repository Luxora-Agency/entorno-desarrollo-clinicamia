'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, Plus, Edit, Trash2, Building2, Layers, Bed } from 'lucide-react';

export default function HabitacionesModule({ user }) {
  const [habitaciones, setHabitaciones] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHabitacion, setEditingHabitacion] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    unidadId: '',
    piso: '',
    capacidadCamas: '',
    activo: true,
  });

  useEffect(() => {
    cargarHabitaciones();
    cargarUnidades();
  }, []);

  const cargarHabitaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/habitaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setHabitaciones(data.data.habitaciones || []);
      }
    } catch (error) {
      console.error('Error al cargar habitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/unidades?activo=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setUnidades(data.data.unidades || []);
      }
    } catch (error) {
      console.error('Error al cargar unidades:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingHabitacion ? `${process.env.NEXT_PUBLIC_API_URL}/habitaciones/${editingHabitacion.id}` : `${process.env.NEXT_PUBLIC_API_URL}/habitaciones`;
      const method = editingHabitacion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          piso: parseInt(formData.piso) || 1,
          capacidadCamas: parseInt(formData.capacidadCamas) || 1,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(editingHabitacion ? 'Habitación actualizada exitosamente' : 'Habitación creada exitosamente');
        setShowModal(false);
        resetForm();
        cargarHabitaciones();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al guardar habitación:', error);
      alert('Error al guardar la habitación');
    }
  };

  const handleEdit = (habitacion) => {
    setEditingHabitacion(habitacion);
    setFormData({
      numero: habitacion.numero,
      unidadId: habitacion.unidadId,
      piso: habitacion.piso.toString(),
      capacidadCamas: habitacion.capacidadCamas.toString(),
      activo: habitacion.activo,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta habitación?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/habitaciones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Habitación eliminada exitosamente');
        cargarHabitaciones();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al eliminar habitación:', error);
      alert('Error al eliminar la habitación');
    }
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      unidadId: '',
      piso: '',
      capacidadCamas: '',
      activo: true,
    });
    setEditingHabitacion(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const habitacionesActivas = habitaciones.filter(h => h.activo).length;
  const totalCamas = habitaciones.reduce((sum, h) => sum + (h._count?.camas || 0), 0);

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <DoorOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Habitaciones</h1>
          </div>
          <p className="text-gray-600 ml-14">Administra las habitaciones de las unidades</p>
        </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Habitación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingHabitacion ? 'Editar Habitación' : 'Nueva Habitación'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Ej: 101, 201..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="piso">Piso *</Label>
                  <Input
                    id="piso"
                    type="number"
                    value={formData.piso}
                    onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                    placeholder="1, 2, 3..."
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidadId">Unidad *</Label>
                <Select value={formData.unidadId} onValueChange={(value) => setFormData({ ...formData, unidadId: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(unidades) && unidades.map((unidad) => (
                      <SelectItem key={unidad.id} value={unidad.id}>
                        {unidad.nombre} ({unidad.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacidadCamas">Capacidad de Camas *</Label>
                <Input
                  id="capacidadCamas"
                  type="number"
                  value={formData.capacidadCamas}
                  onChange={(e) => setFormData({ ...formData, capacidadCamas: e.target.value })}
                  placeholder="1, 2, 3..."
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="activo">Activo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  {editingHabitacion ? 'Actualizar' : 'Crear'} Habitación
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <DoorOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Habitaciones</p>
                <p className="text-2xl font-bold text-gray-900">{habitaciones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-gray-900">{habitacionesActivas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Bed className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Camas</p>
                <p className="text-2xl font-bold text-gray-900">{totalCamas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Lista de Habitaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Cargando...</p>
          ) : habitaciones.length === 0 ? (
            <div className="text-center py-12">
              <DoorOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No hay habitaciones registradas</p>
              <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primera Habitación
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Piso</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Camas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {habitaciones.map((habitacion) => (
                    <TableRow key={habitacion.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{habitacion.numero}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {habitacion.unidad?.nombre || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>Piso {habitacion.piso}</TableCell>
                      <TableCell>{habitacion.capacidadCamas} camas</TableCell>
                      <TableCell>
                        <span className="text-gray-600">{habitacion._count?.camas || 0} registradas</span>
                      </TableCell>
                      <TableCell>
                        {habitacion.activo ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(habitacion)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(habitacion.id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
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
