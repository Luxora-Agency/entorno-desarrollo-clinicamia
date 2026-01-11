'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  FileText,
  Edit,
  Trash2,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import ResponderPQRSFModal from './ResponderPQRSFModal';

export default function PQRSFCard({ pqrsf, onUpdate, onEdit, onDelete }) {
  const [showResponderModal, setShowResponderModal] = useState(false);

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

  const getEstadoColor = (estado) => {
    const colors = {
      RADICADA: 'default',
      EN_GESTION: 'yellow',
      RESPONDIDA: 'blue',
      CERRADA: 'green',
    };
    return colors[estado] || 'default';
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      RADICADA: Clock,
      EN_GESTION: AlertCircle,
      RESPONDIDA: MessageSquare,
      CERRADA: CheckCircle2,
    };
    return icons[estado] || Clock;
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      ALTA: 'destructive',
      MEDIA: 'orange',
      BAJA: 'default',
    };
    return colors[prioridad] || 'default';
  };

  const getDiasRestantes = () => {
    if (!pqrsf.fechaRespuestaEsperada) return null;
    const dias = differenceInDays(new Date(pqrsf.fechaRespuestaEsperada), new Date());
    return dias;
  };

  const diasRestantes = getDiasRestantes();
  const estaVencida = diasRestantes !== null && diasRestantes < 0;
  const estaPorVencer = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 3;

  const EstadoIcon = getEstadoIcon(pqrsf.estado);

  return (
    <>
      <Card className={`${estaVencida ? 'border-red-500 border-l-4' : estaPorVencer ? 'border-orange-500 border-l-4' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getTipoColor(pqrsf.tipo)}>
                  {pqrsf.tipo}
                </Badge>
                <Badge variant={getEstadoColor(pqrsf.estado)} className="flex items-center gap-1">
                  <EstadoIcon className="h-3 w-3" />
                  {pqrsf.estado}
                </Badge>
                {pqrsf.prioridad && (
                  <Badge variant={getPrioridadColor(pqrsf.prioridad)}>
                    {pqrsf.prioridad}
                  </Badge>
                )}
                {pqrsf.canalRecepcion && (
                  <Badge variant="outline" className="text-xs">
                    {pqrsf.canalRecepcion}
                  </Badge>
                )}
                {estaVencida && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    VENCIDA ({Math.abs(diasRestantes)} días)
                  </Badge>
                )}
                {estaPorVencer && (
                  <Badge variant="orange" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Por vencer ({diasRestantes} días)
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {pqrsf.codigo}
                </code>
                <CardTitle className="text-lg">{pqrsf.asunto}</CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Descripción */}
          <div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {pqrsf.descripcion}
            </p>
          </div>

          {/* Información del peticionario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{pqrsf.nombrePeticionario}</span>
            </div>
            {pqrsf.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{pqrsf.email}</span>
              </div>
            )}
            {pqrsf.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{pqrsf.telefono}</span>
              </div>
            )}
            {pqrsf.area && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{pqrsf.area}</span>
              </div>
            )}
          </div>

          {/* Fechas importantes */}
          <div className="border-t pt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">Radicada:</span>
              <span className="text-muted-foreground">
                {format(new Date(pqrsf.fechaRadicacion), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
            {pqrsf.fechaRespuestaEsperada && (
              <div className="flex items-center gap-2">
                <Clock className={`h-3 w-3 ${estaVencida ? 'text-red-600' : estaPorVencer ? 'text-orange-600' : 'text-muted-foreground'}`} />
                <span className="font-medium">Vence:</span>
                <span className={estaVencida ? 'text-red-600 font-medium' : estaPorVencer ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                  {format(new Date(pqrsf.fechaRespuestaEsperada), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
            )}
            {pqrsf.fechaRespuesta && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="font-medium">Respondida:</span>
                <span className="text-muted-foreground">
                  {format(new Date(pqrsf.fechaRespuesta), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
            )}
          </div>

          {/* Respuesta */}
          {pqrsf.respuesta && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Respuesta:</span>
              </div>
              <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
                {pqrsf.respuesta}
              </p>
              {pqrsf.responsableGestion && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Respondida por: {pqrsf.responsableGestion}</span>
                </div>
              )}
            </div>
          )}

          {/* Seguimiento */}
          {pqrsf.resultadoSeguimiento && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Seguimiento:</span>
              </div>
              <p className="text-sm text-muted-foreground bg-purple-50 p-3 rounded border border-purple-200">
                {pqrsf.resultadoSeguimiento}
              </p>
              {pqrsf.satisfaccionRespuesta && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Satisfacción:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${star <= pqrsf.satisfaccionRespuesta ? 'text-yellow-500' : 'text-gray-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between pt-0">
          <div className="flex gap-2">
            {pqrsf.estado !== 'CERRADA' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResponderModal(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {pqrsf.estado === 'RADICADA' ? 'Responder' : 'Actualizar Respuesta'}
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(pqrsf)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
          {onDelete && pqrsf.estado === 'RADICADA' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(pqrsf.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Responder Modal */}
      {showResponderModal && (
        <ResponderPQRSFModal
          pqrsf={pqrsf}
          open={showResponderModal}
          onClose={() => setShowResponderModal(false)}
          onSuccess={() => {
            setShowResponderModal(false);
            if (onUpdate) {
              onUpdate();
            }
          }}
        />
      )}
    </>
  );
}
