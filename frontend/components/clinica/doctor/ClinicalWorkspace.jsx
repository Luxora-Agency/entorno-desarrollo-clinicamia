'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Stethoscope, Activity, ClipboardList, Pill,
  CheckCircle, ChevronRight, ChevronLeft, Save,
  X, AlertTriangle, MessageSquare, FileText, ClipboardCheck,
  Sparkles, RefreshCw, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiGet } from '@/services/api';

// Componentes
import PatientContextBar from './PatientContextBar';
import AnamnesisForm from './AnamnesisForm';
import FormularioMotivoConsulta from '../consulta/FormularioMotivoConsulta';
import FormularioSignosVitalesConsulta from '../consulta/FormularioSignosVitalesConsulta';
import FormularioDiagnosticoConsulta from '../consulta/FormularioDiagnosticoConsulta';
import FormularioPrescripcionesConsulta from '../consulta/FormularioPrescripcionesConsulta';
import FormularioProcedimientosExamenesConsulta from '../consulta/FormularioProcedimientosExamenesConsulta';
import FormularioRevisionSistemas from '../consulta/FormularioRevisionSistemas';
import FormularioPlanManejo from '../consulta/FormularioPlanManejo';
import AntecedentesEstructurados from './AntecedentesEstructurados';
import AIMedicalAssistant from './AIMedicalAssistant';
import { AIAssistantButton } from '../consulta/AIInlineSuggestions';

