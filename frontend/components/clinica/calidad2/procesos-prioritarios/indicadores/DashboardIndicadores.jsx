'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, CheckCircle2, AlertCircle, Target } from 'lucide-react';
import { useCalidad2IndicadoresPP } from '@/hooks/useCalidad2IndicadoresPP';
import { Skeleton } from '@/components/ui/skeleton';
import ReactECharts from 'echarts-for-react';

/**
 * Dashboard para módulo de Indicadores
 * Muestra resumen de indicadores clave y cumplimiento de metas
 */
export default function DashboardIndicadores() {
  const { indicadores, loading } = useCalidad2IndicadoresPP();

  if (loading && !indicadores.length) {
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

  // Indicadores con mediciones
  const indicadoresConMediciones = indicadores.filter(
    (ind) => ind.mediciones && ind.mediciones.length > 0
  );

  // Indicadores por categoría
  const indicadoresPorCategoria = indicadores.reduce((acc, ind) => {
    acc[ind.categoria] = (acc[ind.categoria] || 0) + 1;
    return acc;
  }, {});

  // Cumplimiento general
  const totalMediciones = indicadoresConMediciones.reduce(
    (sum, ind) => sum + ind.mediciones.length,
    0
  );
  const medicionesCumplen = indicadoresConMediciones.reduce(
    (sum, ind) => sum + ind.mediciones.filter((m) => m.cumpleMeta).length,
    0
  );
  const porcentajeCumplimiento =
    totalMediciones > 0 ? ((medicionesCumplen / totalMediciones) * 100).toFixed(0) : 0;

  // Top 5 indicadores con mejor cumplimiento
  const indicadoresTopCumplimiento = [...indicadoresConMediciones]
    .map((ind) => {
      const cumplen = ind.mediciones.filter((m) => m.cumpleMeta).length;
      const total = ind.mediciones.length;
      return {
        ...ind,
        porcentajeCumplimiento: total > 0 ? (cumplen / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.porcentajeCumplimiento - a.porcentajeCumplimiento)
    .slice(0, 5);

  // Indicadores que requieren atención (no cumplen meta en última medición)
  const indicadoresAtencion = indicadoresConMediciones.filter((ind) => {
    const ultimaMedicion = ind.mediciones[0]; // Asumiendo que están ordenadas
    return ultimaMedicion && !ultimaMedicion.cumpleMeta;
  });

  // Gráfica de cumplimiento por categoría
  const categoriasData = Object.entries(indicadoresPorCategoria).map(([categoria, count]) => {
    const indsCategoria = indicadores.filter((i) => i.categoria === categoria);
    const medicionesCategoria = indsCategoria.reduce(
      (sum, ind) => sum + (ind.mediciones?.length || 0),
      0
    );
    const cumplenCategoria = indsCategoria.reduce(
      (sum, ind) => sum + (ind.mediciones?.filter((m) => m.cumpleMeta).length || 0),
      0
    );
    const cumplimiento =
      medicionesCategoria > 0 ? ((cumplenCategoria / medicionesCategoria) * 100).toFixed(0) : 0;

    return {
      categoria,
      count,
      cumplimiento: parseFloat(cumplimiento),
    };
  });

  const optionCategorias = {
    title: {
      text: 'Cumplimiento por Categoría',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: categoriasData.map((d) => d.categoria),
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Cumplimiento (%)',
      max: 100,
    },
    series: [
      {
        name: 'Cumplimiento',
        type: 'bar',
        data: categoriasData.map((d) => d.cumplimiento),
        itemStyle: {
          color: function (params) {
            const value = params.value;
            if (value >= 80) return '#10b981';
            if (value >= 60) return '#f59e0b';
            return '#ef4444';
          },
        },
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Total Indicadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.length}</div>
            <p className="text-xs text-muted-foreground">{indicadoresConMediciones.length} con mediciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Cumplimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{porcentajeCumplimiento}%</div>
            <p className="text-xs text-muted-foreground">
              {medicionesCumplen} de {totalMediciones} mediciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              Mediciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMediciones}</div>
            <p className="text-xs text-muted-foreground">Registradas este año</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Requieren Atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{indicadoresAtencion.length}</div>
            <p className="text-xs text-muted-foreground">No cumplen meta</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica de Cumplimiento por Categoría */}
      {categoriasData.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <ReactECharts option={optionCategorias} style={{ height: '300px' }} />
          </CardContent>
        </Card>
      )}

      {/* Top Indicadores */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Mejor Cumplimiento */}
        {indicadoresTopCumplimiento.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Mejor Cumplimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {indicadoresTopCumplimiento.map((ind, index) => (
                  <div key={ind.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <p className="font-medium text-sm">{ind.nombre}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{ind.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        {ind.porcentajeCumplimiento.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requieren Atención */}
        {indicadoresAtencion.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Requieren Atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {indicadoresAtencion.slice(0, 5).map((ind) => {
                  const ultimaMedicion = ind.mediciones[0];
                  return (
                    <div
                      key={ind.id}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ind.nombre}</p>
                        <p className="text-xs text-muted-foreground">{ind.categoria}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">
                          {ultimaMedicion.resultado}
                          {ind.unidadMedida === 'PORCENTAJE' && '%'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Meta: {ind.meta}
                          {ind.unidadMedida === 'PORCENTAJE' && '%'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Indicadores por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Indicadores por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(indicadoresPorCategoria).map(([categoria, count]) => (
              <div key={categoria} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{categoria}</p>
                  <Badge variant="outline">{count}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
