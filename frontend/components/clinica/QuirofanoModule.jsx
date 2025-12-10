'use client';

import { useState } from 'react';
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
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar,
  Users,
  Activity,
  Scissors,
  FileText,
  Timer,
  ClipboardList,
} from 'lucide-react';

export default function QuirofanoModule({ user }) {
  const [activeTab, setActiveTab] = useState('programadas');
  const [showNewCirugia, setShowNewCirugia] = useState(false);
  const [showBitacora, setShowBitacora] = useState(false);
  const [selectedCirugia, setSelectedCirugia] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Datos mockeados de cirugías
  const [cirugias, setCirugias] = useState([
    {
      id: 'QX-2025-001',
      paciente: { nombre: 'Pedro Martínez', cedula: '1234567890', edad: 45, genero: 'M' },
      procedimiento: 'Apendicectomía Laparoscópica',
      categoria: 'Cirugía General',
      cirujano: 'Dr. Carlos Méndez',
      ayudante: 'Dr. Roberto Silva',
      anestesiologo: 'Dr. Jorge Ramírez',
      enfermeroInstrumentista: 'Enf. Ana López',
      sala: 'Quirófano 1',
      fechaProgramada: '2025-01-15',
      horaInicio: '08:00',
      duracionEstimada: '90 min',
      estado: 'EnCurso',
      horaInicioReal: '08:15',
      tiempoTranscurrido: '45 min',
      prioridad: 'Urgente',
      diagnostico: 'Apendicitis Aguda',
      observaciones: 'Paciente estable. Ayuno completo.',
    },
    {
      id: 'QX-2025-002',
      paciente: { nombre: 'María González', cedula: '9876543210', edad: 52, genero: 'F' },
      procedimiento: 'Colecistectomía Laparoscópica',
      categoria: 'Cirugía General',
      cirujano: 'Dra. Patricia Gómez',
      ayudante: 'Dr. Luis Moreno',
      anestesiologo: 'Dra. Carmen Ruiz',
      enfermeroInstrumentista: 'Enf. Laura Díaz',
      sala: 'Quirófano 2',
      fechaProgramada: '2025-01-15',
      horaInicio: '10:00',
      duracionEstimada: '120 min',
      estado: 'Programada',
      prioridad: 'Electiva',
      diagnostico: 'Colelitiasis Sintomática',
      observaciones: 'Ultrasonido con múltiples cálculos.',
    },
    {
      id: 'QX-2025-003',
      paciente: { nombre: 'Juan Pérez', cedula: '4567891230', edad: 35, genero: 'M' },
      procedimiento: 'Herniorrafia Inguinal',
      categoria: 'Cirugía General',
      cirujano: 'Dr. Eduardo Torres',
      ayudante: 'Dra. Sandra Reyes',
      anestesiologo: 'Dr. Andrés Vargas',
      enfermeroInstrumentista: 'Enf. Sofía Ramírez',
      sala: 'Quirófano 3',
      fechaProgramada: '2025-01-15',
      horaInicio: '14:00',
      duracionEstimada: '60 min',
      estado: 'Programada',
      prioridad: 'Electiva',
      diagnostico: 'Hernia Inguinal Derecha',
      observaciones: 'Primera cirugía del paciente.',
    },
    {
      id: 'QX-2025-004',
      paciente: { nombre: 'Laura Rodríguez', cedula: '7891234560', edad: 28, genero: 'F' },
      procedimiento: 'Cesárea de Emergencia',
      categoria: 'Ginecología y Obstetricia',
      cirujano: 'Dra. Sandra Reyes',
      ayudante: 'Dr. Roberto Silva',
      anestesiologo: 'Dra. Carmen Ruiz',
      enfermeroInstrumentista: 'Enf. María Torres',
      sala: 'Quirófano 4',
      fechaProgramada: '2025-01-14',
      horaInicio: '20:30',
      duracionEstimada: '45 min',
      estado: 'Completada',
      horaInicioReal: '20:35',
      horaFinReal: '21:10',
      duracionReal: '35 min',
      prioridad: 'Urgente',
      diagnostico: 'Sufrimiento Fetal Agudo',
      observaciones: 'Recién nacido sano. Peso: 3.2kg.',
      complicaciones: 'Ninguna',
      hallazgos: 'Líquido amniótico claro. Placenta íntegra.',
    },
    {
      id: 'QX-2025-005',
      paciente: { nombre: 'Roberto Silva', cedula: '3216549870', edad: 60, genero: 'M' },
      procedimiento: 'Artroplastia de Rodilla',
      categoria: 'Ortopedia y Traumatología',
      cirujano: 'Dr. Eduardo Torres',
      ayudante: 'Dr. Luis Moreno',
      anestesiologo: 'Dr. Jorge Ramírez',
      enfermeroInstrumentista: 'Enf. Ana López',
      sala: 'Quirófano 2',
      fechaProgramada: '2025-01-13',
      horaInicio: '09:00',
      duracionEstimada: '180 min',
      estado: 'Completada',
      horaInicioReal: '09:10',
      horaFinReal: '12:05',
      duracionReal: '175 min',
      prioridad: 'Electiva',
      diagnostico: 'Gonartrosis Severa',
      observaciones: 'Prótesis total de rodilla implantada exitosamente.',
      complicaciones: 'Ninguna',
      hallazgos: 'Desgaste articular grado IV.',
    },
  ]);

  // Estados de salas
  const [salas, setSalas] = useState([
    { id: 1, nombre: 'Quirófano 1', estado: 'Ocupado', cirugia: 'QX-2025-001', tiempoRestante: '45 min' },
    { id: 2, nombre: 'Quirófano 2', estado: 'Disponible', proximaCirugia: '10:00 AM' },
    { id: 3, nombre: 'Quirófano 3', estado: 'Disponible', proximaCirugia: '02:00 PM' },
    { id: 4, nombre: 'Quirófano 4', estado: 'Limpieza', tiempoRestante: '15 min' },
  ]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Programada': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EnCurso': return 'bg-green-100 text-green-800 border-green-300';
      case 'Completada': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Cancelada': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Urgente': return 'bg-red-100 text-red-800 border-red-300';
      case 'Electiva': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSalaEstadoColor = (estado) => {
    switch (estado) {
      case 'Disponible': return 'bg-green-500';
      case 'Ocupado': return 'bg-red-500';
      case 'Limpieza': return 'bg-yellow-500';
      case 'Mantenimiento': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const cirugiasFiltradas = cirugias.filter(c => {
    const matchSearch = searchTerm === '' ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.procedimiento.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTab = 
      (activeTab === 'programadas' && c.estado === 'Programada') ||
      (activeTab === 'encurso' && c.estado === 'EnCurso') ||
      (activeTab === 'completadas' && c.estado === 'Completada') ||
      (activeTab === 'todas');
    
    return matchSearch && matchTab;
  });

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-lg">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quirófano y Cirugías</h1>
              <p className="text-sm text-gray-600">Gestión de Salas Quirúrgicas y Procedimientos</p>
            </div>
          </div>
          <Dialog open={showNewCirugia} onOpenChange={setShowNewCirugia}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Programar Cirugía
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Programar Nueva Cirugía</DialogTitle>
              </DialogHeader>
              <FormularioNuevaCirugia onClose={() => setShowNewCirugia(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Estado de Salas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {salas.map((sala) => (
            <Card key={sala.id} className={`border-l-4 border-l-${getSalaEstadoColor(sala.estado)}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{sala.nombre}</h3>
                  <div className={`w-3 h-3 rounded-full ${getSalaEstadoColor(sala.estado)}`} />
                </div>
                <Badge className={`${
                  sala.estado === 'Disponible' ? 'bg-green-100 text-green-800' :
                  sala.estado === 'Ocupado' ? 'bg-red-100 text-red-800' :
                  sala.estado === 'Limpieza' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {sala.estado}
                </Badge>
                {sala.cirugia && (
                  <p className="text-xs text-gray-600 mt-2">Cirugía: {sala.cirugia}</p>
                )}
                {sala.tiempoRestante && (
                  <p className="text-xs text-gray-600 mt-1">Tiempo: {sala.tiempoRestante}</p>
                )}
                {sala.proximaCirugia && (
                  <p className="text-xs text-gray-600 mt-1">Próxima: {sala.proximaCirugia}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Programadas Hoy</p>
                  <p className="text-2xl font-bold text-blue-600">3</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Curso</p>
                  <p className="text-2xl font-bold text-green-600">1</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-purple-600">2</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Mes</p>
                  <p className="text-2xl font-bold text-indigo-600">87</p>
                </div>
                <Scissors className="w-8 h-8 text-indigo-600" />
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
                placeholder="Buscar por ID, paciente o procedimiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Cirugías */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border shadow-sm">
            <TabsTrigger value="programadas" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              Programadas
            </TabsTrigger>
            <TabsTrigger value="encurso" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              En Curso
            </TabsTrigger>
            <TabsTrigger value="completadas" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              Completadas
            </TabsTrigger>
            <TabsTrigger value="todas" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
              Todas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Cirugía</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Procedimiento</TableHead>
                      <TableHead>Cirujano</TableHead>
                      <TableHead>Sala</TableHead>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cirugiasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                          No se encontraron cirugías
                        </TableCell>
                      </TableRow>
                    ) : (
                      cirugiasFiltradas.map((cirugia) => (
                        <TableRow key={cirugia.id}>
                          <TableCell className="font-medium">{cirugia.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{cirugia.paciente.nombre}</p>
                              <p className="text-xs text-gray-500">{cirugia.paciente.edad} años - {cirugia.paciente.genero}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{cirugia.procedimiento}</p>
                              <p className="text-xs text-gray-500">{cirugia.categoria}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{cirugia.cirujano}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cirugia.sala}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{cirugia.fechaProgramada}</p>
                              <p className="text-gray-500">{cirugia.horaInicio}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{cirugia.duracionEstimada}</p>
                              {cirugia.tiempoTranscurrido && (
                                <p className="text-green-600 font-medium">{cirugia.tiempoTranscurrido}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={getEstadoColor(cirugia.estado)}>
                                {cirugia.estado}
                              </Badge>
                              <Badge className={getPrioridadColor(cirugia.prioridad)}>
                                {cirugia.prioridad}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCirugia(cirugia);
                                  setShowBitacora(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
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

        {/* Dialog de Bitácora */}
        <Dialog open={showBitacora} onOpenChange={setShowBitacora}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bitácora Quirúrgica</DialogTitle>
            </DialogHeader>
            {selectedCirugia && (
              <BitacoraQuirurgica cirugia={selectedCirugia} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Formulario de Nueva Cirugía
function FormularioNuevaCirugia({ onClose }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Cirugía programada exitosamente (mockup)');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Paciente *</Label>
          <Input placeholder="Buscar paciente..." required />
        </div>
        <div>
          <Label>Diagnóstico Preoperatorio *</Label>
          <Input placeholder="Ej: Apendicitis aguda" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Procedimiento Quirúrgico *</Label>
          <Input placeholder="Ej: Apendicectomía laparoscópica" required />
        </div>
        <div>
          <Label>Categoría *</Label>
          <Select required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Cirugía General</SelectItem>
              <SelectItem value="ortopedia">Ortopedia y Traumatología</SelectItem>
              <SelectItem value="gineco">Ginecología y Obstetricia</SelectItem>
              <SelectItem value="neuro">Neurocirugía</SelectItem>
              <SelectItem value="cardio">Cirugía Cardiovascular</SelectItem>
              <SelectItem value="uro">Urología</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Fecha *</Label>
          <Input type="date" required />
        </div>
        <div>
          <Label>Hora *</Label>
          <Input type="time" required />
        </div>
        <div>
          <Label>Duración Estimada *</Label>
          <Input placeholder="90 min" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Sala Quirúrgica *</Label>
          <Select required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="qx1">Quirófano 1</SelectItem>
              <SelectItem value="qx2">Quirófano 2</SelectItem>
              <SelectItem value="qx3">Quirófano 3</SelectItem>
              <SelectItem value="qx4">Quirófano 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Prioridad *</Label>
          <Select required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgente">Urgente</SelectItem>
              <SelectItem value="electiva">Electiva</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipo Quirúrgico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cirujano Principal *</Label>
              <Input placeholder="Buscar médico..." required />
            </div>
            <div>
              <Label>Ayudante</Label>
              <Input placeholder="Buscar médico..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Anestesiólogo *</Label>
              <Input placeholder="Buscar médico..." required />
            </div>
            <div>
              <Label>Enfermero Instrumentista *</Label>
              <Input placeholder="Buscar enfermero..." required />
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label>Observaciones</Label>
        <Textarea
          placeholder="Consideraciones especiales, alergias, estudios previos..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-700">
          Programar Cirugía
        </Button>
      </div>
    </form>
  );
}

// Componente de Bitácora Quirúrgica
function BitacoraQuirurgica({ cirugia }) {
  return (
    <div className="space-y-6">
      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Información de la Cirugía</span>
            <Badge className={`text-lg px-4 py-2 ${
              cirugia.estado === 'EnCurso' ? 'bg-green-500 text-white' :
              cirugia.estado === 'Completada' ? 'bg-purple-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {cirugia.estado}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">ID Cirugía</p>
              <p className="font-medium">{cirugia.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sala</p>
              <Badge variant="outline">{cirugia.sala}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paciente</p>
              <p className="font-medium">{cirugia.paciente.nombre}</p>
              <p className="text-xs text-gray-500">CC: {cirugia.paciente.cedula} - {cirugia.paciente.edad} años</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prioridad</p>
              <Badge className={cirugia.prioridad === 'Urgente' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                {cirugia.prioridad}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Procedimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Procedimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-gray-600">Procedimiento Quirúrgico</p>
            <p className="font-medium text-lg">{cirugia.procedimiento}</p>
            <p className="text-sm text-gray-600 mt-1">Categoría: {cirugia.categoria}</p>
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">Diagnóstico Preoperatorio</p>
            <p className="font-medium">{cirugia.diagnostico}</p>
          </div>
        </CardContent>
      </Card>

      {/* Equipo Quirúrgico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipo Quirúrgico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Cirujano Principal</p>
                <p className="font-medium">{cirugia.cirujano}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Ayudante</p>
                <p className="font-medium">{cirugia.ayudante}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Anestesiólogo</p>
                <p className="font-medium">{cirugia.anestesiologo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Enfermero Instrumentista</p>
                <p className="font-medium">{cirugia.enfermeroInstrumentista}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiempos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Control de Tiempos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Hora Programada</p>
              <p className="text-lg font-bold text-blue-700">{cirugia.horaInicio}</p>
            </div>
            {cirugia.horaInicioReal && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Timer className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Hora Inicio Real</p>
                <p className="text-lg font-bold text-green-700">{cirugia.horaInicioReal}</p>
              </div>
            )}
            {cirugia.horaFinReal && (
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Hora Fin</p>
                <p className="text-lg font-bold text-purple-700">{cirugia.horaFinReal}</p>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Duración Estimada</p>
              <p className="text-xl font-bold text-gray-900">{cirugia.duracionEstimada}</p>
            </div>
            {cirugia.duracionReal && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Duración Real</p>
                <p className="text-xl font-bold text-gray-900">{cirugia.duracionReal}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hallazgos y Complicaciones (solo para completadas) */}
      {cirugia.estado === 'Completada' && (
        <>
          {cirugia.hallazgos && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hallazgos Intraoperatorios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{cirugia.hallazgos}</p>
              </CardContent>
            </Card>
          )}
          
          {cirugia.complicaciones && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Complicaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{cirugia.complicaciones}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Observaciones */}
      {cirugia.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{cirugia.observaciones}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Descargar Bitácora
        </Button>
        {cirugia.estado === 'Completada' && (
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-700">
            <ClipboardList className="w-4 h-4 mr-2" />
            Generar Protocolo Quirúrgico
          </Button>
        )}
      </div>
    </div>
  );
}
