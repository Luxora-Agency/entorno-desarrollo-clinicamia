'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus,
  Search,
  Clock,
  AlertCircle,
  Heart,
  Thermometer,
  Activity,
  UserPlus,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  Users,
  AlertTriangle,
} from 'lucide-react';

export default function UrgenciasModule({ user }) {
  const [activeTab, setActiveTab] = useState('triaje');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showTriajeForm, setShowTriajeForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Datos mockeados de pacientes en urgencias
  const [pacientes, setPacientes] = useState([
    {
      id: 'URG-2025-001',
      paciente: { nombre: 'Pedro Martínez', cedula: '1234567890', edad: 45, genero: 'M' },
      motivo: 'Dolor torácico intenso',
      categoriaManchester: 'Rojo',
      nivel: 'Reanimación',
      prioridad: 1,
      signosVitales: {
        presionArterial: '180/110',
        frecuenciaCardiaca: 120,
        frecuenciaRespiratoria: 28,
        temperatura: 37.2,
        saturacionOxigeno: 88,
        glasgow: 15,
      },
      horaLlegada: '2025-01-15 10:30',
      horaTriaje: '2025-01-15 10:32',
      tiempoEspera: '2 min',
      estado: 'EnAtencion',
      areaAsignada: 'Shock',
      medicoDe: 'Dr. Carlos Méndez',
      observaciones: 'Posible IAM. Sospecha de STEMI.',
    },
    {
      id: 'URG-2025-002',
      paciente: { nombre: 'María González', cedula: '9876543210', edad: 32, genero: 'F' },
      motivo: 'Fractura de antebrazo derecho',
      categoriaManchester: 'Naranja',
      nivel: 'Muy Urgente',
      prioridad: 2,
      signosVitales: {
        presionArterial: '125/80',
        frecuenciaCardiaca: 95,
        frecuenciaRespiratoria: 20,
        temperatura: 36.8,
        saturacionOxigeno: 97,
        glasgow: 15,
      },
      horaLlegada: '2025-01-15 10:45',
      horaTriaje: '2025-01-15 10:48',
      tiempoEspera: '15 min',
      estado: 'Espera',
      areaAsignada: 'Consultorio 2',
      observaciones: 'Trauma por caída. Deformidad evidente en antebrazo.',
    },
    {
      id: 'URG-2025-003',
      paciente: { nombre: 'Juan Pérez', cedula: '4567891230', edad: 28, genero: 'M' },
      motivo: 'Cefalea intensa',
      categoriaManchester: 'Amarillo',
      nivel: 'Urgente',
      prioridad: 3,
      signosVitales: {
        presionArterial: '140/90',
        frecuenciaCardiaca: 85,
        frecuenciaRespiratoria: 18,
        temperatura: 37.5,
        saturacionOxigeno: 98,
        glasgow: 15,
      },
      horaLlegada: '2025-01-15 11:00',
      horaTriaje: '2025-01-15 11:05',
      tiempoEspera: '45 min',
      estado: 'Espera',
      observaciones: 'Cefalea de 2 días de evolución. Sin signos neurológicos focales.',
    },
    {
      id: 'URG-2025-004',
      paciente: { nombre: 'Laura Rodríguez', cedula: '7891234560', edad: 52, genero: 'F' },
      motivo: 'Dolor abdominal',
      categoriaManchester: 'Verde',
      nivel: 'Poco Urgente',
      prioridad: 4,
      signosVitales: {
        presionArterial: '120/75',
        frecuenciaCardiaca: 78,
        frecuenciaRespiratoria: 16,
        temperatura: 36.5,
        saturacionOxigeno: 99,
        glasgow: 15,
      },
      horaLlegada: '2025-01-15 11:15',
      horaTriaje: '2025-01-15 11:18',
      tiempoEspera: '1h 20min',
      estado: 'Espera',
      observaciones: 'Dolor abdominal difuso de inicio gradual hace 6 horas.',
    },
    {
      id: 'URG-2025-005',
      paciente: { nombre: 'Roberto Silva', cedula: '3216549870', edad: 65, genero: 'M' },
      motivo: 'Control post-operatorio',
      categoriaManchester: 'Azul',
      nivel: 'No Urgente',
      prioridad: 5,
      signosVitales: {
        presionArterial: '130/85',
        frecuenciaCardiaca: 72,
        frecuenciaRespiratoria: 16,
        temperatura: 36.7,
        saturacionOxigeno: 98,
        glasgow: 15,
      },
      horaLlegada: '2025-01-15 11:30',
      horaTriaje: '2025-01-15 11:33',
      tiempoEspera: '2h 10min',
      estado: 'Espera',
      observaciones: 'Control rutinario post apendicectomía hace 3 días.',
    },
  ]);

  const getCategoriaColor = (categoria) => {
    switch (categoria) {
      case 'Rojo': return 'bg-red-600 text-white';
      case 'Naranja': return 'bg-orange-500 text-white';
      case 'Amarillo': return 'bg-yellow-500 text-gray-900';
      case 'Verde': return 'bg-green-500 text-white';
      case 'Azul': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'EnAtencion': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Espera': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Completado': return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const pacientesFiltrados = pacientes.filter(p => {
    const matchSearch = searchTerm === '' ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.paciente.cedula.includes(searchTerm);
    
    const matchTab = 
      (activeTab === 'triaje') ||
      (activeTab === 'atencion' && p.estado === 'EnAtencion') ||
      (activeTab === 'espera' && p.estado === 'Espera');
    
    return matchSearch && matchTab;
  });

  // Ordenar por prioridad
  const pacientesOrdenados = [...pacientesFiltrados].sort((a, b) => a.prioridad - b.prioridad);

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-600 to-orange-700 rounded-lg shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Urgencias - Triaje Manchester</h1>
              <p className="text-sm text-gray-600">Clasificación y Atención de Emergencias</p>
            </div>
          </div>
          <Dialog open={showNewPatient} onOpenChange={setShowNewPatient}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Ingreso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Ingreso a Urgencias</DialogTitle>
              </DialogHeader>
              <FormularioNuevoIngreso onClose={() => setShowNewPatient(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-l-4 border-l-red-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rojo</p>
                  <p className="text-2xl font-bold text-red-600">1</p>
                  <p className="text-xs text-gray-500">Reanimación</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Naranja</p>
                  <p className="text-2xl font-bold text-orange-600">1</p>
                  <p className="text-xs text-gray-500">Muy Urgente</p>
                </div>
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Amarillo</p>
                  <p className="text-2xl font-bold text-yellow-600">1</p>
                  <p className="text-xs text-gray-500">Urgente</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verde</p>
                  <p className="text-2xl font-bold text-green-600">1</p>
                  <p className="text-xs text-gray-500">Poco Urgente</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Azul</p>
                  <p className="text-2xl font-bold text-blue-600">1</p>
                  <p className="text-xs text-gray-500">No Urgente</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por ID, paciente o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm">
            <TabsTrigger value="triaje" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
              Panel de Triaje
            </TabsTrigger>
            <TabsTrigger value="atencion" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              En Atención
            </TabsTrigger>
            <TabsTrigger value="espera" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">
              En Espera
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Categoría</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Signos Vitales</TableHead>
                      <TableHead>Hora Llegada</TableHead>
                      <TableHead>Tiempo Espera</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientesOrdenados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                          No se encontraron pacientes
                        </TableCell>
                      </TableRow>
                    ) : (
                      pacientesOrdenados.map((paciente) => (
                        <TableRow key={paciente.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${getCategoriaColor(paciente.categoriaManchester)}`}>
                              {paciente.prioridad}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{paciente.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{paciente.paciente.nombre}</p>
                              <p className="text-xs text-gray-500">CC: {paciente.paciente.cedula}</p>
                              <p className="text-xs text-gray-500">{paciente.paciente.edad} años - {paciente.paciente.genero}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm max-w-xs">{paciente.motivo}</p>
                            <Badge className={`mt-1 ${getCategoriaColor(paciente.categoriaManchester)}`}>
                              {paciente.nivel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <p>PA: {paciente.signosVitales.presionArterial}</p>
                              <p>FC: {paciente.signosVitales.frecuenciaCardiaca} lpm</p>
                              <p>SpO2: {paciente.signosVitales.saturacionOxigeno}%</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{paciente.horaLlegada}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-semibold">
                              {paciente.tiempoEspera}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(paciente.estado)}>
                              {paciente.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPatient(paciente);
                                  setShowDetail(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {paciente.estado === 'Espera' && (
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Detalle */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle del Paciente - Triaje</DialogTitle>
            </DialogHeader>
            {selectedPatient && (
              <DetalleTriaje paciente={selectedPatient} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Componente de Formulario de Nuevo Ingreso
function FormularioNuevoIngreso({ onClose }) {
  const [formData, setFormData] = useState({
    paciente: '',
    motivo: '',
    categoriaManchester: '',
    signosVitales: {
      presionArterial: '',
      frecuenciaCardiaca: '',
      frecuenciaRespiratoria: '',
      temperatura: '',
      saturacionOxigeno: '',
      glasgow: 15,
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Paciente ingresado a urgencias exitosamente (mockup)');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Paciente *</Label>
        <Input placeholder="Buscar paciente..." required />
      </div>

      <div>
        <Label>Motivo de Consulta *</Label>
        <Textarea
          placeholder="Descripción del motivo de consulta..."
          rows={2}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Categoría Manchester *</Label>
          <Select required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rojo">🔴 Rojo - Reanimación (Inmediato)</SelectItem>
              <SelectItem value="Naranja">🟠 Naranja - Muy Urgente (10 min)</SelectItem>
              <SelectItem value="Amarillo">🟡 Amarillo - Urgente (60 min)</SelectItem>
              <SelectItem value="Verde">🟢 Verde - Poco Urgente (120 min)</SelectItem>
              <SelectItem value="Azul">🔵 Azul - No Urgente (240 min)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Presión Arterial *</Label>
          <Input placeholder="Ej: 120/80" required />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>FC (lpm) *</Label>
          <Input type="number" placeholder="72" required />
        </div>
        <div>
          <Label>FR (rpm) *</Label>
          <Input type="number" placeholder="16" required />
        </div>
        <div>
          <Label>Temp (°C) *</Label>
          <Input type="number" step="0.1" placeholder="36.5" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>SpO2 (%) *</Label>
          <Input type="number" placeholder="98" required />
        </div>
        <div>
          <Label>Glasgow *</Label>
          <Input type="number" min="3" max="15" placeholder="15" required />
        </div>
      </div>

      <div>
        <Label>Observaciones del Triaje</Label>
        <Textarea
          placeholder="Hallazgos relevantes durante la valoración..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-red-600 to-orange-700">
          Ingresar a Urgencias
        </Button>
      </div>
    </form>
  );
}

// Componente de Detalle de Triaje
function DetalleTriaje({ paciente }) {
  return (
    <div className="space-y-6">
      {/* Información del Paciente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Información del Paciente</span>
            <Badge className={`${
              paciente.categoriaManchester === 'Rojo' ? 'bg-red-600' :
              paciente.categoriaManchester === 'Naranja' ? 'bg-orange-500' :
              paciente.categoriaManchester === 'Amarillo' ? 'bg-yellow-500 text-gray-900' :
              paciente.categoriaManchester === 'Verde' ? 'bg-green-500' :
              'bg-blue-500'
            } text-white text-lg px-4 py-2`}>
              {paciente.categoriaManchester} - {paciente.nivel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">ID Urgencia</p>
              <p className="font-medium">{paciente.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge className={paciente.estado === 'EnAtencion' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                {paciente.estado}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paciente</p>
              <p className="font-medium">{paciente.paciente.nombre}</p>
              <p className="text-xs text-gray-500">CC: {paciente.paciente.cedula}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Edad / Género</p>
              <p className="font-medium">{paciente.paciente.edad} años / {paciente.paciente.genero}</p>
            </div>
          </div>
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600 mb-1">Motivo de Consulta</p>
            <p className="text-sm font-medium">{paciente.motivo}</p>
          </div>
        </CardContent>
      </Card>

      {/* Signos Vitales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signos Vitales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600">Presión Arterial</p>
              <p className="text-xl font-bold text-blue-700">{paciente.signosVitales.presionArterial}</p>
              <p className="text-xs text-gray-500">mmHg</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-600">Frecuencia Cardíaca</p>
              <p className="text-xl font-bold text-red-700">{paciente.signosVitales.frecuenciaCardiaca}</p>
              <p className="text-xs text-gray-500">lpm</p>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
              <p className="text-xs text-gray-600">Frecuencia Respiratoria</p>
              <p className="text-xl font-bold text-cyan-700">{paciente.signosVitales.frecuenciaRespiratoria}</p>
              <p className="text-xs text-gray-500">rpm</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-600">Temperatura</p>
              <p className="text-xl font-bold text-orange-700">{paciente.signosVitales.temperatura}°C</p>
              <p className="text-xs text-gray-500">Celsius</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600">Saturación O2</p>
              <p className="text-xl font-bold text-green-700">{paciente.signosVitales.saturacionOxigeno}%</p>
              <p className="text-xs text-gray-500">SpO2</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-gray-600">Escala Glasgow</p>
              <p className="text-xl font-bold text-purple-700">{paciente.signosVitales.glasgow}/15</p>
              <p className="text-xs text-gray-500">Conciencia</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Atención */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline de Atención</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="w-0.5 h-12 bg-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium">Llegada a Urgencias</p>
                <p className="text-xs text-gray-500">{paciente.horaLlegada}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div className="w-0.5 h-12 bg-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium">Triaje Completado</p>
                <p className="text-xs text-gray-500">{paciente.horaTriaje}</p>
                <p className="text-xs text-gray-600 mt-1">Clasificado como: {paciente.categoriaManchester} - {paciente.nivel}</p>
              </div>
            </div>
            {paciente.estado === 'EnAtencion' && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium">En Atención Médica</p>
                  <p className="text-xs text-gray-500">Área: {paciente.areaAsignada}</p>
                  <p className="text-xs text-gray-500">Médico: {paciente.medicoDe}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      {paciente.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones del Triaje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{paciente.observaciones}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          Imprimir Triaje
        </Button>
        {paciente.estado === 'Espera' && (
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
            <ArrowRight className="w-4 h-4 mr-2" />
            Iniciar Atención
          </Button>
        )}
      </div>
    </div>
  );
}
