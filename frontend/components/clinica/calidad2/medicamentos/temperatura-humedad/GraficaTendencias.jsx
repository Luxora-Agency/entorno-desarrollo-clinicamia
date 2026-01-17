'use client';

import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCalidad2TemperaturaHumedad } from '@/hooks/useCalidad2TemperaturaHumedad';

const AREAS = [
  { value: 'FARMACIA', label: 'Farmacia' },
  { value: 'BODEGA', label: 'Bodega' },
  { value: 'REFRIGERADOR_VACUNAS', label: 'Refrigerador Vacunas' },
  { value: 'LABORATORIO', label: 'Laboratorio' },
  { value: 'ALMACEN_DISPOSITIVOS', label: 'Almacén Dispositivos' },
  { value: 'QUIROFANO', label: 'Quirófano' },
];

const PERIODOS = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '60', label: 'Últimos 60 días' },
  { value: '90', label: 'Últimos 90 días' },
];

export default function GraficaTendencias() {
  const { getTendencias, loading } = useCalidad2TemperaturaHumedad();
  const [area, setArea] = useState('FARMACIA');
  const [periodo, setPeriodo] = useState('30');
  const [tendencias, setTendencias] = useState([]);

  useEffect(() => {
    loadTendencias();
  }, [area, periodo]);

  const loadTendencias = async () => {
    const data = await getTendencias(area, periodo);
    if (data) {
      setTendencias(Array.isArray(data) ? data : []);
    }
  };

  const chartOption = useMemo(() => {
    if (!tendencias.length) return null;

    // Sort by fecha
    const sortedData = [...tendencias].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Extract data for charts
    const fechas = sortedData.map(d => new Date(d.fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    }));

    const temperaturas = sortedData.map(d => d.temperatura);
    const humedades = sortedData.map(d => d.humedad);

    // Get min/max ranges (assuming all records have same ranges for the area)
    const tempMin = sortedData.length > 0 ? sortedData[0].temperaturaMin : 15;
    const tempMax = sortedData.length > 0 ? sortedData[0].temperaturaMax : 25;
    const humMin = sortedData.length > 0 ? sortedData[0].humedadMin : 30;
    const humMax = sortedData.length > 0 ? sortedData[0].humedadMax : 60;

    // Color points based on whether they're in range
    const tempColors = sortedData.map(d => d.temperaturaEnRango ? '#3b82f6' : '#ef4444');
    const humColors = sortedData.map(d => d.humedadEnRango ? '#06b6d4' : '#ef4444');

    return {
      title: {
        text: `Tendencias de Temperatura y Humedad - ${area.replace(/_/g, ' ')}`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: function (params) {
          let result = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach(param => {
            const dataIndex = param.dataIndex;
            const registro = sortedData[dataIndex];

            if (param.seriesName === 'Temperatura') {
              const enRango = registro.temperaturaEnRango ? '✓' : '⚠️';
              result += `${param.marker} ${param.seriesName}: <strong>${param.value}°C</strong> ${enRango}<br/>`;
              result += `   Rango: ${tempMin}°C - ${tempMax}°C<br/>`;
            } else if (param.seriesName === 'Humedad') {
              const enRango = registro.humedadEnRango ? '✓' : '⚠️';
              result += `${param.marker} ${param.seriesName}: <strong>${param.value}%</strong> ${enRango}<br/>`;
              result += `   Rango: ${humMin}% - ${humMax}%<br/>`;
            }
          });
          return result;
        },
      },
      legend: {
        data: ['Temperatura', 'Rango Temp Mín', 'Rango Temp Máx', 'Humedad', 'Rango Hum Mín', 'Rango Hum Máx'],
        top: 35,
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
        data: fechas,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Temperatura (°C)',
          position: 'left',
          axisLabel: {
            formatter: '{value}°C',
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
            },
          },
        },
        {
          type: 'value',
          name: 'Humedad (%)',
          position: 'right',
          axisLabel: {
            formatter: '{value}%',
          },
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        // Temperatura
        {
          name: 'Temperatura',
          type: 'line',
          yAxisIndex: 0,
          data: temperaturas,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: (params) => tempColors[params.dataIndex],
          },
          lineStyle: {
            color: '#3b82f6',
            width: 2,
          },
          emphasis: {
            focus: 'series',
          },
        },
        // Rango Temp Mín
        {
          name: 'Rango Temp Mín',
          type: 'line',
          yAxisIndex: 0,
          data: Array(fechas.length).fill(tempMin),
          lineStyle: {
            color: '#93c5fd',
            type: 'dashed',
            width: 1,
          },
          symbol: 'none',
          itemStyle: {
            color: '#93c5fd',
          },
        },
        // Rango Temp Máx
        {
          name: 'Rango Temp Máx',
          type: 'line',
          yAxisIndex: 0,
          data: Array(fechas.length).fill(tempMax),
          lineStyle: {
            color: '#93c5fd',
            type: 'dashed',
            width: 1,
          },
          symbol: 'none',
          itemStyle: {
            color: '#93c5fd',
          },
          areaStyle: {
            color: 'rgba(147, 197, 253, 0.1)',
            origin: 'start',
          },
        },
        // Humedad
        {
          name: 'Humedad',
          type: 'line',
          yAxisIndex: 1,
          data: humedades,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: (params) => humColors[params.dataIndex],
          },
          lineStyle: {
            color: '#06b6d4',
            width: 2,
          },
          emphasis: {
            focus: 'series',
          },
        },
        // Rango Hum Mín
        {
          name: 'Rango Hum Mín',
          type: 'line',
          yAxisIndex: 1,
          data: Array(fechas.length).fill(humMin),
          lineStyle: {
            color: '#67e8f9',
            type: 'dashed',
            width: 1,
          },
          symbol: 'none',
          itemStyle: {
            color: '#67e8f9',
          },
        },
        // Rango Hum Máx
        {
          name: 'Rango Hum Máx',
          type: 'line',
          yAxisIndex: 1,
          data: Array(fechas.length).fill(humMax),
          lineStyle: {
            color: '#67e8f9',
            type: 'dashed',
            width: 1,
          },
          symbol: 'none',
          itemStyle: {
            color: '#67e8f9',
          },
          areaStyle: {
            color: 'rgba(103, 232, 249, 0.1)',
            origin: 'start',
          },
        },
      ],
    };
  }, [tendencias, area]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Área:</label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map(a => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Período:</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gráfica de Tendencias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
            </div>
          ) : !chartOption ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay datos disponibles para el período seleccionado</p>
            </div>
          ) : (
            <ReactECharts
              option={chartOption}
              style={{ height: '500px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-blue-900 mb-2">Temperatura:</p>
              <ul className="space-y-1 text-blue-800">
                <li>• <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span> Punto azul = dentro de rango</li>
                <li>• <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span> Punto rojo = fuera de rango</li>
                <li>• Líneas punteadas = límites del rango permitido</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-cyan-900 mb-2">Humedad:</p>
              <ul className="space-y-1 text-cyan-800">
                <li>• <span className="inline-block w-3 h-3 rounded-full bg-cyan-500 mr-1"></span> Punto cian = dentro de rango</li>
                <li>• <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span> Punto rojo = fuera de rango</li>
                <li>• Líneas punteadas = límites del rango permitido</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
