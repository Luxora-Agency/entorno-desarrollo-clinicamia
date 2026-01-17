'use client';

import { useState, useEffect } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import { useCalidad2AuditoriasHC } from '@/hooks/useCalidad2AuditoriasHC';
import { useAuth } from '@/hooks/useAuth';
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

const TIPOS_AUDITORIA = [
  { value: 'INTERNA', label: 'Auditoría Interna' },
  { value: 'EXTERNA', label: 'Auditoría Externa' },
  { value: 'CONCURRENTE', label: 'Auditoría Concurrente' },
  { value: 'RETROSPECTIVA', label: 'Auditoría Retrospectiva' },
];

export default function AuditoriaHCForm({ auditoria, onClose }) {
  const { user } = useAuth();
  const { createAuditoria, updateAuditoria } = useCalidad2AuditoriasHC();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'INTERNA',
    fechaAuditoria: '',
    auditor: user?.id || '',
    areaAuditada: '',
    historiasRevisadas: 0,
    tamanoPoblacion: '',
    criterioSeleccion: '',
    observaciones: '',
  });
  const [errors, setErrors] = useState({});

  // Cargar datos si es edición
  useEffect(() => {
    if (auditoria) {
      setFormData({
        tipo: auditoria.tipo || 'INTERNA',
        fechaAuditoria: auditoria.fechaAuditoria
          ? formatDateISO(new Date(auditoria.fechaAuditoria))
          : '',
        auditor: auditoria.auditor || user?.id || '',
        areaAuditada: auditoria.areaAuditada || '',
        historiasRevisadas: auditoria.historiasRevisadas || 0,
        tamanoPoblacion: auditoria.tamanoPoblacion || '',
        criterioSeleccion: auditoria.criterioSeleccion || '',
        observaciones: auditoria.observaciones || '',
      });
    } else {
      // Para nuevas auditorías, usar fecha actual
      setFormData(prev => ({
        ...prev,
        fechaAuditoria: getTodayColombia()
      }));
    }
  }, [auditoria, user]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.tipo) {
      newErrors.tipo = 'El tipo de auditoría es requerido';
    }

    if (!formData.fechaAuditoria) {
      newErrors.fechaAuditoria = 'La fecha de auditoría es requerida';
    }

    if (!formData.areaAuditada?.trim()) {
      newErrors.areaAuditada = 'El área auditada es requerida';
    }

    if (!formData.auditor) {
      newErrors.auditor = 'El auditor es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        historiasRevisadas: parseInt(formData.historiasRevisadas) || 0,
        tamanoPoblacion: formData.tamanoPoblacion ? parseInt(formData.tamanoPoblacion) : null,
      };

      const success = auditoria
        ? await updateAuditoria(auditoria.id, dataToSubmit)
        : await createAuditoria(dataToSubmit);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar auditoría:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Tipo de auditoría */}
        <div>
          <Label htmlFor="tipo">
            Tipo de Auditoría <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.tipo}
            onValueChange={(value) => handleChange('tipo', value)}
          >
            <SelectTrigger className={errors.tipo ? 'border-red-500' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_AUDITORIA.map(tipo => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tipo && <p className="text-sm text-red-500 mt-1">{errors.tipo}</p>}
        </div>

        {/* Fecha de auditoría */}
        <div>
          <Label htmlFor="fechaAuditoria">
            Fecha de Auditoría <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fechaAuditoria"
            type="date"
            value={formData.fechaAuditoria}
            onChange={(e) => handleChange('fechaAuditoria', e.target.value)}
            className={errors.fechaAuditoria ? 'border-red-500' : ''}
          />
          {errors.fechaAuditoria && (
            <p className="text-sm text-red-500 mt-1">{errors.fechaAuditoria}</p>
          )}
        </div>
      </div>

      {/* Área auditada */}
      <div>
        <Label htmlFor="areaAuditada">
          Área Auditada <span className="text-red-500">*</span>
        </Label>
        <Input
          id="areaAuditada"
          value={formData.areaAuditada}
          onChange={(e) => handleChange('areaAuditada', e.target.value)}
          placeholder="Ej: Urgencias - Historias Clínicas de Adultos"
          className={errors.areaAuditada ? 'border-red-500' : ''}
        />
        {errors.areaAuditada && (
          <p className="text-sm text-red-500 mt-1">{errors.areaAuditada}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Historias revisadas */}
        <div>
          <Label htmlFor="historiasRevisadas">Historias Clínicas Revisadas</Label>
          <Input
            id="historiasRevisadas"
            type="number"
            min="0"
            value={formData.historiasRevisadas}
            onChange={(e) => handleChange('historiasRevisadas', e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Tamaño de población */}
        <div>
          <Label htmlFor="tamanoPoblacion">Tamaño de Población (Total HC)</Label>
          <Input
            id="tamanoPoblacion"
            type="number"
            min="0"
            value={formData.tamanoPoblacion}
            onChange={(e) => handleChange('tamanoPoblacion', e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      {/* Criterio de selección */}
      <div>
        <Label htmlFor="criterioSeleccion">Criterio de Selección de la Muestra</Label>
        <Textarea
          id="criterioSeleccion"
          value={formData.criterioSeleccion}
          onChange={(e) => handleChange('criterioSeleccion', e.target.value)}
          placeholder="Describa cómo se seleccionó la muestra de historias clínicas a auditar..."
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          Ej: Muestreo aleatorio simple, selección sistemática, etc.
        </p>
      </div>

      {/* Observaciones */}
      <div>
        <Label htmlFor="observaciones">Observaciones Generales</Label>
        <Textarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Observaciones generales sobre la auditoría..."
          rows={4}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : auditoria ? 'Actualizar' : 'Crear Auditoría'}
        </Button>
      </div>
    </form>
  );
}
