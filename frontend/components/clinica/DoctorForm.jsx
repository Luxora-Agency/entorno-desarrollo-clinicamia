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
import { ArrowLeft, Save, User, Briefcase, Calendar as CalendarIcon, X, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function DoctorForm({ user, editingDoctor, onBack }) {
  const [activeTab, setActiveTab] = useState('basica');
  const [especialidades, setEspecialidades] = useState([]);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState({});
  
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
    setSelectedDates(prev => {
      const newDates = { ...prev };
      if (newDates[dateStr]) {
        delete newDates[dateStr];
      } else {
        newDates[dateStr] = {
          inicio: '09:00',
          fin: '17:00'
        };
      }
      return newDates;
    });
  };

  const updateTimeForDate = (dateStr, field, value) => {
    setSelectedDates(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: value
      }
    }));
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 hover:bg-teal-50 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a la lista
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {editingDoctor ? 'Editar Doctor' : 'Agregar Nuevo Doctor'}
        </h1>
        <p className="text-gray-600">
          Complete la información del nuevo doctor en el formulario. Los campos están organizados en tres secciones para facilitar el registro.
        </p>
      </div>

      {/* Notas informativas con colores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 text-sm mb-1">Información Básica</h3>
              <p className="text-blue-800 text-xs">Nombre, cédula, especialidades, contacto</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900 text-sm mb-1">Información Profesional</h3>
              <p className="text-purple-800 text-xs">Licencia, universidad, experiencia, biografía</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <CalendarIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 text-sm mb-1">Horarios de Atención</h3>
              <p className="text-green-800 text-xs">Días y horarios de disponibilidad</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nota de campos requeridos */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 text-sm mb-1">Campos Requeridos</h3>
            <p className="text-amber-800 text-xs">
              Solo los campos básicos son obligatorios: nombre, cédula, especialidades, email y teléfono. La información profesional y horarios son opcionales pero recomendados para un perfil completo.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
            <TabsTrigger value="basica" className="flex items-center gap-2 py-3">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Información Básica</span>
              <span className="sm:hidden">Básica</span>
            </TabsTrigger>
            <TabsTrigger value="profesional" className="flex items-center gap-2 py-3">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Info. Profesional</span>
              <span className="sm:hidden">Profesional</span>
            </TabsTrigger>
            <TabsTrigger value="horarios" className="flex items-center gap-2 py-3">
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Horarios</span>
              <span className="sm:hidden">Horarios</span>
            </TabsTrigger>
          </TabsList>

          {/* Información Básica */}
          <TabsContent value="basica">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                <CardTitle className="text-xl text-gray-900">Información Básica del Doctor</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      placeholder="Ej: Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido" className="text-sm font-medium text-gray-700">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      required
                      className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      placeholder="Ej: Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cedula" className="text-sm font-medium text-gray-700">Cédula *</Label>
                    <Input
                      id="cedula"
                      value={formData.cedula}
                      onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                      required
                      className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      placeholder="Ej: 1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      placeholder="doctor@clinica.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genero" className="text-sm font-medium text-gray-700">Género</Label>
                    <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500">
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
                    <Label htmlFor="fecha_nacimiento" className="text-sm font-medium text-gray-700">Fecha de Nacimiento</Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                      className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="direccion" className="text-sm font-medium text-gray-700">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="Dirección completa"
                  />
                </div>

                {/* Especialidades */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Especialidades *</Label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-72 overflow-y-auto bg-gray-50">
                    {especialidades.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">No hay especialidades disponibles</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {especialidades.map((esp) => (
                          <div key={esp.id} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-all">
                            <Checkbox
                              id={`esp-${esp.id}`}
                              checked={selectedEspecialidades.includes(esp.id)}
                              onCheckedChange={() => handleEspecialidadToggle(esp.id)}
                              className="border-gray-400"
                            />
                            <label
                              htmlFor={`esp-${esp.id}`}
                              className="text-sm font-medium leading-none cursor-pointer flex-1"
                            >
                              {esp.titulo}
                              <span className="text-xs text-gray-500 block mt-0.5">{esp.departamentoNombre}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedEspecialidades.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedEspecialidades.map((espId) => {
                        const esp = especialidades.find(e => e.id === espId);
                        return esp ? (
                          <Badge key={espId} variant="secondary" className="bg-teal-100 text-teal-700 border border-teal-300 px-3 py-1">
                            {esp.titulo}
                            <X
                              className="w-3 h-3 ml-2 cursor-pointer hover:text-teal-900"
                              onClick={() => handleEspecialidadToggle(espId)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Información Profesional */}
          <TabsContent value="profesional">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                <CardTitle className="text-xl text-gray-900">Información Profesional</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="licencia_medica" className="text-sm font-medium text-gray-700">Licencia Médica *</Label>
                    <Input
                      id="licencia_medica"
                      value={formData.licencia_medica}
                      onChange={(e) => setFormData({ ...formData, licencia_medica: e.target.value })}
                      required
                      placeholder="Ej: LM-12345"
                      className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="universidad" className="text-sm font-medium text-gray-700">Universidad</Label>
                    <Input
                      id="universidad"
                      value={formData.universidad}
                      onChange={(e) => setFormData({ ...formData, universidad: e.target.value })}
                      placeholder="Universidad donde estudió"
                      className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anios_experiencia" className="text-sm font-medium text-gray-700">Años de Experiencia</Label>
                    <Input
                      id="anios_experiencia"
                      type="number"
                      value={formData.anios_experiencia}
                      onChange={(e) => setFormData({ ...formData, anios_experiencia: e.target.value })}
                      placeholder="0"
                      min="0"
                      className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center space-x-3 h-11">
                      <Checkbox
                        id="activo"
                        checked={formData.activo}
                        onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                        className="border-gray-400"
                      />
                      <label
                        htmlFor="activo"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Doctor Activo
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biografia" className="text-sm font-medium text-gray-700">Biografía / Descripción</Label>
                  <Textarea
                    id="biografia"
                    value={formData.biografia}
                    onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                    rows={6}
                    placeholder="Información adicional sobre el doctor: experiencia, logros, áreas de interés, certificaciones, etc."
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Horarios - Calendario */}
          <TabsContent value="horarios">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-gray-900">Calendario de Horarios</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={previousMonth}>
                      ←
                    </Button>
                    <span className="text-sm font-medium px-4">{monthNames[month]} {year}</span>
                    <Button type="button" variant="outline" size="sm" onClick={nextMonth}>
                      →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Haga clic en los días para seleccionar horarios de atención. Puede configurar hora de inicio y fin para cada día.
                  </p>
                </div>

                {/* Calendario */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {dayNames.map(day => (
                      <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600 border-r border-gray-200 last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2 bg-gray-50 border-r border-b border-gray-200" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelected = !!selectedDates[dateStr];
                      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                      
                      return (
                        <div
                          key={day}
                          className={`p-2 min-h-[80px] border-r border-b border-gray-200 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-teal-50 hover:bg-teal-100 border-teal-300' 
                              : 'hover:bg-gray-50'
                          } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                          onClick={() => handleDateClick(dateStr)}
                        >
                          <div className={`text-sm font-medium mb-1 ${
                            isSelected ? 'text-teal-700' : 'text-gray-700'
                          }`}>
                            {day}
                          </div>
                          {isSelected && (
                            <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="time"
                                value={selectedDates[dateStr].inicio}
                                onChange={(e) => updateTimeForDate(dateStr, 'inicio', e.target.value)}
                                className="w-full text-xs px-1 py-0.5 border border-teal-300 rounded"
                              />
                              <input
                                type="time"
                                value={selectedDates[dateStr].fin}
                                onChange={(e) => updateTimeForDate(dateStr, 'fin', e.target.value)}
                                className="w-full text-xs px-1 py-0.5 border border-teal-300 rounded"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resumen de días seleccionados */}
                {Object.keys(selectedDates).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Días seleccionados ({Object.keys(selectedDates).length}):</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedDates).map(([date, times]) => (
                        <Badge key={date} variant="outline" className="bg-teal-50 text-teal-700 border-teal-300 px-3 py-1">
                          {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}: {times.inicio} - {times.fin}
                          <X
                            className="w-3 h-3 ml-2 cursor-pointer hover:text-teal-900"
                            onClick={() => handleDateClick(date)}
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
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-end border-t border-gray-200 pt-6">
          <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto border-gray-300">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading} 
            className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto shadow-md"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : (editingDoctor ? 'Actualizar Doctor' : 'Crear Doctor')}
          </Button>
        </div>
      </form>
    </div>
  );
}
