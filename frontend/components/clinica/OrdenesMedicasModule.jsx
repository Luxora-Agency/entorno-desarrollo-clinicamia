'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  User,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Printer,
  Download,
  LayoutGrid,
  List,
  FlaskConical,
  ScanLine,
  Stethoscope,
  Microscope,
  Utensils,
  ClipboardList,
  Activity,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  Send,
  TrendingUp,
  UserCircle,
  Building2,
  CalendarDays,
  ArrowUpRight,
  MoreVertical,
  X,
  ChevronLeft,
  ArrowRight,
  CalendarRange,
  Package,
  Pill,
  AlertTriangle,
  History,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

// Tipos de órdenes principales con iconos y colores
const TIPOS_ORDEN = [
  { value: 'Prescripcion', label: 'Prescripción', icon: Pill, color: 'teal', bgColor: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-300' },
  { value: 'ExamenesProcedimientos', label: 'Exámenes/Procedimientos', icon: FlaskConical, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300' },
  { value: 'Interconsulta', label: 'Interconsulta', icon: Stethoscope, color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-300' },
  // Subtipos para items dentro de órdenes agrupadas
  { value: 'Laboratorio', label: 'Laboratorio', icon: FlaskConical, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300' },
  { value: 'Imagenologia', label: 'Imagenología', icon: ScanLine, color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300' },
  { value: 'Procedimiento', label: 'Procedimiento', icon: Stethoscope, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300' },
  { value: 'Examen', label: 'Examen', icon: Microscope, color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-300' },
  { value: 'Otro', label: 'Otro', icon: FileText, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' },
];

// Estados de la orden
const ESTADOS_ORDEN = [
  { value: 'Pendiente', label: 'Pendiente', icon: Clock, color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  { value: 'EnProceso', label: 'En Proceso', icon: Activity, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  { value: 'Completada', label: 'Completada', icon: CheckCircle, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  { value: 'Cancelada', label: 'Cancelada', icon: XCircle, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
];

// Prioridades
const PRIORIDADES = [
  { value: 'Normal', label: 'Normal', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  { value: 'Media', label: 'Media', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  { value: 'Alta', label: 'Alta', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  { value: 'Urgente', label: 'Urgente', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700', pulse: true },
];

// Filtros de fecha rápidos
const FILTROS_FECHA = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'ayer', label: 'Ayer' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'todos', label: 'Todos' },
];

// Paquetes predefinidos
const PAQUETES_PREDEFINIDOS = [
  {
    id: 'lab-ingreso',
    nombre: 'Laboratorios de Ingreso',
    descripcion: 'Panel básico para admisión hospitalaria',
    icon: FlaskConical,
    color: 'blue',
    ordenes: [
      { tipo: 'Laboratorio', descripcion: 'Hemograma completo', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Glicemia en ayunas', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Creatinina sérica', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'BUN (Nitrógeno ureico)', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Electrolitos (Na, K, Cl)', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Parcial de orina', prioridad: 'Media' },
    ],
  },
  {
    id: 'control-metabolico',
    nombre: 'Control Metabólico',
    descripcion: 'Seguimiento de pacientes con diabetes',
    icon: Activity,
    color: 'green',
    ordenes: [
      { tipo: 'Laboratorio', descripcion: 'Glicemia en ayunas', prioridad: 'Media' },
      { tipo: 'Laboratorio', descripcion: 'Hemoglobina glicosilada (HbA1c)', prioridad: 'Media' },
      { tipo: 'Laboratorio', descripcion: 'Perfil lipídico completo', prioridad: 'Media' },
      { tipo: 'Laboratorio', descripcion: 'Microalbuminuria', prioridad: 'Media' },
    ],
  },
  {
    id: 'control-infeccioso',
    nombre: 'Control Infeccioso',
    descripcion: 'Sospecha de proceso infeccioso',
    icon: AlertCircle,
    color: 'red',
    ordenes: [
      { tipo: 'Laboratorio', descripcion: 'Hemograma completo', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Proteína C Reactiva (PCR)', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Procalcitonina', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Hemocultivos x2', prioridad: 'Urgente' },
      { tipo: 'Laboratorio', descripcion: 'Urocultivo', prioridad: 'Alta' },
    ],
  },
  {
    id: 'chequeo-cardiaco',
    nombre: 'Chequeo Cardíaco',
    descripcion: 'Evaluación cardiovascular básica',
    icon: Activity,
    color: 'purple',
    ordenes: [
      { tipo: 'Laboratorio', descripcion: 'Perfil lipídico completo', prioridad: 'Media' },
      { tipo: 'Laboratorio', descripcion: 'Troponina I', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'BNP / NT-proBNP', prioridad: 'Media' },
      { tipo: 'Procedimiento', descripcion: 'Electrocardiograma (ECG)', prioridad: 'Alta' },
      { tipo: 'Imagenologia', descripcion: 'Radiografía de tórax PA y lateral', prioridad: 'Media' },
    ],
  },
  {
    id: 'preoperatorio',
    nombre: 'Preoperatorio',
    descripcion: 'Evaluación previa a cirugía',
    icon: Stethoscope,
    color: 'amber',
    ordenes: [
      { tipo: 'Laboratorio', descripcion: 'Hemograma completo', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Tiempos de coagulación (PT, PTT, INR)', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Glicemia en ayunas', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Creatinina sérica', prioridad: 'Alta' },
      { tipo: 'Procedimiento', descripcion: 'Electrocardiograma (ECG)', prioridad: 'Alta' },
      { tipo: 'Imagenologia', descripcion: 'Radiografía de tórax PA', prioridad: 'Media' },
    ],
  },
];

export default function OrdenesMedicasModule({ user }) {
  const { toast } = useToast();

  // Estados principales
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Panel de detalle
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(true);

  // Rol del usuario
  const userRole = (user?.rol || user?.role || user?.rolNombre || '').toLowerCase();
  const isDoctor = ['doctor', 'medico', 'médico'].includes(userRole);
  const isAdmin = ['admin', 'administrador', 'super_admin', 'superadmin'].includes(userRole);
  const doctorUserId = user?.id;

  // Tab activo (clasificación)
  const [activeTab, setActiveTab] = useState('todas');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterPrioridad, setFilterPrioridad] = useState('todas');
  const [filterFechaRapido, setFilterFechaRapido] = useState('todos');

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  // Modales
  const [showNuevaOrdenModal, setShowNuevaOrdenModal] = useState(false);
  const [showResultadosModal, setShowResultadosModal] = useState(false);

  // Datos auxiliares
  const [examenes, setExamenes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);

  // Formulario nueva orden
  const [nuevaOrden, setNuevaOrden] = useState({
    paciente_id: '',
    tipo: 'Laboratorio',
    examen_procedimiento_id: '',
    descripcion: '',
    prioridad: 'Media',
    observaciones: '',
    doctor_id: doctorUserId || '',
  });
  const [searchPaciente, setSearchPaciente] = useState('');
  const [searchExamen, setSearchExamen] = useState('');

  // Formulario resultados
  const [resultados, setResultados] = useState({
    resultados: '',
    observaciones: '',
  });

  // Calcular fechas para filtros
  const getFechaFiltro = useCallback((tipo) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    switch (tipo) {
      case 'hoy':
        return hoy.toISOString().split('T')[0];
      case 'ayer':
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        return ayer.toISOString().split('T')[0];
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
        return inicioSemana.toISOString().split('T')[0];
      case 'mes':
        return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
      default:
        return null;
    }
  }, []);

  // Cargar órdenes
  const loadOrdenes = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Filtrado basado en rol
      if (!isAdmin && doctorUserId) {
        params.append('doctor_id', doctorUserId);
        if (isDoctor) {
          params.append('mis_ordenes', 'true');
        }
      }

      // Tab de clasificación
      if (activeTab === 'mis') {
        params.set('doctor_id', doctorUserId);
        params.delete('mis_ordenes');
      } else if (activeTab === 'urgentes') {
        params.append('prioridad', 'Urgente');
        params.append('estado_not', 'Completada,Cancelada');
      } else if (activeTab === 'pendientes') {
        params.append('estado', 'Pendiente');
      }

      // Filtros adicionales
      if (filterEstado !== 'todas') params.append('estado', filterEstado);
      if (filterTipo !== 'todos') params.append('tipo', filterTipo);
      if (filterPrioridad !== 'todas') params.append('prioridad', filterPrioridad);

      const fechaFiltro = getFechaFiltro(filterFechaRapido);
      if (fechaFiltro) params.append('fecha_desde', fechaFiltro);

      if (searchTerm) params.append('search', searchTerm);

      const response = await apiGet(`/ordenes-medicas?${params.toString()}`);

      if (response.success) {
        setOrdenes(response.data || []);
        setTotal(response.pagination?.total || response.data?.length || 0);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las órdenes médicas.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, activeTab, filterEstado, filterTipo, filterPrioridad, filterFechaRapido, searchTerm, toast, isDoctor, isAdmin, doctorUserId, getFechaFiltro]);

  // Cargar datos auxiliares
  const loadAuxiliaryData = useCallback(async () => {
    try {
      const [examenesRes, pacientesRes, doctoresRes] = await Promise.all([
        apiGet('/examenes-procedimientos?limit=200&activo=true'),
        apiGet('/pacientes?limit=50&activo=true'),
        apiGet('/doctores?limit=50&activo=true'),
      ]);

      if (examenesRes.success) {
        setExamenes(examenesRes.data?.data || examenesRes.data || []);
      }
      if (pacientesRes.success) {
        setPacientes(pacientesRes.data?.data || pacientesRes.data || []);
      }
      if (doctoresRes.success) {
        setDoctores(doctoresRes.data || []);
      }
    } catch (error) {
      console.error('Error loading auxiliary data:', error);
    }
  }, []);

  useEffect(() => {
    loadOrdenes();
  }, [loadOrdenes]);

  useEffect(() => {
    loadAuxiliaryData();
  }, [loadAuxiliaryData]);

  // Estadísticas calculadas de todas las órdenes
  const stats = useMemo(() => {
    const pendientes = ordenes.filter(o => o.estado === 'Pendiente').length;
    const enProceso = ordenes.filter(o => o.estado === 'EnProceso').length;
    const completadas = ordenes.filter(o => o.estado === 'Completada').length;
    const urgentes = ordenes.filter(o => o.prioridad === 'Urgente' && o.estado !== 'Completada' && o.estado !== 'Cancelada').length;
    const misOrdenes = ordenes.filter(o => o.doctorId === doctorUserId).length;

    return { total: ordenes.length, pendientes, enProceso, completadas, urgentes, misOrdenes };
  }, [ordenes, doctorUserId]);

  // Filtrar pacientes para búsqueda
  const pacientesFiltrados = useMemo(() => {
    if (!searchPaciente) return [];
    const term = searchPaciente.toLowerCase();
    return pacientes.filter(p =>
      p.nombre?.toLowerCase().includes(term) ||
      p.apellido?.toLowerCase().includes(term) ||
      p.cedula?.includes(term) ||
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [pacientes, searchPaciente]);

  // Filtrar exámenes para búsqueda
  const examenesFiltrados = useMemo(() => {
    if (!searchExamen) return [];
    const term = searchExamen.toLowerCase();
    return examenes.filter(e =>
      e.nombre?.toLowerCase().includes(term) ||
      e.codigo?.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [examenes, searchExamen]);

  // Obtener info de tipo
  const getTipoInfo = (tipo) => {
    return TIPOS_ORDEN.find(t => t.value === tipo) || TIPOS_ORDEN[6];
  };

  // Obtener info de estado
  const getEstadoInfo = (estado) => {
    return ESTADOS_ORDEN.find(e => e.value === estado) || ESTADOS_ORDEN[0];
  };

  // Obtener info de prioridad
  const getPrioridadInfo = (prioridad) => {
    return PRIORIDADES.find(p => p.value === prioridad) || PRIORIDADES[0];
  };

  // Detectar si es prescripción desde observaciones
  const esPrescripcion = (orden) => {
    const obs = orden.observaciones || '';
    return obs.includes('APLICACIÓN DE KIT') || obs.includes('Kit ') || obs.includes('Medicamentos incluidos');
  };

  // Detectar si es orden agrupada de exámenes/procedimientos
  const esOrdenAgrupada = (orden) => {
    const obs = orden.observaciones || '';
    return obs.includes('ORDEN DE EXAMEN') || obs.includes('ORDEN DE PROCEDIMIENTO') || obs.includes('Items solicitados');
  };

  // Detectar si es interconsulta
  const esInterconsulta = (orden) => {
    return orden.tipo === 'Interconsulta' || (orden.observaciones || '').includes('INTERCONSULTA');
  };

  // Obtener el tipo principal de la orden (Prescripción, Exámenes/Procedimientos, Interconsulta)
  const getTipoPrincipal = (orden) => {
    if (esPrescripcion(orden)) return 'Prescripcion';
    if (esInterconsulta(orden)) return 'Interconsulta';
    if (esOrdenAgrupada(orden)) return 'ExamenesProcedimientos';
    // Si tiene examenProcedimiento asociado, es orden de examen/procedimiento individual
    if (orden.examenProcedimientoId || orden.examenProcedimiento) return 'ExamenesProcedimientos';
    return 'ExamenesProcedimientos'; // Por defecto
  };

  // Parsear items de orden agrupada
  const parseOrdenAgrupada = (observaciones) => {
    if (!observaciones) return null;
    const items = [];
    const lineas = observaciones.split('\n');

    for (const linea of lineas) {
      const match = linea.match(/^\d+\.\s*\[([^\]]+)\]\s*(.+)/);
      if (match) {
        const tipo = match[1].trim();
        let resto = match[2].trim();
        const cupsMatch = resto.match(/\(CUPS:\s*([^)]+)\)/);
        const codigoCups = cupsMatch ? cupsMatch[1].trim() : '';
        if (cupsMatch) resto = resto.replace(cupsMatch[0], '').trim();
        const partes = resto.split(' - ');
        items.push({
          tipo,
          nombre: partes[0].trim(),
          codigoCups,
          observaciones: partes.length > 1 ? partes.slice(1).join(' - ').trim() : '',
        });
      }
    }
    return items.length > 0 ? items : null;
  };

  // Crear nueva orden
  const handleCrearOrden = async () => {
    if (!nuevaOrden.paciente_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debe seleccionar un paciente.' });
      return;
    }

    if (!nuevaOrden.examen_procedimiento_id && !nuevaOrden.descripcion) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debe seleccionar el examen o ingresar una descripción.' });
      return;
    }

    const examenSeleccionado = examenes.find(e => e.id === nuevaOrden.examen_procedimiento_id);
    const precioAplicado = examenSeleccionado?.costoBase || examenSeleccionado?.precio || 0;

    setLoading(true);
    try {
      const ordenData = {
        ...nuevaOrden,
        doctor_id: doctorUserId,
        precio_aplicado: precioAplicado,
      };

      const response = await apiPost('/ordenes-medicas', ordenData);

      if (response.success) {
        toast({ title: 'Orden creada', description: 'La orden médica ha sido creada correctamente.' });
        setShowNuevaOrdenModal(false);
        setNuevaOrden({
          paciente_id: '',
          tipo: 'Laboratorio',
          examen_procedimiento_id: '',
          descripcion: '',
          prioridad: 'Media',
          observaciones: '',
          doctor_id: doctorUserId || '',
        });
        setSearchPaciente('');
        setSearchExamen('');
        loadOrdenes(true);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo crear la orden.' });
    } finally {
      setLoading(false);
    }
  };

  // Crear paquete de órdenes
  const handleCrearPaquete = async (paquete) => {
    if (!nuevaOrden.paciente_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debe seleccionar un paciente primero.' });
      return;
    }

    if (!doctorUserId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar al médico.' });
      return;
    }

    setLoading(true);
    try {
      let creadas = 0;
      for (const orden of paquete.ordenes) {
        const examenMatch = examenes.find(e =>
          e.nombre?.toLowerCase().includes(orden.descripcion?.toLowerCase()) ||
          orden.descripcion?.toLowerCase().includes(e.nombre?.toLowerCase())
        );

        const response = await apiPost('/ordenes-medicas', {
          paciente_id: nuevaOrden.paciente_id,
          doctor_id: doctorUserId,
          examen_procedimiento_id: examenMatch?.id || null,
          tipo: orden.tipo,
          descripcion: orden.descripcion,
          prioridad: orden.prioridad,
          precio_aplicado: examenMatch?.costoBase || examenMatch?.precio || 0,
          observaciones: `Paquete: ${paquete.nombre}`,
        });
        if (response.success) creadas++;
      }

      toast({
        title: 'Paquete creado',
        description: `Se crearon ${creadas} de ${paquete.ordenes.length} órdenes del paquete "${paquete.nombre}".`,
      });
      setShowNuevaOrdenModal(false);
      loadOrdenes(true);
    } catch (error) {
      console.error('Error creating package:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el paquete de órdenes.' });
    } finally {
      setLoading(false);
    }
  };

  // Completar orden
  const handleCompletarOrden = async () => {
    if (!selectedOrden) return;

    setLoading(true);
    try {
      const response = await apiPost(`/ordenes-medicas/${selectedOrden.id}/completar`, {
        resultados: resultados.resultados || 'Sin observaciones',
        observaciones: resultados.observaciones,
      });

      if (response.success) {
        toast({ title: 'Orden completada', description: 'La orden ha sido marcada como completada.' });
        setShowResultadosModal(false);
        setResultados({ resultados: '', observaciones: '' });
        loadOrdenes(true);
      }
    } catch (error) {
      console.error('Error completing order:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la orden.' });
    } finally {
      setLoading(false);
    }
  };

  // Cancelar orden
  const handleCancelarOrden = async (orden) => {
    if (!confirm('¿Está seguro de cancelar esta orden?')) return;

    try {
      const response = await apiPost(`/ordenes-medicas/${orden.id}/cancelar`, {
        motivo: 'Cancelada por el usuario',
      });

      if (response.success) {
        toast({ title: 'Orden cancelada', description: 'La orden ha sido cancelada.' });
        if (selectedOrden?.id === orden.id) setSelectedOrden(null);
        loadOrdenes(true);
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cancelar la orden.' });
    }
  };

  // Descargar PDF
  const handleDescargarPdf = async (orden) => {
    if (!orden?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar la orden.' });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      toast({ title: 'Generando PDF...', description: 'Por favor espere.' });

      const response = await fetch(`${apiUrl}/ordenes-medicas/${orden.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let errorMessage = 'Error al generar el PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orden-medica-${orden.id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'PDF descargado', description: 'La orden se ha descargado correctamente.' });
    } catch (err) {
      console.error('[PDF] Error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'No se pudo descargar el PDF.' });
    }
  };

  // Imprimir orden
  const handleImprimirOrden = async (orden) => {
    if (!orden?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar la orden.' });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/ordenes-medicas/${orden.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
    } catch (err) {
      console.error('[PDF] Error:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo imprimir la orden.' });
    }
  };

  // Vista previa del PDF (sin imprimir)
  const handleVistaPrevia = async (orden) => {
    if (!orden?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar la orden.' });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      toast({ title: 'Cargando vista previa...', description: 'Por favor espere.' });

      const response = await fetch(`${apiUrl}/ordenes-medicas/${orden.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('[PDF] Error:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la vista previa.' });
    }
  };

  // Formatear fecha
  const formatDate = (dateString, showTime = true) => {
    if (!dateString) return 'N/A';
    const options = showTime
      ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-CO', options);
  };

  // Formatear fecha relativa
  const formatRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    return formatDate(dateString, false);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Panel Principal */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${showDetailPanel && selectedOrden ? 'mr-96' : ''}`}>
        {/* Header compacto */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Órdenes Médicas</h1>
                <p className="text-sm text-gray-500">Gestión de exámenes y procedimientos</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadOrdenes(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button onClick={() => setShowNuevaOrdenModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={() => setActiveTab('todas')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'todas' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FileText className="w-4 h-4" />
              <span>Todas</span>
              <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
            </button>

            <button
              onClick={() => setActiveTab('mis')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'mis' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <UserCircle className="w-4 h-4" />
              <span>Mis Órdenes</span>
              <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">{stats.misOrdenes}</Badge>
            </button>

            <button
              onClick={() => setActiveTab('pendientes')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pendientes' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Clock className="w-4 h-4" />
              <span>Pendientes</span>
              <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-700">{stats.pendientes}</Badge>
            </button>

            <button
              onClick={() => setActiveTab('urgentes')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'urgentes' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'} ${stats.urgentes > 0 ? 'animate-pulse' : ''}`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Urgentes</span>
              <Badge variant="secondary" className={`ml-1 ${stats.urgentes > 0 ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'}`}>{stats.urgentes}</Badge>
            </button>

            <div className="h-6 w-px bg-gray-200 mx-2" />

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{stats.completadas} completadas</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border-b px-6 py-3">
          <div className="flex items-center gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar paciente, doctor, descripción..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10 h-9"
              />
            </div>

            {/* Filtro de fecha rápido */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {FILTROS_FECHA.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setFilterFechaRapido(f.value); setPage(1); }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterFechaRapido === f.value ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Filtro Estado */}
            <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v); setPage(1); }}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos</SelectItem>
                {ESTADOS_ORDEN.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Tipo */}
            <Select value={filterTipo} onValueChange={(v) => { setFilterTipo(v); setPage(1); }}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="Prescripcion">Prescripción</SelectItem>
                <SelectItem value="ExamenesProcedimientos">Exám/Procedimientos</SelectItem>
                <SelectItem value="Interconsulta">Interconsulta</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Prioridad */}
            <Select value={filterPrioridad} onValueChange={(v) => { setFilterPrioridad(v); setPage(1); }}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Toggle panel detalle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailPanel(!showDetailPanel)}
              className="ml-auto"
            >
              {showDetailPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Lista de órdenes */}
        <div className="flex-1 overflow-auto p-6">
          {loading && !refreshing ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : ordenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <ClipboardList className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes médicas</h3>
              <p className="text-gray-500 mb-4">Crea una nueva orden para comenzar</p>
              <Button onClick={() => setShowNuevaOrdenModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {ordenes.map((orden) => {
                const tipoPrincipal = getTipoPrincipal(orden);
                const tipoInfo = getTipoInfo(tipoPrincipal);
                const estadoInfo = getEstadoInfo(orden.estado);
                const prioridadInfo = getPrioridadInfo(orden.prioridad);
                const TipoIcon = tipoInfo.icon;
                const isSelected = selectedOrden?.id === orden.id;
                const isUrgent = orden.prioridad === 'Urgente' && orden.estado !== 'Completada' && orden.estado !== 'Cancelada';

                return (
                  <div
                    key={orden.id}
                    onClick={() => setSelectedOrden(orden)}
                    className={`
                      group flex items-center gap-4 p-4 bg-white rounded-xl border-2 cursor-pointer transition-all
                      ${isSelected ? 'border-indigo-500 shadow-md' : 'border-transparent hover:border-gray-200 hover:shadow-sm'}
                      ${isUrgent ? 'bg-red-50 border-red-200' : ''}
                    `}
                  >
                    {/* Tipo de orden */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${tipoInfo.bgColor} flex-shrink-0 min-w-[160px]`}>
                      <TipoIcon className={`w-4 h-4 ${tipoInfo.textColor}`} />
                      <span className={`text-xs font-semibold ${tipoInfo.textColor}`}>
                        {tipoPrincipal === 'Prescripcion' && 'Prescripción'}
                        {tipoPrincipal === 'ExamenesProcedimientos' && (esOrdenAgrupada(orden) ? `Exám/Proc (${parseOrdenAgrupada(orden.observaciones)?.length || 0})` : 'Exám/Procedimiento')}
                        {tipoPrincipal === 'Interconsulta' && 'Interconsulta'}
                      </span>
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 truncate">
                          {orden.paciente?.nombre} {orden.paciente?.apellido}
                        </span>
                        <span className="text-xs text-gray-400">
                          {orden.paciente?.tipoDocumento || 'CC'} {orden.paciente?.cedula}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {tipoPrincipal === 'Prescripcion' ? (
                          <span className="flex items-center gap-1">
                            <Pill className="w-3 h-3" />
                            {orden.observaciones?.split('\n')[0]?.replace('APLICACIÓN DE KIT:', '').trim() || 'Prescripción médica'}
                          </span>
                        ) : tipoPrincipal === 'Interconsulta' ? (
                          <span className="flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" />
                            {orden.especialidadDestino || orden.descripcion || orden.observaciones?.split('\n')[0] || 'Interconsulta médica'}
                          </span>
                        ) : esOrdenAgrupada(orden) ? (
                          <span className="flex items-center gap-1">
                            <ClipboardList className="w-3 h-3" />
                            {parseOrdenAgrupada(orden.observaciones)?.length || 0} items: {parseOrdenAgrupada(orden.observaciones)?.slice(0, 2).map(i => i.nombre).join(', ')}
                            {(parseOrdenAgrupada(orden.observaciones)?.length || 0) > 2 && '...'}
                          </span>
                        ) : (
                          orden.examenProcedimiento?.nombre || orden.observaciones?.split('\n')[0] || orden.descripcion || 'Sin descripción'
                        )}
                      </p>
                    </div>

                    {/* Solicitante */}
                    <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                      {orden.doctorId === doctorUserId ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Mi orden</Badge>
                      ) : (
                        <span className="text-xs text-gray-500">
                          Dr. {orden.doctor?.nombre?.split(' ')[0]}
                        </span>
                      )}
                    </div>

                    {/* Badges de estado */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`${prioridadInfo.bgColor} ${prioridadInfo.textColor} text-xs ${prioridadInfo.pulse ? 'animate-pulse' : ''}`}>
                        {prioridadInfo.label}
                      </Badge>
                      <Badge className={`${estadoInfo.bgColor} ${estadoInfo.textColor} text-xs`}>
                        {estadoInfo.label}
                      </Badge>
                    </div>

                    {/* Fecha */}
                    <div className="text-right flex-shrink-0 w-20">
                      <p className="text-xs text-gray-500">{formatRelativeDate(orden.fechaOrden || orden.createdAt)}</p>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => { e.stopPropagation(); handleDescargarPdf(orden); }}
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => { e.stopPropagation(); handleImprimirOrden(orden); }}
                        title="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      {(orden.estado === 'Pendiente' || orden.estado === 'EnProceso') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => { setSelectedOrden(orden); setShowResultadosModal(true); }}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Completar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCancelarOrden(orden)}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Mostrando {ordenes.length} de {total} órdenes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm text-gray-600 px-3">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel de Detalle Lateral */}
      {showDetailPanel && selectedOrden && (
        <div className="fixed right-0 top-16 bottom-0 w-96 bg-white border-l shadow-xl overflow-hidden flex flex-col z-40">
          {/* Header del panel */}
          <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const tipoPrincipal = getTipoPrincipal(selectedOrden);
                  const tipoInfo = getTipoInfo(tipoPrincipal);
                  const TipoIcon = tipoInfo.icon;
                  return (
                    <div className={`p-2 rounded-lg ${tipoInfo.bgColor}`}>
                      <TipoIcon className={`w-5 h-5 ${tipoInfo.textColor}`} />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {(() => {
                      const tipoPrincipal = getTipoPrincipal(selectedOrden);
                      if (tipoPrincipal === 'Prescripcion') return 'Prescripción Médica';
                      if (tipoPrincipal === 'Interconsulta') return 'Interconsulta';
                      if (esOrdenAgrupada(selectedOrden)) {
                        return `Exámenes/Procedimientos (${parseOrdenAgrupada(selectedOrden.observaciones)?.length || 0})`;
                      }
                      return 'Examen/Procedimiento';
                    })()}
                  </h3>
                  <p className="text-xs text-gray-500">#{selectedOrden.id?.substring(0, 8)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrden(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-3">
              <Badge className={`${getPrioridadInfo(selectedOrden.prioridad).bgColor} ${getPrioridadInfo(selectedOrden.prioridad).textColor}`}>
                {selectedOrden.prioridad}
              </Badge>
              <Badge className={`${getEstadoInfo(selectedOrden.estado).bgColor} ${getEstadoInfo(selectedOrden.estado).textColor}`}>
                {getEstadoInfo(selectedOrden.estado).label}
              </Badge>
              {selectedOrden.doctorId === doctorUserId && (
                <Badge className="bg-green-100 text-green-700">Mi orden</Badge>
              )}
            </div>
          </div>

          {/* Contenido scrolleable */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Paciente */}
              <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wide">Paciente</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedOrden.paciente?.nombre} {selectedOrden.paciente?.apellido}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedOrden.paciente?.tipoDocumento || 'CC'} {selectedOrden.paciente?.cedula}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Solicitante */}
              <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wide">Médico Solicitante</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">
                    Dr(a). {selectedOrden.doctor?.nombre} {selectedOrden.doctor?.apellido}
                  </p>
                  {selectedOrden.doctor?.especialidad && (
                    <p className="text-sm text-gray-500">{selectedOrden.doctor.especialidad}</p>
                  )}
                </div>
              </div>

              {/* Contenido según tipo de orden */}
              {(() => {
                const tipoPrincipal = getTipoPrincipal(selectedOrden);

                // PRESCRIPCIÓN
                if (tipoPrincipal === 'Prescripcion') {
                  return (
                    <>
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Prescripción</Label>
                        <div className="mt-2 p-3 bg-teal-50 rounded-lg border border-teal-100">
                          <p className="font-semibold text-teal-900">
                            {selectedOrden.observaciones?.split('\n')[0]?.replace('APLICACIÓN DE KIT:', '').trim()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Detalle de Medicamentos</Label>
                        <div className="mt-2 p-3 bg-teal-50 rounded-lg border border-teal-100">
                          <pre className="text-xs text-teal-900 whitespace-pre-wrap font-mono">
                            {selectedOrden.observaciones}
                          </pre>
                        </div>
                      </div>
                    </>
                  );
                }

                // INTERCONSULTA
                if (tipoPrincipal === 'Interconsulta') {
                  return (
                    <>
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Especialidad Destino</Label>
                        <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="font-semibold text-amber-900">
                            {selectedOrden.especialidadDestino || selectedOrden.descripcion || 'Especialidad no especificada'}
                          </p>
                        </div>
                      </div>
                      {selectedOrden.observaciones && (
                        <div>
                          <Label className="text-xs text-gray-500 uppercase tracking-wide">Motivo de la Interconsulta</Label>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 whitespace-pre-line">{selectedOrden.observaciones}</p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                }

                // EXÁMENES/PROCEDIMIENTOS AGRUPADOS
                if (esOrdenAgrupada(selectedOrden)) {
                  return (
                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">
                        Items Solicitados ({parseOrdenAgrupada(selectedOrden.observaciones)?.length || 0})
                      </Label>
                      <div className="mt-2 space-y-2">
                        {parseOrdenAgrupada(selectedOrden.observaciones)?.map((item, idx) => {
                          const itemTipoInfo = getTipoInfo(item.tipo === 'Examen' ? 'Examen' : item.tipo === 'Procedimiento' ? 'Procedimiento' : item.tipo === 'Imagenología' ? 'Imagenologia' : 'Laboratorio');
                          const ItemIcon = itemTipoInfo.icon;
                          return (
                            <div key={idx} className={`p-3 rounded-lg border ${itemTipoInfo.bgColor} ${itemTipoInfo.borderColor}`}>
                              <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-md bg-white/60`}>
                                  <ItemIcon className={`w-4 h-4 ${itemTipoInfo.textColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${itemTipoInfo.bgColor} ${itemTipoInfo.textColor}`}>
                                      {item.tipo}
                                    </span>
                                    {item.codigoCups && (
                                      <span className="text-xs text-gray-500 bg-white/80 px-2 py-0.5 rounded">
                                        CUPS: {item.codigoCups}
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-medium text-gray-900 mt-1">{item.nombre}</p>
                                  {item.observaciones && (
                                    <p className="text-xs text-gray-600 mt-1">{item.observaciones}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // EXAMEN/PROCEDIMIENTO INDIVIDUAL
                return (
                  <>
                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">Examen / Procedimiento</Label>
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-semibold text-blue-900">
                          {selectedOrden.examenProcedimiento?.nombre || selectedOrden.descripcion || 'N/A'}
                        </p>
                        {selectedOrden.examenProcedimiento?.codigo && (
                          <p className="text-sm text-blue-600 mt-1">
                            Código: {selectedOrden.examenProcedimiento.codigo}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedOrden.observaciones && (
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Indicaciones</Label>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-line">{selectedOrden.observaciones}</p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Resultados (si completada) */}
              {selectedOrden.estado === 'Completada' && selectedOrden.resultados && (
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Resultados</Label>
                  <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      {typeof selectedOrden.resultados === 'object'
                        ? JSON.stringify(selectedOrden.resultados, null, 2)
                        : selectedOrden.resultados
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Fecha Orden</Label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(selectedOrden.fechaOrden || selectedOrden.createdAt)}
                  </p>
                </div>
                {selectedOrden.fechaEjecucion && (
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Fecha Ejecución</Label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(selectedOrden.fechaEjecucion)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Acciones del panel */}
          <div className="p-4 border-t bg-gray-50 flex-shrink-0">
            <Label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Acciones</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleVistaPrevia(selectedOrden)} title="Vista previa">
                <Eye className="w-4 h-4 mr-1" />
                Ver
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDescargarPdf(selectedOrden)} title="Descargar PDF">
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleImprimirOrden(selectedOrden)} title="Imprimir">
                <Printer className="w-4 h-4 mr-1" />
                Imprimir
              </Button>
            </div>
            {(selectedOrden.estado === 'Pendiente' || selectedOrden.estado === 'EnProceso') && (
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelarOrden(selectedOrden)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowResultadosModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nueva Orden */}
      <Dialog open={showNuevaOrdenModal} onOpenChange={setShowNuevaOrdenModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Nueva Orden Médica
            </DialogTitle>
            <DialogDescription>
              Cree una nueva orden de examen, procedimiento o interconsulta
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="individual" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="individual" className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Orden Individual
              </TabsTrigger>
              <TabsTrigger value="paquetes" className="flex-1">
                <Package className="w-4 h-4 mr-2" />
                Paquetes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4 mt-4">
              {/* Búsqueda de paciente */}
              <div>
                <Label>Paciente *</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchPaciente}
                    onChange={(e) => {
                      setSearchPaciente(e.target.value);
                      if (!e.target.value) setNuevaOrden(prev => ({ ...prev, paciente_id: '' }));
                    }}
                    placeholder="Buscar paciente por nombre o cédula..."
                    className="pl-10"
                  />
                </div>
                {searchPaciente && pacientesFiltrados.length > 0 && !nuevaOrden.paciente_id && (
                  <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto shadow-lg bg-white">
                    {pacientesFiltrados.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setNuevaOrden(prev => ({ ...prev, paciente_id: p.id }));
                          setSearchPaciente(`${p.nombre} ${p.apellido}`);
                        }}
                      >
                        <p className="font-medium">{p.nombre} {p.apellido}</p>
                        <p className="text-xs text-gray-500">{p.tipoDocumento || 'CC'} {p.cedula}</p>
                      </div>
                    ))}
                  </div>
                )}
                {nuevaOrden.paciente_id && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">Paciente seleccionado</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setNuevaOrden(prev => ({ ...prev, paciente_id: '' })); setSearchPaciente(''); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Orden *</Label>
                  <Select value={nuevaOrden.tipo} onValueChange={(v) => setNuevaOrden(prev => ({ ...prev, tipo: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laboratorio">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-blue-600" />
                          Examen/Procedimiento
                        </div>
                      </SelectItem>
                      <SelectItem value="Interconsulta">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-amber-600" />
                          Interconsulta
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    * Las prescripciones se crean desde el módulo de consulta
                  </p>
                </div>

                <div>
                  <Label>Prioridad</Label>
                  <Select value={nuevaOrden.prioridad} onValueChange={(v) => setNuevaOrden(prev => ({ ...prev, prioridad: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <Badge className={`${p.bgColor} ${p.textColor}`}>{p.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Examen / Procedimiento</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchExamen}
                    onChange={(e) => setSearchExamen(e.target.value)}
                    placeholder="Buscar examen o procedimiento..."
                    className="pl-10"
                  />
                </div>
                {searchExamen && examenesFiltrados.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto shadow-lg bg-white">
                    {examenesFiltrados.map((e) => (
                      <div
                        key={e.id}
                        className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setNuevaOrden(prev => ({ ...prev, examen_procedimiento_id: e.id, descripcion: e.nombre }));
                          setSearchExamen('');
                        }}
                      >
                        <p className="font-medium">{e.nombre}</p>
                        {e.codigo && <p className="text-xs text-gray-500">Código: {e.codigo}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Descripción</Label>
                <Input
                  value={nuevaOrden.descripcion}
                  onChange={(e) => setNuevaOrden(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción del examen o procedimiento"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Observaciones / Indicaciones</Label>
                <Textarea
                  value={nuevaOrden.observaciones}
                  onChange={(e) => setNuevaOrden(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Indicaciones especiales, preparación del paciente, etc."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="paquetes" className="mt-4">
              {!nuevaOrden.paciente_id && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">Seleccione un paciente primero</p>
                  </div>
                  <div className="mt-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={searchPaciente}
                        onChange={(e) => setSearchPaciente(e.target.value)}
                        placeholder="Buscar paciente..."
                        className="pl-10"
                      />
                    </div>
                    {searchPaciente && pacientesFiltrados.length > 0 && (
                      <div className="mt-2 border rounded-lg max-h-32 overflow-y-auto bg-white">
                        {pacientesFiltrados.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => {
                              setNuevaOrden(prev => ({ ...prev, paciente_id: p.id }));
                              setSearchPaciente(`${p.nombre} ${p.apellido}`);
                            }}
                          >
                            {p.nombre} {p.apellido} - {p.cedula}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {nuevaOrden.paciente_id && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">Paciente: {searchPaciente}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setNuevaOrden(prev => ({ ...prev, paciente_id: '' })); setSearchPaciente(''); }}>
                    Cambiar
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PAQUETES_PREDEFINIDOS.map((paquete) => {
                  const Icon = paquete.icon;
                  return (
                    <Card
                      key={paquete.id}
                      className={`hover:shadow-md transition-shadow cursor-pointer ${!nuevaOrden.paciente_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => nuevaOrden.paciente_id && handleCrearPaquete(paquete)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-${paquete.color}-100`}>
                            <Icon className={`w-5 h-5 text-${paquete.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{paquete.nombre}</h4>
                            <p className="text-xs text-gray-500 mb-2">{paquete.descripcion}</p>
                            <div className="flex flex-wrap gap-1">
                              {paquete.ordenes.slice(0, 3).map((o, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {o.descripcion.substring(0, 15)}...
                                </Badge>
                              ))}
                              {paquete.ordenes.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{paquete.ordenes.length - 3} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowNuevaOrdenModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearOrden} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Crear Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Registrar Resultados */}
      <Dialog open={showResultadosModal} onOpenChange={setShowResultadosModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Registrar Resultados
            </DialogTitle>
            <DialogDescription>
              Complete los resultados para finalizar esta orden médica
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Resultados *</Label>
              <Textarea
                value={resultados.resultados}
                onChange={(e) => setResultados(prev => ({ ...prev, resultados: e.target.value }))}
                placeholder="Ingrese los resultados del examen o procedimiento..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label>Observaciones adicionales</Label>
              <Textarea
                value={resultados.observaciones}
                onChange={(e) => setResultados(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Observaciones o comentarios adicionales..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowResultadosModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCompletarOrden} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Completar Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
