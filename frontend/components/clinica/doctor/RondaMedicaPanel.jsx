'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  User,
  BedDouble,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Stethoscope,
  Save,
  SkipForward,
  Check,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiPost, apiGet } from '@/services/api';

// Turnos
const TURNOS = [
  { value: 'Mañana', label: 'Mañana' },
  { value: 'Tarde', label: 'Tarde' },
  { value: 'Noche', label: 'Noche' },
];

const getTurnoActual = () => {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 14) return 'Mañana';
  if (hora >= 14 && hora < 22) return 'Tarde';
  return 'Noche';
};

export default function RondaMedicaPanel({
  admisiones,
  user,
  onClose,
  onComplete,
}) {
  const { toast } = useToast();
  const [step, setStep] = useState('seleccion'); // 'seleccion', 'ronda', 'resumen'
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completedRondas, setCompletedRondas] = useState([]);
  const [skippedPatients, setSkippedPatients] = useState([]);

  // Formulario de la ronda actual
  const [formData, setFormData] = useState({
    subjetivo: '',
    objetivo: '',
    analisis: '',
    plan: '',
    turno: getTurnoActual(),
  });

  // Filtrar pacientes que necesitan ronda (sin evolución del día)
  const pacientesPendientes = admisiones.filter(a => {
    const ultimaEvolucion = a.evolucionesClinicas?.[0];
    if (!ultimaEvolucion) return true;
    const fechaEvolucion = new Date(ultimaEvolucion.fechaEvolucion);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaEvolucion < hoy;
  });

  // Toggle selección de paciente
  const togglePatient = (admision) => {
    setSelectedPatients(prev => {
      const exists = prev.find(p => p.id === admision.id);
      if (exists) {
        return prev.filter(p => p.id !== admision.id);
      }
      return [...prev, admision];
    });
  };

  // Seleccionar todos
  const selectAll = () => {
    if (selectedPatients.length === pacientesPendientes.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients([...pacientesPendientes]);
    }
  };

  // Iniciar ronda
  const startRonda = () => {
    if (selectedPatients.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Seleccione pacientes',
        description: 'Debe seleccionar al menos un paciente para la ronda.',
      });
      return;
    }
    setStep('ronda');
    setCurrentIndex(0);
    resetForm();
  };

  // Reset formulario
  const resetForm = () => {
    setFormData({
      subjetivo: '',
      objetivo: '',
      analisis: '',
      plan: '',
      turno: getTurnoActual(),
    });
  };

  // Guardar evolución actual
  const saveCurrentEvolution = async () => {
    const admision = selectedPatients[currentIndex];

    if (!formData.subjetivo || !formData.objetivo || !formData.analisis || !formData.plan) {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Complete todos los campos SOAP.',
      });
      return false;
    }

    setLoading(true);
    try {
      const response = await apiPost('/evoluciones', {
        paciente_id: admision.paciente.id,
        admision_id: admision.id,
        tipo_evolucion: 'Seguimiento',
        turno: formData.turno,
        area_hospitalizacion: admision.unidad?.nombre || 'Hospitalización',
        subjetivo: formData.subjetivo,
        objetivo: formData.objetivo,
        analisis: formData.analisis,
        plan: formData.plan,
      });

      if (response.success) {
        // Firmar automáticamente
        if (response.data?.id) {
          await apiPost(`/evoluciones/${response.data.id}/administrar`, {
            accion: 'firmar',
          });
        }

        setCompletedRondas(prev => [...prev, {
          admision,
          saved: true,
        }]);

        return true;
      }
    } catch (error) {
      console.error('Error saving evolution:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la evolución.',
      });
      return false;
    } finally {
      setLoading(false);
    }
    return false;
  };

  // Siguiente paciente
  const nextPatient = async () => {
    const saved = await saveCurrentEvolution();
    if (saved) {
      if (currentIndex < selectedPatients.length - 1) {
        setCurrentIndex(prev => prev + 1);
        resetForm();
      } else {
        setStep('resumen');
      }
    }
  };

  // Saltar paciente
  const skipPatient = () => {
    setSkippedPatients(prev => [...prev, selectedPatients[currentIndex]]);
    if (currentIndex < selectedPatients.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetForm();
    } else {
      setStep('resumen');
    }
  };

  // Finalizar ronda
  const finishRonda = () => {
    toast({
      title: 'Ronda completada',
      description: `Se registraron ${completedRondas.length} evoluciones.`,
    });
    if (onComplete) onComplete();
    onClose();
  };

  // Calcular progreso
  const progress = selectedPatients.length > 0
    ? ((currentIndex + (step === 'resumen' ? 1 : 0)) / selectedPatients.length) * 100
    : 0;

  // Días de estancia
  const calcularDiasEstancia = (fechaIngreso) => {
    if (!fechaIngreso) return 0;
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    return Math.floor((hoy - ingreso) / (1000 * 60 * 60 * 24));
  };

  // Paciente actual
  const currentPatient = selectedPatients[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-emerald-600" />
                Ronda Médica
              </h1>
              {step !== 'seleccion' && (
                <p className="text-sm text-gray-500">
                  Paciente {currentIndex + 1} de {selectedPatients.length}
                </p>
              )}
            </div>
          </div>

          {step !== 'seleccion' && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Progreso</p>
              <Progress value={progress} className="w-32 h-2" />
            </div>
          )}
        </div>

        {/* PASO 1: Selección de pacientes */}
        {step === 'seleccion' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Seleccionar Pacientes</span>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedPatients.length === pacientesPendientes.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pacientesPendientes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-2" />
                  <p>Todos los pacientes tienen evolución del día</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {pacientesPendientes.map((admision) => {
                      const isSelected = selectedPatients.some(p => p.id === admision.id);
                      const dias = calcularDiasEstancia(admision.fechaIngreso);

                      return (
                        <div
                          key={admision.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50 border-emerald-300' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => togglePatient(admision)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isSelected} />
                            <div className="flex-1">
                              <p className="font-medium">
                                {admision.paciente?.nombre} {admision.paciente?.apellido}
                              </p>
                              <p className="text-sm text-gray-500">
                                {admision.diagnosticoIngreso}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-gray-600">
                                {admision.unidad?.nombre} - Cama {admision.cama?.numero}
                              </p>
                              <Badge variant={dias > 7 ? 'destructive' : dias > 3 ? 'warning' : 'secondary'}>
                                {dias} días
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={startRonda} disabled={selectedPatients.length === 0}>
                      <Activity className="h-4 w-4 mr-2" />
                      Iniciar Ronda ({selectedPatients.length})
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* PASO 2: Formulario de ronda */}
        {step === 'ronda' && currentPatient && (
          <>
            {/* Info del paciente */}
            <Card className="mb-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">
                      {currentPatient.paciente?.nombre} {currentPatient.paciente?.apellido}
                    </h3>
                    <p className="text-sm text-gray-600">{currentPatient.diagnosticoIngreso}</p>
                    {currentPatient.paciente?.alergias && (
                      <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        Alergias: {currentPatient.paciente.alergias}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge>
                      <BedDouble className="h-3 w-3 mr-1" />
                      {currentPatient.unidad?.nombre} - Cama {currentPatient.cama?.numero}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {calcularDiasEstancia(currentPatient.fechaIngreso)} días de estancia
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulario SOAP */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Label>Turno:</Label>
                  <Select
                    value={formData.turno}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, turno: v }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TURNOS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-blue-700 font-semibold">S - Subjetivo</Label>
                    <Textarea
                      value={formData.subjetivo}
                      onChange={(e) => setFormData(prev => ({ ...prev, subjetivo: e.target.value }))}
                      placeholder="Lo que refiere el paciente..."
                      className="mt-1 bg-blue-50/30 border-blue-200"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-green-700 font-semibold">O - Objetivo</Label>
                    <Textarea
                      value={formData.objetivo}
                      onChange={(e) => setFormData(prev => ({ ...prev, objetivo: e.target.value }))}
                      placeholder="Hallazgos del examen físico..."
                      className="mt-1 bg-green-50/30 border-green-200"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-amber-700 font-semibold">A - Análisis</Label>
                    <Textarea
                      value={formData.analisis}
                      onChange={(e) => setFormData(prev => ({ ...prev, analisis: e.target.value }))}
                      placeholder="Interpretación clínica..."
                      className="mt-1 bg-amber-50/30 border-amber-200"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-purple-700 font-semibold">P - Plan</Label>
                    <Textarea
                      value={formData.plan}
                      onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                      placeholder="Plan de manejo..."
                      className="mt-1 bg-purple-50/30 border-purple-200"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <Button variant="ghost" onClick={skipPatient}>
                    <SkipForward className="h-4 w-4 mr-2" />
                    Saltar
                  </Button>

                  <div className="flex gap-2">
                    {currentIndex > 0 && (
                      <Button variant="outline" onClick={() => setCurrentIndex(prev => prev - 1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>
                    )}
                    <Button onClick={nextPatient} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : currentIndex === selectedPatients.length - 1 ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      {currentIndex === selectedPatients.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* PASO 3: Resumen */}
        {step === 'resumen' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Ronda Completada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Completados */}
                {completedRondas.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">
                      Evoluciones registradas ({completedRondas.length})
                    </h4>
                    <div className="space-y-1">
                      {completedRondas.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          {item.admision.paciente?.nombre} {item.admision.paciente?.apellido}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saltados */}
                {skippedPatients.length > 0 && (
                  <div>
                    <h4 className="font-medium text-amber-700 mb-2">
                      Pacientes omitidos ({skippedPatients.length})
                    </h4>
                    <div className="space-y-1">
                      {skippedPatients.map((admision, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                          <X className="h-4 w-4 text-amber-600" />
                          {admision.paciente?.nombre} {admision.paciente?.apellido}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <Button onClick={finishRonda}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Terminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
