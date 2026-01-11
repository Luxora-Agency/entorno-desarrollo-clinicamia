'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Download, Eye, Search, Trash2 } from 'lucide-react';
import { useActasReunion } from '@/hooks/useActasReunion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActaForm } from './ActaForm';

const TIPOS_REUNION = {
  COMITE: 'Comite',
  AUDITORIA: 'Auditoria',
  REUNION_INTERNA: 'Reunion interna',
  CAPACITACION: 'Capacitacion',
  REUNION_PERSONAL: 'Reunion Personal',
  JUNTA_DIRECTIVA: 'Junta Directiva',
  REUNION_CLIENTE_PROVEEDOR: 'Cliente/Proveedor',
  VISITA_ENTES_REGULADORES: 'Entes Reguladores',
  OTRO: 'Otro',
};

export default function ActasLista({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedActa, setSelectedActa] = useState(null);

  const {
    actas,
    pagination,
    loading,
    downloading,
    filters,
    setFilters,
    setPagination,
    loadActas,
    getActa,
    createActa,
    updateActa,
    deleteActa,
    downloadPDF,
  } = useActasReunion();

  useEffect(() => {
    loadActas();
  }, [loadActas]);

  const handleCreate = async (data) => {
    const result = await createActa(data);
    if (result) {
      setShowForm(false);
      loadActas();
    }
  };

  const handleUpdate = async (data) => {
    if (!selectedActa) return;
    const result = await updateActa(selectedActa.id, data);
    if (result) {
      setShowForm(false);
      setSelectedActa(null);
      loadActas();
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Estas seguro de eliminar esta acta?')) {
      await deleteActa(id);
    }
  };

  const handleView = async (acta) => {
    await getActa(acta.id);
    setSelectedActa(acta);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Actas de Reunion</h2>
          <p className="text-sm text-muted-foreground">
            {pagination.total} actas registradas
          </p>
        </div>
        <Button onClick={() => { setSelectedActa(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Acta
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por objetivo o lugar..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && loadActas()}
                />
              </div>
            </div>
            <Select value={filters.tipo || '_all'} onValueChange={(v) => setFilters({ ...filters, tipo: v === '_all' ? '' : v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de reunion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                {Object.entries(TIPOS_REUNION).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => loadActas()}>
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">N</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead className="text-center">Asistentes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : actas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay actas registradas
                  </TableCell>
                </TableRow>
              ) : (
                actas.map(acta => (
                  <TableRow key={acta.id}>
                    <TableCell className="font-medium">#{acta.numero}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{acta.objetivo}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {acta.tiposReunion?.slice(0, 2).map(tipo => (
                          <Badge key={tipo} variant="outline" className="text-xs">
                            {TIPOS_REUNION[tipo] || tipo}
                          </Badge>
                        ))}
                        {acta.tiposReunion?.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{acta.tiposReunion.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(acta.fecha), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{acta.lugar}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{acta._count?.asistentes || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleView(acta)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadPDF(acta.id, acta.numero)}
                          disabled={downloading}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {!acta.sesion && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(acta.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => { setPagination({ ...pagination, page: pagination.page - 1 }); loadActas(); }}
          >
            Anterior
          </Button>
          <span className="py-2 px-4 text-sm">
            Pagina {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => { setPagination({ ...pagination, page: pagination.page + 1 }); loadActas(); }}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <ActaForm
          open={showForm}
          onClose={() => { setShowForm(false); setSelectedActa(null); }}
          onSubmit={selectedActa ? handleUpdate : handleCreate}
          acta={selectedActa}
        />
      )}
    </div>
  );
}
