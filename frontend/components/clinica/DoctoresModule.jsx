'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, UserCog, Phone, Mail, Clock, Eye, GraduationCap, Award, Calendar, MapPin, Power, CalendarClock, Ban, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import DoctorScheduleManager from './DoctorScheduleManager';
import BloqueoAgendaManager from './doctor/BloqueoAgendaManager';
import { useToast } from '@/hooks/use-toast';

export default function DoctoresModule({ user, onEdit, onAdd }) {
  const { toast } = useToast();
  const [doctores, setDoctores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingHorarios, setEditingHorarios] = useState(null);
  const [horarios, setHorarios] = useState({});
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [bloqueos, setBloqueos] = useState([]);
  const [activeTab, setActiveTab] = useState('horarios');
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  useEffect(() => {
    loadDoctores();
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDoctores = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/doctores?search=${search}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDoctores(data.data || []);
    } catch (error) {
      console.error('Error loading doctores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctores = doctores.filter(doctor =>
    `${doctor.nombre} ${doctor.apellido} ${doctor.cedula} ${doctor.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Obtener resumen de próximos 3 días de horarios
  const getResumenHorarios = (horarios) => {
    if (!horarios || Object.keys(horarios).length === 0) return 'Sin horarios';

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    const proximos3Dias = [];

    for (let i = 0; i < 3; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      // Usar formato local para evitar problemas de zona horaria
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const fechaStr = `${year}-${month}-${day}`;
      const diaSemana = fecha.getDay().toString(); // "0" para Domingo, "1" para Lunes, etc.

      // Buscar primero por fecha específica, luego por día de semana
      let horariosDelDia = null;
      if (horarios[fechaStr] && Array.isArray(horarios[fechaStr]) && horarios[fechaStr].length > 0) {
        horariosDelDia = horarios[fechaStr];
      } else if (horarios[diaSemana] && Array.isArray(horarios[diaSemana]) && horarios[diaSemana].length > 0) {
        horariosDelDia = horarios[diaSemana];
      }

      if (horariosDelDia) {
        const diaNombre = diasSemana[fecha.getDay()].substring(0, 3);
        const horarioTexto = horariosDelDia.slice(0, 2).map(h => `${h.inicio}-${h.fin}`).join(', ');
        const extra = horariosDelDia.length > 2 ? ` (+${horariosDelDia.length - 2})` : '';
        proximos3Dias.push(`${diaNombre}: ${horarioTexto}${extra}`);
      }
    }

    return proximos3Dias.length > 0 ? proximos3Dias.join(' | ') : 'Sin horarios próximos';
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este doctor?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/doctores/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadDoctores();
    } catch (error) {
      console.error('Error deleting doctor:', error);
    }
  };

  const handleToggleActivo = async (doctor) => {
    const nuevoEstado = !doctor.activo;
    const mensaje = nuevoEstado
      ? '¿Desea activar este doctor? Podrá agendar citas y aparecer en el sistema.'
      : '¿Desea desactivar este doctor? No podrá agendar nuevas citas ni aparecer en selectores.';

    if (!confirm(mensaje)) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/doctores/${doctor.id}/toggle-activo`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: data.data?.activo ? 'Doctor activado' : 'Doctor desactivado',
          description: data.message || 'Estado actualizado correctamente'
        });
        loadDoctores();
      } else {
        const data = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.message || 'Error al cambiar estado del doctor'
        });
      }
    } catch (error) {
      console.error('Error toggling doctor status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cambiar estado del doctor'
      });
    }
  };

  const handleOpenHorarios = (doctor) => {
    console.log('[DoctoresModule] handleOpenHorarios:', {
      doctorId: doctor.id,
      doctorNombre: doctor.nombre,
      horariosRecibidos: JSON.stringify(doctor.horarios || {})
    });
    setHorarios(doctor.horarios || {});
    setEditingHorarios(doctor);
    setActiveTab('horarios');
    // Cargar bloqueos del doctor
    loadBloqueos(doctor.usuarioId);
  };

  const loadBloqueos = async (doctorUsuarioId) => {
    if (!doctorUsuarioId) {
      console.log('[DoctoresModule] loadBloqueos: No doctorUsuarioId provided');
      return;
    }
    console.log('[DoctoresModule] loadBloqueos: Cargando bloqueos para doctor:', doctorUsuarioId);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/bloqueos/doctor/${doctorUsuarioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('[DoctoresModule] loadBloqueos: Respuesta:', {
        success: data.success,
        totalBloqueos: data.data?.length || 0
      });
      if (data.success) {
        const bloqueosActivos = (data.data || []).filter(b => b.activo);
        console.log('[DoctoresModule] loadBloqueos: Bloqueos activos:', bloqueosActivos.length, bloqueosActivos.map(b => ({
          id: b.id,
          fechaInicio: b.fechaInicio,
          motivo: b.motivo
        })));
        setBloqueos(bloqueosActivos);
      }
    } catch (error) {
      console.error('[DoctoresModule] loadBloqueos: Error:', error);
    }
  };

  const handleScheduleChange = (newHorarios) => {
    console.log('[DoctoresModule] handleScheduleChange llamado:', {
      keys: Object.keys(newHorarios),
      data: JSON.stringify(newHorarios).substring(0, 300)
    });
    setHorarios(newHorarios);
  };

  const handleSaveHorarios = async () => {
    console.log('[DoctoresModule] handleSaveHorarios llamado:', {
      doctorId: editingHorarios?.id,
      horariosKeys: Object.keys(horarios),
      horarios: JSON.stringify(horarios).substring(0, 300)
    });

    if (!editingHorarios?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se ha seleccionado un doctor'
      });
      return;
    }

    if (Object.keys(horarios).length === 0) {
      toast({
        variant: 'destructive',
        title: 'Sin horarios',
        description: 'No hay horarios para guardar. Primero selecciona franjas en el calendario y haz clic en "Guardar bloques".'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      console.log('[DoctoresModule] Enviando a:', `${apiUrl}/doctores/${editingHorarios.id}/horarios`);

      const response = await fetch(`${apiUrl}/doctores/${editingHorarios.id}/horarios`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ horarios })
      });

      const data = await response.json();
      console.log('[DoctoresModule] Respuesta:', data);

      if (response.ok && data.success) {
        toast({
          title: 'Horarios actualizados',
          description: 'Los horarios del doctor se han guardado correctamente.'
        });
        setEditingHorarios(null);
        loadDoctores();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.message || 'Error al actualizar horarios'
        });
      }
    } catch (error) {
      console.error('[DoctoresModule] Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al actualizar horarios'
      });
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <UserCog className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Doctores</h1>
          </div>
          <p className="text-gray-600 ml-14">Gestiona el equipo médico de la clínica</p>
        </div>
        <Button onClick={onAdd} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Doctor
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, cédula o especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Lista de Doctores ({filteredDoctores.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500 text-sm sm:text-base">Cargando...</p>
          ) : filteredDoctores.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm sm:text-base mb-4">No hay doctores registrados</p>
              <Button onClick={onAdd} className="bg-teal-500 hover:bg-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Doctor
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Doctor</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Cédula</TableHead>
                      <TableHead className="text-xs sm:text-sm">Especialidades</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden xl:table-cell">Horarios</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Contacto</TableHead>
                      <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctores.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                              {doctor.foto ? (
                                <img
                                  src={doctor.foto.startsWith('http') ? doctor.foto : `${process.env.NEXT_PUBLIC_API_URL}${doctor.foto}`}
                                  alt={`Dr. ${doctor.nombre}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center ${doctor.foto ? 'hidden' : ''}`}>
                                <UserCog className="w-5 h-5 text-teal-600" />
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold">Dr. {doctor.nombre} {doctor.apellido}</div>
                              <div className="text-xs text-gray-500">{doctor.licenciaMedica || 'Sin licencia'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">{doctor.cedula}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex flex-wrap gap-1">
                            {doctor.especialidades?.slice(0, 2).map((esp, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                {esp}
                              </Badge>
                            ))}
                            {doctor.especialidades?.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{doctor.especialidades.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden xl:table-cell">
                          <div 
                            onClick={() => onEdit(doctor)}
                            className="cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
                          >
                            <div className="flex items-center gap-1 text-blue-600 mb-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">Horarios</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {getResumenHorarios(doctor.horarios)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                          <div className="space-y-1">
                            {doctor.telefono && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="w-3 h-3" />
                                {doctor.telefono}
                              </div>
                            )}
                            {doctor.email && (
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="w-3 h-3" />
                                {doctor.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${doctor.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} text-xs`}>
                            {doctor.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingDoctor(doctor)}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-9 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                              title="Ver detalles"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenHorarios(doctor)}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-9 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                              title="Gestionar horarios"
                            >
                              <CalendarClock className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActivo(doctor)}
                              className={`h-8 w-8 p-0 sm:h-9 sm:w-9 ${
                                doctor.activo
                                  ? 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
                                  : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300'
                              }`}
                              title={doctor.activo ? 'Desactivar doctor' : 'Activar doctor'}
                            >
                              <Power className={`w-3 h-3 sm:w-4 sm:h-4 ${doctor.activo ? '' : 'text-gray-400'}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(doctor)}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-9 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300"
                              title="Editar"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 h-8 w-8 p-0 sm:h-9 sm:w-9"
                              onClick={() => handleDelete(doctor.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Editar Horarios y Bloqueos */}
      <Dialog open={!!editingHorarios} onOpenChange={() => setEditingHorarios(null)}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 flex-shrink-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-emerald-600" />
              Agenda - Dr. {editingHorarios?.nombre} {editingHorarios?.apellido}
            </DialogTitle>
          </DialogHeader>

          {/* Tabs para Horarios y Bloqueos */}
          <Tabs
            value={activeTab}
            onValueChange={(tab) => {
              setActiveTab(tab);
              // Recargar bloqueos y forzar re-render al volver a la pestaña de horarios
              if (tab === 'horarios' && editingHorarios?.usuarioId) {
                loadBloqueos(editingHorarios.usuarioId);
                // Forzar re-render del calendario después de un breve delay para que el tab sea visible
                setTimeout(() => {
                  setScheduleRefreshKey(prev => prev + 1);
                }, 100);
              }
            }}
            className="flex-1 flex flex-col overflow-hidden px-6"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-4 flex-shrink-0">
              <TabsTrigger value="horarios" className="gap-2">
                <Clock className="h-4 w-4" />
                Horarios de Atención
              </TabsTrigger>
              <TabsTrigger value="bloqueos" className="gap-2">
                <Ban className="h-4 w-4" />
                Bloqueos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="horarios" className="flex-1 overflow-hidden mt-0" forceMount style={{ display: activeTab === 'horarios' ? 'block' : 'none' }}>
              <DoctorScheduleManager
                key={`schedule-${editingHorarios?.id}-${scheduleRefreshKey}`}
                doctorId={editingHorarios?.id}
                initialHorarios={horarios}
                onChange={handleScheduleChange}
                bloqueos={bloqueos}
              />
            </TabsContent>

            <TabsContent value="bloqueos" className="flex-1 overflow-auto mt-0" forceMount style={{ display: activeTab === 'bloqueos' ? 'block' : 'none' }}>
              <BloqueoAgendaManager
                doctorId={editingHorarios?.usuarioId}
                doctorNombre={`${editingHorarios?.nombre} ${editingHorarios?.apellido}`}
                selfManaged={false}
                onBloqueosChange={async () => {
                  await loadBloqueos(editingHorarios?.usuarioId);
                  // Forzar re-render del calendario para mostrar nuevos bloqueos
                  setScheduleRefreshKey(prev => prev + 1);
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Botones siempre visibles en la parte inferior (solo para horarios) */}
          {activeTab === 'horarios' && (
            <div className="flex gap-3 p-6 pt-4 border-t bg-white flex-shrink-0">
              <Button
                onClick={() => setEditingHorarios(null)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveHorarios}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
              >
                Guardar Horarios
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Ver Doctor */}
      <Dialog open={!!viewingDoctor} onOpenChange={() => { setViewingDoctor(null); setCalendarWeekOffset(0); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserCog className="w-5 h-5 text-emerald-600" />
              Información Completa del Doctor
            </DialogTitle>
          </DialogHeader>

          {viewingDoctor && (
            <div className="space-y-6">
              {/* Foto y datos básicos */}
              <div className="flex items-start gap-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center border-4 border-emerald-200 overflow-hidden shadow-lg">
                  {viewingDoctor.foto ? (
                    <img
                      src={viewingDoctor.foto.startsWith('http') ? viewingDoctor.foto : `${process.env.NEXT_PUBLIC_API_URL}${viewingDoctor.foto}`}
                      alt="Foto"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCog className="w-14 h-14 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Dr. {viewingDoctor.nombre} {viewingDoctor.apellido}
                  </h3>
                  <p className="text-gray-600 text-lg">C.C. {viewingDoctor.cedula}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${viewingDoctor.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {viewingDoctor.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {viewingDoctor.licenciaMedica && (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                        Lic. {viewingDoctor.licenciaMedica}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Especialidades */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Especialidades
                </h4>
                <div className="flex flex-wrap gap-2">
                  {viewingDoctor.especialidades?.map((esp, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                      {esp}
                    </Badge>
                  ))}
                  {(!viewingDoctor.especialidades || viewingDoctor.especialidades.length === 0) && (
                    <span className="text-gray-500 text-sm italic">Sin especialidades asignadas</span>
                  )}
                </div>
              </div>

              {/* Información de contacto y profesional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    Información de Contacto
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Correo Electrónico</p>
                        <p className="font-medium">{viewingDoctor.email || 'No registrado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="font-medium">{viewingDoctor.telefono || 'No registrado'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    Información Profesional
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <Award className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Licencia Médica</p>
                        <p className="font-medium">{viewingDoctor.licenciaMedica || 'No registrada'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Universidad</p>
                        <p className="font-medium">{viewingDoctor.universidad || 'No registrada'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Experiencia</p>
                        <p className="font-medium">{viewingDoctor.aniosExperiencia ? `${viewingDoctor.aniosExperiencia} años` : 'No registrada'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Biografía */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Biografía / Descripción
                </h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
                  {viewingDoctor.biografia || <span className="italic text-gray-400">Sin biografía registrada</span>}
                </div>
              </div>

              {/* Horarios de Atención - Calendario Visual Navegable */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Horarios de Atención
                </h4>
                {(() => {
                  // Calcular fechas de la semana
                  const getWeekDates = (offset) => {
                    const today = new Date();
                    const currentDay = today.getDay();
                    const sunday = new Date(today);
                    sunday.setDate(today.getDate() - currentDay + (offset * 7));

                    const weekDates = [];
                    for (let i = 0; i < 7; i++) {
                      const d = new Date(sunday);
                      d.setDate(sunday.getDate() + i);
                      weekDates.push(d);
                    }
                    return weekDates;
                  };

                  const weekDates = getWeekDates(calendarWeekOffset);
                  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

                  const startMonth = weekDates[0].getMonth();
                  const endMonth = weekDates[6].getMonth();
                  const year = weekDates[0].getFullYear();
                  const monthLabel = startMonth === endMonth
                    ? `${monthNames[startMonth]} ${year}`
                    : `${monthNames[startMonth]} - ${monthNames[endMonth]} ${year}`;

                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  return (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      {/* Navegación del calendario */}
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCalendarWeekOffset(prev => prev - 1)}
                          className="h-8 px-2 gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="text-xs hidden sm:inline">Anterior</span>
                        </Button>
                        <div className="text-center">
                          <p className="font-semibold text-gray-800">{monthLabel}</p>
                          <p className="text-xs text-gray-500">
                            Semana del {weekDates[0].getDate()} al {weekDates[6].getDate()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCalendarWeekOffset(prev => prev + 1)}
                          className="h-8 px-2 gap-1"
                        >
                          <span className="text-xs hidden sm:inline">Siguiente</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Botón volver a hoy */}
                      {calendarWeekOffset !== 0 && (
                        <div className="flex justify-center py-1 bg-blue-50 border-b border-blue-100">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setCalendarWeekOffset(0)}
                            className="text-xs text-blue-600 h-6"
                          >
                            Volver a esta semana
                          </Button>
                        </div>
                      )}

                      {/* Header del calendario con días */}
                      <div className="grid grid-cols-7 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                        {weekDates.map((date, idx) => {
                          const isToday = date.toDateString() === today.toDateString();
                          return (
                            <div
                              key={idx}
                              className={`py-2 text-center border-r border-emerald-500 last:border-r-0 ${isToday ? 'bg-emerald-700' : ''}`}
                            >
                              <p className="text-xs font-medium opacity-80">{dayNames[idx]}</p>
                              <p className={`text-lg font-bold ${isToday ? 'bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                                {date.getDate()}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Cuerpo del calendario */}
                      <div className="grid grid-cols-7">
                        {weekDates.map((date, idx) => {
                          const dayIndex = date.getDay();
                          // Usar formato local para evitar problemas de zona horaria
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;

                          // Primero buscar por fecha específica, luego por día de semana
                          let bloques = viewingDoctor.horarios?.[dateStr];
                          if (!Array.isArray(bloques) || bloques.length === 0) {
                            // Buscar por índice de día (como número o string)
                            bloques = viewingDoctor.horarios?.[String(dayIndex)] || viewingDoctor.horarios?.[dayIndex];
                          }

                          const hasHorarios = Array.isArray(bloques) && bloques.length > 0;
                          const isToday = date.toDateString() === today.toDateString();
                          const isPast = date < today;

                          return (
                            <div
                              key={idx}
                              className={`min-h-[90px] p-1.5 border-r border-b border-gray-100 last:border-r-0 ${
                                hasHorarios
                                  ? isPast ? 'bg-gray-50' : 'bg-emerald-50'
                                  : 'bg-gray-50'
                              } ${isToday ? 'ring-2 ring-inset ring-emerald-400' : ''}`}
                            >
                              {hasHorarios ? (
                                <div className="h-full flex flex-col gap-1">
                                  {bloques.slice(0, 3).map((bloque, bidx) => (
                                    <div
                                      key={bidx}
                                      className={`w-full rounded py-0.5 px-1 text-center text-white ${
                                        isPast ? 'bg-gray-400' : 'bg-emerald-500'
                                      }`}
                                    >
                                      <p className="text-[9px] font-medium leading-tight">
                                        {bloque.inicio || bloque.start} - {bloque.fin || bloque.end}
                                      </p>
                                    </div>
                                  ))}
                                  {bloques.length > 3 && (
                                    <p className="text-[8px] text-gray-500 text-center">
                                      +{bloques.length - 3} más
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <p className="text-[9px] text-gray-400">—</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Leyenda */}
                      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex items-center justify-center gap-4 text-xs flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded bg-emerald-500"></div>
                          <span className="text-gray-600">Disponible</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded bg-gray-400"></div>
                          <span className="text-gray-600">Pasado</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded border-2 border-emerald-400 bg-white"></div>
                          <span className="text-gray-600">Hoy</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* Mensaje si no hay horarios configurados */}
                {(!viewingDoctor.horarios || Object.keys(viewingDoctor.horarios).length === 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                    <p className="text-sm text-amber-700 text-center">
                      Este doctor no tiene horarios configurados. Configure los horarios desde la pestaña "Horarios".
                    </p>
                  </div>
                )}
              </div>

              {/* Firma y Sello */}
              {(viewingDoctor.firma || viewingDoctor.sello) && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Firma y Sello Digital
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Firma */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-2">Firma Digital</p>
                      {viewingDoctor.firma ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-center min-h-[100px]">
                          <img
                            src={viewingDoctor.firma.startsWith('data:') ? viewingDoctor.firma : `data:image/png;base64,${viewingDoctor.firma}`}
                            alt="Firma del Doctor"
                            className="max-h-24 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center min-h-[100px]">
                          <p className="text-sm text-gray-400 italic">Sin firma registrada</p>
                        </div>
                      )}
                    </div>

                    {/* Sello */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-2">Sello Digital</p>
                      {viewingDoctor.sello ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-center min-h-[100px]">
                          <img
                            src={viewingDoctor.sello.startsWith('data:') ? viewingDoctor.sello : `data:image/png;base64,${viewingDoctor.sello}`}
                            alt="Sello del Doctor"
                            className="max-h-24 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center min-h-[100px]">
                          <p className="text-sm text-gray-400 italic">Sin sello registrado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mostrar sección de firma/sello aunque estén vacíos para que el usuario sepa que existen */}
              {!viewingDoctor.firma && !viewingDoctor.sello && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Firma y Sello Digital
                  </h4>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-700">
                      Este doctor no tiene firma ni sello digital registrado.
                      Puede agregarlos editando el perfil del doctor.
                    </p>
                  </div>
                </div>
              )}

              {/* Botón Cerrar */}
              <div className="flex justify-center pt-4 border-t">
                <Button
                  onClick={() => { setViewingDoctor(null); setCalendarWeekOffset(0); }}
                  variant="outline"
                  className="min-w-[200px]"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
