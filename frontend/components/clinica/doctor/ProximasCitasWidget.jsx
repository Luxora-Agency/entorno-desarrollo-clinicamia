'use client';

import { useState, useEffect } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import {
  Calendar, Clock, User, ChevronRight,
  AlertCircle, Timer, Phone, RefreshCw, MapPin, Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper para formatear hora
const formatHora = (hora) => {
  if (!hora) return '--:--';
  if (hora.includes('T')) {
    const timePart = hora.split('T')[1];
    return timePart.substring(0, 5);
  }
  return hora.substring(0, 5);
};

// Calcular tiempo hasta la cita
const getTimeUntil = (fecha, hora) => {
  if (!fecha || !hora) return null;

  const fechaHora = new Date(fecha);
  const [hours, minutes] = formatHora(hora).split(':');
  fechaHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const now = new Date();
  const diffMs = fechaHora - now;

  if (diffMs < 0) return { text: 'Ya pasó', isOverdue: true };

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return { text: `En ${diffMins} min`, isUrgent: diffMins <= 15 };

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return { text: `En ${diffHours}h ${diffMins % 60}m`, isUrgent: false };

  return { text: `En ${Math.floor(diffHours / 24)} días`, isUrgent: false };
};

// Obtener iniciales del paciente
const getInitials = (nombre, apellido) => {
  const n = nombre?.charAt(0)?.toUpperCase() || '';
  const a = apellido?.charAt(0)?.toUpperCase() || '';
  return n + a || '?';
};

// Configuración de prioridad
const getPriorityBadge = (cita) => {
  if (cita.prioridad === 'urgente' || cita.origenPaciente === 'urgencia') {
    return { label: 'Urgente', className: 'bg-red-500 text-white' };
  }
  if (cita.origenPaciente === 'prioritaria' || cita.origenPaciente === 'consulta_prioritaria') {
    return { label: 'Prioritaria', className: 'bg-orange-500 text-white' };
  }
  return null;
};

// Configuración de estado
const getEstadoBadge = (estado) => {
  switch (estado) {
    case 'EnEspera':
      return { label: 'En espera', icon: MapPin, className: 'bg-green-100 text-green-700 border-green-200' };
    case 'Confirmada':
      return { label: 'Confirmada', icon: Calendar, className: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'Pendiente':
      return { label: 'Pendiente', icon: Clock, className: 'bg-gray-100 text-gray-600 border-gray-200' };
    default:
      return null;
  }
};

export default function ProximasCitasWidget({
  doctorId,
  maxCitas = 5,
  onSelectCita,
  className = ''
}) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar tiempo cada minuto para el countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar citas
  useEffect(() => {
    const loadCitas = async () => {
      if (!doctorId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const today = getTodayColombia();

        const response = await fetch(
          `${apiUrl}/citas?doctorId=${doctorId}&fecha=${today}&limit=${maxCitas * 2}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await response.json();

        if (data.status === 'success' || data.success) {
          const citasData = data.citas || data.data || [];

          // Filtrar citas del día y ordenar por cola de atención
          // 1. Primero: pacientes por atender (EnEspera, Confirmada, Pendiente) ordenados por hora
          // 2. Último: pacientes ya atendidos (Completada) van al final
          const citasOrdenadas = citasData
            .filter(c => ['Pendiente', 'Confirmada', 'EnEspera', 'Completada'].includes(c.estado))
            .sort((a, b) => {
              // Los completados van al final
              const aCompletada = a.estado === 'Completada';
              const bCompletada = b.estado === 'Completada';

              if (aCompletada && !bCompletada) return 1;  // a va después
              if (!aCompletada && bCompletada) return -1; // b va después

              // Dentro de cada grupo, ordenar por hora de cita
              const horaA = formatHora(a.hora);
              const horaB = formatHora(b.hora);
              return horaA.localeCompare(horaB);
            })
            .slice(0, maxCitas);

          const citasPendientes = citasOrdenadas;

          setCitas(citasPendientes);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading citas:', err);
        setError('Error al cargar citas');
      } finally {
        setLoading(false);
      }
    };

    loadCitas();

    // Refrescar cada 2 minutos
    const interval = setInterval(loadCitas, 120000);
    return () => clearInterval(interval);
  }, [doctorId, maxCitas]);

  const handleRefresh = async () => {
    setLoading(true);
    // Re-trigger the useEffect by updating doctorId dependency
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const today = getTodayColombia();

    try {
      const response = await fetch(
        `${apiUrl}/citas?doctorId=${doctorId}&fecha=${today}&limit=${maxCitas * 2}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (data.status === 'success' || data.success) {
        const citasData = data.citas || data.data || [];
        const citasOrdenadas = citasData
          .filter(c => ['Pendiente', 'Confirmada', 'EnEspera', 'Completada'].includes(c.estado))
          .sort((a, b) => {
            // Los completados van al final
            const aCompletada = a.estado === 'Completada';
            const bCompletada = b.estado === 'Completada';

            if (aCompletada && !bCompletada) return 1;
            if (!aCompletada && bCompletada) return -1;

            // Dentro de cada grupo, ordenar por hora
            return formatHora(a.hora).localeCompare(formatHora(b.hora));
          })
          .slice(0, maxCitas);

        setCitas(citasOrdenadas);
      }
    } catch (err) {
      console.error('Error refreshing citas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && citas.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            Próximas Citas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">{error}</p>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            Próximas Citas
            {citas.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {citas.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {citas.length === 0 ? (
          <div className="py-6 text-center">
            <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">No hay citas pendientes</p>
            <p className="text-xs text-gray-500 mt-1">Las próximas citas aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-2">
            {citas.map((cita, index) => {
              const paciente = cita.paciente || {};
              const timeUntil = getTimeUntil(cita.fecha, cita.hora);
              const priorityBadge = getPriorityBadge(cita);
              const estadoBadge = getEstadoBadge(cita.estado);
              const isFirst = index === 0;

              return (
                <TooltipProvider key={cita.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => onSelectCita?.(cita)}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer
                          ${isFirst
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm'
                            : 'hover:bg-gray-50 border border-transparent'
                          }
                        `}
                      >
                        {/* Avatar */}
                        <Avatar className={`h-10 w-10 ${isFirst ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}>
                          <AvatarFallback className={isFirst ? 'bg-blue-500 text-white' : 'bg-gray-200'}>
                            {getInitials(paciente.nombre, paciente.apellido)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {paciente.nombre} {paciente.apellido}
                            </p>
                            {priorityBadge && (
                              <Badge className={`${priorityBadge.className} text-[10px] px-1.5 py-0`}>
                                {priorityBadge.label}
                              </Badge>
                            )}
                            {estadoBadge && cita.estado === 'EnEspera' && (
                              <Badge variant="outline" className={`${estadoBadge.className} text-[10px] px-1.5 py-0 border`}>
                                <MapPin className="h-2.5 w-2.5 mr-0.5" />
                                Llegó
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>{formatHora(cita.hora)}</span>
                            {cita.motivo && (
                              <>
                                <span className="text-gray-400">|</span>
                                <span className="truncate max-w-[120px]">{cita.motivo}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Time until */}
                        {timeUntil && (
                          <div className={`
                            flex items-center gap-1 text-xs font-medium px-2 py-1 rounded
                            ${timeUntil.isOverdue
                              ? 'bg-red-100 text-red-700'
                              : timeUntil.isUrgent
                                ? 'bg-amber-100 text-amber-700 animate-pulse'
                                : 'bg-gray-100 text-gray-600'
                            }
                          `}>
                            <Timer className="h-3 w-3" />
                            {timeUntil.text}
                          </div>
                        )}

                        {/* Arrow */}
                        {onSelectCita && (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-medium">{paciente.nombre} {paciente.apellido}</p>
                        <p className="text-xs text-gray-400">
                          {paciente.tipoDocumento}: {paciente.cedula}
                        </p>
                        {paciente.telefono && (
                          <p className="text-xs flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {paciente.telefono}
                          </p>
                        )}
                        {cita.motivo && (
                          <p className="text-xs">
                            <span className="text-gray-400">Motivo:</span> {cita.motivo}
                          </p>
                        )}
                        <p className="text-xs text-blue-400 pt-1">
                          <Stethoscope className="h-3 w-3 inline mr-1" />
                          Click para iniciar consulta
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
