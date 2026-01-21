'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, Trophy, TrendingUp, TrendingDown, Minus,
  CheckCircle, XCircle, BarChart3, Medal, Loader2
} from 'lucide-react';
import { apiGet } from '@/services/api';
import { cn } from '@/lib/utils';

export default function ResultadosEvaluaciones({ capacitacionId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResultados = async () => {
      if (!capacitacionId) return;

      try {
        setLoading(true);
        const response = await apiGet(`/calidad2/capacitaciones/${capacitacionId}/resultados-evaluaciones`);
        if (response.success) {
          setData(response.data);
        } else {
          setError('Error al cargar resultados');
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err.message || 'Error al cargar resultados');
      } finally {
        setLoading(false);
      }
    };

    fetchResultados();
  }, [capacitacionId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <XCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.participantes?.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p>No hay resultados de evaluaciones</p>
          <p className="text-sm">Los resultados aparecerán cuando los participantes completen las evaluaciones</p>
        </CardContent>
      </Card>
    );
  }

  const { participantes, stats } = data;

  const getMejoraIcon = (mejora) => {
    if (mejora === null) return <Minus className="h-4 w-4 text-gray-400" />;
    if (mejora > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (mejora < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getMedalColor = (index) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{stats.totalParticipantes}</div>
                <p className="text-xs text-blue-600">Participantes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-600" />
              <div>
                <div className="text-2xl font-bold text-cyan-700">{stats.promedioPreTest}%</div>
                <p className="text-xs text-cyan-600">Prom. Pre-Test</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-700">{stats.promedioPostTest}%</div>
                <p className="text-xs text-orange-600">Prom. Post-Test</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "bg-gradient-to-br border",
          stats.mejoraPromedio > 0
            ? "from-green-50 to-green-100 border-green-200"
            : stats.mejoraPromedio < 0
              ? "from-red-50 to-red-100 border-red-200"
              : "from-gray-50 to-gray-100 border-gray-200"
        )}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {stats.mejoraPromedio > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : stats.mejoraPromedio < 0 ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <Minus className="h-5 w-5 text-gray-600" />
              )}
              <div>
                <div className={cn(
                  "text-2xl font-bold",
                  stats.mejoraPromedio > 0 ? "text-green-700" :
                    stats.mejoraPromedio < 0 ? "text-red-700" : "text-gray-700"
                )}>
                  {stats.mejoraPromedio > 0 ? '+' : ''}{stats.mejoraPromedio}%
                </div>
                <p className={cn(
                  "text-xs",
                  stats.mejoraPromedio > 0 ? "text-green-600" :
                    stats.mejoraPromedio < 0 ? "text-red-600" : "text-gray-600"
                )}>Mejora Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Resultados por Participante
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">#</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Participante</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Pre-Test</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Post-Test</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Mejora</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p, idx) => (
                  <tr key={p.nombre || p.participanteId} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center">
                        {idx < 3 ? (
                          <Medal className={cn("h-5 w-5", getMedalColor(idx))} />
                        ) : (
                          <span className="text-sm text-muted-foreground w-5 text-center">{idx + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-sm">{p.nombre}</span>
                    </td>
                    <td className="p-3">
                      {p.preTest.total > 0 ? (
                        <div className="flex flex-col items-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              p.preTest.porcentaje >= 70 ? "bg-green-50 text-green-700 border-green-200" :
                                p.preTest.porcentaje >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                  "bg-red-50 text-red-700 border-red-200"
                            )}
                          >
                            {p.preTest.porcentaje}%
                          </Badge>
                          <span className="text-xs text-muted-foreground mt-1">
                            {p.preTest.correctas}/{p.preTest.total}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {p.postTest.total > 0 ? (
                        <div className="flex flex-col items-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              p.postTest.porcentaje >= 70 ? "bg-green-50 text-green-700 border-green-200" :
                                p.postTest.porcentaje >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                  "bg-red-50 text-red-700 border-red-200"
                            )}
                          >
                            {p.postTest.porcentaje}%
                          </Badge>
                          <span className="text-xs text-muted-foreground mt-1">
                            {p.postTest.correctas}/{p.postTest.total}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        {getMejoraIcon(p.mejora)}
                        {p.mejora !== null && (
                          <span className={cn(
                            "text-sm font-medium",
                            p.mejora > 0 ? "text-green-600" :
                              p.mejora < 0 ? "text-red-600" : "text-gray-500"
                          )}>
                            {p.mejora > 0 ? '+' : ''}{p.mejora}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-primary">{p.puntajeTotal}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-200"></div>
          <span>≥70% Aprobado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-200"></div>
          <span>50-69% Regular</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-200"></div>
          <span>&lt;50% Reprobado</span>
        </div>
      </div>
    </div>
  );
}
