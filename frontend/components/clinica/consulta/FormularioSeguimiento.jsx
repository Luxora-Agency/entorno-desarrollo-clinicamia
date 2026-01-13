'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar, Plus, CheckCircle, XCircle, Clock,
  CalendarPlus, AlertCircle, ClipboardList
} from 'lucide-react';
import TemplateSelector from '../templates/TemplateSelector';
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/services/api';

const TIPOS_SEGUIMIENTO = [
  { value: 'ControlPostConsulta', label: 'Control Post Consulta' },
  { value: 'RevisionExamenes', label: 'Revisión de Exámenes' },
  { value: 'ControlTratamiento', label: 'Control de Tratamiento' },
  { value: 'ControlCronico', label: 'Control de Enfermedad Crónica' },
  { value: 'SeguimientoProcedimiento', label: 'Seguimiento Post Procedimiento' },
  { value: 'ControlPreventivo', label: 'Control Preventivo' },
];

const PRIORIDADES = [
  { value: 'Baja', label: 'Baja', color: 'gray' },
  { value: 'Normal', label: 'Normal', color: 'blue' },
  { value: 'Alta', label: 'Alta', color: 'orange' },
  { value: 'Urgente', label: 'Urgente', color: 'red' },
];

const DIAS_SUGERIDOS = [7, 15, 30, 60, 90];

