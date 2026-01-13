'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar, Clock, User, Activity, CheckCircle,
  AlertCircle, FileText, Stethoscope, Pill, ClipboardList,
  Eye, Play, CheckCheck, LogOut, Settings, BedDouble, Brain,
  RefreshCw, Sun, Moon, Sunrise, Sunset, TrendingUp, TrendingDown,
  Heart, Phone, Mail, AlertTriangle, Timer, UserCircle, ChevronRight,
  Sparkles, Award, Target, Zap, Bookmark, Plus, Search, Filter,
  MoreVertical, MessageSquare, Printer
} from 'lucide-react';
import { clearAttentionTypePreference } from './doctor/AttentionTypeSelector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Componentes Nuevos del Módulo Doctor
import ClinicalWorkspace from './doctor/ClinicalWorkspace';
import EpicrisisGenerator from './doctor/EpicrisisGenerator';
import DoctorScheduleManager from './DoctorScheduleManager';
import AnalizadorHCE from './doctor/AnalizadorHCE';
import DashboardDoctorQuirofano from './doctor/quirofano/DashboardDoctorQuirofano';
import BloqueoAgendaManager from './doctor/BloqueoAgendaManager';
import ProximasCitasWidget from './doctor/ProximasCitasWidget';
import DoctorNotifications from './doctor/DoctorNotifications';
import DoctorCommandPalette, { useDoctorCommandPalette } from './doctor/DoctorCommandPalette';
import HospitalizedPatientsWidget from './doctor/HospitalizedPatientsWidget';
import QuirofanoWidget from './doctor/QuirofanoWidget';
import RecentPatientsWidget, { addRecentPatient } from './doctor/RecentPatientsWidget';
import { ViewHeader } from './doctor/DoctorBreadcrumbs';
import ClinicalAlertsWidget from './doctor/ClinicalAlertsWidget';
import FloatingActionButton from './doctor/FloatingActionButton';
import KeyboardShortcutsHelp, { useKeyboardShortcutsHelp } from './doctor/KeyboardShortcutsHelp';
import useDisponibilidadRealtime from '@/hooks/useDisponibilidadRealtime';
import DraggableWidgetsContainer, { useWidgetLayout, WidgetLayoutControls } from './doctor/DraggableWidgetsContainer';

// Intervalo de auto-refresh para la cola de pacientes (30 segundos)
const QUEUE_REFRESH_INTERVAL = 30000;

// Helper para formatear hora desde ISO string o string simple
const formatHora = (hora) => {
  if (!hora) return '--:--';
  if (hora.includes('T')) {
    const timePart = hora.split('T')[1];
    return timePart.substring(0, 5);
  }
  return hora.substring(0, 5);
};

// Obtener saludo según la hora del día
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Buenos días', icon: Sunrise, color: 'text-amber-500' };
  if (hour >= 12 && hour < 18) return { text: 'Buenas tardes', icon: Sun, color: 'text-orange-500' };
  return { text: 'Buenas noches', icon: Moon, color: 'text-indigo-500' };
};

// Calcular tiempo de espera
const getWaitTime = (cita) => {
  if (cita.estado !== 'EnEspera' || !cita.horaLlegada) return null;
  const llegada = new Date(cita.horaLlegada);
  const ahora = new Date();
  const diffMinutes = Math.floor((ahora - llegada) / 60000);
  return diffMinutes;
};

