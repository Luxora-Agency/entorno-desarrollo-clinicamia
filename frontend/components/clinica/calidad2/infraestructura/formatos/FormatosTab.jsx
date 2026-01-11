'use client';

import { useState, useEffect } from 'react';
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
  FileText,
  Download,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react';
import { useFormatosInfraestructura } from '@/hooks/useFormatosInfraestructura';

const CATEGORIAS = {
  LIMPIEZA_DESINFECCION: 'Limpieza y Desinfección',
  LISTA_VERIFICACION: 'Listas de Verificación',
  MANTENIMIENTO: 'Mantenimiento',
  RH1: 'Residuos Hospitalarios (RH1)',
  CONCEPTO_SANITARIO: 'Conceptos Sanitarios',
  AUDITORIA: 'Auditoría',
  OTRO: 'Otros',
};

const CATEGORIA_COLORS = {
  LIMPIEZA_DESINFECCION: 'bg-blue-100 text-blue-800',
  LISTA_VERIFICACION: 'bg-purple-100 text-purple-800',
  MANTENIMIENTO: 'bg-green-100 text-green-800',
  RH1: 'bg-orange-100 text-orange-800',
  CONCEPTO_SANITARIO: 'bg-pink-100 text-pink-800',
  AUDITORIA: 'bg-indigo-100 text-indigo-800',
  OTRO: 'bg-gray-100 text-gray-800',
};

export default function FormatosTab({ user }) {
  const {
    formatos,
    loading,
    estadisticas,
    loadFormatos,
    loadFormatosPorCategoria,
    deleteFormato,
    duplicarFormato,
    loadEstadisticas,
    descargarPlantilla,
  } = useFormatosInfraestructura();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');

  useEffect(() => {
    if (categoriaFiltro === 'TODAS') {
      loadFormatos({ search: searchTerm });
    } else {
      loadFormatosPorCategoria(categoriaFiltro);
    }
  }, [categoriaFiltro, loadFormatos, loadFormatosPorCategoria]);

  useEffect(() => {
    loadEstadisticas();
  }, [loadEstadisticas]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (categoriaFiltro === 'TODAS') {
      loadFormatos({ search: value });
    }
  };

  const handleDelete = async (formato) => {
    if (confirm(`¿Está seguro de eliminar el formato ${formato.nombre}?`)) {
      const success = await deleteFormato(formato.id);
      if (success) {
        if (categoriaFiltro === 'TODAS') {
          loadFormatos();
        } else {
          loadFormatosPorCategoria(categoriaFiltro);
        }
        loadEstadisticas();
      }
    }
  };

  const handleDuplicate = async (formato) => {
    const nuevoCodigo = prompt(
      'Ingrese el código para el nuevo formato:',
      `${formato.codigo}-COPIA`
    );
    if (nuevoCodigo) {
      const success = await duplicarFormato(formato.id, nuevoCodigo);
      if (success) {
        if (categoriaFiltro === 'TODAS') {
          loadFormatos();
        } else {
          loadFormatosPorCategoria(categoriaFiltro);
        }
      }
    }
  };

  const filteredFormatos = formatos;

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.total || 0}</div>
              <div className="text-sm text-gray-600">Total de Formatos</div>
            </CardContent>
          </Card>
          {Object.entries(estadisticas.porCategoria || {}).slice(0, 3).map(([cat, count]) => (
            <Card key={cat}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">{count}</div>
                <div className="text-sm text-gray-600">{CATEGORIAS[cat] || cat}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex gap-4 max-w-2xl w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar formatos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas las categorías</SelectItem>
              {Object.entries(CATEGORIAS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Formato
        </Button>
      </div>

      {/* Listado de formatos */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredFormatos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              {searchTerm || categoriaFiltro !== 'TODAS'
                ? 'No se encontraron formatos con los criterios seleccionados'
                : 'No hay formatos registrados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFormatos.map((formato) => (
            <Card key={formato.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-gray-500">{formato.codigo}</span>
                </div>
                <Badge className={CATEGORIA_COLORS[formato.categoria] || CATEGORIA_COLORS.OTRO}>
                  {CATEGORIAS[formato.categoria] || formato.categoria}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{formato.nombre}</h3>
                  {formato.descripcion && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {formato.descripcion}
                    </p>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Versión: {formato.version}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  {formato.plantillaUrl && (
                    <Button
                      onClick={() => descargarPlantilla(formato)}
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Descargar
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDuplicate(formato)}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(formato)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Info creador */}
                {formato.creador && (
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    Creado por: {formato.creador.nombre} {formato.creador.apellido}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
