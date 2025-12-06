'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  FileText, 
  Clock, 
  User,
  CheckCircle2,
  Stethoscope,
  AlertCircle
} from 'lucide-react';

export default function TabEvolucionesSOAP({ pacienteId, paciente, user }) {
  const [evoluciones, setEvoluciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subjetivo: '',
    objetivo: '',
    analisis: '',
    plan: '',
  });

  useEffect(() => {
    if (pacienteId) {
      loadEvoluciones();
    }
  }, [pacienteId]);

  const loadEvoluciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/evoluciones?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setEvoluciones(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando evoluciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subjetivo || !formData.objetivo || !formData.analisis || !formData.plan) {
      alert('Todos los campos SOAP son obligatorios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const payload = {
        paciente_id: pacienteId,
        profesional_id: user?.id,
        subjetivo: formData.subjetivo,
        objetivo: formData.objetivo,
        analisis: formData.analisis,
        plan: formData.plan,
      };

      const response = await fetch(`${apiUrl}/evoluciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        loadEvoluciones();
        alert('Evolución clínica registrada exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'No se pudo guardar la evolución'}`);
      }
    } catch (error) {
      console.error('Error al guardar evolución:', error);
      alert('Error al guardar la evolución');
    }
  };

  const resetForm = () => {
    setFormData({
      subjetivo: '',
      objetivo: '',
      analisis: '',
      plan: '',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con Botón */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Evoluciones Clínicas SOAP</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Documentación de la evolución del paciente según metodología SOAP
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Evolución SOAP
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Registrar Evolución Clínica SOAP
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información del Paciente */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">Paciente:</span> {paciente?.nombre} {paciente?.apellido}
                        </div>
                        <div>
                          <span className="font-semibold">Cédula:</span> {paciente?.cedula}
                        </div>
                        <div>
                          <span className="font-semibold">Profesional:</span> {user?.nombre} {user?.apellido}
                        </div>
                        <div>
                          <span className="font-semibold">Fecha:</span> {new Date().toLocaleDateString('es-CO')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Campos SOAP */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subjetivo" className="text-base font-semibold flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">S</span>
                        Subjetivo
                      </Label>
                      <p className="text-xs text-gray-600 mb-2">
                        Síntomas reportados por el paciente, quejas, historia clínica relevante
                      </p>
                      <Textarea
                        id="subjetivo"
                        value={formData.subjetivo}
                        onChange={(e) => setFormData({ ...formData, subjetivo: e.target.value })}
                        rows={4}
                        className="resize-none"
                        placeholder="Ej: Paciente refiere dolor en región lumbar de 3 días de evolución..."
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="objetivo" className="text-base font-semibold flex items-center gap-2">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">O</span>
                        Objetivo
                      </Label>
                      <p className="text-xs text-gray-600 mb-2">
                        Hallazgos del examen físico, signos vitales, resultados de laboratorio
                      </p>
                      <Textarea
                        id="objetivo"
                        value={formData.objetivo}
                        onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                        rows={4}
                        className="resize-none"
                        placeholder="Ej: TA: 120/80, FC: 72 lpm, Examen físico: dolor a la palpación en L4-L5..."
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="analisis" className="text-base font-semibold flex items-center gap-2">
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">A</span>
                        Análisis
                      </Label>
                      <p className="text-xs text-gray-600 mb-2">
                        Diagnóstico o impresión clínica, evaluación del estado del paciente
                      </p>
                      <Textarea
                        id="analisis"
                        value={formData.analisis}
                        onChange={(e) => setFormData({ ...formData, analisis: e.target.value })}
                        rows={3}
                        className="resize-none"
                        placeholder="Ej: Lumbalgia mecánica aguda, sin signos de compromiso neurológico..."
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="plan" className="text-base font-semibold flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">P</span>
                        Plan
                      </Label>
                      <p className="text-xs text-gray-600 mb-2">
                        Tratamiento, exámenes adicionales, seguimiento, recomendaciones
                      </p>
                      <Textarea
                        id="plan"
                        value={formData.plan}
                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                        rows={4}
                        className="resize-none"
                        placeholder="Ej: 1. Analgesia con AINE 2. Fisioterapia 3. Control en 7 días..."
                        required
                      />
                    </div>
                  </div>

                  {/* Alert de firma digital */}
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Esta evolución quedará registrada con firma digital automática según normativa colombiana.
                        No podrá ser modificada una vez guardada.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Botones */}
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Guardar Evolución
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Tabla de Evoluciones */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-center text-gray-600 py-8">Cargando evoluciones...</p>
          ) : evoluciones.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay evoluciones registradas</p>
              <p className="text-sm text-gray-500">
                Haz clic en "Nueva Evolución SOAP" para crear la primera nota clínica
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {evoluciones.map((evolucion) => (
                <Card key={evolucion.id} className="border-2 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Header de la evolución */}
                    <div className="flex items-start justify-between mb-4 pb-3 border-b">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {evolucion.profesional?.nombre || 'N/A'} {evolucion.profesional?.apellido || ''}
                          </p>
                          <p className="text-sm text-gray-600">
                            {evolucion.profesional?.especialidad || 'Profesional de salud'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {formatDate(evolucion.createdAt)}
                        </div>
                        {evolucion.firma_digital && (
                          <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Firmado digitalmente
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Contenido SOAP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">S</span>
                          <span className="font-semibold text-gray-700">Subjetivo</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {evolucion.subjetivo}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-bold">O</span>
                          <span className="font-semibold text-gray-700">Objetivo</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {evolucion.objetivo}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm font-bold">A</span>
                          <span className="font-semibold text-gray-700">Análisis</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {evolucion.analisis}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-bold">P</span>
                          <span className="font-semibold text-gray-700">Plan</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {evolucion.plan}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
