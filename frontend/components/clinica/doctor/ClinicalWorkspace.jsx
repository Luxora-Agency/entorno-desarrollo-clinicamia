'use client';

import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import {
  Stethoscope, Activity, ClipboardList, Pill,
  CheckCircle, ChevronRight, ChevronLeft, Save,
  X, AlertTriangle, AlertCircle, MessageSquare, FileText, ClipboardCheck,
  Sparkles, RefreshCw, Brain, History, Copy, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiGet } from '@/services/api';

// Componentes
import PatientContextBar from './PatientContextBar';
import { useConsultationTimer } from './ConsultationTimer';
import AnamnesisForm from './AnamnesisForm';
import FormularioMotivoConsulta from '../consulta/FormularioMotivoConsulta';
import FormularioSignosVitalesConsulta from '../consulta/FormularioSignosVitalesConsulta';
import FormularioDiagnosticoConsulta from '../consulta/FormularioDiagnosticoConsulta';
import FormularioPrescripcionesConsulta from '../consulta/FormularioPrescripcionesConsulta';
import FormularioProcedimientosExamenesConsulta from '../consulta/FormularioProcedimientosExamenesConsulta';
import FormularioRemisiones from '../consulta/FormularioRemisiones';
import FormularioRevisionSistemas from '../consulta/FormularioRevisionSistemas';
import FormularioPlanManejo from '../consulta/FormularioPlanManejo';
import FormularioRecomendaciones from '../consulta/FormularioRecomendaciones';
import AntecedentesEstructurados from './AntecedentesEstructurados';
import AIMedicalAssistant from './AIMedicalAssistant';
import { AIAssistantButton } from '../consulta/AIInlineSuggestions';
import VisualizadorHistorialConsulta from '../consulta/VisualizadorHistorialConsulta';

import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Building2, Shield, PenLine } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Wrapper memoizado para PatientContextBar que evita re-renders por el timer
const MemoizedPatientContextBar = memo(function MemoizedPatientContextBar({
  paciente,
  vitalesActuales,
  cita,
  timerSeconds,
  timerIsRunning,
  timerIsWarning,
  timerIsCritical,
  timerOnToggle,
  timerOnReset,
  ...rest
}) {
  // Construir timerProps solo cuando los valores realmente cambian
  const timerProps = useMemo(() => ({
    seconds: timerSeconds,
    isRunning: timerIsRunning,
    isWarning: timerIsWarning,
    isCritical: timerIsCritical,
    onToggle: timerOnToggle,
    onReset: timerOnReset,
  }), [timerSeconds, timerIsRunning, timerIsWarning, timerIsCritical, timerOnToggle, timerOnReset]);

  return (
    <PatientContextBar
      paciente={paciente}
      vitalesActuales={vitalesActuales}
      cita={cita}
      timerProps={timerProps}
      {...rest}
    />
  );
});

// Función para calcular edad desde fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

