'use client';

/**
 * Componente para gestionar bloqueos de agenda de doctores
 *
 * Permite crear, ver y eliminar bloqueos como:
 * - Vacaciones
 * - Congresos/Capacitaciones
 * - Permisos personales
 * - Bloqueos parciales (horas específicas)
 * - Modo solo emergencias
 */
import { useState, useEffect, useCallback } from 'react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Clock,
  Palmtree,
  GraduationCap,
  User,
  AlertTriangle,
  Ban,
  Loader2,
} from 'lucide-react';
import useBloqueos, {
  TIPOS_BLOQUEO,
  LABELS_TIPO_BLOQUEO,
  COLORES_TIPO_BLOQUEO,
} from '@/hooks/useBloqueos';

// Iconos por tipo de bloqueo
const ICONOS_TIPO = {
  BLOQUEO: Ban,
  VACACIONES: Palmtree,
  CONGRESO: GraduationCap,
  PERSONAL: User,
  EMERGENCIA_SOLO: AlertTriangle,
};

export default function BloqueoAgendaManager({ doctorId, doctorNombre = 'Doctor', selfManaged = false, onBloqueosChange }) {
  // Si selfManaged, usa endpoints /mis-bloqueos (no requiere permiso 'agenda')
  const {
    bloqueos,
    loading,
    obtenerBloqueos,
    crearBloqueo,
    eliminarBloqueo,
  } = useBloqueos({ selfManaged });

  // Estado del modal de crear
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '',
    hora_fin: '',
    motivo: '',
    tipo: 'BLOQUEO',
    esDiaCompleto: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado del modal de confirmar eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bloqueoToDelete, setBloqueoToDelete] = useState(null);

  // Cargar bloqueos al montar
  useEffect(() => {
    if (doctorId) {
      // Cargar bloqueos de los próximos 365 días
      const hoy = new Date();
      const enUnAnio = addDays(hoy, 365);
      obtenerBloqueos(
        doctorId,
        format(hoy, 'yyyy-MM-dd'),
        format(enUnAnio, 'yyyy-MM-dd')
      );
    }
  }, [doctorId, obtenerBloqueos]);

  // Abrir modal de crear
  const handleOpenCreate = () => {
    const hoy = format(new Date(), 'yyyy-MM-dd');
    setFormData({
      fecha_inicio: hoy,
      fecha_fin: hoy,
      hora_inicio: '',
      hora_fin: '',
      motivo: '',
      tipo: 'BLOQUEO',
      esDiaCompleto: true,
    });
    setIsCreateModalOpen(true);
  };

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Crear bloqueo
  const handleSubmit = async () => {
    if (!formData.fecha_inicio || !formData.fecha_fin || !formData.motivo) {
      return;
    }

    if (!formData.esDiaCompleto && (!formData.hora_inicio || !formData.hora_fin)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await crearBloqueo({
        doctor_id: doctorId,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        hora_inicio: formData.esDiaCompleto ? null : formData.hora_inicio,
        hora_fin: formData.esDiaCompleto ? null : formData.hora_fin,
        motivo: formData.motivo,
        tipo: formData.tipo,
      });
      setIsCreateModalOpen(false);
      // Recargar bloqueos
      const hoy = new Date();
      const enUnAnio = addDays(hoy, 365);
      obtenerBloqueos(
        doctorId,
        format(hoy, 'yyyy-MM-dd'),
        format(enUnAnio, 'yyyy-MM-dd')
      );
      // Notificar al componente padre que los bloqueos cambiaron
      onBloqueosChange?.();
    } catch (err) {
      // Error ya manejado por el hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = (bloqueo) => {
    setBloqueoToDelete(bloqueo);
    setDeleteDialogOpen(true);
  };

  // Eliminar bloqueo
  const handleDelete = async () => {
    if (!bloqueoToDelete) return;

    try {
      await eliminarBloqueo(bloqueoToDelete.id);
      setDeleteDialogOpen(false);
      setBloqueoToDelete(null);
      // Notificar al componente padre que los bloqueos cambiaron
      onBloqueosChange?.();
    } catch (err) {
      // Error ya manejado por el hook
    }
  };

  // Formatear rango de fechas
  // IMPORTANTE: Las fechas vienen como UTC, hay que ajustar para mostrar correctamente
  const formatDateRange = (inicio, fin) => {
    // Extraer solo la parte de fecha (YYYY-MM-DD) para evitar problemas de timezone
    let fechaInicioStr = typeof inicio === 'string' ? inicio : inicio.toISOString();
    let fechaFinStr = typeof fin === 'string' ? fin : fin.toISOString();

    // Si tiene formato ISO completo, extraer solo YYYY-MM-DD
    if (fechaInicioStr.includes('T')) {
      fechaInicioStr = fechaInicioStr.split('T')[0];
    }
    if (fechaFinStr.includes('T')) {
      fechaFinStr = fechaFinStr.split('T')[0];
    }

    // Crear fechas locales (sin conversión UTC)
    const [yearI, monthI, dayI] = fechaInicioStr.split('-').map(Number);
    const [yearF, monthF, dayF] = fechaFinStr.split('-').map(Number);
    const fechaInicio = new Date(yearI, monthI - 1, dayI);
    const fechaFin = new Date(yearF, monthF - 1, dayF);

    const dias = differenceInDays(fechaFin, fechaInicio) + 1;

    if (dias === 1) {
      return format(fechaInicio, "d 'de' MMMM yyyy", { locale: es });
    }
    return `${format(fechaInicio, "d MMM", { locale: es })} - ${format(fechaFin, "d MMM yyyy", { locale: es })} (${dias} días)`;
  };

  // Agrupar bloqueos por estado (activos/pasados)
  const bloqueosFuturos = bloqueos.filter((b) => {
    // Extraer solo la parte de fecha para comparar correctamente
    let fechaFinStr = typeof b.fechaFin === 'string' ? b.fechaFin : b.fechaFin.toISOString();
    if (fechaFinStr.includes('T')) {
      fechaFinStr = fechaFinStr.split('T')[0];
    }
    const [year, month, day] = fechaFinStr.split('-').map(Number);
    const fechaFin = new Date(year, month - 1, day, 23, 59, 59); // Final del día
    return fechaFin >= new Date();
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Bloqueos de Agenda</CardTitle>
          <CardDescription>
            Gestiona vacaciones, permisos y bloqueos de horario
          </CardDescription>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Bloqueo
        </Button>
      </CardHeader>

      <CardContent>
        {loading && bloqueos.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : bloqueosFuturos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay bloqueos programados</p>
            <p className="text-sm mt-1">
              Crea un bloqueo para vacaciones, congresos o permisos personales
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bloqueosFuturos.map((bloqueo) => {
              const IconoTipo = ICONOS_TIPO[bloqueo.tipo] || Ban;
              const color = COLORES_TIPO_BLOQUEO[bloqueo.tipo] || '#6B7280';

              return (
                <div
                  key={bloqueo.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-full"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <IconoTipo
                        className="h-5 w-5"
                        style={{ color }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{bloqueo.motivo}</span>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: color,
                            color,
                          }}
                        >
                          {LABELS_TIPO_BLOQUEO[bloqueo.tipo]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateRange(bloqueo.fechaInicio, bloqueo.fechaFin)}
                        {bloqueo.horaInicio && bloqueo.horaFin && (
                          <span className="ml-2">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {bloqueo.horaInicio} - {bloqueo.horaFin}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleConfirmDelete(bloqueo)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modal de Crear Bloqueo */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Bloqueo de Agenda</DialogTitle>
            <DialogDescription>
              Bloquea horarios para {doctorNombre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tipo de bloqueo */}
            <div className="space-y-2">
              <Label>Tipo de Bloqueo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleFormChange('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LABELS_TIPO_BLOQUEO).map(([key, label]) => {
                    const Icono = ICONOS_TIPO[key];
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icono
                            className="h-4 w-4"
                            style={{ color: COLORES_TIPO_BLOQUEO[key] }}
                          />
                          {label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => handleFormChange('fecha_inicio', e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => handleFormChange('fecha_fin', e.target.value)}
                  min={formData.fecha_inicio || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>

            {/* Día completo o parcial */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Día Completo</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.esDiaCompleto
                    ? 'Bloqueo de todo el día'
                    : 'Solo algunas horas'}
                </p>
              </div>
              <Switch
                checked={formData.esDiaCompleto}
                onCheckedChange={(checked) =>
                  handleFormChange('esDiaCompleto', checked)
                }
              />
            </div>

            {/* Horas (si no es día completo) */}
            {!formData.esDiaCompleto && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora Inicio</Label>
                  <Input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) =>
                      handleFormChange('hora_inicio', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Fin</Label>
                  <Input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => handleFormChange('hora_fin', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Motivo */}
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                placeholder="Describe el motivo del bloqueo..."
                value={formData.motivo}
                onChange={(e) => handleFormChange('motivo', e.target.value)}
                rows={3}
              />
            </div>

            {/* Advertencia para tipo emergencia */}
            {formData.tipo === 'EMERGENCIA_SOLO' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>
                  Este tipo de bloqueo permite solo citas de emergencia durante
                  el periodo seleccionado. Las citas regulares no podrán
                  programarse.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !formData.fecha_inicio ||
                !formData.fecha_fin ||
                !formData.motivo ||
                (!formData.esDiaCompleto &&
                  (!formData.hora_inicio || !formData.hora_fin))
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Bloqueo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Bloqueo</AlertDialogTitle>
            <AlertDialogDescription>
              {bloqueoToDelete && (
                <>
                  ¿Estás seguro de eliminar el bloqueo &quot;{bloqueoToDelete.motivo}&quot;?
                  <br />
                  <span className="text-sm">
                    {formatDateRange(
                      bloqueoToDelete.fechaInicio,
                      bloqueoToDelete.fechaFin
                    )}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
