'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Clock,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Scale,
  Calendar,
  TrendingUp,
  User
} from 'lucide-react';

export default function TabSignosVitales({ pacienteId }) {
  const [signosVitales, setSignosVitales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      loadSignosVitales();
    }
  }, [pacienteId]);

  const loadSignosVitales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/signos-vitales?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Ordenar por más reciente primero
        const sorted = (data.data || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setSignosVitales(sorted);
      }
    } catch (error) {
      console.error('Error cargando signos vitales:', error);
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

  const formatIMC = (imc) => {
    if (!imc) return null;
    const imcNum = parseFloat(imc);
    let categoria = '';
    let color = '';
    
    if (imcNum < 18.5) {
      categoria = 'Bajo peso';
      color = 'text-yellow-600 bg-yellow-50';
    } else if (imcNum < 25) {
      categoria = 'Normal';
      color = 'text-green-600 bg-green-50';
    } else if (imcNum < 30) {
      categoria = 'Sobrepeso';
      color = 'text-orange-600 bg-orange-50';
    } else {
      categoria = 'Obesidad';
      color = 'text-red-600 bg-red-50';
    }
    
    return { value: imcNum.toFixed(1), categoria, color };
  };

  return (
    <div className="space-y-6">
      {/* Header - Solo Lectura */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Historial de Signos Vitales</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Registro cronológico de signos vitales del paciente (Solo Lectura)
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline de Signos Vitales */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando signos vitales...</p>
          </CardContent>
        </Card>
      ) : signosVitales.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay signos vitales registrados</p>
              <p className="text-sm text-gray-500">
                Los signos vitales se registran durante las consultas médicas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Contador */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">
            <Calendar className="h-4 w-4" />
            <span>Total de registros: <strong>{signosVitales.length}</strong></span>
          </div>

          {/* Timeline Cards */}
          {signosVitales.map((signo) => {
            const imc = formatIMC(signo.imc);
            return (
              <Card key={signo.id} className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {signo.registrador?.nombre || 'N/A'} {signo.registrador?.apellido || ''}
                        </p>
                        <p className="text-sm text-gray-600">
                          {signo.registrador?.especialidad || 'Profesional de salud'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {formatDate(signo.createdAt)}
                    </div>
                  </div>

                  {/* Grid de Signos Vitales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Temperatura */}
                    {signo.temperatura && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Thermometer className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-gray-600">Temperatura</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{signo.temperatura}°C</p>
                      </div>
                    )}

                    {/* Presión Arterial */}
                    {(signo.presionSistolica || signo.presionDiastolica) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-gray-600">Presión Arterial</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          {signo.presionSistolica || '--'}/{signo.presionDiastolica || '--'}
                        </p>
                        <span className="text-xs text-gray-500">mmHg</span>
                      </div>
                    )}

                    {/* Frecuencia Cardíaca */}
                    {signo.frecuenciaCardiaca && (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart className="h-4 w-4 text-pink-600" />
                          <span className="text-xs text-gray-600">FC</span>
                        </div>
                        <p className="text-2xl font-bold text-pink-700">{signo.frecuenciaCardiaca}</p>
                        <span className="text-xs text-gray-500">lpm</span>
                      </div>
                    )}

                    {/* Frecuencia Respiratoria */}
                    {signo.frecuenciaRespiratoria && (
                      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Wind className="h-4 w-4 text-cyan-600" />
                          <span className="text-xs text-gray-600">FR</span>
                        </div>
                        <p className="text-2xl font-bold text-cyan-700">{signo.frecuenciaRespiratoria}</p>
                        <span className="text-xs text-gray-500">rpm</span>
                      </div>
                    )}

                    {/* Saturación de Oxígeno */}
                    {signo.saturacionOxigeno && (
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Droplets className="h-4 w-4 text-teal-600" />
                          <span className="text-xs text-gray-600">SpO₂</span>
                        </div>
                        <p className="text-2xl font-bold text-teal-700">{signo.saturacionOxigeno}%</p>
                      </div>
                    )}

                    {/* Peso */}
                    {signo.peso && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Scale className="h-4 w-4 text-amber-600" />
                          <span className="text-xs text-gray-600">Peso</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-700">{signo.peso}</p>
                        <span className="text-xs text-gray-500">kg</span>
                      </div>
                    )}

                    {/* Talla */}
                    {signo.talla && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-indigo-600" />
                          <span className="text-xs text-gray-600">Talla</span>
                        </div>
                        <p className="text-2xl font-bold text-indigo-700">{signo.talla}</p>
                        <span className="text-xs text-gray-500">cm</span>
                      </div>
                    )}

                    {/* IMC */}
                    {imc && (
                      <div className={`${imc.color} border rounded-lg p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs text-gray-600">IMC</span>
                        </div>
                        <p className="text-2xl font-bold">{imc.value}</p>
                        <Badge variant="outline" className="text-xs mt-1">{imc.categoria}</Badge>
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
