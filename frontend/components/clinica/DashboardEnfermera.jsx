'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, Clock, User, AlertTriangle, CheckCircle, 
  Pill, ClipboardList, Calendar, TrendingUp, Users,
  Eye, CheckCheck, XCircle, AlertCircle, Thermometer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardEnfermera({ user }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pendientes');
  
  // Mock data para el dashboard de enfermería
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
    {
      id: '4',
      nombre: 'Carlos Rodríguez',
      edad: 75,
      habitacion: '304-B',
      diagnostico: 'Insuficiencia cardíaca',
      nivelComplejidad: 'Alta',
      signosVitalesUltimo: '2025-01-15 15:30',
      medicamentosHoy: 6,
      medicamentosPendientes: 0,
      alertas: [],
    },
  ]);

  const [medicamentosPendientes, setMedicamentosPendientes] = useState([
    {
      id: 'MED-001',
      paciente: 'María González',
      habitacion: '301-A',
      medicamento: 'Paracetamol 500mg',
      dosis: '1 tableta',
      via: 'Oral',
      horaProgramada: '14:00',
      tiempoRestante: '-30 min',
      estado: 'Atrasado',
      prioridad: 'Alta',
    },
    {
      id: 'MED-002',
      paciente: 'María González',
      habitacion: '301-A',
      medicamento: 'Amoxicilina 500mg',
      dosis: '1 cápsula',
      via: 'Oral',
      horaProgramada: '16:00',
      tiempoRestante: '30 min',
      estado: 'Pendiente',
      prioridad: 'Media',
    },
    {
      id: 'MED-003',
      paciente: 'Pedro Jiménez',
      habitacion: '302-B',
      medicamento: 'Insulina NPH 100 UI/mL',
      dosis: '10 UI',
      via: 'Subcutánea',
      horaProgramada: '16:30',
      tiempoRestante: '60 min',
      estado: 'Pendiente',
      prioridad: 'Alta',
    },
    {
      id: 'MED-004',
      paciente: 'Ana Martínez',
      habitacion: '303-A',
      medicamento: 'Tramadol 50mg',
      dosis: '1 ampolla',
      via: 'Intramuscular',
      horaProgramada: '17:00',
      tiempoRestante: '90 min',
      estado: 'Pendiente',
      prioridad: 'Media',
    },
  ]);

  const [signosVitalesPendientes, setSignosVitalesPendientes] = useState([
    {
      id: 'SV-001',
      paciente: 'María González',
      habitacion: '301-A',
      ultimoRegistro: '14:30',
      proximoRegistro: '16:00',
      tiempoRestante: '30 min',
      estado: 'Programado',
    },
    {
      id: 'SV-002',
      paciente: 'Carlos Rodríguez',
      habitacion: '304-B',
      ultimoRegistro: '15:30',
      proximoRegistro: '17:30',
      tiempoRestante: '120 min',
      estado: 'Programado',
    },
  ]);

  const [tareasDelTurno, setTareasDelTurno] = useState([
    {
      id: 'TAREA-001',
      tipo: 'Curación',
      paciente: 'Ana Martínez',
      habitacion: '303-A',
      descripcion: 'Curación herida quirúrgica post-apendicectomía',
      prioridad: 'Alta',
      horaProgramada: '16:00',
      estado: 'Pendiente',
    },
    {
      id: 'TAREA-002',
      tipo: 'Movilización',
      paciente: 'María González',
      habitacion: '301-A',
      descripcion: 'Movilización en cama cada 2 horas',
      prioridad: 'Media',
      horaProgramada: '16:30',
      estado: 'Pendiente',
    },
    {
      id: 'TAREA-003',
      tipo: 'Control',
      paciente: 'Carlos Rodríguez',
      habitacion: '304-B',
      descripcion: 'Control de balance hídrico',
      prioridad: 'Alta',
      horaProgramada: '17:00',
      estado: 'Pendiente',
    },
  ]);

  // Estadísticas del turno
  const stats = {
    pacientesAsignados: pacientesAsignados.length,
    medicamentosPendientes: medicamentosPendientes.filter(m => m.estado === 'Pendiente' || m.estado === 'Atrasado').length,
    signosVitalesPendientes: signosVitalesPendientes.length,
    tareasDelTurno: tareasDelTurno.filter(t => t.estado === 'Pendiente').length,
    alertasActivas: pacientesAsignados.reduce((acc, p) => acc + p.alertas.length, 0),
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

  const administrarMedicamento = (medId) => {
    console.log('Administrar medicamento:', medId);
    // En producción, aquí iría la lógica para administrar el medicamento
  };

  const registrarSignosVitales = (pacienteId) => {
    console.log('Registrar signos vitales:', pacienteId);
    // En producción, aquí iría la navegación al módulo de signos vitales
  };

  const verPaciente = (pacienteId) => {
    console.log('Ver paciente:', pacienteId);
    // En producción, aquí iría la navegación al perfil del paciente
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
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-md">
          <TabsTrigger value="pendientes" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="pacientes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Mis Pacientes
          </TabsTrigger>
          <TabsTrigger value="medicamentos" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
            <Pill className="w-4 h-4 mr-2" />
            Medicamentos
          </TabsTrigger>
          <TabsTrigger value="tareas" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <ClipboardList className="w-4 h-4 mr-2" />
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
                        <p className="text-xs text-red-600 font-semibold mt-1">
                          Programado: {med.horaProgramada} ({med.tiempoRestante})
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => administrarMedicamento(med.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Administrar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300"
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Habitación</TableHead>
                    <TableHead>Último Registro</TableHead>
                    <TableHead>Próximo Registro</TableHead>
                    <TableHead>Tiempo Restante</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signosVitalesPendientes.map((sv) => (
                    <TableRow key={sv.id}>
                      <TableCell className="font-medium">{sv.paciente}</TableCell>
                      <TableCell>{sv.habitacion}</TableCell>
                      <TableCell>{sv.ultimoRegistro}</TableCell>
                      <TableCell>{sv.proximoRegistro}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                          {sv.tiempoRestante}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => registrarSignosVitales(sv.id)}
                        >
                          <CheckCheck className="w-4 h-4 mr-1" />
                          Registrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mis Pacientes */}
        <TabsContent value="pacientes" className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pacientes Asignados en Este Turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pacientesAsignados.map((paciente) => (
                  <Card key={paciente.id} className="border-l-4 border-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">{paciente.nombre}</h3>
                            <Badge className={getComplejidadColor(paciente.nivelComplejidad)}>
                              Complejidad {paciente.nivelComplejidad}
                            </Badge>
                            <span className="text-sm text-gray-600">{paciente.edad} años</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Habitación: <span className="font-semibold text-gray-900">{paciente.habitacion}</span></p>
                              <p className="text-gray-600">Diagnóstico: <span className="font-semibold text-gray-900">{paciente.diagnostico}</span></p>
                            </div>
                            <div>
                              <p className="text-gray-600">Último registro SV: <span className="font-semibold text-gray-900">{paciente.signosVitalesUltimo}</span></p>
                              <p className="text-gray-600">Medicamentos hoy: <span className="font-semibold text-gray-900">{paciente.medicamentosHoy}</span> (Pendientes: {paciente.medicamentosPendientes})</p>
                            </div>
                          </div>
                          {paciente.alertas.length > 0 && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-yellow-800 text-sm">Alertas:</p>
                                  {paciente.alertas.map((alerta, idx) => (
                                    <p key={idx} className="text-sm text-yellow-700">• {alerta}</p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => verPaciente(paciente.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalles
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Activity className="w-4 h-4 mr-1" />
                            Registrar Nota
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Medicamentos */}
        <TabsContent value="medicamentos" className="space-y-4">
          <Card className="shadow-lg">
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
                    <TableHead>Hab.</TableHead>
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
                      <TableCell>{med.habitacion}</TableCell>
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
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => administrarMedicamento(med.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                          >
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

        {/* Tab: Tareas */}
        <TabsContent value="tareas" className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Tareas del Turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tareasDelTurno.map((tarea) => (
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
                      >
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
      </Tabs>
    </div>
  );
}
