'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, CheckCircle, ClipboardList, Play, Trash2, Copy, QrCode } from 'lucide-react';
import { useSesionesCapacitacion } from '@/hooks/useSesionesCapacitacion';
import { useCalidad2Personal } from '@/hooks/useCalidad2Personal';
import EvaluacionPlayer from '../evaluaciones/EvaluacionPlayer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { apiGet } from '@/services/api';
import { toast } from 'sonner';

export default function SesionEjecucion({ open, onClose, sesion, onFinalizar, onRefresh, user }) {
  const [activeTab, setActiveTab] = useState('asistencia');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [cargoNuevo, setCargoNuevo] = useState('');
  const [showPreTest, setShowPreTest] = useState(false);
  const [showPostTest, setShowPostTest] = useState(false);
  const [codigoSesion, setCodigoSesion] = useState('');

  const { asistentes, loadAsistentes, addAsistentes, updateAsistente, removeAsistente, marcarAsistenciaMasiva } = useSesionesCapacitacion();
  const { personal, loadPersonal } = useCalidad2Personal();

  useEffect(() => {
    if (sesion?.id) {
      loadAsistentes(sesion.id);
      loadPersonal({ estado: 'ACTIVO', limit: 100 });
      // Cargar código de sesión
      apiGet(`/calidad2/capacitaciones/sesiones/${sesion.id}/codigo`)
        .then(res => {
          if (res.success && res.data?.codigo) {
            setCodigoSesion(res.data.codigo);
          }
        })
        .catch(() => {});
    }
  }, [sesion?.id, loadAsistentes, loadPersonal]);

  const copiarCodigo = async () => {
    const link = `${window.location.origin}/evaluacion`;
    const texto = `Código: ${codigoSesion}\nLink: ${link}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(texto);
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = texto;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success(`Código copiado: ${codigoSesion}`, {
        description: `Link: ${link}`
      });
    } catch (err) {
      toast.info(`Código: ${codigoSesion}`, {
        description: `Link: ${link}`
      });
    }
  };

  const handleAddAsistente = async () => {
    if (!nombreNuevo.trim()) return;
    await addAsistentes(sesion.id, [{ nombreCompleto: nombreNuevo, cargo: cargoNuevo }]);
    setNombreNuevo('');
    setCargoNuevo('');
  };

  const handleToggleAsistencia = async (asistente) => {
    await updateAsistente(sesion.id, asistente.id, { asistio: !asistente.asistio });
  };

  const handleMarcarTodos = async (asistio) => {
    const ids = asistentes.map(a => a.id);
    await marcarAsistenciaMasiva(sesion.id, ids, asistio);
  };

  const asistieron = asistentes.filter(a => a.asistio).length;
  const porcentajeAsistencia = asistentes.length > 0 ? Math.round((asistieron / asistentes.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              Sesión en Curso
            </div>
            {codigoSesion && (
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-3">
                  <div className="text-xs opacity-80">Código:</div>
                  <div className="text-2xl font-bold font-mono tracking-wider">{codigoSesion}</div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={copiarCodigo}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="asistencia" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Asistencia
            </TabsTrigger>
            <TabsTrigger value="pretest" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Pre-Test
            </TabsTrigger>
            <TabsTrigger value="posttest" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Post-Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="asistencia" className="mt-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">{asistentes.length}</div>
                  <p className="text-xs text-muted-foreground">Convocados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{asistieron}</div>
                  <p className="text-xs text-muted-foreground">Asistieron</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">{porcentajeAsistencia}%</div>
                  <p className="text-xs text-muted-foreground">Asistencia</p>
                </CardContent>
              </Card>
            </div>

            {/* Add participant */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Agregar Participante</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input
                  placeholder="Nombre completo"
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Cargo"
                  value={cargoNuevo}
                  onChange={(e) => setCargoNuevo(e.target.value)}
                  className="w-40"
                />
                <Button onClick={handleAddAsistente} disabled={!nombreNuevo.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Bulk actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleMarcarTodos(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar Todos
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleMarcarTodos(false)}>
                Desmarcar Todos
              </Button>
            </div>

            {/* Attendees list */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {asistentes.map(asistente => (
                <div
                  key={asistente.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${asistente.asistio ? 'bg-green-50 border-green-200' : 'bg-muted/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={asistente.asistio}
                      onCheckedChange={() => handleToggleAsistencia(asistente)}
                    />
                    <div>
                      <p className="font-medium">{asistente.nombreCompleto}</p>
                      <p className="text-sm text-muted-foreground">{asistente.cargo || 'Sin cargo'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {asistente.asistio && (
                      <Badge variant="success" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Asistio
                      </Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeAsistente(sesion.id, asistente.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pretest" className="mt-4">
            {showPreTest ? (
              <EvaluacionPlayer
                sesionId={sesion.id}
                tipo="PRE_TEST"
                onClose={() => setShowPreTest(false)}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="mb-4">Ejecutar Pre-Test para los participantes</p>
                  <Button onClick={() => setShowPreTest(true)}>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Pre-Test
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="posttest" className="mt-4">
            {showPostTest ? (
              <EvaluacionPlayer
                sesionId={sesion.id}
                tipo="POST_TEST"
                onClose={() => setShowPostTest(false)}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="mb-4">Ejecutar Post-Test para los participantes</p>
                  <Button onClick={() => setShowPostTest(true)}>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Post-Test
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Sesión
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalizar Sesión</AlertDialogTitle>
                <AlertDialogDescription>
                  Al finalizar la sesión se generará automáticamente el acta de capacitación.
                  Asegúrate de haber marcado la asistencia y completado las evaluaciones.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onFinalizar(sesion.id)}>
                  Finalizar y Generar Acta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
