'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  User,
  Activity,
  Calendar,
  ClipboardList
} from 'lucide-react';

export default function TabNotasEnfermeria({ pacienteId }) {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      loadNotas();
    }
  }, [pacienteId]);

  const loadNotas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/notas-enfermeria/paciente/${pacienteId}?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Ordenar por más reciente primero (si no vienen ordenadas)
        const sorted = (data.data?.notas || []).sort((a, b) => 
          new Date(b.fechaHora || b.createdAt) - new Date(a.fechaHora || a.createdAt)
        );
        setNotas(sorted);
      }
    } catch (error) {
      console.error('Error cargando notas de enfermería:', error);
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

  const getTipoColor = (tipo) => {
    const colores = {
      'Evolucion': 'bg-blue-100 text-blue-700',
      'Procedimiento': 'bg-green-100 text-green-700',
      'Observacion': 'bg-yellow-100 text-yellow-700',
      'Evento Adverso': 'bg-red-100 text-red-700',
    };
    return colores[tipo] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header - Solo Lectura */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Notas de Enfermería</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Registro de cuidados y observaciones de enfermería (Solo Lectura)
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline de Notas */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando notas...</p>
          </CardContent>
        </Card>
      ) : notas.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay notas de enfermería registradas</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Contador */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">
            <Calendar className="h-4 w-4" />
            <span>Total de notas: <strong>{notas.length}</strong></span>
          </div>

          {/* Notas Cards */}
          {notas.map((nota) => (
            <Card key={nota.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                {/* Header de la nota */}
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Enf. {nota.enfermera?.nombre} {nota.enfermera?.apellido}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Turno: {nota.turno}
                        </Badge>
                        <Badge className={getTipoColor(nota.tipoNota)}>
                          {nota.tipoNota}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {formatDate(nota.fechaHora)}
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div>
                  {nota.titulo && (
                    <h4 className="font-medium text-gray-900 mb-2">{nota.titulo}</h4>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {nota.contenido}
                  </p>
                </div>

                {/* Footer si requiere seguimiento */}
                {nota.requiereSeguimiento && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2 text-amber-600 text-sm font-medium">
                    <Activity className="w-4 h-4" />
                    Requiere seguimiento
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
