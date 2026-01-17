'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,
  Calendar,
  User,
  Hand,
  Eye,
  Ear,
  Heart,
  Wind,
  Brain,
  Bone,
  Droplets,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Configuración de sistemas según orden del PDF Resumen de Atención
const SISTEMAS_CONFIG = [
  { id: 'piel', label: 'Piel y Faneras', icon: Hand, color: 'amber' },
  { id: 'cabeza', label: 'Cabeza', icon: User, color: 'blue' },
  { id: 'ojos', label: 'Ojos', icon: Eye, color: 'indigo' },
  { id: 'nariz', label: 'Nariz', icon: User, color: 'cyan' },
  { id: 'oidos', label: 'Oídos', icon: Ear, color: 'purple' },
  { id: 'bocaFaringe', label: 'Boca y Faringe', icon: User, color: 'pink' },
  { id: 'cuello', label: 'Cuello', icon: User, color: 'teal' },
  { id: 'torax', label: 'Tórax', icon: Wind, color: 'sky' },
  { id: 'corazon', label: 'Corazón', icon: Heart, color: 'red' },
  { id: 'abdomen', label: 'Abdomen', icon: User, color: 'orange' },
  { id: 'genitourinario', label: 'Genitourinario', icon: Droplets, color: 'violet' },
  { id: 'extremidades', label: 'Extremidades', icon: Bone, color: 'lime' },
  { id: 'sistemaNervioso', label: 'Sistema Nervioso', icon: Brain, color: 'fuchsia' },
];

// Mapeo legacy de sistemas
const LEGACY_MAPPING = {
  general: 'piel',
  cabezaCuello: 'cabeza',
  cardiovascular: 'corazon',
  respiratorio: 'torax',
  gastrointestinal: 'abdomen',
  musculoesqueletico: 'extremidades',
  neurologico: 'sistemaNervioso',
  narizGarganta: 'nariz',
};

