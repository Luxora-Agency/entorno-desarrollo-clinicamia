'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, Clock, User, Phone, FileText, CheckCircle,
  XCircle, PlayCircle, Loader2, RefreshCw, Filter,
  ChevronRight, AlertCircle, Stethoscope, Search,
  CalendarCheck, Clock3, Activity, Heart, Droplets,
  AlertTriangle, MessageSquare, ExternalLink, Timer,
  TrendingUp, Users, PhoneCall, Mail, MapPin, Baby,
  Pill, ClipboardList, Eye, MoreHorizontal, Star,
  Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';

// Mapeo de estados a colores y labels
const estadoConfig = {
  Programada: {
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-400',
    label: 'Programada',
    icon: Calendar
  },
  Confirmada: {
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    dotColor: 'bg-blue-500',
    label: 'Confirmada',
    icon: CheckCircle
  },
  EnEspera: {
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    dotColor: 'bg-amber-500 animate-pulse',
    label: 'En Espera',
    icon: Clock3
  },
  EnAtencion: {
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    dotColor: 'bg-emerald-500 animate-pulse',
    label: 'En Atención',
    icon: Activity
  },
  Completada: {
    color: 'bg-green-100 text-green-700 border-green-300',
    dotColor: 'bg-green-500',
    label: 'Completada',
    icon: CheckCircle
  },
  Cancelada: {
    color: 'bg-red-100 text-red-700 border-red-300',
    dotColor: 'bg-red-400',
    label: 'Cancelada',
    icon: XCircle
  },
  NoAsistio: {
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    dotColor: 'bg-orange-400',
    label: 'No Asistió',
    icon: XCircle
  },
};

// Calcular edad
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

