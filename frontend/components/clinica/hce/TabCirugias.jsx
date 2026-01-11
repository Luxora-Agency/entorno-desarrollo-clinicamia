'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Scissors,
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Stethoscope,
  FileDown,
  Timer,
  Building2
} from 'lucide-react';
import { getAuthToken } from '@/services/api';

export default function TabCirugias({ pacienteId }) {
  const [cirugias, setCirugias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      loadCirugias();
    }
  }, [pacienteId]);

  const loadCirugias = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Filtrar solo procedimientos quirúrgicos
      const response = await fetch(
        `${apiUrl}/procedimientos?pacienteId=${pacienteId}&tipo=Quirurgico&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const sorted = (data.data || []).sort((a, b) =>
          new Date(b.fechaProgramada || b.createdAt) - new Date(a.fechaProgramada || a.createdAt)
        );
        setCirugias(sorted);
      }
    } catch (error) {
      console.error('Error cargando cirugías:', error);
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
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const getEstadoConfig = (estado) => {
    switch (estado) {
      case 'Completado':
        return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
      case 'Programado':
        return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar };
      case 'EnProceso':
        return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Activity };
      case 'Cancelado':
        return { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle };
      case 'Diferido':
        return { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock };
      default:
        return { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText };
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Emergencia':
        return 'bg-red-600 text-white';
      case 'Urgente':
        return 'bg-orange-500 text-white';
      case 'Electivo':
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const descargarProtocolo = (cirugiaId) => {
    const token = getAuthToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.open(`${apiUrl}/procedimientos/${cirugiaId}/protocolo-pdf?token=${token}&download=true`, '_blank');
  };

  const descargarBitacora = (cirugiaId) => {
    const token = getAuthToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.open(`${apiUrl}/procedimientos/${cirugiaId}/pdf?token=${token}&download=true`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Historial de Cirugías</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Registro de procedimientos quirúrgicos realizados al paciente
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      {!loading && cirugias.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-700">
                {cirugias.filter(c => c.estado === 'Completado').length}
              </p>
              <p className="text-sm text-green-600">Completadas</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {cirugias.filter(c => c.estado === 'Programado').length}
              </p>
              <p className="text-sm text-blue-600">Programadas</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">
                {cirugias.filter(c => c.estado === 'EnProceso').length}
              </p>
              <p className="text-sm text-yellow-600">En Proceso</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">
                {cirugias.length}
              </p>
              <p className="text-sm text-purple-600">Total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando historial de cirugías...</p>
          </CardContent>
        </Card>
      ) : cirugias.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay cirugías registradas</p>
              <p className="text-sm text-gray-500">
                Las cirugías se programan desde el módulo de Quirófano
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cirugias.map((cirugia) => {
            const estadoConfig = getEstadoConfig(cirugia.estado);
            const EstadoIcon = estadoConfig.icon;

            return (
              <Card key={cirugia.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Header de la cirugía */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold">{cirugia.nombre}</h3>
                        <div className="flex items-center gap-4 mt-1 text-purple-100 text-sm">
                          {cirugia.codigoCUPS && (
                            <span>CUPS: {cirugia.codigoCUPS}</span>
                          )}
                          {cirugia.tipoCirugia && (
                            <span>{cirugia.tipoCirugia}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getPrioridadColor(cirugia.prioridad)}>
                          {cirugia.prioridad || 'Electivo'}
                        </Badge>
                        <Badge className={`${estadoConfig.color} flex items-center gap-1`}>
                          <EstadoIcon className="w-3 h-3" />
                          {cirugia.estado}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-5 space-y-4">
                    {/* Info principal */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Fecha Programada</p>
                          <p className="text-sm font-medium">{formatDateShort(cirugia.fechaProgramada)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Duración</p>
                          <p className="text-sm font-medium">
                            {cirugia.duracionReal ? `${cirugia.duracionReal} min (real)` :
                             cirugia.duracionEstimada ? `${cirugia.duracionEstimada} min (est.)` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Quirófano</p>
                          <p className="text-sm font-medium">{cirugia.quirofano?.nombre || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Anestesia</p>
                          <p className="text-sm font-medium">{cirugia.tipoAnestesia || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Equipo Quirúrgico */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Equipo Quirúrgico
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Cirujano:</span>{' '}
                          <span className="font-medium">
                            {cirugia.medicoResponsable
                              ? `Dr(a). ${cirugia.medicoResponsable.nombre} ${cirugia.medicoResponsable.apellido}`
                              : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Anestesiólogo:</span>{' '}
                          <span className="font-medium">
                            {cirugia.anestesiologo
                              ? `Dr(a). ${cirugia.anestesiologo.nombre} ${cirugia.anestesiologo.apellido}`
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                      {cirugia.clasificacionASA && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            ASA {cirugia.clasificacionASA}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Diagnóstico */}
                    {cirugia.indicacion && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          Diagnóstico / Indicación
                        </h4>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-100">
                          {cirugia.codigoCIE10 && <span className="font-mono text-blue-700">[{cirugia.codigoCIE10}] </span>}
                          {cirugia.indicacion}
                        </p>
                      </div>
                    )}

                    {/* Técnica Utilizada (solo si completada) */}
                    {cirugia.estado === 'Completado' && cirugia.tecnicaUtilizada && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Técnica Quirúrgica</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                          {cirugia.tecnicaUtilizada}
                        </p>
                      </div>
                    )}

                    {/* Hallazgos (solo si completada) */}
                    {cirugia.estado === 'Completado' && cirugia.hallazgos && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Hallazgos Intraoperatorios</h4>
                        <p className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-100">
                          {cirugia.hallazgos}
                        </p>
                      </div>
                    )}

                    {/* Complicaciones (solo si existen) */}
                    {cirugia.complicaciones && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Complicaciones
                        </h4>
                        <p className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
                          {cirugia.complicaciones}
                        </p>
                      </div>
                    )}

                    {/* Resultados (solo si completada) */}
                    {cirugia.estado === 'Completado' && cirugia.resultados && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Resultados</h4>
                        <p className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-100">
                          {cirugia.resultados}
                        </p>
                      </div>
                    )}

                    {/* Observaciones */}
                    {cirugia.observaciones && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Observaciones</h4>
                        <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-100">
                          {cirugia.observaciones}
                        </p>
                      </div>
                    )}

                    {/* Tiempos reales (si aplica) */}
                    {(cirugia.horaInicioReal || cirugia.horaFinReal) && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                        {cirugia.horaInicioReal && (
                          <span>Inicio real: {formatDate(cirugia.horaInicioReal)}</span>
                        )}
                        {cirugia.horaFinReal && (
                          <span>Fin real: {formatDate(cirugia.horaFinReal)}</span>
                        )}
                      </div>
                    )}

                    {/* Botones de descarga */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => descargarBitacora(cirugia.id)}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <FileDown className="w-4 h-4 mr-1" />
                        Bitácora
                      </Button>
                      {cirugia.estado === 'Completado' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => descargarProtocolo(cirugia.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <FileDown className="w-4 h-4 mr-1" />
                          Protocolo Quirúrgico
                        </Button>
                      )}
                    </div>

                    {/* Firma */}
                    {cirugia.firmaMedicoId && (
                      <div className="pt-2">
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Firmado digitalmente - {formatDate(cirugia.fechaFirma)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
