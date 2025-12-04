'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon, Clock, Edit, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function CitasModule({ user }) {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCita, setEditingCita] = useState(null);
  const [selectedFecha, setSelectedFecha] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    paciente_id: '',
    doctor_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    motivo: '',
    notas: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedFecha]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // Cargar citas
      const citasRes = await fetch(`${apiUrl}/citas?fecha=${selectedFecha}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const citasData = await citasRes.json();
      setCitas(citasData.data || []);

      // Cargar pacientes
      const pacientesRes = await fetch(`${apiUrl}/pacientes?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pacientesData = await pacientesRes.json();
      setPacientes(pacientesData.data || []);

      // Simular doctores (en producción vendría de un endpoint de usuarios con rol DOCTOR)
      setDoctores([{ id: user.id, nombre: user.nombre, apellido: user.apellido }]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const url = editingCita
        ? `${apiUrl}/citas/${editingCita.id}`
        : `${apiUrl}/citas`;
      
      const method = editingCita ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al guardar la cita');
      }
    } catch (error) {
      console.error('Error saving cita:', error);
      alert('Error al guardar la cita');
    }
  };

  const handleEdit = (cita) => {
    setEditingCita(cita);
    setFormData({
      paciente_id: cita.paciente_id || '',
      doctor_id: cita.doctor_id || '',
      fecha: cita.fecha || '',
      hora: cita.hora || '',
      motivo: cita.motivo || '',
      notas: cita.notas || '',
    });
    setIsDialogOpen(true);
  };

  const handleCancel = async (id) => {
    if (!confirm('¿Está seguro de cancelar esta cita?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/citas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
    } catch (error) {
      console.error('Error canceling cita:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      paciente_id: '',
      doctor_id: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: '',
      motivo: '',
      notas: '',
    });
    setEditingCita(null);
  };

  const getEstadoBadge = (estado) => {
    const variants = {
      'Programada': 'bg-blue-100 text-blue-800',
      'Confirmada': 'bg-green-100 text-green-800',
      'En Consulta': 'bg-yellow-100 text-yellow-800',
      'Completada': 'bg-teal-100 text-teal-800',
      'Cancelada': 'bg-red-100 text-red-800',
      'No Asistió': 'bg-gray-100 text-gray-800',
    };
    return variants[estado] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agenda de Citas</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona las citas médicas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingCita ? 'Editar Cita' : 'Nueva Cita'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="paciente_id" className="text-sm sm:text-base">Paciente *</Label>
                <Select value={formData.paciente_id} onValueChange={(value) => setFormData({ ...formData, paciente_id: value })} required>
                  <SelectTrigger className="h-11 sm:h-12">
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} - {p.cedula}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="doctor_id" className="text-sm sm:text-base">Doctor *</Label>
                <Select value={formData.doctor_id} onValueChange={(value) => setFormData({ ...formData, doctor_id: value })} required>
                  <SelectTrigger className="h-11 sm:h-12">
                    <SelectValue placeholder="Seleccionar doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctores.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        Dr. {d.nombre} {d.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha" className="text-sm sm:text-base">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="hora" className="text-sm sm:text-base">Hora *</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    required
                    className="h-11 sm:h-12"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="motivo" className="text-sm sm:text-base">Motivo de Consulta *</Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  required
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notas" className="text-sm sm:text-base">Notas Adicionales</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto">
                  {editingCita ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <Input
              type="date"
              value={selectedFecha}
              onChange={(e) => setSelectedFecha(e.target.value)}
              className="max-w-full sm:max-w-xs h-11 sm:h-12"
            />
            <span className="text-xs sm:text-sm text-gray-600">
              {citas.length} cita{citas.length !== 1 ? 's' : ''} para esta fecha
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Citas del Día</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500 text-sm sm:text-base">Cargando...</p>
          ) : citas.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm sm:text-base">No hay citas programadas para esta fecha</p>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Hora</TableHead>
                      <TableHead className="text-xs sm:text-sm">Paciente</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Doctor</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Motivo</TableHead>
                      <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {citas.map((cita) => (
                      <TableRow key={cita.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            {cita.hora}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {cita.paciente_nombre} {cita.paciente_apellido}
                          <div className="text-xs text-gray-500">{cita.paciente_cedula}</div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                          Dr. {cita.doctor_nombre} {cita.doctor_apellido}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs sm:text-sm hidden lg:table-cell">{cita.motivo}</TableCell>
                        <TableCell>
                          <Badge className={`${getEstadoBadge(cita.estado)} text-xs`}>
                            {cita.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(cita)}
                              disabled={cita.estado === 'Cancelada'}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-9 sm:w-9"
                              onClick={() => handleCancel(cita.id)}
                              disabled={cita.estado === 'Cancelada'}
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
