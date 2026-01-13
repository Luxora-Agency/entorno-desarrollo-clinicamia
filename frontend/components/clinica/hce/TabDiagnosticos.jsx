'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  Clock,
  User,
  Calendar,
  FileText
} from 'lucide-react';

export default function TabDiagnosticos({ pacienteId }) {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      loadDiagnosticos();
    }
  }, [pacienteId]);

  const loadDiagnosticos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/diagnosticos?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const sorted = (data.data || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setDiagnosticos(sorted);
      }
    } catch (error) {
      console.error('Error cargando diagnósticos:', error);
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

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Resuelto':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cronico':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'Principal':
        return 'bg-purple-100 text-purple-700';
      case 'Relacionado':
        return 'bg-indigo-100 text-indigo-700';
      case 'Complicacion':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getClasificacionLabel = (clasificacion) => {
    switch (clasificacion) {
      case 'ImpresionDiagnostica':
        return { label: 'Impresión Diagnóstica', color: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'ConfirmadoNuevo':
        return { label: 'Confirmado Nuevo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'ConfirmadoRepetido':
        return { label: 'Confirmado Repetido', color: 'bg-sky-100 text-sky-700 border-sky-200' };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-600 rounded-lg">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Historial de Diagnósticos CIE-11</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Registro cronológico de diagnósticos del paciente (Solo Lectura)
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando diagnósticos...</p>
          </CardContent>
        </Card>
      ) : diagnosticos.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay diagnósticos registrados</p>
              <p className="text-sm text-gray-500">
                Los diagnósticos se registran durante las consultas médicas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">
            <Calendar className="h-4 w-4" />
            <span>Total de diagnósticos: <strong>{diagnosticos.length}</strong></span>
          </div>

          {diagnosticos.map((diagnostico) => (
            <Card key={diagnostico.id} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <User className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {diagnostico.doctor?.nombre || 'N/A'} {diagnostico.doctor?.apellido || ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {diagnostico.doctor?.especialidad || 'Profesional de salud'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      {formatDate(diagnostico.createdAt)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getTipoColor(diagnostico.tipoDiagnostico)}>
                        {diagnostico.tipoDiagnostico}
                      </Badge>
                      <Badge className={getEstadoColor(diagnostico.estadoDiagnostico)}>
                        {diagnostico.estadoDiagnostico}
                      </Badge>
                      {diagnostico.clasificacion && getClasificacionLabel(diagnostico.clasificacion) && (
                        <Badge className={getClasificacionLabel(diagnostico.clasificacion).color}>
                          {getClasificacionLabel(diagnostico.clasificacion).label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-pink-600" />
                      <span className="font-semibold text-pink-900">Código CIE-11</span>
                    </div>
                    <p className="text-2xl font-bold text-pink-700">{diagnostico.codigoCIE11}</p>
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-gray-700">Descripción:</span>
                    <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded border">
                      {diagnostico.descripcionCIE11}
                    </p>
                  </div>

                  {diagnostico.observaciones && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Observaciones:</span>
                      <p className="text-gray-600 mt-1 bg-gray-50 p-3 rounded border text-sm">
                        {diagnostico.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
