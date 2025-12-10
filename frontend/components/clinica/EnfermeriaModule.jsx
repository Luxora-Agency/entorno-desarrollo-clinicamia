'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Activity,
  Clock,
  Pill,
  User,
  Users,
  Thermometer,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EnfermeriaModule({ user }) {
  const [activeTab, setActiveTab] = useState('resumen');
  const [enfermeraSeleccionada, setEnfermeraSeleccionada] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - Lista de enfermeras
  const [enfermeras] = useState([
    {
      id: 'ENF-001',
      nombre: 'María González',
      email: 'enfermera@clinicamia.com',
      turno: 'Tarde (14:00 - 22:00)',
      pacientesAsignados: 3,
      medicamentosPendientes: 2,
      tareasCompletadas: 5,
      tareasDelTurno: 7,
      ultimaActividad: '15:30',
      estado: 'Activa',
    },
    {
      id: 'ENF-002',
      nombre: 'Laura Pérez',
      email: 'laura.perez@clinicamia.com',
      turno: 'Mañana (06:00 - 14:00)',
      pacientesAsignados: 4,
      medicamentosPendientes: 0,
      tareasCompletadas: 8,
      tareasDelTurno: 8,
      ultimaActividad: '13:45',
      estado: 'Activa',
    },
    {
      id: 'ENF-003',
      nombre: 'Ana Martínez',
      email: 'ana.martinez@clinicamia.com',
      turno: 'Noche (22:00 - 06:00)',
      pacientesAsignados: 2,
      medicamentosPendientes: 1,
      tareasCompletadas: 3,
      tareasDelTurno: 5,
      ultimaActividad: '02:15',
      estado: 'Activa',
    },
  ]);

  // Mock data - Información detallada de la enfermera seleccionada
  const datosEnfermera = {
    pacientes: [
      {
        id: '1',
        nombre: 'María González',
        edad: 65,
        habitacion: '301-A',
        diagnostico: 'Neumonía',
        complejidad: 'Alta',
        medicamentosPendientes: 2,
        ultimaActualizacion: '14:30',
      },
      {
        id: '2',
        nombre: 'Pedro Jiménez',
        edad: 58,
        habitacion: '302-B',
        diagnostico: 'Diabetes descompensada',
        complejidad: 'Media',
        medicamentosPendientes: 1,
        ultimaActualizacion: '15:00',
      },
      {
        id: '3',
        nombre: 'Ana Martínez',
        edad: 42,
        habitacion: '303-A',
        diagnostico: 'Post-operatorio',
        complejidad: 'Media',
        medicamentosPendientes: 3,
        ultimaActualizacion: '13:45',
      },
    ],
    actividades: [
      {
        id: 'ACT-001',
        hora: '14:00',
        tipo: 'Medicamento',
        descripcion: 'Administró Paracetamol 500mg a María González',
        paciente: 'María González',
      },
      {
        id: 'ACT-002',
        hora: '14:30',
        tipo: 'Signos Vitales',
        descripcion: 'Registró signos vitales de María González',
        paciente: 'María González',
      },
      {
        id: 'ACT-003',
        hora: '15:00',
        tipo: 'Nota',
        descripcion: 'Añadió nota de evolución para Pedro Jiménez',
        paciente: 'Pedro Jiménez',
      },
      {
        id: 'ACT-004',
        hora: '15:15',
        tipo: 'Tarea',
        descripcion: 'Completó curación de herida en Ana Martínez',
        paciente: 'Ana Martínez',
      },
      {
        id: 'ACT-005',
        hora: '15:30',
        tipo: 'Medicamento',
        descripcion: 'Administró Amoxicilina 500mg a María González',
        paciente: 'María González',
      },
    ],
    estadisticasTurno: {
      medicamentosAdministrados: 8,
      signosVitalesRegistrados: 6,
      notasRegistradas: 4,
      tareasCompletadas: 5,
      horasActivas: 3.5,
    },
  };

  // Datos para gráficas
  const datosActividadPorHora = [
    { hora: '14:00', actividades: 2 },
    { hora: '15:00', actividades: 5 },
    { hora: '16:00', actividades: 3 },
    { hora: '17:00', actividades: 4 },
  ];

  const datosTipoActividad = [
    { nombre: 'Medicamentos', valor: 35 },
    { nombre: 'Signos Vitales', valor: 25 },
    { nombre: 'Notas', valor: 20 },
    { nombre: 'Tareas', valor: 20 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const getEstadoColor = (estado) => {
    const colores = {
      'Activa': 'bg-green-100 text-green-700 border-green-300',
      'Inactiva': 'bg-gray-100 text-gray-700 border-gray-300',
      'Descanso': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    return colores[estado] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getComplejidadColor = (complejidad) => {
    const colores = {
      'Alta': 'bg-red-100 text-red-700 border-red-300',
      'Media': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Baja': 'bg-green-100 text-green-700 border-green-300',
    };
    return colores[complejidad] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getTipoActividadColor = (tipo) => {
    const colores = {
      'Medicamento': 'bg-blue-100 text-blue-700 border-blue-300',
      'Signos Vitales': 'bg-green-100 text-green-700 border-green-300',
      'Nota': 'bg-purple-100 text-purple-700 border-purple-300',
      'Tarea': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    return colores[tipo] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-teal-50 via-white to-green-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-teal-600" />
            Panel de Enfermería - Administración
          </h1>
          <p className="text-gray-600 mt-1">Monitoreo y supervisión del personal de enfermería</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar enfermera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selector de Enfermera */}
      <Card className="shadow-lg border-l-4 border-teal-500">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Seleccionar Enfermera
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {enfermeras
              .filter(enf => 
                searchTerm === '' || 
                enf.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                enf.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((enfermera) => (
              <Card 
                key={enfermera.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  enfermeraSeleccionada?.id === enfermera.id 
                    ? 'border-2 border-teal-500 shadow-lg' 
                    : 'border border-gray-200'
                }`}
                onClick={() => setEnfermeraSeleccionada(enfermera)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{enfermera.nombre}</h3>
                      <p className="text-sm text-gray-600">{enfermera.email}</p>
                    </div>
                    <Badge className={getEstadoColor(enfermera.estado)}>
                      {enfermera.estado}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Turno:</span>
                      <span className="font-medium">{enfermera.turno}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pacientes:</span>
                      <span className="font-medium">{enfermera.pacientesAsignados}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Med. Pendientes:</span>
                      <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                        {enfermera.medicamentosPendientes}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tareas:</span>
                      <span className="font-medium">
                        {enfermera.tareasCompletadas}/{enfermera.tareasDelTurno}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Información detallada de la enfermera seleccionada */}
      {enfermeraSeleccionada && (
        <>
          {/* KPIs de la enfermera */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-l-4 border-blue-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Medicamentos</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {datosEnfermera.estadisticasTurno.medicamentosAdministrados}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Pill className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-green-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Signos Vitales</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {datosEnfermera.estadisticasTurno.signosVitalesRegistrados}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-xl">
                    <Thermometer className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-purple-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Notas</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {datosEnfermera.estadisticasTurno.notasRegistradas}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-yellow-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Tareas</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {datosEnfermera.estadisticasTurno.tareasCompletadas}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-teal-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Horas Activas</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {datosEnfermera.estadisticasTurno.horasActivas}h
                    </p>
                  </div>
                  <div className="bg-teal-100 p-3 rounded-xl">
                    <Clock className="w-8 h-8 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs de información */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-md">
              <TabsTrigger value="resumen" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="pacientes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                Pacientes Asignados
              </TabsTrigger>
              <TabsTrigger value="actividad" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <Activity className="w-4 h-4 mr-2" />
                Actividad Reciente
              </TabsTrigger>
            </TabsList>

            {/* Tab: Resumen */}
            <TabsContent value="resumen" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfica de actividad por hora */}
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle>Actividad por Hora</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={datosActividadPorHora}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hora" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="actividades" fill="#14b8a6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Distribución de actividades */}
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle>Distribución de Actividades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {datosTipoActividad.map((item, index) => (
                        <div key={item.nombre} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">{item.nombre}</span>
                            <span className="text-gray-600">{item.valor}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${item.valor}%`,
                                backgroundColor: COLORS[index],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Pacientes */}
            <TabsContent value="pacientes" className="space-y-4">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Pacientes Asignados a {enfermeraSeleccionada.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Edad</TableHead>
                        <TableHead>Habitación</TableHead>
                        <TableHead>Diagnóstico</TableHead>
                        <TableHead>Complejidad</TableHead>
                        <TableHead>Med. Pendientes</TableHead>
                        <TableHead>Última Act.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datosEnfermera.pacientes.map((paciente) => (
                        <TableRow key={paciente.id}>
                          <TableCell className="font-medium">{paciente.nombre}</TableCell>
                          <TableCell>{paciente.edad}</TableCell>
                          <TableCell>{paciente.habitacion}</TableCell>
                          <TableCell>{paciente.diagnostico}</TableCell>
                          <TableCell>
                            <Badge className={getComplejidadColor(paciente.complejidad)}>
                              {paciente.complejidad}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                              {paciente.medicamentosPendientes}
                            </Badge>
                          </TableCell>
                          <TableCell>{paciente.ultimaActualizacion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Actividad Reciente */}
            <TabsContent value="actividad" className="space-y-4">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Actividad Reciente de {enfermeraSeleccionada.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {datosEnfermera.actividades.map((actividad) => (
                      <div key={actividad.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <Clock className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getTipoActividadColor(actividad.tipo)}>
                              {actividad.tipo}
                            </Badge>
                            <span className="text-sm font-semibold text-gray-900">{actividad.hora}</span>
                          </div>
                          <p className="text-sm text-gray-700">{actividad.descripcion}</p>
                          <p className="text-xs text-gray-500 mt-1">Paciente: {actividad.paciente}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Mensaje cuando no hay enfermera seleccionada */}
      {!enfermeraSeleccionada && (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Selecciona una enfermera
            </h3>
            <p className="text-gray-600">
              Elige una enfermera de la lista superior para ver su información detallada y estadísticas del turno.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
