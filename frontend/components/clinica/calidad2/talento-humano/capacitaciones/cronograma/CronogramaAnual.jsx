'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, ChevronDown, ChevronUp, FileText, FolderOpen, Users, RefreshCw } from 'lucide-react';
import { useCapacitaciones } from '@/hooks/useCapacitaciones';
import { useCategoriasCapacitacion } from '@/hooks/useCategoriasCapacitacion';
import CapacitacionForm from './CapacitacionForm';
import CapacitacionDetail from './CapacitacionDetail';

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const ESTADO_STYLES = {
  PROGRAMADA: { icon: '●', color: 'text-blue-500', bg: 'bg-blue-100' },
  EN_CURSO: { icon: '○', color: 'text-yellow-500', bg: 'bg-yellow-100' },
  COMPLETADA: { icon: '✓', color: 'text-green-500', bg: 'bg-green-100' },
  CANCELADA: { icon: '✗', color: 'text-red-500', bg: 'bg-red-100' },
};

export default function CronogramaAnual({ user }) {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);
  const [openCategories, setOpenCategories] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedCapacitacion, setSelectedCapacitacion] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const { cronograma, loading, loadCronograma, createCapacitacion, updateCapacitacion, deleteCapacitacion } = useCapacitaciones();
  const { categorias, loadCategorias } = useCategoriasCapacitacion();

  useEffect(() => {
    loadCronograma(anio);
    loadCategorias();
  }, [anio, loadCronograma, loadCategorias]);

  useEffect(() => {
    if (cronograma?.categorias) {
      const initialOpen = {};
      cronograma.categorias.forEach(cat => {
        initialOpen[cat.id] = true;
      });
      setOpenCategories(initialOpen);
    }
  }, [cronograma]);

  const toggleCategory = (catId) => {
    setOpenCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleCreateCapacitacion = async (data) => {
    const result = await createCapacitacion({ ...data, anio });
    if (result) {
      setShowForm(false);
      loadCronograma(anio);
    }
  };

  const handleUpdateCapacitacion = async (data) => {
    if (!selectedCapacitacion) return;
    const result = await updateCapacitacion(selectedCapacitacion.id, data);
    if (result) {
      setShowForm(false);
      setSelectedCapacitacion(null);
      loadCronograma(anio);
    }
  };

  const handleDeleteCapacitacion = async (id) => {
    const result = await deleteCapacitacion(id);
    if (result) {
      setShowDetail(false);
      setSelectedCapacitacion(null);
      loadCronograma(anio);
    }
  };

  const handleRowClick = (cap) => {
    setSelectedCapacitacion(cap);
    setShowDetail(true);
  };

  const handleEdit = (cap) => {
    setSelectedCapacitacion(cap);
    setShowForm(true);
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Cronograma de Capacitaciones {anio}</h2>
          <p className="text-sm text-muted-foreground">
            {cronograma?.totalCapacitaciones || 0} capacitaciones programadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={anio.toString()} onValueChange={(v) => setAnio(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => loadCronograma(anio)}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => { setSelectedCapacitacion(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva
          </Button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(ESTADO_STYLES).map(([estado, style]) => (
          <div key={estado} className="flex items-center gap-1">
            <span className={`${style.color} font-bold`}>{style.icon}</span>
            <span className="capitalize">{estado.toLowerCase().replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Categorías */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : cronograma?.categorias?.length > 0 ? (
        <div className="space-y-4">
          {cronograma.categorias.map(categoria => (
            <Card key={categoria.id} className="overflow-hidden">
              <Collapsible open={openCategories[categoria.id]} onOpenChange={() => toggleCategory(categoria.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                    style={{ borderLeft: `4px solid ${categoria.color || '#6366f1'}` }}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {openCategories[categoria.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {categoria.nombre}
                        <Badge variant="secondary" className="ml-2">
                          {categoria.capacitaciones.length}
                        </Badge>
                      </CardTitle>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-2 py-2 text-left w-8">N°</th>
                            <th className="px-2 py-2 text-left min-w-[200px]">Tema</th>
                            <th className="px-2 py-2 text-left min-w-[120px]">Actividad</th>
                            <th className="px-2 py-2 text-left min-w-[120px]">Responsable</th>
                            {MESES.map(mes => (
                              <th key={mes} className="px-1 py-2 text-center w-10">{mes}</th>
                            ))}
                            <th className="px-2 py-2 text-center w-16">Part.</th>
                            <th className="px-2 py-2 text-center w-16">Mat.</th>
                            <th className="px-2 py-2 text-center w-16">Acta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoria.capacitaciones.map((cap, idx) => (
                            <tr
                              key={cap.id}
                              className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() => handleRowClick(cap)}
                            >
                              <td className="px-2 py-2 text-muted-foreground">{cap.numero}</td>
                              <td className="px-2 py-2 font-medium">{cap.tema}</td>
                              <td className="px-2 py-2 text-muted-foreground">{cap.actividad || '-'}</td>
                              <td className="px-2 py-2 text-muted-foreground">{cap.responsable || '-'}</td>
                              {cap.meses.map((estado, mesIdx) => (
                                <td key={mesIdx} className="px-1 py-2 text-center">
                                  {estado && (
                                    <span className={ESTADO_STYLES[estado]?.color || 'text-gray-400'}>
                                      {ESTADO_STYLES[estado]?.icon || '●'}
                                    </span>
                                  )}
                                </td>
                              ))}
                              <td className="px-2 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <span>{cap.participantes || 0}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center">
                                {cap.carpetaMaterial && (
                                  <FolderOpen className="h-4 w-4 mx-auto text-yellow-600" />
                                )}
                              </td>
                              <td className="px-2 py-2 text-center">
                                {cap.ultimaActa && (
                                  <Badge variant="outline" className="text-xs">
                                    #{cap.ultimaActa.numero}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay capacitaciones programadas para {anio}
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      {showForm && (
        <CapacitacionForm
          open={showForm}
          onClose={() => { setShowForm(false); setSelectedCapacitacion(null); }}
          onSubmit={selectedCapacitacion ? handleUpdateCapacitacion : handleCreateCapacitacion}
          capacitacion={selectedCapacitacion}
          categorias={categorias}
          anio={anio}
        />
      )}

      {/* Detail Modal */}
      {showDetail && selectedCapacitacion && (
        <CapacitacionDetail
          open={showDetail}
          onClose={() => { setShowDetail(false); setSelectedCapacitacion(null); }}
          capacitacion={selectedCapacitacion}
          onEdit={handleEdit}
          onDelete={handleDeleteCapacitacion}
          user={user}
        />
      )}
    </div>
  );
}
