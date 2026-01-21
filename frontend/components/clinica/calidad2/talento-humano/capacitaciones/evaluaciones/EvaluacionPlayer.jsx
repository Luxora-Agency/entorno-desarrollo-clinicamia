'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, ArrowRight, Trophy, BarChart, Zap, Medal, Timer, Users } from 'lucide-react';
import { useEvaluacionPlayer } from '@/hooks/useEvaluacionPlayer';
import { cn } from '@/lib/utils';

const COLORES_KAHOOT = [
  { bg: 'bg-red-500 hover:bg-red-600', border: 'border-red-600', shadow: 'shadow-red-500/50' },
  { bg: 'bg-blue-500 hover:bg-blue-600', border: 'border-blue-600', shadow: 'shadow-blue-500/50' },
  { bg: 'bg-yellow-500 hover:bg-yellow-600', border: 'border-yellow-600', shadow: 'shadow-yellow-500/50' },
  { bg: 'bg-green-500 hover:bg-green-600', border: 'border-green-600', shadow: 'shadow-green-500/50' },
];

const ICONOS_OPCION = ['▲', '◆', '●', '■'];

export default function EvaluacionPlayer({ sesionId, tipo, onClose, participanteNombre }) {
  const [nombre, setNombre] = useState(participanteNombre || '');
  const [started, setStarted] = useState(!!participanteNombre); // Auto-start si ya tiene nombre
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);
  const [lastPregunta, setLastPregunta] = useState(null); // Para mostrar respuestas correctas en feedback
  const [lastRespuestaUsuario, setLastRespuestaUsuario] = useState([]); // Respuestas del usuario
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [puntajeActual, setPuntajeActual] = useState(0);
  const [streak, setStreak] = useState(0);

  const {
    evaluacion,
    pregunta,
    preguntaActual,
    totalPreguntas,
    progreso,
    respuestaActual,
    tiempoRestante,
    resultados,
    comparativo,
    ranking,
    loading,
    enviando,
    finalizado,
    participante,
    setParticipante,
    loadEvaluacion,
    seleccionarOpcion,
    handleSiguiente,
    loadResultados,
    loadComparativo,
    loadRanking,
  } = useEvaluacionPlayer(sesionId, tipo);

  useEffect(() => {
    loadEvaluacion();
  }, [loadEvaluacion]);

  // Auto-set participante si viene con nombre
  useEffect(() => {
    if (participanteNombre && !participante.nombre) {
      setParticipante({ id: null, nombre: participanteNombre });
    }
  }, [participanteNombre, participante.nombre, setParticipante]);

  // Registrar el tiempo de inicio de cada pregunta
  useEffect(() => {
    if (started && pregunta && !finalizado && !showFeedback && !showLeaderboard) {
      window._questionStartTime = Date.now();
    }
  }, [preguntaActual, started, pregunta, finalizado, showFeedback, showLeaderboard]);

  useEffect(() => {
    if (finalizado) {
      loadResultados();
      loadComparativo();
      loadRanking();
    }
  }, [finalizado, loadResultados, loadComparativo, loadRanking]);

  const handleStart = () => {
    if (!nombre.trim()) return;
    setParticipante({ id: null, nombre });
    setStarted(true);
  };

  // Manejar siguiente con feedback - obtener resultado del backend
  const handleNext = useCallback(async () => {
    if (respuestaActual.length === 0) return;

    // Enviar respuesta y obtener resultado del backend
    const tiempoRespuestaMs = Date.now() - (window._questionStartTime || Date.now());

    try {
      // Usar ruta pública que no requiere autenticación
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/calidad2/capacitaciones/sesiones/public/${sesionId}/respuestas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preguntaId: pregunta.id,
          participanteId: participante.id,
          nombreParticipante: participante.nombre,
          opcionesSeleccionadas: respuestaActual,
          tiempoRespuestaMs,
        }),
      });

      const result = await response.json();
      // El backend devuelve { data: { respuesta: { esCorrecta, puntaje, ... } } }
      const respuesta = result.data?.respuesta || result.data || {};
      const esCorrecta = respuesta.esCorrecta || false;
      const puntajeObtenido = respuesta.puntaje || 0;

      // Guardar la pregunta actual y respuestas del usuario para mostrar en feedback
      setLastPregunta(pregunta);
      setLastRespuestaUsuario(respuestaActual);
      setLastAnswerCorrect(esCorrecta);
      setShowFeedback(true);

      if (esCorrecta) {
        setStreak(prev => prev + 1);
        setPuntajeActual(prev => prev + puntajeObtenido);
      } else {
        setStreak(0);
      }

      // Mostrar feedback por 1.5 segundos
      setTimeout(async () => {
        setShowFeedback(false);

        // Verificar si es la última pregunta
        if (preguntaActual >= totalPreguntas - 1) {
          // Finalizar evaluación
          await handleSiguiente();
        } else {
          // Mostrar leaderboard brevemente después de cada pregunta
          await loadRanking();
          setShowLeaderboard(true);
          setTimeout(() => {
            setShowLeaderboard(false);
            handleSiguiente();
          }, 2500);
        }
      }, 1500);
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      // Continuar aunque haya error
      setShowFeedback(false);
      handleSiguiente();
    }
  }, [respuestaActual, pregunta, sesionId, participante, handleSiguiente, preguntaActual, totalPreguntas, loadRanking]);

  if (loading) {
    return (
      <Card className="border-0 shadow-2xl">
        <CardContent className="py-16 text-center">
          <div className="relative">
            <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-lg text-muted-foreground font-medium">Preparando evaluación...</p>
        </CardContent>
      </Card>
    );
  }

  if (!evaluacion) {
    return (
      <Card className="border-0 shadow-2xl">
        <CardContent className="py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg mb-4">No hay {tipo === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'} configurado</p>
          <Button variant="outline" onClick={onClose}>
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Pantalla de inicio
  if (!started) {
    return (
      <Card className="max-w-md mx-auto border-0 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8 text-white text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <Zap className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{evaluacion.nombre}</h2>
          <div className="flex justify-center gap-4 text-white/80">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {evaluacion.preguntas?.length || 0} preguntas
            </span>
            {evaluacion.tiempoLimiteMin && (
              <span className="flex items-center gap-1">
                <Timer className="h-4 w-4" />
                {evaluacion.tiempoLimiteMin} min
              </span>
            )}
          </div>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tu nombre</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre completo"
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              className="h-12 text-lg"
            />
          </div>
          <Button
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            onClick={handleStart}
            disabled={!nombre.trim()}
          >
            <Zap className="mr-2 h-5 w-5" />
            ¡Comenzar!
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Pantalla de feedback
  if (showFeedback) {
    // Obtener las opciones correctas de la última pregunta
    const opcionesCorrectas = lastPregunta?.opciones?.filter(o => o.esCorrecta) || [];

    return (
      <Card className="border-0 shadow-2xl overflow-hidden">
        <div className={cn(
          "min-h-[400px] flex flex-col items-center justify-center p-8 transition-all duration-500",
          lastAnswerCorrect
            ? "bg-gradient-to-br from-green-400 to-emerald-600"
            : "bg-gradient-to-br from-red-400 to-rose-600"
        )}>
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center mb-4 animate-bounce",
            lastAnswerCorrect ? "bg-white/20" : "bg-white/20"
          )}>
            {lastAnswerCorrect ? (
              <CheckCircle className="h-16 w-16 text-white" />
            ) : (
              <XCircle className="h-16 w-16 text-white" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {lastAnswerCorrect ? '¡Correcto!' : 'Incorrecto'}
          </h2>

          {/* Mostrar respuestas correctas cuando se equivoca */}
          {!lastAnswerCorrect && opcionesCorrectas.length > 0 && (
            <div className="mt-4 bg-white/10 backdrop-blur rounded-lg p-4 max-w-md w-full">
              <p className="text-white/90 text-sm mb-2 font-medium">
                {opcionesCorrectas.length > 1 ? 'Respuestas correctas:' : 'Respuesta correcta:'}
              </p>
              <div className="space-y-2">
                {opcionesCorrectas.map((opcion, idx) => (
                  <div key={opcion.id} className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                    <span className="text-lg font-semibold">{opcion.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lastAnswerCorrect && streak > 1 && (
            <Badge className="bg-white/20 text-white text-lg px-4 py-2 animate-pulse mt-4">
              🔥 Racha de {streak}
            </Badge>
          )}
          <div className="mt-4 text-white/80">
            <span className="text-2xl font-semibold">{puntajeActual} puntos</span>
          </div>
        </div>
      </Card>
    );
  }

  // Pantalla de leaderboard intermedio
  if (showLeaderboard && ranking.length > 0) {
    const miPosicion = ranking.findIndex(r => r.nombreParticipante === participante.nombre) + 1;

    return (
      <Card className="border-0 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-yellow-300" />
            <h2 className="text-2xl font-bold">Clasificación</h2>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {ranking.slice(0, 5).map((r, idx) => {
              const esYo = r.nombreParticipante === participante.nombre;
              return (
                <div
                  key={r.nombreParticipante}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-all",
                    esYo ? "bg-primary/10 border-2 border-primary" : "bg-muted/50",
                    idx === 0 && "bg-yellow-50 border-2 border-yellow-400"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      idx === 0 ? "bg-yellow-400 text-yellow-900" :
                        idx === 1 ? "bg-gray-300 text-gray-700" :
                          idx === 2 ? "bg-amber-600 text-white" :
                            "bg-muted text-muted-foreground"
                    )}>
                      {idx < 3 ? <Medal className="h-5 w-5" /> : idx + 1}
                    </div>
                    <span className={cn("font-medium", esYo && "text-primary")}>
                      {r.nombreParticipante} {esYo && "(Tú)"}
                    </span>
                  </div>
                  <span className="font-bold text-lg">{r.puntajeTotal} pts</span>
                </div>
              );
            })}
          </div>
          {miPosicion > 5 && (
            <div className="mt-4 pt-4 border-t text-center text-muted-foreground">
              Tu posición: <span className="font-bold text-primary">{miPosicion}°</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Pantalla de resultados finales
  if (finalizado) {
    const miResultado = resultados?.participantes?.find(
      p => p.nombreParticipante === participante.nombre
    );
    const resultado = tipo === 'PRE_TEST' ? miResultado?.preTest : miResultado?.postTest;
    const miPosicion = ranking.findIndex(r => r.nombreParticipante === participante.nombre) + 1;

    return (
      <Card className="border-0 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 text-white text-center">
          <div className="relative inline-block">
            <Trophy className="h-20 w-20 mx-auto mb-4 animate-bounce" />
            {miPosicion <= 3 && (
              <div className="absolute -top-2 -right-2 bg-white rounded-full p-2">
                <Medal className={cn(
                  "h-6 w-6",
                  miPosicion === 1 ? "text-yellow-500" :
                    miPosicion === 2 ? "text-gray-400" :
                      "text-amber-600"
                )} />
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold mb-2">¡Evaluación Completada!</h2>
          {miPosicion > 0 && (
            <p className="text-xl text-white/90">Posición: {miPosicion}° lugar</p>
          )}
        </div>

        <CardContent className="p-6 space-y-6">
          {resultado && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-4 text-center">
                  <div className="text-4xl font-bold text-green-600">{resultado.correctas}</div>
                  <p className="text-sm text-green-700 font-medium">Correctas</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="pt-4 text-center">
                  <div className="text-4xl font-bold text-blue-600">{resultado.total}</div>
                  <p className="text-sm text-blue-700 font-medium">Total</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="pt-4 text-center">
                  <div className="text-4xl font-bold text-purple-600">{resultado.porcentaje}%</div>
                  <p className="text-sm text-purple-700 font-medium">Aciertos</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Leaderboard final */}
          {ranking.length > 0 && (
            <Card>
              <CardHeader className="py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Clasificación Final
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {ranking.slice(0, 10).map((r, idx) => {
                    const esYo = r.nombreParticipante === participante.nombre;
                    return (
                      <div
                        key={r.nombreParticipante}
                        className={cn(
                          "flex items-center justify-between p-2 rounded",
                          esYo ? "bg-primary/10 font-bold" : idx % 2 === 0 ? "bg-muted/30" : ""
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            idx === 0 ? "bg-yellow-400 text-yellow-900" :
                              idx === 1 ? "bg-gray-300 text-gray-700" :
                                idx === 2 ? "bg-amber-600 text-white" :
                                  "bg-muted"
                          )}>
                            {idx + 1}
                          </span>
                          <span className="text-sm">{r.nombreParticipante}</span>
                          {esYo && <Badge variant="outline" className="text-xs">Tú</Badge>}
                        </div>
                        <span className="text-sm font-semibold">{r.puntajeTotal} pts</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {comparativo && tipo === 'POST_TEST' && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Comparativo Pre vs Post
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Pre-Test</span>
                      <span className="font-medium">{comparativo.preTest?.porcentaje || 0}%</span>
                    </div>
                    <Progress value={comparativo.preTest?.porcentaje || 0} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Post-Test</span>
                      <span className="font-medium">{comparativo.postTest?.porcentaje || 0}%</span>
                    </div>
                    <Progress value={comparativo.postTest?.porcentaje || 0} className="h-3" />
                  </div>
                </div>
                {comparativo.mejora > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
                    <Badge className="bg-green-500 text-white text-lg px-4 py-1">
                      📈 Mejora: +{comparativo.mejora}%
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button className="w-full h-12 text-lg" onClick={onClose}>
            Finalizar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Pantalla de pregunta (estilo Kahoot)
  const tiempoTotal = pregunta?.tiempoSegundos || 30;
  const porcentajeTiempo = tiempoRestante !== null ? (tiempoRestante / tiempoTotal) * 100 : 100;

  return (
    <Card className="border-0 shadow-2xl overflow-hidden">
      {/* Header con progreso y timer */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-sm px-3 py-1">
              Pregunta {preguntaActual + 1} de {totalPreguntas}
            </Badge>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                <Zap className="h-4 w-4" />
                <span className="font-bold">{puntajeActual}</span>
              </div>
              {streak > 1 && (
                <Badge className="bg-orange-500 border-0 animate-pulse">
                  🔥 {streak}
                </Badge>
              )}
            </div>
          </div>
          <Progress value={progreso} className="h-2 bg-white/20" />
        </div>

        {/* Timer circular */}
        {tiempoRestante !== null && (
          <div className="pb-4 px-4">
            <div className="flex items-center justify-center">
              <div className={cn(
                "relative w-20 h-20 rounded-full flex items-center justify-center border-4 transition-colors",
                porcentajeTiempo > 50 ? "border-white bg-white/10" :
                  porcentajeTiempo > 25 ? "border-yellow-300 bg-yellow-500/20" :
                    "border-red-300 bg-red-500/30 animate-pulse"
              )}>
                <div className="text-center">
                  <Clock className={cn(
                    "h-5 w-5 mx-auto mb-1",
                    porcentajeTiempo <= 25 && "animate-bounce"
                  )} />
                  <span className="text-2xl font-bold font-mono">{tiempoRestante}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-6">
        {/* Pregunta */}
        <div className="text-center mb-6">
          {/* Badge del tipo de pregunta */}
          <div className="flex justify-center mb-3">
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-3 py-1",
                pregunta?.tipo === 'VERDADERO_FALSO' && "bg-green-50 border-green-300 text-green-700",
                pregunta?.tipo === 'SELECCION_MULTIPLE' && "bg-blue-50 border-blue-300 text-blue-700",
                pregunta?.tipo === 'OPCION_MULTIPLE' && "bg-amber-50 border-amber-300 text-amber-700"
              )}
            >
              {pregunta?.tipo === 'VERDADERO_FALSO' && '✓/✗ Verdadero o Falso'}
              {pregunta?.tipo === 'SELECCION_MULTIPLE' && '☑ Selecciona varias respuestas'}
              {pregunta?.tipo === 'OPCION_MULTIPLE' && '○ Selecciona una respuesta'}
            </Badge>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 leading-relaxed">{pregunta?.texto}</h2>
          {pregunta?.imagenUrl && (
            <img src={pregunta.imagenUrl} alt="" className="mt-4 max-h-48 mx-auto rounded-lg shadow" />
          )}
        </div>

        {/* Opciones - Diferente diseño según el tipo */}
        {pregunta?.tipo === 'VERDADERO_FALSO' ? (
          /* Diseño especial para Verdadero/Falso - Dos botones grandes */
          <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
            {pregunta?.opciones?.map((opcion) => {
              const isSelected = respuestaActual.includes(opcion.id);
              const textoLower = opcion.texto?.toLowerCase()?.trim() || '';
              const esVerdadero = textoLower === 'verdadero' || textoLower === 'true' || textoLower === 'v';

              return (
                <button
                  key={opcion.id}
                  type="button"
                  className={cn(
                    "flex flex-col items-center justify-center h-auto min-h-[120px] p-6 text-xl font-bold text-white transition-all duration-200 border-b-4 rounded-lg",
                    esVerdadero
                      ? "bg-green-500 hover:bg-green-600 border-green-700"
                      : "bg-red-500 hover:bg-red-600 border-red-700",
                    isSelected && "ring-4 ring-white ring-offset-2 scale-105 shadow-lg"
                  )}
                  onClick={() => seleccionarOpcion(opcion.id)}
                >
                  <span className="text-4xl mb-2">{esVerdadero ? '✓' : '✗'}</span>
                  <span>{opcion.texto}</span>
                  {isSelected && <CheckCircle className="h-6 w-6 mt-2" />}
                </button>
              );
            })}
          </div>
        ) : (
          /* Diseño Kahoot estándar para Opción Múltiple y Selección Múltiple */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pregunta?.opciones?.map((opcion, idx) => {
              const isSelected = respuestaActual.includes(opcion.id);
              const color = COLORES_KAHOOT[idx % COLORES_KAHOOT.length];
              const icono = ICONOS_OPCION[idx % ICONOS_OPCION.length];

              return (
                <Button
                  key={opcion.id}
                  variant="ghost"
                  className={cn(
                    "h-auto min-h-[80px] p-4 text-lg font-semibold text-white transition-all duration-200 border-b-4",
                    color.bg,
                    color.border,
                    isSelected && `ring-4 ring-white ring-offset-2 scale-105 ${color.shadow} shadow-lg`,
                    !isSelected && "hover:scale-102 hover:shadow-lg"
                  )}
                  onClick={() => seleccionarOpcion(opcion.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl opacity-70">{icono}</span>
                    <span className="flex-1 text-left">{opcion.texto}</span>
                    {isSelected && (
                      pregunta?.tipo === 'SELECCION_MULTIPLE'
                        ? <CheckCircle className="h-6 w-6 flex-shrink-0" />
                        : <CheckCircle className="h-6 w-6 flex-shrink-0" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        )}

        {/* Indicador para Selección Múltiple */}
        {pregunta?.tipo === 'SELECCION_MULTIPLE' && (
          <div className="mt-4 text-center">
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 px-4 py-2">
              {respuestaActual.length > 0
                ? `${respuestaActual.length} opción(es) seleccionada(s)`
                : 'Puedes seleccionar varias opciones'
              }
            </Badge>
          </div>
        )}

        {/* Botón siguiente */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            className={cn(
              "h-14 px-8 text-lg font-bold transition-all",
              respuestaActual.length > 0
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                : "bg-gray-300 text-gray-500"
            )}
            onClick={handleNext}
            disabled={enviando || respuestaActual.length === 0}
          >
            {enviando ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : preguntaActual >= totalPreguntas - 1 ? (
              <>
                <Trophy className="mr-2 h-5 w-5" />
                Finalizar
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
