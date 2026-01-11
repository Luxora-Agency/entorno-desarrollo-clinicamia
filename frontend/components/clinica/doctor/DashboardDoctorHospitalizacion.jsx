'use client';

import { useState, useCallback } from 'react';
import {
  BedDouble, Clock, User, Activity, FileText,
  ClipboardList, Eye, RefreshCw, Stethoscope, ArrowLeft,
  CalendarDays, AlertCircle, History, MoreVertical, Pill
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useHospitalizedPatients } from '@/hooks/useHospitalizedPatients';
import EpicrisisGenerator from './EpicrisisGenerator';
import ModalEvolucionHospitalizacion from './ModalEvolucionHospitalizacion';
import ModalOrdenesMedicas from './ModalOrdenesMedicas';
import PanelHistorialClinico from './PanelHistorialClinico';
import RondaMedicaPanel from './RondaMedicaPanel';
import { clearAttentionTypePreference } from './AttentionTypeSelector';

// Helper para calcular días de estancia
const calcularDiasEstancia = (fechaIngreso) => {
  if (!fechaIngreso) return 0;
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const diferencia = hoy - ingreso;
  return Math.floor(diferencia / (1000 * 60 * 60 * 24));
};

// Helper para formatear fecha
const formatFecha = (fecha) => {
  if (!fecha) return '--';
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function DashboardDoctorHospitalizacion({ user, onChangeAttentionType }) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'epicrisis', 'ronda'
  const [selectedAdmision, setSelectedAdmision] = useState(null);

  // Estados para modales
  const [showEvolucionModal, setShowEvolucionModal] = useState(false);
  const [showOrdenesModal, setShowOrdenesModal] = useState(false);
  const [showHistorialPanel, setShowHistorialPanel] = useState(false);

  const {
    patients: admisiones,
    loading,
    error,
    pagination,
    refresh
  } = useHospitalizedPatients(user?.id);

  // Calcular estadísticas
  const stats = {
    total: pagination.total || admisiones.length,
    pendientesRonda: admisiones.filter(a => {
      const ultimaEvolucion = a.evolucionesClinicas?.[0];
      if (!ultimaEvolucion) return true;
      const fechaEvolucion = new Date(ultimaEvolucion.fechaEvolucion);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      return fechaEvolucion < hoy;
    }).length,
    estanciaPromedio: admisiones.length > 0
      ? Math.round(admisiones.reduce((sum, a) => sum + calcularDiasEstancia(a.fechaIngreso), 0) / admisiones.length)
      : 0,
  };

  const handleVerHCE = (admision) => {
    window.open(`/?module=hce&pacienteId=${admision.paciente?.id}`, '_blank');
  };

  const handleNuevaEvolucion = (admision) => {
    setSelectedAdmision(admision);
    setShowEvolucionModal(true);
  };

  const handleVerOrdenes = (admision) => {
    setSelectedAdmision(admision);
    setShowOrdenesModal(true);
  };

  const handleVerHistorial = (admision) => {
    setSelectedAdmision(admision);
    setShowHistorialPanel(true);
  };

  const handleEpicrisis = (admision) => {
    setSelectedAdmision(admision);
    setViewMode('epicrisis');
  };

  const handleIniciarRonda = () => {
    setViewMode('ronda');
  };

  const handleCambiarTipoAtencion = () => {
    clearAttentionTypePreference();
    if (onChangeAttentionType) {
      onChangeAttentionType();
    }
  };

  const handleEvolucionSuccess = () => {
    refresh();
  };

  // Vista de Ronda Médica
  if (viewMode === 'ronda') {
    return (
      <RondaMedicaPanel
        admisiones={admisiones}
        user={user}
        onClose={() => setViewMode('dashboard')}
        onComplete={() => {
          setViewMode('dashboard');
          refresh();
        }}
      />
    );
  }

  // Vista de Epicrisis
  if (viewMode === 'epicrisis' && selectedAdmision) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <Button variant="ghost" onClick={() => setViewMode('dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
          <EpicrisisGenerator
            admisionId={selectedAdmision.id}
            paciente={selectedAdmision.paciente}
            onClose={() => setViewMode('dashboard')}
          />
        </div>
      </div>
    );
  }

  // Vista Principal Dashboard
  return (
    <div className="p-6 lg:p-8 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <BedDouble className="h-6 w-6" />
            </div>
            Hospitalización
          </h1>
          <p className="text-gray-500 mt-1">
            Pacientes internados a cargo de Dr(a). {user?.nombre} {user?.apellido}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" onClick={handleCambiarTipoAtencion}>
            <Stethoscope className="h-4 w-4 mr-2" />
            Consulta Externa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-sm border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Pacientes a Cargo</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-full">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Pendientes Ronda</p>
                <h3 className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendientesRonda}</h3>
              </div>
              <div className="p-2 bg-yellow-50 rounded-full">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Estancia Promedio</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.estanciaPromedio} días</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-full">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient List */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
                Pacientes Hospitalizados
              </CardTitle>
              <CardDescription>
                Lista de pacientes internados actualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                  Cargando pacientes...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  {error}
                </div>
              ) : admisiones.length === 0 ? (
                <div className="p-12 text-center">
                  <BedDouble className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No tiene pacientes hospitalizados a su cargo.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Ingreso</TableHead>
                      <TableHead>Días</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admisiones.map((admision) => {
                      const diasEstancia = calcularDiasEstancia(admision.fechaIngreso);
                      const ultimaEvolucion = admision.evolucionesClinicas?.[0];
                      const necesitaRonda = !ultimaEvolucion ||
                        new Date(ultimaEvolucion.fechaEvolucion) < new Date(new Date().setHours(0,0,0,0));

                      return (
                        <TableRow
                          key={admision.id}
                          className={necesitaRonda ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : ''}
                        >
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {admision.paciente?.nombre} {admision.paciente?.apellido}
                              </p>
                              <p className="text-xs text-gray-500">
                                {admision.diagnosticoIngreso}
                              </p>
                              {admision.paciente?.alergias && (
                                <Badge variant="destructive" className="text-xs mt-1">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Alergias
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{admision.unidad?.nombre || '--'}</p>
                              <p className="text-gray-500 text-xs">
                                {admision.cama?.habitacion?.nombre || ''} - Cama {admision.cama?.numero || '--'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {formatFecha(admision.fechaIngreso)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={diasEstancia > 7 ? 'destructive' : diasEstancia > 3 ? 'warning' : 'default'}
                              className={
                                diasEstancia > 7 ? 'bg-red-100 text-red-800' :
                                diasEstancia > 3 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }
                            >
                              {diasEstancia} días
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleVerHCE(admision)}
                                title="Ver Historia Clínica"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNuevaEvolucion(admision)}
                                className={necesitaRonda ? 'border-yellow-500 text-yellow-700 hover:bg-yellow-50' : ''}
                                title="Nueva Evolución"
                              >
                                <Activity className="h-4 w-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleVerHistorial(admision)}>
                                    <History className="h-4 w-4 mr-2" />
                                    Ver Historial
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleVerOrdenes(admision)}>
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    Órdenes Médicas
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEpicrisis(admision)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Generar Epicrisis
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-none"
                  onClick={handleIniciarRonda}
                  disabled={stats.pendientesRonda === 0}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Iniciar Ronda Médica
                  {stats.pendientesRonda > 0 && (
                    <Badge className="ml-auto bg-yellow-500 text-yellow-900">
                      {stats.pendientesRonda}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-none"
                  onClick={() => {
                    if (admisiones.length > 0) {
                      handleVerOrdenes(admisiones[0]);
                    }
                  }}
                  disabled={admisiones.length === 0}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Ver Órdenes Médicas
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-none"
                  onClick={() => {
                    if (admisiones.length > 0) {
                      handleEpicrisis(admisiones[0]);
                    }
                  }}
                  disabled={admisiones.length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Epicrisis
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Rounds Alert */}
          {stats.pendientesRonda > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Rondas Pendientes</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Tiene {stats.pendientesRonda} {stats.pendientesRonda === 1 ? 'paciente' : 'pacientes'} sin evolución del día de hoy.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                      onClick={handleIniciarRonda}
                    >
                      Iniciar Ronda
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Resumen del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Pacientes</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pendientes Ronda</span>
                  <span className="font-semibold text-yellow-600">{stats.pendientesRonda}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estancia Promedio</span>
                  <span className="font-semibold">{stats.estanciaPromedio} días</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modales */}
      <ModalEvolucionHospitalizacion
        open={showEvolucionModal}
        onOpenChange={setShowEvolucionModal}
        admision={selectedAdmision}
        user={user}
        onSuccess={handleEvolucionSuccess}
      />

      <ModalOrdenesMedicas
        open={showOrdenesModal}
        onOpenChange={setShowOrdenesModal}
        admision={selectedAdmision}
        user={user}
      />

      <PanelHistorialClinico
        open={showHistorialPanel}
        onOpenChange={setShowHistorialPanel}
        admision={selectedAdmision}
      />
    </div>
  );
}
