'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Check, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCalidad2Protocolos } from '@/hooks/useCalidad2Protocolos';
import ProtocoloForm from './ProtocoloForm';

const TIPOS_PROTOCOLO = [
  { value: 'PROGRAMA', label: 'Programa' },
  { value: 'PROCEDIMIENTO', label: 'Procedimiento' },
  { value: 'PROTOCOLO', label: 'Protocolo' },
  { value: 'POLITICA', label: 'Política' },
  { value: 'MANUAL', label: 'Manual' },
];

const ESTADOS = [
  { value: 'BORRADOR', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: 'EN_REVISION', label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'VIGENTE', label: 'Vigente', color: 'bg-green-100 text-green-800' },
  { value: 'OBSOLETO', label: 'Obsoleto', color: 'bg-red-100 text-red-800' },
];

export default function ProtocolosTab({ user }) {
  const {
    protocolos,
    loading,
    loadProtocolos,
    deleteProtocolo,
    aprobarProtocolo,
  } = useCalidad2Protocolos();

  const [showForm, setShowForm] = useState(false);
  const [editingProtocolo, setEditingProtocolo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');

  useEffect(() => {
    loadProtocolos();
  }, [loadProtocolos]);

  const handleOpenCreate = () => {
    setEditingProtocolo(null);
    setShowForm(true);
  };

  const handleOpenEdit = (protocolo) => {
    setEditingProtocolo(protocolo);
    setShowForm(true);
  };

  const handleCloseForm = async (refresh = false) => {
    setShowForm(false);
    setEditingProtocolo(null);
    if (refresh) {
      await loadProtocolos();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este protocolo?')) {
      await deleteProtocolo(id);
    }
  };

  const handleAprobar = async (id) => {
    if (window.confirm('¿Está seguro de aprobar este protocolo? Quedará vigente.')) {
      await aprobarProtocolo(id);
    }
  };

  const filteredProtocolos = (protocolos || []).filter((protocolo) => {
    const matchesSearch = !searchTerm ||
      protocolo.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocolo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocolo.responsable?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = !tipoFilter || tipoFilter === 'TODOS' || protocolo.tipo === tipoFilter;
    const matchesEstado = !estadoFilter || estadoFilter === 'TODOS' || protocolo.estado === estadoFilter;

    return matchesSearch && matchesTipo && matchesEstado;
  });

  const getEstadoBadge = (estado) => {
    const estadoInfo = ESTADOS.find(e => e.value === estado);
    return (
      <Badge className={estadoInfo?.color || 'bg-gray-100 text-gray-800'}>
        {estadoInfo?.label || estado}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Protocolos y Procedimientos
              </h3>
              <p className="text-sm text-blue-700">
                Gestión de protocolos, procedimientos, políticas y manuales del módulo de medicamentos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código, nombre o responsable..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los tipos</SelectItem>
                  {TIPOS_PROTOCOLO.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  {ESTADOS.map(estado => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Protocolo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredProtocolos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 font-medium">
                {searchTerm || tipoFilter || estadoFilter
                  ? 'No se encontraron protocolos con los filtros aplicados'
                  : 'No hay protocolos registrados'}
              </p>
              {!(searchTerm || tipoFilter || estadoFilter) && (
                <Button onClick={handleOpenCreate} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Protocolo
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProtocolos.map((protocolo) => (
                <Card key={protocolo.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">{protocolo.codigo}</p>
                        <h4 className="font-semibold text-gray-900 mt-1 line-clamp-2">
                          {protocolo.nombre}
                        </h4>
                      </div>
                      {getEstadoBadge(protocolo.estado)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Tipo:</span>
                        <span className="font-medium">
                          {TIPOS_PROTOCOLO.find(t => t.value === protocolo.tipo)?.label || protocolo.tipo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Versión:</span>
                        <span className="font-medium">{protocolo.version}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Emisión: {new Date(protocolo.fechaEmision).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Responsable: {protocolo.responsable}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenEdit(protocolo)}
                      >
                        Ver/Editar
                      </Button>
                      {protocolo.estado === 'BORRADOR' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAprobar(protocolo.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(protocolo.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => handleCloseForm(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProtocolo ? 'Editar Protocolo' : 'Nuevo Protocolo'}
            </DialogTitle>
          </DialogHeader>
          <ProtocoloForm
            protocolo={editingProtocolo}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
