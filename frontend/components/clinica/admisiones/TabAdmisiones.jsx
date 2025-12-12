'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bed, Calendar, Clock, AlertCircle, CheckCircle, PlusCircle, LogOut } from 'lucide-react';

export default function TabAdmisiones({ pacienteId, paciente, user, onChangeTab }) {
  const [admisiones, setAdmisiones] = useState([]);
  const [admisionActiva, setAdmisionActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModalIngreso, setShowModalIngreso] = useState(false);
  
  // Datos para formularios
  const [unidades, setUnidades] = useState([]);
  const [camasDisponibles, setCamasDisponibles] = useState([]);
  const [formIngreso, setFormIngreso] = useState({
    unidadId: '',
    camaId: '',
    motivoIngreso: '',
    diagnosticoIngreso: '',
  });

  useEffect(() => {
    if (pacienteId) {
      cargarAdmisiones();
      cargarUnidades();
    }
  }, [pacienteId]);

  const cargarAdmisiones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admisiones?pacienteId=${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        const admisionesData = data.data.admisiones || [];
        setAdmisiones(admisionesData);
        
        // Buscar admisión activa
        const activa = admisionesData.find(a => a.estado === 'Activa');
        setAdmisionActiva(activa);
      }
    } catch (error) {
      console.error('Error al cargar admisiones:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/unidades?activo=true', {
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
        let camas = data.data.camas || [];
        
        // Filtrar por género si la habitación es compartida
        if (paciente?.genero) {
          camas = camas.filter(cama => {
            const habitacion = cama.habitacion;
            
            // Si es habitación individual, no hay restricción
            if (habitacion?.tipo === 'Individual' || habitacion?.capacidad === 1) {
              return true;
            }
            
            // Si es habitación compartida, validar género
            // Solo mostrar si la habitación está vacía o tiene pacientes del mismo género
            // Esta validación se haría mejor en backend, pero por ahora lo hacemos aquí
            return true; // Permitir por ahora, validación completa requiere consultar pacientes en otras camas
          });
        }
        
        setCamasDisponibles(camas);
      }
    } catch (error) {
      console.error('Error al cargar camas:', error);
    }
  };

  const handleUnidadChange = (unidadId) => {
    setFormIngreso({ ...formIngreso, unidadId, camaId: '' });
    cargarCamasDisponibles(unidadId);
  };

  const handleIniciarAdmision = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admisiones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId,
          unidadId: formIngreso.unidadId,
          camaId: formIngreso.camaId,
          motivoIngreso: formIngreso.motivoIngreso,
          diagnosticoIngreso: formIngreso.diagnosticoIngreso,
          responsableIngreso: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Admisión registrada exitosamente');
        setShowModalIngreso(false);
        setFormIngreso({
          unidadId: '',
          camaId: '',
          motivoIngreso: '',
          diagnosticoIngreso: '',
        });
        cargarAdmisiones();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al iniciar admisión:', error);
      alert('Error al registrar la admisión');
    }
  };

  const handleIrAEgreso = () => {
    if (onChangeTab) {
      onChangeTab('egreso');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calcularDiasHospitalizacion = (fechaIngreso) => {
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diferencia = hoy - ingreso;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Cargando información de admisiones...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado Actual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Estado Actual de Hospitalización</CardTitle>
            {admisionActiva ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Hospitalizado
              </Badge>
            ) : (
              <Badge variant="success" className="flex items-center gap-1 bg-green-500 text-white">
                <CheckCircle className="w-4 h-4" />
                No Hospitalizado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {admisionActiva ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Bed className="w-4 h-4" />
                    <span className="font-medium">Unidad:</span>
                    <span>{admisionActiva.unidad?.nombre || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Bed className="w-4 h-4" />
                    <span className="font-medium">Cama:</span>
                    <span>
                      {admisionActiva.cama 
                        ? `Habitación ${admisionActiva.cama.habitacion?.numero} - Cama ${admisionActiva.cama.numero}`
                        : '-'}
                    </span>
                    {admisionActiva.cama?.habitacion?.tipo && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {admisionActiva.cama.habitacion.tipo}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Fecha Ingreso:</span>
                    <span>{formatearFecha(admisionActiva.fechaIngreso)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Días Hospitalizado:</span>
                    <span className="font-bold text-blue-600">
                      {calcularDiasHospitalizacion(admisionActiva.fechaIngreso)} días
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Diagnóstico de Ingreso:</p>
                <p className="text-sm text-gray-600">{admisionActiva.diagnosticoIngreso}</p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={handleIrAEgreso}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Ir a Egreso Completo
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">El paciente no está actualmente hospitalizado</p>
              <Dialog open={showModalIngreso} onOpenChange={setShowModalIngreso}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Iniciar Admisión
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Iniciar Admisión Hospitalaria</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unidad">Unidad *</Label>
                        <Select value={formIngreso.unidadId} onValueChange={handleUnidadChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(unidades) && unidades.map((unidad) => (
                              <SelectItem key={unidad.id} value={unidad.id}>
                                {unidad.nombre} ({unidad.tipo})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cama">Cama *</Label>
                        <Select 
                          value={formIngreso.camaId} 
                          onValueChange={(value) => setFormIngreso({ ...formIngreso, camaId: value })}
                          disabled={!formIngreso.unidadId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cama" />
                          </SelectTrigger>
                          <SelectContent>
                            {camasDisponibles.length === 0 && formIngreso.unidadId ? (
                              <div className="p-2 text-center text-sm text-gray-500">
                                No hay camas disponibles en esta unidad
                              </div>
                            ) : (
                              camasDisponibles.map((cama) => (
                                <SelectItem key={cama.id} value={cama.id}>
                                  Hab. {cama.habitacion?.numero} - Cama {cama.numero}
                                  {cama.habitacion?.tipo && ` (${cama.habitacion.tipo})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {formIngreso.unidadId && camasDisponibles.length === 0 && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            No hay camas disponibles en esta unidad
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="motivoIngreso">Motivo de Ingreso *</Label>
                      <Input
                        id="motivoIngreso"
                        value={formIngreso.motivoIngreso}
                        onChange={(e) => setFormIngreso({ ...formIngreso, motivoIngreso: e.target.value })}
                        placeholder="Ej: Observación médica, Cirugía programada..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="diagnosticoIngreso">Diagnóstico de Ingreso *</Label>
                      <Textarea
                        id="diagnosticoIngreso"
                        value={formIngreso.diagnosticoIngreso}
                        onChange={(e) => setFormIngreso({ ...formIngreso, diagnosticoIngreso: e.target.value })}
                        placeholder="Descripción detallada del diagnóstico..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowModalIngreso(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleIniciarAdmision}
                      disabled={
                        !formIngreso.unidadId || 
                        !formIngreso.camaId || 
                        !formIngreso.motivoIngreso.trim() || 
                        !formIngreso.diagnosticoIngreso.trim()
                      }
                    >
                      Iniciar Admisión
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Admisiones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Admisiones</CardTitle>
        </CardHeader>
        <CardContent>
          {admisiones.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay historial de admisiones</p>
          ) : (
            <div className="space-y-3">
              {admisiones.map((admision) => (
                <div
                  key={admision.id}
                  className={`border rounded-lg p-4 ${
                    admision.estado === 'Activa' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={admision.estado === 'Activa' ? 'default' : 'secondary'}>
                        {admision.estado}
                      </Badge>
                      <span className="text-sm font-medium">{admision.unidad?.nombre}</span>
                    </div>
                    {admision.estado === 'Egresada' && (
                      <span className="text-sm text-gray-600">
                        {calcularDiasHospitalizacion(admision.fechaIngreso)} días hospitalizado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Ingreso:</span>
                      <span className="ml-2 font-medium">{formatearFecha(admision.fechaIngreso)}</span>
                    </div>
                    {admision.fechaEgreso && (
                      <div>
                        <span className="text-gray-600">Egreso:</span>
                        <span className="ml-2 font-medium">{formatearFecha(admision.fechaEgreso)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Diagnóstico Ingreso:</span> {admision.diagnosticoIngreso}
                    </p>
                    {admision.responsableIngresoInfo && (
                      <p className="text-xs text-gray-500 mt-1">
                        Responsable: {admision.responsableIngresoInfo.nombre} ({admision.responsableIngresoInfo.rol})
                      </p>
                    )}
                    {admision.diagnosticoEgreso && (
                      <p className="text-gray-600 mt-1">
                        <span className="font-medium">Diagnóstico Egreso:</span> {admision.diagnosticoEgreso}
                      </p>
                    )}
                    {admision.responsableEgresoInfo && (
                      <p className="text-xs text-gray-500 mt-1">
                        Responsable: {admision.responsableEgresoInfo.nombre} ({admision.responsableEgresoInfo.rol})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