export default function MisCitasDelDiaView({ user }) {
  const { toast } = useToast();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorId, setDoctorId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [expandedCita, setExpandedCita] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [vistaTimeline, setVistaTimeline] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Actualizar hora cada minuto
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar perfil del doctor
  useEffect(() => {
    const cargarDoctorId = async () => {
      if (!user?.id) return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/doctores?usuarioId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          setDoctorId(data.data[0].id);
        }
      } catch (error) {
        console.error('Error loading doctor profile:', error);
      }
    };
    cargarDoctorId();
  }, [user?.id, apiUrl]);

  // Cargar citas del día
  const cargarCitas = useCallback(async (showRefresh = false) => {
    if (!doctorId) return;

    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];

      const response = await fetch(
        `${apiUrl}/citas?doctorId=${doctorId}&fecha=${today}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (data.success) {
        setCitas(data.data || []);
      }
    } catch (error) {
      console.error('Error loading citas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las citas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorId, apiUrl, toast]);

  useEffect(() => {
    if (doctorId) {
      cargarCitas();
      const interval = setInterval(() => cargarCitas(true), 30000);
      return () => clearInterval(interval);
    }
  }, [doctorId, cargarCitas]);

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const total = citas.length;
    const pendientes = citas.filter(c => ['Programada', 'Confirmada'].includes(c.estado)).length;
    const enEspera = citas.filter(c => c.estado === 'EnEspera').length;
    const enAtencion = citas.filter(c => c.estado === 'EnAtencion').length;
    const completadas = citas.filter(c => c.estado === 'Completada').length;
    const canceladas = citas.filter(c => ['Cancelada', 'NoAsistio'].includes(c.estado)).length;
    const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;

    return { total, pendientes, enEspera, enAtencion, completadas, canceladas, progreso };
  }, [citas]);

  // Próxima cita
  const proximaCita = useMemo(() => {
    const ahora = currentTime;
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

    const citasPendientes = citas
      .filter(c => ['Programada', 'Confirmada', 'EnEspera'].includes(c.estado))
      .map(c => {
        const hora = formatHoraToMinutes(c.hora);
        return { ...c, horaMinutos: hora };
      })
      .filter(c => c.horaMinutos >= horaActual)
      .sort((a, b) => a.horaMinutos - b.horaMinutos);

    return citasPendientes[0] || null;
  }, [citas, currentTime]);

  // Cita en atención actual
  const citaEnAtencion = useMemo(() => {
    return citas.find(c => c.estado === 'EnAtencion') || null;
  }, [citas]);

  // Cambiar estado de cita
  const cambiarEstadoCita = async (citaId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/citas/${citaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Estado actualizado',
          description: `Cita marcada como ${estadoConfig[nuevoEstado]?.label || nuevoEstado}`,
        });
        cargarCitas(true);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating cita:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive'
      });
    }
  };

  // Filtrar citas
  const citasFiltradas = useMemo(() => {
    return citas.filter(cita => {
      if (filtroEstado !== 'todos' && cita.estado !== filtroEstado) return false;
      if (busqueda.trim()) {
        const searchLower = busqueda.toLowerCase();
        const paciente = cita.paciente;
        return (
          paciente?.nombre?.toLowerCase().includes(searchLower) ||
          paciente?.apellido?.toLowerCase().includes(searchLower) ||
          paciente?.cedula?.includes(searchLower)
        );
      }
      return true;
    });
  }, [citas, filtroEstado, busqueda]);

  // Ordenar por hora
  const citasOrdenadas = useMemo(() => {
    return [...citasFiltradas].sort((a, b) => {
      const horaA = formatHoraToMinutes(a.hora);
      const horaB = formatHoraToMinutes(b.hora);
      return horaA - horaB;
    });
  }, [citasFiltradas]);

  // Agrupar citas por período del día
  const citasPorPeriodo = useMemo(() => {
    const manana = citasOrdenadas.filter(c => formatHoraToMinutes(c.hora) < 720); // antes de 12:00
    const tarde = citasOrdenadas.filter(c => {
      const mins = formatHoraToMinutes(c.hora);
      return mins >= 720 && mins < 1080; // 12:00 - 18:00
    });
    const noche = citasOrdenadas.filter(c => formatHoraToMinutes(c.hora) >= 1080); // después de 18:00
    return { manana, tarde, noche };
  }, [citasOrdenadas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando citas del día...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header con hora actual */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-200">
              <CalendarCheck className="h-6 w-6 text-white" />
            </div>
            Mis Citas del Día
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-gray-600">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <Badge variant="outline" className="font-mono">
              <Clock className="h-3 w-3 mr-1" />
              {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={vistaTimeline ? "default" : "outline"}
            size="sm"
            onClick={() => setVistaTimeline(!vistaTimeline)}
            className="gap-2"
          >
            <Timer className="h-4 w-4" />
            Timeline
          </Button>
          <Button
            variant="outline"
            onClick={() => cargarCitas(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Cita en Atención Actual */}
      {citaEnAtencion && (
        <Card className="border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg shadow-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-700 mb-3">
              <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-semibold text-sm uppercase tracking-wide">En Atención Ahora</span>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-emerald-300">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-bold">
                  {citaEnAtencion.paciente?.nombre?.charAt(0)}{citaEnAtencion.paciente?.apellido?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-900">
                  {citaEnAtencion.paciente?.nombre} {citaEnAtencion.paciente?.apellido}
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{citaEnAtencion.paciente?.cedula}</span>
                  {citaEnAtencion.paciente?.fechaNacimiento && (
                    <span>{calcularEdad(citaEnAtencion.paciente.fechaNacimiento)} años</span>
                  )}
                  <span>• {citaEnAtencion.motivo || 'Consulta general'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700 shadow-lg"
                  onClick={() => cambiarEstadoCita(citaEnAtencion.id, 'Completada')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Consulta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards Mejorados */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Total Citas</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-700">{stats.pendientes}</p>
                <p className="text-xs text-gray-500 mt-1">Pendientes</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-amber-600">{stats.enEspera}</p>
                <p className="text-xs text-gray-500 mt-1">En Espera</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{stats.enAtencion}</p>
                <p className="text-xs text-gray-500 mt-1">En Atención</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600">{stats.completadas}</p>
                <p className="text-xs text-gray-500 mt-1">Completadas</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-red-600">{stats.canceladas}</p>
                <p className="text-xs text-gray-500 mt-1">Canceladas</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Progreso del Día */}
      <Card className="border-0 shadow-md bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Progreso del Día</span>
            </div>
            <span className="text-sm font-bold text-blue-600">{stats.progreso}%</span>
          </div>
          <Progress value={stats.progreso} className="h-2" />
          <p className="text-xs text-gray-500 mt-2">
            {stats.completadas} de {stats.total} citas completadas
          </p>
        </CardContent>
      </Card>

      {/* Próxima Cita */}
      {proximaCita && !citaEnAtencion && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700 mb-3">
              <Zap className="h-4 w-4" />
              <span className="font-semibold text-sm uppercase tracking-wide">Próxima Cita</span>
              <Badge variant="secondary" className="text-xs">
                {formatHora(proximaCita.hora)}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-blue-200">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                  {proximaCita.paciente?.nombre?.charAt(0)}{proximaCita.paciente?.apellido?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {proximaCita.paciente?.nombre} {proximaCita.paciente?.apellido}
                </p>
                <p className="text-sm text-gray-600">{proximaCita.motivo || 'Consulta general'}</p>
              </div>
              <div className="flex gap-2">
                {proximaCita.estado !== 'EnEspera' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                    onClick={() => cambiarEstadoCita(proximaCita.id, 'EnEspera')}
                  >
                    <Clock3 className="h-4 w-4 mr-1" />
                    En Espera
                  </Button>
                )}
                {proximaCita.estado === 'EnEspera' && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => cambiarEstadoCita(proximaCita.id, 'EnAtencion')}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Iniciar Atención
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card className="border-0 shadow-md bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o cédula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full md:w-52 bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Programada">Programada</SelectItem>
                <SelectItem value="Confirmada">Confirmada</SelectItem>
                <SelectItem value="EnEspera">En Espera</SelectItem>
                <SelectItem value="EnAtencion">En Atención</SelectItem>
                <SelectItem value="Completada">Completada</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
                <SelectItem value="NoAsistio">No Asistió</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vista Timeline o Lista */}
      {vistaTimeline ? (
        <TimelineView
          citasPorPeriodo={citasPorPeriodo}
          currentTime={currentTime}
          onCambiarEstado={cambiarEstadoCita}
          expandedCita={expandedCita}
          setExpandedCita={setExpandedCita}
        />
      ) : (
        <ListaView
          citasOrdenadas={citasOrdenadas}
          filtroEstado={filtroEstado}
          onCambiarEstado={cambiarEstadoCita}
          expandedCita={expandedCita}
          setExpandedCita={setExpandedCita}
        />
      )}
    </div>
  );
}

// Componente Vista Timeline
function TimelineView({ citasPorPeriodo, currentTime, onCambiarEstado, expandedCita, setExpandedCita }) {
  const periodos = [
    { key: 'manana', label: 'Mañana', icon: '🌅', range: '6:00 - 12:00', citas: citasPorPeriodo.manana },
    { key: 'tarde', label: 'Tarde', icon: '☀️', range: '12:00 - 18:00', citas: citasPorPeriodo.tarde },
    { key: 'noche', label: 'Noche', icon: '🌙', range: '18:00 - 22:00', citas: citasPorPeriodo.noche },
  ];

  return (
    <div className="space-y-4">
      {periodos.map((periodo) => (
        <Card key={periodo.key} className="border-0 shadow-md bg-white overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{periodo.icon}</span>
                <span>{periodo.label}</span>
                <span className="text-xs text-gray-400 font-normal">({periodo.range})</span>
              </div>
              <Badge variant="secondary">{periodo.citas.length} citas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {periodo.citas.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No hay citas en este horario
              </div>
            ) : (
              <div className="divide-y">
                {periodo.citas.map((cita) => (
                  <CitaCard
                    key={cita.id}
                    cita={cita}
                    onCambiarEstado={onCambiarEstado}
                    isExpanded={expandedCita === cita.id}
                    onToggleExpand={() => setExpandedCita(expandedCita === cita.id ? null : cita.id)}
                    compact
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente Vista Lista
function ListaView({ citasOrdenadas, filtroEstado, onCambiarEstado, expandedCita, setExpandedCita }) {
  if (citasOrdenadas.length === 0) {
    return (
      <Card className="border-0 shadow-md bg-white">
        <CardContent className="py-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {filtroEstado !== 'todos'
                ? 'No hay citas con el estado seleccionado'
                : 'No tienes citas programadas para hoy'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md bg-white overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span>Lista de Citas</span>
          <Badge variant="secondary">{citasOrdenadas.length} citas</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="divide-y">
            {citasOrdenadas.map((cita) => (
              <CitaCard
                key={cita.id}
                cita={cita}
                onCambiarEstado={onCambiarEstado}
                isExpanded={expandedCita === cita.id}
                onToggleExpand={() => setExpandedCita(expandedCita === cita.id ? null : cita.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Componente Tarjeta de Cita
function CitaCard({ cita, onCambiarEstado, isExpanded, onToggleExpand, compact = false }) {
  const paciente = cita.paciente;
  const config = estadoConfig[cita.estado] || estadoConfig.Programada;
  const StatusIcon = config.icon;
  const edad = calcularEdad(paciente?.fechaNacimiento);

  return (
    <div className={`transition-all ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Timeline dot y hora */}
          <div className="flex flex-col items-center">
            <div className={`h-3 w-3 rounded-full ${config.dotColor}`} />
            <div className="w-px h-full bg-gray-200 mt-1" />
          </div>

          <div className="text-center min-w-[70px]">
            <p className="text-xl font-bold text-gray-900">{formatHora(cita.hora)}</p>
            <p className="text-xs text-gray-500">{cita.duracion || 30} min</p>
          </div>

          {/* Info del paciente */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <Avatar className="h-11 w-11 flex-shrink-0">
                <AvatarFallback className={`font-semibold ${
                  cita.estado === 'EnAtencion' ? 'bg-emerald-100 text-emerald-700' :
                  cita.estado === 'EnEspera' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {paciente?.nombre?.charAt(0)}{paciente?.apellido?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">
                    {paciente?.nombre} {paciente?.apellido}
                  </p>
                  {paciente?.alergias && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="destructive" className="h-5 px-1.5">
                            <AlertTriangle className="h-3 w-3" />
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Alergias: {paciente.alergias}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                  <span>{paciente?.tipoDocumento}: {paciente?.cedula}</span>
                  {edad && <span>• {edad} años</span>}
                </div>
                {cita.motivo && (
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {cita.motivo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Estado y acciones */}
          <div className="flex items-center gap-2">
            <Badge className={`${config.color} border`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {(cita.estado === 'Programada' || cita.estado === 'Confirmada') && (
                  <DropdownMenuItem onClick={() => onCambiarEstado(cita.id, 'EnEspera')}>
                    <Clock3 className="h-4 w-4 mr-2 text-amber-600" />
                    Marcar En Espera
                  </DropdownMenuItem>
                )}
                {cita.estado === 'EnEspera' && (
                  <DropdownMenuItem onClick={() => onCambiarEstado(cita.id, 'EnAtencion')}>
                    <PlayCircle className="h-4 w-4 mr-2 text-emerald-600" />
                    Iniciar Atención
                  </DropdownMenuItem>
                )}
                {cita.estado === 'EnAtencion' && (
                  <DropdownMenuItem onClick={() => onCambiarEstado(cita.id, 'Completada')}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Completar Cita
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {!['Completada', 'Cancelada', 'NoAsistio'].includes(cita.estado) && (
                  <>
                    <DropdownMenuItem onClick={() => onCambiarEstado(cita.id, 'NoAsistio')}>
                      <XCircle className="h-4 w-4 mr-2 text-orange-600" />
                      No Asistió
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onCambiarEstado(cita.id, 'Cancelada')}
                      className="text-red-600"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar Cita
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Detalles expandidos */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-[98px] p-4 bg-white rounded-lg border space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {paciente?.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="font-medium">{paciente.telefono}</p>
                  </div>
                </div>
              )}
              {paciente?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium truncate">{paciente.email}</p>
                  </div>
                </div>
              )}
              {paciente?.grupoSanguineo && (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-red-400" />
                  <div>
                    <p className="text-xs text-gray-500">Grupo Sanguíneo</p>
                    <p className="font-medium">{paciente.grupoSanguineo}</p>
                  </div>
                </div>
              )}
              {cita.especialidad?.nombre && (
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Especialidad</p>
                    <p className="font-medium">{cita.especialidad.nombre}</p>
                  </div>
                </div>
              )}
            </div>

            {paciente?.alergias && (
              <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Alergias: {paciente.alergias}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="flex-1">
                <ClipboardList className="h-4 w-4 mr-2" />
                Ver Historia
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Pill className="h-4 w-4 mr-2" />
                Prescripciones
              </Button>
              {paciente?.telefono && (
                <Button variant="outline" size="sm">
                  <PhoneCall className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatHora(hora) {
  if (!hora) return '--:--';
  try {
    if (typeof hora === 'string' && hora.includes('T')) {
      return new Date(hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
    return hora.substring(0, 5);
  } catch {
    return hora;
  }
}

function formatHoraToMinutes(hora) {
  if (!hora) return 0;
  try {
    let hours, minutes;
    if (typeof hora === 'string' && hora.includes('T')) {
      const date = new Date(hora);
      hours = date.getHours();
      minutes = date.getMinutes();
    } else {
      const parts = hora.split(':');
      hours = parseInt(parts[0]) || 0;
      minutes = parseInt(parts[1]) || 0;
    }
    return hours * 60 + minutes;
  } catch {
    return 0;
  }
}
