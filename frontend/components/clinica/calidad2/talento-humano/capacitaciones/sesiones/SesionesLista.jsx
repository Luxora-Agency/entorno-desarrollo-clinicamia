'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, CheckCircle, Users, Calendar, Clock, FileText, Link2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet } from '@/services/api';
import { useSesionesCapacitacion } from '@/hooks/useSesionesCapacitacion';
import SesionForm from './SesionForm';
import SesionEjecucion from './SesionEjecucion';
import ActaPreview from '../actas/ActaPreview';
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
  const [codigosSesion, setCodigosSesion] = useState({});
  const [showActaPreview, setShowActaPreview] = useState(false);
  const [selectedActaId, setSelectedActaId] = useState(null);

  const { createSesion, updateSesion, deleteSesion, iniciarSesion, finalizarSesion } = useSesionesCapacitacion();

  const sesiones = initialSesiones || [];

  // Cargar códigos para sesiones EN_CURSO
  useEffect(() => {
    const cargarCodigos = async () => {
      const sesionesEnCurso = sesiones.filter(s => s.estado === 'EN_CURSO');
      for (const sesion of sesionesEnCurso) {
        if (!codigosSesion[sesion.id]) {
          try {
            const response = await apiGet(`/calidad2/capacitaciones/sesiones/${sesion.id}/codigo`);
            if (response.success && response.data?.codigo) {
              setCodigosSesion(prev => ({ ...prev, [sesion.id]: response.data.codigo }));
            }
          } catch (err) {
            console.error('Error cargando código:', err);
          }
        }
      }
    };
    cargarCodigos();
  }, [sesiones]);

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

  const copiarAlPortapapeles = async (texto) => {
    // Método 1: Clipboard API moderna (funciona en HTTPS y localhost)
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(texto);
        return true;
      } catch (err) {
        console.log('Clipboard API falló:', err);
      }
    }

    // Método 2: Fallback con textarea (funciona en HTTP y navegadores antiguos)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = texto;

      // Estilos para ocultar el elemento pero mantenerlo accesible
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.style.zIndex = '-1';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      // Para iOS
      textArea.setSelectionRange(0, texto.length);

      let success = false;
      try {
        success = document.execCommand('copy');
      } catch (err) {
        console.log('execCommand falló:', err);
      }

      document.body.removeChild(textArea);
      return success;
    } catch (err) {
      console.error('Error al copiar (fallback):', err);
      return false;
    }
  };

  const copiarCodigoSesion = async (sesionId) => {
    try {
      // Usar código en caché o cargarlo
      let codigo = codigosSesion[sesionId];
      if (!codigo) {
        const response = await apiGet(`/calidad2/capacitaciones/sesiones/${sesionId}/codigo`);
        if (response.success && response.data?.codigo) {
          codigo = response.data.codigo;
          setCodigosSesion(prev => ({ ...prev, [sesionId]: codigo }));
        }
      }

      if (codigo) {
        const link = `${window.location.origin}/evaluacion`;
        const texto = `Código: ${codigo}\nLink: ${link}`;
        const success = await copiarAlPortapapeles(texto);
        if (success) {
          toast.success(`Copiado al portapapeles`, {
            description: `Código: ${codigo} | Link: ${link}`
          });
        } else {
          // Si no se pudo copiar, mostrar el código para copia manual
          toast.info(`Código: ${codigo}`, {
            description: `Copia manual: ${link}`,
            duration: 10000 // Más tiempo para copiar manualmente
          });
        }
      } else {
        toast.error('No se pudo obtener el código');
      }
    } catch (error) {
      console.error('Error:', error);
      // Aún así mostrar el código en caché si existe
      const codigo = codigosSesion[sesionId];
      if (codigo) {
        toast.info(`Código: ${codigo}`, {
          description: 'Error al copiar, copia manualmente',
          duration: 10000
        });
      } else {
        toast.error('Error al obtener el código');
      }
    }
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
                        <div className="flex items-center gap-2">
                          {/* Código visible */}
                          <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1.5 rounded-lg border border-purple-200">
                            <span className="text-xs text-muted-foreground">Código:</span>
                            <button
                              onClick={async () => {
                                const codigo = codigosSesion[sesion.id];
                                if (codigo) {
                                  const success = await copiarAlPortapapeles(codigo);
                                  if (success) {
                                    toast.success(`Código copiado: ${codigo}`);
                                  } else {
                                    // Mostrar el código para que el usuario pueda copiarlo manualmente
                                    toast.info(`Código: ${codigo}`, {
                                      description: 'Selecciona y copia manualmente',
                                      duration: 8000
                                    });
                                  }
                                } else {
                                  toast.error('Código no disponible');
                                }
                              }}
                              className="font-mono font-bold text-lg text-purple-700 hover:text-purple-900 cursor-pointer hover:underline select-all"
                              title="Clic para copiar solo el código"
                            >
                              {codigosSesion[sesion.id] || '...'}
                            </button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 ml-1"
                              onClick={() => copiarCodigoSesion(sesion.id)}
                              title="Copiar código y link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button size="sm" onClick={() => handleOpenEjecucion(sesion)}>
                            <Users className="h-4 w-4 mr-1" />
                            Gestionar
                          </Button>
                        </div>
                      )}
                      {sesion.estado === 'COMPLETADA' && sesion.acta && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log('Ver Acta clicked, sesion.acta:', sesion.acta);
                            if (sesion.acta?.id) {
                              setSelectedActaId(sesion.acta.id);
                              setShowActaPreview(true);
                            } else {
                              toast.error('No se encontró el ID del acta');
                            }
                          }}
                        >
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

      {showActaPreview && selectedActaId && (
        <ActaPreview
          open={showActaPreview}
          onClose={() => { setShowActaPreview(false); setSelectedActaId(null); }}
          actaId={selectedActaId}
        />
      )}
    </div>
  );
}