export default function FormularioSeguimiento({
  pacienteId,
  doctorId,
  citaId,
  diagnostico,
  initialItems = [], // Items persistidos desde el padre
  onSuccess
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [seguimientos, setSeguimientos] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [crearCitaDirecta, setCrearCitaDirecta] = useState(false);

  const [formData, setFormData] = useState({
    tipoSeguimiento: 'ControlPostConsulta',
    diasParaControl: 15,
    motivo: '',
    instrucciones: '',
    prioridad: 'Normal',
  });

  // Calcular fecha sugerida
  const fechaSugerida = useMemo(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + parseInt(formData.diasParaControl));
    return fecha;
  }, [formData.diasParaControl]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.motivo) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe especificar el motivo del seguimiento.'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pacienteId,
        doctorId,
        citaOrigenId: citaId,
        tipoSeguimiento: formData.tipoSeguimiento,
        diasParaControl: parseInt(formData.diasParaControl),
        motivo: formData.motivo,
        instrucciones: formData.instrucciones,
        prioridad: formData.prioridad,
      };

      const result = await apiPost('/seguimientos', payload);

      setSeguimientos(prev => [...prev, result.data]);
      setShowForm(false);
      setFormData({
        tipoSeguimiento: 'ControlPostConsulta',
        diasParaControl: 15,
        motivo: '',
        instrucciones: '',
        prioridad: 'Normal',
      });

      toast({
        title: 'Seguimiento programado',
        description: `Control programado para ${fechaSugerida.toLocaleDateString('es-CO')}.`
      });

      // TODO: Si crearCitaDirecta es true, redirigir a crear cita
      if (crearCitaDirecta) {
        toast({
          title: 'Crear cita',
          description: 'Funcionalidad de crear cita directa en desarrollo.'
        });
      }

      if (onSuccess) onSuccess(result.data);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear el seguimiento.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPrioridadColor = (prioridad) => {
    const p = PRIORIDADES.find(pr => pr.value === prioridad);
    return p?.color || 'gray';
  };

  // Función para agendar cita desde un seguimiento
  const handleAgendarCita = (seguimiento) => {
    // Calcular la fecha sugerida del seguimiento
    const fechaCita = seguimiento.fechaSugerida
      ? new Date(seguimiento.fechaSugerida).toISOString().split('T')[0]
      : new Date(Date.now() + seguimiento.diasParaControl * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Construir el motivo con el tipo de seguimiento
    const tipoLabel = TIPOS_SEGUIMIENTO.find(t => t.value === seguimiento.tipoSeguimiento)?.label || seguimiento.tipoSeguimiento;
    const motivo = `${tipoLabel}: ${seguimiento.motivo}`;

    // Crear URL con parámetros para pre-llenar el formulario de citas
    const params = new URLSearchParams({
      pacienteId: pacienteId,
      doctorId: doctorId,
      fecha: fechaCita,
      motivo: motivo,
      seguimientoId: seguimiento.id || '',
      prioridad: seguimiento.prioridad
    });

    // Navegar al módulo de citas con los datos pre-llenados
    // Usamos window.open para abrir en nueva pestaña o window.location para misma pestaña
    const citaUrl = `/citas?action=nueva&${params.toString()}`;

    // Notificar al usuario
    toast({
      title: 'Redirigiendo a Citas',
      description: 'Se abrirá el módulo de citas con los datos del seguimiento pre-llenados.'
    });

    // Abrir en nueva pestaña para no perder el contexto de la consulta
    window.open(citaUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Lista de seguimientos programados */}
      {seguimientos.length > 0 && (
        <div className="space-y-2">
          {seguimientos.map((seg, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-purple-900">
                      {TIPOS_SEGUIMIENTO.find(t => t.value === seg.tipoSeguimiento)?.label || seg.tipoSeguimiento}
                    </p>
                    <Badge
                      variant="outline"
                      className={`bg-${getPrioridadColor(seg.prioridad)}-100 text-${getPrioridadColor(seg.prioridad)}-700 border-${getPrioridadColor(seg.prioridad)}-300`}
                    >
                      {seg.prioridad}
                    </Badge>
                  </div>
                  <p className="text-sm text-purple-700">
                    <Clock className="h-3 w-3 inline mr-1" />
                    En {seg.diasParaControl} días - {new Date(seg.fechaSugerida).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAgendarCita(seg)}
              >
                <CalendarPlus className="h-4 w-4 mr-1" />
                Agendar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar nuevo */}
      {!showForm && (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Programar Seguimiento / Control
        </Button>
      )}

      {/* Formulario de seguimiento */}
      {showForm && (
        <Card className="border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <ClipboardList className="h-5 w-5" />
              Nuevo Seguimiento / Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Tipo de seguimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Seguimiento</Label>
                <Select
                  value={formData.tipoSeguimiento}
                  onValueChange={(v) => handleChange('tipoSeguimiento', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SEGUIMIENTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(v) => handleChange('prioridad', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-${p.color}-500`} />
                          {p.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Días para control */}
            <div className="space-y-2">
              <Label>Días para el Control</Label>
              <div className="flex gap-2 flex-wrap">
                {DIAS_SUGERIDOS.map((dias) => (
                  <Button
                    key={dias}
                    type="button"
                    variant={formData.diasParaControl === dias ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange('diasParaControl', dias)}
                    className={formData.diasParaControl === dias ? 'bg-purple-600' : ''}
                  >
                    {dias} días
                  </Button>
                ))}
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={formData.diasParaControl}
                  onChange={(e) => handleChange('diasParaControl', e.target.value)}
                  className="w-24"
                />
              </div>
            </div>

            {/* Fecha sugerida calculada */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-700">Fecha sugerida de control:</p>
                <p className="font-semibold text-purple-900">
                  {fechaSugerida.toLocaleDateString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Motivo del seguimiento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Motivo del Seguimiento <span className="text-red-500">*</span></Label>
                <TemplateSelector 
                  category="PLAN" 
                  onSelect={(text) => handleChange('motivo', formData.motivo + (formData.motivo ? '\n' : '') + text)} 
                />
              </div>
              <Textarea
                value={formData.motivo}
                onChange={(e) => handleChange('motivo', e.target.value)}
                placeholder="Describe el motivo del control o seguimiento..."
                rows={2}
              />
            </div>

            {/* Instrucciones para el paciente */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Instrucciones para el Paciente</Label>
                <TemplateSelector 
                  category="PLAN" 
                  onSelect={(text) => handleChange('instrucciones', formData.instrucciones + (formData.instrucciones ? '\n' : '') + text)} 
                />
              </div>
              <Textarea
                value={formData.instrucciones}
                onChange={(e) => handleChange('instrucciones', e.target.value)}
                placeholder="Instrucciones específicas que el paciente debe seguir antes del control..."
                rows={3}
              />
            </div>

            {/* Opción de crear cita directamente */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="crearCitaDirecta"
                checked={crearCitaDirecta}
                onCheckedChange={setCrearCitaDirecta}
              />
              <Label htmlFor="crearCitaDirecta" className="cursor-pointer text-blue-800">
                <CalendarPlus className="h-4 w-4 inline mr-1" />
                Crear cita de control automáticamente después de guardar
              </Label>
            </div>

            {/* Alerta informativa */}
            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 text-gray-400" />
              <p>
                El seguimiento quedará registrado en el historial del paciente.
                Se puede agendar la cita de control más adelante desde el módulo de citas.
              </p>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Guardando...' : 'Programar Seguimiento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
