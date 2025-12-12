'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, User, Briefcase, Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, Clock, Mail, Phone, MapPin, GraduationCap, Award, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import TimeBlockModal from './TimeBlockModal';

export default function DoctorForm({ user, editingDoctor, onBack }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basica');
  const [especialidades, setEspecialidades] = useState([]);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState([]);
  const [searchEspecialidad, setSearchEspecialidad] = useState('');
  const [showEspecialidadesDropdown, setShowEspecialidadesDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
    genero: '',
    fecha_nacimiento: '',
    direccion: '',
    licencia_medica: '',
    universidad: '',
    anios_experiencia: '',
    biografia: '',
    activo: true,
  });

  useEffect(() => {
    loadEspecialidades();
    if (editingDoctor) {
      loadDoctorData();
    }
  }, [editingDoctor]);

  const loadEspecialidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/especialidades?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEspecialidades(data.data || []);
    } catch (error) {
      console.error('Error loading especialidades:', error);
    }
  };

  const loadDoctorData = async () => {
    if (!editingDoctor) return;
    
    setFormData({
      nombre: editingDoctor.nombre || '',
      apellido: editingDoctor.apellido || '',
      cedula: editingDoctor.cedula || '',
      email: editingDoctor.email || '',
      telefono: editingDoctor.telefono || '',
      genero: editingDoctor.genero || '',
      fecha_nacimiento: editingDoctor.fechaNacimiento || '',
      direccion: editingDoctor.direccion || '',
      licencia_medica: editingDoctor.licenciaMedica || '',
      universidad: editingDoctor.universidad || '',
      anios_experiencia: editingDoctor.aniosExperiencia || '',
      biografia: editingDoctor.biografia || '',
      activo: editingDoctor.activo !== undefined ? editingDoctor.activo : true,
    });

    if (editingDoctor.especialidadesIds) {
      setSelectedEspecialidades(editingDoctor.especialidadesIds);
    }

    if (editingDoctor.horarios) {
      setSelectedDates(editingDoctor.horarios);
    }
  };

  const handleEspecialidadToggle = (especialidadId) => {
    setSelectedEspecialidades(prev => {
      if (prev.includes(especialidadId)) {
        return prev.filter(id => id !== especialidadId);
      } else {
        return [...prev, especialidadId];
      }
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handleDateClick = (dateStr) => {
    const existingBlocks = selectedDates[dateStr] || [];
    setSelectedDateForModal(dateStr);
    setModalOpen(true);
  };

  const handleSaveBlocks = (blocks) => {
    if (blocks.length > 0) {
      setSelectedDates(prev => ({
        ...prev,
        [selectedDateForModal]: blocks
      }));
    } else {
      setSelectedDates(prev => {
        const newDates = { ...prev };
        delete newDates[selectedDateForModal];
        return newDates;
      });
    }
  };

  const removeDate = (dateStr) => {
    setSelectedDates(prev => {
      const newDates = { ...prev };
      delete newDates[dateStr];
      return newDates;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de campos obligatorios
    if (!formData.nombre?.trim()) {
      toast({ description: 'El nombre es obligatorio' });
      setActiveTab('basica');
      return;
    }
    
    if (!formData.apellido?.trim()) {
      toast({ description: 'El apellido es obligatorio' });
      setActiveTab('basica');
      return;
    }
    
    if (!formData.cedula?.trim()) {
      toast({ description: 'La cédula es obligatoria' });
      setActiveTab('basica');
      return;
    }
    
    if (!formData.email?.trim()) {
      toast({ description: 'El email es obligatorio' });
      setActiveTab('basica');
      return;
    }
    
    if (!formData.telefono?.trim()) {
      toast({ description: 'El teléfono es obligatorio' });
      setActiveTab('basica');
      return;
    }
    
    if (selectedEspecialidades.length === 0) {
      toast({ description: 'Debe seleccionar al menos una especialidad' });
      setActiveTab('basica');
      return;
    }
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const payload = {
        ...formData,
        especialidades_ids: selectedEspecialidades,
        horarios: selectedDates,
      };

      const url = editingDoctor
        ? `${apiUrl}/doctores/${editingDoctor.id}`
        : `${apiUrl}/doctores`;
      
      const method = editingDoctor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        onBack();
      } else {
        alert(data.error || data.message || 'Error al guardar el doctor');
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast({ description: 'Error al guardar el doctor' });
    } finally {
      setLoading(false);
    }
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-gray-50 text-gray-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a la lista
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {editingDoctor ? 'Editar Doctor' : 'Agregar Nuevo Doctor'}
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            Doctores &gt; Todos los Doctores &gt; {editingDoctor ? 'Editar' : 'Agregar Nuevo'}
          </p>
          <p className="text-base text-gray-600 mb-6">
            Complete la información del nuevo doctor en el formulario. Los campos están organizados en tres secciones para facilitar el registro:
          </p>
          
          {/* Cards de información */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Información Básica</h3>
                  <p className="text-xs text-gray-600">Nombre completo, cédula, especialidades, email, teléfono</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Información Profesional</h3>
                  <p className="text-xs text-gray-600">Licencia médica, universidad, años de experiencia, biografía</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Horarios de Atención</h3>
                  <p className="text-xs text-gray-600">Días y horarios de disponibilidad</p>
                </div>
              </div>
            </div>
          </div>

          {/* Campos requeridos */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Campos Requeridos</h3>
              <p className="text-sm text-gray-600">
                Solo los campos básicos son obligatorios: <strong>nombre completo, cédula, especialidades, email y teléfono</strong>. 
                La información profesional y horarios son opcionales pero recomendados para un perfil completo.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-gray-100 p-1.5 rounded-xl">
              <TabsTrigger value="basica" className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <User className="w-5 h-5" />
                <span className="hidden sm:inline font-semibold">Información Básica</span>
                <span className="sm:hidden font-semibold">Básica</span>
              </TabsTrigger>
              <TabsTrigger value="profesional" className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Briefcase className="w-5 h-5" />
                <span className="hidden sm:inline font-semibold">Info. Profesional</span>
                <span className="sm:hidden font-semibold">Profesional</span>
              </TabsTrigger>
              <TabsTrigger value="horarios" className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <CalendarIcon className="w-5 h-5" />
                <span className="hidden sm:inline font-semibold">Horarios</span>
                <span className="sm:hidden font-semibold">Horarios</span>
              </TabsTrigger>
            </TabsList>

            {/* Información Básica */}
            <TabsContent value="basica">
              <Card className="shadow-lg border-0 bg-white">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {/* Nombre Completo del Doctor */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-600" />
                        Nombre Completo del Doctor
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700">
                            Nombre *
                          </Label>
                          <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                            className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg"
                            placeholder="Ej: Juan Carlos"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apellido" className="text-sm font-semibold text-gray-700">Apellido *</Label>
                          <Input
                            id="apellido"
                            value={formData.apellido}
                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                            required
                            className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg"
                            placeholder="Ej: Pérez García"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cédula */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Cédula</h3>
                      <div className="space-y-2">
                        <Label htmlFor="cedula" className="text-sm font-semibold text-gray-700">Número de Cédula *</Label>
                        <Input
                          id="cedula"
                          value={formData.cedula}
                          onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                          required
                          className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg max-w-md"
                          placeholder="1234567890"
                        />
                      </div>
                    </div>

                    {/* Especialidades - Select múltiple con búsqueda */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        Especialidades *
                      </h3>
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            placeholder="Buscar y seleccionar especialidades..."
                            value={searchEspecialidad}
                            onChange={(e) => setSearchEspecialidad(e.target.value)}
                            onFocus={() => setShowEspecialidadesDropdown(true)}
                            className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg"
                          />
                          
                          {showEspecialidadesDropdown && (
                            <>
                              <div 
                                className="fixed inset-0 z-10"
                                onClick={() => setShowEspecialidadesDropdown(false)}
                              />
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-20 max-h-80 overflow-y-auto">
                                {especialidades.length === 0 ? (
                                  <div className="p-4 text-center text-gray-500">
                                    No hay especialidades disponibles
                                  </div>
                                ) : (
                                  <div className="p-2">
                                    {especialidades
                                      .filter(esp => 
                                        esp.titulo.toLowerCase().includes(searchEspecialidad.toLowerCase()) ||
                                        esp.departamentoNombre?.toLowerCase().includes(searchEspecialidad.toLowerCase())
                                      )
                                      .map((esp) => (
                                        <div
                                          key={esp.id}
                                          onClick={() => {
                                            if (!selectedEspecialidades.includes(esp.id)) {
                                              setSelectedEspecialidades([...selectedEspecialidades, esp.id]);
                                            }
                                            setSearchEspecialidad('');
                                          }}
                                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                                            selectedEspecialidades.includes(esp.id)
                                              ? 'bg-emerald-100 text-emerald-700 opacity-50 cursor-not-allowed'
                                              : 'hover:bg-gray-100'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <div className="font-medium text-sm">{esp.titulo}</div>
                                              {esp.departamentoNombre && (
                                                <div className="text-xs text-gray-500">{esp.departamentoNombre}</div>
                                              )}
                                            </div>
                                            {selectedEspecialidades.includes(esp.id) && (
                                              <span className="text-emerald-600 text-xs font-semibold">✓ Seleccionada</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        
                        {selectedEspecialidades.length > 0 && (
                          <div className="border-2 border-emerald-200 rounded-xl p-4 bg-emerald-50">
                            <p className="text-sm font-semibold text-gray-700 mb-3">
                              Especialidades Seleccionadas ({selectedEspecialidades.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedEspecialidades.map((espId) => {
                                const esp = especialidades.find(e => e.id === espId);
                                return esp ? (
                                  <Badge 
                                    key={espId} 
                                    className="bg-emerald-600 text-white border-0 px-3 py-2 text-sm flex items-center gap-2"
                                  >
                                    {esp.titulo}
                                    <X
                                      className="w-4 h-4 cursor-pointer hover:bg-emerald-700 rounded-full"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEspecialidadToggle(espId);
                                      }}
                                    />
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-emerald-600" />
                        Email
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                          Correo Electrónico *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg"
                          placeholder="doctor@clinica.com"
                        />
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-emerald-600" />
                        Teléfono
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="telefono" className="text-sm font-semibold text-gray-700">
                          Número de Teléfono *
                        </Label>
                        <Input
                          id="telefono"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          required
                          className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg max-w-md"
                          placeholder="+57 300 123 4567"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Información Profesional */}
            <TabsContent value="profesional">
              <Card className="shadow-lg border-0 bg-white">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {/* Licencia Médica */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        Licencia Médica
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="licencia_medica" className="text-sm font-semibold text-gray-700">Número de Licencia Médica</Label>
                        <Input
                          id="licencia_medica"
                          value={formData.licencia_medica}
                          onChange={(e) => setFormData({ ...formData, licencia_medica: e.target.value })}
                          placeholder="LM-12345"
                          className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg max-w-md"
                        />
                        <p className="text-xs text-gray-500">Opcional - Número de registro profesional</p>
                      </div>
                    </div>

                    {/* Universidad */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                        Universidad
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="universidad" className="text-sm font-semibold text-gray-700">Universidad de Estudios</Label>
                        <Input
                          id="universidad"
                          value={formData.universidad}
                          onChange={(e) => setFormData({ ...formData, universidad: e.target.value })}
                          placeholder="Ej: Universidad Nacional de Colombia"
                          className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Años de Experiencia */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        Años de Experiencia
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="anios_experiencia" className="text-sm font-semibold text-gray-700">Años de Experiencia Profesional</Label>
                        <Input
                          id="anios_experiencia"
                          type="number"
                          value={formData.anios_experiencia}
                          onChange={(e) => setFormData({ ...formData, anios_experiencia: e.target.value })}
                          placeholder="0"
                          min="0"
                          max="70"
                          className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg max-w-xs"
                        />
                      </div>
                    </div>

                    {/* Biografía */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Biografía sobre el Doctor (Opcional)</h3>
                      <div className="space-y-2">
                        <Label htmlFor="biografia" className="text-sm font-semibold text-gray-700">Biografía Profesional</Label>
                        <Textarea
                          id="biografia"
                          value={formData.biografia}
                          onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                          rows={6}
                          placeholder="Escriba información relevante sobre el doctor: experiencia, logros, áreas de interés, certificaciones, publicaciones, etc."
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg resize-none"
                        />
                        <p className="text-xs text-gray-500">Esta información aparecerá en el perfil público del doctor</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Horarios - Calendario Premium */}
            <TabsContent value="horarios">
              <Card className="shadow-premium border-0 overflow-hidden">
                {/* Header con gradient azul */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Calendario de Disponibilidad</h2>
                    <div className="flex items-center gap-3">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={previousMonth}
                        className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <span className="text-xl font-bold min-w-[200px] text-center">
                        {monthNames[month]} {year}
                      </span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={nextMonth}
                        className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Leyendas */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-400 border-2 border-yellow-500"></div>
                      <span>Hoy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-400 border-2 border-blue-500"></div>
                      <span>Seleccionado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-400 border-2 border-green-500"></div>
                      <span>Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-400 border-2 border-red-500"></div>
                      <span>Ocupado</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Calendario */}
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-7 bg-gray-100">
                      {dayNames.map(day => (
                        <div key={day} className="p-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200 last:border-r-0">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="p-3 bg-gray-50 border-r border-b border-gray-200 min-h-[100px]" />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSelected = !!selectedDates[dateStr];
                        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                        const isHovered = hoveredDate === dateStr;
                        
                        return (
                          <div
                            key={day}
                            className={`relative p-3 min-h-[100px] border-r border-b border-gray-200 cursor-pointer transition-all group ${
                              isSelected 
                                ? 'bg-blue-50 hover:bg-blue-100' 
                                : 'hover:bg-gray-50'
                            } ${isToday ? 'ring-2 ring-inset ring-yellow-400 bg-yellow-50' : ''}`}
                            onClick={() => handleDateClick(dateStr)}
                            onMouseEnter={() => setHoveredDate(dateStr)}
                            onMouseLeave={() => setHoveredDate(null)}
                          >
                            <div className={`text-base font-bold mb-2 ${
                              isSelected ? 'text-blue-700' : isToday ? 'text-yellow-700' : 'text-gray-700'
                            }`}>
                              {day}
                            </div>
                            
                            {isSelected && (
                              <div className="space-y-1">
                                {selectedDates[dateStr].map((block, idx) => (
                                  <div key={idx} className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-medium">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {block.inicio} - {block.fin}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {!isSelected && isHovered && (
                              <div className="absolute inset-0 flex items-center justify-center bg-blue-600/90 text-white text-xs font-semibold">
                                <Clock className="w-4 h-4 mr-1" />
                                Click para agregar
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resumen */}
                  {Object.keys(selectedDates).length > 0 && (
                    <div className="mt-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Días Configurados ({Object.keys(selectedDates).length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedDates).map(([date, blocks]) => (
                          <Badge key={date} className="bg-blue-600 text-white border-0 px-4 py-2 text-sm font-semibold">
                            {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            <span className="mx-2">•</span>
                            {blocks.length} bloque{blocks.length > 1 ? 's' : ''}
                            <X
                              className="w-4 h-4 ml-2 cursor-pointer hover:text-blue-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDate(date);
                              }}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="mt-8 flex flex-col-reverse sm:flex-row gap-4 justify-end pt-6 border-t-2 border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack} 
              className="w-full sm:w-auto h-12 border-2 border-gray-300 hover:bg-gray-50 font-semibold"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full sm:w-auto h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg font-semibold text-base"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Guardando...' : (editingDoctor ? 'Actualizar Doctor' : 'Crear Doctor')}
            </Button>
          </div>
        </form>
      </div>

      {/* Modal de Bloques de Tiempo */}
      <TimeBlockModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDateForModal}
        onSave={handleSaveBlocks}
        existingBlocks={selectedDateForModal ? selectedDates[selectedDateForModal] || [] : []}
      />
    </div>
  );
}
