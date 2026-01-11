'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

export default function AccidenteForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    empleadoId: '',
    fechaAccidente: '',
    horaAccidente: '',
    tipoAccidente: 'DE_TRABAJO',
    lugarAccidente: '',
    actividadRealizaba: '',
    descripcionHechos: '',
    agenteAccidente: '',
    mecanismoAccidente: '',
    tipoLesion: '',
    parteCuerpoAfectada: '',
    atencionMedica: false,
    hospitalizacion: false,
    nombreIPS: '',
    diasIncapacidad: 0,
    testigosNombres: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos del trabajador */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-medium mb-4">Datos del Trabajador</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empleadoId">ID Empleado *</Label>
              <Input
                id="empleadoId"
                name="empleadoId"
                value={formData.empleadoId}
                onChange={handleChange}
                placeholder="Seleccionar empleado..."
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del accidente */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-medium mb-4">Datos del Accidente</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fechaAccidente">Fecha del Accidente *</Label>
              <Input
                id="fechaAccidente"
                name="fechaAccidente"
                type="date"
                value={formData.fechaAccidente}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="horaAccidente">Hora del Accidente</Label>
              <Input
                id="horaAccidente"
                name="horaAccidente"
                type="time"
                value={formData.horaAccidente}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="tipoAccidente">Tipo de Accidente *</Label>
              <select
                id="tipoAccidente"
                name="tipoAccidente"
                value={formData.tipoAccidente}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="DE_TRABAJO">Accidente de Trabajo</option>
                <option value="IN_ITINERE">Accidente In Itinere</option>
                <option value="DEPORTIVO">Accidente Deportivo/Recreativo</option>
              </select>
            </div>
            <div>
              <Label htmlFor="lugarAccidente">Lugar del Accidente *</Label>
              <Input
                id="lugarAccidente"
                name="lugarAccidente"
                value={formData.lugarAccidente}
                onChange={handleChange}
                placeholder="Descripcion del lugar"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Descripcion */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-medium mb-4">Descripcion del Accidente</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="actividadRealizaba">Actividad que Realizaba</Label>
              <Input
                id="actividadRealizaba"
                name="actividadRealizaba"
                value={formData.actividadRealizaba}
                onChange={handleChange}
                placeholder="Que actividad realizaba al momento del accidente"
              />
            </div>
            <div>
              <Label htmlFor="descripcionHechos">Descripcion de los Hechos *</Label>
              <Textarea
                id="descripcionHechos"
                name="descripcionHechos"
                value={formData.descripcionHechos}
                onChange={handleChange}
                rows={4}
                placeholder="Describa detalladamente como ocurrio el accidente..."
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agente y Lesion */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-medium mb-4">Agente, Mecanismo y Lesion</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agenteAccidente">Agente del Accidente</Label>
              <Input
                id="agenteAccidente"
                name="agenteAccidente"
                value={formData.agenteAccidente}
                onChange={handleChange}
                placeholder="Maquina, herramienta, sustancia..."
              />
            </div>
            <div>
              <Label htmlFor="mecanismoAccidente">Mecanismo del Accidente</Label>
              <Input
                id="mecanismoAccidente"
                name="mecanismoAccidente"
                value={formData.mecanismoAccidente}
                onChange={handleChange}
                placeholder="Caida, golpe, atrapamiento..."
              />
            </div>
            <div>
              <Label htmlFor="tipoLesion">Tipo de Lesion</Label>
              <Input
                id="tipoLesion"
                name="tipoLesion"
                value={formData.tipoLesion}
                onChange={handleChange}
                placeholder="Fractura, herida, contusion..."
              />
            </div>
            <div>
              <Label htmlFor="parteCuerpoAfectada">Parte del Cuerpo Afectada</Label>
              <Input
                id="parteCuerpoAfectada"
                name="parteCuerpoAfectada"
                value={formData.parteCuerpoAfectada}
                onChange={handleChange}
                placeholder="Mano, pie, cabeza..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atencion Medica */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-medium mb-4">Atencion Medica</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="atencionMedica"
                name="atencionMedica"
                checked={formData.atencionMedica}
                onChange={handleChange}
              />
              <Label htmlFor="atencionMedica">Recibio atencion medica</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hospitalizacion"
                name="hospitalizacion"
                checked={formData.hospitalizacion}
                onChange={handleChange}
              />
              <Label htmlFor="hospitalizacion">Requirio hospitalizacion</Label>
            </div>
            {formData.atencionMedica && (
              <div>
                <Label htmlFor="nombreIPS">IPS que Atendio</Label>
                <Input
                  id="nombreIPS"
                  name="nombreIPS"
                  value={formData.nombreIPS}
                  onChange={handleChange}
                  placeholder="Nombre de la IPS"
                />
              </div>
            )}
            <div>
              <Label htmlFor="diasIncapacidad">Dias de Incapacidad</Label>
              <Input
                id="diasIncapacidad"
                name="diasIncapacidad"
                type="number"
                min="0"
                value={formData.diasIncapacidad}
                onChange={handleChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testigos */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-medium mb-4">Testigos</h3>
          <div>
            <Label htmlFor="testigosNombres">Nombres de Testigos</Label>
            <Textarea
              id="testigosNombres"
              name="testigosNombres"
              value={formData.testigosNombres}
              onChange={handleChange}
              rows={2}
              placeholder="Nombre y telefono de los testigos (separados por coma)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Accidente'}
        </Button>
      </div>
    </form>
  );
}
