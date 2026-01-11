'use client';

import { useState, useEffect } from 'react';
import { useCalidad2ConsentimientosHC } from '@/hooks/useCalidad2ConsentimientosHC';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  FileSignature,
} from 'lucide-react';
import ConsentimientoTipoForm from './ConsentimientoTipoForm';

const SERVICIOS = [
  { value: 'CIRUGIA', label: 'Cirugía' },
  { value: 'PROCEDIMIENTOS', label: 'Procedimientos' },
  { value: 'CONSULTA', label: 'Consulta' },
  { value: 'HOSPITALIZACION', label: 'Hospitalización' },
  { value: 'URGENCIAS', label: 'Urgencias' },
  { value: 'IMAGENOLOGIA', label: 'Imagenología' },
];

export default function BibliotecaConsentimientos() {
  const {
    tipos,
    loading,
    pagination,
    loadTipos,
    deleteTipo,
  } = useCalidad2ConsentimientosHC();

  const [showForm, setShowForm] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    servicio: 'all',
    estado: 'all',
    search: '',
  });

  // Cargar tipos al montar y cuando cambien filtros
  useEffect(() => {
    // Limpiar filtros "all" antes de enviar al hook
    const cleanFilters = { ...filters };
    if (cleanFilters.servicio === 'all') delete cleanFilters.servicio;
    if (cleanFilters.estado === 'all') delete cleanFilters.estado;
    loadTipos(cleanFilters);
  }, [filters]);

  // Handlers
  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleCreateNew = () => {
    setSelectedTipo(null);
    setShowForm(true);
  };

  const handleEdit = (tipo) => {
    setSelectedTipo(tipo);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta plantilla de consentimiento?')) {
      const success = await deleteTipo(id);
      if (success) {
        loadTipos(filters);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTipo(null);
    loadTipos(filters);
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const getServicioLabel = (servicio) => {
    return SERVICIOS.find(s => s.value === servicio)?.label || servicio;
  };

  return (
    <div className="space-y-6">
      {/* Filtros y acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Biblioteca de Consentimientos</span>
            <Button onClick={handleCreateNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Plantilla
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Buscador */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, código o procedimiento..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            {/* Filtro por servicio */}
            <Select
              value={filters.servicio}
              onValueChange={(value) => handleFilterChange('servicio', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los servicios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los servicios</SelectItem>
                {SERVICIOS.map(servicio => (
                  <SelectItem key={servicio.value} value={servicio.value}>
                    {servicio.label}
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
                <SelectItem value="VIGENTE">Vigente</SelectItem>
                <SelectItem value="OBSOLETO">Obsoleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resultado del filtro */}
          {filters.search || (filters.servicio !== 'all') || (filters.estado !== 'all') ? (
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary">
                {pagination.total} resultado{pagination.total !== 1 ? 's' : ''}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ page: 1, limit: 12, servicio: '', estado: '', search: '' })}
              >
                Limpiar filtros
              </Button>
            </div>
          ) : null}

          {/* Grid de plantillas */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Cargando plantillas...</p>
            </div>
          ) : tipos.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No se encontraron plantillas</p>
              <Button onClick={handleCreateNew} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Plantilla
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tipos.map((tipo) => (
                  <Card key={tipo.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={tipo.estado === 'VIGENTE' ? 'default' : 'secondary'}>
                              {tipo.estado}
                            </Badge>
                            <Badge variant="outline">{tipo.codigo}</Badge>
                          </div>
                          <h3 className="font-semibold text-lg line-clamp-2">{tipo.nombre}</h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(tipo)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(tipo.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Servicio:</span>
                          <span className="font-medium">{getServicioLabel(tipo.servicio)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Procedimiento:</span>
                          <span className="font-medium line-clamp-1">{tipo.procedimiento}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Versión:</span>
                          <span className="font-medium">{tipo.version}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {tipo.requiereFirma && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span>Firma paciente</span>
                            </div>
                          )}
                          {tipo.requiereTestigo && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-blue-600" />
                              <span>Testigo</span>
                            </div>
                          )}
                          {tipo.requiereFamiliar && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-purple-600" />
                              <span>Familiar</span>
                            </div>
                          )}
                        </div>
                        {tipo._count && (
                          <p className="text-xs text-gray-500">
                            {tipo._count.aplicaciones} aplicación(es) registrada(s)
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={() => handleEdit(tipo)}
                        className="w-full"
                        variant="outline"
                        size="sm"
                      >
                        <FileSignature className="h-4 w-4 mr-2" />
                        Ver Plantilla
                      </Button>
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
                    {pagination.total} plantillas
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
        <ConsentimientoTipoForm
          tipo={selectedTipo}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
