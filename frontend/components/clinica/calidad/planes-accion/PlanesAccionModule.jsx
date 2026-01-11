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
import { Progress } from '@/components/ui/progress';
import { usePlanesAccion } from '@/hooks/usePlanesAccion';
import { useToast } from '@/hooks/use-toast';
import { ORIGENES_PLAN_ACCION, TIPOS_ACCION } from '@/constants/calidad';
import {
  Target,
  Search,
  Plus,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Upload,
  FileText,
  Activity,
} from 'lucide-react';

export default function PlanesAccionModule({ user }) {
  const { toast } = useToast();
  const {
    planes,
    seguimientos,
    evidencias,
    loading,
    fetchPlanes,
    fetchSeguimientos,
    fetchEvidencias,
    createPlan,
    updatePlan,
    createSeguimiento,
    createEvidencia,
  } = usePlanesAccion();

  const [activeTab, setActiveTab] = useState('planes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState('all');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showNuevoPlan, setShowNuevoPlan] = useState(false);
  const [showNuevoSeguimiento, setShowNuevoSeguimiento] = useState(false);

  const [nuevoPlan, setNuevoPlan] = useState({
    origen: '',
    descripcionProblema: '',
    causaRaiz: '',
    accionPropuesta: '',
    tipoAccion: 'Correctiva',
    fechaInicio: '',
    fechaLimite: '',
    recursos: '',
    indicadorSeguimiento: '',
    metaEsperada: '',
  });

  const [nuevoSeguimiento, setNuevoSeguimiento] = useState({
    planId: '',
    avanceReportado: 0,
    descripcionAvance: '',
    dificultades: '',
    requiereAjuste: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchPlanes();
  };

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    await Promise.all([
      fetchSeguimientos(plan.id),
      fetchEvidencias(plan.id),
    ]);
  };

  const handleCrearPlan = async () => {
    if (!nuevoPlan.origen || !nuevoPlan.descripcionProblema || !nuevoPlan.accionPropuesta || !nuevoPlan.fechaLimite) {
      toast({ title: 'Complete los campos requeridos', variant: 'destructive' });
      return;
    }

    const result = await createPlan(nuevoPlan);
    if (result.success) {
      toast({ title: 'Plan de acción creado exitosamente' });
      setShowNuevoPlan(false);
      setNuevoPlan({
        origen: '',
        descripcionProblema: '',
        causaRaiz: '',
        accionPropuesta: '',
        tipoAccion: 'Correctiva',
        fechaInicio: '',
        fechaLimite: '',
        recursos: '',
        indicadorSeguimiento: '',
        metaEsperada: '',
      });
      await fetchPlanes();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleCrearSeguimiento = async () => {
    if (!nuevoSeguimiento.planId || !nuevoSeguimiento.descripcionAvance) {
      toast({ title: 'Complete los campos requeridos', variant: 'destructive' });
      return;
    }

    const result = await createSeguimiento(nuevoSeguimiento);
    if (result.success) {
      toast({ title: 'Seguimiento registrado' });
      setShowNuevoSeguimiento(false);
      setNuevoSeguimiento({
        planId: '',
        avanceReportado: 0,
        descripcionAvance: '',
        dificultades: '',
        requiereAjuste: false,
      });
      if (selectedPlan) {
        await fetchSeguimientos(selectedPlan.id);
        await fetchPlanes();
      }
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Cerrado': return 'bg-green-100 text-green-700';
      case 'En Proceso': return 'bg-blue-100 text-blue-700';
      case 'Abierto': return 'bg-yellow-100 text-yellow-700';
      case 'Vencido': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTipoAccionColor = (tipo) => {
    switch (tipo) {
      case 'Correctiva': return 'bg-red-100 text-red-700';
      case 'Preventiva': return 'bg-blue-100 text-blue-700';
      case 'Mejora': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getOrigenColor = (origen) => {
    switch (origen) {
      case 'Habilitacion': return 'bg-purple-100 text-purple-700';
      case 'PAMEC': return 'bg-green-100 text-green-700';
      case 'EventoAdverso': return 'bg-red-100 text-red-700';
      case 'Auditoria': return 'bg-blue-100 text-blue-700';
      case 'PQRS': return 'bg-orange-100 text-orange-700';
      case 'VisitaVerificacion': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

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

  // Estadísticas
  const planesAbiertos = planes.filter(p => p.estado === 'Abierto').length;
  const planesEnProceso = planes.filter(p => p.estado === 'En Proceso').length;
  const planesCerrados = planes.filter(p => p.estado === 'Cerrado').length;
  const planesVencidos = planes.filter(p => {
    const vencido = new Date(p.fechaLimite) < new Date();
    return vencido && p.estado !== 'Cerrado';
  }).length;

  const avancePromedio = planes.length > 0
    ? Math.round(planes.reduce((acc, p) => acc + (p.avancePorcentaje || 0), 0) / planes.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-teal-600" />
            Planes de Acción
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestión transversal de acciones correctivas, preventivas y de mejora
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={showNuevoPlan} onOpenChange={setShowNuevoPlan}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Plan de Acción</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Origen *</label>
                    <Select
                      value={nuevoPlan.origen}
                      onValueChange={(value) => setNuevoPlan({ ...nuevoPlan, origen: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione origen" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ORIGENES_PLAN_ACCION).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tipo de Acción *</label>
                    <Select
                      value={nuevoPlan.tipoAccion}
                      onValueChange={(value) => setNuevoPlan({ ...nuevoPlan, tipoAccion: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIPOS_ACCION).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción del Problema *</label>
                  <Textarea
                    placeholder="Describa el problema o hallazgo"
                    value={nuevoPlan.descripcionProblema}
                    onChange={(e) => setNuevoPlan({ ...nuevoPlan, descripcionProblema: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Causa Raíz</label>
                  <Textarea
                    placeholder="Análisis de causa raíz"
                    value={nuevoPlan.causaRaiz}
                    onChange={(e) => setNuevoPlan({ ...nuevoPlan, causaRaiz: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Acción Propuesta *</label>
                  <Textarea
                    placeholder="Describa la acción a implementar"
                    value={nuevoPlan.accionPropuesta}
                    onChange={(e) => setNuevoPlan({ ...nuevoPlan, accionPropuesta: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Fecha Inicio</label>
                    <Input
                      type="date"
                      value={nuevoPlan.fechaInicio}
                      onChange={(e) => setNuevoPlan({ ...nuevoPlan, fechaInicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha Límite *</label>
                    <Input
                      type="date"
                      value={nuevoPlan.fechaLimite}
                      onChange={(e) => setNuevoPlan({ ...nuevoPlan, fechaLimite: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Recursos Necesarios</label>
                  <Input
                    placeholder="Recursos humanos, técnicos, financieros"
                    value={nuevoPlan.recursos}
                    onChange={(e) => setNuevoPlan({ ...nuevoPlan, recursos: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Indicador de Seguimiento</label>
                    <Input
                      placeholder="Indicador para medir avance"
                      value={nuevoPlan.indicadorSeguimiento}
                      onChange={(e) => setNuevoPlan({ ...nuevoPlan, indicadorSeguimiento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Meta Esperada</label>
                    <Input
                      placeholder="Meta a alcanzar"
                      value={nuevoPlan.metaEsperada}
                      onChange={(e) => setNuevoPlan({ ...nuevoPlan, metaEsperada: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNuevoPlan(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCrearPlan}>
                    Crear Plan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Abiertos</p>
                <p className="text-2xl font-bold text-yellow-600">{planesAbiertos}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En Proceso</p>
                <p className="text-2xl font-bold text-blue-600">{planesEnProceso}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cerrados</p>
                <p className="text-2xl font-bold text-green-600">{planesCerrados}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{planesVencidos}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avance Promedio</p>
                <p className="text-2xl font-bold text-teal-600">{avancePromedio}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="planes">Planes de Acción</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="evidencias">Evidencias</TabsTrigger>
        </TabsList>

        {/* Tab: Planes */}
        <TabsContent value="planes" className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroOrigen} onValueChange={setFiltroOrigen}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(ORIGENES_PLAN_ACCION).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Abierto">Abierto</SelectItem>
                <SelectItem value="En Proceso">En Proceso</SelectItem>
                <SelectItem value="Cerrado">Cerrado</SelectItem>
                <SelectItem value="Vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {planes
              .filter(p => {
                const matchSearch = searchTerm === '' ||
                  p.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.descripcionProblema.toLowerCase().includes(searchTerm.toLowerCase());
                const matchOrigen = filtroOrigen === 'all' || p.origen === filtroOrigen;
                const matchEstado = filtroEstado === 'all' || p.estado === filtroEstado;
                return matchSearch && matchOrigen && matchEstado;
              })
              .map((plan, index) => {
                const vencido = new Date(plan.fechaLimite) < new Date() && plan.estado !== 'Cerrado';
                return (
                  <Card
                    key={index}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedPlan?.id === plan.id ? 'ring-2 ring-teal-500' : ''
                    } ${vencido ? 'border-red-200 bg-red-50' : ''}`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="font-mono">{plan.codigo}</Badge>
                            <Badge className={getOrigenColor(plan.origen)}>
                              {ORIGENES_PLAN_ACCION[plan.origen]?.label || plan.origen}
                            </Badge>
                            <Badge className={getTipoAccionColor(plan.tipoAccion)}>
                              {plan.tipoAccion}
                            </Badge>
                            <Badge className={getEstadoColor(vencido ? 'Vencido' : plan.estado)}>
                              {vencido ? 'Vencido' : plan.estado}
                            </Badge>
                          </div>
                          <p className="font-medium line-clamp-2">{plan.descripcionProblema}</p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            Acción: {plan.accionPropuesta}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className={`text-sm ${vencido ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {new Date(plan.fechaLimite).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="w-32">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">Avance</span>
                              <span className="text-sm font-medium">{plan.avancePorcentaje || 0}%</span>
                            </div>
                            <Progress value={plan.avancePorcentaje || 0} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            {planes.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No hay planes de acción registrados
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Seguimiento */}
        <TabsContent value="seguimiento" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Seguimiento de Planes</h3>
            <Dialog open={showNuevoSeguimiento} onOpenChange={setShowNuevoSeguimiento}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Seguimiento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Seguimiento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Plan de Acción *</label>
                    <Select
                      value={nuevoSeguimiento.planId}
                      onValueChange={(value) => setNuevoSeguimiento({ ...nuevoSeguimiento, planId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {planes
                          .filter(p => p.estado !== 'Cerrado')
                          .map(plan => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.codigo} - {plan.descripcionProblema.substring(0, 40)}...
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Avance Reportado (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={nuevoSeguimiento.avanceReportado}
                      onChange={(e) => setNuevoSeguimiento({ ...nuevoSeguimiento, avanceReportado: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descripción del Avance *</label>
                    <Textarea
                      placeholder="Describa el avance logrado"
                      value={nuevoSeguimiento.descripcionAvance}
                      onChange={(e) => setNuevoSeguimiento({ ...nuevoSeguimiento, descripcionAvance: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dificultades</label>
                    <Textarea
                      placeholder="Dificultades encontradas"
                      value={nuevoSeguimiento.dificultades}
                      onChange={(e) => setNuevoSeguimiento({ ...nuevoSeguimiento, dificultades: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requiereAjuste"
                      checked={nuevoSeguimiento.requiereAjuste}
                      onChange={(e) => setNuevoSeguimiento({ ...nuevoSeguimiento, requiereAjuste: e.target.checked })}
                    />
                    <label htmlFor="requiereAjuste" className="text-sm">
                      Requiere ajuste al plan
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNuevoSeguimiento(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCrearSeguimiento}>
                      Registrar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {selectedPlan ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Seguimientos - {selectedPlan.codigo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {seguimientos.length > 0 ? (
                  <div className="space-y-4">
                    {seguimientos.map((seg, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-16 text-center">
                          <div className="text-2xl font-bold text-teal-600">
                            {seg.avanceReportado}%
                          </div>
                          <Progress value={seg.avanceReportado} className="h-1 mt-1" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{seg.descripcionAvance}</p>
                          {seg.dificultades && (
                            <p className="text-sm text-red-600 mt-1">
                              Dificultades: {seg.dificultades}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(seg.fechaSeguimiento).toLocaleString()}
                            {seg.requiereAjuste && (
                              <Badge variant="outline" className="text-orange-600">
                                Requiere ajuste
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No hay seguimientos para este plan
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Seleccione un plan de acción para ver sus seguimientos
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Evidencias */}
        <TabsContent value="evidencias" className="space-y-4">
          {selectedPlan ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Evidencias - {selectedPlan.codigo}
                  </span>
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar Evidencia
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evidencias.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha Cargue</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evidencias.map((evidencia, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge variant="outline">{evidencia.tipo}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{evidencia.nombre}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {evidencia.descripcion || '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(evidencia.fechaCargue).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No hay evidencias cargadas para este plan
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Seleccione un plan de acción para ver sus evidencias
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
