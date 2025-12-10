'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Smile,
  Plus,
  Search,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  X,
  Activity,
  Pill,
  Scissors,
  TrendingUp,
  Users,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function OdontologiaModule({ user }) {
  const [activeTab, setActiveTab] = useState('odontograma');
  const [showNuevoPaciente, setShowNuevoPaciente] = useState(false);
  const [showNuevoTratamiento, setShowNuevoTratamiento] = useState(false);
  const [selectedDiente, setSelectedDiente] = useState(null);
  const [showDetalleDiente, setShowDetalleDiente] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - pacientes odontológicos
  const [pacientesOdonto, setPacientesOdonto] = useState([
    {
      id: 'PAC-ODO-001',
      nombre: 'María González',
      cedula: '1234567890',
      edad: 35,
      telefono: '3001234567',
      ultimaConsulta: '2025-01-10',
      proximaCita: '2025-03-10',
      tratamientosActivos: 2,
      estado: 'Activo',
    },
    {
      id: 'PAC-ODO-002',
      nombre: 'Pedro Jiménez',
      cedula: '7891234560',
      edad: 42,
      telefono: '3009876543',
      ultimaConsulta: '2025-01-08',
      proximaCita: '2025-01-22',
      tratamientosActivos: 1,
      estado: 'Activo',
    },
    {
      id: 'PAC-ODO-003',
      nombre: 'Ana Martínez',
      cedula: '4567891230',
      edad: 28,
      telefono: '3007654321',
      ultimaConsulta: '2024-12-15',
      proximaCita: '2025-02-15',
      tratamientosActivos: 0,
      estado: 'Control',
    },
  ]);

  // Mock data - Odontograma (dientes)
  const [odontograma, setOdontograma] = useState({
    pacienteId: 'PAC-ODO-001',
    pacienteNombre: 'María González',
    fecha: '2025-01-15',
    dientes: {
      // Cuadrante Superior Derecho (11-18)
      18: { numero: '18', estado: 'Sano', observaciones: '' },
      17: { numero: '17', estado: 'Obturado', observaciones: 'Amalgama oclusal' },
      16: { numero: '16', estado: 'Sano', observaciones: '' },
      15: { numero: '15', estado: 'Sano', observaciones: '' },
      14: { numero: '14', estado: 'Caries', observaciones: 'Caries oclusal superficial' },
      13: { numero: '13', estado: 'Sano', observaciones: '' },
      12: { numero: '12', estado: 'Sano', observaciones: '' },
      11: { numero: '11', estado: 'Sano', observaciones: '' },
      // Cuadrante Superior Izquierdo (21-28)
      21: { numero: '21', estado: 'Sano', observaciones: '' },
      22: { numero: '22', estado: 'Sano', observaciones: '' },
      23: { numero: '23', estado: 'Sano', observaciones: '' },
      24: { numero: '24', estado: 'Obturado', observaciones: 'Resina vestibular' },
      25: { numero: '25', estado: 'Sano', observaciones: '' },
      26: { numero: '26', estado: 'Corona', observaciones: 'Corona metal-porcelana' },
      27: { numero: '27', estado: 'Sano', observaciones: '' },
      28: { numero: '28', estado: 'Ausente', observaciones: 'Extraído hace 2 años' },
      // Cuadrante Inferior Derecho (41-48)
      48: { numero: '48', estado: 'Extraer', observaciones: 'Cordal impactado' },
      47: { numero: '47', estado: 'Sano', observaciones: '' },
      46: { numero: '46', estado: 'Endodoncia', observaciones: 'Tratamiento conducto radicular' },
      45: { numero: '45', estado: 'Sano', observaciones: '' },
      44: { numero: '44', estado: 'Sano', observaciones: '' },
      43: { numero: '43', estado: 'Sano', observaciones: '' },
      42: { numero: '42', estado: 'Sano', observaciones: '' },
      41: { numero: '41', estado: 'Sano', observaciones: '' },
      // Cuadrante Inferior Izquierdo (31-38)
      31: { numero: '31', estado: 'Sano', observaciones: '' },
      32: { numero: '32', estado: 'Sano', observaciones: '' },
      33: { numero: '33', estado: 'Sano', observaciones: '' },
      34: { numero: '34', estado: 'Sano', observaciones: '' },
      35: { numero: '35', estado: 'Caries', observaciones: 'Caries proximal' },
      36: { numero: '36', estado: 'Obturado', observaciones: 'Amalgama MOD' },
      37: { numero: '37', estado: 'Fracturado', observaciones: 'Fractura cúspide lingual' },
      38: { numero: '38', estado: 'Ausente', observaciones: 'Congénitamente ausente' },
    },
  });

  // Mock data - tratamientos
  const [tratamientos, setTratamientos] = useState([
    {
      id: 'TRAT-001',
      fecha: '2025-01-10',
      paciente: 'María González',
      diente: '14',
      procedimiento: 'Obturación con Resina',
      odontologo: 'Dr. Roberto Dental',
      costo: 120000,
      estado: 'Completado',
      observaciones: 'Obturación clase I con resina fotopolimerizable',
      proximaCita: '2025-03-10',
    },
    {
      id: 'TRAT-002',
      fecha: '2025-01-08',
      paciente: 'Pedro Jiménez',
      diente: '26',
      procedimiento: 'Corona Metal-Porcelana',
      odontologo: 'Dr. Roberto Dental',
      costo: 450000,
      estado: 'En Proceso',
      observaciones: 'Corona en laboratorio, segunda cita pendiente',
      proximaCita: '2025-01-22',
    },
    {
      id: 'TRAT-003',
      fecha: '2024-12-28',
      paciente: 'María González',
      diente: '46',
      procedimiento: 'Endodoncia',
      odontologo: 'Dra. Laura Ruiz',
      costo: 350000,
      estado: 'Completado',
      observaciones: 'Tratamiento conducto radicular completo',
      proximaCita: null,
    },
    {
      id: 'TRAT-004',
      fecha: '2025-01-05',
      paciente: 'Ana Martínez',
      diente: 'General',
      procedimiento: 'Limpieza Dental (Profilaxis)',
      odontologo: 'Dr. Roberto Dental',
      costo: 80000,
      estado: 'Completado',
      observaciones: 'Profilaxis y aplicación de flúor',
      proximaCita: '2025-07-05',
    },
  ]);

  // Mock data - citas odontológicas
  const [citasOdonto, setCitasOdonto] = useState([
    {
      id: 'CITA-ODO-001',
      fecha: '2025-01-22',
      hora: '09:00',
      paciente: 'Pedro Jiménez',
      odontologo: 'Dr. Roberto Dental',
      motivo: 'Control de corona',
      estado: 'Confirmada',
      duracion: '45 min',
    },
    {
      id: 'CITA-ODO-002',
      fecha: '2025-01-23',
      hora: '10:30',
      paciente: 'Carlos Ramírez',
      odontologo: 'Dra. Laura Ruiz',
      motivo: 'Primera consulta',
      estado: 'Pendiente',
      duracion: '60 min',
    },
    {
      id: 'CITA-ODO-003',
      fecha: '2025-01-23',
      hora: '14:00',
      paciente: 'Sofía Hernández',
      odontologo: 'Dr. Roberto Dental',
      motivo: 'Extracción cordal',
      estado: 'Confirmada',
      duracion: '90 min',
    },
  ]);

  // Datos para gráficas
  const datosTratamientosMes = [
    { mes: 'Jul', cantidad: 24 },
    { mes: 'Ago', cantidad: 31 },
    { mes: 'Sep', cantidad: 28 },
    { mes: 'Oct', cantidad: 35 },
    { mes: 'Nov', cantidad: 29 },
    { mes: 'Dic', cantidad: 33 },
    { mes: 'Ene', cantidad: 18 },
  ];

  const datosProcedimientos = [
    { nombre: 'Obturaciones', valor: 35 },
    { nombre: 'Limpiezas', valor: 28 },
    { nombre: 'Endodoncias', valor: 12 },
    { nombre: 'Extracciones', valor: 15 },
    { nombre: 'Coronas', valor: 8 },
    { nombre: 'Otros', valor: 10 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

  // KPIs
  const totalPacientes = pacientesOdonto.length;
  const tratamientosActivos = pacientesOdonto.reduce((acc, p) => acc + p.tratamientosActivos, 0);
  const citasHoy = citasOdonto.filter(c => c.fecha === '2025-01-23').length;
  const ingresosMes = tratamientos.reduce((acc, t) => acc + t.costo, 0);

  const getEstadoDienteColor = (estado) => {
    const colores = {
      'Sano': 'bg-green-500/10 text-green-700 border-green-500/20',
      'Caries': 'bg-red-500/10 text-red-700 border-red-500/20',
      'Obturado': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      'Ausente': 'bg-gray-500/10 text-gray-700 border-gray-500/20',
      'Corona': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      'Endodoncia': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      'Extraer': 'bg-orange-500/10 text-orange-700 border-orange-500/20',
      'Fracturado': 'bg-pink-500/10 text-pink-700 border-pink-500/20',
    };
    return colores[estado] || 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  };

  const getEstadoTratamientoColor = (estado) => {
    const colores = {
      'Completado': 'bg-green-500/10 text-green-700 border-green-500/20',
      'En Proceso': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      'Pendiente': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      'Cancelado': 'bg-red-500/10 text-red-700 border-red-500/20',
    };
    return colores[estado] || 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  };

  const getEstadoCitaColor = (estado) => {
    const colores = {
      'Confirmada': 'bg-green-500/10 text-green-700 border-green-500/20',
      'Pendiente': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      'Cancelada': 'bg-red-500/10 text-red-700 border-red-500/20',
      'Completada': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    };
    return colores[estado] || 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  };

  const handleClickDiente = (dienteNum) => {
    setSelectedDiente(odontograma.dientes[dienteNum]);
    setShowDetalleDiente(true);
  };

  const renderDiente = (numero) => {
    const diente = odontograma.dientes[numero];
    if (!diente) return null;

    const colorClass = getEstadoDienteColor(diente.estado);

    return (
      <button
        key={numero}
        onClick={() => handleClickDiente(numero)}
        className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-110 hover:shadow-lg ${colorClass}`}
      >
        <span className="text-xs font-semibold">{diente.numero}</span>
      </button>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Smile className="w-8 h-8 text-blue-600" />
            Odontología
          </h1>
          <p className="text-gray-600 mt-1">Gestión de tratamientos dentales y odontograma</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowNuevoPaciente(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Paciente
          </Button>
          <Button
            onClick={() => setShowNuevoTratamiento(true)}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Tratamiento
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Pacientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalPacientes}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Tratamientos Activos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{tratamientosActivos}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Citas Hoy</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{citasHoy}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Ingresos Mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${(ingresosMes / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-md">
          <TabsTrigger value="odontograma" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Smile className="w-4 h-4 mr-2" />
            Odontograma
          </TabsTrigger>
          <TabsTrigger value="tratamientos" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Scissors className="w-4 h-4 mr-2" />
            Tratamientos
          </TabsTrigger>
          <TabsTrigger value="citas" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Agenda
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Odontograma */}
        <TabsContent value="odontograma" className="space-y-6">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Smile className="w-6 h-6" />
                Odontograma - {odontograma.pacienteNombre}
              </CardTitle>
              <p className="text-sm text-blue-100">Fecha: {odontograma.fecha}</p>
            </CardHeader>
            <CardContent className="p-8">
              {/* Cuadrantes Superiores */}
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  {/* Superior Derecho */}
                  <div className="text-center space-y-3">
                    <h3 className="font-semibold text-gray-700">Cuadrante Superior Derecho</h3>
                    <div className="flex justify-center gap-2">
                      {[18, 17, 16, 15, 14, 13, 12, 11].map(num => renderDiente(num))}
                    </div>
                  </div>
                  {/* Superior Izquierdo */}
                  <div className="text-center space-y-3">
                    <h3 className="font-semibold text-gray-700">Cuadrante Superior Izquierdo</h3>
                    <div className="flex justify-center gap-2">
                      {[21, 22, 23, 24, 25, 26, 27, 28].map(num => renderDiente(num))}
                    </div>
                  </div>
                </div>

                {/* Línea divisoria */}
                <div className="border-t-2 border-gray-300"></div>

                {/* Cuadrantes Inferiores */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Inferior Derecho */}
                  <div className="text-center space-y-3">
                    <h3 className="font-semibold text-gray-700">Cuadrante Inferior Derecho</h3>
                    <div className="flex justify-center gap-2">
                      {[48, 47, 46, 45, 44, 43, 42, 41].map(num => renderDiente(num))}
                    </div>
                  </div>
                  {/* Inferior Izquierdo */}
                  <div className="text-center space-y-3">
                    <h3 className="font-semibold text-gray-700">Cuadrante Inferior Izquierdo</h3>
                    <div className="flex justify-center gap-2">
                      {[31, 32, 33, 34, 35, 36, 37, 38].map(num => renderDiente(num))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Leyenda */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Leyenda de Estados:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Sano', 'Caries', 'Obturado', 'Ausente', 'Corona', 'Endodoncia', 'Extraer', 'Fracturado'].map(estado => (
                    <Badge key={estado} className={getEstadoDienteColor(estado)}>
                      {estado}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tratamientos */}
        <TabsContent value="tratamientos" className="space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Registro de Tratamientos
                </CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar tratamiento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Diente</TableHead>
                    <TableHead>Procedimiento</TableHead>
                    <TableHead>Odontólogo</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tratamientos.map((trat) => (
                    <TableRow key={trat.id}>
                      <TableCell>{trat.fecha}</TableCell>
                      <TableCell className="font-medium">{trat.paciente}</TableCell>
                      <TableCell>{trat.diente}</TableCell>
                      <TableCell>{trat.procedimiento}</TableCell>
                      <TableCell>{trat.odontologo}</TableCell>
                      <TableCell>${trat.costo.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getEstadoTratamientoColor(trat.estado)}>
                          {trat.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
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

        {/* Tab: Citas */}
        <TabsContent value="citas" className="space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Agenda Odontológica
                </CardTitle>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cita
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Odontólogo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {citasOdonto.map((cita) => (
                    <TableRow key={cita.id}>
                      <TableCell>{cita.fecha}</TableCell>
                      <TableCell className="font-medium">{cita.hora}</TableCell>
                      <TableCell>{cita.paciente}</TableCell>
                      <TableCell>{cita.odontologo}</TableCell>
                      <TableCell>{cita.motivo}</TableCell>
                      <TableCell>{cita.duracion}</TableCell>
                      <TableCell>
                        <Badge className={getEstadoCitaColor(cita.estado)}>
                          {cita.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
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

        {/* Tab: Estadísticas */}
        <TabsContent value="estadisticas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica de Tratamientos por Mes */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Tratamientos por Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={datosTratamientosMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cantidad" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica de Procedimientos */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Distribución de Procedimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosProcedimientos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {datosProcedimientos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Detalle Diente */}
      <Dialog open={showDetalleDiente} onOpenChange={setShowDetalleDiente}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del Diente {selectedDiente?.numero}</DialogTitle>
          </DialogHeader>
          {selectedDiente && (
            <div className="space-y-4">
              <div>
                <Label>Estado</Label>
                <Badge className={`mt-2 ${getEstadoDienteColor(selectedDiente.estado)}`}>
                  {selectedDiente.estado}
                </Badge>
              </div>
              <div>
                <Label>Observaciones</Label>
                <p className="mt-2 text-sm text-gray-700">
                  {selectedDiente.observaciones || 'Sin observaciones'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetalleDiente(false)}>
              Cerrar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
