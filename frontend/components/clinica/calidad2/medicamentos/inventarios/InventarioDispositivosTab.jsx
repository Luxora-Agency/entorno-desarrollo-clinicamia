'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCalidad2InventarioMedicamentos } from '@/hooks/useCalidad2InventarioMedicamentos';
import InventarioForm from './InventarioForm';
import InventarioCard from './InventarioCard';

export default function InventarioDispositivosTab({ user }) {
  const {
    inventario,
    loading,
    loadInventario,
    deleteItem,
  } = useCalidad2InventarioMedicamentos('DISPOSITIVO_MEDICO');

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInventario();
  }, [loadInventario]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCloseForm = async (refresh = false) => {
    setShowForm(false);
    setEditingItem(null);
    if (refresh) {
      await loadInventario();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este dispositivo del inventario?')) {
      await deleteItem(id);
    }
  };

  const filteredItems = inventario.filter((item) => {
    const matchesSearch = !searchTerm ||
      item.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fabricante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clasificacionRiesgo?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Separate items by alert status
  const itemsVencidos = filteredItems.filter(item => {
    const today = new Date();
    return new Date(item.fechaVencimiento) < today;
  });

  const itemsProximosVencer = filteredItems.filter(item => {
    const today = new Date();
    const vencimiento = new Date(item.fechaVencimiento);
    return item.tieneAlertaVencimiento && vencimiento >= today;
  });

  const itemsStockBajo = filteredItems.filter(item => item.tieneAlertaStock);

  const itemsNormales = filteredItems.filter(item => {
    const today = new Date();
    const vencimiento = new Date(item.fechaVencimiento);
    return !item.tieneAlertaVencimiento && !item.tieneAlertaStock && vencimiento >= today;
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{filteredItems.length}</p>
                <p className="text-xs text-gray-500">Total Dispositivos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{itemsVencidos.length}</p>
                <p className="text-xs text-gray-500">Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{itemsProximosVencer.length}</p>
                <p className="text-xs text-gray-500">Próx. a Vencer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{itemsStockBajo.length}</p>
                <p className="text-xs text-gray-500">Stock Bajo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por código, nombre, fabricante o clasificación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Dispositivo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                {searchTerm
                  ? 'No se encontraron dispositivos con los filtros aplicados'
                  : 'No hay dispositivos médicos registrados en el inventario'}
              </p>
              {!searchTerm && (
                <Button onClick={handleOpenCreate} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Dispositivo
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Vencidos */}
              {itemsVencidos.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Vencidos ({itemsVencidos.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itemsVencidos.map((item) => (
                      <InventarioCard
                        key={item.id}
                        item={item}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Próximos a vencer */}
              {itemsProximosVencer.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Próximos a Vencer ({itemsProximosVencer.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itemsProximosVencer.map((item) => (
                      <InventarioCard
                        key={item.id}
                        item={item}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Stock bajo */}
              {itemsStockBajo.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-orange-600 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Stock Bajo ({itemsStockBajo.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itemsStockBajo.map((item) => (
                      <InventarioCard
                        key={item.id}
                        item={item}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Normales */}
              {itemsNormales.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">
                    Sin Alertas ({itemsNormales.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itemsNormales.map((item) => (
                      <InventarioCard
                        key={item.id}
                        item={item}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => handleCloseForm(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Dispositivo Médico' : 'Nuevo Dispositivo Médico'}
            </DialogTitle>
          </DialogHeader>
          <InventarioForm
            item={editingItem}
            tipo="DISPOSITIVO_MEDICO"
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
