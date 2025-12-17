'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Clock,
  AlertCircle,
  Heart,
  Thermometer,
  Activity,
  UserPlus,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  Users,
  AlertTriangle,
  Bed,
  Calendar,
  FileText,
} from 'lucide-react';

export default function UrgenciasModule({ user }) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('triaje');
  const [atenciones, setAtenciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTriajeForm, setShowTriajeForm] = useState(false);
  const [atencionSeleccionada, setAtencionSeleccionada] = useState(null);
  const [showDisposicionModal, setShowDisposicionModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [tipoDisposicion, setTipoDisposicion] = useState('');

  useEffect(() => {
    loadData();
    // Recargar cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const [atencioneRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/urgencias`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/urgencias/estadisticas`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (atencioneRes.ok) {
        const data = await atencioneRes.json();
        setAtenciones(data.data?.atenciones || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setEstadisticas(data.data?.estadisticas || null);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoriaColor = (categoria) => {
    switch (categoria) {
      case 'Rojo': return 'bg-red-600 text-white';
      case 'Naranja': return 'bg-orange-500 text-white';
      case 'Amarillo': return 'bg-yellow-500 text-gray-900';
      case 'Verde': return 'bg-green-500 text-white';
      case 'Azul': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'EnAtencion': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Espera': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Alta': return 'bg-green-100 text-green-800 border-green-300';
      case 'Hospitalizado': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const calcularTiempoEspera = (horaLlegada) => {
    const ahora = new Date();
    const llegada = new Date(horaLlegada);
    const diffMs = ahora - llegada;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min`;
    const horas = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${horas}h ${mins}min`;
  };

  const atencionesFiltradas = atenciones.filter(a => {
    const matchSearch = searchTerm === '' ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.paciente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.paciente?.cedula?.includes(searchTerm);
    
    const matchTab = 
      (activeTab === 'triaje') ||
      (activeTab === 'atencion' && a.estado === 'EnAtencion') ||
      (activeTab === 'espera' && a.estado === 'Espera');
    
    return matchSearch && matchTab;
  });

  const atencionesOrdenadas = [...atencionesFiltradas].sort((a, b) => a.prioridad - b.prioridad);

  const iniciarAtencion = async (atencionId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/urgencias/${atencionId}/atender`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medico_id: user.id,
          area_asignada: 'Consultorio Urgencias',
        }),
      });

      if (response.ok) {
        toast({ description: 'Atención iniciada correctamente' });
        loadData();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ description: 'Error al iniciar atención', variant: 'destructive' });
    }
  };

  const abrirDisposicion = (atencion, tipo) => {
    setAtencionSeleccionada(atencion);
    setTipoDisposicion(tipo);
    setShowDisposicionModal(true);
  };

  const verDetalle = (atencion) => {
    setAtencionSeleccionada(atencion);
    setShowDetalleModal(true);
  };

  const contarPorCategoria = (categoria) => {
    return atenciones.filter(a => a.categoriaManchester === categoria && (a.estado === 'Espera' || a.estado === 'EnAtencion')).length;
  };

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-600 to-orange-700 rounded-lg shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Urgencias - Triaje Manchester</h1>
              <p className="text-sm text-gray-600">Clasificación y Atención de Emergencias</p>
            </div>
          </div>
          <Dialog open={showTriajeForm} onOpenChange={setShowTriajeForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Ingreso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Ingreso a Urgencias</DialogTitle>
              </DialogHeader>
              <FormularioTriaje 
                onClose={() => setShowTriajeForm(false)} 
                onSuccess={() => {
                  setShowTriajeForm(false);
                  loadData();
                }}
                user={user}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas por Categoría Manchester */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-l-4 border-l-red-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rojo</p>
                  <p className="text-2xl font-bold text-red-600">{contarPorCategoria('Rojo')}</p>
                  <p className="text-xs text-gray-500">Reanimación</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Naranja</p>
                  <p className="text-2xl font-bold text-orange-600">{contarPorCategoria('Naranja')}</p>
                  <p className="text-xs text-gray-500">Muy Urgente</p>
                </div>
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Amarillo</p>
                  <p className="text-2xl font-bold text-yellow-600">{contarPorCategoria('Amarillo')}</p>
                  <p className="text-xs text-gray-500">Urgente</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verde</p>
                  <p className="text-2xl font-bold text-green-600">{contarPorCategoria('Verde')}</p>
                  <p className="text-xs text-gray-500">Poco Urgente</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Azul</p>
                  <p className="text-2xl font-bold text-blue-600">{contarPorCategoria('Azul')}</p>
                  <p className="text-xs text-gray-500">No Urgente</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por paciente o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm">
            <TabsTrigger value="triaje" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
              Panel de Triaje ({atenciones.length})
            </TabsTrigger>
            <TabsTrigger value="atencion" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              En Atención ({atenciones.filter(a => a.estado === 'EnAtencion').length})
            </TabsTrigger>
            <TabsTrigger value="espera" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">
              En Espera ({atenciones.filter(a => a.estado === 'Espera').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Cat.</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Signos Vitales</TableHead>
                      <TableHead>Llegada</TableHead>
                      <TableHead>Espera</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Cargando...
                        </TableCell>
                      </TableRow>
                    ) : atencionesOrdenadas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No hay pacientes en urgencias
                        </TableCell>
                      </TableRow>
                    ) : (
                      atencionesOrdenadas.map((atencion) => (
                        <TableRow key={atencion.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${getCategoriaColor(atencion.categoriaManchester)}`}>
                              {atencion.prioridad}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{atencion.paciente?.nombre} {atencion.paciente?.apellido}</p>
                              <p className="text-xs text-gray-500">CC: {atencion.paciente?.cedula}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="truncate text-sm">{atencion.motivoConsulta}</p>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3 text-red-500" />
                                <span>{atencion.presionSistolica}/{atencion.presionDiastolica}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3 text-blue-500" />
                                <span>{atencion.frecuenciaCardiaca} bpm</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Thermometer className="w-3 h-3 text-orange-500" />
                                <span>{atencion.temperatura}°C</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(atencion.horaLlegada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {calcularTiempoEspera(atencion.horaLlegada)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getEstadoColor(atencion.estado)} border text-xs`}>
                              {atencion.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => verDetalle(atencion)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              {atencion.estado === 'Espera' && (
                                <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => iniciarAtencion(atencion.id)}
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              )}
                              {atencion.estado === 'EnAtencion' && (
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => abrirDisposicion(atencion, 'alta')}
                                    title="Dar de Alta"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                    onClick={() => abrirDisposicion(atencion, 'hospitalizar')}
                                    title="Hospitalizar"
                                  >
                                    <Bed className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                    onClick={() => abrirDisposicion(atencion, 'cita')}
                                    title="Programar Cita"
                                  >
                                    <Calendar className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Disposición */}
        <ModalDisposicion
          open={showDisposicionModal}
          onClose={() => {
            setShowDisposicionModal(false);
            setAtencionSeleccionada(null);
          }}
          atencion={atencionSeleccionada}
          tipo={tipoDisposicion}
          onSuccess={() => {
            setShowDisposicionModal(false);
            loadData();
          }}
          user={user}
        />

        {/* Modal de Detalle */}
        <Dialog open={showDetalleModal} onOpenChange={setShowDetalleModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalle de Atención de Urgencias</DialogTitle>
            </DialogHeader>
            {atencionSeleccionada && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Paciente:</span>
                    <p className="font-semibold">{atencionSeleccionada.paciente?.nombre} {atencionSeleccionada.paciente?.apellido}</p>
                    <p className="text-sm text-gray-500">CC: {atencionSeleccionada.paciente?.cedula}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Categoría:</span>
                    <Badge className={`${getCategoriaColor(atencionSeleccionada.categoriaManchester)} mt-1`}>
                      {atencionSeleccionada.categoriaManchester} - Prioridad {atencionSeleccionada.prioridad}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Motivo de Consulta:</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded">{atencionSeleccionada.motivoConsulta}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Signos Vitales</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-600">PA:</span>
                      <p className="font-semibold">{atencionSeleccionada.presionSistolica}/{atencionSeleccionada.presionDiastolica}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">FC:</span>
                      <p className="font-semibold">{atencionSeleccionada.frecuenciaCardiaca} bpm</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">FR:</span>
                      <p className="font-semibold">{atencionSeleccionada.frecuenciaRespiratoria} rpm</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Temp:</span>
                      <p className="font-semibold">{atencionSeleccionada.temperatura}°C</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Sat O2:</span>
                      <p className="font-semibold">{atencionSeleccionada.saturacionOxigeno}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Glasgow:</span>
                      <p className="font-semibold">{atencionSeleccionada.escalaGlasgow}</p>
                    </div>
                  </div>
                </div>

                {atencionSeleccionada.observaciones && (
                  <div>
                    <span className="text-sm text-gray-600">Observaciones:</span>
                    <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{atencionSeleccionada.observaciones}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Componente de Formulario de Triaje
function FormularioTriaje({ onClose, onSuccess, user }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [pacientes, setPacientes] = useState([]);
  const [searchPaciente, setSearchPaciente] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    categoria_manchester: 'Amarillo',
    nivel_urgencia: 'Urgente',
    prioridad: 3,
    motivo_consulta: '',
    medio_llegada: 'Particular',
    acompanante: '',
    presion_sistolica: '',
    presion_diastolica: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    temperatura: '',
    saturacion_oxigeno: '',
    escala_glasgow: 15,
    escala_dolor: 0,
    observaciones: '',
  });

  const getCategoriaColorLocal = (categoria) => {
    switch (categoria) {
      case 'Rojo': return 'bg-red-600 text-white hover:bg-red-700';
      case 'Naranja': return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'Amarillo': return 'bg-yellow-500 text-gray-900 hover:bg-yellow-600';
      case 'Verde': return 'bg-green-500 text-white hover:bg-green-600';
      case 'Azul': return 'bg-blue-500 text-white hover:bg-blue-600';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  const buscarPacientes = async () => {
    if (searchPaciente.length < 3) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/pacientes?search=${searchPaciente}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPacientes(data.data || []);
      }
    } catch (error) {
      console.error('Error buscando pacientes:', error);
    }
  };

  const handleCategoriaChange = (categoria) => {
    const configuraciones = {
      'Rojo': { nivel: 'Reanimación', prioridad: 1 },
      'Naranja': { nivel: 'Muy Urgente', prioridad: 2 },
      'Amarillo': { nivel: 'Urgente', prioridad: 3 },
      'Verde': { nivel: 'Poco Urgente', prioridad: 4 },
      'Azul': { nivel: 'No Urgente', prioridad: 5 },
    };

    const config = configuraciones[categoria];
    setFormData({
      ...formData,
      categoria_manchester: categoria,
      nivel_urgencia: config.nivel,
      prioridad: config.prioridad,
    });
  };

  const handleSubmit = async () => {
    if (!pacienteSeleccionado) {
      toast({ description: 'Debe seleccionar un paciente', variant: 'destructive' });
      return;
    }

    if (!formData.motivo_consulta) {
      toast({ description: 'El motivo de consulta es obligatorio', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/urgencias/triaje`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paciente_id: pacienteSeleccionado.id,
          ...formData,
        }),
      });

      if (response.ok) {
        toast({ description: 'Triaje registrado exitosamente' });
        onSuccess();
      } else {
        const error = await response.json();
        toast({ description: error.message || 'Error al registrar triaje', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ description: 'Error al registrar triaje', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Paso 1: Seleccionar Paciente</h3>
          <div>
            <Label>Buscar Paciente</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre, cédula..."
                value={searchPaciente}
                onChange={(e) => setSearchPaciente(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarPacientes()}
              />
              <Button onClick={buscarPacientes}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {pacientes.length > 0 && (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {pacientes.map(p => (
                <div
                  key={p.id}
                  onClick={() => setPacienteSeleccionado(p)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-b ${pacienteSeleccionado?.id === p.id ? 'bg-emerald-50' : ''}`}
                >
                  <p className="font-semibold">{p.nombre} {p.apellido}</p>
                  <p className="text-sm text-gray-600">CC: {p.cedula}</p>
                </div>
              ))}
            </div>
          )}

          {pacienteSeleccionado && (
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <p className="font-semibold text-emerald-900">Paciente Seleccionado:</p>
                <p className="text-sm">{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido} - {pacienteSeleccionado.cedula}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={() => setStep(2)} 
              disabled={!pacienteSeleccionado}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Paso 2: Triaje Manchester</h3>
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              Volver
            </Button>
          </div>

          {/* Categoría Manchester */}
          <div>
            <Label>Categoría Manchester *</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {['Rojo', 'Naranja', 'Amarillo', 'Verde', 'Azul'].map(cat => (
                <Button
                  key={cat}
                  type="button"
                  variant={formData.categoria_manchester === cat ? 'default' : 'outline'}
                  className={formData.categoria_manchester === cat ? getCategoriaColorLocal(cat) : ''}
                  onClick={() => handleCategoriaChange(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Nivel: {formData.nivel_urgencia} (Prioridad {formData.prioridad})
            </p>
          </div>

          {/* Motivo de Consulta */}
          <div>
            <Label>Motivo de Consulta *</Label>
            <Textarea
              value={formData.motivo_consulta}
              onChange={(e) => setFormData({ ...formData, motivo_consulta: e.target.value })}
              placeholder="Describa el motivo de la consulta..."
              rows={3}
            />
          </div>

          {/* Signos Vitales */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold">Signos Vitales</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">PA Sistólica</Label>
                <Input
                  type="number"
                  value={formData.presion_sistolica}
                  onChange={(e) => setFormData({ ...formData, presion_sistolica: e.target.value })}
                  placeholder="120"
                />
              </div>
              <div>
                <Label className="text-xs">PA Diastólica</Label>
                <Input
                  type="number"
                  value={formData.presion_diastolica}
                  onChange={(e) => setFormData({ ...formData, presion_diastolica: e.target.value })}
                  placeholder="80"
                />
              </div>
              <div>
                <Label className="text-xs">FC (bpm)</Label>
                <Input
                  type="number"
                  value={formData.frecuencia_cardiaca}
                  onChange={(e) => setFormData({ ...formData, frecuencia_cardiaca: e.target.value })}
                  placeholder="80"
                />
              </div>
              <div>
                <Label className="text-xs">FR (rpm)</Label>
                <Input
                  type="number"
                  value={formData.frecuencia_respiratoria}
                  onChange={(e) => setFormData({ ...formData, frecuencia_respiratoria: e.target.value })}
                  placeholder="18"
                />
              </div>
              <div>
                <Label className="text-xs">Temperatura (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.temperatura}
                  onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                  placeholder="36.5"
                />
              </div>
              <div>
                <Label className="text-xs">Sat O2 (%)</Label>
                <Input
                  type="number"
                  value={formData.saturacion_oxigeno}
                  onChange={(e) => setFormData({ ...formData, saturacion_oxigeno: e.target.value })}
                  placeholder="98"
                />
              </div>
              <div>
                <Label className="text-xs">Glasgow</Label>
                <Input
                  type="number"
                  value={formData.escala_glasgow}
                  onChange={(e) => setFormData({ ...formData, escala_glasgow: e.target.value })}
                  placeholder="15"
                  min="3"
                  max="15"
                />
              </div>
              <div>
                <Label className="text-xs">Dolor (0-10)</Label>
                <Input
                  type="number"
                  value={formData.escala_dolor}
                  onChange={(e) => setFormData({ ...formData, escala_dolor: e.target.value })}
                  placeholder="0"
                  min="0"
                  max="10"
                />
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Medio de Llegada</Label>
              <Select value={formData.medio_llegada} onValueChange={(value) => setFormData({ ...formData, medio_llegada: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Particular">Particular</SelectItem>
                  <SelectItem value="Ambulancia">Ambulancia</SelectItem>
                  <SelectItem value="Policia">Policía</SelectItem>
                  <SelectItem value="Bomberos">Bomberos</SelectItem>
                  <SelectItem value="Remitido">Remitido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Acompañante</Label>
              <Input
                value={formData.acompanante}
                onChange={(e) => setFormData({ ...formData, acompanante: e.target.value })}
                placeholder="Nombre del acompañante"
              />
            </div>
          </div>

          <div>
            <Label>Observaciones</Label>
            <Textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Observaciones adicionales..."
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-red-600 hover:bg-red-700"
            >
              Registrar Triaje
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal de Disposición (Alta, Cita, Hospitalización)
function ModalDisposicion({ open, onClose, atencion, tipo, onSuccess, user }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    diagnostico: '',
    tratamiento: '',
    indicaciones_alta: '',
    // Para cita
    doctor_id: '',
    especialidad_id: '',
    fecha: '',
    hora: '',
    // Para hospitalización
    unidad_id: '',
    cama_id: '',
    motivo_ingreso: '',
    sin_cama: false,
  });
  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [camas, setCamas] = useState([]);

  useEffect(() => {
    if (open && tipo === 'cita') {
      loadDoctoresEspecialidades();
    }
    if (open && tipo === 'hospitalizar') {
      loadUnidades();
    }
  }, [open, tipo]);

  const loadDoctoresEspecialidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const [doctoresRes, especialidadesRes] = await Promise.all([
        fetch(`${apiUrl}/doctores?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/especialidades?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (doctoresRes.ok) {
        const data = await doctoresRes.json();
        setDoctores(data.data || []);
      }
      if (especialidadesRes.ok) {
        const data = await especialidadesRes.json();
        setEspecialidades(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/unidades?activo=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUnidades(data.data?.unidades || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadCamasDisponibles = async (unidadId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/camas/disponibles?unidadId=${unidadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCamas(data.data?.camas || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      let endpoint = '';
      let payload = {};

      if (tipo === 'alta') {
        endpoint = `${apiUrl}/urgencias/${atencion.id}/alta`;
        payload = {
          diagnostico: formData.diagnostico,
          tratamiento: formData.tratamiento,
          indicaciones_alta: formData.indicaciones_alta,
        };
      } else if (tipo === 'cita') {
        endpoint = `${apiUrl}/urgencias/${atencion.id}/programar-cita`;
        payload = {
          doctor_id: formData.doctor_id,
          especialidad_id: formData.especialidad_id,
          fecha: formData.fecha,
          hora: formData.hora,
          diagnostico: formData.diagnostico,
          indicaciones: formData.indicaciones_alta,
        };
      } else if (tipo === 'hospitalizar') {
        endpoint = `${apiUrl}/urgencias/${atencion.id}/hospitalizar`;
        payload = {
          unidad_id: formData.unidad_id,
          cama_id: formData.sin_cama ? null : formData.cama_id,
          motivo_ingreso: formData.motivo_ingreso || atencion.motivoConsulta,
          diagnostico_ingreso: formData.diagnostico || atencion.diagnosticoInicial,
          observaciones: formData.indicaciones_alta,
        };
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ description: `${tipo === 'alta' ? 'Alta' : tipo === 'cita' ? 'Cita' : 'Hospitalización'} registrada correctamente` });
        onSuccess();
      } else {
        const error = await response.json();
        toast({ description: error.message || 'Error', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ description: 'Error en la operación', variant: 'destructive' });
    }
  };

  if (!atencion) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {tipo === 'alta' && '✅ Dar de Alta'}
            {tipo === 'cita' && '📅 Programar Cita de Seguimiento'}
            {tipo === 'hospitalizar' && '🏥 Hospitalizar Paciente'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Diagnóstico (común para todos) */}
          <div>
            <Label>Diagnóstico *</Label>
            <Textarea
              value={formData.diagnostico}
              onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
              placeholder="Diagnóstico del paciente..."
              rows={2}
            />
          </div>

          {tipo === 'alta' && (
            <>
              <div>
                <Label>Tratamiento Aplicado</Label>
                <Textarea
                  value={formData.tratamiento}
                  onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                  placeholder="Medicamentos y tratamientos aplicados..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Indicaciones de Alta *</Label>
                <Textarea
                  value={formData.indicaciones_alta}
                  onChange={(e) => setFormData({ ...formData, indicaciones_alta: e.target.value })}
                  placeholder="Indicaciones para el paciente..."
                  rows={3}
                />
              </div>
            </>
          )}

          {tipo === 'cita' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Especialidad *</Label>
                  <Select value={formData.especialidad_id} onValueChange={(value) => setFormData({ ...formData, especialidad_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map(esp => (
                        <SelectItem key={esp.id} value={esp.id}>{esp.titulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Doctor *</Label>
                  <Select value={formData.doctor_id} onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctores.map(doc => (
                        <SelectItem key={doc.usuario.id} value={doc.usuario.id}>
                          Dr. {doc.usuario.nombre} {doc.usuario.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hora *</Label>
                  <Input
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Indicaciones</Label>
                <Textarea
                  value={formData.indicaciones_alta}
                  onChange={(e) => setFormData({ ...formData, indicaciones_alta: e.target.value })}
                  placeholder="Indicaciones para la cita..."
                  rows={2}
                />
              </div>
            </>
          )}

          {tipo === 'hospitalizar' && (
            <>
              <div>
                <Label>Unidad *</Label>
                <Select 
                  value={formData.unidad_id} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, unidad_id: value });
                    if (!formData.sin_cama) {
                      loadCamasDisponibles(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map(unidad => (
                      <SelectItem key={unidad.id} value={unidad.id}>
                        {unidad.nombre} ({unidad.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sin_cama"
                  checked={formData.sin_cama}
                  onChange={(e) => setFormData({ ...formData, sin_cama: e.target.checked, cama_id: '' })}
                  className="w-4 h-4"
                />
                <Label htmlFor="sin_cama" className="cursor-pointer">
                  Sin cama asignada (Salón común / Observación)
                </Label>
              </div>

              {!formData.sin_cama && (
                <div>
                  <Label>Cama *</Label>
                  <Select 
                    value={formData.cama_id} 
                    onValueChange={(value) => setFormData({ ...formData, cama_id: value })}
                    disabled={!formData.unidad_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cama..." />
                    </SelectTrigger>
                    <SelectContent>
                      {camas.map(cama => (
                        <SelectItem key={cama.id} value={cama.id}>
                          {cama.numero} - Hab. {cama.habitacion?.numero}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Motivo de Ingreso</Label>
                <Textarea
                  value={formData.motivo_ingreso}
                  onChange={(e) => setFormData({ ...formData, motivo_ingreso: e.target.value })}
                  placeholder="Motivo de hospitalización..."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
