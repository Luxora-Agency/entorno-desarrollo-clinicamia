'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Plus, X, AlertCircle, Sparkles } from 'lucide-react';

// Diagnósticos CIE-11 más comunes en consulta general
const DIAGNOSTICOS_COMUNES = [
  { codigo: 'CA40.0', descripcion: 'Infección aguda de las vías respiratorias superiores' },
  { codigo: 'DA00', descripcion: 'Cefalea primaria' },
  { codigo: 'DA01', descripcion: 'Migraña' },
  { codigo: 'DD90', descripcion: 'Gastritis aguda' },
  { codigo: 'DD91', descripcion: 'Dispepsia funcional' },
  { codigo: 'BA00', descripcion: 'Hipertensión arterial esencial' },
  { codigo: 'CA08.0', descripcion: 'Faringitis aguda' },
  { codigo: 'CA08.1', descripcion: 'Amigdalitis aguda' },
  { codigo: '5A11', descripcion: 'Diabetes mellitus tipo 2' },
  { codigo: 'ME84.0', descripcion: 'Dorsalgia' },
  { codigo: 'ME84.2', descripcion: 'Lumbalgia' },
  { codigo: 'MG30.0', descripcion: 'Dermatitis de contacto alérgica' },
  { codigo: 'CA40.2', descripcion: 'Rinofaringitis aguda (resfriado común)' },
  { codigo: 'DD92', descripcion: 'Síndrome de intestino irritable' },
  { codigo: '6A70', descripcion: 'Trastornos de ansiedad' },
  { codigo: '6A70.0', descripcion: 'Trastorno de ansiedad generalizada' },
  { codigo: 'MB23.4', descripcion: 'Infección de vías urinarias' },
  { codigo: 'CA40.1', descripcion: 'Sinusitis aguda' },
];

export default function FormularioDiagnosticoConsulta({ onChange, data }) {
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined);
  const [formData, setFormData] = useState(data || {
    codigoCIE11: '',
    descripcionCIE11: '',
    tipoDiagnostico: 'Principal',
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

  const seleccionarDiagnosticoComun = (diagnostico) => {
    const newData = {
      ...formData,
      codigoCIE11: diagnostico.codigo,
      descripcionCIE11: diagnostico.descripcion,
    };
    setFormData(newData);
    onChange(newData, isComplete(newData));
  };

  const isComplete = (data = formData) => {
    return data.codigoCIE11.trim() && data.descripcionCIE11.trim();
  };

  if (!quiereAgregar) {
    return (
      <Card className="border-pink-200">
        <CardContent className="p-6 text-center">
          <ClipboardList className="h-12 w-12 text-pink-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">¿Desea registrar un diagnóstico CIE-11?</p>
          <Button 
            onClick={() => handleToggle(true)}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sí, agregar diagnóstico
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-pink-200">
      <CardHeader className="bg-pink-50">
        <CardTitle className="flex items-center gap-2 text-pink-900">
          <ClipboardList className="h-5 w-5" />
          Diagnóstico CIE-11 (Opcional)
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
              Complete el código CIE-11 y la descripción
            </p>
          </div>
        )}

        {/* Diagnósticos Comunes */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <Label className="text-indigo-900 font-semibold">Diagnósticos Frecuentes (Selección Rápida)</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {DIAGNOSTICOS_COMUNES.map((diag, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => seleccionarDiagnosticoComun(diag)}
                className="justify-start text-left h-auto py-2 px-3 hover:bg-indigo-100 hover:border-indigo-400"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-indigo-700 font-bold">{diag.codigo}</span>
                  <span className="text-xs text-gray-700">{diag.descripcion}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <Label className="text-gray-700 font-semibold mb-3 block">O ingrese manualmente:</Label>
        </div>

        <div>
          <Label htmlFor="codigoCIE11">Código CIE-11</Label>
          <Input
            id="codigoCIE11"
            value={formData.codigoCIE11}
            onChange={(e) => handleChange('codigoCIE11', e.target.value)}
            placeholder="Ej: 8A62.0"
            className={!formData.codigoCIE11.trim() ? 'border-red-300' : ''}
          />
        </div>

        <div>
          <Label htmlFor="descripcionCIE11">Descripción del Diagnóstico</Label>
          <Textarea
            id="descripcionCIE11"
            value={formData.descripcionCIE11}
            onChange={(e) => handleChange('descripcionCIE11', e.target.value)}
            placeholder="Ej: Hipertensión arterial esencial"
            rows={3}
            className={!formData.descripcionCIE11.trim() ? 'border-red-300' : ''}
          />
        </div>

        <div>
          <Label htmlFor="tipoDiagnostico">Tipo de Diagnóstico</Label>
          <Select
            value={formData.tipoDiagnostico}
            onValueChange={(value) => handleChange('tipoDiagnostico', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Principal">Principal</SelectItem>
              <SelectItem value="Relacionado">Relacionado</SelectItem>
              <SelectItem value="Complicacion">Complicación</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => handleChange('observaciones', e.target.value)}
            placeholder="Información adicional..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
