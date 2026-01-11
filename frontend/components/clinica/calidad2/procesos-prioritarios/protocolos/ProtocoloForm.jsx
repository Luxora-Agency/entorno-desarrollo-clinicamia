'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, X } from 'lucide-react';

export default function ProtocoloForm({ open, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'PROTOCOLO',
    categoria: 'GENERAL',
    version: '1.0',
    fechaEmision: '',
    fechaVigencia: '',
    descripcion: '',
    alcance: '',
    responsable: '',
    proximaRevision: '',
    estado: 'VIGENTE',
    esObsoleto: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        fechaEmision: initialData.fechaEmision?.split('T')[0] || '',
        fechaVigencia: initialData.fechaVigencia?.split('T')[0] || '',
        proximaRevision: initialData.proximaRevision?.split('T')[0] || '',
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        tipo: 'PROTOCOLO',
        categoria: 'GENERAL',
        version: '1.0',
        fechaEmision: '',
        fechaVigencia: '',
        descripcion: '',
        alcance: '',
        responsable: '',
        proximaRevision: '',
        estado: 'VIGENTE',
        esObsoleto: false,
      });
    }
  }, [initialData, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Protocolo' : 'Nuevo Protocolo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input
                value={formData.codigo}
                onChange={(e) => handleChange('codigo', e.target.value)}
                placeholder="PP-PT-001"
                required
              />
            </div>

            {/* Versión */}
            <div className="space-y-2">
              <Label>Versión *</Label>
              <Input
                value={formData.version}
                onChange={(e) => handleChange('version', e.target.value)}
                placeholder="1.0"
                required
              />
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre del protocolo/manual/política"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(val) => handleChange('tipo', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROTOCOLO">Protocolo</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="POLITICA">Política</SelectItem>
                  <SelectItem value="PROGRAMA">Programa</SelectItem>
                  <SelectItem value="FORMATO">Formato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={formData.categoria} onValueChange={(val) => handleChange('categoria', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEGURIDAD">Seguridad del Paciente</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ASISTENCIAL">Asistencial</SelectItem>
                  <SelectItem value="SIAU">SIAU</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select value={formData.estado} onValueChange={(val) => handleChange('estado', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIGENTE">Vigente</SelectItem>
                  <SelectItem value="EN_REVISION">En Revisión</SelectItem>
                  <SelectItem value="OBSOLETO">Obsoleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fecha Emisión */}
            <div className="space-y-2">
              <Label>Fecha de Emisión *</Label>
              <Input
                type="date"
                value={formData.fechaEmision}
                onChange={(e) => handleChange('fechaEmision', e.target.value)}
                required
              />
            </div>

            {/* Fecha Vigencia */}
            <div className="space-y-2">
              <Label>Fecha de Vigencia *</Label>
              <Input
                type="date"
                value={formData.fechaVigencia}
                onChange={(e) => handleChange('fechaVigencia', e.target.value)}
                required
              />
            </div>

            {/* Próxima Revisión */}
            <div className="space-y-2">
              <Label>Próxima Revisión</Label>
              <Input
                type="date"
                value={formData.proximaRevision}
                onChange={(e) => handleChange('proximaRevision', e.target.value)}
              />
            </div>
          </div>

          {/* Responsable */}
          <div className="space-y-2">
            <Label>Responsable *</Label>
            <Input
              value={formData.responsable}
              onChange={(e) => handleChange('responsable', e.target.value)}
              placeholder="Nombre del responsable"
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción del documento..."
              rows={3}
            />
          </div>

          {/* Alcance */}
          <div className="space-y-2">
            <Label>Alcance</Label>
            <Textarea
              value={formData.alcance}
              onChange={(e) => handleChange('alcance', e.target.value)}
              placeholder="Alcance del documento..."
              rows={3}
            />
          </div>

          {/* Obsoleto */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="esObsoleto"
              checked={formData.esObsoleto}
              onCheckedChange={(checked) => handleChange('esObsoleto', checked)}
            />
            <Label htmlFor="esObsoleto" className="cursor-pointer">
              Marcar como obsoleto
            </Label>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {initialData ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
