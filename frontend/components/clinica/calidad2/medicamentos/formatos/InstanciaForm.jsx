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

export default function InstanciaForm({ instancia, preselectedFormato, onClose }) {
  const {
    createInstancia,
    updateInstancia,
    getFormatosVigentes,
  } = useCalidad2FormatosMedicamentos();

  const [loading, setLoading] = useState(false);
  const [formatosVigentes, setFormatosVigentes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    formatoId: '',
    periodo: '',
    fechaLlenado: new Date().toISOString().split('T')[0],
    observaciones: '',
    archivoUrl: '',
    archivoNombre: '',
    archivoTipo: '',
    archivoTamano: 0,
  });

  useEffect(() => {
    loadFormatosVigentes();
  }, []);

  useEffect(() => {
    if (preselectedFormato) {
      setFormData(prev => ({ ...prev, formatoId: preselectedFormato.id }));
    }
  }, [preselectedFormato]);

  useEffect(() => {
    if (instancia) {
      setFormData({
        formatoId: instancia.formatoId || '',
        periodo: instancia.periodo || '',
        fechaLlenado: instancia.fechaLlenado
          ? new Date(instancia.fechaLlenado).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        observaciones: instancia.observaciones || '',
        archivoUrl: instancia.archivoUrl || '',
        archivoNombre: instancia.archivoNombre || '',
        archivoTipo: instancia.archivoTipo || '',
        archivoTamano: instancia.archivoTamano || 0,
      });
    }
  }, [instancia]);

  const loadFormatosVigentes = async () => {
    const formatos = await getFormatosVigentes();
    setFormatosVigentes(formatos || []);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleChange('archivoNombre', file.name);
      handleChange('archivoTipo', file.type);
      handleChange('archivoTamano', file.size);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let submitData = { ...formData };

      // If new file selected, handle upload
      if (selectedFile) {
        // TODO: Implement actual file upload
        // const uploadedUrl = await uploadFile(selectedFile);
        // submitData.archivoUrl = uploadedUrl;

        // Placeholder URL for demo
        submitData.archivoUrl = `/uploads/instancias/${selectedFile.name}`;
      }

      if (instancia) {
        await updateInstancia(instancia.id, submitData);
      } else {
        await createInstancia(formData.formatoId, submitData);
      }

      onClose(true); // Close and refresh
    } catch (error) {
      console.error('Error submitting instancia:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedFormato = formatosVigentes.find(f => f.id === formData.formatoId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Formato Selection */}
      <div>
        <Label htmlFor="formatoId">
          Formato <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.formatoId}
          onValueChange={(value) => handleChange('formatoId', value)}
          disabled={!!preselectedFormato || !!instancia}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione un formato..." />
          </SelectTrigger>
          <SelectContent>
            {formatosVigentes.map(formato => (
              <SelectItem key={formato.id} value={formato.id}>
                {formato.codigo} - {formato.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedFormato && (
          <p className="text-xs text-gray-500 mt-1">
            Periodicidad: {selectedFormato.periodicidad || 'No definida'}
          </p>
        )}
      </div>

      {/* Período */}
      <div>
        <Label htmlFor="periodo">
          Período <span className="text-red-500">*</span>
        </Label>
        <Input
          id="periodo"
          type="text"
          value={formData.periodo}
          onChange={(e) => handleChange('periodo', e.target.value)}
          placeholder="2025-Q1, 2025-01, 2025-Enero, etc."
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Ejemplos: "2025-Q1" (trimestre), "2025-01" (mes), "2025-S01" (semana), "2025" (año)
        </p>
      </div>

      {/* Fecha de Llenado */}
      <div>
        <Label htmlFor="fechaLlenado">
          Fecha de Llenado <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fechaLlenado"
          type="date"
          value={formData.fechaLlenado}
          onChange={(e) => handleChange('fechaLlenado', e.target.value)}
          required
        />
      </div>

      {/* Archivo Llenado */}
      <div className="border-2 border-dashed border-purple-200 rounded-lg p-4 bg-purple-50">
        <Label htmlFor="archivo" className="text-purple-900 font-semibold mb-2 block">
          Archivo Llenado <span className="text-red-500">*</span>
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
            {formData.archivoTamano > 0 && (
              <p className="text-xs text-gray-600">
                Tamaño: {(formData.archivoTamano / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        )}

        {!instancia && !selectedFile && (
          <p className="text-xs text-red-600 mt-2">
            * Debe cargar el archivo llenado
          </p>
        )}
      </div>

      {/* Observaciones */}
      <div>
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Observaciones o notas adicionales sobre esta instancia..."
          rows={3}
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          <strong>Nota:</strong> Una vez creada la instancia, puede ser revisada por un usuario autorizado
          para marcarla como "Revisada".
        </p>
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
          disabled={loading || (!instancia && !selectedFile)}
        >
          {loading ? 'Guardando...' : instancia ? 'Actualizar Instancia' : 'Crear Instancia'}
        </Button>
      </div>
    </form>
  );
}
