'use client';

import { useState, useEffect } from 'react';
import { useCalidad2AuditoriasHC } from '@/hooks/useCalidad2AuditoriasHC';
import { apiGet } from '@/services/api';
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

const TIPOS_HALLAZGO = [
  { value: 'FORTALEZA', label: 'Fortaleza' },
  { value: 'OPORTUNIDAD_MEJORA', label: 'Oportunidad de Mejora' },
  { value: 'NO_CONFORMIDAD_MENOR', label: 'No Conformidad Menor' },
  { value: 'NO_CONFORMIDAD_MAYOR', label: 'No Conformidad Mayor' },
];

const SEVERIDADES = [
  { value: 'OBSERVACION', label: 'Observación' },
  { value: 'MENOR', label: 'Menor' },
  { value: 'MAYOR', label: 'Mayor' },
  { value: 'CRITICA', label: 'Crítica' },
];

const ESTADOS_HALLAZGO = [
  { value: 'ABIERTO', label: 'Abierto' },
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'CERRADO', label: 'Cerrado' },
  { value: 'VERIFICADO', label: 'Verificado' },
];

export default function HallazgoForm({ auditoriaId, hallazgo, onClose }) {
  const { createHallazgo, updateHallazgo } = useCalidad2AuditoriasHC();
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'OPORTUNIDAD_MEJORA',
    severidad: 'MENOR',
    criterio: '',
    descripcion: '',
    evidencia: '',
    accionCorrectiva: '',
    responsable: 'unassigned',
    fechaLimite: '',
    estado: 'ABIERTO',
  });

  const [errors, setErrors] = useState({});

  // Cargar usuarios para el select de responsable
  useEffect(() => {
    loadUsuarios();
  }, []);

  // Cargar datos del hallazgo si es edición
  useEffect(() => {
    if (hallazgo) {
      setFormData({
        tipo: hallazgo.tipo || 'OPORTUNIDAD_MEJORA',
        severidad: hallazgo.severidad || 'MENOR',
        criterio: hallazgo.criterio || '',
        descripcion: hallazgo.descripcion || '',
        evidencia: hallazgo.evidencia || '',
        accionCorrectiva: hallazgo.accionCorrectiva || '',
        responsable: hallazgo.responsable || 'unassigned',
        fechaLimite: hallazgo.fechaLimite
          ? new Date(hallazgo.fechaLimite).toISOString().split('T')[0]
          : '',
        estado: hallazgo.estado || 'ABIERTO',
      });
    }
  }, [hallazgo]);

  const loadUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const data = await apiGet('/usuarios', { limit: 100, activo: true });
      if (data.success && data.data) {
        setUsuarios(data.data);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.tipo) {
      newErrors.tipo = 'El tipo de hallazgo es requerido';
    }

    if (!formData.severidad) {
      newErrors.severidad = 'La severidad es requerida';
    }

    if (!formData.criterio?.trim()) {
      newErrors.criterio = 'El criterio evaluado es requerido';
    }

    if (!formData.descripcion?.trim()) {
      newErrors.descripcion = 'La descripción del hallazgo es requerida';
    }

    // Si hay acción correctiva, debería haber responsable
    if (formData.accionCorrectiva?.trim() && !formData.responsable) {
      newErrors.responsable = 'Si hay acción correctiva, debe asignar un responsable';
    }

    // Si hay responsable, debería haber fecha límite
    if (formData.responsable && !formData.fechaLimite) {
      newErrors.fechaLimite = 'Si hay responsable, debe definir una fecha límite';
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
        tipo: formData.tipo,
        severidad: formData.severidad,
        criterio: formData.criterio.trim(),
        descripcion: formData.descripcion.trim(),
        evidencia: formData.evidencia?.trim() || null,
        accionCorrectiva: formData.accionCorrectiva?.trim() || null,
        responsable: formData.responsable === 'unassigned' ? null : (formData.responsable || null),
        fechaLimite: formData.fechaLimite || null,
        estado: formData.estado,
      };

      const success = hallazgo
        ? await updateHallazgo(hallazgo.id, dataToSubmit)
        : await createHallazgo(auditoriaId, dataToSubmit);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar hallazgo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo y Severidad */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo">
            Tipo de Hallazgo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.tipo}
            onValueChange={(value) => handleChange('tipo', value)}
          >
            <SelectTrigger className={errors.tipo ? 'border-red-500' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_HALLAZGO.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tipo && <p className="text-sm text-red-500 mt-1">{errors.tipo}</p>}
        </div>

        <div>
          <Label htmlFor="severidad">
            Severidad <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.severidad}
            onValueChange={(value) => handleChange('severidad', value)}
          >
            <SelectTrigger className={errors.severidad ? 'border-red-500' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERIDADES.map((sev) => (
                <SelectItem key={sev.value} value={sev.value}>
                  {sev.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.severidad && (
            <p className="text-sm text-red-500 mt-1">{errors.severidad}</p>
          )}
        </div>
      </div>

      {/* Criterio Evaluado */}
      <div>
        <Label htmlFor="criterio">
          Criterio / Requisito Evaluado <span className="text-red-500">*</span>
        </Label>
        <Input
          id="criterio"
          value={formData.criterio}
          onChange={(e) => handleChange('criterio', e.target.value)}
          placeholder="Ej: Resolución 1995/1999 Art. 5 - Identificación del paciente"
          className={errors.criterio ? 'border-red-500' : ''}
        />
        {errors.criterio && <p className="text-sm text-red-500 mt-1">{errors.criterio}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Indique la norma, requisito o estándar que se evaluó
        </p>
      </div>

      {/* Descripción del Hallazgo */}
      <div>
        <Label htmlFor="descripcion">
          Descripción del Hallazgo <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Describa detalladamente el hallazgo encontrado..."
          rows={4}
          className={errors.descripcion ? 'border-red-500' : ''}
        />
        {errors.descripcion && (
          <p className="text-sm text-red-500 mt-1">{errors.descripcion}</p>
        )}
      </div>

      {/* Evidencia */}
      <div>
        <Label htmlFor="evidencia">Evidencia</Label>
        <Textarea
          id="evidencia"
          value={formData.evidencia}
          onChange={(e) => handleChange('evidencia', e.target.value)}
          placeholder="Describa la evidencia que soporta este hallazgo (documentos revisados, HC específicas, etc.)..."
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          Opcional: Referencias a documentos, números de HC, etc.
        </p>
      </div>

      {/* Acción Correctiva */}
      <div>
        <Label htmlFor="accionCorrectiva">Acción Correctiva / Preventiva</Label>
        <Textarea
          id="accionCorrectiva"
          value={formData.accionCorrectiva}
          onChange={(e) => handleChange('accionCorrectiva', e.target.value)}
          placeholder="Describa la acción correctiva o preventiva propuesta..."
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          Opcional para fortalezas, requerido para no conformidades
        </p>
      </div>

      {/* Responsable y Fecha Límite */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="responsable">Responsable</Label>
          <Select
            value={formData.responsable}
            onValueChange={(value) => handleChange('responsable', value)}
          >
            <SelectTrigger className={errors.responsable ? 'border-red-500' : ''}>
              <SelectValue placeholder="Seleccione un responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
              {loadingUsuarios ? (
                <SelectItem value="loading" disabled>
                  Cargando usuarios...
                </SelectItem>
              ) : (
                usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    {usuario.nombre} {usuario.apellido} - {usuario.rol}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.responsable && (
            <p className="text-sm text-red-500 mt-1">{errors.responsable}</p>
          )}
        </div>

        <div>
          <Label htmlFor="fechaLimite">Fecha Límite</Label>
          <Input
            id="fechaLimite"
            type="date"
            value={formData.fechaLimite}
            onChange={(e) => handleChange('fechaLimite', e.target.value)}
            className={errors.fechaLimite ? 'border-red-500' : ''}
          />
          {errors.fechaLimite && (
            <p className="text-sm text-red-500 mt-1">{errors.fechaLimite}</p>
          )}
        </div>
      </div>

      {/* Estado (solo para edición) */}
      {hallazgo && (
        <div>
          <Label htmlFor="estado">Estado del Hallazgo</Label>
          <Select
            value={formData.estado}
            onValueChange={(value) => handleChange('estado', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_HALLAZGO.map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Actualice el estado según el avance de la acción correctiva
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : hallazgo ? 'Actualizar Hallazgo' : 'Crear Hallazgo'}
        </Button>
      </div>
    </form>
  );
}
