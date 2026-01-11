'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileUp,
  FileText,
  Loader2,
  Send,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pill,
  Stethoscope,
  Activity,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  Brain,
  FileSearch,
  User,
  Calendar,
  Building2,
  Heart,
  Syringe,
  TestTube,
} from 'lucide-react';
import useHCEAnalyzer from '@/hooks/useHCEAnalyzer';
import { usePacientes } from '@/hooks/usePacientes';

/**
 * Componente principal del Analizador de HCE con IA
 * Permite subir PDFs de historias clínicas, analizarlos y chatear sobre ellos
 */
export default function AnalizadorHCE({ onClose }) {
  const {
    loading,
    uploading,
    chatLoading,
    documentos,
    documentoActual,
    chatMessages,
    uploadDocument,
    fetchDocumentos,
    fetchDocumento,
    sendChatMessage,
    deleteDocumento,
    reanalyzeDocumento,
    pollAnalysisStatus,
    clearDocumentoActual,
    checkStatus,
    serviceStatus,
  } = useHCEAnalyzer();

  const { pacientes, fetchPacientes } = usePacientes();
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const [view, setView] = useState('list'); // 'list' | 'upload' | 'detail'
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPaciente, setSelectedPaciente] = useState('none');
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('analisis');
  const [dragActive, setDragActive] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    checkStatus();
    fetchDocumentos();
    fetchPacientes({ limit: 100, activo: true });
  }, []);

  // Scroll al final del chat cuando hay nuevos mensajes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Solo se permiten archivos PDF');
      }
    }
  };

  // Manejar drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Solo se permiten archivos PDF');
      }
    }
  };

  // Subir documento
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const doc = await uploadDocument(
        selectedFile,
        selectedPaciente && selectedPaciente !== 'none' ? selectedPaciente : null
      );
      setSelectedFile(null);
      setSelectedPaciente('none');
      setView('detail');
      await fetchDocumento(doc.id);
      pollAnalysisStatus(doc.id, (updatedDoc) => {
        fetchDocumento(updatedDoc.id);
      });
    } catch {
      // Error manejado en el hook
    }
  };

  // Ver documento
  const handleViewDocument = async (doc) => {
    await fetchDocumento(doc.id);
    setView('detail');
    setActiveTab('analisis');

    // Si está procesando, iniciar polling
    if (doc.estado === 'Procesando') {
      pollAnalysisStatus(doc.id, (updatedDoc) => {
        fetchDocumento(updatedDoc.id);
      });
    }
  };

  // Enviar mensaje de chat
  const handleSendChat = async () => {
    if (!chatInput.trim() || !documentoActual || chatLoading) return;

    const pregunta = chatInput;
    setChatInput('');

    try {
      await sendChatMessage(documentoActual.id, pregunta);
    } catch {
      // Error manejado en el hook
    }
  };

  // Renderizar badge de estado
  const renderEstadoBadge = (estado) => {
    const variants = {
      Pendiente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      Procesando: { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
      Completado: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      Error: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };
    const v = variants[estado] || variants.Pendiente;
    const Icon = v.icon;

    return (
      <Badge className={`${v.color} gap-1`}>
        <Icon className={`h-3 w-3 ${estado === 'Procesando' ? 'animate-spin' : ''}`} />
        {estado}
      </Badge>
    );
  };

  // Formatear fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ============ VISTA: Lista de documentos ============
  if (view === 'list') {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b p-4 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Brain className="h-6 w-6 text-violet-600" />
                Analizador de Historias Clinicas IA
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Sube documentos medicos externos para analisis automatico con inteligencia artificial
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setView('upload')}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Subir Documento
              </Button>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de documentos */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : documentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <FileSearch className="h-20 w-20 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay documentos analizados
              </h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Sube un PDF de historia clinica para que la IA extraiga y analice
                toda la informacion medica relevante
              </p>
              <Button onClick={() => setView('upload')}>
                <FileUp className="h-4 w-4 mr-2" />
                Subir primer documento
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="divide-y">
                {documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-violet-600 flex-shrink-0" />
                          <span className="font-medium truncate">
                            {doc.nombreOriginal}
                          </span>
                          {renderEstadoBadge(doc.estado)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                          {doc.paciente ? (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {doc.paciente.nombre} {doc.paciente.apellido}
                            </span>
                          ) : (
                            <span className="italic">Sin paciente asociado</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(doc.createdAt)}
                          </span>
                        </div>
                        {doc.resumenEjecutivo && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {doc.resumenEjecutivo}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    );
  }

  // ============ VISTA: Subir documento ============
  if (view === 'upload') {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('list')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
            <div>
              <h2 className="font-semibold">Subir Historia Clinica</h2>
              <p className="text-sm text-gray-500">
                Sube un PDF digital con texto seleccionable
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-xl mx-auto space-y-6">
            {/* Zona de arrastre */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${dragActive ? 'border-violet-500 bg-violet-50' : ''}
                ${selectedFile ? 'border-violet-300 bg-violet-50' : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div>
                  <FileText className="h-16 w-16 mx-auto text-violet-600 mb-3" />
                  <p className="font-medium text-violet-900 text-lg">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div>
                  <FileUp className="h-16 w-16 mx-auto text-gray-400 mb-3" />
                  <p className="font-medium text-gray-700 text-lg">
                    Click para seleccionar PDF
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    o arrastra el archivo aqui
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    Maximo 15MB
                  </p>
                </div>
              )}
            </div>

            {/* Selector de paciente */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Asociar a paciente (opcional)
              </label>
              <Select
                value={selectedPaciente}
                onValueChange={setSelectedPaciente}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un paciente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin paciente</SelectItem>
                  {pacientes?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido} - {p.cedula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Vincula el analisis a un paciente del sistema para tener mejor contexto
              </p>
            </div>

            {/* Advertencia */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Importante:</strong> Solo se admiten PDFs digitales con texto
                seleccionable. Los documentos escaneados (imagenes de texto) no pueden
                ser procesados correctamente.
              </AlertDescription>
            </Alert>

            {/* Servicio no configurado */}
            {serviceStatus && !serviceStatus.configured && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  El servicio de IA no esta configurado. Contacte al administrador.
                </AlertDescription>
              </Alert>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedPaciente('');
                  setView('list');
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={handleUpload}
                disabled={!selectedFile || uploading || !serviceStatus?.configured}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analizar con IA
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ VISTA: Detalle del documento ============
  if (view === 'detail' && documentoActual) {
    const analisis = documentoActual.analisisCompleto || {};

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setView('list');
                  clearDocumentoActual();
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
              <div className="min-w-0">
                <h2 className="font-semibold truncate">
                  {documentoActual.nombreOriginal}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {documentoActual.paciente && (
                    <span>
                      {documentoActual.paciente.nombre}{' '}
                      {documentoActual.paciente.apellido}
                    </span>
                  )}
                  {renderEstadoBadge(documentoActual.estado)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {documentoActual.estado === 'Error' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reanalyzeDocumento(documentoActual.id)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reintentar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (confirm('¿Eliminar este documento y su analisis?')) {
                    deleteDocumento(documentoActual.id);
                    setView('list');
                    clearDocumentoActual();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        {documentoActual.estado === 'Procesando' ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <Brain className="h-16 w-16 mx-auto text-violet-200" />
                <Loader2 className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-violet-600" />
              </div>
              <h3 className="text-lg font-medium mt-4">Analizando documento...</h3>
              <p className="text-gray-500 mt-1">
                Esto puede tomar 30-60 segundos
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Extrayendo diagnosticos, medicamentos, signos vitales...
              </p>
            </div>
          </div>
        ) : documentoActual.estado === 'Error' ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Alert className="max-w-md bg-red-50 border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error en el analisis:</strong>
                <p className="mt-1">
                  {documentoActual.errorMensaje || 'Error desconocido'}
                </p>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="mx-4 mt-4 w-fit">
              <TabsTrigger value="analisis" className="gap-1">
                <ClipboardList className="h-4 w-4" />
                Analisis
              </TabsTrigger>
              <TabsTrigger value="datos" className="gap-1">
                <FileText className="h-4 w-4" />
                Datos
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                Chat IA
              </TabsTrigger>
            </TabsList>

            {/* Tab: Analisis */}
            <TabsContent value="analisis" className="flex-1 overflow-auto p-4 mt-0">
              <div className="space-y-4 max-w-5xl">
                {/* Resumen Ejecutivo */}
                {(analisis.resumenEjecutivo || analisis.resumenClinico) && (
                  <Card className="border-l-4 border-l-violet-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4 text-violet-600" />
                        Analisis del Asistente Medico IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                        {analisis.resumenEjecutivo || analisis.resumenClinico}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Alertas Criticas */}
                {(analisis.alertasCriticas?.length > 0 || analisis.alertas?.length > 0) && (
                  <Alert className="bg-red-50 border-red-300 border-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <AlertDescription>
                      <strong className="text-red-800 text-base">
                        ALERTAS CRITICAS
                      </strong>
                      <div className="mt-3 space-y-2">
                        {(analisis.alertasCriticas || analisis.alertas?.map(a => ({ descripcion: a, urgencia: 'Importante' }))).map((alerta, i) => (
                          <div key={i} className="flex items-start gap-2 bg-white/50 p-2 rounded border border-red-200">
                            <Badge className={`text-xs shrink-0 ${
                              alerta.urgencia === 'Inmediata' ? 'bg-red-600' :
                              alerta.urgencia === 'Urgente' ? 'bg-orange-500' :
                              'bg-yellow-500'
                            }`}>
                              {alerta.urgencia || 'Alerta'}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              {alerta.tipo && <span className="text-red-700 font-medium text-sm">[{alerta.tipo}] </span>}
                              <span className="text-red-800 text-sm">{alerta.descripcion || alerta}</span>
                              {alerta.accionRecomendada && (
                                <p className="text-red-600 text-xs mt-1">
                                  → {alerta.accionRecomendada}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Diagnosticos Diferenciales */}
                {analisis.diagnosticosDiferenciales?.length > 0 && (
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        Diagnosticos Diferenciales (Analisis IA)
                      </CardTitle>
                      <CardDescription>
                        Ordenados por probabilidad segun el razonamiento clinico
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analisis.diagnosticosDiferenciales.map((dx, i) => (
                          <div key={i} className={`p-3 rounded-lg border ${
                            dx.probabilidad === 'Alta' ? 'bg-blue-50 border-blue-200' :
                            dx.probabilidad === 'Media' ? 'bg-gray-50 border-gray-200' :
                            'bg-white border-gray-100'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">{i + 1}. {dx.diagnostico}</span>
                              <Badge variant={
                                dx.probabilidad === 'Alta' ? 'default' :
                                dx.probabilidad === 'Media' ? 'secondary' : 'outline'
                              }>
                                {dx.probabilidad}
                              </Badge>
                            </div>
                            {dx.hallazgosAFavor?.length > 0 && (
                              <div className="text-sm mb-1">
                                <span className="text-green-700 font-medium">A favor: </span>
                                <span className="text-gray-600">{dx.hallazgosAFavor.join(', ')}</span>
                              </div>
                            )}
                            {dx.hallazgosEnContra?.length > 0 && (
                              <div className="text-sm mb-1">
                                <span className="text-red-700 font-medium">En contra: </span>
                                <span className="text-gray-600">{dx.hallazgosEnContra.join(', ')}</span>
                              </div>
                            )}
                            {dx.estudiosConfirmatorios?.length > 0 && (
                              <div className="text-sm">
                                <span className="text-blue-700 font-medium">Para confirmar: </span>
                                <span className="text-gray-600">{dx.estudiosConfirmatorios.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Razonamiento Clinico */}
                {analisis.razonamientoClinico && (
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        Razonamiento Clinico
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analisis.razonamientoClinico.sindromes?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Sindromes Identificados</h4>
                          <div className="space-y-2">
                            {analisis.razonamientoClinico.sindromes.map((s, i) => (
                              <div key={i} className="bg-purple-50 p-3 rounded-lg">
                                <p className="font-medium text-purple-800">{s.nombre}</p>
                                {s.explicacion && (
                                  <p className="text-sm text-gray-600 mt-1">{s.explicacion}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analisis.razonamientoClinico.correlacionClinica && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">Correlacion Clinica</h4>
                          <p className="text-sm text-gray-600">{analisis.razonamientoClinico.correlacionClinica}</p>
                        </div>
                      )}
                      {analisis.razonamientoClinico.fisiopatologia && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">Fisiopatologia</h4>
                          <p className="text-sm text-gray-600">{analisis.razonamientoClinico.fisiopatologia}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Recomendaciones Medicas */}
                {analisis.recomendacionesMedicas && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Recomendaciones del Asistente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analisis.recomendacionesMedicas.estudiosAdicionales?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                            <TestTube className="h-4 w-4" />
                            Estudios Sugeridos
                          </h4>
                          <div className="space-y-2">
                            {analisis.recomendacionesMedicas.estudiosAdicionales.map((e, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <Badge variant={
                                  e.prioridad === 'Alta' ? 'default' :
                                  e.prioridad === 'Media' ? 'secondary' : 'outline'
                                } className="shrink-0 mt-0.5">
                                  {e.prioridad}
                                </Badge>
                                <div>
                                  <span className="font-medium">{e.estudio}</span>
                                  {e.justificacion && (
                                    <p className="text-gray-500 text-xs">{e.justificacion}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analisis.recomendacionesMedicas.consideracionesTerapeuticas?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Consideraciones Terapeuticas</h4>
                          <ul className="text-sm space-y-1">
                            {analisis.recomendacionesMedicas.consideracionesTerapeuticas.map((c, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-500">•</span>
                                <span className="text-gray-600">{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analisis.recomendacionesMedicas.interconsultas?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Interconsultas Sugeridas</h4>
                          <div className="flex flex-wrap gap-2">
                            {analisis.recomendacionesMedicas.interconsultas.map((ic, i) => (
                              <div key={i} className="bg-green-50 px-3 py-1.5 rounded-lg text-sm">
                                <span className="font-medium text-green-800">{ic.especialidad}</span>
                                {ic.motivo && <span className="text-green-600 text-xs block">{ic.motivo}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analisis.recomendacionesMedicas.monitorizacion?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Monitorizacion</h4>
                          <ul className="text-sm space-y-1">
                            {analisis.recomendacionesMedicas.monitorizacion.map((m, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500">→</span>
                                <span className="text-gray-600">{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Datos del paciente */}
                {analisis.datosGenerales && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        Datos del Paciente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {analisis.datosGenerales.nombrePaciente && (
                          <div>
                            <span className="text-gray-500">Nombre:</span>
                            <p className="font-medium">{analisis.datosGenerales.nombrePaciente}</p>
                          </div>
                        )}
                        {analisis.datosGenerales.edad && (
                          <div>
                            <span className="text-gray-500">Edad:</span>
                            <p className="font-medium">{analisis.datosGenerales.edad}</p>
                          </div>
                        )}
                        {analisis.datosGenerales.genero && (
                          <div>
                            <span className="text-gray-500">Genero:</span>
                            <p className="font-medium">{analisis.datosGenerales.genero}</p>
                          </div>
                        )}
                        {analisis.datosGenerales.documento && (
                          <div>
                            <span className="text-gray-500">Documento:</span>
                            <p className="font-medium">{analisis.datosGenerales.documento}</p>
                          </div>
                        )}
                        {analisis.datosGenerales.institucion && (
                          <div>
                            <span className="text-gray-500">Institucion:</span>
                            <p className="font-medium">{analisis.datosGenerales.institucion}</p>
                          </div>
                        )}
                        {analisis.datosGenerales.fechaDocumento && (
                          <div>
                            <span className="text-gray-500">Fecha:</span>
                            <p className="font-medium">{analisis.datosGenerales.fechaDocumento}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Grid de datos clinicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Diagnosticos del Documento */}
                  {(analisis.diagnosticosDocumento?.length > 0 || analisis.diagnosticos?.length > 0) && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-blue-600" />
                          Diagnosticos en Documento ({(analisis.diagnosticosDocumento || analisis.diagnosticos).length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {(analisis.diagnosticosDocumento || analisis.diagnosticos).map((d, i) => (
                            <li key={i} className="text-sm border-b pb-2 last:border-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={d.tipo === 'Principal' ? 'default' : 'outline'}
                                  className="text-xs"
                                >
                                  {d.tipo}
                                </Badge>
                                {d.codigoCIE10 && (
                                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                    {d.codigoCIE10}
                                  </code>
                                )}
                              </div>
                              <p className="text-gray-700">{d.descripcion}</p>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Medicamentos con Analisis */}
                  {analisis.medicamentos?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Pill className="h-4 w-4 text-green-600" />
                          Medicamentos ({analisis.medicamentos.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {analisis.medicamentos.map((m, i) => (
                            <li key={i} className="text-sm border-b pb-3 last:border-0">
                              <p className="font-medium text-gray-900">{m.nombre}</p>
                              <p className="text-gray-500 text-xs">
                                {[m.dosis, m.frecuencia, m.via, m.duracion]
                                  .filter(Boolean)
                                  .join(' | ')}
                              </p>
                              {m.indicacion && (
                                <p className="text-gray-600 text-xs mt-1">
                                  <span className="font-medium">Indicacion:</span> {m.indicacion}
                                </p>
                              )}
                              {m.comentarioClinico && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800 border border-blue-100">
                                  <span className="font-medium">Analisis IA:</span> {m.comentarioClinico}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Signos Vitales */}
                  {analisis.signosVitales &&
                    Object.values(analisis.signosVitales).some((v) => v) && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4 text-red-600" />
                            Signos Vitales
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {analisis.signosVitales.presionArterial && (
                              <div className="flex items-center gap-2">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span className="text-gray-500">PA:</span>
                                <span className="font-medium">
                                  {analisis.signosVitales.presionArterial}
                                </span>
                              </div>
                            )}
                            {analisis.signosVitales.frecuenciaCardiaca && (
                              <div>
                                <span className="text-gray-500">FC:</span>{' '}
                                <span className="font-medium">
                                  {analisis.signosVitales.frecuenciaCardiaca}
                                </span>
                              </div>
                            )}
                            {analisis.signosVitales.temperatura && (
                              <div>
                                <span className="text-gray-500">Temp:</span>{' '}
                                <span className="font-medium">
                                  {analisis.signosVitales.temperatura}
                                </span>
                              </div>
                            )}
                            {analisis.signosVitales.frecuenciaRespiratoria && (
                              <div>
                                <span className="text-gray-500">FR:</span>{' '}
                                <span className="font-medium">
                                  {analisis.signosVitales.frecuenciaRespiratoria}
                                </span>
                              </div>
                            )}
                            {analisis.signosVitales.saturacionO2 && (
                              <div>
                                <span className="text-gray-500">SpO2:</span>{' '}
                                <span className="font-medium">
                                  {analisis.signosVitales.saturacionO2}
                                </span>
                              </div>
                            )}
                            {analisis.signosVitales.peso && (
                              <div>
                                <span className="text-gray-500">Peso:</span>{' '}
                                <span className="font-medium">
                                  {analisis.signosVitales.peso}
                                </span>
                              </div>
                            )}
                            {analisis.signosVitales.talla && (
                              <div>
                                <span className="text-gray-500">Talla:</span>{' '}
                                <span className="font-medium">
                                  {analisis.signosVitales.talla}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  {/* Laboratorios con Significado Clinico */}
                  {analisis.laboratorios?.length > 0 && (
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TestTube className="h-4 w-4 text-purple-600" />
                          Laboratorios ({analisis.laboratorios.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analisis.laboratorios.map((lab, i) => (
                            <div key={i} className={`p-3 rounded-lg border ${
                              lab.estado === 'Critico' ? 'bg-red-50 border-red-200' :
                              lab.estado === 'Alterado' ? 'bg-amber-50 border-amber-200' :
                              'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex justify-between items-start">
                                <span className="text-sm font-medium text-gray-800">{lab.nombre}</span>
                                <Badge variant={
                                  lab.estado === 'Critico' ? 'destructive' :
                                  lab.estado === 'Alterado' ? 'secondary' : 'outline'
                                } className="text-xs">
                                  {lab.estado || 'Normal'}
                                </Badge>
                              </div>
                              <div className="mt-1">
                                <span className={`text-lg font-bold ${
                                  lab.estado === 'Critico' ? 'text-red-700' :
                                  lab.estado === 'Alterado' ? 'text-amber-700' :
                                  'text-gray-900'
                                }`}>
                                  {lab.valor} {lab.unidad}
                                </span>
                                {lab.valorReferencia && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    (Ref: {lab.valorReferencia})
                                  </span>
                                )}
                              </div>
                              {lab.significadoClinico && (
                                <p className="text-xs text-gray-600 mt-2 border-t pt-2">
                                  {lab.significadoClinico}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Procedimientos */}
                  {analisis.procedimientos?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Syringe className="h-4 w-4 text-orange-600" />
                          Procedimientos ({analisis.procedimientos.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analisis.procedimientos.map((proc, i) => (
                            <li key={i} className="text-sm border-b pb-2 last:border-0">
                              <p className="font-medium">{proc.nombre}</p>
                              {proc.fecha && (
                                <p className="text-xs text-gray-500">Fecha: {proc.fecha}</p>
                              )}
                              {proc.hallazgos && (
                                <p className="text-gray-600 text-xs mt-1">
                                  {proc.hallazgos}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Antecedentes */}
                  {analisis.antecedentes && (
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Antecedentes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {analisis.antecedentes.alergicos?.length > 0 && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                              <span className="font-medium text-red-700 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Alergias:
                              </span>
                              <p className="text-red-600 mt-1">
                                {analisis.antecedentes.alergicos.join(', ')}
                              </p>
                            </div>
                          )}
                          {analisis.antecedentes.patologicos?.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">Patologicos:</span>
                              <p className="text-gray-600 mt-1">
                                {analisis.antecedentes.patologicos.join(', ')}
                              </p>
                            </div>
                          )}
                          {analisis.antecedentes.quirurgicos?.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">Quirurgicos:</span>
                              <p className="text-gray-600 mt-1">
                                {analisis.antecedentes.quirurgicos.join(', ')}
                              </p>
                            </div>
                          )}
                          {analisis.antecedentes.familiares?.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">Familiares:</span>
                              <p className="text-gray-600 mt-1">
                                {analisis.antecedentes.familiares.join(', ')}
                              </p>
                            </div>
                          )}
                          {analisis.antecedentes.farmacologicos?.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">Farmacologicos:</span>
                              <p className="text-gray-600 mt-1">
                                {analisis.antecedentes.farmacologicos.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Confianza y limitaciones */}
                {(analisis.confianzaAnalisis || analisis.limitaciones) && (
                  <Card className="bg-gray-50">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between text-sm">
                        {analisis.confianzaAnalisis && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Confianza del analisis:</span>
                            <Badge
                              variant={
                                analisis.confianzaAnalisis === 'Alta' ? 'default' :
                                analisis.confianzaAnalisis === 'Media' ? 'secondary' :
                                'outline'
                              }
                            >
                              {analisis.confianzaAnalisis}
                            </Badge>
                          </div>
                        )}
                        {analisis.limitaciones && (
                          <p className="text-gray-500 text-xs">
                            {analisis.limitaciones}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Tab: Datos JSON */}
            <TabsContent value="datos" className="flex-1 overflow-auto p-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Datos extraidos (JSON)</CardTitle>
                  <CardDescription>
                    Estructura completa del analisis para integracion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-[500px]">
                    {JSON.stringify(analisis, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Chat */}
            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden p-0 mt-0">
              <ScrollArea className="flex-1 p-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="relative inline-block mb-4">
                      <Brain className="h-16 w-16 mx-auto text-violet-200" />
                      <MessageSquare className="h-6 w-6 absolute bottom-0 right-0 text-violet-500" />
                    </div>
                    <h3 className="font-medium text-gray-700 mb-2">
                      Asistente Medico IA
                    </h3>
                    <p className="text-sm max-w-md mx-auto mb-6">
                      Preguntame como si fuera un colega experto. Puedo ayudarte con
                      diagnosticos diferenciales, interpretacion de estudios, farmacologia
                      y razonamiento clinico.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                      {[
                        '¿Cual es tu diagnostico mas probable y por que?',
                        '¿Que estudios adicionales recomiendas?',
                        '¿Hay interacciones medicamentosas importantes?',
                        '¿Cuales son las banderas rojas en este paciente?',
                        '¿Como diferenciarias entre los diagnosticos?',
                        '¿Cual seria tu plan de manejo inicial?',
                        'Explicame la fisiopatologia del cuadro',
                        '¿Que debo monitorizar en el seguimiento?',
                      ].map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs hover:bg-violet-50 hover:border-violet-300"
                          onClick={() => {
                            setChatInput(q);
                          }}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={msg.id || i}
                        className={`flex ${msg.rol === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            msg.rol === 'user'
                              ? 'bg-violet-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-800 rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm">{msg.contenido}</p>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                            <span className="text-sm text-gray-500">Analizando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input de chat */}
              <div className="border-t p-4 bg-white">
                <div className="flex gap-2 max-w-3xl mx-auto">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                    placeholder="Pregunta sobre el documento..."
                    disabled={chatLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {chatLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    );
  }

  return null;
}
