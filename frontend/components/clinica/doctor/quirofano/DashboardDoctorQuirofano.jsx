'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Calendar, Activity, Clock, FileText,
  Search, RefreshCw, Filter, ChevronRight, Play,
  User, MapPin, AlertCircle, Stethoscope, CheckCircle,
  Scissors, Heart, Timer, ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { procedimientoService } from '@/services/procedimiento.service';
import SurgeryScheduler from './SurgeryScheduler';
import SurgicalWorkspace from './SurgicalWorkspace';

export default function DashboardDoctorQuirofano({ user, onChangeAttentionType }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [procedures, setProcedures] = useState([]);
  const [groupedProcedures, setGroupedProcedures] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    programadas: 0,
    enProceso: 0,
    completadas: 0
  });

  // View State
  const [showScheduler, setShowScheduler] = useState(false);
  const [activeProcedure, setActiveProcedure] = useState(null);

  useEffect(() => {
    loadProcedures();
  }, [user]);

  const loadProcedures = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await procedimientoService.getAll({
        medicoResponsableId: user.id,
        limit: 50,
      });

      if (res.success) {
        const data = res.data || [];
        setProcedures(data);

        // Agrupar por quirófano para la vista de "Pizarra"
        const grouped = data.reduce((acc, proc) => {
          const roomName = proc.quirofano?.nombre || 'Sin Asignar';
          if (!acc[roomName]) acc[roomName] = [];
          acc[roomName].push(proc);
          return acc;
        }, {});
        setGroupedProcedures(grouped);

        setStats({
          programadas: data.filter(p => p.estado === 'Programado').length,
          enProceso: data.filter(p => p.estado === 'EnProceso').length,
          completadas: data.filter(p => p.estado === 'Completado').length,
        });
      }
    } catch (error) {
      console.error('Error loading procedures:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las cirugías' });
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (proc) => {
    setActiveProcedure(proc);
  };

  // Helper para obtener color de estado
  const getStatusConfig = (status) => {
    switch(status) {
      case 'Programado':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-200',
          gradient: 'from-blue-500 to-indigo-600',
          label: 'Programada'
        };
      case 'EnProceso':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          gradient: 'from-emerald-500 to-teal-600',
          label: 'En Proceso',
          pulse: true
        };
      case 'Completado':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          border: 'border-gray-200',
          gradient: 'from-gray-400 to-gray-500',
          label: 'Completada'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          border: 'border-gray-200',
          gradient: 'from-gray-400 to-gray-500',
          label: status
        };
    }
  };

  // Filtrar procedimientos
  const filteredProcedures = searchTerm
    ? procedures.filter(p =>
        p.paciente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.paciente?.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : procedures;

  if (activeProcedure) {
    return (
      <SurgicalWorkspace
        procedure={activeProcedure}
        onClose={() => {
            setActiveProcedure(null);
            loadProcedures();
        }}
        onUpdate={loadProcedures}
      />
    );
  }

  const nextProcedure = procedures.find(p => p.estado === 'Programado');
  const inProgressProcedure = procedures.find(p => p.estado === 'EnProceso');

  return (
    <div className="p-4 lg:p-6 space-y-5 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-cyan-50/20 min-h-screen">
      {/* Header Mejorado */}
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-cyan-600/5 to-teal-600/5" />
        <div className="relative p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-2xl blur-lg opacity-40" />
              <div className="relative p-3.5 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-2xl shadow-lg">
                <Scissors className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Mis Cirugías
              </h1>
              <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Tablero quirúrgico de Dr(a). {user?.nombre} {user?.apellido}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProcedures}
              disabled={loading}
              className="gap-2 rounded-xl hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {onChangeAttentionType && (
              <Button
                variant="outline"
                size="sm"
                onClick={onChangeAttentionType}
                className="gap-2 rounded-xl hover:bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                <Stethoscope className="h-4 w-4" />
                Consulta Externa
              </Button>
            )}
            <Button
              onClick={() => setShowScheduler(true)}
              size="sm"
              className="gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 shadow-lg shadow-indigo-200"
            >
              <Plus className="h-4 w-4" />
              Programar Cirugía
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards con diseño moderno */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Programadas */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.programadas}</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Cirugías Programadas</p>
            <p className="text-xs text-gray-400 mt-1">Pendientes de realizar</p>
          </div>
        </div>

        {/* En Proceso */}
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur ${stats.enProceso > 0 ? 'opacity-30 animate-pulse' : 'opacity-20'} group-hover:opacity-40 transition-opacity`} />
          <div className={`relative bg-white rounded-2xl p-5 border ${stats.enProceso > 0 ? 'border-emerald-300 ring-2 ring-emerald-200' : 'border-gray-100'} hover:border-emerald-300 transition-all hover:shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl">
                <Activity className={`h-5 w-5 text-white ${stats.enProceso > 0 ? 'animate-pulse' : ''}`} />
              </div>
              <span className="text-3xl font-bold text-emerald-600">{stats.enProceso}</span>
            </div>
            <p className="text-sm font-medium text-gray-500">En Curso</p>
            {stats.enProceso > 0 && (
              <Button
                size="sm"
                className="w-full mt-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                onClick={() => inProgressProcedure && handleStart(inProgressProcedure)}
              >
                <Activity className="h-4 w-4 mr-2" />
                Ver Cirugía Activa
              </Button>
            )}
          </div>
        </div>

        {/* Completadas */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-slate-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-300 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-gray-400 to-slate-500 rounded-xl">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.completadas}</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Completadas Hoy</p>
            <p className="text-xs text-gray-400 mt-1">Cirugías finalizadas</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline / Schedule */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
              Agenda Quirúrgica
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar paciente o cirugía..."
                className="pl-9 bg-white rounded-xl border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Procedures List */}
          {loading ? (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-400" />
                <p className="text-gray-500">Cargando agenda quirúrgica...</p>
              </CardContent>
            </Card>
          ) : filteredProcedures.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="h-8 w-8 text-indigo-400" />
                </div>
                <p className="text-gray-600 font-medium">No hay cirugías programadas</p>
                <p className="text-gray-400 text-sm mt-1">Las cirugías aparecerán aquí cuando estén programadas</p>
                <Button
                  onClick={() => setShowScheduler(true)}
                  className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Programar Primera Cirugía
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedProcedures).map(([room, roomProcedures]) => (
                <Card key={room} className="border-0 shadow-sm rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 px-5 py-3 border-b border-indigo-100 flex justify-between items-center">
                    <h4 className="font-bold text-gray-700 flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-lg">
                        <MapPin className="h-3.5 w-3.5 text-white" />
                      </div>
                      {room}
                    </h4>
                    <Badge className="bg-white text-indigo-600 border border-indigo-200">
                      {roomProcedures.length} {roomProcedures.length === 1 ? 'procedimiento' : 'procedimientos'}
                    </Badge>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {roomProcedures.map((proc) => {
                      const statusConfig = getStatusConfig(proc.estado);
                      return (
                        <div
                          key={proc.id}
                          className="p-4 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center"
                        >
                          {/* Time Column */}
                          <div className="min-w-[90px] text-center md:text-right md:pr-4 md:border-r border-gray-100">
                            <span className="block text-xl font-bold text-gray-900">
                              {new Date(proc.fechaProgramada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <span className="text-xs text-gray-500 font-medium flex items-center justify-center md:justify-end gap-1">
                              <Timer className="h-3 w-3" />
                              {proc.duracionEstimada} min
                            </span>
                          </div>

                          {/* Info Column */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
                                {statusConfig.label}
                              </Badge>
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                {proc.tipo}
                              </span>
                            </div>
                            <h5 className="text-base font-bold text-gray-900 truncate">{proc.nombre}</h5>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-medium">{proc.paciente?.nombre} {proc.paciente?.apellido}</span>
                              {proc.paciente?.edad && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-gray-500">{proc.paciente.edad} años</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions Column */}
                          <div className="flex items-center gap-2 w-full md:w-auto">
                            {proc.estado === 'Programado' && (
                              <Button
                                onClick={() => handleStart(proc)}
                                size="sm"
                                className="w-full md:w-auto rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-md"
                              >
                                <Play className="h-3.5 w-3.5 mr-2" />
                                Iniciar
                              </Button>
                            )}
                            {proc.estado === 'EnProceso' && (
                              <Button
                                onClick={() => handleStart(proc)}
                                size="sm"
                                className="w-full md:w-auto rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md animate-pulse"
                              >
                                <Activity className="h-3.5 w-3.5 mr-2" />
                                En Curso
                              </Button>
                            )}
                            {proc.estado === 'Completado' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStart(proc)}
                                className="w-full md:w-auto rounded-xl border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"
                              >
                                <FileText className="h-3.5 w-3.5 mr-2" />
                                Ver Protocolo
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 via-cyan-600 to-teal-600 p-5">
              <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Acciones Rápidas
              </h3>
              <div className="space-y-2.5">
                <Button
                  className="w-full justify-start bg-white hover:bg-gray-100 text-indigo-700 font-semibold border-none rounded-xl h-11 shadow-md"
                  onClick={() => setShowScheduler(true)}
                >
                  <Plus className="h-4 w-4 mr-2 text-indigo-600" />
                  Nueva Cirugía
                </Button>
                <Button
                  className="w-full justify-start bg-white/90 hover:bg-white text-indigo-700 font-semibold border-none rounded-xl h-11 shadow-md"
                  disabled={!inProgressProcedure}
                  onClick={() => inProgressProcedure && handleStart(inProgressProcedure)}
                >
                  <Activity className="h-4 w-4 mr-2 text-indigo-600" />
                  Cirugía en Curso
                  {stats.enProceso > 0 && (
                    <Badge className="ml-auto bg-emerald-500 text-white font-bold">
                      {stats.enProceso}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Next Patient Card */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                Próximo Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {nextProcedure ? (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {nextProcedure.paciente?.nombre} {nextProcedure.paciente?.apellido}
                      </h3>
                      <p className="text-sm text-gray-500">
                        HC: {nextProcedure.paciente?.numeroHistoria || '---'}
                      </p>
                    </div>
                    <div className="h-11 w-11 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {nextProcedure.paciente?.nombre?.charAt(0)}
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Procedimiento:</span>
                      <span className="font-medium text-right text-gray-900">{nextProcedure.nombre}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Sala:</span>
                      <span className="font-medium text-gray-900">{nextProcedure.quirofano?.nombre || 'Por asignar'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Hora:</span>
                      <span className="font-bold text-indigo-600">
                        {new Date(nextProcedure.fechaProgramada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Estado Pre-operatorio</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-100 text-green-700 border border-green-200 rounded-full">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ayuno OK
                      </Badge>
                      <Badge className="bg-green-100 text-green-700 border border-green-200 rounded-full">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Consentimiento
                      </Badge>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
                    onClick={() => handleStart(nextProcedure)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Cirugía
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No hay pacientes en espera</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts Card */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 text-white" />
                </div>
                Avisos de Quirófano
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {stats.programadas === 0 && stats.enProceso === 0 ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-500">Sin avisos pendientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.enProceso > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 animate-pulse" />
                        <strong>Cirugía activa</strong>
                      </div>
                      <p className="text-xs mt-1 text-emerald-600">Tienes una cirugía en proceso</p>
                    </div>
                  )}
                  {stats.programadas > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <strong>{stats.programadas} cirugía(s) pendiente(s)</strong>
                      </div>
                      <p className="text-xs mt-1 text-blue-600">Programadas para hoy</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1 bg-indigo-100 rounded-lg">
                  <Scissors className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                Resumen del Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2.5 bg-blue-50 rounded-xl">
                  <span className="text-sm text-gray-600">Programadas</span>
                  <span className="font-bold text-blue-700">{stats.programadas}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-xl">
                  <span className="text-sm text-gray-600">En Curso</span>
                  <span className="font-bold text-emerald-600">{stats.enProceso}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Completadas</span>
                  <span className="font-bold text-gray-600">{stats.completadas}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SurgeryScheduler
        open={showScheduler}
        onOpenChange={setShowScheduler}
        user={user}
        onSuccess={loadProcedures}
      />
    </div>
  );
}
