'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Save, History, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AnamnesisForm({ pacienteId, initialData, onSave }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    antecedentes_patologicos: '',
    antecedentes_quirurgicos: '',
    antecedentes_familiares: '',
    antecedentes_toxicos: '',
    antecedentes_alergicos: '',
    medicamentos_actuales: '',
    habitos: ''
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Aquí iría la llamada al backend para guardar
      // En este caso, simulamos o pasamos al padre
      if (onSave) {
        await onSave(formData);
      } else {
        // Fallback: update patient directly via API
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        
        // Mapeamos los campos del formulario a los campos del modelo Paciente
        // Nota: Algunos campos pueden necesitar un mapeo específico o guardarse en un JSON
        const patientUpdateData = {
            enfermedades_cronicas: formData.antecedentes_patologicos,
            antecedentes_quirurgicos: formData.antecedentes_quirurgicos,
            alergias: formData.antecedentes_alergicos,
            medicamentos_actuales: formData.medicamentos_actuales,
            // Otros campos podrían guardarse en observaciones o un campo JSON si existiera
        };

        const res = await fetch(`${apiUrl}/pacientes/${pacienteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(patientUpdateData)
        });

        if (!res.ok) throw new Error('Error al guardar antecedentes');
      }

      toast({ title: 'Guardado', description: 'La anamnesis se ha actualizado correctamente.' });
      setHasChanges(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la información.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            Anamnesis y Antecedentes
          </h2>
          <p className="text-sm text-gray-500">
            Historia clínica detallada del paciente.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Antecedentes Médicos */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">Antecedentes Médicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patologicos">Patológicos (Enfermedades Crónicas)</Label>
              <Textarea 
                id="patologicos"
                value={formData.antecedentes_patologicos}
                onChange={(e) => handleChange('antecedentes_patologicos', e.target.value)}
                placeholder="Diabetes, Hipertensión, Asma..."
                className="mt-1 bg-blue-50/50"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="quirurgicos">Quirúrgicos</Label>
              <Textarea 
                id="quirurgicos"
                value={formData.antecedentes_quirurgicos}
                onChange={(e) => handleChange('antecedentes_quirurgicos', e.target.value)}
                placeholder="Apendicectomía (2010), etc."
                className="mt-1 bg-blue-50/50"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="alergicos" className="text-red-700 font-semibold flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Alérgicos
              </Label>
              <Textarea 
                id="alergicos"
                value={formData.antecedentes_alergicos}
                onChange={(e) => handleChange('antecedentes_alergicos', e.target.value)}
                placeholder="Penicilina, AINES, Látex..."
                className="mt-1 bg-red-50 border-red-200"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Columna Derecha: Estilo de Vida y Otros */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">Estilo de Vida y Familia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="familiares">Familiares</Label>
              <Textarea 
                id="familiares"
                value={formData.antecedentes_familiares}
                onChange={(e) => handleChange('antecedentes_familiares', e.target.value)}
                placeholder="Padre: IAM, Madre: Diabetes..."
                className="mt-1 bg-green-50/50"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="toxicos">Tóxicos</Label>
              <Textarea 
                id="toxicos"
                value={formData.antecedentes_toxicos}
                onChange={(e) => handleChange('antecedentes_toxicos', e.target.value)}
                placeholder="Tabaquismo, Alcohol..."
                className="mt-1 bg-green-50/50"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="medicamentos">Medicamentos Actuales</Label>
              <Textarea 
                id="medicamentos"
                value={formData.medicamentos_actuales}
                onChange={(e) => handleChange('medicamentos_actuales', e.target.value)}
                placeholder="Losartán 50mg 1-0-0..."
                className="mt-1 bg-green-50/50"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
