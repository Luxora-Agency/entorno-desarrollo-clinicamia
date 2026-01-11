'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  MapPin,
} from 'lucide-react';
import { useCalidad2AlertasPP } from '@/hooks/useCalidad2AlertasPP';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AlertaPPCard({ alerta, onUpdate, getPriorityColor, getPriorityIcon }) {
  const { atenderAlerta } = useCalidad2AlertasPP();
  const [showAtenderDialog, setShowAtenderDialog] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const PriorityIcon = getPriorityIcon(alerta.prioridad);

  const handleAtender = async () => {
    try {
      setSubmitting(true);
      await atenderAlerta(alerta.id, observaciones);
      setShowAtenderDialog(false);
      setObservaciones('');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error atendiendo alerta:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      EVENTO_ADVERSO_PENDIENTE: 'Evento Adverso Pendiente',
      GPC_REVISION: 'GPC Requiere Revisión',
      PQRSF_VENCIDA: 'PQRSF Vencida',
      ACTA_PENDIENTE: 'Acta Pendiente',
      PROTOCOLO_REVISION: 'Protocolo a Revisar',
      ENCUESTA_BAJA_SATISFACCION: 'Baja Satisfacción',
    };
    return labels[tipo] || tipo;
  };

  const getSubmoduloLabel = (submodulo) => {
    const labels = {
      SEGURIDAD: 'Seguridad del Paciente',
      GPC: 'Guías de Práctica Clínica',
      COMITES: 'Comités',
      SIAU: 'SIAU',
      PROTOCOLOS: 'Protocolos',
      INDICADORES: 'Indicadores',
    };
    return labels[submodulo] || submodulo;
  };

  return (
    <>
      <Card className={alerta.atendida ? 'border-green-200 bg-green-50/50' : 'border-l-4 border-l-orange-500'}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getPriorityColor(alerta.prioridad)} className="flex items-center gap-1">
                  <PriorityIcon className="h-3 w-3" />
                  {alerta.prioridad}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getTipoLabel(alerta.tipo)}
                </Badge>
                {alerta.submodulo && (
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {getSubmoduloLabel(alerta.submodulo)}
                  </Badge>
                )}
                {alerta.atendida && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Atendida
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{alerta.titulo}</CardTitle>
              <CardDescription className="text-sm">
                {alerta.descripcion}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(alerta.fechaAlerta), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
              </span>
            </div>
            {alerta.entityType && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>
                  {alerta.entityType}
                </span>
              </div>
            )}
          </div>

          {alerta.atendida && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-green-600" />
                <span className="font-medium">Atendida por:</span>
                <span className="text-muted-foreground">{alerta.atendidoPor || 'Usuario'}</span>
              </div>
              {alerta.fechaAtencion && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(alerta.fechaAtencion), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  </span>
                </div>
              )}
              {alerta.observacionesAtencion && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Observaciones:</p>
                  <p className="text-muted-foreground bg-white p-2 rounded border">
                    {alerta.observacionesAtencion}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {!alerta.atendida && (
          <CardFooter className="pt-0">
            <Button
              onClick={() => setShowAtenderDialog(true)}
              size="sm"
              className="ml-auto"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Atender Alerta
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Atender Alerta Dialog */}
      <Dialog open={showAtenderDialog} onOpenChange={setShowAtenderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atender Alerta</DialogTitle>
            <DialogDescription>
              Registra las acciones tomadas o comentarios sobre esta alerta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{alerta.titulo}</p>
              <p className="text-sm text-muted-foreground">{alerta.descripcion}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Observaciones <span className="text-muted-foreground">(opcional)</span>
              </label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Describe las acciones tomadas o comentarios sobre esta alerta..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAtenderDialog(false);
                setObservaciones('');
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleAtender} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Marcar como Atendida'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
