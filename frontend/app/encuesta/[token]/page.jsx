'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Star, CheckCircle, AlertCircle, Loader2, Heart, ThumbsUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Componente de calificación con estrellas
function StarRating({ value, onChange, label, description }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        {value > 0 && (
          <span className="text-sm text-gray-500">
            {value === 1 && 'Muy malo'}
            {value === 2 && 'Malo'}
            {value === 3 && 'Regular'}
            {value === 4 && 'Bueno'}
            {value === 5 && 'Excelente'}
          </span>
        )}
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hover || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EncuestaPage() {
  const params = useParams();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [encuesta, setEncuesta] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Evaluación del doctor
    atencionDoctor: 0,
    claridadDoctor: 0,
    tiempoConsulta: 0,
    empatiaDoctor: 0,
    // Evaluación del personal
    atencionRecepcion: 0,
    atencionEnfermeria: 0,
    tiempoEspera: 0,
    // Evaluación general
    instalaciones: 0,
    satisfaccionGeneral: 0,
    // Recomendación
    recomendaria: null,
    // Comentarios
    comentarioDoctor: '',
    aspectosPositivos: '',
    aspectosMejorar: '',
    sugerencias: ''
  });

  // Cargar datos de la encuesta
  useEffect(() => {
    const fetchEncuesta = async () => {
      try {
        const response = await fetch(`${API_URL}/encuestas-satisfaccion/publica/${token}`);
        const data = await response.json();

        if (data.success) {
          setEncuesta(data.data);
          if (data.data.respondido) {
            setSubmitted(true);
          }
        } else {
          setError(data.message || 'Error al cargar la encuesta');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudo cargar la encuesta. Por favor intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchEncuesta();
    }
  }, [token]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que al menos se haya calificado la atención del doctor
    if (formData.atencionDoctor === 0) {
      setError('Por favor califica la atención del doctor');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/encuestas-satisfaccion/publica/${token}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Error al enviar la encuesta');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo enviar la encuesta. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando encuesta...</p>
        </div>
      </div>
    );
  }

  // Error al cargar
  if (error && !encuesta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Encuesta ya respondida
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              ¡Gracias por tu opinión!
            </h2>
            <p className="text-gray-600 mb-6">
              Tu respuesta ha sido registrada exitosamente. Tu retroalimentación nos ayuda a mejorar nuestros servicios.
            </p>
            <div className="flex items-center justify-center gap-2 text-cyan-600">
              <Heart className="h-5 w-5 fill-current" />
              <span className="font-medium">Clínica Mía te agradece</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Clínica Mía
          </h1>
          <p className="text-gray-600">
            Encuesta de Satisfacción
          </p>
        </div>

        {/* Info de la consulta */}
        <Card className="mb-6 border-l-4 border-l-cyan-500">
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-100 rounded-full">
                <Star className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Consulta con</p>
                <p className="font-semibold text-gray-900">{encuesta?.nombreDoctor || 'Doctor'}</p>
                <p className="text-sm text-gray-600">{encuesta?.especialidad || 'Consulta General'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error de envío */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección: Evaluación del Doctor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">👨‍⚕️</span>
                Evaluación del Doctor
              </CardTitle>
              <CardDescription>
                Califica la atención médica que recibiste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <StarRating
                value={formData.atencionDoctor}
                onChange={(v) => handleChange('atencionDoctor', v)}
                label="¿Cómo califica la atención del doctor?"
                description="Profesionalismo, conocimiento y trato"
              />
              <StarRating
                value={formData.claridadDoctor}
                onChange={(v) => handleChange('claridadDoctor', v)}
                label="¿El doctor explicó claramente el diagnóstico?"
                description="Claridad en la explicación de tu condición"
              />
              <StarRating
                value={formData.tiempoConsulta}
                onChange={(v) => handleChange('tiempoConsulta', v)}
                label="¿El tiempo de consulta fue adecuado?"
                description="Tiempo dedicado a tu atención"
              />
              <StarRating
                value={formData.empatiaDoctor}
                onChange={(v) => handleChange('empatiaDoctor', v)}
                label="¿El doctor fue empático y amable?"
                description="Actitud y trato humano"
              />
            </CardContent>
          </Card>

          {/* Sección: Personal de Salud */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">👩‍⚕️</span>
                Personal de Salud
              </CardTitle>
              <CardDescription>
                Califica la atención del resto del equipo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <StarRating
                value={formData.atencionRecepcion}
                onChange={(v) => handleChange('atencionRecepcion', v)}
                label="¿Cómo fue la atención en recepción?"
              />
              <StarRating
                value={formData.atencionEnfermeria}
                onChange={(v) => handleChange('atencionEnfermeria', v)}
                label="¿Cómo fue la atención del personal de enfermería?"
              />
              <StarRating
                value={formData.tiempoEspera}
                onChange={(v) => handleChange('tiempoEspera', v)}
                label="¿Cómo califica el tiempo de espera?"
              />
            </CardContent>
          </Card>

          {/* Sección: Evaluación General */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">🏥</span>
                Evaluación General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <StarRating
                value={formData.instalaciones}
                onChange={(v) => handleChange('instalaciones', v)}
                label="¿Cómo califica las instalaciones?"
                description="Limpieza, comodidad y equipamiento"
              />
              <StarRating
                value={formData.satisfaccionGeneral}
                onChange={(v) => handleChange('satisfaccionGeneral', v)}
                label="Satisfacción general con el servicio"
                description="Tu experiencia completa en la clínica"
              />

              {/* Recomendaría */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium text-gray-700">
                  ¿Recomendarías Clínica Mía a familiares y amigos?
                </Label>
                <RadioGroup
                  value={formData.recomendaria === null ? '' : formData.recomendaria.toString()}
                  onValueChange={(v) => handleChange('recomendaria', v === 'true')}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="rec-si" />
                    <Label htmlFor="rec-si" className="flex items-center gap-2 cursor-pointer">
                      <ThumbsUp className="h-5 w-5 text-green-500" />
                      Sí, la recomendaría
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="rec-no" />
                    <Label htmlFor="rec-no" className="cursor-pointer text-gray-600">
                      No la recomendaría
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Comentarios */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-cyan-600" />
                Comentarios (Opcional)
              </CardTitle>
              <CardDescription>
                Tu opinión nos ayuda a mejorar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-700">Comentario sobre el doctor</Label>
                <Textarea
                  placeholder="¿Qué te pareció la atención del doctor?"
                  value={formData.comentarioDoctor}
                  onChange={(e) => handleChange('comentarioDoctor', e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700">¿Qué te gustó de tu visita?</Label>
                <Textarea
                  placeholder="Aspectos positivos de tu experiencia..."
                  value={formData.aspectosPositivos}
                  onChange={(e) => handleChange('aspectosPositivos', e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700">¿Qué podríamos mejorar?</Label>
                <Textarea
                  placeholder="Sugerencias para mejorar..."
                  value={formData.aspectosMejorar}
                  onChange={(e) => handleChange('aspectosMejorar', e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botón de envío */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={submitting || formData.atencionDoctor === 0}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white px-12 py-6 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Enviar Encuesta
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500 pb-8">
            Tu respuesta es confidencial y nos ayuda a mejorar nuestros servicios
          </p>
        </form>
      </div>
    </div>
  );
}
