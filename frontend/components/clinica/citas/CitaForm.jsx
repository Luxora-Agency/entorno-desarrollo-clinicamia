'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon } from 'lucide-react';
import { formatCurrency } from '@/services/formatters';

export default function CitaForm({
  formData,
  onFormDataChange,
  editingCita,
  pacientes,
  especialidades,
  doctoresFiltrados,
  horariosDisponibles,
  loadingHorarios,
  mensajeDisponibilidad,
  onSubmit,
  onCancel,
  onEspecialidadChange,
}) {
  const handleInputChange = (field, value) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Paciente */}
      <div>
        <Label htmlFor="paciente_id" className="text-sm font-semibold text-gray-700 mb-2 block">
          Paciente *
        </Label>
        <Select
          value={formData.paciente_id}
          onValueChange={(value) => handleInputChange('paciente_id', value)}
          required
        >
          <SelectTrigger className="h-11 border-gray-300">
            <SelectValue placeholder="Seleccionar paciente" />
          </SelectTrigger>
          <SelectContent>
            {pacientes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre} {p.apellido} - {p.cedula}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Especialidad */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
          Especialidad *
        </Label>
        <Select
          value={formData.especialidad_id}
          onValueChange={onEspecialidadChange}
          required
        >
          <SelectTrigger className="h-11 border-gray-300">
            <SelectValue placeholder="Seleccionar especialidad" />
          </SelectTrigger>
          <SelectContent>
            {especialidades.map((esp) => (
              <SelectItem key={esp.id} value={esp.id}>
                {esp.titulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Doctor */}
      {formData.especialidad_id && (
        <div>
          <Label htmlFor="doctor_id" className="text-sm font-semibold text-gray-700 mb-2 block">
            Doctor *
          </Label>
          <Select
            value={formData.doctor_id}
            onValueChange={(value) => handleInputChange('doctor_id', value)}
            required
          >
            <SelectTrigger className="h-11 border-gray-300">
              <SelectValue placeholder="Seleccionar doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctoresFiltrados.length > 0 ? (
                doctoresFiltrados.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    Dr. {d.nombre} {d.apellido}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-doctors" disabled>
                  No hay doctores disponibles
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Duración y Costo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duracion_minutos" className="text-sm font-semibold text-gray-700 mb-2 block">
            Duración (min) *
          </Label>
          <Input
            id="duracion_minutos"
            type="number"
            min="1"
            value={formData.duracion_minutos}
            onChange={(e) => handleInputChange('duracion_minutos', e.target.value)}
            className="h-11 border-gray-300"
            required
            placeholder="30"
          />
        </div>

        <div>
          <Label htmlFor="costo" className="text-sm font-semibold text-gray-700 mb-2 block">
            Costo (COP) *
          </Label>
          <Input
            id="costo"
            type="number"
            min="0"
            step="1000"
            value={formData.costo}
            onChange={(e) => handleInputChange('costo', e.target.value)}
            className="h-11 border-gray-300"
            required
            placeholder="0"
          />
        </div>
      </div>

      {/* Fecha y Hora */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fecha" className="text-sm font-semibold text-gray-700 mb-2 block">
            Fecha *
          </Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha}
            onChange={(e) => handleInputChange('fecha', e.target.value)}
            required
            className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>
        <div>
          <Label htmlFor="hora" className="text-sm font-semibold text-gray-700 mb-2 block">
            Hora {!editingCita && '*'}
          </Label>
          {editingCita ? (
            <Input
              id="hora"
              type="time"
              value={formData.hora}
              onChange={(e) => handleInputChange('hora', e.target.value)}
              required
              className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
          ) : (
            <div>
              <Select
                value={formData.hora}
                onValueChange={(value) => handleInputChange('hora', value)}
                required
                disabled={!formData.doctor_id || !formData.fecha || loadingHorarios}
              >
                <SelectTrigger className="h-11 border-gray-300">
                  <SelectValue
                    placeholder={
                      loadingHorarios
                        ? 'Cargando horarios...'
                        : !formData.doctor_id
                        ? 'Primero seleccione doctor'
                        : !formData.fecha
                        ? 'Primero seleccione fecha'
                        : 'Seleccionar horario'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {horariosDisponibles.length > 0 ? (
                    horariosDisponibles.map((slot) => (
                      <SelectItem key={slot.hora_inicio} value={slot.hora_inicio}>
                        {slot.hora_inicio} - {slot.hora_fin}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-slots" disabled>
                      No hay horarios disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {mensajeDisponibilidad && (
                <p
                  className={`text-xs mt-1 ${
                    mensajeDisponibilidad.includes('✅')
                      ? 'text-emerald-600'
                      : mensajeDisponibilidad.includes('❌')
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`}
                >
                  {mensajeDisponibilidad}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Motivo */}
      <div>
        <Label htmlFor="motivo" className="text-sm font-semibold text-gray-700 mb-2 block">
          Motivo de Consulta *
        </Label>
        <Textarea
          id="motivo"
          value={formData.motivo}
          onChange={(e) => handleInputChange('motivo', e.target.value)}
          required
          rows={3}
          className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      {/* Notas */}
      <div>
        <Label htmlFor="notas" className="text-sm font-semibold text-gray-700 mb-2 block">
          Notas Adicionales
        </Label>
        <Textarea
          id="notas"
          value={formData.notas}
          onChange={(e) => handleInputChange('notas', e.target.value)}
          rows={2}
          className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      {/* Botones */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto h-11"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white w-full sm:w-auto h-11 font-semibold"
        >
          {editingCita ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
