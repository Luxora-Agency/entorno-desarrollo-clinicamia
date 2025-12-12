'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Pill, 
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  Package
} from 'lucide-react';

export default function TabPrescripciones({ pacienteId }) {
  const [prescripciones, setPrescripciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      loadPrescripciones();
    }
  }, [pacienteId]);

  const loadPrescripciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/prescripciones?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const sorted = (data.data || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setPrescripciones(sorted);
      }
    } catch (error) {
      console.error('Error cargando prescripciones:', error);
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
      case 'Activa':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Finalizada':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Suspendida':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600 rounded-lg">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Historial de Prescripciones</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Registro cronológico de prescripciones médicas del paciente (Solo Lectura)
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando prescripciones...</p>
          </CardContent>
        </Card>
      ) : prescripciones.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay prescripciones registradas</p>
              <p className="text-sm text-gray-500">
                Las prescripciones se registran durante las consultas médicas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">
            <Calendar className="h-4 w-4" />
            <span>Total de prescripciones: <strong>{prescripciones.length}</strong></span>
          </div>

          {prescripciones.map((prescripcion) => (
            <Card key={prescripcion.id} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <User className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Dr. {prescripcion.medico?.nombre || 'N/A'} {prescripcion.medico?.apellido || ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {prescripcion.medico?.especialidad || 'Profesional de salud'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 w-4" />
                      {formatDate(prescripcion.createdAt)}
                    </div>
                    <Badge className={getEstadoColor(prescripcion.estado)}>
                      {prescripcion.estado}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {prescripcion.diagnostico && (
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <span className="text-sm font-semibold text-teal-900">Diagnóstico:</span>
                      <p className="text-gray-700 mt-1">{prescripcion.diagnostico}</p>
                    </div>
                  )}

                  {/* Medicamentos */}
                  {prescripcion.medicamentos && prescripcion.medicamentos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="h-5 w-5 text-teal-600" />
                        <span className="font-semibold text-gray-900">Medicamentos Prescritos ({prescripcion.medicamentos.length})</span>
                      </div>
                      <div className="space-y-2">
                        {prescripcion.medicamentos.map((med, index) => (
                          <div key={med.id || index} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {med.producto?.nombre || 'Medicamento'}
                                </p>
                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                  <p><strong>Dosis:</strong> {med.dosis}</p>
                                  <p><strong>Vía:</strong> {med.via}</p>
                                  <p><strong>Frecuencia:</strong> {med.frecuencia}</p>
                                  {med.duracionDias && (
                                    <p><strong>Duración:</strong> {med.duracionDias} días</p>
                                  )}
                                  {med.instrucciones && (
                                    <p className="text-xs bg-blue-50 p-2 rounded mt-2">
                                      <strong>Instrucciones:</strong> {med.instrucciones}
                                    </p>
                                  )}
                                  {med.frecuenciaDetalle && (
                                    <p className="text-xs text-gray-500 italic">{med.frecuenciaDetalle}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {prescripcion.observaciones && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Observaciones:</span>
                      <p className="text-gray-600 mt-1 bg-yellow-50 p-3 rounded border text-sm">
                        {prescripcion.observaciones}
                      </p>
                    </div>
                  )}

                  {prescripcion.firmaMedico && (
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
