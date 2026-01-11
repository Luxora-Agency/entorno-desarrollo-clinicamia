'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Microscope, Eye } from 'lucide-react';

const ESTADO_BADGES = {
  'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'EnProceso': 'bg-blue-100 text-blue-700 border-blue-200',
  'Completada': 'bg-green-100 text-green-700 border-green-200',
  'Cancelada': 'bg-red-100 text-red-700 border-red-200',
};

export default function TabExamenesProcedimientosPaciente({ pacienteId }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    if (pacienteId) {
      loadOrdenes();
    }
  }, [pacienteId]);

  const loadOrdenes = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/ordenes-medicas?paciente_id=${pacienteId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setOrdenes(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = (orden) => {
    setOrdenSeleccionada(orden);
    setMostrarModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getResultadoColor = (estado) => {
    switch (estado) {
      case 'Alto': return 'text-red-600 font-semibold';
      case 'Bajo': return 'text-orange-600 font-semibold';
      case 'Critico': return 'text-red-800 font-bold';
      case 'Normal': return 'text-green-600';
      case 'Positivo': return 'text-blue-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  const renderResultados = (resultadosRaw) => {
    let resultados = resultadosRaw;
    if (typeof resultados === 'string') {
      try {
        resultados = JSON.parse(resultados);
      } catch (e) {
        // Fallback to text
      }
    }

    const isStructured = typeof resultados === 'object' && resultados !== null;

    if (!isStructured) {
      return (
        <p className="mt-1 p-3 bg-green-50 rounded text-sm whitespace-pre-wrap">{String(resultados)}</p>
      );
    }

    return (
      <div className="mt-2 border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="py-2">Examen</TableHead>
              <TableHead className="py-2">Resultado</TableHead>
              <TableHead className="py-2">Unidad</TableHead>
              <TableHead className="py-2">Ref.</TableHead>
              <TableHead className="py-2">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(resultados).map(([examen, datos]) => (
              <TableRow key={examen}>
                <TableCell className="font-medium py-2">{examen}</TableCell>
                <TableCell className={`py-2 ${getResultadoColor(datos.estado)}`}>
                  {datos.valor}
                </TableCell>
                <TableCell className="text-gray-500 py-2">{datos.unidad}</TableCell>
                <TableCell className="text-gray-600 py-2">{datos.referencia}</TableCell>
                <TableCell className="py-2">
                  <Badge className={`bg-${datos.estado === 'Normal' ? 'green' : datos.estado === 'Alto' ? 'red' : 'orange'}-100 text-${datos.estado === 'Normal' ? 'green' : datos.estado === 'Alto' ? 'red' : 'orange'}-800 border-0`}>
                    {datos.estado}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-600 py-8">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Microscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Exámenes y Procedimientos</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Historial de órdenes médicas</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-700">{ordenes.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-700">
                {ordenes.filter(o => o.estado === 'Pendiente').length}
              </p>
              <p className="text-sm text-yellow-600">Pendientes</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-700">
                {ordenes.filter(o => o.estado === 'EnProceso').length}
              </p>
              <p className="text-sm text-blue-600">En Proceso</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-700">
                {ordenes.filter(o => o.estado === 'Completada').length}
              </p>
              <p className="text-sm text-green-600">Completadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {ordenes.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Microscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay exámenes registrados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Examen/Procedimiento</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell>{formatDate(orden.fechaOrden)}</TableCell>
                    <TableCell>{orden.examenProcedimiento?.nombre || 'N/A'}</TableCell>
                    <TableCell>
                      {orden.doctor ? `Dr. ${orden.doctor.nombre}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${ESTADO_BADGES[orden.estado]} border`}>
                        {orden.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => verDetalle(orden)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle</DialogTitle>
          </DialogHeader>
          {ordenSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Nombre:</span>
                  <p className="font-semibold">{ordenSeleccionada.examenProcedimiento?.nombre}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Estado:</span>
                  <Badge className={ESTADO_BADGES[ordenSeleccionada.estado]}>
                    {ordenSeleccionada.estado}
                  </Badge>
                </div>
              </div>
              {ordenSeleccionada.observaciones && (
                <div>
                  <span className="text-sm text-gray-600">Observaciones:</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{ordenSeleccionada.observaciones}</p>
                </div>
              )}
              {ordenSeleccionada.resultados && (
                <div>
                  <span className="text-sm text-gray-600">Resultados:</span>
                  {renderResultados(ordenSeleccionada.resultados)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}