// Configuración de prioridad
const getPriorityConfig = (cita) => {
  const waitTime = getWaitTime(cita);
  if (cita.prioridad === 'urgente' || cita.origenPaciente === 'urgencia') {
    return { label: 'Urgente', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50' };
  }
  if (cita.origenPaciente === 'prioritaria' || cita.origenPaciente === 'consulta_prioritaria') {
    return { label: 'Prioritaria', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50' };
  }
  if (waitTime && waitTime > 30) {
    return { label: 'Espera larga', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50' };
  }
  return null;
};

export default function DashboardDoctor({ user, onChangeAttentionType, initialMode = 'dashboard' }) {
  const { toast } = useToast();
  const getFechaHoy = () => new Date().toISOString().split('T')[0];

  const handleCambiarTipoAtencion = () => {
    clearAttentionTypePreference();
    if (onChangeAttentionType) {
      onChangeAttentionType();
    }
  };

  const [fechaSeleccionada, setFechaSeleccionada] = useState(getFechaHoy());
  const [citasHoy, setCitasHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Perfil del doctor (contiene el ID real del doctor)
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [doctorProfileError, setDoctorProfileError] = useState(null);
  const [doctorProfileLoading, setDoctorProfileLoading] = useState(true);

  // Modos de Vista
  const [viewMode, setViewMode] = useState(initialMode);
  const [activeCita, setActiveCita] = useState(null);
  const [activeAdmision, setActiveAdmision] = useState(null);
  const [showHCEAnalyzer, setShowHCEAnalyzer] = useState(false);

  // Command Palette (Ctrl+K)
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useDoctorCommandPalette();

  // Keyboard Shortcuts Help (?)
  const { isOpen: shortcutsHelpOpen, setIsOpen: setShortcutsHelpOpen } = useKeyboardShortcutsHelp();

  // Widget Layout personalizable (drag & drop)
  const {
    widgets: widgetLayout,
    isEditMode: widgetEditMode,
    setIsEditMode: setWidgetEditMode,
    reorderWidgets,
    toggleVisibility: toggleWidgetVisibility,
    toggleLock: toggleWidgetLock,
    resetLayout: resetWidgetLayout,
  } = useWidgetLayout(user?.id);

  // Refs para el polling
  const refreshIntervalRef = useRef(null);
  const isVisibleRef = useRef(true);

  const [stats, setStats] = useState({
    enEspera: 0,
    atendiendo: 0,
    completadas: 0,
    total: 0,
    canceladas: 0,
  });

  // Estadísticas adicionales
  const [extraStats, setExtraStats] = useState({
    hospitalizados: 0,
    cirugiasProgramadas: 0,
    proximaCita: null,
  });

  // Estadísticas de ayer para comparación de tendencias
  const [yesterdayStats, setYesterdayStats] = useState({
    total: 0,
    completadas: 0,
  });

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Cargar perfil del doctor para obtener el doctorId real
  const loadDoctorProfile = useCallback(async () => {
    if (!user?.id) return;
    setDoctorProfileLoading(true);
    setDoctorProfileError(null);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/doctores?usuarioId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data?.length > 0) {
        setDoctorProfile(data.data[0]);
        setDoctorProfileError(null);
      } else {
        setDoctorProfileError('No se encontró el perfil del doctor. Contacte al administrador.');
      }
    } catch (error) {
      console.error('Error loading doctor profile:', error);
      setDoctorProfileError('Error al cargar el perfil del doctor. Intente nuevamente.');
    } finally {
      setDoctorProfileLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDoctorProfile();
  }, [loadDoctorProfile]);

  const loadCitasHoy = useCallback(async (silent = false) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // IMPORTANTE: Usar user.id (Usuario.id) porque Cita.doctorId apunta a Usuario.id, NO a Doctor.id
      const doctorUsuarioId = user?.id;
      if (!doctorUsuarioId) {
        setLoading(false);
        return;
      }

      if (silent) {
        setIsRefreshing(true);
      }

      const url = `${apiUrl}/citas?fecha=${fechaSeleccionada}&doctorId=${doctorUsuarioId}&limit=100`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      const citas = data.data || data.citas || [];

      setCitasHoy(citas);

      // Encontrar próxima cita en espera
      const citasEnEspera = citas.filter(c => c.estado === 'EnEspera').sort((a, b) =>
        formatHora(a.hora).localeCompare(formatHora(b.hora))
      );

      setStats({
        enEspera: citas.filter(c => c.estado === 'EnEspera').length,
        atendiendo: citas.filter(c => c.estado === 'Atendiendo').length,
        completadas: citas.filter(c => c.estado === 'Completada').length,
        canceladas: citas.filter(c => c.estado === 'Cancelada').length,
        total: citas.length,
      });

      setExtraStats(prev => ({
        ...prev,
        proximaCita: citasEnEspera[0] || null,
      }));

      setLastRefresh(new Date());
      setLoading(false);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error loading citas:', error);
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [fechaSeleccionada, user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadCitasHoy();
    }
  }, [fechaSeleccionada, user?.id, loadCitasHoy]);

  // Cargar estadísticas de ayer para comparación
  useEffect(() => {
    const loadYesterdayStats = async () => {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Usar user.id (Usuario.id) para consultar citas
        const response = await fetch(
          `${apiUrl}/citas?doctorId=${user.id}&fecha=${yesterdayStr}&limit=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        const citas = data.data || data.citas || [];

        setYesterdayStats({
          total: citas.length,
          completadas: citas.filter(c => c.estado === 'Completada').length,
        });
      } catch (error) {
        console.error('Error loading yesterday stats:', error);
      }
    };

    loadYesterdayStats();
  }, [user?.id]);

  const { hasChanges: agendaHasChanges, acknowledgeChanges } = useDisponibilidadRealtime({
    doctorId: user?.id, // Usar Usuario.id porque Cita.doctorId apunta a Usuario.id
    fecha: fechaSeleccionada,
    enabled: viewMode === 'dashboard' && !!user?.id,
    onUpdate: () => {
      toast({
        title: 'Agenda actualizada',
        description: 'Se detectaron cambios en la disponibilidad.',
      });
      loadCitasHoy(true);
    },
  });

  useEffect(() => {
    if (viewMode !== 'dashboard') {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      if (isVisibleRef.current) {
        loadCitasHoy(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    refreshIntervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        loadCitasHoy(true);
      }
    }, QUEUE_REFRESH_INTERVAL);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [viewMode, loadCitasHoy]);

  const handleManualRefresh = useCallback(() => {
    loadCitasHoy(true);
    acknowledgeChanges();
  }, [loadCitasHoy, acknowledgeChanges]);

  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      await fetch(`${apiUrl}/citas/estado/${citaId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      loadCitasHoy();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const iniciarConsulta = async (cita) => {
    if (cita.estado === 'EnEspera') {
        await cambiarEstado(cita.id, 'Atendiendo');
    }
    setActiveCita(cita);
    setViewMode('consulta');
  };

  const handleFinishConsulta = async (data) => {
    try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

        const response = await fetch(`${apiUrl}/consultas/finalizar`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            // Agregar paciente a recientes
            if (activeCita?.paciente && user?.id) {
              addRecentPatient(user.id, activeCita.paciente, 'consulta');
            }
            toast({ title: 'Éxito', description: 'Consulta finalizada y firmada digitalmente.' });
            setViewMode('dashboard');
            setActiveCita(null);
            loadCitasHoy();
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error('Error finalizando consulta:', error);
        toast({ title: 'Error', description: 'Error de red al finalizar', variant: 'destructive' });
    }
  };

  // Filtrar citas
  const filteredCitas = citasHoy
    .filter(cita => {
      const matchesSearch = searchTerm === '' ||
        `${cita.paciente?.nombre} ${cita.paciente?.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.motivo?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || cita.estado === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => formatHora(a.hora).localeCompare(formatHora(b.hora)));

  // Calcular progreso del día
  const progressPercent = stats.total > 0 ? Math.round(((stats.completadas + stats.canceladas) / stats.total) * 100) : 0;

  // Calcular tendencias comparando con ayer
  const getTrend = (today, yesterday) => {
    if (yesterday === 0) return { direction: 'neutral', percent: 0 };
    const diff = today - yesterday;
    const percent = Math.round((Math.abs(diff) / yesterday) * 100);
    if (diff > 0) return { direction: 'up', percent };
    if (diff < 0) return { direction: 'down', percent };
    return { direction: 'neutral', percent: 0 };
  };

  const totalTrend = getTrend(stats.total, yesterdayStats.total);
  const completadasTrend = getTrend(stats.completadas, yesterdayStats.completadas);

  // Handler para acciones del CommandPalette
  const handleCommandAction = useCallback((action) => {
    switch (action.id) {
      case 'new-appointment':
        toast({ title: 'Nueva cita urgente', description: 'Función disponible próximamente.' });
        break;
      case 'new-prescription':
        toast({ title: 'Nueva fórmula', description: 'Selecciona un paciente primero.' });
        break;
      case 'lab-order':
      case 'imaging-order':
        toast({ title: action.label, description: 'Selecciona un paciente primero.' });
        break;
      case 'certificate':
        toast({ title: 'Certificado médico', description: 'Selecciona un paciente primero.' });
        break;
      case 'ai-assistant':
        setShowHCEAnalyzer(true);
        break;
      case 'view-schedule':
        setViewMode('agenda');
        break;
      default:
        toast({ title: action.label, description: action.description });
    }
  }, [toast]);

  // Handler para navegación desde CommandPalette
  const handleCommandNavigate = useCallback((path) => {
    if (path === '/dashboard') {
      setViewMode('dashboard');
    } else if (path === '/hospitalizacion') {
      setViewMode('hospitalizacion');
    } else if (path === '/hce') {
      setShowHCEAnalyzer(true);
    }
  }, []);

  // Handler para selección de paciente desde CommandPalette
  const handleCommandPatientSelect = useCallback((patient) => {
    toast({
      title: 'Paciente seleccionado',
      description: `${patient.nombre} ${patient.apellido} - ${patient.cedula}`,
    });
    // Aquí se podría abrir el HCE del paciente o iniciar una consulta
  }, [toast]);

  // Renderizado condicional de vistas completas
  if (viewMode === 'consulta' && activeCita) {
    return (
        <ClinicalWorkspace
            cita={activeCita}
            user={user}
            onClose={() => {
                if(confirm('¿Salir sin finalizar? Se perderán los datos no guardados.')) {
                    setViewMode('dashboard');
                    setActiveCita(null);
                }
            }}
            onFinish={handleFinishConsulta}
        />
    );
  }

  if (viewMode === 'agenda') {
      return (
          <div className="min-h-screen bg-gray-50">
              <ViewHeader
                currentView="agenda"
                onNavigate={(view) => setViewMode(view)}
                title="Mi Agenda Médica"
                subtitle="Gestiona tu disponibilidad, bloqueos y citas"
              />
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                        <DoctorScheduleManager
                            doctorId={doctorProfile?.id}
                            onChange={(newSchedule) => console.log('Schedule updated', newSchedule)}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <BloqueoAgendaManager
                            doctorId={user?.id}
                            doctorNombre={`Dr. ${user?.nombre || ''} ${user?.apellido || ''}`}
                        />
                    </div>
                </div>
              </div>
          </div>
      );
  }

  if (viewMode === 'quirofano') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <ViewHeader
          currentView="quirofano"
          onNavigate={(view) => setViewMode(view)}
          title="Quirófano"
          subtitle="Gestión de cirugías y protocolos quirúrgicos"
        />
        <DashboardDoctorQuirofano user={user} />
      </div>
    );
  }

  if (viewMode === 'epicrisis') {
      const pacienteName = activeAdmision?.paciente
        ? `${activeAdmision.paciente.nombre} ${activeAdmision.paciente.apellido}`
        : null;
      return (
          <div className="bg-gray-50 min-h-screen">
               <ViewHeader
                 currentView="epicrisis"
                 patientName={pacienteName}
                 onNavigate={(view) => setViewMode(view)}
                 title="Generar Epicrisis"
                 subtitle="Documento de resumen de hospitalización"
               />
               <div className="p-6 max-w-5xl mx-auto">
                    <EpicrisisGenerator
                        admisionId={activeAdmision?.id}
                        paciente={activeAdmision?.paciente}
                        onClose={() => setViewMode('dashboard')}
                    />
               </div>
          </div>
      );
  }

  // Mostrar error si el perfil del doctor no se pudo cargar
  if (doctorProfileError && !doctorProfileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Error al cargar perfil</CardTitle>
            <CardDescription className="text-gray-700 mt-2">
              {doctorProfileError}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={loadDoctorProfile} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar loading mientras se carga el perfil del doctor
  if (doctorProfileLoading && !doctorProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Cargando panel del doctor...</p>
        </div>
      </div>
    );
  }

  // VISTA DASHBOARD (DEFAULT) - REDISEÑADO
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header Mejorado */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Saludo y Info del Doctor */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white shadow-lg">
                  {doctorProfile?.foto ? (
                    <AvatarImage
                      src={doctorProfile.foto}
                      alt={`Dr. ${user?.nombre}`}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="text-white font-bold text-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                    {user?.nombre?.[0]}{user?.apellido?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <GreetingIcon className={`h-5 w-5 ${greeting.color}`} />
                  <span className="text-gray-600 text-sm font-medium">{greeting.text}</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Dr(a). {user?.nombre} {user?.apellido}
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {doctorProfile?.especialidades && doctorProfile.especialidades.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {doctorProfile.especialidades[0]?.nombre || 'Especialista'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen del Día */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-xs font-medium text-gray-600">Citas hoy</p>
                </div>
                <div className="h-8 w-px bg-blue-200"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{stats.enEspera}</p>
                  <p className="text-xs font-medium text-gray-600">En espera</p>
                </div>
                <div className="h-8 w-px bg-blue-200"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.completadas}</p>
                  <p className="text-xs font-medium text-gray-600">Completadas</p>
                </div>
              </div>

              {/* Selector de fecha */}
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  className="text-sm outline-none text-gray-700 bg-transparent"
                />
              </div>

              {/* Búsqueda rápida (Ctrl+K) */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border shadow-sm hover:bg-gray-50 transition-colors text-sm text-gray-600"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-600">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>

              {/* Notificaciones */}
              <DoctorNotifications
                doctorId={user?.id}
                className="bg-white rounded-xl border shadow-sm hover:bg-gray-50"
                onNotificationClick={(notification) => {
                  toast({
                    title: notification.title,
                    description: notification.message,
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tarjetas de estadísticas mejoradas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Pacientes en Espera */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group hover:shadow-lg transition-all cursor-pointer border-0 bg-gradient-to-br from-amber-50 to-orange-50 hover:scale-[1.02]"
                      onClick={() => setFilterStatus('EnEspera')}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-700">En Espera</p>
                        <p className="text-3xl font-bold text-amber-600 mt-1">{stats.enEspera}</p>
                        {stats.enEspera > 0 && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            Siguiente: {extraStats.proximaCita ? formatHora(extraStats.proximaCita.hora) : '--'}
                          </p>
                        )}
                      </div>
                      <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Pacientes esperando atención</p>
                <p className="text-xs text-gray-300">Click para filtrar por este estado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* En Consulta */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group hover:shadow-lg transition-all cursor-pointer border-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:scale-[1.02]"
                      onClick={() => setFilterStatus('Atendiendo')}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">En Consulta</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">{stats.atendiendo}</p>
                        {stats.atendiendo > 0 && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1 animate-pulse">
                            <Activity className="h-3 w-3" />
                            Atendiendo ahora
                          </p>
                        )}
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                        <Stethoscope className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Consultas activas</p>
                <p className="text-xs text-gray-300">Pacientes siendo atendidos ahora</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Completadas */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group hover:shadow-lg transition-all cursor-pointer border-0 bg-gradient-to-br from-blue-50 to-indigo-50 hover:scale-[1.02]"
                      onClick={() => setFilterStatus('Completada')}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Completadas</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">{stats.completadas}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-blue-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {progressPercent}% del día
                          </p>
                          {completadasTrend.direction !== 'neutral' && (
                            <span className={`text-[10px] flex items-center gap-0.5 px-1 py-0.5 rounded ${
                              completadasTrend.direction === 'up'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {completadasTrend.direction === 'up' ? (
                                <TrendingUp className="h-2.5 w-2.5" />
                              ) : (
                                <TrendingDown className="h-2.5 w-2.5" />
                              )}
                              {completadasTrend.percent}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                        <CheckCheck className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Consultas finalizadas</p>
                <p className="text-xs text-gray-300">{stats.completadas} de {stats.total} citas completadas</p>
                {yesterdayStats.completadas > 0 && (
                  <p className="text-xs text-gray-300">Ayer: {yesterdayStats.completadas} completadas</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Progreso del Día */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-violet-50 to-purple-50 hover:scale-[1.02]"
                      onClick={() => setFilterStatus('all')}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-violet-700">Total Citas</p>
                          {totalTrend.direction !== 'neutral' && (
                            <span className={`text-[10px] flex items-center gap-0.5 px-1 py-0.5 rounded ${
                              totalTrend.direction === 'up'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {totalTrend.direction === 'up' ? (
                                <TrendingUp className="h-2.5 w-2.5" />
                              ) : (
                                <TrendingDown className="h-2.5 w-2.5" />
                              )}
                              {totalTrend.percent}%
                            </span>
                          )}
                        </div>
                        <p className="text-3xl font-bold text-violet-600 mt-1">{stats.total}</p>
                        <Progress value={progressPercent} className="h-1.5 mt-2 bg-violet-100" />
                      </div>
                      <div className="p-3 bg-violet-100 rounded-xl group-hover:bg-violet-200 transition-colors">
                        <Target className="h-6 w-6 text-violet-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Resumen del día</p>
                <p className="text-xs text-gray-300">Total: {stats.total} citas • Canceladas: {stats.canceladas}</p>
                {yesterdayStats.total > 0 && (
                  <p className="text-xs text-gray-300">Ayer: {yesterdayStats.total} citas</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Izquierdo: Alertas + Cola */}
          <div className="lg:col-span-2 space-y-4">
            {/* Alertas Clínicas - Arriba de la Cola */}
            <ClinicalAlertsWidget
              doctorId={user?.id}
              citasEnEspera={citasHoy.filter(c => c.estado === 'EnEspera')}
              onAlertClick={(alert) => {
                if (alert.data?.id && alert.type === 'long_wait') {
                  iniciarConsulta(alert.data);
                } else {
                  toast({
                    title: alert.title,
                    description: alert.message,
                  });
                }
              }}
            />

            {/* Cola de Pacientes Mejorada */}
            <Card className="shadow-sm border-0 overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ClipboardList className="h-5 w-5 text-blue-600" />
                      </div>
                      Cola de Atención
                      {isRefreshing && (
                        <RefreshCw className="h-4 w-4 text-gray-400 animate-spin ml-2" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {filteredCitas.length} pacientes
                      {filterStatus !== 'all' && ` (filtrado: ${filterStatus})`}
                      {agendaHasChanges && (
                        <Badge variant="outline" className="ml-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          Hay cambios
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Búsqueda */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar paciente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                      />
                    </div>
                    {/* Filtro */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Filter className="h-4 w-4" />
                          Filtrar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFilterStatus('all')}>Todos</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus('EnEspera')}>En Espera</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus('Atendiendo')}>En Consulta</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus('Completada')}>Completados</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {/* Refresh */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                          >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Actualizar lista</p>
                          {lastRefresh && (
                            <p className="text-xs text-gray-300">
                              Última: {lastRefresh.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 text-center">
                    <RefreshCw className="h-8 w-8 mx-auto text-gray-400 animate-spin" />
                    <p className="text-gray-600 mt-3">Cargando pacientes...</p>
                  </div>
                ) : filteredCitas.length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600 font-medium">No hay citas</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {filterStatus !== 'all' ? 'No hay citas con este filtro' : 'No hay citas programadas para esta fecha'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filteredCitas.map((cita, index) => {
                      const priority = getPriorityConfig(cita);
                      const waitTime = getWaitTime(cita);
                      const isActive = cita.estado === 'Atendiendo';
                      const isEnEspera = cita.estado === 'EnEspera';
                      const queuePosition = filteredCitas
                        .filter(c => c.estado === 'EnEspera')
                        .findIndex(c => c.id === cita.id) + 1;

                      // Calcular el porcentaje de la barra de espera (máximo 60 min = 100%)
                      const waitPercent = waitTime ? Math.min((waitTime / 60) * 100, 100) : 0;
                      const waitBarColor = waitTime > 45 ? 'bg-red-500' : waitTime > 30 ? 'bg-amber-500' : 'bg-blue-500';

                      return (
                        <div
                          key={cita.id}
                          className={`p-4 hover:bg-gray-50 transition-all relative group ${
                            isActive ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                          } ${priority ? priority.bgLight : ''}`}
                        >
                          {/* Barra de progreso de espera */}
                          {isEnEspera && waitTime > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                              <div
                                className={`h-full ${waitBarColor} transition-all duration-500`}
                                style={{ width: `${waitPercent}%` }}
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            {/* Número de posición en cola */}
                            {isEnEspera && queuePosition > 0 && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">#{queuePosition}</span>
                              </div>
                            )}

                            {/* Avatar con iniciales */}
                            <Avatar className={`h-12 w-12 ${
                              isActive ? 'ring-2 ring-green-500 ring-offset-2' : ''
                            } ${isEnEspera && waitTime > 30 ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
                              <AvatarFallback className={`font-semibold ${
                                isActive ? 'bg-green-100 text-green-700' :
                                waitTime > 45 ? 'bg-red-100 text-red-700' :
                                waitTime > 30 ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {cita.paciente?.nombre?.[0]}{cita.paciente?.apellido?.[0]}
                              </AvatarFallback>
                            </Avatar>

                            {/* Info del paciente */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 truncate">
                                  {cita.paciente?.nombre} {cita.paciente?.apellido}
                                </p>
                                {priority && (
                                  <Badge className={`${priority.color} text-white text-xs`}>
                                    {priority.label}
                                  </Badge>
                                )}
                                {waitTime > 45 && isEnEspera && (
                                  <Badge className="bg-red-500 text-white text-xs animate-pulse">
                                    Urgente
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">{cita.motivo || 'Consulta general'}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatHora(cita.hora)}
                                </span>
                                {waitTime !== null && waitTime > 0 && (
                                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                                    waitTime > 45 ? 'bg-red-100 text-red-700' :
                                    waitTime > 30 ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    <Timer className="h-3 w-3" />
                                    {waitTime} min
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Estado y Acciones */}
                            <div className="flex items-center gap-3">
                              <Badge variant={
                                cita.estado === 'EnEspera' ? 'warning' :
                                cita.estado === 'Atendiendo' ? 'success' :
                                cita.estado === 'Completada' ? 'secondary' : 'outline'
                              } className={
                                cita.estado === 'EnEspera' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                cita.estado === 'Atendiendo' ? 'bg-green-100 text-green-700 border-green-200' :
                                cita.estado === 'Completada' ? 'bg-gray-100 text-gray-600' : ''
                              }>
                                {cita.estado === 'EnEspera' ? 'En Espera' : cita.estado}
                              </Badge>

                              {cita.estado === 'EnEspera' && (
                                <Button
                                  onClick={() => iniciarConsulta(cita)}
                                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                                >
                                  <Play className="h-4 w-4" />
                                  Llamar
                                </Button>
                              )}
                              {cita.estado === 'Atendiendo' && (
                                <Button
                                  onClick={() => iniciarConsulta(cita)}
                                  className="bg-green-600 hover:bg-green-700 gap-2 animate-pulse"
                                >
                                  <Stethoscope className="h-4 w-4" />
                                  Continuar
                                </Button>
                              )}
                              {cita.estado === 'Completada' && (
                                <Button variant="ghost" size="sm" className="text-green-600" disabled>
                                  <CheckCheck className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Menú de más opciones */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver HCE
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Llamar paciente
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Enviar mensaje
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral de Widgets Personalizables */}
          <div className="space-y-4">
            {/* Controles de personalización */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-600">Mis Widgets</h3>
              <WidgetLayoutControls
                widgets={widgetLayout}
                isEditMode={widgetEditMode}
                onToggleEditMode={() => setWidgetEditMode(!widgetEditMode)}
                onToggleVisibility={toggleWidgetVisibility}
                onToggleLock={toggleWidgetLock}
                onReset={resetWidgetLayout}
              />
            </div>

            {/* Contenedor de widgets arrastrables */}
            <DraggableWidgetsContainer
              doctorId={user?.id}
              widgets={widgetLayout}
              isEditMode={widgetEditMode}
              onReorder={reorderWidgets}
              renderWidget={(widgetId) => {
                switch (widgetId) {
                  case 'proxima-cita':
                    return extraStats.proximaCita ? (
                      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-lg">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-4 w-4 text-white" />
                            <p className="text-sm font-semibold text-white/90">Próximo Paciente</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 bg-white/20 border-2 border-white/40">
                              <AvatarFallback className="text-white font-bold">
                                {extraStats.proximaCita.paciente?.nombre?.[0]}{extraStats.proximaCita.paciente?.apellido?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-white">
                                {extraStats.proximaCita.paciente?.nombre} {extraStats.proximaCita.paciente?.apellido}
                              </p>
                              <p className="text-sm text-white/80 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatHora(extraStats.proximaCita.hora)}
                              </p>
                            </div>
                          </div>
                          <Button
                            className="w-full mt-4 bg-white text-blue-700 hover:bg-blue-50 font-semibold"
                            onClick={() => iniciarConsulta(extraStats.proximaCita)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Iniciar Consulta
                          </Button>
                        </CardContent>
                      </Card>
                    ) : null;

                  case 'proximas-citas':
                    return (
                      <ProximasCitasWidget
                        doctorId={user?.id}
                        maxCitas={4}
                        onSelectCita={(cita) => iniciarConsulta(cita)}
                        className="border-0 shadow-sm"
                      />
                    );

                  case 'hospitalizados':
                    return (
                      <HospitalizedPatientsWidget
                        doctorId={user?.id}
                        maxItems={3}
                        onViewAll={() => setViewMode('hospitalizacion')}
                        onSelectPatient={(admision) => {
                          setActiveAdmision(admision);
                          setViewMode('epicrisis');
                        }}
                      />
                    );

                  case 'quirofano':
                    return (
                      <QuirofanoWidget
                        doctorId={user?.id}
                        maxItems={3}
                        onViewAll={() => setViewMode('quirofano')}
                        onSelectProcedure={(proc) => {
                          toast({
                            title: 'Cirugía seleccionada',
                            description: `${proc.paciente?.nombre} ${proc.paciente?.apellido} - ${proc.tipoProcedimiento || 'Procedimiento'}`,
                          });
                          setViewMode('quirofano');
                        }}
                      />
                    );

                  case 'pacientes-recientes':
                    return (
                      <RecentPatientsWidget
                        doctorId={user?.id}
                        maxItems={5}
                        onSelectPatient={(patient) => {
                          toast({
                            title: 'Paciente seleccionado',
                            description: `${patient.nombre} ${patient.apellido}`,
                          });
                        }}
                        onViewHCE={(patient) => {
                          toast({
                            title: 'Ver Historia Clínica',
                            description: `Abriendo HCE de ${patient.nombre} ${patient.apellido}`,
                          });
                          setShowHCEAnalyzer(true);
                        }}
                      />
                    );

                  case 'rendimiento':
                    return (
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                        <CardContent className="p-5">
                          <p className="text-sm text-slate-300 mb-3 font-medium">Rendimiento de Hoy</p>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-200">Citas completadas hoy</span>
                              <span className="font-semibold text-white">{stats.completadas} de {stats.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-200">Progreso del día</span>
                              <div className="flex items-center gap-2">
                                <Progress value={progressPercent} className="w-20 h-2 bg-slate-700" />
                                <span className="font-semibold text-white">{progressPercent}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-200">Citas ayer</span>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-white">{yesterdayStats.completadas}</span>
                                {completadasTrend.direction !== 'neutral' && (
                                  <span className={`text-xs ${completadasTrend.direction === 'up' ? 'text-green-400' : 'text-amber-400'}`}>
                                    {completadasTrend.direction === 'up' ? '↑' : '↓'} {completadasTrend.percent}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-200">Pendientes</span>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-white">{stats.enEspera + stats.atendiendo}</span>
                                {stats.enEspera > 0 && (
                                  <Badge className="bg-amber-500/20 text-amber-300 text-xs border-0">
                                    {stats.enEspera} en espera
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );

                  default:
                    return null;
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal Analizador de HCE con IA */}
      <Dialog open={showHCEAnalyzer} onOpenChange={setShowHCEAnalyzer}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">Analizador de Historia Clínica con IA</DialogTitle>
          <AnalizadorHCE onClose={() => setShowHCEAnalyzer(false)} />
        </DialogContent>
      </Dialog>

      {/* Command Palette (Ctrl+K) */}
      <DoctorCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelectPatient={handleCommandPatientSelect}
        onAction={handleCommandAction}
        onNavigate={handleCommandNavigate}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onAction={(actionId) => {
          switch (actionId) {
            case 'search':
              setCommandPaletteOpen(true);
              break;
            case 'prescription':
            case 'lab':
            case 'imaging':
            case 'certificate':
              toast({
                title: 'Acción rápida',
                description: 'Seleccione un paciente primero para esta acción.',
              });
              break;
            case 'ai':
              setShowHCEAnalyzer(true);
              break;
            default:
              break;
          }
        }}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />
    </div>
  );
}
