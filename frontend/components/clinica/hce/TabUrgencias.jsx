'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Siren,
  Clock,
  User,
  Calendar,
  Activity,
  Thermometer,
  Heart,
  Eye
} from 'lucide-react';

const CATEGORIA_COLORS = {
  'Rojo': 'bg-red-600 text-white',
  'Naranja': 'bg-orange-500 text-white',
  'Amarillo': 'bg-yellow-400 text-black',
  'Verde': 'bg-green-500 text-white',
  'Azul': 'bg-blue-500 text-white',
};

const ESTADO_COLORS = {
  'Triaje': 'bg-purple-100 text-purple-700 border-purple-200',
  'Espera': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'EnAtencion': 'bg-blue-100 text-blue-700 border-blue-200',
  'Observacion': 'bg-orange-100 text-orange-700 border-orange-200',
  'Alta': 'bg-green-100 text-green-700 border-green-200',
  'Hospitalizado': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Fallecido': 'bg-gray-800 text-white',
};

const ESTADO_LABELS = {
  'Triaje': 'Triaje',
  'Espera': 'En Espera',
  'EnAtencion': 'En Atención',
  'Observacion': 'Observación',
  'Alta': 'Alta',
  'Hospitalizado': 'Hospitalizado',
  'Fallecido': 'Fallecido',
};

