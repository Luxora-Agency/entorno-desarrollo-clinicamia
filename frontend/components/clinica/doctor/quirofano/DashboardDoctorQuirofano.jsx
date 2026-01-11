'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Activity, Clock, FileText, 
  Search, RefreshCw, Filter, ChevronRight, Play,
  User, MapPin, AlertCircle
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

export default function DashboardDoctorQuirofano({ user }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [procedures, setProcedures] = useState([]);
  const [groupedProcedures, setGroupedProcedures] = useState({});
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
  const getStatusColor = (status) => {
    switch(status) {
      case 'Programado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EnProceso': return 'bg-green-100 text-green-800 border-green-200 animate-pulse';
      case 'Completado': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
      {/* Header con estilo más quirúrgico */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
                <Activity className="h-6 w-6" />
              </div>
              Tablero Quirúrgico
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Operaciones en curso y programadas para hoy
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadProcedures} disabled={loading} className="border-slate-300">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={() => setShowScheduler(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all hover:scale-105">
              <Plus className="h-4 w-4 mr-2" />
              Programar Cirugía
            </Button>
          </div>
        </div>

        {/* Stats Summary Inline */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
            <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Calendar className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">Programadas</p>
              <p className="text-xl font-bold text-slate-800">{stats.programadas}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-green-50 rounded-lg border border-green-100">
            <div className="p-2 bg-green-100 rounded-full text-green-600"><Activity className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-green-600 font-semibold uppercase">En Curso</p>
              <p className="text-xl font-bold text-slate-800">{stats.enProceso}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <div className="p-2 bg-slate-200 rounded-full text-slate-600"><FileText className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Realizadas</p>
              <p className="text-xl font-bold text-slate-800">{stats.completadas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Board View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline / Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Agenda del Día
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Filtrar por paciente..." className="pl-8 bg-white" />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 bg-white rounded-xl shadow-sm">Cargando agenda...</div>
          ) : Object.keys(groupedProcedures).length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
              <Activity className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>No hay cirugías programadas en su agenda.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedProcedures).map(([room, roomProcedures]) => (
                <div key={room} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-indigo-500" />
                      {room}
                    </h4>
                    <Badge variant="outline" className="bg-white text-slate-600">
                      {roomProcedures.length} procedimientos
                    </Badge>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {roomProcedures.map((proc) => (
                      <div key={proc.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center">
                        {/* Time Column */}
                        <div className="min-w-[80px] text-center md:text-right border-r md:border-slate-100 md:pr-4">
                          <span className="block text-lg font-bold text-slate-800">
                            {new Date(proc.fechaProgramada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <span className="text-xs text-slate-500 uppercase font-medium">
                            {proc.duracionEstimada} min
                          </span>
                        </div>

                        {/* Info Column */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${getStatusColor(proc.estado)} border px-2 py-0.5`}>
                              {proc.estado}
                            </Badge>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                              {proc.tipo}
                            </span>
                          </div>
                          <h5 className="text-base font-bold text-slate-900">{proc.nombre}</h5>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{proc.paciente?.nombre} {proc.paciente?.apellido}</span>
                            <span className="text-slate-300">|</span>
                            <span>{proc.paciente?.edad} años</span>
                          </div>
                        </div>

                        {/* Actions Column */}
                        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                          {proc.estado === 'Programado' && (
                            <Button 
                              onClick={() => handleStart(proc)} 
                              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                            >
                              <Play className="h-3 w-3 mr-2" />
                              Iniciar
                            </Button>
                          )}
                          {proc.estado === 'EnProceso' && (
                            <Button 
                              onClick={() => handleStart(proc)} 
                              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-sm animate-pulse"
                            >
                              <Activity className="h-3 w-3 mr-2" />
                              En Curso
                            </Button>
                          )}
                          {proc.estado === 'Completado' && (
                            <Button 
                              variant="ghost" 
                              onClick={() => handleStart(proc)}
                              className="w-full md:w-auto text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Protocolo
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Info / Patient Status */}
        <div className="space-y-6">
          {/* Next Patient Card */}
          <Card className="border-l-4 border-l-indigo-500 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Próximo Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {procedures.find(p => p.estado === 'Programado') ? (
                (() => {
                  const nextProc = procedures.find(p => p.estado === 'Programado');
                  return (
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{nextProc.paciente?.nombre}</h3>
                          <p className="text-sm text-slate-500">Historia: {nextProc.paciente?.numeroHistoria || '---'}</p>
                        </div>
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                          {nextProc.paciente?.nombre?.charAt(0)}
                        </div>
                      </div>
                      
                      <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Procedimiento:</span>
                          <span className="font-medium text-right">{nextProc.nombre}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Sala:</span>
                          <span className="font-medium">{nextProc.quirofano?.nombre}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Hora:</span>
                          <span className="font-medium text-indigo-600">
                            {new Date(nextProc.fechaProgramada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Estado Pre-operatorio</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Ayuno OK
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Consentimiento OK
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <p>No hay pacientes en espera inmediata.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts / Notifications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Avisos de Quirófano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md text-sm text-yellow-800">
                  <strong>Sala 2:</strong> Mantenimiento de lámpara programado para 14:00.
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-800">
                  <strong>Farmacia:</strong> Stock de Suturas Vicryl 2-0 repuesto.
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
