'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';

export default function IndicadorForm({ open, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'GENERAL',
    tipo: 'PROCESO',
    definicion: '',
    formula: '',
    unidadMedida: 'PORCENTAJE',
    meta: null,
    sentido: 'ASCENDENTE',
    estado: 'ACTIVO',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        categoria: 'GENERAL',
        tipo: 'PROCESO',
        definicion: '',
        formula: '',
        unidadMedida: 'PORCENTAJE',
        meta: null,
        sentido: 'ASCENDENTE',
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Indicador' : 'Nuevo Indicador'}
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
                placeholder="IND-PP-001"
                required
              />
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
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label>Nombre del Indicador *</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Porcentaje de cumplimiento de..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoría */}
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={formData.categoria} onValueChange={(val) => handleChange('categoria', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEGURIDAD">Seguridad del Paciente</SelectItem>
                  <SelectItem value="GPC">Guías de Práctica Clínica</SelectItem>
                  <SelectItem value="COMITES">Comités</SelectItem>
                  <SelectItem value="SIAU">SIAU</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(val) => handleChange('tipo', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESTRUCTURA">Estructura</SelectItem>
                  <SelectItem value="PROCESO">Proceso</SelectItem>
                  <SelectItem value="RESULTADO">Resultado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Definición */}
          <div className="space-y-2">
            <Label>Definición *</Label>
            <Textarea
              value={formData.definicion}
              onChange={(e) => handleChange('definicion', e.target.value)}
              placeholder="Descripción clara de qué mide el indicador..."
              rows={3}
              required
            />
          </div>

          {/* Fórmula */}
          <div className="space-y-2">
            <Label>Fórmula de Cálculo</Label>
            <Input
              value={formData.formula}
              onChange={(e) => handleChange('formula', e.target.value)}
              placeholder="(Numerador / Denominador) * 100"
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Unidad de Medida */}
            <div className="space-y-2">
              <Label>Unidad de Medida *</Label>
              <Select value={formData.unidadMedida} onValueChange={(val) => handleChange('unidadMedida', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PORCENTAJE">Porcentaje (%)</SelectItem>
                  <SelectItem value="NUMERO">Número</SelectItem>
                  <SelectItem value="TASA">Tasa</SelectItem>
                  <SelectItem value="RAZON">Razón</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Meta */}
            <div className="space-y-2">
              <Label>Meta</Label>
              <Input
                type="number"
                value={formData.meta || ''}
                onChange={(e) => handleChange('meta', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="90"
                step="0.1"
              />
            </div>

            {/* Sentido */}
            <div className="space-y-2">
              <Label>Sentido *</Label>
              <Select value={formData.sentido} onValueChange={(val) => handleChange('sentido', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASCENDENTE">Ascendente ↑</SelectItem>
                  <SelectItem value="DESCENDENTE">Descendente ↓</SelectItem>
                  <SelectItem value="MANTENER">Mantener →</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Información */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-medium mb-1">Sentido del indicador:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• <strong>Ascendente:</strong> Mayor valor es mejor (ej: porcentaje de cumplimiento)</li>
              <li>• <strong>Descendente:</strong> Menor valor es mejor (ej: tasa de eventos adversos)</li>
              <li>• <strong>Mantener:</strong> Se busca mantener un valor específico</li>
            </ul>
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
