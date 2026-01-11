'use client';

import { useState, useEffect } from 'react';
import {
  Heart, Gift, ClipboardList, Calendar, Star,
  Plus, Users, TrendingUp, Smile, Edit, Trash2, Eye, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useTalentoHumano from '@/hooks/useTalentoHumano';

const TIPOS_BENEFICIO = [
  { value: 'SALUD', label: 'Salud' },
  { value: 'EDUCACION', label: 'Educacion' },
  { value: 'RECREACION', label: 'Recreacion' },
  { value: 'FINANCIERO', label: 'Financiero' },
  { value: 'ALIMENTACION', label: 'Alimentacion' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'OTRO', label: 'Otro' },
];

const TIPOS_ENCUESTA = [
  { value: 'CLIMA', label: 'Clima Laboral' },
  { value: 'SATISFACCION', label: 'Satisfaccion' },
  { value: 'PULSO', label: 'Pulso Rapido' },
  { value: 'SALIDA', label: 'Entrevista de Salida' },
  { value: 'PERSONALIZADA', label: 'Personalizada' },
];

const TIPOS_EVENTO = [
  { value: 'CELEBRACION', label: 'Celebracion' },
  { value: 'INTEGRACION', label: 'Integracion' },
  { value: 'CAPACITACION', label: 'Capacitacion' },
  { value: 'SALUD', label: 'Feria de Salud' },
  { value: 'DEPORTIVO', label: 'Evento Deportivo' },
  { value: 'CULTURAL', label: 'Evento Cultural' },
];

const TIPOS_RECONOCIMIENTO = [
  { value: 'EMPLEADO_MES', label: 'Empleado del Mes' },
  { value: 'ANTIGUEDAD', label: 'Antiguedad' },
  { value: 'LOGRO', label: 'Logro Destacado' },
  { value: 'VALORES', label: 'Valores Corporativos' },
  { value: 'INNOVACION', label: 'Innovacion' },
  { value: 'SERVICIO', label: 'Excelencia en Servicio' },
];

const ESTADO_COLORS = {
  BORRADOR: 'bg-gray-100 text-gray-700',
  ACTIVA: 'bg-blue-100 text-blue-700',
  EN_CURSO: 'bg-green-100 text-green-700',
  CERRADA: 'bg-purple-100 text-purple-700',
  PROGRAMADO: 'bg-yellow-100 text-yellow-700',
  COMPLETADO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

export default function BienestarTab({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('beneficios');
  const {
    beneficios, encuestas, eventos, reconocimientos, empleados, loading,
    fetchBeneficios, fetchEncuestas, fetchEventos, fetchReconocimientos, fetchEmpleados,
    createBeneficio, createEncuesta, createEvento, createReconocimiento
  } = useTalentoHumano();

  // Modal states
  const [showBeneficioModal, setShowBeneficioModal] = useState(false);
  const [showEncuestaModal, setShowEncuestaModal] = useState(false);
  const [showEventoModal, setShowEventoModal] = useState(false);
  const [showReconocimientoModal, setShowReconocimientoModal] = useState(false);

  // Form states
  const [beneficioForm, setBeneficioForm] = useState({
    nombre: '',
    descripcion: '',
    tipo: '',
    valorMensual: '',
    requisitos: '',
    activo: true
  });

  const [encuestaForm, setEncuestaForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: '',
    fechaInicio: '',
    fechaFin: '',
    esAnonima: true,
    preguntas: []
  });

  const [eventoForm, setEventoForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    ubicacion: '',
    cupoMaximo: '',
    esObligatorio: false
  });

  const [reconocimientoForm, setReconocimientoForm] = useState({
    empleadoId: '',
    tipo: '',
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    valorAsociado: '',
    esPublico: true
  });

  useEffect(() => {
    fetchBeneficios();
    fetchEncuestas();
    fetchEventos();
    fetchReconocimientos();
    fetchEmpleados({ estado: 'ACTIVO' });
  }, []);

  const handleOpenModal = () => {
    switch (activeSubTab) {
      case 'beneficios':
        setBeneficioForm({
          nombre: '', descripcion: '', tipo: '', valorMensual: '', requisitos: '', activo: true
        });
        setShowBeneficioModal(true);
        break;
      case 'encuestas':
        setEncuestaForm({
          titulo: '', descripcion: '', tipo: '', fechaInicio: '', fechaFin: '', esAnonima: true, preguntas: []
        });
        setShowEncuestaModal(true);
        break;
      case 'eventos':
        setEventoForm({
          titulo: '', descripcion: '', tipo: '', fecha: '', horaInicio: '', horaFin: '', ubicacion: '', cupoMaximo: '', esObligatorio: false
        });
        setShowEventoModal(true);
        break;
      case 'reconocimientos':
        setReconocimientoForm({
          empleadoId: '', tipo: '', titulo: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], valorAsociado: '', esPublico: true
        });
        setShowReconocimientoModal(true);
        break;
    }
  };

  const handleCreateBeneficio = async () => {
    try {
      await createBeneficio({
        ...beneficioForm,
        valorMensual: beneficioForm.valorMensual ? parseFloat(beneficioForm.valorMensual) : null
      });
      setShowBeneficioModal(false);
      fetchBeneficios();
    } catch (error) {
      console.error('Error creando beneficio:', error);
    }
  };

  const handleCreateEncuesta = async () => {
    try {
      await createEncuesta({
        ...encuestaForm,
        preguntas: encuestaForm.preguntas.length > 0 ? encuestaForm.preguntas : [
          { pregunta: 'Pregunta de ejemplo', tipo: 'ESCALA', opciones: [] }
        ]
      });
      setShowEncuestaModal(false);
      fetchEncuestas();
    } catch (error) {
      console.error('Error creando encuesta:', error);
    }
  };

  const handleCreateEvento = async () => {
    try {
      await createEvento({
        ...eventoForm,
        cupoMaximo: eventoForm.cupoMaximo ? parseInt(eventoForm.cupoMaximo) : null
      });
      setShowEventoModal(false);
      fetchEventos();
    } catch (error) {
      console.error('Error creando evento:', error);
    }
  };

  const handleCreateReconocimiento = async () => {
    try {
      await createReconocimiento({
        ...reconocimientoForm,
        otorgadoPor: user?.id
      });
      setShowReconocimientoModal(false);
      fetchReconocimientos();
    } catch (error) {
      console.error('Error creando reconocimiento:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Gift className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{beneficios.filter(b => b.activo).length}</p>
                <p className="text-sm text-gray-500">Beneficios Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{encuestas.filter(e => e.estado === 'ACTIVA' || e.estado === 'EN_CURSO').length}</p>
                <p className="text-sm text-gray-500">Encuestas Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {eventos.filter(e => new Date(e.fecha) >= new Date()).length}
                </p>
                <p className="text-sm text-gray-500">Eventos Proximos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reconocimientos.length}</p>
                <p className="text-sm text-gray-500">Reconocimientos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
            <TabsTrigger value="encuestas">Encuestas</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="reconocimientos">Reconocimientos</TabsTrigger>
          </TabsList>
          <Button onClick={handleOpenModal}>
            <Plus className="w-4 h-4 mr-2" />
            {activeSubTab === 'beneficios' && 'Nuevo Beneficio'}
            {activeSubTab === 'encuestas' && 'Nueva Encuesta'}
            {activeSubTab === 'eventos' && 'Nuevo Evento'}
            {activeSubTab === 'reconocimientos' && 'Nuevo Reconocimiento'}
          </Button>
        </div>

        <TabsContent value="beneficios" className="mt-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando beneficios...</div>
          ) : beneficios.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Gift className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Sin beneficios configurados</h3>
                  <p className="text-sm text-gray-400 mt-1">Agrega beneficios para los empleados</p>
                  <Button className="mt-4" onClick={() => setShowBeneficioModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Beneficio
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {beneficios.map(beneficio => (
                <Card key={beneficio.id} className={!beneficio.activo ? 'opacity-60' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">{beneficio.nombre}</h4>
                      <Badge variant={beneficio.activo ? 'default' : 'secondary'}>
                        {beneficio.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {TIPOS_BENEFICIO.find(t => t.value === beneficio.tipo)?.label || beneficio.tipo}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{beneficio.descripcion}</p>
                    {beneficio.valorMensual && (
                      <p className="text-sm font-medium text-green-600 mt-2">
                        ${parseFloat(beneficio.valorMensual).toLocaleString()}/mes
                      </p>
                    )}
                    {beneficio._count?.asignaciones > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {beneficio._count.asignaciones} empleados asignados
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="encuestas" className="mt-6">
          {encuestas.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Sin encuestas</h3>
                  <p className="text-sm text-gray-400 mt-1">Crea encuestas de clima laboral</p>
                  <Button className="mt-4" onClick={() => setShowEncuestaModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Encuesta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {encuestas.map(encuesta => (
                <Card key={encuesta.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{encuesta.titulo}</h4>
                          {encuesta.esAnonima && (
                            <Badge variant="outline" className="text-xs">Anonima</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {TIPOS_ENCUESTA.find(t => t.value === encuesta.tipo)?.label || encuesta.tipo}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(encuesta.fechaInicio).toLocaleDateString()} - {new Date(encuesta.fechaFin).toLocaleDateString()}
                        </p>
                        {encuesta.descripcion && (
                          <p className="text-sm text-gray-500 mt-2">{encuesta.descripcion}</p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={ESTADO_COLORS[encuesta.estado] || ''}>
                          {encuesta.estado}
                        </Badge>
                        <p className="text-sm text-gray-500">
                          {encuesta._count?.respuestas || 0} respuestas
                        </p>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {encuesta.estado === 'BORRADOR' && (
                            <Button variant="ghost" size="sm">
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="eventos" className="mt-6">
          {eventos.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Sin eventos programados</h3>
                  <p className="text-sm text-gray-400 mt-1">Programa eventos de bienestar</p>
                  <Button className="mt-4" onClick={() => setShowEventoModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Evento
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventos.map(evento => {
                const fechaEvento = new Date(evento.fecha);
                const esFuturo = fechaEvento >= new Date();
                const colorClasses = {
                  CELEBRACION: 'bg-pink-100 text-pink-600 text-pink-800',
                  INTEGRACION: 'bg-green-100 text-green-600 text-green-800',
                  CAPACITACION: 'bg-blue-100 text-blue-600 text-blue-800',
                  SALUD: 'bg-red-100 text-red-600 text-red-800',
                  DEPORTIVO: 'bg-orange-100 text-orange-600 text-orange-800',
                  CULTURAL: 'bg-purple-100 text-purple-600 text-purple-800',
                };
                const colors = colorClasses[evento.tipo] || 'bg-gray-100 text-gray-600 text-gray-800';
                const [bgColor, textColor, boldColor] = colors.split(' ');

                return (
                  <Card key={evento.id} className={!esFuturo ? 'opacity-60' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 ${bgColor} rounded-lg flex flex-col items-center justify-center`}>
                          <span className={`text-xs font-medium ${textColor}`}>
                            {fechaEvento.toLocaleDateString('es', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className={`text-lg font-bold ${boldColor}`}>
                            {fechaEvento.getDate()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{evento.titulo}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {TIPOS_EVENTO.find(t => t.value === evento.tipo)?.label || evento.tipo}
                                </Badge>
                                {evento.esObligatorio && (
                                  <Badge variant="destructive" className="text-xs">Obligatorio</Badge>
                                )}
                              </div>
                            </div>
                            <Badge className={ESTADO_COLORS[evento.estado] || ''}>
                              {evento.estado || (esFuturo ? 'PROGRAMADO' : 'COMPLETADO')}
                            </Badge>
                          </div>
                          {evento.descripcion && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{evento.descripcion}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            {evento.ubicacion && <span>{evento.ubicacion}</span>}
                            {evento.horaInicio && (
                              <span>{evento.horaInicio} - {evento.horaFin}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {evento._count?.asistentes || 0} confirmados
                            {evento.cupoMaximo && ` / ${evento.cupoMaximo} cupos`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reconocimientos" className="mt-6">
          {reconocimientos.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Star className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Sin reconocimientos</h3>
                  <p className="text-sm text-gray-400 mt-1">Reconoce los logros de tu equipo</p>
                  <Button className="mt-4" onClick={() => setShowReconocimientoModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Reconocimiento
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reconocimientos.map(reconocimiento => (
                <Card key={reconocimiento.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{reconocimiento.titulo}</h4>
                          {reconocimiento.esPublico && (
                            <Badge variant="outline" className="text-xs shrink-0">Publico</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {reconocimiento.empleado?.nombre} {reconocimiento.empleado?.apellido}
                        </p>
                        {reconocimiento.descripcion && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{reconocimiento.descripcion}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(reconocimiento.fecha).toLocaleDateString()}
                          {reconocimiento.valorAsociado && ` - ${reconocimiento.valorAsociado}`}
                        </p>
                      </div>
                      <Badge className="shrink-0">
                        {TIPOS_RECONOCIMIENTO.find(t => t.value === reconocimiento.tipo)?.label || reconocimiento.tipo}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Nuevo Beneficio */}
      <Dialog open={showBeneficioModal} onOpenChange={setShowBeneficioModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Beneficio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={beneficioForm.nombre}
                onChange={(e) => setBeneficioForm({ ...beneficioForm, nombre: e.target.value })}
                placeholder="Nombre del beneficio"
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select
                value={beneficioForm.tipo}
                onValueChange={(value) => setBeneficioForm({ ...beneficioForm, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_BENEFICIO.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripcion</Label>
              <Textarea
                value={beneficioForm.descripcion}
                onChange={(e) => setBeneficioForm({ ...beneficioForm, descripcion: e.target.value })}
                placeholder="Descripcion del beneficio"
                rows={3}
              />
            </div>
            <div>
              <Label>Valor Mensual</Label>
              <Input
                type="number"
                value={beneficioForm.valorMensual}
                onChange={(e) => setBeneficioForm({ ...beneficioForm, valorMensual: e.target.value })}
                placeholder="Ej: 150000"
              />
            </div>
            <div>
              <Label>Requisitos</Label>
              <Textarea
                value={beneficioForm.requisitos}
                onChange={(e) => setBeneficioForm({ ...beneficioForm, requisitos: e.target.value })}
                placeholder="Requisitos para acceder al beneficio"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBeneficioModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateBeneficio} disabled={!beneficioForm.nombre || !beneficioForm.tipo}>
              Crear Beneficio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nueva Encuesta */}
      <Dialog open={showEncuestaModal} onOpenChange={setShowEncuestaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Encuesta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titulo *</Label>
              <Input
                value={encuestaForm.titulo}
                onChange={(e) => setEncuestaForm({ ...encuestaForm, titulo: e.target.value })}
                placeholder="Titulo de la encuesta"
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select
                value={encuestaForm.tipo}
                onValueChange={(value) => setEncuestaForm({ ...encuestaForm, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ENCUESTA.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripcion</Label>
              <Textarea
                value={encuestaForm.descripcion}
                onChange={(e) => setEncuestaForm({ ...encuestaForm, descripcion: e.target.value })}
                placeholder="Descripcion de la encuesta"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha Inicio *</Label>
                <Input
                  type="date"
                  value={encuestaForm.fechaInicio}
                  onChange={(e) => setEncuestaForm({ ...encuestaForm, fechaInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Fecha Fin *</Label>
                <Input
                  type="date"
                  value={encuestaForm.fechaFin}
                  onChange={(e) => setEncuestaForm({ ...encuestaForm, fechaFin: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esAnonima"
                checked={encuestaForm.esAnonima}
                onChange={(e) => setEncuestaForm({ ...encuestaForm, esAnonima: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="esAnonima" className="cursor-pointer">Encuesta anonima</Label>
            </div>
            <p className="text-xs text-gray-500">
              Las preguntas se pueden configurar despues de crear la encuesta
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEncuestaModal(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateEncuesta}
              disabled={!encuestaForm.titulo || !encuestaForm.tipo || !encuestaForm.fechaInicio || !encuestaForm.fechaFin}
            >
              Crear Encuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nuevo Evento */}
      <Dialog open={showEventoModal} onOpenChange={setShowEventoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titulo *</Label>
              <Input
                value={eventoForm.titulo}
                onChange={(e) => setEventoForm({ ...eventoForm, titulo: e.target.value })}
                placeholder="Titulo del evento"
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select
                value={eventoForm.tipo}
                onValueChange={(value) => setEventoForm({ ...eventoForm, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_EVENTO.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripcion</Label>
              <Textarea
                value={eventoForm.descripcion}
                onChange={(e) => setEventoForm({ ...eventoForm, descripcion: e.target.value })}
                placeholder="Descripcion del evento"
                rows={2}
              />
            </div>
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={eventoForm.fecha}
                onChange={(e) => setEventoForm({ ...eventoForm, fecha: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora Inicio</Label>
                <Input
                  type="time"
                  value={eventoForm.horaInicio}
                  onChange={(e) => setEventoForm({ ...eventoForm, horaInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Fin</Label>
                <Input
                  type="time"
                  value={eventoForm.horaFin}
                  onChange={(e) => setEventoForm({ ...eventoForm, horaFin: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Ubicacion</Label>
              <Input
                value={eventoForm.ubicacion}
                onChange={(e) => setEventoForm({ ...eventoForm, ubicacion: e.target.value })}
                placeholder="Lugar del evento"
              />
            </div>
            <div>
              <Label>Cupo Maximo</Label>
              <Input
                type="number"
                value={eventoForm.cupoMaximo}
                onChange={(e) => setEventoForm({ ...eventoForm, cupoMaximo: e.target.value })}
                placeholder="Dejar vacio para sin limite"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esObligatorio"
                checked={eventoForm.esObligatorio}
                onChange={(e) => setEventoForm({ ...eventoForm, esObligatorio: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="esObligatorio" className="cursor-pointer">Asistencia obligatoria</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventoModal(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateEvento}
              disabled={!eventoForm.titulo || !eventoForm.tipo || !eventoForm.fecha}
            >
              Crear Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nuevo Reconocimiento */}
      <Dialog open={showReconocimientoModal} onOpenChange={setShowReconocimientoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Reconocimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Empleado *</Label>
              <Select
                value={reconocimientoForm.empleadoId}
                onValueChange={(value) => setReconocimientoForm({ ...reconocimientoForm, empleadoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido} - {emp.cargo?.nombre || 'Sin cargo'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Reconocimiento *</Label>
              <Select
                value={reconocimientoForm.tipo}
                onValueChange={(value) => setReconocimientoForm({ ...reconocimientoForm, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_RECONOCIMIENTO.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titulo *</Label>
              <Input
                value={reconocimientoForm.titulo}
                onChange={(e) => setReconocimientoForm({ ...reconocimientoForm, titulo: e.target.value })}
                placeholder="Titulo del reconocimiento"
              />
            </div>
            <div>
              <Label>Descripcion</Label>
              <Textarea
                value={reconocimientoForm.descripcion}
                onChange={(e) => setReconocimientoForm({ ...reconocimientoForm, descripcion: e.target.value })}
                placeholder="Motivo del reconocimiento"
                rows={3}
              />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={reconocimientoForm.fecha}
                onChange={(e) => setReconocimientoForm({ ...reconocimientoForm, fecha: e.target.value })}
              />
            </div>
            <div>
              <Label>Valor Corporativo Asociado</Label>
              <Input
                value={reconocimientoForm.valorAsociado}
                onChange={(e) => setReconocimientoForm({ ...reconocimientoForm, valorAsociado: e.target.value })}
                placeholder="Ej: Compromiso, Excelencia, Trabajo en equipo"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esPublico"
                checked={reconocimientoForm.esPublico}
                onChange={(e) => setReconocimientoForm({ ...reconocimientoForm, esPublico: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="esPublico" className="cursor-pointer">Mostrar publicamente</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReconocimientoModal(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateReconocimiento}
              disabled={!reconocimientoForm.empleadoId || !reconocimientoForm.tipo || !reconocimientoForm.titulo}
            >
              Crear Reconocimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
