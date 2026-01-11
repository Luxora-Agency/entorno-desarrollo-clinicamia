'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { FileCheck, X } from 'lucide-react';
import { format } from 'date-fns';

export default function CertificacionForm({ certificacion, onClose, onSubmit }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'SOFTWARE_HC',
    entidadEmisora: '',
    numeroRegistro: '',
    fechaEmision: '',
    fechaVencimiento: '',
    archivoUrl: '',
    archivoNombre: '',
    responsable: user?.id || '',
    observaciones: '',
  });

  const [errors, setErrors] = useState({});

  // Cargar datos si es edición
  useEffect(() => {
    if (certificacion) {
      setFormData({
        nombre: certificacion.nombre || '',
        tipo: certificacion.tipo || 'SOFTWARE_HC',
        entidadEmisora: certificacion.entidadEmisora || '',
        numeroRegistro: certificacion.numeroRegistro || '',
        fechaEmision: certificacion.fechaEmision
          ? format(new Date(certificacion.fechaEmision), 'yyyy-MM-dd')
          : '',
        fechaVencimiento: certificacion.fechaVencimiento
          ? format(new Date(certificacion.fechaVencimiento), 'yyyy-MM-dd')
          : '',
        archivoUrl: certificacion.archivoUrl || '',
        archivoNombre: certificacion.archivoNombre || '',
        responsable: certificacion.responsable || user?.id || '',
        observaciones: certificacion.observaciones || '',
      });
    }
  }, [certificacion, user]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Limpiar error del campo
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'El tipo es requerido';
    }

    if (!formData.entidadEmisora.trim()) {
      newErrors.entidadEmisora = 'La entidad emisora es requerida';
    }

    if (!formData.fechaEmision) {
      newErrors.fechaEmision = 'La fecha de emisión es requerida';
    }

    if (!formData.fechaVencimiento) {
      newErrors.fechaVencimiento = 'La fecha de vencimiento es requerida';
    }

    // Validar que la fecha de vencimiento sea posterior a la de emisión
    if (formData.fechaEmision && formData.fechaVencimiento) {
      const emision = new Date(formData.fechaEmision);
      const vencimiento = new Date(formData.fechaVencimiento);

      if (vencimiento <= emision) {
        newErrors.fechaVencimiento = 'La fecha de vencimiento debe ser posterior a la de emisión';
      }
    }

    if (!formData.archivoUrl.trim()) {
      newErrors.archivoUrl = 'La URL del archivo es requerida';
    }

    if (!formData.archivoNombre.trim()) {
      newErrors.archivoNombre = 'El nombre del archivo es requerido';
    }

    if (!formData.responsable) {
      newErrors.responsable = 'El responsable es requerido';
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
      // Convertir fechas a ISO string
      const dataToSubmit = {
        ...formData,
        fechaEmision: new Date(formData.fechaEmision).toISOString(),
        fechaVencimiento: new Date(formData.fechaVencimiento).toISOString(),
      };

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            {certificacion ? 'Editar Certificación' : 'Nueva Certificación'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="nombre">
              Nombre de la Certificación <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Certificado de Software de Historia Clínica"
              className={errors.nombre ? 'border-red-500' : ''}
            />
            {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo */}
            <div>
              <Label htmlFor="tipo">
                Tipo de Certificación <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                <SelectTrigger className={errors.tipo ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOFTWARE_HC">Software HC</SelectItem>
                  <SelectItem value="HABILITACION">Habilitación</SelectItem>
                  <SelectItem value="ACREDITACION">Acreditación</SelectItem>
                  <SelectItem value="ISO">Certificación ISO</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && <p className="text-sm text-red-500 mt-1">{errors.tipo}</p>}
            </div>

            {/* Número de Registro */}
            <div>
              <Label htmlFor="numeroRegistro">Número de Registro</Label>
              <Input
                id="numeroRegistro"
                value={formData.numeroRegistro}
                onChange={(e) => handleChange('numeroRegistro', e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Entidad Emisora */}
          <div>
            <Label htmlFor="entidadEmisora">
              Entidad Emisora <span className="text-red-500">*</span>
            </Label>
            <Input
              id="entidadEmisora"
              value={formData.entidadEmisora}
              onChange={(e) => handleChange('entidadEmisora', e.target.value)}
              placeholder="Ej: Ministerio de Salud y Protección Social"
              className={errors.entidadEmisora ? 'border-red-500' : ''}
            />
            {errors.entidadEmisora && (
              <p className="text-sm text-red-500 mt-1">{errors.entidadEmisora}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                className={errors.fechaEmision ? 'border-red-500' : ''}
              />
              {errors.fechaEmision && (
                <p className="text-sm text-red-500 mt-1">{errors.fechaEmision}</p>
              )}
            </div>

            {/* Fecha de Vencimiento */}
            <div>
              <Label htmlFor="fechaVencimiento">
                Fecha de Vencimiento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={formData.fechaVencimiento}
                onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
                className={errors.fechaVencimiento ? 'border-red-500' : ''}
              />
              {errors.fechaVencimiento && (
                <p className="text-sm text-red-500 mt-1">{errors.fechaVencimiento}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* URL del Archivo */}
            <div>
              <Label htmlFor="archivoUrl">
                URL del Archivo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="archivoUrl"
                value={formData.archivoUrl}
                onChange={(e) => handleChange('archivoUrl', e.target.value)}
                placeholder="https://..."
                className={errors.archivoUrl ? 'border-red-500' : ''}
              />
              {errors.archivoUrl && (
                <p className="text-sm text-red-500 mt-1">{errors.archivoUrl}</p>
              )}
            </div>

            {/* Nombre del Archivo */}
            <div>
              <Label htmlFor="archivoNombre">
                Nombre del Archivo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="archivoNombre"
                value={formData.archivoNombre}
                onChange={(e) => handleChange('archivoNombre', e.target.value)}
                placeholder="Ej: certificado.pdf"
                className={errors.archivoNombre ? 'border-red-500' : ''}
              />
              {errors.archivoNombre && (
                <p className="text-sm text-red-500 mt-1">{errors.archivoNombre}</p>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : certificacion ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
