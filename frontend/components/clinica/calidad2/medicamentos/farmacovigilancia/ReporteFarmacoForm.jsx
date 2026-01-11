'use client';

import { useState, useEffect } from 'react';
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
import { useCalidad2Farmacovigilancia } from '@/hooks/useCalidad2Farmacovigilancia';

const TIPOS_REPORTE = [
  'Sospecha de Reacción Adversa',
  'Falta de Eficacia',
  'Uso Off-Label',
  'Error de Medicación',
  'Problema de Calidad',
  'Otro',
];

const GRAVEDADES = ['Leve', 'Moderada', 'Grave', 'Mortal'];

const CAUSALIDADES = [
  'POSIBLE',
  'PROBABLE',
  'DEFINITIVA',
  'NO_RELACIONADA',
];

const DESENLACES = [
  'Recuperado',
  'En Recuperación',
  'No Recuperado',
  'Recuperado con Secuelas',
  'Muerte',
  'Desconocido',
];

export default function ReporteFarmacoForm({ reporte, onClose }) {
  const { createReporte, updateReporte } = useCalidad2Farmacovigilancia();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pacienteId: '',
    tipoReporte: 'Sospecha de Reacción Adversa',
    medicamento: '',
    lote: '',
    fechaVencimiento: '',
    laboratorio: '',
    indicacion: '',
    fechaEvento: '',
    descripcionReaccion: '',
    gravedadReaccion: 'Leve',
    causalidad: 'POSIBLE',
    desenlace: '',
    accionesTomadas: '',
    observaciones: '',
  });

  useEffect(() => {
    if (reporte) {
      setFormData({
        pacienteId: reporte.pacienteId || '',
        tipoReporte: reporte.tipoReporte || 'Sospecha de Reacción Adversa',
        medicamento: reporte.medicamento || '',
        lote: reporte.lote || '',
        fechaVencimiento: reporte.fechaVencimiento ? new Date(reporte.fechaVencimiento).toISOString().split('T')[0] : '',
        laboratorio: reporte.laboratorio || '',
        indicacion: reporte.indicacion || '',
        fechaEvento: reporte.fechaEvento ? new Date(reporte.fechaEvento).toISOString().split('T')[0] : '',
        descripcionReaccion: reporte.descripcionReaccion || '',
        gravedadReaccion: reporte.gravedadReaccion || 'Leve',
        causalidad: reporte.causalidad || 'POSIBLE',
        desenlace: reporte.desenlace || '',
        accionesTomadas: reporte.accionesTomadas || '',
        observaciones: reporte.observaciones || '',
      });
    }
  }, [reporte]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        fechaVencimiento: formData.fechaVencimiento || null,
      };

      if (reporte) {
        await updateReporte(reporte.id, submitData);
      } else {
        await createReporte(submitData);
      }

      onClose(true); // Close and refresh
    } catch (error) {
      console.error('Error submitting reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Selection */}
      <div>
        <Label htmlFor="pacienteId">
          ID del Paciente <span className="text-red-500">*</span>
        </Label>
        <Input
          id="pacienteId"
          value={formData.pacienteId}
          onChange={(e) => handleChange('pacienteId', e.target.value)}
          placeholder="ID del paciente afectado"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Ingrese el UUID del paciente
        </p>
      </div>

      {/* Tipo de Reporte */}
      <div>
        <Label htmlFor="tipoReporte">
          Tipo de Reporte <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.tipoReporte} onValueChange={(value) => handleChange('tipoReporte', value)} required>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_REPORTE.map(tipo => (
              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Medication Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="medicamento">
            Medicamento <span className="text-red-500">*</span>
          </Label>
          <Input
            id="medicamento"
            value={formData.medicamento}
            onChange={(e) => handleChange('medicamento', e.target.value)}
            placeholder="Nombre del medicamento"
            required
          />
        </div>

        <div>
          <Label htmlFor="laboratorio">Laboratorio</Label>
          <Input
            id="laboratorio"
            value={formData.laboratorio}
            onChange={(e) => handleChange('laboratorio', e.target.value)}
            placeholder="Nombre del laboratorio"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lote">Lote</Label>
          <Input
            id="lote"
            value={formData.lote}
            onChange={(e) => handleChange('lote', e.target.value)}
            placeholder="Número de lote"
          />
        </div>

        <div>
          <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
          <Input
            id="fechaVencimiento"
            type="date"
            value={formData.fechaVencimiento}
            onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
          />
        </div>
      </div>

      {/* Indicación */}
      <div>
        <Label htmlFor="indicacion">Indicación</Label>
        <Textarea
          id="indicacion"
          value={formData.indicacion}
          onChange={(e) => handleChange('indicacion', e.target.value)}
          placeholder="Para qué se prescribió el medicamento..."
          rows={2}
        />
      </div>

      {/* Event Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fechaEvento">
            Fecha del Evento <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fechaEvento"
            type="date"
            value={formData.fechaEvento}
            onChange={(e) => handleChange('fechaEvento', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="gravedadReaccion">
            Gravedad <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.gravedadReaccion} onValueChange={(value) => handleChange('gravedadReaccion', value)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRAVEDADES.map(gravedad => (
                <SelectItem key={gravedad} value={gravedad}>{gravedad}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Descripción de la Reacción */}
      <div>
        <Label htmlFor="descripcionReaccion">
          Descripción de la Reacción <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="descripcionReaccion"
          value={formData.descripcionReaccion}
          onChange={(e) => handleChange('descripcionReaccion', e.target.value)}
          placeholder="Describa la reacción adversa presentada..."
          rows={4}
          required
        />
      </div>

      {/* Causalidad y Desenlace */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="causalidad">
            Causalidad <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.causalidad} onValueChange={(value) => handleChange('causalidad', value)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAUSALIDADES.map(causalidad => (
                <SelectItem key={causalidad} value={causalidad}>
                  {causalidad.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="desenlace">Desenlace</Label>
          <Select value={formData.desenlace} onValueChange={(value) => handleChange('desenlace', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              {DESENLACES.map(desenlace => (
                <SelectItem key={desenlace} value={desenlace}>{desenlace}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Acciones Tomadas */}
      <div>
        <Label htmlFor="accionesTomadas">Acciones Tomadas</Label>
        <Textarea
          id="accionesTomadas"
          value={formData.accionesTomadas}
          onChange={(e) => handleChange('accionesTomadas', e.target.value)}
          placeholder="Describa las acciones tomadas..."
          rows={3}
        />
      </div>

      {/* Observaciones */}
      <div>
        <Label htmlFor="observaciones">Observaciones Adicionales</Label>
        <Textarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Cualquier observación adicional..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => onClose(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : reporte ? 'Actualizar Reporte' : 'Crear Reporte'}
        </Button>
      </div>
    </form>
  );
}
