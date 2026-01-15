'use client';

import { useState, useCallback } from 'react';
import {
  BedDouble, Clock, User, Activity, FileText,
  ClipboardList, Eye, RefreshCw, Stethoscope, ArrowLeft,
  CalendarDays, AlertCircle, History, MoreVertical, Pill, CheckCircle
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

  // Debug: log user info
  console.log('[MisHospitalizados] User prop:', { id: user?.id, nombre: user?.nombre, rol: user?.rol });

  const {
    patients: admisiones,
    loading,
    error,
    pagination,
    refresh
  } = useHospitalizedPatients(user?.id);

  // Debug: log data received
  console.log('[MisHospitalizados] Hook data:', {
    loading,
    error,
    admisionesCount: admisiones?.length,
    pagination
  });

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
    <div className="p-4 lg:p-6 space-y-5 bg-gradient-to-br from-slate-50 via-purple-50/40 to-violet-50/30 min-h-screen">
      {/* Header Mejorado */}
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-violet-600/5 to-indigo-600/5" />
        <div className="relative p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl blur-lg opacity-40" />
              <div className="relative p-3.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
                <BedDouble className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Mis Hospitalizados
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Pacientes internados a cargo de Dr(a). {user?.nombre} {user?.apellido}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="gap-2 rounded-xl hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCambiarTipoAtencion}
              className="gap-2 rounded-xl hover:bg-purple-50 text-purple-700 border-purple-200"
            >
              <Stethoscope className="h-4 w-4" />
              Consulta Externa
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards con diseño moderno */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pacientes a Cargo */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-purple-200 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
                <User className="h-5 w-5 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Pacientes a Cargo</p>
          </div>
        </div>

        {/* Pendientes Ronda */}
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur ${stats.pendientesRonda > 0 ? 'opacity-30 animate-pulse' : 'opacity-20'} group-hover:opacity-40 transition-opacity`} />
          <div className={`relative bg-white rounded-2xl p-5 border ${stats.pendientesRonda > 0 ? 'border-amber-300 ring-2 ring-amber-200' : 'border-gray-100'} hover:border-amber-300 transition-all hover:shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                <AlertCircle className={`h-5 w-5 text-white ${stats.pendientesRonda > 0 ? 'animate-pulse' : ''}`} />
              </div>
              <span className="text-3xl font-bold text-amber-600">{stats.pendientesRonda}</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Pendientes Ronda</p>
            {stats.pendientesRonda > 0 && (
              <Button
                size="sm"
                className="w-full mt-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                onClick={handleIniciarRonda}
              >
                <Activity className="h-4 w-4 mr-2" />
                Iniciar Ronda
              </Button>
            )}
          </div>
        </div>

        {/* Estancia Promedio */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-gray-900">{stats.estanciaPromedio}</span>
                <span className="text-lg font-medium text-gray-500 ml-1">días</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Estancia Promedio</p>
          </div>
        </div>
      </div>

      {/* Banner de Alertas Prominente */}
      {(() => {
        const alertas = [];
        console.log('[MisHospitalizados] Generando alertas para', admisiones.length, 'admisiones');
        admisiones.forEach(admision => {
          const paciente = admision.paciente;
          const diasEstancia = calcularDiasEstancia(admision.fechaIngreso);
          console.log('[MisHospitalizados] Paciente:', paciente?.nombre, '- Alergias:', paciente?.alergias, '- Crónicas:', paciente?.enfermedadesCronicas, '- Días:', diasEstancia);

          if (paciente?.alergias) {
            alertas.push({
              tipo: 'alergias',
              icono: '🚨',
              paciente: `${paciente.nombre} ${paciente.apellido}`,
              mensaje: paciente.alergias,
              titulo: 'Alergias',
              color: 'red',
              admision
            });
          }

          if (paciente?.enfermedadesCronicas) {
            alertas.push({
              tipo: 'cronicas',
              icono: '⚠️',
              paciente: `${paciente.nombre} ${paciente.apellido}`,
              mensaje: paciente.enfermedadesCronicas,
              titulo: 'Enf. Crónicas',
              color: 'orange',
              admision
            });
          }

          if (diasEstancia > 7) {
            alertas.push({
              tipo: 'estancia',
              icono: '📅',
              paciente: `${paciente?.nombre} ${paciente?.apellido}`,
              mensaje: `${diasEstancia} días de estancia`,
              titulo: 'Estancia Prolongada',
              color: 'amber',
              admision
            });
          }
        });

        console.log('[MisHospitalizados] Total alertas generadas:', alertas.length, alertas.map(a => `${a.paciente} - ${a.titulo}`));

        // Mostrar estado vacío si no hay alertas
        if (alertas.length === 0) {
          return (
            <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700">Alertas de Pacientes</h3>
                    <p className="text-xs text-gray-500">Información importante a tener en cuenta</p>
                  </div>
                </div>
                <Badge className="bg-gray-100 text-gray-500 font-medium text-sm px-3 py-1">
                  0 alertas
                </Badge>
              </div>
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-7 w-7 text-green-500" />
                </div>
                <p className="text-gray-600 font-medium">Sin alertas pendientes</p>
                <p className="text-sm text-gray-400 mt-1">Tus pacientes no tienen alergias ni condiciones crónicas registradas</p>
              </div>
            </div>
          );
        }

        return (
          <div className="relative overflow-hidden bg-white rounded-2xl border border-red-200 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-amber-500/5" />
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-red-100 bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl blur opacity-40 animate-pulse" />
                    <div className="relative p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Alertas de Pacientes</h3>
                    <p className="text-xs text-gray-500">Información importante a tener en cuenta</p>
                  </div>
                </div>
                <Badge className="bg-red-100 text-red-700 font-bold text-sm px-3 py-1">
                  {alertas.length} {alertas.length === 1 ? 'alerta' : 'alertas'}
                </Badge>
              </div>

              {/* Alertas Grid */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alertas.map((alerta, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleVerHCE(alerta.admision)}
                      className={`group text-left p-4 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
                        alerta.color === 'red'
                          ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 hover:border-red-400'
                          : alerta.color === 'orange'
                          ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-400'
                          : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          alerta.color === 'red' ? 'bg-red-100'
                          : alerta.color === 'orange' ? 'bg-orange-100'
                          : 'bg-amber-100'
                        }`}>
                          <AlertCircle className={`h-5 w-5 ${
                            alerta.color === 'red' ? 'text-red-600'
                            : alerta.color === 'orange' ? 'text-orange-600'
                            : 'text-amber-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wide ${
                              alerta.color === 'red' ? 'text-red-600'
                              : alerta.color === 'orange' ? 'text-orange-600'
                              : 'text-amber-600'
                            }`}>
                              {alerta.titulo}
                            </span>
                          </div>
                          <p className={`font-bold text-sm truncate ${
                            alerta.color === 'red' ? 'text-red-900'
                            : alerta.color === 'orange' ? 'text-orange-900'
                            : 'text-amber-900'
                          }`}>
                            {alerta.paciente}
                          </p>
                          <p className={`text-xs mt-1 line-clamp-2 ${
                            alerta.color === 'red' ? 'text-red-700'
                            : alerta.color === 'orange' ? 'text-orange-700'
                            : 'text-amber-700'
                          }`}>
                            {alerta.mensaje}
                          </p>
                        </div>
                        <Eye className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                          alerta.color === 'red' ? 'text-red-400'
                          : alerta.color === 'orange' ? 'text-orange-400'
                          : 'text-amber-400'
                        }`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-white" />
                </div>
                Pacientes Hospitalizados
              </CardTitle>
              <CardDescription>
                Lista de pacientes internados actualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-400" />
                  Cargando pacientes...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  {error}
                </div>
              ) : admisiones.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BedDouble className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No tiene pacientes hospitalizados</p>
                  <p className="text-gray-400 text-sm mt-1">Los pacientes aparecerán aquí cuando estén a su cargo</p>
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
        <div className="space-y-5">
          {/* Quick Actions - Mejorado contraste */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 p-5">
              <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Acciones Rápidas
              </h3>
              <div className="space-y-2.5">
                <Button
                  className="w-full justify-start bg-white hover:bg-gray-100 text-purple-700 font-semibold border-none rounded-xl h-11 shadow-md"
                  onClick={handleIniciarRonda}
                  disabled={stats.pendientesRonda === 0}
                >
                  <Activity className="h-4 w-4 mr-2 text-purple-600" />
                  Iniciar Ronda Médica
                  {stats.pendientesRonda > 0 && (
                    <Badge className="ml-auto bg-amber-500 text-white font-bold">
                      {stats.pendientesRonda}
                    </Badge>
                  )}
                </Button>
                <Button
                  className="w-full justify-start bg-white/90 hover:bg-white text-purple-700 font-semibold border-none rounded-xl h-11 shadow-md"
                  onClick={() => {
                    if (admisiones.length > 0) {
                      handleVerOrdenes(admisiones[0]);
                    }
                  }}
                  disabled={admisiones.length === 0}
                >
                  <ClipboardList className="h-4 w-4 mr-2 text-purple-600" />
                  Ver Órdenes Médicas
                </Button>
                <Button
                  className="w-full justify-start bg-white/90 hover:bg-white text-purple-700 font-semibold border-none rounded-xl h-11 shadow-md"
                  onClick={() => {
                    if (admisiones.length > 0) {
                      handleEpicrisis(admisiones[0]);
                    }
                  }}
                  disabled={admisiones.length === 0}
                >
                  <FileText className="h-4 w-4 mr-2 text-purple-600" />
                  Generar Epicrisis
                </Button>
              </div>
            </div>
          </Card>

          {/* Pending Rounds Alert */}
          {stats.pendientesRonda > 0 && (
            <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-amber-300 shadow-lg shadow-amber-100/50">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10" />
              <div className="relative p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-800">Rondas Pendientes</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Tiene {stats.pendientesRonda} {stats.pendientesRonda === 1 ? 'paciente' : 'pacientes'} sin evolución del día de hoy.
                    </p>
                    <Button
                      size="sm"
                      className="mt-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200"
                      onClick={handleIniciarRonda}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Iniciar Ronda
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Card */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1 bg-purple-100 rounded-lg">
                  <BedDouble className="h-3.5 w-3.5 text-purple-600" />
                </div>
                Resumen del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2.5 bg-purple-50 rounded-xl">
                  <span className="text-sm text-gray-600">Total Pacientes</span>
                  <span className="font-bold text-purple-700">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-xl">
                  <span className="text-sm text-gray-600">Pendientes Ronda</span>
                  <span className="font-bold text-amber-600">{stats.pendientesRonda}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-blue-50 rounded-xl">
                  <span className="text-sm text-gray-600">Estancia Promedio</span>
                  <span className="font-bold text-blue-600">{stats.estanciaPromedio} días</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Alertas en Sidebar */}
          {(() => {
            const alertasSidebar = [];
            admisiones.forEach(admision => {
              const paciente = admision.paciente;
              const diasEstancia = calcularDiasEstancia(admision.fechaIngreso);

              if (paciente?.alergias) {
                alertasSidebar.push({
                  tipo: 'alergias',
                  paciente: `${paciente.nombre} ${paciente.apellido}`,
                  detalle: paciente.alergias,
                  color: 'red',
                  admision
                });
              }
              if (paciente?.enfermedadesCronicas) {
                alertasSidebar.push({
                  tipo: 'cronicas',
                  paciente: `${paciente.nombre} ${paciente.apellido}`,
                  detalle: paciente.enfermedadesCronicas,
                  color: 'orange',
                  admision
                });
              }
              if (diasEstancia > 7) {
                alertasSidebar.push({
                  tipo: 'estancia',
                  paciente: `${paciente?.nombre} ${paciente?.apellido}`,
                  detalle: `${diasEstancia} días hospitalizado`,
                  color: 'amber',
                  admision
                });
              }
            });

            // Mostrar estado vacío si no hay alertas
            if (alertasSidebar.length === 0) {
              return (
                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                    <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                      <div className="p-1.5 bg-gray-200 rounded-lg">
                        <AlertCircle className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      Alertas Clínicas
                      <Badge className="ml-auto bg-gray-100 text-gray-500 text-xs">0</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-center py-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="text-sm text-gray-500">Sin alertas</p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                      <AlertCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                    Alertas Clínicas
                    <Badge className="ml-auto bg-red-100 text-red-700 text-xs">{alertasSidebar.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {alertasSidebar.map((alerta, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleVerHCE(alerta.admision)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all hover:shadow-md ${
                          alerta.color === 'red'
                            ? 'bg-red-50 border-red-200 hover:border-red-300'
                            : alerta.color === 'orange'
                            ? 'bg-orange-50 border-orange-200 hover:border-orange-300'
                            : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            alerta.color === 'red' ? 'text-red-500'
                            : alerta.color === 'orange' ? 'text-orange-500'
                            : 'text-amber-500'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs font-bold truncate ${
                                alerta.color === 'red' ? 'text-red-800'
                                : alerta.color === 'orange' ? 'text-orange-800'
                                : 'text-amber-800'
                              }`}>
                                {alerta.paciente}
                              </p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                alerta.color === 'red' ? 'bg-red-200 text-red-700'
                                : alerta.color === 'orange' ? 'bg-orange-200 text-orange-700'
                                : 'bg-amber-200 text-amber-700'
                              }`}>
                                {alerta.tipo === 'alergias' ? 'Alergia' : alerta.tipo === 'cronicas' ? 'Crónica' : 'Estancia'}
                              </span>
                            </div>
                            <p className={`text-xs truncate mt-0.5 ${
                              alerta.color === 'red' ? 'text-red-600'
                              : alerta.color === 'orange' ? 'text-orange-600'
                              : 'text-amber-600'
                            }`}>
                              {alerta.detalle}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
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
