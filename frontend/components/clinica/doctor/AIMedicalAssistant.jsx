'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bot, Send, Loader2, Sparkles, X, Maximize2, Minimize2,
  Stethoscope, Pill, AlertTriangle, FileText, Lightbulb,
  ThumbsUp, ThumbsDown, Copy, RefreshCw, ChevronRight
} from 'lucide-react';
import useAIAssistant from '@/hooks/useAIAssistant';
import ReactMarkdown from 'react-markdown';

/**
 * Panel de Asistente IA Médico
 * Se muestra como panel lateral flotante durante la consulta
 */
export default function AIMedicalAssistant({
  isOpen,
  onClose,
  patient,
  cita,
  consultaData,
  onSuggestionApply
}) {
  const {
    loading,
    streaming,
    messages,
    isConfigured,
    sendMessage,
    sendMessageStream,
    clearConversation,
    checkStatus,
    getDiagnosisSuggestions,
    checkPrescription,
    analyzeVitals,
    generateSOAP,
    getPatientContext
  } = useAIAssistant();

  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [vitalAlerts, setVitalAlerts] = useState(null);
  const [patientContext, setPatientContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Verificar estado al montar
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Cargar contexto completo del paciente cuando se abre el panel
  useEffect(() => {
    if (isOpen && patient?.id && !patientContext && isConfigured) {
      setContextLoading(true);
      getPatientContext(patient.id)
        .then(result => {
          if (result?.data) {
            setPatientContext(result.data);
          }
        })
        .catch(() => {
          // Silently fail - context is optional
        })
        .finally(() => setContextLoading(false));
    }
  }, [isOpen, patient?.id, getPatientContext, patientContext, isConfigured]);

  // Scroll automático a nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Analizar signos vitales cuando cambien
  useEffect(() => {
    if (consultaData?.vitales && patient && isConfigured) {
      analyzeVitals(consultaData.vitales, patient.edad)
        .then(result => {
          if (result?.data?.alerts?.length > 0) {
            setVitalAlerts(result.data);
          }
        })
        .catch(() => {
          // Silently fail - analysis is optional
        });
    }
  }, [consultaData?.vitales, patient, analyzeVitals, isConfigured]);

  // Contexto para el asistente
  const getContext = () => ({
    patient: patient ? {
      id: patient.id,
      nombre: patient.nombre,
      apellido: patient.apellido,
      edad: patient.edad,
      genero: patient.genero,
      tipoSangre: patient.tipoSangre,
      alergias: patient.alergias,
      enfermedadesCronicas: patient.enfermedadesCronicas
    } : null,
    citaId: cita?.id,
    motivo: cita?.motivo,
    vitals: consultaData?.vitales,
    diagnosis: consultaData?.diagnostico?.principal
  });

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const message = input;
    setInput('');

    try {
      await sendMessage(message, getContext());
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (action) => {
    const context = getContext();

    switch (action) {
      case 'diagnosis':
        if (consultaData?.soap?.subjetivo) {
          try {
            const result = await getDiagnosisSuggestions(
              consultaData.soap.subjetivo,
              { vitals: consultaData.vitales, patient }
            );
            // Mostrar en chat
            await sendMessage(
              `Basándote en los síntomas del paciente y el SOAP, sugiere diagnósticos CIE-10 probables.`,
              context
            );
          } catch (e) {
            console.error(e);
          }
        } else {
          await sendMessage('¿Cuáles son los diagnósticos más probables para este paciente?', context);
        }
        break;

      case 'prescription':
        await sendMessage(
          'Verifica si hay interacciones medicamentosas o contraindicaciones con las alergias del paciente.',
          context
        );
        break;

      case 'soap':
        if (cita?.motivo) {
          try {
            const result = await generateSOAP({
              chiefComplaint: cita.motivo,
              symptoms: consultaData?.soap?.subjetivo,
              vitals: consultaData?.vitales,
              physicalExam: consultaData?.soap?.objetivo,
              history: consultaData?.anamnesis,
              currentSoap: consultaData?.soap,
              patient
            });

            if (result?.data?.soap && onSuggestionApply) {
              // Notificar que hay una sugerencia disponible
              onSuggestionApply('soap', result.data.soap);
            }
          } catch (e) {
            console.error(e);
          }
        }
        break;

      case 'summary':
        await sendMessage('Genera un resumen ejecutivo de la consulta actual.', context);
        break;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 z-40 transition-all duration-300 ${
        expanded ? 'w-[600px]' : 'w-[400px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Asistente IA Médico</h3>
              <p className="text-xs text-violet-200">GPT-5.2 • Powered by OpenAI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="text-white hover:bg-white/20"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleQuickAction('diagnosis')}
            className="bg-white/20 hover:bg-white/30 text-white border-0 whitespace-nowrap"
          >
            <Stethoscope className="h-3 w-3 mr-1" />
            Sugerir Diagnóstico
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleQuickAction('prescription')}
            className="bg-white/20 hover:bg-white/30 text-white border-0 whitespace-nowrap"
          >
            <Pill className="h-3 w-3 mr-1" />
            Verificar Rx
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleQuickAction('soap')}
            className="bg-white/20 hover:bg-white/30 text-white border-0 whitespace-nowrap"
          >
            <FileText className="h-3 w-3 mr-1" />
            Generar SOAP
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner - Alergias */}
      {patientContext?.alertas?.alergias?.length > 0 && (
        <Alert className="m-2 bg-red-100 border-red-300">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">
            <strong>⚠️ ALERGIAS CONOCIDAS:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {patientContext.alertas.alergias.map((a, i) => (
                <Badge key={i} variant="destructive" className="text-xs">
                  {a.sustancia} ({a.severidad})
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Patologías Crónicas */}
      {patientContext?.alertas?.patologiasCronicas?.length > 0 && (
        <Alert className="m-2 bg-orange-50 border-orange-200">
          <Stethoscope className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 text-sm">
            <strong>Patologías crónicas activas:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {patientContext.alertas.patologiasCronicas.map((p, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-orange-100">
                  {p.enfermedad}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Vital Signs Alerts */}
      {vitalAlerts && vitalAlerts.criticalCount > 0 && (
        <Alert className="m-2 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">
            <strong>¡Alerta signos vitales!</strong> {vitalAlerts.summary}
            <ul className="mt-1 text-xs">
              {vitalAlerts.alerts.slice(0, 3).map((alert, i) => (
                <li key={i}>{alert.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Clinical Summary */}
      {patientContext?.resumenClinico && (
        <div className="mx-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
          <strong>Resumen clínico:</strong> {patientContext.resumenClinico}
        </div>
      )}

      {/* Not Configured Warning */}
      {!isConfigured && (
        <Alert className="m-2 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-sm">
            El asistente IA no está configurado. Configure OPENAI_API_KEY en el servidor.
          </AlertDescription>
        </Alert>
      )}

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-[calc(100%-180px)]">
        <TabsList className="w-full justify-start px-2 pt-2">
          <TabsTrigger value="chat" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-1">
            <Lightbulb className="h-3 w-3" />
            Sugerencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">¿En qué puedo ayudarte?</p>
                <p className="text-sm mt-1">Pregúntame sobre diagnósticos, medicamentos, o cualquier duda clínica.</p>

                {/* Starter prompts */}
                <div className="mt-4 space-y-2">
                  {[
                    '¿Cuáles son los diagnósticos diferenciales para dolor torácico?',
                    'Sugiere tratamiento para infección respiratoria alta',
                    '¿Hay interacciones entre metformina y lisinopril?'
                  ].map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => setInput(prompt)}
                    >
                      <ChevronRight className="h-3 w-3 mr-2 text-violet-500" />
                      <span className="text-xs">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white'
                          : msg.isAlert
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {msg.streaming && (
                            <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse ml-1" />
                          )}
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}

                      {/* Tools used badge */}
                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {msg.toolsUsed.map((tool, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tool.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Actions for assistant messages */}
                      {msg.role === 'assistant' && !msg.streaming && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(msg.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu consulta médica..."
                disabled={loading || streaming || !isConfigured}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={loading || streaming || !input.trim() || !isConfigured}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {loading || streaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                disabled={messages.length === 0}
                className="text-xs text-gray-500"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Limpiar chat
              </Button>
              <p className="text-xs text-gray-400">
                Powered by GPT-5.2
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="flex-1 m-0 p-4">
          <div className="space-y-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-violet-500" />
                  Sugerencias de Diagnóstico
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                {consultaData?.soap?.subjetivo ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('diagnosis')}
                    className="w-full"
                  >
                    Generar sugerencias basadas en SOAP
                  </Button>
                ) : (
                  <p className="text-gray-400 italic">
                    Complete el SOAP para obtener sugerencias de diagnóstico
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pill className="h-4 w-4 text-green-500" />
                  Verificación de Prescripción
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                {consultaData?.prescripciones?.medicamentos?.length > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('prescription')}
                    className="w-full"
                  >
                    Verificar interacciones
                  </Button>
                ) : (
                  <p className="text-gray-400 italic">
                    Agregue medicamentos para verificar interacciones
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Alertas Clínicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vitalAlerts?.alerts?.length > 0 ? (
                  <ul className="space-y-1">
                    {vitalAlerts.alerts.map((alert, i) => (
                      <li
                        key={i}
                        className={`text-sm p-2 rounded ${
                          alert.urgency === 'CRITICAL'
                            ? 'bg-red-50 text-red-700'
                            : alert.urgency === 'HIGH'
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {alert.message} ({alert.sign}: {alert.value})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    No hay alertas clínicas activas
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
