'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pill,
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  Package,
  RefreshCw,
  ShoppingCart,
  Search
} from 'lucide-react';

export default function TabPrescripciones({ pacienteId }) {
  const [prescripciones, setPrescripciones] = useState([]);
  const [ordenesMedicamentos, setOrdenesMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPrescripciones = useCallback(async () => {
    try {
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
    }
  }, [pacienteId]);

  const loadOrdenesMedicamentos = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/ordenes-medicamentos?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const sorted = (data.data || []).sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrdenesMedicamentos(sorted);
      }
    } catch (error) {
      console.error('Error cargando órdenes de medicamentos:', error);
    }
  }, [pacienteId]);

  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      await Promise.all([loadPrescripciones(), loadOrdenesMedicamentos()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadPrescripciones, loadOrdenesMedicamentos]);

  useEffect(() => {
    if (pacienteId) {
      loadAllData();
    }
  }, [pacienteId, loadAllData]);

  const handleRefresh = () => {
    loadAllData(true);
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

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Activa':
      case 'Pendiente':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Finalizada':
      case 'Completada':
      case 'Despachada':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Suspendida':
      case 'Cancelada':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Filtrar prescripciones
  const filteredPrescripciones = useMemo(() => {
    if (!searchTerm) return prescripciones;
    const search = searchTerm.toLowerCase();
    return prescripciones.filter(presc => {
      const medico = `${presc.medico?.nombre || ''} ${presc.medico?.apellido || ''}`;
      const diagnostico = presc.diagnostico || '';
      const medicamentos = presc.medicamentos?.map(m => m.producto?.nombre || '').join(' ') || '';
      return medico.toLowerCase().includes(search) ||
        diagnostico.toLowerCase().includes(search) ||
        medicamentos.toLowerCase().includes(search);
    });
  }, [prescripciones, searchTerm]);

  // Filtrar órdenes de medicamentos
  const filteredOrdenes = useMemo(() => {
    if (!searchTerm) return ordenesMedicamentos;
    const search = searchTerm.toLowerCase();
    return ordenesMedicamentos.filter(orden => {
      const medico = `${orden.doctor?.nombre || ''} ${orden.doctor?.apellido || ''}`;
      const observaciones = orden.observaciones || '';
      const items = orden.items?.map(i => i.producto?.nombre || '').join(' ') || '';
      return medico.toLowerCase().includes(search) ||
        observaciones.toLowerCase().includes(search) ||
        items.toLowerCase().includes(search);
    });
  }, [ordenesMedicamentos, searchTerm]);

  const totalItems = filteredPrescripciones.length + filteredOrdenes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-600 rounded-lg">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Historial de Prescripciones</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Prescripciones y órdenes de medicamentos del paciente (Solo Lectura)
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar por medicamento, diagnóstico o médico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando prescripciones...</p>
          </CardContent>
        </Card>
      ) : totalItems === 0 && !searchTerm ? (
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
        <>
          {/* Contador */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">
            <Calendar className="h-4 w-4" />
            <span>
              {searchTerm ? (
                <>Resultados encontrados: <strong>{totalItems}</strong></>
              ) : (
                <>
                  Total: <strong>{prescripciones.length}</strong> prescripciones,{' '}
                  <strong>{ordenesMedicamentos.length}</strong> órdenes
                </>
              )}
            </span>
          </div>

          {/* Órdenes de Medicamentos (Farmacia) */}
          {filteredOrdenes.length > 0 && (
            <Card className="border-2 border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-white pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Órdenes de Medicamentos ({filteredOrdenes.length})</CardTitle>
                    <p className="text-sm text-gray-600">
                      Órdenes enviadas a farmacia para despacho
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {filteredOrdenes.map((orden) => (
                    <div
                      key={orden.id}
                      className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <ShoppingCart className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              Orden #{orden.numero || orden.id?.substring(0, 8)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Dr. {orden.doctor?.nombre || 'N/A'} {orden.doctor?.apellido || ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getEstadoColor(orden.estado)}>
                            {orden.estado}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(orden.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Items de la orden */}
                      {orden.items && orden.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Medicamentos ({orden.items.length}):
                          </p>
                          <div className="space-y-2">
                            {orden.items.map((item, idx) => (
                              <div key={item.id || idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                <div>
                                  <span className="font-medium">{item.producto?.nombre || 'Medicamento'}</span>
                                  <span className="text-gray-500 ml-2">x{item.cantidad}</span>
                                </div>
                                {item.precioUnitario && (
                                  <span className="text-orange-600 font-medium">
                                    ${(item.precioUnitario * item.cantidad).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          {orden.total && (
                            <div className="mt-2 pt-2 border-t flex justify-between text-sm font-semibold">
                              <span>Total:</span>
                              <span className="text-orange-600">${orden.total.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {orden.observaciones && (
                        <div className="mt-3 text-sm text-gray-700 bg-yellow-50 p-2 rounded">
                          <strong>Observaciones:</strong> {orden.observaciones}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prescripciones */}
          {filteredPrescripciones.length > 0 && (
            <Card className="border-2 border-teal-200">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-white pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-600 rounded-lg">
                    <Pill className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Prescripciones Médicas ({filteredPrescripciones.length})</CardTitle>
                    <p className="text-sm text-gray-600">
                      Recetas y tratamientos prescritos
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {filteredPrescripciones.map((prescripcion) => (
                    <div key={prescripcion.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
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
                            <Clock className="w-4 h-4" />
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sin resultados de búsqueda */}
          {searchTerm && totalItems === 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No se encontraron resultados para "{searchTerm}"</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
