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
import { Plus, Calendar as CalendarIcon, Clock, X, Stethoscope } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function TabCitas({ pacienteId, paciente, user }) {
  const [citas, setCitas] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [examenesProcedimientos, setExamenesProcedimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: pacienteId,
    doctor_id: '',
    tipoServicio: '',
    servicioId: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    motivo: '',
    notas: '',
  });

  useEffect(() => {
    if (pacienteId) {
      loadData();
    }
  }, [pacienteId]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // Cargar citas del paciente
      const citasRes = await fetch(`${apiUrl}/citas?paciente_id=${pacienteId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const citasData = await citasRes.json();
      setCitas(citasData.data || []);

      // Cargar doctores
      const doctoresRes = await fetch(`${apiUrl}/doctores?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const doctoresData = await doctoresRes.json();
      setDoctores(doctoresData.data || []);

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
      const payload = {
        paciente_id: pacienteId,
        doctor_id: formData.doctor_id,
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo,
        notas: formData.notas,
        estado: 'Programada',
      };

      // Agregar el servicio según el tipo
      if (formData.tipoServicio === 'especialidad') {
        payload.especialidad_id = formData.servicioId;
      } else if (formData.tipoServicio === 'examen' || formData.tipoServicio === 'procedimiento') {
        payload.examen_procedimiento_id = formData.servicioId;
      }

      const response = await fetch(`${apiUrl}/citas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert('Cita creada exitosamente');
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error creating cita:', error);
      alert('Error al crear la cita');
    }
  };

  const handleCancelarCita = async (citaId) => {
    if (!confirm('¿Está seguro de cancelar esta cita?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/citas/${citaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: 'Cancelada' }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Cita cancelada exitosamente');
        loadData();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error canceling cita:', error);
      alert('Error al cancelar la cita');
    }
  };

  const resetForm = () => {
    setFormData({
      paciente_id: pacienteId,
      doctor_id: '',
      tipoServicio: '',
      servicioId: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: '',
      motivo: '',
      notas: '',
    });
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEstadoBadge = (estado) => {
    const variants = {
      'Programada': 'bg-blue-100 text-blue-700 border-blue-200',
      'Completada': 'bg-green-100 text-green-700 border-green-200',
      'Cancelada': 'bg-red-100 text-red-700 border-red-200',
      'En Curso': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return variants[estado] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTipoServicioBadge = (cita) => {
    if (cita.especialidad) {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        Consulta: {cita.especialidad.nombre}
      </Badge>;
    }
    if (cita.examenProcedimiento) {
      return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
        {cita.examenProcedimiento.tipo}: {cita.examenProcedimiento.nombre}
      </Badge>;
    }
    return <Badge variant="outline">Consulta General</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Cargando citas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Citas del Paciente
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Cita
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agendar Nueva Cita</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Paciente: {paciente?.nombre} {paciente?.apellido}
                    </p>
                    <p className="text-xs text-blue-700">
                      Cédula: {paciente?.cedula}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha *</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="doctor_id">Doctor *</Label>
                    <Select value={formData.doctor_id} onValueChange={(value) => setFormData({ ...formData, doctor_id: value })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctores.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.usuario?.nombre} {doctor.usuario?.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoServicio">Tipo de Servicio *</Label>
                    <Select 
                      value={formData.tipoServicio} 
                      onValueChange={(value) => setFormData({ ...formData, tipoServicio: value, servicioId: '' })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="especialidad">Consulta por Especialidad</SelectItem>
                        <SelectItem value="examen">Examen Médico</SelectItem>
                        <SelectItem value="procedimiento">Procedimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.tipoServicio === 'especialidad' && (
                    <div className="space-y-2">
                      <Label htmlFor="especialidad">Especialidad *</Label>
                      <Select 
                        value={formData.servicioId} 
                        onValueChange={(value) => setFormData({ ...formData, servicioId: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar especialidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {especialidades.map((esp) => (
                            <SelectItem key={esp.id} value={esp.id}>
                              {esp.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(formData.tipoServicio === 'examen' || formData.tipoServicio === 'procedimiento') && (
                    <div className="space-y-2">
                      <Label htmlFor="examen">
                        {formData.tipoServicio === 'examen' ? 'Examen' : 'Procedimiento'} *
                      </Label>
                      <Select 
                        value={formData.servicioId} 
                        onValueChange={(value) => setFormData({ ...formData, servicioId: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Seleccionar ${formData.tipoServicio}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {examenesProcedimientos
                            .filter(ex => ex.tipo.toLowerCase() === formData.tipoServicio.toLowerCase())
                            .map((ex) => (
                              <SelectItem key={ex.id} value={ex.id}>
                                {ex.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo de la Cita *</Label>
                    <Textarea
                      id="motivo"
                      value={formData.motivo}
                      onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                      placeholder="Describa el motivo de la consulta..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas Adicionales</Label>
                    <Textarea
                      id="notas"
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      placeholder="Información adicional..."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Agendar Cita
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {citas.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No hay citas registradas para este paciente</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agendar Primera Cita
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {citas.map((cita) => (
                    <TableRow key={cita.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          {formatFecha(cita.fecha)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {cita.hora}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-gray-400" />
                          <span>
                            {cita.doctor?.usuario?.nombre} {cita.doctor?.usuario?.apellido}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getTipoServicioBadge(cita)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {cita.motivo || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoBadge(cita.estado)}>
                          {cita.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {cita.estado === 'Programada' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelarCita(cita.id)}
                              className="hover:bg-red-50"
                            >
                              <X className="w-4 h-4 text-red-500" />
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
