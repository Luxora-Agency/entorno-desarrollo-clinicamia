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
  Atendiendo: {
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

  // Usar Usuario.id directamente como doctorId
  // NOTA: Cita.doctorId apunta a Usuario.id, NO a Doctor.id
  useEffect(() => {
    console.log('[MisCitasDelDia] User prop recibido:', {
      user,
      userId: user?.id,
      userRol: user?.rol
    });
    if (user?.id) {
      setDoctorId(user.id);
      console.log('[MisCitasDelDia] doctorId establecido:', user.id);
    } else {
      console.warn('[MisCitasDelDia] No se encontró user.id');
    }
  }, [user?.id]);

  // Cargar citas del día
  const cargarCitas = useCallback(async (showRefresh = false) => {
    if (!doctorId) {
      console.log('[MisCitasDelDia] No hay doctorId, abortando carga');
      return;
    }

    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const url = `${apiUrl}/citas?doctorId=${doctorId}&fecha=${today}&limit=100`;

      console.log('[MisCitasDelDia] Cargando citas:', { doctorId, fecha: today, url });

      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      const data = await response.json();
      console.log('[MisCitasDelDia] Respuesta API completa:', data);

      if (data.success || data.status === 'success') {
        // La API retorna 'citas' no 'data' según la estructura de paginated()
        const citasData = data.citas || data.data || [];
        console.log('[MisCitasDelDia] Citas encontradas:', citasData.length);
        setCitas(citasData);
      } else {
        console.warn('[MisCitasDelDia] API retornó error:', data.message);
      }
    } catch (error) {
      console.error('[MisCitasDelDia] Error loading citas:', error);
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
    const enAtencion = citas.filter(c => c.estado === 'Atendiendo').length;
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
  const citaAtendiendo = useMemo(() => {
    return citas.find(c => c.estado === 'Atendiendo') || null;
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

  // Ordenar por cola de atención: pendientes primero por hora, completados al final
  const citasOrdenadas = useMemo(() => {
    return [...citasFiltradas].sort((a, b) => {
      // Los completados y cancelados van al final
      const estadosFinal = ['Completada', 'Cancelada', 'NoAsistio'];
      const aFinal = estadosFinal.includes(a.estado);
      const bFinal = estadosFinal.includes(b.estado);

      if (aFinal && !bFinal) return 1;  // a va después
      if (!aFinal && bFinal) return -1; // b va después

      // Dentro de cada grupo, ordenar por hora de cita
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
    <div className="p-4 lg:p-6 space-y-5 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 min-h-screen">
      {/* Header Mejorado */}
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-violet-600/5" />
        <div className="relative p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-40" />
              <div className="relative p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <CalendarCheck className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Mis Citas del Día
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-gray-500 text-sm capitalize">
                  {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-blue-700 font-mono">
                    {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={vistaTimeline ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaTimeline(!vistaTimeline)}
              className={`gap-2 rounded-xl transition-all ${vistaTimeline ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200' : 'hover:bg-gray-50'}`}
            >
              <Timer className="h-4 w-4" />
              Timeline
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cargarCitas(true)}
              disabled={refreshing}
              className="gap-2 rounded-xl hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Cita en Atención Actual - Diseño mejorado */}
      {citaAtendiendo && (
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-emerald-300 shadow-lg shadow-emerald-100/50">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10" />
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-teal-400/20 to-emerald-400/20 rounded-full translate-y-1/2 translate-x-1/2" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-lg shadow-emerald-200">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">En Atención</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                <Clock className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 font-mono">{formatHora(citaAtendiendo.hora)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-md opacity-40 animate-pulse" />
                <Avatar className="relative h-16 w-16 border-3 border-white shadow-xl ring-4 ring-emerald-100">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xl font-bold">
                    {citaAtendiendo.paciente?.nombre?.charAt(0)}{citaAtendiendo.paciente?.apellido?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold text-gray-900">
                  {citaAtendiendo.paciente?.nombre} {citaAtendiendo.paciente?.apellido}
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  <span className="font-medium">{citaAtendiendo.paciente?.cedula}</span>
                  {citaAtendiendo.paciente?.fechaNacimiento && (
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{calcularEdad(citaAtendiendo.paciente.fechaNacimiento)} años</span>
                  )}
                  <span className="text-gray-400">•</span>
                  <span className="truncate">{citaAtendiendo.motivo || 'Consulta general'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.href = `/?module=consulta&pacienteId=${citaAtendiendo.paciente?.id}&citaId=${citaAtendiendo.id}`}
                  variant="outline"
                  className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Continuar
                </Button>
                <Button
                  className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-200"
                  onClick={() => cambiarEstadoCita(citaAtendiendo.id, 'Completada')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paciente En Espera - Diseño mejorado */}
      {!citaAtendiendo && stats.enEspera > 0 && (() => {
        const primeraEnEspera = citas.find(c => c.estado === 'EnEspera');
        if (!primeraEnEspera) return null;
        return (
          <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-amber-300 shadow-lg shadow-amber-100/50">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-400/20 to-orange-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-400/20 to-amber-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg shadow-amber-200 animate-pulse">
                  <Clock3 className="h-3.5 w-3.5 text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">En Espera</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full border border-amber-200">
                  <Clock className="h-3 w-3 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 font-mono">{formatHora(primeraEnEspera.hora)}</span>
                </div>
                {stats.enEspera > 1 && (
                  <span className="text-xs text-amber-600 font-medium">+{stats.enEspera - 1} más</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-md opacity-40 animate-pulse" />
                  <Avatar className="relative h-16 w-16 border-3 border-white shadow-xl ring-4 ring-amber-100">
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xl font-bold">
                      {primeraEnEspera.paciente?.nombre?.charAt(0)}{primeraEnEspera.paciente?.apellido?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-gray-900">
                    {primeraEnEspera.paciente?.nombre} {primeraEnEspera.paciente?.apellido}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <span className="font-medium">{primeraEnEspera.paciente?.cedula}</span>
                    {primeraEnEspera.paciente?.fechaNacimiento && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{calcularEdad(primeraEnEspera.paciente.fechaNacimiento)} años</span>
                    )}
                    <span className="text-gray-400">•</span>
                    <span className="truncate">{primeraEnEspera.motivo || 'Consulta general'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200 text-base px-6"
                    onClick={() => {
                      cambiarEstadoCita(primeraEnEspera.id, 'Atendiendo');
                      window.location.href = `/?module=consulta&pacienteId=${primeraEnEspera.paciente?.id}&citaId=${primeraEnEspera.id}`;
                    }}
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Iniciar Atención
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stats Cards con diseño moderno */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-xs font-medium text-gray-500">Total</p>
          </div>
        </div>

        {/* Pendientes */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-slate-200 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-700">{stats.pendientes}</span>
            </div>
            <p className="text-xs font-medium text-gray-500">Pendientes</p>
          </div>
        </div>

        {/* En Espera */}
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur ${stats.enEspera > 0 ? 'opacity-30 animate-pulse' : 'opacity-20'} group-hover:opacity-40 transition-opacity`} />
          <div className={`relative bg-white rounded-2xl p-4 border ${stats.enEspera > 0 ? 'border-amber-300 ring-2 ring-amber-200' : 'border-gray-100'} hover:border-amber-300 transition-all hover:shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                <Clock3 className={`h-4 w-4 text-white ${stats.enEspera > 0 ? 'animate-pulse' : ''}`} />
              </div>
              <span className="text-2xl font-bold text-amber-600">{stats.enEspera}</span>
            </div>
            <p className="text-xs font-medium text-gray-500">En Espera</p>
          </div>
        </div>

        {/* En Atención */}
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur ${stats.enAtencion > 0 ? 'opacity-30 animate-pulse' : 'opacity-20'} group-hover:opacity-40 transition-opacity`} />
          <div className={`relative bg-white rounded-2xl p-4 border ${stats.enAtencion > 0 ? 'border-emerald-300 ring-2 ring-emerald-200' : 'border-gray-100'} hover:border-emerald-300 transition-all hover:shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl">
                <Activity className={`h-4 w-4 text-white ${stats.enAtencion > 0 ? 'animate-pulse' : ''}`} />
              </div>
              <span className="text-2xl font-bold text-emerald-600">{stats.enAtencion}</span>
            </div>
            <p className="text-xs font-medium text-gray-500">Atendiendo</p>
          </div>
        </div>

        {/* Completadas */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-green-200 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.completadas}</span>
            </div>
            <p className="text-xs font-medium text-gray-500">Completadas</p>
          </div>
        </div>

        {/* Canceladas */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-red-200 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl">
                <XCircle className="h-4 w-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-red-500">{stats.canceladas}</span>
            </div>
            <p className="text-xs font-medium text-gray-500">Canceladas</p>
          </div>
        </div>
      </div>

      {/* Barra de Progreso Mejorada */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Progreso del Día</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{stats.completadas}/{stats.total}</span>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.progreso}%</span>
          </div>
        </div>
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${stats.progreso}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 rounded-full animate-pulse"
            style={{ width: `${stats.progreso}%` }}
          />
        </div>
      </div>

      {/* Próxima Cita - Diseño mejorado */}
      {proximaCita && !citaAtendiendo && (
        <div className="relative overflow-hidden bg-white rounded-2xl border border-blue-100 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-violet-500/5" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                <Zap className="h-3.5 w-3.5 text-white" />
                <span className="text-xs font-semibold text-white uppercase tracking-wide">Próxima</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full border border-blue-200">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 font-mono">{formatHora(proximaCita.hora)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur opacity-30" />
                <Avatar className="relative h-14 w-14 border-2 border-white shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold">
                    {proximaCita.paciente?.nombre?.charAt(0)}{proximaCita.paciente?.apellido?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-lg">
                  {proximaCita.paciente?.nombre} {proximaCita.paciente?.apellido}
                </p>
                <p className="text-sm text-gray-500 truncate">{proximaCita.motivo || 'Consulta general'}</p>
              </div>
              <div className="flex gap-2">
                {proximaCita.estado !== 'EnEspera' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
                    onClick={() => cambiarEstadoCita(proximaCita.id, 'EnEspera')}
                  >
                    <Clock3 className="h-4 w-4 mr-1.5" />
                    En Espera
                  </Button>
                )}
                {proximaCita.estado === 'EnEspera' && (
                  <Button
                    size="sm"
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200"
                    onClick={() => {
                      cambiarEstadoCita(proximaCita.id, 'Atendiendo');
                      window.location.href = `/?module=consulta&pacienteId=${proximaCita.paciente?.id}&citaId=${proximaCita.id}`;
                    }}
                  >
                    <PlayCircle className="h-4 w-4 mr-1.5" />
                    Iniciar Atención
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Mejorados */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-gray-100 rounded-lg">
              <Search className="h-3.5 w-3.5 text-gray-500" />
            </div>
            <Input
              placeholder="Buscar por nombre o cédula..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-11 h-11 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full md:w-56 h-11 bg-gray-50/50 border-gray-200 rounded-xl">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="Programada">📅 Programada</SelectItem>
              <SelectItem value="Confirmada">✓ Confirmada</SelectItem>
              <SelectItem value="EnEspera">⏳ En Espera</SelectItem>
              <SelectItem value="Atendiendo">🩺 En Atención</SelectItem>
              <SelectItem value="Completada">✅ Completada</SelectItem>
              <SelectItem value="Cancelada">❌ Cancelada</SelectItem>
              <SelectItem value="NoAsistio">⚠️ No Asistió</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
            <p className="text-xs text-gray-500">{cita.duracionMinutos || 30} min</p>
          </div>

          {/* Info del paciente */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <Avatar className="h-11 w-11 flex-shrink-0">
                <AvatarFallback className={`font-semibold ${
                  cita.estado === 'Atendiendo' ? 'bg-emerald-100 text-emerald-700' :
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
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {/* Tipo de cita y servicio */}
                  {(cita.tipoCita || cita.especialidad || cita.examenProcedimiento) && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {cita.tipoCita === 'Especialidad'
                        ? cita.especialidad?.nombre || cita.especialidad?.titulo
                        : cita.examenProcedimiento?.nombre || cita.tipoCita}
                    </Badge>
                  )}
                  {cita.motivo && (
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {cita.motivo}
                    </span>
                  )}
                </div>
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
                  <DropdownMenuItem onClick={() => onCambiarEstado(cita.id, 'Atendiendo')}>
                    <PlayCircle className="h-4 w-4 mr-2 text-emerald-600" />
                    Iniciar Atención
                  </DropdownMenuItem>
                )}
                {cita.estado === 'Atendiendo' && (
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
              {paciente?.tipoSangre && (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-red-400" />
                  <div>
                    <p className="text-xs text-gray-500">Grupo Sanguíneo</p>
                    <p className="font-medium">{paciente.tipoSangre}</p>
                  </div>
                </div>
              )}
              {(cita.especialidad?.nombre || cita.especialidad?.titulo || cita.examenProcedimiento?.nombre) && (
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">
                      {cita.examenProcedimiento ? cita.examenProcedimiento.tipo || 'Examen' : 'Especialidad'}
                    </p>
                    <p className="font-medium">
                      {cita.especialidad?.nombre || cita.especialidad?.titulo || cita.examenProcedimiento?.nombre}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Alertas médicas importantes */}
            {(paciente?.alergias || paciente?.enfermedadesCronicas) && (
              <div className="space-y-2">
                {paciente?.alergias && (
                  <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Alergias: {paciente.alergias}</span>
                    </div>
                  </div>
                )}
                {paciente?.enfermedadesCronicas && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm font-medium">Enf. Crónicas: {paciente.enfermedadesCronicas}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              {/* Botón principal: Iniciar/Continuar Consulta */}
              {['EnEspera', 'Atendiendo'].includes(cita.estado) && (
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    // Marcar como atendiendo si aún no lo está
                    if (cita.estado === 'EnEspera') {
                      onCambiarEstado(cita.id, 'Atendiendo');
                    }
                    // Navegar a la HCE para iniciar la consulta
                    window.location.href = `/?module=consulta&pacienteId=${paciente?.id}&citaId=${cita.id}`;
                  }}
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  {cita.estado === 'Atendiendo' ? 'Continuar Consulta' : 'Iniciar Consulta'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className={['EnEspera', 'Atendiendo'].includes(cita.estado) ? '' : 'flex-1'}
                onClick={() => window.location.href = `/?module=hce&pacienteId=${paciente?.id}`}
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Ver Historia
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/?module=hce&pacienteId=${paciente?.id}&tab=prescripciones`}
              >
                <Pill className="h-4 w-4 mr-2" />
                Prescripciones
              </Button>
              {paciente?.telefono && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${paciente.telefono}`, '_self')}
                >
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
