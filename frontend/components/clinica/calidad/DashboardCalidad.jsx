'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCalidad } from '@/hooks/useCalidad';
import {
  Shield,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  Users,
  Eye,
  FileText,
  ListTodo,
  Award,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

export default function DashboardCalidad({ user }) {
  const { dashboard, loading, error, fetchDashboardCalidad, fetchAlertasCalidad } = useCalidad();
  const [alertas, setAlertas] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchDashboardCalidad();
    const alertasResult = await fetchAlertasCalidad();
    if (alertasResult.success) {
      setAlertas(alertasResult.data);
    }
  };

  // Indicadores resumen
  const indicadores = [
    {
      titulo: 'Habilitaci\u00f3n',
      descripcion: 'Cumplimiento SUH',
      valor: dashboard?.habilitacion?.porcentajeCumplimiento || 0,
      meta: 100,
      icon: Shield,
      color: 'blue',
      tendencia: 'up',
    },
    {
      titulo: 'PAMEC',
      descripcion: 'Procesos priorizados',
      valor: dashboard?.pamec?.procesosPriorizados || 0,
      meta: dashboard?.pamec?.totalProcesos || 10,
      icon: ClipboardCheck,
      color: 'green',
      tendencia: 'up',
    },
    {
      titulo: 'Seguridad',
      descripcion: 'Eventos este mes',
      valor: dashboard?.seguridad?.eventosEsteMes || 0,
      meta: null,
      icon: AlertTriangle,
      color: 'red',
      tendencia: 'down',
    },
    {
      titulo: 'Indicadores SIC',
      descripcion: 'En meta',
      valor: dashboard?.indicadores?.enMeta || 0,
      meta: dashboard?.indicadores?.total || 12,
      icon: BarChart3,
      color: 'purple',
      tendencia: 'up',
    },
    {
      titulo: 'PQRS',
      descripcion: 'Pendientes',
      valor: dashboard?.pqrs?.pendientes || 0,
      meta: null,
      icon: MessageSquare,
      color: 'yellow',
      tendencia: 'neutral',
    },
    {
      titulo: 'Planes Acci\u00f3n',
      descripcion: 'En ejecuci\u00f3n',
      valor: dashboard?.planesAccion?.enEjecucion || 0,
      meta: dashboard?.planesAccion?.total || 0,
      icon: ListTodo,
      color: 'indigo',
      tendencia: 'up',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return colors[color] || colors.blue;
  };

  const getIconColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      red: 'text-red-600 bg-red-100',
      purple: 'text-purple-600 bg-purple-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      indigo: 'text-indigo-600 bg-indigo-100',
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard de Calidad</h2>
          <p className="text-sm text-gray-500">
            Vista consolidada del Sistema de Gesti\u00f3n de Calidad
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Indicadores principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicadores.map((ind, index) => {
          const Icon = ind.icon;
          return (
            <Card key={index} className={`border ${getColorClasses(ind.color)}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getIconColorClasses(ind.color)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{ind.titulo}</p>
                      <p className="text-xs text-gray-500">{ind.descripcion}</p>
                    </div>
                  </div>
                  {ind.tendencia === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {ind.tendencia === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{ind.valor}</span>
                    {ind.meta && (
                      <span className="text-sm text-gray-500">/ {ind.meta}</span>
                    )}
                  </div>
                  {ind.meta && (
                    <Progress
                      value={(ind.valor / ind.meta) * 100}
                      className="h-2 mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas de Planes de Acción */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Planes de Acci\u00f3n Pendientes
            </CardTitle>
            <CardDescription>Requieren atenci\u00f3n inmediata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertas?.planesVencidos?.length > 0 ? (
              alertas.planesVencidos.slice(0, 5).map((plan, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium text-sm text-red-800">{plan.codigo}</p>
                      <p className="text-xs text-red-600 truncate max-w-[200px]">
                        {plan.descripcionProblema}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">Vencido</Badge>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-6 text-gray-500">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                No hay planes vencidos
              </div>
            )}
            {alertas?.planesPorVencer?.length > 0 && (
              <>
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Por vencer (7 d\u00edas)</p>
                  {alertas.planesPorVencer.slice(0, 3).map((plan, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200 mb-2"
                    >
                      <span className="text-sm text-yellow-800">{plan.codigo}</span>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                        Pr\u00f3ximo
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* PQRS Pendientes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              PQRS Pendientes de Gesti\u00f3n
            </CardTitle>
            <CardDescription>Requieren respuesta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertas?.pqrsPendientes?.length > 0 ? (
              alertas.pqrsPendientes.slice(0, 5).map((pqrs, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{pqrs.radicado}</p>
                      <p className="text-xs text-gray-600">{pqrs.tipo} - {pqrs.nombrePeticionario}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{pqrs.estado}</Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(pqrs.fechaRecepcion).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-6 text-gray-500">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                No hay PQRS pendientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Eventos Adversos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Eventos Adversos Pendientes de An\u00e1lisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertas?.eventosNoAnalizados?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alertas.eventosNoAnalizados.slice(0, 6).map((evento, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{evento.codigo}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {evento.servicioOcurrencia}
                      </p>
                    </div>
                    <Badge
                      className={
                        evento.severidad === 'CENTINELA'
                          ? 'bg-red-600'
                          : evento.severidad === 'GRAVE'
                          ? 'bg-orange-500'
                          : 'bg-yellow-500'
                      }
                    >
                      {evento.severidad}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {evento.descripcionEvento}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 text-gray-500">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              No hay eventos pendientes de an\u00e1lisis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de \u00c1reas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">Comit\u00e9s</p>
                  <p className="text-xs text-gray-500">Gesti\u00f3n de comit\u00e9s</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium">Vigilancia</p>
                  <p className="text-xs text-gray-500">SIVIGILA, INVIMA</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-medium">Documentos</p>
                  <p className="text-xs text-gray-500">Gesti\u00f3n documental</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="font-medium">Acreditaci\u00f3n</p>
                  <p className="text-xs text-gray-500">SUA Res. 5095</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t">
        Sistema de Gesti\u00f3n de Calidad - SOGCS Colombia | Res. 3100/2019 | Res. 256/2016 | Res. 5095/2018
      </div>
    </div>
  );
}