export default function TabUrgencias({ pacienteId }) {
  const [urgencias, setUrgencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urgenciaSeleccionada, setUrgenciaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    if (pacienteId) {
      loadUrgencias();
    }
  }, [pacienteId]);

  const loadUrgencias = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/urgencias?pacienteId=${pacienteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const atenciones = data.data?.atenciones || data.atenciones || [];
        const sorted = atenciones.sort((a, b) =>
          new Date(b.horaLlegada) - new Date(a.horaLlegada)
        );
        setUrgencias(sorted);
      }
    } catch (error) {
      console.error('Error cargando urgencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  const verDetalle = (urgencia) => {
    setUrgenciaSeleccionada(urgencia);
    setMostrarModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 rounded-lg">
              <Siren className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Historial de Urgencias</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Registro cronológico de atenciones de urgencia del paciente
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Urgencias */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando atenciones de urgencia...</p>
          </CardContent>
        </Card>
      ) : urgencias.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Siren className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay atenciones de urgencia registradas</p>
              <p className="text-sm text-gray-500">
                Las atenciones de urgencia aparecerán aquí cuando se registren
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">
            <Calendar className="h-4 w-4" />
            <span>Total de atenciones de urgencia: <strong>{urgencias.length}</strong></span>
          </div>

          {urgencias.map((urgencia) => (
            <Card key={urgencia.id} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${CATEGORIA_COLORS[urgencia.categoriaManchester] || 'bg-gray-200'}`}>
                      <Siren className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {urgencia.categoriaManchester} - Prioridad {urgencia.prioridad}
                      </p>
                      <p className="text-sm text-gray-600">
                        {urgencia.nivelUrgencia}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${ESTADO_COLORS[urgencia.estado] || 'bg-gray-100'} border`}>
                      {ESTADO_LABELS[urgencia.estado] || urgencia.estado}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => verDetalle(urgencia)}
                      className="hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Motivo de Consulta</p>
                    <p className="text-sm font-medium">{urgencia.motivoConsulta || 'No especificado'}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Llegada: {formatDate(urgencia.horaLlegada)}</span>
                  </div>

                  {urgencia.medicoAsignado && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Dr. {urgencia.medicoAsignado.nombre} {urgencia.medicoAsignado.apellido}</span>
                    </div>
                  )}

                  {urgencia.areaAsignada && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Área:</span> {urgencia.areaAsignada}
                    </div>
                  )}
                </div>

                {/* Signos Vitales Resumen */}
                {(urgencia.presionSistolica || urgencia.temperatura || urgencia.frecuenciaCardiaca) && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Signos Vitales al Ingreso</p>
                    <div className="flex flex-wrap gap-3">
                      {urgencia.presionSistolica && (
                        <span className="flex items-center gap-1 text-sm bg-blue-50 px-2 py-1 rounded">
                          <Activity className="w-3 h-3" />
                          PA: {urgencia.presionSistolica}/{urgencia.presionDiastolica}
                        </span>
                      )}
                      {urgencia.frecuenciaCardiaca && (
                        <span className="flex items-center gap-1 text-sm bg-red-50 px-2 py-1 rounded">
                          <Heart className="w-3 h-3" />
                          FC: {urgencia.frecuenciaCardiaca}
                        </span>
                      )}
                      {urgencia.temperatura && (
                        <span className="flex items-center gap-1 text-sm bg-orange-50 px-2 py-1 rounded">
                          <Thermometer className="w-3 h-3" />
                          T: {urgencia.temperatura}°C
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalle */}
      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-red-600" />
              Detalle de Atención de Urgencia
            </DialogTitle>
          </DialogHeader>
          {urgenciaSeleccionada && (
            <div className="space-y-6">
              {/* Triaje Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Categoría Manchester</span>
                  <Badge className={`mt-1 ${CATEGORIA_COLORS[urgenciaSeleccionada.categoriaManchester]}`}>
                    {urgenciaSeleccionada.categoriaManchester}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Prioridad</span>
                  <p className="font-semibold">{urgenciaSeleccionada.prioridad}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Estado</span>
                  <Badge className={`mt-1 ${ESTADO_COLORS[urgenciaSeleccionada.estado]} border`}>
                    {ESTADO_LABELS[urgenciaSeleccionada.estado]}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Área Asignada</span>
                  <p className="font-semibold">{urgenciaSeleccionada.areaAsignada || 'N/A'}</p>
                </div>
              </div>

              {/* Tiempos */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Hora Llegada</span>
                  <p className="font-semibold">{formatDate(urgenciaSeleccionada.horaLlegada)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Hora Triaje</span>
                  <p className="font-semibold">{formatDate(urgenciaSeleccionada.horaTriaje)}</p>
                </div>
                {urgenciaSeleccionada.horaInicioAtencion && (
                  <div>
                    <span className="text-sm text-gray-600">Inicio Atención</span>
                    <p className="font-semibold">{formatDate(urgenciaSeleccionada.horaInicioAtencion)}</p>
                  </div>
                )}
              </div>

              {/* Motivo */}
              <div>
                <span className="text-sm text-gray-600">Motivo de Consulta</span>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{urgenciaSeleccionada.motivoConsulta}</p>
              </div>

              {/* Signos Vitales */}
              <div>
                <span className="text-sm text-gray-600 font-semibold">Signos Vitales al Ingreso</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Presión Arterial</p>
                    <p className="font-semibold">{urgenciaSeleccionada.presionSistolica || '--'}/{urgenciaSeleccionada.presionDiastolica || '--'} mmHg</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Frec. Cardíaca</p>
                    <p className="font-semibold">{urgenciaSeleccionada.frecuenciaCardiaca || '--'} lpm</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Frec. Respiratoria</p>
                    <p className="font-semibold">{urgenciaSeleccionada.frecuenciaRespiratoria || '--'} rpm</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Temperatura</p>
                    <p className="font-semibold">{urgenciaSeleccionada.temperatura || '--'}°C</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Sat. Oxígeno</p>
                    <p className="font-semibold">{urgenciaSeleccionada.saturacionOxigeno || '--'}%</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Escala Glasgow</p>
                    <p className="font-semibold">{urgenciaSeleccionada.escalaGlasgow || '--'}/15</p>
                  </div>
                  <div className="bg-pink-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Escala Dolor</p>
                    <p className="font-semibold">{urgenciaSeleccionada.escalaDolor || '--'}/10</p>
                  </div>
                </div>
              </div>

              {/* Diagnóstico y Tratamiento */}
              {(urgenciaSeleccionada.diagnosticoInicial || urgenciaSeleccionada.tratamientoAplicado) && (
                <div className="space-y-3">
                  {urgenciaSeleccionada.diagnosticoInicial && (
                    <div>
                      <span className="text-sm text-gray-600">Diagnóstico Inicial</span>
                      <p className="mt-1 p-3 bg-blue-50 rounded text-sm">{urgenciaSeleccionada.diagnosticoInicial}</p>
                    </div>
                  )}
                  {urgenciaSeleccionada.tratamientoAplicado && (
                    <div>
                      <span className="text-sm text-gray-600">Tratamiento Aplicado</span>
                      <p className="mt-1 p-3 bg-green-50 rounded text-sm">{urgenciaSeleccionada.tratamientoAplicado}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Observaciones */}
              {urgenciaSeleccionada.observaciones && (
                <div>
                  <span className="text-sm text-gray-600">Observaciones</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{urgenciaSeleccionada.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
