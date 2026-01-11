'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  Book,
  Shield,
} from 'lucide-react';
import { useCalidad2ProtocolosPP } from '@/hooks/useCalidad2ProtocolosPP';
import ProtocoloCard from './ProtocoloCard';
import ProtocoloForm from './ProtocoloForm';

export default function ProtocolosTab() {
  const [showForm, setShowForm] = useState(false);
  const [selectedProtocolo, setSelectedProtocolo] = useState(null);

  const {
    protocolos,
    estadisticas,
    pagination,
    loading,
    error,
    fetchProtocolos,
    createProtocolo,
    updateProtocolo,
    deleteProtocolo,
    refreshAll,
  } = useCalidad2ProtocolosPP();

  const handleEdit = (protocolo) => {
    setSelectedProtocolo(protocolo);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este protocolo?')) {
      await deleteProtocolo(id);
    }
  };

  const handleSubmit = async (data) => {
    if (selectedProtocolo) {
      await updateProtocolo(selectedProtocolo.id, data);
    } else {
      await createProtocolo(data);
    }
    setShowForm(false);
    setSelectedProtocolo(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProtocolo(null);
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar protocolos</CardTitle>
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
          <h3 className="text-lg font-medium">Protocolos y Documentos</h3>
          <p className="text-sm text-muted-foreground">
            Gestión de protocolos, manuales, políticas y formatos del sistema de calidad
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshAll} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Protocolo
          </Button>
        </div>
      </div>

      {/* Stats */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Protocolos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.protocolos || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Book className="h-4 w-4" />
                Manuales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.manuales || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Políticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.politicas || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Vigentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.vigentes || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                Por Revisar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {estadisticas.porRevisar || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-4">
        {loading && protocolos.length === 0 ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))
        ) : protocolos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin protocolos</h3>
              <p className="text-muted-foreground">No hay protocolos registrados</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {protocolos.map((protocolo) => (
              <ProtocoloCard
                key={protocolo.id}
                protocolo={protocolo}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {protocolos.length} de {pagination.total} protocolos
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1 || loading}
                    onClick={() => fetchProtocolos({ page: pagination.page - 1 })}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages || loading}
                    onClick={() => fetchProtocolos({ page: pagination.page + 1 })}
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
      <ProtocoloForm
        open={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={selectedProtocolo}
      />
    </div>
  );
}
