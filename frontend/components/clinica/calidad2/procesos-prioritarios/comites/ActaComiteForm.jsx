'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, X } from 'lucide-react';

export default function ActaComiteForm({ open, onClose, onSubmit, initialData, comiteId }) {
  const [formData, setFormData] = useState({
    comiteId: comiteId || '',
    numeroActa: '',
    fechaReunion: '',
    horaInicio: '',
    horaFin: '',
    lugar: '',
    desarrollo: '',
    decisiones: '',
    compromisos: '',
    proximaReunion: '',
    quorum: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        fechaReunion: initialData.fechaReunion?.split('T')[0] || '',
        proximaReunion: initialData.proximaReunion?.split('T')[0] || '',
      });
    } else {
      setFormData({
        comiteId: comiteId || '',
        numeroActa: '',
        fechaReunion: '',
        horaInicio: '',
        horaFin: '',
        lugar: '',
        desarrollo: '',
        decisiones: '',
        compromisos: '',
        proximaReunion: '',
        quorum: false,
      });
    }
  }, [initialData, comiteId, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Acta de Comité' : 'Nueva Acta de Comité'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Número de Acta */}
            <div className="space-y-2">
              <Label>Número de Acta *</Label>
              <Input
                value={formData.numeroActa}
                onChange={(e) => handleChange('numeroActa', e.target.value)}
                placeholder="001-2025"
                required
              />
            </div>

            {/* Fecha de Reunión */}
            <div className="space-y-2">
              <Label>Fecha de Reunión *</Label>
              <Input
                type="date"
                value={formData.fechaReunion}
                onChange={(e) => handleChange('fechaReunion', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hora Inicio */}
            <div className="space-y-2">
              <Label>Hora de Inicio</Label>
              <Input
                type="time"
                value={formData.horaInicio}
                onChange={(e) => handleChange('horaInicio', e.target.value)}
              />
            </div>

            {/* Hora Fin */}
            <div className="space-y-2">
              <Label>Hora de Fin</Label>
              <Input
                type="time"
                value={formData.horaFin}
                onChange={(e) => handleChange('horaFin', e.target.value)}
              />
            </div>

            {/* Lugar */}
            <div className="space-y-2">
              <Label>Lugar</Label>
              <Input
                value={formData.lugar}
                onChange={(e) => handleChange('lugar', e.target.value)}
                placeholder="Sala de Juntas"
              />
            </div>
          </div>

          {/* Desarrollo */}
          <div className="space-y-2">
            <Label>Desarrollo de la Reunión *</Label>
            <Textarea
              value={formData.desarrollo}
              onChange={(e) => handleChange('desarrollo', e.target.value)}
              placeholder="Descripción detallada de los temas tratados..."
              rows={4}
              required
            />
          </div>

          {/* Decisiones */}
          <div className="space-y-2">
            <Label>Decisiones Tomadas</Label>
            <Textarea
              value={formData.decisiones}
              onChange={(e) => handleChange('decisiones', e.target.value)}
              placeholder="Decisiones tomadas durante la reunión..."
              rows={3}
            />
          </div>

          {/* Compromisos */}
          <div className="space-y-2">
            <Label>Compromisos</Label>
            <Textarea
              value={formData.compromisos}
              onChange={(e) => handleChange('compromisos', e.target.value)}
              placeholder="Compromisos adquiridos y responsables..."
              rows={3}
            />
          </div>

          {/* Próxima Reunión */}
          <div className="space-y-2">
            <Label>Fecha de Próxima Reunión</Label>
            <Input
              type="date"
              value={formData.proximaReunion}
              onChange={(e) => handleChange('proximaReunion', e.target.value)}
            />
          </div>

          {/* Quórum */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="quorum"
              checked={formData.quorum}
              onCheckedChange={(checked) => handleChange('quorum', checked)}
            />
            <Label htmlFor="quorum" className="cursor-pointer">
              Se alcanzó el quórum necesario
            </Label>
          </div>

          {/* Información */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-medium mb-1">Importante:</p>
            <p className="text-muted-foreground">
              Después de crear el acta, podrá registrar la asistencia de los miembros del comité
              y adjuntar el documento firmado.
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {initialData ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
