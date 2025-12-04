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
      setCitas(citasData.citas || []);

      // Cargar pacientes
      const pacientesRes = await fetch(`${apiUrl}/pacientes?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pacientesData = await pacientesRes.json();
      setPacientes(pacientesData.pacientes || []);

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

    try {
      const url = editingCita
        ? `http://localhost:4000/citas/${editingCita.id}`
        : 'http://localhost:4000/citas';
      
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
      await fetch(`http://localhost:4000/citas/${id}`, {
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda de Citas</h1>
          <p className="text-gray-600 mt-1">Gestiona las citas médicas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-500 hover:bg-teal-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCita ? 'Editar Cita' : 'Nueva Cita'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="paciente_id">Paciente *</Label>
                <Select value={formData.paciente_id} onValueChange={(value) => setFormData({ ...formData, paciente_id: value })} required>
                  <SelectTrigger>
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
                <Label htmlFor="doctor_id">Doctor *</Label>
                <Select value={formData.doctor_id} onValueChange={(value) => setFormData({ ...formData, doctor_id: value })} required>
                  <SelectTrigger>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hora">Hora *</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="motivo">Motivo de Consulta *</Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  required
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notas">Notas Adicionales</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-teal-500 hover:bg-teal-600">
                  {editingCita ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <Input
              type="date"
              value={selectedFecha}
              onChange={(e) => setSelectedFecha(e.target.value)}
              className="max-w-xs"
            />
            <span className="text-sm text-gray-600">
              {citas.length} cita{citas.length !== 1 ? 's' : ''} para esta fecha
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Citas del Día</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Cargando...</p>
          ) : citas.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay citas programadas para esta fecha</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citas.map((cita) => (
                  <TableRow key={cita.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {cita.hora}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cita.paciente_nombre} {cita.paciente_apellido}
                      <div className="text-xs text-gray-500">{cita.paciente_cedula}</div>
                    </TableCell>
                    <TableCell>
                      Dr. {cita.doctor_nombre} {cita.doctor_apellido}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{cita.motivo}</TableCell>
                    <TableCell>
                      <Badge className={getEstadoBadge(cita.estado)}>
                        {cita.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cita)}
                          disabled={cita.estado === 'Cancelada'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleCancel(cita.id)}
                          disabled={cita.estado === 'Cancelada'}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
