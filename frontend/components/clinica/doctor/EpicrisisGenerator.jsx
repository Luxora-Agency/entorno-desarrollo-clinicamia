'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Download, Save, Printer, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PatientContextBar from './PatientContextBar';

export default function EpicrisisGenerator({ admisionId, paciente, onClose }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Edición, 2: Vista Previa
  const [formData, setFormData] = useState({
    tipo_egreso: 'AltaMedica',
    diagnostico_salida: '', // Debería ser un código CIE-11
    descripcion_diagnostico: '',
    resumen_clinico: '',
    tratamiento_domiciliario: '',
    recomendaciones: '',
    estado_paciente: 'Mejorado',
    requiere_control: false,
    fecha_control: '',
    observaciones: ''
  });

  // Cargar datos preliminares de la admisión si existen
  useEffect(() => {
    // Aquí se podría hacer un fetch para precargar el diagnóstico de ingreso o evoluciones
    // Simulación:
    if (paciente) {
        setFormData(prev => ({
            ...prev,
            resumen_clinico: `Paciente ${paciente.nombre} ${paciente.apellido} ingresado por...`
        }));
    }
  }, [paciente]);

  const handleGenerate = async () => {
    if (!formData.diagnostico_salida || !formData.resumen_clinico) {
        toast({ variant: 'destructive', title: 'Error', description: 'Complete los campos obligatorios.' });
        return;
    }
    setStep(2);
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        
        // Simular ID de profesional (en prod vendría del contexto de usuario)
        const doctorId = "00000000-0000-0000-0000-000000000000"; // Placeholder

        const payload = {
            admision_id: admisionId,
            ...formData,
            profesional_responsable_id: doctorId,
            fecha_egreso: new Date().toISOString()
        };

        // En un caso real, POST a /api/egresos
        // const res = await fetch(`${apiUrl}/egresos`, { ... });
        
        // Simulación de éxito
        await new Promise(r => setTimeout(r, 1000));
        
        toast({ title: 'Epicrisis Generada', description: 'El documento se ha firmado digitalmente y guardado.' });
        if (onClose) onClose();

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar la epicrisis.' });
    } finally {
        setLoading(false);
    }
  };

  if (step === 2) {
    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-xl my-8 border">
            <div className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">EPICRISIS CLÍNICA</h1>
                <p className="text-gray-500">Clínica Mía - Nit: 900.000.000-1</p>
                <p className="text-sm text-gray-400">Documento Generado: {new Date().toLocaleString()}</p>
            </div>

            <PatientContextBar paciente={paciente} compact />

            <div className="grid grid-cols-2 gap-8 mt-6">
                <div>
                    <h3 className="font-bold text-gray-700">Tipo de Egreso</h3>
                    <p>{formData.tipo_egreso}</p>
                </div>
                <div>
                    <h3 className="font-bold text-gray-700">Estado al Egreso</h3>
                    <p>{formData.estado_paciente}</p>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="font-bold text-gray-700 border-b mb-2">Diagnóstico de Salida</h3>
                <p className="font-mono text-sm bg-gray-50 p-2 rounded">{formData.diagnostico_salida} - {formData.descripcion_diagnostico}</p>
            </div>

            <div className="mt-6">
                <h3 className="font-bold text-gray-700 border-b mb-2">Resumen Clínico</h3>
                <p className="whitespace-pre-wrap text-sm">{formData.resumen_clinico}</p>
            </div>

            <div className="mt-6">
                <h3 className="font-bold text-gray-700 border-b mb-2">Plan de Manejo y Recomendaciones</h3>
                <div className="bg-blue-50 p-4 rounded-md text-sm space-y-2">
                    <p><strong>Tratamiento:</strong> {formData.tratamiento_domiciliario || 'N/A'}</p>
                    <p><strong>Recomendaciones:</strong> {formData.recomendaciones || 'N/A'}</p>
                    {formData.requiere_control && (
                        <p className="text-blue-700 font-semibold">
                            Requiere control el día: {formData.fecha_control}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-8 border-t flex justify-between items-center no-print">
                <Button variant="outline" onClick={() => setStep(1)}>
                    Volver a Editar
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                    </Button>
                    <Button onClick={handleFinalize} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" />
                        Firmar y Finalizar
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Generación de Epicrisis
        </CardTitle>
        <PatientContextBar paciente={paciente} compact />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Tipo de Egreso <span className="text-red-500">*</span></Label>
                <Select 
                    value={formData.tipo_egreso} 
                    onValueChange={(v) => setFormData({...formData, tipo_egreso: v})}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AltaMedica">Alta Médica</SelectItem>
                        <SelectItem value="Remision">Remisión</SelectItem>
                        <SelectItem value="Voluntario">Retiro Voluntario</SelectItem>
                        <SelectItem value="Fallecimiento">Fallecimiento</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Estado del Paciente <span className="text-red-500">*</span></Label>
                <Select 
                    value={formData.estado_paciente} 
                    onValueChange={(v) => setFormData({...formData, estado_paciente: v})}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Mejorado">Mejorado</SelectItem>
                        <SelectItem value="Estable">Estable</SelectItem>
                        <SelectItem value="Complicado">Complicado</SelectItem>
                        <SelectItem value="Fallecido">Fallecido</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="space-y-2">
            <Label>Diagnóstico de Salida (CIE-11) <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
                <Input 
                    placeholder="Código (ej: CA40.0)" 
                    value={formData.diagnostico_salida}
                    onChange={(e) => setFormData({...formData, diagnostico_salida: e.target.value})}
                    className="w-32"
                />
                <Input 
                    placeholder="Descripción del diagnóstico" 
                    value={formData.descripcion_diagnostico}
                    onChange={(e) => setFormData({...formData, descripcion_diagnostico: e.target.value})}
                    className="flex-1"
                />
            </div>
        </div>

        <div className="space-y-2">
            <Label>Resumen Clínico de la Atención <span className="text-red-500">*</span></Label>
            <Textarea 
                placeholder="Describa la evolución del paciente durante la estancia..."
                value={formData.resumen_clinico}
                onChange={(e) => setFormData({...formData, resumen_clinico: e.target.value})}
                rows={6}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Tratamiento Domiciliario</Label>
                <Textarea 
                    placeholder="Medicamentos e indicaciones..."
                    value={formData.tratamiento_domiciliario}
                    onChange={(e) => setFormData({...formData, tratamiento_domiciliario: e.target.value})}
                    rows={4}
                />
            </div>
            <div className="space-y-2">
                <Label>Recomendaciones y Signos de Alarma</Label>
                <Textarea 
                    placeholder="Dieta, actividad física, cuándo volver a urgencias..."
                    value={formData.recomendaciones}
                    onChange={(e) => setFormData({...formData, recomendaciones: e.target.value})}
                    rows={4}
                />
            </div>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
                <input 
                    type="checkbox" 
                    id="control"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.requiere_control}
                    onChange={(e) => setFormData({...formData, requiere_control: e.target.checked})}
                />
                <Label htmlFor="control">Requiere Control Médico</Label>
            </div>
            
            {formData.requiere_control && (
                <div className="flex items-center gap-2">
                    <Label>Fecha:</Label>
                    <Input 
                        type="date" 
                        value={formData.fecha_control}
                        onChange={(e) => setFormData({...formData, fecha_control: e.target.value})}
                    />
                </div>
            )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleGenerate} className="bg-blue-600">
                <FileText className="h-4 w-4 mr-2" />
                Generar Vista Previa
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
