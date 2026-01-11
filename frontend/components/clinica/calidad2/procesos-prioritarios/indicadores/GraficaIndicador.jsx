'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Componente de gráfica para visualizar tendencia de un indicador
 * Muestra serie temporal con meta y análisis de cumplimiento
 */
export default function GraficaIndicador({ indicador, mediciones = [] }) {
  if (!indicador || mediciones.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>No hay datos suficientes para mostrar la gráfica</p>
        </CardContent>
      </Card>
    );
  }

  // Ordenar mediciones por período
  const medicionesOrdenadas = [...mediciones].sort((a, b) => {
    return a.periodo.localeCompare(b.periodo);
  });

  // Extraer datos para la gráfica
  const periodos = medicionesOrdenadas.map((m) => m.periodo);
  const resultados = medicionesOrdenadas.map((m) => m.resultado);
  const meta = indicador.meta;

  // Calcular tendencia
  const tendencia = calcularTendencia(resultados);

  // Configuración de la gráfica
  const option = {
    title: {
      text: indicador.nombre,
      subtext: indicador.categoria,
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        let tooltip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach((item) => {
          tooltip += `${item.marker} ${item.seriesName}: <strong>${item.value}${
            indicador.unidadMedida === 'PORCENTAJE' ? '%' : ''
          }</strong><br/>`;
        });
        return tooltip;
      },
    },
    legend: {
      data: ['Resultado', 'Meta'],
      top: '10%',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: periodos,
    },
    yAxis: {
      type: 'value',
      name: indicador.unidadMedida === 'PORCENTAJE' ? 'Porcentaje (%)' : indicador.unidadMedida,
    },
    series: [
      {
        name: 'Resultado',
        type: 'line',
        data: resultados,
        smooth: true,
        itemStyle: {
          color: '#3b82f6',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
        markPoint: {
          data: [
            { type: 'max', name: 'Máximo' },
            { type: 'min', name: 'Mínimo' },
          ],
        },
        markLine: {
          data: [{ type: 'average', name: 'Promedio' }],
        },
      },
      {
        name: 'Meta',
        type: 'line',
        data: periodos.map(() => meta),
        lineStyle: {
          type: 'dashed',
          color: '#10b981',
        },
        itemStyle: {
          color: '#10b981',
        },
      },
    ],
  };

  const TendenciaIcon = tendencia === 'up' ? TrendingUp : tendencia === 'down' ? TrendingDown : Minus;
  const tendenciaColor =
    tendencia === 'up'
      ? indicador.sentido === 'ASCENDENTE'
        ? 'text-green-600'
        : 'text-red-600'
      : tendencia === 'down'
      ? indicador.sentido === 'DESCENDENTE'
        ? 'text-green-600'
        : 'text-red-600'
      : 'text-gray-600';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Tendencia Temporal</span>
          <div className="flex items-center gap-2">
            <TendenciaIcon className={`h-5 w-5 ${tendenciaColor}`} />
            <span className={`text-sm ${tendenciaColor}`}>
              {tendencia === 'up' ? 'Tendencia al alza' : tendencia === 'down' ? 'Tendencia a la baja' : 'Estable'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: '400px' }} />

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Última Medición</p>
            <p className="text-lg font-bold">
              {resultados[resultados.length - 1]}
              {indicador.unidadMedida === 'PORCENTAJE' && '%'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Promedio</p>
            <p className="text-lg font-bold">
              {(resultados.reduce((a, b) => a + b, 0) / resultados.length).toFixed(2)}
              {indicador.unidadMedida === 'PORCENTAJE' && '%'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-lg font-bold text-green-600">
              {meta}
              {indicador.unidadMedida === 'PORCENTAJE' && '%'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Cumplimiento</p>
            <p className="text-lg font-bold">
              {mediciones.filter((m) => m.cumpleMeta).length}/{mediciones.length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Función auxiliar para calcular tendencia
function calcularTendencia(valores) {
  if (valores.length < 2) return 'stable';

  // Regresión lineal simple
  const n = valores.length;
  const indices = valores.map((_, i) => i);
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = valores.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * valores[i], 0);
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  if (slope > 0.1) return 'up';
  if (slope < -0.1) return 'down';
  return 'stable';
}
