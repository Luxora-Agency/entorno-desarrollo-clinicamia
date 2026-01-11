'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInfraestructuraAuditorias } from '@/hooks/useInfraestructuraAuditorias';

export default function AuditoriaForm({ auditoria, onSuccess, onClose }) {
  const { createAuditoria, updateAuditoria, loading } = useInfraestructuraAuditorias();

  const [formData, setFormData] = useState({
    tipo: 'INTERNA',
    codigo: '',
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    objetivo: '',
    alcance: '',
    hallazgos: '',
    conclusiones: '',
    estado: 'PROGRAMADA',
  });

  const [equipoAuditores, setEquipoAuditores] = useState([]);
  const [nuevoAuditor, setNuevoAuditor] = useState('');

  useEffect(() => {
    if (auditoria) {
      setFormData({
        tipo: auditoria.tipo,
        codigo: auditoria.codigo,
        nombre: auditoria.nombre,
        fechaInicio: auditoria.fechaInicio ? auditoria.fechaInicio.split('T')[0] : '',
        fechaFin: auditoria.fechaFin ? auditoria.fechaFin.split('T')[0] : '',
        objetivo: auditoria.objetivo || '',
        alcance: auditoria.alcance || '',
        hallazgos: auditoria.hallazgos || '',
        conclusiones: auditoria.conclusiones || '',
        estado: auditoria.estado,
      });
      setEquipoAuditores(auditoria.equipo || []);
    }
  }, [auditoria]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAgregarAuditor = () => {
    if (nuevoAuditor.trim() && !equipoAuditores.includes(nuevoAuditor.trim())) {
      setEquipoAuditores([...equipoAuditores, nuevoAuditor.trim()]);
      setNuevoAuditor('');
    }
  };

  const handleEliminarAuditor = (index) => {
    setEquipoAuditores(equipoAuditores.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.codigo.trim()) {
      alert('El código es requerido');
      return;
    }

    if (!formData.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (!formData.fechaInicio) {
      alert('La fecha de inicio es requerida');
      return;
    }

    if (!formData.objetivo.trim()) {
      alert('El objetivo es requerido');
      return;
    }

    if (!formData.alcance.trim()) {
      alert('El alcance es requerido');
      return;
    }

    const data = {
      ...formData,
      equipo: equipoAuditores,
    };

    let success;
    if (auditoria) {
      success = await updateAuditoria(auditoria.id, data);
    } else {
      success = await createAuditoria(data);
    }

    if (success) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {auditoria ? 'Editar Auditoría' : 'Nueva Auditoría'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo y Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Auditoría <span className="text-red-500">*</span></Label>
              <Select value={formData.tipo} onValueChange={(val) => handleChange('tipo', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNA">Interna</SelectItem>
                  <SelectItem value="EXTERNA">Externa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado <span className="text-red-500">*</span></Label>
              <Select value={formData.estado} onValueChange={(val) => handleChange('estado', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROGRAMADA">Programada</SelectItem>
                  <SelectItem value="EN_CURSO">En Curso</SelectItem>
                  <SelectItem value="COMPLETADA">Completada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Código y Nombre */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código <span className="text-red-500">*</span></Label>
              <Input
                value={formData.codigo}
                onChange={(e) => handleChange('codigo', e.target.value)}
                placeholder="Ej: AUD-INT-2025-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Nombre <span className="text-red-500">*</span></Label>
              <Input
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Nombre de la auditoría"
                required
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => handleChange('fechaInicio', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Fin</Label>
              <Input
                type="date"
                value={formData.fechaFin}
                onChange={(e) => handleChange('fechaFin', e.target.value)}
              />
            </div>
          </div>

          {/* Objetivo y Alcance */}
          <div className="space-y-2">
            <Label>Objetivo <span className="text-red-500">*</span></Label>
            <Textarea
              value={formData.objetivo}
              onChange={(e) => handleChange('objetivo', e.target.value)}
              rows={3}
              placeholder="Objetivo de la auditoría..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Alcance <span className="text-red-500">*</span></Label>
            <Textarea
              value={formData.alcance}
              onChange={(e) => handleChange('alcance', e.target.value)}
              rows={3}
              placeholder="Alcance de la auditoría..."
              required
            />
          </div>

          {/* Equipo de Auditores */}
          <div className="space-y-2">
            <Label>Equipo de Auditores</Label>
            <div className="flex gap-2">
              <Input
                value={nuevoAuditor}
                onChange={(e) => setNuevoAuditor(e.target.value)}
                placeholder="Nombre del auditor"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAgregarAuditor();
                  }
                }}
              />
              <Button type="button" onClick={handleAgregarAuditor} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {equipoAuditores.length > 0 && (
              <div className="space-y-2 mt-2">
                {equipoAuditores.map((auditor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <span className="text-sm">{auditor}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEliminarAuditor(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hallazgos y Conclusiones */}
          <div className="space-y-2">
            <Label>Hallazgos</Label>
            <Textarea
              value={formData.hallazgos}
              onChange={(e) => handleChange('hallazgos', e.target.value)}
              rows={3}
              placeholder="Hallazgos de la auditoría (opcional)..."
            />
          </div>

          <div className="space-y-2">
            <Label>Conclusiones</Label>
            <Textarea
              value={formData.conclusiones}
              onChange={(e) => handleChange('conclusiones', e.target.value)}
              rows={3}
              placeholder="Conclusiones de la auditoría (opcional)..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                'Guardando...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {auditoria ? 'Actualizar' : 'Crear Auditoría'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
