'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';

export default function MedicionIndicadorForm({ open, onClose, onSubmit, indicador }) {
  const [formData, setFormData] = useState({
    periodo: '',
    mes: null,
    trimestre: null,
    anio: new Date().getFullYear(),
    numerador: null,
    denominador: null,
    resultado: 0,
    analisis: '',
    accionesMejora: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        periodo: '',
        mes: null,
        trimestre: null,
        anio: new Date().getFullYear(),
        numerador: null,
        denominador: null,
        resultado: 0,
        analisis: '',
        accionesMejora: '',
      });
    }
  }, [open]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto-calcular resultado si hay numerador y denominador
      if (field === 'numerador' || field === 'denominador') {
        const num = field === 'numerador' ? parseFloat(value) : parseFloat(prev.numerador);
        const den = field === 'denominador' ? parseFloat(value) : parseFloat(prev.denominador);

        if (num && den && den !== 0) {
          if (indicador.unidadMedida === 'PORCENTAJE') {
            newData.resultado = (num / den) * 100;
          } else {
            newData.resultado = num / den;
          }
        }
      }

      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Medición - {indicador?.nombre}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información del indicador */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Código:</span> {indicador?.codigo}
              </div>
              <div>
                <span className="font-medium">Meta:</span> {indicador?.meta}
                {indicador?.unidadMedida === 'PORCENTAJE' && '%'}
              </div>
              {indicador?.formula && (
                <div className="col-span-2">
                  <span className="font-medium">Fórmula:</span>
                  <code className="ml-2 text-xs bg-white px-2 py-1 rounded">
                    {indicador.formula}
                  </code>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Año */}
            <div className="space-y-2">
              <Label>Año *</Label>
              <Input
                type="number"
                value={formData.anio}
                onChange={(e) => handleChange('anio', parseInt(e.target.value))}
                min="2020"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            {/* Mes */}
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select
                value={formData.mes?.toString() || ''}
                onValueChange={(val) => handleChange('mes', val ? parseInt(val) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  {[...Array(12)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2000, i).toLocaleString('es-ES', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trimestre */}
            <div className="space-y-2">
              <Label>Trimestre</Label>
              <Select
                value={formData.trimestre?.toString() || ''}
                onValueChange={(val) => handleChange('trimestre', val ? parseInt(val) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  <SelectItem value="1">Q1 (Ene-Mar)</SelectItem>
                  <SelectItem value="2">Q2 (Abr-Jun)</SelectItem>
                  <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                  <SelectItem value="4">Q4 (Oct-Dic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Periodo */}
          <div className="space-y-2">
            <Label>Periodo *</Label>
            <Input
              value={formData.periodo}
              onChange={(e) => handleChange('periodo', e.target.value)}
              placeholder="2025-01, 2025-Q1, 2025"
              required
            />
            <p className="text-xs text-muted-foreground">
              Formato: YYYY-MM, YYYY-Q1, o YYYY
            </p>
          </div>

          {/* Numerador y Denominador */}
          {indicador?.formula && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numerador</Label>
                <Input
                  type="number"
                  value={formData.numerador || ''}
                  onChange={(e) => handleChange('numerador', e.target.value)}
                  step="0.01"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Denominador</Label>
                <Input
                  type="number"
                  value={formData.denominador || ''}
                  onChange={(e) => handleChange('denominador', e.target.value)}
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Resultado */}
          <div className="space-y-2">
            <Label>Resultado *</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.resultado}
                onChange={(e) => handleChange('resultado', parseFloat(e.target.value))}
                step="0.01"
                required
              />
              <span className="text-sm text-muted-foreground">
                {indicador?.unidadMedida === 'PORCENTAJE' ? '%' : indicador?.unidadMedida || ''}
              </span>
            </div>
            {indicador?.meta && (
              <p className="text-xs text-muted-foreground">
                Meta: {indicador.meta}
                {indicador?.unidadMedida === 'PORCENTAJE' && '%'}
              </p>
            )}
          </div>

          {/* Análisis */}
          <div className="space-y-2">
            <Label>Análisis</Label>
            <Textarea
              value={formData.analisis}
              onChange={(e) => handleChange('analisis', e.target.value)}
              placeholder="Análisis de los resultados obtenidos..."
              rows={3}
            />
          </div>

          {/* Acciones de Mejora */}
          <div className="space-y-2">
            <Label>Acciones de Mejora</Label>
            <Textarea
              value={formData.accionesMejora}
              onChange={(e) => handleChange('accionesMejora', e.target.value)}
              placeholder="Acciones de mejora propuestas..."
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Registrar Medición
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
