'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bell, CheckCircle2, XCircle } from 'lucide-react';
import { useCalidad2AlertasPP } from '@/hooks/useCalidad2AlertasPP';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente de resumen de alertas
 * Widget para mostrar estadísticas rápidas de alertas
 */
export default function AlertasResumen() {
  const { alertas, loading, atenderAlerta } = useCalidad2AlertasPP();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Cargando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  // Alertas activas (no atendidas)
  const alertasActivas = alertas.filter((a) => !a.atendida);

  // Por prioridad
  const alertasCriticas = alertasActivas.filter((a) => a.prioridad === 'CRITICA');
  const alertasAltas = alertasActivas.filter((a) => a.prioridad === 'ALTA');
  const alertasMedias = alertasActivas.filter((a) => a.prioridad === 'MEDIA');

  // Por tipo
  const alertasPorTipo = alertasActivas.reduce((acc, alerta) => {
    acc[alerta.tipo] = (acc[alerta.tipo] || 0) + 1;
    return acc;
  }, {});

  const handleAtender = async (alertaId) => {
    try {
      await atenderAlerta(alertaId, 'Revisada desde resumen');
      toast.success('Alerta marcada como atendida');
    } catch (error) {
      toast.error('Error al atender alerta');
    }
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      CRITICA: 'destructive',
      ALTA: 'warning',
      MEDIA: 'default',
      BAJA: 'secondary',
    };
    return colors[prioridad] || 'default';
  };

  const getPrioridadIcon = (prioridad) => {
    if (prioridad === 'CRITICA') return <XCircle className="h-4 w-4" />;
    if (prioridad === 'ALTA' || prioridad === 'MEDIA') return <AlertCircle className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Estadísticas Rápidas */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold">{alertasActivas.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-700">Críticas</p>
                <p className="text-2xl font-bold text-red-600">{alertasCriticas.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-700">Altas</p>
                <p className="text-2xl font-bold text-orange-600">{alertasAltas.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700">Atendidas</p>
                <p className="text-2xl font-bold text-green-600">
                  {alertas.filter((a) => a.atendida).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Recientes */}
      {alertasActivas.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Alertas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertasActivas.slice(0, 5).map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-3 rounded-lg border ${
                    alerta.prioridad === 'CRITICA'
                      ? 'bg-red-50 border-red-200'
                      : alerta.prioridad === 'ALTA'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getPrioridadIcon(alerta.prioridad)}
                        <Badge variant={getPrioridadColor(alerta.prioridad)} className="text-xs">
                          {alerta.prioridad}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alerta.submodulo}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{alerta.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {alerta.descripcion}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alerta.fechaAlerta), 'PPp', { locale: es })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAtender(alerta.id)}
                      className="shrink-0"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Atender
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600 opacity-50" />
            <p className="font-medium">No hay alertas activas</p>
            <p className="text-sm mt-1">Todas las alertas han sido atendidas</p>
          </CardContent>
        </Card>
      )}

      {/* Alertas por Tipo */}
      {Object.keys(alertasPorTipo).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(alertasPorTipo)
                .sort(([, a], [, b]) => b - a)
                .map(([tipo, count]) => (
                  <div key={tipo} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <p className="text-sm font-medium">{tipo.replace(/_/g, ' ')}</p>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
