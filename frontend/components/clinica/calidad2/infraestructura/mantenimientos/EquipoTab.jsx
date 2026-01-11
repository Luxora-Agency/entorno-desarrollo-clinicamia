'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMantenimientosEquipos } from '@/hooks/useMantenimientosEquipos';
import EquipoCard from './EquipoCard';
import MantenimientoTimeline from './MantenimientoTimeline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TIPO_LABELS = {
  ASCENSOR: 'Ascensor',
  BOMBEROS: 'Sistema Bomberos',
  EXTINTOR: 'Extintor',
  FUMIGACION: 'Fumigación',
  LAVADO_TANQUES: 'Lavado de Tanques',
  PLANTA_ELECTRICA: 'Planta Eléctrica',
};

export default function EquipoTab({ tipo, user }) {
  const { equipos, loading, loadEquiposPorTipo, deleteEquipo } = useMantenimientosEquipos();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const tipoLabel = TIPO_LABELS[tipo] || tipo;

  useEffect(() => {
    loadEquiposPorTipo(tipo);
  }, [tipo, loadEquiposPorTipo]);

  const filteredEquipos = (equipos || []).filter(
    (equipo) =>
      equipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipo.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (equipo) => {
    setSelectedEquipo(equipo);
    setShowTimeline(true);
  };

  const handleEdit = (equipo) => {
    setSelectedEquipo(equipo);
    setShowForm(true);
  };

  const handleDelete = async (equipo) => {
    if (confirm(`¿Está seguro de eliminar ${tipoLabel.toLowerCase()} ${equipo.nombre}?`)) {
      const success = await deleteEquipo(equipo.id);
      if (success) {
        loadEquiposPorTipo(tipo);
      }
    }
  };

  const handleTimeline = (equipo) => {
    setSelectedEquipo(equipo);
    setShowTimeline(true);
  };

  const handleCreateNew = () => {
    setSelectedEquipo(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y botón crear */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={`Buscar ${tipoLabel.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo {tipoLabel}
        </Button>
      </div>

      {/* Listado de equipos */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredEquipos.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {searchTerm
              ? `No se encontraron ${tipoLabel.toLowerCase()}s con ese criterio de búsqueda`
              : `No hay ${tipoLabel.toLowerCase()}s registrados`}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateNew} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Registrar primer {tipoLabel.toLowerCase()}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipos.map((equipo) => (
            <EquipoCard
              key={equipo.id}
              equipo={equipo}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTimeline={handleTimeline}
            />
          ))}
        </div>
      )}

      {/* Modal de Timeline */}
      <Dialog open={showTimeline} onOpenChange={setShowTimeline}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Timeline de Mantenimientos {selectedEquipo && `- ${selectedEquipo.nombre}`}
            </DialogTitle>
          </DialogHeader>
          {selectedEquipo && (
            <MantenimientoTimeline equipoId={selectedEquipo.id} equipo={selectedEquipo} />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Formulario (placeholder por ahora) */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEquipo ? `Editar ${tipoLabel}` : `Nuevo ${tipoLabel}`}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-gray-500">
            <p>Formulario de {tipoLabel.toLowerCase()} (por implementar)</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