export default function ClinicalWorkspace({
  cita,
  user,
  onClose,
  onFinish
}) {
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState('motivo');
  const [stepInitialized, setStepInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  // Timer de consulta
  const consultationTimer = useConsultationTimer({
    autoStart: true,
    warningThreshold: 20 * 60, // 20 minutos
    criticalThreshold: 30 * 60, // 30 minutos
    onWarning: () => {
      toast({
        title: 'Tiempo de consulta extendido',
        description: 'La consulta lleva más de 20 minutos.',
        variant: 'default',
      });
    },
    onCritical: () => {
      toast({
        title: 'Consulta prolongada',
        description: 'La consulta ha superado los 30 minutos.',
        variant: 'destructive',
      });
    },
  });

  // Tipo de consulta (primera vs control)
  const [tipoConsulta, setTipoConsulta] = useState(null);
  const [cargandoTipo, setCargandoTipo] = useState(true);
  const [ultimaConsulta, setUltimaConsulta] = useState(null);

  // Consulta previa completa para controles
  const [consultaCompletaPrevia, setConsultaCompletaPrevia] = useState(null);
  const [showPreviousPanel, setShowPreviousPanel] = useState(false);
  const [loadingPreviousConsulta, setLoadingPreviousConsulta] = useState(false);
  const [showCopyConfirmDialog, setShowCopyConfirmDialog] = useState(false);

  // Visualizador de historial completo
  const [showHistorialCompleto, setShowHistorialCompleto] = useState(false);

  // Nota de ingreso para hospitalización
  const [requiereHospitalizacion, setRequiereHospitalizacion] = useState(false);

  // Estado centralizado de la consulta
  const [consultaData, setConsultaData] = useState({
    anamnesis: null,
    revisionSistemas: null,
    vitales: null,
    analisis: '', // Nuevo campo
    diagnostico: null,
    procedimientos: null,
    prescripciones: null,
    remisiones: null,
    planManejo: null,
    recomendaciones: null,
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
    analisis: false, // Obligatorio - mínimo 10 caracteres
    diagnostico: true, // Opcional
    prescripciones: true,
    procedimientos: true,
    remisiones: true, // Opcional
    planManejo: true, // Opcional
    recomendaciones: true, // Opcional
  });

  // Referencia para evitar auto-save inicial
  const isInitialMount = useRef(true);
  const autoSaveTimeoutRef = useRef(null);

  // Estado de guardado automático
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveStatusTimeoutRef = useRef(null);

  // Clave única para el borrador en localStorage
  const draftKey = `consulta_draft_${cita?.id}`;

  // ============ Callbacks memoizados para evitar re-renders ============
  // Estos callbacks usan setState con función para no depender de consultaData/stepsValid
  const handleDiagnosticoChange = useCallback((data, isValid) => {
    setConsultaData(prev => ({ ...prev, diagnostico: data }));
    setStepsValid(prev => ({ ...prev, diagnostico: isValid }));
  }, []);

  const handleMotivoChange = useCallback((data, isValid) => {
    setConsultaData(prev => ({
      ...prev,
      motivoConsulta: data.motivoConsulta,
      enfermedadActual: data.enfermedadActual
    }));
    setStepsValid(prev => ({ ...prev, motivo: isValid }));
  }, []);

  const handleRevisionSistemasChange = useCallback((data, isValid) => {
    setConsultaData(prev => ({ ...prev, revisionSistemas: data }));
    setStepsValid(prev => ({ ...prev, revisionSistemas: isValid }));
  }, []);

  const handleVitalesChange = useCallback((data, isValid) => {
    setConsultaData(prev => ({ ...prev, vitales: data }));
    setStepsValid(prev => ({ ...prev, vitales: isValid }));
  }, []);

  const handlePrescripcionesChange = useCallback((data, isValid) => {
    setConsultaData(prev => ({ ...prev, prescripciones: data }));
    setStepsValid(prev => ({ ...prev, prescripciones: isValid }));
  }, []);

  const handleProcedimientosChange = useCallback((data, isValid) => {
    setConsultaData(prev => ({ ...prev, procedimientos: data }));
    setStepsValid(prev => ({ ...prev, procedimientos: isValid }));
  }, []);

  const handleRemisionesChange = useCallback((data, isValid) => {
    setConsultaData(prev => ({ ...prev, remisiones: data }));
    setStepsValid(prev => ({ ...prev, remisiones: isValid }));
  }, []);

  const handlePlanManejoChange = useCallback((data) => {
    setConsultaData(prev => ({ ...prev, planManejo: data }));
  }, []);

  const handleRecomendacionesChange = useCallback((data, isValid) => {
    setConsultaData(prev => ({ ...prev, recomendaciones: data }));
    setStepsValid(prev => ({ ...prev, recomendaciones: isValid }));
  }, []);

  const handleAnamnesisChange = useCallback((data) => {
    setConsultaData(prev => ({ ...prev, anamnesis: data }));
  }, []);

  const handleAnalisisChange = useCallback((e) => {
    const valor = e.target.value;
    setConsultaData(prev => ({ ...prev, analisis: valor }));
    // Validar: mínimo 10 caracteres
    const isValid = valor.trim().length >= 10;
    setStepsValid(prev => ({ ...prev, analisis: isValid }));
  }, []);
  // ============ Fin de callbacks memoizados ============

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
            if (step) {
              setActiveStep(step);
              setStepInitialized(true); // Marcar como inicializado para no resetear
            }
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

  // Cargar últimos signos vitales del paciente al iniciar la consulta
  useEffect(() => {
    const cargarUltimosVitales = async () => {
      if (!cita?.pacienteId) return;

      // Si ya hay vitales cargados (del borrador), no cargar
      if (consultaData.vitales) return;

      try {
        const response = await apiGet(`/signos-vitales?paciente_id=${cita.pacienteId}&limit=1`);
        // La API usa paginated() que retorna { success: true, data: [...], pagination: {...} }
        const signosArray = response.data || response.signos || [];
        if (response.success && signosArray.length > 0) {
          const ultimosVitales = signosArray[0];

          // Calcular IMC si hay peso y talla
          let imcData = null;
          if (ultimosVitales.peso && ultimosVitales.talla) {
            const pesoNum = parseFloat(ultimosVitales.peso);
            const tallaMetros = parseFloat(ultimosVitales.talla) / 100;
            if (pesoNum > 0 && tallaMetros > 0) {
              const imcValue = (pesoNum / (tallaMetros * tallaMetros)).toFixed(1);
              let categoria = 'Normal';
              if (imcValue < 18.5) categoria = 'Bajo peso';
              else if (imcValue < 25) categoria = 'Normal';
              else if (imcValue < 30) categoria = 'Sobrepeso';
              else categoria = 'Obesidad';
              imcData = { value: imcValue, categoria };
            }
          }

          // Pre-poblar peso, talla e IMC (valores que persisten entre consultas)
          const vitalesIniciales = {
            peso: ultimosVitales.peso || '',
            talla: ultimosVitales.talla || '',
            imc: imcData,
            // No pre-poblar valores que pueden cambiar significativamente
            temperatura: '',
            presionSistolica: '',
            presionDiastolica: '',
            frecuenciaCardiaca: '',
            frecuenciaRespiratoria: '',
            saturacionOxigeno: '',
            perimetroAbdominal: ultimosVitales.perimetroAbdominal || '',
            perimetroCefalico: ultimosVitales.perimetroCefalico || '',
            perimetroBraquial: ultimosVitales.perimetroBraquial || '',
          };

          setConsultaData(prev => ({
            ...prev,
            vitales: vitalesIniciales
          }));

          console.log('[ClinicalWorkspace] Vitales anteriores cargados:', {
            peso: vitalesIniciales.peso,
            talla: vitalesIniciales.talla,
            imc: imcData?.value
          });
        }
      } catch (error) {
        console.error('[ClinicalWorkspace] Error cargando vitales anteriores:', error);
      }
    };

    // Pequeño delay para permitir que el borrador se cargue primero
    const timer = setTimeout(cargarUltimosVitales, 500);
    return () => clearTimeout(timer);
  }, [cita?.pacienteId]);

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
      setSaveStatus('saving');
      try {
        const draftData = {
          data: consultaData,
          step: activeStep,
          stepsValidState: stepsValid,
          timestamp: Date.now()
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        console.log('Auto-guardado realizado:', new Date().toLocaleTimeString());

        // Resetear estado después de 3 segundos
        if (saveStatusTimeoutRef.current) {
          clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      } catch (error) {
        console.error('Error en auto-guardado:', error);
        setSaveStatus('error');
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

  // Guardar borrador manualmente
  const saveDraftToLocalStorage = useCallback(() => {
    setSaveStatus('saving');
    try {
      const draftData = {
        data: consultaData,
        step: activeStep,
        stepsValidState: stepsValid,
        timestamp: Date.now()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);

      // Resetear el estado a idle después de 3 segundos
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error guardando borrador:', error);
      setSaveStatus('error');
    }
  }, [consultaData, activeStep, stepsValid, draftKey]);

  // Marcar como cambios sin guardar cuando los datos cambian
  useEffect(() => {
    if (!isInitialMount.current) {
      setHasUnsavedChanges(true);
    }
  }, [consultaData]);

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
        // Cargar consulta completa previa para controles
        cargarConsultaCompletaPrevia();
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

  // Cargar datos completos de la última consulta
  const cargarConsultaCompletaPrevia = async () => {
    setLoadingPreviousConsulta(true);
    try {
      const response = await apiGet(`/consultas/ultima-completa/${cita.pacienteId}`);
      if (response.success && response.data) {
        setConsultaCompletaPrevia(response.data);
        setShowPreviousPanel(true); // Mostrar automáticamente
      }
    } catch (error) {
      console.error('Error cargando consulta previa completa:', error);
    } finally {
      setLoadingPreviousConsulta(false);
    }
  };

  // Copiar datos relevantes de la consulta previa
  const copiarDatosConsultaPrevia = () => {
    if (!consultaCompletaPrevia) return;

    const evolucion = consultaCompletaPrevia.evolucion || {};

    // Preparar datos a copiar
    const datosACopiar = {};

    // Copiar motivo de consulta (del subjetivo)
    if (evolucion.subjetivo) {
      datosACopiar.motivoConsulta = evolucion.subjetivo;
    }

    // Copiar enfermedad actual (del objetivo)
    if (evolucion.objetivo) {
      datosACopiar.enfermedadActual = evolucion.objetivo;
    }

    // Copiar analisis
    if (evolucion.analisis) {
      datosACopiar.analisis = evolucion.analisis;
    }

    // Copiar plan de manejo
    if (evolucion.plan) {
      datosACopiar.planManejo = {
        descripcion: evolucion.plan,
      };
    }

    // Copiar diagnosticos activos
    if (consultaCompletaPrevia.diagnosticos?.length > 0) {
      const diagnosticoActivo = consultaCompletaPrevia.diagnosticos.find(d => d.estadoDiagnostico === 'Activo');
      if (diagnosticoActivo) {
        datosACopiar.diagnostico = {
          codigoCIE11: diagnosticoActivo.codigoCIE11,
          descripcionCIE11: diagnosticoActivo.descripcionCIE11,
          tipoDiagnostico: 'Principal',
          esControl: true
        };
      }
    }

    // Copiar prescripciones/medicamentos
    if (consultaCompletaPrevia.prescripciones?.length > 0) {
      datosACopiar.prescripciones = consultaCompletaPrevia.prescripciones.map(med => ({
        productoId: med.productoId,
        nombre: med.producto?.nombre || med.nombreMedicamento || 'Medicamento',
        dosis: med.dosis || '',
        via: med.via || '',
        frecuencia: med.frecuencia || '',
        duracionDias: med.duracionDias || '',
        cantidadRecetada: med.cantidadRecetada || '',
        indicaciones: med.indicaciones || '',
      }));
    }

    // Aplicar todos los datos copiados
    setConsultaData(prev => ({
      ...prev,
      ...datosACopiar
    }));

    // Cerrar el dialogo
    setShowCopyConfirmDialog(false);

    toast({
      title: 'Datos copiados',
      description: 'Se ha copiado toda la informacion de la consulta anterior',
    });
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

  // Calcular progreso de la consulta
  const progressData = useMemo(() => {
    if (steps.length === 0) return { percentage: 0, currentStep: 0, totalSteps: 0 };
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    const percentage = Math.round(((currentIndex + 1) / steps.length) * 100);
    return { percentage, currentStep: currentIndex + 1, totalSteps: steps.length };
  }, [steps, activeStep]);

  // Actualizar step activo cuando cambia el tipo de consulta (solo si no fue inicializado por borrador)
  useEffect(() => {
    if (!cargandoTipo && steps.length > 0 && !stepInitialized) {
      setActiveStep(steps[0].id);
      setStepInitialized(true);
    }
  }, [cargandoTipo, tipoConsulta, stepInitialized]);

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

  // Atajos de teclado para navegación rápida
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si está escribiendo en un input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Alt + → : Siguiente paso
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
        toast({ title: 'Siguiente paso', duration: 1000 });
      }

      // Alt + ← : Paso anterior
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
        toast({ title: 'Paso anterior', duration: 1000 });
      }

      // Alt + S : Guardar borrador manualmente
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        saveDraftToLocalStorage();
        toast({ title: 'Borrador guardado', description: 'Se guardó el progreso de la consulta.', duration: 2000 });
      }

      // Alt + A : Abrir/cerrar asistente IA
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        setAIPanelOpen(prev => !prev);
      }

      // Alt + H : Ver historial
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        setShowHistorialCompleto(true);
      }

      // Escape : Cerrar paneles abiertos
      if (e.key === 'Escape') {
        if (aiPanelOpen) setAIPanelOpen(false);
        if (showHistorialCompleto) setShowHistorialCompleto(false);
      }

      // Alt + 1-7 : Ir a paso específico
      if (e.altKey && e.key >= '1' && e.key <= '7') {
        const stepIndex = parseInt(e.key) - 1;
        if (stepIndex < steps.length) {
          e.preventDefault();
          setActiveStep(steps[stepIndex].id);
          toast({ title: `Paso ${e.key}: ${steps[stepIndex].label}`, duration: 1000 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [steps, activeStep, aiPanelOpen, showHistorialCompleto]);

  // Validar antes de mostrar confirmación
  const handleFinish = () => {
    if (!stepsValid.motivo) {
      toast({ variant: 'destructive', title: 'Faltan datos', description: 'Debe completar el Motivo de Consulta antes de finalizar.' });
      return;
    }

    // Análisis médico es obligatorio
    if (!stepsValid.analisis) {
      toast({
        variant: 'destructive',
        title: 'Análisis Médico obligatorio',
        description: 'Debe completar el Análisis Médico (mínimo 10 caracteres) antes de finalizar.'
      });
      return;
    }

    // Mostrar diálogo de confirmación
    setShowConfirmFinish(true);
  };

  // Procesar finalización de consulta (después de confirmar)
  const processFinish = async () => {
    setShowConfirmFinish(false);
    setLoading(true);
    try {
      // Construir objeto SOAP estructurado desde los datos de la consulta
      // S = Motivo de consulta + Enfermedad actual + Anamnesis
      // O = Examen físico + Signos vitales + Revisión por sistemas
      // A = Análisis clínico
      // P = Plan de manejo + Prescripciones + Órdenes
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

REMISIONES:
${consultaData.remisiones && consultaData.remisiones.length > 0
  ? consultaData.remisiones.map(r => `- ${r.especialidadNombre}: ${r.motivoConsulta}`).join('\n')
  : 'Ninguna'}
        `.trim()
      };

      // Combinar procedimientos y remisiones en un solo array para el backend
      // El backend procesa items con tipo 'Interconsulta' de forma especial
      const procedimientosConRemisiones = [
        ...(consultaData.procedimientos || []),
        ...(consultaData.remisiones || [])
      ];

      await onFinish({
        ...consultaData,
        procedimientos: procedimientosConRemisiones.length > 0 ? procedimientosConRemisiones : null,
        soap: soapData, // SOAP construido automáticamente desde los datos de consulta
        citaId: cita.id,
        pacienteId: cita.pacienteId,
        doctorId: user.id,
        requiereHospitalizacion
      });

      // Si requiere hospitalización, preguntar si desea generar nota de ingreso
      if (requiereHospitalizacion) {
        const generarNota = confirm(
          '¿Desea generar una nota de ingreso para hospitalización?\n\n' +
          'Esto creará una admisión con los datos de esta consulta.'
        );
        if (generarNota) {
          try {
            const { apiPost } = await import('@/services/api');
            await apiPost('/consultas/nota-ingreso', {
              citaId: cita.id,
              pacienteId: cita.pacienteId,
              doctorId: user.id,
              diagnostico: consultaData.diagnostico,
              evolucion: soapData,
              vitales: consultaData.vitales
            });
            toast({
              title: 'Nota de ingreso generada',
              description: 'Se ha creado la admisión hospitalaria exitosamente.'
            });
          } catch (admisionError) {
            console.error('Error creando nota de ingreso:', admisionError);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'No se pudo crear la nota de ingreso, pero la consulta se guardó correctamente.'
            });
          }
        }
      }

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
                    variant="outline"
                    className="border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={() => setShowHistorialCompleto(true)}
                >
                    <History className="h-4 w-4 mr-2" />
                    Ver Historial
                </Button>
                <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleFinish}
                    disabled={loading || !stepsValid.motivo || !stepsValid.analisis}
                >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar Consulta
                </Button>
            </div>
        </div>
        <MemoizedPatientContextBar
          paciente={cita.paciente}
          vitalesActuales={consultaData.vitales}
          cita={cita}
          timerSeconds={consultationTimer.seconds}
          timerIsRunning={consultationTimer.isRunning}
          timerIsWarning={consultationTimer.isWarning}
          timerIsCritical={consultationTimer.isCritical}
          timerOnToggle={consultationTimer.toggle}
          timerOnReset={consultationTimer.reset}
        />

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
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Etapas de Consulta</h3>

            {/* Indicador de progreso */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progreso</span>
                <span className="font-medium">{progressData.currentStep}/{progressData.totalSteps}</span>
              </div>
              <Progress
                value={progressData.percentage}
                className="h-2 bg-gray-100"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{progressData.percentage}% completado</p>
            </div>

            {/* Indicador de estado de guardado */}
            <div className={`mb-4 p-2 rounded-lg border transition-all duration-300 ${
              saveStatus === 'saving' ? 'bg-blue-50 border-blue-200' :
              saveStatus === 'saved' ? 'bg-green-50 border-green-200' :
              saveStatus === 'error' ? 'bg-red-50 border-red-200' :
              hasUnsavedChanges ? 'bg-amber-50 border-amber-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {saveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
                      <span className="text-xs font-medium text-blue-600">Guardando...</span>
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-green-600">Guardado</span>
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-xs font-medium text-red-600">Error</span>
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <Save className="h-3 w-3 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600">Sin guardar</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Auto-guardado</span>
                    </>
                  )}
                </div>
                {lastSavedAt && saveStatus !== 'saving' && (
                  <span className="text-[10px] text-gray-400">
                    {lastSavedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Bogota'
    })}
                  </span>
                )}
              </div>
              {hasUnsavedChanges && saveStatus === 'idle' && (
                <button
                  onClick={saveDraftToLocalStorage}
                  className="mt-1 w-full text-[10px] text-amber-600 hover:text-amber-700 underline"
                >
                  Guardar ahora (Alt+S)
                </button>
              )}
            </div>

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
                    Última: {new Date(ultimaConsulta.fechaEvolucion).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                const currentIndex = steps.findIndex(s => s.id === activeStep);
                const isCompleted = index < currentIndex;
                const isPending = index > currentIndex;

                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium border-l-4 border-blue-600 shadow-sm'
                        : isCompleted
                          ? 'bg-green-50/50 text-green-700 hover:bg-green-50 border-l-4 border-green-400'
                          : 'text-gray-500 hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Indicador numérico o checkmark */}
                    <div className={`
                      relative flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    {/* Icono y Label */}
                    <div className="flex items-center gap-2 flex-1">
                      <Icon className={`h-4 w-4 ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <span className={isCompleted ? 'line-through opacity-70' : ''}>{step.label}</span>
                    </div>

                    {/* Indicadores de estado */}
                    <div className="flex items-center gap-1">
                      {step.id === 'motivo' && !stepsValid.motivo && (
                        <span className="text-red-500 text-xs font-medium">Requerido</span>
                      )}
                      {step.id === 'analisis' && !stepsValid.analisis && (
                        <span className="text-red-500 text-xs font-medium">Requerido</span>
                      )}
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Atajos de teclado */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <details className="group">
                <summary className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded font-mono">Alt</span>
                  <span>Atajos de teclado</span>
                  <ChevronDown className="h-3 w-3 ml-auto group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-2 space-y-1 text-[10px] text-gray-500 pl-2">
                  <div className="flex items-center justify-between">
                    <span>Siguiente paso</span>
                    <kbd className="px-1 bg-gray-100 rounded font-mono">Alt + →</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Paso anterior</span>
                    <kbd className="px-1 bg-gray-100 rounded font-mono">Alt + ←</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Guardar borrador</span>
                    <kbd className="px-1 bg-gray-100 rounded font-mono">Alt + S</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Asistente IA</span>
                    <kbd className="px-1 bg-gray-100 rounded font-mono">Alt + A</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ver historial</span>
                    <kbd className="px-1 bg-gray-100 rounded font-mono">Alt + H</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ir a paso N</span>
                    <kbd className="px-1 bg-gray-100 rounded font-mono">Alt + 1-7</kbd>
                  </div>
                </div>
              </details>
            </div>

            {/* Panel de Consulta Anterior (solo para controles) */}
            {tipoConsulta === 'control' && consultaCompletaPrevia && (
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => setShowPreviousPanel(!showPreviousPanel)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Consulta Anterior</span>
                  </div>
                  {showPreviousPanel ? (
                    <ChevronUp className="h-4 w-4 text-amber-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-amber-600" />
                  )}
                </button>

                {showPreviousPanel && (
                  <div className="mt-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-sm space-y-3 max-h-[300px] overflow-y-auto">
                    <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                      <span className="text-xs text-gray-500">
                        {new Date(consultaCompletaPrevia.fechaEvolucion).toLocaleDateString('es-CO', {
                          year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'America/Bogota'
    })}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={() => setShowCopyConfirmDialog(true)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar Todo
                      </Button>
                    </div>

                    {/* Dialogo de confirmacion para copiar consulta anterior */}
                    <AlertDialog open={showCopyConfirmDialog} onOpenChange={setShowCopyConfirmDialog}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Copiar consulta anterior</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta accion copiara toda la informacion de la consulta anterior
                            (SOAP, diagnosticos, medicamentos y plan de manejo) a la consulta actual.
                            Los campos existentes seran reemplazados. ¿Esta seguro de continuar?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={copiarDatosConsultaPrevia}>
                            Si, copiar datos
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {consultaCompletaPrevia.doctor && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Doctor:</span> {consultaCompletaPrevia.doctor.nombre}
                      </p>
                    )}

                    {consultaCompletaPrevia.diagnosticos?.length > 0 && (
                      <div>
                        <p className="font-medium text-amber-800 mb-1">Diagnósticos:</p>
                        <div className="space-y-1">
                          {consultaCompletaPrevia.diagnosticos.map((dx, i) => (
                            <p key={i} className="text-xs bg-white/50 p-1.5 rounded">
                              <span className="font-mono text-amber-700">{dx.codigoCIE11}</span>
                              {' - '}{dx.descripcionCIE11}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {consultaCompletaPrevia.evolucion?.plan && (
                      <div>
                        <p className="font-medium text-amber-800 mb-1">Plan Anterior:</p>
                        <p className="text-xs bg-white/50 p-2 rounded whitespace-pre-wrap line-clamp-4">
                          {consultaCompletaPrevia.evolucion.plan}
                        </p>
                      </div>
                    )}

                    {consultaCompletaPrevia.prescripciones?.length > 0 && (
                      <div>
                        <p className="font-medium text-amber-800 mb-1">Medicamentos:</p>
                        <ul className="space-y-1">
                          {consultaCompletaPrevia.prescripciones.slice(0, 5).map((med, i) => (
                            <li key={i} className="text-xs bg-white/50 p-1.5 rounded">
                              {med.producto?.nombre || 'Medicamento'} - {med.dosis}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* 3. Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
            <div className="max-w-5xl mx-auto min-h-[500px]">
                {activeStep === 'motivo' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                        <FormularioMotivoConsulta
                            data={{
                                motivoConsulta: consultaData.motivoConsulta,
                                enfermedadActual: consultaData.enfermedadActual
                            }}
                            onChange={handleMotivoChange}
                        />
                    </div>
                )}

                {activeStep === 'anamnesis' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                        <AnamnesisForm
                            pacienteId={cita.pacienteId}
                            initialData={consultaData.anamnesis}
                            onSave={handleAnamnesisChange}
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
                            onChange={handleRevisionSistemasChange}
                        />
                    </div>
                )}

                {activeStep === 'vitales' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <FormularioSignosVitalesConsulta
                            data={consultaData.vitales}
                            pacienteId={cita.pacienteId}
                            pacienteEdad={calcularEdad(cita.paciente?.fechaNacimiento)}
                            pacienteGenero={cita.paciente?.genero}
                            onChange={handleVitalesChange}
                        />
                    </div>
                )}

                {activeStep === 'analisis' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5 text-blue-600" />
                                        Análisis Médico
                                        <span className="text-red-500 text-sm">*</span>
                                    </CardTitle>
                                    {stepsValid.analisis ? (
                                        <span className="flex items-center gap-1 text-green-600 text-sm bg-green-100 px-2 py-1 rounded">
                                            <CheckCircle className="h-3 w-3" />
                                            Completo
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-600 text-sm bg-red-100 px-2 py-1 rounded">
                                            <AlertCircle className="h-3 w-3" />
                                            Obligatorio
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 mb-2">
                                    Describa el análisis clínico integral, correlacionando hallazgos del examen físico con antecedentes y paraclínicos.
                                </p>
                                <Textarea
                                    placeholder="Escriba su análisis clínico aquí..."
                                    className={`min-h-[200px] text-base ${!stepsValid.analisis && consultaData.analisis?.length > 0 ? 'border-red-300' : ''}`}
                                    value={consultaData.analisis || ''}
                                    onChange={handleAnalisisChange}
                                />
                                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                    <span>
                                        {(consultaData.analisis?.length || 0) < 10 ? (
                                            <span className="text-red-500">
                                                Mínimo 10 caracteres requeridos ({10 - (consultaData.analisis?.length || 0)} restantes)
                                            </span>
                                        ) : (
                                            <span className="text-green-600">✓ Longitud adecuada</span>
                                        )}
                                    </span>
                                    <span>{consultaData.analisis?.length || 0} caracteres</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeStep === 'diagnostico' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <FormularioDiagnosticoConsulta
                            data={consultaData.diagnostico}
                            pacienteId={cita.pacienteId}
                            onChange={handleDiagnosticoChange}
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
                                pacienteId={cita.pacienteId}
                                planManejoData={consultaData.planManejo}
                                onChange={handlePrescripcionesChange}
                            />
                        </div>

                        <div className="border-t pt-8">
                             <h3 className="text-lg font-bold mb-4">Órdenes y Procedimientos</h3>
                             <FormularioProcedimientosExamenesConsulta
                                data={consultaData.procedimientos}
                                onChange={handleProcedimientosChange}
                             />
                        </div>

                        <div className="border-t pt-8">
                             <FormularioRemisiones
                                data={consultaData.remisiones}
                                diagnosticoConsulta={consultaData.diagnostico}
                                onChange={handleRemisionesChange}
                             />
                        </div>

                        <div className="border-t pt-8">
                             <FormularioPlanManejo
                                paciente={cita.paciente}
                                doctorId={user.id}
                                citaId={cita.id}
                                diagnostico={consultaData.diagnostico}
                                data={consultaData.planManejo}
                                onChange={handlePlanManejoChange}
                             />
                        </div>

                        <div className="border-t pt-8">
                             <FormularioRecomendaciones
                                data={consultaData.recomendaciones}
                                onChange={handleRecomendacionesChange}
                             />
                        </div>

                        {/* Opción de Hospitalización */}
                        <div className="border-t pt-8">
                          <Card className={`border-2 transition-all ${requiereHospitalizacion ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${requiereHospitalizacion ? 'bg-orange-500' : 'bg-gray-200'}`}>
                                  <Building2 className={`h-5 w-5 ${requiereHospitalizacion ? 'text-white' : 'text-gray-600'}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      id="hospitalizacion"
                                      checked={requiereHospitalizacion}
                                      onCheckedChange={setRequiereHospitalizacion}
                                    />
                                    <Label
                                      htmlFor="hospitalizacion"
                                      className="text-base font-semibold cursor-pointer"
                                    >
                                      Este paciente requiere hospitalización
                                    </Label>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2 ml-7">
                                    Al finalizar la consulta, se generará automáticamente una nota de ingreso
                                    con los datos de esta atención para iniciar el proceso de hospitalización.
                                  </p>
                                  {requiereHospitalizacion && (
                                    <div className="mt-3 ml-7 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                                      <p className="text-sm text-orange-800 font-medium">
                                        Se creará una admisión hospitalaria con:
                                      </p>
                                      <ul className="text-sm text-orange-700 mt-1 list-disc ml-4">
                                        <li>Diagnóstico de ingreso</li>
                                        <li>Evolución clínica inicial (SOAP)</li>
                                        <li>Signos vitales de ingreso</li>
                                        <li>Órdenes médicas pendientes</li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {/* 4. Footer Navigation */}
      <div className="bg-white border-t p-4 flex justify-between items-center z-20 relative">
        <Button
            variant="outline"
            onClick={handleBack}
            disabled={activeStep === steps[0].id}
            className="min-w-[120px]"
        >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
        </Button>

        {/* Spacer para evitar que el botón de IA tape los botones */}
        <div className="flex-1" />

        <div className="flex items-center gap-3 mr-20">
          {activeStep !== steps[steps.length - 1].id ? (
              <Button onClick={handleNext} className="bg-blue-600 min-w-[120px]">
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
          ) : (
              <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 min-w-[160px]">
                  Finalizar Consulta
                  <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
          )}
        </div>
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
          }
        }}
      />

      {/* 7. Visualizador de Historial Completo */}
      {showHistorialCompleto && cita?.pacienteId && (
        <VisualizadorHistorialConsulta
          pacienteId={cita.pacienteId}
          onClose={() => setShowHistorialCompleto(false)}
        />
      )}

      {/* 8. Diálogo de Confirmación para Finalizar Consulta */}
      <AlertDialog open={showConfirmFinish} onOpenChange={setShowConfirmFinish}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Finalizar y Firmar Consulta
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3 text-sm text-muted-foreground">
                <p>
                  Está a punto de finalizar la consulta médica de <span className="font-semibold text-gray-900">{cita?.paciente?.nombre} {cita?.paciente?.apellido}</span>
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <PenLine className="h-4 w-4" />
                    <span className="font-medium">Firma Digital</span>
                  </div>
                  <p className="text-xs">
                    Se generará una firma digital y la consulta quedará registrada permanentemente. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="sm:w-32">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={processFinish}
              className="bg-green-600 hover:bg-green-700 sm:w-32"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
