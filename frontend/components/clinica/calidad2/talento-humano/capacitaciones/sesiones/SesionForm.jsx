'use client';

import { useState, useEffect } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function SesionForm({ open, onClose, onSubmit, sesion }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fechaProgramada: '',
    horaInicio: '',
    horaFin: '',
    lugar: '',
    convocados: '',
    observaciones: '',
  });

  useEffect(() => {
    if (sesion) {
      setFormData({
        fechaProgramada: sesion.fechaProgramada ? formatDateISO(new Date(sesion.fechaProgramada)) : '',
        horaInicio: sesion.horaInicio || '',
        horaFin: sesion.horaFin || '',
        lugar: sesion.lugar || '',
        convocados: sesion.convocados?.toString() || '',
        observaciones: sesion.observaciones || '',
      });
    } else {
      setFormData({
        fechaProgramada: '',
        horaInicio: '08:00',
        horaFin: '10:00',
        lugar: '',
        convocados: '',
        observaciones: '',
      });
    }
  }, [sesion]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        convocados: formData.convocados ? parseInt(formData.convocados) : 0,
      };
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{sesion ? 'Editar Sesión' : 'Nueva Sesión'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fechaProgramada">Fecha *</Label>
            <Input
              id="fechaProgramada"
              type="date"
              value={formData.fechaProgramada}
              onChange={(e) => handleChange('fechaProgramada', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora Inicio</Label>
              <Input
                id="horaInicio"
                type="time"
                value={formData.horaInicio}
                onChange={(e) => handleChange('horaInicio', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFin">Hora Fin</Label>
              <Input
                id="horaFin"
                type="time"
                value={formData.horaFin}
                onChange={(e) => handleChange('horaFin', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lugar">Lugar</Label>
            <Input
              id="lugar"
              value={formData.lugar}
              onChange={(e) => handleChange('lugar', e.target.value)}
              placeholder="Ej: Sala de reuniones, Auditorio..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="convocados">Convocados</Label>
            <Input
              id="convocados"
              type="number"
              value={formData.convocados}
              onChange={(e) => handleChange('convocados', e.target.value)}
              placeholder="Número de personas convocadas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.fechaProgramada}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {sesion ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
