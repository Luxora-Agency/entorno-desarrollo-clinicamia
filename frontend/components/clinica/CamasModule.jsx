'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bed, Plus, Edit, Trash2, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function CamasModule({ user }) {
  const [camas, setCamas] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCama, setEditingCama] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [formData, setFormData] = useState({
    numero: '',
    habitacionId: '',
    estado: 'Disponible',
    observaciones: '',
  });

  useEffect(() => {
    cargarCamas();
    cargarHabitaciones();
  }, []);

  const cargarCamas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/camas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setCamas(data.data.camas || []);
      }
    } catch (error) {
      console.error('Error al cargar camas:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingCama ? `/api/camas/${editingCama.id}` : '/api/camas';
      const method = editingCama ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(editingCama ? 'Cama actualizada exitosamente' : 'Cama creada exitosamente');
        setShowModal(false);
        resetForm();
        cargarCamas();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al guardar cama:', error);
      alert('Error al guardar la cama');
    }
  };

  const handleEdit = (cama) => {
    setEditingCama(cama);
    setFormData({
      numero: cama.numero,
      habitacionId: cama.habitacionId,
      estado: cama.estado,
      observaciones: cama.observaciones || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta cama?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/camas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Cama eliminada exitosamente');
        cargarCamas();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al eliminar cama:', error);
      alert('Error al eliminar la cama');
    }
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      habitacionId: '',
      estado: 'Disponible',
      observaciones: '',
    });
    setEditingCama(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const camasFiltradas = filtroEstado === 'all' 
    ? camas 
    : camas.filter(c => c.estado === filtroEstado);

  const camasDisponibles = camas.filter(c => c.estado === 'Disponible').length;
  const camasOcupadas = camas.filter(c => c.estado === 'Ocupada').length;
  const camasMantenimiento = camas.filter(c => c.estado === 'Mantenimiento').length;

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <Bed className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Camas</h1>
          </div>
          <p className="text-gray-600 ml-14">Administra las camas de las habitaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Disponible">Disponibles</SelectItem>
              <SelectItem value="Ocupada">Ocupadas</SelectItem>
              <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md h-11 font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Cama
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingCama ? 'Editar Cama' : 'Nueva Cama'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="habitacionId">Habitación *</Label>
                  <Select value={formData.habitacionId} onValueChange={(value) => setFormData({ ...formData, habitacionId: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar habitación" />
                    </SelectTrigger>
                    <SelectContent>
                      {habitaciones.map((habitacion) => (
                        <SelectItem key={habitacion.id} value={habitacion.id}>
                          Hab. {habitacion.numero} - {habitacion.unidad?.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número de Cama *</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Ej: 101-A, 201-B..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="Ocupada">Ocupada</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas adicionales sobre la cama..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                    {editingCama ? 'Actualizar' : 'Crear'} Cama
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Bed className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Camas</p>
                <p className="text-2xl font-bold text-gray-900">{camas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{camasDisponibles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ocupadas</p>
                <p className="text-2xl font-bold text-red-600">{camasOcupadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mantenimiento</p>
                <p className="text-2xl font-bold text-yellow-600">{camasMantenimiento}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Lista de Camas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Cargando...</p>
          ) : camasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Bed className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                {filtroEstado === 'all' ? 'No hay camas registradas' : `No hay camas en estado: ${filtroEstado}`}
              </p>
              {filtroEstado === 'all' && (
                <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primera Cama
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Habitación</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {camasFiltradas.map((cama) => (
                    <TableRow key={cama.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{cama.numero}</TableCell>
                      <TableCell>
                        <span className="text-gray-600">Hab. {cama.habitacion?.numero || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {cama.habitacion?.unidad?.nombre || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cama.estado === 'Disponible' && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Disponible
                          </Badge>
                        )}
                        {cama.estado === 'Ocupada' && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            Ocupada
                          </Badge>
                        )}
                        {cama.estado === 'Mantenimiento' && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            Mantenimiento
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {cama.observaciones || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(cama)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(cama.id)}
                            disabled={cama.estado === 'Ocupada'}
                            className="hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
