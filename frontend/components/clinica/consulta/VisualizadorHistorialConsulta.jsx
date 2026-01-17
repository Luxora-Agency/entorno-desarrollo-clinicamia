'use client';

import { useState, useEffect } from 'react';
import { X, History, Calendar, User, FileText, Pill, ClipboardList, Activity, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiGet } from '@/services/api';

export default function VisualizadorHistorialConsulta({ pacienteId, onClose }) {
  const [consultas, setConsultas] = useState([]);
  const [consultaSeleccionada, setConsultaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      cargarHistorial();
    }
  }, [pacienteId]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const response = await apiGet(`/consultas/historial/${pacienteId}?limit=50`);
      if (response.success && response.data) {
        setConsultas(response.data);
        // Seleccionar la primera consulta por defecto
        if (response.data.length > 0) {
          setConsultaSeleccionada(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return '--';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    ,
      timeZone: 'America/Bogota'
    });
  };

  const formatDateShort = (fecha) => {
    if (!fecha) return '--';
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    ,
      timeZone: 'America/Bogota'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex">
      {/* Lista lateral de consultas */}
      <div className="w-80 bg-white h-full overflow-hidden flex flex-col border-r shadow-xl">
        <div className="p-4 border-b bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <h3 className="font-bold">Historial de Consultas</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-slate-300">{consultas.length} consultas registradas</p>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : consultas.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No hay consultas registradas</p>
            </div>
          ) : (
            <div className="divide-y">
              {consultas.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConsultaSeleccionada(c)}
                  className={`w-full p-4 text-left transition-colors hover:bg-blue-50 ${
                    consultaSeleccionada?.id === c.id
                      ? 'bg-blue-100 border-l-4 border-blue-600'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-sm">{formatDateShort(c.fechaEvolucion)}</span>
                  </div>
                  {c.doctor && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <User className="h-3 w-3" />
                      <span>Dr. {c.doctor.nombre} {c.doctor.apellido}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-600 line-clamp-2">{c.subjetivo || 'Sin motivo registrado'}</p>
                  {c.diagnosticos?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.diagnosticos.slice(0, 2).map((dx, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          {dx.codigoCIE11}
                        </Badge>
                      ))}
                      {c.diagnosticos.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{c.diagnosticos.length - 2}</Badge>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detalle de consulta seleccionada */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        {consultaSeleccionada ? (
          <div className="p-6 max-w-4xl mx-auto">
            {/* Header con fecha y doctor */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Consulta del {formatDate(consultaSeleccionada.fechaEvolucion)}
                  </h2>
                  {consultaSeleccionada.doctor && (
                    <p className="text-gray-600 mt-1">
                      Dr. {consultaSeleccionada.doctor.nombre} {consultaSeleccionada.doctor.apellido}
                      {consultaSeleccionada.doctor.especialidad && (
                        <span className="text-gray-400 ml-2">| {consultaSeleccionada.doctor.especialidad}</span>
                      )}
                    </p>
                  )}
                </div>
                <Badge className="bg-blue-600">Evolución SOAP</Badge>
              </div>
            </div>

            {/* SOAP */}
            <div className="grid gap-4 mb-6">
              {consultaSeleccionada.subjetivo && (
                <Card>
                  <CardHeader className="py-3 bg-blue-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">S</span>
                      Subjetivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{consultaSeleccionada.subjetivo}</p>
                  </CardContent>
                </Card>
              )}

              {consultaSeleccionada.objetivo && (
                <Card>
                  <CardHeader className="py-3 bg-green-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">O</span>
                      Objetivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{consultaSeleccionada.objetivo}</p>
                  </CardContent>
                </Card>
              )}

              {consultaSeleccionada.analisis && (
                <Card>
                  <CardHeader className="py-3 bg-amber-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold">A</span>
                      Análisis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{consultaSeleccionada.analisis}</p>
                  </CardContent>
                </Card>
              )}

              {consultaSeleccionada.plan && (
                <Card>
                  <CardHeader className="py-3 bg-purple-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">P</span>
                      Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{consultaSeleccionada.plan}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Diagnósticos */}
            {consultaSeleccionada.diagnosticos?.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="py-3 bg-rose-50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-rose-600" />
                    Diagnósticos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {consultaSeleccionada.diagnosticos.map((dx, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className="bg-rose-600 mt-0.5">{dx.tipoDiagnostico || 'Principal'}</Badge>
                        <div>
                          <p className="font-mono text-rose-700 font-bold">{dx.codigoCIE11}</p>
                          <p className="text-gray-700">{dx.descripcionCIE11}</p>
                          {dx.observaciones && (
                            <p className="text-sm text-gray-500 mt-1">{dx.observaciones}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signos Vitales (si existieran en la data, se podrían mostrar aquí) */}
            {consultaSeleccionada.vitales && (
              <Card className="mb-6">
                <CardHeader className="py-3 bg-teal-50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-teal-600" />
                    Signos Vitales
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {consultaSeleccionada.vitales.temperatura && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Temperatura</p>
                        <p className="font-bold text-teal-600">{consultaSeleccionada.vitales.temperatura}°C</p>
                      </div>
                    )}
                    {consultaSeleccionada.vitales.presionSistolica && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Presión Arterial</p>
                        <p className="font-bold text-teal-600">
                          {consultaSeleccionada.vitales.presionSistolica}/{consultaSeleccionada.vitales.presionDiastolica}
                        </p>
                      </div>
                    )}
                    {consultaSeleccionada.vitales.frecuenciaCardiaca && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">FC</p>
                        <p className="font-bold text-teal-600">{consultaSeleccionada.vitales.frecuenciaCardiaca} lpm</p>
                      </div>
                    )}
                    {consultaSeleccionada.vitales.peso && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Peso</p>
                        <p className="font-bold text-teal-600">{consultaSeleccionada.vitales.peso} kg</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Seleccione una consulta para ver el detalle</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
