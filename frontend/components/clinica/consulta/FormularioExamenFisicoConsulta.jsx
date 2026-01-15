'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Stethoscope, Plus, X,
  Hand, UserCircle, Eye, Mic, Ear, Utensils,
  User, Heart, Wind, Droplets, Bone, Brain
} from 'lucide-react';

// Configuración de sistemas para examen físico según estructura del PDF Resumen de Atención
// Orden: Piel, Cabeza, Ojos, Nariz, Oído, Boca/Faringe, Cuello, Tórax, Corazón, Abdomen, Genitourinario, Extremidades, Sistema Nervioso
const SISTEMAS_EXAMEN_FISICO = [
  { id: 'piel', titulo: 'Piel y Faneras', icono: Hand },
  { id: 'cabeza', titulo: 'Cabeza', icono: UserCircle },
  { id: 'ojos', titulo: 'Ojos', icono: Eye },
  { id: 'nariz', titulo: 'Nariz', icono: Mic },
  { id: 'oidos', titulo: 'Oídos', icono: Ear },
  { id: 'bocaFaringe', titulo: 'Boca y Faringe', icono: Utensils },
  { id: 'cuello', titulo: 'Cuello', icono: User },
  { id: 'torax', titulo: 'Tórax', icono: Wind },
  { id: 'corazon', titulo: 'Corazón', icono: Heart },
  { id: 'abdomen', titulo: 'Abdomen', icono: Utensils },
  { id: 'genitourinario', titulo: 'Genitourinario', icono: Droplets },
  { id: 'extremidades', titulo: 'Extremidades', icono: Bone },
  { id: 'sistemaNervioso', titulo: 'Sistema Nervioso', icono: Brain },
];

// Estado inicial para examen físico
const getInitialExamenFisico = () => {
  const initial = {};
  SISTEMAS_EXAMEN_FISICO.forEach(sistema => {
    initial[sistema.id] = 'Sin alteraciones';
  });
  return initial;
};

export default function FormularioExamenFisicoConsulta({ onChange, data }) {
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined);
  const [formData, setFormData] = useState(data || getInitialExamenFisico());

  const handleToggle = (agregar) => {
    setQuiereAgregar(agregar);
    if (!agregar) {
      onChange(null, true);
    } else {
      onChange(formData, true);
    }
  };

  const handleChange = (sistema, valor) => {
    const newData = { ...formData, [sistema]: valor };
    setFormData(newData);
    onChange(newData, true); // Examen físico siempre es válido
  };

  const marcarTodosSinAlteraciones = () => {
    const resetData = getInitialExamenFisico();
    setFormData(resetData);
    onChange(resetData, true);
  };

  // Contar sistemas con alteraciones
  const sistemasConAlteracion = Object.entries(formData).filter(
    ([, valor]) => valor && valor !== 'Sin alteraciones'
  ).length;

  if (!quiereAgregar) {
    return (
      <Card className="border-green-200">
        <CardContent className="p-6 text-center">
          <Stethoscope className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">¿Desea registrar el examen físico por sistemas?</p>
          <Button
            onClick={() => handleToggle(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sí, agregar examen físico
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 shadow-sm">
      <CardHeader className="bg-green-50">
        <CardTitle className="flex items-center gap-2 text-green-900">
          <Stethoscope className="h-5 w-5" />
          Examen Físico por Sistemas
          {sistemasConAlteracion > 0 && (
            <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
              {sistemasConAlteracion} sistema{sistemasConAlteracion > 1 ? 's' : ''} con alteración
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={marcarTodosSinAlteraciones}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <X className="h-3 w-3 mr-1" />
              Marcar todos sin alteraciones
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle(false)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Ocultar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-gray-500 mb-4">
          Documente los hallazgos del examen físico por cada sistema. Los campos vacíos o con "Sin alteraciones" se consideran normales.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SISTEMAS_EXAMEN_FISICO.map((sistema) => {
            const IconoSistema = sistema.icono;
            const valorActual = formData[sistema.id] || 'Sin alteraciones';
            const tieneAlteracion = valorActual && valorActual !== 'Sin alteraciones';

            return (
              <div
                key={sistema.id}
                className={`rounded-lg border p-3 transition-colors ${
                  tieneAlteracion
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-white border-green-200 hover:border-green-300'
                }`}
              >
                <Label className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <IconoSistema className={`h-4 w-4 ${tieneAlteracion ? 'text-amber-600' : 'text-green-600'}`} />
                  {sistema.titulo}
                  {tieneAlteracion && (
                    <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                      Con hallazgos
                    </span>
                  )}
                </Label>
                <Textarea
                  value={valorActual}
                  onChange={(e) => handleChange(sistema.id, e.target.value)}
                  placeholder="Sin alteraciones"
                  className={`text-sm resize-none ${
                    tieneAlteracion ? 'border-amber-300 focus:border-amber-400' : ''
                  }`}
                  rows={2}
                />
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
            <span>Sin alteraciones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></div>
            <span>Con hallazgos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Exportar los sistemas para uso en otros componentes (PDF, visualización HCE)
export { SISTEMAS_EXAMEN_FISICO, getInitialExamenFisico };
