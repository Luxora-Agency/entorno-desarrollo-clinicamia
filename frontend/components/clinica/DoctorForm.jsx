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
import { ArrowLeft, Save, User, Briefcase, Clock, X, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function DoctorForm({ user, editingDoctor, onBack }) {
  const [activeTab, setActiveTab] = useState('basica');
  const [especialidades, setEspecialidades] = useState([]);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Información Básica
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
    genero: '',
    fecha_nacimiento: '',
    direccion: '',
    
    // Información Profesional
    licencia_medica: '',
    universidad: '',
    anios_experiencia: '',
    biografia: '',
    
    // Estado
    activo: true,
  });

  const [horarios, setHorarios] = useState({
    lunes: { activo: false, inicio: '09:00', fin: '17:00' },
    martes: { activo: false, inicio: '09:00', fin: '17:00' },
    miercoles: { activo: false, inicio: '09:00', fin: '17:00' },
    jueves: { activo: false, inicio: '09:00', fin: '17:00' },
    viernes: { activo: false, inicio: '09:00', fin: '17:00' },
    sabado: { activo: false, inicio: '09:00', fin: '13:00' },
    domingo: { activo: false, inicio: '09:00', fin: '13:00' },
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
    
    // Cargar datos básicos
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

    // Cargar especialidades seleccionadas
    if (editingDoctor.especialidadesIds) {
      setSelectedEspecialidades(editingDoctor.especialidadesIds);
    }

    // Cargar horarios
    if (editingDoctor.horarios) {
      setHorarios(editingDoctor.horarios);
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

  const handleHorarioChange = (dia, field, value) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
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
        horarios: horarios,
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

  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a la lista
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {editingDoctor ? 'Editar Doctor' : 'Agregar Nuevo Doctor'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Complete la información del doctor en las pestañas correspondientes
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="basica" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Información Básica</span>
              <span className="sm:hidden">Básica</span>
            </TabsTrigger>
            <TabsTrigger value="profesional" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Info. Profesional</span>
              <span className="sm:hidden">Profesional</span>
            </TabsTrigger>
            <TabsTrigger value="horarios" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Horarios</span>
              <span className="sm:hidden">Horarios</span>
            </TabsTrigger>
          </TabsList>

          {/* Información Básica */}
          <TabsContent value="basica">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cedula">Cédula *</Label>
                    <Input
                      id="cedula"
                      value={formData.cedula}
                      onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="genero">Género</Label>
                    <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="h-11"
                  />
                </div>

                {/* Especialidades */}
                <div>
                  <Label className="mb-3 block">Especialidades *</Label>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                    {especialidades.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No hay especialidades disponibles</p>
                    ) : (
                      <div className="space-y-2">
                        {especialidades.map((esp) => (
                          <div key={esp.id} className="flex items-center space-x-2 p-2 hover:bg-white rounded transition-colors">
                            <Checkbox
                              id={`esp-${esp.id}`}
                              checked={selectedEspecialidades.includes(esp.id)}
                              onCheckedChange={() => handleEspecialidadToggle(esp.id)}
                            />
                            <label
                              htmlFor={`esp-${esp.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {esp.titulo}
                              <span className="text-xs text-gray-500 ml-2">({esp.departamentoNombre})</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedEspecialidades.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedEspecialidades.map((espId) => {
                        const esp = especialidades.find(e => e.id === espId);
                        return esp ? (
                          <Badge key={espId} variant="secondary" className="bg-teal-100 text-teal-700">
                            {esp.titulo}
                            <X
                              className="w-3 h-3 ml-1 cursor-pointer"
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
            <Card>
              <CardHeader>
                <CardTitle>Información Profesional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licencia_medica">Licencia Médica *</Label>
                    <Input
                      id="licencia_medica"
                      value={formData.licencia_medica}
                      onChange={(e) => setFormData({ ...formData, licencia_medica: e.target.value })}
                      required
                      placeholder="Ej: LM-12345"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="universidad">Universidad</Label>
                    <Input
                      id="universidad"
                      value={formData.universidad}
                      onChange={(e) => setFormData({ ...formData, universidad: e.target.value })}
                      placeholder="Ej: Universidad Nacional"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="anios_experiencia">Años de Experiencia</Label>
                    <Input
                      id="anios_experiencia"
                      type="number"
                      value={formData.anios_experiencia}
                      onChange={(e) => setFormData({ ...formData, anios_experiencia: e.target.value })}
                      placeholder="0"
                      min="0"
                      className="h-11"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="activo"
                      checked={formData.activo}
                      onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                    />
                    <label
                      htmlFor="activo"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Doctor Activo
                    </label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="biografia">Biografía / Descripción</Label>
                  <Textarea
                    id="biografia"
                    value={formData.biografia}
                    onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                    rows={6}
                    placeholder="Información adicional sobre el doctor, logros, áreas de interés, etc."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Horarios de Atención */}
          <TabsContent value="horarios">
            <Card>
              <CardHeader>
                <CardTitle>Horarios de Atención</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diasSemana.map(({ key, label }) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-2 sm:w-32">
                        <Checkbox
                          id={`dia-${key}`}
                          checked={horarios[key].activo}
                          onCheckedChange={(checked) => handleHorarioChange(key, 'activo', checked)}
                        />
                        <label
                          htmlFor={`dia-${key}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {label}
                        </label>
                      </div>
                      {horarios[key].activo && (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={horarios[key].inicio}
                            onChange={(e) => handleHorarioChange(key, 'inicio', e.target.value)}
                            className="h-9"
                          />
                          <span className="text-sm text-gray-500">a</span>
                          <Input
                            type="time"
                            value={horarios[key].fin}
                            onChange={(e) => handleHorarioChange(key, 'fin', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : (editingDoctor ? 'Actualizar Doctor' : 'Crear Doctor')}
          </Button>
        </div>
      </form>
    </div>
  );
}
