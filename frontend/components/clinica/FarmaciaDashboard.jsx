'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pill, Plus, ClipboardList, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductoModal from './ProductoModal';
import { ImportMedicinesModal } from './farmacia/ImportMedicinesModal';
import { ProductStats } from './farmacia/ProductStats';
import { ProductFilters } from './farmacia/ProductFilters';
import { ProductList } from './farmacia/ProductList';
import { DispensingList } from './farmacia/DispensingList';
import { DispensingModal } from './farmacia/DispensingModal';
import { useFarmacia } from '@/hooks/useFarmacia';
import { useOrdenesMedicamentos } from '@/hooks/useOrdenesMedicamentos';

export default function FarmaciaDashboard({ user }) {
  // Inventory Hook
  const { 
    productos, 
    stats, 
    categorias, 
    loading: loadingInv, 
    filters, 
    setFilters, 
    refresh: refreshInv, 
    deleteProducto 
  } = useFarmacia();

  // Dispensing Hook
  const {
    ordenes,
    loading: loadingOrdenes,
    filters: filtersOrdenes,
    setFilters: setFiltersOrdenes,
    refresh: refreshOrdenes,
    despacharOrden
  } = useOrdenesMedicamentos();

  // Local State
  const [activeTab, setActiveTab] = useState('inventario');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  
  // Dispensing Modal State
  const [isDispensingModalOpen, setIsDispensingModalOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;
    await deleteProducto(id);
  };

  const handleDespachar = async (id) => {
      const success = await despacharOrden(id);
      if (success) {
          refreshInv(); // Refresh inventory after dispensing
      }
      return success;
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Farmacia</h1>
          </div>
          <p className="text-gray-600 ml-14">Gestiona el inventario y dispensación de medicamentos</p>
        </div>
        {activeTab === 'inventario' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 h-11 font-semibold"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button 
              onClick={() => {
                  setEditingProducto(null);
                  setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md flex-1 sm:flex-none h-11 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="inventario" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6">
                <Pill className="w-4 h-4 mr-2" /> Inventario
            </TabsTrigger>
            <TabsTrigger value="dispensacion" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6">
                <ClipboardList className="w-4 h-4 mr-2" /> Dispensación
                {ordenes.filter(o => o.estado === 'Pendiente').length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {ordenes.filter(o => o.estado === 'Pendiente').length}
                    </span>
                )}
            </TabsTrigger>
        </TabsList>

        <TabsContent value="inventario" className="space-y-6">
            {/* Stats Cards */}
            <ProductStats stats={stats} />

            {/* Search and Filters */}
            <ProductFilters 
                filters={filters} 
                onFilterChange={setFilters} 
                categorias={categorias}
            />

            {/* Table */}
            <ProductList 
                productos={productos} 
                loading={loadingInv} 
                onEdit={(prod) => {
                setEditingProducto(prod);
                setIsModalOpen(true);
                }}
                onDelete={handleDelete}
                onAddFirst={() => {
                    setEditingProducto(null);
                    setIsModalOpen(true);
                }}
            />
        </TabsContent>

        <TabsContent value="dispensacion">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-semibold text-gray-800">Órdenes Pendientes</h2>
                 <div className="flex gap-2">
                     <Button 
                        variant={filtersOrdenes.estado === 'Pendiente' ? 'default' : 'outline'}
                        onClick={() => setFiltersOrdenes({...filtersOrdenes, estado: 'Pendiente'})}
                        size="sm"
                     >
                        Pendientes
                     </Button>
                     <Button 
                        variant={filtersOrdenes.estado === 'Despachada' ? 'default' : 'outline'}
                        onClick={() => setFiltersOrdenes({...filtersOrdenes, estado: 'Despachada'})}
                        size="sm"
                     >
                        Historial
                     </Button>
                 </div>
            </div>
            
            <DispensingList 
                ordenes={ordenes}
                loading={loadingOrdenes}
                onViewDetails={(orden) => {
                    setSelectedOrden(orden);
                    setIsDispensingModalOpen(true);
                }}
            />
        </TabsContent>
      </Tabs>

      {/* Product Modal */}
      <ProductoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProducto(null);
        }}
        editingProducto={editingProducto}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingProducto(null);
          refreshInv();
        }}
      />

      {/* Import Modal */}
      <ImportMedicinesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={refreshInv}
      />

      {/* Dispensing Modal */}
      <DispensingModal
        isOpen={isDispensingModalOpen}
        onClose={() => {
            setIsDispensingModalOpen(false);
            setSelectedOrden(null);
        }}
        orden={selectedOrden}
        onDespachar={handleDespachar}
      />
    </div>
  );
}
