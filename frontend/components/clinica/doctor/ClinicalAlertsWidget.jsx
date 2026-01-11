'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, Clock, FileText,
  Activity, RefreshCw, ChevronRight, Bell, FlaskConical,
  Stethoscope, Heart, Timer, X, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Tipos de alerta con configuración
const ALERT_TYPES = {
  lab_ready: {
    icon: FlaskConical,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Laboratorio',
  },
  imaging_ready: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Imagen',
  },
  long_wait: {
    icon: Timer,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Espera',
  },
  critical_vitals: {
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Crítico',
  },
  interconsult: {
    icon: Stethoscope,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Interconsulta',
  },
  pending_round: {
    icon: Activity,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Ronda',
  },
};

// Calcular tiempo relativo
const getRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = now - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
};

export default function ClinicalAlertsWidget({
  doctorId,
  citasEnEspera = [],
  onAlertClick,
  onDismiss,
  className = '',
  maxAlerts = 5,
}) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // Generar alertas basadas en datos reales
  useEffect(() => {
    const generateAlerts = () => {
      const newAlerts = [];

      // Alertas por pacientes esperando mucho tiempo
      citasEnEspera.forEach((cita) => {
        if (cita.horaLlegada) {
          const llegada = new Date(cita.horaLlegada);
          const ahora = new Date();
          const waitMinutes = Math.floor((ahora - llegada) / 60000);

          if (waitMinutes >= 30) {
            newAlerts.push({
              id: `wait-${cita.id}`,
              type: 'long_wait',
              title: `${cita.paciente?.nombre} ${cita.paciente?.apellido}`,
              message: `Esperando hace ${waitMinutes} minutos`,
              timestamp: cita.horaLlegada,
              priority: waitMinutes >= 45 ? 'high' : 'medium',
              data: cita,
            });
          }
        }
      });

      // Ordenar por prioridad y timestamp
      newAlerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setAlerts(newAlerts.slice(0, maxAlerts));
      setLoading(false);
    };

    generateAlerts();

    // Actualizar cada minuto
    const interval = setInterval(generateAlerts, 60000);
    return () => clearInterval(interval);
  }, [citasEnEspera, maxAlerts]);

  // Cargar alertas del backend (resultados de lab, interconsultas, etc.)
  useEffect(() => {
    const loadBackendAlerts = async () => {
      if (!doctorId) return;

      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

        // Intentar cargar alertas del endpoint de alertas si existe
        const response = await fetch(
          `${apiUrl}/alertas-notificaciones?usuarioId=${doctorId}&leido=false&limit=5`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.length > 0) {
            const backendAlerts = data.data.map((alerta) => ({
              id: `backend-${alerta.id}`,
              type: alerta.tipo || 'interconsult',
              title: alerta.titulo,
              message: alerta.mensaje,
              timestamp: alerta.createdAt,
              priority: alerta.prioridad || 'medium',
              data: alerta,
            }));

            setAlerts((prev) => {
              const combined = [...backendAlerts, ...prev];
              // Eliminar duplicados por ID
              const unique = combined.filter(
                (alert, index, self) =>
                  index === self.findIndex((a) => a.id === alert.id)
              );
              return unique.slice(0, maxAlerts);
            });
          }
        }
      } catch (error) {
        // Silenciosamente ignorar errores de backend - las alertas locales funcionan
        console.log('Backend alerts not available:', error.message);
      }
    };

    loadBackendAlerts();
  }, [doctorId, maxAlerts]);

  const handleDismiss = (alertId, e) => {
    e.stopPropagation();
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id));

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-6 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-0 shadow-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            Alertas Clínicas
            {visibleAlerts.length > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                {visibleAlerts.length}
              </Badge>
            )}
          </CardTitle>
          {visibleAlerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500"
              onClick={() => setDismissedAlerts(new Set(alerts.map((a) => a.id)))}
            >
              Limpiar todo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {visibleAlerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Todo en orden</p>
            <p className="text-xs text-gray-400 mt-1">No hay alertas pendientes</p>
          </div>
        ) : (
          <ScrollArea className="h-[180px] pr-2">
            <div className="space-y-2">
              {visibleAlerts.map((alert) => {
                const config = ALERT_TYPES[alert.type] || ALERT_TYPES.interconsult;
                const Icon = config.icon;

                return (
                  <div
                    key={alert.id}
                    onClick={() => onAlertClick?.(alert)}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
                      ${config.bgColor} ${config.borderColor} hover:shadow-sm
                      ${alert.priority === 'high' ? 'ring-1 ring-red-300' : ''}
                    `}
                  >
                    <div className={`p-1.5 rounded-lg bg-white/80`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {alert.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${config.borderColor} ${config.color}`}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {alert.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {getRelativeTime(alert.timestamp)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-white/50"
                        onClick={(e) => handleDismiss(alert.id, e)}
                      >
                        <X className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
