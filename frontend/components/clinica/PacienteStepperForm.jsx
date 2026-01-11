'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, User, Phone, Shield, Activity, AlertCircle, Plus, X, Droplet, Scale, FileText, Trash2, Upload } from 'lucide-react';
import epsData from '@/data/eps.json';
import regimenesData from '@/data/regimenes.json';
import colombiaData from '@/data/colombia.json';
import paisesData from '@/data/paises.json';
import { ESTADO_CIVIL, NIVEL_EDUCACION, TIPO_USUARIO, ARL_COLOMBIA } from '@/constants/pacientes';
import SuccessModal from './SuccessModal';
import { pacienteFormSchema } from '@/schemas/paciente.schema';

export default function PacienteStepperForm({ user, editingPaciente, onBack, onSuccess }) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedPaciente, setSavedPaciente] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [municipios, setMunicipios] = useState([]);
  
  // Estado para inputs de tags
  const [inputValues, setInputValues] = useState({
    alergia: '',
    enfermedad: '',
    medicamento: '',
    antecedente: '',
  });

  const form = useForm({
    resolver: zodResolver(pacienteFormSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      tipoDocumento: '',
      cedula: '',
      fechaNacimiento: '',
      genero: '',
      otroGenero: '',
      estadoCivil: '',
      ocupacion: '',
      paisNacimiento: 'Colombia',
      departamento: '',
      municipio: '',
      barrio: '',
      direccion: '',
      telefono: '',
      email: '',
      contactosEmergencia: [{ nombre: '', telefono: '', parentesco: '' }],
      nivelEducacion: '',
      empleadorActual: '',
      eps: '',
      regimen: '',
      tipoAfiliacion: '',
      nivelSisben: '',
      numeroAutorizacion: '',
      fechaAfiliacion: '',
      convenio: '',
      arl: '',
      carnetPoliza: '',
      tipoUsuario: '',
      referidoPor: '',
      nombreRefiere: '',
      tipoPaciente: '',
      categoria: '',
      tipoSangre: '',
      peso: '',
      altura: '',
      alergias: [],
      enfermedadesCronicas: [],
      medicamentosActuales: [],
      antecedentesQuirurgicos: [],
    },
    mode: 'onChange'
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isValid }, trigger } = form;
  
  const { fields: contactosFields, append: appendContacto, remove: removeContacto } = useFieldArray({
    control,
    name: "contactosEmergencia"
  });

  const departamento = watch('departamento');
  const peso = watch('peso');
  const altura = watch('altura');
  const genero = watch('genero');

  // Cargar municipios cuando cambia departamento
  useEffect(() => {
    if (departamento) {
      const dept = colombiaData.departamentos.find(d => d.nombre === departamento);
      setMunicipios(dept ? dept.municipios : []);
    } else {
      setMunicipios([]);
    }
  }, [departamento]);

  // Cargar datos al editar
  useEffect(() => {
    if (editingPaciente) {
      console.log('Editando:', editingPaciente);

      // PRIMERO: Cargar municipios si hay departamento para evitar race condition
      if (editingPaciente.departamento) {
        const dept = colombiaData.departamentos.find(d => d.nombre === editingPaciente.departamento);
        if (dept) {
          setMunicipios(dept.municipios);
        }
      }

      const parseArray = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return data.split(',').map(item => item.trim()).filter(Boolean);
          }
        }
        return [];
      };

      let contactos = [{ nombre: '', telefono: '', parentesco: '' }];
      if (editingPaciente.contactosEmergencia) {
        try {
          const parsed = typeof editingPaciente.contactosEmergencia === 'string'
            ? JSON.parse(editingPaciente.contactosEmergencia)
            : editingPaciente.contactosEmergencia;
          contactos = parsed.length > 0 ? parsed : contactos;
        } catch (e) {
          console.error('Error parsing contactos', e);
        }
      }

      // DESPUÉS: Resetear formulario con datos existentes (municipios ya cargados)
      // Usamos requestAnimationFrame para asegurar que el estado de municipios se actualizó
      requestAnimationFrame(() => {
        form.reset({
          nombre: editingPaciente.nombre || '',
          apellido: editingPaciente.apellido || '',
          tipoDocumento: editingPaciente.tipoDocumento || '',
          cedula: editingPaciente.cedula || '',
          fechaNacimiento: editingPaciente.fechaNacimiento ? editingPaciente.fechaNacimiento.split('T')[0] : '',
          genero: editingPaciente.genero || '',
          otroGenero: '', // Logic needed if stored differently
          estadoCivil: editingPaciente.estadoCivil || '',
          ocupacion: editingPaciente.ocupacion || '',
          paisNacimiento: editingPaciente.paisNacimiento || 'Colombia',
          departamento: editingPaciente.departamento || '',
          municipio: editingPaciente.municipio || '',
          barrio: editingPaciente.barrio || '',
          direccion: editingPaciente.direccion || '',
          telefono: editingPaciente.telefono || '',
          email: editingPaciente.email || '',
          contactosEmergencia: contactos,
          nivelEducacion: editingPaciente.nivelEducacion || '',
          empleadorActual: editingPaciente.empleadorActual || '',
          eps: editingPaciente.eps || '',
          regimen: editingPaciente.regimen || '',
          tipoAfiliacion: editingPaciente.tipoAfiliacion || '',
          nivelSisben: editingPaciente.nivelSisben || '',
          numeroAutorizacion: editingPaciente.numeroAutorizacion || '',
          fechaAfiliacion: editingPaciente.fechaAfiliacion ? editingPaciente.fechaAfiliacion.split('T')[0] : '',
          convenio: editingPaciente.convenio || '',
          arl: editingPaciente.arl || '',
          carnetPoliza: editingPaciente.carnetPoliza || '',
          tipoUsuario: editingPaciente.tipoUsuario || '',
          referidoPor: editingPaciente.referidoPor || '',
          nombreRefiere: editingPaciente.nombreRefiere || '',
          tipoPaciente: editingPaciente.tipoPaciente || '',
          categoria: editingPaciente.categoria || '',
          tipoSangre: editingPaciente.tipoSangre || '',
          peso: editingPaciente.peso ? String(editingPaciente.peso) : '',
          altura: editingPaciente.altura ? String(editingPaciente.altura) : '',
          alergias: parseArray(editingPaciente.alergias),
          enfermedadesCronicas: parseArray(editingPaciente.enfermedadesCronicas),
          medicamentosActuales: parseArray(editingPaciente.medicamentosActuales),
          antecedentesQuirurgicos: parseArray(editingPaciente.antecedentesQuirurgicos),
        });
      });
    }
  }, [editingPaciente, form]);

  const steps = [
    { number: 1, title: 'Información Básica', icon: User, fields: ['nombre', 'apellido', 'tipoDocumento', 'cedula', 'fechaNacimiento', 'departamento', 'municipio', 'barrio', 'direccion'] },
    { number: 2, title: 'Contacto y Emergencias', icon: Phone, fields: ['telefono', 'email', 'contactosEmergencia'] },
    { number: 3, title: 'Aseguramiento en Salud', icon: Shield, fields: [] }, // Optional mostly
    { number: 4, title: 'Información Médica', icon: Activity, fields: ['tipoSangre'] },
    { number: 5, title: 'Documentos', icon: FileText, fields: [] },
  ];

  const tiposDocumento = [
    'Cédula de Ciudadanía',
    'Tarjeta de Identidad',
    'Registro Civil',
    'Cédula de Extranjería',
    'Pasaporte',
    'Menor sin Identificación',
    'Adulto sin Identificación',
    'Carné Diplomático',
    'Salvoconducto',
    'Permiso Especial de Permanencia',
  ];

  const tiposSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleNext = async () => {
    const currentStepFields = steps[currentStep - 1].fields;
    
    // Validar solo los campos del paso actual
    if (currentStepFields.length > 0) {
      const isStepValid = await trigger(currentStepFields);
      if (!isStepValid) {
        toast({ 
          variant: "destructive",
          title: "Error de validación",
          description: "Por favor corrija los errores antes de continuar" 
        });
        return;
      }
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const addTag = (field, inputField) => {
    const value = inputValues[inputField].trim();
    const currentValues = form.getValues(field) || [];
    
    if (value && !currentValues.includes(value)) {
      setValue(field, [...currentValues, value], { shouldValidate: true });
      setInputValues({ ...inputValues, [inputField]: '' });
    }
  };

  const removeTag = (field, value) => {
    const currentValues = form.getValues(field) || [];
    setValue(field, currentValues.filter(item => item !== value), { shouldValidate: true });
  };

  const calcularIMC = () => {
    if (peso && altura) {
      const p = parseFloat(peso);
      const a = parseFloat(altura);
      if (p > 0 && a > 0) {
        const imc = p / (a ** 2);
        const imcValue = imc.toFixed(1);
        
        let categoria = '';
        if (imc < 18.5) categoria = 'Bajo Peso';
        else if (imc >= 18.5 && imc < 25) categoria = 'Normal';
        else if (imc >= 25 && imc < 30) categoria = 'Sobrepeso';
        else if (imc >= 30) categoria = 'Obesidad';
        
        return `${imcValue} - ${categoria}`;
      }
    }
    return null;
  };

  const uploadDocuments = async (pacienteId, token, apiUrl) => {
    if (!pacienteId || documentos.length === 0) return;

    try {
      console.log('Subiendo documentos para paciente:', pacienteId);
      
      for (const doc of documentos) {
        const formData = new FormData();
        formData.append('file', doc.file);
        formData.append('pacienteId', pacienteId);
        formData.append('categoria', 'General');
        
        const response = await fetch(`${apiUrl}/documentos-paciente/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          console.error('Error al subir documento:', doc.file.name);
        }
      }
    } catch (error) {
      console.error('Error al subir documentos:', error);
      toast({ description: 'Hubo un error al subir algunos documentos.' });
    }
  };

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // Transformar datos para la API (snake_case)
      const payload = {
        nombre: data.nombre,
        apellido: data.apellido,
        tipo_documento: data.tipoDocumento,
        cedula: data.cedula,
        fecha_nacimiento: data.fechaNacimiento,
        genero: data.genero === 'Otro' ? data.otroGenero : data.genero,
        estado_civil: data.estadoCivil,
        ocupacion: data.ocupacion,
        pais_nacimiento: data.paisNacimiento,
        departamento: data.departamento,
        municipio: data.municipio,
        barrio: data.barrio,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        contactos_emergencia: data.contactosEmergencia,
        nivel_educacion: data.nivelEducacion,
        empleador_actual: data.empleadorActual,
        eps: data.eps,
        regimen: data.regimen,
        tipo_afiliacion: data.tipoAfiliacion,
        nivel_sisben: data.nivelSisben,
        numero_autorizacion: data.numeroAutorizacion,
        fecha_afiliacion: data.fechaAfiliacion || null,
        convenio: data.convenio,
        arl: data.arl,
        carnet_poliza: data.carnetPoliza,
        tipo_usuario: data.tipoUsuario,
        referido_por: data.referidoPor,
        nombre_refiere: data.nombreRefiere,
        tipo_paciente: data.tipoPaciente,
        categoria: data.categoria,
        tipo_sangre: data.tipoSangre,
        peso: data.peso ? parseFloat(data.peso) : null,
        altura: data.altura ? parseFloat(data.altura) : null,
        alergias: data.alergias.join(', '),
        enfermedades_cronicas: data.enfermedadesCronicas.join(', '),
        medicamentos_actuales: data.medicamentosActuales.join(', '),
        antecedentes_quirurgicos: data.antecedentesQuirurgicos.join(', '),
      };

      const url = editingPaciente 
        ? `${apiUrl}/pacientes/${editingPaciente.id}`
        : `${apiUrl}/pacientes`;
      
      const method = editingPaciente ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        let pacienteId = result.data?.paciente?.id || result.data?.id || result.id;
        
        if (documentos.length > 0 && pacienteId) {
          setUploadingDocuments(true);
          await uploadDocuments(pacienteId, token, apiUrl);
          setUploadingDocuments(false);
        }
        
        setSavedPaciente({
          id: pacienteId || (editingPaciente ? editingPaciente.id : null),
          nombre: `${data.nombre} ${data.apellido}`
        });
        
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        const errorMessage = error.error?.details 
          ? error.error.details.map(d => d.message).join(', ') 
          : error.error || 'Error al guardar el paciente';
          
        toast({ 
          variant: "destructive",
          title: "Error al guardar",
          description: errorMessage 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ 
        variant: "destructive",
        title: "Error de red",
        description: "No se pudo conectar con el servidor" 
      });
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 hover:bg-gray-50 text-gray-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a la lista
      </Button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {editingPaciente ? 'Editar Paciente' : 'Nuevo Paciente'}
        </h1>
        <p className="text-gray-600 mb-8">
          Complete el formulario paso a paso. Los campos marcados con * son obligatorios.
        </p>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = completedSteps.includes(step.number);
              
              return (
                <div key={step.number} className="flex-1">
                  <div className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : isActive 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                      </div>
                      <p className={`mt-2 text-xs font-semibold text-center ${
                        isActive ? 'text-emerald-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        completedSteps.includes(step.number) ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              
              {/* PASO 1 */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-600" />
                      Datos Personales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Nombres *</Label>
                        <Input {...register('nombre')} className={`h-11 mt-2 ${errors.nombre ? 'border-red-500' : ''}`} placeholder="Ej: Juan Carlos" />
                        {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Apellidos *</Label>
                        <Input {...register('apellido')} className={`h-11 mt-2 ${errors.apellido ? 'border-red-500' : ''}`} placeholder="Ej: Pérez García" />
                        {errors.apellido && <p className="text-xs text-red-500 mt-1">{errors.apellido.message}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Tipo de Documento *</Label>
                        <Controller
                          name="tipoDocumento"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className={`h-11 mt-2 ${errors.tipoDocumento ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {tiposDocumento.map(tipo => (
                                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.tipoDocumento && <p className="text-xs text-red-500 mt-1">{errors.tipoDocumento.message}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Número de Documento *</Label>
                        <Input {...register('cedula')} className={`h-11 mt-2 ${errors.cedula ? 'border-red-500' : ''}`} placeholder="1234567890" />
                        {errors.cedula && <p className="text-xs text-red-500 mt-1">{errors.cedula.message}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Fecha de Nacimiento *</Label>
                        <Input type="date" {...register('fechaNacimiento')} className={`h-11 mt-2 ${errors.fechaNacimiento ? 'border-red-500' : ''}`} />
                        {errors.fechaNacimiento && <p className="text-xs text-red-500 mt-1">{errors.fechaNacimiento.message}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Género Biológico</Label>
                        <Controller
                          name="genero"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-11 mt-2">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      {genero === 'Otro' && (
                        <div className="md:col-span-2">
                          <Label className="text-sm font-semibold text-gray-700">Especifique *</Label>
                          <Input {...register('otroGenero')} className={`h-11 mt-2 ${errors.otroGenero ? 'border-red-500' : ''}`} placeholder="Especifique el género" />
                          {errors.otroGenero && <p className="text-xs text-red-500 mt-1">{errors.otroGenero.message}</p>}
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Estado Civil</Label>
                        <Controller
                          name="estadoCivil"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-11 mt-2">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {ESTADO_CIVIL.map(estado => (
                                  <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Ocupación</Label>
                        <Input {...register('ocupacion')} className="h-11 mt-2" placeholder="Ej: Médico, Ingeniero" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Ubicación y Residencia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">País de Nacimiento</Label>
                        <Controller
                          name="paisNacimiento"
                          control={control}
                          render={({ field }) => (
                            <Select 
                              onValueChange={(val) => {
                                field.onChange(val);
                                if (val !== 'Colombia') {
                                  setValue('departamento', '');
                                  setValue('municipio', '');
                                }
                              }} 
                              value={field.value}
                            >
                              <SelectTrigger className="h-11 mt-2">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {paisesData.map(pais => (
                                  <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Departamento *</Label>
                        {watch('paisNacimiento') === 'Colombia' ? (
                          <Controller
                            name="departamento"
                            control={control}
                            render={({ field }) => (
                              <Select 
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  setValue('municipio', ''); // Reset municipio
                                }} 
                                value={field.value}
                              >
                                <SelectTrigger className={`h-11 mt-2 ${errors.departamento ? 'border-red-500' : ''}`}>
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {colombiaData.departamentos
                                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                    .map(dept => (
                                      <SelectItem key={dept.id} value={dept.nombre}>{dept.nombre}</SelectItem>
                                    ))
                                  }
                                </SelectContent>
                              </Select>
                            )}
                          />
                        ) : (
                          <Input 
                            {...register('departamento')} 
                            className={`h-11 mt-2 ${errors.departamento ? 'border-red-500' : ''}`} 
                            placeholder="Estado / Provincia" 
                          />
                        )}
                        {errors.departamento && <p className="text-xs text-red-500 mt-1">{errors.departamento.message}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Municipio *</Label>
                        {watch('paisNacimiento') === 'Colombia' ? (
                          <Controller
                            name="municipio"
                            control={control}
                            render={({ field }) => (
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value} 
                                disabled={!departamento}
                              >
                                <SelectTrigger className={`h-11 mt-2 ${errors.municipio ? 'border-red-500' : ''}`}>
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {municipios.map(mun => (
                                    <SelectItem key={mun} value={mun}>{mun}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        ) : (
                          <Input 
                            {...register('municipio')} 
                            className={`h-11 mt-2 ${errors.municipio ? 'border-red-500' : ''}`} 
                            placeholder="Ciudad / Municipio" 
                          />
                        )}
                        {errors.municipio && <p className="text-xs text-red-500 mt-1">{errors.municipio.message}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Barrio / Vereda *</Label>
                        <Input {...register('barrio')} className={`h-11 mt-2 ${errors.barrio ? 'border-red-500' : ''}`} placeholder="Nombre del barrio" />
                        {errors.barrio && <p className="text-xs text-red-500 mt-1">{errors.barrio.message}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700">Dirección Completa *</Label>
                        <Input {...register('direccion')} className={`h-11 mt-2 ${errors.direccion ? 'border-red-500' : ''}`} placeholder="Calle 123 #45-67" />
                        {errors.direccion && <p className="text-xs text-red-500 mt-1">{errors.direccion.message}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2 */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-emerald-600" />
                      Información de Contacto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Teléfono Celular *</Label>
                        <Input {...register('telefono')} className={`h-11 mt-2 ${errors.telefono ? 'border-red-500' : ''}`} placeholder="+57 300 123 4567" />
                        {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono.message}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Correo Electrónico</Label>
                        <Input type="email" {...register('email')} className={`h-11 mt-2 ${errors.email ? 'border-red-500' : ''}`} placeholder="correo@ejemplo.com" />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h3 className="text-xl font-bold text-gray-900">Contactos de Emergencia</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Debe registrar al menos 1 contacto de emergencia.</p>
                    
                    <div className="space-y-4">
                      {contactosFields.map((field, index) => (
                        <div key={field.id} className="border-2 border-gray-200 rounded-xl p-4 relative">
                          {contactosFields.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeContacto(index)}
                              className="absolute top-2 right-2 text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                          <p className="font-semibold text-sm text-gray-700 mb-3">Contacto {index + 1}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Nombre *</Label>
                              <Input
                                {...register(`contactosEmergencia.${index}.nombre`)}
                                className="h-10 mt-1"
                                placeholder="Nombre completo"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Teléfono *</Label>
                              <Input
                                {...register(`contactosEmergencia.${index}.telefono`)}
                                className="h-10 mt-1"
                                placeholder="+57 300..."
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Parentesco *</Label>
                              <Input
                                {...register(`contactosEmergencia.${index}.parentesco`)}
                                className="h-10 mt-1"
                                placeholder="Ej: Madre"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.contactosEmergencia && <p className="text-xs text-red-500 mt-2">{errors.contactosEmergencia.message || errors.contactosEmergencia.root?.message}</p>}

                    {contactosFields.length < 5 && (
                      <Button
                        type="button"
                        onClick={() => appendContacto({ nombre: '', telefono: '', parentesco: '' })}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Otro Contacto
                      </Button>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Información Adicional</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Nivel de Educación</Label>
                        <Controller
                          name="nivelEducacion"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-11 mt-2">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {NIVEL_EDUCACION.map(nivel => (
                                  <SelectItem key={nivel.value} value={nivel.value}>{nivel.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Empleador Actual</Label>
                        <Input {...register('empleadorActual')} className="h-11 mt-2" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Aseguramiento en Salud</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">EPS Aseguradora</Label>
                        <Controller
                          name="eps"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-11 mt-2">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {epsData.map(eps => (
                                  <SelectItem key={eps} value={eps}>{eps}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Régimen de Afiliación</Label>
                        <Controller
                          name="regimen"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-11 mt-2">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {regimenesData.map(reg => (
                                  <SelectItem key={reg.id} value={reg.id}>{reg.nombre}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Tipo de Afiliación</Label>
                        <Controller
                          name="tipoAfiliacion"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-11 mt-2">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cotizante">Cotizante</SelectItem>
                                <SelectItem value="beneficiario">Beneficiario</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Nivel SISBEN IV</Label>
                        <Input {...register('nivelSisben')} className="h-11 mt-2" placeholder="Ej: A1" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Número de Autorización</Label>
                        <Input {...register('numeroAutorizacion')} className="h-11 mt-2" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Fecha de Afiliación</Label>
                        <Input type="date" {...register('fechaAfiliacion')} className="h-11 mt-2" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Convenios y Aseguramiento Laboral</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Tipo de Usuario</Label>
                        <Controller
                          name="tipoUsuario"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-11 mt-2">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {TIPO_USUARIO.map(tipo => (
                                  <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Convenio</Label>
                        <Input {...register('convenio')} className="h-11 mt-2" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">ARL</Label>
                        <Controller
                          name="arl"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-11 mt-2">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {ARL_COLOMBIA.map(arl => (
                                  <SelectItem key={arl.codigo} value={arl.nombre}>{arl.nombre}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Número de Carnet / Póliza</Label>
                        <Input {...register('carnetPoliza')} className="h-11 mt-2" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Información de Referencia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Referido Por</Label>
                        <Input {...register('referidoPor')} className="h-11 mt-2" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Nombre de Quien Refiere</Label>
                        <Input {...register('nombreRefiere')} className="h-11 mt-2" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Tipo de Paciente</Label>
                        <Input {...register('tipoPaciente')} className="h-11 mt-2" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Categoría</Label>
                        <Input {...register('categoria')} className="h-11 mt-2" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 4 */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Activity className="w-6 h-6 text-emerald-600" />
                      <h3 className="text-xl font-bold text-gray-900">Datos Médicos Básicos</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Droplet className="w-4 h-4 text-red-500" />
                          Tipo de Sangre *
                        </Label>
                        <Controller
                          name="tipoSangre"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className={`h-12 ${errors.tipoSangre ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {tiposSangre.map(tipo => (
                                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.tipoSangre && <p className="text-xs text-red-500 mt-1">{errors.tipoSangre.message}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Scale className="w-4 h-4 text-blue-500" />
                          Peso (kg)
                        </Label>
                        <Input type="number" step="0.1" {...register('peso')} className="h-12" placeholder="70" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-green-500" />
                          Altura (m)
                        </Label>
                        <Input type="number" step="0.01" {...register('altura')} className="h-12" placeholder="1.70" />
                      </div>
                    </div>

                    {calcularIMC() && (
                      <div className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">IMC Calculado</span>
                          <span className="text-lg font-bold text-emerald-600">{calcularIMC()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags Sections */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Historial Médico</h3>
                    
                    {/* Alergias */}
                    <div className="mb-6 p-6 bg-red-50 border-2 border-red-100 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-bold text-red-900">Alergias</h4>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={inputValues.alergia}
                          onChange={(e) => setInputValues({ ...inputValues, alergia: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('alergias', 'alergia'))}
                          className="h-11 bg-white border-red-200"
                          placeholder="Escriba una alergia y presione Enter"
                        />
                        <Button type="button" onClick={() => addTag('alergias', 'alergia')} className="bg-red-600 hover:bg-red-700 px-4">
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {watch('alergias')?.map((tag, i) => (
                          <Badge key={i} className="bg-red-600 text-white px-3 py-1.5 text-sm">
                            {tag} <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeTag('alergias', tag)} />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Enfermedades Crónicas */}
                    <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-100 rounded-xl">
                      <h4 className="text-base font-bold text-yellow-900 mb-4">Enfermedades Crónicas</h4>
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={inputValues.enfermedad}
                          onChange={(e) => setInputValues({ ...inputValues, enfermedad: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('enfermedadesCronicas', 'enfermedad'))}
                          className="h-11 bg-white border-yellow-200"
                          placeholder="Escriba una enfermedad y presione Enter"
                        />
                        <Button type="button" onClick={() => addTag('enfermedadesCronicas', 'enfermedad')} className="bg-yellow-600 hover:bg-yellow-700 px-4">
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {watch('enfermedadesCronicas')?.map((tag, i) => (
                          <Badge key={i} className="bg-yellow-600 text-white px-3 py-1.5 text-sm">
                            {tag} <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeTag('enfermedadesCronicas', tag)} />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Medicamentos */}
                    <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-100 rounded-xl">
                      <h4 className="text-base font-bold text-blue-900 mb-4">Medicamentos Actuales</h4>
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={inputValues.medicamento}
                          onChange={(e) => setInputValues({ ...inputValues, medicamento: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('medicamentosActuales', 'medicamento'))}
                          className="h-11 bg-white border-blue-200"
                          placeholder="Escriba un medicamento y presione Enter"
                        />
                        <Button type="button" onClick={() => addTag('medicamentosActuales', 'medicamento')} className="bg-blue-600 hover:bg-blue-700 px-4">
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {watch('medicamentosActuales')?.map((tag, i) => (
                          <Badge key={i} className="bg-blue-600 text-white px-3 py-1.5 text-sm">
                            {tag} <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeTag('medicamentosActuales', tag)} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 5 */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Documentos del Paciente</h3>
                      <p className="text-sm text-gray-600">Sube documentos importantes.</p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:border-blue-400 transition-all">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Arrastra archivos aquí</h4>
                    <input
                      type="file"
                      multiple
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          if (file.size > 10 * 1024 * 1024) {
                            alert(`El archivo ${file.name} excede el tamaño máximo de 10MB`);
                            return;
                          }
                          setDocumentos(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
                        });
                        e.target.value = '';
                      }}
                    />
                    <Button type="button" onClick={() => document.getElementById('file-upload').click()} className="bg-blue-600 hover:bg-blue-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Seleccionar Archivos
                    </Button>
                  </div>

                  {documentos.length > 0 && (
                    <div className="space-y-3">
                      {documentos.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-semibold">{doc.file.name}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              URL.revokeObjectURL(doc.preview);
                              setDocumentos(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Botones de Navegación */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="border-2 h-11"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                {currentStep < 5 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 h-11"
                  >
                    Siguiente
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={uploadingDocuments}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 h-11"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {uploadingDocuments ? 'Subiendo documentos...' : 'Finalizar y Guardar'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        pacienteId={savedPaciente?.id}
        pacienteNombre={savedPaciente?.nombre}
      />
    </div>
  );
}
