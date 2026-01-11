'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Activity,
  FileText,
  Save,
  CheckCircle,
  Sparkles,
  ThermometerSun,
  Heart,
  Wind,
  Droplets,
  Scale,
  Loader2,
  BedDouble,
  Clock,
  Stethoscope,
  MessageSquare,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiPost, apiGet } from '@/services/api';

// Turnos disponibles
const TURNOS = [
  { value: 'Mañana', label: 'Mañana (6:00 - 14:00)' },
  { value: 'Tarde', label: 'Tarde (14:00 - 22:00)' },
  { value: 'Noche', label: 'Noche (22:00 - 6:00)' },
];

// Determinar turno actual automáticamente
const getTurnoActual = () => {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 14) return 'Mañana';
  if (hora >= 14 && hora < 22) return 'Tarde';
  return 'Noche';
};

export default function ModalEvolucionHospitalizacion({
  open,
  onOpenChange,
  admision,
  user,
  onSuccess,
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [activeTab, setActiveTab] = useState('soap');

  // Datos del formulario SOAP
  const [formData, setFormData] = useState({
    subjetivo: '',
    objetivo: '',
    analisis: '',
    plan: '',
    turno: getTurnoActual(),
  });

  // Signos vitales opcionales
  const [signosVitales, setSignosVitales] = useState({
    temperatura: '',
    presionSistolica: '',
    presionDiastolica: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    saturacionOxigeno: '',
    peso: '',
  });

  // Estado de IA
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiContext, setAiContext] = useState(null);

  // Cargar contexto del paciente para IA
  useEffect(() => {
    if (open && admision?.paciente?.id) {
      loadAIContext();
    }
  }, [open, admision?.paciente?.id]);

  const loadAIContext = async () => {
    try {
      const response = await apiGet(`/ai-assistant/patient-context/${admision.paciente.id}`);
      if (response.success) {
        setAiContext(response.data);
      }
    } catch (error) {
      console.error('Error loading AI context:', error);
    }
  };

  // Manejar cambios en formulario
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignosChange = (field, value) => {
    setSignosVitales(prev => ({ ...prev, [field]: value }));
  };

  // Validar formulario
  const isFormValid = () => {
    return formData.subjetivo.trim() &&
           formData.objetivo.trim() &&
           formData.analisis.trim() &&
           formData.plan.trim();
  };

  // Guardar evolución (borrador)
  const handleSave = async (firmar = false) => {
    if (!isFormValid()) {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Complete todos los campos SOAP antes de guardar.',
      });
      return;
    }

    setLoading(true);
    try {
      // Primero guardar signos vitales si hay datos
      const tieneSignos = Object.values(signosVitales).some(v => v !== '');
      if (tieneSignos) {
        await apiPost('/signos-vitales', {
          paciente_id: admision.paciente.id,
          admision_id: admision.id,
          ...Object.fromEntries(
            Object.entries(signosVitales)
              .filter(([_, v]) => v !== '')
              .map(([k, v]) => [k, parseFloat(v)])
          ),
          turno: formData.turno,
        });
      }

      // Crear evolución
      const evolucionData = {
        paciente_id: admision.paciente.id,
        admision_id: admision.id,
        tipo_evolucion: 'Seguimiento',
        turno: formData.turno,
        area_hospitalizacion: admision.unidad?.nombre || 'Hospitalización',
        subjetivo: formData.subjetivo,
        objetivo: formData.objetivo,
        analisis: formData.analisis,
        plan: formData.plan,
      };

      const response = await apiPost('/evoluciones', evolucionData);

      if (response.success) {
        // Si se pidió firmar, firmar la evolución
        if (firmar && response.data?.id) {
          await apiPost(`/evoluciones/${response.data.id}/administrar`, {
            accion: 'firmar',
          });
        }

        toast({
          title: firmar ? 'Evolución firmada' : 'Evolución guardada',
          description: `La evolución de ${admision.paciente?.nombre} ha sido ${firmar ? 'firmada' : 'guardada'} correctamente.`,
        });

        // Limpiar formulario
        setFormData({
          subjetivo: '',
          objetivo: '',
          analisis: '',
          plan: '',
          turno: getTurnoActual(),
        });
        setSignosVitales({
          temperatura: '',
          presionSistolica: '',
          presionDiastolica: '',
          frecuenciaCardiaca: '',
          frecuenciaRespiratoria: '',
          saturacionOxigeno: '',
          peso: '',
        });

        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error saving evolution:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo guardar la evolución.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener sugerencia de IA
  const handleAISuggest = async (type) => {
    setAiLoading(true);
    try {
      let prompt = '';

      switch (type) {
        case 'soap':
          prompt = `Genera una sugerencia de nota SOAP para el paciente hospitalizado con diagnóstico: ${admision.diagnosticoIngreso}.
                    ${aiContext ? `Contexto del paciente: ${JSON.stringify(aiContext)}` : ''}
                    El paciente lleva ${calcularDiasEstancia(admision.fechaIngreso)} días hospitalizado.
                    Genera los 4 campos: Subjetivo, Objetivo, Análisis y Plan de forma profesional y concisa.`;
          break;
        case 'plan':
          prompt = `Sugiere un plan de tratamiento para paciente hospitalizado con:
                    Diagnóstico: ${admision.diagnosticoIngreso}
                    Días hospitalizado: ${calcularDiasEstancia(admision.fechaIngreso)}
                    ${formData.analisis ? `Análisis actual: ${formData.analisis}` : ''}
                    Incluye: medicación, estudios, interconsultas, dieta y cuidados.`;
          break;
        case 'alertas':
          prompt = `Identifica posibles alertas clínicas y banderas rojas para paciente con:
                    Diagnóstico: ${admision.diagnosticoIngreso}
                    ${aiContext?.alergias ? `Alergias: ${aiContext.alergias}` : ''}
                    ${aiContext?.patologias ? `Patologías: ${aiContext.patologias}` : ''}
                    Lista signos de alarma a vigilar.`;
          break;
      }

      const response = await apiPost('/ai-assistant/chat', {
        messages: [
          { role: 'user', content: prompt }
        ],
        context: {
          patient: admision.paciente,
          admision: {
            id: admision.id,
            diagnostico: admision.diagnosticoIngreso,
            fechaIngreso: admision.fechaIngreso,
          },
        },
      });

      if (response.success && response.data?.response) {
        setAiSuggestion(response.data.response);
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      toast({
        variant: 'destructive',
        title: 'Error de IA',
        description: 'No se pudo obtener la sugerencia.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Aplicar sugerencia de IA al formulario
  const applyAISuggestion = () => {
    if (!aiSuggestion) return;

    // Intentar parsear la sugerencia SOAP
    const lines = aiSuggestion.split('\n');
    let currentField = '';
    let fieldContent = {};

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('subjetivo:') || lowerLine.includes('**subjetivo**')) {
        currentField = 'subjetivo';
        fieldContent[currentField] = line.replace(/.*subjetivo[:\*]*/i, '').trim();
      } else if (lowerLine.includes('objetivo:') || lowerLine.includes('**objetivo**')) {
        currentField = 'objetivo';
        fieldContent[currentField] = line.replace(/.*objetivo[:\*]*/i, '').trim();
      } else if (lowerLine.includes('análisis:') || lowerLine.includes('analisis:') || lowerLine.includes('**análisis**')) {
        currentField = 'analisis';
        fieldContent[currentField] = line.replace(/.*an[áa]lisis[:\*]*/i, '').trim();
      } else if (lowerLine.includes('plan:') || lowerLine.includes('**plan**')) {
        currentField = 'plan';
        fieldContent[currentField] = line.replace(/.*plan[:\*]*/i, '').trim();
      } else if (currentField && line.trim()) {
        fieldContent[currentField] = (fieldContent[currentField] || '') + ' ' + line.trim();
      }
    });

    // Aplicar campos encontrados
    if (Object.keys(fieldContent).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...fieldContent,
      }));
      toast({
        title: 'Sugerencia aplicada',
        description: 'Los campos SOAP han sido llenados con la sugerencia de IA. Revise y ajuste según sea necesario.',
      });
    } else {
      // Si no se pudo parsear, poner todo en subjetivo
      setFormData(prev => ({
        ...prev,
        subjetivo: aiSuggestion,
      }));
    }
  };

  const calcularDiasEstancia = (fechaIngreso) => {
    if (!fechaIngreso) return 0;
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    return Math.floor((hoy - ingreso) / (1000 * 60 * 60 * 24));
  };

  if (!admision) return null;

  const paciente = admision.paciente;
  const diasEstancia = calcularDiasEstancia(admision.fechaIngreso);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-6xl max-h-[90vh] overflow-hidden ${showAI ? 'pr-0' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            Nueva Evolución - Hospitalización
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-0">
          {/* Contenido principal */}
          <div className={`flex-1 overflow-y-auto pr-4 ${showAI ? 'max-w-[60%]' : ''}`} style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {/* Header del paciente */}
            <Card className="mb-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {paciente?.nombre} {paciente?.apellido}
                    </h3>
                    <p className="text-sm text-gray-600">
                      CC: {paciente?.cedula} | {paciente?.genero} | {paciente?.tipoSangre || 'Tipo sangre: --'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-white">
                      <BedDouble className="h-3 w-3 mr-1" />
                      {admision.unidad?.nombre} - Cama {admision.cama?.numero || '--'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {diasEstancia} días de estancia
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">Dx:</span>
                    <span className="text-gray-700">{admision.diagnosticoIngreso}</span>
                  </div>
                </div>

                {/* Alertas de alergias */}
                {paciente?.alergias && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium text-sm">Alergias:</span>
                      <span className="text-sm">{paciente.alergias}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs de contenido */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="soap" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Nota SOAP
                </TabsTrigger>
                <TabsTrigger value="signos" className="flex-1">
                  <Activity className="h-4 w-4 mr-2" />
                  Signos Vitales
                </TabsTrigger>
              </TabsList>

              {/* Tab SOAP */}
              <TabsContent value="soap" className="space-y-4 mt-4">
                {/* Selector de turno */}
                <div className="flex items-center gap-4">
                  <Label>Turno:</Label>
                  <Select value={formData.turno} onValueChange={(v) => handleChange('turno', v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TURNOS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos SOAP */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subjetivo" className="text-blue-700 font-semibold">
                      S - Subjetivo
                    </Label>
                    <Textarea
                      id="subjetivo"
                      value={formData.subjetivo}
                      onChange={(e) => handleChange('subjetivo', e.target.value)}
                      placeholder="Lo que refiere el paciente: síntomas, molestias, cómo se siente..."
                      className="mt-1 min-h-[80px] bg-blue-50/30 border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="objetivo" className="text-green-700 font-semibold">
                      O - Objetivo
                    </Label>
                    <Textarea
                      id="objetivo"
                      value={formData.objetivo}
                      onChange={(e) => handleChange('objetivo', e.target.value)}
                      placeholder="Hallazgos del examen físico, signos vitales, resultados de laboratorio..."
                      className="mt-1 min-h-[80px] bg-green-50/30 border-green-200 focus:border-green-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="analisis" className="text-amber-700 font-semibold">
                      A - Análisis
                    </Label>
                    <Textarea
                      id="analisis"
                      value={formData.analisis}
                      onChange={(e) => handleChange('analisis', e.target.value)}
                      placeholder="Interpretación clínica, diagnósticos diferenciales, evolución del cuadro..."
                      className="mt-1 min-h-[80px] bg-amber-50/30 border-amber-200 focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="plan" className="text-purple-700 font-semibold">
                      P - Plan
                    </Label>
                    <Textarea
                      id="plan"
                      value={formData.plan}
                      onChange={(e) => handleChange('plan', e.target.value)}
                      placeholder="Plan de manejo: medicamentos, estudios, interconsultas, dieta, cuidados..."
                      className="mt-1 min-h-[80px] bg-purple-50/30 border-purple-200 focus:border-purple-400"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab Signos Vitales */}
              <TabsContent value="signos" className="mt-4">
                <p className="text-sm text-gray-500 mb-4">
                  Opcional: Registre los signos vitales actuales del paciente.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="flex items-center gap-1">
                      <ThermometerSun className="h-4 w-4 text-red-500" />
                      Temperatura (°C)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={signosVitales.temperatura}
                      onChange={(e) => handleSignosChange('temperatura', e.target.value)}
                      placeholder="36.5"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      FC (lpm)
                    </Label>
                    <Input
                      type="number"
                      value={signosVitales.frecuenciaCardiaca}
                      onChange={(e) => handleSignosChange('frecuenciaCardiaca', e.target.value)}
                      placeholder="80"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1">
                      <Wind className="h-4 w-4 text-blue-500" />
                      FR (rpm)
                    </Label>
                    <Input
                      type="number"
                      value={signosVitales.frecuenciaRespiratoria}
                      onChange={(e) => handleSignosChange('frecuenciaRespiratoria', e.target.value)}
                      placeholder="16"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      SatO2 (%)
                    </Label>
                    <Input
                      type="number"
                      value={signosVitales.saturacionOxigeno}
                      onChange={(e) => handleSignosChange('saturacionOxigeno', e.target.value)}
                      placeholder="98"
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="flex items-center gap-1">
                      <Activity className="h-4 w-4 text-purple-500" />
                      Presión Arterial (mmHg)
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={signosVitales.presionSistolica}
                        onChange={(e) => handleSignosChange('presionSistolica', e.target.value)}
                        placeholder="120"
                      />
                      <span className="self-center">/</span>
                      <Input
                        type="number"
                        value={signosVitales.presionDiastolica}
                        onChange={(e) => handleSignosChange('presionDiastolica', e.target.value)}
                        placeholder="80"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-1">
                      <Scale className="h-4 w-4 text-gray-500" />
                      Peso (kg)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={signosVitales.peso}
                      onChange={(e) => handleSignosChange('peso', e.target.value)}
                      placeholder="70"
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Botones de acción */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAI(!showAI)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4 text-purple-500" />
                {showAI ? 'Ocultar IA' : 'Asistente IA'}
                {showAI ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={loading || !isFormValid()}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Borrador
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={loading || !isFormValid()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Guardar y Firmar
                </Button>
              </div>
            </div>
          </div>

          {/* Panel de IA */}
          {showAI && (
            <div className="w-[40%] border-l bg-gradient-to-b from-purple-50 to-indigo-50 p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Asistente IA
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAI(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Botones de acciones IA */}
              <div className="space-y-2 mb-4">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white"
                  onClick={() => handleAISuggest('soap')}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2 text-blue-500" />}
                  Sugerir Nota SOAP
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white"
                  onClick={() => handleAISuggest('plan')}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Stethoscope className="h-4 w-4 mr-2 text-green-500" />}
                  Sugerir Plan de Tratamiento
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white"
                  onClick={() => handleAISuggest('alertas')}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertCircle className="h-4 w-4 mr-2 text-red-500" />}
                  Ver Alertas Clínicas
                </Button>
              </div>

              {/* Resultado de IA */}
              {aiSuggestion && (
                <div className="bg-white rounded-lg p-4 border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">Sugerencia:</span>
                    <Button size="sm" variant="ghost" onClick={applyAISuggestion}>
                      Aplicar
                    </Button>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {aiSuggestion}
                  </div>
                </div>
              )}

              {/* Contexto del paciente */}
              {aiContext && (
                <div className="mt-4 p-3 bg-white/50 rounded-lg border text-xs">
                  <p className="font-medium text-gray-600 mb-2">Contexto cargado:</p>
                  {aiContext.alergias && (
                    <p className="text-red-600">Alergias: {aiContext.alergias}</p>
                  )}
                  {aiContext.patologias && (
                    <p className="text-amber-600">Patologías: {aiContext.patologias}</p>
                  )}
                  {aiContext.medicamentos && (
                    <p className="text-blue-600">Medicamentos: {aiContext.medicamentos}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
