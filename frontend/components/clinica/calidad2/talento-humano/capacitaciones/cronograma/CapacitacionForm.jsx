'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const MESES = [
  { key: 'programadoEne', label: 'Enero' },
  { key: 'programadoFeb', label: 'Febrero' },
  { key: 'programadoMar', label: 'Marzo' },
  { key: 'programadoAbr', label: 'Abril' },
  { key: 'programadoMay', label: 'Mayo' },
  { key: 'programadoJun', label: 'Junio' },
  { key: 'programadoJul', label: 'Julio' },
  { key: 'programadoAgo', label: 'Agosto' },
  { key: 'programadoSep', label: 'Septiembre' },
  { key: 'programadoOct', label: 'Octubre' },
  { key: 'programadoNov', label: 'Noviembre' },
  { key: 'programadoDic', label: 'Diciembre' },
];

const PERIODICIDADES = [
  { value: 'UNICA', label: 'Única' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
];

export default function CapacitacionForm({ open, onClose, onSubmit, capacitacion, categorias, anio }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoriaId: '',
    tema: '',
    actividad: '',
    orientadoA: '',
    responsableId: '',
    duracionMinutos: '',
    periodicidad: 'UNICA',
    programadoEne: false,
    programadoFeb: false,
    programadoMar: false,
    programadoAbr: false,
    programadoMay: false,
    programadoJun: false,
    programadoJul: false,
    programadoAgo: false,
    programadoSep: false,
    programadoOct: false,
    programadoNov: false,
    programadoDic: false,
  });

  useEffect(() => {
    if (capacitacion) {
      setFormData({
        categoriaId: capacitacion.categoriaId || capacitacion.categoria?.id || '',
        tema: capacitacion.tema || '',
        actividad: capacitacion.actividad || '',
        orientadoA: capacitacion.orientadoA || '',
        responsableId: capacitacion.responsableId || '',
        duracionMinutos: capacitacion.duracionMinutos?.toString() || '',
        periodicidad: capacitacion.periodicidad || 'UNICA',
        programadoEne: capacitacion.programadoEne || false,
        programadoFeb: capacitacion.programadoFeb || false,
        programadoMar: capacitacion.programadoMar || false,
        programadoAbr: capacitacion.programadoAbr || false,
        programadoMay: capacitacion.programadoMay || false,
        programadoJun: capacitacion.programadoJun || false,
        programadoJul: capacitacion.programadoJul || false,
        programadoAgo: capacitacion.programadoAgo || false,
        programadoSep: capacitacion.programadoSep || false,
        programadoOct: capacitacion.programadoOct || false,
        programadoNov: capacitacion.programadoNov || false,
        programadoDic: capacitacion.programadoDic || false,
      });
    } else {
      setFormData({
        categoriaId: '',
        tema: '',
        actividad: '',
        orientadoA: '',
        duracionMinutos: '',
        periodicidad: 'UNICA',
        programadoEne: false,
        programadoFeb: false,
        programadoMar: false,
        programadoAbr: false,
        programadoMay: false,
        programadoJun: false,
        programadoJul: false,
        programadoAgo: false,
        programadoSep: false,
        programadoOct: false,
        programadoNov: false,
        programadoDic: false,
      });
    }
  }, [capacitacion]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        anio,
        duracionMinutos: formData.duracionMinutos ? parseInt(formData.duracionMinutos) : null,
      };
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  const selectedMonths = MESES.filter(m => formData[m.key]).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {capacitacion ? 'Editar Capacitación' : 'Nueva Capacitación'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoriaId">Categoría *</Label>
              <Select value={formData.categoriaId} onValueChange={(v) => handleChange('categoriaId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || '#6366f1' }}
                        />
                        {cat.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodicidad">Periodicidad *</Label>
              <Select value={formData.periodicidad} onValueChange={(v) => handleChange('periodicidad', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICIDADES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tema">Tema *</Label>
            <Input
              id="tema"
              value={formData.tema}
              onChange={(e) => handleChange('tema', e.target.value)}
              placeholder="Nombre del tema de capacitación"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actividad">Actividad</Label>
              <Input
                id="actividad"
                value={formData.actividad}
                onChange={(e) => handleChange('actividad', e.target.value)}
                placeholder="Ej: Taller, Charla, Capacitación..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracionMinutos">Duración (minutos)</Label>
              <Input
                id="duracionMinutos"
                type="number"
                value={formData.duracionMinutos}
                onChange={(e) => handleChange('duracionMinutos', e.target.value)}
                placeholder="Ej: 60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orientadoA">Orientado a</Label>
            <Input
              id="orientadoA"
              value={formData.orientadoA}
              onChange={(e) => handleChange('orientadoA', e.target.value)}
              placeholder="Ej: Todo el personal, Enfermería, Médicos..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsableId">Responsable *</Label>
            <Input
              id="responsableId"
              value={formData.responsableId}
              onChange={(e) => handleChange('responsableId', e.target.value)}
              placeholder="ID del responsable"
              required
            />
            <p className="text-xs text-gray-500">
              Ingrese el ID del personal responsable de la capacitación
            </p>
          </div>

          <div className="space-y-2">
            <Label>Meses Programados * ({selectedMonths} seleccionados)</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 p-3 border rounded-lg">
              {MESES.map(mes => (
                <div key={mes.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={mes.key}
                    checked={formData[mes.key]}
                    onCheckedChange={(checked) => handleChange(mes.key, checked)}
                  />
                  <Label htmlFor={mes.key} className="text-sm font-normal cursor-pointer">
                    {mes.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedMonths === 0 && (
              <p className="text-sm text-destructive">Debe seleccionar al menos un mes</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.categoriaId || !formData.tema || selectedMonths === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {capacitacion ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
