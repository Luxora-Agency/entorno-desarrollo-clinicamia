'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Stethoscope,
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  ClipboardList,
  Search,
  RefreshCw,
  TestTubes,
  Activity
} from 'lucide-react';

export default function TabProcedimientos({ pacienteId }) {
  const [procedimientos, setProcedimientos] = useState([]);
  const [ordenesMedicas, setOrdenesMedicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (pacienteId) {
      loadAllData();
    }
  }, [pacienteId]);

  const loadAllData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      await Promise.all([loadProcedimientos(), loadOrdenesMedicas()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadProcedimientos = async () => {
    try {
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
    }
  };

  const loadOrdenesMedicas = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/ordenes-medicas?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const sorted = (data.data || []).sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrdenesMedicas(sorted);
      }
    } catch (error) {
      console.error('Error cargando órdenes médicas:', error);
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

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Realizado':
      case 'Completada':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Programado':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EnProceso':
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cancelado':
      case 'Cancelada':
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

  // Separar órdenes médicas en exámenes y procedimientos (excluir kits de medicamentos)
  const { ordenesExamenes, ordenesProcedimientos } = useMemo(() => {
    const examenes = [];
    const procedimientos = [];

    ordenesMedicas.forEach(orden => {
      const tipo = orden.examenProcedimiento?.tipo;
      // Solo incluir si tiene examenProcedimiento (exámenes o procedimientos reales)
      // Los kits de medicamentos no tienen examenProcedimiento y van en prescripciones
      if (tipo === 'Examen') {
        examenes.push(orden);
      } else if (tipo === 'Procedimiento') {
        procedimientos.push(orden);
      }
      // Si no tiene tipo (kits, etc.), NO se incluye aquí - va en prescripciones
    });

    return { ordenesExamenes: examenes, ordenesProcedimientos: procedimientos };
  }, [ordenesMedicas]);

  // Filtrar por búsqueda
  const filterItems = (items, isOrden = true) => {
    if (!searchTerm) return items;
    const search = searchTerm.toLowerCase();

    if (isOrden) {
      return items.filter(orden => {
        const nombre = orden.examenProcedimiento?.nombre || orden.observaciones || '';
        const doctor = `${orden.doctor?.nombre || ''} ${orden.doctor?.apellido || ''}`;
        return nombre.toLowerCase().includes(search) || doctor.toLowerCase().includes(search);
      });
    } else {
      return items.filter(proc => {
        const nombre = proc.nombre || '';
        const descripcion = proc.descripcion || '';
        const doctor = `${proc.medicoResponsable?.nombre || ''} ${proc.medicoResponsable?.apellido || ''}`;
        return nombre.toLowerCase().includes(search) ||
          descripcion.toLowerCase().includes(search) ||
          doctor.toLowerCase().includes(search);
      });
    }
  };

  const filteredExamenes = filterItems(ordenesExamenes, true);
  const filteredOrdenesProcedimientos = filterItems(ordenesProcedimientos, true);
  const filteredProcedimientos = filterItems(procedimientos, false);

  const totalItems = filteredExamenes.length + filteredOrdenesProcedimientos.length + filteredProcedimientos.length;

  const renderOrdenCard = (orden, colorClass = 'orange') => (
    <div
      key={orden.id}
      className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-white"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">
            {orden.examenProcedimiento?.nombre || orden.observaciones?.split('\n')[0] || 'Orden médica'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {orden.examenProcedimiento?.descripcion || ''}
          </p>
          {orden.examenProcedimiento?.categoria?.nombre && (
            <Badge variant="outline" className="mt-1 text-xs">
              {orden.examenProcedimiento.categoria.nombre}
            </Badge>
          )}
        </div>
        <Badge className={getEstadoColor(orden.estado)}>
          {orden.estado}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {formatDate(orden.createdAt)}
        </div>
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          Dr. {orden.doctor?.nombre || 'N/A'} {orden.doctor?.apellido || ''}
        </div>
        {orden.precioAplicado > 0 && (
          <div className={`text-${colorClass}-600 font-medium`}>
            ${orden.precioAplicado?.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
          </div>
        )}
      </div>

      {orden.observaciones && !orden.examenProcedimiento && (
        <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
          {orden.observaciones}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Exámenes y Procedimientos</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Historial de exámenes y procedimientos del paciente (Solo Lectura)
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAllData(true)}
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
          placeholder="Buscar por nombre, descripción o médico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando...</p>
          </CardContent>
        </Card>
      ) : totalItems === 0 && !searchTerm ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay exámenes ni procedimientos registrados</p>
              <p className="text-sm text-gray-500">
                Los exámenes y procedimientos se registran durante las consultas médicas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Contador de resultados */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">
            <Calendar className="h-4 w-4" />
            <span>
              {searchTerm ? (
                <>Resultados encontrados: <strong>{totalItems}</strong></>
              ) : (
                <>
                  Total: <strong>{ordenesExamenes.length}</strong> exámenes,{' '}
                  <strong>{ordenesProcedimientos.length + procedimientos.length}</strong> procedimientos
                </>
              )}
            </span>
          </div>

          {/* Sección de Exámenes de Laboratorio */}
          {filteredExamenes.length > 0 && (
            <Card className="border-2 border-teal-200">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-white pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    <TestTubes className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Exámenes de Laboratorio ({filteredExamenes.length})</CardTitle>
                    <p className="text-sm text-gray-600">
                      Exámenes diagnósticos ordenados
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {filteredExamenes.map((orden) => renderOrdenCard(orden, 'teal'))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección de Procedimientos Ordenados */}
          {filteredOrdenesProcedimientos.length > 0 && (
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Procedimientos Ordenados ({filteredOrdenesProcedimientos.length})</CardTitle>
                    <p className="text-sm text-gray-600">
                      Procedimientos médicos solicitados
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {filteredOrdenesProcedimientos.map((orden) => renderOrdenCard(orden, 'purple'))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección de Procedimientos Realizados */}
          {filteredProcedimientos.length > 0 && (
            <Card className="border-2 border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-white pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <Stethoscope className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Procedimientos Realizados ({filteredProcedimientos.length})</CardTitle>
                    <p className="text-sm text-gray-600">
                      Procedimientos completados y documentados
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {filteredProcedimientos.map((procedimiento) => (
                    <div key={procedimiento.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-start justify-between mb-3">
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

                        {procedimiento.descripcion && (
                          <div>
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Descripción:
                            </span>
                            <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded border">
                              {procedimiento.descripcion}
                            </p>
                          </div>
                        )}

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
