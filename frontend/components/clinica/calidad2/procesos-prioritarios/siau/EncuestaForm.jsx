'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star } from 'lucide-react';
import { useCalidad2Encuestas } from '@/hooks/useCalidad2Encuestas';

export default function EncuestaForm({ encuesta, open, onClose, onSuccess }) {
  const { createEncuesta, updateEncuesta } = useCalidad2Encuestas();
  const isEditing = Boolean(encuesta?.id);

  const [formData, setFormData] = useState({
    nombrePaciente: '',
    servicioAtendido: '',
    tipoEncuesta: 'SATISFACCION',
    canal: '',
    // Dimensiones de evaluación (1-5)
    accesibilidad: 0,
    oportunidad: 0,
    seguridadPaciente: 0,
    experienciaAtencion: 0,
    satisfaccionGeneral: 0,
    // Preguntas abiertas
    aspectosPositivos: '',
    aspectosMejorar: '',
    sugerencias: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (encuesta) {
      setFormData({
        nombrePaciente: encuesta.nombrePaciente || '',
        servicioAtendido: encuesta.servicioAtendido || '',
        tipoEncuesta: encuesta.tipoEncuesta || 'SATISFACCION',
        canal: encuesta.canal || '',
        accesibilidad: encuesta.accesibilidad || 0,
        oportunidad: encuesta.oportunidad || 0,
        seguridadPaciente: encuesta.seguridadPaciente || 0,
        experienciaAtencion: encuesta.experienciaAtencion || 0,
        satisfaccionGeneral: encuesta.satisfaccionGeneral || 0,
        aspectosPositivos: encuesta.aspectosPositivos || '',
        aspectosMejorar: encuesta.aspectosMejorar || '',
        sugerencias: encuesta.sugerencias || '',
      });
    }
  }, [encuesta]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      if (isEditing) {
        await updateEncuesta(encuesta.id, formData);
      } else {
        await createEncuesta(formData);
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error guardando encuesta:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const RatingInput = ({ label, field, value }) => {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleChange(field, rating)}
              className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  rating <= value
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-200'
                }`}
              />
            </button>
          ))}
          {value > 0 && (
            <span className="ml-2 text-sm text-muted-foreground self-center">
              {value} de 5
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Encuesta' : 'Nueva Encuesta de Satisfacción'}</DialogTitle>
          <DialogDescription>
            Registra la evaluación de satisfacción del usuario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Información General</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombrePaciente">Nombre del Paciente (opcional)</Label>
                <Input
                  id="nombrePaciente"
                  value={formData.nombrePaciente}
                  onChange={(e) => handleChange('nombrePaciente', e.target.value)}
                  placeholder="Nombre del paciente"
                />
                <p className="text-xs text-muted-foreground">
                  Las encuestas pueden ser anónimas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="servicioAtendido">
                  Servicio Atendido <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.servicioAtendido} onValueChange={(value) => handleChange('servicioAtendido', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSULTA_EXTERNA">Consulta Externa</SelectItem>
                    <SelectItem value="URGENCIAS">Urgencias</SelectItem>
                    <SelectItem value="HOSPITALIZACION">Hospitalización</SelectItem>
                    <SelectItem value="CIRUGIA">Cirugía</SelectItem>
                    <SelectItem value="LABORATORIO">Laboratorio</SelectItem>
                    <SelectItem value="IMAGENOLOGIA">Imagenología</SelectItem>
                    <SelectItem value="FARMACIA">Farmacia</SelectItem>
                    <SelectItem value="ADMISIONES">Admisiones</SelectItem>
                    <SelectItem value="FACTURACION">Facturación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoEncuesta">Tipo de Encuesta</Label>
                <Select value={formData.tipoEncuesta} onValueChange={(value) => handleChange('tipoEncuesta', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SATISFACCION">Satisfacción General</SelectItem>
                    <SelectItem value="SALIDA">Encuesta de Salida</SelectItem>
                    <SelectItem value="AMBULATORIO">Atención Ambulatoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canal">Canal</Label>
                <Select value={formData.canal} onValueChange={(value) => handleChange('canal', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                    <SelectItem value="VIRTUAL">Virtual</SelectItem>
                    <SelectItem value="TELEFONICA">Telefónica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dimensiones de Evaluación */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Dimensiones de Evaluación</h3>
            <p className="text-sm text-muted-foreground">
              Califica cada dimensión del 1 al 5 (1 = Muy insatisfecho, 5 = Muy satisfecho)
            </p>

            <div className="space-y-4 bg-muted p-4 rounded-lg">
              <RatingInput
                label="1. Accesibilidad"
                field="accesibilidad"
                value={formData.accesibilidad}
              />
              <RatingInput
                label="2. Oportunidad"
                field="oportunidad"
                value={formData.oportunidad}
              />
              <RatingInput
                label="3. Seguridad del Paciente"
                field="seguridadPaciente"
                value={formData.seguridadPaciente}
              />
              <RatingInput
                label="4. Experiencia de Atención"
                field="experienciaAtencion"
                value={formData.experienciaAtencion}
              />
              <RatingInput
                label="5. Satisfacción General"
                field="satisfaccionGeneral"
                value={formData.satisfaccionGeneral}
              />
            </div>
          </div>

          {/* Preguntas Abiertas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Comentarios y Sugerencias</h3>

            <div className="space-y-2">
              <Label htmlFor="aspectosPositivos">¿Qué aspectos destacarías positivamente?</Label>
              <Textarea
                id="aspectosPositivos"
                value={formData.aspectosPositivos}
                onChange={(e) => handleChange('aspectosPositivos', e.target.value)}
                placeholder="Describe los aspectos positivos de la atención..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspectosMejorar">¿Qué aspectos consideras que debemos mejorar?</Label>
              <Textarea
                id="aspectosMejorar"
                value={formData.aspectosMejorar}
                onChange={(e) => handleChange('aspectosMejorar', e.target.value)}
                placeholder="Describe los aspectos a mejorar..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sugerencias">Sugerencias adicionales</Label>
              <Textarea
                id="sugerencias"
                value={formData.sugerencias}
                onChange={(e) => handleChange('sugerencias', e.target.value)}
                placeholder="Comparte tus sugerencias..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Registrar Encuesta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
