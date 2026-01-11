'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Star, AlertCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { useCalidad2PQRSF } from '@/hooks/useCalidad2PQRSF';
import { useCalidad2Encuestas } from '@/hooks/useCalidad2Encuestas';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Dashboard para módulo SIAU
 * Muestra estadísticas de PQRSF, encuestas y educación al usuario
 */
export default function DashboardSIAU() {
  const { pqrsf, loading: loadingPQRSF } = useCalidad2PQRSF();
  const { encuestas, estadisticas: statsEncuestas, loading: loadingEncuestas } = useCalidad2Encuestas();

  if ((loadingPQRSF && !pqrsf.length) || (loadingEncuestas && !encuestas.length)) {
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

  // Estadísticas PQRSF
  const totalPQRSF = pqrsf.length;
  const pqrsfRadicadas = pqrsf.filter((p) => p.estado === 'RADICADA').length;
  const pqrsfRespondidas = pqrsf.filter((p) => p.estado === 'RESPONDIDA').length;
  const pqrsfVencidas = pqrsf.filter((p) => {
    if (!p.fechaRespuestaEsperada || p.estado === 'RESPONDIDA' || p.estado === 'CERRADA') return false;
    return new Date(p.fechaRespuestaEsperada) < new Date();
  }).length;

  // PQRSF por tipo
  const pqrsfPorTipo = pqrsf.reduce((acc, p) => {
    acc[p.tipo] = (acc[p.tipo] || 0) + 1;
    return acc;
  }, {});

  // PQRSF recientes
  const pqrsfRecientes = [...pqrsf]
    .sort((a, b) => new Date(b.fechaRadicacion) - new Date(a.fechaRadicacion))
    .slice(0, 5);

  // Estadísticas Encuestas
  const totalEncuestas = encuestas.length;
  const promedioGeneral = statsEncuestas?.promedioGeneral || 0;

  // Encuestas con baja satisfacción
  const encuestasBajaSatisfaccion = encuestas.filter(
    (e) => e.satisfaccionGeneral && e.satisfaccionGeneral < 3
  ).length;

  // Tendencia de satisfacción (últimas 30 encuestas)
  const encuestasRecientes = [...encuestas]
    .sort((a, b) => new Date(b.fechaEncuesta) - new Date(a.fechaEncuesta))
    .slice(0, 30);

  const promedioReciente =
    encuestasRecientes.length > 0
      ? encuestasRecientes.reduce((sum, e) => sum + (e.satisfaccionGeneral || 0), 0) /
        encuestasRecientes.length
      : 0;

  const getTipoColor = (tipo) => {
    const colors = {
      PETICION: 'blue',
      QUEJA: 'orange',
      RECLAMO: 'red',
      SUGERENCIA: 'green',
      FELICITACION: 'purple',
    };
    return colors[tipo] || 'default';
  };

  const getSatisfaccionColor = (valor) => {
    if (valor >= 4) return 'text-green-600';
    if (valor >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Total PQRSF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPQRSF}</div>
            <p className="text-xs text-muted-foreground">{pqrsfRespondidas} respondidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pqrsfRadicadas}</div>
            <p className="text-xs text-muted-foreground">{pqrsfVencidas} vencidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              Encuestas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEncuestas}</div>
            <p className="text-xs text-muted-foreground">Registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Satisfacción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSatisfaccionColor(promedioGeneral)}`}>
              {promedioGeneral.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Promedio general</p>
          </CardContent>
        </Card>
      </div>

      {/* PQRSF por Tipo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">PQRSF por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(pqrsfPorTipo).map(([tipo, count]) => (
                <div key={tipo} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getTipoColor(tipo)}>{tipo}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">
                      {((count / totalPQRSF) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Alertas y Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pqrsfVencidas > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-red-900">PQRSF Vencidas</p>
                    <Badge variant="destructive">{pqrsfVencidas}</Badge>
                  </div>
                  <p className="text-xs text-red-700 mt-1">
                    Requieren respuesta inmediata
                  </p>
                </div>
              )}

              {pqrsfRadicadas > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-orange-900">PQRSF Radicadas</p>
                    <Badge variant="warning">{pqrsfRadicadas}</Badge>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    En proceso de gestión
                  </p>
                </div>
              )}

              {encuestasBajaSatisfaccion > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-yellow-900">Baja Satisfacción</p>
                    <Badge variant="warning">{encuestasBajaSatisfaccion}</Badge>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Encuestas con puntaje &lt; 3.0
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PQRSF Recientes */}
      {pqrsfRecientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              PQRSF Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pqrsfRecientes.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{p.codigo}</p>
                      <Badge variant={getTipoColor(p.tipo)} className="text-xs">
                        {p.tipo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.asunto}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(p.fechaRadicacion), 'PPP', { locale: es })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      p.estado === 'RESPONDIDA' || p.estado === 'CERRADA'
                        ? 'success'
                        : p.estado === 'RADICADA'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {p.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tendencia de Satisfacción */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Tendencia de Satisfacción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Promedio General</p>
              <div className={`text-4xl font-bold ${getSatisfaccionColor(promedioGeneral)}`}>
                {promedioGeneral.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Todas las encuestas</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Últimas 30 Encuestas</p>
              <div className={`text-4xl font-bold ${getSatisfaccionColor(promedioReciente)}`}>
                {promedioReciente.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {promedioReciente > promedioGeneral ? '↑ Mejorando' : '↓ En descenso'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
