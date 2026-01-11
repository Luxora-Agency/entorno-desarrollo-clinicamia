'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, FileText, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ComiteCard({ comite, onEdit, onDelete, onAddActa }) {
  const getTipoColor = (tipo) => {
    const colors = {
      SEGURIDAD_PACIENTE: 'red',
      HISTORIA_CLINICA: 'blue',
      INFECCIONES: 'orange',
      ETICA_ATENCION_USUARIO: 'purple',
      CALIDAD: 'green',
      VICTIMAS_VIOLENCIA_SEXUAL: 'pink',
      AMBIENTAL: 'cyan',
    };
    return colors[tipo] || 'default';
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      SEGURIDAD_PACIENTE: 'Seguridad del Paciente',
      HISTORIA_CLINICA: 'Historia Clínica',
      INFECCIONES: 'Infecciones',
      ETICA_ATENCION_USUARIO: 'Ética y Atención al Usuario',
      CALIDAD: 'Calidad',
      VICTIMAS_VIOLENCIA_SEXUAL: 'Víctimas de Violencia Sexual',
      AMBIENTAL: 'Ambiental',
    };
    return labels[tipo] || tipo;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {comite.codigo}
              </code>
              <Badge variant={getTipoColor(comite.tipo)}>
                {getTipoLabel(comite.tipo)}
              </Badge>
              <Badge variant={comite.estado === 'ACTIVO' ? 'success' : 'secondary'}>
                {comite.estado}
              </Badge>
            </div>
            <CardTitle className="text-lg">{comite.nombre}</CardTitle>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onAddActa(comite)}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(comite)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(comite.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resolución */}
        <div className="text-sm">
          <p className="font-medium mb-1">Resolución de Conformación:</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Nº {comite.resolucionNumero}</span>
            <span>•</span>
            <span>{format(new Date(comite.resolucionFecha), 'dd/MM/yyyy', { locale: es })}</span>
          </div>
        </div>

        {/* Periodicidad */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Periodicidad:</span>
            <span className="text-muted-foreground">{comite.periodicidad}</span>
          </div>
          {comite.diaReunion && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Día:</span>
              <span className="text-muted-foreground">{comite.diaReunion}</span>
            </div>
          )}
        </div>

        {/* Miembros */}
        {comite.miembros && comite.miembros.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                Miembros ({comite.miembros.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {comite.miembros.slice(0, 5).map((miembro, index) => (
                <Badge key={index} variant="outline">
                  {miembro.cargo}: {miembro.usuario?.nombre || 'Usuario'}
                </Badge>
              ))}
              {comite.miembros.length > 5 && (
                <Badge variant="secondary">
                  +{comite.miembros.length - 5} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actas recientes */}
        {comite.actas && comite.actas.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                Actas Recientes ({comite.actas.length})
              </span>
            </div>
            <div className="space-y-1">
              {comite.actas.slice(0, 3).map((acta, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{acta.numeroActa}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(acta.fechaReunion), 'dd/MM/yyyy', { locale: es })}
                    </span>
                    {acta.aprobada && (
                      <Badge variant="success" className="text-xs">Aprobada</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
