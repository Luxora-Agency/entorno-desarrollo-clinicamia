'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIndicadoresSIC } from '@/hooks/useIndicadoresSIC';
import { useToast } from '@/hooks/use-toast';
import { DOMINIOS_INDICADOR_SIC, COLORES_SEMAFORO, getSemaforoForValue } from '@/constants/calidad';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Download,
  Eye,
  RefreshCw,
  Target,
  Activity,
  Heart,
  Smile,
} from 'lucide-react';

export default function IndicadoresSICModule({ user }) {
  const { toast } = useToast();
  const {
    indicadores,
    mediciones,
    dashboard,
    loading,
    fetchIndicadores,
    fetchMediciones,
    fetchDashboard,
    exportarReporteSISPRO,
    exportarPlantillaPISIS,
  } = useIndicadoresSIC();

  const [activeTab, setActiveTab] = useState('catalogo');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroDominio, setFiltroDominio] = useState('all');
  const [periodoActual, setPeriodoActual] = useState('2025-S1');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchIndicadores(),
      fetchMediciones(),
      fetchDashboard(),
    ]);
  };

  const handleExportarSISPRO = async () => {
    const result = await exportarReporteSISPRO(periodoActual);
    if (result.success) {
      toast({ title: 'Exportaci\u00f3n SISPRO generada' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const getDominioIcon = (dominio) => {
    switch (dominio) {
      case 'EFECTIVIDAD': return <Target className="h-5 w-5" />;
      case 'SEGURIDAD': return <Activity className="h-5 w-5" />;
      case 'EXPERIENCIA': return <Smile className="h-5 w-5" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getDominioColor = (dominio) => {
    switch (dominio) {
      case 'EFECTIVIDAD': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SEGURIDAD': return 'bg-red-100 text-red-700 border-red-200';
      case 'EXPERIENCIA': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSemaforoColor = (semaforo) => {
    switch (semaforo) {
      case 'VERDE': return 'bg-green-500';
      case 'AMARILLO': return 'bg-yellow-500';
      case 'ROJO': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
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

  // Resumen por dominio
  const resumenDominios = Object.entries(DOMINIOS_INDICADOR_SIC).map(([key, value]) => {
    const indicadoresDominio = indicadores.filter(i => i.dominio === key);
    const enMeta = indicadoresDominio.filter(i => i.cumpleMeta).length;
    return {
      dominio: key,
      label: value.label,
      total: indicadoresDominio.length,
      enMeta,
      porcentaje: indicadoresDominio.length > 0 ? Math.round((enMeta / indicadoresDominio.length) * 100) : 0,
    };
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Indicadores SIC - Resoluci\u00f3n 256/2016
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sistema de Informaci\u00f3n para la Calidad - Reporte Semestral
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportarSISPRO}>
            <Download className="h-4 w-4 mr-2" />
            Exportar SISPRO
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Medici\u00f3n
          </Button>
        </div>
      </div>

      {/* Resumen por Dominio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {resumenDominios.map((dominio, index) => (
          <Card key={index} className={`border ${getDominioColor(dominio.dominio)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getDominioIcon(dominio.dominio)}
                  <div>
                    <p className="font-medium">{dominio.label}</p>
                    <p className="text-sm opacity-75">{dominio.total} indicadores</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{dominio.porcentaje}%</p>
                  <p className="text-xs opacity-75">en meta</p>
                </div>
              </div>
              <Progress value={dominio.porcentaje} className="h-2 mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalogo">Cat\u00e1logo de Indicadores</TabsTrigger>
          <TabsTrigger value="mediciones">Mediciones</TabsTrigger>
          <TabsTrigger value="semaforo">Sem\u00e1foro</TabsTrigger>
        </TabsList>

        {/* Tab: Cat\u00e1logo */}
        <TabsContent value="catalogo" className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar indicador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroDominio} onValueChange={setFiltroDominio}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar dominio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(DOMINIOS_INDICADOR_SIC).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {indicadores
              .filter(i => {
                const matchSearch = searchTerm === '' ||
                  i.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  i.nombre.toLowerCase().includes(searchTerm.toLowerCase());
                const matchDominio = filtroDominio === 'all' || i.dominio === filtroDominio;
                return matchSearch && matchDominio;
              })
              .map((indicador, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono">{indicador.codigo}</Badge>
                          <Badge className={getDominioColor(indicador.dominio)}>
                            {indicador.dominio}
                          </Badge>
                        </div>
                        <h4 className="font-medium line-clamp-2">{indicador.nombre}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Meta: {indicador.metaInstitucional || indicador.metaNacional || 'N/D'}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-500">{indicador.periodicidadReporte}</span>
                      <Badge variant="outline">{indicador.unidadMedida}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Tab: Mediciones */}
        <TabsContent value="mediciones" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-500">Per\u00edodo:</span>
              <Select value={periodoActual} onValueChange={setPeriodoActual}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-S1">2025-S1</SelectItem>
                  <SelectItem value="2024-S2">2024-S2</SelectItem>
                  <SelectItem value="2024-S1">2024-S1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>C\u00f3digo</TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead>Numerador</TableHead>
                <TableHead>Denominador</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Meta</TableHead>
                <TableHead>Sem\u00e1foro</TableHead>
                <TableHead>SISPRO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mediciones
                .filter(m => m.periodo === periodoActual)
                .map((medicion, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{medicion.indicador?.codigo}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {medicion.indicador?.nombre}
                    </TableCell>
                    <TableCell>{medicion.numerador}</TableCell>
                    <TableCell>{medicion.denominador}</TableCell>
                    <TableCell className="font-bold">{medicion.resultado}%</TableCell>
                    <TableCell>{medicion.metaVigente || 'N/D'}</TableCell>
                    <TableCell>
                      <div className={`w-4 h-4 rounded-full ${getSemaforoColor(medicion.semaforoEstado)}`} />
                    </TableCell>
                    <TableCell>
                      {medicion.reportadoSISPRO ? (
                        <Badge variant="outline" className="text-green-600">Reportado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">Pendiente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {mediciones.filter(m => m.periodo === periodoActual).length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No hay mediciones para el per\u00edodo seleccionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Sem\u00e1foro */}
        <TabsContent value="semaforo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(COLORES_SEMAFORO).map(([color, config]) => (
              <Card key={color}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${
                      color === 'VERDE' ? 'bg-green-500' :
                      color === 'AMARILLO' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    {config.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">{config.descripcion}</p>
                  <div className="space-y-2">
                    {indicadores
                      .filter(i => {
                        const medicion = mediciones.find(m => m.indicadorId === i.id && m.periodo === periodoActual);
                        return medicion?.semaforoEstado === color;
                      })
                      .slice(0, 5)
                      .map((ind, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-mono">{ind.codigo}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">
                            {ind.nombre}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
