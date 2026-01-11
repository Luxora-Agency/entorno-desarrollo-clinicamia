'use client';

import { useState, useEffect } from 'react';
import { useCalidad2AuditoriasHC } from '@/hooks/useCalidad2AuditoriasHC';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  FileText,
  Edit,
  Trash2,
  Lock,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AuditoriaHCForm from './AuditoriaHCForm';
import AuditoriaHCDetail from './AuditoriaHCDetail';

const TIPOS_AUDITORIA = [
  { value: 'INTERNA', label: 'Auditoría Interna' },
  { value: 'EXTERNA', label: 'Auditoría Externa' },
  { value: 'CONCURRENTE', label: 'Auditoría Concurrente' },
  { value: 'RETROSPECTIVA', label: 'Auditoría Retrospectiva' },
];

const ESTADOS = [
  { value: 'ABIERTA', label: 'Abierta', color: 'bg-blue-100 text-blue-800' },
  { value: 'CERRADA', label: 'Cerrada', color: 'bg-gray-100 text-gray-800' },
];

export default function AuditoriaHCTab() {
  const {
    auditorias,
    loading,
    pagination,
    stats,
    loadAuditorias,
    deleteAuditoria,
    loadStats,
  } = useCalidad2AuditoriasHC();

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAuditoria, setSelectedAuditoria] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    tipo: 'all',
    estado: 'all',
    search: '',
  });

  // Cargar auditorías y stats al montar
  useEffect(() => {
    const cleanFilters = { ...filters };
    if (cleanFilters.tipo === 'all') delete cleanFilters.tipo;
    if (cleanFilters.estado === 'all') delete cleanFilters.estado;
    loadAuditorias(cleanFilters);
    loadStats();
  }, [filters]);

  const handleSearch = (value) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleCreateNew = () => {
    setSelectedAuditoria(null);
    setShowForm(true);
  };

  const handleEdit = (auditoria) => {
    setSelectedAuditoria(auditoria);
    setShowForm(true);
  };

  const handleViewDetail = (auditoria) => {
    setSelectedAuditoria(auditoria);
    setShowDetail(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta auditoría?')) {
      const success = await deleteAuditoria(id);
      if (success) {
        loadAuditorias(filters);
        loadStats();
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedAuditoria(null);
    loadAuditorias(filters);
    loadStats();
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setSelectedAuditoria(null);
    loadAuditorias(filters);
  };

  const getTipoLabel = (tipo) => {
    return TIPOS_AUDITORIA.find(t => t.value === tipo)?.label || tipo;
  };

  const getEstadoBadge = (estado) => {
    const estadoInfo = ESTADOS.find(e => e.value === estado);
    return (
      <Badge className={estadoInfo?.color || 'bg-gray-100 text-gray-800'}>
        {estadoInfo?.label || estado}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Auditorías</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Abiertas</p>
                  <p className="text-2xl font-bold mt-1">{stats.abiertas}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Cerradas</p>
                  <p className="text-2xl font-bold mt-1">{stats.cerradas}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <Lock className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Hallazgos Críticos</p>
                  <p className="text-2xl font-bold mt-1">{stats.hallazgosCriticosTotal}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hallazgos Summary */}
      {stats && stats.hallazgos && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Resumen de Hallazgos</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Positivos (Fortalezas)</p>
                  <p className="text-lg font-semibold">{stats.hallazgos.positivos}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-500">Negativos (Oportunidades)</p>
                  <p className="text-lg font-semibold">{stats.hallazgos.negativos}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-xs text-gray-500">Críticos</p>
                  <p className="text-lg font-semibold">{stats.hallazgos.criticos}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros y Acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Auditorías de Calidad HC</span>
            <Button onClick={handleCreateNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Auditoría
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Buscador */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por área auditada u observaciones..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por tipo */}
            <Select
              value={filters.tipo}
              onValueChange={(value) => handleFilterChange('tipo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {TIPOS_AUDITORIA.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por estado */}
            <Select
              value={filters.estado}
              onValueChange={(value) => handleFilterChange('estado', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ESTADOS.map(estado => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Auditorías */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Cargando auditorías...</p>
            </div>
          ) : auditorias.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No se encontraron auditorías</p>
              <Button onClick={handleCreateNew} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Auditoría
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {auditorias.map((auditoria) => (
                  <Card key={auditoria.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getEstadoBadge(auditoria.estado)}
                            <Badge variant="outline">{getTipoLabel(auditoria.tipo)}</Badge>
                          </div>

                          <h3 className="font-semibold text-lg">{auditoria.areaAuditada}</h3>

                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Fecha Auditoría</p>
                                <p className="font-medium">
                                  {format(new Date(auditoria.fechaAuditoria), 'dd/MM/yyyy', { locale: es })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Auditor</p>
                                <p className="font-medium">
                                  {auditoria.auditorUsuario?.nombre} {auditoria.auditorUsuario?.apellido}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">HC Revisadas</p>
                                <p className="font-medium">{auditoria.historiasRevisadas}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <ClipboardCheck className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Hallazgos</p>
                                <p className="font-medium">{auditoria._count?.hallazgos || 0}</p>
                              </div>
                            </div>
                          </div>

                          {/* Resumen de hallazgos */}
                          <div className="mt-3 flex items-center gap-4 text-xs">
                            {auditoria.hallazgosPositivos > 0 && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{auditoria.hallazgosPositivos} positivos</span>
                              </div>
                            )}
                            {auditoria.hallazgosNegativos > 0 && (
                              <div className="flex items-center gap-1 text-yellow-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{auditoria.hallazgosNegativos} negativos</span>
                              </div>
                            )}
                            {auditoria.hallazgosCriticos > 0 && (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-3 w-3" />
                                <span>{auditoria.hallazgosCriticos} críticos</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(auditoria)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Ver Detalle
                            </DropdownMenuItem>
                            {auditoria.estado === 'ABIERTA' && (
                              <DropdownMenuItem onClick={() => handleEdit(auditoria)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(auditoria.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} -{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} auditorías
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={() => handleFormClose()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAuditoria ? 'Editar Auditoría' : 'Nueva Auditoría'}
              </DialogTitle>
            </DialogHeader>
            <AuditoriaHCForm
              auditoria={selectedAuditoria}
              onClose={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de detalle */}
      {showDetail && selectedAuditoria && (
        <Dialog open={showDetail} onOpenChange={() => handleDetailClose()}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle de Auditoría</DialogTitle>
            </DialogHeader>
            <AuditoriaHCDetail
              auditoriaId={selectedAuditoria.id}
              onClose={handleDetailClose}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
