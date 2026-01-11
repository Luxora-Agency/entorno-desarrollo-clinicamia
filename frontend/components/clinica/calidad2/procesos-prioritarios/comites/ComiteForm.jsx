'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';

export default function ComiteForm({ open, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'SEGURIDAD_PACIENTE',
    resolucionNumero: '',
    resolucionFecha: '',
    periodicidad: 'MENSUAL',
    diaReunion: null,
    horaReunion: '',
    estado: 'ACTIVO',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        resolucionFecha: initialData.resolucionFecha?.split('T')[0] || '',
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        tipo: 'SEGURIDAD_PACIENTE',
        resolucionNumero: '',
        resolucionFecha: '',
        periodicidad: 'MENSUAL',
        diaReunion: null,
        horaReunion: '',
        estado: 'ACTIVO',
      });
    }
  }, [initialData, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Comité' : 'Nuevo Comité'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input
                value={formData.codigo}
                onChange={(e) => handleChange('codigo', e.target.value)}
                placeholder="COM-001"
                required
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de Comité *</Label>
              <Select value={formData.tipo} onValueChange={(val) => handleChange('tipo', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEGURIDAD_PACIENTE">Seguridad del Paciente</SelectItem>
                  <SelectItem value="HISTORIA_CLINICA">Historia Clínica</SelectItem>
                  <SelectItem value="INFECCIONES">Infecciones</SelectItem>
                  <SelectItem value="ETICA_ATENCION_USUARIO">Ética y Atención al Usuario</SelectItem>
                  <SelectItem value="CALIDAD">Calidad</SelectItem>
                  <SelectItem value="VICTIMAS_VIOLENCIA_SEXUAL">Víctimas de Violencia Sexual</SelectItem>
                  <SelectItem value="AMBIENTAL">Ambiental</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label>Nombre del Comité *</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Comité de Seguridad del Paciente"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resolución Número */}
            <div className="space-y-2">
              <Label>Nº Resolución *</Label>
              <Input
                value={formData.resolucionNumero}
                onChange={(e) => handleChange('resolucionNumero', e.target.value)}
                placeholder="RES-001-2025"
                required
              />
            </div>

            {/* Resolución Fecha */}
            <div className="space-y-2">
              <Label>Fecha Resolución *</Label>
              <Input
                type="date"
                value={formData.resolucionFecha}
                onChange={(e) => handleChange('resolucionFecha', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Periodicidad */}
            <div className="space-y-2">
              <Label>Periodicidad *</Label>
              <Select value={formData.periodicidad} onValueChange={(val) => handleChange('periodicidad', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MENSUAL">Mensual</SelectItem>
                  <SelectItem value="BIMESTRAL">Bimestral</SelectItem>
                  <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Día de Reunión */}
            <div className="space-y-2">
              <Label>Día de Reunión</Label>
              <Input
                type="number"
                value={formData.diaReunion || ''}
                onChange={(e) => handleChange('diaReunion', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="15"
                min="1"
                max="31"
              />
              <p className="text-xs text-muted-foreground">Día del mes (1-31)</p>
            </div>

            {/* Hora de Reunión */}
            <div className="space-y-2">
              <Label>Hora de Reunión</Label>
              <Input
                type="time"
                value={formData.horaReunion}
                onChange={(e) => handleChange('horaReunion', e.target.value)}
              />
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label>Estado *</Label>
            <Select value={formData.estado} onValueChange={(val) => handleChange('estado', val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVO">Activo</SelectItem>
                <SelectItem value="INACTIVO">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Información */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-medium mb-1">Resolución 2003 de 2014</p>
            <p className="text-muted-foreground">
              Establece los comités obligatorios para IPS en Colombia. Después de crear el comité,
              podrá agregar miembros y gestionar actas de reunión.
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
