'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Search,
  X,
  Edit,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AnalisisEventoModal from './AnalisisEventoModal';

export default function EventoAdversoCard({ evento, onUpdate, onEdit, onDelete }) {
  const [showAnalisisModal, setShowAnalisisModal] = useState(false);

  const getSeveridadColor = (severidad) => {
    const colors = {
      LEVE: 'blue',
      MODERADA: 'yellow',
      GRAVE: 'orange',
      MORTAL: 'destructive',
    };
    return colors[severidad] || 'default';
  };

  const getClasificacionColor = (clasificacion) => {
    const colors = {
      INCIDENTE: 'blue',
      EVENTO_ADVERSO: 'orange',
      CENTINELA: 'destructive',
    };
    return colors[clasificacion] || 'default';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      ABIERTO: 'yellow',
      EN_ANALISIS: 'blue',
      CERRADO: 'green',
    };
    return colors[estado] || 'default';
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      ABIERTO: AlertCircle,
      EN_ANALISIS: Search,
      CERRADO: CheckCircle2,
    };
    return icons[estado] || AlertCircle;
  };

  const EstadoIcon = getEstadoIcon(evento.estado);

  return (
    <>
      <Card className={evento.severidad === 'GRAVE' || evento.severidad === 'MORTAL' ? 'border-red-500 border-l-4' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {evento.codigo}
                </code>
                <Badge variant={getClasificacionColor(evento.clasificacion)}>
                  {evento.clasificacion}
                </Badge>
                <Badge variant={getSeveridadColor(evento.severidad)}>
                  {evento.severidad}
                </Badge>
                <Badge variant={getEstadoColor(evento.estado)} className="flex items-center gap-1">
                  <EstadoIcon className="h-3 w-3" />
                  {evento.estado}
                </Badge>
                {evento.evitable !== null && (
                  <Badge variant={evento.evitable ? 'destructive' : 'secondary'} className="text-xs">
                    {evento.evitable ? 'Evitable' : 'No evitable'}
                  </Badge>
                )}
                {evento.clasificacion === 'CENTINELA' && (
                  <Badge variant="destructive" className="animate-pulse">
                    ⚠️ CENTINELA
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {evento.tipoEvento}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Información del evento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Fecha:</span>
              <span className="text-muted-foreground">
                {format(new Date(evento.fechaEvento), 'dd/MM/yyyy', { locale: es })}
                {evento.horaEvento && ` - ${evento.horaEvento}`}
              </span>
            </div>
            {evento.lugarEvento && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Lugar:</span>
                <span className="text-muted-foreground">{evento.lugarEvento}</span>
              </div>
            )}
            {evento.nombrePaciente && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Paciente:</span>
                <span className="text-muted-foreground">{evento.nombrePaciente}</span>
              </div>
            )}
            {evento.reportadoPor && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Reportado por:</span>
                <span className="text-muted-foreground">{evento.reportadoPor}</span>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Descripción:</p>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {evento.descripcion}
            </p>
          </div>

          {/* Circunstancias */}
          {evento.circunstancias && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Circunstancias:</p>
              <p className="text-sm text-muted-foreground line-clamp-2 bg-muted p-2 rounded">
                {evento.circunstancias}
              </p>
            </div>
          )}

          {/* Análisis (si existe) */}
          {evento.analisisRealizado && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Análisis Realizado</span>
                {evento.metodoAnalisis && (
                  <Badge variant="outline" className="text-xs">
                    {evento.metodoAnalisis}
                  </Badge>
                )}
              </div>
              {evento.fechaAnalisis && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Analizado el {format(new Date(evento.fechaAnalisis), "dd/MM/yyyy", { locale: es })}
                  </span>
                </div>
              )}
              {evento.resultadoAnalisis && (
                <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200 line-clamp-3">
                  {evento.resultadoAnalisis}
                </p>
              )}
            </div>
          )}

          {/* Acciones */}
          {(evento.accionesInmediatas || evento.accionesPreventivas) && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Acciones Tomadas</span>
              </div>
              {evento.accionesInmediatas && (
                <div className="text-sm">
                  <p className="font-medium">Inmediatas:</p>
                  <p className="text-muted-foreground line-clamp-2">{evento.accionesInmediatas}</p>
                </div>
              )}
              {evento.accionesPreventivas && (
                <div className="text-sm">
                  <p className="font-medium">Preventivas:</p>
                  <p className="text-muted-foreground line-clamp-2">{evento.accionesPreventivas}</p>
                </div>
              )}
              {evento.fechaCierreAcciones && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Cerradas el {format(new Date(evento.fechaCierreAcciones), "dd/MM/yyyy", { locale: es })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reporte externo */}
          {evento.reportadoA && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Reportado a:</span>
                <Badge variant="outline">{evento.reportadoA}</Badge>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between pt-0">
          <div className="flex gap-2">
            {!evento.analisisRealizado && evento.estado !== 'CERRADO' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalisisModal(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                Realizar Análisis
              </Button>
            )}
            {onEdit && evento.estado !== 'CERRADO' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(evento)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
          {onDelete && evento.estado === 'ABIERTO' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(evento.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Análisis Modal */}
      {showAnalisisModal && (
        <AnalisisEventoModal
          evento={evento}
          open={showAnalisisModal}
          onClose={() => setShowAnalisisModal(false)}
          onSuccess={() => {
            setShowAnalisisModal(false);
            if (onUpdate) {
              onUpdate();
            }
          }}
        />
      )}
    </>
  );
}
