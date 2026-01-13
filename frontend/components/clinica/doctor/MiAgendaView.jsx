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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  }, [cargarDatosDoctor]);

  // Manejar cambios en el schedule manager
  const handleHorariosChange = useCallback((nuevosHorarios) => {
    setHorarios(nuevosHorarios);
    setHorariosModificados(true);
  }, []);

  // Guardar horarios en el backend
  const guardarHorarios = async () => {
    if (!doctorProfile?.id) return;

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

      if (data.success) {
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
            className="bg-cyan-600 hover:bg-cyan-700"
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
              <p className="text-sm text-gray-500">Horarios configurados</p>
              <p className="text-2xl font-bold text-cyan-600">
                {Object.keys(horarios).length} días
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Horarios y Bloqueos */}
      <Tabs defaultValue="horarios" className="space-y-4">
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

        <TabsContent value="horarios" className="space-y-4">
          {/* Instrucciones */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Instrucciones:</strong> Arrastra el mouse sobre el calendario para crear bloques de disponibilidad.
              Puedes mover y redimensionar los bloques. Los horarios que configures aquí serán visibles para
              los pacientes y el personal administrativo al agendar citas.
            </AlertDescription>
          </Alert>

          {/* Schedule Manager */}
          <DoctorScheduleManager
            doctorId={doctorProfile.id}
            initialHorarios={horarios}
            onChange={handleHorariosChange}
          />

          {/* Resumen de Horarios */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumen de Horarios</CardTitle>
              <CardDescription>Vista rápida de tu disponibilidad semanal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia, index) => {
                  const bloquesDelDia = horarios[index] || [];
                  const tieneHorarios = bloquesDelDia.length > 0;

                  return (
                    <div
                      key={dia}
                      className={`p-3 rounded-lg text-center ${
                        tieneHorarios
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <p className={`text-sm font-medium ${
                        tieneHorarios ? 'text-emerald-700' : 'text-gray-500'
                      }`}>
                        {dia}
                      </p>
                      {tieneHorarios ? (
                        <div className="mt-1 space-y-0.5">
                          {bloquesDelDia.map((bloque, i) => (
                            <p key={i} className="text-xs text-emerald-600">
                              {bloque.inicio} - {bloque.fin}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">Sin horario</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bloqueos">
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
