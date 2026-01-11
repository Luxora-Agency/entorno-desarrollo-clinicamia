'use client';

import { useState, useEffect } from 'react';
import { Book, FilePlus, Search, LayoutGrid, List as ListIcon, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DocumentGrid, DocumentList } from '../../shared/DocumentGrid';
import ManualEditor from './ManualEditor';
import { useCalidad2Manuales } from '@/hooks/useCalidad2Manuales';

// Helper to transform API data to frontend format
function apiToFrontend(manual) {
  if (!manual) return null;
  return {
    id: manual.id,
    codigo: manual.codigo,
    cargo: manual.denominacionCargo,
    dependencia: manual.dependencia || '',
    jefeInmediato: manual.cargoJefeInmediato || '',
    area: manual.area || '',
    supervisorDirecto: manual.supervisorDirecto || '',
    nivel: manual.nivel,
    proposito: manual.propositoPrincipal,
    estado: manual.estado,
    version: manual.version,
    funciones: manual.funciones?.map(f => f.descripcion) || [''],
    contribuciones: manual.contribuciones?.map(c => c.descripcion) || [''],
    conocimientos: manual.conocimientos?.map(c => c.descripcion) || [''],
    formacion: manual.requisitos?.formacionAcademica ? [manual.requisitos.formacionAcademica] : [''],
    experiencia: manual.requisitos?.experienciaTipo ? [manual.requisitos.experienciaTipo] : [''],
    experienciaAnios: manual.requisitos?.experienciaAnios || 0,
    createdAt: manual.createdAt,
    updatedAt: manual.updatedAt,
  };
}

// Helper to transform frontend data to API format
function frontendToApi(data) {
  return {
    codigo: data.codigo,
    denominacionCargo: data.cargo,
    dependencia: data.dependencia || null,
    cargoJefeInmediato: data.jefeInmediato || null,
    area: data.area || null,
    supervisorDirecto: data.supervisorDirecto || null,
    nivel: data.nivel || 'PROFESIONAL',
    propositoPrincipal: data.proposito,
    funciones: data.funciones.filter(f => f.trim()).map((f, i) => ({
      numero: i + 1,
      descripcion: f,
    })),
    contribuciones: data.contribuciones.filter(c => c.trim()).map((c, i) => ({
      descripcion: c,
      orden: i,
    })),
    conocimientos: data.conocimientos.filter(c => c.trim()).map((c, i) => ({
      tipo: 'CIENTIFICO', // Default type
      descripcion: c,
      orden: i,
    })),
    requisitos: {
      formacionAcademica: data.formacion.filter(f => f.trim()).join('\n'),
      experienciaAnios: data.experienciaAnios || 1,
      experienciaTipo: data.experiencia.filter(e => e.trim()).join('\n'),
    },
  };
}

const ESTADO_COLORS = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  VIGENTE: 'bg-green-100 text-green-800',
  OBSOLETO: 'bg-red-100 text-red-800',
};

const NIVEL_LABELS = {
  DIRECTIVO: 'Directivo',
  PROFESIONAL: 'Profesional',
  TECNICO: 'Técnico',
  OPERATIVO: 'Operativo',
};

