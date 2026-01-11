'use client';

import { useState, useEffect } from 'react';
import { FileCheck, FileText, Plus, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCalidad2FormatosMedicamentos } from '@/hooks/useCalidad2FormatosMedicamentos';
import FormatoForm from './FormatoForm';
import InstanciaForm from './InstanciaForm';
import FormatoCard from './FormatoCard';

const CATEGORIAS = [
  'TEMPERATURA',
  'INVENTARIO',
  'INSPECCION',
  'MANTENIMIENTO',
  'LIMPIEZA',
  'OTRO',
];

const ESTADOS = [
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'EN_REVISION', label: 'En Revisión' },
  { value: 'OBSOLETO', label: 'Obsoleto' },
];

export default function FormatosTab({ user }) {
  const {
    formatos,
    instancias,
    loading,
    loadFormatos,
    loadInstancias,
    deleteFormato,
    deleteInstancia,
  } = useCalidad2FormatosMedicamentos();

  const [activeSubTab, setActiveSubTab] = useState('formatos');
  const [showFormatoForm, setShowFormatoForm] = useState(false);
  const [showInstanciaForm, setShowInstanciaForm] = useState(false);
  const [editingFormato, setEditingFormato] = useState(null);
  const [editingInstancia, setEditingInstancia] = useState(null);
  const [selectedFormatoForInstancia, setSelectedFormatoForInstancia] = useState(null);

  // Filters for formatos
  const [categoriaFilter, setCategoriaFilter] = useState('TODOS');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');
  const [searchFilter, setSearchFilter] = useState('');

  // Filters for instancias
  const [formatoFilterInstancia, setFormatoFilterInstancia] = useState('TODOS');
  const [periodoFilter, setPeriodoFilter] = useState('');

  useEffect(() => {
    loadFormatos();
    loadInstancias();
  }, [loadFormatos, loadInstancias]);

  // Formato handlers
  const handleOpenCreateFormato = () => {
    setEditingFormato(null);
    setShowFormatoForm(true);
  };

  const handleOpenEditFormato = (formato) => {
    setEditingFormato(formato);
    setShowFormatoForm(true);
  };

  const handleCloseFormatoForm = async (refresh = false) => {
    setShowFormatoForm(false);
    setEditingFormato(null);
    if (refresh) {
      await loadFormatos();
    }
  };

  const handleDeleteFormato = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este formato? Esta acción no se puede deshacer.')) {
      await deleteFormato(id);
    }
  };

  // Instancia handlers
  const handleOpenCreateInstancia = (formato = null) => {
    setSelectedFormatoForInstancia(formato);
    setEditingInstancia(null);
    setShowInstanciaForm(true);
  };

  const handleOpenEditInstancia = (instancia) => {
    setEditingInstancia(instancia);
    setSelectedFormatoForInstancia(null);
    setShowInstanciaForm(true);
  };

  const handleCloseInstanciaForm = async (refresh = false) => {
    setShowInstanciaForm(false);
    setEditingInstancia(null);
    setSelectedFormatoForInstancia(null);
    if (refresh) {
      await loadInstancias();
    }
  };

  const handleDeleteInstancia = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta instancia?')) {
      await deleteInstancia(id);
    }
  };

  // Filter formatos
  const filteredFormatos = formatos.filter((formato) => {
    const matchesCategoria = !categoriaFilter || categoriaFilter === 'TODOS' || formato.categoria === categoriaFilter;
    const matchesEstado = !estadoFilter || estadoFilter === 'TODOS' || formato.estado === estadoFilter;
    const matchesSearch = !searchFilter ||
      formato.nombre.toLowerCase().includes(searchFilter.toLowerCase()) ||
      formato.codigo.toLowerCase().includes(searchFilter.toLowerCase());

    return matchesCategoria && matchesEstado && matchesSearch;
  });

  // Filter instancias
  const filteredInstancias = instancias.filter((instancia) => {
    const matchesFormato = !formatoFilterInstancia || formatoFilterInstancia === 'TODOS' || instancia.formatoId === formatoFilterInstancia;
    const matchesPeriodo = !periodoFilter || instancia.periodo.includes(periodoFilter);

    return matchesFormato && matchesPeriodo;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">
                Formatos y Plantillas
              </h3>
              <p className="text-sm text-purple-700">
                Biblioteca de formatos oficiales del módulo con control de versiones e instancias llenadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="formatos">
            <FileText className="w-4 h-4 mr-2" />
            Formatos (Plantillas)
          </TabsTrigger>
          <TabsTrigger value="instancias">
            <FileCheck className="w-4 h-4 mr-2" />
            Instancias (Llenados)
          </TabsTrigger>
        </TabsList>

        {/* Formatos Tab */}
        <TabsContent value="formatos" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 flex items-center gap-3 flex-wrap">
                  <Input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="max-w-xs"
                  />

                  <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todas las categorías</SelectItem>
                      {CATEGORIAS.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      {ESTADOS.map(est => (
                        <SelectItem key={est.value} value={est.value}>
                          {est.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleOpenCreateFormato}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Formato
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                </div>
              ) : filteredFormatos.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 font-medium">
                    {searchFilter || categoriaFilter || estadoFilter
                      ? 'No se encontraron formatos con los filtros aplicados'
                      : 'No hay formatos registrados'}
                  </p>
                  {!(searchFilter || categoriaFilter || estadoFilter) && (
                    <Button onClick={handleOpenCreateFormato} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Formato
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFormatos.map((formato) => (
                    <FormatoCard
                      key={formato.id}
                      formato={formato}
                      onEdit={handleOpenEditFormato}
                      onDelete={handleDeleteFormato}
                      onCreateInstancia={handleOpenCreateInstancia}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instancias Tab */}
        <TabsContent value="instancias" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 flex items-center gap-3 flex-wrap">
                  <Select value={formatoFilterInstancia} onValueChange={setFormatoFilterInstancia}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Todos los formatos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los formatos</SelectItem>
                      {formatos.filter(f => f.estado === 'VIGENTE').map(formato => (
                        <SelectItem key={formato.id} value={formato.id}>
                          {formato.codigo} - {formato.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="text"
                    placeholder="Filtrar por período (ej: 2025)"
                    value={periodoFilter}
                    onChange={(e) => setPeriodoFilter(e.target.value)}
                    className="max-w-xs"
                  />
                </div>

                <Button onClick={() => handleOpenCreateInstancia()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Instancia
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                </div>
              ) : filteredInstancias.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 font-medium">
                    {formatoFilterInstancia || periodoFilter
                      ? 'No se encontraron instancias con los filtros aplicados'
                      : 'No hay instancias registradas'}
                  </p>
                  {!(formatoFilterInstancia || periodoFilter) && (
                    <Button onClick={() => handleOpenCreateInstancia()} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Instancia
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredInstancias.map((instancia) => (
                    <div
                      key={instancia.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {instancia.formato?.nombre || 'Sin formato'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Período: {instancia.periodo} | Estado: {instancia.estado}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Llenado por: {instancia.llenador?.nombre} el{' '}
                            {new Date(instancia.fechaLlenado).toLocaleDateString()}
                          </p>
                          {instancia.revisor && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Revisado por: {instancia.revisor.nombre}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditInstancia(instancia)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteInstancia(instancia.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Formato Form Dialog */}
      <Dialog open={showFormatoForm} onOpenChange={() => handleCloseFormatoForm(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFormato ? 'Editar Formato' : 'Nuevo Formato'}
            </DialogTitle>
          </DialogHeader>
          <FormatoForm
            formato={editingFormato}
            onClose={handleCloseFormatoForm}
          />
        </DialogContent>
      </Dialog>

      {/* Instancia Form Dialog */}
      <Dialog open={showInstanciaForm} onOpenChange={() => handleCloseInstanciaForm(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInstancia ? 'Editar Instancia' : 'Nueva Instancia'}
            </DialogTitle>
          </DialogHeader>
          <InstanciaForm
            instancia={editingInstancia}
            preselectedFormato={selectedFormatoForInstancia}
            onClose={handleCloseInstanciaForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
