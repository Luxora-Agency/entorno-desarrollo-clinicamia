'use client';

import { useState, useEffect } from 'react';
import { 
  Search, User, Calendar, Clock, Phone, Mail, AlertCircle,
  UserCheck, XCircle, CheckCircle, Stethoscope, UserPlus,
  FileText, Plus, Eye, ArrowRight, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import FormularioCita from './FormularioCita';
import { formatDate, formatTime, formatDateLong } from '@/services/formatters';

export default function AdmisionesModule({ user }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
  const [citasPaciente, setCitasPaciente] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [showAsignarDoctor, setShowAsignarDoctor] = useState(false);
  const [showNuevaCita, setShowNuevaCita] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [doctoresDisponibles, setDoctoresDisponibles] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [showEditarPago, setShowEditarPago] = useState(false);
  const [pagoEditando, setPagoEditando] = useState(null);
  const [initialDataCita, setInitialDataCita] = useState({});

  const buscarPaciente = async () => {
    if (!searchTerm.trim()) return;
    
    setBuscando(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // Buscar paciente
      const response = await fetch(`${apiUrl}/pacientes?search=${searchTerm}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const paciente = data.data[0];
        setPacienteEncontrado(paciente);
        
        // Cargar citas del paciente (hoy y futuras) con información de facturación
        const hoy = new Date().toISOString().split('T')[0];
        const citasResponse = await fetch(`${apiUrl}/citas?pacienteId=${paciente.id}&fechaDesde=${hoy}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const citasData = await citasResponse.json();
        const citas = citasData.data || [];
        
        // Cargar información de facturación para cada cita
        const citasConFactura = await Promise.all(citas.map(async (cita) => {
          try {
            const facturaResponse = await fetch(`${apiUrl}/facturas?pacienteId=${paciente.id}&limit=100`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const facturaData = await facturaResponse.json();
            
            // Buscar factura relacionada con esta cita
            const factura = facturaData.data?.find(f => 
              f.items?.some(item => item.citaId === cita.id)
            );
            
            return { ...cita, factura };
          } catch (error) {
            console.error('Error cargando factura:', error);
            return cita;
          }
        }));
        
        setCitasPaciente(citasConFactura);
      } else {
        setPacienteEncontrado(null);
        setCitasPaciente([]);
      }
    } catch (error) {
      console.error('Error buscando paciente:', error);
    }
    setBuscando(false);
  };

  const loadDoctoresYEspecialidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // Cargar doctores
      const doctoresRes = await fetch(`${apiUrl}/doctores?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const doctoresData = await doctoresRes.json();
      setDoctoresDisponibles(doctoresData.data || []);
      
      // Cargar especialidades
      const especialidadesRes = await fetch(`${apiUrl}/especialidades?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const especialidadesData = await especialidadesRes.json();
      setEspecialidades(especialidadesData.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  useEffect(() => {
    loadDoctoresYEspecialidades();
  }, []);

  const pasarAEspera = async (citaId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/citas/estado/${citaId}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'EnEspera' }),
      });
      
      if (response.ok) {
        // Recargar citas
        buscarPaciente();
        toast({
          title: "Éxito",
          description: "Paciente pasado a lista de espera",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al actualizar estado",
        variant: "destructive",
      });
    }
  };

  const marcarNoAsistio = async (citaId) => {
    if (!confirm('¿Está seguro de marcar esta cita como No Asistió?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/citas/estado/${citaId}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'NoAsistio' }),
      });
      
      if (response.ok) {
        buscarPaciente();
        toast({
          title: "Cita actualizada",
          description: "Cita marcada como No Asistió",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al actualizar estado",
        variant: "destructive",
      });
    }
  };

  const actualizarFactura = async (facturaId, nuevoEstado, nuevoMetodo) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/facturas/${facturaId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          estado: nuevoEstado,
          metodoPago: nuevoMetodo 
        }),
      });
      
      if (response.ok) {
        buscarPaciente(); // Recargar datos
        setShowEditarPago(false);
        setPagoEditando(null);
        toast({
          title: "Éxito",
          description: "Información de pago actualizada",
        });
      } else {
        toast({
          title: "Error",
          description: "Error al actualizar factura",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al actualizar pago",
        variant: "destructive",
      });
    }
  };

  const abrirEditarPago = (cita) => {
    if (cita.factura) {
      setPagoEditando({
        citaId: cita.id,
        facturaId: cita.factura.id,
        estadoActual: cita.factura.estado,
        total: cita.factura.total,
        saldoPendiente: cita.factura.saldoPendiente,
      });
      setShowEditarPago(true);
    }
  };

  const abrirAsignarDoctor = (cita) => {
    setCitaSeleccionada(cita);
    setShowAsignarDoctor(true);
  };

  const confirmarAsignacionDoctor = async (doctorId) => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/citas/estado/${citaSeleccionada.id}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          doctorId: doctorId,
          estado: 'EnEspera' // Automáticamente pasa a espera
        }),
      });
      
      if (response.ok) {
        setShowAsignarDoctor(false);
        buscarPaciente();
        toast({
          title: "Éxito",
          description: "Doctor asignado y paciente en lista de espera",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al asignar doctor",
        variant: "destructive",
      });
    }
  };

  const limpiarBusqueda = () => {
    setSearchTerm('');
    setPacienteEncontrado(null);
    setCitasPaciente([]);
  };

  const abrirFormularioNuevaCita = () => {
    setInitialDataCita({
      pacienteId: pacienteEncontrado?.id || '',
      pacienteNombre: pacienteEncontrado ? `${pacienteEncontrado.nombre} ${pacienteEncontrado.apellido}` : ''
    });
    setShowNuevaCita(true);
  };

  const abrirFormularioEditarCita = (cita) => {
    setInitialDataCita({
      citaId: cita.id,
      pacienteId: cita.pacienteId,
      pacienteNombre: pacienteEncontrado ? `${pacienteEncontrado.nombre} ${pacienteEncontrado.apellido}` : '',
      pacienteCedula: pacienteEncontrado?.cedula || '',
      tipoCita: cita.tipoCita || 'Especialidad',
      examenProcedimientoId: cita.examenProcedimientoId,
      motivo: cita.motivo,
      costo: cita.costo,
      isEdit: true,
    });
    setShowNuevaCita(true);
  };

  const handleCitaSuccess = () => {
    setShowNuevaCita(false);
    setInitialDataCita({});
    buscarPaciente(); // Recargar citas del paciente
  };

  const handleCitaCancel = () => {
    setShowNuevaCita(false);
    setInitialDataCita({});
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      PorAgendar: 'bg-purple-100 text-purple-700 border-purple-300',
      Programada: 'bg-blue-100 text-blue-700 border-blue-300',
      EnEspera: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      Atendiendo: 'bg-green-100 text-green-700 border-green-300',
      Completada: 'bg-gray-100 text-gray-700 border-gray-300',
      NoAsistio: 'bg-red-100 text-red-700 border-red-300',
      Cancelada: 'bg-orange-100 text-orange-700 border-orange-300',
    };
    
    const labels = {
      PorAgendar: 'Por Agendar',
      Programada: 'Programada',
      EnEspera: 'En Espera',
      Atendiendo: 'Atendiendo',
      Completada: 'Completada',
      NoAsistio: 'No Asistió',
      Cancelada: 'Cancelada',
    };
    
    return (
      <Badge variant="outline" className={estilos[estado] || 'bg-gray-100'}>
        {labels[estado] || estado}
      </Badge>
    );
  };

  const esHoy = (fecha) => {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaCita = new Date(fecha).toISOString().split('T')[0];
    return hoy === fechaCita;
  };

  const getTipoCitaBadge = (cita) => {
    if (cita.tipoCita === 'Especialidad' && cita.especialidad) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          Consulta: {cita.especialidad.titulo || cita.especialidad.nombre}
        </Badge>
      );
    }
    if (cita.tipoCita === 'Examen' && cita.examenProcedimiento) {
      return (
        <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-300">
          Examen: {cita.examenProcedimiento.nombre}
        </Badge>
      );
    }
    if (cita.tipoCita === 'Procedimiento' && cita.examenProcedimiento) {
      return (
        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300">
          Procedimiento: {cita.examenProcedimiento.nombre}
        </Badge>
      );
    }
    return <Badge variant="outline">{cita.tipoCita}</Badge>;
  };

  const getEstadoPagoBadge = (factura) => {
    if (!factura) return null;
    
    const estilos = {
      Pendiente: 'bg-red-100 text-red-700 border-red-300',
      Pagada: 'bg-green-100 text-green-700 border-green-300',
      Parcial: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    
    return (
      <Badge variant="outline" className={estilos[factura.estado] || 'bg-gray-100'}>
        {factura.estado}
      </Badge>
    );
  };

  // Separar citas de hoy y futuras
  const citasHoy = citasPaciente.filter(c => esHoy(c.fecha));
  const citasFuturas = citasPaciente.filter(c => !esHoy(c.fecha));

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="h-8 w-8 text-emerald-600" />
            Admisiones
          </h1>
          <p className="text-muted-foreground mt-1">
            Búsqueda de pacientes y gestión de llegadas
          </p>
        </div>
      </div>

      {/* Buscador de Paciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ingrese cédula o nombre del paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarPaciente()}
                  className="text-lg"
                />
              </div>
              <Button 
                onClick={buscarPaciente}
                disabled={!searchTerm || buscando}
                size="lg"
                className="gap-2 px-8"
              >
                <Search className="h-5 w-5" />
                {buscando ? 'Buscando...' : 'Buscar'}
              </Button>
              {pacienteEncontrado && (
                <Button 
                  onClick={limpiarBusqueda}
                  variant="outline"
                  size="lg"
                >
                  Limpiar
                </Button>
              )}
            </div>

            {/* Mensaje si no hay resultado y se buscó */}
            {!buscando && searchTerm && !pacienteEncontrado && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">Paciente no encontrado</p>
                  <p className="text-sm text-amber-700 mt-1">
                    No se encontró ningún paciente con esa cédula o nombre. 
                    ¿Desea registrar un nuevo paciente?
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-3 gap-2"
                    onClick={() => toast({
                      title: "Información",
                      description: "Redirigir a módulo de Pacientes para registrar nuevo paciente",
                    })}
                  >
                    <UserPlus className="h-4 w-4" />
                    Registrar Nuevo Paciente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información del Paciente Encontrado */}
      {pacienteEncontrado && (
        <>
          {/* Tarjeta de Info del Paciente */}
          <Card className="border-2 border-emerald-200 bg-emerald-50/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  <span>Paciente Encontrado</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.location.href = `/?module=pacientes&id=${pacienteEncontrado.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    Ver Perfil Completo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.location.href = `/?module=hce&pacienteId=${pacienteEncontrado.id}`}
                  >
                    <FileText className="h-4 w-4" />
                    Historia Clínica
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Nombre Completo</Label>
                  <p className="font-semibold text-lg text-gray-900">
                    {pacienteEncontrado.nombre} {pacienteEncontrado.apellido}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Cédula</Label>
                  <p className="font-medium text-gray-900">{pacienteEncontrado.cedula}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label className="text-xs text-gray-600">Teléfono</Label>
                    <p className="font-medium text-gray-900">{pacienteEncontrado.telefono || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label className="text-xs text-gray-600">Email</Label>
                    <p className="font-medium text-gray-900 text-sm">{pacienteEncontrado.email || 'No registrado'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Citas del Paciente */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Citas del Paciente
                </CardTitle>
                <Button
                  className="gap-2"
                  onClick={abrirFormularioNuevaCita}
                >
                  <Plus className="h-4 w-4" />
                  Agendar Nueva Cita
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {citasPaciente.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No tiene citas programadas</p>
                  <p className="text-gray-400 text-sm mb-4">Puede agendar una nueva cita para el paciente</p>
                  <Button
                    className="gap-2"
                    onClick={abrirFormularioNuevaCita}
                  >
                    <Plus className="h-4 w-4" />
                    Agendar Cita
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue="hoy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="hoy" className="gap-2">
                      <Clock className="h-4 w-4" />
                      Para Hoy ({citasHoy.length})
                    </TabsTrigger>
                    <TabsTrigger value="futuras" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Futuras ({citasFuturas.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Citas de Hoy */}
                  <TabsContent value="hoy" className="space-y-4 mt-4">
                    {citasHoy.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p>No tiene citas para hoy</p>
                      </div>
                    ) : (
                      citasHoy.map((cita) => (
                        <div 
                          key={cita.id}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            cita.estado === 'EnEspera' ? 'border-yellow-300 bg-yellow-50' :
                            cita.estado === 'Atendiendo' ? 'border-green-300 bg-green-50' :
                            'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              {/* Hora, Estado y Tipo de Cita */}
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-gray-500" />
                                  <span className="font-bold text-2xl">{formatTime(cita.hora)}</span>
                                </div>
                                {getEstadoBadge(cita.estado)}
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                  HOY
                                </Badge>
                                {getTipoCitaBadge(cita)}
                              </div>
                              
                              {/* Doctor */}
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                  {cita.doctor && cita.doctor.usuario ? 
                                    `Dr. ${cita.doctor.usuario.nombre} ${cita.doctor.usuario.apellido}` : 
                                    cita.doctorId ? 
                                    'Doctor asignado' :
                                    <span className="text-red-600">Sin doctor asignado</span>
                                  }
                                </span>
                              </div>

                              {/* Motivo */}
                              <div className="text-sm">
                                <span className="text-gray-500">Motivo:</span>{' '}
                                <span className="text-gray-900">{cita.motivo}</span>
                              </div>

                              {/* Información de Facturación */}
                              {cita.factura && (
                                <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">Facturación</span>
                                    {getEstadoPagoBadge(cita.factura)}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Total:</span>{' '}
                                      <span className="font-medium">${parseFloat(cita.factura.total).toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Saldo:</span>{' '}
                                      <span className="font-medium text-red-600">${parseFloat(cita.factura.saldoPendiente).toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => abrirEditarPago(cita)}
                                    className="w-full mt-2"
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Actualizar Pago
                                  </Button>
                                </div>
                              )}

                              {cita.notas && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Notas:</span> {cita.notas}
                                </div>
                              )}
                            </div>

                            {/* Acciones */}
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              {/* Programar Cita PorAgendar */}
                              {cita.estado === 'PorAgendar' && (
                                <Button
                                  onClick={() => abrirFormularioEditarCita(cita)}
                                  className="gap-2 bg-purple-600 hover:bg-purple-700 w-full"
                                >
                                  <Calendar className="h-4 w-4" />
                                  Programar Cita
                                </Button>
                              )}

                              {/* Pasar a En Espera */}
                              {cita.estado === 'Programada' && cita.doctorId && (
                                <Button
                                  onClick={() => pasarAEspera(cita.id)}
                                  className="gap-2 bg-yellow-600 hover:bg-yellow-700 w-full"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Pasar a Espera
                                </Button>
                              )}

                              {/* Asignar Doctor */}
                              {!cita.doctorId && cita.estado === 'Programada' && (
                                <Button
                                  onClick={() => abrirAsignarDoctor(cita)}
                                  className="gap-2 bg-blue-600 hover:bg-blue-700 w-full"
                                >
                                  <Stethoscope className="h-4 w-4" />
                                  Asignar Doctor
                                </Button>
                              )}

                              {/* Estado En Espera */}
                              {cita.estado === 'EnEspera' && (
                                <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 bg-yellow-100 p-3 rounded border border-yellow-300">
                                  <CheckCircle className="h-4 w-4" />
                                  En lista de espera
                                </div>
                              )}

                              {/* Estado Atendiendo */}
                              {cita.estado === 'Atendiendo' && (
                                <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-100 p-3 rounded border border-green-300">
                                  <CheckCircle className="h-4 w-4" />
                                  En consulta ahora
                                </div>
                              )}

                              {/* Marcar No Asistió */}
                              {(cita.estado === 'Programada' || cita.estado === 'EnEspera') && (
                                <Button
                                  onClick={() => marcarNoAsistio(cita.id)}
                                  variant="outline"
                                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 w-full"
                                >
                                  <XCircle className="h-4 w-4" />
                                  No Asistió
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Citas Futuras */}
                  <TabsContent value="futuras" className="space-y-4 mt-4">
                    {citasFuturas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p>No tiene citas futuras programadas</p>
                      </div>
                    ) : (
                      citasFuturas.map((cita) => (
                        <div 
                          key={cita.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="font-semibold">{formatDate(cita.fecha)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="font-semibold">{formatTime(cita.hora)}</span>
                                </div>
                                {getEstadoBadge(cita.estado)}
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <Stethoscope className="h-4 w-4 text-gray-500" />
                                <span>
                                  {cita.doctor ? 
                                    `Dr. ${cita.doctor.nombre} ${cita.doctor.apellido}` : 
                                    <span className="text-red-600">Sin doctor asignado</span>
                                  }
                                </span>
                                {cita.especialidad && (
                                  <>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-600">{cita.especialidad.nombre}</span>
                                  </>
                                )}
                              </div>

                              <div className="text-sm text-gray-600">
                                {cita.motivo}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!cita.doctorId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirAsignarDoctor(cita)}
                                  className="gap-2"
                                >
                                  <Stethoscope className="h-4 w-4" />
                                  Asignar Doctor
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog Asignar Doctor */}
      <Dialog open={showAsignarDoctor} onOpenChange={setShowAsignarDoctor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Doctor a la Cita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {citaSeleccionada && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Cita:</strong> {formatDate(citaSeleccionada.fecha)} a las {formatTime(citaSeleccionada.hora)}
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Especialidad:</strong> {citaSeleccionada.especialidad?.nombre}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Seleccione un Doctor Disponible</Label>
              <Select onValueChange={(value) => confirmarAsignacionDoctor(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione doctor..." />
                </SelectTrigger>
                <SelectContent>
                  {doctoresDisponibles.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No hay doctores disponibles</div>
                  ) : (
                    doctoresDisponibles.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.usuario?.nombre} {doctor.usuario?.apellido}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-900">
                <strong>Nota:</strong> Al asignar el doctor, el paciente pasará automáticamente a la lista de espera.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nueva Cita */}
      <Dialog open={showNuevaCita} onOpenChange={setShowNuevaCita}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agendar Nueva Cita</DialogTitle>
          </DialogHeader>
          <FormularioCita
            initialData={initialDataCita}
            onSuccess={handleCitaSuccess}
            onCancel={handleCitaCancel}
            doctores={doctoresDisponibles}
            especialidades={especialidades}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Pago */}
      <Dialog open={showEditarPago} onOpenChange={setShowEditarPago}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Actualizar Información de Pago
            </DialogTitle>
          </DialogHeader>
          {pagoEditando && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded border">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Total</Label>
                    <p className="font-semibold text-lg">${parseFloat(pagoEditando.total).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Saldo Pendiente</Label>
                    <p className="font-semibold text-lg text-red-600">${parseFloat(pagoEditando.saldoPendiente).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Estado de Pago *</Label>
                <Select 
                  defaultValue={pagoEditando.estadoActual} 
                  onValueChange={(value) => setPagoEditando({...pagoEditando, nuevoEstado: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Pagada">Pagado</SelectItem>
                    <SelectItem value="Parcial">Pago Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Método de Pago</Label>
                <Select 
                  defaultValue="Efectivo" 
                  onValueChange={(value) => setPagoEditando({...pagoEditando, nuevoMetodo: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="EPS">EPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowEditarPago(false);
                    setPagoEditando(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => actualizarFactura(
                    pagoEditando.facturaId,
                    pagoEditando.nuevoEstado || pagoEditando.estadoActual,
                    pagoEditando.nuevoMetodo || 'Efectivo'
                  )}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
