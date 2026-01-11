'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';

export default function IndicadorCard({ indicador, onEdit, onDelete, onAddMedicion }) {
  const ultimaMedicion = indicador.mediciones && indicador.mediciones[0];
  const SentidoIcon = getSentidoIcon(indicador.sentido);
  const cumpleMeta = ultimaMedicion?.cumpleMeta;

  function getSentidoIcon(sentido) {
    const icons = {
      ASCENDENTE: TrendingUp,
      DESCENDENTE: TrendingDown,
      MANTENER: Minus,
    };
    return icons[sentido] || Activity;
  }

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

          {/* Acciones */}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onAddMedicion(indicador)}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(indicador)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(indicador.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
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
}
