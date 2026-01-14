'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, User, Briefcase, Calendar as CalendarIcon, X, Clock, Mail, Phone, GraduationCap, Award, FileText, Camera, Trash2, Lock, Eye, EyeOff, PenTool, Stamp } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import DoctorScheduleManager from './DoctorScheduleManager';

export default function DoctorForm({ user, editingDoctor, onBack }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basica');
  const [especialidades, setEspecialidades] = useState([]);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState([]);
  const [searchEspecialidad, setSearchEspecialidad] = useState('');
  const [showEspecialidadesDropdown, setShowEspecialidadesDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoBase64, setFotoBase64] = useState(null);
  const [firmaPreview, setFirmaPreview] = useState(null);
  const [firmaBase64, setFirmaBase64] = useState(null);
  const [selloPreview, setSelloPreview] = useState(null);
  const [selloBase64, setSelloBase64] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const fotoInputRef = useRef(null);
  const firmaInputRef = useRef(null);
  const selloInputRef = useRef(null);

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

    if (editingDoctor.foto) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const fotoUrl = editingDoctor.foto.startsWith('http') || editingDoctor.foto.startsWith('data:')
        ? editingDoctor.foto
        : `${apiUrl}${editingDoctor.foto}`;
      setFotoPreview(fotoUrl);
    }

    // Cargar firma si existe
    if (editingDoctor.firma) {
      setFirmaPreview(editingDoctor.firma);
    }

    // Cargar sello si existe
    if (editingDoctor.sello) {
      setSelloPreview(editingDoctor.sello);
    }
  };

  // Manejador genérico para subir imágenes (firma/sello)
  const handleImageUpload = (file, setPreview, setBase64, maxSize = 2) => {
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tipo de archivo no permitido. Use JPG, PNG o WEBP.'
      });
      return;
    }

    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `El archivo es muy grande. Máximo ${maxSize}MB.`
      });
      return;
    }

    // Crear preview y convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFirmaChange = (e) => {
    handleImageUpload(e.target.files?.[0], setFirmaPreview, setFirmaBase64, 2);
  };

  const handleSelloChange = (e) => {
    handleImageUpload(e.target.files?.[0], setSelloPreview, setSelloBase64, 2);
  };

  const handleRemoveFirma = () => {
    setFirmaPreview(null);
    setFirmaBase64(null);
  };

  const handleRemoveSello = () => {
    setSelloPreview(null);
    setSelloBase64(null);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    console.log('[DEBUG Foto] Archivo seleccionado:', file?.name, file?.type, file?.size);
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tipo de archivo no permitido. Use JPG, PNG, WEBP o GIF.'
      });
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El archivo es muy grande. Máximo 5MB.'
      });
      return;
    }

    // Crear preview y convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('[DEBUG Foto] Base64 generado, longitud:', reader.result?.length);
      setFotoPreview(reader.result);
      setFotoBase64(reader.result);
    };
    reader.onerror = () => {
      console.error('[DEBUG Foto] Error al leer archivo:', reader.error);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFoto = () => {
    setFotoPreview(null);
    setFotoBase64(null);
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

  const handleScheduleChange = (newHorarios) => {
    setSelectedDates(newHorarios);
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

      console.log('[DEBUG Submit] Estado antes de enviar:', {
        fotoBase64Length: fotoBase64?.length || 0,
        fotoPreview: fotoPreview ? 'set' : 'null',
        editingDoctor: editingDoctor ? 'yes' : 'no'
      });

      const payload = {
        ...formData,
        especialidades_ids: selectedEspecialidades,
        horarios: selectedDates,
      };

      // Incluir contraseña si se proporciona (nuevo doctor o cambio de contraseña)
      if (password && password.length >= 6) {
        payload.password = password;
      }

      // Incluir foto si se subió una nueva
      if (fotoBase64) {
        payload.foto = fotoBase64;
        console.log('[DEBUG] Enviando foto:', fotoBase64.substring(0, 50) + '...', `(${fotoBase64.length} chars)`);
      } else {
        console.log('[DEBUG] No hay foto para enviar. fotoBase64:', fotoBase64, 'fotoPreview:', fotoPreview);
      }

      // Incluir firma si se subió una nueva
      if (firmaBase64) {
        payload.firma = firmaBase64;
      } else if (firmaPreview === null && editingDoctor?.firma) {
        // Si se eliminó la firma
        payload.firma = null;
      }

      // Incluir sello si se subió uno nuevo
      if (selloBase64) {
        payload.sello = selloBase64;
      } else if (selloPreview === null && editingDoctor?.sello) {
        // Si se eliminó el sello
        payload.sello = null;
      }

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
        toast({ title: 'Éxito', description: editingDoctor ? 'Doctor actualizado exitosamente' : 'Doctor creado exitosamente' });
        onBack();
      } else {
        if (data.details && Array.isArray(data.details)) {
          // Mostrar errores de validación
          const errorMessages = data.details.map(d => `${d.message}`).join('\n');
          toast({ variant: 'destructive', title: 'Error de validación', description: errorMessages });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: data.error || data.message || 'Error al guardar el doctor' });
        }
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Error de conexión o del servidor' });
    } finally {
      setLoading(false);
    }
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
                    {/* Foto del Doctor */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-emerald-600" />
                        Foto del Doctor
                      </h3>
                      <div className="flex items-start gap-6">
                        {/* Preview de foto */}
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                            {fotoPreview ? (
                              <img
                                src={fotoPreview}
                                alt="Foto del doctor"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-16 h-16 text-gray-400" />
                            )}
                          </div>
                          {fotoPreview && (
                            <button
                              type="button"
                              onClick={handleRemoveFoto}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Botón de subir */}
                        <div className="flex-1">
                          <Label htmlFor="foto" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Subir Foto
                          </Label>
                          <div className="flex flex-col gap-2">
                            <input
                              ref={fotoInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={handleFotoChange}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fotoInputRef.current?.click()}
                              className="w-fit border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              {fotoPreview ? 'Cambiar Foto' : 'Seleccionar Foto'}
                            </Button>
                            <p className="text-xs text-gray-500">
                              Formatos permitidos: JPG, PNG, WEBP, GIF. Máximo 5MB.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

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

                    {/* Contraseña */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-emerald-600" />
                        Contraseña de Acceso
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                          {editingDoctor ? 'Nueva Contraseña (dejar vacío para mantener actual)' : 'Contraseña *'}
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg pr-10"
                            placeholder={editingDoctor ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {editingDoctor
                            ? 'Ingrese una nueva contraseña solo si desea cambiarla. Mínimo 6 caracteres.'
                            : 'Esta contraseña permitirá al doctor acceder al panel médico. Si se deja vacío, se usará la cédula como contraseña temporal.'
                          }
                        </p>
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

                    {/* Firma y Sello - Sección especial */}
                    <div className="border-t-2 border-purple-200 pt-8">
                      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <PenTool className="w-5 h-5 text-purple-600" />
                          Firma y Sello Digital
                        </h3>
                        <p className="text-sm text-gray-600">
                          La firma y sello digital se utilizarán para validar documentos médicos como historias clínicas,
                          prescripciones, órdenes médicas y certificados. Estos elementos son importantes para la autenticación
                          de documentos según la normatividad colombiana.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Firma Digital */}
                        <div>
                          <h4 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <PenTool className="w-4 h-4 text-purple-600" />
                            Firma Digital
                          </h4>
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <div className="w-48 h-24 rounded-lg overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                {firmaPreview ? (
                                  <img
                                    src={firmaPreview}
                                    alt="Firma del doctor"
                                    className="w-full h-full object-contain p-2"
                                  />
                                ) : (
                                  <div className="text-center">
                                    <PenTool className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-400">Sin firma</p>
                                  </div>
                                )}
                              </div>
                              {firmaPreview && (
                                <button
                                  type="button"
                                  onClick={handleRemoveFirma}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div className="flex-1">
                              <input
                                ref={firmaInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFirmaChange}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => firmaInputRef.current?.click()}
                                className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50"
                              >
                                <PenTool className="w-4 h-4 mr-2" />
                                {firmaPreview ? 'Cambiar Firma' : 'Subir Firma'}
                              </Button>
                              <p className="text-xs text-gray-500 mt-2">
                                PNG o JPG con fondo transparente o blanco. Máx 2MB.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Sello Profesional */}
                        <div>
                          <h4 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Stamp className="w-4 h-4 text-purple-600" />
                            Sello Profesional
                          </h4>
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                {selloPreview ? (
                                  <img
                                    src={selloPreview}
                                    alt="Sello del doctor"
                                    className="w-full h-full object-contain p-2"
                                  />
                                ) : (
                                  <div className="text-center">
                                    <Stamp className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-400">Sin sello</p>
                                  </div>
                                )}
                              </div>
                              {selloPreview && (
                                <button
                                  type="button"
                                  onClick={handleRemoveSello}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div className="flex-1">
                              <input
                                ref={selloInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleSelloChange}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => selloInputRef.current?.click()}
                                className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50"
                              >
                                <Stamp className="w-4 h-4 mr-2" />
                                {selloPreview ? 'Cambiar Sello' : 'Subir Sello'}
                              </Button>
                              <p className="text-xs text-gray-500 mt-2">
                                PNG o JPG con fondo transparente. Máx 2MB.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Horarios - Calendario Premium */}
            <TabsContent value="horarios">
              <div className="h-[800px]">
                <DoctorScheduleManager 
                  doctorId={editingDoctor?.id}
                  initialHorarios={editingDoctor?.horarios || selectedDates}
                  onChange={handleScheduleChange}
                />
              </div>
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
    </div>
  );
}
