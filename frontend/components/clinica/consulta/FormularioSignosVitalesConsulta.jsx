'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Activity, Plus, X, AlertCircle } from 'lucide-react';

export default function FormularioSignosVitalesConsulta({ onChange, data }) {
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined);
  const [formData, setFormData] = useState(data || {
    temperatura: '',
    presionSistolica: '',
    presionDiastolica: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    saturacionOxigeno: '',
    peso: '',
    talla: '',
  });

  const handleToggle = (agregar) => {
    setQuiereAgregar(agregar);
    if (!agregar) {
      // Si dice que NO, enviamos null al padre
      onChange(null, true);
    } else {
      // Si dice que SÍ, enviamos el formulario actual
      onChange(formData, isComplete());
    }
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData, isComplete(newData));
  };

  const isComplete = (data = formData) => {
    // Para que sea válido, al menos debe tener algunos signos vitales básicos
    return (data.temperatura || data.presionSistolica || data.frecuenciaCardiaca);
  };

  if (!quiereAgregar) {
    return (
      <Card className="border-purple-200">
        <CardContent className="p-6 text-center">
          <Activity className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">¿Desea registrar signos vitales en esta consulta?</p>
          <Button 
            onClick={() => handleToggle(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sí, agregar signos vitales
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200">
      <CardHeader className="bg-purple-50">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Activity className="h-5 w-5" />
          Signos Vitales (Opcional)
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
              Complete al menos temperatura, presión arterial o frecuencia cardíaca
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="temperatura">Temperatura (°C)</Label>
            <Input
              id="temperatura"
              type="number"
              step="0.1"
              value={formData.temperatura}
              onChange={(e) => handleChange('temperatura', e.target.value)}
              placeholder="36.5"
            />
          </div>

          <div>
            <Label htmlFor="saturacion">Saturación O₂ (%)</Label>
            <Input
              id="saturacion"
              type="number"
              value={formData.saturacionOxigeno}
              onChange={(e) => handleChange('saturacionOxigeno', e.target.value)}
              placeholder="98"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="presionSistolica">Presión Sistólica (mmHg)</Label>
            <Input
              id="presionSistolica"
              type="number"
              value={formData.presionSistolica}
              onChange={(e) => handleChange('presionSistolica', e.target.value)}
              placeholder="120"
            />
          </div>

          <div>
            <Label htmlFor="presionDiastolica">Presión Diastólica (mmHg)</Label>
            <Input
              id="presionDiastolica"
              type="number"
              value={formData.presionDiastolica}
              onChange={(e) => handleChange('presionDiastolica', e.target.value)}
              placeholder="80"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="frecuenciaCardiaca">Frecuencia Cardíaca (lpm)</Label>
            <Input
              id="frecuenciaCardiaca"
              type="number"
              value={formData.frecuenciaCardiaca}
              onChange={(e) => handleChange('frecuenciaCardiaca', e.target.value)}
              placeholder="72"
            />
          </div>

          <div>
            <Label htmlFor="frecuenciaRespiratoria">Frecuencia Respiratoria (rpm)</Label>
            <Input
              id="frecuenciaRespiratoria"
              type="number"
              value={formData.frecuenciaRespiratoria}
              onChange={(e) => handleChange('frecuenciaRespiratoria', e.target.value)}
              placeholder="16"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="peso">Peso (kg)</Label>
            <Input
              id="peso"
              type="number"
              step="0.1"
              value={formData.peso}
              onChange={(e) => handleChange('peso', e.target.value)}
              placeholder="70.5"
            />
          </div>

          <div>
            <Label htmlFor="talla">Talla (cm)</Label>
            <Input
              id="talla"
              type="number"
              step="0.1"
              value={formData.talla}
              onChange={(e) => handleChange('talla', e.target.value)}
              placeholder="170"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
