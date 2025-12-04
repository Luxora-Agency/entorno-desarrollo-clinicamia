'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
  const [activeTab, setActiveTab] = useState('basica');
  const [especialidades, setEspecialidades] = useState([]);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState([]);
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
      alert('Error al guardar el doctor');
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
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-gray-50 text-gray-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a la lista
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {editingDoctor ? 'Editar Doctor' : 'Agregar Nuevo Doctor'}
          </h1>
          <p className="text-lg text-gray-600">
            Complete la información del doctor en las siguientes secciones
          </p>
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
              <Card className="shadow-premium border-0">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {/* Datos Personales */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Datos Personales
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            Nombre *
                          </Label>
                          <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            placeholder="Ej: Juan"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apellido" className="text-sm font-semibold text-gray-700">Apellido *</Label>
                          <Input
                            id="apellido"
                            value={formData.apellido}
                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                            required
                            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            placeholder="Ej: Pérez"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cedula" className="text-sm font-semibold text-gray-700">Cédula *</Label>
                          <Input
                            id="cedula"
                            value={formData.cedula}
                            onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                            required
                            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            placeholder="1234567890"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="genero" className="text-sm font-semibold text-gray-700">Género</Label>
                          <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
                            <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Femenino">Femenino</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fecha_nacimiento" className="text-sm font-semibold text-gray-700">Fecha de Nacimiento</Label>
                          <Input
                            id="fecha_nacimiento"
                            type="date"
                            value={formData.fecha_nacimiento}
                            onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Información de Contacto */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-blue-600" />
                        Información de Contacto
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            placeholder="doctor@clinica.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefono" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Teléfono
                          </Label>
                          <Input
                            id="telefono"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            placeholder="+57 300 123 4567"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="direccion" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Dirección
                          </Label>
                          <Input
                            id="direccion"
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            placeholder="Dirección completa"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Especialidades */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Especialidades Médicas *
                      </h3>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 max-h-96 overflow-y-auto">
                        {especialidades.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No hay especialidades disponibles</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {especialidades.map((esp) => (
                              <div 
                                key={esp.id} 
                                className="flex items-center space-x-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => handleEspecialidadToggle(esp.id)}
                              >
                                <Checkbox
                                  id={`esp-${esp.id}`}
                                  checked={selectedEspecialidades.includes(esp.id)}
                                  onCheckedChange={() => handleEspecialidadToggle(esp.id)}
                                  className="border-2 border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <label
                                  htmlFor={`esp-${esp.id}`}
                                  className="text-sm font-semibold leading-none cursor-pointer flex-1"
                                >
                                  {esp.titulo}
                                  <span className="text-xs text-gray-500 font-normal block mt-1">{esp.departamentoNombre}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedEspecialidades.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedEspecialidades.map((espId) => {
                            const esp = especialidades.find(e => e.id === espId);
                            return esp ? (
                              <Badge key={espId} className="bg-blue-100 text-blue-700 border-blue-300 px-4 py-2 text-sm font-semibold">
                                {esp.titulo}
                                <X
                                  className="w-4 h-4 ml-2 cursor-pointer hover:text-blue-900"
                                  onClick={() => handleEspecialidadToggle(espId)}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Información Profesional */}
            <TabsContent value="profesional">
              <Card className="shadow-premium border-0">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        Credenciales Profesionales
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="licencia_medica" className="text-sm font-semibold text-gray-700">Licencia Médica *</Label>
                          <Input
                            id="licencia_medica"
                            value={formData.licencia_medica}
                            onChange={(e) => setFormData({ ...formData, licencia_medica: e.target.value })}
                            required
                            placeholder="LM-12345"
                            className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="anios_experiencia" className="text-sm font-semibold text-gray-700">Años de Experiencia</Label>
                          <Input
                            id="anios_experiencia"
                            type="number"
                            value={formData.anios_experiencia}
                            onChange={(e) => setFormData({ ...formData, anios_experiencia: e.target.value })}
                            placeholder="0"
                            min="0"
                            className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                        Formación Académica
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="universidad" className="text-sm font-semibold text-gray-700">Universidad</Label>
                        <Input
                          id="universidad"
                          value={formData.universidad}
                          onChange={(e) => setFormData({ ...formData, universidad: e.target.value })}
                          placeholder="Universidad donde estudió"
                          className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Biografía Profesional</h3>
                      <Textarea
                        id="biografia"
                        value={formData.biografia}
                        onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                        rows={8}
                        placeholder="Información adicional sobre el doctor: experiencia, logros, áreas de interés, certificaciones, publicaciones, etc."
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg resize-none text-base"
                      />
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <Checkbox
                        id="activo"
                        checked={formData.activo}
                        onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                        className="border-2 border-gray-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <label
                        htmlFor="activo"
                        className="text-base font-semibold leading-none cursor-pointer"
                      >
                        Doctor Activo en el Sistema
                      </label>
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
