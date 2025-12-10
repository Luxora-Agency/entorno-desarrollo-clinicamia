'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Stethoscope, 
  AlertTriangle, 
  FileText, 
  Pill,
  Clock,
  Calendar,
  User,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiGet } from '@/services/api';
import { formatDateTime, formatDate } from '@/services/formatters';

const TIPOS_EVENTO = {
  evolucion: {
    label: 'Evolución Clínica',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    iconBg: 'bg-blue-500',
  },
  signoVital: {
    label: 'Signos Vitales',
    icon: Activity,
    color: 'bg-green-100 text-green-800 border-green-300',
    iconBg: 'bg-green-500',
  },
  diagnostico: {
    label: 'Diagnóstico',
    icon: Stethoscope,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    iconBg: 'bg-purple-500',
  },
  alerta: {
    label: 'Alerta Clínica',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-800 border-red-300',
    iconBg: 'bg-red-500',
  },
  interconsulta: {
    label: 'Interconsulta',
    icon: User,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    iconBg: 'bg-indigo-500',
  },
  procedimiento: {
    label: 'Procedimiento',
    icon: Pill,
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    iconBg: 'bg-amber-500',
  },
  admision: {
    label: 'Admisión',
    icon: Calendar,
    color: 'bg-teal-100 text-teal-800 border-teal-300',
    iconBg: 'bg-teal-500',
  },
  egreso: {
    label: 'Egreso',
    icon: CheckCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    iconBg: 'bg-gray-500',
  },
};

