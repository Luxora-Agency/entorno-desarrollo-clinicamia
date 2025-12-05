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
import { Plus, Calendar as CalendarIcon, Clock, Edit, X, User, Stethoscope, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function CitasModule({ user }) {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [examenesProcedimientos, setExamenesProcedimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCita, setEditingCita] = useState(null);
  const [selectedFecha, setSelectedFecha] = useState(new Date().toISOString().split('T')[0]);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [formData, setFormData] = useState({
    paciente_id: '',
    especialidad_id: '',
    doctor_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    duracion_minutos: '',
    costo: '',
    motivo: '',
    notas: '',
  });
  const [doctoresFiltrados, setDoctoresFiltrados] = useState([]);

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

      // Cargar doctores
      const doctoresRes = await fetch(`${apiUrl}/usuarios/no-pacientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const doctoresData = await doctoresRes.json();
      setDoctores(doctoresData.data?.usuarios || [{ id: user.id, nombre: user.nombre, apellido: user.apellido }]);

      // Cargar especialidades
      const especialidadesRes = await fetch(`${apiUrl}/especialidades?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const especialidadesData = await especialidadesRes.json();
      setEspecialidades(especialidadesData.data || []);

      // Cargar exámenes y procedimientos
      const examenesRes = await fetch(`${apiUrl}/examenes-procedimientos?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const examenesData = await examenesRes.json();
      setExamenesProcedimientos(examenesData.data || []);
      
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

      // Construir el payload según el tipo de servicio
      const payload = {
        paciente_id: formData.paciente_id,
        doctor_id: formData.doctor_id,
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo || (selectedServicio ? `${formData.tipoServicio}: ${selectedServicio.nombre}` : ''),
        notas: formData.notas,
      };

      // Agregar la especialidad si es el tipo de servicio seleccionado
      if (formData.tipoServicio === 'especialidad' && formData.servicioId) {
        payload.especialidad_id = formData.servicioId;
      }

      const response = await fetch(url, {
        method,
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
      tipoServicio: '',
      servicioId: '',
      fecha: cita.fecha || '',
      hora: cita.hora || '',
      motivo: cita.motivo || '',
      notas: cita.notas || '',
    });
    setSelectedServicio(null);
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

  const handleTipoServicioChange = (tipo) => {
    setFormData({ 
      ...formData, 
      tipoServicio: tipo,
      servicioId: '',
    });
    setSelectedServicio(null);
  };

  const handleServicioChange = (servicioId) => {
    let servicio;
    if (formData.tipoServicio === 'especialidad') {
      servicio = especialidades.find(e => e.id === servicioId);
      if (servicio) {
        setSelectedServicio({
          nombre: servicio.titulo,
          duracion: servicio.duracionMinutos,
          costo: servicio.costoCOP,
        });
      }
    } else {
      servicio = examenesProcedimientos.find(e => e.id === servicioId);
      if (servicio) {
        setSelectedServicio({
          nombre: servicio.nombre,
          duracion: servicio.duracionMinutos,
          costo: servicio.costoBase,
        });
      }
    }
    setFormData({ ...formData, servicioId });
  };

  const resetForm = () => {
    setFormData({
      paciente_id: '',
      doctor_id: '',
      tipoServicio: '',
      servicioId: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: '',
      motivo: '',
      notas: '',
    });
    setSelectedServicio(null);
    setEditingCita(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getEstadoBadge = (estado) => {
    const variants = {
      'Programada': 'bg-blue-100 text-blue-800 border-blue-200',
      'Confirmada': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'En Consulta': 'bg-amber-100 text-amber-800 border-amber-200',
      'Completada': 'bg-teal-100 text-teal-800 border-teal-200',
      'Cancelada': 'bg-red-100 text-red-800 border-red-200',
      'No Asistió': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return variants[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Agenda de Citas</h1>
          </div>
          <p className="text-gray-600 ml-14">Gestiona las citas médicas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                {editingCita ? 'Editar Cita' : 'Nueva Cita'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="paciente_id" className="text-sm font-semibold text-gray-700 mb-2 block">Paciente *</Label>
                <Select value={formData.paciente_id} onValueChange={(value) => setFormData({ ...formData, paciente_id: value })} required>
                  <SelectTrigger className="h-11 border-gray-300">
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
                <Label htmlFor="doctor_id" className="text-sm font-semibold text-gray-700 mb-2 block">Doctor *</Label>
                <Select value={formData.doctor_id} onValueChange={(value) => setFormData({ ...formData, doctor_id: value })} required>
                  <SelectTrigger className="h-11 border-gray-300">
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
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Tipo de Servicio *</Label>
                <Select 
                  value={formData.tipoServicio} 
                  onValueChange={handleTipoServicioChange}
                  required
                >
                  <SelectTrigger className="h-11 border-gray-300">
                    <SelectValue placeholder="Seleccionar tipo de servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="especialidad">Especialidad</SelectItem>
                    <SelectItem value="examen">Examen</SelectItem>
                    <SelectItem value="procedimiento">Procedimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipoServicio && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    {formData.tipoServicio === 'especialidad' ? 'Especialidad' : 
                     formData.tipoServicio === 'examen' ? 'Examen' : 'Procedimiento'} *
                  </Label>
                  <Select 
                    value={formData.servicioId} 
                    onValueChange={handleServicioChange}
                    required
                  >
                    <SelectTrigger className="h-11 border-gray-300">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.tipoServicio === 'especialidad' ? (
                        especialidades.map((esp) => (
                          <SelectItem key={esp.id} value={esp.id}>
                            {esp.titulo} - {formatCurrency(esp.costoCOP)}
                          </SelectItem>
                        ))
                      ) : (
                        examenesProcedimientos
                          .filter(ex => {
                            const tipoUpper = formData.tipoServicio.charAt(0).toUpperCase() + formData.tipoServicio.slice(1);
                            return ex.tipo === tipoUpper;
                          })
                          .map((ex) => (
                            <SelectItem key={ex.id} value={ex.id}>
                              {ex.nombre} - {formatCurrency(ex.costoBase)}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedServicio && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900 mb-1">{selectedServicio.nombre}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-blue-800">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Duración: <strong>{selectedServicio.duracion} minutos</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-lg">💰</span>
                          <span>Costo: <strong>{formatCurrency(selectedServicio.costo)}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha" className="text-sm font-semibold text-gray-700 mb-2 block">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="hora" className="text-sm font-semibold text-gray-700 mb-2 block">Hora *</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    required
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="motivo" className="text-sm font-semibold text-gray-700 mb-2 block">Motivo de Consulta *</Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  required
                  rows={3}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="notas" className="text-sm font-semibold text-gray-700 mb-2 block">Notas Adicionales</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto h-11">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white w-full sm:w-auto h-11 font-semibold">
                  {editingCita ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Filter */}
      <Card className="mb-6 shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <Input
                type="date"
                value={selectedFecha}
                onChange={(e) => setSelectedFecha(e.target.value)}
                className="max-w-full sm:max-w-xs h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {citas.length} cita{citas.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            Citas del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Cargando...</p>
            </div>
          ) : citas.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay citas programadas para esta fecha</p>
              <p className="text-sm text-gray-400 mt-2">Agrega una usando el botón superior</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Hora</TableHead>
                    <TableHead className="font-semibold">Paciente</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Doctor</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Motivo</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {citas.map((cita) => (
                    <TableRow key={cita.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <Clock className="w-4 h-4 text-emerald-600" />
                          </div>
                          {cita.hora}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-semibold text-gray-900">{cita.paciente_nombre} {cita.paciente_apellido}</div>
                            <div className="text-xs text-gray-500">{cita.paciente_cedula}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Stethoscope className="w-4 h-4 text-gray-500" />
                          Dr. {cita.doctor_nombre} {cita.doctor_apellido}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <FileText className="w-4 h-4 text-gray-500" />
                          {cita.motivo}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getEstadoBadge(cita.estado)} border`}>
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
                            className="h-9 w-9 p-0 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 disabled:opacity-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-700 hover:border-red-300 disabled:opacity-50"
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
