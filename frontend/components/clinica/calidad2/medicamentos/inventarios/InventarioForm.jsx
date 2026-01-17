'use client';

import { useState, useEffect } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
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
import { useCalidad2InventarioMedicamentos } from '@/hooks/useCalidad2InventarioMedicamentos';

const FORMAS_FARMACEUTICAS = [
  'Tableta', 'Cápsula', 'Jarabe', 'Suspensión', 'Solución',
  'Inyectable', 'Crema', 'Ungüento', 'Gel', 'Parche',
  'Supositorio', 'Óvulo', 'Gotas', 'Aerosol', 'Polvo',
];

const VIAS_ADMINISTRACION = [
  'Oral', 'Intravenosa', 'Intramuscular', 'Subcutánea', 'Tópica',
  'Oftálmica', 'Ótica', 'Nasal', 'Inhalatoria', 'Rectal',
  'Vaginal', 'Sublingual', 'Transdérmica',
];

const CLASIFICACIONES_RIESGO = [
  'Clase I', 'Clase IIa', 'Clase IIb', 'Clase III',
];

const UNIDADES_MEDIDA = [
  'Unidad', 'Caja', 'Frasco', 'Ampolla', 'Vial',
  'Tabletas', 'Cápsulas', 'ml', 'Litros', 'g',
  'kg', 'mg', 'Par', 'Juego', 'Paquete',
];

