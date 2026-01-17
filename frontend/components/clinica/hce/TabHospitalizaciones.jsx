'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Bed,
  Clock,
  Calendar,
  MapPin,
  User,
  Eye,
  ArrowRight,
  Building2
} from 'lucide-react';

const ESTADO_COLORS = {
  'Activa': 'bg-green-100 text-green-700 border-green-200',
  'Egresada': 'bg-blue-100 text-blue-700 border-blue-200',
  'Cancelada': 'bg-red-100 text-red-700 border-red-200',
  'Transferida': 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function TabHospitalizaciones({ pacienteId }) {
  const [hospitalizaciones, setHospitalizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hospitalizacionSeleccionada, setHospitalizacionSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    if (pacienteId) {
      loadHospitalizaciones();
    }
  }, [pacienteId]);

  const loadHospitalizaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/admisiones?pacienteId=${pacienteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const admisiones = data.data?.admisiones || data.admisiones || [];
        const sorted = admisiones.sort((a, b) =>
          new Date(b.fechaIngreso) - new Date(a.fechaIngreso)
        );
        setHospitalizaciones(sorted);
      }
    } catch (error) {
      console.error('Error cargando hospitalizaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Bogota'
    });
  };

  const formatDateTime = (dateString) => {
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

  const calcularDiasEstancia = (fechaIngreso, fechaEgreso) => {
    const inicio = new Date(fechaIngreso);
    const fin = fechaEgreso ? new Date(fechaEgreso) : new Date();
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const verDetalle = (hospitalizacion) => {
    setHospitalizacionSeleccionada(hospitalizacion);
    setMostrarModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-lg">
              <Bed className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Historial de Hospitalizaciones</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Registro de admisiones y estancias hospitalarias del paciente
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estadísticas */}
      {hospitalizaciones.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-700">{hospitalizaciones.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-700">
                {hospitalizaciones.filter(h => h.estado === 'Activa').length}
              </p>
              <p className="text-sm text-green-600">Activas</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">
                {hospitalizaciones.filter(h => h.estado === 'Egresada').length}
              </p>
              <p className="text-sm text-blue-600">Egresadas</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-700">
                {hospitalizaciones.reduce((acc, h) => acc + calcularDiasEstancia(h.fechaIngreso, h.fechaEgreso), 0)}
              </p>
              <p className="text-sm text-purple-600">Días Totales</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Hospitalizaciones */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando hospitalizaciones...</p>
          </CardContent>
        </Card>
      ) : hospitalizaciones.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Bed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay hospitalizaciones registradas</p>
              <p className="text-sm text-gray-500">
                Las hospitalizaciones aparecerán aquí cuando se registren
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {hospitalizaciones.map((hospitalizacion) => (
            <Card key={hospitalizacion.id} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${hospitalizacion.estado === 'Activa' ? 'bg-green-100' : 'bg-indigo-100'}`}>
                      <Bed className={`w-5 h-5 ${hospitalizacion.estado === 'Activa' ? 'text-green-600' : 'text-indigo-600'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {hospitalizacion.unidad?.nombre || 'Unidad no especificada'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {hospitalizacion.cama ? `Cama ${hospitalizacion.cama.numero}` : 'Sin cama asignada'}
                        {hospitalizacion.cama?.habitacion && ` - Hab. ${hospitalizacion.cama.habitacion.numero}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${ESTADO_COLORS[hospitalizacion.estado] || 'bg-gray-100'} border`}>
                      {hospitalizacion.estado}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => verDetalle(hospitalizacion)}
                      className="hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Ingreso:</span>
                      <span className="ml-1 font-medium">{formatDate(hospitalizacion.fechaIngreso)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Egreso:</span>
                      <span className="ml-1 font-medium">
                        {hospitalizacion.fechaEgreso ? formatDate(hospitalizacion.fechaEgreso) : 'Hospitalizado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Estancia:</span>
                      <span className="ml-1 font-medium">
                        {calcularDiasEstancia(hospitalizacion.fechaIngreso, hospitalizacion.fechaEgreso)} días
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-1">Motivo de Ingreso</p>
                  <p className="text-sm">{hospitalizacion.motivoIngreso || 'No especificado'}</p>
                </div>

                {hospitalizacion.diagnosticoIngreso && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Diagnóstico de Ingreso</p>
                    <p className="text-sm bg-blue-50 p-2 rounded">{hospitalizacion.diagnosticoIngreso}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalle */}
      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-indigo-600" />
              Detalle de Hospitalización
            </DialogTitle>
          </DialogHeader>
          {hospitalizacionSeleccionada && (
            <div className="space-y-6">
              {/* Estado y Ubicación */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Estado</span>
                  <Badge className={`mt-1 ${ESTADO_COLORS[hospitalizacionSeleccionada.estado]} border`}>
                    {hospitalizacionSeleccionada.estado}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Unidad</span>
                  <p className="font-semibold">{hospitalizacionSeleccionada.unidad?.nombre || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Habitación</span>
                  <p className="font-semibold">{hospitalizacionSeleccionada.cama?.habitacion?.numero || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Cama</span>
                  <p className="font-semibold">{hospitalizacionSeleccionada.cama?.numero || 'N/A'}</p>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Fecha de Ingreso</span>
                  <p className="font-semibold">{formatDateTime(hospitalizacionSeleccionada.fechaIngreso)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Fecha de Egreso</span>
                  <p className="font-semibold">
                    {hospitalizacionSeleccionada.fechaEgreso
                      ? formatDateTime(hospitalizacionSeleccionada.fechaEgreso)
                      : 'Aún hospitalizado'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Días de Estancia</span>
                  <p className="font-semibold text-indigo-600">
                    {calcularDiasEstancia(hospitalizacionSeleccionada.fechaIngreso, hospitalizacionSeleccionada.fechaEgreso)} días
                  </p>
                </div>
              </div>

              {/* Motivo y Diagnósticos */}
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">Motivo de Ingreso</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{hospitalizacionSeleccionada.motivoIngreso}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Diagnóstico de Ingreso</span>
                  <p className="mt-1 p-3 bg-blue-50 rounded text-sm">{hospitalizacionSeleccionada.diagnosticoIngreso}</p>
                </div>

                {hospitalizacionSeleccionada.diagnosticoEgreso && (
                  <div>
                    <span className="text-sm text-gray-600">Diagnóstico de Egreso</span>
                    <p className="mt-1 p-3 bg-green-50 rounded text-sm">{hospitalizacionSeleccionada.diagnosticoEgreso}</p>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              {hospitalizacionSeleccionada.observaciones && (
                <div>
                  <span className="text-sm text-gray-600">Observaciones</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{hospitalizacionSeleccionada.observaciones}</p>
                </div>
              )}

              {/* Movimientos */}
              {hospitalizacionSeleccionada.movimientos && hospitalizacionSeleccionada.movimientos.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600 font-semibold">Historial de Movimientos</span>
                  <div className="mt-2 space-y-2">
                    {hospitalizacionSeleccionada.movimientos.map((mov, index) => (
                      <div key={mov.id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-white rounded-full">
                          <ArrowRight className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{mov.tipo}</p>
                          <p className="text-xs text-gray-500">{mov.motivo}</p>
                        </div>
                        <p className="text-xs text-gray-500">{formatDateTime(mov.fechaMovimiento)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
