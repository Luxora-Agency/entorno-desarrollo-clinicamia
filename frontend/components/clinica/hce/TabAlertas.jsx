'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Clock,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function TabAlertas({ pacienteId }) {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      loadAlertas();
    }
  }, [pacienteId]);

  const loadAlertas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/alertas?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Ordenar: activas primero, luego por fecha
        const sorted = (data.data || []).sort((a, b) => {
          if (a.activa === b.activa) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return a.activa ? -1 : 1;
        });
        setAlertas(sorted);
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
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

  const getSeveridadConfig = (severidad) => {
    switch (severidad) {
      case 'Critica':
        return { color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle, bgCard: 'bg-red-50 border-red-300' };
      case 'Alta':
        return { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle, bgCard: 'bg-orange-50 border-orange-300' };
      case 'Media':
        return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: AlertCircle, bgCard: 'bg-yellow-50 border-yellow-300' };
      case 'Baja':
        return { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Info, bgCard: 'bg-blue-50 border-blue-300' };
      default:
        return { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Info, bgCard: 'bg-gray-50 border-gray-300' };
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'Alergia':
        return 'bg-red-100 text-red-700';
      case 'Medicamento':
        return 'bg-purple-100 text-purple-700';
      case 'Clinica':
        return 'bg-blue-100 text-blue-700';
      case 'Riesgo':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const alertasActivas = alertas.filter(a => a.activa);
  const alertasInactivas = alertas.filter(a => !a.activa);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Alertas Clínicas</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Registro de alertas médicas importantes del paciente (Solo Lectura)
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      {!loading && alertas.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-3xl font-bold text-red-700">{alertasActivas.length}</p>
                  <p className="text-sm text-red-600">Alertas Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-gray-600" />
                <div>
                  <p className="text-3xl font-bold text-gray-700">{alertasInactivas.length}</p>
                  <p className="text-sm text-gray-600">Historial</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando alertas...</p>
          </CardContent>
        </Card>
      ) : alertas.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay alertas registradas</p>
              <p className="text-sm text-gray-500">
                Las alertas se registran durante las consultas médicas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Alertas Activas */}
          {alertasActivas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas Activas ({alertasActivas.length})
              </h3>
              <div className="space-y-3">
                {alertasActivas.map((alerta) => {
                  const severidadConfig = getSeveridadConfig(alerta.severidad);
                  const IconComponent = severidadConfig.icon;
                  return (
                    <Card key={alerta.id} className={`border-2 ${severidadConfig.bgCard}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow">
                              <IconComponent className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">{alerta.titulo}</h4>
                              <div className="flex gap-2 mt-1">
                                <Badge className={getTipoColor(alerta.tipoAlerta)}>
                                  {alerta.tipoAlerta}
                                </Badge>
                                <Badge className={severidadConfig.color}>
                                  {alerta.severidad}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {formatDate(alerta.createdAt)}
                          </div>
                        </div>
                        <p className="text-gray-700 bg-white p-3 rounded border">
                          {alerta.descripcion}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historial */}
          {alertasInactivas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historial ({alertasInactivas.length})
              </h3>
              <div className="space-y-3">
                {alertasInactivas.map((alerta) => {
                  const severidadConfig = getSeveridadConfig(alerta.severidad);
                  return (
                    <Card key={alerta.id} className="border opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{alerta.titulo}</h4>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{alerta.tipoAlerta}</Badge>
                              <Badge variant="outline" className="text-xs">{alerta.severidad}</Badge>
                              <Badge variant="outline" className="text-xs bg-gray-200">Inactiva</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{alerta.descripcion}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatDate(alerta.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