export default function InventarioForm({ item, tipo, onClose }) {
  const { createItem, updateItem } = useCalidad2InventarioMedicamentos(tipo);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: tipo || 'MEDICAMENTO',
    codigo: '',
    nombre: '',
    descripcion: '',
    principioActivo: '',
    concentracion: '',
    formaFarmaceutica: '',
    via: '',
    clasificacionRiesgo: '',
    registroSanitario: '',
    laboratorio: '',
    fabricante: '',
    lote: '',
    fechaVencimiento: '',
    cantidadActual: '',
    unidadMedida: 'Unidad',
    stockMinimo: '',
    stockMaximo: '',
    ubicacionFisica: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        tipo: item.tipo || tipo,
        codigo: item.codigo || '',
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        principioActivo: item.principioActivo || '',
        concentracion: item.concentracion || '',
        formaFarmaceutica: item.formaFarmaceutica || '',
        via: item.via || '',
        clasificacionRiesgo: item.clasificacionRiesgo || '',
        registroSanitario: item.registroSanitario || '',
        laboratorio: item.laboratorio || '',
        fabricante: item.fabricante || '',
        lote: item.lote || '',
        fechaVencimiento: item.fechaVencimiento ? formatDateISO(new Date(item.fechaVencimiento)) : '',
        cantidadActual: item.cantidadActual?.toString() || '',
        unidadMedida: item.unidadMedida || 'Unidad',
        stockMinimo: item.stockMinimo?.toString() || '',
        stockMaximo: item.stockMaximo?.toString() || '',
        ubicacionFisica: item.ubicacionFisica || '',
      });
    }
  }, [item, tipo]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        tipo: formData.tipo,
        codigo: formData.codigo,
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        lote: formData.lote,
        fechaVencimiento: formData.fechaVencimiento,
        cantidadActual: parseFloat(formData.cantidadActual),
        unidadMedida: formData.unidadMedida,
        stockMinimo: formData.stockMinimo ? parseFloat(formData.stockMinimo) : null,
        stockMaximo: formData.stockMaximo ? parseFloat(formData.stockMaximo) : null,
        ubicacionFisica: formData.ubicacionFisica || null,
        registroSanitario: formData.registroSanitario || null,
      };

      // Medicamento-specific fields
      if (formData.tipo === 'MEDICAMENTO') {
        submitData.principioActivo = formData.principioActivo || null;
        submitData.concentracion = formData.concentracion || null;
        submitData.formaFarmaceutica = formData.formaFarmaceutica || null;
        submitData.via = formData.via || null;
        submitData.laboratorio = formData.laboratorio || null;
      }

      // Dispositivo/Insumo-specific fields
      if (formData.tipo === 'DISPOSITIVO_MEDICO') {
        submitData.fabricante = formData.fabricante || null;
        submitData.clasificacionRiesgo = formData.clasificacionRiesgo || null;
      } else if (formData.tipo === 'INSUMO_MEDICO_QUIRURGICO') {
        submitData.fabricante = formData.fabricante || null;
      }

      if (item) {
        await updateItem(item.id, submitData);
      } else {
        await createItem(submitData);
      }

      onClose(true); // Close and refresh
    } catch (error) {
      console.error('Error submitting inventory item:', error);
    } finally {
      setLoading(false);
    }
  };

  const isMedicamento = formData.tipo === 'MEDICAMENTO';
  const isDispositivo = formData.tipo === 'DISPOSITIVO_MEDICO';
  const isInsumo = formData.tipo === 'INSUMO_MEDICO_QUIRURGICO';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="codigo">
            Código <span className="text-red-500">*</span>
          </Label>
          <Input
            id="codigo"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Ej: MED-001"
            required
          />
        </div>

        <div>
          <Label htmlFor="lote">
            Lote <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lote"
            value={formData.lote}
            onChange={(e) => handleChange('lote', e.target.value)}
            placeholder="Número de lote"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="nombre">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nombre"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Nombre del producto"
          required
        />
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción detallada..."
          rows={2}
        />
      </div>

      {/* Medicamento-specific fields */}
      {isMedicamento && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="principioActivo">Principio Activo</Label>
              <Input
                id="principioActivo"
                value={formData.principioActivo}
                onChange={(e) => handleChange('principioActivo', e.target.value)}
                placeholder="Ej: Paracetamol"
              />
            </div>

            <div>
              <Label htmlFor="concentracion">Concentración</Label>
              <Input
                id="concentracion"
                value={formData.concentracion}
                onChange={(e) => handleChange('concentracion', e.target.value)}
                placeholder="Ej: 500mg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="formaFarmaceutica">Forma Farmacéutica</Label>
              <Select value={formData.formaFarmaceutica} onValueChange={(value) => handleChange('formaFarmaceutica', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_FARMACEUTICAS.map(forma => (
                    <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="via">Vía de Administración</Label>
              <Select value={formData.via} onValueChange={(value) => handleChange('via', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {VIAS_ADMINISTRACION.map(via => (
                    <SelectItem key={via} value={via}>{via}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="laboratorio">Laboratorio</Label>
            <Input
              id="laboratorio"
              value={formData.laboratorio}
              onChange={(e) => handleChange('laboratorio', e.target.value)}
              placeholder="Nombre del laboratorio"
            />
          </div>
        </>
      )}

      {/* Dispositivo-specific fields */}
      {isDispositivo && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fabricante">Fabricante</Label>
              <Input
                id="fabricante"
                value={formData.fabricante}
                onChange={(e) => handleChange('fabricante', e.target.value)}
                placeholder="Nombre del fabricante"
              />
            </div>

            <div>
              <Label htmlFor="clasificacionRiesgo">Clasificación de Riesgo</Label>
              <Select value={formData.clasificacionRiesgo} onValueChange={(value) => handleChange('clasificacionRiesgo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {CLASIFICACIONES_RIESGO.map(clase => (
                    <SelectItem key={clase} value={clase}>{clase}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {/* Insumo-specific fields */}
      {isInsumo && (
        <div>
          <Label htmlFor="fabricante">Fabricante</Label>
          <Input
            id="fabricante"
            value={formData.fabricante}
            onChange={(e) => handleChange('fabricante', e.target.value)}
            placeholder="Nombre del fabricante"
          />
        </div>
      )}

      {/* Common regulatory fields */}
      <div>
        <Label htmlFor="registroSanitario">Registro Sanitario</Label>
        <Input
          id="registroSanitario"
          value={formData.registroSanitario}
          onChange={(e) => handleChange('registroSanitario', e.target.value)}
          placeholder="Número de registro sanitario (INVIMA)"
        />
      </div>

      {/* Stock management */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="cantidadActual">
            Cantidad Actual <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cantidadActual"
            type="number"
            step="0.01"
            value={formData.cantidadActual}
            onChange={(e) => handleChange('cantidadActual', e.target.value)}
            placeholder="0"
            required
          />
        </div>

        <div>
          <Label htmlFor="stockMinimo">Stock Mínimo</Label>
          <Input
            id="stockMinimo"
            type="number"
            step="0.01"
            value={formData.stockMinimo}
            onChange={(e) => handleChange('stockMinimo', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <Label htmlFor="stockMaximo">Stock Máximo</Label>
          <Input
            id="stockMaximo"
            type="number"
            step="0.01"
            value={formData.stockMaximo}
            onChange={(e) => handleChange('stockMaximo', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unidadMedida">
            Unidad de Medida <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.unidadMedida} onValueChange={(value) => handleChange('unidadMedida', value)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIDADES_MEDIDA.map(unidad => (
                <SelectItem key={unidad} value={unidad}>{unidad}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="fechaVencimiento">
            Fecha de Vencimiento <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fechaVencimiento"
            type="date"
            value={formData.fechaVencimiento}
            onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="ubicacionFisica">Ubicación Física</Label>
        <Input
          id="ubicacionFisica"
          value={formData.ubicacionFisica}
          onChange={(e) => handleChange('ubicacionFisica', e.target.value)}
          placeholder="Ej: Bodega A - Estante 3 - Nivel 2"
        />
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
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : item ? 'Actualizar' : 'Crear Item'}
        </Button>
      </div>
    </form>
  );
}
