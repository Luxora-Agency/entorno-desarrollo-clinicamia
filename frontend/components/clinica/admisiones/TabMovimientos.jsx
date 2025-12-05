'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowRightLeft, 
  LogIn, 
  LogOut, 
  BedDouble, 
  Calendar, 
  User, 
  MapPin,
  Plus,
  Clock
} from 'lucide-react';

export default function TabMovimientos({ pacienteId, user }) {
  const [movimientos, setMovimientos] = useState([]);
  const [admisiones, setAdmisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Datos para el modal de nuevo movimiento
  const [unidades, setUnidades] = useState([]);
  const [camasDisponibles, setCamasDisponibles] = useState([]);
  const [formData, setFormData] = useState({
    admisionId: '',
    tipo: 'Traslado',
    unidadDestinoId: '',
    camaDestinoId: '',
    motivo: '',
    observaciones: '',
  });

  useEffect(() => {
    if (pacienteId) {
      cargarDatos();
    }
  }, [pacienteId]);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Cargar admisiones del paciente para obtener movimientos
      const respAdmisiones = await fetch(`/api/admisiones?pacienteId=${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataAdmisiones = await respAdmisiones.json();
      
      if (dataAdmisiones.success) {
        const admisionesData = dataAdmisiones.data.admisiones || [];
        setAdmisiones(admisionesData);
        
        // Obtener todos los movimientos de todas las admisiones
        const todosMovimientos = [];
        for (const admision of admisionesData) {
          const respMovimientos = await fetch(`/api/movimientos?admisionId=${admision.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const dataMovimientos = await respMovimientos.json();
          
          if (dataMovimientos.success) {
            const movs = dataMovimientos.data.movimientos || [];
            // Agregar información de la admisión a cada movimiento
            movs.forEach(mov => {
              mov.admision = admision;
            });
            todosMovimientos.push(...movs);
          }
        }
        
        // Ordenar por fecha más reciente primero
        todosMovimientos.sort((a, b) => 
          new Date(b.fechaMovimiento) - new Date(a.fechaMovimiento)
        );
        
        setMovimientos(todosMovimientos);
      }
      
      // Cargar unidades para el modal
      const respUnidades = await fetch('/api/unidades?activo=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataUnidades = await respUnidades.json();
      if (dataUnidades.success) {
        setUnidades(dataUnidades.data.unidades || []);
      }
      
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarCamasDisponibles = async (unidadId) => {
    try {
      const token = localStorage.getItem('token');
      const url = unidadId 
        ? `/api/camas/disponibles?unidadId=${unidadId}`
        : '/api/camas/disponibles';
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setCamasDisponibles(data.data.camas || []);
      }
    } catch (error) {
      console.error('Error al cargar camas:', error);
    }
  };

  const handleUnidadChange = (unidadId) => {
    setFormData({ ...formData, unidadDestinoId: unidadId, camaDestinoId: '' });
    cargarCamasDisponibles(unidadId);
  };

  const handleCrearMovimiento = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Obtener la admisión activa para obtener la cama/unidad origen
      const admisionActiva = admisiones.find(a => a.estado === 'Activa');
      if (!admisionActiva) {
        alert('El paciente no tiene una admisión activa');
        return;
      }
      
      const response = await fetch('/api/movimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          admisionId: admisionActiva.id,
          tipo: formData.tipo,
          unidadOrigenId: admisionActiva.unidadId,
          unidadDestinoId: formData.unidadDestinoId,
          camaOrigenId: admisionActiva.camaId,
          camaDestinoId: formData.camaDestinoId,
          motivo: formData.motivo,
          observaciones: formData.observaciones,
          responsable: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Movimiento registrado exitosamente');
        setShowModal(false);
        resetForm();
        cargarDatos();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al crear movimiento:', error);
      alert('Error al registrar el movimiento');
    }
  };

  const resetForm = () => {
    setFormData({
      admisionId: '',
      tipo: 'Traslado',
      unidadDestinoId: '',
      camaDestinoId: '',
      motivo: '',
      observaciones: '',
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIconoMovimiento = (tipo) => {
    switch(tipo) {
      case 'Ingreso':
        return <LogIn className="w-5 h-5 text-green-600" />;
      case 'Egreso':
        return <LogOut className="w-5 h-5 text-red-600" />;
      case 'Traslado':
        return <ArrowRightLeft className="w-5 h-5 text-blue-600" />;
      case 'Cambio de Cama':
        return <BedDouble className="w-5 h-5 text-purple-600" />;
      default:
        return <MapPin className="w-5 h-5 text-gray-600" />;
    }
  };

  const getColorMovimiento = (tipo) => {
    switch(tipo) {
      case 'Ingreso':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Egreso':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Traslado':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cambio de Cama':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const admisionActiva = admisiones.find(a => a.estado === 'Activa');

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Cargando movimientos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de nuevo movimiento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial de Movimientos</CardTitle>
            {admisionActiva && (
              <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Registrar Traslado
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Registrar Traslado de Paciente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm">
                      <p className="text-blue-800 font-medium">Ubicación Actual:</p>
                      <p className="text-blue-700">
                        {admisionActiva.unidad?.nombre} - Habitación {admisionActiva.cama?.habitacion?.numero} - Cama {admisionActiva.cama?.numero}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unidadDestino">Nueva Unidad *</Label>
                        <Select value={formData.unidadDestinoId} onValueChange={handleUnidadChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidades.map((unidad) => (
                              <SelectItem key={unidad.id} value={unidad.id}>
                                {unidad.nombre} ({unidad.tipo})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="camaDestino">Nueva Cama *</Label>
                        <Select 
                          value={formData.camaDestinoId} 
                          onValueChange={(value) => setFormData({ ...formData, camaDestinoId: value })}
                          disabled={!formData.unidadDestinoId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cama" />
                          </SelectTrigger>
                          <SelectContent>
                            {camasDisponibles.map((cama) => (
                              <SelectItem key={cama.id} value={cama.id}>
                                Hab. {cama.habitacion?.numero} - Cama {cama.numero}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="motivo">Motivo del Traslado *</Label>
                      <Textarea
                        id="motivo"
                        value={formData.motivo}
                        onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                        placeholder="Ej: Mejoría del paciente, Requiere cuidados especiales..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        placeholder="Notas adicionales..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowModal(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCrearMovimiento}
                      disabled={
                        !formData.unidadDestinoId || 
                        !formData.camaDestinoId || 
                        !formData.motivo.trim()
                      }
                    >
                      Registrar Traslado
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!admisionActiva && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              ℹ️ El paciente no está actualmente hospitalizado. No se pueden registrar traslados.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline de Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Línea de Tiempo</CardTitle>
        </CardHeader>
        <CardContent>
          {movimientos.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="relative">
              {/* Línea vertical del timeline */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Movimientos */}
              <div className="space-y-6">
                {movimientos.map((movimiento, index) => (
                  <div key={movimiento.id} className="relative pl-16">
                    {/* Círculo del timeline */}
                    <div className="absolute left-6 top-1 w-5 h-5 rounded-full bg-white border-4 border-gray-300 z-10"></div>
                    
                    {/* Card del movimiento */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            movimiento.tipo === 'Ingreso' ? 'bg-green-100' :
                            movimiento.tipo === 'Egreso' ? 'bg-red-100' :
                            movimiento.tipo === 'Traslado' ? 'bg-blue-100' :
                            'bg-purple-100'
                          }`}>
                            {getIconoMovimiento(movimiento.tipo)}
                          </div>
                          <div>
                            <Badge className={getColorMovimiento(movimiento.tipo)}>
                              {movimiento.tipo}
                            </Badge>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatearFecha(movimiento.fechaMovimiento)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Detalles del movimiento */}
                      <div className="space-y-2 text-sm">
                        {movimiento.tipo === 'Traslado' && (
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                            <div>
                              <p className="text-gray-600 font-medium mb-1">Desde:</p>
                              <p className="text-gray-800">
                                {movimiento.unidadOrigen?.nombre || 'N/A'}
                              </p>
                              {movimiento.camaOrigen && (
                                <p className="text-xs text-gray-600">
                                  Cama: {movimiento.camaOrigen.numero}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium mb-1">Hacia:</p>
                              <p className="text-gray-800">
                                {movimiento.unidadDestino?.nombre || 'N/A'}
                              </p>
                              {movimiento.camaDestino && (
                                <p className="text-xs text-gray-600">
                                  Cama: {movimiento.camaDestino.numero}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {movimiento.tipo === 'Ingreso' && movimiento.unidadDestino && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-gray-600 font-medium mb-1">Ingreso a:</p>
                            <p className="text-gray-800">{movimiento.unidadDestino.nombre}</p>
                            {movimiento.camaDestino && (
                              <p className="text-xs text-gray-600">Cama: {movimiento.camaDestino.numero}</p>
                            )}
                          </div>
                        )}

                        {movimiento.tipo === 'Egreso' && movimiento.unidadOrigen && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-gray-600 font-medium mb-1">Egreso desde:</p>
                            <p className="text-gray-800">{movimiento.unidadOrigen.nombre}</p>
                            {movimiento.camaOrigen && (
                              <p className="text-xs text-gray-600">Cama: {movimiento.camaOrigen.numero}</p>
                            )}
                          </div>
                        )}

                        {movimiento.motivo && (
                          <div className="mt-2">
                            <p className="text-gray-600 font-medium">Motivo:</p>
                            <p className="text-gray-800">{movimiento.motivo}</p>
                          </div>
                        )}

                        {movimiento.observaciones && (
                          <div className="mt-2">
                            <p className="text-gray-600 font-medium">Observaciones:</p>
                            <p className="text-gray-800">{movimiento.observaciones}</p>
                          </div>
                        )}

                        {movimiento.responsableInfo ? (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            Registrado por: {movimiento.responsableInfo.nombre} ({movimiento.responsableInfo.rol})
                          </div>
                        ) : movimiento.responsable && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            Registrado por: Usuario (ID: {movimiento.responsable.substring(0, 8)}...)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
