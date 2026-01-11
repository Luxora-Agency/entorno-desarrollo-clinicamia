'use client';

import { useState, useCallback, useRef } from 'react';
import { apiGet, apiPost } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para interactuar con el Asistente IA Médico
 */
export default function useAIAssistant() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(null);
  const conversationIdRef = useRef(null);

  /**
   * Verificar estado del servicio IA
   */
  const checkStatus = useCallback(async () => {
    try {
      const response = await apiGet('/ai-assistant/status');
      setStatus(response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking AI status:', error);
      setStatus({ configured: false, error: error.message });
      return null;
    }
  }, []);

  /**
   * Enviar mensaje al asistente
   */
  const sendMessage = useCallback(async (content, context = {}) => {
    setLoading(true);

    // Agregar mensaje del usuario
    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    // Generar conversationId si no existe
    if (!conversationIdRef.current) {
      conversationIdRef.current = crypto.randomUUID();
    }

    try {
      const response = await apiPost('/ai-assistant/chat', {
        messages: [...messages, userMessage],
        context,
        conversationId: conversationIdRef.current
      });

      // Agregar respuesta del asistente
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        toolsUsed: response.data.toolsUsed
      };
      setMessages(prev => [...prev, assistantMessage]);

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error del Asistente IA',
        description: error.message || 'No se pudo procesar el mensaje'
      });
      // Remover mensaje del usuario en caso de error
      setMessages(prev => prev.slice(0, -1));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [messages, toast]);

  /**
   * Enviar mensaje con streaming
   */
  const sendMessageStream = useCallback(async (content, context = {}, onChunk) => {
    setStreaming(true);

    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    if (!conversationIdRef.current) {
      conversationIdRef.current = crypto.randomUUID();
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/ai-assistant/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context
        })
      });

      if (!response.ok) {
        throw new Error('Error en streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      // Agregar mensaje del asistente vacío
      setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                newMessages[lastIdx] = { ...newMessages[lastIdx], content: fullContent };
                return newMessages;
              });
              if (onChunk) onChunk(parsed.content);
            }
          } catch (e) {
            // Ignorar errores de parsing
          }
        }
      }

      // Finalizar streaming
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIdx = newMessages.length - 1;
        newMessages[lastIdx] = { ...newMessages[lastIdx], streaming: false };
        return newMessages;
      });

      return { content: fullContent };
    } catch (error) {
      console.error('Error in streaming:', error);
      toast({
        variant: 'destructive',
        title: 'Error del Asistente IA',
        description: 'Error en la conexión de streaming'
      });
      throw error;
    } finally {
      setStreaming(false);
    }
  }, [messages, toast]);

  /**
   * Obtener sugerencias de diagnóstico
   */
  const getDiagnosisSuggestions = useCallback(async (symptoms, context = {}) => {
    setLoading(true);
    try {
      const response = await apiPost('/ai-assistant/diagnosis-suggestions', {
        symptoms,
        vitals: context.vitals,
        history: context.history,
        patientContext: context.patient
      });
      return response.data;
    } catch (error) {
      console.error('Error getting diagnosis suggestions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron obtener sugerencias de diagnóstico'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Verificar seguridad de prescripción
   */
  const checkPrescription = useCallback(async (medications, patientContext = {}) => {
    setLoading(true);
    try {
      const response = await apiPost('/ai-assistant/check-prescription', {
        medications,
        currentMedications: patientContext.currentMedications,
        allergies: patientContext.allergies,
        age: patientContext.age,
        weight: patientContext.weight
      });
      return response.data;
    } catch (error) {
      console.error('Error checking prescription:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo verificar la prescripción'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Analizar signos vitales
   */
  const analyzeVitals = useCallback(async (vitals, age) => {
    try {
      const response = await apiPost('/ai-assistant/analyze-vitals', { vitals, age });
      return response.data;
    } catch (error) {
      console.error('Error analyzing vitals:', error);
      return null;
    }
  }, []);

  /**
   * Obtener contexto clínico completo del paciente
   */
  const getPatientContext = useCallback(async (pacienteId) => {
    if (!pacienteId) return null;
    try {
      const response = await apiGet(`/ai-assistant/patient-context/${pacienteId}`);
      return response;
    } catch (error) {
      // Silently fail - AI context is optional
      console.warn('AI patient context not available:', error.message);
      return null;
    }
  }, []);

  /**
   * Generar nota SOAP
   */
  const generateSOAP = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await apiPost('/ai-assistant/generate-soap', {
        chiefComplaint: data.chiefComplaint,
        symptoms: data.symptoms,
        vitals: data.vitals,
        physicalExam: data.physicalExam,
        history: data.history,
        currentSoap: data.currentSoap,
        patientContext: data.patient
      });
      return response.data;
    } catch (error) {
      console.error('Error generating SOAP:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar la nota SOAP'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Generar resumen de consulta
   */
  const generateSummary = useCallback(async (consultationData) => {
    setLoading(true);
    try {
      const response = await apiPost('/ai-assistant/consultation-summary', {
        consultationData
      });
      return response.data;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpiar conversación
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
  }, []);

  /**
   * Agregar mensaje predefinido del sistema
   */
  const addSystemMessage = useCallback((content) => {
    setMessages(prev => [...prev, { role: 'system', content, isAlert: true }]);
  }, []);

  return {
    // Estado
    loading,
    streaming,
    messages,
    status,
    isConfigured: status?.configured ?? false,

    // Acciones de chat
    sendMessage,
    sendMessageStream,
    clearConversation,
    addSystemMessage,
    checkStatus,

    // Funciones específicas
    getDiagnosisSuggestions,
    checkPrescription,
    analyzeVitals,
    generateSOAP,
    generateSummary,
    getPatientContext
  };
}
