'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Plus,
  MapPin,
  Calendar,
  Edit,
  Phone,
} from 'lucide-react';

export default function EnfermeriaModule({ user }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('resumen');
  const [enfermeras, setEnfermeras] = useState([]);
  const [enfermeraSeleccionada, setEnfermeraSeleccionada] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [asignaciones, setAsignaciones] = useState([]);
  const [unidades, setUnidades] = useState([]);
  
  const [formAsignacion, setFormAsignacion] = useState({
    enfermera_id: '',
    unidad_id: '',
    piso: '',
    turno: 'Manana',
  });

  useEffect(() => {
    loadEnfermeras();
    loadUnidades();
  }, []);

  useEffect(() => {
    if (enfermeraSeleccionada) {
      loadAsignaciones(enfermeraSeleccionada.id);
    }
  }, [enfermeraSeleccionada]);

  const loadEnfermeras = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/usuarios?rol=Enfermera&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEnfermeras(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/unidades?activo=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUnidades(data.data?.unidades || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadAsignaciones = async (enfermeraId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/asignaciones-enfermeria/enfermera/${enfermeraId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAsignaciones(data.data?.asignaciones || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCrearAsignacion = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/asignaciones-enfermeria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enfermera_id: enfermeraSeleccionada.id,
          unidad_id: formAsignacion.unidad_id,
          piso: formAsignacion.piso ? parseInt(formAsignacion.piso) : null,
          turno: formAsignacion.turno,
        }),
      });

      if (response.ok) {
        toast({ description: 'Asignación creada correctamente' });
        setShowAsignarModal(false);
        loadAsignaciones(enfermeraSeleccionada.id);
        setFormAsignacion({
          enfermera_id: '',
          unidad_id: '',
          piso: '',
          turno: 'Manana',
        });
      } else {
        const error = await response.json();
        toast({ description: error.message || 'Error al crear asignación', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ description: 'Error al crear asignación', variant: 'destructive' });
    }
  };

  const handleDesactivarAsignacion = async (asignacionId) => {
    if (!confirm('¿Desactivar esta asignación?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/asignaciones-enfermeria/${asignacionId}/desactivar`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({ description: 'Asignación desactivada' });
        loadAsignaciones(enfermeraSeleccionada.id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

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
            Gestión de Enfermería
          </h1>
          <p className="text-gray-600 mt-1">Administración de personal y asignaciones</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar enfermera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Lista de Enfermeras */}
      <Card className="shadow-lg border-l-4 border-teal-500">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Personal de Enfermería ({enfermeras.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-center py-8 text-gray-600">Cargando...</p>
          ) : (
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
                        <p className="font-bold text-lg text-gray-900">{enfermera.nombre} {enfermera.apellido}</p>
                        <p className="text-sm text-gray-600">{enfermera.email}</p>
                        <p className="text-xs text-gray-500 mt-1">CC: {enfermera.cedula}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        Activa
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {enfermera.telefono || 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalle de Enfermera Seleccionada */}
      {enfermeraSeleccionada && (
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Asignaciones de {enfermeraSeleccionada.nombre} {enfermeraSeleccionada.apellido}
              </CardTitle>
              <Dialog open={showAsignarModal} onOpenChange={setShowAsignarModal}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Asignación
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asignar Piso/Unidad</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Unidad *</Label>
                      <Select 
                        value={formAsignacion.unidad_id} 
                        onValueChange={(value) => setFormAsignacion({...formAsignacion, unidad_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar unidad..." />
                        </SelectTrigger>
                        <SelectContent>
                          {unidades.map(unidad => (
                            <SelectItem key={unidad.id} value={unidad.id}>
                              {unidad.nombre} - {unidad.tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Piso (Opcional)</Label>
                      <Input
                        type="number"
                        value={formAsignacion.piso}
                        onChange={(e) => setFormAsignacion({...formAsignacion, piso: e.target.value})}
                        placeholder="Ej: 1, 2, 3..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Dejar vacío para toda la unidad</p>
                    </div>
                    <div>
                      <Label>Turno *</Label>
                      <Select 
                        value={formAsignacion.turno} 
                        onValueChange={(value) => setFormAsignacion({...formAsignacion, turno: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manana">Mañana (06:00 - 14:00)</SelectItem>
                          <SelectItem value="Tarde">Tarde (14:00 - 22:00)</SelectItem>
                          <SelectItem value="Noche">Noche (22:00 - 06:00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowAsignarModal(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCrearAsignacion} className="bg-teal-600 hover:bg-teal-700">
                        Crear Asignación
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {asignaciones.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay asignaciones activas. Haz click en "Nueva Asignación" para crear una.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Piso</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asignaciones.map((asig) => (
                    <TableRow key={asig.id}>
                      <TableCell>{asig.unidad?.nombre}</TableCell>
                      <TableCell>{asig.piso || 'Toda la unidad'}</TableCell>
                      <TableCell>
                        <Badge>
                          {asig.turno === 'Manana' ? 'Mañana' : asig.turno === 'Tarde' ? 'Tarde' : 'Noche'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(asig.fechaInicio).toLocaleDateString('es-CO')}
                      </TableCell>
                      <TableCell>
                        <Badge className={asig.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {asig.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {asig.activo && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDesactivarAsignacion(asig.id)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
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
