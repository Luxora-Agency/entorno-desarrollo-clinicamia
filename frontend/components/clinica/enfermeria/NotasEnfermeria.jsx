'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, FileText, Clipboard } from 'lucide-react';

export default function NotasEnfermeria({ pacienteId, admisionId, user }) {
  const { toast } = useToast();
  const [notas, setNotas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [form, setForm] = useState({
    tipo: 'Evolucion',
    nota: '',
    plantillaId: ''
  });

  useEffect(() => {
    if (pacienteId) {
        loadNotas();
        loadPlantillas();
    }
  }, [pacienteId]);

  const loadNotas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notas-enfermeria?pacienteId=${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotas(data.data.notas || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadPlantillas = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plantillas-notas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPlantillas(data.data || []);
        }
      } catch (error) {
        console.error(error);
      }
  };

  const handlePlantillaChange = (id) => {
      const plantilla = plantillas.find(p => p.id === id);
      if (plantilla) {
          setForm(prev => ({ ...prev, plantillaId: id, nota: plantilla.contenido, tipo: plantilla.tipoNota }));
      }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notas-enfermeria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: pacienteId,
          admision_id: admisionId,
          enfermera_id: user?.id,
          tipo_nota: form.tipo,
          contenido: form.nota,
          turno: 'Tarde', // TODO: Detect shift dynamically
          requiere_seguimiento: false
        })
      });

      if (response.ok) {
        toast({ description: 'Nota guardada' });
        setForm({ tipo: 'Evolucion', nota: '', plantillaId: '' });
        loadNotas();
      } else {
        toast({ description: 'Error al guardar', variant: 'destructive' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Formulario */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Nueva Nota
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Plantilla</Label>
            <Select value={form.plantillaId} onValueChange={handlePlantillaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plantilla..." />
              </SelectTrigger>
              <SelectContent>
                {plantillas.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(val) => setForm({...form, tipo: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Evolucion">Evolución</SelectItem>
                <SelectItem value="Observacion">Observación</SelectItem>
                <SelectItem value="Procedimiento">Procedimiento</SelectItem>
                <SelectItem value="Incidente">Incidente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Contenido</Label>
            <Textarea 
              value={form.nota} 
              onChange={(e) => setForm({...form, nota: e.target.value})}
              className="h-64"
              placeholder="Escriba la nota aquí..."
            />
          </div>
          <Button onClick={handleSubmit} className="w-full bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            Guardar Nota
          </Button>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Historial de Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {notas.map(nota => (
              <div key={nota.id} className="border p-4 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-purple-700">{nota.tipoNota}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(nota.fechaHora).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs bg-white border px-2 py-1 rounded">
                    {nota.enfermera?.nombre} {nota.enfermera?.apellido}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{nota.contenido}</p>
              </div>
            ))}
            {notas.length === 0 && <p className="text-center text-gray-500">No hay notas registradas</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
