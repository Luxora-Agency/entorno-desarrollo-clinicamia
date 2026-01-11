'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner';

/**
 * Formulario para crear/editar documentos de HC
 *
 * Campos:
 * - Código único
 * - Nombre
 * - Tipo (MANUAL, PROCEDIMIENTO, etc.)
 * - Categoría (NORMATIVA, CUMPLIMIENTO, etc.)
 * - Descripción
 * - Archivo (URL)
 * - Fecha de emisión
 * - Fecha de vencimiento (opcional)
 * - Área responsable
 */
export default function DocumentoHCForm({ documento, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: '',
    categoria: '',
    version: '1.0',
    descripcion: '',
    archivoUrl: '',
    archivoNombre: '',
    archivoTipo: 'PDF',
    archivoTamano: 0,
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    elaboradoPor: '', // TODO: Get from auth context
    areaResponsable: '',
  });

  const [loading, setLoading] = useState(false);

  // Si estamos editando, cargar datos del documento
  useEffect(() => {
    if (documento) {
      setFormData({
        codigo: documento.codigo || '',
        nombre: documento.nombre || '',
        tipo: documento.tipo || '',
        categoria: documento.categoria || '',
        version: documento.version || '1.0',
        descripcion: documento.descripcion || '',
        archivoUrl: documento.archivoUrl || '',
        archivoNombre: documento.archivoNombre || '',
        archivoTipo: documento.archivoTipo || 'PDF',
        archivoTamano: documento.archivoTamano || 0,
        fechaEmision: documento.fechaEmision
          ? new Date(documento.fechaEmision).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        fechaVencimiento: documento.fechaVencimiento
          ? new Date(documento.fechaVencimiento).toISOString().split('T')[0]
          : '',
        elaboradoPor: documento.elaboradoPor || '',
        areaResponsable: documento.areaResponsable || '',
      });
    }
  }, [documento]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.codigo.trim()) {
      toast.error('El código es requerido');
      return;
    }
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!formData.tipo) {
      toast.error('El tipo es requerido');
      return;
    }
    if (!formData.categoria) {
      toast.error('La categoría es requerida');
      return;
    }

    setLoading(true);
    try {
      // TODO: Get userId from auth context
      const dataToSubmit = {
        ...formData,
        elaboradoPor: formData.elaboradoPor || 'ae30340c-c5a1-46a2-854d-38011aeaf20c', // Placeholder admin user
        fechaEmision: new Date(formData.fechaEmision),
        fechaVencimiento: formData.fechaVencimiento ? new Date(formData.fechaVencimiento) : null,
      };

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al guardar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {documento ? 'Editar Documento' : 'Nuevo Documento'}
          </DialogTitle>
          <DialogDescription>
            {documento
              ? 'Actualice la información del documento normativo'
              : 'Complete la información del nuevo documento normativo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código y Versión */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                placeholder="HC-MN-001"
                value={formData.codigo}
                onChange={(e) => handleChange('codigo', e.target.value)}
                required
                disabled={!!documento} // No editable al actualizar
              />
              <p className="text-xs text-muted-foreground">
                Ejemplo: HC-MN-001, HC-PR-002
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Versión</Label>
              <Input
                id="version"
                placeholder="1.0"
                value={formData.version}
                onChange={(e) => handleChange('version', e.target.value)}
              />
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Documento *</Label>
            <Input
              id="nombre"
              placeholder="Manual de Manejo y Diligenciamiento de Historia Clínica"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              required
            />
          </div>

          {/* Tipo y Categoría */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Documento *</Label>
              <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="PROCEDIMIENTO">Procedimiento</SelectItem>
                  <SelectItem value="INSTRUCTIVO">Instructivo</SelectItem>
                  <SelectItem value="FORMATO">Formato</SelectItem>
                  <SelectItem value="POLITICA">Política</SelectItem>
                  <SelectItem value="CERTIFICACION">Certificación</SelectItem>
                  <SelectItem value="CONTRATO">Contrato</SelectItem>
                  <SelectItem value="REFERENCIA">Referencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => handleChange('categoria', value)}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Seleccione categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMATIVA">Normativa</SelectItem>
                  <SelectItem value="CUMPLIMIENTO">Cumplimiento</SelectItem>
                  <SelectItem value="OPERATIVO">Operativo</SelectItem>
                  <SelectItem value="AUDITORIA">Auditoría</SelectItem>
                  <SelectItem value="ARCHIVO">Archivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripción del documento y su propósito..."
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={3}
            />
          </div>

          {/* Archivo */}
          <div className="space-y-2">
            <Label htmlFor="archivoUrl">URL del Archivo</Label>
            <Input
              id="archivoUrl"
              type="url"
              placeholder="https://..."
              value={formData.archivoUrl}
              onChange={(e) => handleChange('archivoUrl', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ingrese la URL del documento almacenado
            </p>
          </div>

          {/* Nombre de archivo y tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="archivoNombre">Nombre del Archivo</Label>
              <Input
                id="archivoNombre"
                placeholder="manual_hc.pdf"
                value={formData.archivoNombre}
                onChange={(e) => handleChange('archivoNombre', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="archivoTipo">Tipo de Archivo</Label>
              <Select
                value={formData.archivoTipo}
                onValueChange={(value) => handleChange('archivoTipo', value)}
              >
                <SelectTrigger id="archivoTipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DOCX">Word (DOCX)</SelectItem>
                  <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
                  <SelectItem value="DOC">Word (DOC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaEmision">Fecha de Emisión *</Label>
              <Input
                id="fechaEmision"
                type="date"
                value={formData.fechaEmision}
                onChange={(e) => handleChange('fechaEmision', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={formData.fechaVencimiento}
                onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
              />
            </div>
          </div>

          {/* Área responsable */}
          <div className="space-y-2">
            <Label htmlFor="areaResponsable">Área Responsable</Label>
            <Input
              id="areaResponsable"
              placeholder="Calidad, Dirección Científica, etc."
              value={formData.areaResponsable}
              onChange={(e) => handleChange('areaResponsable', e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : documento ? 'Actualizar' : 'Crear Documento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
