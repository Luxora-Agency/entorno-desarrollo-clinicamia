'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  FileText,
  Download,
  Edit,
  Trash2,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProtocoloCard({ protocolo, onEdit, onDelete }) {
  const getTipoColor = (tipo) => {
    const colors = {
      PROTOCOLO: 'blue',
      MANUAL: 'purple',
      POLITICA: 'green',
      PROGRAMA: 'orange',
      FORMATO: 'cyan',
    };
    return colors[tipo] || 'default';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      VIGENTE: 'green',
      EN_REVISION: 'yellow',
      OBSOLETO: 'destructive',
    };
    return colors[estado] || 'default';
  };

  return (
    <Card className={protocolo.esObsoleto ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {protocolo.codigo}
              </code>
              <Badge variant={getTipoColor(protocolo.tipo)}>
                {protocolo.tipo}
              </Badge>
              <Badge variant={getEstadoColor(protocolo.estado)}>
                {protocolo.estado}
              </Badge>
              {protocolo.categoria && (
                <Badge variant="outline">{protocolo.categoria}</Badge>
              )}
              {protocolo.esObsoleto && (
                <Badge variant="destructive">Obsoleto</Badge>
              )}
            </div>
            <CardTitle className="text-lg">{protocolo.nombre}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Versión {protocolo.version || '1.0'}
            </p>
          </div>

          {/* Acciones */}
          {!protocolo.esObsoleto && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(protocolo)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(protocolo.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Emisión:</span>
            <span className="text-muted-foreground">
              {format(new Date(protocolo.fechaEmision), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Vigencia:</span>
            <span className="text-muted-foreground">
              {format(new Date(protocolo.fechaVigencia), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
          {protocolo.proximaRevision && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Próxima Revisión:</span>
              <span className="text-muted-foreground">
                {format(new Date(protocolo.proximaRevision), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Descripción */}
        {protocolo.descripcion && (
          <div className="text-sm">
            <p className="font-medium mb-1">Descripción:</p>
            <p className="text-muted-foreground line-clamp-2">{protocolo.descripcion}</p>
          </div>
        )}

        {/* Alcance */}
        {protocolo.alcance && (
          <div className="text-sm">
            <p className="font-medium mb-1">Alcance:</p>
            <p className="text-muted-foreground line-clamp-2">{protocolo.alcance}</p>
          </div>
        )}

        {/* Documentos */}
        {protocolo.documentos && protocolo.documentos.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                Documentos ({protocolo.documentos.length})
              </span>
            </div>
            <div className="space-y-1">
              {protocolo.documentos.slice(0, 3).map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                >
                  <span className="flex items-center gap-2">
                    {doc.esPrincipal && (
                      <FileCheck className="h-3 w-3 text-blue-600" />
                    )}
                    {doc.nombre}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {protocolo.documentos.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{protocolo.documentos.length - 3} documentos más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Aprobación */}
        {protocolo.aprobadoPor && (
          <div className="border-t pt-3 text-xs text-muted-foreground">
            <p>
              Aprobado el{' '}
              {format(new Date(protocolo.fechaAprobacion), "dd 'de' MMMM 'de' yyyy", {
                locale: es,
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