export default function ManualFuncionesTab({ user }) {
  const [viewMode, setViewMode] = useState('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedManual, setSelectedManual] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    manuales,
    loading,
    filters,
    setFilters,
    pagination,
    setPagination,
    loadManuales,
    getManual,
    createManual,
    updateManual,
    deleteManual,
    aprobarManual,
    marcarObsoleto,
    duplicarManual,
    loadStats,
    stats,
  } = useCalidad2Manuales();

  useEffect(() => {
    loadManuales();
    loadStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, setFilters]);

  useEffect(() => {
    loadManuales();
  }, [filters, pagination.page, loadManuales]);

  const handleCreateManual = () => {
    setSelectedManual(null);
    setIsEditing(true);
  };

  const handleEditManual = async (manual) => {
    const fullManual = await getManual(manual.id);
    if (fullManual) {
      setSelectedManual(apiToFrontend(fullManual));
      setIsEditing(true);
    }
  };

  const handleSaveManual = async (data) => {
    const apiData = frontendToApi(data);
    let result;
    if (data.id) {
      result = await updateManual(data.id, apiData);
    } else {
      result = await createManual(apiData);
    }
    if (result) {
      setIsEditing(false);
      setSelectedManual(null);
    }
  };

  const handleDeleteManual = async (id) => {
    if (confirm('¿Está seguro de eliminar este manual?')) {
      await deleteManual(id);
    }
  };

  const handleDuplicate = async (manual) => {
    const result = await duplicarManual(manual.id, {
      denominacionCargo: `${manual.denominacionCargo} (Copia)`,
    });
    if (result) {
      setSelectedManual(apiToFrontend(result));
      setIsEditing(true);
    }
  };

  const handleAprobar = async (manual) => {
    if (confirm('¿Está seguro de aprobar este manual? Cambiará a estado VIGENTE.')) {
      await aprobarManual(manual.id);
    }
  };

  const handleMarcarObsoleto = async (manual) => {
    if (confirm('¿Está seguro de marcar este manual como obsoleto?')) {
      await marcarObsoleto(manual.id);
    }
  };

  // Convert manuales to documents format for grid/list view
  const documents = manuales.map(m => ({
    id: m.id,
    nombre: m.denominacionCargo,
    descripcion: `${NIVEL_LABELS[m.nivel] || m.nivel} - ${m.area || 'Sin área'}`,
    archivoTipo: 'document',
    archivoTamano: 0,
    createdAt: m.createdAt,
    estado: m.estado,
    codigo: m.codigo,
    nivel: m.nivel,
    ...m,
  }));

  if (isEditing) {
    return (
      <ManualEditor
        initialData={selectedManual}
        onSave={handleSaveManual}
        onCancel={() => {
          setIsEditing(false);
          setSelectedManual(null);
        }}
        loading={loading}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] gap-4">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <div className="text-sm text-gray-500">Total Manuales</div>
          </Card>
          {stats.porEstado?.map(s => (
            <Card key={s.estado} className="p-4">
              <div className="text-2xl font-bold">{s.cantidad}</div>
              <div className="text-sm text-gray-500">{s.estado}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content */}
      <Card className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar manuales..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={filters.estado || 'all'}
              onValueChange={(val) => setFilters(prev => ({ ...prev, estado: val === 'all' ? '' : val }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="BORRADOR">Borrador</SelectItem>
                <SelectItem value="VIGENTE">Vigente</SelectItem>
                <SelectItem value="OBSOLETO">Obsoleto</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.nivel || 'all'}
              onValueChange={(val) => setFilters(prev => ({ ...prev, nivel: val === 'all' ? '' : val }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="DIRECTIVO">Directivo</SelectItem>
                <SelectItem value="PROFESIONAL">Profesional</SelectItem>
                <SelectItem value="TECNICO">Técnico</SelectItem>
                <SelectItem value="OPERATIVO">Operativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => loadManuales()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'white' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'white' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('list')}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={handleCreateManual}>
              <FilePlus className="w-4 h-4 mr-2" />
              Nuevo Manual
            </Button>
          </div>
        </div>

        <CardContent className="flex-1 p-4 overflow-y-auto bg-slate-50">
          {loading && manuales.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : viewMode === 'grid' ? (
            <DocumentGrid
              documents={documents}
              onView={handleEditManual}
              onEdit={handleEditManual}
              onDelete={handleDeleteManual}
              emptyMessage="No hay manuales creados"
              renderExtra={(doc) => (
                <div className="flex gap-1 mt-2">
                  <Badge className={ESTADO_COLORS[doc.estado]}>
                    {doc.estado}
                  </Badge>
                  {doc.codigo && (
                    <Badge variant="outline">{doc.codigo}</Badge>
                  )}
                </div>
              )}
              extraActions={(doc) => [
                doc.estado === 'BORRADOR' && {
                  label: 'Aprobar',
                  onClick: () => handleAprobar(doc),
                },
                doc.estado === 'VIGENTE' && {
                  label: 'Marcar Obsoleto',
                  onClick: () => handleMarcarObsoleto(doc),
                },
                {
                  label: 'Duplicar',
                  onClick: () => handleDuplicate(doc),
                },
              ].filter(Boolean)}
            />
          ) : (
            <DocumentList
              documents={documents}
              onView={handleEditManual}
              onEdit={handleEditManual}
              onDelete={handleDeleteManual}
              emptyMessage="No hay manuales creados"
              renderExtra={(doc) => (
                <div className="flex gap-1">
                  <Badge className={ESTADO_COLORS[doc.estado]}>
                    {doc.estado}
                  </Badge>
                  {doc.codigo && (
                    <Badge variant="outline">{doc.codigo}</Badge>
                  )}
                </div>
              )}
            />
          )}
        </CardContent>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {manuales.length} de {pagination.total} manuales
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
