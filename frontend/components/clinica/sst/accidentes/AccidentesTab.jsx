'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  FileText,
  Eye,
  AlertTriangle,
  Download
} from 'lucide-react';
import useSST from '@/hooks/useSST';
import AccidenteForm from './AccidenteForm';
import AccidenteDetail from './AccidenteDetail';

export default function AccidentesTab({ user }) {
  const {
    accidentes,
    pagination,
    fetchAccidentes,
    createAccidente,
    getAccidente,
    descargarFURAT,
    loading
  } = useSST();

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedAccidente, setSelectedAccidente] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchAccidentes({ page, search, estado: estadoFilter });
  }, [page, search, estadoFilter, fetchAccidentes]);

  const handleCreate = async (data) => {
    await createAccidente(data);
    setShowForm(false);
    fetchAccidentes({ page, search, estado: estadoFilter });
  };

  const handleView = async (id) => {
    const accidente = await getAccidente(id);
    setSelectedAccidente(accidente);
    setShowDetail(true);
  };

  const handleDownloadFURAT = async (id) => {
    const blob = await descargarFURAT(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FURAT_${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      REPORTADO: { variant: 'outline', label: 'Reportado' },
      EN_INVESTIGACION: { variant: 'secondary', label: 'En Investigacion' },
      INVESTIGADO: { variant: 'default', label: 'Investigado' },
      CERRADO: { variant: 'success', label: 'Cerrado' },
    };
    const config = estados[estado] || { variant: 'outline', label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTipoBadge = (tipo) => {
    const tipos = {
      DE_TRABAJO: { color: 'bg-red-100 text-red-700', label: 'Trabajo' },
      IN_ITINERE: { color: 'bg-orange-100 text-orange-700', label: 'In Itinere' },
      DEPORTIVO: { color: 'bg-blue-100 text-blue-700', label: 'Deportivo' },
    };
    const config = tipos[tipo] || { color: 'bg-gray-100 text-gray-700', label: tipo };
    return <span className={`px-2 py-0.5 rounded text-xs ${config.color}`}>{config.label}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Accidentes de Trabajo</h2>
          <p className="text-sm text-gray-500">Registro y seguimiento de AT - Res. 1401/2007</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Accidente
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por empleado, lugar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="REPORTADO">Reportado</option>
              <option value="EN_INVESTIGACION">En Investigacion</option>
              <option value="INVESTIGADO">Investigado</option>
              <option value="CERRADO">Cerrado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead>Dias Inc.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>FURAT</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : accidentes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No hay accidentes registrados
                  </TableCell>
                </TableRow>
              ) : (
                accidentes.map((accidente) => (
                  <TableRow key={accidente.id}>
                    <TableCell>
                      {new Date(accidente.fechaAccidente).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {accidente.empleado?.nombre} {accidente.empleado?.apellido}
                        </p>
                        <p className="text-xs text-gray-500">
                          {accidente.empleado?.documento}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getTipoBadge(accidente.tipoAccidente)}</TableCell>
                    <TableCell className="max-w-32 truncate" title={accidente.lugarAccidente}>
                      {accidente.lugarAccidente}
                    </TableCell>
                    <TableCell>
                      {accidente.diasIncapacidad || 0}
                    </TableCell>
                    <TableCell>{getEstadoBadge(accidente.estado)}</TableCell>
                    <TableCell>
                      {accidente.furatGenerado ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFURAT(accidente.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(accidente.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginacion */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {accidentes.length} de {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <span className="px-3 py-1 text-sm">
              {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal Formulario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Accidente de Trabajo</DialogTitle>
          </DialogHeader>
          <AccidenteForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Detalle */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Accidente</DialogTitle>
          </DialogHeader>
          {selectedAccidente && (
            <AccidenteDetail
              accidente={selectedAccidente}
              onClose={() => setShowDetail(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
