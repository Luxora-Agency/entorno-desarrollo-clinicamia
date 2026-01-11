'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCalidad2PQRSF } from '@/hooks/useCalidad2PQRSF';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ResponderPQRSFModal({ pqrsf, open, onClose, onSuccess }) {
  const { responderPQRSF } = useCalidad2PQRSF();
  const [formData, setFormData] = useState({
    respuesta: pqrsf.respuesta || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.respuesta.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await responderPQRSF(pqrsf.id, formData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error respondiendo PQRSF:', error);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Responder PQRSF</DialogTitle>
          <DialogDescription>
            Proporciona una respuesta detallada y clara al peticionario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la PQRSF */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                {pqrsf.codigo}
              </code>
              <Badge variant={getTipoColor(pqrsf.tipo)}>
                {pqrsf.tipo}
              </Badge>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Asunto:</span>
                <p className="text-sm text-muted-foreground">{pqrsf.asunto}</p>
              </div>

              <div>
                <span className="text-sm font-medium">Descripción:</span>
                <p className="text-sm text-muted-foreground">{pqrsf.descripcion}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Peticionario:</span>
                  <p className="text-muted-foreground">{pqrsf.nombrePeticionario}</p>
                </div>
                {pqrsf.email && (
                  <div>
                    <span className="font-medium">Email:</span>
                    <p className="text-muted-foreground">{pqrsf.email}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Radicada:</span>
                  <p className="text-muted-foreground">
                    {format(new Date(pqrsf.fechaRadicacion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
                {pqrsf.fechaRespuestaEsperada && (
                  <div>
                    <span className="font-medium">Fecha límite:</span>
                    <p className="text-muted-foreground">
                      {format(new Date(pqrsf.fechaRespuestaEsperada), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formulario de respuesta */}
          <div className="space-y-2">
            <Label htmlFor="respuesta">
              Respuesta <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="respuesta"
              value={formData.respuesta}
              onChange={(e) => setFormData({ ...formData, respuesta: e.target.value })}
              placeholder="Escribe una respuesta clara y detallada..."
              rows={8}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              La respuesta será enviada al peticionario y quedará registrada en el sistema.
            </p>
          </div>

          {/* Información adicional */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <p className="text-sm font-medium text-blue-900">Información importante:</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>La respuesta debe ser clara, completa y respetuosa</li>
              <li>Según la normativa colombiana (Circular 030/2017), las PQRSF deben responderse en un máximo de 15 días hábiles</li>
              <li>Esta acción cambiará el estado de la PQRSF a "RESPONDIDA"</li>
              <li>Se registrará la fecha y hora de la respuesta automáticamente</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !formData.respuesta.trim()}>
              {submitting ? 'Enviando...' : 'Enviar Respuesta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
