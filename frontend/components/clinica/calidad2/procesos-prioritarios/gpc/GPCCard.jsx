'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  FileText,
  BookOpen,
  Edit,
  Trash2,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function GPCCard({ guia, onEdit, onDelete }) {
  const getEstadoColor = (estado) => {
    const colors = {
      VIGENTE: 'green',
      EN_REVISION: 'yellow',
      OBSOLETA: 'destructive',
    };
    return colors[estado] || 'default';
  };

  const getRecomendacionColor = (recomendacion) => {
    const colors = {
      RECOMENDADA: 'green',
      RECOMENDADA_MODIFICACIONES: 'yellow',
      NO_RECOMENDADA: 'destructive',
    };
    return colors[recomendacion] || 'default';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {guia.codigo}
              </code>
              <Badge variant={getEstadoColor(guia.estado)}>
                {guia.estado}
              </Badge>
              {guia.patologia && (
                <Badge variant="outline">{guia.patologia.replace(/_/g, ' ')}</Badge>
              )}
            </div>
            <CardTitle className="text-lg">{guia.nombre}</CardTitle>
            {guia.fuenteGuia && (
              <p className="text-sm text-muted-foreground">
                Fuente: {guia.fuenteGuia} {guia.paisOrigen && `(${guia.paisOrigen})`}
                {guia.anioPublicacion && ` - ${guia.anioPublicacion}`}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(guia)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(guia.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información de Adopción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Adopción:</span>
            <span className="text-muted-foreground">
              {format(new Date(guia.fechaAdopcion), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
          {guia.proximaRevision && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Próxima Revisión:</span>
              <span className="text-muted-foreground">
                {format(new Date(guia.proximaRevision), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Resumen */}
        {guia.resumen && (
          <div className="text-sm">
            <p className="font-medium mb-1">Resumen:</p>
            <p className="text-muted-foreground line-clamp-3">{guia.resumen}</p>
          </div>
        )}

        {/* Evaluación AGREE II */}
        {guia.evaluacionAGREE && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Evaluación AGREE II</span>
              </div>
              {guia.recomendacion && (
                <Badge variant={getRecomendacionColor(guia.recomendacion)}>
                  {guia.recomendacion.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>

            {guia.puntajeAGREE !== null && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full ${
                        guia.puntajeAGREE >= 70
                          ? 'bg-green-500'
                          : guia.puntajeAGREE >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      } transition-all duration-500`}
                      style={{ width: `${guia.puntajeAGREE}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">{guia.puntajeAGREE.toFixed(1)}%</span>
              </div>
            )}

            {guia.dominiosAGREE && (
              <p className="text-xs text-muted-foreground">
                6 dominios evaluados (alcance, participación, rigor, claridad, aplicabilidad, independencia)
              </p>
            )}
          </div>
        )}

        {/* Adherencia */}
        {guia.evaluacionesAdherencia && guia.evaluacionesAdherencia.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">
                Adherencia ({guia.evaluacionesAdherencia.length} evaluaciones)
              </span>
            </div>
            <div className="space-y-2">
              {guia.evaluacionesAdherencia.slice(0, 2).map((evaluacion, index) => (
                <div key={index} className="p-2 bg-muted rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{evaluacion.periodo}</span>
                    <span
                      className={`font-bold ${
                        evaluacion.porcentajeAdherencia >= 80
                          ? 'text-green-600'
                          : evaluacion.porcentajeAdherencia >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {evaluacion.porcentajeAdherencia.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {evaluacion.casosAdherentes} de {evaluacion.casosEvaluados} casos
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documentos y Bibliografía */}
        <div className="border-t pt-3 flex items-center justify-between text-sm">
          {guia.documentos && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{guia.documentos.length} documentos</span>
            </div>
          )}
          {guia.bibliografia && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              <span>{guia.bibliografia.length} referencias</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
