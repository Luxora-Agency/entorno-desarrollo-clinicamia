'use client';

import { useState, useEffect } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const TIPOS_REUNION = [
  { value: 'COMITE', label: 'Comite' },
  { value: 'AUDITORIA', label: 'Auditoria' },
  { value: 'REUNION_INTERNA', label: 'Reunion interna' },
  { value: 'CAPACITACION', label: 'Capacitacion' },
  { value: 'REUNION_PERSONAL', label: 'Reunion Personal' },
  { value: 'JUNTA_DIRECTIVA', label: 'Junta Directiva' },
  { value: 'REUNION_CLIENTE_PROVEEDOR', label: 'Reunion con cliente y/o proveedores' },
  { value: 'VISITA_ENTES_REGULADORES', label: 'Visita entes reguladores' },
  { value: 'OTRO', label: 'Otro' },
];

export function ActaForm({ open, onClose, onSubmit, acta }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    tiposReunion: [],
    tipoOtro: '',
    objetivo: '',
    fecha: '',
    horaInicio: '08:00',
    horaFin: '10:00',
    lugar: '',
    temasTratar: [''],
    compromisosAnteriores: [],
    desarrolloReunion: '',
    informeAdherencia: '',
    compromisosSiguientes: [],
    asistentes: [],
  });

  useEffect(() => {
    if (acta) {
      setFormData({
        tiposReunion: acta.tiposReunion || [],
        tipoOtro: acta.tipoOtro || '',
        objetivo: acta.objetivo || '',
        fecha: acta.fecha ? formatDateISO(new Date(acta.fecha)) : '',
        horaInicio: acta.horaInicio || '08:00',
        horaFin: acta.horaFin || '10:00',
        lugar: acta.lugar || '',
        temasTratar: acta.temasTratar?.length ? acta.temasTratar : [''],
        compromisosAnteriores: acta.compromisosAnteriores || [],
        desarrolloReunion: acta.desarrolloReunion || '',
        informeAdherencia: acta.informeAdherencia || '',
        compromisosSiguientes: acta.compromisosSiguientes || [],
        asistentes: acta.asistentes || [],
      });
    }
  }, [acta]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTipoReunion = (tipo) => {
    setFormData(prev => ({
      ...prev,
      tiposReunion: prev.tiposReunion.includes(tipo)
        ? prev.tiposReunion.filter(t => t !== tipo)
        : [...prev.tiposReunion, tipo],
    }));
  };

  const updateArrayItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field, defaultValue) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], defaultValue],
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        temasTratar: formData.temasTratar.filter(t => t.trim()),
      };
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{acta ? `Acta #${acta.numero}` : 'Nueva Acta de Reunion'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="contenido">Contenido</TabsTrigger>
              <TabsTrigger value="compromisos">Compromisos</TabsTrigger>
              <TabsTrigger value="asistentes">Asistentes</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              {/* Tipo de Reunion */}
              <div className="space-y-2">
                <Label>Tipo de Reunion *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {TIPOS_REUNION.map(tipo => (
                    <div key={tipo.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={tipo.value}
                        checked={formData.tiposReunion.includes(tipo.value)}
                        onCheckedChange={() => toggleTipoReunion(tipo.value)}
                      />
                      <Label htmlFor={tipo.value} className="text-sm font-normal cursor-pointer">
                        {tipo.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.tiposReunion.includes('OTRO') && (
                  <Input
                    placeholder="Especifique el tipo"
                    value={formData.tipoOtro}
                    onChange={(e) => handleChange('tipoOtro', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Objetivo *</Label>
                <Textarea
                  value={formData.objetivo}
                  onChange={(e) => handleChange('objetivo', e.target.value)}
                  placeholder="Objetivo de la reunion"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => handleChange('fecha', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Inicio *</Label>
                  <Input
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => handleChange('horaInicio', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Fin *</Label>
                  <Input
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => handleChange('horaFin', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lugar *</Label>
                  <Input
                    value={formData.lugar}
                    onChange={(e) => handleChange('lugar', e.target.value)}
                    placeholder="Sala de reuniones"
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contenido" className="space-y-4 mt-4">
              {/* Temas a tratar */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">Temas a Tratar</CardTitle>
                    <Button type="button" size="sm" variant="outline" onClick={() => addArrayItem('temasTratar', '')}>
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.temasTratar.map((tema, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="py-2 text-sm text-muted-foreground w-6">{idx + 1}.</span>
                      <Input
                        value={tema}
                        onChange={(e) => updateArrayItem('temasTratar', idx, e.target.value)}
                        placeholder="Tema a tratar"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeArrayItem('temasTratar', idx)}
                        disabled={formData.temasTratar.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Desarrollo */}
              <div className="space-y-2">
                <Label>Desarrollo de la Reunion</Label>
                <Textarea
                  value={formData.desarrolloReunion}
                  onChange={(e) => handleChange('desarrolloReunion', e.target.value)}
                  placeholder="Describa el desarrollo de la reunion..."
                  rows={6}
                />
              </div>

              {/* Informe Adherencia */}
              <div className="space-y-2">
                <Label>Informe de Adherencia</Label>
                <Textarea
                  value={formData.informeAdherencia}
                  onChange={(e) => handleChange('informeAdherencia', e.target.value)}
                  placeholder="Analisis de adherencia..."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="compromisos" className="space-y-4 mt-4">
              {/* Compromisos Anteriores */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">Compromisos Acta Anterior</CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addArrayItem('compromisosAnteriores', { descripcion: '', cumplio: 'N/A' })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.compromisosAnteriores.map((comp, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <Input
                        value={comp.descripcion}
                        onChange={(e) => updateArrayItem('compromisosAnteriores', idx, { ...comp, descripcion: e.target.value })}
                        placeholder="Compromiso"
                        className="flex-1"
                      />
                      <select
                        value={comp.cumplio || 'N/A'}
                        onChange={(e) => updateArrayItem('compromisosAnteriores', idx, { ...comp, cumplio: e.target.value })}
                        className="h-10 px-3 rounded-md border"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                        <option value="N/A">N/A</option>
                      </select>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeArrayItem('compromisosAnteriores', idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Compromisos Siguientes */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">Compromisos Proxima Acta</CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addArrayItem('compromisosSiguientes', { descripcion: '', encargado: '', fechaEntrega: '' })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.compromisosSiguientes.map((comp, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2">
                      <Input
                        value={comp.descripcion}
                        onChange={(e) => updateArrayItem('compromisosSiguientes', idx, { ...comp, descripcion: e.target.value })}
                        placeholder="Compromiso"
                        className="col-span-2"
                      />
                      <Input
                        value={comp.encargado}
                        onChange={(e) => updateArrayItem('compromisosSiguientes', idx, { ...comp, encargado: e.target.value })}
                        placeholder="Encargado"
                      />
                      <div className="flex gap-1">
                        <Input
                          type="date"
                          value={comp.fechaEntrega}
                          onChange={(e) => updateArrayItem('compromisosSiguientes', idx, { ...comp, fechaEntrega: e.target.value })}
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeArrayItem('compromisosSiguientes', idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="asistentes" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">Asistentes ({formData.asistentes.length})</CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addArrayItem('asistentes', { nombreCompleto: '', cargo: '' })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.asistentes.map((asistente, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={asistente.nombreCompleto}
                        onChange={(e) => updateArrayItem('asistentes', idx, { ...asistente, nombreCompleto: e.target.value })}
                        placeholder="Nombre completo"
                        className="flex-1"
                      />
                      <Input
                        value={asistente.cargo}
                        onChange={(e) => updateArrayItem('asistentes', idx, { ...asistente, cargo: e.target.value })}
                        placeholder="Cargo"
                        className="w-40"
                      />
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeArrayItem('asistentes', idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || formData.tiposReunion.length === 0 || !formData.objetivo}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {acta ? 'Actualizar' : 'Crear Acta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
