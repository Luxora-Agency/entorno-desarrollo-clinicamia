'use client';

import { useState, useEffect } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
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
import { useCalidad2Tecnovigilancia } from '@/hooks/useCalidad2Tecnovigilancia';

const CLASIFICACIONES = [
  'INCIDENTE',
  'EVENTO_ADVERSO_SERIO',
  'EVENTO_ADVERSO_NO_SERIO',
  'CASI_EVENTO',
];

const TIPOS_EVENTO = [
  'LESION',
  'MUERTE',
  'FALLA_DISPOSITIVO',
  'USO_INADECUADO',
];

const GRAVEDADES = [
  'LEVE',
  'MODERADA',
  'GRAVE',
  'MORTAL',
];

const DESENLACES = [
  'Recuperado',
  'En Recuperación',
  'No Recuperado',
  'Recuperado con Secuelas',
  'Muerte',
  'Desconocido',
];

export default function ReporteTecnoForm({ reporte, onClose }) {
  const { createReporte, updateReporte } = useCalidad2Tecnovigilancia();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pacienteId: '',
    dispositivoMedico: '',
    fabricante: '',
    modelo: '',
    numeroSerie: '',
    lote: '',
    registroSanitario: '',
    clasificacion: 'INCIDENTE',
    tipoEvento: 'FALLA_DISPOSITIVO',
    fechaEvento: '',
    descripcionEvento: '',
    gravedadEvento: 'LEVE',
    desenlace: '',
    accionesTomadas: '',
    observaciones: '',
  });

  useEffect(() => {
    if (reporte) {
      setFormData({
        pacienteId: reporte.pacienteId || '',
        dispositivoMedico: reporte.dispositivoMedico || '',
        fabricante: reporte.fabricante || '',
        modelo: reporte.modelo || '',
        numeroSerie: reporte.numeroSerie || '',
        lote: reporte.lote || '',
        registroSanitario: reporte.registroSanitario || '',
        clasificacion: reporte.clasificacion || 'INCIDENTE',
        tipoEvento: reporte.tipoEvento || 'FALLA_DISPOSITIVO',
        fechaEvento: reporte.fechaEvento ? formatDateISO(new Date(reporte.fechaEvento)) : '',
        descripcionEvento: reporte.descripcionEvento || '',
        gravedadEvento: reporte.gravedadEvento || 'LEVE',
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
      if (reporte) {
        await updateReporte(reporte.id, formData);
      } else {
        await createReporte(formData);
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

      {/* Device Info */}
      <div>
        <Label htmlFor="dispositivoMedico">
          Dispositivo Médico <span className="text-red-500">*</span>
        </Label>
        <Input
          id="dispositivoMedico"
          value={formData.dispositivoMedico}
          onChange={(e) => handleChange('dispositivoMedico', e.target.value)}
          placeholder="Nombre del dispositivo médico"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fabricante">Fabricante</Label>
          <Input
            id="fabricante"
            value={formData.fabricante}
            onChange={(e) => handleChange('fabricante', e.target.value)}
            placeholder="Nombre del fabricante"
          />
        </div>

        <div>
          <Label htmlFor="modelo">Modelo</Label>
          <Input
            id="modelo"
            value={formData.modelo}
            onChange={(e) => handleChange('modelo', e.target.value)}
            placeholder="Modelo del dispositivo"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="numeroSerie">Número de Serie</Label>
          <Input
            id="numeroSerie"
            value={formData.numeroSerie}
            onChange={(e) => handleChange('numeroSerie', e.target.value)}
            placeholder="S/N"
          />
        </div>

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
          <Label htmlFor="registroSanitario">Registro Sanitario</Label>
          <Input
            id="registroSanitario"
            value={formData.registroSanitario}
            onChange={(e) => handleChange('registroSanitario', e.target.value)}
            placeholder="INVIMA"
          />
        </div>
      </div>

      {/* Event Classification */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clasificacion">
            Clasificación <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.clasificacion} onValueChange={(value) => handleChange('clasificacion', value)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLASIFICACIONES.map(clasificacion => (
                <SelectItem key={clasificacion} value={clasificacion}>
                  {clasificacion.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tipoEvento">
            Tipo de Evento <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.tipoEvento} onValueChange={(value) => handleChange('tipoEvento', value)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_EVENTO.map(tipo => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Event Details */}
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
          <Label htmlFor="gravedadEvento">
            Gravedad <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.gravedadEvento} onValueChange={(value) => handleChange('gravedadEvento', value)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRAVEDADES.map(gravedad => (
                <SelectItem key={gravedad} value={gravedad}>
                  {gravedad}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Event Description */}
      <div>
        <Label htmlFor="descripcionEvento">
          Descripción del Evento <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="descripcionEvento"
          value={formData.descripcionEvento}
          onChange={(e) => handleChange('descripcionEvento', e.target.value)}
          placeholder="Describa en detalle el evento adverso presentado..."
          rows={4}
          required
        />
      </div>

      {/* Desenlace */}
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

      {/* Acciones Tomadas */}
      <div>
        <Label htmlFor="accionesTomadas">Acciones Tomadas</Label>
        <Textarea
          id="accionesTomadas"
          value={formData.accionesTomadas}
          onChange={(e) => handleChange('accionesTomadas', e.target.value)}
          placeholder="Describa las acciones correctivas o preventivas tomadas..."
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
          placeholder="Cualquier observación adicional relevante..."
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
