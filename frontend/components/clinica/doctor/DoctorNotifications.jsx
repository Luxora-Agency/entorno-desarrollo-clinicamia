'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, FlaskConical, MessageSquare, Clock, AlertTriangle,
  CheckCircle, X, ChevronRight, RefreshCw, Eye, Trash2,
  FileText, Stethoscope, Pill, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

// Tipos de notificaciones
const NOTIFICATION_TYPES = {
  LAB_RESULT: {
    icon: FlaskConical,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Laboratorio'
  },
  INTERCONSULTA: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Interconsulta'
  },
  LONG_WAIT: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Espera prolongada'
  },
  URGENT: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Urgente'
  },
  PRESCRIPTION: {
    icon: Pill,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Prescripción'
  },
  IMAGING: {
    icon: Activity,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    label: 'Imagenología'
  },
  GENERAL: {
    icon: Bell,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'General'
  }
};

// Formatear tiempo relativo
const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
};

export default function DoctorNotifications({
  doctorId,
  onNotificationClick,
  onViewAll,
  className = '',
  showBadge = true
}) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Cargar notificaciones reales del doctor
      const response = await fetch(
        `${apiUrl}/notificaciones-doctor?doctorId=${doctorId}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const formattedNotifications = data.data.map(n => ({
            id: n.id,
            type: n.tipo || 'GENERAL',
            title: n.titulo,
            message: n.mensaje,
            read: n.leida || false,
            createdAt: n.createdAt,
            data: n.datos
          }));
          setNotifications(formattedNotifications);
          setUnreadCount(formattedNotifications.filter(n => !n.read).length);
        }
      } else {
        // Si no hay endpoint o error, lista vacía
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadNotifications();

    // Actualizar cada 2 minutos
    const interval = setInterval(loadNotifications, 120000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Marcar como leída
  const markAsRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Actualizar en backend
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/notificaciones-doctor/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    toast({
      title: 'Notificaciones marcadas',
      description: 'Todas las notificaciones han sido marcadas como leídas.',
    });
  };

  // Eliminar notificación
  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Manejar click en notificación
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setOpen(false);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const NotificationIcon = ({ type }) => {
    const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.GENERAL;
    const Icon = config.icon;
    return (
      <div className={`p-2 rounded-full ${config.bgColor}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${className}`}
        >
          <Bell className="h-5 w-5" />
          {showBadge && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nuevas
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadNotifications}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 px-2 text-xs"
              >
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">Sin notificaciones</p>
              <p className="text-xs text-gray-400 mt-1">
                Las nuevas notificaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.GENERAL;

                return (
                  <div
                    key={notification.id}
                    className={`
                      p-4 cursor-pointer transition-colors hover:bg-gray-50
                      ${!notification.read ? 'bg-blue-50/50' : ''}
                    `}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <NotificationIcon type={notification.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${config.borderColor} ${config.color}`}
                          >
                            {config.label}
                          </Badge>
                          <span className="text-[10px] text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-gray-600 hover:text-gray-900"
            onClick={() => {
              setOpen(false);
              if (onViewAll) {
                onViewAll();
              } else {
                toast({
                  title: 'Centro de notificaciones',
                  description: 'Mostrando todas las notificaciones',
                });
              }
            }}
          >
            Ver todas las notificaciones
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Componente de tarjeta para mostrar notificaciones en el dashboard
export function NotificationsCard({ doctorId, className = '' }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar últimas 3 notificaciones no leídas
    const loadRecentNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

        const response = await fetch(
          `${apiUrl}/notificaciones-doctor?doctorId=${doctorId}&limit=3&unreadOnly=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setNotifications(data.data || []);
          }
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      loadRecentNotifications();
    }
  }, [doctorId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-500" />
          Notificaciones Recientes
          {notifications.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Todo al día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const config = NOTIFICATION_TYPES[n.tipo] || NOTIFICATION_TYPES.GENERAL;
              const Icon = config.icon;

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{n.titulo}</p>
                      <p className="text-xs text-gray-600 truncate">{n.mensaje}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para mostrar todas las notificaciones en un modal
export function NotificationsFullView({ doctorId, onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', tipo específico

  useEffect(() => {
    const loadAllNotifications = async () => {
      if (!doctorId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

        const response = await fetch(
          `${apiUrl}/notificaciones-doctor?doctorId=${doctorId}&limit=50`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setNotifications(data.data || []);
          }
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllNotifications();
  }, [doctorId]);

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.leida;
    return n.tipo === filter;
  });

  // Agrupar por fecha
  const groupedNotifications = filteredNotifications.reduce((groups, n) => {
    const date = new Date(n.createdAt).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap pb-3 border-b">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          No leídas ({unreadCount})
        </Button>
        <Button
          variant={filter === 'LAB_RESULT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('LAB_RESULT')}
        >
          <FlaskConical className="h-3 w-3 mr-1" />
          Laboratorio
        </Button>
        <Button
          variant={filter === 'LONG_WAIT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('LONG_WAIT')}
        >
          <Clock className="h-3 w-3 mr-1" />
          Espera
        </Button>
        <Button
          variant={filter === 'URGENT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('URGENT')}
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Urgentes
        </Button>
      </div>

      {/* Lista de notificaciones agrupadas */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay notificaciones</p>
          <p className="text-sm text-gray-400">
            {filter !== 'all' ? 'Prueba con otro filtro' : 'Las notificaciones aparecerán aquí'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, dayNotifications]) => (
            <div key={date}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {date}
              </h4>
              <div className="space-y-2">
                {dayNotifications.map((n) => {
                  const config = NOTIFICATION_TYPES[n.tipo] || NOTIFICATION_TYPES.GENERAL;
                  const Icon = config.icon;

                  return (
                    <div
                      key={n.id}
                      onClick={() => onNotificationClick && onNotificationClick(n)}
                      className={`
                        p-4 rounded-lg border cursor-pointer transition-all
                        ${!n.leida ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-200'}
                        hover:shadow-md hover:scale-[1.01]
                      `}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-full ${config.bgColor} shrink-0`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={`text-sm font-medium ${!n.leida ? 'text-gray-900' : 'text-gray-600'}`}>
                                {n.titulo}
                              </p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {n.mensaje}
                              </p>
                            </div>
                            {!n.leida && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${config.borderColor} ${config.color}`}
                            >
                              {config.label}
                            </Badge>
                            <span className="text-[10px] text-gray-400">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
