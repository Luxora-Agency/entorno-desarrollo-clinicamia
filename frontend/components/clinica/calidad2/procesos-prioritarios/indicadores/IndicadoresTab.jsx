'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Activity,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useCalidad2IndicadoresPP } from '@/hooks/useCalidad2IndicadoresPP';

export default function IndicadoresTab() {
  const {
    indicadores,
    dashboard,
    pagination,
    loading,
    error,
    fetchIndicadores,
    refreshAll,
  } = useCalidad2IndicadoresPP();

  const getCategoriaColor = (categoria) => {
    const colors = {
      SEGURIDAD: 'red',
      GPC: 'purple',
      COMITES: 'blue',
      SIAU: 'green',
      GENERAL: 'cyan',
    };
    return colors[categoria] || 'default';
  };

  const getTipoColor = (tipo) => {
    const colors = {
      ESTRUCTURA: 'blue',
      PROCESO: 'yellow',
      RESULTADO: 'green',
    };
    return colors[tipo] || 'default';
  };

  const getSentidoIcon = (sentido) => {
    const icons = {
      ASCENDENTE: TrendingUp,
      DESCENDENTE: TrendingDown,
      MANTENER: Minus,
    };
    return icons[sentido] || Activity;
  };

  const IndicadorCard = ({ indicador }) => {
    const ultimaMedicion = indicador.mediciones && indicador.mediciones[0];
    const SentidoIcon = getSentidoIcon(indicador.sentido);
    const cumpleMeta = ultimaMedicion?.cumpleMeta;

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {indicador.codigo}
                </code>
                <Badge variant={getCategoriaColor(indicador.categoria)}>
                  {indicador.categoria}
                </Badge>
                <Badge variant={getTipoColor(indicador.tipo)} className="text-xs">
                  {indicador.tipo}
                </Badge>
                {indicador.estado === 'ACTIVO' ? (
                  <Badge variant="success" className="text-xs">
                    Activo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Inactivo
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{indicador.nombre}</CardTitle>
            </div>

            {/* Última medición */}
            {ultimaMedicion && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {cumpleMeta !== null && (
                    cumpleMeta ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    )
                  )}
                  <div className="text-2xl font-bold">
                    {ultimaMedicion.resultado.toFixed(1)}
                    {indicador.unidadMedida === 'PORCENTAJE' && '%'}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ultimaMedicion.periodo}
                </p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Definición */}
          {indicador.definicion && (
            <div className="text-sm">
              <p className="font-medium mb-1">Definición:</p>
              <p className="text-muted-foreground line-clamp-2">{indicador.definicion}</p>
            </div>
          )}

          {/* Fórmula y Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {indicador.formula && (
              <div>
                <p className="font-medium mb-1">Fórmula:</p>
                <p className="text-muted-foreground font-mono text-xs bg-muted p-2 rounded">
                  {indicador.formula}
                </p>
              </div>
            )}
            {indicador.meta && (
              <div>
                <p className="font-medium mb-1 flex items-center gap-2">
                  <Target className="h-3 w-3" />
                  Meta:
                </p>
                <div className="flex items-center gap-2">
                  <SentidoIcon className={`h-4 w-4 ${
                    indicador.sentido === 'ASCENDENTE' ? 'text-green-600' :
                    indicador.sentido === 'DESCENDENTE' ? 'text-red-600' :
                    'text-gray-600'
                  }`} />
                  <span className="text-lg font-bold">
                    {indicador.meta}
                    {indicador.unidadMedida === 'PORCENTAJE' && '%'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mediciones recientes */}
          {indicador.mediciones && indicador.mediciones.length > 0 && (
            <div className="border-t pt-3">
              <p className="font-medium text-sm mb-2">
                Últimas Mediciones ({indicador.mediciones.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {indicador.mediciones.slice(0, 3).map((medicion, index) => (
                  <div
                    key={index}
                    className="p-2 bg-muted rounded text-center"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {medicion.periodo}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      {medicion.cumpleMeta !== null && (
                        medicion.cumpleMeta ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-orange-600" />
                        )
                      )}
                      <span className="font-bold">
                        {medicion.resultado.toFixed(1)}
                        {indicador.unidadMedida === 'PORCENTAJE' && '%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Análisis de última medición */}
          {ultimaMedicion?.analisis && (
            <div className="border-t pt-3 text-sm">
              <p className="font-medium mb-1">Análisis:</p>
              <p className="text-muted-foreground line-clamp-2">
                {ultimaMedicion.analisis}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar indicadores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={refreshAll} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Indicadores de Procesos Prioritarios</h3>
          <p className="text-sm text-muted-foreground">
            Seguimiento y medición de indicadores clave
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshAll} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Indicador
          </Button>
        </div>
      </div>

      {/* Stats */}
      {dashboard && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Indicadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.total || 0}</div>
              <p className="text-xs text-muted-foreground">Activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cumpliendo Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboard.cumpliendoMeta || 0}
              </div>
              <p className="text-xs text-muted-foreground">En objetivo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">No Cumplen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboard.noCumplen || 0}
              </div>
              <p className="text-xs text-muted-foreground">Requieren acción</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sin Mediciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {dashboard.sinMediciones || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-4">
        {loading && indicadores.length === 0 ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))
        ) : indicadores.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin indicadores</h3>
              <p className="text-muted-foreground">No hay indicadores registrados</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {indicadores.map((indicador) => (
              <IndicadorCard key={indicador.id} indicador={indicador} />
            ))}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {indicadores.length} de {pagination.total} indicadores
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1 || loading}
                    onClick={() => fetchIndicadores({ page: pagination.page - 1 })}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages || loading}
                    onClick={() => fetchIndicadores({ page: pagination.page + 1 })}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
