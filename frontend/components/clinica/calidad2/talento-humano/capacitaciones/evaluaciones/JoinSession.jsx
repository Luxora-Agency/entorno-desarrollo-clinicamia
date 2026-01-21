'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Users, Play, ArrowRight, CheckCircle, Lock } from 'lucide-react';
import { apiGet } from '@/services/api';
import EvaluacionPlayer from './EvaluacionPlayer';

export default function JoinSession() {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sesion, setSesion] = useState(null);
  const [tipoEvaluacion, setTipoEvaluacion] = useState(null);
  const [nombre, setNombre] = useState('');
  const [participanteRegistrado, setParticipanteRegistrado] = useState(false);
  const [evaluacionesStatus, setEvaluacionesStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Cargar estado de evaluaciones cuando el participante se registra
  const cargarStatusEvaluaciones = async (sesionId, nombreParticipante) => {
    try {
      setLoadingStatus(true);
      const response = await apiGet(
        `/calidad2/capacitaciones/sesiones/public/${sesionId}/participante-status?nombre=${encodeURIComponent(nombreParticipante)}`
      );
      if (response.success && response.data?.evaluaciones) {
        setEvaluacionesStatus(response.data.evaluaciones);
      }
    } catch (err) {
      console.error('Error cargando status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Recargar estado cuando vuelve del player
  useEffect(() => {
    if (sesion && participanteRegistrado && nombre && !tipoEvaluacion) {
      cargarStatusEvaluaciones(sesion.id, nombre);
    }
  }, [sesion, participanteRegistrado, nombre, tipoEvaluacion]);

  const handleBuscar = async () => {
    if (!codigo.trim() || codigo.length !== 6) {
      setError('Ingresa un código de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiGet(`/calidad2/capacitaciones/sesiones/por-codigo/${codigo}`);
      if (response.success && response.data?.sesion) {
        setSesion(response.data.sesion);
      } else {
        setError('Código no válido o sesión no activa');
      }
    } catch (err) {
      setError(err.message || 'Código no válido o sesión no activa');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarParticipante = async () => {
    if (!nombre.trim()) {
      setError('Ingresa tu nombre');
      return;
    }
    setParticipanteRegistrado(true);
    await cargarStatusEvaluaciones(sesion.id, nombre);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  const handleKeyDownNombre = (e) => {
    if (e.key === 'Enter') {
      handleRegistrarParticipante();
    }
  };

  // Si hay una evaluación seleccionada, mostrar el player
  if (sesion && tipoEvaluacion && participanteRegistrado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-4 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <EvaluacionPlayer
            sesionId={sesion.id}
            tipo={tipoEvaluacion}
            participanteNombre={nombre}
            onClose={() => {
              // Solo resetear el tipo de evaluación para permitir hacer ambos tests
              setTipoEvaluacion(null);
              // Recargar el estado de evaluaciones
            }}
          />
        </div>
      </div>
    );
  }

  // Si hay sesión y participante registrado, mostrar opciones de evaluación
  if (sesion && participanteRegistrado) {
    const preTestStatus = evaluacionesStatus?.PRE_TEST;
    const postTestStatus = evaluacionesStatus?.POST_TEST;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold mb-1">¡Hola, {nombre}!</h2>
            <p className="text-white/80">{sesion.capacitacion?.tema}</p>
          </div>

          <CardContent className="p-6 space-y-4">
            {loadingStatus ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Pre-Test */}
                {preTestStatus ? (
                  preTestStatus.completada ? (
                    <div className="w-full h-14 flex items-center justify-center gap-2 bg-green-100 text-green-700 rounded-lg border-2 border-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Pre-Test Completado</span>
                      <Badge variant="outline" className="ml-2 bg-green-50">
                        {preTestStatus.preguntasRespondidas}/{preTestStatus.preguntasTotal}
                      </Badge>
                    </div>
                  ) : preTestStatus.iniciada ? (
                    <Button
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      onClick={() => setTipoEvaluacion('PRE_TEST')}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Continuar Pre-Test ({preTestStatus.preguntasRespondidas}/{preTestStatus.preguntasTotal})
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      onClick={() => setTipoEvaluacion('PRE_TEST')}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Iniciar Pre-Test
                    </Button>
                  )
                ) : (
                  <div className="w-full h-14 flex items-center justify-center gap-2 bg-gray-100 text-gray-500 rounded-lg">
                    <Lock className="h-5 w-5" />
                    <span>Pre-Test no disponible</span>
                  </div>
                )}

                {/* Post-Test */}
                {postTestStatus ? (
                  postTestStatus.completada ? (
                    <div className="w-full h-14 flex items-center justify-center gap-2 bg-green-100 text-green-700 rounded-lg border-2 border-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Post-Test Completado</span>
                      <Badge variant="outline" className="ml-2 bg-green-50">
                        {postTestStatus.preguntasRespondidas}/{postTestStatus.preguntasTotal}
                      </Badge>
                    </div>
                  ) : postTestStatus.iniciada ? (
                    <Button
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      onClick={() => setTipoEvaluacion('POST_TEST')}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Continuar Post-Test ({postTestStatus.preguntasRespondidas}/{postTestStatus.preguntasTotal})
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      onClick={() => setTipoEvaluacion('POST_TEST')}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Iniciar Post-Test
                    </Button>
                  )
                ) : (
                  <div className="w-full h-14 flex items-center justify-center gap-2 bg-gray-100 text-gray-500 rounded-lg">
                    <Lock className="h-5 w-5" />
                    <span>Post-Test no disponible</span>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje si ambos completados */}
            {preTestStatus?.completada && postTestStatus?.completada && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <p className="text-purple-700 font-medium">
                  🎉 ¡Has completado todas las evaluaciones!
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSesion(null);
                setCodigo('');
                setNombre('');
                setParticipanteRegistrado(false);
                setEvaluacionesStatus(null);
              }}
            >
              Salir
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si hay sesión encontrada, pedir nombre
  if (sesion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold mb-1">¡Sesión Encontrada!</h2>
            <p className="text-white/80">{sesion.capacitacion?.tema}</p>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{sesion.participantes || 0} participantes</span>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tu nombre completo</Label>
              <Input
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDownNombre}
                placeholder="Ingresa tu nombre"
                className="h-12 text-lg"
              />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>

            <Button
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              onClick={handleRegistrarParticipante}
              disabled={!nombre.trim()}
            >
              Continuar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSesion(null);
                setCodigo('');
              }}
            >
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pantalla de ingreso de código
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-8 text-white text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <Zap className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Evaluación</h1>
          <p className="text-white/80">Ingresa el código de la sesión</p>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Código de sesión</Label>
            <Input
              value={codigo}
              onChange={(e) => {
                // Extraer solo números del texto (soporta pegar "Código: 123456")
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCodigo(val);
                setError('');
              }}
              onPaste={(e) => {
                // Manejar pegado especial para extraer código del formato "Código: 123456\nLink: ..."
                try {
                  const pastedText = e.clipboardData?.getData('text');
                  if (pastedText) {
                    e.preventDefault(); // Solo prevenir si pudimos leer el texto
                    // Extraer solo los dígitos
                    const numbers = pastedText.replace(/\D/g, '').slice(0, 6);
                    if (numbers) {
                      setCodigo(numbers);
                      setError('');
                    }
                  }
                  // Si no hay pastedText, dejar que el navegador maneje el paste normalmente
                } catch (err) {
                  console.error('Error al pegar:', err);
                  // Dejar que el navegador maneje el paste normalmente
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="000000"
              className="h-16 text-center text-3xl font-bold tracking-[0.5em] font-mono"
              maxLength={6}
            />
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <Button
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            onClick={handleBuscar}
            disabled={loading || codigo.length !== 6}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Unirse
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Solicita el código al instructor de la capacitación
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
