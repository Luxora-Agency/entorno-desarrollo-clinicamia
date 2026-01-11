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
import { useInfraestructuraIndicadores } from '@/hooks/useInfraestructuraIndicadores';
import { toast } from 'sonner';
import { Calculator, Upload, X } from 'lucide-react';

export default function MedicionFormModal({ indicador, isOpen, onClose, medicionEditar = null }) {
  const fechaActual = new Date();
  const anioActual = fechaActual.getFullYear();
  const mesActual = fechaActual.getMonth() + 1;

  const [formData, setFormData] = useState({
    mes: mesActual,
    anio: anioActual,
    numerador: '',
    denominador: '',
    resultado: '',
    notas: '',
  });

  const [adjuntos, setAdjuntos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { createMedicion, updateMedicion, loading } = useInfraestructuraIndicadores();

  useEffect(() => {
    if (medicionEditar) {
      setFormData({
        mes: medicionEditar.mes || mesActual,
        anio: medicionEditar.anio || anioActual,
        numerador: medicionEditar.numerador?.toString() || '',
        denominador: medicionEditar.denominador?.toString() || '',
        resultado: medicionEditar.resultado?.toString() || '',
        notas: medicionEditar.notas || '',
      });
      setAdjuntos(medicionEditar.adjuntos || []);
    } else {
      setFormData({
        mes: mesActual,
        anio: anioActual,
        numerador: '',
        denominador: '',
        resultado: '',
        notas: '',
      });
      setAdjuntos([]);
    }
  }, [medicionEditar, isOpen]);

  // Calcular resultado automáticamente
  useEffect(() => {
    const num = parseFloat(formData.numerador);
    const den = parseFloat(formData.denominador);

    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      // Calcular según tipo de indicador
      let resultado = 0;

      // Para indicadores ambientales (porcentajes)
      if (indicador.dominio === 'AMBIENTAL') {
        resultado = (num / den) * 100;
      } else {
        // Para indicadores de seguridad (tasas con constante K)
        // Por ahora, solo calculamos la división básica
        resultado = num / den;
      }

      setFormData(prev => ({
        ...prev,
        resultado: (Number(resultado) || 0).toFixed(2),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        resultado: '',
      }));
    }
  }, [formData.numerador, formData.denominador, indicador.dominio]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Simular upload (aquí iría la lógica real de upload a S3 o servidor)
      const uploadedUrls = files.map(file => {
        // Por ahora, solo simulamos las URLs
        return {
          nombre: file.name,
          url: `https://example.com/uploads/${Date.now()}_${file.name}`,
          tipo: file.type,
          tamano: file.size,
        };
      });

      setAdjuntos(prev => [...prev, ...uploadedUrls]);
      toast.success(`${files.length} archivo(s) adjuntado(s)`);
    } catch (error) {
      console.error('Error al subir archivos:', error);
      toast.error('Error al subir archivos');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index) => {
    setAdjuntos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.numerador || !formData.denominador) {
      toast.error('Complete numerador y denominador');
      return;
    }

    const num = parseFloat(formData.numerador);
    const den = parseFloat(formData.denominador);

    if (isNaN(num) || isNaN(den)) {
      toast.error('Numerador y denominador deben ser números válidos');
      return;
    }

    if (den === 0) {
      toast.error('El denominador no puede ser cero');
      return;
    }

    const periodo = `${formData.anio}-${String(formData.mes).padStart(2, '0')}`;

    const data = {
      periodo,
      mes: parseInt(formData.mes),
      anio: parseInt(formData.anio),
      numerador: num,
      denominador: den,
      resultado: parseFloat(formData.resultado),
      notas: formData.notas || null,
      adjuntos: adjuntos.map(a => a.url),
    };

    let success = false;
    if (medicionEditar) {
      success = await updateMedicion(medicionEditar.id, data);
    } else {
      success = await createMedicion(indicador.id, data);
    }

    if (success) {
      onClose();
    }
  };

  // Generar años disponibles
  const aniosDisponibles = Array.from(
    { length: 5 },
    (_, i) => anioActual - 2 + i
  );

  // Meses del año
  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {medicionEditar ? 'Editar Medición' : 'Registrar Medición Manual'}
          </DialogTitle>
          <div className="text-sm text-gray-600 mt-2">
            <div className="font-medium">{indicador.nombre}</div>
            <div className="text-xs text-gray-500 mt-1">
              Código: {indicador.codigo} | Dominio: {indicador.dominio}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Periodo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mes</Label>
              <Select
                value={String(formData.mes)}
                onValueChange={(val) => handleChange('mes', parseInt(val))}
              >
                <SelectTrigger id="mes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={String(mes.value)}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Select
                value={String(formData.anio)}
                onValueChange={(val) => handleChange('anio', parseInt(val))}
              >
                <SelectTrigger id="anio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aniosDisponibles.map(anio => (
                    <SelectItem key={anio} value={String(anio)}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fórmula de cálculo */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Calculator className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  Fórmula de Cálculo
                </div>
                <div className="text-xs text-blue-800">
                  {indicador.formulaCalculo || '(Numerador / Denominador)'}
                </div>
                <div className="text-xs text-blue-700 mt-2">
                  <div><strong>Numerador:</strong> {indicador.numeradorDescripcion}</div>
                  <div className="mt-1"><strong>Denominador:</strong> {indicador.denominadorDescripcion}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Numerador y Denominador */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numerador">
                Numerador <span className="text-red-500">*</span>
              </Label>
              <Input
                id="numerador"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.numerador}
                onChange={(e) => handleChange('numerador', e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                {indicador.numeradorDescripcion}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="denominador">
                Denominador <span className="text-red-500">*</span>
              </Label>
              <Input
                id="denominador"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.denominador}
                onChange={(e) => handleChange('denominador', e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                {indicador.denominadorDescripcion}
              </p>
            </div>
          </div>

          {/* Resultado calculado */}
          <div className="space-y-2">
            <Label htmlFor="resultado">Resultado Calculado</Label>
            <Input
              id="resultado"
              type="number"
              step="0.01"
              value={formData.resultado}
              disabled
              className="bg-gray-100 font-medium text-lg"
            />
            <p className="text-xs text-gray-500">
              Se calcula automáticamente según la fórmula del indicador
            </p>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas y Observaciones</Label>
            <Textarea
              id="notas"
              placeholder="Agregue notas adicionales sobre esta medición..."
              value={formData.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              rows={4}
            />
          </div>

          {/* Archivos adjuntos */}
          <div className="space-y-2">
            <Label>Archivos Adjuntos (Opcional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                id="file-upload"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Subiendo...' : 'Adjuntar archivos'}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Soportes, evidencias, o documentos relacionados
              </p>
            </div>

            {/* Lista de archivos adjuntos */}
            {adjuntos.length > 0 && (
              <div className="space-y-2">
                {adjuntos.map((archivo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {archivo.nombre}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? 'Guardando...' : medicionEditar ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
