'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Plus, Pencil, Trash2, Search, Braces,
  LayoutGrid, List, Star, StarOff, Copy, Eye,
  MoreVertical, RefreshCw, Sparkles, Clock, Tag,
  Stethoscope, Heart, Brain, Activity, Pill, Clipboard,
  CheckCircle, AlertCircle, ArrowUpDown, Filter,
  Download, Upload, ChevronRight, Zap, BookOpen,
  TestTube, FlaskConical, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { PLANTILLAS_ORDENES, CATEGORIAS, COLORES_CATEGORIA } from '@/constants/plantillasOrdenes';

// Variables predefinidas organizadas por categoría
const VARIABLES_PREDEFINIDAS = {
  'Signos Vitales': [
    { name: 'Peso', example: '70 kg' },
    { name: 'Talla', example: '170 cm' },
    { name: 'IMC', example: '24.2' },
    { name: 'PresionArterial', example: '120/80 mmHg' },
    { name: 'FrecuenciaCardiaca', example: '72 lpm' },
    { name: 'FrecuenciaRespiratoria', example: '16 rpm' },
    { name: 'Temperatura', example: '36.5°C' },
    { name: 'SaturacionO2', example: '98%' },
  ],
  'Paciente': [
    { name: 'NombrePaciente', example: 'Juan Pérez' },
    { name: 'Edad', example: '45 años' },
    { name: 'Sexo', example: 'Masculino' },
    { name: 'Cedula', example: '12345678' },
  ],
  'Dolor': [
    { name: 'Localizacion', example: 'región lumbar' },
    { name: 'Intensidad', example: '7/10' },
    { name: 'Tipo', example: 'punzante' },
    { name: 'Duracion', example: '3 días' },
    { name: 'Irradiacion', example: 'miembro inferior derecho' },
    { name: 'Factores agravantes', example: 'movimiento' },
    { name: 'Factores atenuantes', example: 'reposo' },
  ],
  'Tiempo': [
    { name: 'FechaActual', example: '15/01/2026' },
    { name: 'HoraActual', example: '10:30 AM' },
    { name: 'DiasSintomas', example: '5 días' },
    { name: 'Evolucion', example: 'progresiva' },
  ],
  'Medicamentos': [
    { name: 'Medicamento', example: 'Ibuprofeno' },
    { name: 'Dosis', example: '400 mg' },
    { name: 'Via', example: 'oral' },
    { name: 'Frecuencia', example: 'cada 8 horas' },
    { name: 'Duracion', example: '7 días' },
  ],
};

const TIPOS_CAMPO = [
  { value: 'SOAP', label: 'Nota SOAP (General)', icon: Clipboard, color: 'blue' },
  { value: 'MOTIVO', label: 'Motivo de Consulta', icon: Stethoscope, color: 'emerald' },
  { value: 'ANALISIS', label: 'Análisis', icon: Brain, color: 'purple' },
  { value: 'PLAN', label: 'Plan de Manejo', icon: Activity, color: 'amber' },
  { value: 'DIAGNOSTICO', label: 'Diagnóstico', icon: Heart, color: 'red' },
  { value: 'RECETA', label: 'Receta / Prescripción', icon: Pill, color: 'cyan' },
  { value: 'PROCEDIMIENTO', label: 'Procedimiento / Examen (CUPS)', icon: TestTube, color: 'indigo' },
  { value: 'GENERICO', label: 'Genérico / Otro', icon: FileText, color: 'gray' },
];

// Vías de administración
const VIAS_ADMINISTRACION = [
  'Oral', 'Intravenosa', 'Intramuscular', 'Subcutánea', 'Tópica',
  'Oftálmica', 'Ótica', 'Inhalatoria', 'Rectal', 'Vaginal'
];

// Frecuencias
const FRECUENCIAS = [
  { value: 'Cada4Horas', label: 'Cada 4 horas' },
  { value: 'Cada6Horas', label: 'Cada 6 horas' },
  { value: 'Cada8Horas', label: 'Cada 8 horas' },
  { value: 'Cada12Horas', label: 'Cada 12 horas' },
  { value: 'Cada24Horas', label: 'Cada 24 horas' },
  { value: 'CadaSemana', label: 'Cada semana' },
  { value: 'PRN', label: 'Según necesidad (PRN)' },
];

