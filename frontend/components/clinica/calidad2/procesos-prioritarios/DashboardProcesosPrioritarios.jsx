'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  FileText,
  BookOpen,
  Users,
  MessageSquare,
  BarChart3,
  Bell,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useCalidad2DashboardPP } from '@/hooks/useCalidad2DashboardPP';

export default function DashboardProcesosPrioritarios() {
  const { resumen, loading, error, refreshAll } = useCalidad2DashboardPP();

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => refreshAll()} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Protocolos Vigentes',
      value: loading ? '...' : (resumen?.totalProtocolos || 0),
      description: 'Manuales, políticas y formatos',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Eventos Adversos',
      value: loading ? '...' : (resumen?.totalEventosAdversos || 0),
      description: 'Reportes activos',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      alert: resumen?.eventosGravesPendientes > 0,
      alertValue: resumen?.eventosGravesPendientes,
    },
    {
      title: 'GPC Adoptadas',
      value: loading ? '...' : (resumen?.totalGPC || 0),
      description: 'Guías de práctica clínica',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      alert: resumen?.gpcPorRevisar > 0,
      alertValue: resumen?.gpcPorRevisar,
    },
    {
      title: 'Comités Activos',
      value: loading ? '...' : (resumen?.totalComites || 0),
      description: '7 tipos de comités',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      alert: resumen?.actasPendientes > 0,
      alertValue: resumen?.actasPendientes,
    },
    {
      title: 'PQRSF',
      value: loading ? '...' : (resumen?.totalPQRSF || 0),
      description: 'Total radicadas',
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      alert: resumen?.pqrsfVencidas > 0,
      alertValue: resumen?.pqrsfVencidas,
    },
    {
      title: 'Encuestas',
      value: loading ? '...' : (resumen?.totalEncuestas || 0),
      description: 'Satisfacción usuario',
      icon: Activity,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Indicadores',
      value: loading ? '...' : (resumen?.totalIndicadores || 0),
      description: 'Mediciones activas',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Alertas',
      value: loading ? '...' : (resumen?.alertasPendientes || 0),
      description: 'Requieren atención',
      icon: Bell,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  const recentActivity = [
    {
      title: 'Sin actividad reciente',
      description: 'Los datos se mostrarán una vez configurados los módulos',
      icon: Clock,
    },
  ];

  const alerts = [
    {
      title: 'Sistema Inicializado',
      description: 'El módulo de Procesos Prioritarios está listo para configurarse',
      type: 'info',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Resumen General</h3>
          <p className="text-sm text-muted-foreground">
            Vista consolidada de todos los módulos
          </p>
        </div>
        <Button onClick={() => refreshAll()} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg relative`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  {stat.alert && stat.alertValue > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {stat.alertValue}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                {stat.alert && stat.alertValue > 0 && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {stat.alertValue} requieren atención
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el módulo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas y Notificaciones</CardTitle>
            <CardDescription>Avisos importantes del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert, index) => {
              const Icon = alert.icon;
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Icon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Gráficas y Tendencias</CardTitle>
          <CardDescription>
            Análisis visual de indicadores clave (disponible en FASE 10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
            <div className="text-center space-y-2">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                Las gráficas se mostrarán una vez haya datos disponibles
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
