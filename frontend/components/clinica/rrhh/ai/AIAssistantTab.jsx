'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, FileText, Target, Users, TrendingUp,
  Sparkles, Brain, MessageSquare, Loader2, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import useTalentoHumano from '@/hooks/useTalentoHumano';

const AI_TOOLS = [
  {
    id: 'screening',
    title: 'Screening de CV',
    description: 'Analiza CVs y calcula match con vacantes',
    icon: FileText,
    color: 'blue',
  },
  {
    id: 'preguntas',
    title: 'Generar Preguntas',
    description: 'Crea preguntas de entrevista personalizadas',
    icon: MessageSquare,
    color: 'purple',
  },
  {
    id: 'desempeno',
    title: 'Analizar Desempeno',
    description: 'Analiza tendencias de rendimiento',
    icon: TrendingUp,
    color: 'green',
  },
  {
    id: 'rotacion',
    title: 'Predecir Rotacion',
    description: 'Identifica riesgo de rotacion de personal',
    icon: Users,
    color: 'orange',
  },
  {
    id: 'capacitacion',
    title: 'Sugerir Capacitacion',
    description: 'Recomienda capacitaciones personalizadas',
    icon: Target,
    color: 'indigo',
  },
];

function AIToolCard({ tool, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={() => onClick(tool)}
    >
      <CardContent className="pt-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[tool.color]}`}>
          <tool.icon className="w-5 h-5" />
        </div>
        <h4 className="font-medium">{tool.title}</h4>
        <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
      </CardContent>
    </Card>
  );
}

function ChatMessage({ message, isUser }) {
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div className={`max-w-[80%] rounded-lg p-3 ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
      }`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

export default function AIAssistantTab({ user }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const { aiChat, aiScreenCV, aiGenerarPreguntas, aiAnalizar } = useTalentoHumano();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputMessage };
    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Pass selectedTool.id as context if a tool is selected
      const response = await aiChat([...chatMessages, userMessage], selectedTool?.id);
      // La respuesta viene en response.data.message (el wrapper tiene response.message = "Respuesta generada")
      const aiMessage = response?.data?.message || response?.message;
      if (aiMessage) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, ocurrio un error al procesar tu mensaje. Por favor intenta de nuevo.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    setChatMessages([{
      role: 'assistant',
      content: `Has seleccionado "${tool.title}". ${
        tool.id === 'screening' ? 'Comparte el texto del CV y el ID de la vacante para analizarlo.' :
        tool.id === 'preguntas' ? 'Indica el ID del candidato y la vacante para generar preguntas personalizadas.' :
        tool.id === 'desempeno' ? 'Indica el ID del empleado para analizar su desempeno.' :
        tool.id === 'rotacion' ? 'Te mostrare los empleados con mayor riesgo de rotacion.' :
        tool.id === 'capacitacion' ? 'Indica el ID del empleado para sugerir capacitaciones.' :
        'Como puedo ayudarte?'
      }`
    }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Asistente IA de Talento Humano</h2>
          <p className="text-gray-500 text-sm">
            Potenciado por GPT-5.2 para analisis avanzado de RRHH
          </p>
        </div>
        <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <Sparkles className="w-3 h-3 mr-1" />
          IA Activa
        </Badge>
      </div>

      {/* Tools Grid */}
      {!selectedTool && (
        <div>
          <h3 className="font-medium mb-4">Herramientas disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {AI_TOOLS.map(tool => (
              <AIToolCard key={tool.id} tool={tool} onClick={handleToolSelect} />
            ))}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              {selectedTool ? selectedTool.title : 'Chat con el Asistente'}
            </CardTitle>
            {selectedTool && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSelectedTool(null);
                setChatMessages([]);
              }}>
                Cambiar herramienta
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500">Hola, soy tu asistente de RRHH</h3>
                <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                  Puedo ayudarte a analizar CVs, generar preguntas de entrevista,
                  analizar desempeno, predecir rotacion y sugerir capacitaciones.
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  Selecciona una herramienta arriba o escribe tu pregunta
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    message={message}
                    isUser={message.role === 'user'}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="Escribe tu mensaje..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="resize-none"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Las respuestas son generadas por IA y pueden requerir revision
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
