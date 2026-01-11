'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  FileText,
  Filter,
  BarChart3,
} from 'lucide-react';
import { useCalidad2DocumentosHC } from '@/hooks/useCalidad2DocumentosHC';
import DocumentoHCCard from './DocumentoHCCard';
import DocumentoHCForm from './DocumentoHCForm';
import VersionesDocumentoModal from './VersionesDocumentoModal';
import DistribucionDocumentoModal from './DistribucionDocumentoModal';

/**
 * Tab de Documentos Normativos de Historia Clínica
 *
 * Gestiona:
 * - Manuales, procedimientos, formatos, políticas
 * - Versionamiento de documentos
 * - Workflow de aprobación
 * - Distribución controlada
 */
export default function DocumentosNormativosTab() {
  const {
    documentos,
    loading,
    pagination,
    stats,
    fetchDocumentos,
    fetchStats,
    createDocumento,
    updateDocumento,
    deleteDocumento,
    aprobarDocumento,
    distribuirDocumento,
  } = useCalidad2DocumentosHC();

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [showVersiones, setShowVersiones] = useState(false);
  const [showDistribucion, setShowDistribucion] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    tipo: 'all',
    categoria: 'all',
    estado: 'all',
    search: '',
  });

  // Load data on mount and when filters change
  useEffect(() => {
    // Clean 'all' values before sending to API
    const cleanFilters = { ...filters };
    if (cleanFilters.tipo === 'all') delete cleanFilters.tipo;
    if (cleanFilters.categoria === 'all') delete cleanFilters.categoria;
    if (cleanFilters.estado === 'all') delete cleanFilters.estado;
    fetchDocumentos(cleanFilters);
  }, [filters, fetchDocumentos]);

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handlers
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleCreate = () => {
    setEditingDoc(null);
    setShowForm(true);
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setShowForm(true);
  };

  const handleFormSubmit = async (data) => {
    if (editingDoc) {
      const result = await updateDocumento(editingDoc.id, data);
      if (result.success) {
        setShowForm(false);
        setEditingDoc(null);
      }
    } else {
      const result = await createDocumento(data);
      if (result.success) {
        setShowForm(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este documento?')) {
      await deleteDocumento(id);
    }
  };

  const handleAprobar = async (doc, tipo) => {
    // TODO: Obtener userId del contexto de autenticación
    const userId = 'current-user-id'; // Placeholder
    await aprobarDocumento(doc.id, userId, tipo);
  };

  const handleShowVersiones = (doc) => {
    setSelectedDoc(doc);
    setShowVersiones(true);
  };

  const handleShowDistribucion = (doc) => {
    setSelectedDoc(doc);
    setShowDistribucion(true);
  };

  const handleDistribuir = async (usuariosIds) => {
    if (selectedDoc) {
      await distribuirDocumento(selectedDoc.id, usuariosIds);
      setShowDistribucion(false);
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vigentes</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.porEstado?.VIGENTE || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.documentosPorRevisar || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Borradores</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.porEstado?.BORRADOR || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documentos Normativos</CardTitle>
              <CardDescription>
                Gestión de manuales, procedimientos, formatos y políticas de HC
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Documento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barra de búsqueda */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, nombre o descripción..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={filters.tipo}
                onValueChange={(value) => handleFilterChange('tipo', value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="PROCEDIMIENTO">Procedimiento</SelectItem>
                  <SelectItem value="INSTRUCTIVO">Instructivo</SelectItem>
                  <SelectItem value="FORMATO">Formato</SelectItem>
                  <SelectItem value="POLITICA">Política</SelectItem>
                  <SelectItem value="CERTIFICACION">Certificación</SelectItem>
                  <SelectItem value="CONTRATO">Contrato</SelectItem>
                  <SelectItem value="REFERENCIA">Referencia</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.categoria}
                onValueChange={(value) => handleFilterChange('categoria', value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="NORMATIVA">Normativa</SelectItem>
                  <SelectItem value="CUMPLIMIENTO">Cumplimiento</SelectItem>
                  <SelectItem value="OPERATIVO">Operativo</SelectItem>
                  <SelectItem value="AUDITORIA">Auditoría</SelectItem>
                  <SelectItem value="ARCHIVO">Archivo</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.estado}
                onValueChange={(value) => handleFilterChange('estado', value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="BORRADOR">Borrador</SelectItem>
                  <SelectItem value="EN_REVISION">En Revisión</SelectItem>
                  <SelectItem value="VIGENTE">Vigente</SelectItem>
                  <SelectItem value="OBSOLETO">Obsoleto</SelectItem>
                  <SelectItem value="ARCHIVADO">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Cargando documentos...</p>
          </CardContent>
        </Card>
      ) : documentos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron documentos</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crea tu primer documento haciendo clic en "Nuevo Documento"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documentos.map((doc) => (
            <DocumentoHCCard
              key={doc.id}
              documento={doc}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAprobar={handleAprobar}
              onShowVersiones={handleShowVersiones}
              onShowDistribucion={handleShowDistribucion}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Modal de Formulario */}
      {showForm && (
        <DocumentoHCForm
          documento={editingDoc}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingDoc(null);
          }}
        />
      )}

      {/* Modal de Versiones */}
      {showVersiones && selectedDoc && (
        <VersionesDocumentoModal
          documento={selectedDoc}
          onClose={() => {
            setShowVersiones(false);
            setSelectedDoc(null);
          }}
        />
      )}

      {/* Modal de Distribución */}
      {showDistribucion && selectedDoc && (
        <DistribucionDocumentoModal
          documento={selectedDoc}
          onDistribuir={handleDistribuir}
          onClose={() => {
            setShowDistribucion(false);
            setSelectedDoc(null);
          }}
        />
      )}
    </div>
  );
}
