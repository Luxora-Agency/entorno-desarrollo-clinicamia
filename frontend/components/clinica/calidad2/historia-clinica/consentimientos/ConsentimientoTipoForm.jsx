'use client';

import { useState, useEffect } from 'react';
import { useCalidad2ConsentimientosHC } from '@/hooks/useCalidad2ConsentimientosHC';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileSignature } from 'lucide-react';

const SERVICIOS = [
  { value: 'CIRUGIA', label: 'Cirugía' },
  { value: 'PROCEDIMIENTOS', label: 'Procedimientos' },
  { value: 'CONSULTA', label: 'Consulta' },
  { value: 'HOSPITALIZACION', label: 'Hospitalización' },
  { value: 'URGENCIAS', label: 'Urgencias' },
  { value: 'IMAGENOLOGIA', label: 'Imagenología' },
];

export default function ConsentimientoTipoForm({ tipo, onClose }) {
  const { createTipo, updateTipo } = useCalidad2ConsentimientosHC();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    servicio: 'PROCEDIMIENTOS',
    procedimiento: '',
    plantilla: '',
    version: '1.0',
    estado: 'VIGENTE',
    requiereFirma: true,
    requiereTestigo: false,
    requiereFamiliar: false,
    archivoPlantilla: '',
  });

  const [errors, setErrors] = useState({});

  // Cargar datos si es edición
  useEffect(() => {
    if (tipo) {
      setFormData({
        codigo: tipo.codigo || '',
        nombre: tipo.nombre || '',
        servicio: tipo.servicio || 'PROCEDIMIENTOS',
        procedimiento: tipo.procedimiento || '',
        plantilla: tipo.plantilla || '',
        version: tipo.version || '1.0',
        estado: tipo.estado || 'VIGENTE',
        requiereFirma: tipo.requiereFirma ?? true,
        requiereTestigo: tipo.requiereTestigo ?? false,
        requiereFamiliar: tipo.requiereFamiliar ?? false,
        archivoPlantilla: tipo.archivoPlantilla || '',
      });
    }
  }, [tipo]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Limpiar error del campo
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es requerido';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.servicio) {
      newErrors.servicio = 'El servicio es requerido';
    }

    if (!formData.procedimiento.trim()) {
      newErrors.procedimiento = 'El procedimiento es requerido';
    }

    if (!formData.plantilla.trim()) {
      newErrors.plantilla = 'La plantilla es requerida';
    }

    if (!formData.version.trim()) {
      newErrors.version = 'La versión es requerida';
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
      const success = tipo
        ? await updateTipo(tipo.id, formData)
        : await createTipo(formData);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar tipo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            {tipo ? 'Editar Plantilla de Consentimiento' : 'Nueva Plantilla de Consentimiento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Ej: CONS-BIO-001"
                className={errors.codigo ? 'border-red-500' : ''}
              />
              {errors.codigo && <p className="text-sm text-red-500 mt-1">{errors.codigo}</p>}
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
                className={errors.version ? 'border-red-500' : ''}
              />
              {errors.version && <p className="text-sm text-red-500 mt-1">{errors.version}</p>}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <Label htmlFor="nombre">
              Nombre del Consentimiento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Consentimiento Informado para Biopsia"
              className={errors.nombre ? 'border-red-500' : ''}
            />
            {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Servicio */}
            <div>
              <Label htmlFor="servicio">
                Servicio <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.servicio}
                onValueChange={(value) => handleChange('servicio', value)}
              >
                <SelectTrigger className={errors.servicio ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICIOS.map(servicio => (
                    <SelectItem key={servicio.value} value={servicio.value}>
                      {servicio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.servicio && <p className="text-sm text-red-500 mt-1">{errors.servicio}</p>}
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => handleChange('estado', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIGENTE">Vigente</SelectItem>
                  <SelectItem value="OBSOLETO">Obsoleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Procedimiento */}
          <div>
            <Label htmlFor="procedimiento">
              Procedimiento Específico <span className="text-red-500">*</span>
            </Label>
            <Input
              id="procedimiento"
              value={formData.procedimiento}
              onChange={(e) => handleChange('procedimiento', e.target.value)}
              placeholder="Ej: Biopsia de tiroides guiada por ecografía"
              className={errors.procedimiento ? 'border-red-500' : ''}
            />
            {errors.procedimiento && <p className="text-sm text-red-500 mt-1">{errors.procedimiento}</p>}
          </div>

          {/* Plantilla */}
          <div>
            <Label htmlFor="plantilla">
              Plantilla del Consentimiento <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="plantilla"
              value={formData.plantilla}
              onChange={(e) => handleChange('plantilla', e.target.value)}
              placeholder="Ingrese el texto de la plantilla. Puede usar variables como {{nombre_paciente}}, {{procedimiento}}, {{fecha}}, etc."
              rows={8}
              className={errors.plantilla ? 'border-red-500' : ''}
            />
            {errors.plantilla && <p className="text-sm text-red-500 mt-1">{errors.plantilla}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Variables disponibles: &#123;&#123;nombre_paciente&#125;&#125;, &#123;&#123;documento&#125;&#125;, &#123;&#123;procedimiento&#125;&#125;, &#123;&#123;fecha&#125;&#125;, &#123;&#123;medico&#125;&#125;
            </p>
          </div>

          {/* URL de archivo de plantilla */}
          <div>
            <Label htmlFor="archivoPlantilla">URL del Archivo de Plantilla (Opcional)</Label>
            <Input
              id="archivoPlantilla"
              value={formData.archivoPlantilla}
              onChange={(e) => handleChange('archivoPlantilla', e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">
              URL de un archivo PDF o DOCX con la plantilla oficial
            </p>
          </div>

          {/* Opciones de firmas requeridas */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold">Firmas Requeridas</h3>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiereFirma"
                checked={formData.requiereFirma}
                onCheckedChange={(checked) => handleChange('requiereFirma', checked)}
              />
              <Label htmlFor="requiereFirma" className="text-sm font-normal cursor-pointer">
                Requiere firma del paciente
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiereTestigo"
                checked={formData.requiereTestigo}
                onCheckedChange={(checked) => handleChange('requiereTestigo', checked)}
              />
              <Label htmlFor="requiereTestigo" className="text-sm font-normal cursor-pointer">
                Requiere firma de testigo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiereFamiliar"
                checked={formData.requiereFamiliar}
                onCheckedChange={(checked) => handleChange('requiereFamiliar', checked)}
              />
              <Label htmlFor="requiereFamiliar" className="text-sm font-normal cursor-pointer">
                Requiere firma de familiar responsable
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : tipo ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
