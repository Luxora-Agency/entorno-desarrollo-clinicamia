'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';
import { useCalidad2GPC } from '@/hooks/useCalidad2GPC';
import GPCCard from './GPCCard';
import GPCForm from './GPCForm';

export default function GPCTab() {
  const [showForm, setShowForm] = useState(false);
  const [selectedGPC, setSelectedGPC] = useState(null);
  const [filters, setFilters] = useState({
    patologia: '',
    estado: '',
  });

  const {
    guias,
    estadisticas,
    pagination,
    loading,
    error,
    fetchGuias,
    createGuia,
    updateGuia,
    deleteGuia,
    refreshAll,
  } = useCalidad2GPC();

  const handleEdit = (guia) => {
    setSelectedGPC(guia);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar esta GPC?')) {
      await deleteGuia(id);
    }
  };

  const handleSubmit = async (data) => {
    if (selectedGPC) {
      await updateGuia(selectedGPC.id, data);
    } else {
      await createGuia(data);
    }
    setShowForm(false);
    setSelectedGPC(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedGPC(null);
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar GPC</CardTitle>
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
          <h3 className="text-lg font-medium">Guías de Práctica Clínica (GPC)</h3>
          <p className="text-sm text-muted-foreground">
            Gestión de guías adoptadas con evaluación AGREE II y seguimiento de adherencia
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshAll} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Guía
          </Button>
        </div>
      </div>

      {/* Stats */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total GPC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total || 0}</div>
              <p className="text-xs text-muted-foreground">Guías adoptadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vigentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.vigentes || 0}
              </div>
              <p className="text-xs text-muted-foreground">Actualizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Con AGREE II</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {estadisticas.conAGREE || 0}
              </div>
              <p className="text-xs text-muted-foreground">Evaluadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por Revisar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {estadisticas.porRevisar || 0}
              </div>
              <p className="text-xs text-muted-foreground">Próximas a vencer</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de GPC */}
      <div className="space-y-4">
        {loading && guias.length === 0 ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))
        ) : guias.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin guías</h3>
              <p className="text-muted-foreground">No hay guías de práctica clínica registradas</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {guias.map((guia) => (
              <GPCCard
                key={guia.id}
                guia={guia}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {guias.length} de {pagination.total} guías
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1 || loading}
                    onClick={() => fetchGuias({ ...filters, page: pagination.page - 1 })}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages || loading}
                    onClick={() => fetchGuias({ ...filters, page: pagination.page + 1 })}
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
      <GPCForm
        open={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={selectedGPC}
      />
    </div>
  );
}
