'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInfraestructuraAuditorias } from '@/hooks/useInfraestructuraAuditorias';
import AuditoriaCard from './AuditoriaCard';
import AuditoriaForm from './AuditoriaForm';

export default function AuditoriasTab({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [auditoriaEditando, setAuditoriaEditando] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);

  // Filtros
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  const {
    auditorias,
    loading,
    loadAuditorias,
    deleteAuditoria,
    cambiarEstado,
    getEstadisticas,
    getAniosDisponibles,
  } = useInfraestructuraAuditorias();

  useEffect(() => {
    loadAnios();
  }, []);

  useEffect(() => {
    if (anioSeleccionado) {
      loadData();
    }
  }, [anioSeleccionado, tipoFiltro, estadoFiltro]);

  const loadAnios = async () => {
    const anios = await getAniosDisponibles();
    const anioActual = new Date().getFullYear();
    const todosAnios = Array.from(new Set([...anios, anioActual, anioActual - 1, anioActual + 1])).sort(
      (a, b) => b - a
    );
    setAniosDisponibles(todosAnios);
  };

  const loadData = async () => {
    const filters = { anio: anioSeleccionado };
    if (tipoFiltro !== 'TODOS') filters.tipo = tipoFiltro;
    if (estadoFiltro !== 'TODOS') filters.estado = estadoFiltro;

    await loadAuditorias(filters);
    loadEstadisticas();
  };

  const loadEstadisticas = async () => {
    const stats = await getEstadisticas(anioSeleccionado);
    setEstadisticas(stats);
  };

  const handleCreate = () => {
    setAuditoriaEditando(null);
    setShowForm(true);
  };

  const handleEdit = (auditoria) => {
    setAuditoriaEditando(auditoria);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta auditoría?')) {
      const success = await deleteAuditoria(id);
      if (success) {
        loadData();
      }
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    const success = await cambiarEstado(id, nuevoEstado);
    if (success) {
      loadData();
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setAuditoriaEditando(null);
    loadData();
    loadAnios();
  };

  const handleClose = () => {
    setShowForm(false);
    setAuditoriaEditando(null);
  };

  return (
    <div className="space-y-6">
      {/* Header y filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por tipo */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas</SelectItem>
                <SelectItem value="INTERNA">Internas</SelectItem>
                <SelectItem value="EXTERNA">Externas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por estado */}
          <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos estados</SelectItem>
              <SelectItem value="PROGRAMADA">Programadas</SelectItem>
              <SelectItem value="EN_CURSO">En curso</SelectItem>
              <SelectItem value="COMPLETADA">Completadas</SelectItem>
              <SelectItem value="CANCELADA">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por año */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <Select value={String(anioSeleccionado)} onValueChange={(val) => setAnioSeleccionado(parseInt(val))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aniosDisponibles.map((anio) => (
                  <SelectItem key={anio} value={String(anio)}>
                    {anio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Auditoría
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{estadisticas.total}</div>
                <div className="text-sm text-gray-600 mt-1">Total</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{estadisticas.porTipo.internas}</div>
                <div className="text-sm text-gray-600 mt-1">Internas</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{estadisticas.porTipo.externas}</div>
                <div className="text-sm text-gray-600 mt-1">Externas</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{estadisticas.porEstado.programadas}</div>
                <div className="text-sm text-gray-600 mt-1">Programadas</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{estadisticas.porEstado.enCurso}</div>
                <div className="text-sm text-gray-600 mt-1">En Curso</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{estadisticas.porEstado.completadas}</div>
                <div className="text-sm text-gray-600 mt-1">Completadas</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de auditorías */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Auditorías {anioSeleccionado}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : auditorias.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay auditorías para {anioSeleccionado}</p>
                <p className="text-sm mt-2">Cree la primera auditoría del año</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {auditorias.map((auditoria) => (
              <AuditoriaCard
                key={auditoria.id}
                auditoria={auditoria}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCambiarEstado={handleCambiarEstado}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <AuditoriaForm
          auditoria={auditoriaEditando}
          onSuccess={handleSuccess}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
