'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Edit, Trash2, Plus, Play, Users, FileText, BookOpen, ClipboardList } from 'lucide-react';
import { useCapacitaciones } from '@/hooks/useCapacitaciones';
import { useSesionesCapacitacion } from '@/hooks/useSesionesCapacitacion';
import { useEvaluaciones } from '@/hooks/useEvaluaciones';
import SesionesLista from '../sesiones/SesionesLista';
import EvaluacionBuilder from '../evaluaciones/EvaluacionBuilder';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ESTADO_BADGE = {
  PROGRAMADA: { label: 'Programada', variant: 'secondary' },
  EN_CURSO: { label: 'En Curso', variant: 'warning' },
  COMPLETADA: { label: 'Completada', variant: 'success' },
  CANCELADA: { label: 'Cancelada', variant: 'destructive' },
};

export default function CapacitacionDetail({ open, onClose, capacitacion: initialCap, onEdit, onDelete, user }) {
  const [activeTab, setActiveTab] = useState('info');
  const { currentCapacitacion, getCapacitacion, loading } = useCapacitaciones();
  const { sesiones, loadSesiones } = useSesionesCapacitacion();
  const { evaluaciones, loadEvaluaciones } = useEvaluaciones();

  const capacitacion = currentCapacitacion || initialCap;

  useEffect(() => {
    if (initialCap?.id) {
      getCapacitacion(initialCap.id);
      loadSesiones(initialCap.id);
      loadEvaluaciones(initialCap.id);
    }
  }, [initialCap?.id, getCapacitacion, loadSesiones, loadEvaluaciones]);

  const estadoBadge = ESTADO_BADGE[capacitacion?.estado] || ESTADO_BADGE.PROGRAMADA;

  const getMesesProgramados = () => {
    if (!capacitacion) return [];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const campos = ['programadoEne', 'programadoFeb', 'programadoMar', 'programadoAbr', 'programadoMay', 'programadoJun', 'programadoJul', 'programadoAgo', 'programadoSep', 'programadoOct', 'programadoNov', 'programadoDic'];
    return campos.filter((c, i) => capacitacion[c]).map((c, i) => meses[campos.indexOf(c)]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{capacitacion?.tema}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {capacitacion?.categoria?.nombre} | {capacitacion?.anio}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
              <Button size="icon" variant="ghost" onClick={() => onEdit(capacitacion)}>
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar Capacitación</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará la capacitación y todas sus sesiones asociadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(capacitacion?.id)} className="bg-destructive">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Info
            </TabsTrigger>
            <TabsTrigger value="sesiones" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sesiones
            </TabsTrigger>
            <TabsTrigger value="evaluaciones" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Evaluaciones
            </TabsTrigger>
            <TabsTrigger value="materiales" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Materiales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{sesiones?.length || capacitacion?.sesionesCount || 0}</div>
                  <p className="text-xs text-muted-foreground">Sesiones</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{capacitacion?.participantes || 0}</div>
                  <p className="text-xs text-muted-foreground">Participantes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{evaluaciones?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Evaluaciones</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{capacitacion?.duracionMinutos || '-'}</div>
                  <p className="text-xs text-muted-foreground">Minutos</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Actividad:</span>
                    <p className="font-medium">{capacitacion?.actividad || 'No especificada'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Periodicidad:</span>
                    <p className="font-medium capitalize">{capacitacion?.periodicidad?.toLowerCase() || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Responsable:</span>
                    <p className="font-medium">
                      {capacitacion?.responsable
                        ? `${capacitacion.responsable.nombre} ${capacitacion.responsable.apellido}`
                        : 'No asignado'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Orientado a:</span>
                    <p className="font-medium">{capacitacion?.orientadoA || 'No especificado'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Meses programados:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getMesesProgramados().map(mes => (
                      <Badge key={mes} variant="outline">{mes}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sesiones" className="mt-4">
            <SesionesLista
              capacitacionId={capacitacion?.id}
              sesiones={sesiones}
              onRefresh={() => loadSesiones(capacitacion?.id)}
              user={user}
            />
          </TabsContent>

          <TabsContent value="evaluaciones" className="mt-4">
            <EvaluacionBuilder
              capacitacionId={capacitacion?.id}
              evaluaciones={evaluaciones}
              onRefresh={() => loadEvaluaciones(capacitacion?.id)}
            />
          </TabsContent>

          <TabsContent value="materiales" className="mt-4">
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {capacitacion?.carpetaMaterial ? (
                  <div>
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p>Carpeta: {capacitacion.carpetaMaterial.nombre}</p>
                    <p className="text-sm">{capacitacion.carpetaMaterial.documentos?.length || 0} documentos</p>
                  </div>
                ) : (
                  <div>
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p>No hay materiales asociados</p>
                    <p className="text-sm">Los materiales se vinculan automáticamente al crear la capacitación</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
