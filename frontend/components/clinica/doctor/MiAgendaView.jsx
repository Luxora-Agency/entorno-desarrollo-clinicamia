'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Save, Loader2, RefreshCw, CheckCircle,
  AlertCircle, Settings, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import DoctorScheduleManager from '../DoctorScheduleManager';
import BloqueoAgendaManager from './BloqueoAgendaManager';

export default function MiAgendaView({ user }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [horarios, setHorarios] = useState({});
  const [horariosModificados, setHorariosModificados] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [bloqueos, setBloqueos] = useState([]);
  const [activeTab, setActiveTab] = useState('horarios');
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Cargar bloqueos activos del doctor
  const cargarBloqueos = useCallback(async () => {
    if (!user?.id) return;

    try {
      const token = localStorage.getItem('token');
      // Usar el endpoint correcto: /bloqueos/doctor/:doctorId
      console.log('[MiAgendaView] Cargando bloqueos para doctor:', user.id);
      const response = await fetch(`${apiUrl}/bloqueos/doctor/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      console.log('[MiAgendaView] Bloqueos recibidos:', data.data?.length || 0);
      if (data.success) {
        // Filtrar solo bloqueos activos
        const bloqueosActivos = (data.data || []).filter(b => b.activo);
        console.log('[MiAgendaView] Bloqueos activos:', bloqueosActivos.length);
        setBloqueos(bloqueosActivos);
      }
    } catch (error) {
      console.error('Error loading bloqueos:', error);
    }
  }, [user?.id, apiUrl]);

  // Cargar perfil del doctor y horarios
  const cargarDatosDoctor = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Obtener perfil del doctor
      const response = await fetch(`${apiUrl}/doctores?usuarioId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success && data.data?.length > 0) {
        const doctor = data.data[0];
        setDoctorProfile(doctor);

        // Cargar horarios existentes
        if (doctor.horarios && Object.keys(doctor.horarios).length > 0) {
          setHorarios(doctor.horarios);
        }
      } else {
        toast({
          title: 'Error',
          description: 'No se encontró el perfil de doctor',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading doctor profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el perfil',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, apiUrl, toast]);

  useEffect(() => {
    cargarDatosDoctor();
    cargarBloqueos();
  }, [cargarDatosDoctor, cargarBloqueos]);

  // Manejar cambios en el schedule manager
  const handleHorariosChange = useCallback((nuevosHorarios) => {
    console.log('[MiAgendaView] Recibido cambio de horarios:', {
      keys: Object.keys(nuevosHorarios),
      total: JSON.stringify(nuevosHorarios)
    });
    setHorarios(nuevosHorarios);
    setHorariosModificados(true);
  }, []);

  // Guardar horarios en el backend
  const guardarHorarios = async () => {
    if (!doctorProfile?.id) return;

    console.log('[MiAgendaView] Guardando horarios en backend:', {
      doctorId: doctorProfile.id,
      horariosKeys: Object.keys(horarios),
      horarios: JSON.stringify(horarios)
    });

    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/doctores/mi-agenda/horarios`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ horarios })
      });

      const data = await response.json();
      console.log('[MiAgendaView] Respuesta del backend:', data);

      if (data.success) {
        // Actualizar horarios con la respuesta del backend para sincronizar
        if (data.data?.horarios) {
          console.log('[MiAgendaView] Sincronizando horarios desde respuesta:', Object.keys(data.data.horarios));
          setHorarios(data.data.horarios);
        }
        toast({
          title: 'Horarios guardados',
          description: 'Tu disponibilidad ha sido actualizada correctamente',
        });
        setHorariosModificados(false);
        setLastSaved(new Date());
      } else {
        throw new Error(data.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving horarios:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los horarios',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando agenda...</p>
        </div>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontró tu perfil de doctor. Por favor contacta al administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl shadow-lg shadow-cyan-200">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            Mi Agenda
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu disponibilidad y bloqueos de horario
          </p>
        </div>

        <div className="flex items-center gap-3">
          {horariosModificados && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              Cambios sin guardar
            </Badge>
          )}

          {lastSaved && (
            <Badge variant="outline" className="text-gray-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Guardado: {lastSaved.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          )}

          <Button
            variant="outline"
            onClick={cargarDatosDoctor}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>

          <Button
            onClick={guardarHorarios}
            disabled={saving || !horariosModificados}
            className={horariosModificados ? "bg-cyan-600 hover:bg-cyan-700" : "bg-gray-400"}
            title={!horariosModificados ? "Primero crea bloques en el calendario y haz clic en 'Guardar bloques'" : "Guardar cambios en el servidor"}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Horarios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info del Doctor */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-cyan-50 to-teal-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Settings className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                Dr(a). {user?.nombre} {user?.apellido}
              </p>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {doctorProfile.especialidades?.length > 0 && (
                  <span>{doctorProfile.especialidades.join(', ')}</span>
                )}
                {doctorProfile.registroMedico && (
                  <span className="text-gray-400">| RM: {doctorProfile.registroMedico}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Fechas configuradas</p>
              <p className="text-2xl font-bold text-cyan-600">
                {Object.keys(horarios).filter(k => horarios[k]?.length > 0).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Horarios y Bloqueos */}
      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          setActiveTab(tab);
          // Recargar bloqueos al volver a la pestaña de horarios para sincronizar
          if (tab === 'horarios') {
            cargarBloqueos();
            // Forzar re-render del calendario después de un breve delay para que el tab sea visible
            setTimeout(() => {
              setScheduleRefreshKey(prev => prev + 1);
            }, 100);
          }
        }}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="horarios" className="gap-2">
            <Clock className="h-4 w-4" />
            Horarios de Atención
          </TabsTrigger>
          <TabsTrigger value="bloqueos" className="gap-2">
            <Calendar className="h-4 w-4" />
            Bloqueos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="horarios" className="space-y-4" forceMount style={{ display: activeTab === 'horarios' ? 'block' : 'none' }}>
          {/* Instrucciones */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Instrucciones:</strong> Arrastra el mouse sobre el calendario para crear bloques de disponibilidad.
              Los bloques amarillos son pendientes de confirmar. Haz clic en "Agregar" y luego "Guardar Horarios" para confirmar.
            </AlertDescription>
          </Alert>

          {/* Schedule Manager */}
          <DoctorScheduleManager
            key={`schedule-${doctorProfile.id}-${scheduleRefreshKey}`}
            doctorId={doctorProfile.id}
            initialHorarios={horarios}
            onChange={handleHorariosChange}
            bloqueos={bloqueos}
          />

          {/* Resumen de Fechas Programadas */}
          {(() => {
            const fechasProgramadas = Object.entries(horarios)
              .filter(([key, bloques]) => key.includes('-') && Array.isArray(bloques) && bloques.length > 0)
              .sort(([a], [b]) => a.localeCompare(b));

            if (fechasProgramadas.length === 0) return null;

            return (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Fechas con Disponibilidad</CardTitle>
                  <CardDescription>Fechas donde tienes horarios configurados.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {fechasProgramadas.slice(0, 15).map(([fecha, bloques]) => (
                      <div key={fecha} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
                        <span className="font-medium text-blue-800">{fecha}</span>
                        <span className="text-blue-600 ml-1">
                          ({bloques.length} {bloques.length === 1 ? 'bloque' : 'bloques'})
                        </span>
                      </div>
                    ))}
                    {fechasProgramadas.length > 15 && (
                      <span className="text-xs text-gray-500 py-1">+{fechasProgramadas.length - 15} más</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        <TabsContent value="bloqueos" forceMount style={{ display: activeTab === 'bloqueos' ? 'block' : 'none' }}>
          {/* Instrucciones de Bloqueos */}
          <Alert className="bg-amber-50 border-amber-200 mb-4">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Bloqueos de Agenda:</strong> Aquí puedes bloquear fechas para vacaciones, congresos,
              permisos personales, etc. Los bloqueos impedirán que se agenden citas en esos horarios.
              Esta información se sincroniza automáticamente con la disponibilidad mostrada a pacientes.
            </AlertDescription>
          </Alert>

          {/* Bloqueo Manager */}
          <BloqueoAgendaManager
            doctorId={user?.id}
            doctorNombre={`${user?.nombre} ${user?.apellido}`}
            selfManaged={true}
            onBloqueosChange={async () => {
              await cargarBloqueos();
              // Forzar re-render del calendario para mostrar nuevos bloqueos
              setScheduleRefreshKey(prev => prev + 1);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
