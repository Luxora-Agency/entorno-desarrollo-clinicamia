'use client';

import { useState, useEffect } from 'react';
import {
  Activity, Clock, User, ChevronRight,
  RefreshCw, AlertCircle, Calendar, Play, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper para formatear hora
const formatHora = (fecha) => {
  if (!fecha) return '--:--';
  const date = new Date(fecha);
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

// Obtener color de estado
const getStatusConfig = (status) => {
  switch (status) {
    case 'Programado':
      return { label: 'Programado', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar };
    case 'EnProceso':
      return { label: 'En Curso', className: 'bg-green-100 text-green-700 border-green-200 animate-pulse', icon: Activity };
    case 'Completado':
      return { label: 'Completado', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: null };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-600', icon: null };
  }
};

// Calcular tiempo hasta la cirugía
const getTimeUntil = (fechaHora) => {
  if (!fechaHora) return null;
  const fecha = new Date(fechaHora);
  const now = new Date();
  const diffMs = fecha - now;

  if (diffMs < 0) return { text: 'Ya inició', isPast: true };

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return { text: `En ${diffMins} min`, isUrgent: diffMins <= 30 };

  const diffHours = Math.floor(diffMins / 60);
  return { text: `En ${diffHours}h ${diffMins % 60}m`, isUrgent: false };
};

export default function QuirofanoWidget({
  doctorId,
  userId, // Deprecated: use doctorId instead
  onViewAll,
  onSelectProcedure,
  className = '',
  maxItems = 3
}) {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ programadas: 0, enProceso: 0 });

  // Support both props for backward compatibility
  const effectiveDoctorId = doctorId || userId;

  useEffect(() => {
    const loadProcedures = async () => {
      if (!effectiveDoctorId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const today = new Date().toISOString().split('T')[0];

        const response = await fetch(
          `${apiUrl}/procedimientos?medicoResponsableId=${effectiveDoctorId}&fechaDesde=${today}&limit=${maxItems + 2}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const procs = data.data || [];
            // Filtrar solo programados o en proceso, ordenar por fecha
            const filtered = procs
              .filter(p => ['Programado', 'EnProceso'].includes(p.estado))
              .sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio))
              .slice(0, maxItems);

            setProcedures(filtered);
            setStats({
              programadas: procs.filter(p => p.estado === 'Programado').length,
              enProceso: procs.filter(p => p.estado === 'EnProceso').length,
            });
          }
        }
      } catch (error) {
        console.error('Error loading procedures:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProcedures();
  }, [effectiveDoctorId, maxItems]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-0 shadow-sm`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 bg-rose-100 rounded-lg">
              <Activity className="h-4 w-4 text-rose-600" />
            </div>
            Cirugías del Día
            {(stats.programadas > 0 || stats.enProceso > 0) && (
              <Badge variant="secondary" className="text-xs">
                {stats.programadas + stats.enProceso}
              </Badge>
            )}
          </CardTitle>
          {stats.enProceso > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge className="bg-green-500 text-white text-xs animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    {stats.enProceso} en curso
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cirugías en proceso actualmente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {procedures.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Sin cirugías programadas</p>
            <p className="text-xs text-gray-500 mt-1">Las cirugías aparecerán aquí</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[180px] pr-2">
              <div className="space-y-2">
                {procedures.map((proc) => {
                  const paciente = proc.paciente || {};
                  const statusConfig = getStatusConfig(proc.estado);
                  const timeUntil = getTimeUntil(proc.fechaHoraInicio);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TooltipProvider key={proc.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onSelectProcedure?.(proc)}
                            className={`
                              w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all
                              hover:shadow-sm hover:border-rose-200
                              ${proc.estado === 'EnProceso'
                                ? 'bg-green-50/50 border-green-200'
                                : 'bg-white border-gray-100 hover:bg-gray-50'
                              }
                            `}
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className={`text-xs ${
                                proc.estado === 'EnProceso'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {paciente?.nombre?.charAt(0)}{paciente?.apellido?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {paciente?.nombre} {paciente?.apellido}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="flex items-center gap-1 truncate max-w-[120px]">
                                  {proc.tipoProcedimiento || 'Cirugía'}
                                </span>
                                {proc.quirofano && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {proc.quirofano?.nombre}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {timeUntil && proc.estado !== 'EnProceso' && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  timeUntil.isPast
                                    ? 'bg-red-100 text-red-700'
                                    : timeUntil.isUrgent
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {timeUntil.text}
                                </span>
                              )}
                              {proc.estado === 'EnProceso' && StatusIcon && (
                                <StatusIcon className="h-4 w-4 text-green-500" />
                              )}
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium">{paciente?.nombre} {paciente?.apellido}</p>
                            <p className="text-xs">{proc.tipoProcedimiento || 'Procedimiento quirúrgico'}</p>
                            <p className="text-xs text-gray-400">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {formatHora(proc.fechaHoraInicio)}
                              {proc.duracionEstimada && ` (${proc.duracionEstimada} min)`}
                            </p>
                            {proc.quirofano && (
                              <p className="text-xs text-gray-400">
                                <MapPin className="h-3 w-3 inline mr-1" />
                                {proc.quirofano?.nombre}
                              </p>
                            )}
                            <p className="text-xs text-rose-400 pt-1">
                              <Play className="h-3 w-3 inline mr-1" />
                              Click para ver detalles
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </ScrollArea>

            {(stats.programadas + stats.enProceso) > maxItems && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="w-full mt-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Ver todas ({stats.programadas + stats.enProceso})
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
