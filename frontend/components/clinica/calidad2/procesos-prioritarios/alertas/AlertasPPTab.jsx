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
  Bell,
  AlertTriangle,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { useCalidad2AlertasPP } from '@/hooks/useCalidad2AlertasPP';
import AlertaPPCard from './AlertaPPCard';

export default function AlertasPPTab() {
  const {
    alertas,
    alertasActivas,
    estadisticas,
    pagination,
    loading,
    error,
    fetchAlertas,
    generarAlertas,
    refreshAll,
  } = useCalidad2AlertasPP();

  const [filters, setFilters] = useState({
    tipo: '',
    prioridad: '',
    atendida: '',
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value === 'all' ? '' : value };
    setFilters(newFilters);
    fetchAlertas(newFilters);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICA':
        return 'destructive';
      case 'ALTA':
        return 'orange';
      case 'MEDIA':
        return 'yellow';
      case 'BAJA':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITICA':
        return AlertCircle;
      case 'ALTA':
        return AlertTriangle;
      case 'MEDIA':
        return Clock;
      case 'BAJA':
        return Bell;
      default:
        return Bell;
    }
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar alertas</CardTitle>
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
          <h3 className="text-lg font-medium">Alertas y Notificaciones</h3>
          <p className="text-sm text-muted-foreground">
            Sistema automatizado de alertas de procesos prioritarios
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshAll} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={generarAlertas} size="sm" disabled={loading}>
            <Zap className="mr-2 h-4 w-4" />
            Generar Alertas
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total || 0}</div>
              <p className="text-xs text-muted-foreground">Alertas generadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {estadisticas.pendientes || 0}
              </div>
              <p className="text-xs text-muted-foreground">Sin atender</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticas</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {estadisticas.criticas || 0}
              </div>
              <p className="text-xs text-muted-foreground">Prioridad crítica</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atendidas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.atendidas || 0}
              </div>
              <p className="text-xs text-muted-foreground">Resueltas</p>
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filters.tipo || 'all'} onValueChange={(v) => handleFilterChange('tipo', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="EVENTO_ADVERSO_PENDIENTE">Eventos Adversos</SelectItem>
                  <SelectItem value="GPC_REVISION">GPC Revisión</SelectItem>
                  <SelectItem value="PQRSF_VENCIDA">PQRSF Vencida</SelectItem>
                  <SelectItem value="ACTA_PENDIENTE">Acta Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridad</label>
              <Select value={filters.prioridad || 'all'} onValueChange={(v) => handleFilterChange('prioridad', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CRITICA">Crítica</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filters.atendida || 'all'} onValueChange={(v) => handleFilterChange('atendida', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="false">Pendientes</SelectItem>
                  <SelectItem value="true">Atendidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Activas vs Todas */}
      <Tabs defaultValue="activas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activas" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Activas ({alertasActivas.length})
          </TabsTrigger>
          <TabsTrigger value="todas" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Todas ({pagination.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activas" className="space-y-4">
          {loading && alertasActivas.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : alertasActivas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin alertas activas</h3>
                <p className="text-muted-foreground">
                  No hay alertas pendientes de atención en este momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alertasActivas.map((alerta) => (
                <AlertaPPCard
                  key={alerta.id}
                  alerta={alerta}
                  onUpdate={refreshAll}
                  getPriorityColor={getPriorityColor}
                  getPriorityIcon={getPriorityIcon}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todas" className="space-y-4">
          {loading && alertas.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : alertas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin alertas</h3>
                <p className="text-muted-foreground">
                  No se encontraron alertas con los filtros seleccionados
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {alertas.map((alerta) => (
                  <AlertaPPCard
                    key={alerta.id}
                    alerta={alerta}
                    onUpdate={refreshAll}
                    getPriorityColor={getPriorityColor}
                    getPriorityIcon={getPriorityIcon}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {alertas.length} de {pagination.total} alertas
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1 || loading}
                      onClick={() => fetchAlertas({ ...filters, page: pagination.page - 1 })}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages || loading}
                      onClick={() => fetchAlertas({ ...filters, page: pagination.page + 1 })}
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
    </div>
  );
}
