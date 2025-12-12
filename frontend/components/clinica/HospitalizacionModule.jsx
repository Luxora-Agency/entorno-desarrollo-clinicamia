'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Bed, 
  User,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Clock,
  Users,
  Calendar,
  RefreshCw
} from 'lucide-react';

export default function HospitalizacionModule({ user }) {
  const [habitaciones, setHabitaciones] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState('all');
  const [camaSeleccionada, setCamaSeleccionada] = useState(null);
  const [showModalCama, setShowModalCama] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarDatos();
    cargarUnidades();
    
    // Refresh automático cada 30 segundos
    const interval = setInterval(() => {
      cargarDatos(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [unidadSeleccionada]);

  const cargarDatos = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const token = localStorage.getItem('token');
      const unidadParam = unidadSeleccionada !== 'all' ? `?unidadId=${unidadSeleccionada}` : '';
      
      const [mapaRes, statsRes] = await Promise.all([
        fetch(`/api/camas/mapa${unidadParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/camas/estadisticas${unidadParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [mapaData, statsData] = await Promise.all([
        mapaRes.json(),
        statsRes.json(),
      ]);

      if (mapaData.success) {
        setHabitaciones(mapaData.data.habitaciones || []);
      }

      if (statsData.success) {
        setEstadisticas(statsData.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cargarUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/unidades', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setUnidades(data.data.unidades || []);
      }
    } catch (error) {
      console.error('Error al cargar unidades:', error);
    }
  };

  const handleCambiarEstado = async (camaId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/camas/${camaId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          motivo: motivo || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Estado actualizado correctamente');
        setShowModalCama(false);
        setCamaSeleccionada(null);
        setMotivo('');
        cargarDatos();
      } else {
        alert(`Error: ${data.message || 'No se pudo actualizar el estado'}`);
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado de la cama');
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      Disponible: 'bg-green-500',
      Ocupada: 'bg-red-500',
      Mantenimiento: 'bg-yellow-500',
      Reservada: 'bg-blue-500',
    };
    return colors[estado] || 'bg-gray-300';
  };

  const getEstadoBadge = (estado) => {
    const config = {
      Disponible: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      Ocupada: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
      Mantenimiento: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle },
      Reservada: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    };
    return config[estado] || config.Disponible;
  };

  const calcularDiasHospitalizacion = (fechaIngreso) => {
    if (!fechaIngreso) return 0;
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);
    const diff = hoy - ingreso;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Activity className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Cargando mapa de hospitalización...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapa de Hospitalización</h1>
            <p className="text-sm text-gray-600">Vista en tiempo real de ocupación de camas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={unidadSeleccionada} onValueChange={setUnidadSeleccionada}>
            <SelectTrigger className="w-[200px] bg-white border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Unidades</SelectItem>
              {Array.isArray(unidades) && unidades.map((unidad) => (
                <SelectItem key={unidad.id} value={unidad.id}>
                  {unidad.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => cargarDatos()}
            variant="outline"
            className="border-2"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Dashboard de Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="border-2 border-blue-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bed className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Camas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.total_camas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.disponibles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Users className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Ocupadas</p>
                  <p className="text-2xl font-bold text-red-600">{estadisticas.ocupadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Limpieza</p>
                  <p className="text-2xl font-bold text-yellow-600">{estadisticas.en_limpieza}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Activity className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Ocupación</p>
                  <p className="text-2xl font-bold text-indigo-600">{estadisticas.porcentaje_ocupacion}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mapa de Habitaciones */}
      <div className="space-y-6">
        {habitaciones.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <Bed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay habitaciones en esta unidad</p>
            </CardContent>
          </Card>
        ) : (
          habitaciones.map((habitacion) => (
            <Card key={habitacion.id} className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Habitación {habitacion.numero}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {habitacion.unidad?.nombre} • {habitacion.tipo} • Cap: {habitacion.capacidad}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {habitacion.servicios && (
                      <Badge variant="outline" className="text-xs">
                        {habitacion.servicios}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {habitacion.camas && habitacion.camas.length > 0 ? (
                    habitacion.camas.map((cama) => {
                      const estadoConfig = getEstadoBadge(cama.estado);
                      const IconoEstado = estadoConfig.icon;
                      const admisionActiva = cama.admisiones?.find(a => a.estado === 'Activa');
                      const paciente = admisionActiva?.paciente;
                      const diasHospitalizacion = admisionActiva ? calcularDiasHospitalizacion(admisionActiva.fechaIngreso) : 0;

                      return (
                        <Card
                          key={cama.id}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            cama.estado === 'Ocupada' ? 'border-red-300' : 
                            cama.estado === 'Disponible' ? 'border-green-300' :
                            cama.estado === 'Mantenimiento' ? 'border-yellow-300' :
                            'border-gray-300'
                          }`}
                          onClick={() => {
                            setCamaSeleccionada(cama);
                            setShowModalCama(true);
                          }}
                        >
                          <CardContent className="p-4">
                            {/* Header de la cama */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Bed className="w-5 h-5 text-gray-600" />
                                <span className="font-bold text-gray-900">Cama {cama.numero}</span>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${getEstadoColor(cama.estado)} animate-pulse`} />
                            </div>

                            {/* Estado */}
                            <Badge className={`${estadoConfig.color} border mb-3 w-full justify-center`}>
                              <IconoEstado className="w-3 h-3 mr-1" />
                              {cama.estado}
                            </Badge>

                            {/* Información del paciente si está ocupada */}
                            {paciente ? (
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-700">
                                  <User className="w-4 h-4" />
                                  <span className="font-semibold truncate">
                                    {paciente.nombre} {paciente.apellido}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 text-xs">
                                  <Calendar className="w-3 h-3" />
                                  <span>{diasHospitalizacion} {diasHospitalizacion === 1 ? 'día' : 'días'}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-sm py-2">
                                {cama.estado === 'Disponible' ? 'Lista para asignar' : 
                                 cama.estado === 'Mantenimiento' ? 'Requiere limpieza' : 
                                 'No disponible'}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center text-gray-500 py-4">
                      No hay camas en esta habitación
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Detalles de Cama */}
      <Dialog open={showModalCama} onOpenChange={setShowModalCama}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-indigo-600" />
              Cama {camaSeleccionada?.numero}
            </DialogTitle>
          </DialogHeader>
          
          {camaSeleccionada && (
            <div className="space-y-4">
              {/* Estado actual */}
              <div>
                <Label className="text-sm font-semibold mb-2">Estado Actual</Label>
                <Badge className={`${getEstadoBadge(camaSeleccionada.estado).color} border w-full justify-center py-2`}>
                  {camaSeleccionada.estado}
                </Badge>
              </div>

              {/* Información del paciente si está ocupada */}
              {camaSeleccionada.admisiones?.[0]?.paciente && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <Label className="text-sm font-semibold mb-2 block">Paciente Actual</Label>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">
                        {camaSeleccionada.admisiones[0].paciente.nombre}{' '}
                        {camaSeleccionada.admisiones[0].paciente.apellido}
                      </p>
                      <p className="text-gray-600">
                        CC: {camaSeleccionada.admisiones[0].paciente.cedula}
                      </p>
                      <p className="text-gray-600">
                        Ingreso: {new Date(camaSeleccionada.admisiones[0].fechaIngreso).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Acciones rápidas */}
              {camaSeleccionada.estado !== 'Ocupada' && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Cambiar Estado</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {camaSeleccionada.estado !== 'Disponible' && (
                      <Button
                        onClick={() => handleCambiarEstado(camaSeleccionada.id, 'Disponible')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Disponible
                      </Button>
                    )}
                    {camaSeleccionada.estado !== 'Mantenimiento' && (
                      <Button
                        onClick={() => handleCambiarEstado(camaSeleccionada.id, 'Mantenimiento')}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Limpieza
                      </Button>
                    )}
                    {camaSeleccionada.estado !== 'Reservada' && (
                      <Button
                        onClick={() => handleCambiarEstado(camaSeleccionada.id, 'Reservada')}
                        variant="outline"
                        className="col-span-2"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Reservada
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Motivo/Observaciones */}
              {camaSeleccionada.estado !== 'Ocupada' && (
                <div>
                  <Label htmlFor="motivo" className="text-sm font-semibold mb-2">
                    Observaciones (Opcional)
                  </Label>
                  <Textarea
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo del cambio de estado..."
                    rows={2}
                  />
                </div>
              )}

              {/* Alerta si está ocupada */}
              {camaSeleccionada.estado === 'Ocupada' && (
                <Card className="bg-amber-50 border-amber-300">
                  <CardContent className="p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Esta cama tiene un paciente asignado. Para liberarla, debe realizar el egreso del paciente en el módulo de Admisiones.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
