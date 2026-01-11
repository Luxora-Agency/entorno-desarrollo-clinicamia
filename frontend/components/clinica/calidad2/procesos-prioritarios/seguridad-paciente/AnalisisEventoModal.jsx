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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCalidad2EventosAdversos } from '@/hooks/useCalidad2EventosAdversos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AnalisisEventoModal({ evento, open, onClose, onSuccess }) {
  const { analizarEvento } = useCalidad2EventosAdversos();

  const [formData, setFormData] = useState({
    metodoAnalisis: 'PROTOCOLO_LONDRES',
    resultadoAnalisis: '',
    accionesInmediatas: '',
    accionesPreventivas: '',
    responsableAcciones: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.resultadoAnalisis.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await analizarEvento(evento.id, formData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error registrando análisis:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getSeveridadColor = (severidad) => {
    const colors = {
      LEVE: 'blue',
      MODERADA: 'yellow',
      GRAVE: 'orange',
      MORTAL: 'destructive',
    };
    return colors[severidad] || 'default';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Análisis de Evento Adverso - Protocolo de Londres</DialogTitle>
          <DialogDescription>
            Realiza un análisis sistemático de las causas del evento adverso
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Evento */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                {evento.codigo}
              </code>
              <Badge variant={getSeveridadColor(evento.severidad)}>
                {evento.severidad}
              </Badge>
              <Badge variant="outline">{evento.tipoEvento}</Badge>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Fecha del evento:</span>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(evento.fechaEvento), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  {evento.horaEvento && ` a las ${evento.horaEvento}`}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium">Descripción:</span>
                <p className="text-sm text-muted-foreground">{evento.descripcion}</p>
              </div>

              {evento.circunstancias && (
                <div>
                  <span className="text-sm font-medium">Circunstancias:</span>
                  <p className="text-sm text-muted-foreground">{evento.circunstancias}</p>
                </div>
              )}

              {evento.factoresContribuyentes && (
                <div>
                  <span className="text-sm font-medium">Factores contribuyentes:</span>
                  <p className="text-sm text-muted-foreground">{evento.factoresContribuyentes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Método de Análisis */}
          <div className="space-y-2">
            <Label htmlFor="metodoAnalisis">
              Método de Análisis <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.metodoAnalisis}
              onValueChange={(value) => setFormData({ ...formData, metodoAnalisis: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROTOCOLO_LONDRES">Protocolo de Londres</SelectItem>
                <SelectItem value="ANALISIS_CAUSA_RAIZ">Análisis de Causa Raíz (RCA)</SelectItem>
                <SelectItem value="ISHIKAWA">Diagrama de Ishikawa</SelectItem>
                <SelectItem value="CINCO_PORQUES">5 Por Qués</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Guía del Protocolo de Londres */}
          {formData.metodoAnalisis === 'PROTOCOLO_LONDRES' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <p className="text-sm font-medium text-blue-900">Protocolo de Londres - Factores a Considerar:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-800">
                <div>
                  <p className="font-medium">1. Factores del Paciente:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Condición clínica</li>
                    <li>Factores sociales/psicológicos</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">2. Factores Individuales (Personal):</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Conocimientos y habilidades</li>
                    <li>Fatiga/estrés</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">3. Factores del Equipo:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Comunicación</li>
                    <li>Supervisión</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">4. Factores del Entorno de Trabajo:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Diseño/mantenimiento equipos</li>
                    <li>Carga de trabajo</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">5. Factores Organizacionales:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Políticas y protocolos</li>
                    <li>Cultura de seguridad</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">6. Factores del Contexto Institucional:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Recursos económicos</li>
                    <li>Normatividad externa</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Resultado del Análisis */}
          <div className="space-y-2">
            <Label htmlFor="resultadoAnalisis">
              Resultado del Análisis <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="resultadoAnalisis"
              value={formData.resultadoAnalisis}
              onChange={(e) => setFormData({ ...formData, resultadoAnalisis: e.target.value })}
              placeholder="Describe las causas raíz identificadas y el análisis detallado del evento..."
              rows={8}
              required
            />
            <p className="text-xs text-muted-foreground">
              Identifica las causas subyacentes, no solo los síntomas. Considera todos los factores contribuyentes.
            </p>
          </div>

          {/* Acciones Inmediatas */}
          <div className="space-y-2">
            <Label htmlFor="accionesInmediatas">
              Acciones Inmediatas Tomadas <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="accionesInmediatas"
              value={formData.accionesInmediatas}
              onChange={(e) => setFormData({ ...formData, accionesInmediatas: e.target.value })}
              placeholder="Describe las acciones inmediatas implementadas para prevenir recurrencia inmediata..."
              rows={4}
              required
            />
          </div>

          {/* Acciones Preventivas */}
          <div className="space-y-2">
            <Label htmlFor="accionesPreventivas">
              Acciones Preventivas Recomendadas <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="accionesPreventivas"
              value={formData.accionesPreventivas}
              onChange={(e) => setFormData({ ...formData, accionesPreventivas: e.target.value })}
              placeholder="Lista las acciones preventivas a largo plazo para evitar eventos similares..."
              rows={4}
              required
            />
          </div>

          {/* Responsable */}
          <div className="space-y-2">
            <Label htmlFor="responsableAcciones">
              Responsable de Implementar Acciones
            </Label>
            <Textarea
              id="responsableAcciones"
              value={formData.responsableAcciones}
              onChange={(e) => setFormData({ ...formData, responsableAcciones: e.target.value })}
              placeholder="Nombres y cargos de los responsables de implementar las acciones..."
              rows={2}
            />
          </div>

          {/* Información adicional */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
            <p className="text-sm font-medium text-orange-900">Información importante:</p>
            <ul className="text-xs text-orange-800 space-y-1 list-disc list-inside">
              <li>El análisis debe ser sistemático y objetivo, sin buscar culpables</li>
              <li>Enfócate en identificar fallas del sistema, no errores individuales</li>
              <li>Las acciones preventivas deben ser específicas, medibles y con responsables asignados</li>
              <li>Este análisis cambiará el estado del evento a "EN_ANALISIS"</li>
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
            <Button
              type="submit"
              disabled={submitting || !formData.resultadoAnalisis.trim() || !formData.accionesInmediatas.trim() || !formData.accionesPreventivas.trim()}
            >
              {submitting ? 'Guardando...' : 'Guardar Análisis'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
