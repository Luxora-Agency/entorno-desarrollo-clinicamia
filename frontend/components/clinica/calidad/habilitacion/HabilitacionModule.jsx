'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useHabilitacion } from '@/hooks/useHabilitacion';
import { useToast } from '@/hooks/use-toast';
import { TIPOS_ESTANDAR_HABILITACION, ESTADOS_CUMPLIMIENTO, getColorForPercentage } from '@/constants/calidad';
import {
  Shield,
  ClipboardCheck,
  Search,
  Plus,
  FileText,
  Download,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Building,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

export default function HabilitacionModule({ user }) {
  const { toast } = useToast();
  const {
    estandares,
    autoevaluaciones,
    visitas,
    dashboard,
    loading,
    fetchEstandares,
    fetchAutoevaluaciones,
    fetchVisitas,
    fetchDashboard,
    createAutoevaluacion,
    exportarDeclaracionREPS,
  } = useHabilitacion();

  const [activeTab, setActiveTab] = useState('resumen');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstandar, setSelectedEstandar] = useState(null);
  const [showAutoevaluacionModal, setShowAutoevaluacionModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchEstandares(),
      fetchAutoevaluaciones(),
      fetchVisitas(),
      fetchDashboard(),
    ]);
  };

  const getEstadoCumplimientoColor = (estado) => {
    switch (estado) {
      case 'CUMPLE':
        return 'bg-green-100 text-green-800';
      case 'CUMPLE_PARCIAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'NO_CUMPLE':
        return 'bg-red-100 text-red-800';
      case 'NO_APLICA':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportarREPS = async () => {
    const result = await exportarDeclaracionREPS('xml');
    if (result.success) {
      toast({
        title: 'Exportaci\u00f3n exitosa',
        description: 'Declaraci\u00f3n REPS generada correctamente',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  // Resumen por tipo de est\u00e1ndar
  const resumenEstandares = Object.entries(TIPOS_ESTANDAR_HABILITACION).map(([key, value]) => {
    const estandaresTipo = estandares.filter(e => e.tipo === key);
    const cumplimiento = estandaresTipo.length > 0
      ? estandaresTipo.reduce((acc, e) => acc + (e.porcentajeCumplimiento || 0), 0) / estandaresTipo.length
      : 0;
    return {
      tipo: key,
      label: value.label,
      icon: value.icon,
      total: estandaresTipo.length,
      cumplimiento: Math.round(cumplimiento),
    };
  });

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Habilitaci\u00f3n - Sistema \u00danico de Habilitaci\u00f3n (SUH)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Resoluci\u00f3n 3100/2019 - Condiciones de habilitaci\u00f3n para prestadores de servicios de salud
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportarREPS}>
            <Download className="h-4 w-4 mr-2" />
            Exportar REPS
          </Button>
          <Button size="sm" onClick={() => setShowAutoevaluacionModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Autoevaluaci\u00f3n
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="estandares">Est\u00e1ndares</TabsTrigger>
          <TabsTrigger value="autoevaluaciones">Autoevaluaciones</TabsTrigger>
          <TabsTrigger value="visitas">Visitas</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="resumen" className="space-y-6">
          {/* Cards de resumen por tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {resumenEstandares.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{item.label}</p>
                      <p className="text-2xl font-bold mt-1">{item.cumplimiento}%</p>
                    </div>
                    <div className={`p-2 rounded-lg ${getColorForPercentage(item.cumplimiento).bg}`}>
                      <CheckCircle2 className={`h-5 w-5 ${getColorForPercentage(item.cumplimiento).text}`} />
                    </div>
                  </div>
                  <Progress value={item.cumplimiento} className="h-2 mt-3" />
                  <p className="text-xs text-gray-500 mt-2">{item.total} criterios evaluados</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dashboard de estado */}
          {dashboard && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado General de Habilitaci\u00f3n</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">
                      {dashboard.criteriosCumplen || 0}
                    </p>
                    <p className="text-sm text-gray-600">Cumplen</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600">
                      {dashboard.criteriosParciales || 0}
                    </p>
                    <p className="text-sm text-gray-600">Parciales</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">
                      {dashboard.criteriosNoCumplen || 0}
                    </p>
                    <p className="text-sm text-gray-600">No Cumplen</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">
                      {dashboard.porcentajeGlobal || 0}%
                    </p>
                    <p className="text-sm text-gray-600">Global</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* \u00daltimas visitas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">\u00daltimas Visitas de Verificaci\u00f3n</CardTitle>
            </CardHeader>
            <CardContent>
              {visitas.length > 0 ? (
                <div className="space-y-3">
                  {visitas.slice(0, 5).map((visita, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{visita.tipoVisita}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(visita.fechaVisita).toLocaleDateString()} - {visita.entidadVisitadora}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{visita.estado}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No hay visitas registradas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Est\u00e1ndares */}
        <TabsContent value="estandares" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar est\u00e1ndar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estandares
              .filter(e =>
                e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.codigo.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((estandar, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{estandar.codigo}</Badge>
                          <Badge className={getEstadoCumplimientoColor(estandar.cumplimiento)}>
                            {estandar.tipo}
                          </Badge>
                        </div>
                        <h3 className="font-medium mt-2">{estandar.nombre}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {estandar.descripcion}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedEstandar(estandar)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex-1">
                        <Progress value={estandar.porcentajeCumplimiento || 0} className="h-2" />
                      </div>
                      <span className="text-sm font-medium">
                        {estandar.porcentajeCumplimiento || 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Tab: Autoevaluaciones */}
        <TabsContent value="autoevaluaciones" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Est\u00e1ndar</TableHead>
                <TableHead>Evaluador</TableHead>
                <TableHead>Cumplimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {autoevaluaciones.map((eval_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {new Date(eval_.fechaEvaluacion).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{eval_.estandar?.nombre || 'N/A'}</TableCell>
                  <TableCell>{eval_.evaluador?.nombre || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={eval_.porcentajeCumplimiento} className="w-20 h-2" />
                      <span className="text-sm">{eval_.porcentajeCumplimiento}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{eval_.estado}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {autoevaluaciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No hay autoevaluaciones registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Visitas */}
        <TabsContent value="visitas" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Acta</TableHead>
                <TableHead>Plan Mejora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitas.map((visita, index) => (
                <TableRow key={index}>
                  <TableCell>{visita.tipoVisita}</TableCell>
                  <TableCell>
                    {new Date(visita.fechaVisita).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{visita.entidadVisitadora}</TableCell>
                  <TableCell>{visita.actaNumero || '-'}</TableCell>
                  <TableCell>
                    {visita.requierePlanMejora ? (
                      <Badge variant="destructive">Requerido</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{visita.estado}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visitas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No hay visitas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Modal Nueva Autoevaluaci\u00f3n */}
      <Dialog open={showAutoevaluacionModal} onOpenChange={setShowAutoevaluacionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Autoevaluaci\u00f3n</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Est\u00e1ndar a evaluar</label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccione un est\u00e1ndar" />
                </SelectTrigger>
                <SelectContent>
                  {estandares.map((e, i) => (
                    <SelectItem key={i} value={e.id}>
                      {e.codigo} - {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Observaciones</label>
              <Input className="mt-1" placeholder="Observaciones generales..." />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAutoevaluacionModal(false)}>
                Cancelar
              </Button>
              <Button>Iniciar Autoevaluaci\u00f3n</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