export default function TabExamenFisico({ pacienteId }) {
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExamen, setExpandedExamen] = useState(null);
  const [vistaAgrupada, setVistaAgrupada] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      cargarExamenes();
    }
  }, [pacienteId]);

  const cargarExamenes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Cargar evoluciones que contengan examen físico
      const response = await fetch(
        `${apiUrl}/evoluciones?paciente_id=${pacienteId}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const evoluciones = data.data || [];

        // Filtrar evoluciones que tienen examen físico
        const conExamenFisico = evoluciones.filter(ev => {
          const examenFisico = ev.signosVitales?.examenFisico ||
                               ev.vitales?.examenFisico ||
                               ev.examenFisico;
          return examenFisico && Object.keys(examenFisico).length > 0;
        });

        // Ordenar por fecha más reciente
        const sorted = conExamenFisico.sort((a, b) =>
          new Date(b.fechaEvolucion || b.createdAt) - new Date(a.fechaEvolucion || a.createdAt)
        );

        setExamenes(sorted);

        // Expandir el más reciente
        if (sorted.length > 0) {
          setExpandedExamen(sorted[0].id);
        }
      }
    } catch (error) {
      console.error('Error cargando exámenes físicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    ,
      timeZone: 'America/Bogota'
    });
  };

  const getExamenFisico = (evolucion) => {
    return evolucion.signosVitales?.examenFisico ||
           evolucion.vitales?.examenFisico ||
           evolucion.examenFisico ||
           {};
  };

  const normalizarSistema = (sistemaId) => {
    return LEGACY_MAPPING[sistemaId] || sistemaId;
  };

  const getSistemaConfig = (sistemaId) => {
    const normalizado = normalizarSistema(sistemaId);
    return SISTEMAS_CONFIG.find(s => s.id === normalizado) || {
      id: sistemaId,
      label: sistemaId,
      icon: Stethoscope,
      color: 'gray'
    };
  };

  const contarHallazgos = (examenFisico) => {
    return Object.entries(examenFisico).filter(([, valor]) =>
      valor && valor !== 'Sin alteraciones' && valor !== 'Normal'
    ).length;
  };

  // Agrupar hallazgos por sistema a través del tiempo
  const getHallazgosPorSistema = () => {
    const agrupados = {};

    SISTEMAS_CONFIG.forEach(sistema => {
      agrupados[sistema.id] = [];
    });

    examenes.forEach(examen => {
      const examenFisico = getExamenFisico(examen);
      const fecha = examen.fechaEvolucion || examen.createdAt;

      Object.entries(examenFisico).forEach(([sistemaId, hallazgo]) => {
        if (hallazgo && hallazgo !== 'Sin alteraciones') {
          const normalizado = normalizarSistema(sistemaId);
          if (agrupados[normalizado]) {
            agrupados[normalizado].push({
              fecha,
              hallazgo,
              doctor: examen.doctor?.nombre || 'N/A'
            });
          }
        }
      });
    });

    return agrupados;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600 mb-4" />
          <p className="text-gray-600">Cargando historial de exámenes físicos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Historial de Examen Físico</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Hallazgos del examen físico por sistemas
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setVistaAgrupada(true)}
                className={`px-3 py-1 rounded text-sm ${
                  vistaAgrupada
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Por Sistema
              </button>
              <button
                onClick={() => setVistaAgrupada(false)}
                className={`px-3 py-1 rounded text-sm ${
                  !vistaAgrupada
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Cronológico
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {examenes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No hay exámenes físicos registrados</p>
            <p className="text-sm text-gray-500">
              Los hallazgos del examen físico aparecerán aquí después de registrar consultas
            </p>
          </CardContent>
        </Card>
      ) : vistaAgrupada ? (
        // Vista agrupada por sistema
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SISTEMAS_CONFIG.map((sistema) => {
            const hallazgos = getHallazgosPorSistema()[sistema.id];
            const Icon = sistema.icon;

            return (
              <Card key={sistema.id} className={`border-${sistema.color}-200`}>
                <CardHeader className={`bg-${sistema.color}-50 py-3`}>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className={`h-4 w-4 text-${sistema.color}-600`} />
                    {sistema.label}
                    {hallazgos.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {hallazgos.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  {hallazgos.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {hallazgos.slice(0, 5).map((h, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                          <p className="text-gray-700">{h.hallazgo}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(h.fecha)}
                          </p>
                        </div>
                      ))}
                      {hallazgos.length > 5 && (
                        <p className="text-xs text-center text-gray-500">
                          +{hallazgos.length - 5} más registros
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Sin hallazgos registrados
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Vista cronológica
        <div className="space-y-4">
          {examenes.map((examen) => {
            const examenFisico = getExamenFisico(examen);
            const hallazgosCount = contarHallazgos(examenFisico);
            const isExpanded = expandedExamen === examen.id;

            return (
              <Card key={examen.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedExamen(isExpanded ? null : examen.id)}
                  className="w-full"
                >
                  <CardHeader className="bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div className="text-left">
                          <p className="font-semibold">
                            {formatDate(examen.fechaEvolucion || examen.createdAt)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Dr(a). {examen.doctor?.nombre || 'N/A'} {examen.doctor?.apellido || ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hallazgosCount > 0 && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            {hallazgosCount} hallazgo{hallazgosCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(examenFisico).map(([sistemaId, hallazgo]) => {
                        const config = getSistemaConfig(sistemaId);
                        const Icon = config.icon;
                        const tieneAlteracion = hallazgo && hallazgo !== 'Sin alteraciones';

                        return (
                          <div
                            key={sistemaId}
                            className={`p-3 rounded-lg border ${
                              tieneAlteracion
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`h-4 w-4 ${
                                tieneAlteracion ? 'text-amber-600' : 'text-gray-500'
                              }`} />
                              <span className="font-medium text-sm">{config.label}</span>
                            </div>
                            <p className={`text-sm ${
                              tieneAlteracion ? 'text-amber-800' : 'text-gray-600'
                            }`}>
                              {hallazgo || 'Sin alteraciones'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
