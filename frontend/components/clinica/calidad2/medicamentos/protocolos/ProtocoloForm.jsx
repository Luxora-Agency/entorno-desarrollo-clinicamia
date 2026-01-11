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
import { useCalidad2Protocolos } from '@/hooks/useCalidad2Protocolos';

const TIPOS_PROTOCOLO = [
  { value: 'PROGRAMA', label: 'Programa' },
  { value: 'PROCEDIMIENTO', label: 'Procedimiento' },
  { value: 'PROTOCOLO', label: 'Protocolo' },
  { value: 'POLITICA', label: 'Política' },
  { value: 'MANUAL', label: 'Manual' },
];

export default function ProtocoloForm({ protocolo, onClose }) {
  const { createProtocolo, updateProtocolo } = useCalidad2Protocolos();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'PROTOCOLO',
    version: '1.0',
    fechaEmision: '',
    fechaVigencia: '',
    descripcion: '',
    alcance: '',
    responsable: '',
    proximaRevision: '',
  });

  useEffect(() => {
    if (protocolo) {
      setFormData({
        codigo: protocolo.codigo || '',
        nombre: protocolo.nombre || '',
        tipo: protocolo.tipo || 'PROTOCOLO',
        version: protocolo.version || '1.0',
        fechaEmision: protocolo.fechaEmision ? new Date(protocolo.fechaEmision).toISOString().split('T')[0] : '',
        fechaVigencia: protocolo.fechaVigencia ? new Date(protocolo.fechaVigencia).toISOString().split('T')[0] : '',
        descripcion: protocolo.descripcion || '',
        alcance: protocolo.alcance || '',
        responsable: protocolo.responsable || '',
        proximaRevision: protocolo.proximaRevision ? new Date(protocolo.proximaRevision).toISOString().split('T')[0] : '',
      });
    }
  }, [protocolo]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        fechaEmision: formData.fechaEmision || new Date().toISOString(),
        fechaVigencia: formData.fechaVigencia || new Date().toISOString(),
        proximaRevision: formData.proximaRevision || undefined,
      };

      if (protocolo) {
        await updateProtocolo(protocolo.id, submitData);
      } else {
        await createProtocolo(submitData);
      }

      onClose(true); // Close and refresh
    } catch (error) {
      console.error('Error submitting protocolo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Código */}
        <div>
          <Label htmlFor="codigo">
            Código <span className="text-red-500">*</span>
          </Label>
          <Input
            id="codigo"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Ej: MD-PG-001"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Código único del protocolo
          </p>
        </div>

        {/* Versión */}
        <div>
          <Label htmlFor="version">
            Versión <span className="text-red-500">*</span>
          </Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => handleChange('version', e.target.value)}
            placeholder="Ej: 1.0"
            required
          />
        </div>
      </div>

      {/* Nombre */}
      <div>
        <Label htmlFor="nombre">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nombre"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Nombre del protocolo"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tipo */}
        <div>
          <Label htmlFor="tipo">
            Tipo <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_PROTOCOLO.map(tipo => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Responsable */}
        <div>
          <Label htmlFor="responsable">
            Responsable <span className="text-red-500">*</span>
          </Label>
          <Input
            id="responsable"
            value={formData.responsable}
            onChange={(e) => handleChange('responsable', e.target.value)}
            placeholder="Nombre del responsable"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Fecha de Emisión */}
        <div>
          <Label htmlFor="fechaEmision">
            Fecha de Emisión <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fechaEmision"
            type="date"
            value={formData.fechaEmision}
            onChange={(e) => handleChange('fechaEmision', e.target.value)}
            required
          />
        </div>

        {/* Fecha de Vigencia */}
        <div>
          <Label htmlFor="fechaVigencia">
            Fecha de Vigencia <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fechaVigencia"
            type="date"
            value={formData.fechaVigencia}
            onChange={(e) => handleChange('fechaVigencia', e.target.value)}
            required
          />
        </div>

        {/* Próxima Revisión */}
        <div>
          <Label htmlFor="proximaRevision">Próxima Revisión</Label>
          <Input
            id="proximaRevision"
            type="date"
            value={formData.proximaRevision}
            onChange={(e) => handleChange('proximaRevision', e.target.value)}
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción del protocolo..."
          rows={3}
        />
      </div>

      {/* Alcance */}
      <div>
        <Label htmlFor="alcance">Alcance</Label>
        <Textarea
          id="alcance"
          value={formData.alcance}
          onChange={(e) => handleChange('alcance', e.target.value)}
          placeholder="Alcance del protocolo..."
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
          {loading ? 'Guardando...' : protocolo ? 'Actualizar' : 'Crear Protocolo'}
        </Button>
      </div>
    </form>
  );
}
