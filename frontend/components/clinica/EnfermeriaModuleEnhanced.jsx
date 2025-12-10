'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pill,
  User,
  Calendar,
  TrendingUp,
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Save,
  Users,
  Heart,
  Thermometer,
  Droplet,
  Wind,
  Weight,
  Ruler,
  ClipboardList,
  Download,
  AlertCircle,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EnfermeriaModuleEnhanced({ user }) {
  const [activeTab, setActiveTab] = useState('medicamentos');
  const [showRegistroNota, setShowRegistroNota] = useState(false);
  const [showRegistroSignos, setShowRegistroSignos] = useState(false);
  const [showDetallePaciente, setShowDetallePaciente] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [turnoActual, setTurnoActual] = useState('Tarde (14:00 - 22:00)');

  // Mock data - Pacientes asignados
  const [pacientesAsignados, setPacientesAsignados] = useState([
    {
      id: '1',
      nombre: 'María González',
      edad: 65,
      cedula: '1234567890',
      habitacion: '301-A',
      diagnostico: 'Neumonía adquirida en comunidad',
      fechaIngreso: '2025-01-10',
      medico: 'Dr. Carlos Méndez',
      complejidad: 'Alta',
      alergias: ['Penicilina'],
      dieta: 'Blanda sin sal',
    },
    {
      id: '2',
      nombre: 'Pedro Jiménez',
      edad: 58,
      cedula: '7891234560',
      habitacion: '302-B',
      diagnostico: 'Diabetes Mellitus descompensada',
      fechaIngreso: '2025-01-12',
      medico: 'Dra. Laura Ruiz',
      complejidad: 'Media',
      alergias: [],
      dieta: 'Diabética',
    },
    {
      id: '3',
      nombre: 'Ana Martínez',
      edad: 42,
      cedula: '4567891230',
      habitacion: '303-A',
      diagnostico: 'Post-operatorio apendicectomía',
      fechaIngreso: '2025-01-14',
      medico: 'Dr. Roberto Quirúrgico',
      complejidad: 'Media',
      alergias: [],
      dieta: 'Líquidos',
    },
  ]);

  // Mock data - Medicamentos programados
  const [medicamentos, setMedicamentos] = useState([
    {
      id: 'MED-001',
      pacienteId: '1',
      paciente: 'María González',
      habitacion: '301-A',
      medicamento: 'Paracetamol',
      dosis: '500mg',
      via: 'Oral',
      frecuencia: 'Cada 6 horas',
      horaProgramada: '14:00',
      horario: ['06:00', '12:00', '18:00', '24:00'],
      estado: 'Pendiente',
      observaciones: '',
    },
    {
      id: 'MED-002',
      pacienteId: '1',
      paciente: 'María González',
      habitacion: '301-A',
      medicamento: 'Amoxicilina',
      dosis: '500mg',
      via: 'Oral',
      frecuencia: 'Cada 8 horas',
      horaProgramada: '16:00',
      horario: ['08:00', '16:00', '24:00'],
      estado: 'Pendiente',
      observaciones: '',
    },
    {
      id: 'MED-003',
      pacienteId: '2',
      paciente: 'Pedro Jiménez',
      habitacion: '302-B',
      medicamento: 'Insulina NPH',
      dosis: '10 UI',
      via: 'Subcutánea',
      frecuencia: 'Cada 12 horas',
      horaProgramada: '16:30',
      horario: ['07:00', '19:00'],
      estado: 'Pendiente',
      observaciones: '',
    },
  ]);

  // Mock data - Signos vitales
  const [signosVitales, setSignosVitales] = useState([
    {
      id: 'SV-001',
      pacienteId: '1',
      paciente: 'María González',
      fecha: '2025-01-15',
      hora: '14:00',
      presionArterial: '130/80',
      frecuenciaCardiaca: 78,
      frecuenciaRespiratoria: 18,
      temperatura: 36.8,
      saturacionO2: 98,
      peso: null,
      talla: null,
    },
    {
      id: 'SV-002',
      pacienteId: '2',
      paciente: 'Pedro Jiménez',
      fecha: '2025-01-15',
      hora: '15:00',
      presionArterial: '140/90',
      frecuenciaCardiaca: 82,
      frecuenciaRespiratoria: 20,
      temperatura: 37.2,
      saturacionO2: 96,
      peso: 75,
      talla: null,
    },
  ]);

  // Mock data - Notas de enfermería
  const [notasEnfermeria, setNotasEnfermeria] = useState([
    {
      id: 'NOTA-001',
      pacienteId: '1',
      paciente: 'María González',
      fecha: '2025-01-15',
      hora: '14:30',
      turno: 'Tarde',
      enfermera: 'Enf. Ana López',
      tipo: 'Evolución',
      nota: 'Paciente alerta, orientada. Refiere mejoría de síntomas respiratorios. Tos productiva ocasional. Tolera vía oral. Deambula con ayuda.',
    },
    {
      id: 'NOTA-002',
      pacienteId: '2',
      paciente: 'Pedro Jiménez',
      fecha: '2025-01-15',
      hora: '15:15',
      turno: 'Tarde',
      enfermera: 'Enf. Ana López',
      tipo: 'Procedimiento',
      nota: 'Se administra insulina NPH 10 UI vía subcutánea en abdomen. Paciente tolera procedimiento sin complicaciones. Glicemia pre-insulina: 180 mg/dL.',
    },
  ]);

  // Mock data - Tareas pendientes
  const [tareasPendientes, setTareasPendientes] = useState([
    {
      id: 'TAREA-001',
      pacienteId: '3',
      paciente: 'Ana Martínez',
      tipo: 'Curación',
      descripcion: 'Curación herida quirúrgica',
      prioridad: 'Alta',
      hora: '16:00',
      estado: 'Pendiente',
    },
    {
      id: 'TAREA-002',
      pacienteId: '1',
      paciente: 'María González',
      tipo: 'Movilización',
      descripcion: 'Movilización en cama',
      prioridad: 'Media',
      hora: '16:30',
      estado: 'Pendiente',
    },
  ]);

  // Datos para gráficas
  const datosSignosVitales = [
    { hora: '06:00', temp: 36.5, fc: 72, pa: 120 },
    { hora: '10:00', temp: 36.8, fc: 75, pa: 125 },
    { hora: '14:00', temp: 36.8, fc: 78, pa: 130 },
    { hora: '18:00', temp: 37.0, fc: 80, pa: 128 },
  ];

  // KPIs
  const totalPacientes = pacientesAsignados.length;
  const medicamentosPendientes = medicamentos.filter(m => m.estado === 'Pendiente').length;
  const tareasDelTurno = tareasPendientes.filter(t => t.estado === 'Pendiente').length;
  const signosVitalesHoy = signosVitales.filter(sv => sv.fecha === '2025-01-15').length;

  const getComplejidadColor = (complejidad) => {
    const colores = {
      'Alta': 'bg-red-100 text-red-700 border-red-300',
      'Media': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Baja': 'bg-green-100 text-green-700 border-green-300',
    };
    return colores[complejidad] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Administrado': 'bg-green-100 text-green-700 border-green-300',
      'Omitido': 'bg-gray-100 text-gray-700 border-gray-300',
      'Completado': 'bg-green-100 text-green-700 border-green-300',
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 via-white to-teal-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-600" />
            Panel de Enfermería
          </h1>
          <p className="text-gray-600 mt-1">
            {user.nombre} {user.apellido} - Turno: {turnoActual}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowRegistroNota(true)}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Nota
          </Button>
          <Button
            onClick={() => setShowRegistroSignos(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Signos Vitales
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pacientes Asignados</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalPacientes}</p>
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
                <p className="text-3xl font-bold text-gray-900 mt-1">{medicamentosPendientes}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <Pill className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Tareas del Turno</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{tareasDelTurno}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <ClipboardList className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Signos Vitales Hoy</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{signosVitalesHoy}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Thermometer className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-white shadow-md">
          <TabsTrigger value="medicamentos" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Pill className="w-4 h-4 mr-2" />
            Medicamentos
          </TabsTrigger>
          <TabsTrigger value="signos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Thermometer className="w-4 h-4 mr-2" />
            Signos Vitales
          </TabsTrigger>
          <TabsTrigger value="notas" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="tareas" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
            <ClipboardList className="w-4 h-4 mr-2" />
            Tareas
          </TabsTrigger>
          <TabsTrigger value="pacientes" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            Pacientes
          </TabsTrigger>
        </TabsList>

        {/* Tab: Medicamentos */}
        <TabsContent value="medicamentos" className="space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Administración de Medicamentos
                </CardTitle>
                <Input
                  placeholder="Buscar medicamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Habitación</TableHead>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Dosis</TableHead>
                    <TableHead>Vía</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicamentos.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-semibold">{med.horaProgramada}</TableCell>
                      <TableCell>{med.paciente}</TableCell>
                      <TableCell>{med.habitacion}</TableCell>
                      <TableCell>{med.medicamento}</TableCell>
                      <TableCell>{med.dosis}</TableCell>
                      <TableCell>{med.via}</TableCell>
                      <TableCell className="text-sm text-gray-600">{med.frecuencia}</TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(med.estado)}>
                          {med.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Signos Vitales */}
        <TabsContent value="signos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabla de signos vitales */}
            <Card className="shadow-xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  Registro de Signos Vitales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>PA</TableHead>
                      <TableHead>FC</TableHead>
                      <TableHead>FR</TableHead>
                      <TableHead>Temp (°C)</TableHead>
                      <TableHead>SpO2 (%)</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signosVitales.map((sv) => (
                      <TableRow key={sv.id}>
                        <TableCell className="font-medium">{sv.paciente}</TableCell>
                        <TableCell>{sv.hora}</TableCell>
                        <TableCell>{sv.presionArterial}</TableCell>
                        <TableCell>{sv.frecuenciaCardiaca}</TableCell>
                        <TableCell>{sv.frecuenciaRespiratoria}</TableCell>
                        <TableCell>{sv.temperatura}</TableCell>
                        <TableCell>{sv.saturacionO2}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Gráfica de tendencia */}
            <Card className="shadow-xl lg:col-span-2">
              <CardHeader>
                <CardTitle>Tendencia de Signos Vitales - Últimas 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={datosSignosVitales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} name="Temperatura" />
                    <Line type="monotone" dataKey="fc" stroke="#3b82f6" strokeWidth={2} name="FC" />
                    <Line type="monotone" dataKey="pa" stroke="#10b981" strokeWidth={2} name="PA Sistólica" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Notas */}
        <TabsContent value="notas" className="space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notas de Enfermería
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notasEnfermeria.map((nota) => (
                  <Card key={nota.id} className="border-l-4 border-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{nota.paciente}</h4>
                          <p className="text-sm text-gray-600">
                            {nota.fecha} {nota.hora} - Turno: {nota.turno}
                          </p>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                          {nota.tipo}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{nota.nota}</p>
                      <p className="text-xs text-gray-500">Por: {nota.enfermera}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tareas */}
        <TabsContent value="tareas" className="space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Tareas del Turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tareasPendientes.map((tarea) => (
                  <div key={tarea.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getPrioridadColor(tarea.prioridad)}>
                            {tarea.prioridad}
                          </Badge>
                          <span className="font-semibold text-gray-900">{tarea.tipo}</span>
                          <span className="text-sm text-gray-600">- {tarea.hora}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-semibold">{tarea.paciente}</span>
                        </p>
                        <p className="text-sm text-gray-600">{tarea.descripcion}</p>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pacientes */}
        <TabsContent value="pacientes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pacientesAsignados.map((paciente) => (
              <Card key={paciente.id} className="shadow-xl border-l-4 border-teal-500">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{paciente.nombre}</CardTitle>
                      <p className="text-sm text-gray-600">{paciente.edad} años - {paciente.habitacion}</p>
                    </div>
                    <Badge className={getComplejidadColor(paciente.complejidad)}>
                      {paciente.complejidad}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">Cédula:</p>
                      <p className="font-semibold">{paciente.cedula}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Diagnóstico:</p>
                      <p className="font-semibold">{paciente.diagnostico}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Médico tratante:</p>
                      <p className="font-semibold">{paciente.medico}</p>
                    </div>
                    {paciente.alergias.length > 0 && (
                      <div className="p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-red-700 font-semibold text-xs flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Alergias: {paciente.alergias.join(', ')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Dieta:</p>
                      <p className="font-semibold">{paciente.dieta}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPaciente(paciente);
                        setShowDetallePaciente(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Más
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Registro de Nota */}
      <Dialog open={showRegistroNota} onOpenChange={setShowRegistroNota}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Nota de Enfermería</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Paciente</Label>
              <Select>
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
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evolucion">Evolución</SelectItem>
                  <SelectItem value="procedimiento">Procedimiento</SelectItem>
                  <SelectItem value="observacion">Observación</SelectItem>
                  <SelectItem value="evento">Evento Adverso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nota</Label>
              <Textarea
                placeholder="Escriba la nota de enfermería..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegistroNota(false)}>
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Guardar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Registro de Signos Vitales */}
      <Dialog open={showRegistroSignos} onOpenChange={setShowRegistroSignos}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Registro de Signos Vitales</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Paciente</Label>
              <Select>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Presión Arterial (mmHg)</Label>
                <Input placeholder="120/80" />
              </div>
              <div>
                <Label>Frecuencia Cardíaca (lpm)</Label>
                <Input type="number" placeholder="72" />
              </div>
              <div>
                <Label>Frecuencia Respiratoria (rpm)</Label>
                <Input type="number" placeholder="18" />
              </div>
              <div>
                <Label>Temperatura (°C)</Label>
                <Input type="number" step="0.1" placeholder="36.5" />
              </div>
              <div>
                <Label>Saturación O₂ (%)</Label>
                <Input type="number" placeholder="98" />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input type="number" placeholder="70" />
              </div>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea placeholder="Observaciones adicionales..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegistroSignos(false)}>
              Cancelar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
