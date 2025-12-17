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
