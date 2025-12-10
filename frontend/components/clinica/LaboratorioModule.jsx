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
  Beaker,
  Plus,
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  User,
  Calendar,
  Download,
  Eye,
  TrendingUp,
  Activity,
  BarChart3,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LaboratorioModule({ user }) {
  const [activeTab, setActiveTab] = useState('pendientes');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Datos mockeados de órdenes de laboratorio
  const [ordenes, setOrdenes] = useState([
    {
      id: 'LAB-2025-001',
      paciente: { nombre: 'María González', cedula: '1234567890', edad: 45 },
      medico: { nombre: 'Dr. Carlos Méndez', especialidad: 'Medicina Interna' },
      examenes: ['Hemograma Completo', 'Glucosa', 'Creatinina', 'Perfil Lipídico'],
      prioridad: 'Alta',
      estado: 'Pendiente',
      fechaSolicitud: '2025-01-15 08:30',
      fechaProgramada: '2025-01-15 10:00',
      observaciones: 'Paciente en ayunas desde las 6am',
    },
    {
      id: 'LAB-2025-002',
      paciente: { nombre: 'Juan Pérez', cedula: '9876543210', edad: 62 },
      medico: { nombre: 'Dra. Ana Martínez', especialidad: 'Cardiología' },
      examenes: ['Troponinas', 'CPK-MB', 'BNP', 'Electrolitos'],
      prioridad: 'Urgente',
      estado: 'EnProceso',
      fechaSolicitud: '2025-01-15 09:15',
      fechaProgramada: '2025-01-15 09:30',
      observaciones: 'Sospecha de IAM',
    },
    {
      id: 'LAB-2025-003',
      paciente: { nombre: 'Laura Rodríguez', cedula: '4567891230', edad: 28 },
      medico: { nombre: 'Dr. Roberto Silva', especialidad: 'Ginecología' },
      examenes: ['Beta-HCG', 'Grupo Sanguíneo', 'TSH', 'Hemograma'],
      prioridad: 'Normal',
      estado: 'Completado',
      fechaSolicitud: '2025-01-14 14:20',
      fechaRealizacion: '2025-01-14 16:45',
      fechaValidacion: '2025-01-14 17:30',
      resultados: {
        'Beta-HCG': { valor: '1200 mUI/mL', referencia: '<5 mUI/mL', estado: 'Positivo' },
        'Grupo Sanguíneo': { valor: 'O+', referencia: '-', estado: 'Normal' },
        'TSH': { valor: '2.3 µUI/mL', referencia: '0.4-4.0 µUI/mL', estado: 'Normal' },
        'Hemoglobina': { valor: '12.5 g/dL', referencia: '12-16 g/dL', estado: 'Normal' },
      },
    },
    {
      id: 'LAB-2025-004',
      paciente: { nombre: 'Pedro Jiménez', cedula: '7891234560', edad: 55 },
      medico: { nombre: 'Dr. Carlos Méndez', especialidad: 'Medicina Interna' },
      examenes: ['HbA1c', 'Glucosa', 'Insulina', 'Microalbuminuria'],
      prioridad: 'Alta',
      estado: 'Completado',
      fechaSolicitud: '2025-01-13 10:00',
      fechaRealizacion: '2025-01-13 15:30',
      fechaValidacion: '2025-01-13 18:00',
      resultados: {
        'HbA1c': { valor: '8.5%', referencia: '<5.7%', estado: 'Alto' },
        'Glucosa': { valor: '180 mg/dL', referencia: '70-100 mg/dL', estado: 'Alto' },
        'Insulina': { valor: '15 µU/mL', referencia: '2-20 µU/mL', estado: 'Normal' },
      },
    },
  ]);

  // Datos mockeados para gráficas de evolución
  const datosGlucosa = [
    { fecha: '01/12', valor: 165 },
    { fecha: '08/12', valor: 172 },
    { fecha: '15/12', valor: 168 },
    { fecha: '22/12', valor: 180 },
    { fecha: '29/12', valor: 175 },
    { fecha: '05/01', valor: 185 },
    { fecha: '12/01', valor: 180 },
  ];

  const getBadgeVariant = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'secondary';
      case 'EnProceso': return 'default';
      case 'Completado': return 'default';
      case 'Validado': return 'default';
      case 'Cancelado': return 'destructive';
      default: return 'secondary';
    }
  };

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'EnProceso': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Completado': return 'bg-green-100 text-green-800 border-green-300';
      case 'Validado': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Urgente': return 'bg-red-100 text-red-800 border-red-300';
      case 'Alta': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Baja': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getResultadoColor = (estado) => {
    switch (estado) {
      case 'Alto': return 'text-red-600 font-semibold';
      case 'Bajo': return 'text-orange-600 font-semibold';
      case 'Crítico': return 'text-red-800 font-bold';
      case 'Normal': return 'text-green-600';
      case 'Positivo': return 'text-blue-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  const ordenesFiltradas = ordenes.filter(orden => {
    const matchSearch = searchTerm === '' ||
      orden.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orden.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orden.paciente.cedula.includes(searchTerm);
    
    const matchTab = 
      (activeTab === 'pendientes' && orden.estado === 'Pendiente') ||
      (activeTab === 'proceso' && orden.estado === 'EnProceso') ||
      (activeTab === 'completados' && orden.estado === 'Completado') ||
      (activeTab === 'todos');
    
    return matchSearch && matchTab;
  });

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-700 rounded-lg shadow-lg">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Laboratorio Clínico</h1>
              <p className="text-sm text-gray-600">Gestión de Órdenes y Resultados</p>
            </div>
          </div>
          <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Orden de Laboratorio</DialogTitle>
              </DialogHeader>
              <FormularioNuevaOrden onClose={() => setShowNewOrder(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Proceso</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completados Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Mes</p>
                  <p className="text-2xl font-bold text-gray-900">248</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
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

        {/* Tabs de Órdenes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border shadow-sm">
            <TabsTrigger value="pendientes" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="proceso" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              En Proceso
            </TabsTrigger>
            <TabsTrigger value="completados" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              Completados
            </TabsTrigger>
            <TabsTrigger value="todos" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              Todos
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Orden</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Exámenes</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordenesFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No se encontraron órdenes
                        </TableCell>
                      </TableRow>
                    ) : (
                      ordenesFiltradas.map((orden) => (
                        <TableRow key={orden.id}>
                          <TableCell className="font-medium">{orden.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{orden.paciente.nombre}</p>
                              <p className="text-xs text-gray-500">CC: {orden.paciente.cedula}</p>
                              <p className="text-xs text-gray-500">{orden.paciente.edad} años</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{orden.medico.nombre}</p>
                              <p className="text-xs text-gray-500">{orden.medico.especialidad}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {orden.examenes.slice(0, 2).map((examen, idx) => (
                                <Badge key={idx} variant="outline" className="mr-1 mb-1 text-xs">
                                  {examen}
                                </Badge>
                              ))}
                              {orden.examenes.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{orden.examenes.length - 2} más
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPrioridadColor(orden.prioridad)}>
                              {orden.prioridad}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getBadgeColor(orden.estado)}>
                              {orden.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {orden.fechaSolicitud}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrder(orden);
                                  setShowResults(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {orden.estado === 'Completado' && (
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4" />
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

        {/* Dialog de Resultados */}
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Resultados de Laboratorio</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <DetalleResultados orden={selectedOrder} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Componente de Formulario de Nueva Orden
function FormularioNuevaOrden({ onClose }) {
  const [formData, setFormData] = useState({
    paciente: '',
    medico: '',
    prioridad: 'Normal',
    examenes: [],
    observaciones: '',
  });

  const examenesDisponibles = [
    'Hemograma Completo',
    'Glucosa',
    'Creatinina',
    'Perfil Lipídico',
    'TSH',
    'T3',
    'T4',
    'HbA1c',
    'Troponinas',
    'CPK-MB',
    'BNP',
    'Electrolitos',
    'Urea',
    'Ácido Úrico',
    'Transaminasas',
    'Bilirrubinas',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar al backend
    alert('Orden creada exitosamente (mockup)');
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
          <Label>Médico Solicitante *</Label>
          <Input value="Usuario actual" disabled />
        </div>
      </div>

      <div>
        <Label>Prioridad *</Label>
        <Select value={formData.prioridad} onValueChange={(val) => setFormData({...formData, prioridad: val})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Urgente">Urgente</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Exámenes Solicitados *</Label>
        <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded p-3">
          {examenesDisponibles.map((examen) => (
            <label key={examen} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" />
              {examen}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Observaciones</Label>
        <Textarea
          placeholder="Indicaciones especiales, ayuno, medicación, etc."
          value={formData.observaciones}
          onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-700">
          Crear Orden
        </Button>
      </div>
    </form>
  );
}

// Componente de Detalle de Resultados
function DetalleResultados({ orden }) {
  return (
    <div className="space-y-6">
      {/* Información de la Orden */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información de la Orden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">ID Orden</p>
              <p className="font-medium">{orden.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge className={`bg-${orden.estado === 'Completado' ? 'green' : 'yellow'}-100 text-${orden.estado === 'Completado' ? 'green' : 'yellow'}-800`}>
                {orden.estado}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paciente</p>
              <p className="font-medium">{orden.paciente.nombre}</p>
              <p className="text-xs text-gray-500">CC: {orden.paciente.cedula} - {orden.paciente.edad} años</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Médico</p>
              <p className="font-medium">{orden.medico.nombre}</p>
              <p className="text-xs text-gray-500">{orden.medico.especialidad}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {orden.resultados && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Examen</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Valores de Referencia</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(orden.resultados).map(([examen, datos]) => (
                  <TableRow key={examen}>
                    <TableCell className="font-medium">{examen}</TableCell>
                    <TableCell className={getResultadoColor(datos.estado)}>
                      {datos.valor}
                    </TableCell>
                    <TableCell className="text-gray-600">{datos.referencia}</TableCell>
                    <TableCell>
                      <Badge className={`bg-${datos.estado === 'Normal' ? 'green' : datos.estado === 'Alto' ? 'red' : 'orange'}-100 text-${datos.estado === 'Normal' ? 'green' : datos.estado === 'Alto' ? 'red' : 'orange'}-800`}>
                        {datos.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Gráfica de Evolución (ejemplo con glucosa) */}
      {orden.resultados && orden.resultados['Glucosa'] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolución de Glucosa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[
                { fecha: '01/12', valor: 165 },
                { fecha: '08/12', valor: 172 },
                { fecha: '15/12', valor: 168 },
                { fecha: '22/12', valor: 180 },
                { fecha: '29/12', valor: 175 },
                { fecha: '05/01', valor: 185 },
                { fecha: '12/01', valor: 180 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke="#8b5cf6" strokeWidth={2} name="Glucosa (mg/dL)" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Tendencia al alza. Considerar ajuste de tratamiento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-700">
          <FileText className="w-4 h-4 mr-2" />
          Enviar a HCE
        </Button>
      </div>
    </div>
  );
}

function getResultadoColor(estado) {
  switch (estado) {
    case 'Alto': return 'text-red-600 font-semibold';
    case 'Bajo': return 'text-orange-600 font-semibold';
    case 'Crítico': return 'text-red-800 font-bold';
    case 'Normal': return 'text-green-600';
    case 'Positivo': return 'text-blue-600 font-semibold';
    default: return 'text-gray-600';
  }
}
