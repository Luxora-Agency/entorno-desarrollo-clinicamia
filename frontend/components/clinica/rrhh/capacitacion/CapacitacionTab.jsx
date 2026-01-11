'use client';

import { useState, useEffect } from 'react';
import {
  GraduationCap, BookOpen, Award, Calendar, Users,
  Plus, Search, Clock, Video, MapPin, Download,
  FileText, CheckCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useTalentoHumano from '@/hooks/useTalentoHumano';

const ESTADO_COLORS = {
  PROGRAMADA: 'bg-blue-100 text-blue-700',
  EN_CURSO: 'bg-yellow-100 text-yellow-700',
  COMPLETADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-700',
};

const MODALIDAD_ICONS = {
  PRESENCIAL: MapPin,
  VIRTUAL: Video,
  MIXTA: Users,
  ELEARNING: BookOpen,
};

const CATEGORIAS_CAPACITACION = [
  'Salud Ocupacional',
  'Seguridad del Paciente',
  'Habilidades Tecnicas',
  'Liderazgo',
  'Servicio al Cliente',
  'Normatividad',
  'Tecnologia',
  'Comunicacion',
  'Trabajo en Equipo',
  'Otros'
];

function CapacitacionCard({ capacitacion, onInscribir }) {
  const Icon = MODALIDAD_ICONS[capacitacion.modalidad] || GraduationCap;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={ESTADO_COLORS[capacitacion.estado]}>
                {capacitacion.estado}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {capacitacion.modalidad}
              </Badge>
            </div>
            <h3 className="font-semibold">{capacitacion.nombre}</h3>
            {capacitacion.categoria && (
              <p className="text-sm text-gray-500">{capacitacion.categoria}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {capacitacion.duracionHoras}h
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {capacitacion._count?.asistentes || 0} inscritos
          </span>
          {capacitacion.cuposMaximos && (
            <span className="flex items-center gap-1">
              Cupos: {capacitacion._count?.asistentes || 0}/{capacitacion.cuposMaximos}
            </span>
          )}
        </div>
        {capacitacion.fechaInicio && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {new Date(capacitacion.fechaInicio).toLocaleDateString()}
              {capacitacion.fechaFin && ` - ${new Date(capacitacion.fechaFin).toLocaleDateString()}`}
            </span>
            <div className="flex gap-2">
              {capacitacion.estado === 'PROGRAMADA' && (
                <Button variant="outline" size="sm" onClick={() => onInscribir(capacitacion)}>
                  Inscribir
                </Button>
              )}
              <Button variant="outline" size="sm">
                Ver detalles
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CapacitacionTab({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('capacitaciones');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showInscripcionModal, setShowInscripcionModal] = useState(false);
  const [selectedCapacitacion, setSelectedCapacitacion] = useState(null);
  const [formData, setFormData] = useState({});

  const {
    capacitaciones, statsCapacitacion, empleados, loading,
    fetchCapacitaciones, fetchStatsCapacitacion, fetchEmpleados,
    createCapacitacion, inscribirCapacitacion
  } = useTalentoHumano();

  useEffect(() => {
    fetchCapacitaciones();
    fetchStatsCapacitacion();
    fetchEmpleados({ estado: 'ACTIVO' });
  }, []);

  const filteredCapacitaciones = capacitaciones.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = statsCapacitacion || {
    capacitaciones: { total: 0, programadas: 0, enCurso: 0, completadas: 0 },
    asistentes: 0,
    horasImpartidas: 0
  };

  // Simulacion de certificados (en produccion vendrian del backend)
  const certificados = capacitaciones
    .filter(c => c.estado === 'COMPLETADA')
    .flatMap(c => (c.asistentes || []).map(a => ({
      ...a,
      capacitacion: c.nombre,
      fecha: c.fechaFin,
      duracion: c.duracionHoras
    })));

  // Plan anual por trimestre
  const planAnual = {
    Q1: capacitaciones.filter(c => {
      if (!c.fechaInicio) return false;
      const mes = new Date(c.fechaInicio).getMonth();
      return mes >= 0 && mes <= 2;
    }),
    Q2: capacitaciones.filter(c => {
      if (!c.fechaInicio) return false;
      const mes = new Date(c.fechaInicio).getMonth();
      return mes >= 3 && mes <= 5;
    }),
    Q3: capacitaciones.filter(c => {
      if (!c.fechaInicio) return false;
      const mes = new Date(c.fechaInicio).getMonth();
      return mes >= 6 && mes <= 8;
    }),
    Q4: capacitaciones.filter(c => {
      if (!c.fechaInicio) return false;
      const mes = new Date(c.fechaInicio).getMonth();
      return mes >= 9 && mes <= 11;
    }),
  };

  const handleCreateCapacitacion = async () => {
    try {
      await createCapacitacion(formData);
      setShowModal(false);
      setFormData({});
      fetchCapacitaciones();
      fetchStatsCapacitacion();
    } catch (error) {
      console.error('Error al crear capacitacion:', error);
    }
  };

  const handleInscribir = async () => {
    if (!selectedCapacitacion || !formData.empleadoId) return;
    try {
      await inscribirCapacitacion(selectedCapacitacion.id, formData.empleadoId);
      setShowInscripcionModal(false);
      setSelectedCapacitacion(null);
      setFormData({});
      fetchCapacitaciones();
    } catch (error) {
      console.error('Error al inscribir:', error);
    }
  };

  const openInscripcionModal = (capacitacion) => {
    setSelectedCapacitacion(capacitacion);
    setShowInscripcionModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.capacitaciones?.total || capacitaciones.length}</p>
                <p className="text-sm text-gray-500">Total Capacitaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.capacitaciones?.enCurso || capacitaciones.filter(c => c.estado === 'EN_CURSO').length}</p>
                <p className="text-sm text-gray-500">En Curso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.asistentes || 0}</p>
                <p className="text-sm text-gray-500">Participantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.horasImpartidas || 0}</p>
                <p className="text-sm text-gray-500">Horas Impartidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="capacitaciones">Capacitaciones</TabsTrigger>
            <TabsTrigger value="certificados">Certificados</TabsTrigger>
            <TabsTrigger value="plan">Plan Anual</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Capacitacion
            </Button>
          </div>
        </div>

        <TabsContent value="capacitaciones" className="mt-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando capacitaciones...</div>
          ) : filteredCapacitaciones.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">No hay capacitaciones</h3>
              <p className="text-sm text-gray-400 mt-1">Crea una capacitacion para comenzar</p>
              <Button className="mt-4" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Capacitacion
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCapacitaciones.map(capacitacion => (
                <CapacitacionCard
                  key={capacitacion.id}
                  capacitacion={capacitacion}
                  onInscribir={openInscripcionModal}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificados" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Certificados Emitidos
              </CardTitle>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              {capacitaciones.filter(c => c.estado === 'COMPLETADA').length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Sin certificados</h3>
                  <p className="text-sm text-gray-400 mt-1">Los certificados se generan al completar capacitaciones</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lista de empleados con sus certificados */}
                  {empleados.slice(0, 10).map(empleado => {
                    const capsCompletadas = capacitaciones.filter(c =>
                      c.estado === 'COMPLETADA' &&
                      c.asistentes?.some(a => a.empleadoId === empleado.id && a.asistio)
                    );

                    if (capsCompletadas.length === 0) return null;

                    return (
                      <div key={empleado.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                              {empleado.nombre?.[0]}{empleado.apellido?.[0]}
                            </div>
                            <div>
                              <p className="font-medium">{empleado.nombre} {empleado.apellido}</p>
                              <p className="text-sm text-gray-500">{empleado.cargo?.nombre}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">
                            {capsCompletadas.length} certificados
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {capsCompletadas.map(cap => (
                            <Badge key={cap.id} variant="outline" className="flex items-center gap-1">
                              <Award className="w-3 h-3 text-yellow-600" />
                              {cap.nombre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Si no hay certificados individuales, mostrar resumen por capacitacion */}
                  {capacitaciones.filter(c => c.estado === 'COMPLETADA').map(cap => (
                    <div key={cap.id} className="p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Award className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">{cap.nombre}</p>
                            <p className="text-sm text-gray-500">
                              Completada el {cap.fechaFin ? new Date(cap.fechaFin).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-yellow-700">
                            {cap._count?.asistentes || 0}
                          </p>
                          <p className="text-xs text-gray-500">certificados emitidos</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Plan de Capacitacion Anual {new Date().getFullYear()}
              </CardTitle>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Generar Reporte
              </Button>
            </CardHeader>
            <CardContent>
              {capacitaciones.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Sin plan definido</h3>
                  <p className="text-sm text-gray-400 mt-1">Crea capacitaciones para generar el plan anual</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progreso general */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-800">Progreso del Plan Anual</span>
                      <span className="text-sm text-blue-600">
                        {capacitaciones.filter(c => c.estado === 'COMPLETADA').length} / {capacitaciones.length} completadas
                      </span>
                    </div>
                    <Progress
                      value={capacitaciones.length > 0 ? (capacitaciones.filter(c => c.estado === 'COMPLETADA').length / capacitaciones.length) * 100 : 0}
                      className="h-3"
                    />
                  </div>

                  {/* Plan por trimestre */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(planAnual).map(([trimestre, caps]) => (
                      <Card key={trimestre} className="border-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span>{trimestre} - {trimestre === 'Q1' ? 'Ene-Mar' : trimestre === 'Q2' ? 'Abr-Jun' : trimestre === 'Q3' ? 'Jul-Sep' : 'Oct-Dic'}</span>
                            <Badge variant="outline">{caps.length} capacitaciones</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {caps.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Sin capacitaciones programadas</p>
                          ) : (
                            <div className="space-y-2">
                              {caps.map(cap => (
                                <div key={cap.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    {cap.estado === 'COMPLETADA' ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : cap.estado === 'EN_CURSO' ? (
                                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-sm">{cap.nombre}</span>
                                  </div>
                                  <Badge className={ESTADO_COLORS[cap.estado]} variant="outline">
                                    {cap.estado}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Categorias cubiertas */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Categorias Cubiertas</h4>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(capacitaciones.map(c => c.categoria).filter(Boolean))].map(cat => (
                        <Badge key={cat} variant="outline" className="bg-blue-50">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nueva Capacitacion */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Nueva Capacitacion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Nombre de la Capacitacion</Label>
              <Input
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Primeros Auxilios Basicos"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Describe los objetivos y contenido..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoria || ''}
                  onValueChange={(value) => setFormData({...formData, categoria: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_CAPACITACION.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modalidad</Label>
                <Select
                  value={formData.modalidad || ''}
                  onValueChange={(value) => setFormData({...formData, modalidad: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                    <SelectItem value="VIRTUAL">Virtual</SelectItem>
                    <SelectItem value="MIXTA">Mixta</SelectItem>
                    <SelectItem value="ELEARNING">E-Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duracion (horas)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.duracionHoras || ''}
                  onChange={(e) => setFormData({...formData, duracionHoras: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Cupos Maximos</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.cuposMaximos || ''}
                  onChange={(e) => setFormData({...formData, cuposMaximos: parseInt(e.target.value)})}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instructor</Label>
              <Input
                value={formData.instructor || ''}
                onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                placeholder="Nombre del instructor"
              />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCapacitacion}>
              Crear Capacitacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Inscribir Empleado */}
      <Dialog open={showInscripcionModal} onOpenChange={setShowInscripcionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Inscribir Empleado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCapacitacion && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">{selectedCapacitacion.nombre}</p>
                <p className="text-sm text-blue-600">
                  {selectedCapacitacion._count?.asistentes || 0} inscritos
                  {selectedCapacitacion.cuposMaximos && ` / ${selectedCapacitacion.cuposMaximos} cupos`}
                </p>
              </div>
            )}
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
                      {emp.nombre} {emp.apellido} - {emp.cargo?.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInscripcionModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInscribir}>
              Inscribir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