const PLANTILLAS_SUGERIDAS = [
  {
    nombre: 'Consulta General - SOAP',
    tipoCampo: 'SOAP',
    contenido: `S: Paciente de {{Edad}} años que consulta por {{MotivoConsulta}} de {{DiasSintomas}} de evolución. Refiere {{Sintomas}}. Niega {{SintomasNegativos}}.

O: PA: {{PresionArterial}}, FC: {{FrecuenciaCardiaca}}, FR: {{FrecuenciaRespiratoria}}, T: {{Temperatura}}, SatO2: {{SaturacionO2}}
Peso: {{Peso}}, Talla: {{Talla}}, IMC: {{IMC}}
Examen físico: {{HallazgosExamen}}

A: {{Diagnostico}}

P: {{PlanManejo}}
Control en {{DiasControl}} días o antes si presenta signos de alarma.`,
    descripcion: 'Plantilla completa para consulta general con formato SOAP',
  },
  {
    nombre: 'Dolor Agudo',
    tipoCampo: 'MOTIVO',
    contenido: `Paciente refiere dolor en {{Localizacion}} de {{DiasSintomas}} de evolución, de tipo {{Tipo}}, con intensidad {{Intensidad}}/10.
{{#Irradiacion}}Irradia hacia {{Irradiacion}}.{{/Irradiacion}}
Factores agravantes: {{FactoresAgravantes}}
Factores atenuantes: {{FactoresAtenuantes}}
Síntomas asociados: {{SintomasAsociados}}`,
    descripcion: 'Para documentar cuadros de dolor',
  },
];

