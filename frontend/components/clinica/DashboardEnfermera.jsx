'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, Clock, User, AlertTriangle, CheckCircle, 
  Pill, ClipboardList, Calendar, TrendingUp, Users,
  Eye, CheckCheck, XCircle, AlertCircle, Thermometer,
  Plus, Save, X, Edit, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function DashboardEnfermera({ user }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pacientes');
  const [showAdministrarModal, setShowAdministrarModal] = useState(false);
  const [showSignosModal, setShowSignosModal] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [selectedMedicamento, setSelectedMedicamento] = useState(null);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  
  // Datos reales del backend
  const [asignaciones, setAsignaciones] = useState([]);
  const [pacientesAsignados, setPacientesAsignados] = useState([]);
  const [medicamentosProgramados, setMedicamentosProgramados] = useState([]);
  const [notasEnfermeria, setNotasEnfermeria] = useState([]);
  const [turnoActual, setTurnoActual] = useState('Tarde');
  
  // Form states
  const [formSignos, setFormSignos] = useState({
    temperatura: '',
    presionSistolica: '',
    presionDiastolica: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    saturacionOxigeno: '',
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
      
      if (pacientesRes.ok) {
        const data = await pacientesRes.json();
        const pacientes = data.data?.pacientes || [];
        setPacientesAsignados(pacientes);
        
        // Cargar medicamentos de esos pacientes
        if (pacientes.length > 0) {
          const hoy = new Date().toISOString().split('T')[0];
          const medicamentosRes = await fetch(`${apiUrl}/administraciones?fecha=${hoy}&estado=Programada&limit=100`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (medicamentosRes.ok) {
            const medData = await medicamentosRes.json();
            setMedicamentosProgramados(medData.data || []);
          }
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

  const [formAdministracion, setFormAdministracion] = useState({
    observaciones: '',
    reaccionAdversa: false
  });
  
  // Mock data - pacientes asignados
  const [pacientesAsignados, setPacientesAsignados] = useState([
    {
      id: '1',
      nombre: 'María González',
      edad: 65,
      habitacion: '301-A',
      diagnostico: 'Neumonía',
      nivelComplejidad: 'Alta',
      signosVitalesUltimo: '2025-01-15 14:30',
      medicamentosHoy: 4,
      medicamentosPendientes: 2,
      alertas: ['Signos vitales pendientes', 'Medicamento 14:00 atrasado'],
    },
    {
      id: '2',
      nombre: 'Pedro Jiménez',
      edad: 58,
      habitacion: '302-B',
      diagnostico: 'Diabetes descompensada',
      nivelComplejidad: 'Media',
      signosVitalesUltimo: '2025-01-15 15:00',
      medicamentosHoy: 3,
      medicamentosPendientes: 1,
      alertas: [],
    },
    {
      id: '3',
      nombre: 'Ana Martínez',
      edad: 42,
      habitacion: '303-A',
      diagnostico: 'Post-operatorio apendicectomía',
      nivelComplejidad: 'Media',
      signosVitalesUltimo: '2025-01-15 13:45',
      medicamentosHoy: 5,
      medicamentosPendientes: 3,
      alertas: ['Curación pendiente'],
    },
  ]);

  const [medicamentosPendientes, setMedicamentosPendientes] = useState([
    {
      id: 'MED-001',
      pacienteId: '1',
      paciente: 'María González',
      habitacion: '301-A',
      medicamento: 'Paracetamol 500mg',
      dosis: '1 tableta',
      via: 'Oral',
      horaProgramada: '14:00',
      estado: 'Atrasado',
      prioridad: 'Alta',
    },
    {
      id: 'MED-002',
      pacienteId: '1',
      paciente: 'María González',
      habitacion: '301-A',
      medicamento: 'Amoxicilina 500mg',
      dosis: '1 cápsula',
      via: 'Oral',
      horaProgramada: '16:00',
      estado: 'Pendiente',
      prioridad: 'Media',
    },
    {
      id: 'MED-003',
      pacienteId: '2',
      paciente: 'Pedro Jiménez',
      habitacion: '302-B',
      medicamento: 'Insulina NPH 100 UI/mL',
      dosis: '10 UI',
      via: 'Subcutánea',
      horaProgramada: '16:30',
      estado: 'Pendiente',
      prioridad: 'Alta',
    },
  ]);

  const [signosVitalesPendientes, setSignosVitalesPendientes] = useState([
    {
      id: 'SV-001',
      pacienteId: '1',
      paciente: 'María González',
      habitacion: '301-A',
      ultimoRegistro: '14:30',
      proximoRegistro: '16:00',
      estado: 'Programado',
    },
    {
      id: 'SV-002',
      pacienteId: '3',
      paciente: 'Ana Martínez',
      habitacion: '303-A',
      ultimoRegistro: '13:45',
      proximoRegistro: '15:45',
      estado: 'Programado',
    },
  ]);

  const [tareasDelTurno, setTareasDelTurno] = useState([
    {
      id: 'TAREA-001',
      pacienteId: '3',
      paciente: 'Ana Martínez',
      habitacion: '303-A',
      tipo: 'Curación',
      descripcion: 'Curación herida quirúrgica post-apendicectomía',
      prioridad: 'Alta',
      horaProgramada: '16:00',
      estado: 'Pendiente',
    },
    {
      id: 'TAREA-002',
      pacienteId: '1',
      paciente: 'María González',
      habitacion: '301-A',
      tipo: 'Movilización',
      descripcion: 'Movilización en cama cada 2 horas',
      prioridad: 'Media',
      horaProgramada: '16:30',
      estado: 'Pendiente',
    },
  ]);

  const [notasEnfermeria, setNotasEnfermeria] = useState([
    {
      id: 'NOTA-001',
      pacienteId: '1',
      paciente: 'María González',
      fecha: new Date().toISOString(),
      tipo: 'Evolución',
      nota: 'Paciente alerta, orientada. Refiere mejoría de síntomas respiratorios.',
    },
  ]);

  // Estadísticas calculadas
  const stats = {
    pacientesAsignados: pacientesAsignados.length,
    medicamentosPendientes: medicamentosProgramados.filter(m => m.estado === 'Programada' || m.estado === 'Pendiente').length,
    signosVitalesPendientes: pacientesAsignados.length, // Simplificado: uno por paciente
    tareasDelTurno: 0, // Por implementar
    alertasActivas: 0, // Por implementar
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

      const response = await fetch(`${apiUrl}/signos-vitales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paciente_id: selectedPaciente.pacienteId,
          admision_id: selectedPaciente.id,
          registrado_por: user.id,
          temperatura: formSignos.temperatura ? parseFloat(formSignos.temperatura) : null,
          presion_sistolica: formSignos.presionSistolica ? parseInt(formSignos.presionSistolica) : null,
          presion_diastolica: formSignos.presionDiastolica ? parseInt(formSignos.presionDiastolica) : null,
          frecuencia_cardiaca: formSignos.frecuenciaCardiaca ? parseInt(formSignos.frecuenciaCardiaca) : null,
          frecuencia_respiratoria: formSignos.frecuenciaRespiratoria ? parseInt(formSignos.frecuenciaRespiratoria) : null,
          saturacion_oxigeno: formSignos.saturacionOxigeno ? parseFloat(formSignos.saturacionOxigeno) : null,
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
          presionSistolica: '',
          presionDiastolica: '',
          frecuenciaCardiaca: '',
          frecuenciaRespiratoria: '',
          saturacionOxigeno: '',
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

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 via-white to-teal-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-600" />
            Panel de Enfermería
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenida, <span className="font-semibold">{user.nombre} {user.apellido}</span> - Turno Tarde (14:00 - 22:00)
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-2 text-sm">
            <Clock className="w-4 h-4 mr-2" />
            {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pacientes Asignados</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pacientesAsignados}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Medicamentos Pendientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.medicamentosPendientes}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <Pill className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Signos Vitales</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.signosVitalesPendientes}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Thermometer className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Tareas del Turno</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.tareasDelTurno}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <ClipboardList className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Alertas Activas</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.alertasActivas}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-white shadow-md">
          <TabsTrigger value="pendientes" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="medicamentos" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
            <Pill className="w-4 h-4 mr-2" />
            Medicamentos
          </TabsTrigger>
          <TabsTrigger value="signos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Thermometer className="w-4 h-4 mr-2" />
            Signos Vitales
          </TabsTrigger>
          <TabsTrigger value="notas" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <ClipboardList className="w-4 h-4 mr-2" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="tareas" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Tareas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Pendientes */}
        <TabsContent value="pendientes" className="space-y-4">
          {/* Medicamentos atrasados */}
          {medicamentosPendientes.filter(m => m.estado === 'Atrasado').length > 0 && (
            <Card className="border-l-4 border-red-500 shadow-lg">
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  Medicamentos Atrasados - Acción Inmediata Requerida
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {medicamentosPendientes.filter(m => m.estado === 'Atrasado').map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className={getPrioridadColor(med.prioridad)}>
                            {med.prioridad}
                          </Badge>
                          <span className="font-semibold text-gray-900">{med.paciente}</span>
                          <span className="text-sm text-gray-600">({med.habitacion})</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {med.medicamento} - {med.dosis} - {med.via}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
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

          {/* Signos vitales pendientes */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                Signos Vitales Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {signosVitalesPendientes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay signos vitales pendientes</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Habitación</TableHead>
                      <TableHead>Último Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signosVitalesPendientes.map((sv) => (
                      <TableRow key={sv.id}>
                        <TableCell className="font-medium">{sv.paciente}</TableCell>
                        <TableCell>{sv.habitacion}</TableCell>
                        <TableCell>{sv.ultimoRegistro}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              const paciente = pacientesAsignados.find(p => p.id === sv.pacienteId);
                              setSelectedPaciente(paciente);
                              setShowSignosModal(true);
                            }}
                          >
                            <CheckCheck className="w-4 h-4 mr-1" />
                            Registrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Medicamentos */}
        <TabsContent value="medicamentos" className="space-y-4">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Administración de Medicamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Dosis</TableHead>
                    <TableHead>Vía</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicamentosPendientes.map((med) => (
                    <TableRow key={med.id} className={med.estado === 'Atrasado' ? 'bg-red-50' : ''}>
                      <TableCell className="font-semibold">{med.horaProgramada}</TableCell>
                      <TableCell>{med.paciente}</TableCell>
                      <TableCell>{med.medicamento}</TableCell>
                      <TableCell>{med.dosis}</TableCell>
                      <TableCell>{med.via}</TableCell>
                      <TableCell>
                        <Badge className={getPrioridadColor(med.prioridad)}>
                          {med.prioridad}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoMedicamentoColor(med.estado)}>
                          {med.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {med.estado !== 'Administrado' && med.estado !== 'Omitido' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedMedicamento(med);
                                setShowAdministrarModal(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOmitirMedicamento(med.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Signos Vitales */}
        <TabsContent value="signos" className="space-y-4">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  Registro de Signos Vitales
                </CardTitle>
                <Button
                  onClick={() => {
                    setSelectedPaciente(pacientesAsignados[0]);
                    setShowSignosModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pacientesAsignados.map((paciente) => (
                  <Card key={paciente.id} className="border-l-4 border-blue-500">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{paciente.nombre}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Habitación: {paciente.habitacion}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Último registro: {paciente.signosVitalesUltimo}
                      </p>
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setSelectedPaciente(paciente);
                          setShowSignosModal(true);
                        }}
                      >
                        <Thermometer className="w-4 h-4 mr-2" />
                        Registrar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notas */}
        <TabsContent value="notas" className="space-y-4">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Notas de Enfermería
                </CardTitle>
                <Button
                  onClick={() => {
                    setSelectedPaciente(pacientesAsignados[0]);
                    setShowNotaModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Nota
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notasEnfermeria.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay notas registradas</p>
              ) : (
                <div className="space-y-4">
                  {notasEnfermeria.map((nota) => (
                    <Card key={nota.id} className="border-l-4 border-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{nota.paciente}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(nota.fecha).toLocaleString('es-CO')}
                            </p>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                            {nota.tipo}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{nota.nota}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tareas */}
        <TabsContent value="tareas" className="space-y-4">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Tareas del Turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tareasDelTurno.filter(t => t.estado === 'Pendiente').length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay tareas pendientes</p>
              ) : (
                <div className="space-y-3">
                  {tareasDelTurno.filter(t => t.estado === 'Pendiente').map((tarea) => (
                    <div key={tarea.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={getPrioridadColor(tarea.prioridad)}>
                              {tarea.prioridad}
                            </Badge>
                            <span className="font-semibold text-gray-900">{tarea.tipo}</span>
                            <span className="text-sm text-gray-600">- {tarea.horaProgramada}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-semibold">{tarea.paciente}</span> ({tarea.habitacion})
                          </p>
                          <p className="text-sm text-gray-600">{tarea.descripcion}</p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleCompletarTarea(tarea.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Completar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Administrar Medicamento */}
      <Dialog open={showAdministrarModal} onOpenChange={setShowAdministrarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Administrar Medicamento</DialogTitle>
          </DialogHeader>
          {selectedMedicamento && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">{selectedMedicamento.paciente}</p>
                <p className="text-sm text-gray-600">{selectedMedicamento.habitacion}</p>
                <p className="text-sm font-medium text-blue-700 mt-2">
                  {selectedMedicamento.medicamento} - {selectedMedicamento.dosis}
                </p>
                <p className="text-xs text-gray-600">Vía: {selectedMedicamento.via}</p>
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Observaciones sobre la administración..."
                  value={formAdministracion.observaciones}
                  onChange={(e) => setFormAdministracion(prev => ({ ...prev, observaciones: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reaccion"
                  checked={formAdministracion.reaccionAdversa}
                  onChange={(e) => setFormAdministracion(prev => ({ ...prev, reaccionAdversa: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="reaccion" className="text-sm">Reportar reacción adversa</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdministrarModal(false)}>
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleAdministrarMedicamento}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Registrar Signos Vitales */}
      <Dialog open={showSignosModal} onOpenChange={setShowSignosModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Signos Vitales</DialogTitle>
          </DialogHeader>
          {selectedPaciente && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold text-gray-900">{selectedPaciente.nombre}</p>
                <p className="text-sm text-gray-600">
                  Habitación: {selectedPaciente.habitacion} - {selectedPaciente.diagnostico}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Presión Arterial (mmHg)</Label>
                  <Input
                    placeholder="120/80"
                    value={formSignos.presionArterial}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, presionArterial: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Frecuencia Cardíaca (lpm)</Label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={formSignos.frecuenciaCardiaca}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, frecuenciaCardiaca: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Frecuencia Respiratoria (rpm)</Label>
                  <Input
                    type="number"
                    placeholder="18"
                    value={formSignos.frecuenciaRespiratoria}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, frecuenciaRespiratoria: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Temperatura (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={formSignos.temperatura}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, temperatura: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Saturación O₂ (%)</Label>
                  <Input
                    type="number"
                    placeholder="98"
                    value={formSignos.saturacionO2}
                    onChange={(e) => setFormSignos(prev => ({ ...prev, saturacionO2: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Observaciones adicionales..."
                  rows={2}
                  value={formSignos.observaciones}
                  onChange={(e) => setFormSignos(prev => ({ ...prev, observaciones: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignosModal(false)}>
              Cancelar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleRegistrarSignos}>
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nueva Nota */}
      <Dialog open={showNotaModal} onOpenChange={setShowNotaModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Nota de Enfermería</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Paciente</Label>
              <Select value={selectedPaciente?.id} onValueChange={(value) => {
                const paciente = pacientesAsignados.find(p => p.id === value);
                setSelectedPaciente(paciente);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientesAsignados.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} - {p.habitacion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Nota</Label>
              <Select value={formNota.tipo} onValueChange={(value) => setFormNota(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Evolución">Evolución</SelectItem>
                  <SelectItem value="Procedimiento">Procedimiento</SelectItem>
                  <SelectItem value="Observación">Observación</SelectItem>
                  <SelectItem value="Evento Adverso">Evento Adverso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nota</Label>
              <Textarea
                placeholder="Escriba la nota de enfermería..."
                rows={6}
                value={formNota.nota}
                onChange={(e) => setFormNota(prev => ({ ...prev, nota: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotaModal(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700" 
              onClick={handleAgregarNota}
              disabled={!selectedPaciente || !formNota.nota}
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
