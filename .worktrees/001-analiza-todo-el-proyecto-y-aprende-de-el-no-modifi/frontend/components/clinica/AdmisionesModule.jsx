'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  UserPlus, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Heart,
  FileText,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  DollarSign
} from 'lucide-react';

export default function AdmisionesModule({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [citasHoy, setCitasHoy] = useState([]);
  const [showRegistroDialog, setShowRegistroDialog] = useState(false);
  const [showCitaDialog, setShowCitaDialog] = useState(false);
  const [registroStep, setRegistroStep] = useState(1);
  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [examenesProcedimientos, setExamenesProcedimientos] = useState([]);
  
  const [registroForm, setRegistroForm] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    tipoSangre: '',
    fechaNacimiento: '',
    genero: '',
    email: '',
    direccion: '',
    alergias: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
  });

  const [citaForm, setCitaForm] = useState({
    tipoServicio: '', // 'especialidad', 'examen', 'procedimiento'
    servicioId: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    duracion: '',
    costo: '',
    motivo: '',
    observaciones: '',
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/pacientes?search=${searchTerm}&limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const paciente = data.data[0];
        setSearchResult(paciente);
        
        const today = new Date().toISOString().split('T')[0];
        const citasRes = await fetch(`${apiUrl}/citas?fecha=${today}&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const citasData = await citasRes.json();
        const citasPaciente = citasData.data?.filter(c => c.paciente_id === paciente.id) || [];
        setCitasHoy(citasPaciente);
      } else {
        setSearchResult(null);
        setCitasHoy([]);
      }

      // Cargar datos para formulario de cita
      const doctoresRes = await fetch(`${apiUrl}/usuarios/no-pacientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const doctoresData = await doctoresRes.json();
      setDoctores(doctoresData.data?.usuarios || []);

      const especialidadesRes = await fetch(`${apiUrl}/especialidades?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const especialidadesData = await especialidadesRes.json();
      setEspecialidades(especialidadesData.data || []);

      const examenesRes = await fetch(`${apiUrl}/examenes-procedimientos?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const examenesData = await examenesRes.json();
      setExamenesProcedimientos(examenesData.data || []);
      
    } catch (error) {
      console.error('Error en búsqueda:', error);
      alert('Error al buscar paciente');
    } finally {
      setSearching(false);
    }
  };

  const handleTipoServicioChange = (tipo) => {
    setCitaForm({ 
      ...citaForm, 
      tipoServicio: tipo,
      servicioId: '',
      duracion: '',
      costo: '',
    });
  };

  const handleServicioChange = (servicioId) => {
    let servicio;
    if (citaForm.tipoServicio === 'especialidad') {
      servicio = especialidades.find(e => e.id === servicioId);
      if (servicio) {
        setCitaForm({
          ...citaForm,
          servicioId,
          duracion: servicio.duracionMinutos?.toString() || '',
          costo: servicio.costoCOP?.toString() || '',
        });
      }
    } else {
      servicio = examenesProcedimientos.find(e => e.id === servicioId);
      if (servicio) {
        setCitaForm({
          ...citaForm,
          servicioId,
          duracion: servicio.duracionMinutos?.toString() || '',
          costo: servicio.costoBase?.toString() || '',
        });
      }
    }
  };

  const handleRegistroPaso1 = () => {
    if (!registroForm.nombre || !registroForm.apellido || !registroForm.cedula || !registroForm.telefono) {
      alert('Por favor completa todos los campos básicos');
      return;
    }
    setRegistroStep(2);
  };

  const handleRegistroFinal = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/pacientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: registroForm.nombre,
          apellido: registroForm.apellido,
          cedula: registroForm.cedula,
          telefono: registroForm.telefono,
          tipo_sangre: registroForm.tipoSangre,
          fecha_nacimiento: registroForm.fechaNacimiento,
          genero: registroForm.genero,
          email: registroForm.email,
          direccion: registroForm.direccion,
          alergias: registroForm.alergias,
          contacto_emergencia_nombre: registroForm.contactoEmergenciaNombre,
          contacto_emergencia_telefono: registroForm.contactoEmergenciaTelefono,
        }),
      });

      if (response.ok) {
        alert('✅ Paciente registrado exitosamente');
        setShowRegistroDialog(false);
        setRegistroStep(1);
        setRegistroForm({
          nombre: '',
          apellido: '',
          cedula: '',
          telefono: '',
          tipoSangre: '',
          fechaNacimiento: '',
          genero: '',
          email: '',
          direccion: '',
          alergias: '',
          contactoEmergenciaNombre: '',
          contactoEmergenciaTelefono: '',
        });
        setSearchTerm(registroForm.cedula);
        setTimeout(() => handleSearch(), 500);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al registrar paciente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar paciente');
    }
  };

  const handleAgendarCita = async () => {
    if (!citaForm.tipoServicio || !citaForm.servicioId || !citaForm.fecha || !citaForm.hora) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/citas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paciente_id: searchResult.id,
          doctor_id: user.id,
          especialidad_id: citaForm.tipoServicio === 'especialidad' ? citaForm.servicioId : null,
          fecha: citaForm.fecha,
          hora: citaForm.hora,
          motivo: citaForm.motivo || `${citaForm.tipoServicio}: ${getServicioNombre()}`,
          notas: citaForm.observaciones,
        }),
      });

      if (response.ok) {
        alert('✅ Cita agendada exitosamente');
        setShowCitaDialog(false);
        setCitaForm({
          tipoServicio: '',
          servicioId: '',
          fecha: new Date().toISOString().split('T')[0],
          hora: '',
          duracion: '',
          costo: '',
          motivo: '',
          observaciones: '',
        });
        handleSearch();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al agendar cita');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al agendar cita');
    }
  };

  const getServicioNombre = () => {
    if (citaForm.tipoServicio === 'especialidad') {
      const esp = especialidades.find(e => e.id === citaForm.servicioId);
      return esp?.titulo || '';
    } else {
      const ex = examenesProcedimientos.find(e => e.id === citaForm.servicioId);
      return ex?.nombre || '';
    }
  };

  const handleCambiarEstadoCita = async (citaId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/citas/${citaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        alert(`✅ Estado actualizado a: ${nuevoEstado}`);
        handleSearch();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar estado');
    }
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admisiones</h1>
        </div>
        <p className="text-gray-600 ml-14">Búsqueda rápida de pacientes y gestión de citas</p>
      </div>

      <Card className="mb-6 shadow-md border-emerald-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por cédula, nombre o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="border-0 focus-visible:ring-0 bg-transparent h-10 text-lg"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={searching || !searchTerm.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md h-14 px-8 font-semibold"
            >
              {searching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResult && (
        <div className="space-y-6">
          <Card className="shadow-md border-emerald-200">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nombre Completo</p>
                    <p className="font-semibold text-gray-900">{searchResult.nombre} {searchResult.apellido}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cédula</p>
                    <p className="font-semibold text-gray-900">{searchResult.cedula}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-semibold text-gray-900">{searchResult.telefono || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">{searchResult.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Sangre</p>
                    <p className="font-semibold text-gray-900">{searchResult.tipoSangre || searchResult.tipo_sangre || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={() => setShowCitaDialog(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Nueva Cita
                </Button>
              </div>
            </CardContent>
          </Card>

          {citasHoy.length > 0 && (
            <Card className="shadow-md border-emerald-200">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Citas de Hoy ({citasHoy.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {citasHoy.map((cita) => (
                    <Card key={cita.id} className="border-2 border-gray-200 hover:border-emerald-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="w-5 h-5 text-emerald-600" />
                              <span className="text-lg font-bold text-gray-900">{cita.hora}</span>
                              <Badge className={`${getEstadoBadge(cita.estado)} border`}>
                                {cita.estado}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-semibold">Doctor:</span> Dr. {cita.doctor_nombre} {cita.doctor_apellido}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Motivo:</span> {cita.motivo}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {cita.estado === 'Programada' && (
                              <Button
                                size="sm"
                                onClick={() => handleCambiarEstadoCita(cita.id, 'Confirmada')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Confirmar
                              </Button>
                            )}
                            {cita.estado === 'Confirmada' && (
                              <Button
                                size="sm"
                                onClick={() => handleCambiarEstadoCita(cita.id, 'En Consulta')}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                En Consulta
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {citasHoy.length === 0 && (
            <Card className="shadow-md border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-yellow-800">
                  <AlertCircle className="w-6 h-6" />
                  <p className="font-semibold">Este paciente no tiene citas programadas para hoy</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {searchTerm && !searching && !searchResult && (
        <Card className="shadow-md border-gray-200">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Paciente no encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              No existe ningún paciente con "{searchTerm}"
            </p>
            <Button 
              onClick={() => setShowRegistroDialog(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Registrar Nuevo Paciente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Registro de Paciente */}
      <Dialog open={showRegistroDialog} onOpenChange={setShowRegistroDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Registro de Paciente - Paso {registroStep} de 2
            </DialogTitle>
          </DialogHeader>

          {registroStep === 1 ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-800">
                  <span className="font-semibold">Paso 1:</span> Ingresa los datos básicos del paciente
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Nombre *</Label>
                  <Input
                    value={registroForm.nombre}
                    onChange={(e) => setRegistroForm({ ...registroForm, nombre: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Apellido *</Label>
                  <Input
                    value={registroForm.apellido}
                    onChange={(e) => setRegistroForm({ ...registroForm, apellido: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Cédula *</Label>
                  <Input
                    value={registroForm.cedula}
                    onChange={(e) => setRegistroForm({ ...registroForm, cedula: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Teléfono *</Label>
                  <Input
                    value={registroForm.telefono}
                    onChange={(e) => setRegistroForm({ ...registroForm, telefono: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">Tipo de Sangre</Label>
                  <Input
                    value={registroForm.tipoSangre}
                    onChange={(e) => setRegistroForm({ ...registroForm, tipoSangre: e.target.value })}
                    placeholder="Ej: O+, A-, AB+"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRegistroDialog(false);
                    setRegistroStep(1);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleRegistroPaso1}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Paso 2:</span> Completa la información adicional (opcional)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Fecha de Nacimiento</Label>
                  <Input
                    type="date"
                    value={registroForm.fechaNacimiento}
                    onChange={(e) => setRegistroForm({ ...registroForm, fechaNacimiento: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Género</Label>
                  <Select 
                    value={registroForm.genero} 
                    onValueChange={(value) => setRegistroForm({ ...registroForm, genero: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">Email</Label>
                  <Input
                    type="email"
                    value={registroForm.email}
                    onChange={(e) => setRegistroForm({ ...registroForm, email: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">Dirección</Label>
                  <Input
                    value={registroForm.direccion}
                    onChange={(e) => setRegistroForm({ ...registroForm, direccion: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">Alergias Conocidas</Label>
                  <Textarea
                    value={registroForm.alergias}
                    onChange={(e) => setRegistroForm({ ...registroForm, alergias: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="font-semibold">Contacto de Emergencia</Label>
                  <Input
                    value={registroForm.contactoEmergenciaNombre}
                    onChange={(e) => setRegistroForm({ ...registroForm, contactoEmergenciaNombre: e.target.value })}
                    placeholder="Nombre"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Teléfono de Emergencia</Label>
                  <Input
                    value={registroForm.contactoEmergenciaTelefono}
                    onChange={(e) => setRegistroForm({ ...registroForm, contactoEmergenciaTelefono: e.target.value })}
                    placeholder="Teléfono"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setRegistroStep(1)}
                >
                  Atrás
                </Button>
                <Button 
                  onClick={handleRegistroFinal}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold"
                >
                  Registrar Paciente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Agendar Cita */}
      <Dialog open={showCitaDialog} onOpenChange={setShowCitaDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Agendar Nueva Cita
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-semibold">Tipo de Servicio *</Label>
              <Select 
                value={citaForm.tipoServicio} 
                onValueChange={handleTipoServicioChange}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar tipo de servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especialidad">Especialidad</SelectItem>
                  <SelectItem value="examen">Examen</SelectItem>
                  <SelectItem value="procedimiento">Procedimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {citaForm.tipoServicio && (
              <div>
                <Label className="font-semibold">
                  {citaForm.tipoServicio === 'especialidad' ? 'Especialidad' : 
                   citaForm.tipoServicio === 'examen' ? 'Examen' : 'Procedimiento'} *
                </Label>
                <Select 
                  value={citaForm.servicioId} 
                  onValueChange={handleServicioChange}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {citaForm.tipoServicio === 'especialidad' ? (
                      especialidades.map((esp) => (
                        <SelectItem key={esp.id} value={esp.id}>
                          {esp.titulo} - {formatCurrency(esp.costoCOP)}
                        </SelectItem>
                      ))
                    ) : (
                      examenesProcedimientos
                        .filter(ex => ex.tipo === (citaForm.tipoServicio === 'examen' ? 'Examen' : 'Procedimiento'))
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Fecha *</Label>
                <Input
                  type="date"
                  value={citaForm.fecha}
                  onChange={(e) => setCitaForm({ ...citaForm, fecha: e.target.value })}
                  className="h-11"
                />
              </div>
              <div>
                <Label className="font-semibold">Hora *</Label>
                <Input
                  type="time"
                  value={citaForm.hora}
                  onChange={(e) => setCitaForm({ ...citaForm, hora: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Duración (minutos)
                </Label>
                <Input
                  type="number"
                  value={citaForm.duracion}
                  onChange={(e) => setCitaForm({ ...citaForm, duracion: e.target.value })}
                  className="h-11"
                  placeholder="30"
                />
              </div>
              <div>
                <Label className="font-semibold flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Costo (COP)
                </Label>
                <Input
                  type="number"
                  value={citaForm.costo}
                  onChange={(e) => setCitaForm({ ...citaForm, costo: e.target.value })}
                  className="h-11"
                  placeholder="50000"
                />
              </div>
            </div>

            <div>
              <Label className="font-semibold">Motivo de Consulta</Label>
              <Textarea
                value={citaForm.motivo}
                onChange={(e) => setCitaForm({ ...citaForm, motivo: e.target.value })}
                rows={2}
                placeholder="Describe el motivo..."
              />
            </div>

            <div>
              <Label className="font-semibold">Observaciones</Label>
              <Textarea
                value={citaForm.observaciones}
                onChange={(e) => setCitaForm({ ...citaForm, observaciones: e.target.value })}
                rows={2}
                placeholder="Observaciones adicionales..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCitaDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAgendarCita}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold"
              >
                Agendar Cita
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
