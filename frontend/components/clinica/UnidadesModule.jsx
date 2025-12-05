'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';

export default function UnidadesModule({ user }) {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: '',
    capacidad: '',
    activo: true,
  });

  useEffect(() => {
    cargarUnidades();
  }, []);

  const cargarUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/unidades', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setUnidades(data.data.unidades || []);
      }
    } catch (error) {
      console.error('Error al cargar unidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingUnidad ? `/api/unidades/${editingUnidad.id}` : '/api/unidades';
      const method = editingUnidad ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          capacidad: parseInt(formData.capacidad) || 0,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(editingUnidad ? 'Unidad actualizada exitosamente' : 'Unidad creada exitosamente');
        setShowModal(false);
        resetForm();
        cargarUnidades();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al guardar unidad:', error);
      alert('Error al guardar la unidad');
    }
  };

  const handleEdit = (unidad) => {
    setEditingUnidad(unidad);
    setFormData({
      nombre: unidad.nombre,
      descripcion: unidad.descripcion || '',
      tipo: unidad.tipo,
      capacidad: unidad.capacidad.toString(),
      activo: unidad.activo,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta unidad?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/unidades/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Unidad eliminada exitosamente');
        cargarUnidades();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al eliminar unidad:', error);
      alert('Error al eliminar la unidad');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: '',
      capacidad: '',
      activo: true,
    });
    setEditingUnidad(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando unidades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Gestión de Unidades Hospitalarias
            </CardTitle>
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Unidad
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingUnidad ? 'Editar Unidad' : 'Nueva Unidad'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: UCI, Hospitalización General..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UCI">UCI</SelectItem>
                        <SelectItem value="Hospitalización">Hospitalización</SelectItem>
                        <SelectItem value="Observación">Observación</SelectItem>
                        <SelectItem value="Cirugía">Cirugía</SelectItem>
                        <SelectItem value="Maternidad">Maternidad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacidad">Capacidad *</Label>
                    <Input
                      id="capacidad"
                      type="number"
                      value={formData.capacidad}
                      onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                      placeholder="Número de camas"
                      min="0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción de la unidad..."
                      rows={3}
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
                      {editingUnidad ? 'Actualizar' : 'Crear'} Unidad
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {unidades.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay unidades registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nombre</th>
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-left py-3 px-4">Capacidad</th>
                    <th className="text-left py-3 px-4">Habitaciones</th>
                    <th className="text-left py-3 px-4">Estado</th>
                    <th className="text-right py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {unidades.map((unidad) => (
                    <tr key={unidad.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{unidad.nombre}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{unidad.tipo}</Badge>
                      </td>
                      <td className="py-3 px-4">{unidad.capacidad} camas</td>
                      <td className="py-3 px-4">
                        {unidad._count?.habitaciones || 0} habitaciones
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={unidad.activo ? 'success' : 'secondary'}>
                          {unidad.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(unidad)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(unidad.id)}
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
