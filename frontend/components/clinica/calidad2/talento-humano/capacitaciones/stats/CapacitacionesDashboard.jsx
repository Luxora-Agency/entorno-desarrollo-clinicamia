'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, CheckCircle, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { useCapacitaciones } from '@/hooks/useCapacitaciones';
import { useActasReunion } from '@/hooks/useActasReunion';

export default function CapacitacionesDashboard() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);

  const { stats, loadStats, loading } = useCapacitaciones();
  const { stats: actasStats, loadStats: loadActasStats } = useActasReunion();

  useEffect(() => {
    loadStats(anio);
    loadActasStats({ fechaDesde: `${anio}-01-01`, fechaHasta: `${anio}-12-31` });
  }, [anio, loadStats, loadActasStats]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const estadoLabels = {
    PROGRAMADA: { label: 'Programadas', color: 'bg-blue-500' },
    EN_CURSO: { label: 'En Curso', color: 'bg-yellow-500' },
    COMPLETADA: { label: 'Completadas', color: 'bg-green-500' },
    CANCELADA: { label: 'Canceladas', color: 'bg-red-500' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Dashboard de Capacitaciones</h2>
          <p className="text-sm text-muted-foreground">Metricas y estadisticas del programa</p>
        </div>
        <Select value={anio.toString()} onValueChange={(v) => setAnio(parseInt(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacitaciones</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">programadas para {anio}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sesionesCompletadas || 0}</div>
            <p className="text-xs text-muted-foreground">de {stats?.totalSesiones || 0} programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adherencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.adherencia || 0}%</div>
            <Progress value={stats?.adherencia || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actasStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">generadas en {anio}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Capacitaciones por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.porEstado ? (
              <div className="space-y-3">
                {Object.entries(estadoLabels).map(([estado, config]) => {
                  const count = stats.porEstado[estado] || 0;
                  const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={estado} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{config.label}</span>
                        <span className="font-medium">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${config.color}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Sin datos</p>
            )}
          </CardContent>
        </Card>

        {/* Por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Capacitaciones por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.porCategoria && stats.porCategoria.length > 0 ? (
              <div className="space-y-3">
                {stats.porCategoria.map(cat => {
                  const percentage = stats.total > 0 ? Math.round((cat._count / stats.total) * 100) : 0;
                  return (
                    <div key={cat.categoriaId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.categoria?.color || '#6366f1' }}
                          />
                          <span className="truncate max-w-[200px]">{cat.categoria?.nombre || 'Sin categoria'}</span>
                        </div>
                        <span className="font-medium">{cat._count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{ width: `${percentage}%`, backgroundColor: cat.categoria?.color || '#6366f1' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Sin datos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actas por Tipo */}
      {actasStats?.porTipo && actasStats.porTipo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Actas por Tipo de Reunion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {actasStats.porTipo.map(tipo => (
                <Badge key={tipo.tipo} variant="outline" className="text-sm py-1 px-3">
                  {tipo.label}: {tipo.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
