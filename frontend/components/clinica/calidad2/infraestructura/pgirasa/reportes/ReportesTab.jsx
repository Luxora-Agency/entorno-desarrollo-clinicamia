'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Trash2,
  Filter,
  Calendar,
  FileSpreadsheet,
  FilePlus,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInfraestructuraReportes } from '@/hooks/useInfraestructuraReportes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReporteGeneratorForm from './ReporteGeneratorForm';

export default function ReportesTab({ user }) {
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [tipoReporteGenerar, setTipoReporteGenerar] = useState(null);
  const [tipos, setTipos] = useState([]);

  const {
    reportes,
    estadisticas,
    loading,
    generando,
    loadReportes,
    getTipos,
    loadEstadisticas,
    deleteReporte,
    descargarReporte,
  } = useInfraestructuraReportes();

  useEffect(() => {
    loadData();
    loadTipos();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadReportes({ tipo: tipoFiltro, estado: estadoFiltro, limit: 50 }),
      loadEstadisticas(),
    ]);
  };

  const loadTipos = async () => {
    const t = await getTipos();
    setTipos(t);
  };

  useEffect(() => {
    loadReportes({ tipo: tipoFiltro, estado: estadoFiltro, limit: 50 });
  }, [tipoFiltro, estadoFiltro]);

  const handleGenerarReporte = (tipo) => {
    setTipoReporteGenerar(tipo);
    setIsGeneratorOpen(true);
  };

  const handleEliminarReporte = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este reporte?')) {
      const success = await deleteReporte(id);
      if (success) {
        loadData();
      }
    }
  };

  const handleCloseGenerator = () => {
    setIsGeneratorOpen(false);
    setTipoReporteGenerar(null);
    loadData();
  };

  // Badge de estado
  const getEstadoBadge = (estado) => {
    const config = {
      GENERANDO: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      COMPLETADO: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      ERROR: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const { color, icon: Icon } = config[estado] || config.GENERANDO;

    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {estado}
      </Badge>
    );
  };

  // Badge de tipo de archivo
  const getTipoBadge = (tipo) => {
    if (tipo === 'EXCEL') {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <FileSpreadsheet className="w-3 h-3 mr-1" />
          Excel
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <FileText className="w-3 h-3 mr-1" />
        PDF
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Reportes PGIRASA
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Generación y descarga de reportes consolidados
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{estadisticas.total}</div>
              <div className="text-xs text-gray-600 mt-1">Total Reportes</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.porEstado?.COMPLETADO || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Completados</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {estadisticas.porEstado?.GENERANDO || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">En Proceso</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-red-600">
                {estadisticas.porEstado?.ERROR || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Con Errores</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs: Generar vs Historial */}
      <Tabs defaultValue="generar">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generar">
            <FilePlus className="w-4 h-4 mr-2" />
            Generar Reportes
          </TabsTrigger>
          <TabsTrigger value="historial">
            <FileText className="w-4 h-4 mr-2" />
            Historial de Reportes
          </TabsTrigger>
        </TabsList>

        {/* Tab: Generar Reportes */}
        <TabsContent value="generar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Reportes Disponibles</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {tipos.map(tipo => (
                <Card key={tipo.value} className="border-2 hover:border-blue-500 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{tipo.label}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {tipo.value === 'MENSUAL_RH1' && 'Reporte mensual de residuos hospitalarios en Excel'}
                          {tipo.value === 'SEMESTRAL_INDICADORES' && 'Reporte semestral de indicadores en PDF'}
                          {tipo.value === 'ANUAL_CONCEPTO' && 'Reporte anual de concepto sanitario en PDF'}
                          {tipo.value === 'PERSONALIZADO' && 'Configura filtros personalizados'}
                        </p>
                      </div>
                      {tipo.value === 'MENSUAL_RH1' && (
                        <FileSpreadsheet className="w-6 h-6 text-green-600" />
                      )}
                      {tipo.value !== 'MENSUAL_RH1' && (
                        <FileText className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <Button
                      onClick={() => handleGenerarReporte(tipo.value)}
                      className="w-full"
                      disabled={generando}
                    >
                      <FilePlus className="w-4 h-4 mr-2" />
                      Generar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="historial" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <Select value={tipoFiltro || 'TODOS'} onValueChange={(val) => setTipoFiltro(val === 'TODOS' ? '' : val)}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los Tipos</SelectItem>
                      {tipos.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={estadoFiltro || 'TODOS'} onValueChange={(val) => setEstadoFiltro(val === 'TODOS' ? '' : val)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los Estados</SelectItem>
                      <SelectItem value="COMPLETADO">Completados</SelectItem>
                      <SelectItem value="GENERANDO">En Proceso</SelectItem>
                      <SelectItem value="ERROR">Con Errores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de reportes */}
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Cargando reportes...
              </CardContent>
            </Card>
          ) : reportes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No se encontraron reportes</p>
                <p className="text-sm mt-1">Genera un nuevo reporte para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reportes.map(reporte => (
                <Card key={reporte.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{reporte.nombre}</h4>
                          {getEstadoBadge(reporte.estado)}
                          {reporte.archivoTipo && getTipoBadge(reporte.archivoTipo)}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Periodo: {reporte.periodo}</span>
                          </div>
                          {reporte.descripcion && (
                            <p className="text-xs text-gray-500">{reporte.descripcion}</p>
                          )}
                          <div className="text-xs text-gray-400">
                            Generado por: {reporte.generador?.nombre || 'Desconocido'} •{' '}
                            {format(new Date(reporte.fechaGeneracion), 'dd MMM yyyy HH:mm', { locale: es })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {reporte.estado === 'COMPLETADO' && reporte.archivoUrl && (
                          <Button
                            size="sm"
                            onClick={() => descargarReporte(reporte)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEliminarReporte(reporte.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de generador */}
      {isGeneratorOpen && tipoReporteGenerar && (
        <ReporteGeneratorForm
          tipo={tipoReporteGenerar}
          isOpen={isGeneratorOpen}
          onClose={handleCloseGenerator}
        />
      )}
    </div>
  );
}
