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
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useCalidad2PQRSF } from '@/hooks/useCalidad2PQRSF';
import PQRSFCard from './PQRSFCard';
import PQRSFForm from './PQRSFForm';

export default function PQRSFTab() {
  const {
    pqrsf,
    pqrsfVencidas,
    estadisticas,
    pagination,
    loading,
    error,
    fetchPQRSF,
    deletePQRSF,
    refreshAll,
  } = useCalidad2PQRSF();

  const [showForm, setShowForm] = useState(false);
  const [selectedPQRSF, setSelectedPQRSF] = useState(null);
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    prioridad: '',
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value === 'all' ? '' : value };
    setFilters(newFilters);
    fetchPQRSF(newFilters);
  };

  const handleEdit = (pqrsf) => {
    setSelectedPQRSF(pqrsf);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta PQRSF?')) {
      await deletePQRSF(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedPQRSF(null);
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar PQRSF</CardTitle>
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
          <h3 className="text-lg font-medium">PQRSF - Sistema de Atención al Usuario</h3>
          <p className="text-sm text-muted-foreground">
            Gestión de Peticiones, Quejas, Reclamos, Sugerencias y Felicitaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshAll} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva PQRSF
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
              <p className="text-xs text-muted-foreground">PQRSF radicadas</p>
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
              <p className="text-xs text-muted-foreground">Sin responder</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {estadisticas.vencidas || 0}
              </div>
              <p className="text-xs text-muted-foreground">Fuera de plazo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Tiempo</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.respondidasATiempo || 0}
              </div>
              <p className="text-xs text-muted-foreground">Dentro de plazo</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Stats */}
      {estadisticas?.porTipo && (
        <div className="grid gap-4 md:grid-cols-5">
          {estadisticas.porTipo.map((stat) => (
            <Card key={stat.tipo}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{stat.tipo}</p>
                    <p className="text-2xl font-bold">{stat._count}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
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
                  <SelectItem value="PETICION">Petición</SelectItem>
                  <SelectItem value="QUEJA">Queja</SelectItem>
                  <SelectItem value="RECLAMO">Reclamo</SelectItem>
                  <SelectItem value="SUGERENCIA">Sugerencia</SelectItem>
                  <SelectItem value="FELICITACION">Felicitación</SelectItem>
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
                  <SelectItem value="RADICADA">Radicada</SelectItem>
                  <SelectItem value="EN_GESTION">En Gestión</SelectItem>
                  <SelectItem value="RESPONDIDA">Respondida</SelectItem>
                  <SelectItem value="CERRADA">Cerrada</SelectItem>
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
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Vencidas vs Todas */}
      <Tabs defaultValue="vencidas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vencidas" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Vencidas ({pqrsfVencidas.length})
          </TabsTrigger>
          <TabsTrigger value="todas" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Todas ({pagination.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vencidas" className="space-y-4">
          {loading && pqrsfVencidas.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pqrsfVencidas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin PQRSF vencidas</h3>
                <p className="text-muted-foreground">
                  Todas las PQRSF han sido respondidas dentro del plazo legal
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pqrsfVencidas.map((item) => (
                <PQRSFCard
                  key={item.id}
                  pqrsf={item}
                  onUpdate={refreshAll}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todas" className="space-y-4">
          {loading && pqrsf.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pqrsf.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin PQRSF</h3>
                <p className="text-muted-foreground">
                  No se encontraron PQRSF con los filtros seleccionados
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {pqrsf.map((item) => (
                  <PQRSFCard
                    key={item.id}
                    pqrsf={item}
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
                    Mostrando {pqrsf.length} de {pagination.total} PQRSF
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1 || loading}
                      onClick={() => fetchPQRSF({ ...filters, page: pagination.page - 1 })}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages || loading}
                      onClick={() => fetchPQRSF({ ...filters, page: pagination.page + 1 })}
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
        <PQRSFForm
          pqrsf={selectedPQRSF}
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
