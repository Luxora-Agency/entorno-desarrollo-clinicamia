'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, CheckCircle, Users, Calendar, Clock, FileText } from 'lucide-react';
import { useSesionesCapacitacion } from '@/hooks/useSesionesCapacitacion';
import SesionForm from './SesionForm';
import SesionEjecucion from './SesionEjecucion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADO_BADGE = {
  PROGRAMADA: { label: 'Programada', variant: 'secondary', icon: Calendar },
  EN_CURSO: { label: 'En Curso', variant: 'warning', icon: Play },
  COMPLETADA: { label: 'Completada', variant: 'success', icon: CheckCircle },
  CANCELADA: { label: 'Cancelada', variant: 'destructive', icon: null },
};

export default function SesionesLista({ capacitacionId, sesiones: initialSesiones, onRefresh, user }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [showEjecucion, setShowEjecucion] = useState(false);

  const { createSesion, updateSesion, deleteSesion, iniciarSesion, finalizarSesion } = useSesionesCapacitacion();

  const sesiones = initialSesiones || [];

  const handleCreate = async (data) => {
    const result = await createSesion(capacitacionId, data);
    if (result) {
      setShowForm(false);
      onRefresh?.();
    }
  };

  const handleUpdate = async (data) => {
    if (!selectedSesion) return;
    const result = await updateSesion(selectedSesion.id, data);
    if (result) {
      setShowForm(false);
      setSelectedSesion(null);
      onRefresh?.();
    }
  };

  const handleIniciar = async (sesionId) => {
    await iniciarSesion(sesionId);
    onRefresh?.();
  };

  const handleFinalizar = async (sesionId) => {
    await finalizarSesion(sesionId);
    onRefresh?.();
    setShowEjecucion(false);
  };

  const handleOpenEjecucion = (sesion) => {
    setSelectedSesion(sesion);
    setShowEjecucion(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Sesiones Programadas</h3>
        <Button size="sm" onClick={() => { setSelectedSesion(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sesión
        </Button>
      </div>

      {sesiones.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No hay sesiones programadas</p>
            <p className="text-sm">Crea una sesión para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sesiones.map(sesion => {
            const estado = ESTADO_BADGE[sesion.estado] || ESTADO_BADGE.PROGRAMADA;
            const EstadoIcon = estado.icon;

            return (
              <Card key={sesion.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {format(new Date(sesion.fechaProgramada), 'd')}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {format(new Date(sesion.fechaProgramada), 'MMM yyyy', { locale: es })}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={estado.variant}>
                            {EstadoIcon && <EstadoIcon className="h-3 w-3 mr-1" />}
                            {estado.label}
                          </Badge>
                          {sesion.acta && (
                            <Badge variant="outline">
                              <FileText className="h-3 w-3 mr-1" />
                              Acta #{sesion.acta.numero}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {sesion.horaInicio && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {sesion.horaInicio} - {sesion.horaFin || '?'}
                            </span>
                          )}
                          {sesion.lugar && <span>{sesion.lugar}</span>}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {sesion.asistieron || 0}/{sesion.convocados || 0} asistentes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sesion.estado === 'PROGRAMADA' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setSelectedSesion(sesion); setShowForm(true); }}
                          >
                            Editar
                          </Button>
                          <Button size="sm" onClick={() => handleIniciar(sesion.id)}>
                            <Play className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                        </>
                      )}
                      {sesion.estado === 'EN_CURSO' && (
                        <Button size="sm" onClick={() => handleOpenEjecucion(sesion)}>
                          <Users className="h-4 w-4 mr-1" />
                          Gestionar
                        </Button>
                      )}
                      {sesion.estado === 'COMPLETADA' && sesion.acta && (
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          Ver Acta
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <SesionForm
          open={showForm}
          onClose={() => { setShowForm(false); setSelectedSesion(null); }}
          onSubmit={selectedSesion ? handleUpdate : handleCreate}
          sesion={selectedSesion}
        />
      )}

      {showEjecucion && selectedSesion && (
        <SesionEjecucion
          open={showEjecucion}
          onClose={() => { setShowEjecucion(false); setSelectedSesion(null); }}
          sesion={selectedSesion}
          onFinalizar={handleFinalizar}
          onRefresh={onRefresh}
          user={user}
        />
      )}
    </div>
  );
}