export default function TabTimeline({ pacienteId, admisionId }) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('todos'); // 7dias, 30dias, 90dias, todos

  useEffect(() => {
    if (pacienteId) {
      cargarTimeline();
    }
  }, [pacienteId, admisionId]);

  const cargarTimeline = async () => {
    setLoading(true);
    try {
      // Cargar todos los eventos en paralelo
      const [
        evolucionesRes,
        signosVitalesRes,
        diagnosticosRes,
        alertasRes,
        interconsultasRes,
        procedimientosRes,
        admisionesRes,
      ] = await Promise.all([
        apiGet('/evoluciones', { pacienteId, admisionId: admisionId || undefined }),
        apiGet('/signos-vitales', { pacienteId, admisionId: admisionId || undefined }),
        apiGet('/diagnosticos', { pacienteId, admisionId: admisionId || undefined }),
        apiGet('/alertas', { pacienteId }),
        apiGet('/interconsultas', { pacienteId, admisionId: admisionId || undefined }),
        apiGet('/procedimientos', { pacienteId, admisionId: admisionId || undefined }),
        apiGet('/admisiones', { pacienteId }),
      ]);

      // Consolidar todos los eventos (manejando diferentes formatos de respuesta)
      const todosEventos = [
        ...(Array.isArray(evolucionesRes.data) ? evolucionesRes.data : evolucionesRes.data?.evoluciones || []).map(e => ({
          tipo: 'evolucion',
          fecha: e.fecha,
          titulo: 'Evolución Clínica',
          descripcion: e.subjetivo,
          doctor: `Dr. ${e.doctor?.nombre} ${e.doctor?.apellido}`,
          data: e,
        })),
        ...(signosVitalesRes.data || []).map(s => ({
          tipo: 'signoVital',
          fecha: s.fecha,
          titulo: 'Signos Vitales',
          descripcion: `PA: ${s.presionArterialSistolica}/${s.presionArterialDiastolica}, FC: ${s.frecuenciaCardiaca}, Temp: ${s.temperatura}°C`,
          doctor: s.registradoPor ? `${s.registradoPor.nombre} ${s.registradoPor.apellido}` : '',
          data: s,
        })),
        ...(diagnosticosRes.data || []).map(d => ({
          tipo: 'diagnostico',
          fecha: d.fechaDiagnostico,
          titulo: 'Diagnóstico',
          descripcion: `${d.codigoCIE11} - ${d.descripcion}`,
          doctor: `Dr. ${d.doctor?.nombre} ${d.doctor?.apellido}`,
          data: d,
        })),
        ...(alertasRes.data || []).map(a => ({
          tipo: 'alerta',
          fecha: a.createdAt,
          titulo: `Alerta ${a.tipo}`,
          descripcion: a.descripcion,
          doctor: '',
          data: a,
        })),
        ...(interconsultasRes.data || []).map(i => ({
          tipo: 'interconsulta',
          fecha: i.fechaSolicitud,
          titulo: `Interconsulta - ${i.especialidadSolicitada}`,
          descripcion: i.motivoConsulta,
          doctor: `Dr. ${i.medicoSolicitante?.nombre} ${i.medicoSolicitante?.apellido}`,
          data: i,
        })),
        ...(procedimientosRes.data || []).map(p => ({
          tipo: 'procedimiento',
          fecha: p.fechaProgramada || p.createdAt,
          titulo: p.nombre,
          descripcion: p.descripcion,
          doctor: `Dr. ${p.medicoResponsable?.nombre} ${p.medicoResponsable?.apellido}`,
          data: p,
        })),
        ...(admisionesRes.data?.admisiones || []).map(a => ({
          tipo: 'admision',
          fecha: a.fechaIngreso,
          titulo: 'Admisión Hospitalaria',
          descripcion: a.motivoIngreso,
          doctor: '',
          data: a,
        })),
        ...(admisionesRes.data?.admisiones || [])
          .filter(a => a.egreso)
          .map(a => ({
            tipo: 'egreso',
            fecha: a.egreso.fechaEgreso,
            titulo: `Egreso - ${a.egreso.tipoEgreso}`,
            descripcion: a.egreso.diagnosticoEgreso,
            doctor: '',
            data: a.egreso,
          })),
      ];

      // Ordenar por fecha descendente
      todosEventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setEventos(todosEventos);
    } catch (error) {
      console.error('Error al cargar timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarEventos = () => {
    let eventosFiltrados = [...eventos];

    // Filtrar por tipo
    if (filtroTipo !== 'todos') {
      eventosFiltrados = eventosFiltrados.filter(e => e.tipo === filtroTipo);
    }

    // Filtrar por fecha
    if (filtroFecha !== 'todos') {
      const ahora = new Date();
      const diasAtras = {
        '7dias': 7,
        '30dias': 30,
        '90dias': 90,
      }[filtroFecha];

      if (diasAtras) {
        const fechaLimite = new Date(ahora.getTime() - diasAtras * 24 * 60 * 60 * 1000);
        eventosFiltrados = eventosFiltrados.filter(e => new Date(e.fecha) >= fechaLimite);
      }
    }

    return eventosFiltrados;
  };

  const eventosFiltrados = filtrarEventos();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Timeline Clínico</h3>
          <p className="text-sm text-gray-500">Historia cronológica completa del paciente</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los eventos</SelectItem>
              {Object.entries(TIPOS_EVENTO).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroFecha} onValueChange={setFiltroFecha}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo el historial</SelectItem>
              <SelectItem value="7dias">Últimos 7 días</SelectItem>
              <SelectItem value="30dias">Últimos 30 días</SelectItem>
              <SelectItem value="90dias">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contador de eventos */}
      <div className="flex gap-2">
        <Badge variant="outline" className="text-sm">
          {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Timeline */}
      {eventosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay eventos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Línea vertical del timeline */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Eventos */}
          <div className="space-y-6">
            {eventosFiltrados.map((evento, index) => {
              const tipoEvento = TIPOS_EVENTO[evento.tipo];
              const Icon = tipoEvento.icon;

              return (
                <div key={`${evento.tipo}-${index}`} className="relative pl-16">
                  {/* Icono del evento */}
                  <div className={`absolute left-0 flex items-center justify-center w-12 h-12 rounded-full ${tipoEvento.iconBg}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Contenido del evento */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={tipoEvento.color}>
                              {tipoEvento.label}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(evento.fecha)}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{evento.titulo}</h4>
                          <p className="text-sm text-gray-600 mb-2">{evento.descripcion}</p>
                          {evento.doctor && (
                            <p className="text-xs text-gray-500">{evento.doctor}</p>
                          )}
                        </div>

                        {/* Estado específico por tipo */}
                        {evento.tipo === 'interconsulta' && evento.data.estado && (
                          <Badge variant="outline" className="text-xs">
                            {evento.data.estado}
                          </Badge>
                        )}
                        {evento.tipo === 'procedimiento' && evento.data.estado && (
                          <Badge variant="outline" className="text-xs">
                            {evento.data.estado}
                          </Badge>
                        )}
                        {evento.tipo === 'diagnostico' && evento.data.tipo && (
                          <Badge variant="outline" className="text-xs">
                            {evento.data.tipo}
                          </Badge>
                        )}
                        {evento.tipo === 'alerta' && evento.data.severidad && (
                          <Badge 
                            className={
                              evento.data.severidad === 'Critica' ? 'bg-red-100 text-red-800' :
                              evento.data.severidad === 'Alta' ? 'bg-orange-100 text-orange-800' :
                              evento.data.severidad === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }
                          >
                            {evento.data.severidad}
                          </Badge>
                        )}
                      </div>

                      {/* Detalles adicionales según el tipo */}
                      {evento.tipo === 'signoVital' && evento.data && (
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">PA:</span>
                            <span className="ml-1 font-medium">{evento.data.presionArterialSistolica}/{evento.data.presionArterialDiastolica}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">FC:</span>
                            <span className="ml-1 font-medium">{evento.data.frecuenciaCardiaca}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Temp:</span>
                            <span className="ml-1 font-medium">{evento.data.temperatura}°C</span>
                          </div>
                          <div>
                            <span className="text-gray-500">SpO2:</span>
                            <span className="ml-1 font-medium">{evento.data.saturacionOxigeno}%</span>
                          </div>
                        </div>
                      )}

                      {evento.tipo === 'evolucion' && evento.data && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {evento.data.objetivo && (
                              <div>
                                <p className="text-gray-500 mb-1">Objetivo:</p>
                                <p className="text-gray-700">{evento.data.objetivo}</p>
                              </div>
                            )}
                            {evento.data.plan && (
                              <div>
                                <p className="text-gray-500 mb-1">Plan:</p>
                                <p className="text-gray-700">{evento.data.plan}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumen de estadísticas */}
      {eventosFiltrados.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Resumen del Timeline</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(
                eventosFiltrados.reduce((acc, e) => {
                  acc[e.tipo] = (acc[e.tipo] || 0) + 1;
                  return acc;
                }, {})
              ).map(([tipo, count]) => {
                const tipoEvento = TIPOS_EVENTO[tipo];
                const Icon = tipoEvento.icon;
                return (
                  <div key={tipo} className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${tipoEvento.iconBg}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{tipoEvento.label}</p>
                      <p className="text-lg font-semibold text-gray-900">{count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
