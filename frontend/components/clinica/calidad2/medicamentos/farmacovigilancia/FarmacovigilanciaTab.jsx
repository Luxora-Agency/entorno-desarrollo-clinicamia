'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, BarChart3 } from 'lucide-react';
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
import { useCalidad2Farmacovigilancia } from '@/hooks/useCalidad2Farmacovigilancia';
import ReporteFarmacoForm from './ReporteFarmacoForm';
import ReporteCard from './ReporteCard';
import DashboardFarmacovigilancia from './DashboardFarmacovigilancia';

const ESTADOS = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'REPORTADO_INVIMA', label: 'Reportado INVIMA' },
  { value: 'CERRADO', label: 'Cerrado' },
];

const GRAVEDADES = [
  { value: 'Leve', label: 'Leve' },
  { value: 'Moderada', label: 'Moderada' },
  { value: 'Grave', label: 'Grave' },
  { value: 'Mortal', label: 'Mortal' },
];

export default function FarmacovigilanciaTab({ user }) {
  const {
    reportes,
    loading,
    loadReportes,
    deleteReporte,
    reportarINVIMA,
  } = useCalidad2Farmacovigilancia();

  const [showForm, setShowForm] = useState(false);
  const [editingReporte, setEditingReporte] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');
  const [gravedadFilter, setGravedadFilter] = useState('TODOS');
  const [activeSubTab, setActiveSubTab] = useState('reportes');

  useEffect(() => {
    loadReportes();
  }, [loadReportes]);

  const handleOpenCreate = () => {
    setEditingReporte(null);
    setShowForm(true);
  };

  const handleOpenEdit = (reporte) => {
    setEditingReporte(reporte);
    setShowForm(true);
  };

  const handleCloseForm = async (refresh = false) => {
    setShowForm(false);
    setEditingReporte(null);
    if (refresh) {
      await loadReportes();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este reporte?')) {
      await deleteReporte(id);
    }
  };

  const handleReportarINVIMA = async (id) => {
    const numeroReporte = prompt('Ingrese el número de reporte INVIMA:');
    if (numeroReporte) {
      await reportarINVIMA(id, numeroReporte);
    }
  };

  const filteredReportes = reportes.filter((reporte) => {
    const matchesSearch = !searchTerm ||
      reporte.medicamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.paciente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.numeroReporteINVIMA?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = !estadoFilter || estadoFilter === 'TODOS' || reporte.estado === estadoFilter;
    const matchesGravedad = !gravedadFilter || gravedadFilter === 'TODOS' || reporte.gravedadReaccion === gravedadFilter;

    return matchesSearch && matchesEstado && matchesGravedad;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">
                Farmacovigilancia - Reacciones Adversas a Medicamentos (RAM)
              </h3>
              <p className="text-sm text-purple-700">
                Registro y reporte de reacciones adversas a medicamentos conforme a normativa INVIMA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
          <TabsTrigger value="dashboard">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reportes" className="mt-4">
          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por medicamento, paciente o número INVIMA..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los estados</SelectItem>
                      {ESTADOS.map(estado => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={gravedadFilter} onValueChange={setGravedadFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todas las gravedades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todas las gravedades</SelectItem>
                      {GRAVEDADES.map(gravedad => (
                        <SelectItem key={gravedad.value} value={gravedad.value}>
                          {gravedad.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleOpenCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Reporte RAM
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                </div>
              ) : filteredReportes.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 font-medium">
                    {searchTerm || estadoFilter || gravedadFilter
                      ? 'No se encontraron reportes con los filtros aplicados'
                      : 'No hay reportes de farmacovigilancia registrados'}
                  </p>
                  {!(searchTerm || estadoFilter || gravedadFilter) && (
                    <Button onClick={handleOpenCreate} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Reporte
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReportes.map((reporte) => (
                    <ReporteCard
                      key={reporte.id}
                      reporte={reporte}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                      onReportarINVIMA={handleReportarINVIMA}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardFarmacovigilancia user={user} />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => handleCloseForm(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReporte ? 'Editar Reporte RAM' : 'Nuevo Reporte RAM'}
            </DialogTitle>
          </DialogHeader>
          <ReporteFarmacoForm
            reporte={editingReporte}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
