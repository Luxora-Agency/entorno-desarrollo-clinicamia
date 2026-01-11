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
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Shield,
  FileText,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useCalidad2EventosAdversos } from '@/hooks/useCalidad2EventosAdversos';
import EventoAdversoCard from './EventoAdversoCard';
import EventoAdversoForm from './EventoAdversoForm';

export default function EventosAdversosTab() {
  const {
    eventos,
    estadisticas,
    eventosPorTipo,
    eventosPorSeveridad,
    pagination,
    loading,
    error,
    fetchEventos,
    deleteEvento,
    refreshAll,
  } = useCalidad2EventosAdversos();

  const [showForm, setShowForm] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [filters, setFilters] = useState({
    tipoEvento: '',
    clasificacion: '',
    severidad: '',
    estado: '',
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value === 'all' ? '' : value };
    setFilters(newFilters);
    fetchEventos(newFilters);
  };

  const handleEdit = (evento) => {
    setSelectedEvento(evento);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este evento adverso?')) {
      await deleteEvento(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedEvento(null);
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar eventos adversos</CardTitle>
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
          <h3 className="text-lg font-medium">Eventos Adversos y Seguridad del Paciente</h3>
          <p className="text-sm text-muted-foreground">
            Sistema de reporte y gestión de eventos adversos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshAll} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Reportar Evento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total || 0}</div>
              <p className="text-xs text-muted-foreground">Eventos reportados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {estadisticas.abiertos || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pendientes de análisis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Graves</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {estadisticas.graves || 0}
              </div>
              <p className="text-xs text-muted-foreground">Requieren atención urgente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analizados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.analizados || 0}
              </div>
              <p className="text-xs text-muted-foreground">Con análisis realizado</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Distribución por Tipo y Severidad */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Por Tipo */}
        {eventosPorTipo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Distribución por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eventosPorTipo.map((item) => (
                  <div key={item.tipo} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{item.tipo}</span>
                    <Badge>{item._count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Por Severidad */}
        {eventosPorSeveridad.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Distribución por Severidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eventosPorSeveridad.map((item) => (
                  <div key={item.severidad} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{item.severidad}</span>
                    <Badge
                      variant={
                        item.severidad === 'MORTAL' ? 'destructive' :
                        item.severidad === 'GRAVE' ? 'orange' :
                        item.severidad === 'MODERADA' ? 'yellow' :
                        'blue'
                      }
                    >
                      {item._count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Evento</label>
              <Select value={filters.tipoEvento || 'all'} onValueChange={(v) => handleFilterChange('tipoEvento', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="CAIDA">Caída</SelectItem>
                  <SelectItem value="RAM">RAM</SelectItem>
                  <SelectItem value="IAAS">IAAS</SelectItem>
                  <SelectItem value="QUIRURGICO">Quirúrgico</SelectItem>
                  <SelectItem value="DIAGNOSTICO">Diagnóstico</SelectItem>
                  <SelectItem value="IDENTIFICACION">Identificación</SelectItem>
                  <SelectItem value="COMUNICACION">Comunicación</SelectItem>
                  <SelectItem value="EQUIPOS">Equipos</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Clasificación</label>
              <Select value={filters.clasificacion || 'all'} onValueChange={(v) => handleFilterChange('clasificacion', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las clasificaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="INCIDENTE">Incidente</SelectItem>
                  <SelectItem value="EVENTO_ADVERSO">Evento Adverso</SelectItem>
                  <SelectItem value="CENTINELA">Centinela</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Severidad</label>
              <Select value={filters.severidad || 'all'} onValueChange={(v) => handleFilterChange('severidad', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las severidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="LEVE">Leve</SelectItem>
                  <SelectItem value="MODERADA">Moderada</SelectItem>
                  <SelectItem value="GRAVE">Grave</SelectItem>
                  <SelectItem value="MORTAL">Mortal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filters.estado || 'all'} onValueChange={(v) => handleFilterChange('estado', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ABIERTO">Abierto</SelectItem>
                  <SelectItem value="EN_ANALISIS">En Análisis</SelectItem>
                  <SelectItem value="CERRADO">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Eventos */}
      <div className="space-y-4">
        {loading && eventos.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : eventos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin eventos adversos</h3>
              <p className="text-muted-foreground">
                No se encontraron eventos adversos con los filtros seleccionados
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {eventos.map((evento) => (
                <EventoAdversoCard
                  key={evento.id}
                  evento={evento}
                  onUpdate={refreshAll}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {eventos.length} de {pagination.total} eventos
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1 || loading}
                    onClick={() => fetchEventos({ ...filters, page: pagination.page - 1 })}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages || loading}
                    onClick={() => fetchEventos({ ...filters, page: pagination.page + 1 })}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <EventoAdversoForm
          evento={selectedEvento}
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
