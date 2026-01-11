'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Users, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Formulario para registrar asistencia a reuniones de comité
 * Permite marcar asistentes y justificar ausencias
 */
export default function AsistentesActaForm({ open, onClose, acta, comite, onSubmit }) {
  const [asistentes, setAsistentes] = useState([]);
  const [quorum, setQuorum] = useState(false);

  useEffect(() => {
    if (open && comite && acta) {
      // Inicializar lista de asistencia con miembros del comité
      const miembrosComite = comite.miembros || [];
      const asistentesActa = acta.asistentes || [];

      const listaAsistencia = miembrosComite.map((miembro) => {
        const asistente = asistentesActa.find((a) => a.usuarioId === miembro.usuarioId);
        return {
          usuarioId: miembro.usuarioId,
          nombre: miembro.usuario?.nombre || 'Usuario',
          email: miembro.usuario?.email || '',
          cargo: miembro.cargo,
          asistio: asistente ? asistente.asistio : true,
          justificacion: asistente ? asistente.justificacion || '' : '',
        };
      });

      setAsistentes(listaAsistencia);

      // Calcular quórum (más del 50% presente)
      const presentes = listaAsistencia.filter((a) => a.asistio).length;
      const total = listaAsistencia.length;
      setQuorum(presentes > total / 2);
    }
  }, [open, comite, acta]);

  const handleToggleAsistencia = (usuarioId) => {
    setAsistentes((prev) =>
      prev.map((a) => {
        if (a.usuarioId === usuarioId) {
          return { ...a, asistio: !a.asistio, justificacion: !a.asistio ? '' : a.justificacion };
        }
        return a;
      })
    );
  };

  const handleJustificacionChange = (usuarioId, justificacion) => {
    setAsistentes((prev) =>
      prev.map((a) => {
        if (a.usuarioId === usuarioId) {
          return { ...a, justificacion };
        }
        return a;
      })
    );
  };

  useEffect(() => {
    // Recalcular quórum cuando cambia la asistencia
    const presentes = asistentes.filter((a) => a.asistio).length;
    const total = asistentes.length;
    setQuorum(presentes > total / 2);
  }, [asistentes]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar que las ausencias tengan justificación
    const ausentesSinJustificacion = asistentes.filter(
      (a) => !a.asistio && (!a.justificacion || a.justificacion.trim() === '')
    );

    if (ausentesSinJustificacion.length > 0) {
      toast.error('Las ausencias deben tener justificación');
      return;
    }

    const data = {
      actaId: acta.id,
      quorum,
      asistentes: asistentes.map((a) => ({
        usuarioId: a.usuarioId,
        asistio: a.asistio,
        justificacion: a.justificacion || null,
      })),
    };

    onSubmit(data);
  };

  const presentes = asistentes.filter((a) => a.asistio).length;
  const ausentes = asistentes.length - presentes;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Registro de Asistencia
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {acta?.numeroActa || 'Acta'} - {comite?.nombre || 'Comité'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Estadísticas de Asistencia */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-slate-50">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                <div className="text-2xl font-bold">{asistentes.length}</div>
                <p className="text-xs text-muted-foreground">Total Miembros</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{presentes}</div>
                <p className="text-xs text-muted-foreground">Presentes</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardContent className="p-4 text-center">
                <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold text-red-600">{ausentes}</div>
                <p className="text-xs text-muted-foreground">Ausentes</p>
              </CardContent>
            </Card>
          </div>

          {/* Quórum */}
          <Card className={quorum ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{quorum ? '✓ Hay quórum' : '⚠ No hay quórum'}</p>
                  <p className="text-sm text-muted-foreground">
                    Se requiere más del 50% de miembros presentes
                  </p>
                </div>
                <Badge variant={quorum ? 'success' : 'warning'} className="text-lg px-4">
                  {((presentes / asistentes.length) * 100).toFixed(0)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Asistencia */}
          <div className="space-y-4">
            <h3 className="font-medium">Lista de Asistencia</h3>

            {asistentes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay miembros en el comité</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {asistentes.map((asistente) => (
                  <Card key={asistente.usuarioId} className={!asistente.asistio ? 'bg-red-50' : ''}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={asistente.asistio}
                              onCheckedChange={() => handleToggleAsistencia(asistente.usuarioId)}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{asistente.nombre}</p>
                                <Badge variant={asistente.asistio ? 'success' : 'destructive'} className="text-xs">
                                  {asistente.cargo}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{asistente.email}</p>
                            </div>
                          </div>

                          <Badge variant={asistente.asistio ? 'default' : 'outline'}>
                            {asistente.asistio ? 'Presente' : 'Ausente'}
                          </Badge>
                        </div>

                        {!asistente.asistio && (
                          <div className="pl-8 space-y-2">
                            <Label htmlFor={`justificacion-${asistente.usuarioId}`} className="text-xs">
                              Justificación de Ausencia <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`justificacion-${asistente.usuarioId}`}
                              value={asistente.justificacion}
                              onChange={(e) =>
                                handleJustificacionChange(asistente.usuarioId, e.target.value)
                              }
                              placeholder="Motivo de la ausencia..."
                              required={!asistente.asistio}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Asistencia</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
