'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Award, TrendingUp, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { useCalidad2GPC } from '@/hooks/useCalidad2GPC';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Dashboard para módulo de Guías de Práctica Clínica
 * Muestra estadísticas, GPC recientes, evaluaciones pendientes
 */
export default function DashboardGPC() {
  const { guias, estadisticas, loading } = useCalidad2GPC();

  if (loading && !guias.length) {
    return (
      <div className="space-y-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
      </div>
    );
  }

  // GPC con mayor adherencia
  const guiasConAdherencia = guias
    .filter((g) => g.evaluacionesAdherencia && g.evaluacionesAdherencia.length > 0)
    .map((g) => ({
      ...g,
      ultimaAdherencia: g.evaluacionesAdherencia[0],
    }))
    .sort((a, b) => b.ultimaAdherencia.porcentajeAdherencia - a.ultimaAdherencia.porcentajeAdherencia);

  // GPC por revisar (próximas a vencer)
  const guiasPorRevisar = guias.filter((g) => {
    if (!g.proximaRevision) return false;
    const diasHastaRevision = Math.ceil(
      (new Date(g.proximaRevision) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return diasHastaRevision <= 60 && diasHastaRevision > 0;
  });

  // GPC sin evaluación AGREE
  const guiasSinAGREE = guias.filter((g) => !g.evaluacionAGREE);

  // GPC sin evaluación de adherencia reciente
  const guiasSinAdherencia = guias.filter((g) => {
    if (!g.evaluacionesAdherencia || g.evaluacionesAdherencia.length === 0) return true;
    const ultimaEvaluacion = new Date(g.evaluacionesAdherencia[0].fechaEvaluacion);
    const mesesDesdeUltima = Math.ceil((new Date() - ultimaEvaluacion) / (1000 * 60 * 60 * 24 * 30));
    return mesesDesdeUltima > 3; // Más de 3 meses sin evaluación
  });

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Total GPC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Guías adoptadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Vigentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas?.vigentes || 0}</div>
            <p className="text-xs text-muted-foreground">Actualizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              Con AGREE II
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas?.conAGREE || 0}</div>
            <p className="text-xs text-muted-foreground">Evaluadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Por Revisar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {estadisticas?.porRevisar || 0}
            </div>
            <p className="text-xs text-muted-foreground">Próximas a vencer</p>
          </CardContent>
        </Card>
      </div>

      {/* GPC con Mayor Adherencia */}
      {guiasConAdherencia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              GPC con Mayor Adherencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guiasConAdherencia.slice(0, 5).map((guia) => (
                <div key={guia.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{guia.nombre}</p>
                      <Badge variant="outline" className="text-xs">
                        {guia.patologia}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Última evaluación:{' '}
                      {format(new Date(guia.ultimaAdherencia.fechaEvaluacion), 'PPP', { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        guia.ultimaAdherencia.porcentajeAdherencia >= 80
                          ? 'text-green-600'
                          : guia.ultimaAdherencia.porcentajeAdherencia >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {guia.ultimaAdherencia.porcentajeAdherencia.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">adherencia</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas y Pendientes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* GPC por revisar */}
        {guiasPorRevisar.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                Próximas a Revisión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guiasPorRevisar.slice(0, 5).map((guia) => {
                  const diasHastaRevision = Math.ceil(
                    (new Date(guia.proximaRevision) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={guia.id}
                      className="flex items-start justify-between p-2 bg-orange-50 rounded border border-orange-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{guia.nombre}</p>
                        <p className="text-xs text-muted-foreground">{guia.patologia}</p>
                      </div>
                      <Badge variant="outline" className="text-orange-700 border-orange-300">
                        {diasHastaRevision} días
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* GPC sin evaluación AGREE */}
        {guiasSinAGREE.length > 0 && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                Sin Evaluación AGREE II
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guiasSinAGREE.slice(0, 5).map((guia) => (
                  <div
                    key={guia.id}
                    className="flex items-start justify-between p-2 bg-blue-50 rounded border border-blue-100"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{guia.nombre}</p>
                      <p className="text-xs text-muted-foreground">{guia.patologia}</p>
                    </div>
                    <Badge variant="outline" className="text-blue-700 border-blue-300">
                      Pendiente
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* GPC sin adherencia reciente */}
        {guiasSinAdherencia.length > 0 && (
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Sin Evaluación de Adherencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guiasSinAdherencia.slice(0, 5).map((guia) => (
                  <div
                    key={guia.id}
                    className="flex items-start justify-between p-2 bg-purple-50 rounded border border-purple-100"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{guia.nombre}</p>
                      <p className="text-xs text-muted-foreground">{guia.patologia}</p>
                    </div>
                    <Badge variant="outline" className="text-purple-700 border-purple-300">
                      &gt; 3 meses
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resumen de Patologías */}
      {guias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">GPC por Patología</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[...new Set(guias.map((g) => g.patologia))].map((patologia) => {
                const count = guias.filter((g) => g.patologia === patologia).length;
                return (
                  <Badge key={patologia} variant="outline">
                    {patologia} ({count})
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
