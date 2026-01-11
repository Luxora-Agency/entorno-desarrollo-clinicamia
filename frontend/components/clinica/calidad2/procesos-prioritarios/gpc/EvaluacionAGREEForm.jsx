'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Formulario para evaluación AGREE II de Guías de Práctica Clínica
 * AGREE II: Instrumento de 23 ítems en 6 dominios para evaluar calidad de GPC
 */
export default function EvaluacionAGREEForm({ open, onClose, onSubmit, gpc }) {
  const [formData, setFormData] = useState({
    evaluacionAGREE: true,
    puntajeAGREE: '',
    recomendacion: '',
    // Dominios AGREE II (puntaje 0-100 cada uno)
    dominio1_alcance: '', // Alcance y objetivo
    dominio2_participacion: '', // Participación de los implicados
    dominio3_rigor: '', // Rigor en la elaboración
    dominio4_claridad: '', // Claridad de presentación
    dominio5_aplicabilidad: '', // Aplicabilidad
    dominio6_independencia: '', // Independencia editorial
    observaciones: '',
  });

  useEffect(() => {
    if (open && gpc) {
      // Si ya tiene evaluación AGREE, cargar los datos
      const dominios = gpc.dominiosAGREE ? JSON.parse(gpc.dominiosAGREE) : {};
      setFormData({
        evaluacionAGREE: gpc.evaluacionAGREE || true,
        puntajeAGREE: gpc.puntajeAGREE || '',
        recomendacion: gpc.recomendacion || '',
        dominio1_alcance: dominios.dominio1_alcance || '',
        dominio2_participacion: dominios.dominio2_participacion || '',
        dominio3_rigor: dominios.dominio3_rigor || '',
        dominio4_claridad: dominios.dominio4_claridad || '',
        dominio5_aplicabilidad: dominios.dominio5_aplicabilidad || '',
        dominio6_independencia: dominios.dominio6_independencia || '',
        observaciones: dominios.observaciones || '',
      });
    }
  }, [open, gpc]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDominioChange = (dominio, value) => {
    const numValue = parseFloat(value);
    if (numValue < 0 || numValue > 100) {
      toast.error('El puntaje debe estar entre 0 y 100');
      return;
    }
    setFormData((prev) => ({ ...prev, [dominio]: value }));
  };

  // Calcular puntaje promedio automáticamente
  const calcularPuntajePromedio = () => {
    const dominios = [
      formData.dominio1_alcance,
      formData.dominio2_participacion,
      formData.dominio3_rigor,
      formData.dominio4_claridad,
      formData.dominio5_aplicabilidad,
      formData.dominio6_independencia,
    ].filter((d) => d !== '').map((d) => parseFloat(d));

    if (dominios.length === 0) return 0;
    const sum = dominios.reduce((acc, val) => acc + val, 0);
    return (sum / dominios.length).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar que todos los dominios tengan puntaje
    const dominios = [
      formData.dominio1_alcance,
      formData.dominio2_participacion,
      formData.dominio3_rigor,
      formData.dominio4_claridad,
      formData.dominio5_aplicabilidad,
      formData.dominio6_independencia,
    ];

    if (dominios.some((d) => !d || d === '')) {
      toast.error('Debe completar todos los dominios AGREE II');
      return;
    }

    if (!formData.recomendacion) {
      toast.error('Debe seleccionar una recomendación');
      return;
    }

    const puntajePromedio = calcularPuntajePromedio();

    // Construir objeto dominiosAGREE
    const dominiosAGREE = {
      dominio1_alcance: parseFloat(formData.dominio1_alcance),
      dominio2_participacion: parseFloat(formData.dominio2_participacion),
      dominio3_rigor: parseFloat(formData.dominio3_rigor),
      dominio4_claridad: parseFloat(formData.dominio4_claridad),
      dominio5_aplicabilidad: parseFloat(formData.dominio5_aplicabilidad),
      dominio6_independencia: parseFloat(formData.dominio6_independencia),
      observaciones: formData.observaciones,
    };

    const data = {
      evaluacionAGREE: true,
      puntajeAGREE: parseFloat(puntajePromedio),
      dominiosAGREE: JSON.stringify(dominiosAGREE),
      recomendacion: formData.recomendacion,
    };

    onSubmit(data);
  };

  const puntajePromedio = calcularPuntajePromedio();

  const getPuntajeColor = (puntaje) => {
    if (puntaje >= 70) return 'text-green-600';
    if (puntaje >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const dominiosAGREE = [
    { id: 'dominio1_alcance', nombre: 'Dominio 1: Alcance y Objetivo', descripcion: 'Objetivo general, cuestiones de salud y población diana' },
    { id: 'dominio2_participacion', nombre: 'Dominio 2: Participación de los Implicados', descripcion: 'Participación de profesionales, pacientes y población diana' },
    { id: 'dominio3_rigor', nombre: 'Dominio 3: Rigor en la Elaboración', descripcion: 'Búsqueda de evidencia, formulación de recomendaciones, actualización' },
    { id: 'dominio4_claridad', nombre: 'Dominio 4: Claridad de Presentación', descripcion: 'Recomendaciones específicas, diferentes opciones, identificabilidad' },
    { id: 'dominio5_aplicabilidad', nombre: 'Dominio 5: Aplicabilidad', descripcion: 'Barreras y facilitadores, estrategias de aplicación, implicaciones de recursos' },
    { id: 'dominio6_independencia', nombre: 'Dominio 6: Independencia Editorial', descripcion: 'Independencia de financiador, conflictos de interés' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Evaluación AGREE II
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {gpc?.nombre || 'Guía de Práctica Clínica'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Sobre AGREE II</p>
                  <p className="text-blue-700">
                    AGREE II (Appraisal of Guidelines for Research & Evaluation) es un instrumento
                    internacional para evaluar la calidad metodológica de las guías de práctica clínica.
                    Evalúe cada dominio con un puntaje de 0 a 100.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dominios AGREE II */}
          <div className="space-y-4">
            <h3 className="font-medium">Dominios AGREE II</h3>
            {dominiosAGREE.map((dominio) => (
              <Card key={dominio.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{dominio.nombre}</CardTitle>
                  <p className="text-xs text-muted-foreground">{dominio.descripcion}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="number"
                        name={dominio.id}
                        value={formData[dominio.id]}
                        onChange={(e) => handleDominioChange(dominio.id, e.target.value)}
                        placeholder="0-100"
                        min="0"
                        max="100"
                        step="0.01"
                        required
                      />
                    </div>
                    {formData[dominio.id] && (
                      <Badge className={getPuntajeColor(parseFloat(formData[dominio.id]))}>
                        {parseFloat(formData[dominio.id]).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Puntaje Promedio */}
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-sm">Puntaje Promedio AGREE II</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center">
                <span className={getPuntajeColor(parseFloat(puntajePromedio))}>
                  {puntajePromedio}%
                </span>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Calculado automáticamente como promedio de los 6 dominios
              </p>
            </CardContent>
          </Card>

          {/* Recomendación */}
          <div className="space-y-2">
            <Label htmlFor="recomendacion">
              Recomendación <span className="text-red-500">*</span>
            </Label>
            <Select
              name="recomendacion"
              value={formData.recomendacion}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, recomendacion: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una recomendación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECOMENDADA">Recomendada (puntaje ≥ 70%)</SelectItem>
                <SelectItem value="RECOMENDADA_MODIFICACIONES">
                  Recomendada con modificaciones (puntaje 50-69%)
                </SelectItem>
                <SelectItem value="NO_RECOMENDADA">No recomendada (puntaje &lt; 50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={4}
              placeholder="Comentarios adicionales sobre la evaluación AGREE II..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Evaluación</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
