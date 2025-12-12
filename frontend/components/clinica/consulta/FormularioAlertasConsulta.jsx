'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, X } from 'lucide-react';

export default function FormularioAlertasConsulta({ onChange, data }) {
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined);
  const [formData, setFormData] = useState(data || {
    tipoAlerta: 'AlergiaMedicamento',
    severidad: 'Moderada',
    titulo: '',
    descripcion: '',
  });

  const handleToggle = (agregar) => {
    setQuiereAgregar(agregar);
    if (!agregar) {
      onChange(null, true);
    } else {
      onChange(formData, isComplete());
    }
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData, isComplete(newData));
  };

  const isComplete = (data = formData) => {
    return data.titulo.trim() && data.descripcion.trim();
  };

  if (!quiereAgregar) {
    return (
      <Card className="border-orange-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">¿Desea registrar una alerta clínica?</p>
          <Button 
            onClick={() => handleToggle(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sí, agregar alerta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="bg-orange-50">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <AlertCircle className="h-5 w-5" />
          Alerta Clínica (Opcional)
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggle(false)}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            No agregar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {!isComplete() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Complete el título y la descripción de la alerta
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="titulo">Título de la Alerta</Label>
          <Input
            id="titulo"
            value={formData.titulo}
            onChange={(e) => handleChange('titulo', e.target.value)}
            placeholder="Ej: Alergia a penicilina"
            className={!formData.titulo.trim() ? 'border-red-300' : ''}
          />
        </div>

        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Detalle de la alerta..."
            rows={3}
            className={!formData.descripcion.trim() ? 'border-red-300' : ''}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipoAlerta">Tipo de Alerta</Label>
            <Select
              value={formData.tipoAlerta}
              onValueChange={(value) => handleChange('tipoAlerta', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AlergiaMedicamento">Alergia a Medicamento</SelectItem>
                <SelectItem value="Intolerancia">Intolerancia</SelectItem>
                <SelectItem value="RestriccionMovilidad">Restricción de Movilidad</SelectItem>
                <SelectItem value="RiesgoCaidas">Riesgo de Caídas</SelectItem>
                <SelectItem value="SignoVitalCritico">Signo Vital Crítico</SelectItem>
                <SelectItem value="Recordatorio">Recordatorio</SelectItem>
                <SelectItem value="InteraccionMedicamentosa">Interacción Medicamentosa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="severidad">Severidad</Label>
            <Select
              value={formData.severidad}
              onValueChange={(value) => handleChange('severidad', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Leve">Leve</SelectItem>
                <SelectItem value="Moderada">Moderada</SelectItem>
                <SelectItem value="Grave">Grave</SelectItem>
                <SelectItem value="Critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
