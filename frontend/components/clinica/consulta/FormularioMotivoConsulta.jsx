'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import BotonCorrectorOrtografia from './BotonCorrectorOrtografia';
import TemplateSelector from '../templates/TemplateSelector';

/**
 * Formulario para capturar el motivo detallado de la consulta
 * Obligatorio en primera consulta del paciente
 */
export default function FormularioMotivoConsulta({ data, onChange }) {
  const [motivoConsulta, setMotivoConsulta] = useState(data?.motivoConsulta || '');
  const [enfermedadActual, setEnfermedadActual] = useState(data?.enfermedadActual || '');
  const [caracteres, setCaracteres] = useState({
    motivo: 0,
    enfermedad: 0
  });

  useEffect(() => {
    setCaracteres({
      motivo: motivoConsulta.length,
      enfermedad: enfermedadActual.length
    });

    // Validar: AMBOS campos son obligatorios (mínimo 10 caracteres cada uno)
    const motivoValido = motivoConsulta.trim().length >= 10;
    const enfermedadValida = enfermedadActual.trim().length >= 10;
    const isValid = motivoValido && enfermedadValida;

    // Notificar cambios al padre
    onChange({
      motivoConsulta,
      enfermedadActual
    }, isValid);
  }, [motivoConsulta, enfermedadActual]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Motivo de Consulta
              </CardTitle>
              <CardDescription>
                Describa detalladamente el motivo principal por el cual el paciente solicita la consulta
              </CardDescription>
            </div>
            {motivoConsulta.trim().length >= 10 ? (
              <Badge variant="success" className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completo
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Obligatorio
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="motivoConsulta" className="text-base font-medium">
                  ¿Por qué consulta el paciente hoy? <span className="text-red-500">*</span>
                </Label>
                <TemplateSelector 
                  category="MOTIVO" 
                  onSelect={(text) => setMotivoConsulta(prev => prev + (prev ? '\n' : '') + text)} 
                />
              </div>
              <BotonCorrectorOrtografia
                texto={motivoConsulta}
                onCorreccion={setMotivoConsulta}
                contexto="medico"
              />
            </div>
            <Textarea
              id="motivoConsulta"
              placeholder="Ej: Paciente refiere dolor abdominal de 3 días de evolución, localizado en epigastrio, tipo cólico, de intensidad moderada a severa, acompañado de náuseas..."
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              className="min-h-[120px] resize-y"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {caracteres.motivo < 10 ? (
                  <span className="text-red-500">
                    Mínimo 10 caracteres requeridos ({10 - caracteres.motivo} restantes)
                  </span>
                ) : (
                  <span className="text-green-600">
                    ✓ Longitud adecuada
                  </span>
                )}
              </span>
              <span className={caracteres.motivo >= 500 ? 'text-amber-600 font-medium' : ''}>
                {caracteres.motivo} / {caracteres.motivo >= 500 ? '500+ caracteres (recomendado <500)' : 'recomendado 100-500'}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Guía para un buen motivo de consulta:</h4>
            <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
              <li>Describa el síntoma principal y su duración</li>
              <li>Incluya características: tipo, intensidad, localización</li>
              <li>Mencione síntomas asociados si los hay</li>
              <li>Indique qué ha empeorado o mejorado la condición</li>
              <li>Anote tratamientos previos intentados</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-blue-600" />
                Enfermedad Actual (Historia de la enfermedad actual)
              </CardTitle>
              <CardDescription className="text-sm">
                Desarrolle la evolución cronológica de la enfermedad o condición actual
              </CardDescription>
            </div>
            {enfermedadActual.trim().length >= 10 ? (
              <Badge variant="success" className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completo
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Obligatorio
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="enfermedadActual" className="text-sm font-medium">
                  Descripción detallada de la evolución <span className="text-red-500">*</span>
                </Label>
                <TemplateSelector 
                  category="GENERICO" 
                  onSelect={(text) => setEnfermedadActual(prev => prev + (prev ? '\n' : '') + text)} 
                />
              </div>
              <BotonCorrectorOrtografia
                texto={enfermedadActual}
                onCorreccion={setEnfermedadActual}
                contexto="medico"
              />
            </div>
            <Textarea
              id="enfermedadActual"
              placeholder="Ej: Paciente refiere que hace aproximadamente 1 semana inició con malestar general y dolor en región lumbar derecha. Hace 3 días el dolor se intensificó y migró hacia fosa ilíaca derecha, asociado a náuseas y un episodio de vómito. No ha presentado fiebre. Niega haber presentado síntomas similares previamente..."
              value={enfermedadActual}
              onChange={(e) => setEnfermedadActual(e.target.value)}
              className="min-h-[150px] resize-y"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {caracteres.enfermedad < 10 ? (
                  <span className="text-red-500">
                    Mínimo 10 caracteres requeridos ({10 - caracteres.enfermedad} restantes)
                  </span>
                ) : (
                  <span className="text-green-600">
                    ✓ Longitud adecuada
                  </span>
                )}
              </span>
              <span className={caracteres.enfermedad >= 1000 ? 'text-amber-600 font-medium' : ''}>
                {caracteres.enfermedad} / {caracteres.enfermedad >= 1000 ? '1000+ caracteres (extenso)' : 'recomendado 100-500'}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">📋 Estructura sugerida (cronológica):</h4>
            <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
              <li><strong>Inicio:</strong> ¿Cuándo y cómo comenzó? ¿Fue súbito o gradual?</li>
              <li><strong>Evolución:</strong> ¿Cómo ha cambiado con el tiempo?</li>
              <li><strong>Síntomas asociados:</strong> ¿Qué otros síntomas aparecieron?</li>
              <li><strong>Factores:</strong> ¿Qué lo mejora o empeora?</li>
              <li><strong>Impacto:</strong> ¿Cómo afecta las actividades diarias?</li>
              <li><strong>Tratamientos:</strong> ¿Qué se ha hecho para manejarlo?</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-900">Importante</h4>
            <p className="text-sm text-yellow-800 mt-1">
              Esta información es fundamental para establecer el historial clínico inicial del paciente.
              Sea lo más detallado y preciso posible, ya que servirá de referencia para consultas futuras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