import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClinicalWorkspace({
  cita,
  user,
  onClose,
  onFinish
}) {
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState('anamnesis');
  const [loading, setLoading] = useState(false);
  const [aiPanelOpen, setAIPanelOpen] = useState(false);

  // Tipo de consulta (primera vs control)
  const [tipoConsulta, setTipoConsulta] = useState(null);
  const [cargandoTipo, setCargandoTipo] = useState(true);
  const [ultimaConsulta, setUltimaConsulta] = useState(null);

  // Estado centralizado de la consulta
  const [consultaData, setConsultaData] = useState({
    anamnesis: null,
    revisionSistemas: null,
    vitales: null,
    analisis: '', // Nuevo campo
    diagnostico: null,
    procedimientos: null,
    prescripciones: null,
    planManejo: null,
    motivoConsulta: '',
    enfermedadActual: '',
    esPrimeraConsulta: false,
  });

  // Validación de pasos
  const [stepsValid, setStepsValid] = useState({
    motivo: false,   // Obligatorio
    anamnesis: true, // Opcional
    revisionSistemas: true, // Opcional
    vitales: true,   // Opcional (pero recomendado)
    analisis: true, // Opcional
    diagnostico: true, // Opcional
    prescripciones: true,
    procedimientos: true,
    planManejo: true, // Opcional
  });

  // Referencia para evitar auto-save inicial
  const isInitialMount = useRef(true);
  const autoSaveTimeoutRef = useRef(null);

  // Clave única para el borrador en localStorage
  const draftKey = `consulta_draft_${cita?.id}`;

  // Recuperar borrador al cargar (solo una vez)
  useEffect(() => {
    if (!cita?.id) return;

    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const { data, step, stepsValidState, timestamp } = JSON.parse(draft);
        // Verificar que no sea muy antiguo (24 horas)
        const isRecent = Date.now() - timestamp < 86400000;

        if (isRecent && data) {
          const shouldRestore = window.confirm(
            '¿Se encontró una consulta sin finalizar. ¿Desea recuperar los datos guardados?'
          );

          if (shouldRestore) {
            setConsultaData(data);
            if (step) setActiveStep(step);
            if (stepsValidState) setStepsValid(stepsValidState);
            toast({
              title: 'Borrador recuperado',
              description: 'Se han cargado los datos de la consulta anterior',
            });
          } else {
            localStorage.removeItem(draftKey);
          }
        } else {
          // Borrador muy antiguo, eliminarlo
          localStorage.removeItem(draftKey);
        }
      }
    } catch (error) {
      console.error('Error al recuperar borrador:', error);
      localStorage.removeItem(draftKey);
    }
  }, [cita?.id]);

  // Auto-guardar cada 30 segundos cuando hay cambios
  useEffect(() => {
    // Evitar guardar en el mount inicial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Verificar si hay datos para guardar
    const hasData = consultaData.motivoConsulta ||
                    consultaData.enfermedadActual ||
                    consultaData.analisis ||
                    consultaData.vitales ||
                    consultaData.diagnostico ||
                    consultaData.prescripciones ||
                    consultaData.procedimientos ||
                    consultaData.revisionSistemas ||
                    consultaData.planManejo;

    if (!hasData) return;

    // Limpiar timeout anterior
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Guardar después de 30 segundos de inactividad
    autoSaveTimeoutRef.current = setTimeout(() => {
      try {
        const draftData = {
          data: consultaData,
          step: activeStep,
          stepsValidState: stepsValid,
          timestamp: Date.now()
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        console.log('Auto-guardado realizado:', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Error en auto-guardado:', error);
      }
    }, 30000); // 30 segundos

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [consultaData, activeStep, stepsValid, draftKey]);

  // Guardar inmediatamente cuando el usuario intenta salir
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasData = consultaData.motivoConsulta ||
                      consultaData.enfermedadActual ||
                      consultaData.vitales ||
                      consultaData.diagnostico;

      if (hasData) {
        // Guardar borrador antes de salir
        try {
          const draftData = {
            data: consultaData,
            step: activeStep,
            stepsValidState: stepsValid,
            timestamp: Date.now()
          };
          localStorage.setItem(draftKey, JSON.stringify(draftData));
        } catch (error) {
          console.error('Error guardando borrador antes de salir:', error);
        }

        // Mostrar advertencia del navegador
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [consultaData, activeStep, stepsValid, draftKey]);

  // Limpiar borrador cuando se finaliza la consulta exitosamente
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error('Error limpiando borrador:', error);
    }
  }, [draftKey]);

  // Detectar tipo de consulta al cargar
  useEffect(() => {
    if (cita?.pacienteId) {
      detectarTipoConsulta();
    }
  }, [cita?.pacienteId]);

  const detectarTipoConsulta = async () => {
    setCargandoTipo(true);
    try {
      const response = await apiGet(`/consultas/tipo-consulta/${cita.pacienteId}`);
      const { data } = response;

      setTipoConsulta(data.tipo);
      setUltimaConsulta(data.ultimaConsulta);
      setConsultaData(prev => ({
        ...prev,
        esPrimeraConsulta: data.esPrimeraConsulta
      }));

      // Mostrar notificación
      if (data.esPrimeraConsulta) {
        toast({
          title: 'Primera consulta del paciente',
          description: 'Complete toda la información de anamnesis, motivo de consulta y antecedentes',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Consulta de control',
          description: data.mensaje,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error al detectar tipo de consulta:', error);
      // Default a primera consulta por seguridad
      setTipoConsulta('primera');
      setConsultaData(prev => ({ ...prev, esPrimeraConsulta: true }));
    } finally {
      setCargandoTipo(false);
    }
  };

  // Steps dinámicos según tipo de consulta
  const steps = useMemo(() => {
    if (tipoConsulta === 'control') {
      // Consulta de control: Motivo primero
      return [
        { id: 'motivo', label: 'Motivo / Evolución', icon: FileText },
        { id: 'revisionSistemas', label: 'Revisión Sistemas', icon: ClipboardCheck },
        { id: 'vitales', label: 'Examen Físico', icon: Activity },
        { id: 'analisis', label: 'Análisis', icon: Brain },
        { id: 'diagnostico', label: 'Diagnóstico', icon: AlertTriangle },
        { id: 'tratamiento', label: 'Plan / Recetas', icon: Pill },
      ];
    } else {
      // Primera consulta: flujo completo con motivo
      return [
        { id: 'motivo', label: 'Motivo Consulta', icon: FileText },
        { id: 'anamnesis', label: 'Historia', icon: ClipboardList },
        { id: 'revisionSistemas', label: 'Revisión Sistemas', icon: ClipboardCheck },
        { id: 'vitales', label: 'Examen Físico', icon: Activity },
        { id: 'analisis', label: 'Análisis', icon: Brain },
        { id: 'diagnostico', label: 'Diagnóstico', icon: AlertTriangle },
        { id: 'tratamiento', label: 'Plan / Recetas', icon: Pill },
      ];
    }
  }, [tipoConsulta]);

  // Actualizar step activo cuando cambia el tipo de consulta
  useEffect(() => {
    if (!cargandoTipo && steps.length > 0) {
      setActiveStep(steps[0].id);
    }
  }, [cargandoTipo, tipoConsulta]);

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1].id);
    }
  };

  const handleFinish = async () => {
    if (!stepsValid.motivo) {
      toast({ variant: 'destructive', title: 'Faltan datos', description: 'Debe completar el Motivo de Consulta antes de finalizar.' });
      return;
    }

    if (!confirm('¿Está seguro de finalizar la consulta? Se generará la firma digital y no podrá editarse.')) return;

    setLoading(true);
    try {
      // Construir objeto SOAP estructurado
      const soapData = {
        subjetivo: `
MOTIVO DE CONSULTA:
${consultaData.motivoConsulta || 'No registrado'}

ENFERMEDAD ACTUAL:
${consultaData.enfermedadActual || 'No registrado'}

ANAMNESIS Y ANTECEDENTES:
${consultaData.anamnesis ? JSON.stringify(consultaData.anamnesis, null, 2) : 'Sin cambios'}

REVISIÓN POR SISTEMAS:
${consultaData.revisionSistemas ? JSON.stringify(consultaData.revisionSistemas, null, 2) : 'Sin hallazgos'}
        `.trim(),
        
        objetivo: `
SIGNOS VITALES Y EXAMEN FÍSICO:
Temperatura: ${consultaData.vitales?.temperatura || '--'} °C
PA: ${consultaData.vitales?.presionSistolica || '--'}/${consultaData.vitales?.presionDiastolica || '--'} mmHg
FC: ${consultaData.vitales?.frecuenciaCardiaca || '--'} lpm
FR: ${consultaData.vitales?.frecuenciaRespiratoria || '--'} rpm
SatO2: ${consultaData.vitales?.saturacionOxigeno || '--'} %
Peso: ${consultaData.vitales?.peso || '--'} kg
Talla: ${consultaData.vitales?.talla || '--'} cm
IMC: ${consultaData.vitales?.imc?.value || '--'}

HALLAZGOS ADICIONALES:
${consultaData.vitales?.hallazgos || 'Sin hallazgos adicionales'}
        `.trim(),
        
        analisis: consultaData.analisis || 'Sin análisis registrado',
        
        plan: `
PLAN DE MANEJO:
${consultaData.planManejo ? JSON.stringify(consultaData.planManejo, null, 2) : 'Ver prescripciones y órdenes'}

PRESCRIPCIONES:
${consultaData.prescripciones ? 'Se han generado recetas médicas.' : 'Ninguna'}

PROCEDIMIENTOS/ÓRDENES:
${consultaData.procedimientos ? 'Se han generado órdenes médicas.' : 'Ninguna'}
        `.trim()
      };

      await onFinish({
        ...consultaData,
        soap: soapData, // Agregamos el objeto SOAP requerido por el backend
        citaId: cita.id,
        pacienteId: cita.pacienteId,
        doctorId: user.id
      });

      // Limpiar borrador después de finalizar exitosamente
      clearDraft();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo finalizar la consulta.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (template) => {
    if (!confirm(`¿Desea aplicar la plantilla "${template.nombre}"? Esto agregará los items al plan actual.`)) return;

    setConsultaData(prev => {
        const newData = { ...prev };
        
        // Merge Medicamentos
        if (template.medicamentos?.length > 0) {
            const existingMeds = prev.prescripciones?.medicamentos || [];
            newData.prescripciones = {
                ...prev.prescripciones,
                medicamentos: [...existingMeds, ...template.medicamentos]
            };
        }

        // Merge Procedimientos
        if (template.procedimientos?.length > 0) {
            const existingProcs = prev.procedimientos?.procedimientos || [];
            // Adaptar estructura si es necesario (el form espera { codigo, nombre, cantidad, observacion })
            const newProcs = template.procedimientos.map(p => ({
                codigo: p.codigo || '',
                nombre: p.nombre,
                cantidad: p.cantidad || 1,
                observacion: p.observacion || ''
            }));
            
            newData.procedimientos = {
                ...prev.procedimientos,
                procedimientos: [...existingProcs, ...newProcs]
            };
        }

        // Merge Plan Manejo (Append text)
        if (template.planManejo) {
             const currentPlan = prev.planManejo?.descripcion || '';
             newData.planManejo = {
                 ...prev.planManejo,
                 descripcion: currentPlan ? `${currentPlan}\n\n${template.planManejo}` : template.planManejo
             };
        }

        // Merge Observaciones into Análisis or Plan? Let's put it in Análisis for context
        if (template.observaciones) {
            newData.analisis = prev.analisis ? `${prev.analisis}\n\nNota Plantilla: ${template.observaciones}` : `Nota Plantilla: ${template.observaciones}`;
        }

        return newData;
    });
    
    toast({ title: 'Plantilla aplicada', description: 'Se han cargado los datos de la plantilla al plan de tratamiento.' });
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col overflow-hidden">
      {/* 1. Top Bar: Patient Context */}
      <div className="bg-slate-900 shadow-md z-10">
        <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
                <h1 className="text-white font-semibold hidden md:block">Espacio Clínico</h1>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-slate-400 text-sm">
                    {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
                </span>
                <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleFinish}
                    disabled={loading || !stepsValid.motivo}
                >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar Consulta
                </Button>
            </div>
        </div>
        <PatientContextBar paciente={cita.paciente} vitalesActuales={consultaData.vitales} />

        {/* Banner de Motivo de Consulta */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-white/20 rounded-lg p-2">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Motivo de Consulta</p>
              <p className="text-white font-medium">{cita.motivo || 'No especificado'}</p>
              {cita.notas && (
                <p className="text-blue-200 text-sm mt-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {cita.notas}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Sidebar Navigation (Stepper) */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Etapas de Consulta</h3>

            {/* Indicador de tipo de consulta */}
            {!cargandoTipo && tipoConsulta && (
              <div className={`mb-4 p-3 rounded-lg border ${
                tipoConsulta === 'primera'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center gap-2">
                  {tipoConsulta === 'primera' ? (
                    <>
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-sm text-blue-700">Primera Consulta</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-sm text-green-700">Consulta de Control</span>
                    </>
                  )}
                </div>
                {ultimaConsulta && tipoConsulta === 'control' && (
                  <p className="text-xs text-gray-600 mt-1">
                    Última: {new Date(ultimaConsulta.fechaEvolucion).toLocaleDateString('es-CO')}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                const isCompleted = index < steps.findIndex(s => s.id === activeStep);
                
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <span>{step.label}</span>
                    {step.id === 'motivo' && !stepsValid.motivo && (
                        <span className="ml-auto text-red-500">*</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
        </div>

        {/* 3. Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
            <div className="max-w-5xl mx-auto min-h-[500px]">
                {activeStep === 'motivo' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <FormularioMotivoConsulta
                            data={{
                                motivoConsulta: consultaData.motivoConsulta,
                                enfermedadActual: consultaData.enfermedadActual
                            }}
                            onChange={(data, isValid) => {
                                setConsultaData(prev => ({
                                    ...prev,
                                    motivoConsulta: data.motivoConsulta,
                                    enfermedadActual: data.enfermedadActual
                                }));
                                setStepsValid(prev => ({ ...prev, motivo: isValid }));
                            }}
                        />
                    </div>
                )}

                {activeStep === 'anamnesis' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                        <AnamnesisForm
                            pacienteId={cita.pacienteId}
                            initialData={consultaData.anamnesis}
                            onSave={(data) => setConsultaData(prev => ({ ...prev, anamnesis: data }))}
                        />
                        <AntecedentesEstructurados
                            pacienteId={cita.pacienteId}
                            pacienteGenero={cita.paciente?.genero}
                        />
                    </div>
                )}

                {activeStep === 'revisionSistemas' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <FormularioRevisionSistemas
                            data={consultaData.revisionSistemas}
                            onChange={(data, isValid) => {
                                setConsultaData(prev => ({ ...prev, revisionSistemas: data }));
                                setStepsValid(prev => ({ ...prev, revisionSistemas: isValid }));
                            }}
                        />
                    </div>
                )}

                {activeStep === 'vitales' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <FormularioSignosVitalesConsulta
                            data={consultaData.vitales}
                            pacienteId={cita.pacienteId}
                            onChange={(data, isValid) => {
                                setConsultaData(prev => ({ ...prev, vitales: data }));
                                setStepsValid(prev => ({ ...prev, vitales: isValid }));
                            }}
                        />
                    </div>
                )}

                {activeStep === 'analisis' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-blue-600" />
                                    Análisis Médico
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 mb-2">
                                    Describa el análisis clínico integral, correlacionando hallazgos del examen físico con antecedentes y paraclínicos.
                                </p>
                                <Textarea 
                                    placeholder="Escriba su análisis clínico aquí..."
                                    className="min-h-[200px] text-base"
                                    value={consultaData.analisis || ''}
                                    onChange={(e) => setConsultaData(prev => ({ ...prev, analisis: e.target.value }))}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeStep === 'diagnostico' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <FormularioDiagnosticoConsulta 
                            data={consultaData.diagnostico}
                            onChange={(data, isValid) => {
                                setConsultaData(prev => ({ ...prev, diagnostico: data }));
                                setStepsValid(prev => ({ ...prev, diagnostico: isValid }));
                            }}
                        />
                    </div>
                )}

                {activeStep === 'tratamiento' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4">Prescripción Médica</h3>
                            <FormularioPrescripcionesConsulta
                                data={consultaData.prescripciones}
                                diagnosticoConsulta={consultaData.diagnostico}
                                onChange={(data, isValid) => {
                                    setConsultaData(prev => ({ ...prev, prescripciones: data }));
                                    setStepsValid(prev => ({ ...prev, prescripciones: isValid }));
                                }}
                            />
                        </div>

                        <div className="border-t pt-8">
                             <h3 className="text-lg font-bold mb-4">Órdenes y Procedimientos</h3>
                             <FormularioProcedimientosExamenesConsulta
                                data={consultaData.procedimientos}
                                onChange={(data, isValid) => {
                                    setConsultaData(prev => ({ ...prev, procedimientos: data }));
                                    setStepsValid(prev => ({ ...prev, procedimientos: isValid }));
                                }}
                             />
                        </div>

                        <div className="border-t pt-8">
                             <FormularioPlanManejo
                                paciente={cita.paciente}
                                doctorId={user.id}
                                citaId={cita.id}
                                diagnostico={consultaData.diagnostico}
                                onChange={(data) => {
                                    setConsultaData(prev => ({ ...prev, planManejo: data }));
                                }}
                             />
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {/* 4. Footer Navigation */}
      <div className="bg-white border-t p-4 flex justify-between items-center z-10">
        <Button
            variant="outline"
            onClick={handleBack}
            disabled={activeStep === steps[0].id}
        >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
        </Button>

        {activeStep !== steps[steps.length - 1].id ? (
            <Button onClick={handleNext} className="bg-blue-600">
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
        ) : (
            <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
                Finalizar Consulta
                <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
        )}
      </div>

      {/* 5. AI Assistant Button */}
      <AIAssistantButton
        onClick={() => setAIPanelOpen(true)}
      />

      {/* 6. AI Medical Assistant Panel */}
      <AIMedicalAssistant
        isOpen={aiPanelOpen}
        onClose={() => setAIPanelOpen(false)}
        patient={cita.paciente}
        cita={cita}
        consultaData={consultaData}
        onSuggestionApply={(type, data) => {
          // Aplicar sugerencia según el tipo
          if (type === 'diagnosis' && data) {
            setConsultaData(prev => ({
              ...prev,
              diagnostico: {
                ...prev.diagnostico,
                ...data
              }
            }));
            toast({ title: 'Sugerencia aplicada', description: 'Diagnóstico actualizado con la sugerencia de IA' });
          } else if (type === 'soap' && data) {
            setConsultaData(prev => ({
              ...prev,
              soap: {
                ...prev.soap,
                ...data
              }
            }));
            toast({ title: 'Sugerencia aplicada', description: 'Nota SOAP actualizada con la sugerencia de IA' });
          }
        }}
      />
    </div>
  );
}
