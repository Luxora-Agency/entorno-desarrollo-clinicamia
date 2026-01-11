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
import { useCalidad2FormatosMedicamentos } from '@/hooks/useCalidad2FormatosMedicamentos';

const CATEGORIAS = [
  { value: 'TEMPERATURA', label: 'Temperatura' },
  { value: 'INVENTARIO', label: 'Inventario' },
  { value: 'INSPECCION', label: 'Inspección' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'LIMPIEZA', label: 'Limpieza' },
  { value: 'OTRO', label: 'Otro' },
];

const ESTADOS = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'EN_REVISION', label: 'En Revisión' },
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'OBSOLETO', label: 'Obsoleto' },
];

const PERIODICIDADES = [
  { value: 'DIARIO', label: 'Diario' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'EVENTUAL', label: 'Eventual' },
];

export default function FormatoForm({ formato, onClose }) {
  const { createFormato, updateFormato } = useCalidad2FormatosMedicamentos();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: 'OTRO',
    version: '1.0',
    estado: 'BORRADOR',
    periodicidad: 'TODOS',
    archivoUrl: '',
    archivoNombre: '',
    archivoTipo: '',
  });

  useEffect(() => {
    if (formato) {
      setFormData({
        codigo: formato.codigo || '',
        nombre: formato.nombre || '',
        descripcion: formato.descripcion || '',
        categoria: formato.categoria || 'OTRO',
        version: formato.version || '1.0',
        estado: formato.estado || 'BORRADOR',
        periodicidad: formato.periodicidad || 'TODOS',
        archivoUrl: formato.archivoUrl || '',
        archivoNombre: formato.archivoNombre || '',
        archivoTipo: formato.archivoTipo || '',
      });
    }
  }, [formato]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleChange('archivoNombre', file.name);
      handleChange('archivoTipo', file.type);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let submitData = { ...formData };

      // If new file selected, handle upload
      // Note: In a real implementation, you'd upload the file first
      // and get back the URL. For now, we'll use a placeholder.
      if (selectedFile) {
        // TODO: Implement actual file upload
        // const uploadedUrl = await uploadFile(selectedFile);
        // submitData.archivoUrl = uploadedUrl;

        // Placeholder URL for demo
        submitData.archivoUrl = `/uploads/formatos/${selectedFile.name}`;
      }

      if (formato) {
        await updateFormato(formato.id, submitData);
      } else {
        await createFormato(submitData);
      }

      onClose(true); // Close and refresh
    } catch (error) {
      console.error('Error submitting formato:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Código y Versión */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="codigo">
            Código <span className="text-red-500">*</span>
          </Label>
          <Input
            id="codigo"
            type="text"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="DM-FOR-001"
            required
            disabled={!!formato} // Can't change codigo when editing
          />
          <p className="text-xs text-gray-500 mt-1">
            Ejemplo: DM-FOR-001, DM-FOR-002
          </p>
        </div>

        <div>
          <Label htmlFor="version">
            Versión <span className="text-red-500">*</span>
          </Label>
          <Input
            id="version"
            type="text"
            value={formData.version}
            onChange={(e) => handleChange('version', e.target.value)}
            placeholder="1.0"
            required
          />
        </div>
      </div>

      {/* Nombre */}
      <div>
        <Label htmlFor="nombre">
          Nombre del Formato <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nombre"
          type="text"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Formato de Temperatura y Humedad"
          required
        />
      </div>

      {/* Descripción */}
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción detallada del formato..."
          rows={3}
        />
      </div>

      {/* Categoría y Estado */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="categoria">
            Categoría <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.categoria} onValueChange={(value) => handleChange('categoria', value)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="estado">
            Estado <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.estado} onValueChange={(value) => handleChange('estado', value)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map(est => (
                <SelectItem key={est.value} value={est.value}>
                  {est.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Periodicidad */}
      <div>
        <Label htmlFor="periodicidad">Periodicidad Sugerida</Label>
        <Select value={formData.periodicidad} onValueChange={(value) => handleChange('periodicidad', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccione periodicidad..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Sin periodicidad definida</SelectItem>
            {PERIODICIDADES.map(per => (
              <SelectItem key={per.value} value={per.value}>
                {per.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Frecuencia recomendada para llenar este formato
        </p>
      </div>

      {/* Archivo de Plantilla */}
      <div className="border-2 border-dashed border-purple-200 rounded-lg p-4 bg-purple-50">
        <Label htmlFor="archivo" className="text-purple-900 font-semibold mb-2 block">
          Archivo de Plantilla
        </Label>
        <Input
          id="archivo"
          type="file"
          onChange={handleFileChange}
          accept=".xlsx,.xls,.docx,.doc,.pdf"
          className="mb-2"
        />
        <p className="text-xs text-purple-700 mb-2">
          Formatos aceptados: Excel (.xlsx, .xls), Word (.docx, .doc), PDF (.pdf)
        </p>

        {formData.archivoNombre && (
          <div className="mt-3 p-2 bg-white border border-purple-200 rounded text-sm">
            <p className="font-medium text-purple-900">Archivo actual:</p>
            <p className="text-purple-700 truncate">{formData.archivoNombre}</p>
          </div>
        )}

        {!formato && !selectedFile && (
          <p className="text-xs text-red-600 mt-2">
            * Debe cargar un archivo de plantilla
          </p>
        )}
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
        <Button
          type="submit"
          disabled={loading || (!formato && !selectedFile)}
        >
          {loading ? 'Guardando...' : formato ? 'Actualizar Formato' : 'Crear Formato'}
        </Button>
      </div>
    </form>
  );
}
