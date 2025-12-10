'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Calendar,
  FileText,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EnfermeriaModuleEnhanced({ user }) {
  const [activeTab, setActiveTab] = useState('resumen');
  const [enfermeraSeleccionada, setEnfermeraSeleccionada] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - Lista de enfermeras
  const [enfermeras, setEnfermeras] = useState([
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
  const [datosEnfermera, setDatosEnfermera] = useState({
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
  });

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
    <div className=\"p-6 space-y-6 bg-gradient-to-br from-teal-50 via-white to-green-50 min-h-screen\">
      {/* Header */}
      <div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-4\">
        <div>
          <h1 className=\"text-3xl font-bold text-gray-900 flex items-center gap-3\">
            <Activity className=\"w-8 h-8 text-teal-600\" />
            Panel de Enfermería - Administración
          </h1>
          <p className=\"text-gray-600 mt-1\">Monitoreo y supervisión del personal de enfermería</p>
        </div>
        <div className=\"flex gap-2\">
          <Input
            placeholder=\"Buscar enfermera...\"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className=\"w-64\"
          />
          <Button variant=\"outline\">
            <Filter className=\"w-4 h-4\" />
          </Button>
        </div>
      </div>

      {/* Selector de Enfermera */}
      <Card className=\"shadow-lg border-l-4 border-teal-500\">
        <CardHeader className=\"bg-gradient-to-r from-teal-50 to-green-50\">
          <CardTitle className=\"flex items-center gap-2\">
            <User className=\"w-5 h-5\" />
            Seleccionar Enfermera
          </CardTitle>
        </CardHeader>
        <CardContent className=\"p-6\">
          <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
            {enfermeras
              .filter(enf => 
                searchTerm === '' || 
                enf.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                enf.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((enfermera) => (\n              <Card \n                key={enfermera.id} \n                className={`cursor-pointer transition-all hover:shadow-lg ${\n                  enfermeraSeleccionada?.id === enfermera.id \n                    ? 'border-2 border-teal-500 shadow-lg' \n                    : 'border border-gray-200'\n                }`}\n                onClick={() => setEnfermeraSeleccionada(enfermera)}\n              >\n                <CardContent className=\"p-4\">\n                  <div className=\"flex items-start justify-between mb-3\">\n                    <div>\n                      <h3 className=\"font-semibold text-gray-900\">{enfermera.nombre}</h3>\n                      <p className=\"text-sm text-gray-600\">{enfermera.email}</p>\n                    </div>\n                    <Badge className={getEstadoColor(enfermera.estado)}>\n                      {enfermera.estado}\n                    </Badge>\n                  </div>\n                  <div className=\"space-y-2 text-sm\">\n                    <div className=\"flex justify-between\">\n                      <span className=\"text-gray-600\">Turno:</span>\n                      <span className=\"font-medium\">{enfermera.turno}</span>\n                    </div>\n                    <div className=\"flex justify-between\">\n                      <span className=\"text-gray-600\">Pacientes:</span>\n                      <span className=\"font-medium\">{enfermera.pacientesAsignados}</span>\n                    </div>\n                    <div className=\"flex justify-between\">\n                      <span className=\"text-gray-600\">Med. Pendientes:</span>\n                      <Badge className=\"bg-yellow-100 text-yellow-700 text-xs\">\n                        {enfermera.medicamentosPendientes}\n                      </Badge>\n                    </div>\n                    <div className=\"flex justify-between\">\n                      <span className=\"text-gray-600\">Tareas:</span>\n                      <span className=\"font-medium\">\n                        {enfermera.tareasCompletadas}/{enfermera.tareasDelTurno}\n                      </span>\n                    </div>\n                  </div>\n                </CardContent>\n              </Card>\n            ))}\n          </div>\n        </CardContent>\n      </Card>\n\n      {/* Información detallada de la enfermera seleccionada */}\n      {enfermeraSeleccionada && (\n        <>\n          {/* KPIs de la enfermera */}\n          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4\">\n            <Card className=\"border-l-4 border-blue-500 shadow-lg\">\n              <CardContent className=\"p-6\">\n                <div className=\"flex items-center justify-between\">\n                  <div>\n                    <p className=\"text-sm text-gray-600 font-medium\">Medicamentos</p>\n                    <p className=\"text-3xl font-bold text-gray-900 mt-1\">\n                      {datosEnfermera.estadisticasTurno.medicamentosAdministrados}\n                    </p>\n                  </div>\n                  <div className=\"bg-blue-100 p-3 rounded-xl\">\n                    <Pill className=\"w-8 h-8 text-blue-600\" />\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n\n            <Card className=\"border-l-4 border-green-500 shadow-lg\">\n              <CardContent className=\"p-6\">\n                <div className=\"flex items-center justify-between\">\n                  <div>\n                    <p className=\"text-sm text-gray-600 font-medium\">Signos Vitales</p>\n                    <p className=\"text-3xl font-bold text-gray-900 mt-1\">\n                      {datosEnfermera.estadisticasTurno.signosVitalesRegistrados}\n                    </p>\n                  </div>\n                  <div className=\"bg-green-100 p-3 rounded-xl\">\n                    <Thermometer className=\"w-8 h-8 text-green-600\" />\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n\n            <Card className=\"border-l-4 border-purple-500 shadow-lg\">\n              <CardContent className=\"p-6\">\n                <div className=\"flex items-center justify-between\">\n                  <div>\n                    <p className=\"text-sm text-gray-600 font-medium\">Notas</p>\n                    <p className=\"text-3xl font-bold text-gray-900 mt-1\">\n                      {datosEnfermera.estadisticasTurno.notasRegistradas}\n                    </p>\n                  </div>\n                  <div className=\"bg-purple-100 p-3 rounded-xl\">\n                    <FileText className=\"w-8 h-8 text-purple-600\" />\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n\n            <Card className=\"border-l-4 border-yellow-500 shadow-lg\">\n              <CardContent className=\"p-6\">\n                <div className=\"flex items-center justify-between\">\n                  <div>\n                    <p className=\"text-sm text-gray-600 font-medium\">Tareas</p>\n                    <p className=\"text-3xl font-bold text-gray-900 mt-1\">\n                      {datosEnfermera.estadisticasTurno.tareasCompletadas}\n                    </p>\n                  </div>\n                  <div className=\"bg-yellow-100 p-3 rounded-xl\">\n                    <CheckCircle className=\"w-8 h-8 text-yellow-600\" />\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n\n            <Card className=\"border-l-4 border-teal-500 shadow-lg\">\n              <CardContent className=\"p-6\">\n                <div className=\"flex items-center justify-between\">\n                  <div>\n                    <p className=\"text-sm text-gray-600 font-medium\">Horas Activas</p>\n                    <p className=\"text-3xl font-bold text-gray-900 mt-1\">\n                      {datosEnfermera.estadisticasTurno.horasActivas}h\n                    </p>\n                  </div>\n                  <div className=\"bg-teal-100 p-3 rounded-xl\">\n                    <Clock className=\"w-8 h-8 text-teal-600\" />\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n          </div>\n\n          {/* Tabs de información */}\n          <Tabs value={activeTab} onValueChange={setActiveTab}>\n            <TabsList className=\"grid w-full grid-cols-3 bg-white shadow-md\">\n              <TabsTrigger value=\"resumen\" className=\"data-[state=active]:bg-teal-600 data-[state=active]:text-white\">\n                <TrendingUp className=\"w-4 h-4 mr-2\" />\n                Resumen\n              </TabsTrigger>\n              <TabsTrigger value=\"pacientes\" className=\"data-[state=active]:bg-blue-600 data-[state=active]:text-white\">\n                <Users className=\"w-4 h-4 mr-2\" />\n                Pacientes Asignados\n              </TabsTrigger>\n              <TabsTrigger value=\"actividad\" className=\"data-[state=active]:bg-green-600 data-[state=active]:text-white\">\n                <Activity className=\"w-4 h-4 mr-2\" />\n                Actividad Reciente\n              </TabsTrigger>\n            </TabsList>\n\n            {/* Tab: Resumen */}\n            <TabsContent value=\"resumen\" className=\"space-y-6\">\n              <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n                {/* Gráfica de actividad por hora */}\n                <Card className=\"shadow-xl\">\n                  <CardHeader>\n                    <CardTitle>Actividad por Hora</CardTitle>\n                  </CardHeader>\n                  <CardContent>\n                    <ResponsiveContainer width=\"100%\" height={300}>\n                      <BarChart data={datosActividadPorHora}>\n                        <CartesianGrid strokeDasharray=\"3 3\" />\n                        <XAxis dataKey=\"hora\" />\n                        <YAxis />\n                        <Tooltip />\n                        <Legend />\n                        <Bar dataKey=\"actividades\" fill=\"#14b8a6\" />\n                      </BarChart>\n                    </ResponsiveContainer>\n                  </CardContent>\n                </Card>\n\n                {/* Distribución de actividades */}\n                <Card className=\"shadow-xl\">\n                  <CardHeader>\n                    <CardTitle>Distribución de Actividades</CardTitle>\n                  </CardHeader>\n                  <CardContent>\n                    <div className=\"space-y-3\">\n                      {datosTipoActividad.map((item, index) => (\n                        <div key={item.nombre} className=\"space-y-2\">\n                          <div className=\"flex justify-between text-sm\">\n                            <span className=\"font-medium text-gray-700\">{item.nombre}</span>\n                            <span className=\"text-gray-600\">{item.valor}%</span>\n                          </div>\n                          <div className=\"w-full bg-gray-200 rounded-full h-2\">\n                            <div\n                              className=\"h-2 rounded-full\"\n                              style={{\n                                width: `${item.valor}%`,\n                                backgroundColor: COLORS[index],\n                              }}\n                            />\n                          </div>\n                        </div>\n                      ))}\n                    </div>\n                  </CardContent>\n                </Card>\n              </div>\n            </TabsContent>\n\n            {/* Tab: Pacientes */}\n            <TabsContent value=\"pacientes\" className=\"space-y-4\">\n              <Card className=\"shadow-xl\">\n                <CardHeader>\n                  <CardTitle className=\"flex items-center gap-2\">\n                    <Users className=\"w-5 h-5\" />\n                    Pacientes Asignados a {enfermeraSeleccionada.nombre}\n                  </CardTitle>\n                </CardHeader>\n                <CardContent>\n                  <Table>\n                    <TableHeader>\n                      <TableRow>\n                        <TableHead>Paciente</TableHead>\n                        <TableHead>Edad</TableHead>\n                        <TableHead>Habitación</TableHead>\n                        <TableHead>Diagnóstico</TableHead>\n                        <TableHead>Complejidad</TableHead>\n                        <TableHead>Med. Pendientes</TableHead>\n                        <TableHead>Última Act.</TableHead>\n                      </TableRow>\n                    </TableHeader>\n                    <TableBody>\n                      {datosEnfermera.pacientes.map((paciente) => (\n                        <TableRow key={paciente.id}>\n                          <TableCell className=\"font-medium\">{paciente.nombre}</TableCell>\n                          <TableCell>{paciente.edad}</TableCell>\n                          <TableCell>{paciente.habitacion}</TableCell>\n                          <TableCell>{paciente.diagnostico}</TableCell>\n                          <TableCell>\n                            <Badge className={getComplejidadColor(paciente.complejidad)}>\n                              {paciente.complejidad}\n                            </Badge>\n                          </TableCell>\n                          <TableCell>\n                            <Badge className=\"bg-yellow-100 text-yellow-700 border-yellow-300\">\n                              {paciente.medicamentosPendientes}\n                            </Badge>\n                          </TableCell>\n                          <TableCell>{paciente.ultimaActualizacion}</TableCell>\n                        </TableRow>\n                      ))}\n                    </TableBody>\n                  </Table>\n                </CardContent>\n              </Card>\n            </TabsContent>\n\n            {/* Tab: Actividad Reciente */}\n            <TabsContent value=\"actividad\" className=\"space-y-4\">\n              <Card className=\"shadow-xl\">\n                <CardHeader>\n                  <CardTitle className=\"flex items-center gap-2\">\n                    <Activity className=\"w-5 h-5\" />\n                    Actividad Reciente de {enfermeraSeleccionada.nombre}\n                  </CardTitle>\n                </CardHeader>\n                <CardContent>\n                  <div className=\"space-y-3\">\n                    {datosEnfermera.actividades.map((actividad) => (\n                      <div key={actividad.id} className=\"flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors\">\n                        <div className=\"bg-gray-100 p-2 rounded-lg\">\n                          <Clock className=\"w-5 h-5 text-gray-600\" />\n                        </div>\n                        <div className=\"flex-1\">\n                          <div className=\"flex items-center gap-2 mb-1\">\n                            <Badge className={getTipoActividadColor(actividad.tipo)}>\n                              {actividad.tipo}\n                            </Badge>\n                            <span className=\"text-sm font-semibold text-gray-900\">{actividad.hora}</span>\n                          </div>\n                          <p className=\"text-sm text-gray-700\">{actividad.descripcion}</p>\n                          <p className=\"text-xs text-gray-500 mt-1\">Paciente: {actividad.paciente}</p>\n                        </div>\n                      </div>\n                    ))}\n                  </div>\n                </CardContent>\n              </Card>\n            </TabsContent>\n          </Tabs>\n        </>\n      )}\n\n      {/* Mensaje cuando no hay enfermera seleccionada */}\n      {!enfermeraSeleccionada && (\n        <Card className=\"shadow-lg\">\n          <CardContent className=\"p-12 text-center\">\n            <User className=\"w-16 h-16 text-gray-400 mx-auto mb-4\" />\n            <h3 className=\"text-xl font-semibold text-gray-900 mb-2\">\n              Selecciona una enfermera\n            </h3>\n            <p className=\"text-gray-600\">\n              Elige una enfermera de la lista superior para ver su información detallada y estadísticas del turno.\n            </p>\n          </CardContent>\n        </Card>\n      )}\n    </div>\n  );\n}\n"}]