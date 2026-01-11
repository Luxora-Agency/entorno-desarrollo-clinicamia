'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Download, RefreshCw, FileText } from 'lucide-react';
import { useInfraestructuraDocumentosLegales } from '@/hooks/useInfraestructuraDocumentosLegales';
import AlertasWidget from './AlertasWidget';
import DocumentoLegalForm from './DocumentoLegalForm';
import DocumentoLegalCard from './DocumentoLegalCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DocumentosLegalesTab({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroVencimiento, setFiltroVencimiento] = useState('TODOS');
  const [showForm, setShowForm] = useState(false);
  const [documentoEditando, setDocumentoEditando] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);

  const {
    documentos,
    loading,
    pagination,
    loadDocumentos,
    getEstadisticas,
    deleteDocumento,
  } = useInfraestructuraDocumentosLegales();

  useEffect(() => {
    loadDocumentos({ page: 1 });
    loadEstadisticas();
  }, []);

  const loadEstadisticas = async () => {
    const stats = await getEstadisticas();
    setEstadisticas(stats);
  };

  const handleSearch = () => {
    loadDocumentos({
      tipoDocumento: filtroTipo !== 'TODOS' ? filtroTipo : undefined,
      tieneVencimiento: filtroVencimiento !== 'TODOS' ? filtroVencimiento : undefined,
      page: 1,
    });
  };

  const handleRefresh = () => {
    loadDocumentos({ page: pagination.page });
    loadEstadisticas();
  };

  const handleCreateNew = () => {
    setDocumentoEditando(null);
    setShowForm(true);
  };

  const handleEdit = (documento) => {
    setDocumentoEditando(documento);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este documento?')) {
      const success = await deleteDocumento(id);
      if (success) {
        handleRefresh();
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setDocumentoEditando(null);
    handleRefresh();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setDocumentoEditando(null);
  };

  const documentosFiltrados = documentos.filter(doc =>
    doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.numeroDocumento && doc.numeroDocumento.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Alertas Widget */}
      <AlertasWidget onRefresh={handleRefresh} />

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">{estadisticas.totalDocumentos}</div>
            <div className="text-sm text-gray-600">Total Documentos</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">{estadisticas.documentosConVencimiento}</div>
            <div className="text-sm text-gray-600">Con Vencimiento</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-red-600">{estadisticas.vencidos}</div>
            <div className="text-sm text-gray-600">Vencidos</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-orange-600">
              {estadisticas.proximosVencer?.proximos30Dias || 0}
            </div>
            <div className="text-sm text-gray-600">Próximos 30 días</div>
          </div>
        </div>
      )}

      {/* Barra de herramientas */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtros */}
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="CONCEPTO_SANITARIO">Concepto Sanitario</SelectItem>
              <SelectItem value="CERTIFICADO">Certificado</SelectItem>
              <SelectItem value="LICENCIA">Licencia</SelectItem>
              <SelectItem value="POLIZA">Póliza</SelectItem>
              <SelectItem value="OTRO">Otro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroVencimiento} onValueChange={setFiltroVencimiento}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Vencimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="true">Con vencimiento</SelectItem>
              <SelectItem value="false">Sin vencimiento</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>

          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Documento
          </Button>
        </div>
      </div>

      {/* Grid de documentos */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Cargando documentos...</p>
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No hay documentos</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || (filtroTipo && filtroTipo !== 'TODOS') || (filtroVencimiento && filtroVencimiento !== 'TODOS')
                ? 'No se encontraron documentos con los filtros aplicados'
                : 'Comienza agregando tu primer documento legal'}
            </p>
            {!searchTerm && (!filtroTipo || filtroTipo === 'TODOS') && (!filtroVencimiento || filtroVencimiento === 'TODOS') && (
              <Button onClick={handleCreateNew} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Documento
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentosFiltrados.map((documento) => (
              <DocumentoLegalCard
                key={documento.id}
                documento={documento}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">
            Mostrando {documentosFiltrados.length} de {pagination.total} documentos
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDocumentos({ page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center px-4 py-2 text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDocumentos({ page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <DocumentoLegalForm
          documento={documentoEditando}
          onSuccess={handleFormSuccess}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
