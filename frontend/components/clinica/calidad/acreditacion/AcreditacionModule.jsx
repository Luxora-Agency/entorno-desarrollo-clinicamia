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
import { useAcreditacion } from '@/hooks/useAcreditacion';
import { useToast } from '@/hooks/use-toast';
import { GRUPOS_ACREDITACION } from '@/constants/calidad';
import {
  Award,
  Search,
  Plus,
  Eye,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  Users,
  Building,
  Settings,
  BarChart3,
} from 'lucide-react';

export default function AcreditacionModule({ user }) {
  const { toast } = useToast();
  const {
    estandares,
    evaluaciones,
    grupos,
    loading,
    fetchEstandares,
    fetchEvaluaciones,
    fetchGrupos,
    createEvaluacion,
    getResumenPorGrupo,
  } = useAcreditacion();

  const [activeTab, setActiveTab] = useState('resumen');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('all');
  const [selectedEstandar, setSelectedEstandar] = useState(null);
  const [showNuevaEvaluacion, setShowNuevaEvaluacion] = useState(false);
  const [resumenGrupos, setResumenGrupos] = useState([]);

  const [nuevaEvaluacion, setNuevaEvaluacion] = useState({
    estandarId: '',
    calificacion: 3,
    fortalezas: '',
    oportunidadesMejora: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchEstandares(),
      fetchEvaluaciones(),
      fetchGrupos(),
    ]);
    await loadResumenGrupos();
  };

  const loadResumenGrupos = async () => {
    const result = await getResumenPorGrupo();
    if (result.success) {
      setResumenGrupos(result.data);
    }
  };

  const handleCrearEvaluacion = async () => {
    if (!nuevaEvaluacion.estandarId) {
      toast({ title: 'Seleccione un estándar', variant: 'destructive' });
      return;
    }

    const result = await createEvaluacion(nuevaEvaluacion);
    if (result.success) {
      toast({ title: 'Evaluación registrada exitosamente' });
      setShowNuevaEvaluacion(false);
      setNuevaEvaluacion({
        estandarId: '',
        calificacion: 3,
        fortalezas: '',
        oportunidadesMejora: '',
      });
      await fetchEvaluaciones();
      await loadResumenGrupos();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const getGrupoIcon = (grupo) => {
    switch (grupo) {
      case 'ATENCION_CLIENTE': return <Users className="h-5 w-5" />;
      case 'APOYO_ADMINISTRATIVO': return <Settings className="h-5 w-5" />;
      case 'DIRECCIONAMIENTO': return <Target className="h-5 w-5" />;
      case 'GERENCIA': return <Building className="h-5 w-5" />;
      case 'RECURSO_HUMANO': return <Users className="h-5 w-5" />;
      case 'AMBIENTE_FISICO': return <Building className="h-5 w-5" />;
      case 'INFORMACION': return <FileText className="h-5 w-5" />;
      case 'MEJORAMIENTO_CALIDAD': return <TrendingUp className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const getGrupoColor = (grupo) => {
    switch (grupo) {
      case 'ATENCION_CLIENTE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'APOYO_ADMINISTRATIVO': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'DIRECCIONAMIENTO': return 'bg-green-100 text-green-700 border-green-200';
      case 'GERENCIA': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'RECURSO_HUMANO': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'AMBIENTE_FISICO': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'INFORMACION': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'MEJORAMIENTO_CALIDAD': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCalificacionColor = (calificacion) => {
    if (calificacion >= 4) return 'bg-green-500';
    if (calificacion >= 3) return 'bg-yellow-500';
    if (calificacion >= 2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const renderStars = (calificacion) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= calificacion ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Estadísticas generales
  const promedioGeneral = resumenGrupos.length > 0
    ? (resumenGrupos.reduce((acc, g) => acc + (g.promedioCalificacion || 0), 0) / resumenGrupos.length).toFixed(1)
    : 0;
  const estandaresEvaluados = evaluaciones.length;
  const estandaresTotales = estandares.length;
  const porcentajeEvaluado = estandaresTotales > 0
    ? Math.round((new Set(evaluaciones.map(e => e.estandarId)).size / estandaresTotales) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-600" />
            Acreditación en Salud - SUA
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sistema Único de Acreditación - Resolución 5095/2018
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={showNuevaEvaluacion} onOpenChange={setShowNuevaEvaluacion}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Evaluación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Evaluar Estándar de Acreditación</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Estándar *</label>
                  <Select
                    value={nuevaEvaluacion.estandarId}
                    onValueChange={(value) => setNuevaEvaluacion({ ...nuevaEvaluacion, estandarId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione estándar" />
                    </SelectTrigger>
                    <SelectContent>
                      {estandares.map(estandar => (
                        <SelectItem key={estandar.id} value={estandar.id}>
                          {estandar.codigo} - {estandar.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Calificación (1-5)</label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNuevaEvaluacion({ ...nuevaEvaluacion, calificacion: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= nuevaEvaluacion.calificacion
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-lg font-bold">{nuevaEvaluacion.calificacion}/5</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Fortalezas</label>
                  <Textarea
                    placeholder="Fortalezas identificadas"
                    value={nuevaEvaluacion.fortalezas}
                    onChange={(e) => setNuevaEvaluacion({ ...nuevaEvaluacion, fortalezas: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Oportunidades de Mejora</label>
                  <Textarea
                    placeholder="Oportunidades de mejora identificadas"
                    value={nuevaEvaluacion.oportunidadesMejora}
                    onChange={(e) => setNuevaEvaluacion({ ...nuevaEvaluacion, oportunidadesMejora: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNuevaEvaluacion(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCrearEvaluacion}>
                    Guardar Evaluación
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Promedio General</p>
                <p className="text-2xl font-bold text-amber-600">{promedioGeneral}/5</p>
              </div>
              <Star className="h-8 w-8 text-amber-500 fill-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Estándares Totales</p>
                <p className="text-2xl font-bold">{estandaresTotales}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Evaluaciones</p>
                <p className="text-2xl font-bold text-green-600">{estandaresEvaluados}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">% Evaluado</p>
                <p className="text-2xl font-bold text-purple-600">{porcentajeEvaluado}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="resumen">Resumen por Grupo</TabsTrigger>
          <TabsTrigger value="estandares">Estándares</TabsTrigger>
          <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen por Grupo */}
        <TabsContent value="resumen" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(GRUPOS_ACREDITACION).map(([key, value]) => {
              const resumen = resumenGrupos.find(r => r.grupo === key) || {
                promedioCalificacion: 0,
                estandaresEvaluados: 0,
                totalEstandares: estandares.filter(e => e.grupo === key).length,
              };
              const porcentaje = resumen.totalEstandares > 0
                ? Math.round((resumen.estandaresEvaluados / resumen.totalEstandares) * 100)
                : 0;

              return (
                <Card key={key} className={`border ${getGrupoColor(key)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getGrupoIcon(key)}
                        <div>
                          <h4 className="font-medium">{value.label}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {resumen.estandaresEvaluados}/{resumen.totalEstandares} estándares evaluados
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {renderStars(Math.round(resumen.promedioCalificacion || 0))}
                        </div>
                        <p className="text-lg font-bold">
                          {(resumen.promedioCalificacion || 0).toFixed(1)}/5
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progreso de evaluación</span>
                        <span>{porcentaje}%</span>
                      </div>
                      <Progress value={porcentaje} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Estándares */}
        <TabsContent value="estandares" className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar estándar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(GRUPOS_ACREDITACION).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Última Evaluación</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estandares
                .filter(e => {
                  const matchSearch = searchTerm === '' ||
                    e.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.nombre.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchGrupo = filtroGrupo === 'all' || e.grupo === filtroGrupo;
                  return matchSearch && matchGrupo;
                })
                .map((estandar, index) => {
                  const ultimaEval = evaluaciones
                    .filter(ev => ev.estandarId === estandar.id)
                    .sort((a, b) => new Date(b.fechaEvaluacion) - new Date(a.fechaEvaluacion))[0];

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{estandar.codigo}</TableCell>
                      <TableCell className="max-w-xs truncate font-medium">
                        {estandar.nombre}
                      </TableCell>
                      <TableCell>
                        <Badge className={getGrupoColor(estandar.grupo)}>
                          {GRUPOS_ACREDITACION[estandar.grupo]?.label || estandar.grupo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ultimaEval
                          ? new Date(ultimaEval.fechaEvaluacion).toLocaleDateString()
                          : 'Sin evaluar'}
                      </TableCell>
                      <TableCell>
                        {ultimaEval ? (
                          <div className="flex items-center gap-2">
                            {renderStars(ultimaEval.calificacion)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {estandares.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No hay estándares registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Evaluaciones */}
        <TabsContent value="evaluaciones" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Estándar</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Fortalezas</TableHead>
                <TableHead>Oportunidades</TableHead>
                <TableHead>Evaluador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluaciones
                .sort((a, b) => new Date(b.fechaEvaluacion) - new Date(a.fechaEvaluacion))
                .map((evaluacion, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(evaluacion.fechaEvaluacion).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-medium">
                      {evaluacion.estandar?.codigo} - {evaluacion.estandar?.nombre}
                    </TableCell>
                    <TableCell>
                      <Badge className={getGrupoColor(evaluacion.estandar?.grupo)}>
                        {GRUPOS_ACREDITACION[evaluacion.estandar?.grupo]?.label || evaluacion.estandar?.grupo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderStars(evaluacion.calificacion)}
                        <span className="font-medium">{evaluacion.calificacion}/5</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {evaluacion.fortalezas || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {evaluacion.oportunidadesMejora || '-'}
                    </TableCell>
                    <TableCell>{evaluacion.evaluador?.nombre || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              {evaluaciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No hay evaluaciones registradas
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
