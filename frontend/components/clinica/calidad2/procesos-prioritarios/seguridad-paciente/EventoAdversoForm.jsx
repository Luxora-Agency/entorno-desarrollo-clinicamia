'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCalidad2EventosAdversos } from '@/hooks/useCalidad2EventosAdversos';

export default function EventoAdversoForm({ evento, open, onClose, onSuccess }) {
  const { createEvento, updateEvento } = useCalidad2EventosAdversos();
  const isEditing = Boolean(evento?.id);

  const [formData, setFormData] = useState({
    fechaEvento: '',
    horaEvento: '',
    lugarEvento: '',
    nombrePaciente: '',
    tipoEvento: '',
    clasificacion: '',
    severidad: '',
    evitable: null,
    descripcion: '',
    circunstancias: '',
    factoresContribuyentes: '',
    reportadoA: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (evento) {
      setFormData({
        fechaEvento: evento.fechaEvento ? new Date(evento.fechaEvento).toISOString().split('T')[0] : '',
        horaEvento: evento.horaEvento || '',
        lugarEvento: evento.lugarEvento || '',
        nombrePaciente: evento.nombrePaciente || '',
        tipoEvento: evento.tipoEvento || '',
        clasificacion: evento.clasificacion || '',
        severidad: evento.severidad || '',
        evitable: evento.evitable,
        descripcion: evento.descripcion || '',
        circunstancias: evento.circunstancias || '',
        factoresContribuyentes: evento.factoresContribuyentes || '',
        reportadoA: evento.reportadoA || '',
      });
    } else {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, fechaEvento: today }));
    }
  }, [evento]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      if (isEditing) {
        await updateEvento(evento.id, formData);
      } else {
        await createEvento(formData);
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error guardando evento adverso:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento Adverso' : 'Reportar Evento Adverso'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza la información del evento adverso'
              : 'Registra un nuevo evento adverso o incidente de seguridad del paciente'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Información del Evento</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaEvento">
                  Fecha del Evento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fechaEvento"
                  type="date"
                  value={formData.fechaEvento}
                  onChange={(e) => handleChange('fechaEvento', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horaEvento">Hora del Evento</Label>
                <Input
                  id="horaEvento"
                  type="time"
                  value={formData.horaEvento}
                  onChange={(e) => handleChange('horaEvento', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lugarEvento">
                  Lugar del Evento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lugarEvento"
                  value={formData.lugarEvento}
                  onChange={(e) => handleChange('lugarEvento', e.target.value)}
                  required
                  placeholder="Ej: Quirófano 2, Habitación 301..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombrePaciente">Nombre del Paciente (opcional)</Label>
              <Input
                id="nombrePaciente"
                value={formData.nombrePaciente}
                onChange={(e) => handleChange('nombrePaciente', e.target.value)}
                placeholder="Puede dejarse en blanco para proteger la identidad"
              />
              <p className="text-xs text-muted-foreground">
                Por confidencialidad, el nombre puede omitirse
              </p>
            </div>
          </div>

          {/* Clasificación */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Clasificación del Evento</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoEvento">
                  Tipo de Evento <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.tipoEvento} onValueChange={(value) => handleChange('tipoEvento', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAIDA">Caída</SelectItem>
                    <SelectItem value="RAM">Reacción Adversa a Medicamento</SelectItem>
                    <SelectItem value="IAAS">Infección Asociada a Atención en Salud</SelectItem>
                    <SelectItem value="QUIRURGICO">Evento Quirúrgico</SelectItem>
                    <SelectItem value="DIAGNOSTICO">Error Diagnóstico</SelectItem>
                    <SelectItem value="IDENTIFICACION">Error de Identificación</SelectItem>
                    <SelectItem value="COMUNICACION">Falla de Comunicación</SelectItem>
                    <SelectItem value="EQUIPOS">Falla de Equipos</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clasificacion">
                  Clasificación <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.clasificacion} onValueChange={(value) => handleChange('clasificacion', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la clasificación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCIDENTE">Incidente (sin daño)</SelectItem>
                    <SelectItem value="EVENTO_ADVERSO">Evento Adverso (con daño)</SelectItem>
                    <SelectItem value="CENTINELA">Evento Centinela (grave/mortal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severidad">
                  Severidad <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.severidad} onValueChange={(value) => handleChange('severidad', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la severidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEVE">Leve</SelectItem>
                    <SelectItem value="MODERADA">Moderada</SelectItem>
                    <SelectItem value="GRAVE">Grave</SelectItem>
                    <SelectItem value="MORTAL">Mortal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>¿Es Evitable?</Label>
                <div className="flex items-center space-x-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="evitable-si"
                      checked={formData.evitable === true}
                      onCheckedChange={(checked) => handleChange('evitable', checked ? true : null)}
                    />
                    <label
                      htmlFor="evitable-si"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Sí
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="evitable-no"
                      checked={formData.evitable === false}
                      onCheckedChange={(checked) => handleChange('evitable', checked ? false : null)}
                    />
                    <label
                      htmlFor="evitable-no"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción del Evento */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Descripción del Evento</h3>

            <div className="space-y-2">
              <Label htmlFor="descripcion">
                Descripción Detallada <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                required
                placeholder="Describe qué sucedió, cuándo, dónde y cómo..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="circunstancias">Circunstancias</Label>
              <Textarea
                id="circunstancias"
                value={formData.circunstancias}
                onChange={(e) => handleChange('circunstancias', e.target.value)}
                placeholder="Describe las circunstancias en las que ocurrió el evento..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="factoresContribuyentes">Factores Contribuyentes</Label>
              <Textarea
                id="factoresContribuyentes"
                value={formData.factoresContribuyentes}
                onChange={(e) => handleChange('factoresContribuyentes', e.target.value)}
                placeholder="Identifica los factores que contribuyeron al evento..."
                rows={3}
              />
            </div>
          </div>

          {/* Reporte Externo */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Reporte Externo</h3>

            <div className="space-y-2">
              <Label htmlFor="reportadoA">¿Se reportó a alguna entidad externa?</Label>
              <Select value={formData.reportadoA || 'NO_REPORTADO'} onValueChange={(value) => handleChange('reportadoA', value === 'NO_REPORTADO' ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="No reportado externamente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_REPORTADO">No reportado</SelectItem>
                  <SelectItem value="DIRECTIVO">Directivos</SelectItem>
                  <SelectItem value="SECRETARIA_SALUD">Secretaría de Salud</SelectItem>
                  <SelectItem value="SUPER_SALUD">Supersalud</SelectItem>
                  <SelectItem value="INVIMA">INVIMA</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los eventos centinela y graves deben reportarse a la autoridad sanitaria
              </p>
            </div>
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
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Reportar Evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
