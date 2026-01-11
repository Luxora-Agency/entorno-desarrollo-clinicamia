'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Formulario para registrar evaluación de adherencia a GPC
 * Mide el cumplimiento de las recomendaciones de la guía en la práctica clínica
 */
export default function AdherenciaGPCForm({ open, onClose, onSubmit, gpc, initialData }) {
  const [formData, setFormData] = useState({
    periodo: '',
    anio: new Date().getFullYear().toString(),
    trimestre: '',
    casosEvaluados: '',
    casosAdherentes: '',
    hallazgos: '',
    barrerasIdentificadas: '',
    accionesMejora: '',
  });

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        periodo: initialData.periodo || '',
        anio: initialData.periodo ? initialData.periodo.split('-')[0] : new Date().getFullYear().toString(),
        trimestre: initialData.periodo ? initialData.periodo.split('-')[1] : '',
        casosEvaluados: initialData.casosEvaluados || '',
        casosAdherentes: initialData.casosAdherentes || '',
        hallazgos: initialData.hallazgos || '',
        barrerasIdentificadas: initialData.barrerasIdentificadas || '',
        accionesMejora: initialData.accionesMejora || '',
      });
    } else if (open) {
      setFormData({
        periodo: '',
        anio: new Date().getFullYear().toString(),
        trimestre: '',
        casosEvaluados: '',
        casosAdherentes: '',
        hallazgos: '',
        barrerasIdentificadas: '',
        accionesMejora: '',
      });
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calcularPorcentaje = () => {
    const evaluados = parseInt(formData.casosEvaluados) || 0;
    const adherentes = parseInt(formData.casosAdherentes) || 0;
    if (evaluados === 0) return 0;
    return ((adherentes / evaluados) * 100).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.anio || !formData.trimestre) {
      toast.error('Debe seleccionar año y trimestre');
      return;
    }

    const evaluados = parseInt(formData.casosEvaluados);
    const adherentes = parseInt(formData.casosAdherentes);

    if (isNaN(evaluados) || evaluados <= 0) {
      toast.error('Debe ingresar el número de casos evaluados');
      return;
    }

    if (isNaN(adherentes) || adherentes < 0) {
      toast.error('Debe ingresar el número de casos adherentes');
      return;
    }

    if (adherentes > evaluados) {
      toast.error('Los casos adherentes no pueden ser mayores a los evaluados');
      return;
    }

    const periodo = `${formData.anio}-${formData.trimestre}`;
    const porcentajeAdherencia = parseFloat(calcularPorcentaje());

    const data = {
      gpcId: gpc.id,
      periodo,
      casosEvaluados: evaluados,
      casosAdherentes: adherentes,
      porcentajeAdherencia,
      hallazgos: formData.hallazgos,
      barrerasIdentificadas: formData.barrerasIdentificadas,
      accionesMejora: formData.accionesMejora,
      fechaEvaluacion: new Date().toISOString(),
    };

    onSubmit(data);
  };

  const porcentaje = calcularPorcentaje();

  const getPorcentajeColor = (pct) => {
    if (pct >= 80) return 'text-green-600';
    if (pct >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const aniosDisponibles = [];
  const anioActual = new Date().getFullYear();
  for (let i = anioActual - 2; i <= anioActual + 1; i++) {
    aniosDisponibles.push(i);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Evaluación de Adherencia
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {gpc?.nombre || 'Guía de Práctica Clínica'} - {gpc?.patologia}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Card */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-purple-900 mb-1">Sobre la adherencia</p>
                  <p className="text-purple-700">
                    La evaluación de adherencia mide el cumplimiento de las recomendaciones de la GPC
                    en la práctica clínica real. Se recomienda realizar evaluaciones trimestrales.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anio">
                Año <span className="text-red-500">*</span>
              </Label>
              <Select
                name="anio"
                value={formData.anio}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, anio: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione año" />
                </SelectTrigger>
                <SelectContent>
                  {aniosDisponibles.map((anio) => (
                    <SelectItem key={anio} value={anio.toString()}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trimestre">
                Trimestre <span className="text-red-500">*</span>
              </Label>
              <Select
                name="trimestre"
                value={formData.trimestre}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, trimestre: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione trimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1 (Ene-Mar)</SelectItem>
                  <SelectItem value="Q2">Q2 (Abr-Jun)</SelectItem>
                  <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                  <SelectItem value="Q4">Q4 (Oct-Dic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Casos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="casosEvaluados">
                Casos Evaluados <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                id="casosEvaluados"
                name="casosEvaluados"
                value={formData.casosEvaluados}
                onChange={handleChange}
                min="1"
                required
                placeholder="Ej: 50"
              />
              <p className="text-xs text-muted-foreground">
                Total de casos evaluados en el período
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="casosAdherentes">
                Casos Adherentes <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                id="casosAdherentes"
                name="casosAdherentes"
                value={formData.casosAdherentes}
                onChange={handleChange}
                min="0"
                required
                placeholder="Ej: 42"
              />
              <p className="text-xs text-muted-foreground">
                Casos que cumplieron con las recomendaciones
              </p>
            </div>
          </div>

          {/* Porcentaje Calculado */}
          {formData.casosEvaluados && (
            <Card className="bg-slate-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Porcentaje de Adherencia</p>
                  <div className="text-4xl font-bold">
                    <span className={getPorcentajeColor(parseFloat(porcentaje))}>
                      {porcentaje}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.casosAdherentes} de {formData.casosEvaluados} casos
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hallazgos */}
          <div className="space-y-2">
            <Label htmlFor="hallazgos">Hallazgos Principales</Label>
            <Textarea
              id="hallazgos"
              name="hallazgos"
              value={formData.hallazgos}
              onChange={handleChange}
              rows={3}
              placeholder="Describa los hallazgos más relevantes de la evaluación..."
            />
          </div>

          {/* Barreras */}
          <div className="space-y-2">
            <Label htmlFor="barrerasIdentificadas">Barreras Identificadas</Label>
            <Textarea
              id="barrerasIdentificadas"
              name="barrerasIdentificadas"
              value={formData.barrerasIdentificadas}
              onChange={handleChange}
              rows={3}
              placeholder="Barreras que dificultan la adherencia a la guía..."
            />
          </div>

          {/* Acciones de Mejora */}
          <div className="space-y-2">
            <Label htmlFor="accionesMejora">Acciones de Mejora</Label>
            <Textarea
              id="accionesMejora"
              name="accionesMejora"
              value={formData.accionesMejora}
              onChange={handleChange}
              rows={3}
              placeholder="Acciones propuestas para mejorar la adherencia..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {initialData ? 'Actualizar' : 'Registrar'} Evaluación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
