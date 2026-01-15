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
  Copy,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

// Tipos de órdenes con iconos y colores
const TIPOS_ORDEN = [
  { value: 'Laboratorio', label: 'Laboratorio', icon: FlaskConical, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  { value: 'Imagenologia', label: 'Imagenología', icon: ScanLine, color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  { value: 'Procedimiento', label: 'Procedimiento', icon: Stethoscope, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  { value: 'Interconsulta', label: 'Interconsulta', icon: Microscope, color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  { value: 'Dieta', label: 'Dieta', icon: Utensils, color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  { value: 'Otro', label: 'Otro', icon: FileText, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
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
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Rol del usuario para determinar si filtrar solo por doctor
  // Soportar múltiples formatos de rol: rol, role, nombre del rol
  const userRole = (user?.rol || user?.role || user?.rolNombre || '').toLowerCase();
  const isDoctor = ['doctor', 'medico', 'médico'].includes(userRole);
  const isAdmin = ['admin', 'administrador', 'super_admin', 'superadmin'].includes(userRole);
  const doctorUserId = user?.id;

  // Debug: Log user info en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('[OrdenesMedicasModule] User:', { id: user?.id, rol: user?.rol, role: user?.role, isDoctor, isAdmin });
  }

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterPrioridad, setFilterPrioridad] = useState('todas');
  const [filterFecha, setFilterFecha] = useState('');

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Modales
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showNuevaOrdenModal, setShowNuevaOrdenModal] = useState(false);
  const [showResultadosModal, setShowResultadosModal] = useState(false);

  // Datos auxiliares
  const [examenes, setExamenes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);

  // Formulario nueva orden - ahora incluye doctor_id del usuario logueado
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

  // Cargar órdenes - filtradas por doctor si el usuario es doctor
  const loadOrdenes = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Filtrado basado en rol del usuario
      // - Doctores: solo sus órdenes y las de sus pacientes
      // - Admins: pueden ver todo (no se aplica filtro)
      // - Otros roles: solo órdenes donde participan
      if (!isAdmin && doctorUserId) {
        params.append('doctor_id', doctorUserId);
        if (isDoctor) {
          params.append('mis_ordenes', 'true'); // Incluir órdenes de pacientes que ha atendido
        }
        // Debug
        if (process.env.NODE_ENV === 'development') {
          console.log('[OrdenesMedicasModule] Filtros aplicados:', { doctor_id: doctorUserId, mis_ordenes: isDoctor });
        }
      }

      if (filterEstado !== 'todas') params.append('estado', filterEstado);
      if (filterTipo !== 'todos') params.append('tipo', filterTipo);
      if (filterPrioridad !== 'todas') params.append('prioridad', filterPrioridad);
      if (filterFecha) params.append('fecha', filterFecha);
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
  }, [page, filterEstado, filterTipo, filterPrioridad, filterFecha, searchTerm, toast, isDoctor, isAdmin, doctorUserId]);

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

  // Estadísticas
  const stats = useMemo(() => {
    const pendientes = ordenes.filter(o => o.estado === 'Pendiente').length;
    const enProceso = ordenes.filter(o => o.estado === 'EnProceso').length;
    const completadas = ordenes.filter(o => o.estado === 'Completada').length;
    const urgentes = ordenes.filter(o => o.prioridad === 'Urgente' && o.estado !== 'Completada' && o.estado !== 'Cancelada').length;

    return { total: ordenes.length, pendientes, enProceso, completadas, urgentes };
  }, [ordenes]);

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
    return TIPOS_ORDEN.find(t => t.value === tipo) || TIPOS_ORDEN[5];
  };

  // Obtener info de estado
  const getEstadoInfo = (estado) => {
    return ESTADOS_ORDEN.find(e => e.value === estado) || ESTADOS_ORDEN[0];
  };

  // Obtener info de prioridad
  const getPrioridadInfo = (prioridad) => {
    return PRIORIDADES.find(p => p.value === prioridad) || PRIORIDADES[0];
  };

  // Crear nueva orden
  const handleCrearOrden = async () => {
    if (!nuevaOrden.paciente_id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe seleccionar un paciente.',
      });
      return;
    }

    if (!nuevaOrden.examen_procedimiento_id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe seleccionar el examen o procedimiento.',
      });
      return;
    }

    // Obtener precio del examen seleccionado
    const examenSeleccionado = examenes.find(e => e.id === nuevaOrden.examen_procedimiento_id);
    const precioAplicado = examenSeleccionado?.costoBase || examenSeleccionado?.precio || 0;

    setLoading(true);
    try {
      const ordenData = {
        ...nuevaOrden,
        doctor_id: doctorUserId, // Siempre usar el ID del doctor logueado
        precio_aplicado: precioAplicado,
      };

      const response = await apiPost('/ordenes-medicas', ordenData);

      if (response.success) {
        toast({
          title: 'Orden creada',
          description: 'La orden médica ha sido creada correctamente.',
        });
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear la orden.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear paquete de órdenes
  const handleCrearPaquete = async (paquete) => {
    if (!nuevaOrden.paciente_id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe seleccionar un paciente primero.',
      });
      return;
    }

    if (!doctorUserId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo identificar al médico. Intente cerrar sesión y volver a ingresar.',
      });
      return;
    }

    setLoading(true);
    try {
      let creadas = 0;
      for (const orden of paquete.ordenes) {
        // Buscar examen por descripción para obtener el ID y precio
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el paquete de órdenes.',
      });
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
        toast({
          title: 'Orden completada',
          description: 'La orden ha sido marcada como completada.',
        });
        setShowResultadosModal(false);
        setShowDetalleModal(false);
        setSelectedOrden(null);
        setResultados({ resultados: '', observaciones: '' });
        loadOrdenes(true);
      }
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo completar la orden.',
      });
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
        toast({
          title: 'Orden cancelada',
          description: 'La orden ha sido cancelada.',
        });
        loadOrdenes(true);
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cancelar la orden.',
      });
    }
  };

  // Duplicar orden
  const handleDuplicarOrden = async (orden) => {
    setNuevaOrden({
      paciente_id: orden.pacienteId,
      tipo: orden.tipo || 'Laboratorio',
      examen_procedimiento_id: orden.examenProcedimientoId || '',
      descripcion: orden.descripcion || orden.examenProcedimiento?.nombre || '',
      prioridad: orden.prioridad || 'Media',
      observaciones: '',
    });
    setSearchPaciente(`${orden.paciente?.nombre || ''} ${orden.paciente?.apellido || ''}`.trim());
    setShowNuevaOrdenModal(true);
  };

  // Descargar PDF de orden médica
  const handleDescargarPdf = async (orden) => {
    if (!orden?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo identificar la orden para descargar.',
      });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      toast({
        title: 'Generando PDF...',
        description: 'Por favor espere mientras se genera el documento.',
      });

      console.log('[PDF] Descargando orden:', orden.id);

      const response = await fetch(`${apiUrl}/ordenes-medicas/${orden.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = 'Error al generar el PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('[PDF] Error del servidor:', errorData);
        } catch (e) {
          console.error('[PDF] Error response:', response.status, response.statusText);
        }
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

      toast({
        title: 'PDF descargado',
        description: 'La orden médica se ha descargado correctamente.',
      });
    } catch (err) {
      console.error('[PDF] Error descargando:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudo descargar el PDF de la orden.',
      });
    }
  };

  // Imprimir orden (abre PDF en nueva pestaña para imprimir)
  const handleImprimirOrden = async (orden) => {
    if (!orden?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo identificar la orden para imprimir.',
      });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      console.log('[PDF] Imprimiendo orden:', orden.id);

      const response = await fetch(`${apiUrl}/ordenes-medicas/${orden.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let errorMessage = 'Error al generar el PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('[PDF] Error del servidor:', errorData);
        } catch (e) {
          console.error('[PDF] Error response:', response.status, response.statusText);
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Abrir en nueva pestaña para imprimir
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err) {
      console.error('[PDF] Error imprimiendo:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudo imprimir la orden.',
      });
    }
  };

  // Ver detalle
  const handleVerDetalle = (orden) => {
    setSelectedOrden(orden);
    setShowDetalleModal(true);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Órdenes Médicas</h1>
              <p className="text-blue-100 text-sm">Gestión de exámenes, procedimientos e interconsultas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => loadOrdenes(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              className="bg-white text-indigo-600 hover:bg-blue-50 shadow-md"
              onClick={() => setShowNuevaOrdenModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </Button>
          </div>
        </div>

        {/* Stats en el header */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-white/50" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-xs">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-300/50" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-200 text-xs">En Proceso</p>
                <p className="text-2xl font-bold">{stats.enProceso}</p>
              </div>
              <Activity className="w-8 h-8 text-cyan-300/50" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-xs">Completadas</p>
                <p className="text-2xl font-bold">{stats.completadas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-300/50" />
            </div>
          </div>

          <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 ${stats.urgentes > 0 ? 'ring-2 ring-red-400 animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-xs">Urgentes</p>
                <p className="text-2xl font-bold">{stats.urgentes}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-300/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por paciente, doctor, descripción..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Filtro Estado */}
            <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos los estados</SelectItem>
                {ESTADOS_ORDEN.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Tipo */}
            <Select value={filterTipo} onValueChange={(v) => { setFilterTipo(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPOS_ORDEN.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Prioridad */}
            <Select value={filterPrioridad} onValueChange={(v) => { setFilterPrioridad(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las prioridades</SelectItem>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Toggle Vista */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      {loading && !refreshing ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : ordenes.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes médicas</h3>
            <p className="text-gray-500 mb-4">Crea una nueva orden para comenzar</p>
            <Button onClick={() => setShowNuevaOrdenModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </Button>
          </div>
        </Card>
      ) : viewMode === 'table' ? (
        /* Vista de Tabla */
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Paciente</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Descripción</TableHead>
                  <TableHead className="font-semibold">Solicitante</TableHead>
                  <TableHead className="font-semibold">Prioridad</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes.map((orden) => {
                  const tipoInfo = getTipoInfo(orden.tipo);
                  const estadoInfo = getEstadoInfo(orden.estado);
                  const prioridadInfo = getPrioridadInfo(orden.prioridad);
                  const TipoIcon = tipoInfo.icon;

                  return (
                    <TableRow
                      key={orden.id}
                      className={`hover:bg-gray-50 cursor-pointer ${orden.prioridad === 'Urgente' && orden.estado !== 'Completada' && orden.estado !== 'Cancelada' ? 'bg-red-50' : ''}`}
                      onClick={() => handleVerDetalle(orden)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {orden.paciente?.nombre} {orden.paciente?.apellido}
                            </p>
                            <p className="text-xs text-gray-500">
                              {orden.paciente?.tipoDocumento || 'CC'} {orden.paciente?.cedula}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${tipoInfo.bgColor}`}>
                            <TipoIcon className={`w-4 h-4 ${tipoInfo.textColor}`} />
                          </div>
                          <span className="text-sm">{tipoInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-900 max-w-xs truncate">
                          {orden.examenProcedimiento?.nombre || orden.observaciones?.split('\n')[0] || 'N/A'}
                        </p>
                        {orden.examenProcedimiento && orden.observaciones && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {orden.observaciones}
                          </p>
                        )}
                        {!orden.examenProcedimiento && orden.observaciones?.includes('\n') && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {orden.observaciones.split('\n').slice(1).join('\n').trim()}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {orden.doctorId === doctorUserId ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Yo
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 text-xs">
                              Otro
                            </Badge>
                          )}
                          <span className="text-xs text-gray-600">
                            {orden.doctor?.nombre ? `Dr. ${orden.doctor.nombre}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${prioridadInfo.bgColor} ${prioridadInfo.textColor} ${prioridadInfo.pulse ? 'animate-pulse' : ''}`}>
                          {prioridadInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${estadoInfo.bgColor} ${estadoInfo.textColor}`}>
                          {estadoInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(orden.fechaOrden || orden.createdAt)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleVerDetalle(orden)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDescargarPdf(orden)}>
                              <Download className="w-4 h-4 mr-2" />
                              Descargar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleImprimirOrden(orden)}>
                              <Printer className="w-4 h-4 mr-2" />
                              Imprimir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicarOrden(orden)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(orden.estado === 'Pendiente' || orden.estado === 'EnProceso') && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOrden(orden);
                                    setShowResultadosModal(true);
                                  }}
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
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        /* Vista de Tarjetas */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ordenes.map((orden) => {
            const tipoInfo = getTipoInfo(orden.tipo);
            const estadoInfo = getEstadoInfo(orden.estado);
            const prioridadInfo = getPrioridadInfo(orden.prioridad);
            const TipoIcon = tipoInfo.icon;
            const EstadoIcon = estadoInfo.icon;

            return (
              <Card
                key={orden.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${orden.prioridad === 'Urgente' && orden.estado !== 'Completada' && orden.estado !== 'Cancelada' ? 'ring-2 ring-red-400' : ''}`}
                onClick={() => handleVerDetalle(orden)}
              >
                <CardContent className="p-4">
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tipoInfo.bgColor}`}>
                        <TipoIcon className={`w-5 h-5 ${tipoInfo.textColor}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{tipoInfo.label}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(orden.fechaOrden || orden.createdAt)}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDescargarPdf(orden); }}>
                          <Download className="w-4 h-4 mr-2" />
                          Descargar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleImprimirOrden(orden); }}>
                          <Printer className="w-4 h-4 mr-2" />
                          Imprimir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicarOrden(orden); }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Paciente */}
                  <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">
                        {orden.paciente?.nombre} {orden.paciente?.apellido}
                      </p>
                      <p className="text-xs text-gray-500">
                        {orden.paciente?.cedula}
                      </p>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-gray-900 font-medium mb-3 line-clamp-2">
                    {orden.examenProcedimiento?.nombre || orden.observaciones?.split('\n')[0] || 'Sin descripción'}
                  </p>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${prioridadInfo.bgColor} ${prioridadInfo.textColor} text-xs`}>
                      {prioridadInfo.label}
                    </Badge>
                    <Badge className={`${estadoInfo.bgColor} ${estadoInfo.textColor} text-xs`}>
                      <EstadoIcon className="w-3 h-3 mr-1" />
                      {estadoInfo.label}
                    </Badge>
                    {orden.doctorId === doctorUserId ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        Mi orden
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 text-xs" title={orden.doctor?.nombre ? `Dr. ${orden.doctor.nombre} ${orden.doctor.apellido || ''}` : 'Otro doctor'}>
                        Otro Dr.
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
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
              <TabsTrigger value="individual" className="flex-1">Orden Individual</TabsTrigger>
              <TabsTrigger value="paquetes" className="flex-1">Paquetes Predefinidos</TabsTrigger>
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
                      if (!e.target.value) {
                        setNuevaOrden(prev => ({ ...prev, paciente_id: '' }));
                      }
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNuevaOrden(prev => ({ ...prev, paciente_id: '' }));
                        setSearchPaciente('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                  <Label>Tipo de Orden *</Label>
                  <Select
                    value={nuevaOrden.tipo}
                    onValueChange={(v) => setNuevaOrden(prev => ({ ...prev, tipo: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_ORDEN.map((t) => {
                        const Icon = t.icon;
                        return (
                          <SelectItem key={t.value} value={t.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${t.textColor}`} />
                              {t.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Prioridad */}
                <div>
                  <Label>Prioridad</Label>
                  <Select
                    value={nuevaOrden.prioridad}
                    onValueChange={(v) => setNuevaOrden(prev => ({ ...prev, prioridad: v }))}
                  >
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

              {/* Búsqueda de examen */}
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
                          setNuevaOrden(prev => ({
                            ...prev,
                            examen_procedimiento_id: e.id,
                            descripcion: e.nombre,
                          }));
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

              {/* Descripción */}
              <div>
                <Label>Descripción *</Label>
                <Input
                  value={nuevaOrden.descripcion}
                  onChange={(e) => setNuevaOrden(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción del examen o procedimiento"
                  className="mt-1"
                />
              </div>

              {/* Observaciones */}
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
              {/* Selector de paciente para paquetes */}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNuevaOrden(prev => ({ ...prev, paciente_id: '' }));
                      setSearchPaciente('');
                    }}
                  >
                    Cambiar
                  </Button>
                </div>
              )}

              {/* Lista de paquetes */}
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
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Crear Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle */}
      <Dialog open={showDetalleModal} onOpenChange={setShowDetalleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Detalle de Orden Médica
            </DialogTitle>
          </DialogHeader>

          {selectedOrden && (
            <div className="space-y-6">
              {/* Encabezado con estado */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {(() => {
                    const tipoInfo = getTipoInfo(selectedOrden.tipo);
                    const TipoIcon = tipoInfo.icon;
                    return (
                      <div className={`p-3 rounded-lg ${tipoInfo.bgColor}`}>
                        <TipoIcon className={`w-6 h-6 ${tipoInfo.textColor}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-semibold text-lg">{getTipoInfo(selectedOrden.tipo).label}</p>
                    <p className="text-sm text-gray-500">
                      ID: {selectedOrden.id?.substring(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getPrioridadInfo(selectedOrden.prioridad).bgColor} ${getPrioridadInfo(selectedOrden.prioridad).textColor}`}>
                    {selectedOrden.prioridad}
                  </Badge>
                  <Badge className={`${getEstadoInfo(selectedOrden.estado).bgColor} ${getEstadoInfo(selectedOrden.estado).textColor}`}>
                    {getEstadoInfo(selectedOrden.estado).label}
                  </Badge>
                </div>
              </div>

              {/* Información del paciente */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <Label className="text-xs text-gray-500">Paciente</Label>
                  <p className="font-semibold">
                    {selectedOrden.paciente?.nombre} {selectedOrden.paciente?.apellido}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedOrden.paciente?.tipoDocumento || 'CC'} {selectedOrden.paciente?.cedula}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Label className="text-xs text-gray-500">Doctor Solicitante</Label>
                  <p className="font-semibold">
                    {selectedOrden.doctor?.nombre} {selectedOrden.doctor?.apellido}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedOrden.doctor?.especialidad || 'Médico'}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div className="p-4 border rounded-lg">
                <Label className="text-xs text-gray-500">Examen / Procedimiento</Label>
                <p className="font-semibold text-lg">
                  {selectedOrden.examenProcedimiento?.nombre || selectedOrden.observaciones?.split('\n')[0] || 'N/A'}
                </p>
                {selectedOrden.examenProcedimiento?.codigo && (
                  <p className="text-sm text-gray-500">
                    Código: {selectedOrden.examenProcedimiento.codigo}
                  </p>
                )}
              </div>

              {/* Observaciones */}
              {selectedOrden.observaciones && (
                <div className="p-4 border rounded-lg">
                  <Label className="text-xs text-gray-500">Observaciones</Label>
                  <p className="text-gray-700">{selectedOrden.observaciones}</p>
                </div>
              )}

              {/* Resultados (si está completada) */}
              {selectedOrden.estado === 'Completada' && selectedOrden.resultados && (
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <Label className="text-xs text-green-600">Resultados</Label>
                  <p className="text-gray-700">
                    {typeof selectedOrden.resultados === 'object'
                      ? JSON.stringify(selectedOrden.resultados, null, 2)
                      : selectedOrden.resultados
                    }
                  </p>
                </div>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">Fecha de Orden</Label>
                  <p>{formatDate(selectedOrden.fechaOrden || selectedOrden.createdAt)}</p>
                </div>
                {selectedOrden.fechaEjecucion && (
                  <div>
                    <Label className="text-xs text-gray-500">Fecha de Ejecución</Label>
                    <p>{formatDate(selectedOrden.fechaEjecucion)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDetalleModal(false)}>
              Cerrar
            </Button>
            <Button variant="outline" onClick={() => handleDescargarPdf(selectedOrden)}>
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button variant="outline" onClick={() => handleImprimirOrden(selectedOrden)}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            {selectedOrden && (selectedOrden.estado === 'Pendiente' || selectedOrden.estado === 'EnProceso') && (
              <Button onClick={() => setShowResultadosModal(true)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Completar Orden
              </Button>
            )}
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
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Completar Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
