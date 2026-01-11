'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEventosAdversos } from '@/hooks/useEventosAdversos';
import { useSeguridadPaciente } from '@/hooks/useSeguridadPaciente';
import { useToast } from '@/hooks/use-toast';
import { TIPOS_EVENTO_ADVERSO, SEVERIDADES_EVENTO } from '@/constants/calidad';
import {
  AlertTriangle,
  Shield,
  ClipboardList,
  Search,
  Plus,
  Eye,
  RefreshCw,
  Calendar,
  User,
  FileText,
  Activity,
} from 'lucide-react';

export default function SeguridadPacienteModule({ user }) {
  const { toast } = useToast();
  const {
    eventos,
    estadisticas,
    loading: loadingEventos,
    fetchEventos,
    fetchEstadisticas,
    reportarEvento,
    fetchEventosCentinela,
  } = useEventosAdversos();

  const {
    rondas,
    practicas,
    adherencias,
    loading: loadingSeguridad,
    fetchRondas,
    fetchPracticas,
    fetchAdherencias,
    fetchDashboard: fetchDashboardSeguridad,
  } = useSeguridadPaciente();

  const [activeTab, setActiveTab] = useState('eventos');
  const [showReporteModal, setShowReporteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSeveridad, setFiltroSeveridad] = useState('all');
  const [nuevoEvento, setNuevoEvento] = useState({
    tipoEvento: '',
    severidad: '',
    servicioOcurrencia: '',
    descripcionEvento: '',
    accionesInmediatas: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchEventos(),
      fetchEstadisticas(),
      fetchRondas(),
      fetchPracticas(),
      fetchAdherencias(),
    ]);
  };

  const handleReportarEvento = async () => {
    const result = await reportarEvento(nuevoEvento);
    if (result.success) {
      toast({ title: 'Evento reportado exitosamente' });
      setShowReporteModal(false);
      setNuevoEvento({
        tipoEvento: '',
        severidad: '',
        servicioOcurrencia: '',
        descripcionEvento: '',
        accionesInmediatas: '',
      });
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const getSeveridadColor = (severidad) => {
    switch (severidad) {
      case 'CENTINELA': return 'bg-red-600 text-white';
      case 'GRAVE': return 'bg-orange-500 text-white';
      case 'MODERADO': return 'bg-yellow-500 text-black';
      case 'LEVE': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const loading = loadingEventos || loadingSeguridad;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            Seguridad del Paciente
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gesti\u00f3n de eventos adversos, rondas de seguridad y pr\u00e1cticas seguras
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setShowReporteModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Reportar Evento
          </Button>
        </div>
      </div>

      {/* Estad\u00edsticas r\u00e1pidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Eventos este mes</p>
                <p className="text-2xl font-bold">{estadisticas?.eventosEsteMes || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Centinela</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas?.centinela || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rondas Ejecutadas</p>
                <p className="text-2xl font-bold">{rondas.filter(r => r.estado === 'Ejecutada').length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Adherencia Global</p>
                <p className="text-2xl font-bold text-green-600">
                  {adherencias.length > 0
                    ? Math.round(adherencias.reduce((a, b) => a + parseFloat(b.porcentajeAdherencia), 0) / adherencias.length)
                    : 0}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="eventos">Eventos Adversos</TabsTrigger>
          <TabsTrigger value="rondas">Rondas de Seguridad</TabsTrigger>
          <TabsTrigger value="practicas">Pr\u00e1cticas Seguras</TabsTrigger>
          <TabsTrigger value="adherencia">Adherencia</TabsTrigger>
        </TabsList>

        {/* Tab: Eventos Adversos */}
        <TabsContent value="eventos" className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroSeveridad} onValueChange={setFiltroSeveridad}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(SEVERIDADES_EVENTO).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>C\u00f3digo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Severidad</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos
                .filter(e => {
                  const matchSearch = searchTerm === '' ||
                    e.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.descripcionEvento?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchSeveridad = filtroSeveridad === 'all' || e.severidad === filtroSeveridad;
                  return matchSearch && matchSeveridad;
                })
                .map((evento, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{evento.codigo}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPOS_EVENTO_ADVERSO[evento.tipoEvento]?.label || evento.tipoEvento}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeveridadColor(evento.severidad)}>
                        {evento.severidad}
                      </Badge>
                    </TableCell>
                    <TableCell>{evento.servicioOcurrencia}</TableCell>
                    <TableCell>
                      {new Date(evento.fechaEvento).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{evento.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {eventos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No hay eventos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Rondas de Seguridad */}
        <TabsContent value="rondas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Rondas de Seguridad</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Programar Ronda
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio/Unidad</TableHead>
                <TableHead>Fecha Programada</TableHead>
                <TableHead>Ejecutor</TableHead>
                <TableHead>Hallazgos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rondas.map((ronda, index) => (
                <TableRow key={index}>
                  <TableCell>{ronda.servicioId || ronda.unidadId || 'General'}</TableCell>
                  <TableCell>
                    {new Date(ronda.fechaProgramada).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{ronda.ejecutor?.nombre || 'Sin asignar'}</TableCell>
                  <TableCell>
                    {ronda.hallazgos ? Object.keys(ronda.hallazgos).length : 0}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ronda.estado}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rondas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No hay rondas programadas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Pr\u00e1cticas Seguras */}
        <TabsContent value="practicas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {practicas.map((practica, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">{practica.codigo}</Badge>
                      <h4 className="font-medium">{practica.nombre}</h4>
                      <p className="text-sm text-gray-500 mt-1">{practica.categoria}</p>
                    </div>
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {practica.descripcion}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Monitoreo: {practica.frecuenciaMonitoreo}
                    </span>
                    <Badge variant={practica.activo ? 'default' : 'secondary'}>
                      {practica.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {practicas.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-gray-500">
                  No hay pr\u00e1cticas seguras registradas
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Adherencia */}
        <TabsContent value="adherencia" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pr\u00e1ctica</TableHead>
                <TableHead>Per\u00edodo</TableHead>
                <TableHead>Evaluados</TableHead>
                <TableHead>Cumplen</TableHead>
                <TableHead>% Adherencia</TableHead>
                <TableHead>Evaluador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adherencias.map((adh, index) => (
                <TableRow key={index}>
                  <TableCell>{adh.practica?.nombre || 'N/A'}</TableCell>
                  <TableCell>{adh.periodo}</TableCell>
                  <TableCell>{adh.totalEvaluados}</TableCell>
                  <TableCell>{adh.totalCumplen}</TableCell>
                  <TableCell>
                    <Badge variant={parseFloat(adh.porcentajeAdherencia) >= 80 ? 'default' : 'destructive'}>
                      {adh.porcentajeAdherencia}%
                    </Badge>
                  </TableCell>
                  <TableCell>{adh.evaluador?.nombre || 'N/A'}</TableCell>
                </TableRow>
              ))}
              {adherencias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No hay registros de adherencia
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Modal Reportar Evento */}
      <Dialog open={showReporteModal} onOpenChange={setShowReporteModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reportar Evento Adverso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo de Evento</label>
                <Select
                  value={nuevoEvento.tipoEvento}
                  onValueChange={(v) => setNuevoEvento({ ...nuevoEvento, tipoEvento: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS_EVENTO_ADVERSO).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Severidad</label>
                <Select
                  value={nuevoEvento.severidad}
                  onValueChange={(v) => setNuevoEvento({ ...nuevoEvento, severidad: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione severidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERIDADES_EVENTO).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Servicio de Ocurrencia</label>
              <Input
                className="mt-1"
                value={nuevoEvento.servicioOcurrencia}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, servicioOcurrencia: e.target.value })}
                placeholder="Servicio donde ocurri\u00f3 el evento"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripci\u00f3n del Evento</label>
              <Textarea
                className="mt-1"
                rows={4}
                value={nuevoEvento.descripcionEvento}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, descripcionEvento: e.target.value })}
                placeholder="Describa detalladamente el evento..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Acciones Inmediatas Tomadas</label>
              <Textarea
                className="mt-1"
                rows={2}
                value={nuevoEvento.accionesInmediatas}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, accionesInmediatas: e.target.value })}
                placeholder="Describa las acciones inmediatas..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowReporteModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReportarEvento}>
                Reportar Evento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
