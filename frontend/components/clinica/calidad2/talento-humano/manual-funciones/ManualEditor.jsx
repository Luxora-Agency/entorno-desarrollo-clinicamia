'use client';

import { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const NIVELES = [
  { value: 'DIRECTIVO', label: 'Directivo' },
  { value: 'PROFESIONAL', label: 'Profesional' },
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'OPERATIVO', label: 'Operativo' },
];

const ESTADO_COLORS = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  VIGENTE: 'bg-green-100 text-green-800',
  OBSOLETO: 'bg-red-100 text-red-800',
};

export default function ManualEditor({ initialData, onSave, onCancel, loading = false }) {
  const [formData, setFormData] = useState(initialData || {
    cargo: '',
    dependencia: '',
    jefeInmediato: '',
    area: '',
    supervisorDirecto: '',
    nivel: 'PROFESIONAL',
    proposito: '',
    funciones: [''],
    contribuciones: [''],
    conocimientos: [''],
    formacion: [''],
    experiencia: [''],
    experienciaAnios: 1,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleListChange = (field, index, value) => {
    const newList = [...formData[field]];
    newList[index] = value;
    setFormData(prev => ({ ...prev, [field]: newList }));
  };

  const addListItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeListItem = (field, index) => {
    const newList = [...formData[field]];
    newList.splice(index, 1);
    setFormData(prev => ({ ...prev, [field]: newList }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={loading}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold">
            {initialData?.id ? 'Editar Manual de Funciones' : 'Nuevo Manual de Funciones'}
          </h2>
          {initialData?.estado && (
            <Badge className={ESTADO_COLORS[initialData.estado]}>
              {initialData.estado}
            </Badge>
          )}
          {initialData?.codigo && (
            <Badge variant="outline">{initialData.codigo}</Badge>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Manual
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Identificación */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">I. Identificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cargo">Denominación del Cargo *</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleChange('cargo', e.target.value)}
                placeholder="Ej. Médico Especialista"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nivel">Nivel del Cargo</Label>
              <Select
                value={formData.nivel}
                onValueChange={(val) => handleChange('nivel', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione nivel" />
                </SelectTrigger>
                <SelectContent>
                  {NIVELES.map(n => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Área</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
                placeholder="Ej. Servicios Médicos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependencia">Dependencia</Label>
              <Input
                id="dependencia"
                value={formData.dependencia}
                onChange={(e) => handleChange('dependencia', e.target.value)}
                placeholder="Ej. Dirección Médica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jefeInmediato">Cargo del Jefe Inmediato</Label>
              <Input
                id="jefeInmediato"
                value={formData.jefeInmediato}
                onChange={(e) => handleChange('jefeInmediato', e.target.value)}
                placeholder="Ej. Director Médico"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisorDirecto">Supervisor Directo</Label>
              <Input
                id="supervisorDirecto"
                value={formData.supervisorDirecto}
                onChange={(e) => handleChange('supervisorDirecto', e.target.value)}
                placeholder="Ej. Coordinador de Área"
              />
            </div>
          </div>
        </section>

        {/* Propósito */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">II. Propósito Principal</h3>
          <div className="space-y-2">
            <Label htmlFor="proposito">Propósito *</Label>
            <Textarea
              id="proposito"
              value={formData.proposito}
              onChange={(e) => handleChange('proposito', e.target.value)}
              placeholder="Describa el propósito principal del cargo..."
              className="min-h-[100px]"
              required
            />
          </div>
        </section>

        {/* Funciones */}
        <DynamicListSection
          title="III. Descripción de Funciones Esenciales"
          items={formData.funciones}
          onChange={(index, value) => handleListChange('funciones', index, value)}
          onAdd={() => addListItem('funciones')}
          onRemove={(index) => removeListItem('funciones', index)}
          placeholder="Describa una función esencial..."
        />

        {/* Contribuciones */}
        <DynamicListSection
          title="IV. Contribuciones Individuales"
          items={formData.contribuciones}
          onChange={(index, value) => handleListChange('contribuciones', index, value)}
          onAdd={() => addListItem('contribuciones')}
          onRemove={(index) => removeListItem('contribuciones', index)}
          placeholder="Describa una contribución individual..."
        />

        {/* Conocimientos */}
        <DynamicListSection
          title="V. Conocimientos Básicos o Esenciales"
          items={formData.conocimientos}
          onChange={(index, value) => handleListChange('conocimientos', index, value)}
          onAdd={() => addListItem('conocimientos')}
          onRemove={(index) => removeListItem('conocimientos', index)}
          placeholder="Describa un conocimiento requerido..."
        />

        {/* Requisitos */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">VI. Requisitos de Estudio y Experiencia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Formación Académica</Label>
              {formData.formacion.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleListChange('formacion', index, e.target.value)}
                    placeholder="Ej. Título universitario..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem('formacion', index)}
                    disabled={formData.formacion.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addListItem('formacion')}>
                <Plus className="w-3 h-3 mr-2" /> Agregar Formación
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="experienciaAnios">Años de Experiencia Requeridos</Label>
                <Input
                  id="experienciaAnios"
                  type="number"
                  min="0"
                  value={formData.experienciaAnios}
                  onChange={(e) => handleChange('experienciaAnios', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Experiencia</Label>
                {formData.experiencia.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => handleListChange('experiencia', index, e.target.value)}
                      placeholder="Ej. Experiencia profesional relacionada..."
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem('experiencia', index)}
                      disabled={formData.experiencia.length === 1}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addListItem('experiencia')}>
                  <Plus className="w-3 h-3 mr-2" /> Agregar Experiencia
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DynamicListSection({ title, items, onChange, onAdd, onRemove, placeholder }) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-start">
            <span className="mt-2 text-sm font-medium text-gray-500 w-6 text-right">{index + 1}.</span>
            <Textarea
              value={item}
              onChange={(e) => onChange(index, e.target.value)}
              placeholder={placeholder}
              className="flex-1 min-h-[60px]"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="mt-1"
              disabled={items.length === 1}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={onAdd} className="ml-8">
          <Plus className="w-3 h-3 mr-2" /> Agregar Item
        </Button>
      </div>
    </section>
  );
}
