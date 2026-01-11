import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/services/api';

export function useEvaluacionPlayer(sesionId, tipo) {
  const [evaluacion, setEvaluacion] = useState(null);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [comparativo, setComparativo] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [participante, setParticipante] = useState({ id: null, nombre: '' });
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const { toast } = useToast();

  // Cargar evaluación
  const loadEvaluacion = useCallback(async () => {
    if (!sesionId || !tipo) return null;

    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/capacitaciones/sesiones/${sesionId}/evaluacion/${tipo}`);
      const eval_ = response.data?.evaluacion || response.data;
      setEvaluacion(eval_);
      setPreguntaActual(0);
      setRespuestas({});
      setFinalizado(false);
      return eval_;
    } catch (error) {
      console.error('Error loading evaluacion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cargar la evaluación.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [sesionId, tipo, toast]);

  // Timer por pregunta
  useEffect(() => {
    if (!evaluacion || finalizado) return;

    const pregunta = evaluacion.preguntas?.[preguntaActual];
    if (pregunta?.tiempoSegundos) {
      setTiempoRestante(pregunta.tiempoSegundos);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Auto-avanzar si se acaba el tiempo
            handleSiguiente();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTiempoRestante(null);
      startTimeRef.current = Date.now();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [preguntaActual, evaluacion, finalizado]);

  // Seleccionar opción
  const seleccionarOpcion = useCallback((opcionId) => {
    if (!evaluacion || finalizado) return;

    const pregunta = evaluacion.preguntas[preguntaActual];
    if (!pregunta) return;

    setRespuestas((prev) => {
      const preguntaId = pregunta.id;
      const current = prev[preguntaId] || [];

      if (pregunta.tipo === 'SELECCION_MULTIPLE') {
        // Toggle para selección múltiple
        if (current.includes(opcionId)) {
          return { ...prev, [preguntaId]: current.filter((id) => id !== opcionId) };
        } else {
          return { ...prev, [preguntaId]: [...current, opcionId] };
        }
      } else {
        // Single selection
        return { ...prev, [preguntaId]: [opcionId] };
      }
    });
  }, [evaluacion, preguntaActual, finalizado]);

  // Enviar respuesta individual
  const enviarRespuesta = useCallback(async () => {
    if (!evaluacion || !participante.nombre) return null;

    const pregunta = evaluacion.preguntas[preguntaActual];
    if (!pregunta) return null;

    const opcionesSeleccionadas = respuestas[pregunta.id] || [];
    if (opcionesSeleccionadas.length === 0) {
      toast({
        title: 'Selecciona una opción',
        description: 'Debes seleccionar al menos una respuesta.',
        variant: 'destructive',
      });
      return null;
    }

    const tiempoRespuestaMs = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : null;

    try {
      setEnviando(true);
      const response = await apiPost(`/calidad2/capacitaciones/sesiones/${sesionId}/respuestas`, {
        preguntaId: pregunta.id,
        participanteId: participante.id,
        nombreParticipante: participante.nombre,
        opcionesSeleccionadas,
        tiempoRespuestaMs,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending respuesta:', error);
      // Don't show error for duplicate - just continue
      if (!error.message?.includes('Ya respondiste')) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo enviar la respuesta.',
          variant: 'destructive',
        });
      }
      return null;
    } finally {
      setEnviando(false);
    }
  }, [evaluacion, preguntaActual, respuestas, participante, sesionId, toast]);

  // Siguiente pregunta
  const handleSiguiente = useCallback(async () => {
    if (!evaluacion) return;

    // Enviar respuesta actual
    await enviarRespuesta();

    // Limpiar timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Verificar si es la última pregunta
    if (preguntaActual >= evaluacion.preguntas.length - 1) {
      setFinalizado(true);
      toast({
        title: 'Evaluación completada',
        description: 'Has respondido todas las preguntas.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
    } else {
      setPreguntaActual((prev) => prev + 1);
    }
  }, [evaluacion, preguntaActual, enviarRespuesta, toast]);

  // Cargar resultados
  const loadResultados = useCallback(async () => {
    if (!sesionId) return null;

    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/capacitaciones/sesiones/${sesionId}/resultados`);
      setResultados(response.data?.resultados || response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading resultados:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sesionId]);

  // Cargar comparativo
  const loadComparativo = useCallback(async () => {
    if (!sesionId) return null;

    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/capacitaciones/sesiones/${sesionId}/comparativo`);
      setComparativo(response.data?.comparativo || response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading comparativo:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sesionId]);

  // Cargar ranking
  const loadRanking = useCallback(async () => {
    if (!sesionId) return null;

    try {
      const response = await apiGet(`/calidad2/capacitaciones/sesiones/${sesionId}/ranking`);
      setRanking(response.data?.ranking || []);
      return response.data;
    } catch (error) {
      console.error('Error loading ranking:', error);
      return [];
    }
  }, [sesionId]);

  // Reiniciar
  const reiniciar = useCallback(() => {
    setPreguntaActual(0);
    setRespuestas({});
    setFinalizado(false);
    setResultados(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Getters calculados
  const pregunta = evaluacion?.preguntas?.[preguntaActual] || null;
  const totalPreguntas = evaluacion?.preguntas?.length || 0;
  const progreso = totalPreguntas > 0 ? ((preguntaActual + 1) / totalPreguntas) * 100 : 0;
  const respuestaActual = pregunta ? respuestas[pregunta.id] || [] : [];

  return {
    // State
    evaluacion,
    pregunta,
    preguntaActual,
    totalPreguntas,
    progreso,
    respuestas,
    respuestaActual,
    tiempoRestante,
    resultados,
    comparativo,
    ranking,
    loading,
    enviando,
    finalizado,
    participante,

    // Actions
    setParticipante,
    loadEvaluacion,
    seleccionarOpcion,
    handleSiguiente,
    loadResultados,
    loadComparativo,
    loadRanking,
    reiniciar,
  };
}
