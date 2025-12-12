'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle2
} from 'lucide-react';

export default function TabProcedimientos({ pacienteId }) {
  const [procedimientos, setProcedimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      loadProcedimientos();
    }
  }, [pacienteId]);

  const loadProcedimientos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/procedimientos?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const sorted = (data.data || []).sort((a, b) => 
          new Date(b.createdAt || b.fechaRealizada) - new Date(a.createdAt || a.fechaRealizada)
        );
        setProcedimientos(sorted);
      }
    } catch (error) {
      console.error('Error cargando procedimientos:', error);
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
      case 'Realizado':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Programado':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EnProceso':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'Diagnostico':
        return 'bg-blue-100 text-blue-700';
      case 'Terapeutico':
        return 'bg-green-100 text-green-700';
      case 'Quirurgico':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Historial de Procedimientos</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Registro cronológico de procedimientos realizados al paciente (Solo Lectura)
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando procedimientos...</p>
          </CardContent>
        </Card>
      ) : procedimientos.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay procedimientos registrados</p>
              <p className="text-sm text-gray-500">
                Los procedimientos se registran durante las consultas médicas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">
            <Calendar className="h-4 w-4" />
            <span>Total de procedimientos: <strong>{procedimientos.length}</strong></span>
          </div>

          {procedimientos.map((procedimiento) => (
            <Card key={procedimiento.id} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Dr. {procedimiento.medicoResponsable?.nombre || 'N/A'} {procedimiento.medicoResponsable?.apellido || ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {procedimiento.medicoResponsable?.especialidad || 'Profesional de salud'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      {formatDate(procedimiento.fechaRealizada || procedimiento.createdAt)}
                    </div>
                    <div className="flex gap-2">
                      {procedimiento.tipo && (
                        <Badge className={getTipoColor(procedimiento.tipo)}>
                          {procedimiento.tipo}
                        </Badge>
                      )}
                      <Badge className={getEstadoColor(procedimiento.estado)}>
                        {procedimiento.estado}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="h-5 w-5 text-indigo-600" />
                      <span className="font-semibold text-indigo-900 text-lg">Procedimiento</span>
                    </div>
                    <p className="text-xl font-bold text-indigo-700">{procedimiento.nombre}</p>
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Descripción:
                    </span>
                    <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded border">
                      {procedimiento.descripcion}
                    </p>
                  </div>

                  {procedimiento.indicacion && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Indicación:</span>
                      <p className="text-gray-600 mt-1 bg-blue-50 p-3 rounded border text-sm">
                        {procedimiento.indicacion}
                      </p>
                    </div>
                  )}

                  {procedimiento.observaciones && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Observaciones:</span>
                      <p className="text-gray-600 mt-1 bg-yellow-50 p-3 rounded border text-sm">
                        {procedimiento.observaciones}
                      </p>
                    </div>
                  )}

                  {procedimiento.firmaMedico && (
                    <div className="pt-3 border-t">
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Firmado digitalmente
                      </Badge>
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
