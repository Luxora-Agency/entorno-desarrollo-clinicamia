'use client';

import { useState, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useInfraestructuraFormatos } from '@/hooks/useInfraestructuraFormatos';
import FormatoFormModal from './FormatoFormModal';

export default function FormatosTab({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formatoEditar, setFormatoEditar] = useState(null);
  const [categorias, setCategorias] = useState([]);

  const {
    formatos,
    estadisticas,
    loading,
    loadFormatos,
    getCategorias,
    loadEstadisticas,
    deleteFormato,
    duplicarFormato,
  } = useInfraestructuraFormatos();

  useEffect(() => {
    loadData();
    loadCategorias();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadFormatos({ categoria: categoriaFiltro, search: searchTerm }),
      loadEstadisticas(),
    ]);
  };

  const loadCategorias = async () => {
    const cats = await getCategorias();
    setCategorias(cats);
  };

  const handleSearch = () => {
    loadFormatos({ categoria: categoriaFiltro, search: searchTerm });
  };

  const handleCategoriaChange = (value) => {
    setCategoriaFiltro(value === 'TODOS' ? '' : value);
  };

  useEffect(() => {
    loadFormatos({ categoria: categoriaFiltro, search: searchTerm });
  }, [categoriaFiltro]);

  const handleNuevoFormato = () => {
    setFormatoEditar(null);
    setIsFormModalOpen(true);
  };

  const handleEditarFormato = (formato) => {
    setFormatoEditar(formato);
    setIsFormModalOpen(true);
  };

  const handleEliminarFormato = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este formato?')) {
      const success = await deleteFormato(id);
      if (success) {
        loadData();
      }
    }
  };

  const handleDuplicarFormato = async (formato) => {
    const nuevoCodigo = prompt(`Ingrese el código para el formato duplicado:`, `${formato.codigo}_COPIA`);
    if (nuevoCodigo) {
      const duplicado = await duplicarFormato(formato.id, nuevoCodigo);
      if (duplicado) {
        loadData();
      }
    }
  };

  const handleDescargarFormato = (formato) => {
    if (formato.plantillaUrl) {
      window.open(formato.plantillaUrl, '_blank');
    }
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setFormatoEditar(null);
    loadData();
  };

  // Agrupar formatos por categoría
  const formatosAgrupados = formatos.reduce((acc, formato) => {
    if (!acc[formato.categoria]) {
      acc[formato.categoria] = [];
    }
    acc[formato.categoria].push(formato);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-blue-600" />
            Formatos y Plantillas PGIRASA
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestión de plantillas y formatos oficiales
          </p>
        </div>

        <Button onClick={handleNuevoFormato}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Formato
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{estadisticas.total}</div>
              <div className="text-xs text-gray-600 mt-1">Total Formatos</div>
            </CardContent>
          </Card>

          {Object.entries(estadisticas.porCategoria || {}).map(([categoria, count]) => (
            <Card key={categoria}>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {categorias.find(c => c.value === categoria)?.label || categoria}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar por código, nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline">
                Buscar
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <Select value={categoriaFiltro || 'TODOS'} onValueChange={handleCategoriaChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas las Categorías</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de formatos agrupados */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Cargando formatos...
          </CardContent>
        </Card>
      ) : formatos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No se encontraron formatos</p>
            <p className="text-sm mt-1">Agregue un nuevo formato para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(formatosAgrupados).map(([categoria, formatosCategoria]) => (
            <div key={categoria}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {categorias.find(c => c.value === categoria)?.label || categoria}
                <Badge variant="outline" className="ml-2">
                  {formatosCategoria.length}
                </Badge>
              </h3>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {formatosCategoria.map(formato => (
                  <Card key={formato.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {formato.nombre}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {formato.codigo}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              v{formato.version}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {formato.descripcion && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {formato.descripcion}
                        </p>
                      )}

                      {formato.plantillaNombre && (
                        <div className="text-xs text-gray-500">
                          📄 {formato.plantillaNombre}
                        </div>
                      )}

                      <div className="text-xs text-gray-400">
                        Creado por: {formato.creador?.nombre || 'Desconocido'}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        {formato.plantillaUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDescargarFormato(formato)}
                            title="Descargar plantilla"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditarFormato(formato)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicarFormato(formato)}
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEliminarFormato(formato.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de formulario */}
      {isFormModalOpen && (
        <FormatoFormModal
          formato={formatoEditar}
          isOpen={isFormModalOpen}
          onClose={handleCloseModal}
          categorias={categorias}
        />
      )}
    </div>
  );
}
