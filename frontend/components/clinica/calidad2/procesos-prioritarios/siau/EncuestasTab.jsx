'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  RefreshCw,
  Filter,
  BarChart3,
  FileText,
  Star,
  TrendingUp,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react';
import { useCalidad2Encuestas } from '@/hooks/useCalidad2Encuestas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EncuestaForm from './EncuestaForm';
import AnalisisEncuestas from './AnalisisEncuestas';

export default function EncuestasTab() {
  const {
    encuestas,
    estadisticas,
    pagination,
    loading,
    error,
    fetchEncuestas,
    deleteEncuesta,
    refreshAll,
  } = useCalidad2Encuestas();

  const [showForm, setShowForm] = useState(false);
  const [selectedEncuesta, setSelectedEncuesta] = useState(null);
  const [filters, setFilters] = useState({
    servicioAtendido: '',
    tipoEncuesta: '',
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value === 'all' ? '' : value };
    setFilters(newFilters);
    fetchEncuestas(newFilters);
  };

  const handleEdit = (encuesta) => {
    setSelectedEncuesta(encuesta);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta encuesta?')) {
      await deleteEncuesta(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedEncuesta(null);
  };

  const EncuestaCard = ({ encuesta }) => {
    // Determinar si es una encuesta de consulta (POST_CONSULTA) o de calidad general
    const esEncuestaConsulta = encuesta.tipoEncuesta === 'POST_CONSULTA';

    // Calcular promedio según el tipo de encuesta
    let promedio;
    if (esEncuestaConsulta) {
      const campos = [
        encuesta.atencionDoctor,
        encuesta.claridadDoctor,
        encuesta.tiempoConsulta,
        encuesta.empatiaDoctor,
        encuesta.satisfaccionGeneral
      ].filter(v => v != null && v > 0);
      promedio = campos.length > 0 ? campos.reduce((a, b) => a + b, 0) / campos.length : 0;
    } else {
      const campos = [
        encuesta.accesibilidad,
        encuesta.oportunidad,
        encuesta.seguridadPaciente,
        encuesta.experienciaAtencion,
        encuesta.satisfaccionGeneral
      ].filter(v => v != null && v > 0);
      promedio = campos.length > 0 ? campos.reduce((a, b) => a + b, 0) / campos.length : 0;
    }

    const getPromedioColor = (prom) => {
      if (prom >= 4.5) return 'text-green-600';
      if (prom >= 4.0) return 'text-blue-600';
      if (prom >= 3.0) return 'text-orange-600';
      return 'text-red-600';
    };

    const getTipoLabel = (tipo) => {
      const labels = {
        'POST_CONSULTA': 'Consulta Médica',
        'SATISFACCION': 'Satisfacción General',
        'SALIDA': 'Encuesta de Salida',
        'AMBULATORIO': 'Atención Ambulatoria'
      };
      return labels[tipo] || tipo;
    };

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {encuesta.servicioAtendido && (
                  <Badge variant="outline">{encuesta.servicioAtendido}</Badge>
                )}
                <Badge variant={esEncuestaConsulta ? "default" : "secondary"} className={esEncuestaConsulta ? "bg-cyan-600" : ""}>
                  {getTipoLabel(encuesta.tipoEncuesta)}
                </Badge>
                {encuesta.canal && (
                  <Badge variant="outline" className="text-xs">
                    {encuesta.canal}
                  </Badge>
                )}
                {encuesta.recomendaria === true && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    Recomienda
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {encuesta.nombrePaciente && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{encuesta.nombrePaciente}</span>
                  </div>
                )}
                {esEncuestaConsulta && encuesta.nombreDoctor && (
                  <div className="flex items-center gap-2 text-sm text-cyan-700">
                    <span className="font-medium">Dr. {encuesta.nombreDoctor}</span>
                    {encuesta.especialidad && (
                      <span className="text-muted-foreground">({encuesta.especialidad})</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(encuesta.fechaRespuesta || encuesta.fechaEncuesta || encuesta.createdAt), 'dd/MM/yyyy', { locale: es })}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getPromedioColor(promedio)}`}>
                {promedio.toFixed(1)}
              </div>
              <div className="flex justify-end">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(promedio)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Dimensiones - diferentes según tipo de encuesta */}
          {esEncuestaConsulta ? (
            // Dimensiones para encuestas de consulta
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground">Atención Doctor</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{encuesta.atencionDoctor || 0}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Claridad</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{encuesta.claridadDoctor || 0}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Tiempo</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{encuesta.tiempoConsulta || 0}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Empatía</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{encuesta.empatiaDoctor || 0}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">General</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{encuesta.satisfaccionGeneral || 0}</span>
                </div>
              </div>
            </div>
          ) : (
            // Dimensiones para encuestas de calidad general
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground">Accesibilidad</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{encuesta.accesibilidad || 0}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Oportunidad</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{encuesta.oportunidad || 0}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Seguridad</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{encuesta.seguridadPaciente || 0}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Experiencia</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{encuesta.experienciaAtencion || 0}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">General</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{encuesta.satisfaccionGeneral || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Comentarios */}
          {(encuesta.comentarioDoctor || encuesta.aspectosPositivos || encuesta.aspectosMejorar || encuesta.sugerencias) && (
            <div className="border-t pt-3 space-y-2">
              {encuesta.comentarioDoctor && (
                <div className="text-sm">
                  <p className="font-medium text-cyan-700">Comentario sobre el doctor:</p>
                  <p className="text-muted-foreground line-clamp-2">{encuesta.comentarioDoctor}</p>
                </div>
              )}
              {encuesta.aspectosPositivos && (
                <div className="text-sm">
                  <p className="font-medium text-green-700">Aspectos positivos:</p>
                  <p className="text-muted-foreground line-clamp-2">{encuesta.aspectosPositivos}</p>
                </div>
              )}
              {encuesta.aspectosMejorar && (
                <div className="text-sm">
                  <p className="font-medium text-orange-700">A mejorar:</p>
                  <p className="text-muted-foreground line-clamp-2">{encuesta.aspectosMejorar}</p>
                </div>
              )}
              {encuesta.sugerencias && (
                <div className="text-sm">
                  <p className="font-medium text-blue-700">Sugerencias:</p>
                  <p className="text-muted-foreground line-clamp-2">{encuesta.sugerencias}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar encuestas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={refreshAll} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Encuestas de Satisfacción</h3>
          <p className="text-sm text-muted-foreground">
            Sistema de evaluación de satisfacción del usuario
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshAll} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Encuesta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total || 0}</div>
              <p className="text-xs text-muted-foreground">Encuestas registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {(estadisticas.promedioGeneral || 0).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">De 5.0 estrellas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Actual</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {estadisticas.mesActual || 0}
              </div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mejor Servicio</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-green-600">
                {estadisticas.mejorServicio?.servicio || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.mejorServicio?.promedio?.toFixed(1) || '0.0'} estrellas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Servicio</label>
              <Select value={filters.servicioAtendido || 'all'} onValueChange={(v) => handleFilterChange('servicioAtendido', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los servicios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="CONSULTA_EXTERNA">Consulta Externa</SelectItem>
                  <SelectItem value="URGENCIAS">Urgencias</SelectItem>
                  <SelectItem value="HOSPITALIZACION">Hospitalización</SelectItem>
                  <SelectItem value="CIRUGIA">Cirugía</SelectItem>
                  <SelectItem value="LABORATORIO">Laboratorio</SelectItem>
                  <SelectItem value="IMAGENOLOGIA">Imagenología</SelectItem>
                  <SelectItem value="FARMACIA">Farmacia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filters.tipoEncuesta || 'all'} onValueChange={(v) => handleFilterChange('tipoEncuesta', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="SATISFACCION">Satisfacción General</SelectItem>
                  <SelectItem value="SALIDA">Encuesta de Salida</SelectItem>
                  <SelectItem value="AMBULATORIO">Atención Ambulatoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Análisis vs Listado */}
      <Tabs defaultValue="analisis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analisis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="listado" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Listado ({pagination.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analisis">
          <AnalisisEncuestas />
        </TabsContent>

        <TabsContent value="listado" className="space-y-4">
          {loading && encuestas.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : encuestas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin encuestas</h3>
                <p className="text-muted-foreground">
                  No se encontraron encuestas con los filtros seleccionados
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {encuestas.map((encuesta) => (
                  <EncuestaCard key={encuesta.id} encuesta={encuesta} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {encuestas.length} de {pagination.total} encuestas
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1 || loading}
                      onClick={() => fetchEncuestas({ ...filters, page: pagination.page - 1 })}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages || loading}
                      onClick={() => fetchEncuestas({ ...filters, page: pagination.page + 1 })}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      {showForm && (
        <EncuestaForm
          encuesta={selectedEncuesta}
          open={showForm}
          onClose={handleFormClose}
          onSuccess={() => {
            handleFormClose();
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
