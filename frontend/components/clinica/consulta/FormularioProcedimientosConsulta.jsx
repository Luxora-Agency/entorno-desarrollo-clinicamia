'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Stethoscope, Plus, X, AlertCircle } from 'lucide-react';

export default function FormularioProcedimientosConsulta({ onChange, data }) {
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined);
  const [formData, setFormData] = useState(data || {
    nombre: '',
    descripcion: '',
    indicacion: '',
    observaciones: '',
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
    return data.nombre.trim() && data.descripcion.trim();
  };

  if (!quiereAgregar) {
    return (
      <Card className="border-indigo-200">
        <CardContent className="p-6 text-center">
          <Stethoscope className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">¿Desea registrar un procedimiento realizado?</p>
          <Button 
            onClick={() => handleToggle(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sí, agregar procedimiento
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200">
      <CardHeader className="bg-indigo-50">
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <Stethoscope className="h-5 w-5" />
          Procedimiento (Opcional)
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
              Complete el nombre y descripción del procedimiento
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="nombre">Nombre del Procedimiento</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Ej: Sutura simple"
            className={!formData.nombre.trim() ? 'border-red-300' : ''}
          />
        </div>

        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Detalle del procedimiento realizado..."
            rows={3}
            className={!formData.descripcion.trim() ? 'border-red-300' : ''}
          />
        </div>

        <div>
          <Label htmlFor="indicacion">Indicación</Label>
          <Textarea
            id="indicacion"
            value={formData.indicacion}
            onChange={(e) => handleChange('indicacion', e.target.value)}
            placeholder="Motivo o razón del procedimiento..."
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => handleChange('observaciones', e.target.value)}
            placeholder="Notas adicionales..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
