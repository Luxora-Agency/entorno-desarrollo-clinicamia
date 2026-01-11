'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useVigilanciaSalud } from '@/hooks/useVigilanciaSalud';
import { useToast } from '@/hooks/use-toast';
import { EVENTOS_SIVIGILA } from '@/constants/calidad';
import {
  AlertTriangle,
  Pill,
  Cpu,
  Search,
  Plus,
  Download,
  Eye,
  RefreshCw,
  FileText,
  Activity,
  Send,
  Calendar,
} from 'lucide-react';

export default function VigilanciaModule({ user }) {
  const { toast } = useToast();
  const {
    notificacionesSIVIGILA,
    reportesFarmacovigilancia,
    reportesTecnovigilancia,
    loading,
    fetchNotificacionesSIVIGILA,
    fetchReportesFarmacovigilancia,
    fetchReportesTecnovigilancia,
    createNotificacionSIVIGILA,
    createReporteFarmacovigilancia,
    createReporteTecnovigilancia,
    exportarFichaSIVIGILA,
  } = useVigilanciaSalud();

  const [activeTab, setActiveTab] = useState('sivigila');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSemana, setFiltroSemana] = useState('all');
  const [showNuevoSIVIGILA, setShowNuevoSIVIGILA] = useState(false);
  const [showNuevoFarmaco, setShowNuevoFarmaco] = useState(false);
  const [showNuevoTecno, setShowNuevoTecno] = useState(false);

  const [nuevoSIVIGILA, setNuevoSIVIGILA] = useState({
    pacienteId: '',
    codigoEvento: '',
    nombreEvento: '',
    tipoNotificacion: 'Semanal',
    fechaInicioSintomas: '',
    clasificacionInicial: '',
    observaciones: '',
  });

  const [nuevoFarmaco, setNuevoFarmaco] = useState({
    pacienteId: '',
    productoId: '',
    tipoReporte: 'RAM',
    fechaEvento: '',
    descripcionReaccion: '',
    gravedadReaccion: 'Leve',
    accionTomada: '',
  });

  const [nuevoTecno, setNuevoTecno] = useState({
    pacienteId: '',
    nombreDispositivo: '',
    fabricante: '',
    fechaEvento: '',
    descripcionIncidente: '',
    gravedadIncidente: 'Leve',
    accionTomada: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchNotificacionesSIVIGILA(),
      fetchReportesFarmacovigilancia(),
      fetchReportesTecnovigilancia(),
    ]);
  };

  const handleCrearSIVIGILA = async () => {
    if (!nuevoSIVIGILA.codigoEvento || !nuevoSIVIGILA.nombreEvento) {
      toast({ title: 'Complete los campos requeridos', variant: 'destructive' });
      return;
    }

    const result = await createNotificacionSIVIGILA(nuevoSIVIGILA);
    if (result.success) {
      toast({ title: 'Notificación SIVIGILA creada' });
      setShowNuevoSIVIGILA(false);
      setNuevoSIVIGILA({
        pacienteId: '',
        codigoEvento: '',
        nombreEvento: '',
        tipoNotificacion: 'Semanal',
        fechaInicioSintomas: '',
        clasificacionInicial: '',
        observaciones: '',
      });
      await fetchNotificacionesSIVIGILA();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleCrearFarmaco = async () => {
    if (!nuevoFarmaco.descripcionReaccion) {
      toast({ title: 'Complete la descripción de la reacción', variant: 'destructive' });
      return;
    }

    const result = await createReporteFarmacovigilancia(nuevoFarmaco);
    if (result.success) {
      toast({ title: 'Reporte de farmacovigilancia creado' });
      setShowNuevoFarmaco(false);
      await fetchReportesFarmacovigilancia();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleCrearTecno = async () => {
    if (!nuevoTecno.nombreDispositivo || !nuevoTecno.descripcionIncidente) {
      toast({ title: 'Complete los campos requeridos', variant: 'destructive' });
      return;
    }

    const result = await createReporteTecnovigilancia(nuevoTecno);
    if (result.success) {
      toast({ title: 'Reporte de tecnovigilancia creado' });
      setShowNuevoTecno(false);
      await fetchReportesTecnovigilancia();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleExportarFicha = async (notificacionId) => {
    const result = await exportarFichaSIVIGILA(notificacionId);
    if (result.success) {
      toast({ title: 'Ficha SIVIGILA exportada' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const getGravedadColor = (gravedad) => {
    switch (gravedad) {
      case 'Leve': return 'bg-green-100 text-green-700';
      case 'Moderada': return 'bg-yellow-100 text-yellow-700';
      case 'Grave': return 'bg-orange-100 text-orange-700';
      case 'Mortal': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTipoNotificacionColor = (tipo) => {
    return tipo === 'Inmediata'
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Estadísticas
  const sivigilaPendientes = notificacionesSIVIGILA.filter(n => !n.enviadoINS).length;
  const farmacoPendientes = reportesFarmacovigilancia.filter(r => !r.reportadoINVIMA).length;
  const tecnoPendientes = reportesTecnovigilancia.filter(r => !r.reportadoINVIMA).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-600" />
            Vigilancia en Salud Pública
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            SIVIGILA, Farmacovigilancia y Tecnovigilancia
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">SIVIGILA Pendientes INS</p>
                <p className="text-2xl font-bold text-orange-600">{sivigilaPendientes}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Farmacovigilancia Pendientes</p>
                <p className="text-2xl font-bold text-purple-600">{farmacoPendientes}</p>
              </div>
              <Pill className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tecnovigilancia Pendientes</p>
                <p className="text-2xl font-bold text-blue-600">{tecnoPendientes}</p>
              </div>
              <Cpu className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sivigila">SIVIGILA</TabsTrigger>
          <TabsTrigger value="farmacovigilancia">Farmacovigilancia</TabsTrigger>
          <TabsTrigger value="tecnovigilancia">Tecnovigilancia</TabsTrigger>
        </TabsList>

        {/* Tab: SIVIGILA */}
        <TabsContent value="sivigila" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[250px]"
                />
              </div>
              <Select value={filtroSemana} onValueChange={setFiltroSemana}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semana epidem." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Array.from({ length: 52 }, (_, i) => i + 1).map(sem => (
                    <SelectItem key={sem} value={sem.toString()}>Semana {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showNuevoSIVIGILA} onOpenChange={setShowNuevoSIVIGILA}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Notificación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nueva Notificación SIVIGILA</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Código Evento *</label>
                      <Select
                        value={nuevoSIVIGILA.codigoEvento}
                        onValueChange={(value) => {
                          const evento = EVENTOS_SIVIGILA.find(e => e.codigo === value);
                          setNuevoSIVIGILA({
                            ...nuevoSIVIGILA,
                            codigoEvento: value,
                            nombreEvento: evento?.nombre || '',
                            tipoNotificacion: evento?.tipo || 'Semanal',
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENTOS_SIVIGILA.map(evento => (
                            <SelectItem key={evento.codigo} value={evento.codigo}>
                              {evento.codigo} - {evento.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tipo Notificación</label>
                      <Input value={nuevoSIVIGILA.tipoNotificacion} disabled />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha Inicio Síntomas</label>
                    <Input
                      type="date"
                      value={nuevoSIVIGILA.fechaInicioSintomas}
                      onChange={(e) => setNuevoSIVIGILA({ ...nuevoSIVIGILA, fechaInicioSintomas: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Clasificación Inicial</label>
                    <Select
                      value={nuevoSIVIGILA.clasificacionInicial}
                      onValueChange={(value) => setNuevoSIVIGILA({ ...nuevoSIVIGILA, clasificacionInicial: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sospechoso">Sospechoso</SelectItem>
                        <SelectItem value="Probable">Probable</SelectItem>
                        <SelectItem value="Confirmado_Laboratorio">Confirmado por Laboratorio</SelectItem>
                        <SelectItem value="Confirmado_Clinica">Confirmado por Clínica</SelectItem>
                        <SelectItem value="Confirmado_Nexo">Confirmado por Nexo Epidemiológico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Observaciones</label>
                    <Textarea
                      value={nuevoSIVIGILA.observaciones}
                      onChange={(e) => setNuevoSIVIGILA({ ...nuevoSIVIGILA, observaciones: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNuevoSIVIGILA(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCrearSIVIGILA}>
                      Crear Notificación
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Semana Epid.</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Clasificación</TableHead>
                <TableHead>Enviado INS</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificacionesSIVIGILA
                .filter(n =>
                  (searchTerm === '' ||
                    n.codigoEvento.includes(searchTerm) ||
                    n.nombreEvento.toLowerCase().includes(searchTerm.toLowerCase())) &&
                  (filtroSemana === 'all' || n.semanaEpidemiologica.toString() === filtroSemana)
                )
                .map((notificacion, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{notificacion.codigoEvento}</TableCell>
                    <TableCell className="max-w-xs truncate">{notificacion.nombreEvento}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        SE {notificacion.semanaEpidemiologica}/{notificacion.anioEpidemiologico}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoNotificacionColor(notificacion.tipoNotificacion)}>
                        {notificacion.tipoNotificacion}
                      </Badge>
                    </TableCell>
                    <TableCell>{notificacion.clasificacionInicial || 'N/A'}</TableCell>
                    <TableCell>
                      {notificacion.enviadoINS ? (
                        <Badge className="bg-green-100 text-green-700">Enviado</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExportarFicha(notificacion.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {notificacionesSIVIGILA.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No hay notificaciones SIVIGILA
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Farmacovigilancia */}
        <TabsContent value="farmacovigilancia" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Reportes de Reacciones Adversas a Medicamentos (RAM)</h3>
            <Dialog open={showNuevoFarmaco} onOpenChange={setShowNuevoFarmaco}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Reporte
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Reporte de Farmacovigilancia</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Reporte</label>
                    <Select
                      value={nuevoFarmaco.tipoReporte}
                      onValueChange={(value) => setNuevoFarmaco({ ...nuevoFarmaco, tipoReporte: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RAM">Reacción Adversa a Medicamento</SelectItem>
                        <SelectItem value="PRM">Problema Relacionado con Medicamento</SelectItem>
                        <SelectItem value="Falla_Terapeutica">Falla Terapéutica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha del Evento</label>
                    <Input
                      type="date"
                      value={nuevoFarmaco.fechaEvento}
                      onChange={(e) => setNuevoFarmaco({ ...nuevoFarmaco, fechaEvento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descripción de la Reacción *</label>
                    <Textarea
                      value={nuevoFarmaco.descripcionReaccion}
                      onChange={(e) => setNuevoFarmaco({ ...nuevoFarmaco, descripcionReaccion: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Gravedad</label>
                    <Select
                      value={nuevoFarmaco.gravedadReaccion}
                      onValueChange={(value) => setNuevoFarmaco({ ...nuevoFarmaco, gravedadReaccion: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Leve">Leve</SelectItem>
                        <SelectItem value="Moderada">Moderada</SelectItem>
                        <SelectItem value="Grave">Grave</SelectItem>
                        <SelectItem value="Mortal">Mortal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Acción Tomada</label>
                    <Textarea
                      value={nuevoFarmaco.accionTomada}
                      onChange={(e) => setNuevoFarmaco({ ...nuevoFarmaco, accionTomada: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNuevoFarmaco(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCrearFarmaco}>
                      Crear Reporte
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha Evento</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Gravedad</TableHead>
                <TableHead>Causalidad</TableHead>
                <TableHead>INVIMA</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportesFarmacovigilancia.map((reporte, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant="outline">{reporte.tipoReporte}</Badge>
                  </TableCell>
                  <TableCell>{new Date(reporte.fechaEvento).toLocaleDateString()}</TableCell>
                  <TableCell className="max-w-xs truncate">{reporte.descripcionReaccion}</TableCell>
                  <TableCell>
                    <Badge className={getGravedadColor(reporte.gravedadReaccion)}>
                      {reporte.gravedadReaccion}
                    </Badge>
                  </TableCell>
                  <TableCell>{reporte.causalidad || 'Por evaluar'}</TableCell>
                  <TableCell>
                    {reporte.reportadoINVIMA ? (
                      <Badge className="bg-green-100 text-green-700">Reportado</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {reportesFarmacovigilancia.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No hay reportes de farmacovigilancia
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Tecnovigilancia */}
        <TabsContent value="tecnovigilancia" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Reportes de Incidentes con Dispositivos Médicos</h3>
            <Dialog open={showNuevoTecno} onOpenChange={setShowNuevoTecno}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Reporte
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Reporte de Tecnovigilancia</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Nombre del Dispositivo *</label>
                    <Input
                      value={nuevoTecno.nombreDispositivo}
                      onChange={(e) => setNuevoTecno({ ...nuevoTecno, nombreDispositivo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fabricante</label>
                    <Input
                      value={nuevoTecno.fabricante}
                      onChange={(e) => setNuevoTecno({ ...nuevoTecno, fabricante: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha del Evento</label>
                    <Input
                      type="date"
                      value={nuevoTecno.fechaEvento}
                      onChange={(e) => setNuevoTecno({ ...nuevoTecno, fechaEvento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descripción del Incidente *</label>
                    <Textarea
                      value={nuevoTecno.descripcionIncidente}
                      onChange={(e) => setNuevoTecno({ ...nuevoTecno, descripcionIncidente: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Gravedad</label>
                    <Select
                      value={nuevoTecno.gravedadIncidente}
                      onValueChange={(value) => setNuevoTecno({ ...nuevoTecno, gravedadIncidente: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Leve">Leve</SelectItem>
                        <SelectItem value="Moderada">Moderada</SelectItem>
                        <SelectItem value="Grave">Grave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Acción Tomada</label>
                    <Textarea
                      value={nuevoTecno.accionTomada}
                      onChange={(e) => setNuevoTecno({ ...nuevoTecno, accionTomada: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNuevoTecno(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCrearTecno}>
                      Crear Reporte
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Fecha Evento</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Gravedad</TableHead>
                <TableHead>INVIMA</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportesTecnovigilancia.map((reporte, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{reporte.nombreDispositivo}</TableCell>
                  <TableCell>{reporte.fabricante || 'N/A'}</TableCell>
                  <TableCell>{new Date(reporte.fechaEvento).toLocaleDateString()}</TableCell>
                  <TableCell className="max-w-xs truncate">{reporte.descripcionIncidente}</TableCell>
                  <TableCell>
                    <Badge className={getGravedadColor(reporte.gravedadIncidente)}>
                      {reporte.gravedadIncidente}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {reporte.reportadoINVIMA ? (
                      <Badge className="bg-green-100 text-green-700">Reportado</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {reportesTecnovigilancia.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No hay reportes de tecnovigilancia
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
