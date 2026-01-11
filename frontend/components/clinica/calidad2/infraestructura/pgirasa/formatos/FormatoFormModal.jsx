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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInfraestructuraFormatos } from '@/hooks/useInfraestructuraFormatos';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export default function FormatoFormModal({ formato, isOpen, onClose, categorias }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    version: '1.0',
    plantillaUrl: '',
    plantillaNombre: '',
  });

  const [uploading, setUploading] = useState(false);

  const { createFormato, updateFormato, loading } = useInfraestructuraFormatos();

  useEffect(() => {
    if (formato) {
      setFormData({
        codigo: formato.codigo || '',
        nombre: formato.nombre || '',
        descripcion: formato.descripcion || '',
        categoria: formato.categoria || '',
        version: formato.version || '1.0',
        plantillaUrl: formato.plantillaUrl || '',
        plantillaNombre: formato.plantillaNombre || '',
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        version: '1.0',
        plantillaUrl: '',
        plantillaNombre: '',
      });
    }
  }, [formato, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Simular upload (aquí iría la lógica real de upload a S3 o servidor)
      // Por ahora, solo simulamos la URL
      const url = `https://example.com/formatos/${Date.now()}_${file.name}`;

      setFormData(prev => ({
        ...prev,
        plantillaUrl: url,
        plantillaNombre: file.name,
      }));

      toast.success('Plantilla adjuntada exitosamente');
    } catch (error) {
      console.error('Error al subir plantilla:', error);
      toast.error('Error al subir plantilla');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      plantillaUrl: '',
      plantillaNombre: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.codigo) {
      toast.error('El código es requerido');
      return;
    }

    if (!formData.nombre) {
      toast.error('El nombre es requerido');
      return;
    }

    if (!formData.categoria) {
      toast.error('La categoría es requerida');
      return;
    }

    const data = {
      codigo: formData.codigo.toUpperCase().trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion?.trim() || null,
      categoria: formData.categoria,
      version: formData.version,
      plantillaUrl: formData.plantillaUrl || null,
      plantillaNombre: formData.plantillaNombre || null,
    };

    let success;
    if (formato) {
      success = await updateFormato(formato.id, data);
    } else {
      success = await createFormato(data);
    }

    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formato ? 'Editar Formato' : 'Nuevo Formato'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código y Versión */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">
                Código <span className="text-red-500">*</span>
              </Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
                placeholder="FMT-RH1-001"
                required
                disabled={!!formato} // No permitir cambiar código al editar
              />
              <p className="text-xs text-gray-500">
                Código único del formato (ej: FMT-RH1-001)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Versión</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => handleChange('version', e.target.value)}
                placeholder="1.0"
              />
              <p className="text-xs text-gray-500">
                Versión del formato
              </p>
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Formato de Residuos Hospitalarios RH1"
              required
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="categoria">
              Categoría <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleChange('categoria', value)}
            >
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Seleccione una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Describe el propósito y uso del formato..."
              rows={4}
            />
          </div>

          {/* Plantilla (archivo) */}
          <div className="space-y-2">
            <Label>Plantilla (Opcional)</Label>

            {!formData.plantillaUrl ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Subiendo...' : 'Adjuntar archivo de plantilla'}
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, Word, Excel (máx 10MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">{formData.plantillaNombre}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? 'Guardando...' : formato ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
