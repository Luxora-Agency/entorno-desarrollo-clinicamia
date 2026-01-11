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
import { useCalidad2TemperaturaHumedad } from '@/hooks/useCalidad2TemperaturaHumedad';

const AREAS = [
  { value: 'FARMACIA', label: 'Farmacia' },
  { value: 'BODEGA', label: 'Bodega' },
  { value: 'REFRIGERADOR_VACUNAS', label: 'Refrigerador Vacunas' },
  { value: 'LABORATORIO', label: 'Laboratorio' },
  { value: 'ALMACEN_DISPOSITIVOS', label: 'Almacén Dispositivos' },
  { value: 'QUIROFANO', label: 'Quirófano' },
];

// Rangos recomendados por área
const RANGOS_RECOMENDADOS = {
  FARMACIA: { tempMin: 15, tempMax: 25, humMin: 30, humMax: 60 },
  BODEGA: { tempMin: 15, tempMax: 25, humMin: 30, humMax: 70 },
  REFRIGERADOR_VACUNAS: { tempMin: 2, tempMax: 8, humMin: 30, humMax: 70 },
  LABORATORIO: { tempMin: 18, tempMax: 25, humMin: 30, humMax: 60 },
  ALMACEN_DISPOSITIVOS: { tempMin: 15, tempMax: 25, humMin: 30, humMax: 70 },
  QUIROFANO: { tempMin: 19, tempMax: 24, humMin: 40, humMax: 60 },
};

