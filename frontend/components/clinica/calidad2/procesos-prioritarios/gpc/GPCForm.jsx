'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, X } from 'lucide-react';

export default function GPCForm({ open, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    patologia: 'DIABETES_TIPO_2',
    fuenteGuia: '',
    paisOrigen: 'Colombia',
    anioPublicacion: new Date().getFullYear(),
    version: '1.0',
    resumen: '',
    alcance: '',
    poblacionObjetivo: '',
    fechaAdopcion: '',
    estado: 'VIGENTE',
    proximaRevision: '',
    evaluacionAGREE: false,
    puntajeAGREE: null,
    recomendacion: 'RECOMENDADA',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        fechaAdopcion: initialData.fechaAdopcion?.split('T')[0] || '',
        proximaRevision: initialData.proximaRevision?.split('T')[0] || '',
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        patologia: 'DIABETES_TIPO_2',
        fuenteGuia: '',
        paisOrigen: 'Colombia',
        anioPublicacion: new Date().getFullYear(),
        version: '1.0',
        resumen: '',
        alcance: '',
        poblacionObjetivo: '',
        fechaAdopcion: '',
        estado: 'VIGENTE',
        proximaRevision: '',
        evaluacionAGREE: false,
        puntajeAGREE: null,
        recomendacion: 'RECOMENDADA',
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar GPC' : 'Nueva Guía de Práctica Clínica'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="contenido">Contenido</TabsTrigger>
              <TabsTrigger value="evaluacion">Evaluación AGREE II</TabsTrigger>
            </TabsList>

            {/* Tab: Información General */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Código */}
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => handleChange('codigo', e.target.value)}
                    placeholder="GPC-001"
                    required
                  />
                </div>

                {/* Patología */}
                <div className="space-y-2">
                  <Label>Patología *</Label>
                  <Select value={formData.patologia} onValueChange={(val) => handleChange('patologia', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIABETES_TIPO_2">Diabetes Mellitus Tipo 2</SelectItem>
                      <SelectItem value="HIPOTIROIDISMO">Hipotiroidismo</SelectItem>
                      <SelectItem value="HIPERTIROIDISMO">Hipertiroidismo</SelectItem>
                      <SelectItem value="DISLIPIDEMIAS">Dislipidemias</SelectItem>
                      <SelectItem value="OBESIDAD">Obesidad</SelectItem>
                      <SelectItem value="OSTEOPOROSIS">Osteoporosis</SelectItem>
                      <SelectItem value="SARCOPENIA">Sarcopenia</SelectItem>
                      <SelectItem value="CANCER_TIROIDES">Cáncer de Tiroides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label>Nombre de la Guía *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Nombre completo de la guía de práctica clínica"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fuente */}
                <div className="space-y-2">
                  <Label>Fuente de la Guía *</Label>
                  <Select value={formData.fuenteGuia} onValueChange={(val) => handleChange('fuenteGuia', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINSALUD_COL">MinSalud Colombia</SelectItem>
                      <SelectItem value="CENETEC">CENETEC México</SelectItem>
                      <SelectItem value="NICE">NICE (UK)</SelectItem>
                      <SelectItem value="LATS">LATS</SelectItem>
                      <SelectItem value="ADA">ADA</SelectItem>
                      <SelectItem value="AACE">AACE</SelectItem>
                      <SelectItem value="OTRA">Otra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* País */}
                <div className="space-y-2">
                  <Label>País de Origen *</Label>
                  <Input
                    value={formData.paisOrigen}
                    onChange={(e) => handleChange('paisOrigen', e.target.value)}
                    placeholder="Colombia"
                    required
                  />
                </div>

                {/* Año */}
                <div className="space-y-2">
                  <Label>Año de Publicación *</Label>
                  <Input
                    type="number"
                    value={formData.anioPublicacion}
                    onChange={(e) => handleChange('anioPublicacion', parseInt(e.target.value))}
                    min="2000"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Versión */}
                <div className="space-y-2">
                  <Label>Versión</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) => handleChange('version', e.target.value)}
                    placeholder="1.0"
                  />
                </div>

                {/* Fecha Adopción */}
                <div className="space-y-2">
                  <Label>Fecha de Adopción *</Label>
                  <Input
                    type="date"
                    value={formData.fechaAdopcion}
                    onChange={(e) => handleChange('fechaAdopcion', e.target.value)}
                    required
                  />
                </div>

                {/* Próxima Revisión */}
                <div className="space-y-2">
                  <Label>Próxima Revisión</Label>
                  <Input
                    type="date"
                    value={formData.proximaRevision}
                    onChange={(e) => handleChange('proximaRevision', e.target.value)}
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
                    <SelectItem value="VIGENTE">Vigente</SelectItem>
                    <SelectItem value="EN_REVISION">En Revisión</SelectItem>
                    <SelectItem value="OBSOLETA">Obsoleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Tab: Contenido */}
            <TabsContent value="contenido" className="space-y-4 mt-4">
              {/* Resumen */}
              <div className="space-y-2">
                <Label>Resumen</Label>
                <Textarea
                  value={formData.resumen}
                  onChange={(e) => handleChange('resumen', e.target.value)}
                  placeholder="Resumen ejecutivo de la guía..."
                  rows={4}
                />
              </div>

              {/* Alcance */}
              <div className="space-y-2">
                <Label>Alcance</Label>
                <Textarea
                  value={formData.alcance}
                  onChange={(e) => handleChange('alcance', e.target.value)}
                  placeholder="Alcance de la guía..."
                  rows={3}
                />
              </div>

              {/* Población Objetivo */}
              <div className="space-y-2">
                <Label>Población Objetivo</Label>
                <Textarea
                  value={formData.poblacionObjetivo}
                  onChange={(e) => handleChange('poblacionObjetivo', e.target.value)}
                  placeholder="Población a la que va dirigida la guía..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Tab: Evaluación AGREE II */}
            <TabsContent value="evaluacion" className="space-y-4 mt-4">
              {/* Evaluación Realizada */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="evaluacionAGREE"
                  checked={formData.evaluacionAGREE}
                  onCheckedChange={(checked) => handleChange('evaluacionAGREE', checked)}
                />
                <Label htmlFor="evaluacionAGREE" className="cursor-pointer">
                  Evaluación AGREE II realizada
                </Label>
              </div>

              {formData.evaluacionAGREE && (
                <>
                  {/* Puntaje AGREE II */}
                  <div className="space-y-2">
                    <Label>Puntaje AGREE II (0-100)</Label>
                    <Input
                      type="number"
                      value={formData.puntajeAGREE || ''}
                      onChange={(e) => handleChange('puntajeAGREE', parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="75.5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Puntaje global de la evaluación AGREE II
                    </p>
                  </div>

                  {/* Recomendación */}
                  <div className="space-y-2">
                    <Label>Recomendación *</Label>
                    <Select value={formData.recomendacion} onValueChange={(val) => handleChange('recomendacion', val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RECOMENDADA">Recomendada</SelectItem>
                        <SelectItem value="RECOMENDADA_MODIFICACIONES">Recomendada con Modificaciones</SelectItem>
                        <SelectItem value="NO_RECOMENDADA">No Recomendada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Información AGREE II */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium mb-2">Dominios AGREE II:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>1. Alcance y Objetivo</div>
                      <div>2. Participación de los Implicados</div>
                      <div>3. Rigor en la Elaboración</div>
                      <div>4. Claridad de Presentación</div>
                      <div>5. Aplicabilidad</div>
                      <div>6. Independencia Editorial</div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

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
