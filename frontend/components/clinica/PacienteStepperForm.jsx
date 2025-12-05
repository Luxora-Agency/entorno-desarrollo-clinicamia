'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, User, Phone, Shield, Activity, AlertCircle, Plus, X, Droplet, Scale, Ruler } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import epsData from '@/data/eps.json';
import regimenesData from '@/data/regimenes.json';
import colombiaData from '@/data/colombia.json';
import SuccessModal from './SuccessModal';

export default function PacienteStepperForm({ user, editingPaciente, onBack, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedPaciente, setSavedPaciente] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    // Paso 1: Información Básica
    nombres: '',
    apellidos: '',
    tipoDocumento: '',
    numeroDocumento: '',
    fechaNacimiento: '',
    generoBiologico: '',
    otroGenero: '',
    paisNacimiento: 'Colombia',
    departamento: '',
    municipio: '',
    barrioVereda: '',
    direccionCompleta: '',
    
    // Paso 2: Contacto
    telefonoCelular: '',
    correoElectronico: '',
    contactosEmergencia: [{ nombre: '', telefono: '', parentesco: '' }],
    
    // Paso 3: Aseguramiento
    epsAseguradora: '',
    regimenAfiliacion: '',
    tipoAfiliacion: '',
    nivelSisben: '',
    numeroAutorizacion: '',
    fechaAfiliacion: '',
    
    // Paso 4: Información Médica
    tipoSangre: '',
    peso: '',
    altura: '',
    alergias: [],
    enfermedadesCronicas: [],
    medicamentosActuales: [],
    antecedentesQuirurgicos: [],
  });

  const [municipios, setMunicipios] = useState([]);
  const [inputValues, setInputValues] = useState({
    alergia: '',
    enfermedad: '',
    medicamento: '',
    antecedente: '',
  });

  const steps = [
    { number: 1, title: 'Información Básica', icon: User },
    { number: 2, title: 'Contacto y Emergencias', icon: Phone },
    { number: 3, title: 'Aseguramiento en Salud', icon: Shield },
    { number: 4, title: 'Información Médica', icon: Activity },
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

  // Cargar datos al editar
  useEffect(() => {
    if (editingPaciente) {
      // Parsear contactos de emergencia
      let contactos = [{ nombre: '', telefono: '', parentesco: '' }];
      if (editingPaciente.contactosEmergencia) {
        try {
          const parsed = typeof editingPaciente.contactosEmergencia === 'string'
            ? JSON.parse(editingPaciente.contactosEmergencia)
            : editingPaciente.contactosEmergencia;
          contactos = parsed.length > 0 ? parsed : contactos;
        } catch (e) {
          console.error('Error parsing contactos:', e);
        }
      }

      // Parsear arrays de historial médico
      const parseArray = (data) => {
        if (!data) return [];
        try {
          // Si es un array, retornarlo
          if (Array.isArray(data)) return data;
          // Si es string con JSON, parsear
          if (typeof data === 'string') {
            // Intentar parsear como JSON primero
            try {
              const parsed = JSON.parse(data);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              // Si falla, asumir que es string separado por comas
              return data.split(',').map(item => item.trim()).filter(item => item);
            }
          }
          return [];
        } catch (e) {
          console.error('Error parsing array:', e);
          return [];
        }
      };

      setFormData({
        nombres: editingPaciente.nombre || '',
        apellidos: editingPaciente.apellido || '',
        tipoDocumento: editingPaciente.tipoDocumento || '',
        numeroDocumento: editingPaciente.cedula || '',
        fechaNacimiento: editingPaciente.fechaNacimiento ? editingPaciente.fechaNacimiento.split('T')[0] : '',
        generoBiologico: editingPaciente.genero || '',
        otroGenero: '',
        paisNacimiento: editingPaciente.paisNacimiento || 'Colombia',
        departamento: editingPaciente.departamento || '',
        municipio: editingPaciente.municipio || '',
        barrioVereda: editingPaciente.barrio || '',
        direccionCompleta: editingPaciente.direccion || '',
        telefonoCelular: editingPaciente.telefono || '',
        correoElectronico: editingPaciente.email || '',
        contactosEmergencia: contactos,
        epsAseguradora: editingPaciente.eps || '',
        regimenAfiliacion: editingPaciente.regimen || '',
        tipoAfiliacion: editingPaciente.tipoAfiliacion || '',
        nivelSisben: editingPaciente.nivelSisben || '',
        numeroAutorizacion: editingPaciente.numeroAutorizacion || '',
        fechaAfiliacion: editingPaciente.fechaAfiliacion ? editingPaciente.fechaAfiliacion.split('T')[0] : '',
        tipoSangre: editingPaciente.tipoSangre || '',
        peso: editingPaciente.peso || '',
        altura: editingPaciente.altura || '',
        alergias: parseArray(editingPaciente.alergias),
        enfermedadesCronicas: parseArray(editingPaciente.enfermedadesCronicas),
        medicamentosActuales: parseArray(editingPaciente.medicamentosActuales),
        antecedentesQuirurgicos: parseArray(editingPaciente.antecedentesQuirurgicos),
      });
    }
  }, [editingPaciente]);

  useEffect(() => {
    if (formData.departamento) {
      const dept = colombiaData.departamentos.find(d => d.nombre === formData.departamento);
      setMunicipios(dept ? dept.municipios : []);
    }
  }, [formData.departamento]);

  const validateStep1 = () => {
    if (!formData.nombres.trim()) return false;
    if (!formData.tipoDocumento) return false;
    if (!formData.departamento) return false;
    if (!formData.municipio) return false;
    if (!formData.barrioVereda.trim()) return false;
    if (!formData.direccionCompleta.trim()) return false;
    return true;
  };

  const validateStep2 = () => {
    if (!formData.telefonoCelular.trim()) return false;
    if (!formData.correoElectronico.trim()) return false;
    const validContact = formData.contactosEmergencia.some(
      c => c.nombre.trim() && c.telefono.trim() && c.parentesco.trim()
    );
    return validContact;
  };

  const validateStep3 = () => {
    // Paso 3 es opcional
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      alert('Por favor complete todos los campos obligatorios del Paso 1');
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      alert('Por favor complete todos los campos obligatorios del Paso 2 y al menos un contacto de emergencia');
      return;
    }
    
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const addContactoEmergencia = () => {
    if (formData.contactosEmergencia.length < 5) {
      setFormData({
        ...formData,
        contactosEmergencia: [...formData.contactosEmergencia, { nombre: '', telefono: '', parentesco: '' }]
      });
    }
  };

  const removeContactoEmergencia = (index) => {
    if (formData.contactosEmergencia.length > 1) {
      const newContactos = formData.contactosEmergencia.filter((_, i) => i !== index);
      setFormData({ ...formData, contactosEmergencia: newContactos });
    }
  };

  const updateContactoEmergencia = (index, field, value) => {
    const newContactos = [...formData.contactosEmergencia];
    newContactos[index][field] = value;
    setFormData({ ...formData, contactosEmergencia: newContactos });
  };

  const addTag = (field, inputField) => {
    const value = inputValues[inputField].trim();
    if (value && !formData[field].includes(value)) {
      setFormData({ ...formData, [field]: [...formData[field], value] });
      setInputValues({ ...inputValues, [inputField]: '' });
    }
  };

  const removeTag = (field, value) => {
    setFormData({ ...formData, [field]: formData[field].filter(item => item !== value) });
  };

  const calcularIMC = () => {
    if (formData.peso && formData.altura) {
      const peso = parseFloat(formData.peso);
      const altura = parseFloat(formData.altura);
      if (peso > 0 && altura > 0) {
        const imc = peso / (altura ** 2);
        const imcValue = imc.toFixed(1);
        
        // Determinar categoría
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

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const payload = {
        nombre: formData.nombres,
        apellido: formData.apellidos,
        tipo_documento: formData.tipoDocumento,
        cedula: formData.numeroDocumento,
        fecha_nacimiento: formData.fechaNacimiento,
        genero: formData.generoBiologico === 'Otro' ? formData.otroGenero : formData.generoBiologico,
        pais_nacimiento: formData.paisNacimiento,
        departamento: formData.departamento,
        municipio: formData.municipio,
        barrio: formData.barrioVereda,
        direccion: formData.direccionCompleta,
        telefono: formData.telefonoCelular,
        email: formData.correoElectronico,
        contactos_emergencia: formData.contactosEmergencia,
        eps: formData.epsAseguradora,
        regimen: formData.regimenAfiliacion,
        tipo_afiliacion: formData.tipoAfiliacion,
        nivel_sisben: formData.nivelSisben,
        numero_autorizacion: formData.numeroAutorizacion,
        fecha_afiliacion: formData.fechaAfiliacion,
        tipo_sangre: formData.tipoSangre,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        alergias: formData.alergias.join(', '),
        enfermedades_cronicas: formData.enfermedadesCronicas.join(', '),
        medicamentos_actuales: formData.medicamentosActuales.join(', '),
        antecedentes_quirurgicos: formData.antecedentesQuirurgicos.join(', '),
        // Mantener compatibilidad
        contacto_emergencia_nombre: formData.contactosEmergencia[0]?.nombre || '',
        contacto_emergencia_telefono: formData.contactosEmergencia[0]?.telefono || '',
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
        const paciente = result.data || result;
        
        // Guardar datos del paciente para el modal
        setSavedPaciente({
          id: paciente.id,
          nombre: `${formData.nombres} ${formData.apellidos}`
        });
        
        // Mostrar modal de éxito
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al guardar el paciente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el paciente');
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    // Si el usuario cierra el modal sin elegir, ir a la lista por defecto
    if (onSuccess) {
      onSuccess();
    }
  };

  const regimenSeleccionado = regimenesData.find(r => r.id === formData.regimenAfiliacion);

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
          {editingPaciente 
            ? 'Actualice la información del paciente en los siguientes pasos'
            : 'Complete el formulario paso a paso para registrar un nuevo paciente'
          }
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

        {/* Step Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
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
                      <Input
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        className="h-11 mt-2"
                        placeholder="Ej: Juan Carlos"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Apellidos</Label>
                      <Input
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        className="h-11 mt-2"
                        placeholder="Ej: Pérez García"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Tipo de Documento *</Label>
                      <Select value={formData.tipoDocumento} onValueChange={(value) => setFormData({ ...formData, tipoDocumento: value })}>
                        <SelectTrigger className="h-11 mt-2">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposDocumento.map(tipo => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Número de Documento</Label>
                      <Input
                        value={formData.numeroDocumento}
                        onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                        className="h-11 mt-2"
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Fecha de Nacimiento</Label>
                      <Input
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                        className="h-11 mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Género Biológico</Label>
                      <Select value={formData.generoBiologico} onValueChange={(value) => setFormData({ ...formData, generoBiologico: value })}>
                        <SelectTrigger className="h-11 mt-2">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Femenino">Femenino</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.generoBiologico === 'Otro' && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700">Especifique</Label>
                        <Input
                          value={formData.otroGenero}
                          onChange={(e) => setFormData({ ...formData, otroGenero: e.target.value })}
                          className="h-11 mt-2"
                          placeholder="Especifique el género"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Ubicación y Residencia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">País de Nacimiento</Label>
                      <Input
                        value={formData.paisNacimiento}
                        onChange={(e) => setFormData({ ...formData, paisNacimiento: e.target.value })}
                        className="h-11 mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Departamento *</Label>
                      <Select value={formData.departamento} onValueChange={(value) => {
                        setFormData({ ...formData, departamento: value, municipio: '' });
                      }}>
                        <SelectTrigger className="h-11 mt-2">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {colombiaData.departamentos.map(dept => (
                            <SelectItem key={dept.id} value={dept.nombre}>{dept.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Municipio *</Label>
                      <Select 
                        value={formData.municipio} 
                        onValueChange={(value) => setFormData({ ...formData, municipio: value })}
                        disabled={!formData.departamento}
                      >
                        <SelectTrigger className="h-11 mt-2">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {municipios.map(mun => (
                            <SelectItem key={mun} value={mun}>{mun}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Barrio / Vereda *</Label>
                      <Input
                        value={formData.barrioVereda}
                        onChange={(e) => setFormData({ ...formData, barrioVereda: e.target.value })}
                        className="h-11 mt-2"
                        placeholder="Nombre del barrio o vereda"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-semibold text-gray-700">Dirección Completa *</Label>
                      <Input
                        value={formData.direccionCompleta}
                        onChange={(e) => setFormData({ ...formData, direccionCompleta: e.target.value })}
                        className="h-11 mt-2"
                        placeholder="Calle 123 #45-67"
                      />
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
                      <Input
                        value={formData.telefonoCelular}
                        onChange={(e) => setFormData({ ...formData, telefonoCelular: e.target.value })}
                        className="h-11 mt-2"
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Correo Electrónico *</Label>
                      <Input
                        type="email"
                        value={formData.correoElectronico}
                        onChange={(e) => setFormData({ ...formData, correoElectronico: e.target.value })}
                        className="h-11 mt-2"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="text-xl font-bold text-gray-900">Contactos de Emergencia</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Debe registrar al menos 1 contacto de emergencia (máximo 5)</p>
                  
                  <div className="space-y-4">
                    {formData.contactosEmergencia.map((contacto, index) => (
                      <div key={index} className="border-2 border-gray-200 rounded-xl p-4 relative">
                        {formData.contactosEmergencia.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeContactoEmergencia(index)}
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
                              value={contacto.nombre}
                              onChange={(e) => updateContactoEmergencia(index, 'nombre', e.target.value)}
                              className="h-10 mt-1"
                              placeholder="Nombre completo"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Teléfono *</Label>
                            <Input
                              value={contacto.telefono}
                              onChange={(e) => updateContactoEmergencia(index, 'telefono', e.target.value)}
                              className="h-10 mt-1"
                              placeholder="+57 300..."
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Parentesco *</Label>
                            <Input
                              value={contacto.parentesco}
                              onChange={(e) => updateContactoEmergencia(index, 'parentesco', e.target.value)}
                              className="h-10 mt-1"
                              placeholder="Ej: Madre, Esposo"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.contactosEmergencia.length < 5 && (
                    <Button
                      type="button"
                      onClick={addContactoEmergencia}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Otro Contacto
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-900 mb-2">Información RIPS 2025</h4>
                  <p className="text-sm text-blue-800">
                    Los datos de aseguramiento son requeridos para los reportes de Registros Individuales de Prestación de Servicios de Salud (RIPS).
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Aseguramiento en Salud</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">EPS Aseguradora</Label>
                      <Select value={formData.epsAseguradora} onValueChange={(value) => setFormData({ ...formData, epsAseguradora: value })}>
                        <SelectTrigger className="h-11 mt-2">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {epsData.map(eps => (
                            <SelectItem key={eps} value={eps}>{eps}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Régimen de Afiliación</Label>
                      <Select value={formData.regimenAfiliacion} onValueChange={(value) => setFormData({ ...formData, regimenAfiliacion: value })}>
                        <SelectTrigger className="h-11 mt-2">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {regimenesData.map(reg => (
                            <SelectItem key={reg.id} value={reg.id}>{reg.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Tipo de Afiliación</Label>
                      <Select value={formData.tipoAfiliacion} onValueChange={(value) => setFormData({ ...formData, tipoAfiliacion: value })}>
                        <SelectTrigger className="h-11 mt-2">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cotizante">Cotizante</SelectItem>
                          <SelectItem value="beneficiario">Beneficiario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {regimenSeleccionado?.requiereSisben && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Nivel SISBEN IV</Label>
                        <Input
                          value={formData.nivelSisben}
                          onChange={(e) => setFormData({ ...formData, nivelSisben: e.target.value })}
                          className="h-11 mt-2"
                          placeholder="Nivel..."
                        />
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Número de Autorización (Opcional)</Label>
                      <Input
                        value={formData.numeroAutorizacion}
                        onChange={(e) => setFormData({ ...formData, numeroAutorizacion: e.target.value })}
                        className="h-11 mt-2"
                        placeholder="123456"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Fecha de Afiliación</Label>
                      <Input
                        type="date"
                        value={formData.fechaAfiliacion}
                        onChange={(e) => setFormData({ ...formData, fechaAfiliacion: e.target.value })}
                        className="h-11 mt-2"
                      />
                    </div>
                  </div>
                </div>

                {(formData.epsAseguradora || formData.regimenAfiliacion) && (
                  <Card className="bg-gray-50 border-2 border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-bold text-gray-900 mb-3">Resumen de Aseguramiento</h4>
                      <div className="space-y-2 text-sm">
                        {formData.epsAseguradora && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">EPS:</span>
                            <span className="font-semibold">{formData.epsAseguradora}</span>
                          </div>
                        )}
                        {formData.regimenAfiliacion && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Régimen:</span>
                            <span className="font-semibold">{regimenesData.find(r => r.id === formData.regimenAfiliacion)?.nombre}</span>
                          </div>
                        )}
                        {formData.tipoAfiliacion && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tipo:</span>
                            <span className="font-semibold capitalize">{formData.tipoAfiliacion}</span>
                          </div>
                        )}
                        {formData.fechaAfiliacion && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fecha de Afiliación:</span>
                            <span className="font-semibold">{formData.fechaAfiliacion}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* PASO 4 */}
            {currentStep === 4 && (
              <div className="space-y-8">
                {/* Datos Médicos Básicos */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-xl font-bold text-gray-900">Datos Médicos Básicos</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tipo de Sangre */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-red-500" />
                        Tipo de Sangre <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.tipoSangre} onValueChange={(value) => setFormData({ ...formData, tipoSangre: value })}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposSangre.map(tipo => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Peso */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Scale className="w-4 h-4 text-blue-500" />
                        Peso (kg) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.peso}
                        onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                        className="h-12"
                        placeholder="70"
                      />
                    </div>

                    {/* Altura */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        Altura (m) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.altura}
                        onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                        className="h-12"
                        placeholder="1.7"
                      />
                      <p className="text-xs text-gray-500 mt-1">En metros (Ej: 1.75)</p>
                    </div>
                  </div>

                  {/* IMC Calculado */}
                  {calcularIMC() && (
                    <div className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">IMC Calculado</span>
                        <span className="text-lg font-bold text-emerald-600">{calcularIMC()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Historial Médico */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-6 h-6 text-pink-600" />
                    <h3 className="text-xl font-bold text-gray-900">Historial Médico</h3>
                  </div>

                  {/* Alergias */}
                  <div className="mb-6 p-6 bg-red-50 border-2 border-red-100 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold text-red-900">Alergias</h4>
                      <span className="text-xs text-red-600 font-semibold">{formData.alergias.length}/20</span>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={inputValues.alergia}
                        onChange={(e) => setInputValues({ ...inputValues, alergia: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('alergias', 'alergia'))}
                        className="h-11 bg-white border-red-200"
                        placeholder="Escriba una alergia y presione Enter"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addTag('alergias', 'alergia')} 
                        className="bg-red-600 hover:bg-red-700 px-4"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>

                    <p className="text-xs text-red-700 mb-3">Ej: Penicilina, Mariscos, Polen, Látex</p>

                    {formData.alergias.length === 0 ? (
                      <p className="text-sm text-red-600 italic">No tiene alergias conocidas</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.alergias.map((alergia, i) => (
                          <Badge key={i} className="bg-red-600 text-white px-3 py-1.5 text-sm">
                            {alergia}
                            <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeTag('alergias', alergia)} />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Enfermedades Crónicas */}
                  <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-100 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold text-yellow-900">Enfermedades Crónicas</h4>
                      <span className="text-xs text-yellow-600 font-semibold">{formData.enfermedadesCronicas.length}/20</span>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={inputValues.enfermedad}
                        onChange={(e) => setInputValues({ ...inputValues, enfermedad: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('enfermedadesCronicas', 'enfermedad'))}
                        className="h-11 bg-white border-yellow-200"
                        placeholder="Escriba una enfermedad y presione Enter"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addTag('enfermedadesCronicas', 'enfermedad')} 
                        className="bg-yellow-600 hover:bg-yellow-700 px-4"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>

                    <p className="text-xs text-yellow-700 mb-3">Ej: Diabetes, Hipertensión, Asma</p>

                    {formData.enfermedadesCronicas.length === 0 ? (
                      <p className="text-sm text-yellow-600 italic">No tiene enfermedades crónicas</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.enfermedadesCronicas.map((enfermedad, i) => (
                          <Badge key={i} className="bg-yellow-600 text-white px-3 py-1.5 text-sm">
                            {enfermedad}
                            <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeTag('enfermedadesCronicas', enfermedad)} />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Medicamentos Actuales */}
                  <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-100 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold text-blue-900">Medicamentos Actuales</h4>
                      <span className="text-xs text-blue-600 font-semibold">{formData.medicamentosActuales.length}/20</span>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={inputValues.medicamento}
                        onChange={(e) => setInputValues({ ...inputValues, medicamento: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('medicamentosActuales', 'medicamento'))}
                        className="h-11 bg-white border-blue-200"
                        placeholder="Escriba un medicamento y presione Enter"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addTag('medicamentosActuales', 'medicamento')} 
                        className="bg-blue-600 hover:bg-blue-700 px-4"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>

                    <p className="text-xs text-blue-700 mb-3">Ej: Metformina 500mg, Losartán 50mg</p>

                    {formData.medicamentosActuales.length === 0 ? (
                      <p className="text-sm text-blue-600 italic">No toma medicamentos actualmente</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.medicamentosActuales.map((medicamento, i) => (
                          <Badge key={i} className="bg-blue-600 text-white px-3 py-1.5 text-sm">
                            {medicamento}
                            <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeTag('medicamentosActuales', medicamento)} />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Antecedentes Quirúrgicos */}
                  <div className="p-6 bg-purple-50 border-2 border-purple-100 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold text-purple-900">Antecedentes Quirúrgicos</h4>
                      <span className="text-xs text-purple-600 font-semibold">{formData.antecedentesQuirurgicos.length}/20</span>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={inputValues.antecedente}
                        onChange={(e) => setInputValues({ ...inputValues, antecedente: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('antecedentesQuirurgicos', 'antecedente'))}
                        className="h-11 bg-white border-purple-200"
                        placeholder="Escriba un procedimiento y presione Enter"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addTag('antecedentesQuirurgicos', 'antecedente')} 
                        className="bg-purple-600 hover:bg-purple-700 px-4"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>

                    <p className="text-xs text-purple-700 mb-3">Ej: Apendicectomía 2015, Cesárea 2018</p>

                    {formData.antecedentesQuirurgicos.length === 0 ? (
                      <p className="text-sm text-purple-600 italic">Sin antecedentes quirúrgicos</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.antecedentesQuirurgicos.map((antecedente, i) => (
                          <Badge key={i} className="bg-purple-600 text-white px-3 py-1.5 text-sm">
                            {antecedente}
                            <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeTag('antecedentesQuirurgicos', antecedente)} />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
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
          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-11"
            >
              Siguiente
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-11"
            >
              <Check className="w-4 h-4 mr-2" />
              Finalizar y Guardar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
