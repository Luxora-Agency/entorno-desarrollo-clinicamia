'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  ListChecks,
  ClipboardList,
  BarChart,
  Loader2,
  AlertCircle,
  GraduationCap,
  User,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Medal,
  Sparkles,
  Bot,
  RefreshCw
} from 'lucide-react';
import { apiGet, apiPost, getAuthToken } from '@/services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const TIPOS_REUNION_LABELS = {
  COMITE: 'Comité',
  AUDITORIA: 'Auditoría',
  REUNION_INTERNA: 'Reunión interna',
  CAPACITACION: 'Capacitación',
  REUNION_PERSONAL: 'Reunión Personal',
  JUNTA_DIRECTIVA: 'Junta Directiva',
  REUNION_CLIENTE_PROVEEDOR: 'Reunión con cliente y/o proveedores',
  VISITA_ENTES_REGULADORES: 'Visita entes reguladores',
  OTRO: 'Otro'
};

export default function ActaPreview({ open, onClose, actaId }) {
  const [acta, setActa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [generandoAnalisis, setGenerandoAnalisis] = useState(false);
  const [iaDisponible, setIaDisponible] = useState(false);

  useEffect(() => {
    if (open && actaId) {
      loadActa();
      checkIAStatus();
    } else if (open && !actaId) {
      setError('No se proporcionó un ID de acta válido');
      setLoading(false);
    }
  }, [open, actaId]);

  const checkIAStatus = async () => {
    try {
      const response = await apiGet('/calidad2/actas/ia/status');
      setIaDisponible(response.success && response.data?.configured);
    } catch (err) {
      console.error('Error checking IA status:', err);
      setIaDisponible(false);
    }
  };

  const loadActa = async () => {
    if (!actaId) {
      setError('ID de acta no válido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/calidad2/actas/${actaId}`);
      if (response.success) {
        setActa(response.data?.acta || response.data);
      } else {
        setError(response.message || 'Error al cargar el acta');
      }
    } catch (err) {
      console.error('Error loading acta:', err);
      setError(err.message || 'Error al cargar el acta');
      setActa(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/calidad2/actas/${actaId}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Error al descargar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acta-${acta?.numero || actaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerarAnalisisIA = async () => {
    try {
      setGenerandoAnalisis(true);
      toast.info('Generando análisis de adherencia con IA...', {
        description: 'Esto puede tomar unos segundos'
      });

      const response = await apiPost(`/calidad2/actas/${actaId}/generar-analisis-ia`);

      if (response.success) {
        // Actualizar el acta con el nuevo análisis Y los compromisos generados
        setActa(prev => ({
          ...prev,
          informeAdherencia: response.data.informeAdherencia,
          analisisEvaluacion: response.data.metadatos,
          // Actualizar compromisos si la IA generó nuevos
          compromisosSiguientes: response.data.compromisos && response.data.compromisos.length > 0
            ? response.data.compromisos
            : prev.compromisosSiguientes
        }));

        const mensajeExito = response.data.compromisos && response.data.compromisos.length > 0
          ? `Análisis generado con ${response.data.compromisos.length} compromisos de mejora`
          : 'Análisis de adherencia generado correctamente';

        toast.success(mensajeExito, {
          description: 'El informe y compromisos están disponibles en el acta y PDF'
        });
      } else {
        toast.error(response.message || 'Error al generar el análisis');
      }
    } catch (error) {
      console.error('Error generating IA analysis:', error);
      toast.error(error.message || 'Error al generar el análisis de IA');
    } finally {
      setGenerandoAnalisis(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Cargando Acta...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !acta) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <p className="font-medium text-foreground mb-2">No se pudo cargar el acta</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {actaId && <p className="text-xs mt-2">ID: {actaId}</p>}
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const fechaFormateada = acta.fecha
    ? format(new Date(acta.fecha), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header fijo */}
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Acta de Reunión N° {acta.numero}</DialogTitle>
                <p className="text-sm text-muted-foreground capitalize">{fechaFormateada}</p>
              </div>
            </div>
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Tipo de reunión */}
          <div className="flex flex-wrap gap-2">
            {acta.tiposReunion?.map((tipo) => (
              <Badge key={tipo} variant="secondary" className="bg-purple-100 text-purple-700">
                {TIPOS_REUNION_LABELS[tipo] || tipo}
              </Badge>
            ))}
            {acta.tipoOtro && (
              <Badge variant="outline">{acta.tipoOtro}</Badge>
            )}
          </div>

          {/* Información general */}
          <Card className="border-purple-200">
            <CardHeader className="py-3 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                <ClipboardList className="h-4 w-4" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Objetivo</span>
                  <p className="font-medium">{acta.objetivo}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Fecha</span>
                      <span className="text-sm font-medium">
                        {acta.fecha ? format(new Date(acta.fecha), 'dd/MM/yyyy') : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Horario</span>
                      <span className="text-sm font-medium">{acta.horaInicio} - {acta.horaFin}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-500" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Lugar</span>
                      <span className="text-sm font-medium">{acta.lugar}</span>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Información de la Capacitación */}
          {acta.sesion?.capacitacion && (
            <Card className="border-emerald-200">
              <CardHeader className="py-3 bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                  <GraduationCap className="h-4 w-4" />
                  Información de la Capacitación
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Tema</span>
                    <p className="font-semibold text-emerald-700">{acta.sesion.capacitacion.tema}</p>
                  </div>

                  {acta.sesion.capacitacion.actividad && (
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Actividad</span>
                      <p className="font-medium">{acta.sesion.capacitacion.actividad}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t">
                    {acta.sesion.capacitacion.categoria && (
                      <div className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs text-muted-foreground block">Categoría</span>
                          <span className="text-sm font-medium">{acta.sesion.capacitacion.categoria.nombre}</span>
                        </div>
                      </div>
                    )}
                    {acta.sesion.capacitacion.responsable && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs text-muted-foreground block">Responsable</span>
                          <span className="text-sm font-medium">
                            {acta.sesion.capacitacion.responsable.nombre} {acta.sesion.capacitacion.responsable.apellido}
                          </span>
                        </div>
                      </div>
                    )}
                    {acta.sesion.capacitacion.duracionMinutos && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs text-muted-foreground block">Duración</span>
                          <span className="text-sm font-medium">{acta.sesion.capacitacion.duracionMinutos} min</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {acta.sesion.capacitacion.orientadoA && (
                    <div className="flex items-start gap-2 pt-3 border-t">
                      <Users className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground block">Orientado a</span>
                        <p className="text-sm font-medium whitespace-pre-wrap">{acta.sesion.capacitacion.orientadoA}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados de Evaluaciones por Participante */}
          {acta.resultadosEvaluaciones && acta.resultadosEvaluaciones.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="py-3 bg-gradient-to-r from-amber-50 to-yellow-50">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                  <Trophy className="h-4 w-4" />
                  Resultados de Evaluaciones ({acta.resultadosEvaluaciones.length} participantes)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">#</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Participante</th>
                        <th className="text-center p-3 text-xs font-medium text-muted-foreground">Pre-Test</th>
                        <th className="text-center p-3 text-xs font-medium text-muted-foreground">Post-Test</th>
                        <th className="text-center p-3 text-xs font-medium text-muted-foreground">Mejora</th>
                        <th className="text-center p-3 text-xs font-medium text-muted-foreground">Puntaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {acta.resultadosEvaluaciones.map((p, idx) => (
                        <tr key={p.nombre || idx} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3">
                            {idx < 3 ? (
                              <Medal className={`h-5 w-5 ${
                                idx === 0 ? 'text-yellow-500' :
                                idx === 1 ? 'text-gray-400' : 'text-amber-600'
                              }`} />
                            ) : (
                              <span className="text-sm text-muted-foreground">{idx + 1}</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-sm">{p.nombre}</span>
                          </td>
                          <td className="p-3 text-center">
                            {p.preTest.porcentaje !== null ? (
                              <div className="flex flex-col items-center">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    p.preTest.porcentaje >= 70 ? "bg-green-50 text-green-700 border-green-200" :
                                    p.preTest.porcentaje >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                    "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                >
                                  {p.preTest.porcentaje}%
                                </Badge>
                                <span className="text-xs text-muted-foreground mt-1">
                                  {p.preTest.correctas}/{p.preTest.total}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {p.postTest.porcentaje !== null ? (
                              <div className="flex flex-col items-center">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    p.postTest.porcentaje >= 70 ? "bg-green-50 text-green-700 border-green-200" :
                                    p.postTest.porcentaje >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                    "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                >
                                  {p.postTest.porcentaje}%
                                </Badge>
                                <span className="text-xs text-muted-foreground mt-1">
                                  {p.postTest.correctas}/{p.postTest.total}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {p.mejora === null ? (
                                <Minus className="h-4 w-4 text-gray-400" />
                              ) : p.mejora > 0 ? (
                                <>
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                  <span className="text-sm font-medium text-green-600">+{p.mejora}%</span>
                                </>
                              ) : p.mejora < 0 ? (
                                <>
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                  <span className="text-sm font-medium text-red-600">{p.mejora}%</span>
                                </>
                              ) : (
                                <>
                                  <Minus className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">0%</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-amber-600">{p.puntajeTotal}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Temas a tratar */}
          {acta.temasTratar && acta.temasTratar.length > 0 && (
            <Card>
              <CardHeader className="py-3 bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                  <ListChecks className="h-4 w-4" />
                  Temas a Tratar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ol className="list-decimal list-inside space-y-1">
                  {acta.temasTratar.map((tema, idx) => (
                    <li key={idx} className="text-sm">{tema}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Compromisos anteriores */}
          {acta.compromisosAnteriores && acta.compromisosAnteriores.length > 0 && (
            <Card>
              <CardHeader className="py-3 bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                  <ClipboardList className="h-4 w-4" />
                  Compromisos del Acta Anterior
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {acta.compromisosAnteriores.map((comp, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                      {comp.cumplio === 'SI' ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : comp.cumplio === 'NO' ? (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{comp.descripcion}</p>
                        <span className="text-xs text-muted-foreground">
                          {comp.cumplio === 'SI' ? 'Cumplido' : comp.cumplio === 'NO' ? 'No cumplido' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Desarrollo de la reunión */}
          {acta.desarrolloReunion && (
            <Card>
              <CardHeader className="py-3 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                  <FileText className="h-4 w-4" />
                  Desarrollo de la Reunión
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: acta.desarrolloReunion }}
                />
              </CardContent>
            </Card>
          )}

          {/* Análisis de Adherencia con IA */}
          {(acta.resultadosEvaluaciones?.length > 0 || acta.informeAdherencia) && (
            <Card className="border-2 border-violet-200">
              <CardHeader className="py-3 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-violet-700">
                    <Sparkles className="h-4 w-4" />
                    Análisis de Adherencia
                    <Badge variant="outline" className="ml-2 bg-violet-100 text-violet-700 border-violet-300">
                      <Bot className="h-3 w-3 mr-1" />
                      IA
                    </Badge>
                  </CardTitle>
                  {iaDisponible && acta.resultadosEvaluaciones?.length > 0 && (
                    <Button
                      size="sm"
                      variant={acta.informeAdherencia ? "outline" : "default"}
                      onClick={handleGenerarAnalisisIA}
                      disabled={generandoAnalisis}
                      className={acta.informeAdherencia
                        ? "gap-2 border-violet-300 text-violet-700 hover:bg-violet-100"
                        : "gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                      }
                    >
                      {generandoAnalisis ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : acta.informeAdherencia ? (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Regenerar
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generar Análisis
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {acta.informeAdherencia ? (
                  <div className="space-y-4">
                    {/* Metadatos del análisis */}
                    {acta.analisisEvaluacion?.fechaGeneracion && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Generado: {new Date(acta.analisisEvaluacion.fechaGeneracion).toLocaleString('es-CO')}
                        </span>
                        {acta.analisisEvaluacion.modelo && (
                          <span className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {acta.analisisEvaluacion.modelo}
                          </span>
                        )}
                        {acta.analisisEvaluacion.datosAnalizados && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {acta.analisisEvaluacion.datosAnalizados.totalParticipantes} participantes
                          </span>
                        )}
                      </div>
                    )}

                    {/* Resumen de datos analizados */}
                    {acta.analisisEvaluacion?.datosAnalizados && (
                      <div className="grid grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {acta.analisisEvaluacion.datosAnalizados.promedioPreTest}%
                          </div>
                          <p className="text-xs text-blue-700">Pre-Test</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {acta.analisisEvaluacion.datosAnalizados.promedioPostTest}%
                          </div>
                          <p className="text-xs text-green-700">Post-Test</p>
                        </div>
                        <div className={`p-3 rounded-lg text-center ${
                          acta.analisisEvaluacion.datosAnalizados.mejoraPorcentual > 0
                            ? 'bg-emerald-50 border border-emerald-200'
                            : acta.analisisEvaluacion.datosAnalizados.mejoraPorcentual < 0
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                            acta.analisisEvaluacion.datosAnalizados.mejoraPorcentual > 0
                              ? 'text-emerald-600'
                              : acta.analisisEvaluacion.datosAnalizados.mejoraPorcentual < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            {acta.analisisEvaluacion.datosAnalizados.mejoraPorcentual > 0 && <TrendingUp className="h-5 w-5" />}
                            {acta.analisisEvaluacion.datosAnalizados.mejoraPorcentual < 0 && <TrendingDown className="h-5 w-5" />}
                            {acta.analisisEvaluacion.datosAnalizados.mejoraPorcentual > 0 ? '+' : ''}
                            {acta.analisisEvaluacion.datosAnalizados.mejoraPorcentual}%
                          </div>
                          <p className="text-xs text-muted-foreground">Mejora</p>
                        </div>
                        <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 text-center">
                          <div className="text-2xl font-bold text-violet-600">
                            {acta.analisisEvaluacion.datosAnalizados.totalParticipantes}
                          </div>
                          <p className="text-xs text-violet-700">Evaluados</p>
                        </div>
                      </div>
                    )}

                    {/* Contenido del análisis (párrafo conciso) */}
                    <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {acta.informeAdherencia}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-violet-500" />
                    </div>
                    <p className="text-muted-foreground mb-2">
                      No hay análisis de adherencia generado
                    </p>
                    {iaDisponible ? (
                      <p className="text-sm text-muted-foreground">
                        Haz clic en "Generar Análisis" para crear un informe de adherencia con IA
                      </p>
                    ) : (
                      <p className="text-sm text-amber-600">
                        El servicio de IA no está configurado. Configure OPENROUTER_API_KEY en el servidor.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compromisos siguientes */}
          {acta.compromisosSiguientes && acta.compromisosSiguientes.length > 0 && (
            <Card className={acta.informeAdherencia ? "border-violet-200" : ""}>
              <CardHeader className={`py-3 ${acta.informeAdherencia ? "bg-gradient-to-r from-violet-50 to-purple-50" : "bg-gradient-to-r from-rose-50 to-pink-50"}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm flex items-center gap-2 ${acta.informeAdherencia ? "text-violet-700" : "text-rose-700"}`}>
                    <ListChecks className="h-4 w-4" />
                    Compromisos Próxima Acta
                  </CardTitle>
                  {acta.informeAdherencia && (
                    <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-300">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generados por IA
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {acta.compromisosSiguientes.map((comp, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${acta.informeAdherencia ? "bg-violet-50/50 border-violet-200" : "bg-muted/30"}`}>
                      <p className="text-sm font-medium">{idx + 1}. {comp.descripcion}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {comp.encargado && (
                          <span>
                            <strong>Encargado:</strong> {comp.encargado}
                          </span>
                        )}
                        {comp.fechaEntrega && (
                          <span>
                            <strong>Fecha:</strong> {comp.fechaEntrega}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Asistentes */}
          {acta.asistentes && acta.asistentes.length > 0 && (
            <Card>
              <CardHeader className="py-3 bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
                  <Users className="h-4 w-4" />
                  Asistentes ({acta.asistentes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {acta.asistentes.map((asistente, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border bg-white hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium">
                          {asistente.nombreCompleto?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{asistente.nombreCompleto}</p>
                          {asistente.cargo && (
                            <p className="text-xs text-muted-foreground truncate">{asistente.cargo}</p>
                          )}
                        </div>
                        {asistente.firmaUrl && (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" title="Firmado" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