export default function RegistroForm({ registro, onClose }) {
  const { createRegistro, updateRegistro } = useCalidad2TemperaturaHumedad();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fecha: '',
    hora: new Date().getHours(),
    area: 'FARMACIA',
    temperatura: '',
    humedad: '',
    temperaturaMin: 15,
    temperaturaMax: 25,
    humedadMin: 30,
    humedadMax: 60,
    accionCorrectiva: '',
    responsableAccion: '',
  });

  useEffect(() => {
    if (registro) {
      const fechaObj = new Date(registro.fecha);
      setFormData({
        fecha: fechaObj.toISOString().split('T')[0],
        hora: fechaObj.getHours(),
        area: registro.area || 'FARMACIA',
        temperatura: registro.temperatura,
        humedad: registro.humedad,
        temperaturaMin: registro.temperaturaMin,
        temperaturaMax: registro.temperaturaMax,
        humedadMin: registro.humedadMin,
        humedadMax: registro.humedadMax,
        accionCorrectiva: registro.accionCorrectiva || '',
        responsableAccion: registro.responsableAccion || '',
      });
    } else {
      // Set default to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, fecha: today }));
    }
  }, [registro]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAreaChange = (area) => {
    const rangos = RANGOS_RECOMENDADOS[area] || RANGOS_RECOMENDADOS.FARMACIA;
    setFormData(prev => ({
      ...prev,
      area,
      temperaturaMin: rangos.tempMin,
      temperaturaMax: rangos.tempMax,
      humedadMin: rangos.humMin,
      humedadMax: rangos.humMax,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine fecha and hora into a single datetime
      const fechaObj = new Date(formData.fecha);
      fechaObj.setHours(parseInt(formData.hora));

      const submitData = {
        ...formData,
        fecha: fechaObj.toISOString(),
        temperatura: parseFloat(formData.temperatura),
        humedad: parseFloat(formData.humedad),
        hora: parseInt(formData.hora),
      };

      if (registro) {
        await updateRegistro(registro.id, submitData);
      } else {
        await createRegistro(submitData);
      }

      onClose(true); // Close and refresh
    } catch (error) {
      console.error('Error submitting registro:', error);
    } finally {
      setLoading(false);
    }
  };

  const tempFueraDeRango = formData.temperatura &&
    (parseFloat(formData.temperatura) < formData.temperaturaMin ||
     parseFloat(formData.temperatura) > formData.temperaturaMax);

  const humFueraDeRango = formData.humedad &&
    (parseFloat(formData.humedad) < formData.humedadMin ||
     parseFloat(formData.humedad) > formData.humedadMax);

  const requiereAlerta = tempFueraDeRango || humFueraDeRango;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fecha y Hora */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fecha">
            Fecha <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="hora">
            Hora <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.hora.toString()}
            onValueChange={(value) => handleChange('hora', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {i.toString().padStart(2, '0')}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Área */}
      <div>
        <Label htmlFor="area">
          Área <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.area} onValueChange={handleAreaChange} required>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AREAS.map(area => (
              <SelectItem key={area.value} value={area.value}>
                {area.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Temperatura */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h4 className="font-semibold text-blue-900 mb-3">Temperatura (°C)</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="temperatura">
              Medición <span className="text-red-500">*</span>
            </Label>
            <Input
              id="temperatura"
              type="number"
              step="0.1"
              value={formData.temperatura}
              onChange={(e) => handleChange('temperatura', e.target.value)}
              className={tempFueraDeRango ? 'border-red-500 bg-red-50' : ''}
              required
            />
          </div>

          <div>
            <Label htmlFor="temperaturaMin">Mínimo</Label>
            <Input
              id="temperaturaMin"
              type="number"
              step="0.1"
              value={formData.temperaturaMin}
              onChange={(e) => handleChange('temperaturaMin', parseFloat(e.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="temperaturaMax">Máximo</Label>
            <Input
              id="temperaturaMax"
              type="number"
              step="0.1"
              value={formData.temperaturaMax}
              onChange={(e) => handleChange('temperaturaMax', parseFloat(e.target.value))}
              required
            />
          </div>
        </div>
        {tempFueraDeRango && (
          <p className="text-xs text-red-600 mt-2">
            ⚠️ Temperatura fuera de rango ({formData.temperaturaMin}°C - {formData.temperaturaMax}°C)
          </p>
        )}
      </div>

      {/* Humedad */}
      <div className="border rounded-lg p-4 bg-cyan-50">
        <h4 className="font-semibold text-cyan-900 mb-3">Humedad (%)</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="humedad">
              Medición <span className="text-red-500">*</span>
            </Label>
            <Input
              id="humedad"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.humedad}
              onChange={(e) => handleChange('humedad', e.target.value)}
              className={humFueraDeRango ? 'border-red-500 bg-red-50' : ''}
              required
            />
          </div>

          <div>
            <Label htmlFor="humedadMin">Mínimo</Label>
            <Input
              id="humedadMin"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.humedadMin}
              onChange={(e) => handleChange('humedadMin', parseFloat(e.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="humedadMax">Máximo</Label>
            <Input
              id="humedadMax"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.humedadMax}
              onChange={(e) => handleChange('humedadMax', parseFloat(e.target.value))}
              required
            />
          </div>
        </div>
        {humFueraDeRango && (
          <p className="text-xs text-red-600 mt-2">
            ⚠️ Humedad fuera de rango ({formData.humedadMin}% - {formData.humedadMax}%)
          </p>
        )}
      </div>

      {/* Acción Correctiva (si requiere alerta) */}
      {requiereAlerta && (
        <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
          <h4 className="font-semibold text-yellow-900 mb-3">
            ⚠️ Valores Fuera de Rango - Acción Correctiva Requerida
          </h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="accionCorrectiva">Acción Correctiva</Label>
              <Textarea
                id="accionCorrectiva"
                value={formData.accionCorrectiva}
                onChange={(e) => handleChange('accionCorrectiva', e.target.value)}
                placeholder="Describa las acciones correctivas tomadas..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="responsableAccion">Responsable de la Acción</Label>
              <Input
                id="responsableAccion"
                value={formData.responsableAccion}
                onChange={(e) => handleChange('responsableAccion', e.target.value)}
                placeholder="Nombre del responsable"
              />
            </div>
          </div>
        </div>
      )}

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
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : registro ? 'Actualizar Registro' : 'Crear Registro'}
        </Button>
      </div>
    </form>
  );
}
