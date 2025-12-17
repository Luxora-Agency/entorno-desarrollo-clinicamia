'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Microscope, Eye, FileText, Clock } from 'lucide-react';

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

  if (loading) {
    return (
      <Card>
        <CardContent className=\"p-6\">
          <p className=\"text-center text-gray-600 py-8\">Cargando exámenes y procedimientos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className=\"space-y-6\">
      <Card className=\"border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white\">
        <CardHeader>
          <div className=\"flex items-center gap-3\">
            <div className=\"p-3 bg-purple-600 rounded-lg\">
              <Microscope className=\"w-6 h-6 text-white\" />
            </div>
            <div>
              <CardTitle className=\"text-2xl\">Exámenes y Procedimientos</CardTitle>
              <p className=\"text-sm text-gray-600 mt-1\">
                Historial de órdenes médicas del paciente
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
            <div className=\"text-center p-4 bg-gray-50 rounded-lg\">
              <p className=\"text-3xl font-bold text-gray-700\">{ordenes.length}</p>
              <p className=\"text-sm text-gray-600\">Total</p>
            </div>
            <div className=\"text-center p-4 bg-yellow-50 rounded-lg\">
              <p className=\"text-3xl font-bold text-yellow-700\">
                {ordenes.filter(o => o.estado === 'Pendiente').length}
              </p>
              <p className=\"text-sm text-yellow-600\">Pendientes</p>
            </div>
            <div className=\"text-center p-4 bg-blue-50 rounded-lg\">
              <p className=\"text-3xl font-bold text-blue-700\">
                {ordenes.filter(o => o.estado === 'EnProceso').length}
              </p>
              <p className=\"text-sm text-blue-600\">En Proceso</p>
            </div>
            <div className=\"text-center p-4 bg-green-50 rounded-lg\">
              <p className=\"text-3xl font-bold text-green-700\">
                {ordenes.filter(o => o.estado === 'Completada').length}
              </p>
              <p className=\"text-sm text-green-600\">Completadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {ordenes.length === 0 ? (
        <Card>
          <CardContent className=\"p-6\">
            <div className=\"text-center py-12\">
              <Microscope className=\"w-16 h-16 text-gray-300 mx-auto mb-4\" />
              <p className=\"text-gray-600\">No hay exámenes o procedimientos registrados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Listado de Órdenes Médicas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Orden</TableHead>
                  <TableHead>Examen/Procedimiento</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className=\"text-right\">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell>{formatDate(orden.fechaOrden)}</TableCell>
                    <TableCell>{orden.examenProcedimiento?.nombre || 'N/A'}</TableCell>
                    <TableCell>
                      {orden.doctor ? `Dr. ${orden.doctor.nombre} ${orden.doctor.apellido}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={orden.prioridad === 'Urgente' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                        {orden.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${ESTADO_BADGES[orden.estado]} border`}>
                        {orden.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className=\"text-right\">
                      <Button
                        size=\"sm\"
                        variant=\"ghost\"
                        onClick={() => verDetalle(orden)}
                        className=\"hover:bg-purple-50\"
                      >
                        <Eye className=\"w-4 h-4\" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalle */}
      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className=\"max-w-2xl\">
          <DialogHeader>
            <DialogTitle className=\"flex items-center gap-2\">
              <Microscope className=\"h-5 w-5 text-purple-600\" />
              Detalle de Orden Médica
            </DialogTitle>
          </DialogHeader>
          {ordenSeleccionada && (
            <div className=\"space-y-4\">
              <div className=\"grid grid-cols-2 gap-4\">
                <div>
                  <span className=\"text-sm text-gray-600\">Tipo:</span>
                  <p className=\"font-semibold\">{ordenSeleccionada.examenProcedimiento?.tipo || 'N/A'}</p>
                </div>
                <div>
                  <span className=\"text-sm text-gray-600\">Nombre:</span>
                  <p className=\"font-semibold\">{ordenSeleccionada.examenProcedimiento?.nombre || 'N/A'}</p>
                </div>
                <div>
                  <span className=\"text-sm text-gray-600\">Fecha de Orden:</span>
                  <p className=\"font-semibold\">{formatDate(ordenSeleccionada.fechaOrden)}</p>
                </div>
                <div>
                  <span className=\"text-sm text-gray-600\">Fecha de Ejecución:</span>
                  <p className=\"font-semibold\">{formatDate(ordenSeleccionada.fechaEjecucion)}</p>
                </div>
                <div>
                  <span className=\"text-sm text-gray-600\">Doctor Solicitante:</span>
                  <p className=\"font-semibold\">
                    {ordenSeleccionada.doctor ? `Dr. ${ordenSeleccionada.doctor.nombre} ${ordenSeleccionada.doctor.apellido}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className=\"text-sm text-gray-600\">Prioridad:</span>
                  <Badge className={ordenSeleccionada.prioridad === 'Urgente' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                    {ordenSeleccionada.prioridad}
                  </Badge>
                </div>
                <div>
                  <span className=\"text-sm text-gray-600\">Estado:</span>
                  <Badge className={`${ESTADO_BADGES[ordenSeleccionada.estado]} border`}>
                    {ordenSeleccionada.estado}
                  </Badge>
                </div>
                <div>
                  <span className=\"text-sm text-gray-600\">Precio Aplicado:</span>
                  <p className=\"font-semibold\">${ordenSeleccionada.precioAplicado?.toLocaleString('es-CO') || '0'}</p>
                </div>
              </div>

              {ordenSeleccionada.examenProcedimiento?.descripcion && (
                <div>
                  <span className=\"text-sm text-gray-600\">Descripción:</span>
                  <p className=\"mt-1 p-3 bg-gray-50 rounded text-sm\">{ordenSeleccionada.examenProcedimiento.descripcion}</p>
                </div>
              )}
              
              {ordenSeleccionada.observaciones && (
                <div>
                  <span className=\"text-sm text-gray-600\">Observaciones:</span>
                  <p className=\"mt-1 p-3 bg-gray-50 rounded text-sm\">{ordenSeleccionada.observaciones}</p>
                </div>
              )}
              
              {ordenSeleccionada.resultados && (
                <div>
                  <span className=\"text-sm font-semibold text-gray-700\">Resultados:</span>
                  <p className=\"mt-1 p-3 bg-green-50 rounded text-sm\">{ordenSeleccionada.resultados}</p>
                </div>
              )}

              {ordenSeleccionada.ejecutadoPor && (
                <div>
                  <span className=\"text-sm text-gray-600\">Ejecutado Por:</span>
                  <p className=\"font-semibold\">
                    {ordenSeleccionada.ejecutador ? `${ordenSeleccionada.ejecutador.nombre} ${ordenSeleccionada.ejecutador.apellido}` : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
