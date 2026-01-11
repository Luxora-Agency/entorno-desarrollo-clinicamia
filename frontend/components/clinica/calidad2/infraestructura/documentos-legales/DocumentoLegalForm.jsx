'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInfraestructuraDocumentosLegales } from '@/hooks/useInfraestructuraDocumentosLegales';

export default function DocumentoLegalForm({ documento, onSuccess, onClose }) {
  const { createDocumento, updateDocumento, loading } = useInfraestructuraDocumentosLegales();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipoDocumento: '',
    numeroDocumento: '',
    entidadEmisora: '',
    fechaEmision: '',
    fechaVencimiento: '',
    tieneVencimiento: false,
    diasAlerta: [30, 15, 7],
    carpetaId: '',
  });

  const [archivo, setArchivo] = useState(null);
  const [archivoNombre, setArchivoNombre] = useState('');

  useEffect(() => {
    if (documento) {
      setFormData({
        nombre: documento.nombre || '',
        descripcion: documento.descripcion || '',
        tipoDocumento: documento.tipoDocumento || '',
        numeroDocumento: documento.numeroDocumento || '',
        entidadEmisora: documento.entidadEmisora || '',
        fechaEmision: documento.fechaEmision ? documento.fechaEmision.split('T')[0] : '',
        fechaVencimiento: documento.fechaVencimiento ? documento.fechaVencimiento.split('T')[0] : '',
        tieneVencimiento: documento.tieneVencimiento || false,
        diasAlerta: documento.diasAlerta || [30, 15, 7],
        carpetaId: documento.carpetaId || '',
      });
      setArchivoNombre(documento.archivoNombre || '');
    }
  }, [documento]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArchivoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivo(file);
      setArchivoNombre(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim()) {
      alert('El nombre del documento es requerido');
      return;
    }

    if (!formData.tipoDocumento) {
      alert('El tipo de documento es requerido');
      return;
    }

    if (!documento && !archivo) {
      alert('Debe seleccionar un archivo');
      return;
    }

    if (formData.tieneVencimiento && !formData.fechaVencimiento) {
      alert('La fecha de vencimiento es requerida cuando el documento tiene vencimiento');
      return;
    }

    // Preparar FormData
    const form = new FormData();
    form.append('nombre', formData.nombre);
    form.append('descripcion', formData.descripcion);
    form.append('tipoDocumento', formData.tipoDocumento);
    form.append('numeroDocumento', formData.numeroDocumento);
    form.append('entidadEmisora', formData.entidadEmisora);
    form.append('fechaEmision', formData.fechaEmision);
    form.append('fechaVencimiento', formData.fechaVencimiento);
    form.append('tieneVencimiento', formData.tieneVencimiento);
    form.append('diasAlerta', JSON.stringify(formData.diasAlerta));
    if (formData.carpetaId) {
      form.append('carpetaId', formData.carpetaId);
    }

    if (archivo) {
      form.append('archivo', archivo);
    }

    // Crear o actualizar
    let success;
    if (documento) {
      success = await updateDocumento(documento.id, form);
    } else {
      success = await createDocumento(form);
    }

    if (success) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            {documento ? 'Editar Documento Legal' : 'Nuevo Documento Legal'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Archivo */}
          <div className="space-y-2">
            <Label htmlFor="archivo">
              Archivo del Documento {!documento && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="archivo"
                  type="file"
                  onChange={handleArchivoChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="cursor-pointer"
                />
              </div>
              {archivoNombre && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {archivoNombre}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Formatos permitidos: PDF, Word, Imágenes (máx. 10MB)
            </p>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre del Documento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Concepto Sanitario 2025"
              required
            />
          </div>

          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label>
              Tipo de Documento <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.tipoDocumento} onValueChange={(val) => handleChange('tipoDocumento', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONCEPTO_SANITARIO">Concepto Sanitario</SelectItem>
                <SelectItem value="CERTIFICADO">Certificado</SelectItem>
                <SelectItem value="LICENCIA">Licencia</SelectItem>
                <SelectItem value="POLIZA">Póliza</SelectItem>
                <SelectItem value="CONTRATO">Contrato</SelectItem>
                <SelectItem value="PERMISO">Permiso</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Número y Entidad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroDocumento">Número de Documento</Label>
              <Input
                id="numeroDocumento"
                value={formData.numeroDocumento}
                onChange={(e) => handleChange('numeroDocumento', e.target.value)}
                placeholder="Ej: 12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entidadEmisora">Entidad Emisora</Label>
              <Input
                id="entidadEmisora"
                value={formData.entidadEmisora}
                onChange={(e) => handleChange('entidadEmisora', e.target.value)}
                placeholder="Ej: Secretaría de Salud"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción opcional del documento..."
              rows={3}
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaEmision">Fecha de Emisión</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="fechaEmision"
                  type="date"
                  value={formData.fechaEmision}
                  onChange={(e) => handleChange('fechaEmision', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="fechaVencimiento"
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
                  disabled={!formData.tieneVencimiento}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Tiene Vencimiento */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Este documento tiene vencimiento</Label>
              <p className="text-sm text-gray-500">
                Active para recibir alertas de vencimiento
              </p>
            </div>
            <Switch
              checked={formData.tieneVencimiento}
              onCheckedChange={(checked) => handleChange('tieneVencimiento', checked)}
            />
          </div>

          {/* Días de Alerta */}
          {formData.tieneVencimiento && (
            <div className="space-y-2">
              <Label>Días de Anticipación para Alertas</Label>
              <p className="text-sm text-gray-500 mb-2">
                Se generarán alertas estos días antes del vencimiento
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.diasAlerta[0] || 30}
                  onChange={(e) => {
                    const newDias = [...formData.diasAlerta];
                    newDias[0] = parseInt(e.target.value) || 30;
                    handleChange('diasAlerta', newDias);
                  }}
                  className="w-20"
                  min="1"
                />
                <Input
                  type="number"
                  value={formData.diasAlerta[1] || 15}
                  onChange={(e) => {
                    const newDias = [...formData.diasAlerta];
                    newDias[1] = parseInt(e.target.value) || 15;
                    handleChange('diasAlerta', newDias);
                  }}
                  className="w-20"
                  min="1"
                />
                <Input
                  type="number"
                  value={formData.diasAlerta[2] || 7}
                  onChange={(e) => {
                    const newDias = [...formData.diasAlerta];
                    newDias[2] = parseInt(e.target.value) || 7;
                    handleChange('diasAlerta', newDias);
                  }}
                  className="w-20"
                  min="1"
                />
                <span className="text-sm text-gray-600 self-center">días antes</span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (documento ? 'Actualizar' : 'Crear Documento')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
