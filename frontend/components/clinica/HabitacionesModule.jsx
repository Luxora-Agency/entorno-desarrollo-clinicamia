'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, Plus, Edit, Trash2 } from 'lucide-react';

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
      const response = await fetch('/api/habitaciones', {
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
      const response = await fetch('/api/unidades?activo=true', {
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
      const url = editingHabitacion ? `/api/habitaciones/${editingHabitacion.id}` : '/api/habitaciones';
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
      const response = await fetch(`/api/habitaciones/${id}`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando habitaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="w-6 h-6" />
              Gestión de Habitaciones
            </CardTitle>
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
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
                        {unidades.map((unidad) => (
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
                    <Button type="submit">
                      {editingHabitacion ? 'Actualizar' : 'Crear'} Habitación
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {habitaciones.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay habitaciones registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Número</th>
                    <th className="text-left py-3 px-4">Unidad</th>
                    <th className="text-left py-3 px-4">Piso</th>
                    <th className="text-left py-3 px-4">Capacidad</th>
                    <th className="text-left py-3 px-4">Camas</th>
                    <th className="text-left py-3 px-4">Estado</th>
                    <th className="text-right py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {habitaciones.map((habitacion) => (
                    <tr key={habitacion.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{habitacion.numero}</td>
                      <td className="py-3 px-4">{habitacion.unidad?.nombre || '-'}</td>
                      <td className="py-3 px-4">Piso {habitacion.piso}</td>
                      <td className="py-3 px-4">{habitacion.capacidadCamas} camas</td>
                      <td className="py-3 px-4">
                        {habitacion._count?.camas || 0} registradas
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={habitacion.activo ? 'success' : 'secondary'}>
                          {habitacion.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(habitacion)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(habitacion.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
