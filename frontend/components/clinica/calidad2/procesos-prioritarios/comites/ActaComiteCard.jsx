'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, FileText, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ActaComiteCard({ acta, onEdit, onDelete, onAprobar }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                Acta {acta.numeroActa}
              </code>
              {acta.aprobada ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aprobada
                </Badge>
              ) : (
                <Badge variant="yellow">Pendiente de Aprobación</Badge>
              )}
              {acta.quorum && (
                <Badge variant="outline">Con Quórum</Badge>
              )}
            </div>
            <CardTitle className="text-lg">
              Reunión {format(new Date(acta.fechaReunion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </CardTitle>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            {!acta.aprobada && (
              <Button variant="default" size="sm" onClick={() => onAprobar(acta.id)}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Aprobar
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEdit(acta)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(acta.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información de la Reunión */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Fecha:</span>
            <span className="text-muted-foreground">
              {format(new Date(acta.fechaReunion), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
          {acta.horaInicio && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Horario:</span>
              <span className="text-muted-foreground">
                {acta.horaInicio} - {acta.horaFin}
              </span>
            </div>
          )}
          {acta.lugar && (
            <div className="flex items-center gap-2 col-span-1 md:col-span-3">
              <span className="font-medium">Lugar:</span>
              <span className="text-muted-foreground">{acta.lugar}</span>
            </div>
          )}
        </div>

        {/* Asistentes */}
        {acta.asistentes && acta.asistentes.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                Asistentes ({acta.asistentes.filter(a => a.asistio).length}/{acta.asistentes.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {acta.asistentes.map((asistente, index) => (
                <Badge
                  key={index}
                  variant={asistente.asistio ? 'success' : 'secondary'}
                >
                  {asistente.usuario?.nombre || 'Usuario'}
                  {!asistente.asistio && ' (Ausente)'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Desarrollo */}
        {acta.desarrollo && (
          <div className="text-sm border-t pt-3">
            <p className="font-medium mb-1">Desarrollo:</p>
            <p className="text-muted-foreground line-clamp-3">{acta.desarrollo}</p>
          </div>
        )}

        {/* Decisiones */}
        {acta.decisiones && (
          <div className="text-sm border-t pt-3">
            <p className="font-medium mb-1">Decisiones:</p>
            <p className="text-muted-foreground line-clamp-2">{acta.decisiones}</p>
          </div>
        )}

        {/* Compromisos */}
        {acta.compromisos && (
          <div className="text-sm border-t pt-3">
            <p className="font-medium mb-1">Compromisos:</p>
            <p className="text-muted-foreground line-clamp-2">{acta.compromisos}</p>
          </div>
        )}

        {/* Próxima Reunión */}
        {acta.proximaReunion && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="font-medium">Próxima Reunión:</span>
              <span className="text-muted-foreground">
                {format(new Date(acta.proximaReunion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
          </div>
        )}

        {/* Archivo del Acta */}
        {acta.archivoActaUrl && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Button variant="link" className="h-auto p-0">
                Descargar Acta Firmada
              </Button>
            </div>
          </div>
        )}

        {/* Aprobación */}
        {acta.aprobada && acta.fechaAprobacion && (
          <div className="border-t pt-3 text-xs text-muted-foreground">
            <p>
              Aprobada el{' '}
              {format(new Date(acta.fechaAprobacion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
