'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Star, BarChart3 } from 'lucide-react';
import { useCalidad2Encuestas } from '@/hooks/useCalidad2Encuestas';

export default function AnalisisEncuestas() {
  const { analisisPeriodo, fetchAnalisisPeriodo } = useCalidad2Encuestas();
  const [periodo, setPeriodo] = useState('mes_actual');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalisis();
  }, [periodo]);

  const loadAnalisis = async () => {
    try {
      setLoading(true);
      await fetchAnalisisPeriodo(periodo);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDimensionColor = (promedio) => {
    if (promedio >= 4.5) return 'text-green-600';
    if (promedio >= 4.0) return 'text-blue-600';
    if (promedio >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDimensionBgColor = (promedio) => {
    if (promedio >= 4.5) return 'bg-green-100';
    if (promedio >= 4.0) return 'bg-blue-100';
    if (promedio >= 3.0) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (tendencia) => {
    if (tendencia === 'ASCENDENTE') return TrendingUp;
    if (tendencia === 'DESCENDENTE') return TrendingDown;
    return Minus;
  };

  const getTrendColor = (tendencia) => {
    if (tendencia === 'ASCENDENTE') return 'text-green-600';
    if (tendencia === 'DESCENDENTE') return 'text-red-600';
    return 'text-gray-600';
  };

  if (!analisisPeriodo) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Selecciona un período para ver el análisis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Análisis de Encuestas</h3>
          <p className="text-sm text-muted-foreground">
            Resultados y tendencias de satisfacción
          </p>
        </div>
        <div className="w-64">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_actual">Mes Actual</SelectItem>
              <SelectItem value="mes_anterior">Mes Anterior</SelectItem>
              <SelectItem value="trimestre_actual">Trimestre Actual</SelectItem>
              <SelectItem value="semestre_actual">Semestre Actual</SelectItem>
              <SelectItem value="anio_actual">Año Actual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Encuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analisisPeriodo.totalEncuestas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En el período seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Satisfacción General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getDimensionColor(analisisPeriodo.promedioGeneral || 0)}`}>
              {(analisisPeriodo.promedioGeneral || 0).toFixed(1)}
            </div>
            <div className="flex items-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(analisisPeriodo.promedioGeneral || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tasa de Respuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analisisPeriodo.tasaRespuesta || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              De usuarios atendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tendencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-2 ${getTrendColor(analisisPeriodo.tendencia)}`}>
              {(() => {
                const Icon = getTrendIcon(analisisPeriodo.tendencia);
                return <Icon className="h-8 w-8" />;
              })()}
              <span className="text-2xl font-bold">
                {analisisPeriodo.tendencia || 'ESTABLE'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dimensiones de Evaluación */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensiones de Evaluación</CardTitle>
          <CardDescription>Promedio por dimensión evaluada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analisisPeriodo.dimensiones && analisisPeriodo.dimensiones.map((dimension) => (
            <div key={dimension.nombre} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{dimension.nombre}</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(dimension.promedio)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-lg font-bold ${getDimensionColor(dimension.promedio)}`}>
                    {dimension.promedio.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute h-full ${getDimensionBgColor(dimension.promedio)} transition-all duration-500`}
                  style={{ width: `${(dimension.promedio / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {dimension.totalRespuestas} respuestas
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Distribución por Servicio */}
      {analisisPeriodo.porServicio && analisisPeriodo.porServicio.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Satisfacción por Servicio</CardTitle>
            <CardDescription>Promedio de satisfacción por área de atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analisisPeriodo.porServicio.map((servicio) => (
                <div key={servicio.servicio} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{servicio.servicio}</p>
                    <p className="text-xs text-muted-foreground">{servicio.total} encuestas</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= Math.round(servicio.promedio)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-lg font-bold ${getDimensionColor(servicio.promedio)}`}>
                      {servicio.promedio.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comentarios Frecuentes */}
      {(analisisPeriodo.comentariosPositivos?.length > 0 || analisisPeriodo.areasMejora?.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Aspectos Positivos */}
          {analisisPeriodo.comentariosPositivos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aspectos Más Destacados</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analisisPeriodo.comentariosPositivos.slice(0, 5).map((comentario, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600 font-bold">+</span>
                      <span>{comentario}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Áreas de Mejora */}
          {analisisPeriodo.areasMejora?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Áreas de Mejora Identificadas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analisisPeriodo.areasMejora.slice(0, 5).map((area, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
