'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Sparkles, Loader2, ChevronDown, ChevronUp, Check, X,
  AlertTriangle, Lightbulb, Zap
} from 'lucide-react';
import useAIAssistant from '@/hooks/useAIAssistant';

/**
 * Componente de sugerencias inline con IA
 * Se integra dentro de los formularios de consulta
 */
export default function AIInlineSuggestions({
  type = 'diagnosis', // 'diagnosis', 'vitals', 'prescription', 'soap'
  context = {},
  onApply,
  trigger, // Valor que dispara el análisis (ej: síntomas)
  debounceMs = 1500
}) {
  const {
    loading,
    isConfigured,
    getDiagnosisSuggestions,
    checkPrescription,
    analyzeVitals
  } = useAIAssistant();

  const [suggestions, setSuggestions] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [lastTrigger, setLastTrigger] = useState(null);

  // Función para obtener sugerencias según el tipo
  const fetchSuggestions = useCallback(async () => {
    if (!isConfigured || !trigger || dismissed) return;

    try {
      let result;

      switch (type) {
        case 'diagnosis':
          result = await getDiagnosisSuggestions(trigger, context);
          setSuggestions({
            type: 'diagnosis',
            content: result.data?.suggestions,
            toolsUsed: result.data?.toolsUsed
          });
          break;

        case 'prescription':
          result = await checkPrescription(trigger, context);
          setSuggestions({
            type: 'prescription',
            content: result.data?.analysis,
            toolsUsed: result.data?.toolsUsed
          });
          break;

        case 'vitals':
          result = await analyzeVitals(trigger, context.age);
          if (result?.data?.alerts?.length > 0) {
            setSuggestions({
              type: 'vitals',
              alerts: result.data.alerts,
              summary: result.data.summary
            });
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, [type, trigger, context, isConfigured, dismissed, getDiagnosisSuggestions, checkPrescription, analyzeVitals]);

  // Debounce y fetch de sugerencias
  useEffect(() => {
    if (!trigger || trigger === lastTrigger || dismissed) return;

    const timer = setTimeout(() => {
      setLastTrigger(trigger);
      fetchSuggestions();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [trigger, lastTrigger, dismissed, debounceMs, fetchSuggestions]);

  // No mostrar si no está configurado o fue descartado
  if (!isConfigured || dismissed) return null;

  // No mostrar si no hay sugerencias
  if (!suggestions && !loading) return null;

  const handleApply = (suggestion) => {
    if (onApply) {
      onApply(suggestion);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setSuggestions(null);
  };

  const handleRefresh = () => {
    setSuggestions(null);
    setLastTrigger(null);
    fetchSuggestions();
  };

  return (
    <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-3 my-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 text-violet-600 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-violet-600" />
          )}
          <span className="text-sm font-medium text-violet-900">
            {loading ? 'Analizando...' : 'Sugerencias IA'}
          </span>
          {suggestions?.toolsUsed?.length > 0 && (
            <Badge variant="outline" className="text-xs bg-white/50">
              {suggestions.toolsUsed.length} herramientas
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-violet-600"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-600"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content based on type */}
      {!loading && suggestions && (
        <div className={`mt-2 ${expanded ? '' : 'max-h-24 overflow-hidden'}`}>
          {/* Diagnosis Suggestions */}
          {type === 'diagnosis' && suggestions.content && (
            <div className="text-sm text-gray-700 prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{suggestions.content}</div>
            </div>
          )}

          {/* Vital Signs Alerts */}
          {type === 'vitals' && suggestions.alerts && (
            <div className="space-y-2">
              {suggestions.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    alert.urgency === 'CRITICAL' || alert.urgency === 'HIGH'
                      ? 'bg-red-100 text-red-800'
                      : alert.urgency === 'MEDIUM'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>{alert.message}</span>
                  <Badge variant="outline" className="ml-auto">
                    {alert.sign}: {alert.value}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Prescription Check */}
          {type === 'prescription' && suggestions.content && (
            <div className="text-sm text-gray-700">
              {suggestions.content}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {!loading && suggestions && (
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-violet-200">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Actualizar
          </Button>
          {onApply && type === 'diagnosis' && (
            <Button
              size="sm"
              onClick={() => handleApply(suggestions)}
              className="text-xs bg-violet-600 hover:bg-violet-700"
            >
              <Check className="h-3 w-3 mr-1" />
              Aplicar sugerencia
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Botón flotante para abrir el asistente IA
 */
export function AIAssistantButton({ onClick, hasAlerts = false }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg z-30"
    >
      <div className="relative">
        <Sparkles className="h-6 w-6 text-white" />
        {hasAlerts && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
    </Button>
  );
}

/**
 * Quick suggestion chips para acciones rápidas
 */
export function AIQuickSuggestions({ suggestions = [], onSelect }) {
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-violet-50 rounded-lg">
      <Lightbulb className="h-4 w-4 text-violet-600" />
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion)}
          className="text-xs bg-white hover:bg-violet-100 border-violet-200"
        >
          {suggestion.label}
        </Button>
      ))}
    </div>
  );
}
