'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, ArrowRight, Trophy, BarChart } from 'lucide-react';
import { useEvaluacionPlayer } from '@/hooks/useEvaluacionPlayer';

const COLORES = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

export default function EvaluacionPlayer({ sesionId, tipo, onClose }) {
  const [nombre, setNombre] = useState('');
  const [started, setStarted] = useState(false);

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
  } = useEvaluacionPlayer(sesionId, tipo);

  useEffect(() => {
    loadEvaluacion();
  }, [loadEvaluacion]);

  useEffect(() => {
    if (finalizado) {
      loadResultados();
      loadComparativo();
    }
  }, [finalizado, loadResultados, loadComparativo]);

  const handleStart = () => {
    if (!nombre.trim()) return;
    setParticipante({ id: null, nombre });
    setStarted(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando evaluación...</p>
        </CardContent>
      </Card>
    );
  }

  if (!evaluacion) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No hay {tipo === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'} configurado</p>
          <Button variant="outline" className="mt-4" onClick={onClose}>
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Entry screen
  if (!started) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>{evaluacion.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p>{evaluacion.preguntas?.length || 0} preguntas</p>
            {evaluacion.tiempoLimiteMin && <p>{evaluacion.tiempoLimiteMin} minutos</p>}
          </div>
          <div className="space-y-2">
            <Label>Tu nombre</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre completo"
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
          </div>
          <Button className="w-full" onClick={handleStart} disabled={!nombre.trim()}>
            Comenzar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Results screen
  if (finalizado) {
    const miResultado = resultados?.participantes?.find(
      p => p.nombreParticipante === participante.nombre
    );
    const resultado = tipo === 'PRE_TEST' ? miResultado?.preTest : miResultado?.postTest;

    return (
      <Card>
        <CardHeader className="text-center">
          <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
          <CardTitle>Evaluación Completada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {resultado && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold">{resultado.correctas}</div>
                  <p className="text-xs text-muted-foreground">Correctas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold">{resultado.total}</div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold text-green-600">{resultado.porcentaje}%</div>
                  <p className="text-xs text-muted-foreground">Aciertos</p>
                </CardContent>
              </Card>
            </div>
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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Pre-Test</span>
                  <span className="font-medium">{comparativo.preTest?.porcentaje || 0}%</span>
                </div>
                <Progress value={comparativo.preTest?.porcentaje || 0} className="mb-4" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Post-Test</span>
                  <span className="font-medium">{comparativo.postTest?.porcentaje || 0}%</span>
                </div>
                <Progress value={comparativo.postTest?.porcentaje || 0} />
                {comparativo.mejora > 0 && (
                  <Badge className="mt-4 bg-green-100 text-green-800">
                    Mejora: +{comparativo.mejora}%
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          <Button className="w-full" onClick={onClose}>
            Finalizar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Question screen (Kahoot style)
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-primary text-primary-foreground py-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            Pregunta {preguntaActual + 1} de {totalPreguntas}
          </Badge>
          {tiempoRestante !== null && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg">{tiempoRestante}s</span>
            </div>
          )}
        </div>
        <Progress value={progreso} className="mt-2 bg-primary-foreground/20" />
      </CardHeader>

      <CardContent className="p-6">
        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-medium">{pregunta?.texto}</h2>
          {pregunta?.imagenUrl && (
            <img src={pregunta.imagenUrl} alt="" className="mt-4 max-h-48 mx-auto rounded" />
          )}
        </div>

        {/* Options (Kahoot style grid) */}
        <div className="grid grid-cols-2 gap-3">
          {pregunta?.opciones?.map((opcion, idx) => {
            const isSelected = respuestaActual.includes(opcion.id);
            const colorClass = COLORES[idx % COLORES.length];

            return (
              <Button
                key={opcion.id}
                variant="outline"
                className={`h-20 text-lg font-medium transition-all ${colorClass} text-white hover:opacity-90 ${isSelected ? 'ring-4 ring-offset-2 ring-primary' : ''}`}
                onClick={() => seleccionarOpcion(opcion.id)}
              >
                {opcion.texto}
                {isSelected && <CheckCircle className="ml-2 h-5 w-5" />}
              </Button>
            );
          })}
        </div>

        {/* Next button */}
        <div className="mt-6 flex justify-end">
          <Button
            size="lg"
            onClick={handleSiguiente}
            disabled={enviando || respuestaActual.length === 0}
          >
            {preguntaActual >= totalPreguntas - 1 ? 'Finalizar' : 'Siguiente'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
