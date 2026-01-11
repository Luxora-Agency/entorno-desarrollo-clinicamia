'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Thermometer, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCalidad2TemperaturaHumedad } from '@/hooks/useCalidad2TemperaturaHumedad';
import RegistroForm from './RegistroForm';
import RegistroCard from './RegistroCard';
import GraficaTendencias from './GraficaTendencias';

const AREAS = [
  'FARMACIA',
  'BODEGA',
  'REFRIGERADOR_VACUNAS',
  'LABORATORIO',
  'ALMACEN_DISPOSITIVOS',
  'QUIROFANO',
];

export default function TemperaturaHumedadTab({ user }) {
  const {
    registros,
    loading,
    loadRegistros,
    deleteRegistro,
  } = useCalidad2TemperaturaHumedad();

  const [showForm, setShowForm] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState(null);
  const [areaFilter, setAreaFilter] = useState('TODOS');
  const [alertaFilter, setAlertaFilter] = useState('TODOS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('registros');

  useEffect(() => {
    loadRegistros();
  }, [loadRegistros]);

  const handleOpenCreate = () => {
    setEditingRegistro(null);
    setShowForm(true);
  };

  const handleOpenEdit = (registro) => {
    setEditingRegistro(registro);
    setShowForm(true);
  };

  const handleCloseForm = async (refresh = false) => {
    setShowForm(false);
    setEditingRegistro(null);
    if (refresh) {
      await loadRegistros();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este registro?')) {
      await deleteRegistro(id);
    }
  };

  const filteredRegistros = registros.filter((registro) => {
    const matchesArea = !areaFilter || areaFilter === 'TODOS' || registro.area === areaFilter;
    const matchesAlerta = !alertaFilter || alertaFilter === 'TODOS' ||
      (alertaFilter === 'true' && registro.requiereAlerta) ||
      (alertaFilter === 'false' && !registro.requiereAlerta);

    let matchesFecha = true;
    if (fechaInicio || fechaFin) {
      const registroFecha = new Date(registro.fecha);
      if (fechaInicio) matchesFecha = matchesFecha && registroFecha >= new Date(fechaInicio);
      if (fechaFin) matchesFecha = matchesFecha && registroFecha <= new Date(fechaFin);
    }

    return matchesArea && matchesAlerta && matchesFecha;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-cyan-50 border-cyan-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Thermometer className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-cyan-900 mb-1">
                Temperatura y Humedad
              </h3>
              <p className="text-sm text-cyan-700">
                Monitoreo diario de condiciones ambientales en áreas críticas con alertas automáticas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="tendencias">
            <TrendingUp className="w-4 h-4 mr-2" />
            Tendencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="mt-4">
          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-3 flex-wrap">
                  <Select value={areaFilter} onValueChange={setAreaFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Todas las áreas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todas las áreas</SelectItem>
                      {AREAS.map(area => (
                        <SelectItem key={area} value={area}>
                          {area.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={alertaFilter} onValueChange={setAlertaFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todas</SelectItem>
                      <SelectItem value="true">Solo Alertas</SelectItem>
                      <SelectItem value="false">Sin Alertas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-[160px]"
                    placeholder="Desde"
                  />

                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-[160px]"
                    placeholder="Hasta"
                  />
                </div>
                <Button onClick={handleOpenCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                </div>
              ) : filteredRegistros.length === 0 ? (
                <div className="text-center py-12">
                  <Thermometer className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 font-medium">
                    {areaFilter || alertaFilter || fechaInicio || fechaFin
                      ? 'No se encontraron registros con los filtros aplicados'
                      : 'No hay registros de temperatura/humedad'}
                  </p>
                  {!(areaFilter || alertaFilter || fechaInicio || fechaFin) && (
                    <Button onClick={handleOpenCreate} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Registro
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRegistros.map((registro) => (
                    <RegistroCard
                      key={registro.id}
                      registro={registro}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tendencias" className="mt-4">
          <GraficaTendencias />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => handleCloseForm(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRegistro ? 'Editar Registro' : 'Nuevo Registro de Temperatura/Humedad'}
            </DialogTitle>
          </DialogHeader>
          <RegistroForm
            registro={editingRegistro}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
