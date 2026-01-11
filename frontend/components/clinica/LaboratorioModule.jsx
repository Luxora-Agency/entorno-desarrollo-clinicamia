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
  Trash2,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiGet, apiPost } from '@/services/api';
import { toast } from 'sonner';

export default function LaboratorioModule({ user }) {
  const [activeTab, setActiveTab] = useState('Pendiente');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showEnterResults, setShowEnterResults] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ pendientes: 0, proceso: 0, completados: 0, total: 0 });

  useEffect(() => {
    loadOrdenes();
  }, [activeTab]);

  const loadOrdenes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'todos') {
        params.estado = activeTab;
      }
      
      // Also fetch stats - ideally this would be a separate endpoint
      const response = await apiGet('/ordenes-medicas', params);
      if (response.data) {
        setOrdenes(response.data);
        
        // Calculate basic stats from current fetch (approximate)
        // In a real app, you'd want a specific endpoint for dashboard stats
        const allResponse = await apiGet('/ordenes-medicas', { limit: 1000 });
        if (allResponse.data) {
          const all = allResponse.data;
          setStats({
            pendientes: all.filter(o => o.estado === 'Pendiente').length,
            proceso: all.filter(o => o.estado === 'EnProceso').length,
            completados: all.filter(o => o.estado === 'Completada').length,
            total: all.length
          });
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCreated = () => {
    setShowNewOrder(false);
    loadOrdenes();
    toast.success('Orden creada exitosamente');
  };

  const handleResultsSaved = () => {
    setShowEnterResults(false);
    loadOrdenes();
    toast.success('Resultados guardados exitosamente');
  };

  const getBadgeVariant = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'secondary';
      case 'EnProceso': return 'default';
      case 'Completada': return 'default';
      case 'Cancelada': return 'destructive';
      default: return 'secondary';
    }
  };

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'EnProceso': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Completada': return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelada': return 'bg-red-100 text-red-800 border-red-300';
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

  const ordenesFiltradas = ordenes.filter(orden => {
    const searchLower = searchTerm.toLowerCase();
    return (
      searchTerm === '' ||
      orden.id.toLowerCase().includes(searchLower) ||
      (orden.paciente?.nombre || '').toLowerCase().includes(searchLower) ||
      (orden.paciente?.apellido || '').toLowerCase().includes(searchLower) ||
      (orden.paciente?.cedula || '').includes(searchLower)
    );
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
              <FormularioNuevaOrden onSuccess={handleOrderCreated} onCancel={() => setShowNewOrder(false)} user={user} />
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
                  <p className="text-2xl font-bold text-gray-900">{stats.pendientes}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.proceso}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completados}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
            <TabsTrigger value="Pendiente" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="EnProceso" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              En Proceso
            </TabsTrigger>
            <TabsTrigger value="Completada" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
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
                      <TableHead>Fecha</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Examen</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordenesFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          {loading ? 'Cargando...' : 'No se encontraron órdenes'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      ordenesFiltradas.map((orden) => (
                        <TableRow key={orden.id}>
                          <TableCell className="text-sm">
                            {new Date(orden.fechaOrden).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{orden.paciente?.nombre} {orden.paciente?.apellido}</p>
                              <p className="text-xs text-gray-500">CC: {orden.paciente?.cedula}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{orden.doctor?.nombre} {orden.doctor?.apellido}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {orden.examenProcedimiento?.nombre}
                            </Badge>
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
                              {(orden.estado === 'Pendiente' || orden.estado === 'EnProceso') && (
                                <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => {
                                    setSelectedOrder(orden);
                                    setShowEnterResults(true);
                                  }}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                              {orden.estado === 'Completada' && (
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

        {/* Dialog de Ver Resultados */}
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

        {/* Dialog de Ingresar Resultados */}
        <Dialog open={showEnterResults} onOpenChange={setShowEnterResults}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ingresar Resultados</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <IngresarResultados 
                orden={selectedOrder} 
                onSuccess={handleResultsSaved} 
                onCancel={() => setShowEnterResults(false)} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Componente de Formulario de Nueva Orden
function FormularioNuevaOrden({ onSuccess, onCancel, user }) {
  const [formData, setFormData] = useState({
    paciente_id: '',
    examen_procedimiento_id: '',
    doctor_id: user?.id || '', // Should be current user if doctor, or select
    prioridad: 'Normal',
    observaciones: '',
    precio_aplicado: 0
  });
  const [pacientes, setPacientes] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pacientesRes, examenesRes] = await Promise.all([
        apiGet('/pacientes', { limit: 100 }),
        apiGet('/examenes-procedimientos', { limit: 100 }) // Assuming filter by 'Examen' if needed
      ]);
      
      if (pacientesRes.data) setPacientes(pacientesRes.data);
      if (examenesRes.data) setExamenes(examenesRes.data);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost('/ordenes-medicas', formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error al crear la orden');
    } finally {
      setLoading(false);
    }
  };

  const handleExamenChange = (val) => {
    const examen = examenes.find(e => e.id === val);
    setFormData({
      ...formData, 
      examen_procedimiento_id: val,
      precio_aplicado: examen ? examen.costoBase : 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Paciente *</Label>
          <Select 
            value={formData.paciente_id} 
            onValueChange={(val) => setFormData({...formData, paciente_id: val})}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar paciente" />
            </SelectTrigger>
            <SelectContent>
              {pacientes.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} - {p.cedula}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Médico Solicitante *</Label>
          <Input value={user?.nombre || 'Usuario Actual'} disabled />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Examen / Procedimiento *</Label>
          <Select 
            value={formData.examen_procedimiento_id} 
            onValueChange={handleExamenChange}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar examen" />
            </SelectTrigger>
            <SelectContent>
              {examenes.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nombre} - ${e.costoBase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Prioridad *</Label>
          <Select value={formData.prioridad} onValueChange={(val) => setFormData({...formData, prioridad: val})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Urgente">Urgente</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
            </SelectContent>
          </Select>
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-700" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Orden'}
        </Button>
      </div>
    </form>
  );
}

// Componente para Ingresar Resultados
function IngresarResultados({ orden, onSuccess, onCancel }) {
  const [rows, setRows] = useState([
    { parametro: '', valor: '', unidad: '', referencia: '', estado: 'Normal' }
  ]);
  const [loading, setLoading] = useState(false);

  const addRow = () => {
    setRows([...rows, { parametro: '', valor: '', unidad: '', referencia: '', estado: 'Normal' }]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Convert rows to structured object
    const resultados = {};
    rows.forEach(row => {
      if (row.parametro) {
        resultados[row.parametro] = {
          valor: row.valor,
          unidad: row.unidad,
          referencia: row.referencia,
          estado: row.estado
        };
      }
    });

    try {
      await apiPost(`/ordenes-medicas/${orden.id}/completar`, { resultados });
      onSuccess();
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Error al guardar resultados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-gray-900">{orden.examenProcedimiento?.nombre}</h3>
        <p className="text-sm text-gray-500">Paciente: {orden.paciente?.nombre} {orden.paciente?.apellido}</p>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parámetro</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Ref.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input 
                    value={row.parametro} 
                    onChange={(e) => updateRow(index, 'parametro', e.target.value)}
                    placeholder="Ej. Hemoglobina"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={row.valor} 
                    onChange={(e) => updateRow(index, 'valor', e.target.value)}
                    placeholder="Valor"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={row.unidad} 
                    onChange={(e) => updateRow(index, 'unidad', e.target.value)}
                    placeholder="Unidad"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={row.referencia} 
                    onChange={(e) => updateRow(index, 'referencia', e.target.value)}
                    placeholder="Rango"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={row.estado} 
                    onValueChange={(val) => updateRow(index, 'estado', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                      <SelectItem value="Bajo">Bajo</SelectItem>
                      <SelectItem value="Critico">Crítico</SelectItem>
                      <SelectItem value="Positivo">Positivo</SelectItem>
                      <SelectItem value="Negativo">Negativo</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" onClick={addRow} className="w-full border-dashed">
        <Plus className="w-4 h-4 mr-2" /> Agregar Parámetro
      </Button>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar y Completar'}
        </Button>
      </div>
    </form>
  );
}

// Componente de Detalle de Resultados
function DetalleResultados({ orden }) {
  // Parse results if string
  let resultados = orden.resultados;
  if (typeof resultados === 'string') {
    try {
      resultados = JSON.parse(resultados);
    } catch (e) {
      // If not JSON, treat as plain text/object
    }
  }

  const isStructured = typeof resultados === 'object' && resultados !== null;

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
              <Badge variant="outline">{orden.estado}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paciente</p>
              <p className="font-medium">{orden.paciente?.nombre} {orden.paciente?.apellido}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Médico</p>
              <p className="font-medium">{orden.doctor?.nombre} {orden.doctor?.apellido}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {resultados && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            {isStructured ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Examen</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Ref.</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(resultados).map(([examen, datos]) => (
                    <TableRow key={examen}>
                      <TableCell className="font-medium">{examen}</TableCell>
                      <TableCell className={getResultadoColor(datos.estado)}>
                        {datos.valor}
                      </TableCell>
                      <TableCell className="text-gray-500">{datos.unidad}</TableCell>
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
            ) : (
              <div className="p-4 bg-gray-50 rounded text-gray-800 whitespace-pre-wrap">
                {String(resultados)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
      </div>
    </div>
  );
}

function getResultadoColor(estado) {
  switch (estado) {
    case 'Alto': return 'text-red-600 font-semibold';
    case 'Bajo': return 'text-orange-600 font-semibold';
    case 'Critico': return 'text-red-800 font-bold';
    case 'Normal': return 'text-green-600';
    case 'Positivo': return 'text-blue-600 font-semibold';
    default: return 'text-gray-600';
  }
}