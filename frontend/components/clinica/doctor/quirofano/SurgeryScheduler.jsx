'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import PatientSelect from '../../PatientSelect';
import { quirofanoService } from '@/services/quirofano.service';
import { procedimientoService } from '@/services/procedimiento.service';

const TIPOS_PROCEDIMIENTO = [
  { value: 'Menor', label: 'Cirugía Menor' },
  { value: 'Mayor', label: 'Cirugía Mayor' },
  { value: 'Ambulatorio', label: 'Ambulatorio' },
  { value: 'Urgente', label: 'Urgencia' },
];

export default function SurgeryScheduler({ open, onOpenChange, onSuccess, user }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [quirofanos, setQuirofanos] = useState([]);
  
  // Form State
  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    indicacion: '',
    tipo: 'Mayor',
    quirofanoId: '',
    fecha: '',
    hora: '',
    duracion: 120, // minutos
  });

  // Availability Check
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState(null); // { available: boolean, message: string }

  useEffect(() => {
    if (open) {
      loadQuirofanos();
      // Reset form
      setPatient(null);
      setFormData({
        nombre: '',
        descripcion: '',
        indicacion: '',
        tipo: 'Mayor',
        quirofanoId: '',
        fecha: new Date().toISOString().split('T')[0],
        hora: '08:00',
        duracion: 120,
      });
      setAvailability(null);
    }
  }, [open]);

  const loadQuirofanos = async () => {
    try {
      const res = await quirofanoService.getAll({ estado: 'Activo' });
      if (res.success) {
        // El API devuelve { quirofanos, total, limit, offset }
        setQuirofanos(res.data?.quirofanos || res.data || []);
      }
    } catch (error) {
      console.error('Error loading quirofanos:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los quirófanos' });
    }
  };

  const checkAvailability = async () => {
    if (!formData.quirofanoId || !formData.fecha || !formData.hora) return;

    setCheckingAvailability(true);
    setAvailability(null);

    try {
      const fechaInicio = new Date(`${formData.fecha}T${formData.hora}`);
      const res = await quirofanoService.checkAvailability(
        formData.quirofanoId,
        fechaInicio.toISOString(),
        parseInt(formData.duracion)
      );

      if (res.available) {
        setAvailability({ available: true, message: 'Horario disponible' });
      } else {
        setAvailability({ 
          available: false, 
          message: `Conflicto con procedimiento existente.`,
          conflict: res.conflict
        });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability({ available: false, message: 'Error verificando disponibilidad' });
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Auto check availability when relevant fields change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.quirofanoId && formData.fecha && formData.hora) {
        checkAvailability();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.quirofanoId, formData.fecha, formData.hora, formData.duracion]);

  const handleSubmit = async () => {
    if (!patient) {
      toast({ variant: 'destructive', title: 'Error', description: 'Seleccione un paciente' });
      return;
    }
    if (!availability?.available) {
      toast({ variant: 'destructive', title: 'Error', description: 'El horario no está disponible' });
      return;
    }

    setLoading(true);
    try {
      const fechaProgramada = new Date(`${formData.fecha}T${formData.hora}`);
      
      const payload = {
        pacienteId: patient.id,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        indicacion: formData.indicacion,
        tipo: formData.tipo,
        fechaProgramada: fechaProgramada.toISOString(),
        duracionEstimada: parseInt(formData.duracion),
        quirofanoId: formData.quirofanoId,
        // Backend infers doctor from token or we pass it if admin
      };

      const res = await procedimientoService.create(payload);
      
      if (res.success) {
        toast({ title: 'Éxito', description: 'Cirugía programada correctamente' });
        if (onSuccess) onSuccess(res.data);
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: res.error || 'Error al programar' });
      }
    } catch (error) {
      console.error('Error submitting surgery:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error inesperado' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Programar Nueva Cirugía</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Paciente */}
          <div className="space-y-2">
            <Label>Paciente</Label>
            <PatientSelect 
              onSelect={setPatient} 
              value={patient?.id}
            />
          </div>

          {/* Detalles del Procedimiento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nombre del Procedimiento</Label>
              <Input 
                placeholder="Ej: Apendicectomía Laparoscópica"
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={formData.tipo}
                onValueChange={val => setFormData({...formData, tipo: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PROCEDIMIENTO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duración Estimada (min)</Label>
              <Input 
                type="number"
                value={formData.duracion}
                onChange={e => setFormData({...formData, duracion: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Indicación Médica</Label>
            <Textarea 
              placeholder="Justificación del procedimiento..."
              value={formData.indicacion}
              onChange={e => setFormData({...formData, indicacion: e.target.value})}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción Técnica (Plan)</Label>
            <Textarea 
              placeholder="Breve descripción del abordaje planeado..."
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value})}
              rows={2}
            />
          </div>

          {/* Programación */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-4 border">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Asignación de Quirófano
            </h4>
            
            <div className="space-y-2">
              <Label>Quirófano</Label>
              <Select 
                value={formData.quirofanoId}
                onValueChange={val => setFormData({...formData, quirofanoId: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione sala..." />
                </SelectTrigger>
                <SelectContent>
                  {quirofanos.map(q => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.nombre} ({q.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input 
                  type="date"
                  value={formData.fecha}
                  onChange={e => setFormData({...formData, fecha: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Inicio</Label>
                <Input 
                  type="time"
                  value={formData.hora}
                  onChange={e => setFormData({...formData, hora: e.target.value})}
                />
              </div>
            </div>

            {/* Availability Feedback */}
            {checkingAvailability && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando disponibilidad...
              </div>
            )}

            {!checkingAvailability && availability && (
              <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                availability.available 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {availability.available ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {availability.message}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !availability?.available}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Programando...' : 'Confirmar Programación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
