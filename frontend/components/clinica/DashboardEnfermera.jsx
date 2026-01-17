'use client';

import { useState, useEffect } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import {
  Activity, Clock, User, AlertTriangle, CheckCircle,
  Pill, ClipboardList, Calendar, TrendingUp, Users,
  Eye, CheckCheck, XCircle, AlertCircle, Thermometer,
  Plus, Save, X, Edit, Trash2, Heart, Droplet, BedDouble,
  Syringe, FileText, Bell, RefreshCw, ChevronRight, Stethoscope,
  HeartPulse, Timer, Bed, Phone, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import PanelPacienteEnfermeria from './enfermeria/PanelPacienteEnfermeria';

export default function DashboardEnfermera({ user }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pacientes');
  const [showAdministrarModal, setShowAdministrarModal] = useState(false);
  const [showSignosModal, setShowSignosModal] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [selectedMedicamento, setSelectedMedicamento] = useState(null);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState(null);
  
  // Datos reales del backend
  const [asignaciones, setAsignaciones] = useState([]);
  const [pacientesAsignados, setPacientesAsignados] = useState([]);
  const [medicamentosProgramados, setMedicamentosProgramados] = useState([]);
  const [notasEnfermeria, setNotasEnfermeria] = useState([]);
  const [turnoActual, setTurnoActual] = useState('Tarde');
  const [signosVitalesPendientes, setSignosVitalesPendientes] = useState([]);
  const [tareasDelTurno, setTareasDelTurno] = useState([]);
  const [alertasActivas, setAlertasActivas] = useState([]);
  
  // Form states
  const [formSignos, setFormSignos] = useState({
    temperatura: '',
    presionArterial: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    saturacionO2: '',
    peso: '',
    talla: '',
    escalaDolor: 0,
    observaciones: ''
  });

  const [formNota, setFormNota] = useState({
    tipo_nota: 'Evolucion',
    titulo: '',
    contenido: '',
    requiere_seguimiento: false,
  });

  const [formAdministracion, setFormAdministracion] = useState({
    dosis_administrada: '',
    via_administrada: '',
    observaciones: '',
    reaccion_adversa: false,
    descripcion_reaccion: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      // Recargar cada minuto
      const interval = setInterval(loadDashboardData, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Determinar turno actual
      const hora = new Date().getHours();
      let turno = 'Tarde';
      if (hora >= 6 && hora < 14) turno = 'Manana';
      else if (hora >= 14 && hora < 22) turno = 'Tarde';
      else turno = 'Noche';
      setTurnoActual(turno);

      // Cargar pacientes asignados
      const pacientesRes = await fetch(`${apiUrl}/asignaciones-enfermeria/pacientes/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let pacientesIds = [];
      let pacientesData = [];

      if (pacientesRes.ok) {
        const data = await pacientesRes.json();
        const rawAdmissions = data.data?.pacientes || [];
        
        pacientesData = rawAdmissions.map(adm => ({
          id: adm.id, // Using admisionId as the main key for the list
          pacienteId: adm.paciente?.id,
          admisionId: adm.id,
          nombre: `${adm.paciente?.nombre || ''} ${adm.paciente?.apellido || ''}`,
          habitacion: adm.cama?.habitacion?.numero || 'N/A',
          diagnostico: adm.diagnosticosHCE?.[0]?.descripcionCIE11 || 'Sin diagnóstico',
          signosVitalesUltimo: 'Pendiente' // Placeholder, could be fetched
        }));

        setPacientesAsignados(pacientesData);
        pacientesIds = pacientesData.map(p => p.pacienteId);
      }

      if (pacientesIds.length > 0) {
        // 1. Cargar medicamentos (filtrar por pacientes asignados client-side)
        const hoy = getTodayColombia();
        const medicamentosRes = await fetch(`${apiUrl}/administraciones?fecha=${hoy}&estado=Programada&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (medicamentosRes.ok) {
          const medData = await medicamentosRes.json();
          const allMeds = medData.data || [];
          // Filtrar solo de mis pacientes
          setMedicamentosProgramados(allMeds.filter(m => pacientesIds.includes(m.pacienteId)));
        }

        // 2. Cargar Órdenes Médicas Pendientes (Tareas)
        const ordenesRes = await fetch(`${apiUrl}/ordenes-medicas?estado=Pendiente&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (ordenesRes.ok) {
          const ordenesData = await ordenesRes.json();
          const allOrdenes = ordenesData.data || [];
          
          // Filtrar órdenes de mis pacientes y mapear a formato de Tareas
          const misOrdenes = allOrdenes
            .filter(o => pacientesIds.includes(o.pacienteId))
            .map(o => ({
              id: o.id,
              tipo: o.tipoOrden || 'Orden Médica',
              prioridad: o.prioridad || 'Media',
              paciente: `${o.paciente.nombre} ${o.paciente.apellido}`,
              pacienteId: o.pacienteId,
              habitacion: 'N/A', // TODO: Obtener habitación
              descripcion: o.descripcion,
              horaProgramada: new Date(o.createdAt).toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit',
      timeZone: 'America/Bogota'
    }),
              estado: 'Pendiente',
              origen: 'OrdenMedica'
            }));
            
          setTareasDelTurno(misOrdenes);
        }

        // 3. Cargar Alertas Activas
        const alertasRes = await fetch(`${apiUrl}/alertas?activa=true&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (alertasRes.ok) {
          const alertasData = await alertasRes.json();
          const allAlertas = alertasData.data || []; // paginated returns data inside
          // Si paginated retorna { data: [], pagination: {} }, ajustar según respuesta real. 
          // AlertaService.getAll retorna { alertas: [], pagination: {} }. 
          // El controller hace c.json(paginated(result.alertas...)). 
          // Utils response paginated suele retornar { status: 'success', data: [...], pagination: ... }
          
          const alertasArray = Array.isArray(alertasData.data) ? alertasData.data : (alertasData.alertas || []);
          
          setAlertasActivas(alertasArray.filter(a => pacientesIds.includes(a.pacienteId)));
        }
      }

      // Cargar notas del turno actual
      const notasRes = await fetch(`${apiUrl}/notas-enfermeria/enfermera/${user.id}?turno=${turno}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (notasRes.ok) {
        const notasData = await notasRes.json();
        setNotasEnfermeria(notasData.data?.notas || []);
      }

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast({ description: 'Error al cargar información', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Estadísticas calculadas
  const stats = {
    pacientesAsignados: pacientesAsignados.length,
    medicamentosPendientes: medicamentosProgramados.filter(m => m.estado === 'Programada' || m.estado === 'Pendiente').length,
    signosVitalesPendientes: pacientesAsignados.length, // Simplificado: uno por paciente
    tareasDelTurno: tareasDelTurno.length,
    alertasActivas: alertasActivas.length,
  };

  // Funciones de acción
  const handleAdministrarMedicamento = async () => {
    if (!selectedMedicamento) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/administraciones/${selectedMedicamento.id}/administrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dosis_administrada: formAdministracion.dosis_administrada,
          via_administrada: formAdministracion.via_administrada,
          observaciones: formAdministracion.observaciones,
          reaccion_adversa: formAdministracion.reaccion_adversa,
          descripcion_reaccion: formAdministracion.descripcion_reaccion,
        }),
      });

      if (response.ok) {
        toast({ description: 'Medicamento administrado correctamente' });
        loadDashboardData();
        setShowAdministrarModal(false);
        setSelectedMedicamento(null);
        setFormAdministracion({
          dosis_administrada: '',
          via_administrada: '',
          observaciones: '',
          reaccion_adversa: false,
          descripcion_reaccion: '',
        });
      } else {
        const error = await response.json();
        toast({ description: error.message || 'Error al administrar medicamento', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ description: 'Error al administrar medicamento', variant: 'destructive' });
    }
  };

  const handleOmitirMedicamento = async (medId, motivo) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/administraciones/${medId}/omitir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ motivo: motivo || 'Omitido por enfermería' }),
      });

      if (response.ok) {
        toast({ description: 'Medicamento omitido' });
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRegistrarSignos = async () => {
    if (!selectedPaciente) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      let sistolica = null;
      let diastolica = null;

      if (formSignos.presionArterial && formSignos.presionArterial.includes('/')) {
        const partes = formSignos.presionArterial.split('/');
        sistolica = parseInt(partes[0]);
        diastolica = parseInt(partes[1]);
      }

      const response = await fetch(`${apiUrl}/signos-vitales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paciente_id: selectedPaciente.pacienteId || selectedPaciente.id, // Handle different object structures
          admision_id: selectedPaciente.admisionId || selectedPaciente.id, // Fallback if admisionId not present
          registrado_por: user.id,
          temperatura: formSignos.temperatura ? parseFloat(formSignos.temperatura) : null,
          presion_sistolica: sistolica,
          presion_diastolica: diastolica,
          frecuencia_cardiaca: formSignos.frecuenciaCardiaca ? parseInt(formSignos.frecuenciaCardiaca) : null,
          frecuencia_respiratoria: formSignos.frecuenciaRespiratoria ? parseInt(formSignos.frecuenciaRespiratoria) : null,
          saturacion_oxigeno: formSignos.saturacionO2 ? parseFloat(formSignos.saturacionO2) : null,
          peso: formSignos.peso ? parseFloat(formSignos.peso) : null,
          talla: formSignos.talla ? parseFloat(formSignos.talla) : null,
          escala_dolor: formSignos.escalaDolor ? parseInt(formSignos.escalaDolor) : null,
          observaciones: formSignos.observaciones,
        }),
      });

      if (response.ok) {
        toast({ description: 'Signos vitales registrados correctamente' });
        setShowSignosModal(false);
        setSelectedPaciente(null);
        setFormSignos({
          temperatura: '',
          presionArterial: '',
          frecuenciaCardiaca: '',
          frecuenciaRespiratoria: '',
          saturacionO2: '',
          peso: '',
          talla: '',
          escalaDolor: 0,
          observaciones: ''
        });
      } else {
        const error = await response.json();
        toast({ description: error.message || 'Error al registrar signos vitales', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ description: 'Error al registrar signos vitales', variant: 'destructive' });
    }
  };

  const handleAgregarNota = async () => {
    if (!selectedPaciente || !formNota.contenido) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/notas-enfermeria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          admision_id: selectedPaciente.id,
          paciente_id: selectedPaciente.pacienteId,
          enfermera_id: user.id,
          tipo_nota: formNota.tipo_nota,
          titulo: formNota.titulo,
          contenido: formNota.contenido,
          turno: turnoActual,
          requiere_seguimiento: formNota.requiere_seguimiento,
        }),
      });

      if (response.ok) {
        toast({ description: 'Nota registrada correctamente' });
        loadDashboardData();
        setShowNotaModal(false);
        setSelectedPaciente(null);
        setFormNota({
          tipo_nota: 'Evolucion',
          titulo: '',
          contenido: '',
          requiere_seguimiento: false,
        });
      } else {
        const error = await response.json();
        toast({ description: error.message || 'Error al registrar nota', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ description: 'Error al registrar nota', variant: 'destructive' });
    }
  };

  const handleCompletarTarea = (tareaId) => {
    // Por implementar
  };

  const getComplejidadColor = (complejidad) => {
    const colores = {
      'Alta': 'bg-red-100 text-red-700 border-red-300',
      'Media': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Baja': 'bg-green-100 text-green-700 border-green-300',
    };
    return colores[complejidad] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getEstadoMedicamentoColor = (estado) => {
    const colores = {
      'Atrasado': 'bg-red-100 text-red-700 border-red-300',
      'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Administrado': 'bg-green-100 text-green-700 border-green-300',
      'Omitido': 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colores[estado] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getPrioridadColor = (prioridad) => {
    const colores = {
      'Alta': 'bg-red-100 text-red-700 border-red-300',
      'Media': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Baja': 'bg-blue-100 text-blue-700 border-blue-300',
    };
    return colores[prioridad] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (selectedPatientForDetail) {
    return (
      <div className="p-6 bg-gradient-to-br from-green-50 via-white to-teal-50 min-h-screen">
        <PanelPacienteEnfermeria 
            paciente={selectedPatientForDetail} 
            onBack={() => setSelectedPatientForDetail(null)} 
            user={user}
        />
      </div>
    );
  }

  // Helper para obtener el turno del día
  const getTurnoInfo = () => {
    const hora = new Date().getHours();
    if (hora >= 6 && hora < 14) return { nombre: 'Mañana', horario: '06:00 - 14:00', color: 'bg-amber-100 text-amber-700 border-amber-300' };
    if (hora >= 14 && hora < 22) return { nombre: 'Tarde', horario: '14:00 - 22:00', color: 'bg-orange-100 text-orange-700 border-orange-300' };
    return { nombre: 'Noche', horario: '22:00 - 06:00', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' };
  };

  const turnoInfo = getTurnoInfo();

  // Calcular progreso de medicamentos del turno
  const medicamentosTotal = medicamentosProgramados.length;
  const medicamentosAdministrados = medicamentosProgramados.filter(m => m.estado === 'Administrado').length;
  const progresoMedicamentos = medicamentosTotal > 0 ? (medicamentosAdministrados / medicamentosTotal) * 100 : 0;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-emerald-50 via-white to-teal-50 min-h-screen">
      {/* Header Mejorado */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg">
              <HeartPulse className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Panel de Enfermería
              </h1>
              <p className="text-gray-600">
                Bienvenida, <span className="font-semibold text-emerald-700">{user?.nombre} {user?.apellido}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`${turnoInfo.color} px-4 py-2 text-sm font-medium`}>
              <Timer className="w-4 h-4 mr-2" />
              Turno {turnoInfo.nombre} ({turnoInfo.horario})
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 px-4 py-2 text-sm font-medium">
              <Clock className="w-4 h-4 mr-2" />
              {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' ,
      timeZone: 'America/Bogota'
    })}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              className="border-emerald-200 hover:bg-emerald-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Progreso del Turno */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progreso de Medicamentos del Turno</span>
            <span className="text-sm font-semibold text-emerald-700">{medicamentosAdministrados}/{medicamentosTotal}</span>
          </div>
          <Progress value={progresoMedicamentos} className="h-2" />
        </div>
      </div>

      {/* Alertas Urgentes (si hay) */}
      {alertasActivas.length > 0 && (
        <Card className="border-l-4 border-red-500 bg-red-50 shadow-lg animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">
                  {alertasActivas.length} {alertasActivas.length === 1 ? 'Alerta Activa' : 'Alertas Activas'}
                </p>
                <p className="text-sm text-red-600">Requieren atención inmediata</p>
              </div>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                Ver Alertas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Mejorados */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Mis Pacientes</p>
                <p className="text-4xl font-bold mt-1">{stats.pacientesAsignados}</p>
                <p className="text-emerald-200 text-xs mt-1">Asignados hoy</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Bed className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Medicamentos</p>
                <p className="text-4xl font-bold mt-1">{stats.medicamentosPendientes}</p>
                <p className="text-amber-200 text-xs mt-1">Pendientes</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Pill className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Signos Vitales</p>
                <p className="text-4xl font-bold mt-1">{stats.signosVitalesPendientes}</p>
                <p className="text-blue-200 text-xs mt-1">Por registrar</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <HeartPulse className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">Tareas</p>
                <p className="text-4xl font-bold mt-1">{stats.tareasDelTurno}</p>
                <p className="text-violet-200 text-xs mt-1">Del turno</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <ClipboardList className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${stats.alertasActivas > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'} text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${stats.alertasActivas > 0 ? 'text-red-100' : 'text-gray-200'} text-sm font-medium`}>Alertas</p>
                <p className="text-4xl font-bold mt-1">{stats.alertasActivas}</p>
                <p className={`${stats.alertasActivas > 0 ? 'text-red-200' : 'text-gray-300'} text-xs mt-1`}>
                  {stats.alertasActivas > 0 ? 'Activas' : 'Sin alertas'}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 bg-white shadow-lg rounded-xl p-1 h-auto">
          <TabsTrigger
            value="pacientes"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg py-3 transition-all"
          >
            <Bed className="w-4 h-4 mr-2" />
            Mis Pacientes
          </TabsTrigger>
          <TabsTrigger
            value="pendientes"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white rounded-lg py-3 transition-all"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Urgentes
          </TabsTrigger>
          <TabsTrigger
            value="medicamentos"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg py-3 transition-all"
          >
            <Pill className="w-4 h-4 mr-2" />
            Medicamentos
          </TabsTrigger>
          <TabsTrigger
            value="signos"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg py-3 transition-all"
          >
            <HeartPulse className="w-4 h-4 mr-2" />
            Signos Vitales
          </TabsTrigger>
          <TabsTrigger
            value="notas"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg py-3 transition-all"
          >
            <FileText className="w-4 h-4 mr-2" />
            Notas
          </TabsTrigger>
          <TabsTrigger
            value="tareas"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-lg py-3 transition-all"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Tareas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Mis Pacientes */}
        <TabsContent value="pacientes" className="space-y-4 mt-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <Bed className="w-5 h-5" />
                  Pacientes Asignados ({pacientesAsignados.length})
                </CardTitle>
              </div>
              <CardDescription>Lista de pacientes bajo tu cuidado en este turno</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {pacientesAsignados.length === 0 ? (
                <div className="text-center py-12">
                  <Bed className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No tienes pacientes asignados</p>
                  <p className="text-gray-400 text-sm">Los pacientes aparecerán aquí cuando sean asignados a tu turno</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pacientesAsignados.map((paciente) => (
                    <Card
                      key={paciente.id}
                      className="border-2 hover:border-emerald-300 transition-all hover:shadow-lg cursor-pointer group"
                      onClick={() => setSelectedPatientForDetail(paciente)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                            <AvatarFallback className="bg-transparent text-white font-bold">
                              {paciente.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                              {paciente.nombre}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>Hab. {paciente.habitacion}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {paciente.diagnostico}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                        </div>

                        {/* Acciones Rápidas */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPaciente(paciente);
                              setShowSignosModal(true);
                            }}
                          >
                            <HeartPulse className="w-3 h-3 mr-1" />
                            Signos
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPaciente(paciente);
                              setShowNotaModal(true);
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Nota
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientForDetail(paciente);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pendientes / Urgentes */}
        <TabsContent value="pendientes" className="space-y-4 mt-6">
          {/* Medicamentos atrasados */}
          {medicamentosProgramados.filter(m => m.estado === 'Atrasado').length > 0 && (
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-500 to-rose-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  Medicamentos Atrasados - Acción Inmediata Requerida
                </CardTitle>
                <CardDescription className="text-red-100">
                  {medicamentosProgramados.filter(m => m.estado === 'Atrasado').length} medicamentos requieren atención urgente
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-red-50">
                <div className="space-y-3">
                  {medicamentosProgramados.filter(m => m.estado === 'Atrasado').map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-red-200 shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-red-100 text-red-700 border-red-300">
                            {med.prioridad}
                          </Badge>
                          <span className="font-semibold text-gray-900">{med.paciente}</span>
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {med.habitacion}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Pill className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-gray-700">{med.medicamento}</span>
                          <span className="text-sm text-gray-500">- {med.dosis} - {med.via}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            setSelectedMedicamento(med);
                            setShowAdministrarModal(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Administrar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300"
                          onClick={() => handleOmitirMedicamento(med.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Omitir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tareas urgentes */}
          {tareasDelTurno.filter(t => t.prioridad === 'Alta').length > 0 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Clock className="w-5 h-5" />
                  Tareas de Alta Prioridad
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {tareasDelTurno.filter(t => t.prioridad === 'Alta').map((tarea) => (
                    <div key={tarea.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Badge className="bg-amber-100 text-amber-700 border-amber-300">{tarea.tipo}</Badge>
                          <span className="text-sm text-gray-600">{tarea.horaProgramada}</span>
                        </div>
                        <p className="font-medium text-gray-900">{tarea.paciente}</p>
                        <p className="text-sm text-gray-600">{tarea.descripcion}</p>
                      </div>
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signos vitales pendientes */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <HeartPulse className="w-5 h-5" />
                Signos Vitales Pendientes
              </CardTitle>
              <CardDescription>Pacientes que requieren toma de signos vitales</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {pacientesAsignados.length === 0 ? (
                <div className="text-center py-8">
                  <HeartPulse className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No hay signos vitales pendientes</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pacientesAsignados.map((paciente) => (
                    <div key={paciente.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 bg-blue-500">
                          <AvatarFallback className="text-white text-sm">
                            {paciente.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{paciente.nombre}</p>
                          <p className="text-sm text-gray-500">Hab. {paciente.habitacion}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setSelectedPaciente(paciente);
                          setShowSignosModal(true);
                        }}
                      >
                        <HeartPulse className="w-4 h-4 mr-1" />
                        Registrar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estado vacío */}
          {medicamentosProgramados.filter(m => m.estado === 'Atrasado').length === 0 &&
           tareasDelTurno.filter(t => t.prioridad === 'Alta').length === 0 &&
           pacientesAsignados.length === 0 && (
            <Card className="border-2 border-dashed border-emerald-200">
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Todo al día</h3>
                <p className="text-gray-500 mt-1">No hay tareas urgentes pendientes en este momento</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Medicamentos */}
        <TabsContent value="medicamentos" className="space-y-4 mt-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Pill className="w-5 h-5" />
                    Administración de Medicamentos
                  </CardTitle>
                  <CardDescription>Control de medicamentos programados para el turno</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-amber-100 text-amber-700">
                    Pendientes: {medicamentosProgramados.filter(m => m.estado === 'Pendiente' || m.estado === 'Programada').length}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    Administrados: {medicamentosProgramados.filter(m => m.estado === 'Administrado').length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {medicamentosProgramados.length === 0 ? (
                <div className="py-12 text-center">
                  <Pill className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No hay medicamentos programados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Hora</TableHead>
                      <TableHead className="font-semibold">Paciente</TableHead>
                      <TableHead className="font-semibold">Medicamento</TableHead>
                      <TableHead className="font-semibold">Dosis</TableHead>
                      <TableHead className="font-semibold">Vía</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicamentosProgramados.map((med) => (
                      <TableRow
                        key={med.id}
                        className={`transition-colors ${
                          med.estado === 'Atrasado' ? 'bg-red-50 hover:bg-red-100' :
                          med.estado === 'Administrado' ? 'bg-emerald-50/50 hover:bg-emerald-50' :
                          'hover:bg-gray-50'
                        }`}
                      >
                        <TableCell className="font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {med.horaProgramada}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 bg-gray-200">
                              <AvatarFallback className="text-xs">
                                {med.paciente?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{med.paciente}</p>
                              <p className="text-xs text-gray-500">Hab. {med.habitacion}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Pill className="w-4 h-4 text-amber-500" />
                            <span className="font-medium">{med.medicamento}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{med.dosis}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {med.via}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              med.estado === 'Atrasado' ? 'bg-red-100 text-red-700 border-red-300' :
                              med.estado === 'Administrado' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                              med.estado === 'Omitido' ? 'bg-gray-100 text-gray-600 border-gray-300' :
                              'bg-amber-100 text-amber-700 border-amber-300'
                            }
                          >
                            {med.estado === 'Atrasado' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {med.estado === 'Administrado' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {med.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {med.estado !== 'Administrado' && med.estado !== 'Omitido' && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => {
                                  setSelectedMedicamento(med);
                                  setShowAdministrarModal(true);
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Administrar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-gray-100"
                                onClick={() => handleOmitirMedicamento(med.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {med.estado === 'Administrado' && (
                            <span className="text-emerald-600 text-sm flex items-center justify-end gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Completado
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Signos Vitales */}
        <TabsContent value="signos" className="space-y-4 mt-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <HeartPulse className="w-5 h-5" />
                    Control de Signos Vitales
                  </CardTitle>
                  <CardDescription>Monitoreo y registro de signos vitales de pacientes</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    if (pacientesAsignados.length > 0) {
                      setSelectedPaciente(pacientesAsignados[0]);
                      setShowSignosModal(true);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  disabled={pacientesAsignados.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {pacientesAsignados.length === 0 ? (
                <div className="text-center py-12">
                  <HeartPulse className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No tienes pacientes asignados</p>
                  <p className="text-gray-400 text-sm">Los pacientes aparecerán aquí cuando sean asignados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pacientesAsignados.map((paciente) => (
                    <Card key={paciente.id} className="border-2 hover:border-blue-300 transition-all hover:shadow-lg group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-400 to-cyan-500">
                              <AvatarFallback className="text-white font-bold">
                                {paciente.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900">{paciente.nombre}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="w-3 h-3" />
                                <span>Hab. {paciente.habitacion}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Indicador de último registro */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Último registro:</span>
                            <Badge variant="outline" className="text-xs">
                              {paciente.signosVitalesUltimo || 'Sin datos'}
                            </Badge>
                          </div>
                        </div>

                        {/* Indicadores rápidos de signos */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center p-2 bg-red-50 rounded-lg">
                            <Heart className="w-4 h-4 mx-auto text-red-500 mb-1" />
                            <p className="text-xs text-gray-500">FC</p>
                            <p className="text-sm font-semibold text-gray-700">--</p>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <Activity className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                            <p className="text-xs text-gray-500">PA</p>
                            <p className="text-sm font-semibold text-gray-700">--/--</p>
                          </div>
                          <div className="text-center p-2 bg-orange-50 rounded-lg">
                            <Thermometer className="w-4 h-4 mx-auto text-orange-500 mb-1" />
                            <p className="text-xs text-gray-500">Temp</p>
                            <p className="text-sm font-semibold text-gray-700">--°C</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                            onClick={() => {
                              setSelectedPaciente(paciente);
                              setShowSignosModal(true);
                            }}
                          >
                            <HeartPulse className="w-4 h-4 mr-2" />
                            Registrar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => setSelectedPatientForDetail(paciente)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Historial
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notas */}
        <TabsContent value="notas" className="space-y-4 mt-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-violet-800">
                    <FileText className="w-5 h-5" />
                    Notas de Enfermería
                  </CardTitle>
                  <CardDescription>Registro de notas y evoluciones del turno</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    if (pacientesAsignados.length > 0) {
                      setSelectedPaciente(pacientesAsignados[0]);
                      setShowNotaModal(true);
                    }
                  }}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  disabled={pacientesAsignados.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Nota
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {notasEnfermeria.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No hay notas registradas en este turno</p>
                  <p className="text-gray-400 text-sm mt-1">Las notas que registres aparecerán aquí</p>
                  {pacientesAsignados.length > 0 && (
                    <Button
                      className="mt-4 bg-violet-600 hover:bg-violet-700"
                      onClick={() => {
                        setSelectedPaciente(pacientesAsignados[0]);
                        setShowNotaModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Nota
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {notasEnfermeria.map((nota) => (
                    <Card key={nota.id} className="border-l-4 border-violet-400 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-violet-100">
                              <AvatarFallback className="text-violet-700 font-medium text-sm">
                                {nota.paciente?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'N/A'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-gray-900">{nota.paciente || 'Paciente'}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="w-3 h-3" />
                                {new Date(nota.fecha || nota.fechaHora).toLocaleString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                ,
      timeZone: 'America/Bogota'
    })}
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={
                              nota.tipo === 'Incidente' || nota.tipoNota === 'Incidente'
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : nota.tipo === 'Procedimiento' || nota.tipoNota === 'Procedimiento'
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : 'bg-violet-100 text-violet-700 border-violet-300'
                            }
                          >
                            {nota.tipo || nota.tipoNota || 'Evolución'}
                          </Badge>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {nota.nota || nota.contenido}
                          </p>
                        </div>
                        {nota.requiere_seguimiento && (
                          <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Requiere seguimiento</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tareas */}
        <TabsContent value="tareas" className="space-y-4 mt-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-teal-800">
                    <ClipboardList className="w-5 h-5" />
                    Tareas del Turno
                  </CardTitle>
                  <CardDescription>Órdenes médicas y tareas asignadas para el turno actual</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-amber-100 text-amber-700">
                    Alta: {tareasDelTurno.filter(t => t.prioridad === 'Alta' && t.estado === 'Pendiente').length}
                  </Badge>
                  <Badge className="bg-teal-100 text-teal-700">
                    Pendientes: {tareasDelTurno.filter(t => t.estado === 'Pendiente').length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {tareasDelTurno.filter(t => t.estado === 'Pendiente').length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto text-emerald-300 mb-4" />
                  <p className="text-gray-500 font-medium">Todas las tareas completadas</p>
                  <p className="text-gray-400 text-sm mt-1">No hay tareas pendientes en este momento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tareasDelTurno
                    .filter(t => t.estado === 'Pendiente')
                    .sort((a, b) => {
                      const prioridadOrden = { Alta: 0, Media: 1, Baja: 2 };
                      return prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad];
                    })
                    .map((tarea) => (
                      <Card
                        key={tarea.id}
                        className={`border-l-4 transition-all hover:shadow-md ${
                          tarea.prioridad === 'Alta' ? 'border-red-400 bg-red-50/50' :
                          tarea.prioridad === 'Media' ? 'border-amber-400 bg-amber-50/50' :
                          'border-teal-400'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge
                                  className={
                                    tarea.prioridad === 'Alta' ? 'bg-red-100 text-red-700 border-red-300' :
                                    tarea.prioridad === 'Media' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                    'bg-teal-100 text-teal-700 border-teal-300'
                                  }
                                >
                                  {tarea.prioridad === 'Alta' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                  {tarea.prioridad}
                                </Badge>
                                <Badge variant="outline" className="font-normal">
                                  {tarea.tipo}
                                </Badge>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {tarea.horaProgramada}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-8 w-8 bg-gray-200">
                                  <AvatarFallback className="text-xs">
                                    {tarea.paciente?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-gray-900">{tarea.paciente}</p>
                                  <p className="text-xs text-gray-500">Hab. {tarea.habitacion}</p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">
                                {tarea.descripcion}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className={
                                tarea.prioridad === 'Alta' ? 'bg-red-600 hover:bg-red-700' :
                                'bg-emerald-600 hover:bg-emerald-700'
                              }
                              onClick={() => handleCompletarTarea(tarea.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Completar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Administrar Medicamento */}
      <Dialog open={showAdministrarModal} onOpenChange={setShowAdministrarModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <Pill className="w-5 h-5" />
              Administrar Medicamento
            </DialogTitle>
          </DialogHeader>
          {selectedMedicamento && (
            <div className="space-y-4">
              {/* Info del paciente y medicamento */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10 bg-amber-500">
                    <AvatarFallback className="text-white font-medium">
                      {selectedMedicamento.paciente?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedMedicamento.paciente}</p>
                    <p className="text-sm text-gray-600">Hab. {selectedMedicamento.habitacion}</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-amber-800">{selectedMedicamento.medicamento}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span><strong>Dosis:</strong> {selectedMedicamento.dosis}</span>
                    <span><strong>Vía:</strong> {selectedMedicamento.via}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Observaciones</Label>
                <Textarea
                  placeholder="Observaciones sobre la administración..."
                  value={formAdministracion.observaciones}
                  onChange={(e) => setFormAdministracion(prev => ({ ...prev, observaciones: e.target.value }))}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <input
                  type="checkbox"
                  id="reaccion"
                  checked={formAdministracion.reaccion_adversa}
                  onChange={(e) => setFormAdministracion(prev => ({ ...prev, reaccion_adversa: e.target.checked }))}
                  className="rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <Label htmlFor="reaccion" className="text-sm text-red-700 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Reportar reacción adversa
                  </span>
                </Label>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdministrarModal(false)}>
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAdministrarMedicamento}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Administración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Registrar Signos Vitales */}
      <Dialog open={showSignosModal} onOpenChange={setShowSignosModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <HeartPulse className="w-5 h-5" />
              Registrar Signos Vitales
            </DialogTitle>
          </DialogHeader>
          {selectedPaciente && (
            <div className="space-y-5">
              {/* Info del paciente */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500">
                    <AvatarFallback className="text-white font-bold">
                      {selectedPaciente.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedPaciente.nombre}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Hab. {selectedPaciente.habitacion}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="truncate max-w-[200px]">{selectedPaciente.diagnostico}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid de signos vitales */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <Label className="text-red-700 text-xs font-medium flex items-center gap-1 mb-2">
                    <Activity className="w-3 h-3" />
                    Presión Arterial (mmHg)
                  </Label>
                  <Input
                    placeholder="120/80"
                    value={formSignos.presionArterial}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, presionArterial: e.target.value }))}
                    className="bg-white border-red-200 focus:border-red-400"
                  />
                </div>
                <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                  <Label className="text-pink-700 text-xs font-medium flex items-center gap-1 mb-2">
                    <Heart className="w-3 h-3" />
                    Frec. Cardíaca (lpm)
                  </Label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={formSignos.frecuenciaCardiaca}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, frecuenciaCardiaca: e.target.value }))}
                    className="bg-white border-pink-200 focus:border-pink-400"
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <Label className="text-blue-700 text-xs font-medium flex items-center gap-1 mb-2">
                    <Activity className="w-3 h-3" />
                    Frec. Respiratoria (rpm)
                  </Label>
                  <Input
                    type="number"
                    placeholder="18"
                    value={formSignos.frecuenciaRespiratoria}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, frecuenciaRespiratoria: e.target.value }))}
                    className="bg-white border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <Label className="text-orange-700 text-xs font-medium flex items-center gap-1 mb-2">
                    <Thermometer className="w-3 h-3" />
                    Temperatura (°C)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={formSignos.temperatura}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, temperatura: e.target.value }))}
                    className="bg-white border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                  <Label className="text-cyan-700 text-xs font-medium flex items-center gap-1 mb-2">
                    <Droplet className="w-3 h-3" />
                    Saturación O₂ (%)
                  </Label>
                  <Input
                    type="number"
                    placeholder="98"
                    value={formSignos.saturacionO2}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, saturacionO2: e.target.value }))}
                    className="bg-white border-cyan-200 focus:border-cyan-400"
                  />
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <Label className="text-purple-700 text-xs font-medium flex items-center gap-1 mb-2">
                    <AlertCircle className="w-3 h-3" />
                    Escala de Dolor (0-10)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="0"
                    value={formSignos.escalaDolor}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, escalaDolor: e.target.value }))}
                    className="bg-white border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Observaciones</Label>
                <Textarea
                  placeholder="Observaciones adicionales sobre el estado del paciente..."
                  rows={2}
                  value={formSignos.observaciones}
                  onChange={(e) => setFormSignos(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSignosModal(false)}>
              Cancelar
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" onClick={handleRegistrarSignos}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Signos Vitales
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nueva Nota */}
      <Dialog open={showNotaModal} onOpenChange={setShowNotaModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-700">
              <FileText className="w-5 h-5" />
              Nueva Nota de Enfermería
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Selector de paciente */}
            <div>
              <Label className="text-sm font-medium">Paciente</Label>
              <Select value={selectedPaciente?.id} onValueChange={(value) => {
                const paciente = pacientesAsignados.find(p => p.id === value);
                setSelectedPaciente(paciente);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccione un paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientesAsignados.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 bg-violet-100">
                          <AvatarFallback className="text-xs text-violet-700">
                            {p.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{p.nombre}</span>
                        <Badge variant="outline" className="text-xs">Hab. {p.habitacion}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de nota con botones visuales */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de Nota</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'Evolucion', label: 'Evolución', color: 'violet', icon: TrendingUp },
                  { value: 'Procedimiento', label: 'Procedimiento', color: 'blue', icon: Stethoscope },
                  { value: 'Observacion', label: 'Observación', color: 'amber', icon: Eye },
                  { value: 'Incidente', label: 'Incidente', color: 'red', icon: AlertTriangle },
                ].map((tipo) => (
                  <Button
                    key={tipo.value}
                    type="button"
                    variant="outline"
                    onClick={() => setFormNota(prev => ({ ...prev, tipo_nota: tipo.value }))}
                    className={`flex flex-col items-center py-3 h-auto ${
                      formNota.tipo_nota === tipo.value
                        ? tipo.color === 'violet' ? 'bg-violet-100 border-violet-400 text-violet-700' :
                          tipo.color === 'blue' ? 'bg-blue-100 border-blue-400 text-blue-700' :
                          tipo.color === 'amber' ? 'bg-amber-100 border-amber-400 text-amber-700' :
                          'bg-red-100 border-red-400 text-red-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <tipo.icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{tipo.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Título opcional */}
            <div>
              <Label className="text-sm font-medium">Título (Opcional)</Label>
              <Input
                placeholder="Ej: Control de signos, Cambio de posición..."
                value={formNota.titulo}
                onChange={(e) => setFormNota(prev => ({ ...prev, titulo: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Contenido de la nota */}
            <div>
              <Label className="text-sm font-medium">Contenido de la Nota</Label>
              <Textarea
                placeholder="Escriba la nota de enfermería detallando la evolución, procedimientos realizados u observaciones relevantes..."
                rows={6}
                value={formNota.contenido}
                onChange={(e) => setFormNota(prev => ({ ...prev, contenido: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Checkbox de seguimiento */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <input
                type="checkbox"
                id="seguimiento"
                checked={formNota.requiere_seguimiento}
                onChange={(e) => setFormNota(prev => ({ ...prev, requiere_seguimiento: e.target.checked }))}
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <Label htmlFor="seguimiento" className="text-sm text-amber-700 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Esta nota requiere seguimiento especial
                </span>
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNotaModal(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              onClick={handleAgregarNota}
              disabled={!selectedPaciente || !formNota.contenido}
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
