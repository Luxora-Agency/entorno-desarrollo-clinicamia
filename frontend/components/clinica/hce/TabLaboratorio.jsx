'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  TestTubes,
  Clock,
  Calendar,
  User,
  FileText,
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Microscope,
  Beaker,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  RefreshCw
} from 'lucide-react';

export default function TabLaboratorio({ pacienteId, admisionId, user }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    if (pacienteId) {
      loadOrdenes();
    }
  }, [pacienteId]);

  const loadOrdenes = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/ordenes-medicas?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        // Obtener todas las órdenes del paciente
        const todasOrdenes = data.data || [];

        // Ordenar por fecha más reciente
        const sorted = todasOrdenes.sort((a, b) =>
          new Date(b.fechaOrden || b.createdAt) - new Date(a.fechaOrden || a.createdAt)
        );
        setOrdenes(sorted);
      }
    } catch (error) {
      console.error('Error cargando órdenes de laboratorio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtrar órdenes por búsqueda
  const filteredOrdenes = useMemo(() => {
    if (!searchTerm) return ordenes;
    const search = searchTerm.toLowerCase();
    return ordenes.filter(orden => {
      const nombre = orden.examenProcedimiento?.nombre || orden.observaciones || '';
      const descripcion = orden.examenProcedimiento?.descripcion || '';
      const doctor = `${orden.doctor?.nombre || ''} ${orden.doctor?.apellido || ''}`;
      return nombre.toLowerCase().includes(search) ||
        descripcion.toLowerCase().includes(search) ||
        doctor.toLowerCase().includes(search);
    });
  }, [ordenes, searchTerm]);

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

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      Pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      EnProceso: 'bg-blue-100 text-blue-800 border-blue-300',
      Completada: 'bg-green-100 text-green-800 border-green-300',
      Cancelada: 'bg-red-100 text-red-800 border-red-300',
    };
    const iconos = {
      Pendiente: <Clock className="w-3 h-3 mr-1" />,
      EnProceso: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
      Completada: <CheckCircle2 className="w-3 h-3 mr-1" />,
      Cancelada: <XCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <Badge className={`${estilos[estado] || 'bg-gray-100'} flex items-center border`}>
        {iconos[estado]}
        {estado === 'EnProceso' ? 'En Proceso' : estado}
      </Badge>
    );
  };

  const getPrioridadBadge = (prioridad) => {
    const estilos = {
      Normal: 'bg-gray-100 text-gray-700',
      Alta: 'bg-orange-100 text-orange-700',
      Urgente: 'bg-red-100 text-red-700',
    };
    return (
      <Badge variant="outline" className={estilos[prioridad] || 'bg-gray-100'}>
        {prioridad}
      </Badge>
    );
  };

  const parseResultados = (resultadosStr) => {
    if (!resultadosStr) return null;
    try {
      return typeof resultadosStr === 'string' ? JSON.parse(resultadosStr) : resultadosStr;
    } catch {
      return { texto: resultadosStr };
    }
  };

  const getValorIndicador = (valor, min, max) => {
    if (!valor || (!min && !max)) return null;
    const numValor = parseFloat(valor);
    if (min && numValor < parseFloat(min)) return 'bajo';
    if (max && numValor > parseFloat(max)) return 'alto';
    return 'normal';
  };

  const handleVerResultados = (orden) => {
    setSelectedOrden(orden);
    setShowResultsModal(true);
  };

  const stats = {
    total: filteredOrdenes.length,
    pendientes: filteredOrdenes.filter(o => o.estado === 'Pendiente').length,
    enProceso: filteredOrdenes.filter(o => o.estado === 'EnProceso').length,
    completadas: filteredOrdenes.filter(o => o.estado === 'Completada').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-600 rounded-lg">
                <TestTubes className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Resultados de Laboratorio</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Historial de exámenes y resultados de laboratorio del paciente
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadOrdenes(true)}
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
          placeholder="Buscar por nombre del examen, descripción o médico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Beaker className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En Proceso</p>
                <p className="text-2xl font-bold text-blue-600">{stats.enProceso}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completados</p>
                <p className="text-2xl font-bold text-green-600">{stats.completadas}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Órdenes */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mr-3" />
              <p className="text-gray-600">Cargando resultados de laboratorio...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredOrdenes.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              {searchTerm ? (
                <>
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No se encontraron resultados para "{searchTerm}"</p>
                </>
              ) : (
                <>
                  <TestTubes className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No hay exámenes de laboratorio registrados</p>
                  <p className="text-sm text-gray-500">
                    Los exámenes de laboratorio se ordenan durante las consultas médicas
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Examen</TableHead>
                  <TableHead className="font-semibold">Fecha Orden</TableHead>
                  <TableHead className="font-semibold">Fecha Resultado</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Prioridad</TableHead>
                  <TableHead className="font-semibold">Solicitante</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdenes.map((orden) => (
                  <TableRow key={orden.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Microscope className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {orden.examenProcedimiento?.nombre || 'Examen'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {orden.examenProcedimiento?.descripcion?.substring(0, 50) || ''}
                            {orden.examenProcedimiento?.descripcion?.length > 50 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDateShort(orden.fechaOrden)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {orden.fechaEjecucion ? (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          {formatDateShort(orden.fechaEjecucion)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell>{getEstadoBadge(orden.estado)}</TableCell>
                    <TableCell>{getPrioridadBadge(orden.prioridad)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>
                          Dr. {orden.doctor?.nombre} {orden.doctor?.apellido?.charAt(0)}.
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {orden.estado === 'Completada' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerResultados(orden)}
                          className="text-teal-600 border-teal-200 hover:bg-teal-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Resultados
                        </Button>
                      )}
                      {orden.estado === 'Pendiente' && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                          <Clock className="w-3 h-3 mr-1" />
                          En espera
                        </Badge>
                      )}
                      {orden.estado === 'EnProceso' && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Procesando
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Resultados */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTubes className="w-5 h-5 text-teal-600" />
              Resultados de Laboratorio
            </DialogTitle>
          </DialogHeader>

          {selectedOrden && (
            <div className="space-y-6">
              {/* Info del Examen */}
              <Card className="bg-teal-50 border-teal-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Examen</p>
                      <p className="font-semibold text-gray-900">
                        {selectedOrden.examenProcedimiento?.nombre}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Resultado</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(selectedOrden.fechaEjecucion)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Solicitado por</p>
                      <p className="font-semibold text-gray-900">
                        Dr. {selectedOrden.doctor?.nombre} {selectedOrden.doctor?.apellido}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Procesado por</p>
                      <p className="font-semibold text-gray-900">
                        {selectedOrden.ejecutador?.nombre
                          ? `${selectedOrden.ejecutador.nombre} ${selectedOrden.ejecutador.apellido}`
                          : 'Laboratorio'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resultados */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Resultados del Análisis
                </h3>

                {selectedOrden.resultados ? (
                  <ResultadosDisplay resultados={parseResultados(selectedOrden.resultados)} />
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      No hay resultados registrados
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Observaciones */}
              {selectedOrden.observaciones && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Observaciones</h3>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedOrden.observaciones}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Archivo PDF */}
              {selectedOrden.archivoResultado && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedOrden.archivoResultado, '_blank')}
                    className="text-teal-600 border-teal-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF Completo
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para mostrar resultados estructurados
function ResultadosDisplay({ resultados }) {
  if (!resultados) return null;

  // Si es un string simple (texto plano)
  if (typeof resultados === 'string') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
            {resultados}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si tiene propiedad texto
  if (resultados.texto) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
            {resultados.texto}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si es un array de parámetros estructurados
  if (resultados.parametros && Array.isArray(resultados.parametros)) {
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Parámetro</TableHead>
                <TableHead className="text-center">Resultado</TableHead>
                <TableHead className="text-center">Unidad</TableHead>
                <TableHead className="text-center">Rango Normal</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultados.parametros.map((param, idx) => {
                const indicador = getValorIndicadorParam(param);
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{param.nombre}</TableCell>
                    <TableCell className="text-center font-semibold">
                      <span className={indicador === 'alto' ? 'text-red-600' : indicador === 'bajo' ? 'text-blue-600' : 'text-gray-900'}>
                        {param.valor}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-gray-500">{param.unidad || '-'}</TableCell>
                    <TableCell className="text-center text-gray-500">
                      {param.rangoMin && param.rangoMax
                        ? `${param.rangoMin} - ${param.rangoMax}`
                        : param.rangoRef || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {indicador === 'alto' && (
                        <Badge className="bg-red-100 text-red-700">
                          <TrendingUp className="w-3 h-3 mr-1" /> Alto
                        </Badge>
                      )}
                      {indicador === 'bajo' && (
                        <Badge className="bg-blue-100 text-blue-700">
                          <TrendingDown className="w-3 h-3 mr-1" /> Bajo
                        </Badge>
                      )}
                      {indicador === 'normal' && (
                        <Badge className="bg-green-100 text-green-700">
                          <Minus className="w-3 h-3 mr-1" /> Normal
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // Si es un objeto genérico, convertirlo en tabla de clave-valor
  if (typeof resultados === 'object' && resultados !== null) {
    const entries = Object.entries(resultados);

    // Si es un array, mostrar cada elemento
    if (Array.isArray(resultados)) {
      return (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-gray-500">{idx + 1}</TableCell>
                    <TableCell>
                      {typeof item === 'object' ? (
                        <div className="space-y-1">
                          {Object.entries(item).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="font-medium text-gray-600 capitalize">{formatLabel(k)}:</span>
                              <span className="text-gray-800">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        String(item)
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }

    // Si tiene múltiples propiedades, mostrar como tabla
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-1/3">Campo</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([key, value], idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-gray-700 capitalize">
                    {formatLabel(key)}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {typeof value === 'object' && value !== null
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // Fallback: mostrar como texto
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-gray-700">{String(resultados)}</div>
      </CardContent>
    </Card>
  );
}

// Función para formatear etiquetas de campos
function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\s/, '')
    .toLowerCase()
    .replace(/^./, str => str.toUpperCase());
}

function getValorIndicadorParam(param) {
  if (!param.valor || (!param.rangoMin && !param.rangoMax)) return null;
  const numValor = parseFloat(param.valor);
  if (isNaN(numValor)) return null;
  if (param.rangoMin && numValor < parseFloat(param.rangoMin)) return 'bajo';
  if (param.rangoMax && numValor > parseFloat(param.rangoMax)) return 'alto';
  return 'normal';
}
