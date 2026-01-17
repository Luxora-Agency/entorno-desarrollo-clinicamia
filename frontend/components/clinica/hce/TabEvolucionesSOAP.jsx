'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  User,
  Stethoscope,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function TabEvolucionesSOAP({ pacienteId }) {
  const [evoluciones, setEvoluciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      loadEvoluciones();
    }
  }, [pacienteId]);

  const loadEvoluciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/evoluciones?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Ordenar por más reciente primero
        const sorted = (data.data || []).sort((a, b) => 
          new Date(b.fechaEvolucion || b.createdAt) - new Date(a.fechaEvolucion || a.createdAt)
        );
        setEvoluciones(sorted);
      }
    } catch (error) {
      console.error('Error cargando evoluciones:', error);
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

  return (
    <div className="space-y-6">
      {/* Header - Solo Lectura */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Historial de Evoluciones SOAP</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Vista cronológica de todas las evoluciones clínicas del paciente (Solo Lectura)
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline de Evoluciones - Solo Lectura */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando evoluciones...</p>
          </CardContent>
        </Card>
      ) : evoluciones.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay evoluciones registradas</p>
              <p className="text-sm text-gray-500">
                Las evoluciones SOAP se crean durante la consulta médica
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Contador */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">
            <Calendar className="h-4 w-4" />
            <span>Total de evoluciones: <strong>{evoluciones.length}</strong></span>
          </div>

          {/* Timeline Cards */}
          {evoluciones.map((evolucion, index) => (
            <Card key={evolucion.id} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                {/* Header de la evolución */}
                <div className="flex items-start justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {evolucion.profesional?.nombre || evolucion.doctor?.nombre || 'N/A'} {evolucion.profesional?.apellido || evolucion.doctor?.apellido || ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {evolucion.profesional?.especialidad || evolucion.doctor?.especialidad || 'Profesional de salud'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(evolucion.createdAt || evolucion.fechaEvolucion)}
                    </div>
                    {evolucion.firma_digital !== false && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Firmado digitalmente
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Contenido SOAP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">S</span>
                      <span className="font-semibold text-gray-700">Subjetivo</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-100">
                      {evolucion.subjetivo || 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-bold">O</span>
                      <span className="font-semibold text-gray-700">Objetivo</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-100">
                      {evolucion.objetivo || 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm font-bold">A</span>
                      <span className="font-semibold text-gray-700">Análisis</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-100">
                      {evolucion.analisis || 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-bold">P</span>
                      <span className="font-semibold text-gray-700">Plan</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded border border-purple-100">
                      {evolucion.plan || 'No registrado'}
                    </p>
                  </div>
                </div>

                {/* Información adicional si existe */}
                {evolucion.tipoEvolucion && (
                  <div className="mt-3 pt-3 border-t">
                    <Badge variant="outline" className="text-xs">
                      {evolucion.tipoEvolucion}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