export default function PlantillasDoctorModule({ user }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [viewMode, setViewMode] = useState('cards');
  const [sortBy, setSortBy] = useState('recent');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVariablesOpen, setIsVariablesOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isPlantillasCupsOpen, setIsPlantillasCupsOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    tipoCampo: 'SOAP',
    contenido: '',
    descripcion: '',
    esFavorito: false,
    // Datos estructurados para RECETA
    medicamentos: [],
    // Datos estructurados para PROCEDIMIENTO
    procedimientos: [],
  });

  // Estados para búsqueda de medicamentos
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [medicamentoActual, setMedicamentoActual] = useState({
    productoId: '',
    nombre: '',
    principioActivo: '',
    concentracion: '',
    dosis: '',
    via: 'Oral',
    frecuencia: 'Cada8Horas',
    duracionDias: '',
    instrucciones: '',
  });

  // Estados para búsqueda de procedimientos/exámenes
  const [examenes, setExamenes] = useState([]);
  const [loadingExamenes, setLoadingExamenes] = useState(false);
  const [busquedaExamen, setBusquedaExamen] = useState('');
  const [procedimientoActual, setProcedimientoActual] = useState({
    servicioId: '',
    nombre: '',
    codigoCups: '',
    tipo: 'Examen',
    observaciones: '',
  });

  // Stats
  const stats = useMemo(() => {
    return {
      total: templates.length,
      favoritos: templates.filter(t => t.esFavorito).length,
      porTipo: TIPOS_CAMPO.reduce((acc, tipo) => {
        acc[tipo.value] = templates.filter(t => t.tipoCampo === tipo.value).length;
        return acc;
      }, {}),
    };
  }, [templates]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Buscar productos con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busquedaProducto.trim().length >= 2) {
        buscarProductos(busquedaProducto.trim());
      } else {
        setProductos([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [busquedaProducto]);

  // Buscar exámenes con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busquedaExamen.trim().length >= 2) {
        buscarExamenes(busquedaExamen.trim());
      } else {
        setExamenes([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [busquedaExamen]);

  const buscarProductos = async (termino) => {
    setLoadingProductos(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(
        `${apiUrl}/productos?activo=true&search=${encodeURIComponent(termino)}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const result = await response.json();
        setProductos(result.data || []);
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
    } finally {
      setLoadingProductos(false);
    }
  };

  const buscarExamenes = async (termino) => {
    setLoadingExamenes(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(
        `${apiUrl}/examenes-procedimientos?estado=Activo&search=${encodeURIComponent(termino)}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const result = await response.json();
        setExamenes(result.data || []);
      }
    } catch (error) {
      console.error('Error buscando exámenes:', error);
    } finally {
      setLoadingExamenes(false);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/plantillas-doctor`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  // Generar contenido automático para RECETA
  const generarContenidoReceta = (medicamentos) => {
    if (!medicamentos || medicamentos.length === 0) return '';

    return medicamentos.map((med, idx) => {
      let linea = `${idx + 1}. ${med.nombre}`;
      if (med.concentracion) linea += ` ${med.concentracion}`;
      linea += `\n   Dosis: ${med.dosis || 'Según indicación'}`;
      linea += `\n   Vía: ${med.via}`;
      linea += `\n   Frecuencia: ${FRECUENCIAS.find(f => f.value === med.frecuencia)?.label || med.frecuencia}`;
      if (med.duracionDias) linea += `\n   Duración: ${med.duracionDias} días`;
      if (med.instrucciones) linea += `\n   Indicaciones: ${med.instrucciones}`;
      return linea;
    }).join('\n\n');
  };

  // Generar contenido automático para PROCEDIMIENTO
  const generarContenidoProcedimiento = (procedimientos) => {
    if (!procedimientos || procedimientos.length === 0) return '';

    return procedimientos.map((proc, idx) => {
      let linea = `${idx + 1}. ${proc.nombre}`;
      if (proc.codigoCups) linea += ` (CUPS: ${proc.codigoCups})`;
      linea += `\n   Tipo: ${proc.tipo}`;
      if (proc.observaciones) linea += `\n   Indicaciones: ${proc.observaciones}`;
      return linea;
    }).join('\n\n');
  };

  const handleSubmit = async () => {
    if (!formData.nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }

    // Validar según el tipo
    if (formData.tipoCampo === 'RECETA' && formData.medicamentos.length === 0) {
      toast.error('Agregue al menos un medicamento a la receta');
      return;
    }

    if (formData.tipoCampo === 'PROCEDIMIENTO' && formData.procedimientos.length === 0) {
      toast.error('Agregue al menos un procedimiento o examen');
      return;
    }

    // Generar contenido automáticamente para tipos estructurados
    let contenidoFinal = formData.contenido;
    if (formData.tipoCampo === 'RECETA') {
      contenidoFinal = generarContenidoReceta(formData.medicamentos);
    } else if (formData.tipoCampo === 'PROCEDIMIENTO') {
      contenidoFinal = generarContenidoProcedimiento(formData.procedimientos);
    }

    if (!contenidoFinal) {
      toast.error('El contenido no puede estar vacío');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const url = currentTemplate
        ? `${apiUrl}/plantillas-doctor/${currentTemplate.id}`
        : `${apiUrl}/plantillas-doctor`;

      const method = currentTemplate ? 'PUT' : 'POST';

      // Guardar datos estructurados en el contenido como JSON si es RECETA o PROCEDIMIENTO
      let dataToSave = {
        nombre: formData.nombre,
        tipoCampo: formData.tipoCampo,
        contenido: contenidoFinal,
        descripcion: formData.descripcion,
        esFavorito: formData.esFavorito,
      };

      // Para RECETA y PROCEDIMIENTO, guardamos los datos estructurados como JSON en un campo separado o al final del contenido
      if (formData.tipoCampo === 'RECETA' && formData.medicamentos.length > 0) {
        dataToSave.contenido = JSON.stringify({
          tipo: 'RECETA',
          medicamentos: formData.medicamentos,
          textoFormateado: contenidoFinal
        });
      } else if (formData.tipoCampo === 'PROCEDIMIENTO' && formData.procedimientos.length > 0) {
        dataToSave.contenido = JSON.stringify({
          tipo: 'PROCEDIMIENTO',
          procedimientos: formData.procedimientos,
          textoFormateado: contenidoFinal
        });
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        toast.success(currentTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
        fetchTemplates();
        setIsModalOpen(false);
        resetForm();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/plantillas-doctor/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Plantilla eliminada');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleToggleFavorite = async (template) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/plantillas-doctor/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...template,
          esFavorito: !template.esFavorito
        })
      });

      if (response.ok) {
        toast.success(template.esFavorito ? 'Quitado de favoritos' : 'Agregado a favoritos');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleDuplicate = (template) => {
    setCurrentTemplate(null);

    // Intentar parsear contenido estructurado
    let medicamentos = [];
    let procedimientos = [];
    let contenido = template.contenido;

    try {
      const parsed = JSON.parse(template.contenido);
      if (parsed.tipo === 'RECETA' && parsed.medicamentos) {
        medicamentos = parsed.medicamentos;
        contenido = parsed.textoFormateado || '';
      } else if (parsed.tipo === 'PROCEDIMIENTO' && parsed.procedimientos) {
        procedimientos = parsed.procedimientos;
        contenido = parsed.textoFormateado || '';
      }
    } catch (e) {
      // No es JSON, usar contenido como texto
    }

    setFormData({
      nombre: `${template.nombre} (Copia)`,
      tipoCampo: template.tipoCampo,
      contenido: contenido,
      descripcion: template.descripcion || '',
      esFavorito: false,
      medicamentos,
      procedimientos,
    });
    setIsModalOpen(true);
    toast.info('Editando copia de plantilla');
  };

  const handleUseSuggestion = (suggestion) => {
    setCurrentTemplate(null);
    setFormData({
      nombre: suggestion.nombre,
      tipoCampo: suggestion.tipoCampo,
      contenido: suggestion.contenido,
      descripcion: suggestion.descripcion || '',
      esFavorito: false,
      medicamentos: [],
      procedimientos: [],
    });
    setIsSuggestionsOpen(false);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setCurrentTemplate(null);
    setFormData({
      nombre: '',
      tipoCampo: 'SOAP',
      contenido: '',
      descripcion: '',
      esFavorito: false,
      medicamentos: [],
      procedimientos: [],
    });
    setBusquedaProducto('');
    setBusquedaExamen('');
    setProductos([]);
    setExamenes([]);
    setMedicamentoActual({
      productoId: '',
      nombre: '',
      principioActivo: '',
      concentracion: '',
      dosis: '',
      via: 'Oral',
      frecuencia: 'Cada8Horas',
      duracionDias: '',
      instrucciones: '',
    });
    setProcedimientoActual({
      servicioId: '',
      nombre: '',
      codigoCups: '',
      tipo: 'Examen',
      observaciones: '',
    });
  };

  const openEdit = (template) => {
    setCurrentTemplate(template);

    // Intentar parsear contenido estructurado
    let medicamentos = [];
    let procedimientos = [];
    let contenido = template.contenido;

    try {
      const parsed = JSON.parse(template.contenido);
      if (parsed.tipo === 'RECETA' && parsed.medicamentos) {
        medicamentos = parsed.medicamentos;
        contenido = parsed.textoFormateado || '';
      } else if (parsed.tipo === 'PROCEDIMIENTO' && parsed.procedimientos) {
        procedimientos = parsed.procedimientos;
        contenido = parsed.textoFormateado || '';
      }
    } catch (e) {
      // No es JSON, usar contenido como texto
    }

    setFormData({
      nombre: template.nombre,
      tipoCampo: template.tipoCampo,
      contenido: contenido,
      descripcion: template.descripcion || '',
      esFavorito: template.esFavorito || false,
      medicamentos,
      procedimientos,
    });
    setIsModalOpen(true);
  };

  const openPreview = (template) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const insertVariable = (varName) => {
    setFormData(prev => ({
      ...prev,
      contenido: prev.contenido + `{{${varName}}}`
    }));
    toast.success(`Variable {{${varName}}} insertada`);
  };

  const getTypeConfig = (typeValue) => {
    return TIPOS_CAMPO.find(t => t.value === typeValue) || TIPOS_CAMPO[TIPOS_CAMPO.length - 1];
  };

  // Agregar medicamento a la lista
  const agregarMedicamento = () => {
    if (!medicamentoActual.nombre || !medicamentoActual.dosis) {
      toast.error('Seleccione un medicamento y especifique la dosis');
      return;
    }

    setFormData(prev => ({
      ...prev,
      medicamentos: [...prev.medicamentos, { ...medicamentoActual }]
    }));

    setMedicamentoActual({
      productoId: '',
      nombre: '',
      principioActivo: '',
      concentracion: '',
      dosis: '',
      via: 'Oral',
      frecuencia: 'Cada8Horas',
      duracionDias: '',
      instrucciones: '',
    });
    setBusquedaProducto('');
    toast.success('Medicamento agregado');
  };

  // Eliminar medicamento de la lista
  const eliminarMedicamento = (index) => {
    setFormData(prev => ({
      ...prev,
      medicamentos: prev.medicamentos.filter((_, i) => i !== index)
    }));
  };

  // Agregar procedimiento a la lista
  const agregarProcedimiento = () => {
    if (!procedimientoActual.nombre) {
      toast.error('Seleccione un procedimiento o examen');
      return;
    }

    setFormData(prev => ({
      ...prev,
      procedimientos: [...prev.procedimientos, { ...procedimientoActual }]
    }));

    setProcedimientoActual({
      servicioId: '',
      nombre: '',
      codigoCups: '',
      tipo: 'Examen',
      observaciones: '',
    });
    setBusquedaExamen('');
    toast.success('Procedimiento agregado');
  };

  // Eliminar procedimiento de la lista
  const eliminarProcedimiento = (index) => {
    setFormData(prev => ({
      ...prev,
      procedimientos: prev.procedimientos.filter((_, i) => i !== index)
    }));
  };

  // Agregar exámenes desde plantilla CUPS
  const agregarDesdePlantillaCups = (plantilla) => {
    const nuevosProcs = plantilla.examenes.map(ex => ({
      servicioId: `cups_${ex.codigoCups}`,
      nombre: ex.nombre,
      codigoCups: ex.codigoCups,
      tipo: 'Examen',
      observaciones: `Plantilla: ${plantilla.nombre}`,
    }));

    setFormData(prev => ({
      ...prev,
      procedimientos: [...prev.procedimientos, ...nuevosProcs]
    }));

    setIsPlantillasCupsOpen(false);
    toast.success(`${nuevosProcs.length} exámenes agregados desde "${plantilla.nombre}"`);
  };

  // Seleccionar producto del buscador
  const seleccionarProducto = (producto) => {
    setMedicamentoActual(prev => ({
      ...prev,
      productoId: producto.id,
      nombre: producto.nombre,
      principioActivo: producto.principioActivo || '',
      concentracion: producto.concentracion || '',
    }));
    setBusquedaProducto('');
    setProductos([]);
  };

  // Seleccionar examen del buscador
  const seleccionarExamen = (examen) => {
    setProcedimientoActual(prev => ({
      ...prev,
      servicioId: examen.id,
      nombre: examen.nombre,
      codigoCups: examen.codigoCUPS || examen.codigoCups || '',
      tipo: examen.tipo || 'Examen',
    }));
    setBusquedaExamen('');
    setExamenes([]);
  };

  // Obtener texto de visualización del contenido
  const getDisplayContent = (template) => {
    try {
      const parsed = JSON.parse(template.contenido);
      if (parsed.textoFormateado) {
        return parsed.textoFormateado;
      }
    } catch (e) {
      // No es JSON
    }
    return template.contenido;
  };

  // Filtered and sorted templates
  const filteredTemplates = useMemo(() => {
    let result = templates.filter(t => {
      const matchesSearch = t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (t.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || t.tipoCampo === filterType;
      return matchesSearch && matchesType;
    });

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'type':
        result.sort((a, b) => a.tipoCampo.localeCompare(b.tipoCampo));
        break;
      case 'favorites':
        result.sort((a, b) => (b.esFavorito ? 1 : 0) - (a.esFavorito ? 1 : 0));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }

    return result;
  }, [templates, searchTerm, filterType, sortBy]);

  // Template Card Component
  const TemplateCard = ({ template }) => {
    const typeConfig = getTypeConfig(template.tipoCampo);
    const IconComponent = typeConfig.icon;
    const colorClasses = {
      blue: 'from-blue-500 to-indigo-600 bg-blue-50 text-blue-600 border-blue-200',
      emerald: 'from-emerald-500 to-teal-600 bg-emerald-50 text-emerald-600 border-emerald-200',
      purple: 'from-purple-500 to-violet-600 bg-purple-50 text-purple-600 border-purple-200',
      amber: 'from-amber-500 to-orange-600 bg-amber-50 text-amber-600 border-amber-200',
      red: 'from-red-500 to-rose-600 bg-red-50 text-red-600 border-red-200',
      cyan: 'from-cyan-500 to-sky-600 bg-cyan-50 text-cyan-600 border-cyan-200',
      indigo: 'from-indigo-500 to-purple-600 bg-indigo-50 text-indigo-600 border-indigo-200',
      gray: 'from-gray-500 to-slate-600 bg-gray-50 text-gray-600 border-gray-200',
    };
    const colors = colorClasses[typeConfig.color] || colorClasses.gray;
    const displayContent = getDisplayContent(template);

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border-gray-100 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${colors.split(' ')[0]} ${colors.split(' ')[1]}`}>
                <IconComponent className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold line-clamp-1">
                  {template.nombre}
                </CardTitle>
                <Badge variant="secondary" className={`text-xs mt-1 ${colors.split(' ').slice(2).join(' ')}`}>
                  {typeConfig.label}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleToggleFavorite(template)}
              >
                {template.esFavorito ? (
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                ) : (
                  <StarOff className="h-4 w-4 text-gray-400" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openPreview(template)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Vista Previa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(template)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {template.descripcion && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-1">
              {template.descripcion}
            </p>
          )}
          <div className="bg-gray-50 rounded-lg p-3 mt-2">
            <p className="text-xs text-gray-600 line-clamp-3 font-mono">
              {displayContent}
            </p>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Sin fecha'}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => openPreview(template)}
            >
              Ver más
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Componente para el formulario de RECETA
  const FormularioReceta = () => (
    <div className="space-y-4">
      {/* Lista de medicamentos agregados */}
      {formData.medicamentos.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Medicamentos en la Receta ({formData.medicamentos.length})</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {formData.medicamentos.map((med, index) => (
              <div key={index} className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill className="h-4 w-4 text-cyan-600" />
                    <span className="font-semibold text-cyan-900">{med.nombre}</span>
                    {med.concentracion && (
                      <Badge variant="outline" className="text-xs">{med.concentracion}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {med.dosis} • Vía {med.via} • {FRECUENCIAS.find(f => f.value === med.frecuencia)?.label}
                    {med.duracionDias && ` • ${med.duracionDias} días`}
                  </p>
                  {med.instrucciones && (
                    <p className="text-xs text-gray-500 mt-1 italic">{med.instrucciones}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                  onClick={() => eliminarMedicamento(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario para agregar medicamento */}
      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Medicamento
        </Label>

        {/* Buscador de medicamentos */}
        <div className="relative">
          <Label className="text-xs text-gray-600">Buscar en Catálogo de Medicamentos</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
              placeholder="Escriba el nombre del medicamento..."
              className="pl-9"
            />
            {loadingProductos && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Resultados de búsqueda */}
          {productos.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {productos.map((producto) => (
                <div
                  key={producto.id}
                  className="p-2 hover:bg-cyan-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => seleccionarProducto(producto)}
                >
                  <p className="font-medium text-sm">{producto.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {producto.principioActivo && `${producto.principioActivo} • `}
                    {producto.concentracion || ''}
                    {producto.cum && ` • CUM: ${producto.cum}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medicamento seleccionado */}
        {medicamentoActual.nombre && (
          <div className="p-2 bg-cyan-100 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-cyan-600" />
              <span className="font-medium text-sm">{medicamentoActual.nombre}</span>
              {medicamentoActual.concentracion && (
                <Badge variant="outline" className="text-xs">{medicamentoActual.concentracion}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMedicamentoActual(prev => ({ ...prev, nombre: '', productoId: '' }))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Campos de dosificación */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Dosis *</Label>
            <Input
              value={medicamentoActual.dosis}
              onChange={(e) => setMedicamentoActual(prev => ({ ...prev, dosis: e.target.value }))}
              placeholder="Ej: 500mg, 1 tableta"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Vía de Administración</Label>
            <Select
              value={medicamentoActual.via}
              onValueChange={(v) => setMedicamentoActual(prev => ({ ...prev, via: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIAS_ADMINISTRACION.map(via => (
                  <SelectItem key={via} value={via}>{via}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Frecuencia</Label>
            <Select
              value={medicamentoActual.frecuencia}
              onValueChange={(v) => setMedicamentoActual(prev => ({ ...prev, frecuencia: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRECUENCIAS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Duración (días)</Label>
            <Input
              type="number"
              value={medicamentoActual.duracionDias}
              onChange={(e) => setMedicamentoActual(prev => ({ ...prev, duracionDias: e.target.value }))}
              placeholder="7"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Instrucciones especiales</Label>
          <Input
            value={medicamentoActual.instrucciones}
            onChange={(e) => setMedicamentoActual(prev => ({ ...prev, instrucciones: e.target.value }))}
            placeholder="Ej: Tomar después de las comidas, evitar con lácteos..."
            className="mt-1"
          />
        </div>

        <Button
          onClick={agregarMedicamento}
          className="w-full bg-cyan-600 hover:bg-cyan-700"
          disabled={!medicamentoActual.nombre || !medicamentoActual.dosis}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Medicamento
        </Button>
      </div>
    </div>
  );

  // Componente para el formulario de PROCEDIMIENTO
  const FormularioProcedimiento = () => (
    <div className="space-y-4">
      {/* Lista de procedimientos agregados */}
      {formData.procedimientos.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Procedimientos/Exámenes ({formData.procedimientos.length})</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {formData.procedimientos.map((proc, index) => (
              <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <TestTube className="h-4 w-4 text-indigo-600" />
                    <span className="font-semibold text-indigo-900">{proc.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {proc.codigoCups && (
                      <Badge className="bg-indigo-600 text-white text-xs">CUPS: {proc.codigoCups}</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{proc.tipo}</Badge>
                  </div>
                  {proc.observaciones && (
                    <p className="text-xs text-gray-500 mt-1">{proc.observaciones}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                  onClick={() => eliminarProcedimiento(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón para usar plantillas CUPS */}
      <Button
        variant="outline"
        className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
        onClick={() => setIsPlantillasCupsOpen(true)}
      >
        <FlaskConical className="h-4 w-4 mr-2" />
        Usar Plantillas CUPS Predefinidas
      </Button>

      {/* Formulario para agregar procedimiento */}
      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Procedimiento/Examen Individual
        </Label>

        {/* Tipo de servicio */}
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select
            value={procedimientoActual.tipo}
            onValueChange={(v) => setProcedimientoActual(prev => ({ ...prev, tipo: v }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Examen">Examen de Laboratorio</SelectItem>
              <SelectItem value="Procedimiento">Procedimiento</SelectItem>
              <SelectItem value="Imagenologia">Imagenología</SelectItem>
              <SelectItem value="Interconsulta">Interconsulta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Buscador de exámenes */}
        <div className="relative">
          <Label className="text-xs text-gray-600">Buscar en Catálogo (Exámenes, Procedimientos con CUPS)</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={busquedaExamen}
              onChange={(e) => setBusquedaExamen(e.target.value)}
              placeholder="Escriba el nombre o código CUPS..."
              className="pl-9"
            />
            {loadingExamenes && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Resultados de búsqueda */}
          {examenes.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {examenes.map((examen) => (
                <div
                  key={examen.id}
                  className="p-2 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => seleccionarExamen(examen)}
                >
                  <p className="font-medium text-sm">{examen.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {examen.codigoCUPS && `CUPS: ${examen.codigoCUPS} • `}
                    {examen.tipo || 'Examen'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* O ingresar manualmente */}
        <div className="text-center text-xs text-gray-400">— o ingresa manualmente —</div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Nombre del Examen/Procedimiento *</Label>
            <Input
              value={procedimientoActual.nombre}
              onChange={(e) => setProcedimientoActual(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Hemograma completo"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Código CUPS</Label>
            <Input
              value={procedimientoActual.codigoCups}
              onChange={(e) => setProcedimientoActual(prev => ({ ...prev, codigoCups: e.target.value }))}
              placeholder="Ej: 902210"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Observaciones / Indicaciones</Label>
          <Input
            value={procedimientoActual.observaciones}
            onChange={(e) => setProcedimientoActual(prev => ({ ...prev, observaciones: e.target.value }))}
            placeholder="Indicaciones especiales para el paciente o laboratorio..."
            className="mt-1"
          />
        </div>

        <Button
          onClick={agregarProcedimiento}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          disabled={!procedimientoActual.nombre}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Procedimiento
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-5 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5" />
        <div className="relative p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-40" />
              <div className="relative p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Mis Plantillas
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Textos predefinidos para agilizar tus consultas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSuggestionsOpen(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Plantillas Sugeridas
            </Button>
            <Button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Plantilla
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/70 backdrop-blur border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total plantillas</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.favoritos}</p>
                <p className="text-xs text-gray-500">Favoritas</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-cyan-600">{stats.porTipo.RECETA || 0}</p>
                <p className="text-xs text-gray-500">Recetas</p>
              </div>
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Pill className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{stats.porTipo.PROCEDIMIENTO || 0}</p>
                <p className="text-xs text-gray-500">Procedimientos</p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TestTube className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-white border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-3 flex-1 w-full md:w-auto">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar plantillas..."
                  className="pl-9 bg-gray-50 border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[180px] bg-gray-50 border-gray-200">
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  {TIPOS_CAMPO.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[160px] bg-gray-50 border-gray-200">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Más recientes</SelectItem>
                  <SelectItem value="name">Por nombre</SelectItem>
                  <SelectItem value="type">Por tipo</SelectItem>
                  <SelectItem value="favorites">Favoritas primero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={fetchTemplates}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('cards')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {searchTerm || filterType !== 'ALL' ? 'Sin resultados' : 'No tienes plantillas'}
              </h3>
              <p className="text-sm text-gray-500 mb-4 max-w-sm">
                {searchTerm || filterType !== 'ALL'
                  ? 'Intenta con otros filtros o términos de búsqueda'
                  : 'Crea tu primera plantilla para agilizar tus consultas médicas'}
              </p>
              {!searchTerm && filterType === 'ALL' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsSuggestionsOpen(true)}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Ver Sugerencias
                  </Button>
                  <Button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Plantilla
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Vista previa</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => {
                    const typeConfig = getTypeConfig(template.tipoCampo);
                    const displayContent = getDisplayContent(template);
                    return (
                      <TableRow key={template.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {template.esFavorito && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            )}
                            <div>
                              <p className="font-medium">{template.nombre}</p>
                              {template.descripcion && (
                                <p className="text-xs text-gray-400">{template.descripcion}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <typeConfig.icon className="h-3 w-3" />
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-gray-500 truncate font-mono">
                            {displayContent}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleFavorite(template)}
                            >
                              {template.esFavorito ? (
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              ) : (
                                <StarOff className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openPreview(template)}
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(template)}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDuplicate(template)}
                            >
                              <Copy className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentTemplate ? (
                <>
                  <Pencil className="h-5 w-5 text-blue-600" />
                  Editar Plantilla
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-blue-600" />
                  Nueva Plantilla
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {formData.tipoCampo === 'RECETA'
                ? 'Crea una plantilla de receta seleccionando medicamentos del catálogo'
                : formData.tipoCampo === 'PROCEDIMIENTO'
                ? 'Crea una plantilla de órdenes con exámenes y procedimientos (códigos CUPS)'
                : 'Usa {{Variable}} para crear campos dinámicos'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Consulta Hipertensión"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Campo</Label>
                <Select
                  value={formData.tipoCampo}
                  onValueChange={(val) => setFormData({...formData, tipoCampo: val, medicamentos: [], procedimientos: []})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CAMPO.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (Opcional)</Label>
              <Input
                id="descripcion"
                placeholder="Breve descripción para identificarla mejor"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>

            {/* Formulario específico según el tipo */}
            {formData.tipoCampo === 'RECETA' ? (
              <FormularioReceta />
            ) : formData.tipoCampo === 'PROCEDIMIENTO' ? (
              <FormularioProcedimiento />
            ) : (
              /* Formulario de texto con variables */
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="contenido">Contenido *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setIsVariablesOpen(true)}
                  >
                    <Braces className="h-3 w-3" />
                    Insertar Variable
                  </Button>
                </div>
                <Textarea
                  id="contenido"
                  placeholder="Paciente refiere dolor en {{Localizacion}} con intensidad {{Intensidad}}/10..."
                  className="h-40 font-mono text-sm"
                  value={formData.contenido}
                  onChange={(e) => setFormData({...formData, contenido: e.target.value})}
                />
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <input
                type="checkbox"
                id="favorito"
                checked={formData.esFavorito}
                onChange={(e) => setFormData({...formData, esFavorito: e.target.checked})}
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <Label htmlFor="favorito" className="flex items-center gap-2 text-amber-800 cursor-pointer">
                <Star className="h-4 w-4" />
                Marcar como favorita
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            >
              {currentTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variables Modal */}
      <Dialog open={isVariablesOpen} onOpenChange={setIsVariablesOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Braces className="h-5 w-5 text-blue-600" />
              Variables Predefinidas
            </DialogTitle>
            <DialogDescription>
              Haz clic en una variable para insertarla en tu plantilla
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {Object.entries(VARIABLES_PREDEFINIDAS).map(([categoria, variables]) => (
                <div key={categoria}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    {categoria}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {variables.map((variable) => (
                      <Button
                        key={variable.name}
                        variant="outline"
                        size="sm"
                        className="justify-start h-auto py-2 px-3 text-left"
                        onClick={() => {
                          insertVariable(variable.name);
                          setIsVariablesOpen(false);
                        }}
                      >
                        <div>
                          <p className="font-mono text-xs text-blue-600">{`{{${variable.name}}}`}</p>
                          <p className="text-xs text-gray-400">Ej: {variable.example}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Variable personalizada..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    insertVariable(e.target.value);
                    setIsVariablesOpen(false);
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={(e) => {
                  const input = e.target.parentElement.querySelector('input');
                  if (input?.value) {
                    insertVariable(input.value);
                    setIsVariablesOpen(false);
                  }
                }}
              >
                Insertar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Vista Previa
            </DialogTitle>
            {previewTemplate && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {getTypeConfig(previewTemplate.tipoCampo).label}
                </Badge>
                {previewTemplate.esFavorito && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    <Star className="h-3 w-3 mr-1 fill-amber-500" />
                    Favorita
                  </Badge>
                )}
              </div>
            )}
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {previewTemplate.nombre}
                </h3>
                {previewTemplate.descripcion && (
                  <p className="text-sm text-gray-500 mt-1">
                    {previewTemplate.descripcion}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-sm font-medium text-gray-700 mb-2">Contenido:</p>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono bg-white p-3 rounded border">
                  {getDisplayContent(previewTemplate)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setIsPreviewOpen(false);
                openEdit(previewTemplate);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suggestions Modal */}
      <Dialog open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Plantillas Sugeridas
            </DialogTitle>
            <DialogDescription>
              Plantillas preconfiguradas para comenzar rápidamente
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {PLANTILLAS_SUGERIDAS.map((suggestion, index) => {
                const typeConfig = getTypeConfig(suggestion.tipoCampo);
                return (
                  <Card
                    key={index}
                    className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                    onClick={() => handleUseSuggestion(suggestion)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${typeConfig.color}-100`}>
                            <typeConfig.icon className={`h-4 w-4 text-${typeConfig.color}-600`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{suggestion.nombre}</CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {typeConfig.label}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <Zap className="h-4 w-4" />
                          Usar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {suggestion.descripcion && (
                        <p className="text-sm text-gray-500 mb-2">{suggestion.descripcion}</p>
                      )}
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-600 line-clamp-3 font-mono">
                          {suggestion.contenido}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuggestionsOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plantillas CUPS Modal */}
      <Dialog open={isPlantillasCupsOpen} onOpenChange={setIsPlantillasCupsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-indigo-600" />
              Plantillas de Exámenes con Códigos CUPS
            </DialogTitle>
            <DialogDescription>
              Selecciona una plantilla para agregar múltiples exámenes de una vez
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {CATEGORIAS.map((categoria) => {
                const plantillasCat = PLANTILLAS_ORDENES.filter(p => p.categoria === categoria);
                const color = COLORES_CATEGORIA[categoria] || 'gray';

                return (
                  <div key={categoria}>
                    <h3 className={`text-sm font-semibold text-${color}-700 mb-3 flex items-center gap-2`}>
                      <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
                      {categoria}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plantillasCat.map((plantilla) => (
                        <Card
                          key={plantilla.id}
                          className={`cursor-pointer hover:border-${color}-300 hover:shadow-md transition-all`}
                          onClick={() => agregarDesdePlantillaCups(plantilla)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{plantilla.nombre}</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {plantilla.examenes.length} exámenes
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {plantilla.examenes.slice(0, 3).map((ex, i) => (
                                    <Badge key={i} variant="outline" className="text-xs font-mono">
                                      {ex.codigoCups}
                                    </Badge>
                                  ))}
                                  {plantilla.examenes.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{plantilla.examenes.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" className="shrink-0">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlantillasCupsOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
