'use client';

import { useState, useEffect } from 'react';
import {
  Clock, Calendar, Users, CheckCircle, XCircle,
  AlertTriangle, Plus, Search, Download, Palmtree,
  FileText, Eye, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useTalentoHumano from '@/hooks/useTalentoHumano';

const TIPOS_PERMISO = [
  { value: 'CALAMIDAD', label: 'Calamidad Domestica' },
  { value: 'CITA_MEDICA', label: 'Cita Medica' },
  { value: 'MATERNIDAD', label: 'Licencia de Maternidad' },
  { value: 'PATERNIDAD', label: 'Licencia de Paternidad' },
  { value: 'LICENCIA_NO_REMUNERADA', label: 'Licencia No Remunerada' },
  { value: 'PERSONAL', label: 'Permiso Personal' },
  { value: 'COMISION', label: 'Comision de Servicios' },
  { value: 'LUTO', label: 'Luto' },
  { value: 'MATRIMONIO', label: 'Matrimonio' },
  { value: 'ESTUDIO', label: 'Estudio' },
];

const TIPOS_VACACION = [
  { value: 'ORDINARIAS', label: 'Vacaciones Ordinarias' },
  { value: 'COMPENSADAS', label: 'Vacaciones Compensadas' },
  { value: 'ANTICIPADAS', label: 'Vacaciones Anticipadas' },
];

export default function AsistenciaTab({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('hoy');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showVacacionModal, setShowVacacionModal] = useState(false);
  const [showPermisoModal, setShowPermisoModal] = useState(false);
  const [showAsistenciaModal, setShowAsistenciaModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});

  const {
    asistencias, turnos, vacaciones, permisos, empleados, loading,
    fetchAsistencia, fetchTurnos, fetchVacaciones, fetchPermisos, fetchEmpleados,
    solicitarVacaciones, aprobarVacaciones, rechazarVacaciones,
    solicitarPermiso, aprobarPermiso, rechazarPermiso,
    registrarEntrada, registrarSalida
  } = useTalentoHumano();

  useEffect(() => {
    fetchAsistencia(selectedDate);
    fetchTurnos();
    fetchVacaciones();
    fetchPermisos();
    fetchEmpleados({ estado: 'ACTIVO' });
  }, [selectedDate]);

  const stats = {
    presentes: asistencias.filter(a => a.estado === 'PRESENTE').length,
    ausentes: asistencias.filter(a => a.estado === 'AUSENTE').length,
    tardanzas: asistencias.filter(a => a.estado === 'TARDANZA').length,
    permisos: asistencias.filter(a => a.estado === 'PERMISO').length,
  };

  const handleSolicitarVacaciones = async () => {
    try {
      await solicitarVacaciones(formData);
      setShowVacacionModal(false);
      setFormData({});
      fetchVacaciones();
    } catch (error) {
      console.error('Error al solicitar vacaciones:', error);
    }
  };

  const handleSolicitarPermiso = async () => {
    try {
      await solicitarPermiso(formData);
      setShowPermisoModal(false);
      setFormData({});
      fetchPermisos();
    } catch (error) {
      console.error('Error al solicitar permiso:', error);
    }
  };

  const handleAprobarVacaciones = async (id) => {
    try {
      await aprobarVacaciones(id);
      fetchVacaciones();
    } catch (error) {
      console.error('Error al aprobar vacaciones:', error);
    }
  };

  const handleRechazarVacaciones = async (id) => {
    const motivo = prompt('Motivo del rechazo:');
    if (motivo) {
      try {
        await rechazarVacaciones(id, motivo);
        fetchVacaciones();
      } catch (error) {
        console.error('Error al rechazar vacaciones:', error);
      }
    }
  };

  const handleAprobarPermiso = async (id) => {
    try {
      await aprobarPermiso(id);
      fetchPermisos();
    } catch (error) {
      console.error('Error al aprobar permiso:', error);
    }
  };

  const handleRechazarPermiso = async (id) => {
    const motivo = prompt('Motivo del rechazo:');
    if (motivo) {
      try {
        await rechazarPermiso(id, motivo);
        fetchPermisos();
      } catch (error) {
        console.error('Error al rechazar permiso:', error);
      }
    }
  };

  const handleRegistrarAsistencia = async () => {
    try {
      const { empleadoId, tipo, fecha, hora, observaciones } = formData;
      const data = { fecha, hora, observaciones };
      
      if (tipo === 'ENTRADA') {
        await registrarEntrada(empleadoId, data);
      } else {
        await registrarSalida(empleadoId, data);
      }
      
      setShowAsistenciaModal(false);
      setFormData({});
      fetchAsistencia(selectedDate);
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
    }
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      PENDIENTE: 'bg-yellow-100 text-yellow-700',
      APROBADA: 'bg-green-100 text-green-700',
      RECHAZADA: 'bg-red-100 text-red-700',
      CANCELADA: 'bg-gray-100 text-gray-700',
    };
    return styles[estado] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.presentes}</p>
                <p className="text-sm text-gray-500">Presentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ausentes}</p>
                <p className="text-sm text-gray-500">Ausentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.tardanzas}</p>
                <p className="text-sm text-gray-500">Tardanzas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.permisos}</p>
                <p className="text-sm text-gray-500">Permisos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="hoy">Control Diario</TabsTrigger>
            <TabsTrigger value="turnos">Turnos</TabsTrigger>
            <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
            <TabsTrigger value="permisos">Permisos</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Reporte
            </Button>
          </div>
        </div>

        <TabsContent value="hoy" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Asistencia del {new Date(selectedDate).toLocaleDateString()}
              </CardTitle>
              <Button onClick={() => setShowAsistenciaModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-gray-400">Cargando asistencia...</div>
              ) : asistencias.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Sin registros de asistencia</h3>
                  <p className="text-sm text-gray-400 mt-1">No hay registros para esta fecha</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {asistencias.map(asistencia => (
                    <div key={asistencia.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                          {asistencia.empleado?.nombre?.[0]}{asistencia.empleado?.apellido?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{asistencia.empleado?.nombre} {asistencia.empleado?.apellido}</p>
                          <p className="text-sm text-gray-500">{asistencia.empleado?.cargo?.nombre}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm">
                            Entrada: {asistencia.horaEntrada ? new Date(asistencia.horaEntrada).toLocaleTimeString() : '-'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Salida: {asistencia.horaSalida ? new Date(asistencia.horaSalida).toLocaleTimeString() : '-'}
                          </p>
                        </div>
                        <Badge className={
                          asistencia.estado === 'PRESENTE' ? 'bg-green-100 text-green-700' :
                          asistencia.estado === 'AUSENTE' ? 'bg-red-100 text-red-700' :
                          asistencia.estado === 'TARDANZA' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {asistencia.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gestion de Turnos</CardTitle>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Turno
              </Button>
            </CardHeader>
            <CardContent>
              {turnos.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">No hay turnos configurados</h3>
                  <p className="text-sm text-gray-400 mt-1">Crea turnos para asignar a los empleados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {turnos.map(turno => (
                    <Card key={turno.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: turno.color || '#3B82F6' }} />
                          <h4 className="font-medium">{turno.nombre}</h4>
                        </div>
                        <p className="text-sm text-gray-500">
                          {turno.horaInicio} - {turno.horaFin}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {turno.horasJornada} horas
                          {turno.esNocturno && ' | Nocturno'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacaciones" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-green-600" />
                Solicitudes de Vacaciones
              </CardTitle>
              <Button onClick={() => setShowVacacionModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Solicitud
              </Button>
            </CardHeader>
            <CardContent>
              {vacaciones.length === 0 ? (
                <div className="text-center py-12">
                  <Palmtree className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">No hay solicitudes de vacaciones</h3>
                  <p className="text-sm text-gray-400 mt-1">Las solicitudes de vacaciones apareceran aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vacaciones.map(vacacion => (
                    <div key={vacacion.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                          {vacacion.empleado?.nombre?.[0]}{vacacion.empleado?.apellido?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{vacacion.empleado?.nombre} {vacacion.empleado?.apellido}</p>
                          <p className="text-sm text-gray-500">{vacacion.empleado?.cargo?.nombre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{TIPOS_VACACION.find(t => t.value === vacacion.tipo)?.label || vacacion.tipo}</Badge>
                            <span className="text-xs text-gray-400">
                              {vacacion.diasSolicitados} dias solicitados
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(vacacion.fechaInicio).toLocaleDateString()} - {new Date(vacacion.fechaFin).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Solicitado: {new Date(vacacion.solicitadoEl).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getEstadoBadge(vacacion.estado)}>
                          {vacacion.estado}
                        </Badge>
                        {vacacion.estado === 'PENDIENTE' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleAprobarVacaciones(vacacion.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRechazarVacaciones(vacacion.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permisos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Solicitudes de Permisos
              </CardTitle>
              <Button onClick={() => setShowPermisoModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Solicitud
              </Button>
            </CardHeader>
            <CardContent>
              {permisos.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">No hay solicitudes de permisos</h3>
                  <p className="text-sm text-gray-400 mt-1">Las solicitudes de permisos apareceran aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {permisos.map(permiso => (
                    <div key={permiso.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                          {permiso.empleado?.nombre?.[0]}{permiso.empleado?.apellido?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{permiso.empleado?.nombre} {permiso.empleado?.apellido}</p>
                          <p className="text-sm text-gray-500">{permiso.empleado?.cargo?.nombre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-blue-50">
                              {TIPOS_PERMISO.find(t => t.value === permiso.tipoPermiso)?.label || permiso.tipoPermiso}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(permiso.fechaInicio).toLocaleDateString()}
                            {permiso.fechaFin !== permiso.fechaInicio && ` - ${new Date(permiso.fechaFin).toLocaleDateString()}`}
                          </p>
                          <p className="text-xs text-gray-500 max-w-[200px] truncate">
                            {permiso.motivo}
                          </p>
                        </div>
                        <Badge className={getEstadoBadge(permiso.estado)}>
                          {permiso.estado}
                        </Badge>
                        {permiso.estado === 'PENDIENTE' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleAprobarPermiso(permiso.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRechazarPermiso(permiso.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nueva Solicitud de Vacaciones */}
      <Dialog open={showVacacionModal} onOpenChange={setShowVacacionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palmtree className="w-5 h-5 text-green-600" />
              Nueva Solicitud de Vacaciones
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select
                value={formData.empleadoId || ''}
                onValueChange={(value) => setFormData({...formData, empleadoId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Vacaciones</Label>
              <Select
                value={formData.tipo || ''}
                onValueChange={(value) => setFormData({...formData, tipo: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_VACACION.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={formData.fechaInicio || ''}
                  onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={formData.fechaFin || ''}
                  onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                placeholder="Observaciones opcionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVacacionModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitarVacaciones}>
              Solicitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nueva Solicitud de Permiso */}
      <Dialog open={showPermisoModal} onOpenChange={setShowPermisoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Nueva Solicitud de Permiso
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select
                value={formData.empleadoId || ''}
                onValueChange={(value) => setFormData({...formData, empleadoId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Permiso</Label>
              <Select
                value={formData.tipoPermiso || ''}
                onValueChange={(value) => setFormData({...formData, tipoPermiso: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PERMISO.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={formData.fechaInicio || ''}
                  onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={formData.fechaFin || ''}
                  onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                value={formData.motivo || ''}
                onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                placeholder="Describa el motivo del permiso..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermisoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitarPermiso}>
              Solicitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Registro Manual Asistencia */}
      <Dialog open={showAsistenciaModal} onOpenChange={setShowAsistenciaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Registrar Asistencia Manual
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select
                value={formData.empleadoId || ''}
                onValueChange={(value) => setFormData({...formData, empleadoId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Registro</Label>
              <Select
                value={formData.tipo || ''}
                onValueChange={(value) => setFormData({...formData, tipo: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SALIDA">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formData.fecha || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={formData.hora || ''}
                  onChange={(e) => setFormData({...formData, hora: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                placeholder="Observaciones opcionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAsistenciaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarAsistencia}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
